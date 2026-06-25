import { NextResponse } from 'next/server'
import { getRoles } from '../../../../lib/db'

export async function GET() {
  try {
    const roles = await getRoles()
    return NextResponse.json(roles)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}