import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { SEED_DEVELOPERS } from './seed-data'
import { buildDeveloperEmbedText } from '../src/lib/embeddings'

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`Missing environment variable: ${v}`)
    process.exit(1)
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function seed() {
  console.log('Seeding developer pool...')
  console.log('Loading Transformers.js embedding model (first run downloads ~23MB)...')

  // Dynamically import embed after dotenv is loaded
  const { embed } = await import('../src/lib/embeddings')

  // Clear existing data
  await supabaseAdmin
    .from('developers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('Cleared existing developers.')

  const results = []
  let success = 0
  let failed  = 0

  for (let i = 0; i < SEED_DEVELOPERS.length; i++) {
    const dev = SEED_DEVELOPERS[i]
    process.stdout.write(`[${i + 1}/${SEED_DEVELOPERS.length}] ${dev.name}... `)

    try {
      const embedText = buildDeveloperEmbedText({
        role_title:      dev.role_title,
        seniority:       dev.seniority,
        primary_stack:   dev.primary_stack,
        secondary_stack: dev.secondary_stack,
        specializations: dev.specializations,
        bio:             dev.bio,
        years_experience: dev.years_experience,
      })

      const embedding = await embed(embedText)
      results.push({ ...dev, embedding: `[${embedding.join(',')}]` })
      process.stdout.write(`done (${embedding.length}-dim)\n`)
      success++
    } catch (err) {
      process.stdout.write(`FAILED\n`)
      console.error(`  Error: ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  // Insert in batches
  for (let i = 0; i < results.length; i += 10) {
    const batch = results.slice(i, i + 10)
    const { error } = await supabaseAdmin.from('developers').insert(batch)
    if (error) {
      console.error(`Insert failed for batch ${i}:`, error.message)
      process.exit(1)
    }
  }

  const { count } = await supabaseAdmin
    .from('developers')
    .select('*', { count: 'exact', head: true })

  console.log(`\nSeed complete. ${count} developers in DB. ${failed} failed.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})