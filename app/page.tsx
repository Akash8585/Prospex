'use client'

import { useRef, useState } from 'react'
import Header from '@/components/Header'
import ICPCard from '@/components/ICPCard'
import ProspectCard from '@/components/ProspectCard'
import ActionRow from '@/components/ActionRow'
import StatusBar from '@/components/StatusBar'
import ResultsPanel from '@/components/ResultsPanel'
import ErrorBanner from '@/components/ErrorBanner'
import {
  ICP,
  Prospect,
  Intel,
  Analysis,
  EmailDraft,
  PipelineStep,
  StepStatus,
} from '@/lib/types'

const INITIAL_STEPS: PipelineStep[] = [
  { label: 'Researching', status: 'pending' },
  { label: 'Analyzing ICP fit', status: 'pending' },
  { label: 'Drafting email', status: 'pending' },
  { label: 'Writing to Notion', status: 'pending' },
]

const INITIAL_ICP: ICP = {
  whatYouSell: '',
  targetSize: '',
  painPoints: '',
  senderName: '',
  senderRole: '',
}

const INITIAL_PROSPECT: Prospect = {
  companyName: '',
  contactName: '',
  contactRole: '',
}

function updateStep(
  steps: PipelineStep[],
  index: number,
  status: StepStatus,
  errorMessage?: string
): PipelineStep[] {
  return steps.map((s, i) =>
    i === index ? { ...s, status, errorMessage } : s
  )
}

export default function Home() {
  const [icp, setIcp] = useState<ICP>(INITIAL_ICP)
  const [prospect, setProspect] = useState<Prospect>(INITIAL_PROSPECT)
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS)
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intel, setIntel] = useState<Intel | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [email, setEmail] = useState<EmailDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof Prospect, string>>>({})

  const resultsRef = useRef<HTMLDivElement>(null)

  const canRun = prospect.companyName.trim().length > 0 && icp.whatYouSell.trim().length > 0

  async function callStep<T>(
    url: string,
    body: object,
    stepIndex: number,
    currentSteps: PipelineStep[]
  ): Promise<{ steps: PipelineStep[]; ok: boolean; data: T | null }> {
    const active = updateStep(currentSteps, stepIndex, 'active')
    setSteps(active)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        const errMsg = data.error ?? `Step failed (${res.status})`
        const errSteps = updateStep(active, stepIndex, 'error', errMsg)
        setSteps(errSteps)
        return { steps: errSteps, ok: false, data: null }
      }

      const doneSteps = updateStep(active, stepIndex, 'done')
      setSteps(doneSteps)
      return { steps: doneSteps, ok: true, data: data as T }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Network error'
      const errSteps = updateStep(active, stepIndex, 'error', errMsg)
      setSteps(errSteps)
      return { steps: errSteps, ok: false, data: null }
    }
  }

  async function runPipeline() {
    const vErrors: Partial<Record<keyof Prospect, string>> = {}
    if (!prospect.companyName.trim()) vErrors.companyName = 'Company name is required'
    if (Object.keys(vErrors).length > 0) {
      setValidationErrors(vErrors)
      return
    }
    setValidationErrors({})

    setIsRunning(true)
    setHasRun(true)
    setError(null)
    setIntel(null)
    setAnalysis(null)
    setEmail(null)

    const reset = INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as StepStatus }))
    setSteps(reset)

    // Step 1: Research
    let currentSteps = reset
    const r1 = await callStep<Intel>('/api/research', { companyName: prospect.companyName }, 0, currentSteps)
    currentSteps = r1.steps
    if (!r1.ok || !r1.data) {
      setError('Research step failed. Check the error above.')
      setIsRunning(false)
      return
    }
    const intelData = r1.data
    setIntel(intelData)

    // Step 2: Analyze
    const r2 = await callStep<Analysis>('/api/analyze', { intel: intelData, icp }, 1, currentSteps)
    currentSteps = r2.steps
    if (!r2.ok || !r2.data) {
      setError('Analysis step failed. Check the error above.')
      setIsRunning(false)
      return
    }
    const analysisData = r2.data
    setAnalysis(analysisData)

    // Step 3: Draft email
    const r3 = await callStep<EmailDraft>(
      '/api/draft',
      {
        companyName: prospect.companyName,
        contactName: prospect.contactName,
        contactRole: prospect.contactRole,
        recentNews: intelData.recentNews,
        painPoints: analysisData.painPoints,
        senderName: icp.senderName,
        senderRole: icp.senderRole,
      },
      2,
      currentSteps
    )
    currentSteps = r3.steps
    if (!r3.ok || !r3.data) {
      setError('Email draft step failed. Check the error above.')
      setIsRunning(false)
      return
    }
    setEmail(r3.data)

    // Step 4: Notion (Phase 2 — stays pending for now)

    setIsRunning(false)

    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  function handleClear() {
    setProspect(INITIAL_PROSPECT)
    setSteps(INITIAL_STEPS)
    setHasRun(false)
    setError(null)
    setIntel(null)
    setAnalysis(null)
    setEmail(null)
    setValidationErrors({})
  }

  const hasResults = intel && analysis && email

  return (
    <div className="min-h-screen bg-canvas-soft">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Config cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ICPCard icp={icp} onChange={setIcp} />
          <ProspectCard
            prospect={prospect}
            onChange={setProspect}
            validationErrors={validationErrors}
          />
        </div>

        {/* Action row */}
        <ActionRow
          onRun={runPipeline}
          onClear={handleClear}
          isRunning={isRunning}
          canRun={canRun}
        />

        {/* Error banner */}
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}

        {/* Status bar — shown once a run has started */}
        {hasRun && <StatusBar steps={steps} />}

        {/* Results panel — shown when all 3 steps complete */}
        {hasResults && (
          <div ref={resultsRef}>
            <ResultsPanel intel={intel} analysis={analysis} email={email} />
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-hairline mt-8">
        <p className="text-[13px] text-ink-faint">
          Prospex — AI-powered B2B prospect research. Built with Claude Sonnet 4.6 + Notion API.
        </p>
      </footer>
    </div>
  )
}
