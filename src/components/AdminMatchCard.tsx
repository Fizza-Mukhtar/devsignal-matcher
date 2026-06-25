'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp, MapPin, DollarSign, Clock } from 'lucide-react'
import ScoreBar from './ScoreBar'

interface AdminMatchCardProps {
  match: {
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
  onDecision: (matchId: string, approved: boolean | null, notes: string) => Promise<void>
}

const AVAILABILITY_LABEL: Record<string, string> = {
  immediate: 'Available now',
  '2_weeks': 'Available in 2 weeks',
  '1_month': 'Available in 1 month',
}

export default function AdminMatchCard({ match, onDecision }: AdminMatchCardProps) {
  const [expanded, setExpanded] = useState(match.rank === 1)
  const [notes, setNotes]       = useState(match.operator_notes ?? '')
  const [saving, setSaving]     = useState(false)
  const dev = match.developers
  const pct = Math.round(match.composite_score * 100)

  const approved  = match.operator_approved === true
  const rejected  = match.operator_approved === false
  const pending   = match.operator_approved === null

  async function decide(value: boolean | null) {
    setSaving(true)
    await onDecision(match.id, value, notes)
    setSaving(false)
  }

  function borderColor() {
    if (approved) return 'var(--green)'
    if (rejected) return 'var(--red)'
    return 'var(--border)'
  }

  function scoreColor(v: number) {
    if (v >= 0.8) return 'var(--green)'
    if (v >= 0.6) return 'var(--yellow)'
    return 'var(--red)'
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${borderColor()}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      opacity: rejected ? 0.5 : 1,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
      }}>
        {/* Rank */}
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: match.rank === 1 ? 'var(--accent)' : 'var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          flexShrink: 0,
          color: match.rank === 1 ? '#fff' : 'var(--text-secondary)',
        }}>
          {match.rank}
        </div>

        {/* Avatar */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)40',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {dev.avatar_initials}
        </div>

        {/* Name + role */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ fontWeight: 500, fontSize: '14px' }}>{dev.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{dev.role_title}</div>
        </div>

        {/* Score */}
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: scoreColor(match.composite_score),
          flexShrink: 0,
          minWidth: '36px',
          textAlign: 'right',
        }}>
          {pct}%
        </div>

        {/* Approve / Reject buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => decide(approved ? null : true)}
            disabled={saving}
            title="Approve candidate"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${approved ? 'var(--green)' : 'var(--border)'}`,
              background: approved ? 'var(--green-dim)' : 'transparent',
              color: approved ? 'var(--green)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => decide(rejected ? null : false)}
            disabled={saving}
            title="Reject candidate"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${rejected ? 'var(--red)' : 'var(--border)'}`,
              background: rejected ? 'var(--red-dim)' : 'transparent',
              color: rejected ? 'var(--red)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <MapPin size={11} /> {dev.location_city}, {dev.location_country}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <DollarSign size={11} /> ${dev.hourly_rate_usd}/hr
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Clock size={11} /> {AVAILABILITY_LABEL[dev.availability] ?? dev.availability}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {dev.years_experience}y exp · {dev.english_level} English
            </span>
          </div>

          {/* Stack */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {dev.primary_stack.map((t) => (
              <span key={t} style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>{t}</span>
            ))}
            {dev.secondary_stack.slice(0, 3).map((t) => (
              <span key={t} style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>{t}</span>
            ))}
          </div>

          {/* Bio */}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {dev.bio}
          </p>

          {/* Match explanation */}
          {match.match_explanation && (
            <div style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)30',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              fontSize: '12px',
              color: 'var(--accent)',
            }}>
              {match.match_explanation}
            </div>
          )}

          {/* Score breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score breakdown
            </div>
            <ScoreBar label="Semantic fit"  weight="45%" value={match.semantic_score} />
            <ScoreBar label="Stack overlap" weight="25%" value={match.stack_score} />
            <ScoreBar label="Timezone"      weight="15%" value={match.timezone_score} />
            <ScoreBar label="Rate"          weight="10%" value={match.rate_score} />
            <ScoreBar label="Seniority"     weight="5%"  value={match.seniority_score} />
          </div>

          {/* Operator notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operator notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => decide(match.operator_approved)}
              placeholder="Add internal notes about this candidate..."
              rows={2}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.5',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            />
          </div>

          {/* Status indicator */}
          {!pending && (
            <div style={{
              fontSize: '12px',
              color: approved ? 'var(--green)' : 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              {approved ? <Check size={12} /> : <X size={12} />}
              {approved ? 'Approved for client' : 'Rejected'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}