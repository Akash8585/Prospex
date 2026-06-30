'use client'

import { ICP } from '@/lib/types'

interface Props {
  icp: ICP
  onChange: (icp: ICP) => void
}

export default function ICPCard({ icp, onChange }: Props) {
  const set = (key: keyof ICP) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...icp, [key]: e.target.value })

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold text-ink tracking-tight">Your ICP</h2>
        <p className="text-[13px] text-ink-faint mt-0.5">Define your ideal customer so the agent can score prospects against it.</p>
      </div>

      <div>
        <label className="label">What you sell</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="e.g. Sales automation software for B2B SaaS teams"
          value={icp.whatYouSell}
          onChange={set('whatYouSell')}
        />
      </div>

      <div>
        <label className="label">Target company size</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. 50–500 employees, Series A–C"
          value={icp.targetSize}
          onChange={set('targetSize')}
        />
      </div>

      <div>
        <label className="label">Pain points you solve</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="e.g. Manual CRM updates, low outbound reply rates, slow rep onboarding"
          value={icp.painPoints}
          onChange={set('painPoints')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Your name</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Alex Kim"
            value={icp.senderName}
            onChange={set('senderName')}
          />
        </div>
        <div>
          <label className="label">Your role</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Account Executive"
            value={icp.senderRole}
            onChange={set('senderRole')}
          />
        </div>
      </div>
    </div>
  )
}
