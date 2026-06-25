import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import Login from './pages/Login'
import Feed from './pages/Feed'
import { ToastProvider } from './components/Toast'

interface User { id: number; username: string; email: string }

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(undefined as unknown as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // NOTE: Tokens stored in localStorage for demo simplicity.
  // For production, use httpOnly cookies to prevent XSS attacks.
  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
  }, [])

  const login = (t: string, u: User) => {
    // Storing in localStorage (httpOnly cookies recommended for production)
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <ToastProvider>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={styles.logo}>Social</span>
            {user && <button onClick={logout} style={styles.logoutBtn}>Logout</button>}
          </div>
          {user ? <Feed /> : <Login />}
        </div>
      </ToastProvider>
    </AuthContext.Provider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#0f0f1a', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1e293b' },
  logo: { fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #ec4899, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoutBtn: { padding: '8px 20px', background: 'transparent', border: '1px solid #475569', borderRadius: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: 14 },
}
