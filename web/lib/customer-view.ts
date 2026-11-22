// What the customer may see of a ticket. The console holds far more (triage scores, gate reasons,
// precedents from other customers, copilot notes); none of that crosses over. Only what an operator
// explicitly sends (a reply, a question) and a plain status are shown on the customer's side.
import type { Language, Priority } from "@/lib/types"

export type CustomerPost =
  | { kind: "reply"; text: string; at: string }
  | { kind: "question"; text: string; at: string }
  | { kind: "assigned"; team: string; urgent: boolean; at: string }

export type CustomerStatus = "received" | "working" | "needs-you" | "answered" | "with-team" | "urgent"

export interface CustomerView {
  status: CustomerStatus
  /** Short status line in the customer's language. */
  label: string
  /** Newest last. Only content an operator sent, plus the team assignment. */
  posts: CustomerPost[]
}

// Internal queue names, as a customer would read them.
const TEAM: Record<string, { en: string; de: string }> = {
  "Technical Support": { en: "technical support", de: "technischen Support" },
  "Product Support": { en: "product support", de: "Produktsupport" },
  "Customer Service": { en: "customer service", de: "Kundenservice" },
  "IT Support": { en: "IT support", de: "IT-Support" },
  "Billing and Payments": { en: "billing", de: "Abrechnung" },
  "Returns and Exchanges": { en: "returns", de: "Rücksendungen" },
  "Service Outages and Maintenance": { en: "operations", de: "Betrieb" },
  "Sales and Pre-Sales": { en: "sales", de: "Vertrieb" },
  "Human Resources": { en: "HR", de: "Personalwesen" },
  "General Inquiry": { en: "support", de: "Support" },
}

export function teamName(queue: string, lang: Language) {
  return (TEAM[queue] ?? TEAM["General Inquiry"])[lang]
}

/** Customer-facing text never carries internal citations like [TKT-12345]: those are other customers' tickets. */
export function stripCitations(text: string) {
  return text.replace(/\s*\[TKT-\d{5}(?:\s*,\s*TKT-\d{5})*\]/g, "").replace(/[ \t]+\n/g, "\n").trim()
}

const LABEL: Record<CustomerStatus, { en: string; de: string }> = {
  received: { en: "Received", de: "Eingegangen" },
  working: { en: "We're working on it", de: "In Bearbeitung" },
  "needs-you": { en: "Waiting for your reply", de: "Wartet auf Ihre Antwort" },
  answered: { en: "Answered", de: "Beantwortet" },
  "with-team": { en: "With our team", de: "Bei unserem Team" },
  urgent: { en: "On-call is on it", de: "Bereitschaft kümmert sich" },
}

export function statusLabel(status: CustomerStatus, lang: Language, team?: string) {
  if (status === "with-team" && team) return lang === "de" ? `Beim Team ${team}` : `With our ${team} team`
  return LABEL[status][lang]
}

/** Status the customer sees, from what's been sent so far. Internal outcome is not exposed. */
export function customerView(posts: CustomerPost[], lang: Language): CustomerView {
  const last = posts.at(-1)
  if (!last) return { status: "received", label: statusLabel("received", lang), posts }
  if (last.kind === "reply") return { status: "answered", label: statusLabel("answered", lang), posts }
  if (last.kind === "question") return { status: "needs-you", label: statusLabel("needs-you", lang), posts }
  const status: CustomerStatus = last.urgent ? "urgent" : "with-team"
  return { status, label: statusLabel(status, lang, last.team), posts }
}

/** The post an escalation sends: just the team, never the gate's reasons. */
export function assignment(queue: string, priority: Priority, lang: Language, urgent: boolean, at: string): CustomerPost {
  return { kind: "assigned", team: teamName(queue, lang), urgent: urgent && priority === "high", at }
}
