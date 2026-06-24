// ============================================================
// Embeddings via Ollama (local — no internet required)
// Model: nomic-embed-text
// Output: 768-dimensional float32 vectors
// Setup: install Ollama from ollama.com, then run:
//   ollama pull nomic-embed-text
// Ollama runs automatically at http://localhost:11434
// ============================================================

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = 'nomic-embed-text'

/**
 * Generate an embedding vector for a single text string.
 * Returns a 768-dimensional float array via local Ollama.
 */
export async function embed(text: string): Promise<number[]> {
  const cleanText = text.trim().slice(0, 2000)

  let response: Response
  try {
    response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: cleanText,
      }),
    })
  } catch (err) {
    throw new Error(
      `Cannot reach Ollama at ${OLLAMA_URL}. Make sure Ollama is running.\n` +
      `  -> Open a terminal and check: ollama list\n` +
      `  -> If not running, start it: ollama serve\n` +
      `  Original error: ${err}`
    )
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ollama embedding failed (${response.status}): ${body}`)
  }

  const result = await response.json()

  if (!result.embedding || !Array.isArray(result.embedding)) {
    throw new Error(`Unexpected Ollama response: ${JSON.stringify(result)}`)
  }

  return result.embedding as number[]
}

/**
 * Generate embeddings for multiple texts.
 * Ollama is local so no rate limits — no delay needed between requests.
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
  return rawDescription.trim().slice(0, 2000)
}