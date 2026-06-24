'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, MapPin, DollarSign, Zap } from 'lucide-react'
import ScoreBar from './ScoreBar'
import type { MatchResult } from '../types'

interface MatchCardProps {
  match: MatchResult
}

const AVAILABILITY_LABEL: Record<string, string> = {
  immediate: 'Available now',
  '2_weeks':  'Available in 2 weeks',
  '1_month':  'Available in 1 month',
}

function compositeColor(score: number): string {
  if (score >= 0.8) return 'var(--green)'
  if (score >= 0.65) return 'var(--yellow)'
  return 'var(--red)'
}

function compositeBackground(score: number): string {
  if (score >= 0.8) return 'var(--green-dim)'
  if (score >= 0.65) return 'var(--yellow-dim)'
  return 'var(--red-dim)'
}

export default function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(match.rank === 1)
  const { developer: dev, scores, rank, match_explanation } = match
  const compositePct = Math.round(scores.composite * 100)
  const color = compositeColor(scores.composite)
  const bgColor = compositeBackground(scores.composite)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${rank === 1 ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Rank */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: rank === 1 ? 'var(--accent)' : 'var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          flexShrink: 0,
          color: rank === 1 ? '#fff' : 'var(--text-secondary)',
        }}>
          {rank}
        </div>

        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {dev.avatar_initials}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>
            {dev.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            {dev.role_title}
          </div>
        </div>

        {/* Composite score badge */}
        <div style={{
          background: bgColor,
          color,
          border: `1px solid ${color}40`,
          borderRadius: 'var(--radius)',
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {compositePct}%
        </div>

        {/* Expand chevron */}
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded
            ? <ChevronUp size={16} />
            : <ChevronDown size={16} />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          {/* Meta row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <MapPin size={12} />
              {dev.location_city}, {dev.location_country}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <DollarSign size={12} />
              ${dev.hourly_rate_usd}/hr
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Clock size={12} />
              {AVAILABILITY_LABEL[dev.availability] ?? dev.availability}
            </span>
            {dev.ai_experience && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: '20px' }}>
                <Zap size={10} />
                AI experience
              </span>
            )}
          </div>

          {/* Stack tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dev.primary_stack.map((tech) => (
              <span key={tech} style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>
                {tech}
              </span>
            ))}
            {dev.secondary_stack.slice(0, 3).map((tech) => (
              <span key={tech} style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>
                {tech}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {dev.bio}
          </p>

          {/* Match explanation */}
          {match_explanation && (
            <div style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)30',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              fontSize: '12px',
              color: 'var(--accent)',
              lineHeight: '1.5',
            }}>
              {match_explanation}
            </div>
          )}

          {/* Score breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score breakdown
            </div>
            <ScoreBar label="Semantic fit"   weight="45%" value={scores.semantic} />
            <ScoreBar label="Stack overlap"  weight="25%" value={scores.stack} />
            <ScoreBar label="Timezone"       weight="15%" value={scores.timezone} />
            <ScoreBar label="Rate"           weight="10%" value={scores.rate} />
            <ScoreBar label="Seniority"      weight="5%"  value={scores.seniority} />
          </div>
        </div>
      )}
    </div>
  )
}