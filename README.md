# DevSignal Matcher

A candidate-to-role matching engine built for DevSignal's internal operations.

## The problem

DevSignal manually matches client requirements to a pool of 200+ vetted developers.
As the pool and client demand grow, doing this from memory and spreadsheets becomes
the binding constraint on how fast the business can scale.

## What this builds

A hybrid semantic + rule-based matching engine that takes a raw client requirement
and ranks the developer pool by fit across five dimensions — returning the top
candidates in under 3 seconds with a full score breakdown and AI-generated
match explanation per candidate.

The system has two surfaces:

**Client-facing matcher** (`/`)
- Free-text requirement input — describe what you are building and who you need
- AI parses the raw text into a structured hiring spec (required stack, seniority, red flags)
- Vector search across the developer pool using semantic similarity
- Rule-based scoring layer on top: stack overlap, timezone compatibility, rate vs budget, seniority fit
- Top 5 candidates returned with per-dimension score breakdown and one-sentence match explanation

**Operator panel** (`/admin`)
- Internal view of all submitted requirements with status tracking
- Per-role review page: approve or reject individual candidates, add operator notes
- Mark requirements as sent to client
- All decisions persisted to database

## Matching architecture

```
Client requirement (raw text)
        │
        ▼
Groq llama-3.3-70b — parse into structured spec
        │
        ▼
Ollama nomic-embed-text — embed requirement (768-dim vector)
        │
        ▼
pgvector cosine similarity — pull top 20 candidates from pool
        │
        ▼
Rule-based scoring layer
  ├── Stack overlap score     (required vs preferred weighting)
  ├── Timezone score          (degrades per hour outside window)
  ├── Rate score              (rewards headroom below budget)
  └── Seniority score        (band distance penalty)
        │
        ▼
Weighted composite score
  semantic 45% + stack 25% + timezone 15% + rate 10% + seniority 5%
        │
        ▼
Top 5 re-ranked candidates
        │
        ▼
Groq — generate one-sentence match explanation per candidate
```

## Why hybrid over pure semantic search

Pure vector search surfaces developers who sound like a good fit but can fail
on hard constraints — a developer with a perfect semantic match who is $30/hr
over budget or 9 time zones away is not a real match. The rule-based layer
enforces business constraints while the semantic layer handles the parts that
cannot be expressed as filters.

## Tech stack

- **Next.js 14** — App Router, API routes
- **TypeScript** — end to end
- **Supabase** — Postgres with pgvector extension
- **Ollama + nomic-embed-text** — local embeddings, 768 dimensions, no API cost
- **Groq + llama-3.3-70b** — requirement parsing and match explanations
- **Vercel** — deployment

## Local setup

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- Supabase project with pgvector enabled

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/devsignal-matcher
cd devsignal-matcher
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

### 3. Database setup

Run `supabase/schema.sql` in the Supabase SQL editor.

### 4. Pull the embedding model

```bash
ollama pull nomic-embed-text
```

### 5. Seed the developer pool

```bash
npm run seed
```

Embeds and inserts 32 fictional developer profiles representing DevSignal's
LatAm and MENA talent pool.

### 6. Run

```bash
npm run dev
```

Open `http://localhost:3000` for the matcher and `http://localhost:3000/admin`
for the operator panel.

## Deployment note

This project uses Ollama for embeddings which runs locally. For production
deployment, the embedding step needs to be replaced with a hosted embedding
service. The `src/lib/embeddings.ts` file is the only file that needs to change —
the interface is identical regardless of embedding provider.

## What this would look like in production

- Developer pool ingestion pipeline — auto-embed new developers as they are vetted
- Feedback loop — operator overrides feed back into score weight calibration
- Trial week instrumentation — GitHub activity and communication signals during the trial
- Pool decay detection — flag developers whose profiles have gone stale
