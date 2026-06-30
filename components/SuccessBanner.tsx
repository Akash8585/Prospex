'use client'

interface Props {
  url: string
}

export default function SuccessBanner({ url }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-fit-high/20 bg-fit-high/5 px-4 py-3 dark:bg-fit-high/10 dark:border-fit-high/30">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-fit-high/10">
        <svg className="h-3 w-3 text-fit-high" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
      <p className="flex-1 text-[14px] text-ink-secondary leading-relaxed">
        Prospect filed in Notion —{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-notion-blue hover:underline"
        >
          Open CRM page →
        </a>
      </p>
    </div>
  )
}
