// Client side of the /submit -> api/server.py integration. Shapes follow pipeline.run()
// (shared/contracts.py); fields web/lib/types.ts doesn't mirror yet are optional here.

import type { PipelineResult } from "@/lib/types"

import { resolve, type AccountId, type Analysis, type Outcome } from "./logic"

export type Sentence = { text: string; supported: boolean; source_ticket_id: string | null; score: number }
export type Triaged = PipelineResult & {
  triage: PipelineResult["triage"] & { key_terms?: string[] }
  draft: PipelineResult["draft"] & { sentences?: Sentence[] }
}

const ENDPOINT = "/submit/backend"

export async function probe(): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify({ probe: true }) })
    return Boolean((await res.json()).ok)
  } catch {
    return false
  }
}

export async function triage(subject: string, body: string, signal?: AbortSignal): Promise<Triaged> {
  const res = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify({ subject, body }), signal })
  if (!res.ok) throw new Error(`Backend ${res.status}`)
  return (await res.json()) as Triaged
}

export function mockStages(r: Triaged) {
  return Object.entries(r.sources)
    .filter(([, v]) => v !== "real")
    .map(([k]) => k)
}

const URGENT = /on-call|outage|security|critical service/i

// The pipeline decides; local rules keep only what the backend has no API for (invoice lookup)
// and the pre-submit question.
export function toOutcome(r: Triaged, text: string, a: Analysis, answer: string | null, accountId: AccountId): Outcome {
  if (a.critical || r.reasons.some((x) => URGENT.test(x))) {
    // Customer-facing: plain reasons only; the engineer view shows the gate's own wording.
    return { kind: "urgent", reasons: a.critical ?? ["Flagged as urgent"] }
  }
  const local = resolve(text, a, answer, accountId)
  if (local.kind === "action") return local
  if (!r.escalate && r.draft.grounded && r.draft.reply) {
    const subject = new Map(r.precedents.map((p) => [p.ticket_id, p.subject]))
    const sentences = r.draft.sentences?.length
      ? r.draft.sentences.map((s) => ({
          text: s.text,
          source: s.source_ticket_id ? { id: s.source_ticket_id, subject: subject.get(s.source_ticket_id) ?? "" } : null,
        }))
      : [{ text: r.draft.reply, source: null }]
    return { kind: "answer", sentences }
  }
  return { kind: "handoff", team: r.triage.queue, reason: "A person will take it from here." }
}
