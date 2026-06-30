'use client'

import { useState } from 'react'
import { Intel, Analysis, EmailDraft } from '@/lib/types'

interface Props {
  intel: Intel
  analysis: Analysis
  email: EmailDraft
}

const FIT_STYLES: Record<Analysis['fit'], { badge: string; label: string }> = {
  High: { badge: 'bg-fit-high/10 text-fit-high border-fit-high/30 dark:bg-fit-high/20 dark:border-fit-high/40', label: 'High fit' },
  Medium: { badge: 'bg-fit-medium/10 text-fit-medium border-fit-medium/30 dark:bg-fit-medium/20 dark:border-fit-medium/40', label: 'Medium fit' },
  Low: { badge: 'bg-fit-low/10 text-fit-low border-fit-low/30 dark:bg-fit-low/20 dark:border-fit-low/40', label: 'Low fit' },
}

function SnapshotField({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">{label}</p>
      <p className="text-[14px] text-ink-secondary mt-0.5 leading-snug">{value}</p>
    </div>
  )
}

export default function ResultsPanel({ intel, analysis, email }: Props) {
  const [copied, setCopied] = useState(false)
  const fit = FIT_STYLES[analysis.fit]
  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4" id="results">
      {/* Company header */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-ink tracking-tight leading-tight">
              {intel.websiteOrLinkedin ? (
                <a
                  href={intel.websiteOrLinkedin.startsWith('http') ? intel.websiteOrLinkedin : `https://${intel.websiteOrLinkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-notion-blue transition-colors"
                >
                  {intel.websiteOrLinkedin.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              ) : (
                'Research complete'
              )}
            </h2>
            <p className="text-[13px] text-ink-muted mt-1 leading-relaxed max-w-lg">{analysis.summary}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${fit.badge}`}>
            {fit.label}
          </span>
        </div>

        {analysis.fitReason && (
          <p className="mt-3 pt-3 border-t border-hairline text-[13px] text-ink-muted italic">
            &ldquo;{analysis.fitReason}&rdquo;
          </p>
        )}
      </div>

      {/* Snapshot grid */}
      <div className="card">
        <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-4">Company snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotField label="Industry" value={intel.industry} />
          <SnapshotField label="Size" value={intel.size} />
          <SnapshotField label="Funding" value={intel.funding} />
          <SnapshotField label="Tech stack" value={Array.isArray(intel.techStack) ? intel.techStack : intel.techStack} />
        </div>
        {intel.recentNews && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Recent news</p>
            <p className="text-[14px] text-ink-secondary mt-0.5 leading-relaxed">{intel.recentNews}</p>
          </div>
        )}
      </div>

      {/* Pain points */}
      <div className="card">
        <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-3">Pain points detected</h3>
        <ul className="space-y-2">
          {analysis.painPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-notion-blue" />
              <span className="text-[14px] text-ink-secondary leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Email draft */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide">Draft cold email</h3>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-medium
                       bg-canvas-soft hover:bg-hairline text-ink-secondary transition-colors"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-fit-high" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        <div className="rounded-lg bg-canvas-soft border border-hairline p-4 space-y-3 dark:bg-[#1f1e1d] dark:border-[#3d3a36]">
          <div>
            <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Subject</p>
            <p className="text-[14px] font-medium text-ink mt-1">{email.subject}</p>
          </div>
          <div className="h-px bg-hairline" />
          <p className="text-[14px] text-ink-secondary leading-relaxed whitespace-pre-wrap">{email.body}</p>
        </div>
      </div>
    </div>
  )
}
