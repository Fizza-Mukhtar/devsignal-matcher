'use client'

interface ScoreBarProps {
  label: string
  value: number
  weight: string
}

function getColor(value: number): string {
  if (value >= 0.8) return 'var(--green)'
  if (value >= 0.6) return 'var(--yellow)'
  return 'var(--red)'
}

export default function ScoreBar({ label, value, weight }: ScoreBarProps) {
  const pct = Math.round(value * 100)
  const color = getColor(value)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {label}
          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{weight}</span>
        </span>
        <span style={{ fontSize: '11px', fontWeight: 500, color }}>{pct}%</span>
      </div>
      <div style={{
        height: '3px',
        background: 'var(--border)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}