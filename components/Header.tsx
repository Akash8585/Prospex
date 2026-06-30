export default function Header() {
  return (
    <header className="bg-notion-indigo text-white px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[32px] font-bold tracking-tighter leading-none">Prospex</h1>
          <span className="text-white/40 text-sm font-medium hidden sm:block">v1.0</span>
        </div>
        <p className="mt-2 text-[15px] text-white/60 font-normal leading-snug">
          Paste a company name. Get a researched prospect, a scored lead, and a drafted email — written straight into Notion.
        </p>
      </div>
    </header>
  )
}
