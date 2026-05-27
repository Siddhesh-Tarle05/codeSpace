import { Router } from 'express'
import agent from '../agents/code.agent.js';

const agentRouter = Router();

// agentRouter.post('/invoke', async (req, res) => {
//     console.log(req.body)
//     const { message, projectId } = req.body
//     res.writeHead(200, {
//         'Content-Type': 'text/event-stream',
//          'Cache-Control': 'no-cache',
//          'Connection': "keep-alive"
//     })
//     const response = await agent.stream(
//         {
//             messages: [{
//                 role: 'user',
//                 content: message
//             }]
//         },
//         {
//             context: {
//                 projectId
//             },
//             streamMode: 'custom'
//         }
//     )
//     for await (const chunk of response) {
//         res.write(chunk)
//     }
//     res.json({ response })

// })
agentRouter.post('/invoke', async (req, res) => {
    console.log(req.body)

    const { message, projectId } = req.body

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })

    const response = await agent.stream(
        {
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        },
        {
            context: {
                projectId,
                writer: (data) => {
                    res.write(`data: ${data}\n\n`)
                }
            },
            streamMode: 'custom'
        }
    )

    for await (const chunk of response) {
        res.write(`data: ${chunk}\n\n`)
    }

    res.end()
})
export default agentRouter