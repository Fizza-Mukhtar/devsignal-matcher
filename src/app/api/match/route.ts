import { NextRequest, NextResponse } from 'next/server'
import { runMatch } from '../../../lib/matcher'
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

    const response: MatchResponse = {
      role_id: crypto.randomUUID(),
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