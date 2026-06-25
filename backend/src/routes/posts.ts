import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

interface AuthRequest extends Request {
  user?: { id: number; username: string }
}

interface Comment {
  id: number
  username: string
  text: string
  createdAt: string
}

interface Post {
  id: number
  userId: number
  username: string
  content: string
  likes: number
  likedBy: number[]
  comments: Comment[]
  createdAt: string
}

// In-memory post storage (resets on server restart)
const posts: Post[] = []
let nextPostId = 1
let nextCommentId = 1

const JWT_SECRET = process.env.JWT_SECRET || ''

const authMiddleware = (req: AuthRequest, res: Response, next: () => void) => {
  const header = req.headers.authorization
  if (!header) {
    res.status(401).json({ error: 'No token provided' })
    return
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { id: number; username: string }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

router.get('/', (_req: Request, res: Response) => {
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json(sorted)
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { content } = req.body
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'Content is required' })
    return
  }
  const sanitized = content.trim().slice(0, 1000)
  const post: Post = {
    id: nextPostId++,
    userId: req.user!.id,
    username: req.user!.username,
    content: sanitized,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString(),
  }
  posts.push(post)
  res.status(201).json(post)
})

router.post('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }
  const idx = post.likedBy.indexOf(req.user!.id)
  if (idx === -1) {
    post.likedBy.push(req.user!.id)
    post.likes++
  } else {
    post.likedBy.splice(idx, 1)
    post.likes--
  }
  res.json({ likes: post.likes, liked: idx === -1 })
})

router.post('/:id/comment', authMiddleware, (req: AuthRequest, res: Response) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id))
  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }
  const { text } = req.body
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Text is required' })
    return
  }
  const sanitized = text.trim().slice(0, 500)
  const comment: Comment = { id: nextCommentId++, username: req.user!.username, text: sanitized, createdAt: new Date().toISOString() }
  post.comments.push(comment)
  res.status(201).json(comment)
})

export default router
