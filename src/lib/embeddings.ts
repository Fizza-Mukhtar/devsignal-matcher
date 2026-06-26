// Embeddings via Transformers.js
// Model: Xenova/all-MiniLM-L6-v2
// Output: 384-dimensional vectors
// Runs locally and on Vercel — no external API needed

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: any = null

async function getPipeline() {
  if (pipeline) return pipeline
  const { pipeline: createPipeline } = await import('@xenova/transformers')
  pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return pipeline
}

export async function embed(text: string): Promise<number[]> {
  const cleanText = text.trim().slice(0, 2000)
  const pipe      = await getPipeline()
  const output    = await pipe(cleanText, { pooling: 'mean', normalize: true })
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