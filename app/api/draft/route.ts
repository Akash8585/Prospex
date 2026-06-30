import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : text.trim()
}

interface DraftRequest {
  companyName: string
  contactName: string
  contactRole: string
  recentNews: string
  painPoints: string[]
  senderName: string
  senderRole: string
}

export async function POST(req: Request) {
  try {
    const body: DraftRequest = await req.json()
    const {
      companyName,
      contactName,
      contactRole,
      recentNews,
      painPoints,
      senderName,
      senderRole,
    } = body

    const contactLine = contactName
      ? `${contactName}${contactRole ? `, ${contactRole}` : ''} at ${companyName}`
      : `a decision-maker at ${companyName}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'You are an expert B2B sales copywriter. Write emails that feel human and specific, not templated. Always respond with valid JSON only — no markdown fences, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Write a personalized cold outreach email from ${senderName || 'the sender'} (${senderRole || 'Sales Rep'}) to ${contactLine}.

Recent company news to reference: ${recentNews || 'not available'}

Top pain point to address: ${painPoints[0] || 'operational inefficiency'}

Rules:
- Opening paragraph: personalised hook referencing something real and specific about ${companyName} (use the recent news or a known fact)
- Middle paragraph: connect their specific pain point to what the sender offers — be direct about the value
- Closing paragraph: a low-friction CTA (ask a simple question, never "let me know if you're interested")
- Tone: warm, direct, peer-to-peer — not salesy or formal
- Length: under 150 words for the body
- No placeholder text, no [brackets], no generic filler

Return a JSON object with exactly these keys:
- subject: string (a compelling subject line under 50 characters, no "Re:" or "Quick question")
- body: string (the full email body, 3 paragraphs, no greeting/signature — those are added separately)

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

    const draft = JSON.parse(extractJSON(textBlock.text))
    return NextResponse.json(draft)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email drafting failed'
    console.error('[/api/draft]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
