import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io'
import http from 'http'
import pty from 'node-pty';
import os from 'os';

const WORKING_DIR = '/workspace'


const app = express();
const httpServer = http.createServer(app)
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS — allow cross-origin requests from the frontend (browser enforces this, Postman doesn't)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
})


const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
    }
})

app.get('/', (req, res) => {
    res.send('Hello from the agent!');
})


const shell = process.env.SHELL || 'bash';
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: "/workspace",
    env: process.env
});

ptyProcess.onData((data) => {
    io.emit('terminal-output', data);
});

ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`PTY process exited with code: ${exitCode}, signal: ${signal}`);
});

io.on('connection', (socket) => {
    console.log('client id' + socket.id)
    socket.on("terminal-input", (data) => {
        ptyProcess.write(data);
    });
    socket.on("disconnect", () => {
        console.log('client disconnected'+ socket.id)
    })
})



app.get("/list-files", async (req, res) => {

    const listFiles = async (dir, baseDir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, fullPath);

            // Exclude certain directories
            if (entry.isDirectory() && ['node_modules', '.git', 'dist'].includes(entry.name)) {
                continue;
            }

            if (entry.isDirectory()) {
                files.push(...await listFiles(fullPath, baseDir));
            } else {
                files.push(relativePath);
            }
        }

        return files;
    }

    try {
        const files = await listFiles(WORKING_DIR, WORKING_DIR);
        res.status(200).json({
            message: 'Files listed successfully',
            files,
        });
    } catch (err) {
        res.status(500).json({
            message: `Error listing files: ${err.message}`,
            status: 'error',
        });
    }

})
app.get('/read-files', async (req, res) => {

    const files = req.query.files;

    if (!files) {
        return res.status(400).json({
            error: 'Files are required'
        });
    }

    const fileList = files.split(',');

    try {

        const results = await Promise.all(

            fileList.map(async (file) => {

                const filepath = `${WORKING_DIR}/${file}`;

                try {

                    const content = await fs.promises.readFile(
                        filepath,
                        'utf-8'
                    );

                    return {
                        [file]: content
                    };

                } catch (error) {

                    return {
                        [file]: `Error reading file: ${error.message}`
                    };
                }
            })
        );

        res.status(200).json({
            message: 'File contents',
            files: results
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});
app.patch("/update-files", async (req, res) => {
    console.log(req.body.updates)
    const updates = req.body.updates;

    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
            message: 'Invalid request body. Expected a JSON object with an "updates" property containing an array of file updates.',
            status: 'error',
        });
    }

    const results = await Promise.all(updates.map(async (update) => {
        const { file, content } = update;
        const filePath = path.join(WORKING_DIR, file);
        try {

            console.log(path.dirname(filePath), filePath);

            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return {
                [filePath]: 'File updated successfully',
            }
        } catch (err) {
            return {
                [filePath]: `Error updating file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File update results',
        results,
    });
})
app.post("/create-files", async (req, res) => {
    const files = req.body.files;
    console.log(files)
    if (!files || !Array.isArray(files)) {
        return res.status(400).json({
            message: 'Invalid request body. Expected a JSON object with a "files" property containing an array of file objects.',
            status: 'error',
        });
    }

    const results = await Promise.all(files.map(async (fileObj) => {
        const { file, content } = fileObj;
        const filePath = path.join(WORKING_DIR, file);
        try {

            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return {
                [filePath]: 'File created successfully',
            }
        } catch (err) {
            return {
                [filePath]: `Error creating file: ${err.message}`,
            }
        }
    }));

    res.status(200).json({
        message: 'File creation results',
        results,
    });
})

export default httpServer;