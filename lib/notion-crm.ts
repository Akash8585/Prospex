import { Client } from '@notionhq/client'

type DbProperty = {
  type: string
  select?: { options: { name: string; color?: string }[] }
}

type DbProperties = Record<string, DbProperty>

export interface CrmSchema {
  dataSourceId: string
  titleProperty: string
  statusProperty: string
  industryProperty: string
  companySizeProperty: string
  icpFitProperty: string
  summaryProperty: string
}

const STATUS_OPTIONS = ['Researched']
const ICP_FIT_OPTIONS = ['High', 'Medium', 'Low']

const CRM_FIELDS = {
  status: { name: 'Status', type: 'select' as const },
  industry: { name: 'Industry', type: 'rich_text' as const },
  companySize: { name: 'Company size', type: 'rich_text' as const },
  icpFit: { name: 'ICP fit', type: 'select' as const },
  summary: { name: 'Research summary', type: 'rich_text' as const },
}

const SELECT_COLORS = ['blue', 'green', 'yellow', 'red', 'purple', 'gray'] as const

function normalizeId(id: string): string {
  return id.replace(/-/g, '')
}

async function resolveDataSourceId(notion: Client, dbId: string): Promise<string> {
  const db = await notion.databases.retrieve({ database_id: dbId })

  if (!('data_sources' in db) || !Array.isArray(db.data_sources) || db.data_sources.length === 0) {
    throw new Error(
      'Integration cannot read this database — open the CRM page in Notion, click ··· → Connections → add your integration, and enable Read + Insert + Update in the integration settings.'
    )
  }

  return normalizeId(db.data_sources[0].id)
}

function getProperties(record: unknown): DbProperties {
  const data = record as { properties?: unknown }
  if (!data.properties || typeof data.properties !== 'object') {
    throw new Error('Could not read database columns from Notion.')
  }
  return data.properties as DbProperties
}

function findTitleProperty(properties: DbProperties): string {
  for (const [name, prop] of Object.entries(properties)) {
    if (prop.type === 'title') return name
  }
  throw new Error('This database has no title column — create a blank Notion database and try again.')
}

function mergeSelectOptions(
  existing: { name: string; color?: string }[] | undefined,
  required: string[]
) {
  const seen = new Set(existing?.map((o) => o.name) ?? [])
  const options = (existing ?? []).map((o) => ({
    name: o.name,
    color: o.color ?? 'default',
  }))

  for (const name of required) {
    if (!seen.has(name)) {
      options.push({ name, color: SELECT_COLORS[options.length % SELECT_COLORS.length] })
    }
  }

  return options
}

function selectOptionsChanged(
  existing: { name: string }[] | undefined,
  merged: { name: string }[]
): boolean {
  const a = (existing ?? []).map((o) => o.name).sort().join('|')
  const b = merged.map((o) => o.name).sort().join('|')
  return a !== b
}

function buildPropertyCreate(type: 'select' | 'rich_text', options?: string[]) {
  if (type === 'rich_text') {
    return { rich_text: {} }
  }
  return {
    select: {
      options: (options ?? []).map((option, i) => ({
        name: option,
        color: SELECT_COLORS[i % SELECT_COLORS.length],
      })),
    },
  }
}

export async function ensureCrmSchema(
  notion: Client,
  dbId: string,
  fit: string
): Promise<CrmSchema> {
  const dataSourceId = await resolveDataSourceId(notion, dbId)

  const source = await notion.dataSources.retrieve({ data_source_id: dataSourceId })
  let properties = getProperties(source)
  const titleProperty = findTitleProperty(properties)

  const updates: Record<string, unknown> = {}
  const statusRequired = [...STATUS_OPTIONS]
  const fitRequired = Array.from(new Set([...ICP_FIT_OPTIONS, fit]))

  for (const field of Object.values(CRM_FIELDS)) {
    const existing = properties[field.name]

    if (!existing) {
      updates[field.name] =
        field.type === 'select'
          ? buildPropertyCreate(
              'select',
              field.name === 'Status' ? statusRequired : fitRequired
            )
          : buildPropertyCreate('rich_text')
      continue
    }

    if (existing.type !== field.type) {
      throw new Error(
        `Column "${field.name}" already exists as ${existing.type}. Delete or rename it in Notion so Prospex can create the correct column.`
      )
    }

    if (field.type === 'select') {
      const required = field.name === 'Status' ? statusRequired : fitRequired
      const merged = mergeSelectOptions(existing.select?.options, required)
      if (selectOptionsChanged(existing.select?.options, merged)) {
        updates[field.name] = { select: { options: merged } }
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const updated = await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: updates as Parameters<Client['dataSources']['update']>[0]['properties'],
    })
    properties = getProperties(updated)
  }

  return {
    dataSourceId,
    titleProperty,
    statusProperty: CRM_FIELDS.status.name,
    industryProperty: CRM_FIELDS.industry.name,
    companySizeProperty: CRM_FIELDS.companySize.name,
    icpFitProperty: CRM_FIELDS.icpFit.name,
    summaryProperty: CRM_FIELDS.summary.name,
  }
}
