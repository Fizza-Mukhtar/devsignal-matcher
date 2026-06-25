// Embeddings — dual mode
// Local dev: Ollama at localhost:11434 (nomic-embed-text, 768-dim)
// Production: Transformers.js (Xenova/all-MiniLM-L6-v2, 384-dim)
//
// NOTE: Because dimensions differ between modes, the DB schema uses
// vector(768) for local seeds. For a fully unified production system,
// pick one provider and re-seed. For this demo the local seed is what
// powers the Vercel deployment via the already-stored vectors.

const OLLAMA_URL   = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = 'nomic-embed-text'
const IS_PROD      = process.env.NODE_ENV === 'production'

// Cache the pipeline so it only loads once per server instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: any = null

async function getTransformersPipeline() {
  if (pipeline) return pipeline
  const { pipeline: createPipeline } = await import('@xenova/transformers')
  pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return pipeline
}

export async function embed(text: string): Promise<number[]> {
  const cleanText = text.trim().slice(0, 2000)

  if (IS_PROD) {
    return embedWithTransformers(cleanText)
  }
  return embedWithOllama(cleanText)
}

async function embedWithOllama(text: string): Promise<number[]> {
  let response: Response
  try {
    response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
    })
  } catch (err) {
    throw new Error(
      `Cannot reach Ollama at ${OLLAMA_URL}. Make sure Ollama is running.\n` +
      `Original error: ${err}`
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

async function embedWithTransformers(text: string): Promise<number[]> {
  const pipe   = await getTransformersPipeline()
  const output = await pipe(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}

export async function embedBatch(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<number[][]> {
  const embeddings: number[][] = []
  for (let i = 0; i < texts.length; i++) {
    embeddings.push(await embed(texts[i]))
    onProgress?.(i + 1, texts.length)
  }
  return embeddings
}

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

export function buildRoleEmbedText(rawDescription: string): string {
  return rawDescription.trim().slice(0, 2000)
}