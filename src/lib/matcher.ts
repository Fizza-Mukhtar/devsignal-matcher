import { createClient } from '@supabase/supabase-js'
import { embed, buildDeveloperEmbedText, buildRoleEmbedText } from './embeddings'
import { parseRequirement, generateMatchExplanation, type ParsedSpec } from './groq'
import type { DeveloperSearchResult, MatchResult, MatchRequest } from '../types'

// Score weights — must sum to 1.0
const WEIGHTS = {
  semantic:  0.45,
  stack:     0.25,
  timezone:  0.15,
  rate:      0.10,
  seniority: 0.05,
} as const

const SENIORITY_RANK: Record<string, number> = {
  junior:    1,
  mid:       2,
  senior:    3,
  staff:     4,
  principal: 5,
}

// ---------------------------------------------------------------------------
// Individual scoring functions — all return 0.0 to 1.0
// ---------------------------------------------------------------------------

function scoreStack(
  developerStack: string[],
  requiredStack: string[],
  preferredStack: string[]
): number {
  if (requiredStack.length === 0 && preferredStack.length === 0) return 0.5

  const devStackLower = developerStack.map((s) => s.toLowerCase())

  const requiredMatches = requiredStack.filter((tech) =>
    devStackLower.some((ds) => ds.includes(tech.toLowerCase()) || tech.toLowerCase().includes(ds))
  ).length

  const preferredMatches = preferredStack.filter((tech) =>
    devStackLower.some((ds) => ds.includes(tech.toLowerCase()) || tech.toLowerCase().includes(ds))
  ).length

  const requiredScore =
    requiredStack.length > 0 ? requiredMatches / requiredStack.length : 1.0

  const preferredScore =
    preferredStack.length > 0 ? preferredMatches / preferredStack.length : 0.0

  // Required stack carries 80% of stack score, preferred carries 20%
  return requiredScore * 0.8 + preferredScore * 0.2
}

function scoreTimezone(
  devUtcOffset: number,
  clientUtcMin: number,
  clientUtcMax: number
): number {
  if (devUtcOffset >= clientUtcMin && devUtcOffset <= clientUtcMax) return 1.0

  const distanceFromMin = Math.abs(devUtcOffset - clientUtcMin)
  const distanceFromMax = Math.abs(devUtcOffset - clientUtcMax)
  const distance = Math.min(distanceFromMin, distanceFromMax)

  // Each hour outside the window reduces score by 0.15, floored at 0
  return Math.max(0, 1.0 - distance * 0.15)
}

function scoreRate(devRate: number, budgetMax: number | undefined): number {
  if (!budgetMax) return 0.7

  if (devRate <= budgetMax) {
    // Within budget — bonus for being well under budget (leaves room to negotiate)
    const headroom = (budgetMax - devRate) / budgetMax
    return Math.min(1.0, 0.8 + headroom * 0.2)
  }

  // Over budget — penalize proportionally
  const overage = (devRate - budgetMax) / budgetMax
  return Math.max(0, 1.0 - overage * 2)
}

function scoreSeniority(
  devSeniority: string,
  requiredSeniority: string
): number {
  const devRank = SENIORITY_RANK[devSeniority] ?? 2
  const reqRank = SENIORITY_RANK[requiredSeniority] ?? 2
  const diff = Math.abs(devRank - reqRank)

  if (diff === 0) return 1.0
  if (diff === 1) return 0.7
  if (diff === 2) return 0.3
  return 0.0
}

function computeComposite(scores: {
  semantic: number
  stack: number
  timezone: number
  rate: number
  seniority: number
}): number {
  return (
    scores.semantic  * WEIGHTS.semantic  +
    scores.stack     * WEIGHTS.stack     +
    scores.timezone  * WEIGHTS.timezone  +
    scores.rate      * WEIGHTS.rate      +
    scores.seniority * WEIGHTS.seniority
  )
}

