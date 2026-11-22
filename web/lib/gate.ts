// Client-side mirror of gate/gate.py so the console can re-run the gate after a clarifying answer
// or an operator override. Keep thresholds and patterns in sync with the Python file.
import { CONFIDENCE_BANDS } from "@/components/sentinel/confidence"
import type {
  CaseOutcome,
  Clarification,
  ClarifyAnswer,
  FieldStatus,
  TicketCase,
  TriageField,
  TriageResult,
} from "@/lib/types"

// Gate v2 (round 2) thresholds. Live tickets use the pipeline's own decision (TicketCase.gate);
// these only drive the demo fixtures. Keyword and urgent-history rules need the backend, so aren't mirrored.
export const CONF_MIN = 0.35
export const SIM_MIN = 0.4

const RISKY =
  /refund|reimburs|compensat|lawsuit|legal|lawyer|guarantee|discount|price|pricing|\bSLA\b|erstatt|rückerstatt|entschädig|anwalt|klage|rechtlich|garantie|rabatt|preis/i
const INJECTION =
  /ignore (all |any |the )?(previous|prior|above|your) (instructions|rules)|disregard (all|previous|your)|system prompt|you are now|act as|pretend to be|ignoriere (alle|deine|die vorherigen)|vergiss (alle|deine)/i

export const TRIAGE_FIELDS: TriageField[] = ["type", "queue", "priority"]
const CONF_KEY = { type: "type_conf", queue: "queue_conf", priority: "priority_conf" } as const

export interface CaseState {
  triage: TriageResult
  fields: Record<TriageField, FieldStatus>
  answers: ClarifyAnswer[]
  /** Escalation reasons added by answers or by the operator. */
  forced: string[]
  extraText: string
  route: string | null
}

export function initialState(c: TicketCase): CaseState {
  return {
    triage: c.triage,
    fields: { type: "suggested", queue: "suggested", priority: "suggested" },
    answers: [],
    forced: [],
    extraText: "",
    route: c.route,
  }
}

const settled = (s: CaseState, q: Clarification) => q.field !== "context" && s.fields[q.field] !== "suggested"

/** Unanswered questions, skipping fields the operator already accepted or changed. */
export function remainingQuestions(c: TicketCase, s: CaseState): Clarification[] {
  const asked = new Set(s.answers.map((a) => a.question))
  return c.clarifications.filter((q) => !asked.has(q.question) && !settled(s, q))
}

export function openQuestion(c: TicketCase, s: CaseState): Clarification | null {
  return remainingQuestions(c, s)[0] ?? null
}

export function applyAnswer(c: TicketCase, s: CaseState, optionIndex: number | null, freeText?: string): CaseState {
  const q = openQuestion(c, s)
  if (!q) return s
  const opt = optionIndex === null ? null : q.options[optionIndex]
  const triage = { ...s.triage, ...(opt?.effect?.set ?? {}) }
  if (q.field !== "context") {
    // A typed answer is treated as resolving the ambiguity, but only up to Likely.
    triage[CONF_KEY[q.field]] = opt?.effect?.conf ?? Math.max(triage[CONF_KEY[q.field]], CONFIDENCE_BANDS.likely)
  }
  const answer: ClarifyAnswer = {
    field: q.field,
    question: q.question,
    label: opt?.label ?? freeText ?? "",
    reply: opt?.reply ?? "Noted. Re-checked the sources with your answer.",
    free: !opt,
  }
  return {
    ...s,
    triage,
    answers: [...s.answers, answer],
    forced: opt?.effect?.reason ? [...s.forced, opt.effect.reason] : s.forced,
    extraText: `${s.extraText} ${opt?.effect?.adds_text ?? freeText ?? ""}`,
  }
}

export function acceptField(s: CaseState, field: TriageField): CaseState {
  return { ...s, fields: { ...s.fields, [field]: "accepted" } }
}

export function changeField(c: TicketCase, s: CaseState, field: TriageField, value: string): CaseState {
  const status: FieldStatus = value === c.triage[field] ? "accepted" : "changed"
  // Values come from the field's option list, so the cast only bridges the per-field unions.
  const triage = { ...s.triage, [field]: value } as TriageResult
  return { ...s, triage, fields: { ...s.fields, [field]: status } }
}

/** Same rules and wording as gate/gate.py, plus reasons forced by answers. Operator-settled fields
 *  no longer count toward low confidence. */
export function gateReasons(c: TicketCase, s: CaseState): string[] {
  if (c.gate) return [...(c.gate.escalate ? c.gate.reasons : []), ...s.forced]
  const t = s.triage
  const text = `${c.subject} ${c.body} ${s.extraText}`
  const reasons: string[] = []
  if (t.priority === "high" && t.type === "Incident") reasons.push("High-priority incident: page the on-call engineer")
  // Gate v2 checks type and priority only; the queue has ~50 classes, so it's left out.
  const unsettled = (["type", "priority"] as const).filter((f) => s.fields[f] === "suggested").map((f) => t[CONF_KEY[f]])
  const low = Math.min(1, ...unsettled)
  if (low < CONF_MIN) reasons.push(`Low classifier confidence (${Math.round(low * 100)}%)`)
  const top = Math.max(0, ...c.precedents.map((p) => p.similarity))
  if (top < SIM_MIN) reasons.push(`No close historical precedent (best match ${Math.round(top * 100)}%)`)
  if (INJECTION.test(text)) reasons.push("Possible prompt injection in the ticket")
  if (RISKY.test(text) && !c.precedents.some((p) => RISKY.test(p.answer_snippet)))
    reasons.push("Asks for a refund, legal or pricing commitment that past resolutions don't support")
  return [...reasons, ...s.forced]
}

const HARD_STOP = /High-priority incident|prompt injection|Mentions an outage|urgent incidents/

/**
 * clarify: a field is Ambiguous and its question is still open (asked before any draft).
 * escalate: the gate failed. High-priority incidents and injections escalate without asking.
 * draft: the gate passed and a grounded draft can be shown for approval.
 */
export function outcome(c: TicketCase, s: CaseState): CaseOutcome {
  const reasons = gateReasons(c, s)
  if (reasons.some((r) => HARD_STOP.test(r))) return "escalate"
  if (openQuestion(c, s)) return "clarify"
  return reasons.length ? "escalate" : c.draft.reply ? "draft" : "escalate"
}
