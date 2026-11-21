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
  /** Words that pushed the priority prediction. */
  key_terms: string[]
}

export interface Precedent {
  ticket_id: string
  similarity: number
  subject: string
  body_snippet: string
  answer_snippet: string
  language: Language | ""
  /** Labels of the past ticket (kb_train only), for the "second opinion". */
  type: string
  queue: string
  priority: string
}

export interface SentenceCheck {
  text: string
  supported: boolean
  /** Past ticket that backs this sentence. */
  source_ticket_id: string | null
  /** How closely it matches, 0 to 1. */
  score: number
}

export interface Draft {
  reply: string
  cited_ticket_ids: string[]
  grounded: boolean
  issues: string[]
  sentences: SentenceCheck[]
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

// ---- Console-only shapes (not in shared/contracts.py yet) ------------------------------------
// Clarifying questions are a proposed contract addition: when a triage field is Ambiguous (<0.70)
// the model returns a question instead of a draft. Raise with the team before the API adds it.

export type ClarifyField = "type" | "queue" | "priority" | "context"

export interface ClarifyOption {
  label: string
  /** What the copilot says after this answer; may cite [TKT-xxxxx]. */
  reply: string
  effect?: {
    /** New confidence for the field that was asked about. */
    conf?: number
    set?: Partial<Pick<TriageResult, "type" | "queue" | "priority">>
    /** Forces escalation with this one-line reason. */
    reason?: string
    /** Extra text the gate should scan, e.g. "refund". */
    adds_text?: string
  }
}

export interface Clarification {
  field: ClarifyField
  question: string
  /** The same question in the requester's language. */
  ask_requester: string
  options: ClarifyOption[]
}

export type CasePrecedent = Precedent

export interface TicketCase {
  ticket_id: string
  subject: string
  body: string
  /** Demo arrival time; the dataset has no timestamps. */
  received: string
  dataset: { row: number; type: string | null; queue: string; priority: string }
  category: string
  /** The copilot's first read of the ticket; may cite [TKT-xxxxx]. */
  note: string
  route: string | null
  triage: TriageResult
  precedents: CasePrecedent[]
  draft: Draft
  clarifications: Clarification[]
  timings_ms: PipelineResult["timings_ms"]
  sources: PipelineResult["sources"]
}

export interface ClarifyAnswer {
  field: ClarifyField
  question: string
  label: string
  reply: string
  /** true when typed by the operator instead of picked. */
  free: boolean
}

export type CaseOutcome = "clarify" | "escalate" | "draft"

export type TriageField = "type" | "queue" | "priority"
/** suggested = model's value, untouched; accepted = operator confirmed it; changed = operator overrode it. */
export type FieldStatus = "suggested" | "accepted" | "changed"
