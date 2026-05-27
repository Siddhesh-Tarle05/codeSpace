import express from 'express';
import {v7 as uuid} from 'uuid';
import { createPod } from './kubernetes/pod.js';
import { createService } from './kubernetes/service.js';
const app = express();

app.get('/api/sandbox/health',(req,res)=>{
    res.status(200).json({status:'ok'});
})
app.post('/api/sandbox/start',async (req,res)=>{
   const sandboxId = uuid();
   await Promise.all([
    createPod(sandboxId),
    createService(sandboxId)
   ])
   res.status(200).json({
    message:'Sandbox started successfully',
     sandboxId,
     previewUrl: `http://${sandboxId}.preview.localhost`
    });
    
})
export default app;