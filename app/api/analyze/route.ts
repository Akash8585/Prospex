import { NextResponse } from 'next/server'
import { chatCompletion, parseModelJSON, groqErrorMessage } from '@/lib/groq'
import { Intel, ICP } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { intel, icp }: { intel: Intel; icp: ICP } = await req.json()

    const text = await chatCompletion({
      maxTokens: 1024,
      jsonMode: true,
      system:
        'You are a B2B sales strategist. Always respond with valid JSON only — no markdown fences, no explanation.',
      user: `Given this company profile:
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
    })

    const analysis = parseModelJSON(text)
    return NextResponse.json(analysis)
  } catch (err) {
    const { message, status } = groqErrorMessage(err)
    console.error('[/api/analyze]', message)
    return NextResponse.json({ error: message }, { status })
  }
}
