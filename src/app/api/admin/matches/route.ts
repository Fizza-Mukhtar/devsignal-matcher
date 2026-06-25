import { NextRequest, NextResponse } from 'next/server'
import { getMatchesForRole, updateMatchDecision, updateRoleStatus } from '../../../../lib/db'

export async function GET(req: NextRequest) {
  const roleId = req.nextUrl.searchParams.get('role_id')
  if (!roleId) {
    return NextResponse.json({ error: 'role_id is required' }, { status: 400 })
  }
  try {
    const matches = await getMatchesForRole(roleId)
    return NextResponse.json(matches)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { match_id, approved, notes, role_id, status } = body
    if (match_id !== undefined) {
      await updateMatchDecision(match_id, approved, notes ?? '')
    }
    if (role_id && status) {
      await updateRoleStatus(role_id, status)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}