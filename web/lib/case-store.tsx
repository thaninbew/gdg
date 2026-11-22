"use client"

import * as React from "react"

import { TICKETS } from "@/lib/fixtures"
import { acceptField, applyAnswer, changeField, initialState, TRIAGE_FIELDS, type CaseState } from "@/lib/gate"
import { usePresenterTicket, type PresenterTicket } from "@/lib/presenter-ticket"
import { caseFromStore, STORE } from "@/lib/ticket-search"
import type { TicketCase, TriageField } from "@/lib/types"

// A ticket a customer just sent from /submit (presenter mode), shaped like the demo cases so the
// inbox and ticket detail can show it. Its gate decision comes from the real pipeline.
function caseFromPresenter(p: PresenterTicket): TicketCase {
  const r = p.result
  return {
    ticket_id: p.id,
    subject: p.request.subject || "(no subject)",
    body: p.request.body,
    received: new Date().toTimeString().slice(0, 5),
    dataset: { row: -1, type: null, queue: r.triage.queue, priority: r.triage.priority },
    category: "",
    note: r.escalate ? "Sent by the customer just now. The gate handed it to a person." : "Sent by the customer just now.",
    route: null,
    triage: r.triage,
    precedents: r.precedents,
    draft: r.draft,
    clarifications: [],
    timings_ms: r.timings_ms,
    sources: r.sources,
    gate: { escalate: r.escalate, reasons: r.reasons },
  }
}

// In-memory triage state shared by the inbox, ticket detail and dashboard.
// Replace with API calls once the backend stores clarifications and overrides.

type Store = {
  /** Inbox tickets: the customer's live ticket (presenter mode) and the demo cases. */
  cases: TicketCase[]
  /** Any ticket the console can open: inbox tickets plus ones opened from Find a ticket. */
  find: (id: string) => TicketCase | undefined
  /** Loads a ticket from the searchable store so it can be opened (not added to the inbox list). */
  include: (id: string) => void
  state: Record<string, CaseState>
  answer: (id: string, optionIndex: number | null, freeText?: string) => void
  accept: (id: string, field?: TriageField) => void
  change: (id: string, field: TriageField, value: string) => void
  escalate: (id: string, reason: string) => void
  /** Puts a ticket back to an earlier state (used by Undo). */
  restore: (id: string, s: CaseState) => void
  reset: (id: string) => void
}

const StoreContext = React.createContext<Store | null>(null)

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export function CaseStoreProvider({ children }: { children: React.ReactNode }) {
  const { ticket } = usePresenterTicket()
  const live = React.useMemo(() => (ticket ? caseFromPresenter(ticket) : null), [ticket])
  const cases = React.useMemo(() => (live ? [live, ...TICKETS.filter((c) => c.ticket_id !== live.ticket_id)] : TICKETS), [live])
  const [found, setFound] = React.useState<TicketCase[]>([])
  const [saved, setState] = React.useState<Record<string, CaseState>>(() =>
    Object.fromEntries(TICKETS.map((c) => [c.ticket_id, initialState(c)]))
  )
  // A live ticket gets its starting state the first time it appears.
  const all = React.useMemo(() => [...cases, ...found], [cases, found])
  // Tickets get their starting state the first time they appear.
  const state = React.useMemo(() => {
    const missing = all.filter((c) => !saved[c.ticket_id])
    return missing.length ? { ...saved, ...Object.fromEntries(missing.map((c) => [c.ticket_id, initialState(c)])) } : saved
  }, [all, saved])

  const store = React.useMemo<Store>(() => {
    const byId = (id: string) => all.find((c) => c.ticket_id === id)
    const update = (id: string, fn: (c: TicketCase, s: CaseState) => CaseState) => {
      const c = byId(id)
      if (c) setState((all) => ({ ...all, [id]: fn(c, ensure(all, c)) }))
    }
    const ensure = (all: Record<string, CaseState>, c: TicketCase) => all[c.ticket_id] ?? initialState(c)
    return {
      cases,
      find: byId,
      include: (id) => {
        if (byId(id)) return
        const row = STORE.find((x) => x.id === id)
        if (row) setFound((f) => (f.some((c) => c.ticket_id === id) ? f : [...f, caseFromStore(row)]))
      },
      state,
      answer: (id, optionIndex, freeText) => update(id, (c, s) => applyAnswer(c, s, optionIndex, freeText)),
      accept: (id, field) =>
        update(id, (_, s) => (field ? [field] : TRIAGE_FIELDS).reduce((acc, f) => acceptField(acc, f), s)),
      change: (id, field, value) => update(id, (c, s) => changeField(c, s, field, value)),
      escalate: (id, reason) => update(id, (_, s) => ({ ...s, forced: [...s.forced, reason] })),
      restore: (id, s) => setState((all) => ({ ...all, [id]: s })),
      reset: (id) => update(id, (c) => initialState(c)),
    }
  }, [state, cases, all])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useCases() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useCases must be used inside CaseStoreProvider")
  return ctx
}

/** Highest priority first, then oldest. */
export function sortQueue(cases: TicketCase[], state: Record<string, CaseState>) {
  return cases
    .slice()
    .sort(
      (a, b) =>
        PRIORITY_RANK[state[a.ticket_id].triage.priority] - PRIORITY_RANK[state[b.ticket_id].triage.priority] ||
        a.received.localeCompare(b.received)
    )
}