function buildTopReasons(
  dev: DeveloperSearchResult,
  scores: MatchResult['scores'],
  requiredStack: string[]
): string[] {
  const reasons: string[] = []

  if (scores.semantic > 0.75) {
    reasons.push('strong semantic alignment with role description')
  }
  if (scores.stack > 0.8) {
    const matched = requiredStack
      .filter((t) =>
        dev.primary_stack.some(
          (ds) => ds.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(ds.toLowerCase())
        )
      )
      .slice(0, 2)
    if (matched.length > 0) reasons.push(`exact stack match on ${matched.join(' and ')}`)
  }
  if (scores.timezone === 1.0) reasons.push('ideal timezone overlap')
  if (scores.rate > 0.9) reasons.push('comfortably within budget')
  if (dev.startup_experience) reasons.push('proven startup experience')
  if (dev.ai_experience) reasons.push('AI product experience')

  return reasons.slice(0, 3)
}

// ---------------------------------------------------------------------------
// Main matching function
// ---------------------------------------------------------------------------

export async function runMatch(
  request: MatchRequest,
  supabaseServiceKey: string,
  supabaseUrl: string
): Promise<{
  matches: MatchResult[]
  parsedSpec: ParsedSpec
  totalPoolSize: number
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Step 1: Parse the raw requirement with Groq
  const parsedSpec = await parseRequirement(request.raw_description)

  // Step 2: Build combined embed text using both raw description and parsed spec
  const embedText = buildRoleEmbedText(
    `${request.raw_description} Required skills: ${parsedSpec.required_stack.join(', ')}. ` +
    `Preferred: ${parsedSpec.preferred_stack.join(', ')}.`
  )

  // Step 3: Embed the requirement
  const queryEmbedding = await embed(embedText)

  // Step 4: Get total pool size
  const { count: totalPoolSize } = await supabase
    .from('developers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Step 5: Vector search — pull top 20 candidates before re-ranking
  const seniorityFilter = buildSeniorityFilter(
    request.seniority_min ?? parsedSpec.seniority_recommendation
  )

  const { data: candidates, error } = await supabase.rpc('match_developers', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    budget_max: request.budget_max_usd ?? 999,
    utc_offset_min: request.timezone_min_utc ?? -12,
    utc_offset_max: request.timezone_max_utc ?? 12,
    required_seniority: seniorityFilter,
    match_count: 20,
  })

  if (error) throw new Error(`Vector search failed: ${error.message}`)
  if (!candidates || candidates.length === 0) {
    return { matches: [], parsedSpec, totalPoolSize: totalPoolSize ?? 0 }
  }

  // Step 6: Score each candidate across all dimensions
  const scoredCandidates: MatchResult[] = candidates.map((dev: DeveloperSearchResult) => {
    const scores = {
      semantic:  dev.semantic_score,
      stack:     scoreStack(
                   [...dev.primary_stack, ...dev.secondary_stack],
                   parsedSpec.required_stack,
                   parsedSpec.preferred_stack
                 ),
      timezone:  scoreTimezone(
                   dev.utc_offset,
                   request.timezone_min_utc ?? -12,
                   request.timezone_max_utc ?? 12
                 ),
      rate:      scoreRate(dev.hourly_rate_usd, request.budget_max_usd),
      seniority: scoreSeniority(
                   dev.seniority,
                   request.seniority_min ?? parsedSpec.seniority_recommendation
                 ),
      composite: 0,
    }
    scores.composite = computeComposite(scores)

    return { developer: dev, scores, rank: 0 }
  })

  // Step 7: Sort by composite score descending and assign ranks
  scoredCandidates.sort((a, b) => b.scores.composite - a.scores.composite)
  scoredCandidates.forEach((c, i) => { c.rank = i + 1 })

  // Step 8: Take top 5 and generate match explanations via Groq
  const top5 = scoredCandidates.slice(0, 5)

  await Promise.all(
    top5.map(async (match) => {
      const reasons = buildTopReasons(match.developer, match.scores, parsedSpec.required_stack)
      if (reasons.length > 0) {
        match.match_explanation = await generateMatchExplanation(
          match.developer.bio,
          request.raw_description,
          reasons
        )
      }
    })
  )

  return {
    matches: top5,
    parsedSpec,
    totalPoolSize: totalPoolSize ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSeniorityFilter(minimumSeniority: string): string[] {
  const rank = SENIORITY_RANK[minimumSeniority] ?? 2
  return Object.entries(SENIORITY_RANK)
    .filter(([, r]) => r >= rank)
    .map(([level]) => level)
}