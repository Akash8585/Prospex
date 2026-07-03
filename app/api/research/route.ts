import { NextResponse } from 'next/server'
import { chatCompletion, parseModelJSON, groqErrorMessage } from '@/lib/groq'

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json()

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const text = await chatCompletion({
      maxTokens: 2048,
      jsonMode: true,
      system:
        'You are a B2B sales intelligence researcher. Use your knowledge of public companies to produce accurate intel. Always respond with valid JSON only — no markdown fences, no explanation, no preamble.',
      user: `Research the company "${companyName}". Return a JSON object with exactly these keys:
- industry: string (their business category)
- size: string (employee count or range)
- funding: string (latest funding stage and round, or "Bootstrapped" / "Public")
- recentNews: string (one sentence about their most recent notable news, product launch, or executive change)
- techStack: string (key technologies they use, comma-separated)
- challenges: array of 3 strings (specific operational or growth challenges this company faces)
- websiteOrLinkedin: string (their primary website URL)

Return only the JSON, nothing else.`,
    })

    const intel = parseModelJSON(text)
    return NextResponse.json(intel)
  } catch (err) {
    const { message, status } = groqErrorMessage(err)
    console.error('[/api/research]', message)
    return NextResponse.json({ error: message }, { status })
  }
}
