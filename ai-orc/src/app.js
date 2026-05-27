import express from 'express'
import morgan from 'morgan'
import agentRouter from './routes/agent.routes.js'
const app=express()
app.use(morgan('dev'))
app.use(express.json())
app.use('/api/ai/agent/',agentRouter)
app.get('/api/ai/health',(req,res)=>{
    res.status(200).json({status:'AI-ORC is healthy'})
})
export default app;