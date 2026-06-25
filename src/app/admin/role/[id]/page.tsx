'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'
import AdminMatchCard from '../../../../components/AdminMatchCard'

interface Match {
  id: string
  rank: number
  composite_score: number
  semantic_score: number
  stack_score: number
  timezone_score: number
  rate_score: number
  seniority_score: number
  match_explanation: string | null
  operator_approved: boolean | null
  operator_notes: string | null
  developers: {
    name: string
    avatar_initials: string
    role_title: string
    location_city: string
    location_country: string
    hourly_rate_usd: number
    availability: string
    seniority: string
    years_experience: number
    primary_stack: string[]
    secondary_stack: string[]
    english_level: string
    startup_experience: boolean
    ai_experience: boolean
    bio: string
  }
}

interface Role {
  id: string
  client_name: string
  raw_description: string
  parsed_spec: {
    summary?: string
    required_stack?: string[]
    preferred_stack?: string[]
    seniority_recommendation?: string
    red_flags?: string[]
    reasoning?: string
  }
  budget_max_usd: number | null
  timezone_min_utc: number | null
  timezone_max_utc: number | null
  status: string
  created_at: string
}

export default function RoleReviewPage({ params }: { params: { id: string } }) {
  const router  = useRouter()
  const [role, setRole]       = useState<Role | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') !== '1') {
      router.replace('/admin')
      return
    }

    async function load() {
      const [rolesRes, matchesRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch(`/api/admin/matches?role_id=${params.id}`),
      ])
      const rolesData   = await rolesRes.json()
      const matchesData = await matchesRes.json()

      const found = Array.isArray(rolesData)
        ? rolesData.find((r: Role) => r.id === params.id) ?? null
        : null

      setRole(found)
      setMatches(Array.isArray(matchesData) ? matchesData : [])
      setLoading(false)
    }

    load()
  }, [params.id, router])

  async function handleDecision(
    matchId: string,
    approved: boolean | null,
    notes: string
  ) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, operator_approved: approved, operator_notes: notes }
          : m
      )
    )
    await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, approved, notes }),
    })
  }

  async function handleMarkSent() {
    if (!role) return
    setSaving(true)
    await fetch('/api/admin/matches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role.id, status: 'sent_to_client' }),
    })
    setRole((r) => r ? { ...r, status: 'sent_to_client' } : r)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const approvedCount = matches.filter((m) => m.operator_approved === true).length
  const pendingCount  = matches.filter((m) => m.operator_approved === null).length

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        Loading...
      </div>
    )
  }

  if (!role) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        Role not found.
      </div>
    )
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{role.client_name}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {approvedCount} approved · {pendingCount} pending review
          </span>
        </div>

        <button
          onClick={handleMarkSent}
          disabled={saving || role.status === 'sent_to_client'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: saved ? 'var(--green-dim)' : 'var(--accent)',
            color: saved ? 'var(--green)' : '#fff',
            border: saved ? '1px solid var(--green)40' : 'none',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: saving || role.status === 'sent_to_client' ? 'default' : 'pointer',
            opacity: role.status === 'sent_to_client' ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {saved
            ? <><CheckCircle size={14} /> Marked as sent</>
            : <><Send size={14} /> Mark as sent to client</>
          }
        </button>
      </header>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '20px',
        alignItems: 'start',
      }}>
        {/* Left — match cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px',
          }}>
            Matched candidates ({matches.length})
          </div>
          {matches.length === 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}>
              No candidates matched for this role.
            </div>
          )}
          {matches.map((match) => (
            <AdminMatchCard
              key={match.id}
              match={match}
              onDecision={handleDecision}
            />
          ))}
        </div>

        {/* Right — role details sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '68px' }}>
          {/* Requirement */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Requirement
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {role.raw_description}
            </p>
            {role.budget_max_usd && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Budget: <span style={{ color: 'var(--text-primary)' }}>${role.budget_max_usd}/hr max</span>
              </div>
            )}
            {(role.timezone_min_utc != null && role.timezone_max_utc != null) && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Timezone: <span style={{ color: 'var(--text-primary)' }}>UTC{role.timezone_min_utc} to UTC{role.timezone_max_utc}</span>
              </div>
            )}
          </div>

          {/* Parsed spec */}
          {role.parsed_spec && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI-parsed spec
              </div>
              {role.parsed_spec.summary && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {role.parsed_spec.summary}
                </p>
              )}
              {(role.parsed_spec.required_stack ?? []).length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Required</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {role.parsed_spec.required_stack!.map((t) => (
                      <span key={t} style={{
                        fontSize: '11px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'var(--green-dim)',
                        border: '1px solid var(--green)30',
                        color: 'var(--green)',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {(role.parsed_spec.red_flags ?? []).length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>Watch for</div>
                  <ul style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {role.parsed_spec.red_flags!.map((f) => (
                      <li key={f} style={{ fontSize: '11px', color: 'var(--red)' }}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}