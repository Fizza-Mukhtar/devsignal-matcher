'use client'

import { AlertTriangle } from 'lucide-react'
import type { ParsedSpec } from '../types'

interface SpecPanelProps {
  spec: ParsedSpec
  totalPool: number
  matchCount: number
}

const SENIORITY_COLOR: Record<string, string> = {
  junior:    'var(--yellow)',
  mid:       'var(--yellow)',
  senior:    'var(--green)',
  staff:     'var(--accent)',
  principal: 'var(--accent)',
}

export default function SpecPanel({ spec, totalPool, matchCount }: SpecPanelProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            AI-Parsed Spec
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            {spec.summary}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
          <span style={{
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: `${SENIORITY_COLOR[spec.seniority_recommendation] ?? 'var(--accent)'}20`,
            color: SENIORITY_COLOR[spec.seniority_recommendation] ?? 'var(--accent)',
            border: `1px solid ${SENIORITY_COLOR[spec.seniority_recommendation] ?? 'var(--accent)'}40`,
          }}>
            {spec.seniority_recommendation}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}>
            {matchCount} of {totalPool} matched
          </span>
        </div>
      </div>

      {/* Stacks */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Required</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {spec.required_stack.length > 0
              ? spec.required_stack.map((t) => (
                  <span key={t} style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--green-dim)',
                    border: '1px solid var(--green)40',
                    color: 'var(--green)',
                  }}>
                    {t}
                  </span>
                ))
              : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None specified</span>
            }
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Preferred</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {spec.preferred_stack.length > 0
              ? spec.preferred_stack.map((t) => (
                  <span key={t} style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}>
                    {t}
                  </span>
                ))
              : <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None specified</span>
            }
          </div>
        </div>
      </div>

      {/* Red flags */}
      {spec.red_flags.length > 0 && (
        <div style={{
          background: 'var(--red-dim)',
          border: '1px solid var(--red)30',
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 500, color: 'var(--red)' }}>
            <AlertTriangle size={12} />
            Watch for in candidates
          </div>
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {spec.red_flags.map((flag) => (
              <li key={flag} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasoning */}
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
        {spec.reasoning}
      </p>
    </div>
  )
}