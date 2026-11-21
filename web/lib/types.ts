// Mirrors shared/contracts.py and the dict returned by pipeline.run().
// Change shared/contracts.py first (tell the team), then update this file.
// Fields with a default in contracts.py are optional here so older fixtures still type-check;
// the live API always sends them.

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
  /** Words that pushed the priority prediction. */
  key_terms?: string[]
}

export interface Precedent {
  ticket_id: string
  similarity: number
  subject: string
  body_snippet: string
  answer_snippet: string
  language: Language | (string & {})
  // Labels of the PAST ticket (kb_train only), used as a second opinion. "" when unknown.
  type?: TicketType | ""
  queue?: string
  priority?: Priority | ""
}

export interface SentenceCheck {
  text: string
  supported: boolean
  /** Past ticket that backs this sentence; null for courtesy lines with no claim. */
  source_ticket_id: string | null
  /** How closely it matches, 0 to 1. */
  score: number
}

export interface Draft {
  reply: string
  cited_ticket_ids: string[]
  grounded: boolean
  issues: string[]
  sentences?: SentenceCheck[]
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
