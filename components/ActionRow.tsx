'use client'

interface Props {
  onRun: () => void
  onClear: () => void
  isRunning: boolean
  canRun: boolean
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function ActionRow({ onRun, onClear, isRunning, canRun }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        className="btn-primary"
        onClick={onRun}
        disabled={isRunning || !canRun}
      >
        {isRunning ? (
          <>
            <Spinner />
            Running…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Run research agent
          </>
        )}
      </button>

      <button
        className="btn-secondary"
        onClick={onClear}
        disabled={isRunning}
      >
        Clear
      </button>

      {!canRun && !isRunning && (
        <p className="text-[13px] text-ink-faint">
          Fill in company name and what you sell to start.
        </p>
      )}
    </div>
  )
}
