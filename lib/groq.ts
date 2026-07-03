const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile'

export class GroqError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GroqError'
    this.status = status
  }
}

export function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1].trim() : text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1)
  }
  return raw
}

function escapeControlCharsInJsonStrings(json: string): string {
  return json.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
    match
      .replace(/\r\n/g, '\\n')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
  )
}

export function parseModelJSON<T = unknown>(text: string): T {
  const raw = extractJSON(text)
  try {
    return JSON.parse(raw) as T
  } catch {
    return JSON.parse(escapeControlCharsInJsonStrings(raw)) as T
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionOptions {
  model?: string
  system?: string
  user: string
  maxTokens?: number
  jsonMode?: boolean
}

function getApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured. Add it to .env.local and restart the dev server (npm run dev).'
    )
  }
  return apiKey
}

export async function chatCompletion({
  model = GROQ_MODEL,
  system,
  user,
  maxTokens = 1024,
  jsonMode = false,
}: ChatCompletionOptions): Promise<string> {
  const messages: ChatMessage[] = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: user })

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    choices?: { message?: { content?: string } }[]
  }

  if (!res.ok) {
    const message = data.error?.message || `Groq request failed (${res.status})`
    throw new GroqError(res.status, message)
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('No text response received from Groq')
  }

  return content
}

export function groqErrorMessage(err: unknown): { message: string; status: number } {
  if (err instanceof GroqError) {
    return { message: err.message, status: err.status }
  }
  if (err instanceof Error) {
    return { message: err.message, status: 500 }
  }
  return { message: 'Request failed', status: 500 }
}
