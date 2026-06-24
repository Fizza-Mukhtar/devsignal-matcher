/**
 * Seed script — Day 1
 * Run with: npm run seed
 *
 * What this does:
 * 1. Clears existing developer records (safe to re-run)
 * 2. Generates an embed text for each developer
 * 3. Calls HuggingFace API to generate 384-dim embeddings
 * 4. Inserts all developers into Supabase with their embeddings
 *
 * Expected time: ~3–4 minutes (35 developers × 300ms delay)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { SEED_DEVELOPERS } from './seed-data'
import { embed, buildDeveloperEmbedText } from '../src/lib/embeddings'

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'HUGGINGFACE_API_KEY',
]
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing environment variable: ${envVar}`)
    console.error('   Make sure your .env.local file has all required keys.')
    process.exit(1)
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function seed() {
  console.log('🌱 DevSignal Matching Engine — Seed Script')
  console.log('==========================================\n')

  // Step 1: Clear existing data
  console.log('🗑️  Clearing existing developer records...')
  const { error: deleteError } = await supabaseAdmin
    .from('developers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all
  if (deleteError) {
    console.error('❌ Failed to clear developers:', deleteError.message)
    process.exit(1)
  }
  console.log('   ✓ Cleared\n')

  // Step 2: Process each developer
  console.log(`📝 Processing ${SEED_DEVELOPERS.length} developer profiles...`)
  console.log('   (This takes ~3–4 min due to HuggingFace API rate limits)\n')

  const results = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < SEED_DEVELOPERS.length; i++) {
    const dev = SEED_DEVELOPERS[i]
    const progress = `[${i + 1}/${SEED_DEVELOPERS.length}]`

    process.stdout.write(`   ${progress} ${dev.name} (${dev.role_title})... `)

    try {
      // Build the text we'll embed
      const embedText = buildDeveloperEmbedText({
        role_title: dev.role_title,
        seniority: dev.seniority,
        primary_stack: dev.primary_stack,
        secondary_stack: dev.secondary_stack,
        specializations: dev.specializations,
        bio: dev.bio,
        years_experience: dev.years_experience,
      })

      // Generate embedding via HuggingFace
      const embedding = await embed(embedText)

      results.push({
        ...dev,
        embedding: `[${embedding.join(',')}]`, // Postgres vector format
      })

      process.stdout.write(`✓ (dim: ${embedding.length})\n`)
      successCount++

      // Polite delay between HF requests (except last one)
      if (i < SEED_DEVELOPERS.length - 1) {
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (error) {
      process.stdout.write(`❌ FAILED\n`)
      console.error(`      Error: ${error instanceof Error ? error.message : String(error)}`)
      failCount++

      // If HuggingFace returns 503 (model loading), wait longer and retry once
      if (String(error).includes('503')) {
        console.log('      → Model loading, waiting 15 seconds and retrying...')
        await new Promise((r) => setTimeout(r, 15000))
        try {
          const embedText = buildDeveloperEmbedText({
            role_title: dev.role_title,
            seniority: dev.seniority,
            primary_stack: dev.primary_stack,
            secondary_stack: dev.secondary_stack,
            specializations: dev.specializations,
            bio: dev.bio,
            years_experience: dev.years_experience,
          })
          const embedding = await embed(embedText)
          results.push({ ...dev, embedding: `[${embedding.join(',')}]` })
          console.log(`      → Retry succeeded for ${dev.name}`)
          successCount++
          failCount-- // correct the count
        } catch (retryError) {
          console.error(`      → Retry also failed: ${retryError}`)
        }
      }
    }
  }

  // Step 3: Insert all into Supabase
  if (results.length === 0) {
    console.error('\n❌ No developers were embedded successfully. Check your HuggingFace API key.')
    process.exit(1)
  }

  console.log(`\n💾 Inserting ${results.length} developers into Supabase...`)

  // Insert in batches of 10 to avoid request size limits
  const batchSize = 10
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize)
    const { error: insertError } = await supabaseAdmin.from('developers').insert(batch)

    if (insertError) {
      console.error(`❌ Insert failed for batch ${i}–${i + batchSize}:`, insertError.message)
      process.exit(1)
    }
    console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}`)
  }

  // Step 4: Verify
  const { count } = await supabaseAdmin
    .from('developers')
    .select('*', { count: 'exact', head: true })

  console.log('\n🎉 Seed complete!')
  console.log('==========================================')
  console.log(`   ✓ Developers in DB: ${count}`)
  console.log(`   ✓ Successfully embedded: ${successCount}`)
  if (failCount > 0) console.log(`   ⚠️  Failed to embed: ${failCount}`)
  console.log('\n   Next: run "npm run test-match" to verify search works')
}

seed().catch((error) => {
  console.error('\n💥 Seed script crashed:', error)
  process.exit(1)
})