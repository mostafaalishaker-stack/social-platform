import { useState } from 'react'
import { useAuth } from '../App'
import client from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const body = isRegister ? { username, email, password } : { email, password }
      const { data } = await client.post(endpoint, body)
      login(data.token, data.user)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Something went wrong'
      setError(msg)
    }
  }

  return (
    <div style={styles.wrapper} role="main">
      <div style={styles.card} role="form" aria-label={isRegister ? 'Registration form' : 'Login form'}>
        <h2 style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <>
              <label htmlFor="username-input" style={styles.label}>Username</label>
              <input
                id="username-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </>
          )}
          <label htmlFor="email-input" style={styles.label}>Email</label>
          <input
            id="email-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <label htmlFor="password-input" style={styles.label}>Password</label>
          <input
            id="password-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <p style={styles.error} role="alert">{error}</p>}
          <button type="submit" style={styles.btn}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p style={styles.toggle}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span onClick={() => { setIsRegister(!isRegister); setError('') }} style={styles.link} role="button" tabIndex={0}>
            {isRegister ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 73px)' },
  card: { background: '#1a1a2e', padding: 40, borderRadius: 16, width: 380, border: '1px solid #2d2d4a' },
  title: { margin: '0 0 24px', fontSize: 22, fontWeight: 600, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { padding: '12px 16px', borderRadius: 10, border: '1px solid #2d2d4a', background: '#0f0f1a', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  btn: { padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  error: { color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' },
  toggle: { marginTop: 20, fontSize: 13, textAlign: 'center', color: '#94a3b8' },
  link: { color: '#f43f5e', cursor: 'pointer', fontWeight: 600 },
  label: { fontSize: 13, fontWeight: 500, color: '#94a3b8' },
}
