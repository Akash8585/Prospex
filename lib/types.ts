export type StepStatus = 'pending' | 'active' | 'done' | 'error'

export interface PipelineStep {
  label: string
  status: StepStatus
  errorMessage?: string
}

export interface ICP {
  whatYouSell: string
  targetSize: string
  painPoints: string
  senderName: string
  senderRole: string
}

export interface Prospect {
  companyName: string
  contactName: string
  contactRole: string
}

export interface Intel {
  industry: string
  size: string
  funding: string
  recentNews: string
  techStack: string
  challenges: string[]
  websiteOrLinkedin: string
}

export interface Analysis {
  fit: 'High' | 'Medium' | 'Low'
  fitReason: string
  painPoints: string[]
  summary: string
}

export interface EmailDraft {
  subject: string
  body: string
}

export interface NotionConfig {
  token: string
  databaseId: string
}

export interface PipelineResults {
  intel: Intel
  analysis: Analysis
  email: EmailDraft
}
