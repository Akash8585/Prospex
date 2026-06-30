import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : text.trim()
}

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json()

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        'You are a B2B sales intelligence researcher. Use web search to find current, accurate information. Always respond with valid JSON only — no markdown fences, no explanation, no preamble.',
      tools: [
        { type: 'web_search_20250305', name: 'web_search' },
      ] as Anthropic.MessageCreateParams['tools'],
      messages: [
        {
          role: 'user',
          content: `Research the company "${companyName}". Search the web for current information. Return a JSON object with exactly these keys:
- industry: string (their business category)
- size: string (employee count or range)
- funding: string (latest funding stage and round, or "Bootstrapped" / "Public")
- recentNews: string (one sentence about their most recent notable news, product launch, or executive change)
- techStack: string (key technologies they use, comma-separated)
- challenges: array of 3 strings (specific operational or growth challenges this company faces)
- websiteOrLinkedin: string (their primary website URL)

Return only the JSON, nothing else.`,
        },
      ],
    })

    const textBlock = response.content
      .filter((b) => b.type === 'text')
      .at(-1)

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude')
    }

    const intel = JSON.parse(extractJSON(textBlock.text))
    return NextResponse.json(intel)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Research failed'
    console.error('[/api/research]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
