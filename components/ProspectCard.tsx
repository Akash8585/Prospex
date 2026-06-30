'use client'

import { Prospect } from '@/lib/types'

interface Props {
  prospect: Prospect
  onChange: (prospect: Prospect) => void
  validationErrors: Partial<Record<keyof Prospect, string>>
}

export default function ProspectCard({ prospect, onChange, validationErrors }: Props) {
  const set = (key: keyof Prospect) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...prospect, [key]: e.target.value })

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-ink tracking-tight">Prospect</h2>
        <p className="text-[13px] text-ink-faint mt-0.5">Enter the company you want to research and outreach to.</p>
      </div>

      <div>
        <label className="label">
          Company name <span className="text-fit-low normal-case font-normal">*</span>
        </label>
        <input
          className={`input ${validationErrors.companyName ? 'input-error' : ''}`}
          type="text"
          placeholder="e.g. Linear, Razorpay, Notion"
          value={prospect.companyName}
          onChange={set('companyName')}
        />
        {validationErrors.companyName && (
          <p className="text-[12px] text-fit-low mt-1">{validationErrors.companyName}</p>
        )}
      </div>

      <div>
        <label className="label">Contact name <span className="text-ink-faint normal-case font-normal">optional</span></label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Sarah Johnson"
          value={prospect.contactName}
          onChange={set('contactName')}
        />
      </div>

      <div>
        <label className="label">Contact role <span className="text-ink-faint normal-case font-normal">optional</span></label>
        <input
          className="input"
          type="text"
          placeholder="e.g. VP of Sales"
          value={prospect.contactRole}
          onChange={set('contactRole')}
        />
      </div>

      <div className="pt-1 border-t border-hairline">
        <p className="text-[12px] text-ink-faint leading-relaxed">
          The agent will search the web for real-time intel on this company and score it against your ICP.
        </p>
      </div>
    </div>
  )
}
