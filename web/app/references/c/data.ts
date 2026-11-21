// Direction C fixtures. Built on lib/mock.ts so the shapes match the API.
import { autoDraftBilling, escalatedOutage, volumeByHour } from "@/lib/mock"
import type { Language, PipelineResult, Priority, TicketType } from "@/lib/types"

export type Range = "1h" | "24h" | "7d"
export type VolumePoint = { t: string; high: number; medium: number; low: number }

// The mock clock is 10:47 today, so the 24h window ends at the 10:00 bucket and the
// 08:00–10:00 VPN burst sits at the live edge of the chart.
const NOW_HOUR = 10
const last24: VolumePoint[] = [
  ...volumeByHour.slice(NOW_HOUR + 1),
  ...volumeByHour.slice(0, NOW_HOUR + 1),
].map(({ hour, ...v }) => ({ t: hour, ...v }))

const WIGGLE = [0.7, 1.1, 1.3, 0.9, 1.2, 0.8, 1.4, 1.0, 0.9, 1.2, 0.8, 1.1]
const lastHour: VolumePoint[] = WIGGLE.map((w, i) => {
  const minute = 50 + i * 5
  const h = minute >= 60 ? 10 : 9
  const src = volumeByHour[h]
  return {
    t: `${String(h).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    high: Math.max(1, Math.round((src.high / 12) * w)),
    medium: Math.max(0, Math.round((src.medium / 12) * (2 - w))),
    low: Math.max(0, Math.round((src.low / 12) * w)),
  }
})

const sum = (pts: VolumePoint[], k: keyof Omit<VolumePoint, "t">) => pts.reduce((a, p) => a + p[k], 0)
const DAY_FACTOR = [0.55, 1.08, 1.12, 1.04, 1.1, 0.97]
const DAYS = ["Sun 15", "Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"]
const full = volumeByHour.map(({ hour, ...v }) => ({ t: hour, ...v }))
const todaySoFar = full.slice(0, NOW_HOUR + 1)
const lastWeek: VolumePoint[] = [
  ...DAYS.map((t, i) => ({
    t,
    high: Math.round(8 * DAY_FACTOR[i]),
    medium: Math.round(sum(full, "medium") * DAY_FACTOR[i]),
    low: Math.round(sum(full, "low") * DAY_FACTOR[i]),
  })),
  { t: "Sat 21", high: sum(todaySoFar, "high"), medium: sum(todaySoFar, "medium"), low: sum(todaySoFar, "low") },
]

export const VOLUME: Record<Range, { points: VolumePoint[]; hours: number; unit: string; burst?: [string, string] }> = {
  "1h": { points: lastHour, hours: 1, unit: "per 5 min" },
  "24h": { points: last24, hours: 24, unit: "per hour", burst: ["08:00", "10:00"] },
  "7d": { points: lastWeek, hours: 24 * 6 + NOW_HOUR + 1, unit: "per day", burst: ["Sat 21", "Sat 21"] },
}

export type KpiSeries = { t: string; v: number }[]
export type Kpi = {
  key: string
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "flat"
  tone: "neutral" | "warning" | "critical" | "success"
  hint: string
  series: KpiSeries
  color: string
}

// Recall on high-priority incidents comes from the holdout split; it only moves with retrains.
const RECALL = [0.95, 0.95, 0.96, 0.95, 0.94, 0.94, 0.95, 0.94, 0.95, 0.94, 0.94, 0.94]

export function kpisFor(range: Range): Kpi[] {
  const { points, hours } = VOLUME[range]
  const total = points.map((p) => p.high + p.medium + p.low)
  const all = total.reduce((a, b) => a + b, 0)
  const escalated = points.map((p) => p.high + Math.round(p.medium * 0.12))
  const escRate = escalated.reduce((a, b) => a + b, 0) / all
  // p95 end-to-end latency tracks load: Gemini drafts queue up during the burst.
  const p95 = points.map((p, i) => Math.round(1380 + (p.high + p.medium + p.low) * (range === "7d" ? 0.9 : range === "1h" ? 110 : 11) + ((i * 37) % 60)))
  const p95Sorted = [...p95].sort((a, b) => a - b)
  const p95Value = p95Sorted[Math.min(p95Sorted.length - 1, Math.floor(p95Sorted.length * 0.95))]
  const perHour = all / hours

  return [
    {
      key: "tph",
      label: "Tickets / hr",
      value: perHour.toFixed(1),
      delta: range === "1h" ? "+64% vs prior hour" : range === "24h" ? "+38% vs prior 24h" : "+9% vs prior week",
      trend: "up",
      tone: "neutral",
      hint: `${all.toLocaleString()} tickets in ${range}`,
      series: points.map((p, i) => ({ t: p.t, v: total[i] })),
      color: "var(--chart-1)",
    },
    {
      key: "esc",
      label: "Escalation rate",
      value: `${(escRate * 100).toFixed(1)}%`,
      delta: range === "7d" ? "+2.1 pts vs prior week" : "+6.4 pts vs baseline",
      trend: "up",
      tone: "warning",
      hint: "Sent to the on-call engineer",
      series: points.map((p, i) => ({ t: p.t, v: Number(((escalated[i] / total[i]) * 100).toFixed(1)) })),
      color: "var(--warning)",
    },
    {
      key: "recall",
      label: "High-priority incident recall",
      value: "94.1%",
      delta: "Holdout split, model v3",
      trend: "flat",
      tone: "success",
      hint: "Missed high-priority incidents: 5.9%",
      series: points.map((p, i) => ({ t: p.t, v: RECALL[i % RECALL.length] * 100 })),
      color: "var(--success)",
    },
    {
      key: "p95",
      label: "p95 end-to-end latency",
      value: `${(p95Value / 1000).toFixed(2)} s`,
      delta: "Draft stage is 87% of it",
      trend: "up",
      tone: "neutral",
      hint: "Triage, retrieval, gate and draft",
      series: points.map((p, i) => ({ t: p.t, v: p95[i] })),
      color: "var(--chart-5)",
    },
  ]
}

// Arrivals of the VPN cluster, per 10 minutes since first seen at 08:12.
export const OUTAGE = {
  title: "VPN gateway outage suspected",
  ticketCount: 23,
  firstSeen: "08:12",
  queues: ["Technical Support", "IT Support", "Service Outages and Maintenance"],
  languages: "EN 17 · DE 6",
  arrivals: [1, 2, 4, 3, 5, 3, 2, 1, 1, 0, 1, 0, 0, 0, 0].map((v, i) => {
    const m = 12 + i * 10
    return { t: `${String(8 + Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, v }
  }),
}

export type IncidentBrief = {
  summary: string
  cause: string
  pastFix: string
  steps: string[]
}

export type Detail = {
  result: PipelineResult
  brief?: IncidentBrief
  // Sentences that carry a claim with no precedent behind it.
  flagged?: { sentence: string; note: string }[]
}

const outageBrief: IncidentBrief = {
  summary:
    "23 tickets since 08:12 report remote clinicians unable to hold a VPN session; EMR and telemedicine are unreachable from outside the network. The pattern is gateway-wide, not individual clients.",
  cause:
    "Expired VPN gateway certificate, as in [TKT-04187]. Second candidate: a firewall rule from last night's change window, as in [TKT-02256].",
  pastFix: "Renewed the gateway certificate and restarted the gateway service; service restored within 40 minutes [TKT-04187].",
  steps: [
    "Check the certificate expiry on the VPN gateway.",
    "Diff firewall rules changed in last night's window [TKT-02256].",
    "Post a status update to clinics and link the 23 cluster tickets to this incident.",
  ],
}

const outageDe: PipelineResult = {
  ...escalatedOutage,
  triage: { ...escalatedOutage.triage, language: "de", priority_conf: 0.81 },
  draft: {
    ...escalatedOutage.draft,
    reply:
      "Vielen Dank für Ihre Meldung. Wir behandeln dies als vorrangige Störung, und ein Techniker wurde bereits alarmiert [TKT-04187]. In einem ähnlichen Fall war das Zertifikat des VPN-Gateways abgelaufen; nach der Erneuerung lief der Dienst wieder [TKT-04187]. Wir melden uns, sobald die Ursache bestätigt ist.",
  },
  timings_ms: { triage_ms: 41, retrieval_ms: 118, gate_ms: 4, draft_ms: 1425, total_ms: 1588 },
}

const passwordReset: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.91,
    queue: "IT Support",
    queue_conf: 0.95,
    priority: "low",
    priority_conf: 0.88,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-05520",
      similarity: 0.91,
      subject: "Password reset email link expired",
      body_snippet: "The reset link says it has expired, even though I clicked it the same day.",
      answer_snippet: "Reset links expire 30 minutes after they are sent. We issued a fresh link and confirmed the user could sign in.",
      language: "en",
    },
    {
      ticket_id: "TKT-09014",
      similarity: 0.84,
      subject: "Locked out after password reset",
      body_snippet: "After resetting my password I now get 'account locked'.",
      answer_snippet:
        "The account locked after five failed attempts. We unlocked it and the user reset the password through the self-service portal.",
      language: "en",
    },
    {
      ticket_id: "TKT-01377",
      similarity: 0.76,
      subject: "Passwort zurücksetzen funktioniert nicht",
      body_snippet: "Der Link zum Zurücksetzen öffnet nur eine Fehlerseite.",
      answer_snippet: "Der Link war abgelaufen; wir haben einen neuen Link gesendet.",
      language: "de",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Thanks for reaching out. Password reset links expire 30 minutes after they are sent, so we have issued a fresh link to your work email [TKT-05520]. If the account shows as locked after several attempts, reply here and we will unlock it [TKT-09014].",
    cited_ticket_ids: ["TKT-05520", "TKT-09014"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 31, retrieval_ms: 94, gate_ms: 3, draft_ms: 980, total_ms: 1108 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const printer: PipelineResult = {
  triage: {
    type: "Incident",
    type_conf: 0.58,
    queue: "IT Support",
    queue_conf: 0.52,
    priority: "medium",
    priority_conf: 0.61,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-06642",
      similarity: 0.8,
      subject: "Floor printer offline after network change",
      body_snippet: "The shared printer on our floor shows offline for everyone since this morning.",
      answer_snippet: "The printer had lost its DHCP reservation. We re-added the reservation and power-cycled the printer.",
      language: "en",
    },
    {
      ticket_id: "TKT-08105",
      similarity: 0.72,
      subject: "Drucker im 2. OG druckt nicht",
      body_snippet: "Aufträge bleiben in der Warteschlange hängen.",
      answer_snippet: "Der Druckerspooler auf dem Printserver hing; ein Neustart des Dienstes hat das Problem behoben.",
      language: "de",
    },
  ],
  escalate: true,
  reasons: ["Queue confidence 52% is below the 60% gate", "Type confidence 58% is below the 60% gate"],
  draft: {
    reply:
      "Thanks for letting us know. An engineer will check the printer's network reservation, which caused the same symptom on another floor [TKT-06642]. We will confirm here once printing works again.",
    cited_ticket_ids: ["TKT-06642"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 36, retrieval_ms: 104, gate_ms: 4, draft_ms: 1320, total_ms: 1464 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const printerBrief: IncidentBrief = {
  summary: "Three users on the 3rd floor report the shared printer offline. Routing is uncertain between IT Support and Technical Support.",
  cause: "Lost DHCP reservation after a network change, as in [TKT-06642]. Alternative: a hung print spooler, as in [TKT-08105].",
  pastFix: "Re-added the DHCP reservation and power-cycled the printer [TKT-06642].",
  steps: [
    "Ping the printer and check its DHCP lease.",
    "If the lease is intact, restart the spooler on the print server [TKT-08105].",
    "Confirm the queue as IT Support so the next one routes itself.",
  ],
}

export const DETAILS = {
  outage: { result: escalatedOutage, brief: outageBrief },
  outageDe: { result: outageDe, brief: outageBrief },
  billing: {
    result: autoDraftBilling,
    flagged: [
      {
        sentence: "Wir garantieren Ihnen außerdem eine Gutschrift für den nächsten Monat.",
        note: "Uncited promise: no precedent offers a credit for next month.",
      },
    ],
  },
  password: { result: passwordReset },
  printer: { result: printer, brief: printerBrief },
} satisfies Record<string, Detail>

export type DetailKey = keyof typeof DETAILS

export type TicketRow = {
  id: string
  subject: string
  body: string
  received: string
  age: string
  language: Language
  type: TicketType
  priority: Priority
  queue: string
  minConf: number
  escalate: boolean
  totalMs: number
  cluster: boolean
  detail: DetailKey
}

export const TICKETS: TicketRow[] = [
  {
    id: "TKT-12418",
    subject: "VPN gateway refusing connections for all remote clinics",
    body: "Since about 8 this morning none of our remote clinicians can connect to the VPN. The EMR integration is unreachable and we have patients waiting.",
    received: "10:45",
    age: "2m",
    language: "en",
    type: "Incident",
    priority: "high",
    queue: "Technical Support",
    minConf: 0.77,
    escalate: true,
    totalMs: 1614,
    cluster: true,
    detail: "outage",
  },
  {
    id: "TKT-12417",
    subject: "Rechnung doppelt abgebucht",
    body: "Guten Tag, die Novemberrechnung wurde zweimal von unserem Konto abgebucht. Bitte erstatten Sie den doppelten Betrag.",
    received: "10:43",
    age: "4m",
    language: "de",
    type: "Request",
    priority: "medium",
    queue: "Billing and Payments",
    minConf: 0.64,
    escalate: false,
    totalMs: 1346,
    cluster: false,
    detail: "billing",
  },
  {
    id: "TKT-12416",
    subject: "Kein VPN-Zugang seit heute Morgen",
    body: "Seit heute Morgen kann sich niemand aus dem Homeoffice per VPN verbinden. Der Client bricht nach dem Login ab.",
    received: "10:41",
    age: "6m",
    language: "de",
    type: "Incident",
    priority: "high",
    queue: "Technical Support",
    minConf: 0.81,
    escalate: true,
    totalMs: 1588,
    cluster: true,
    detail: "outageDe",
  },
  {
    id: "TKT-12415",
    subject: "Password reset link expired before I could use it",
    body: "I requested a password reset an hour ago and the link now says it has expired. Can you send a new one?",
    received: "10:38",
    age: "9m",
    language: "en",
    type: "Request",
    priority: "low",
    queue: "IT Support",
    minConf: 0.88,
    escalate: false,
    totalMs: 1108,
    cluster: false,
    detail: "password",
  },
  {
    id: "TKT-12414",
    subject: "EMR unreachable from home office, VPN times out",
    body: "Working from home today. The VPN times out after the MFA prompt, so I cannot open patient records.",
    received: "10:36",
    age: "11m",
    language: "en",
    type: "Incident",
    priority: "high",
    queue: "Technical Support",
    minConf: 0.79,
    escalate: true,
    totalMs: 1702,
    cluster: true,
    detail: "outage",
  },
  {
    id: "TKT-12413",
    subject: "Printer on 3rd floor shows offline for everyone",
    body: "The shared printer by the 3rd floor kitchen shows offline on every laptop. Three of us have tried.",
    received: "10:33",
    age: "14m",
    language: "en",
    type: "Incident",
    priority: "medium",
    queue: "IT Support",
    minConf: 0.52,
    escalate: true,
    totalMs: 1464,
    cluster: false,
    detail: "printer",
  },
  {
    id: "TKT-12412",
    subject: "Telemedicine video calls fail to start",
    body: "None of my afternoon video consultations will start. The app says it cannot reach the server.",
    received: "10:30",
    age: "17m",
    language: "en",
    type: "Incident",
    priority: "high",
    queue: "Service Outages and Maintenance",
    minConf: 0.74,
    escalate: true,
    totalMs: 1655,
    cluster: true,
    detail: "outage",
  },
]

// End-to-end latency by stage over the selected window. p95 total matches the KPI tile.
export const STAGE_LATENCY = [
  { name: "p50", triage_ms: 34, retrieval_ms: 101, gate_ms: 3, draft_ms: 1190 },
  { name: "p95", triage_ms: 52, retrieval_ms: 168, gate_ms: 6, draft_ms: 1560 },
  { name: "p95 VPN cluster", triage_ms: 49, retrieval_ms: 131, gate_ms: 5, draft_ms: 1490 },
]
