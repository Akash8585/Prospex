'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import NotionCard from '@/components/NotionCard'
import ICPCard from '@/components/ICPCard'
import ProspectCard from '@/components/ProspectCard'
import ActionRow from '@/components/ActionRow'
import StatusBar from '@/components/StatusBar'
import ResultsPanel from '@/components/ResultsPanel'
import SuccessBanner from '@/components/SuccessBanner'
import ErrorBanner from '@/components/ErrorBanner'
import { DEMO_ICP, DEMO_PROSPECT } from '@/lib/demo-data'
import {
  ICP,
  Prospect,
  NotionConfig,
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

const INITIAL_NOTION: NotionConfig = {
  token: '',
  databaseId: '',
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
  const [notion, setNotion] = useState<NotionConfig>(INITIAL_NOTION)
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS)
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intel, setIntel] = useState<Intel | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [email, setEmail] = useState<EmailDraft | null>(null)
  const [notionPageUrl, setNotionPageUrl] = useState<string | null>(null)
  const [prospectErrors, setProspectErrors] = useState<Partial<Record<keyof Prospect, string>>>({})
  const [icpErrors, setIcpErrors] = useState<Partial<Record<keyof ICP, string>>>({})

  const resultsRef = useRef<HTMLDivElement>(null)

  const canRun = prospect.companyName.trim().length > 0 && icp.whatYouSell.trim().length > 0
  const hasNotionCredentials = notion.token.trim().length > 0 && notion.databaseId.trim().length > 0

  useEffect(() => {
    document.title = isRunning ? 'Running… | Prospex' : 'Prospex'
  }, [isRunning])

  function handleIcpChange(next: ICP) {
    setIcp(next)
    if (next.whatYouSell.trim() && icpErrors.whatYouSell) {
      setIcpErrors((prev) => ({ ...prev, whatYouSell: undefined }))
    }
  }

  function handleProspectChange(next: Prospect) {
    setProspect(next)
    if (next.companyName.trim() && prospectErrors.companyName) {
      setProspectErrors((prev) => ({ ...prev, companyName: undefined }))
    }
  }

  function handleLoadDemo() {
    setIcp(DEMO_ICP)
    setProspect(DEMO_PROSPECT)
    setProspectErrors({})
    setIcpErrors({})
    setError(null)
  }

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
    const nextProspectErrors: Partial<Record<keyof Prospect, string>> = {}
    const nextIcpErrors: Partial<Record<keyof ICP, string>> = {}

    if (!prospect.companyName.trim()) nextProspectErrors.companyName = 'Company name is required'
    if (!icp.whatYouSell.trim()) nextIcpErrors.whatYouSell = 'What you sell is required'

    if (Object.keys(nextProspectErrors).length > 0 || Object.keys(nextIcpErrors).length > 0) {
      setProspectErrors(nextProspectErrors)
      setIcpErrors(nextIcpErrors)
      return
    }

    setProspectErrors({})
    setIcpErrors({})

    setIsRunning(true)
    setHasRun(true)
    setError(null)
    setIntel(null)
    setAnalysis(null)
    setEmail(null)
    setNotionPageUrl(null)

    const reset = INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as StepStatus }))
    setSteps(reset)

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

    const r2 = await callStep<Analysis>('/api/analyze', { intel: intelData, icp }, 1, currentSteps)
    currentSteps = r2.steps
    if (!r2.ok || !r2.data) {
      setError('Analysis step failed. Check the error above.')
      setIsRunning(false)
      return
    }
    const analysisData = r2.data
    setAnalysis(analysisData)

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
    const emailData = r3.data
    setEmail(emailData)

    if (hasNotionCredentials) {
      const r4 = await callStep<{ url: string }>(
        '/api/notion',
        {
          notionToken: notion.token,
          databaseId: notion.databaseId,
          companyName: prospect.companyName,
          industry: intelData.industry,
          size: intelData.size,
          fit: analysisData.fit,
          summary: analysisData.summary,
          painPoints: analysisData.painPoints,
          emailSubject: emailData.subject,
          emailBody: emailData.body,
        },
        3,
        currentSteps
      )
      if (r4.ok && r4.data?.url) {
        setNotionPageUrl(r4.data.url)
      }
    }

    setIsRunning(false)

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
    setNotionPageUrl(null)
    setProspectErrors({})
    setIcpErrors({})
  }

  const hasResults = intel && analysis && email

  return (
    <div className="min-h-screen bg-canvas-soft dark:bg-[#191918]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        <NotionCard notion={notion} onChange={setNotion} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ICPCard icp={icp} onChange={handleIcpChange} validationErrors={icpErrors} />
          <ProspectCard
            prospect={prospect}
            onChange={handleProspectChange}
            validationErrors={prospectErrors}
          />
        </div>

        <ActionRow
          onRun={runPipeline}
          onClear={handleClear}
          onLoadDemo={handleLoadDemo}
          isRunning={isRunning}
          canRun={canRun}
        />

        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}

        {hasRun && <StatusBar steps={steps} />}

        {notionPageUrl && <SuccessBanner url={notionPageUrl} />}

        {hasResults && (
          <div ref={resultsRef}>
            <ResultsPanel intel={intel} analysis={analysis} email={email} />
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-hairline dark:border-[#3d3a36] mt-8">
        <p className="text-[13px] text-ink-faint dark:text-[#a39e98]">
          Prospex — AI-powered B2B prospect research. Built with Groq + Notion API.
        </p>
      </footer>
    </div>
  )
}
