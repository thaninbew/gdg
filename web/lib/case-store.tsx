"use client"

import * as React from "react"

import { TICKETS } from "@/lib/fixtures"
import { acceptField, applyAnswer, changeField, initialState, TRIAGE_FIELDS, type CaseState } from "@/lib/gate"
import type { TicketCase, TriageField } from "@/lib/types"

// In-memory triage state shared by the inbox, ticket detail and dashboard.
// Replace with API calls once the backend stores clarifications and overrides.

type Store = {
  cases: TicketCase[]
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
  const [state, setState] = React.useState<Record<string, CaseState>>(() =>
    Object.fromEntries(TICKETS.map((c) => [c.ticket_id, initialState(c)]))
  )

  const store = React.useMemo<Store>(() => {
    const byId = (id: string) => TICKETS.find((c) => c.ticket_id === id)
    const update = (id: string, fn: (c: TicketCase, s: CaseState) => CaseState) => {
      const c = byId(id)
      if (c) setState((all) => ({ ...all, [id]: fn(c, all[id]) }))
    }
    return {
      cases: TICKETS,
      state,
      answer: (id, optionIndex, freeText) => update(id, (c, s) => applyAnswer(c, s, optionIndex, freeText)),
      accept: (id, field) =>
        update(id, (_, s) => (field ? [field] : TRIAGE_FIELDS).reduce((acc, f) => acceptField(acc, f), s)),
      change: (id, field, value) => update(id, (c, s) => changeField(c, s, field, value)),
      escalate: (id, reason) => update(id, (_, s) => ({ ...s, forced: [...s.forced, reason] })),
      restore: (id, s) => setState((all) => ({ ...all, [id]: s })),
      reset: (id) => update(id, (c) => initialState(c)),
    }
  }, [state])

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
