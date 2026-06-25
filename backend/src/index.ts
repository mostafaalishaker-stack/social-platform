import express, { Request, Response, NextFunction } from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set')
  process.exit(1)
}

const app = express()
const server = http.createServer(app)

// CORS: restrict origin in production
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_ORIGIN || false
  : '*'
const io = new Server(server, { cors: { origin: corsOrigin, methods: ['GET', 'POST'] } })

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

app.use(helmet())
app.use(cors({ origin: corsOrigin }))
app.use(express.json())

app.use('/api/', apiLimiter)
app.use('/api/auth/', authLimiter)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

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
