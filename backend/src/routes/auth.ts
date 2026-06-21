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

const users: User[] = []
let nextId = 1

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields required' })
    return
  }
  if (users.find((u) => u.email === email)) {
    res.status(400).json({ error: 'Email already registered' })
    return
  }
  const hashed = await bcrypt.hash(password, 10)
  const user: User = { id: nextId++, username, email, password: hashed }
  users.push(user)
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = users.find((u) => u.email === email)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

export default router
