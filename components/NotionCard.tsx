'use client'

import { NotionConfig } from '@/lib/types'

interface Props {
  notion: NotionConfig
  onChange: (notion: NotionConfig) => void
}

export default function NotionCard({ notion, onChange }: Props) {
  const set = (key: keyof NotionConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...notion, [key]: e.target.value })

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-ink tracking-tight dark:text-[#f6f5f4]">Notion CRM</h2>
        <p className="text-[13px] text-ink-faint mt-0.5 dark:text-[#a39e98]">
          Connect your Notion database to auto-file each researched prospect.
        </p>
      </div>

      <div>
        <label className="label">Integration token</label>
        <input
          className="input font-mono text-[13px]"
          type="password"
          placeholder="secret_..."
          value={notion.token}
          onChange={set('token')}
          autoComplete="off"
        />
        <p className="text-[12px] text-ink-faint mt-1.5 leading-relaxed">
          Create an integration at{' '}
          <a
            href="https://www.notion.so/profile/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="text-notion-blue hover:underline"
          >
            notion.so/profile/integrations
          </a>
          {' '}and copy the Internal Integration Secret.
        </p>
      </div>

      <div>
        <label className="label">Database ID</label>
        <input
          className="input font-mono text-[13px]"
          type="text"
          placeholder="a1b2c3d4e5f6..."
          value={notion.databaseId}
          onChange={set('databaseId')}
          autoComplete="off"
        />
        <p className="text-[12px] text-ink-faint mt-1.5 leading-relaxed">
          Open your CRM database in Notion, copy the ID from the URL (32-character string after the workspace name),
          then share the database with your integration via ··· → Add connections.
        </p>
      </div>

      <div className="pt-1 border-t border-hairline dark:border-[#3d3a36]">
        <p className="text-[12px] text-ink-faint leading-relaxed dark:text-[#a39e98]">
          Required columns: Name, Status, Industry, Company size, ICP fit, Research summary.
          Leave blank to skip Notion write — results still appear in the app.
        </p>
      </div>
    </div>
  )
}
