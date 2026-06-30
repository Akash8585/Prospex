import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Intel, ICP } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : text.trim()
}

export async function POST(req: Request) {
  try {
    const { intel, icp }: { intel: Intel; icp: ICP } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'You are a B2B sales strategist. Always respond with valid JSON only — no markdown fences, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Given this company profile:
${JSON.stringify(intel, null, 2)}

And this sales rep's ICP:
- What they sell: ${icp.whatYouSell}
- Target company size: ${icp.targetSize}
- Pain points they solve: ${icp.painPoints}

Score the prospect and return a JSON object with exactly these keys:
- fit: string — exactly one of "High", "Medium", or "Low"
- fitReason: string — one sentence explaining the score, referencing specific evidence from the company profile
- painPoints: array of exactly 3 strings — specific pain points from the company profile that match what the rep solves (be specific, not generic)
- summary: string — 2-3 sentences of CRM-ready notes a sales rep would want to read before calling

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

    const analysis = JSON.parse(extractJSON(textBlock.text))
    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    console.error('[/api/analyze]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
