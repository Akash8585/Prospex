'use client'

import { PipelineStep } from '@/lib/types'

interface Props {
  steps: PipelineStep[]
}

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  if (status === 'active') {
    return (
      <span className="flex h-5 w-5 items-center justify-center">
        <svg className="animate-spin h-4 w-4 text-notion-blue" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    )
  }
  if (status === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fit-high/10">
        <svg className="h-3 w-3 text-fit-high" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fit-low/10">
        <svg className="h-3 w-3 text-fit-low" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  // pending
  return (
    <span className="flex h-5 w-5 items-center justify-center">
      <span className="h-2 w-2 rounded-full bg-hairline" />
    </span>
  )
}

export default function StatusBar({ steps }: Props) {
  return (
    <div className="card">
      <h3 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-4 dark:text-[#a39e98]">
        Pipeline status
      </h3>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex sm:flex-col items-start sm:items-center sm:flex-1 gap-3 sm:gap-1.5">
            {/* connector line before step (desktop) */}
            <div className="hidden sm:flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-px flex-1 transition-colors duration-300 ${
                    steps[i - 1].status === 'done' ? 'bg-fit-high/30' : 'bg-hairline'
                  }`}
                />
              )}
              <StepIcon status={step.status} />
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 transition-colors duration-300 ${
                    step.status === 'done' ? 'bg-fit-high/30' : 'bg-hairline'
                  }`}
                />
              )}
            </div>

            {/* mobile: icon inline */}
            <div className="sm:hidden flex-shrink-0">
              <StepIcon status={step.status} />
            </div>

            <div className="sm:text-center">
              <p
                className={`text-[13px] font-medium leading-tight transition-colors duration-150 ${
                  step.status === 'active'
                    ? 'text-notion-blue'
                    : step.status === 'done'
                    ? 'text-fit-high'
                    : step.status === 'error'
                    ? 'text-fit-low'
                    : 'text-ink-faint'
                }`}
              >
                {step.label}
              </p>
              {step.errorMessage && (
                <p className="text-[11px] text-fit-low mt-0.5 leading-tight max-w-full sm:max-w-[120px]">
                  {step.errorMessage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
