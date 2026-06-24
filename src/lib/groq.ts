import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface ParsedSpec {
  summary: string
  required_stack: string[]
  preferred_stack: string[]
  seniority_recommendation: 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
  budget_signal: 'low' | 'mid' | 'high' | 'unknown'
  red_flags: string[]
  reasoning: string
}

const SYSTEM_PROMPT = `You are a technical recruiting specialist. 
Given a client's raw hiring description, extract a structured technical profile.
Respond with valid JSON only. No explanation, no markdown, no code blocks.

JSON schema:
{
  "summary": "one sentence describing what they need",
  "required_stack": ["array of must-have technologies"],
  "preferred_stack": ["array of nice-to-have technologies"],
  "seniority_recommendation": "junior | mid | senior | staff | principal",
  "budget_signal": "low | mid | high | unknown",
  "red_flags": ["things to watch out for in candidates"],
  "reasoning": "one sentence explaining your seniority recommendation"
}`

export async function parseRequirement(rawDescription: string): Promise<ParsedSpec> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawDescription },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Groq returned empty response')
  }

  try {
    return JSON.parse(content) as ParsedSpec
  } catch {
    throw new Error(`Failed to parse Groq JSON response: ${content}`)
  }
}

export async function generateMatchExplanation(
  developerBio: string,
  roleDescription: string,
  topReasons: string[]
): Promise<string> {
  const prompt = `Developer profile: ${developerBio}

Role requirement: ${roleDescription}

Top match reasons: ${topReasons.join(', ')}

Write one concise sentence (max 25 words) explaining why this developer is a strong match for this role.
Respond with the sentence only. No quotes, no punctuation at the end.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 60,
    messages: [{ role: 'user', content: prompt }],
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}