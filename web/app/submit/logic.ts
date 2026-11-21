// Customer-side routing for /submit. Deterministic, local and read-only: no model call, no
// network, no actions. Swap `analyze`/`resolve` for the pipeline once a local endpoint exists.

export type Topic = "billing" | "broken" | "question" | "improvement"

export type Account = {
  name: string
  org: string
  initials: string
  criticalCare: boolean
}

export const ACCOUNTS = {
  weber: { name: "Jana Weber", org: "Weber Family Practice", initials: "JW", criticalCare: false },
  northside: { name: "Amara Okafor", org: "Northside Family Clinic", initials: "AO", criticalCare: true },
} satisfies Record<string, Account>

export type AccountId = keyof typeof ACCOUNTS

export type Sample = { id: string; label: string; topic: Topic | null; text: string; account: AccountId }

export const SAMPLES: Sample[] = [
  {
    id: "breakdown",
    label: "Invoice breakdown",
    topic: "billing",
    text: "Can you break down the charges on my latest invoice? The total is higher than last month.",
    account: "weber",
  },
  {
    id: "charged-twice",
    label: "Charged twice",
    topic: null,
    text: "Our business account shows two identical debits today for the November invoice (RE-2026-11-0482, €249.00 each). Please check this and refund the duplicate amount.",
    account: "weber",
  },
  {
    id: "signout",
    label: "Keeps signing out",
    topic: "broken",
    text: "The desktop app keeps signing me out every few minutes since I reset my password this morning.",
    account: "weber",
  },
  {
    id: "outage",
    label: "VPN outage",
    topic: null,
    text: "VPN is down for all of our remote clinicians since 08:10. Nobody off-site can reach the EMR and our 09:00 telehealth appointments are at risk.",
    account: "northside",
  },
  {
    id: "improvement",
    label: "Improvement idea",
    topic: "improvement",
    text: "It would help if we could export the monthly usage report as CSV for our finance team.",
    account: "weber",
  },
]

// Seeded IDs shared with the guided demo; everything else gets a stable hash-based ID.
const SEEDED_IDS: Record<string, string> = { "charged-twice": "TKT-20418", outage: "TKT-20431" }

// ---------- sample records (read-only) ----------

export type InvoiceLine = { item: string; qty: number; unit: number }
export type Invoice = { id: string; period: string; paid: string; lines: InvoiceLine[]; vatRate: number }

const INVOICES: Record<AccountId, Invoice[]> = {
  weber: [
    {
      id: "INV-2026-1104",
      period: "November 2026",
      paid: "Paid 3 Nov",
      vatRate: 0.19,
      lines: [
        { item: "Practice plan, per seat", qty: 12, unit: 18 },
        { item: "Telehealth add-on", qty: 1, unit: 45 },
        { item: "Extra storage, 50 GB", qty: 1, unit: 12 },
      ],
    },
    {
      id: "INV-2026-1032",
      period: "October 2026",
      paid: "Paid 3 Oct",
      vatRate: 0.19,
      lines: [
        { item: "Practice plan, per seat", qty: 12, unit: 18 },
        { item: "Extra storage, 50 GB", qty: 1, unit: 12 },
      ],
    },
  ],
  northside: [],
}

export function invoicesFor(account: AccountId) {
  return INVOICES[account]
}

export function invoiceTotals(inv: Invoice) {
  const subtotal = inv.lines.reduce((s, l) => s + l.qty * l.unit, 0)
  const vat = Math.round(subtotal * inv.vatRate * 100) / 100
  return { subtotal, vat, total: subtotal + vat }
}

export type Precedent = { id: string; subject: string }

const PRECEDENTS: Record<string, Precedent> = {
  "TKT-03990": { id: "TKT-03990", subject: "Sign-in loop after password reset" },
}

// ---------- analysis ----------

