export default function SkeletonCard() {
  return (
    <div style={styles.card} aria-label="Loading post" role="status">
      <div style={styles.header}>
        <div style={styles.avatar} />
        <div>
          <div style={styles.lineWide} />
          <div style={styles.lineNarrow} />
        </div>
      </div>
      <div style={styles.body}>
        <div style={styles.lineFull} />
        <div style={styles.lineMedium} />
      </div>
      <div style={styles.actions}>
        <div style={styles.actionBtn} />
        <div style={styles.actionBtn} />
      </div>
    </div>
  )
}

const pulse = {
  animation: 'shimmer 1.5s ease-in-out infinite',
  background: 'linear-gradient(90deg, #2d2d4a 25%, #3d3d5c 50%, #2d2d4a 75%)',
  backgroundSize: '200% 100%',
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#1a1a2e', borderRadius: 16, padding: 20, border: '1px solid #2d2d4a' },
  header: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: '50%', ...pulse },
  lineWide: { width: 120, height: 14, borderRadius: 8, marginBottom: 6, ...pulse },
  lineNarrow: { width: 80, height: 10, borderRadius: 8, ...pulse },
  body: { marginBottom: 14 },
  lineFull: { width: '100%', height: 14, borderRadius: 8, marginBottom: 8, ...pulse },
  lineMedium: { width: '65%', height: 14, borderRadius: 8, ...pulse },
  actions: { display: 'flex', gap: 16, borderTop: '1px solid #2d2d4a', paddingTop: 12 },
  actionBtn: { width: 60, height: 16, borderRadius: 8, ...pulse },
}
