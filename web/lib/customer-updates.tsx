"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import type { CustomerPost } from "./customer-view"

// What operators have sent to customers, per ticket. Lives in the root layout so the console
// (/tickets) and the customer's page (/submit, My requests) see the same updates during a session.
// Reloading the tab drops it; replace with the API once tickets are stored server-side.

type Store = {
  posts: (ticketId: string) => CustomerPost[]
  publish: (ticketId: string, post: CustomerPost) => void
  /** Removes the newest post (used by Undo). */
  retract: (ticketId: string) => void
}

const CustomerUpdatesContext = createContext<Store>({ posts: () => [], publish: () => {}, retract: () => {} })

export function CustomerUpdatesProvider({ children }: { children: ReactNode }) {
  const [byTicket, setByTicket] = useState<Record<string, CustomerPost[]>>({})
  const store = useMemo<Store>(
    () => ({
      posts: (id) => byTicket[id] ?? [],
      publish: (id, post) => setByTicket((all) => ({ ...all, [id]: [...(all[id] ?? []), post] })),
      retract: (id) => setByTicket((all) => ({ ...all, [id]: (all[id] ?? []).slice(0, -1) })),
    }),
    [byTicket]
  )
  return <CustomerUpdatesContext.Provider value={store}>{children}</CustomerUpdatesContext.Provider>
}

export function useCustomerUpdates() {
  return useContext(CustomerUpdatesContext)
}

export const nowTime = () => new Date().toTimeString().slice(0, 5)
