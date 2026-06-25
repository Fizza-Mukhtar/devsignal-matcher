import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getRoles() {
  const db = getAdminClient()
  const { data, error } = await db
    .from('roles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRoleById(id: string) {
  const db = getAdminClient()
  const { data, error } = await db
    .from('roles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getMatchesForRole(roleId: string) {
  const db = getAdminClient()
  const { data, error } = await db
    .from('matches')
    .select('*, developers(*)')
    .eq('role_id', roleId)
    .order('rank', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveMatches(
  roleId: string,
  matches: Array<{
    developer_id: string
    rank: number
    semantic_score: number
    stack_score: number
    timezone_score: number
    rate_score: number
    seniority_score: number
    composite_score: number
    match_explanation?: string
  }>
) {
  const db = getAdminClient()

  // Upsert — safe to call multiple times
  const rows = matches.map((m) => ({
    role_id: roleId,
    developer_id: m.developer_id,
    rank: m.rank,
    semantic_score: m.semantic_score,
    stack_score: m.stack_score,
    timezone_score: m.timezone_score,
    rate_score: m.rate_score,
    seniority_score: m.seniority_score,
    composite_score: m.composite_score,
    match_explanation: m.match_explanation ?? null,
    operator_approved: null,
    operator_notes: null,
  }))

  const { error } = await db.from('matches').upsert(rows, {
    onConflict: 'role_id,developer_id',
  })
  if (error) throw new Error(error.message)
}

export async function saveRole(
  roleId: string,
  data: {
    client_name: string
    raw_description: string
    parsed_spec: object
    budget_max_usd?: number
    timezone_min_utc?: number
    timezone_max_utc?: number
    status: string
  }
) {
  const db = getAdminClient()
  const { error } = await db
    .from('roles')
    .upsert({ id: roleId, ...data }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

export async function updateMatchDecision(
  matchId: string,
  approved: boolean | null,
  notes: string
) {
  const db = getAdminClient()
  const { error } = await db
    .from('matches')
    .update({ operator_approved: approved, operator_notes: notes })
    .eq('id', matchId)
  if (error) throw new Error(error.message)
}

export async function updateRoleStatus(roleId: string, status: string) {
  const db = getAdminClient()
  const { error } = await db
    .from('roles')
    .update({ status })
    .eq('id', roleId)
  if (error) throw new Error(error.message)
}