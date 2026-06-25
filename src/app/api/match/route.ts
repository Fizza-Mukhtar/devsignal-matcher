import { NextRequest, NextResponse } from 'next/server'
import { runMatch } from '../../../lib/matcher'
import { saveRole, saveMatches } from '../../../lib/db'
import type { MatchRequest, MatchResponse } from '../../../types'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MatchRequest

    if (!body.raw_description || body.raw_description.trim().length < 20) {
      return NextResponse.json(
        { error: 'raw_description must be at least 20 characters' },
        { status: 400 }
      )
    }

    if (!body.client_name || body.client_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'client_name is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing Supabase credentials' },
        { status: 500 }
      )
    }

    const { matches, parsedSpec, totalPoolSize } = await runMatch(
      body,
      supabaseKey,
      supabaseUrl
    )

    // Persist role and matches so they appear in the admin panel
    const roleId = crypto.randomUUID()

    await saveRole(roleId, {
      client_name: body.client_name,
      raw_description: body.raw_description,
      parsed_spec: parsedSpec,
      budget_max_usd: body.budget_max_usd,
      timezone_min_utc: body.timezone_min_utc,
      timezone_max_utc: body.timezone_max_utc,
      status: 'matched',
    })

    if (matches.length > 0) {
      await saveMatches(
        roleId,
        matches.map((m) => ({
          developer_id: m.developer.id,
          rank: m.rank,
          semantic_score: m.scores.semantic,
          stack_score: m.scores.stack,
          timezone_score: m.scores.timezone,
          rate_score: m.scores.rate,
          seniority_score: m.scores.seniority,
          composite_score: m.scores.composite,
          match_explanation: m.match_explanation,
        }))
      )
    }

    const response: MatchResponse = {
      role_id: roleId,
      matches,
      parsed_spec: parsedSpec,
      total_pool_size: totalPoolSize,
      matched_count: matches.length,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[/api/match]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}