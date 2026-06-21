import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } })

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('chat:message', (data: { username: string; text: string }) => {
    io.emit('chat:message', { ...data, id: socket.id, timestamp: new Date().toISOString() })
  })

  socket.on('post:created', (data: unknown) => {
    socket.broadcast.emit('post:created', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5002
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
