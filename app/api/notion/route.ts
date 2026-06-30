import { NextResponse } from 'next/server'
import { Client, APIResponseError } from '@notionhq/client'

interface NotionRequest {
  notionToken: string
  databaseId: string
  companyName: string
  industry: string
  size: string
  fit: string
  summary: string
  painPoints: string[]
  emailSubject: string
  emailBody: string
}

function notionErrorMessage(status: number, body?: string): string {
  if (status === 401) {
    return 'Invalid Notion token — check your integration token'
  }
  if (status === 404) {
    return 'Database not found — verify the database ID and share it with your integration'
  }
  if (status === 400) {
    const lower = (body ?? '').toLowerCase()
    if (lower.includes('database') && (lower.includes('not found') || lower.includes('invalid'))) {
      return 'Database not found — verify the database ID and share it with your integration'
    }
    return 'Integration not connected — go to Notion, open the database, click ··· → Add connections → select your integration'
  }
  return `Notion write failed (${status})`
}

function richText(content: string) {
  return [{ text: { content: content.slice(0, 2000) } }]
}

export async function POST(req: Request) {
  try {
    const body: NotionRequest = await req.json()
    const {
      notionToken,
      databaseId,
      companyName,
      industry,
      size,
      fit,
      summary,
      painPoints,
      emailSubject,
      emailBody,
    } = body

    if (!notionToken?.trim() || !databaseId?.trim()) {
      return NextResponse.json(
        { error: 'Notion token and database ID are required' },
        { status: 400 }
      )
    }

    const notion = new Client({ auth: notionToken.trim() })
    const dbId = databaseId.trim().replace(/-/g, '')

    const emailContent = `Subject: ${emailSubject}\n\n${emailBody}`

    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: { title: richText(companyName) },
        Status: { select: { name: 'Researched' } },
        Industry: { rich_text: richText(industry || '—') },
        'Company size': { rich_text: richText(size || '—') },
        'ICP fit': { select: { name: fit } },
        'Research summary': { rich_text: richText(summary || '—') },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: richText('Pain points detected') },
        },
        ...painPoints.map((point) => ({
          object: 'block' as const,
          type: 'bulleted_list_item' as const,
          bulleted_list_item: { rich_text: richText(point) },
        })),
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: richText('Draft cold email') },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: richText(emailContent) },
        },
      ],
    })

    const url = 'url' in page && page.url ? page.url : null
    if (!url) {
      return NextResponse.json({ error: 'Page created but no URL returned' }, { status: 500 })
    }

    return NextResponse.json({ url })
  } catch (err) {
    if (err instanceof APIResponseError) {
      const message = notionErrorMessage(err.status, err.body ? String(err.body) : undefined)
      console.error('[/api/notion]', err.status, message)
      return NextResponse.json({ error: message }, { status: err.status })
    }

    const message = err instanceof Error ? err.message : 'Notion write failed'
    console.error('[/api/notion]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
