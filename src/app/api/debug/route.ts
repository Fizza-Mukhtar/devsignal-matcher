import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', url: !!url, key: !!key })
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Test 1: can we read developers?
  const { data: devs, error: devErr } = await db
    .from('developers')
    .select('id', { count: 'exact', head: true })

  // Test 2: can we read roles?
  const { data: roles, error: roleErr } = await db
    .from('roles')
    .select('*')

  // Test 3: try inserting a test role
  const testId = crypto.randomUUID()
  const { error: insertErr } = await db.from('roles').insert({
    id: testId,
    client_name: 'Debug Test',
    raw_description: 'This is a debug test role inserted to verify DB writes work correctly.',
    parsed_spec: {},
    status: 'pending',
  })

  // Test 4: if insert worked, delete it
  if (!insertErr) {
    await db.from('roles').delete().eq('id', testId)
  }

  return NextResponse.json({
    env: { url: url.slice(0, 30) + '...', key_length: key.length },
    developers: { error: devErr?.message ?? null },
    roles: {
      count: Array.isArray(roles) ? roles.length : 0,
      error: roleErr?.message ?? null,
      data: roles,
    },
    insert_test: {
      error: insertErr?.message ?? null,
      success: !insertErr,
    },
  })
}