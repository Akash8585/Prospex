import { NextResponse } from 'next/server'
import { chatCompletion, parseModelJSON, groqErrorMessage } from '@/lib/groq'

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

    const text = await chatCompletion({
      maxTokens: 1024,
      jsonMode: true,
      system:
        'You are an expert B2B sales copywriter. Write emails that feel human and specific, not templated. Always respond with valid JSON only — no markdown fences, no explanation.',
      user: `Write a personalized cold outreach email from ${senderName || 'the sender'} (${senderRole || 'Sales Rep'}) to ${contactLine}.

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
- body: string (the full email body as one string; use \\n\\n between paragraphs — no literal line breaks inside the JSON string)

Return only the JSON, nothing else.`,
    })

    const draft = parseModelJSON<{ subject: string; body: string }>(text)
    return NextResponse.json(draft)
  } catch (err) {
    const { message, status } = groqErrorMessage(err)
    console.error('[/api/draft]', message)
    return NextResponse.json({ error: message }, { status })
  }
}
