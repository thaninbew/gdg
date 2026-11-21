// Client side of the /submit -> api/server.py integration (POST /triage via ./backend).
// The response is pipeline.run() exactly; see shared/contracts.py and lib/types.ts.

import type { PipelineResult } from "@/lib/types"

import type { Analysis, Outcome } from "./logic"

const ENDPOINT = "/submit/backend"

export async function probe(): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify({ probe: true }) })
    return Boolean((await res.json()).ok)
  } catch {
    return false
  }
}

// The contract has no clarification field, so the answered question travels in the body.
export async function triage(subject: string, body: string, signal?: AbortSignal): Promise<PipelineResult> {
  const res = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify({ subject, body }), signal })
  if (!res.ok) throw new Error(`Backend ${res.status}`)
  return (await res.json()) as PipelineResult
}

export function mockStages(r: PipelineResult) {
  return Object.entries(r.sources)
    .filter(([, v]) => v !== "real")
    .map(([k]) => k)
}

const URGENT = /on-call|outage|security|critical service/i

// The backend decides. Local rules may only make it stricter (a local outage rule still escalates);
// they never turn an escalation or an ungrounded draft into an answer.
export function toOutcome(r: PipelineResult, a: Analysis): Outcome {
  if (a.critical || r.reasons.some((x) => URGENT.test(x))) {
    // Customer-facing wording only; the engineer view shows the gate's own reasons.
    return { kind: "urgent", reasons: a.critical ?? ["Flagged as urgent"] }
  }
  const toPerson: Outcome = { kind: "handoff", team: r.triage.queue, reason: "A person will take it from here." }
  if (r.escalate || !r.draft.grounded || !r.draft.reply.trim()) return toPerson

  // Cite only tickets the pipeline actually returned, and only sentences it marked supported.
  const returned = new Map(r.precedents.map((p) => [p.ticket_id, p.subject]))
  const cite = (id: string | null | undefined) => (id && returned.has(id) ? { id, subject: returned.get(id) ?? "" } : null)
  const sentences = r.draft.sentences?.length
    ? r.draft.sentences.map((s) => ({ text: s.text, source: s.supported ? cite(s.source_ticket_id) : null }))
    : [{ text: r.draft.reply, source: cite(r.draft.cited_ticket_ids[0]) }]
  if (!sentences.some((s) => s.source)) return toPerson
  return { kind: "answer", sentences }
}