const SECURITY = /\b(breach(ed)?|hacked|ransomware|compromised|data (loss|leak)|malware)\b/i
const OUTAGE =
  /\b(down|outage|offline|unreachable|can'?t (connect|reach|access|log ?in)|cannot (connect|reach|access|log ?in)|no access|stopped working)\b/i
const WIDE =
  /\b(everyone|everybody|nobody|no one|company-wide|(whole|entire) (team|company|office|practice|clinic)|all (of )?(our |the )?(remote )?(users|staff|clinicians|employees|locations|sites|offices|customers|team))\b/i
const REFUND = /\b(refund|reimburs\w*|charged twice|double[- ]charged|duplicate (charge|debit|amount)|dispute|chargeback|money back)\b/i
const INVOICE_REF = /\b(INV-\d{4}-\d{4}|RE-\d{4}-\d{2}-\d{4})\b/i
const BREAKDOWN =
  /\b(break ?down|line items?|itemi[sz]e|explain|statement|what (is|are) (this|these|the) charges?|(higher|more) than (last|usual))\b/i
const BILLING = /\b(invoice|bill|billing|charge[sd]?|payment|receipt|statement|debit|vat|fee)\b/i
const IMPROVE = /\b(would (help|be (nice|great|useful))|feature|could you add|please add|improve|suggest(ion)?|wish|idea)\b/i
const BROKEN =
  /\b(error|not working|broken|crash\w*|fail\w*|bug|keeps|stuck|won'?t|can'?t|cannot|sign(s|ing)? me out|log(s|ging)? me out)\b/i
const QUESTION = /\?|\b(how (do|can|to)|what is|where (do|can|is))\b/i
const SIGNOUT = /\b(sign(s|ing|ed)? (me )?out|log(s|ging|ged)? (me )?out|password)\b/i

export type Question =
  | { kind: "invoice"; prompt: string; why: string; options: string[] }
  | { kind: "scope"; prompt: string; why: string; options: Scope[] }

export type Scope = "Just me" | "A few people" | "Everyone"

export type Analysis = { topic: Topic | null; critical: string[] | null; question: Question | null }

export function inferTopic(text: string): Topic | null {
  if (BILLING.test(text) || REFUND.test(text)) return "billing"
  if (IMPROVE.test(text)) return "improvement"
  if (BROKEN.test(text) || OUTAGE.test(text)) return "broken"
  if (QUESTION.test(text)) return "question"
  return null
}

function criticalReasons(text: string, account: Account): string[] | null {
  if (SECURITY.test(text)) return ["Possible security incident"]
  if (!OUTAGE.test(text)) return null
  if (WIDE.test(text)) return ["Outage affecting many people", ...(account.criticalCare ? ["Critical-care account"] : [])]
  if (account.criticalCare) return ["Outage on a critical-care account"]
  return null
}

// Urgent cases are checked first and never get a question.
export function analyze(text: string, chosen: Topic | null, accountId: AccountId): Analysis {
  const account = ACCOUNTS[accountId]
  const topic = chosen ?? inferTopic(text)
  const critical = criticalReasons(text, account)
  if (critical) return { topic, critical, question: null }

  if (topic === "billing" && BREAKDOWN.test(text) && !REFUND.test(text) && !INVOICE_REF.test(text)) {
    const options = invoicesFor(accountId).map((i) => i.id)
    if (options.length)
      return {
        topic,
        critical: null,
        question: { kind: "invoice", prompt: "Which invoice?", why: "So we can pull its line items.", options },
      }
  }
  if (topic === "broken" && !WIDE.test(text)) {
    return {
      topic,
      critical: null,
      question: {
        kind: "scope",
        prompt: "Who is affected?",
        why: "An outage goes to a different team.",
        options: ["Just me", "A few people", "Everyone"],
      },
    }
  }
  return { topic, critical: null, question: null }
}

// ---------- outcomes ----------

export type Team = "Billing" | "Technical support" | "Customer service" | "Product"

export type Outcome =
  | { kind: "urgent"; reasons: string[] }
  | { kind: "action"; invoice: Invoice; previous: Invoice | null }
  | { kind: "answer"; sentences: { text: string; source: Precedent }[] }
  | { kind: "handoff"; team: Team; reason: string }
  | { kind: "review" }

const TEAM: Record<Topic | "none", Team> = {
  billing: "Billing",
  broken: "Technical support",
  question: "Customer service",
  improvement: "Product",
  none: "Customer service",
}

export function handoff(topic: Topic | null, reason: string): Outcome {
  return { kind: "handoff", team: TEAM[topic ?? "none"], reason }
}

export function resolve(text: string, a: Analysis, answer: string | null, accountId: AccountId): Outcome {
  if (a.critical) return { kind: "urgent", reasons: a.critical }
  const topic = a.topic
  if (topic === "billing") {
    if (REFUND.test(text)) return handoff(topic, "Refunds and disputes are handled by a person.")
    if (!BREAKDOWN.test(text)) return handoff(topic, "A person will handle this billing request.")
    const ref = (answer ?? text.match(INVOICE_REF)?.[0] ?? "").trim().toUpperCase()
    const list = invoicesFor(accountId)
    const i = list.findIndex((inv) => inv.id === ref)
    if (i < 0) return handoff(topic, "We couldn't match that invoice to your account.")
    return { kind: "action", invoice: list[i], previous: list[i + 1] ?? null }
  }
  if (topic === "broken") {
    if (answer === "Everyone") return { kind: "urgent", reasons: ["Outage affecting many people"] }
    if (answer === "Just me" && SIGNOUT.test(text)) {
      const src = PRECEDENTS["TKT-03990"]
      return {
        kind: "answer",
        sentences: [
          { text: "This usually comes from a saved sign-in that still holds your old password.", source: src },
          {
            text: "Remove the saved SentinelDesk entry from your keychain or credential manager, then sign in again.",
            source: src,
          },
        ],
      }
    }
    return handoff(topic, "This needs a person to look at it.")
  }
  if (topic === "improvement") return { kind: "review" }
  return handoff(topic, "A person will answer this.")
}

// Stable per request: the same text and account always get the same ID.
export function ticketId(text: string, accountId: AccountId, sampleId: string | null): string {
  if (sampleId && SEEDED_IDS[sampleId]) {
    const sample = SAMPLES.find((s) => s.id === sampleId)
    if (sample && sample.text === text.trim()) return SEEDED_IDS[sampleId]
  }
  let h = 2166136261
  const s = `${accountId}\u0000${text.trim().replace(/\s+/g, " ").toLowerCase()}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return `TKT-${21000 + (h % 9000)}`
}
