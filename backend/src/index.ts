import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRouter from './routes/auth'
import tasksRouter from './routes/tasks'
import categoriesRouter from './routes/categories'
import tagsRouter from './routes/tags'
import dashboardRouter from './routes/dashboard'

const app = express()
const PORT = process.env.PORT || 3333

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/tasks', tasksRouter)
app.use('/categories', categoriesRouter)
app.use('/tags', tagsRouter)
app.use('/dashboard', dashboardRouter)

app.get('/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
})
