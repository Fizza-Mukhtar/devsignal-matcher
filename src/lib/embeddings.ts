// ============================================================
// Embeddings via Hugging Face Inference API
// Model: sentence-transformers/all-MiniLM-L6-v2
// Output: 384-dimensional float32 vectors
// Free tier: ~1000 requests/day (plenty for development + demo)
// ============================================================

const HF_API_URL =
  'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2'

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY

if (!HF_API_KEY) {
  console.warn('Warning: HUGGINGFACE_API_KEY not set. Embeddings will fail.')
}

/**
 * Generate an embedding vector for a single text string.
 * Returns a 384-dimensional float array.
 */
export async function embed(text: string): Promise<number[]> {
  // Clean and truncate text (model max: 256 tokens ≈ ~1000 chars)
  const cleanText = text.trim().slice(0, 1000)

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: cleanText,
      options: { wait_for_model: true }, // wait if model is loading (cold start)
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HuggingFace embedding failed: ${response.status} — ${error}`)
  }

  const result = await response.json()

  // HF returns the embedding directly as an array of numbers
  if (!Array.isArray(result)) {
    throw new Error(`Unexpected HuggingFace response format: ${JSON.stringify(result)}`)
  }

  return result as number[]
}

/**
 * Generate embeddings for multiple texts with rate-limit-friendly batching.
 * Adds a 300ms delay between requests to avoid HF rate limits.
 */
export async function embedBatch(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i++) {
    const embedding = await embed(texts[i])
    embeddings.push(embedding)

    onProgress?.(i + 1, texts.length)

    // Polite delay between requests — HF free tier is generous but not unlimited
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return embeddings
}

/**
 * Build the text to embed for a developer profile.
 * Combines the most semantically rich fields into one string.
 */
export function buildDeveloperEmbedText(developer: {
  role_title: string
  seniority: string
  primary_stack: string[]
  secondary_stack: string[]
  specializations: string[]
  bio: string
  years_experience: number
}): string {
  return [
    developer.bio,
    `${developer.seniority} ${developer.role_title} with ${developer.years_experience} years of experience.`,
    `Core technologies: ${developer.primary_stack.join(', ')}.`,
    developer.secondary_stack.length > 0
      ? `Also experienced with: ${developer.secondary_stack.join(', ')}.`
      : '',
    developer.specializations.length > 0
      ? `Specializes in: ${developer.specializations.join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Build the text to embed for a client role requirement.
 */
export function buildRoleEmbedText(rawDescription: string): string {
  return rawDescription.trim().slice(0, 1000)
}