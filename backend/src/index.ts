import express, { Request, Response, NextFunction } from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
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

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const rateLimit = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown'
    const now = Date.now()
    const record = requestCounts.get(ip)
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
      next()
    } else if (record.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests, please try again later' })
    } else {
      record.count++
      next()
    }
  }
}
app.use('/api/', rateLimit(60_000, 60))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

// Global error handler
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
