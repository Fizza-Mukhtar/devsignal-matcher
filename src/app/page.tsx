'use client'

import { useState } from 'react'
import { Search, Loader2, SlidersHorizontal } from 'lucide-react'
import MatchCard from '../components/MatchCard'
import SpecPanel from '../components/SpecPanel'
import type { MatchResponse, MatchRequest } from '../types'

const EXAMPLE_QUERIES = [
  {
    label: 'AI legal startup',
    description: 'We are building an AI-powered legal document review tool. Series A startup, 6-person team. Need a senior full-stack engineer with React and Node.js who has worked at startups before. LatAm timezone preferred.',
    budget: 65,
  },
  {
    label: 'ML engineer',
    description: 'Early-stage AI company building LLM-powered tools for enterprises. Need a machine learning engineer with Python and PyTorch experience in production systems. RAG or fine-tuning experience is a strong plus.',
    budget: 80,
  },
  {
    label: 'Mobile app hire',
    description: 'Bootstrapped startup with a growing consumer mobile app. Need our first mobile engineer with React Native or iOS Swift experience. Must be able to work independently without existing mobile infrastructure.',
    budget: 60,
  },
]

export default function Home() {
  const [description, setDescription]   = useState('')
  const [clientName, setClientName]     = useState('')
  const [budgetMax, setBudgetMax]       = useState<string>('')
  const [tzMin, setTzMin]               = useState<string>('-6')
  const [tzMax, setTzMax]               = useState<string>('-3')
  const [showFilters, setShowFilters]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<MatchResponse | null>(null)
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit() {
    if (!description.trim() || description.trim().length < 20) {
      setError('Please describe the role in at least 20 characters.')
      return
    }
    if (!clientName.trim()) {
      setError('Please enter a company name.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const payload: MatchRequest = {
      raw_description: description.trim(),
      client_name: clientName.trim(),
      budget_max_usd: budgetMax ? parseInt(budgetMax) : undefined,
      timezone_min_utc: tzMin ? parseInt(tzMin) : undefined,
      timezone_max_utc: tzMax ? parseInt(tzMax) : undefined,
    }

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      setResult(data as MatchResponse)
    } catch {
      setError('Failed to reach the server. Make sure the dev server is running.')
    } finally {
      setLoading(false)
    }
  }

  function loadExample(ex: typeof EXAMPLE_QUERIES[0]) {
    setDescription(ex.description)
    setBudgetMax(String(ex.budget))
    setClientName('Example Corp')
    setResult(null)
    setError(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'var(--accent)',
            borderRadius: '6px',
          }} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>DevSignal</span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)30',
          }}>
            Matcher
          </span>
        </div>
        {result && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {result.matched_count} candidates matched from pool of {result.total_pool_size}
          </span>
        )}
      </header>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: '0',
        height: 'calc(100vh - 52px)',
      }}>
        {/* Left panel — intake form */}
        <aside style={{
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* Section label */}
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              New requirement
            </div>

            {/* Company name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Company name</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme AI Inc."
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                What are you building and who do you need?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product, team size, required skills, and any preferences. The more detail, the better the match."
                rows={8}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: '1.6',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                padding: 0,
              }}
            >
              <SlidersHorizontal size={13} />
              {showFilters ? 'Hide filters' : 'Add filters'}
            </button>

            {/* Filters */}
            {showFilters && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Max budget ($/hr)</label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="e.g. 65"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>UTC offset min</label>
                    <input
                      type="number"
                      value={tzMin}
                      onChange={(e) => setTzMin(e.target.value)}
                      placeholder="-6"
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '7px 10px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>UTC offset max</label>
                    <input
                      type="number"
                      value={tzMax}
                      onChange={(e) => setTzMax(e.target.value)}
                      placeholder="-3"
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '7px 10px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Example queries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Try an example</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {EXAMPLE_QUERIES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => loadExample(ex)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--red-dim)',
                border: '1px solid var(--red)40',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
                fontSize: '12px',
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Submit button — sticky at bottom */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg)',
          }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Matching...</>
                : <><Search size={15} /> Find candidates</>
              }
            </button>
          </div>
        </aside>

        {/* Right panel — results */}
        <main style={{
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Empty state */}
          {!result && !loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
              color: 'var(--text-muted)',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Search size={20} style={{ opacity: 0.4 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>No results yet</div>
                <div style={{ fontSize: '12px' }}>Describe a role on the left and run the matcher</div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
              color: 'var(--text-muted)',
            }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              <div style={{ fontSize: '13px' }}>Parsing requirement and ranking candidates...</div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              <SpecPanel
                spec={result.parsed_spec}
                totalPool={result.total_pool_size}
                matchCount={result.matched_count}
              />
              <div style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '4px',
              }}>
                Ranked candidates
              </div>
              {result.matches.length === 0
                ? (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}>
                    No candidates matched the given filters. Try relaxing the budget or timezone range.
                  </div>
                )
                : result.matches.map((match) => (
                  <MatchCard key={match.developer.id} match={match} />
                ))
              }
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}