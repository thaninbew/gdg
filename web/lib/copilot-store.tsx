"use client"

import * as React from "react"

import { useCases } from "@/lib/case-store"
import { nextLanguage, respond, type Conversation } from "@/lib/copilot"
import { TICKETS } from "@/lib/fixtures"
import { initialState } from "@/lib/gate"
import { useI18n } from "@/lib/i18n"

// Copilot conversations for this session. Each belongs to one ticket; a ticket has at most one
// current conversation (shown on the ticket), older ones stay in history on the Copilot page.

type Store = {
  conversations: Conversation[]
  /** The ticket's current conversation, if any. */
  current: (ticketId: string) => Conversation | null
  byId: (id: string) => Conversation | null
  ask: (ticketId: string, question: string, conversationId?: string) => string
  /** Starts a fresh conversation for the ticket; the old one stays in history. Returns Undo. */
  newChat: (ticketId: string) => () => void
  /** An empty conversation for the Copilot page, about a ticket the operator picks. */
  create: (ticketId: string) => string
  setTicket: (conversationId: string, ticketId: string) => void
  /** Deletes conversations. Returns Undo. */
  remove: (ids: string[]) => () => void
}

const Ctx = React.createContext<Store | null>(null)
const now = () => new Date().toTimeString().slice(0, 5)
// IDs for conversations started by the operator (in event handlers, never during render).
const newId = () => `c-${crypto.randomUUID().slice(0, 8)}`

// Demo history so the Copilot page isn't empty on first open.
function seed(): { conversations: Conversation[]; active: Record<string, string | null> } {
  // Fixed IDs: this runs during prerender, where Next.js doesn't allow random or time-based values.
  const make = (ticketId: string, updated: string, qs: { q: string; lang: "en" | "de" }[]): Conversation => {
    const c = TICKETS.find((t) => t.ticket_id === ticketId)!
    const s = initialState(c)
    return { id: `demo-${ticketId}`, ticketId, updated, messages: qs.map(({ q, lang }) => ({ q, a: respond(c, s, q, lang), done: true })) }
  }
  return {
    conversations: [
      make("TKT-54875", "09:44", [
        { q: "Translate to English", lang: "en" },
        { q: "Antworte bitte auf Deutsch: was hat früher geholfen?", lang: "de" },
      ]),
      make("TKT-38613", "08:52", [{ q: "What worked before?", lang: "en" }]),
      make("TKT-17628", "08:21", [{ q: "Why this route?", lang: "en" }]),
    ],
    active: {},
  }
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const { find, state } = useCases()
  const { lang, setLang } = useI18n()
  const [data, setData] = React.useState(seed)

  const store = React.useMemo<Store>(() => {
    const byId = (id: string) => data.conversations.find((c) => c.id === id) ?? null
    const current = (ticketId: string) => {
      const id = data.active[ticketId]
      return id ? byId(id) : null
    }
    return {
      conversations: data.conversations,
      current,
      byId,
      ask: (ticketId, question, conversationId) => {
        const c = find(ticketId)
        if (!c) return ""
        const target = nextLanguage(lang, question)
        if (target !== lang) setLang(target)
        const answer = respond(c, state[ticketId] ?? initialState(c), question, target)
        const id = conversationId ?? data.active[ticketId] ?? newId()
        setData((d) => {
          const existing = d.conversations.find((x) => x.id === id)
          const conv: Conversation = existing
            ? { ...existing, updated: now(), messages: [...existing.messages, { q: question, a: answer, done: false, live: true }] }
            : { id, ticketId, updated: now(), messages: [{ q: question, a: answer, done: false, live: true }] }
          return { conversations: [conv, ...d.conversations.filter((x) => x.id !== id)], active: { ...d.active, [ticketId]: id } }
        })
        // The "model" answers after a short pause (the real one streams).
        window.setTimeout(
          () =>
            setData((d) => ({
              ...d,
              conversations: d.conversations.map((x) => (x.id === id ? { ...x, messages: x.messages.map((m) => ({ ...m, done: true })) } : x)),
            })),
          700
        )
        return id
      },
      newChat: (ticketId) => {
        const before = data.active[ticketId] ?? null
        setData((d) => ({ ...d, active: { ...d.active, [ticketId]: null } }))
        return () => setData((d) => ({ ...d, active: { ...d.active, [ticketId]: before } }))
      },
      create: (ticketId) => {
        const id = newId()
        setData((d) => ({ conversations: [{ id, ticketId, updated: now(), messages: [] }, ...d.conversations], active: d.active }))
        return id
      },
      setTicket: (conversationId, ticketId) =>
        setData((d) => ({ ...d, conversations: d.conversations.map((x) => (x.id === conversationId ? { ...x, ticketId } : x)) })),
      remove: (ids) => {
        const snapshot = data
        setData((d) => ({
          conversations: d.conversations.filter((x) => !ids.includes(x.id)),
          active: Object.fromEntries(Object.entries(d.active).map(([t, c]) => [t, c && ids.includes(c) ? null : c])),
        }))
        return () => setData(snapshot)
      },
    }
  }, [data, find, state, lang, setLang])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useCopilot() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useCopilot must be used inside CopilotProvider")
  return ctx
}
