import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()

interface User {
  id: number
  username: string
  email: string
  password: string
}

// In-memory user storage (resets on server restart)
const users: User[] = []
let nextId = 1

const JWT_SECRET = process.env.JWT_SECRET || ''

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidEmail = (e: string) => EMAIL_RE.test(e)

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  if (!username || typeof username !== 'string' || username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' })
    return
  }
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }
  if (users.find((u) => u.email === email)) {
    res.status(400).json({ error: 'Email already registered' })
    return
  }
  if (users.find((u) => u.username === username)) {
    res.status(400).json({ error: 'Username already taken' })
    return
  }
  const hashed = await bcrypt.hash(password, 10)
  const user: User = { id: nextId++, username, email, password: hashed }
  users.push(user)
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }
  const user = users.find((u) => u.email === email)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

export default router
