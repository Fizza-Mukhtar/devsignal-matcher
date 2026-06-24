/**
 * Test script — Day 1 verification
 * Run with: npm run test-match
 *
 * Runs 3 test queries against your seeded DB and prints ranked results.
 * If this works, Day 1 is complete.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { embed } from '../src/lib/embeddings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TEST_QUERIES = [
  {
    label: 'Query 1 — AI startup needs senior full-stack',
    text: 'We are building an AI-powered legal document review tool. Series A, 6-person team. Need a senior full-stack engineer with React and Node.js experience who has worked at startups before. LatAm timezone preferred. Budget $50–65/hr.',
    budgetMax: 65,
    utcMin: -6,
    utcMax: -3,
  },
  {
    label: 'Query 2 — Machine learning engineer',
    text: 'Early-stage AI company building LLM-powered tools for enterprises. Need an ML engineer with Python and PyTorch who understands production ML systems, not just research. Experience with fine-tuning or RAG systems is a plus.',
    budgetMax: 80,
    utcMin: -6,
    utcMax: 3,
  },
  {
    label: 'Query 3 — First mobile hire for consumer app',
    text: 'Bootstrapped startup with a $500K MRR consumer mobile app. Need our first mobile engineer, ideally with React Native or iOS Swift experience. Must be able to work independently. We have no mobile infrastructure set up yet.',
    budgetMax: 70,
    utcMin: -6,
    utcMax: -3,
  },
]

async function runTests() {
  console.log('🔍 DevSignal Matching Engine — Search Test')
  console.log('==========================================\n')

  // Check DB has data
  const { count } = await supabase
    .from('developers')
    .select('*', { count: 'exact', head: true })
  
  if (!count || count === 0) {
    console.error('❌ No developers in DB. Run "npm run seed" first.')
    process.exit(1)
  }
  console.log(`📊 Developer pool: ${count} active developers\n`)

  for (const query of TEST_QUERIES) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📌 ${query.label}`)
    console.log(`─${'─'.repeat(59)}`)
    console.log(`Query: "${query.text.slice(0, 100)}..."`)
    console.log()

    try {
      // Generate embedding for the query
      process.stdout.write('   Generating embedding... ')
      const embedding = await embed(query.text)
      console.log(`✓ (${embedding.length} dims)`)

      // Run vector search via our SQL function
      process.stdout.write('   Running vector search... ')
      const { data, error } = await supabase.rpc('match_developers', {
        query_embedding: `[${embedding.join(',')}]`,
        budget_max: query.budgetMax,
        utc_offset_min: query.utcMin,
        utc_offset_max: query.utcMax,
        required_seniority: ['mid', 'senior', 'staff', 'principal'],
        match_count: 5,
      })

      if (error) {
        console.log('❌')
        console.error('   Error:', error.message)
        continue
      }

      console.log(`✓ (${data?.length ?? 0} results)\n`)

      if (!data || data.length === 0) {
        console.log('   ⚠️  No matches found (check budget/timezone filters)')
        continue
      }

      // Print results
      data.forEach((dev: {
        name: string
        role_title: string
        location_city: string
        location_country: string
        seniority: string
        primary_stack: string[]
        hourly_rate_usd: number
        english_level: string
        availability: string
        semantic_score: number
      }, i: number) => {
        const score = (dev.semantic_score * 100).toFixed(1)
        const stars = '★'.repeat(Math.round(dev.semantic_score * 5))
        console.log(`   ${i + 1}. ${dev.name} — ${dev.role_title}`)
        console.log(
          `      📍 ${dev.location_city}, ${dev.location_country} | 💰 $${dev.hourly_rate_usd}/hr | ${dev.seniority}`
        )
        console.log(`      🔧 ${dev.primary_stack.slice(0, 3).join(' · ')}`)
        console.log(`      🎯 Semantic score: ${score}% ${stars}`)
        console.log(`      ✉️  English: ${dev.english_level} | Available: ${dev.availability}`)
        console.log()
      })
    } catch (error) {
      console.error(`\n   ❌ Test failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Small delay between queries
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Day 1 test complete!')
  console.log('   If you see 5 ranked results per query above, the vector')
  console.log('   search is working correctly. Day 2 builds the scoring engine.')
}

runTests().catch((error) => {
  console.error('\n💥 Test script crashed:', error)
  process.exit(1)
})