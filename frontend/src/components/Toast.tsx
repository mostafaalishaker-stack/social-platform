import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>(undefined as unknown as ToastContextType)

export const useToast = () => useContext(ToastContext)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container} role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ ...styles.toast, ...styles[t.type] }}
            role="alert"
            onClick={() => removeToast(t.id)}
          >
            <span>{t.message}</span>
            <button style={styles.closeBtn} aria-label="Dismiss">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380,
  },
  toast: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out',
  },
  success: { background: '#065f46', color: '#d1fae5', border: '1px solid #059669' },
  error: { background: '#7f1d1d', color: '#fecaca', border: '1px solid #dc2626' },
  info: { background: '#1e3a5f', color: '#bfdbfe', border: '1px solid #3b82f6' },
  closeBtn: {
    background: 'none', border: 'none', color: 'inherit', fontSize: 20,
    cursor: 'pointer', marginLeft: 12, opacity: 0.7, lineHeight: 1,
  },
}
