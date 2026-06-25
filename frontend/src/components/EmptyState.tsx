interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = '📭', title, message, action }: EmptyStateProps) {
  return (
    <div style={styles.wrapper} role="status">
      <div style={styles.icon}>{icon}</div>
      <h3 style={styles.title}>{title}</h3>
      {message && <p style={styles.message}>{message}</p>}
      {action && (
        <button onClick={action.onClick} style={styles.btn}>
          {action.label}
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', textAlign: 'center', background: '#1a1a2e', borderRadius: 16,
    border: '1px solid #2d2d4a',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' },
  message: { fontSize: 14, color: '#64748b', margin: 0, maxWidth: 320 },
  btn: {
    marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ec4899, #f43f5e)', color: '#fff',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
}
