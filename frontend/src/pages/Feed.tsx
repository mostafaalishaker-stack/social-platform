import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../App'
import client from '../api/client'
import { useToast } from '../components/Toast'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'

interface Comment { id: number; username: string; text: string; createdAt: string }
interface Post { id: number; userId: number; username: string; content: string; likes: number; likedBy: number[]; comments: Comment[]; createdAt: string }
interface ChatMsg { id: string; username: string; text: string; timestamp: string }

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5002'

const POSTS_PER_PAGE = 5;

export default function Feed() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [newContent, setNewContent] = useState('')
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [expandedPost, setExpandedPost] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const socketRef = useRef<Socket | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data } = await client.get<Post[]>('/posts')
        setPosts(data)
      } catch (err) {
        console.error('Failed to fetch posts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
    const socket = io(SOCKET_URL)
    socketRef.current = socket

    socket.on('chat:message', (msg: ChatMsg) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('post:created', (post: Post) => {
      setPosts((prev) => [post, ...prev])
    })

    return () => { socket.disconnect() }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createPost = async () => {
    if (!newContent.trim()) return
    try {
      const { data } = await client.post<Post>('/posts', { content: newContent })
      setPosts((prev) => [data, ...prev])
      setNewContent('')
      socketRef.current?.emit('post:created', data)
      showToast('Post created successfully!', 'success')
    } catch (err) {
      showToast('Failed to create post', 'error')
    }
  }

  const handleLike = async (postId: number) => {
    try {
      const { data } = await client.post<{ likes: number; liked: boolean }>(`/posts/${postId}/like`)
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: data.likes, likedBy: data.liked ? [...p.likedBy, user!.id] : p.likedBy.filter((id) => id !== user!.id) } : p))
      showToast(data.liked ? 'Post liked!' : 'Post unliked', 'info')
    } catch (err) {
      showToast('Failed to like post', 'error')
    }
  }

  const addComment = async (postId: number) => {
    if (!commentText.trim()) return
    try {
      const { data } = await client.post<Comment>(`/posts/${postId}/comment`, { text: commentText })
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, data] } : p))
      setCommentText('')
      showToast('Comment added!', 'success')
    } catch (err) {
      showToast('Failed to add comment', 'error')
    }
  }

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMsg.trim() || !user) return
    socketRef.current?.emit('chat:message', { username: user.username, text: chatMsg })
    setChatMsg('')
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString()
  }

  if (loading) {
    return (
      <div style={styles.feedContainer} role="main">
        <div style={styles.mainColumn} role="feed" aria-label="Post feed loading">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.feedContainer} role="main">
      <div style={styles.mainColumn} role="feed" aria-label="Post feed">
        <div style={styles.createCard}>
          <div style={styles.createRow}>
            <div style={styles.avatarSmall} role="img" aria-label={user?.username || 'You'}>{user?.username[0].toUpperCase()}</div>
            <textarea
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={styles.textarea}
              rows={2}
            />
          </div>
          <div style={styles.createActions}>
            <span style={styles.charCount}>{newContent.length}</span>
            <button onClick={createPost} style={styles.postBtn}>Post</button>
          </div>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No posts yet"
            message="Be the first to share something with the community!"
          />
        ) : posts.slice(0, visibleCount).map((post) => {
          const isLiked = post.likedBy.includes(user!.id)
          const isExpanded = expandedPost === post.id

          return (
            <div key={post.id} style={styles.postCard} aria-label={`Post by ${post.username}`}>
              <div style={styles.postHeader}>
                <div style={styles.avatar} role="img" aria-label={`${post.username}'s avatar`}>{post.username[0].toUpperCase()}</div>
                <div>
                  <div style={styles.username}>{post.username}</div>
                  <div style={styles.time}>{formatTime(post.createdAt)}</div>
                </div>
              </div>
              <p style={styles.content}>{post.content}</p>
              <div style={styles.postActions}>
                <button onClick={() => handleLike(post.id)} style={{ ...styles.actionBtn, color: isLiked ? '#f43f5e' : '#94a3b8' }} aria-label={isLiked ? 'Unlike this post' : 'Like this post'}>
                  {isLiked ? '❤️' : '🤍'} {post.likes}
                </button>
                <button onClick={() => setExpandedPost(isExpanded ? null : post.id)} style={styles.actionBtn} aria-label={isExpanded ? 'Close comments' : 'Open comments'}>
                  💬 {post.comments.length}
                </button>
              </div>
              {isExpanded && (
                <div style={styles.commentsSection} role="region" aria-label="Comments">
                  <div style={styles.commentsList}>
                    {post.comments.length === 0 && <p style={styles.noComments}>No comments yet</p>}
                    {post.comments.map((c) => (
                      <div key={c.id} style={styles.commentItem}>
                        <strong style={styles.commentUser}>{c.username}</strong>
                        <span style={styles.commentText}>{c.text}</span>
                        <span style={styles.commentTime}>{formatTime(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.commentForm}>
                    <input
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={styles.commentInput}
                      aria-label="Write a comment"
                    />
                    <button onClick={() => addComment(post.id)} style={styles.commentSubmit} aria-label="Submit comment">Send</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {visibleCount < posts.length && (
          <button
            onClick={() => setVisibleCount(prev => prev + POSTS_PER_PAGE)}
            style={styles.loadMoreBtn}
          >
            Load More ({posts.length - visibleCount} remaining)
          </button>
        )}
      </div>

      <div style={styles.chatPanel} role="complementary" aria-label="Live chat">
        <div style={styles.chatHeader}>Live Chat</div>
        <div style={styles.chatMessages} role="log" aria-live="polite" aria-label="Chat messages">
          {messages.map((m) => (
            <div key={`${m.id}-${m.timestamp}`} style={styles.chatMsg}>
              <strong style={{ color: '#f43f5e' }}>{m.username}:</strong>
              <span style={{ marginLeft: 6 }}>{m.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={sendChat} style={styles.chatForm} role="form" aria-label="Chat message form">
          <input
            placeholder="Type a message..."
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            style={styles.chatInput}
            aria-label="Chat message"
          />
          <button type="submit" style={styles.chatSendBtn} aria-label="Send message">➤</button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  feedContainer: { display: 'flex', gap: 24, padding: '24px', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 73px)' },
  mainColumn: { flex: 1, maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 73px)', color: '#94a3b8', fontSize: 16 },
  createCard: { background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid #2d2d4a' },
  createRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  avatarSmall: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  textarea: { flex: 1, padding: 12, borderRadius: 12, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif" },
  createActions: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12 },
  charCount: { fontSize: 12, color: '#64748b' },
  postBtn: { padding: '8px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  postCard: { background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid #2d2d4a' },
  postHeader: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 },
  username: { fontWeight: 600, fontSize: 15 },
  time: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { fontSize: 15, lineHeight: 1.6, margin: '0 0 14px', color: '#e2e8f0' },
  postActions: { display: 'flex', gap: 16, borderTop: '1px solid #2d2d4a', paddingTop: 12 },
  actionBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8 },
  commentsSection: { borderTop: '1px solid #2d2d4a', marginTop: 12, paddingTop: 12 },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  noComments: { color: '#64748b', fontSize: 13, margin: 0 },
  commentItem: { display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, flexWrap: 'wrap' },
  commentUser: { color: '#f43f5e', fontSize: 12 },
  commentText: { color: '#cbd5e1' },
  commentTime: { color: '#64748b', fontSize: 11, marginLeft: 'auto' },
  commentForm: { display: 'flex', gap: 8 },
  commentInput: { flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  commentSubmit: { padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  chatPanel: { width: 320, background: '#1a1a2e', borderRadius: 16, border: '1px solid #2d2d4a', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 121px)', position: 'sticky', top: 24 },
  chatHeader: { padding: '16px 20px', borderBottom: '1px solid #2d2d4a', fontWeight: 600, fontSize: 15 },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 },
  chatMsg: { lineHeight: 1.5 },
  chatForm: { display: 'flex', padding: '12px 16px', borderTop: '1px solid #2d2d4a', gap: 8 },
  chatInput: { flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#e2e8f0', fontSize: 13, outline: 'none' },
  chatSendBtn: { width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  loadMoreBtn: { width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#ec4899', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all .2s' },
}
