'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, Circle, ArrowRight } from 'lucide-react'

interface Role {
  id: string
  client_name: string
  raw_description: string
  parsed_spec: {
    summary?: string
    required_stack?: string[]
    seniority_recommendation?: string
  }
  budget_max_usd: number | null
  status: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:        { label: 'Pending',        color: 'var(--text-muted)', icon: <Circle size={12} /> },
  matched:        { label: 'Matched',        color: 'var(--yellow)',     icon: <Clock size={12} /> },
  sent_to_client: { label: 'Sent to client', color: 'var(--accent)',     icon: <ArrowRight size={12} /> },
  filled:         { label: 'Filled',         color: 'var(--green)',      icon: <CheckCircle size={12} /> },
  closed:         { label: 'Closed',         color: 'var(--text-muted)', icon: <XCircle size={12} /> },
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function AdminDashboard() {
  const router = useRouter()

  const [authed,   setAuthed]   = useState(false)
  const [password, setPassword] = useState('')
  const [pwError,  setPwError]  = useState(false)
  const [roles,    setRoles]    = useState<Role[]>([])
  const [loading,  setLoading]  = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/roles')
      const data = await res.json()
      setRoles(Array.isArray(data) ? data : [])
    } catch {
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount — check if already authed from a previous login this session
  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === '1') {
      setAuthed(true)
    }
  }, [])

  // Fetch roles whenever authed becomes true
  useEffect(() => {
    if (authed) fetchRoles()
  }, [authed, fetchRoles])

  function handleLogin() {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'devsignal2024'
    if (password === correct) {
      sessionStorage.setItem('admin_authed', '1')
      setAuthed(true)
    } else {
      setPwError(true)
    }
  }

  // Login gate
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: '320px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>Admin access</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>DevSignal internal operator panel</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              autoFocus
              style={{
                background: 'var(--bg-input)',
                border: `1px solid ${pwError ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '9px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {pwError && (
              <span style={{ fontSize: '12px', color: 'var(--red)' }}>Incorrect password</span>
            )}
          </div>
          <button
            onClick={handleLogin}
            style={{
              padding: '9px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  const statusCounts = roles.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '6px' }} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>DevSignal</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--red-dim)',
            color: 'var(--red)',
            border: '1px solid var(--red)30',
          }}>
            Operator panel
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={fetchRoles}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '5px 12px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '5px 12px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Back to matcher
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Total roles',     value: roles.length,                       color: 'var(--text-primary)' },
            { label: 'Awaiting review', value: statusCounts['matched'] ?? 0,        color: 'var(--yellow)' },
            { label: 'Sent to client',  value: statusCounts['sent_to_client'] ?? 0, color: 'var(--accent)' },
            { label: 'Filled',          value: statusCounts['filled'] ?? 0,         color: 'var(--green)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 600, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Roles list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
          }}>
            All requirements
          </div>

          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading...
            </div>
          )}

          {!loading && roles.length === 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}>
              No requirements found.
            </div>
          )}

          {roles.map((role) => {
            const statusCfg = STATUS_CONFIG[role.status] ?? STATUS_CONFIG.pending
            const stack     = role.parsed_spec?.required_stack ?? []

            return (
              <div
                key={role.id}
                onClick={() => router.push(`/admin/role/${role.id}`)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                onMouseOut={(e)  => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Client initial */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent)30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  {role.client_name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '3px' }}>
                    {role.client_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {role.parsed_spec?.summary ?? role.raw_description.slice(0, 80)}
                  </div>
                </div>

                {/* Stack tags */}
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  {stack.slice(0, 3).map((t: string) => (
                    <span key={t} style={{
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>{t}</span>
                  ))}
                </div>

                {/* Budget */}
                {role.budget_max_usd && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    ${role.budget_max_usd}/hr
                  </div>
                )}

                {/* Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: statusCfg.color,
                  flexShrink: 0,
                  minWidth: '110px',
                }}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </div>

                {/* Time */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {timeAgo(role.created_at)}
                </div>

                <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
