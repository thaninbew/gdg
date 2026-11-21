// Find a customer's ticket without its number. Port of retrieval/ticket_lookup.py for the console:
// ticket numbers first ("TKT-49389", "ticket 49389", "#49389", partial "4938"), otherwise BM25 over
// subject + body after a rewrite step that turns customer words into ticket vocabulary (EN + DE).
// The rewrite is a word list standing in for the LLM. Matches are shown to the operator only.
import STORE_JSON from "@/lib/ticket-store.json"
import type { Language, Priority, TicketCase } from "@/lib/types"

export interface StoredTicket {
  id: string
  s: string
  b: string
  l: string
  q: string
  t: string
  p: string
  r: number
}
export const STORE = STORE_JSON as StoredTicket[]

const STOP = new Set(
  `a an and are as at be been but by can could did do does for from had has have how i if in into is it its just me my no not of on or our please so some that the their them then there these they this to too up us was we were what when where which while who why will with would you your hello hi dear thanks thank team support customer issue problem help need regarding about since after before also still any der die das und ist ich wir sie es ein eine einen dem den des mit von zu im in auf für nicht bitte hallo sehr geehrte geehrtes danke vielen unser unsere uns seit nach bei wurde werden haben hat keeps every now then think get people work done don't dont doesn't doesnt isn't isnt add stopped working super`.split(/\s+/)
)
const tok = (s: string) =>
  (String(s || "").match(/[a-z0-9äöüß][a-z0-9äöüß.+#-]*[a-z0-9+#]|[a-z0-9äöüß]/gi) ?? []).map((w) => w.toLowerCase()).filter((w) => !STOP.has(w))

const DOCS = STORE.map((x) => tok(`${x.s} ${x.s} ${x.b}`))
const TF = DOCS.map((d) => d.reduce<Record<string, number>>((m, w) => ((m[w] = (m[w] ?? 0) + 1), m), {}))
const AVG = DOCS.reduce((a, d) => a + d.length, 0) / DOCS.length
const DF: Record<string, number> = {}
TF.forEach((tf) => Object.keys(tf).forEach((w) => (DF[w] = (DF[w] ?? 0) + 1)))
const IDF = (w: string) => Math.log(1 + (DOCS.length - (DF[w] ?? 0) + 0.5) / ((DF[w] ?? 0) + 0.5))

// Customer words -> ticket vocabulary (stand-in for the LLM's rewrite step).
const REWRITE: [RegExp, string[]][] = [
  [/lag|slow|sluggish|freez|langsam|hängt/, ["slow", "delays", "performance", "verzögerungen"]],
  [/bill|charged|invoic/, ["invoice", "invoices", "billing", "discrepancies", "rechnung"]],
  [/patient|medical|health record/, ["medical", "data", "patientendaten", "medizinische"]],
  [/password|kennwort|passwort/, ["password", "passwort", "kennwort"]],
  [/printer|drucker|print/, ["printer", "drucker", "druckertreiber", "driver"]],
  [/refund|money back|erstatt/, ["refund", "erstattung"]],
  [/encrypt|verschlüssel/, ["encryption", "verschlüsselung"]],
  [/crash|absturz/, ["crash", "absturz"]],
  [/log ?in|sign ?in|anmeld/, ["login", "anmeldung"]],
  [/sync|synchron/, ["sync", "synchronization", "synchronisation"]],
  [/drop|disconnect|intermittent|fällt aus/, ["intermittent", "disconnect", "fällt", "aus"]],
  [/outage|down|ausfall/, ["outage", "ausfall"]],
  [/project manag|projektverwalt|projektmanag/, ["project", "management", "tool", "projektverwaltungstools"]],
  [/breach|leak|unauthori/, ["breach", "unauthorized", "verletzung"]],
]
export function rewrite(text: string) {
  const t = text.toLowerCase()
  const out = new Set(tok(text).filter((w) => w.length > 2))
  REWRITE.forEach(([re, words]) => re.test(t) && words.forEach((w) => out.add(w)))
  return [...out]
}

// A number only counts as a ticket number when it's marked as one, or is the whole query.
const TICKET_NO = /(?:\btkt[-\s]?|\bticket\s*(?:no\.?|nr\.?|number|#)?\s*|#|\bnr\.?\s*)(\d{3,5})\b/gi
const BARE_NO = /^\s*(?:tkt[-\s]?)?#?(\d{3,5})\s*$/i
export function ticketNumbers(s: string) {
  const m = s.match(BARE_NO)
  return m ? [m[1]] : [...s.matchAll(TICKET_NO)].map((x) => x[1])
}

export type MatchLevel = "exact" | "number" | "strong" | "partial" | "weak"
export interface Match {
  ticket: StoredTicket
  hit: string[]
  level: MatchLevel
}
export interface SearchResult {
  terms: string[]
  byNumber: boolean
  matches: Match[]
  /** Words that tell the top two apart, when they're too close to call. */
  ask: [string[], string[]] | null
}

function byNumber(nums: string[], k = 5): Match[] {
  const out: Match[] = []
  for (const d of nums) {
    const full = d.length === 5 ? `TKT-${d}` : null
    STORE.filter((x) => x.id === full).forEach((x) => out.push({ ticket: x, hit: [x.id], level: "exact" }))
    STORE.filter((x) => x.id !== full && x.id.includes(d)).forEach((x) => out.push({ ticket: x, hit: [d], level: "number" }))
  }
  return out.filter((x, i) => out.findIndex((y) => y.ticket.id === x.ticket.id) === i).slice(0, k)
}

export function searchTerms(terms: string[], k = 5, margin = 0.15): SearchResult {
  const q = terms.flatMap(tok)
  if (!q.length) return { terms, byNumber: false, matches: [], ask: null }
  const bm = TF.map((tf, i) =>
    q.reduce((s, w) => {
      const f = tf[w]
      return f ? s + (IDF(w) * f * 2.5) / (f + 1.5 * (0.25 + (0.75 * DOCS[i].length) / AVG)) : s
    }, 0)
  )
  const top = bm
    .map((s, i) => [s, i] as const)
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, k)
    .map(([, i]) => i)
  if (!top.length) return { terms, byNumber: false, matches: [], ask: null }
  const qs = new Set(q)
  const best = bm[top[0]]
  const matches: Match[] = top.map((i) => {
    const words = new Set(DOCS[i])
    const hit = [...qs].filter((w) => words.has(w)).sort((a, b) => IDF(b) - IDF(a))
    const cov = hit.length / qs.size
    const rel = bm[i] / best
    return { ticket: STORE[i], hit, level: cov >= 0.35 && rel >= 0.8 ? "strong" : cov >= 0.15 || rel >= 0.6 ? "partial" : "weak" }
  })
  let ask: SearchResult["ask"] = null
  if (top.length > 1 && (bm[top[0]] - bm[top[1]]) / bm[top[0]] < margin) {
    const [a, b] = top.slice(0, 2).map((i) => new Set(DOCS[i].filter((w) => !qs.has(w))))
    const only = (x: Set<string>, y: Set<string>) => [...x].filter((w) => !y.has(w) && w.length > 3).sort((m, n) => IDF(n) - IDF(m)).slice(0, 3)
    ask = [only(a, b), only(b, a)]
  }
  return { terms, byNumber: false, matches, ask }
}

/** What the operator typed: a ticket number, or the customer's words. */
export function findTicket(said: string): SearchResult {
  const nums = ticketNumbers(said)
  if (nums.length) return { terms: nums.map((n) => (n.length === 5 ? `TKT-${n}` : n)), byNumber: true, matches: byNumber(nums), ask: null }
  return searchTerms(rewrite(said))
}
export function searchNumbers(terms: string[]): SearchResult {
  const nums = terms.map((x) => x.replace(/\D/g, "")).filter(Boolean)
  return { terms, byNumber: true, matches: byNumber(nums), ask: null }
}

export const EXAMPLES: Record<Language, string[]> = {
  en: ["TKT-49389", "ticket 4938", "They refunded me the wrong amount today", "Our printer keeps dropping out, I think it's the driver", "The project management app is super laggy"],
  de: ["TKT-49389", "Ticket 4938", "Sie haben mir heute den falschen Betrag erstattet", "Unser Drucker fällt immer wieder aus, ich glaube, es liegt am Treiber", "Die Projektmanagement-App ist extrem langsam"],
}

const PRIO: Record<string, Priority> = { high: "high", medium: "medium", low: "low" }
/** A stored ticket opened from search: the dataset's labels, not triaged yet, so no precedents or draft. */
export function caseFromStore(x: StoredTicket): TicketCase {
  const lang: Language = x.l === "de" ? "de" : "en"
  return {
    ticket_id: x.id,
    subject: x.s || "(no subject)",
    body: x.b,
    received: "",
    dataset: { row: x.r, type: x.t || null, queue: x.q, priority: x.p },
    category: "",
    note: "Opened from Find a ticket. It hasn't been through triage in this demo, so there are no past tickets or draft yet. The labels shown are the dataset's.",
    route: "Service desk review",
    triage: { type: (["Incident", "Request", "Problem", "Change"].includes(x.t) ? x.t : "Request") as TicketCase["triage"]["type"], type_conf: 1, queue: x.q, queue_conf: 1, priority: PRIO[x.p] ?? "medium", priority_conf: 1, language: lang, key_terms: [] },
    precedents: [],
    draft: { reply: "", cited_ticket_ids: [], grounded: false, issues: [], sentences: [] },
    clarifications: [],
    timings_ms: { triage_ms: 0, retrieval_ms: 0, gate_ms: 0, draft_ms: 0, total_ms: 0 },
    sources: { triage: "mock", retrieve: "mock", gate: "mock", draft: "mock" },
  }
}
