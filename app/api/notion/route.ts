import { NextResponse } from 'next/server'
import { Client, APIResponseError } from '@notionhq/client'
import { ensureCrmSchema } from '@/lib/notion-crm'

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

function parseDatabaseId(raw: string): string {
  const trimmed = raw.trim()
  const pageMatch = trimmed.match(/\/p\/([a-f0-9]{32})/i)
  if (pageMatch) return pageMatch[1]

  const beforeQuery = trimmed.split('?')[0]
  const pathMatch = beforeQuery.match(/([a-f0-9]{32}|[a-f0-9-]{36})$/i)
  if (pathMatch) return pathMatch[1].replace(/-/g, '')

  const match = trimmed.match(
    /([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
  )
  const id = match ? match[1] : trimmed
  return id.replace(/-/g, '')
}

function notionErrorMessage(err: APIResponseError): string {
  const msg = err.message?.trim()
  if (msg) {
    if (err.status === 404 || err.code === 'object_not_found') {
      if (/shared|connection/i.test(msg)) {
        return `${msg} Open the database in Notion → ··· → Add connections → select your integration.`
      }
      return `${msg} Check the database ID — paste the full CRM database URL.`
    }
    if (err.status === 401 || err.code === 'unauthorized') {
      return 'Invalid Notion token — copy the Internal Integration Secret from notion.so/profile/integrations'
    }
    if (err.code === 'validation_error') {
      return msg
    }
    return msg
  }

  if (err.status === 401) {
    return 'Invalid Notion token — check your integration token'
  }
  if (err.status === 404) {
    return 'Database not found — verify the database ID and share the database with your integration'
  }
  return `Notion write failed (${err.status})`
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
    const dbId = parseDatabaseId(databaseId)

    if (!/^[a-f0-9]{32}$/i.test(dbId)) {
      return NextResponse.json(
        {
          error:
            'Invalid database ID — paste the 32-character ID from your database URL (or paste the full URL).',
        },
        { status: 400 }
      )
    }

    const schema = await ensureCrmSchema(notion, dbId, fit)

    const emailContent = `Subject: ${emailSubject}\n\n${emailBody}`

    const page = await notion.pages.create({
      parent: { type: 'data_source_id', data_source_id: schema.dataSourceId },
      properties: {
        [schema.titleProperty]: { title: richText(companyName) },
        [schema.statusProperty]: { select: { name: 'Researched' } },
        [schema.industryProperty]: { rich_text: richText(industry || '—') },
        [schema.companySizeProperty]: { rich_text: richText(size || '—') },
        [schema.icpFitProperty]: { select: { name: fit } },
        [schema.summaryProperty]: { rich_text: richText(summary || '—') },
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
      const message = notionErrorMessage(err)
      console.error('[/api/notion]', err.status, err.code, message)
      return NextResponse.json({ error: message }, { status: err.status })
    }

    const message = err instanceof Error ? err.message : 'Notion write failed'
    console.error('[/api/notion]', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
