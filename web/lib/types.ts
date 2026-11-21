// Mirrors shared/contracts.py and the dict returned by pipeline.run().
// Change shared/contracts.py first (tell the team), then update this file.

export type TicketType = "Incident" | "Request" | "Problem" | "Change"
export type Priority = "high" | "medium" | "low"
export type Language = "en" | "de"

export interface TriageResult {
  type: TicketType
  type_conf: number
  queue: string
  queue_conf: number
  priority: Priority
  priority_conf: number
  language: Language
}

export interface Precedent {
  ticket_id: string
  similarity: number
  subject: string
  body_snippet: string
  answer_snippet: string
  language: Language | ""
}

export interface Draft {
  reply: string
  cited_ticket_ids: string[]
  grounded: boolean
  issues: string[]
}

export type StageSource = "real" | "mock" | "error"

export interface PipelineResult {
  triage: TriageResult
  precedents: Precedent[]
  escalate: boolean
  reasons: string[]
  draft: Draft
  timings_ms: {
    triage_ms: number
    retrieval_ms: number
    gate_ms: number
    draft_ms: number
    total_ms: number
  }
  sources: Record<"triage" | "retrieve" | "gate" | "draft", StageSource>
}
