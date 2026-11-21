// Direction B fixtures: the shared pipeline fixtures wrapped as inbox tickets, plus a few
// more tickets so the grouped list has realistic volume. Shapes follow lib/types.ts.
import { autoDraftBilling, escalatedOutage, volumeByHour } from "@/lib/mock"
import type { PipelineResult, Priority, TicketType } from "@/lib/types"

export type Group = "triage" | "escalated" | "drafted"
export type Field = "type" | "queue" | "priority"
export type FieldStatus = "suggested" | "accepted" | "changed"

export interface TicketState {
  group: Group
  byHand: boolean
  fields: Record<Field, { value: string; status: FieldStatus }>
}

export interface IncidentBrief {
  summary: string
  cause: string
  causeIds: string[]
  pastFix: string
  pastFixIds: string[]
  steps: string[]
}

export interface InboxTicket {
  id: string
  subject: string
  body: string
  customer: string
  receivedMin: number
  group: Group
  cluster?: string
  result: PipelineResult
  brief?: IncidentBrief
  // Draft sentences the grounding check could not support with a cited ticket.
  flagged?: string[]
}

// Labels of past tickets, used to explain each suggestion ("why").
export const PAST_LABELS: Record<string, { type: TicketType; queue: string; priority: Priority }> = {
  "TKT-04187": { type: "Incident", queue: "Technical Support", priority: "high" },
  "TKT-11902": { type: "Incident", queue: "Technical Support", priority: "medium" },
  "TKT-02256": { type: "Incident", queue: "IT Support", priority: "high" },
  "TKT-07731": { type: "Request", queue: "Billing and Payments", priority: "medium" },
  "TKT-03318": { type: "Problem", queue: "Billing and Payments", priority: "low" },
  "TKT-05512": { type: "Request", queue: "IT Support", priority: "low" },
  "TKT-09840": { type: "Request", queue: "IT Support", priority: "low" },
  "TKT-06025": { type: "Incident", queue: "Technical Support", priority: "high" },
  "TKT-08817": { type: "Problem", queue: "Technical Support", priority: "medium" },
  "TKT-03994": { type: "Request", queue: "IT Support", priority: "low" },
  "TKT-10233": { type: "Incident", queue: "IT Support", priority: "low" },
}

export const TYPE_OPTIONS: TicketType[] = ["Incident", "Request", "Problem", "Change"]
export const QUEUE_OPTIONS = [
  "Technical Support",
  "IT Support",
  "Billing and Payments",
  "Product Support",
  "Service Outages and Maintenance",
  "Customer Service",
  "Human Resources",
]
export const PRIORITY_OPTIONS: Priority[] = ["high", "medium", "low"]

const vpnBrief: IncidentBrief = {
  summary:
    "Remote clinicians at three sites lost VPN access within 18 minutes; EMR and telemedicine traffic that rides the tunnel is failing.",
  cause: "Expired certificate on the VPN gateway, which drops every tunnel at once.",
  causeIds: ["TKT-04187"],
  pastFix: "Renew the gateway certificate, restart the gateway service, ask users to reconnect.",
  pastFixIds: ["TKT-04187", "TKT-11902"],
  steps: [
    "Check the gateway certificate expiry date on vpn-gw-01.",
    "Compare with last night's firewall change window; roll back media-port rules if they changed.",
    "Post a holding reply to the clinic contacts and link this cluster to one incident.",
  ],
}

const outlookResult: PipelineResult = {
  triage: {
    type: "Problem",
    type_conf: 0.71,
    queue: "Technical Support",
    queue_conf: 0.66,
    priority: "medium",
    priority_conf: 0.54,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-08817",
      similarity: 0.82,
      subject: "Outlook prompts for password after Office update",
      body_snippet: "After the latest Office build, Outlook asks for credentials every few minutes.",
      answer_snippet:
        "Modern authentication was disabled by an old registry policy. We removed the policy and cleared cached credentials.",
      language: "en",
    },
    {
      ticket_id: "TKT-06025",
      similarity: 0.71,
      subject: "Mailbox unreachable for finance team",
      body_snippet: "Finance cannot open shared mailboxes since the morning.",
      answer_snippet: "A conditional-access rule blocked the finance group. We corrected the rule scope.",
      language: "en",
    },
  ],
  escalate: true,
  reasons: ["Priority confidence 54% is below the 60% gate", "Neighbors disagree on priority (medium vs high)"],
  draft: {
    reply:
      "Thanks for flagging this. A recent Office update can leave an old policy that disables modern sign-in, which causes repeated password prompts [TKT-08817]. We will remove that policy and clear the cached credentials on your device [TKT-08817]. An engineer will confirm once it is done.",
    cited_ticket_ids: ["TKT-08817"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 41, retrieval_ms: 104, gate_ms: 3, draft_ms: 1380, total_ms: 1528 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const passwordResult: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.94,
    queue: "IT Support",
    queue_conf: 0.88,
    priority: "low",
    priority_conf: 0.83,
    language: "de",
  },
  precedents: [
    {
      ticket_id: "TKT-05512",
      similarity: 0.9,
      subject: "Link zum Zurücksetzen des Passworts abgelaufen",
      body_snippet: "Der Link aus der E-Mail funktioniert nicht mehr.",
      answer_snippet:
        "Reset-Links sind 30 Minuten gültig. Wir haben einen neuen Link gesendet und das Konto entsperrt.",
      language: "de",
    },
    {
      ticket_id: "TKT-09840",
      similarity: 0.79,
      subject: "Password reset email never arrives",
      body_snippet: "I requested a reset three times and got nothing.",
      answer_snippet: "The reset mail was held by the spam filter. We released it and allow-listed the sender.",
      language: "en",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Vielen Dank für Ihre Nachricht. Links zum Zurücksetzen sind aus Sicherheitsgründen 30 Minuten gültig [TKT-05512]. Wir haben Ihnen soeben einen neuen Link gesendet und Ihr Konto entsperrt [TKT-05512]. Falls die E-Mail nicht ankommt, prüfen Sie bitte Ihren Spam-Ordner [TKT-09840].",
    cited_ticket_ids: ["TKT-05512", "TKT-09840"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 33, retrieval_ms: 91, gate_ms: 2, draft_ms: 1105, total_ms: 1231 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const laptopResult: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.96,
    queue: "IT Support",
    queue_conf: 0.9,
    priority: "low",
    priority_conf: 0.87,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-03994",
      similarity: 0.86,
      subject: "Laptop for new starter in accounting",
      body_snippet: "New hire starts Monday and needs a standard laptop.",
      answer_snippet:
        "We reserved a standard laptop, enrolled it in device management and scheduled pickup for the start date.",
      language: "en",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Thanks for the heads-up. We will reserve a standard laptop, enroll it in device management and have it ready for pickup on the start date [TKT-03994].",
    cited_ticket_ids: ["TKT-03994"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 30, retrieval_ms: 88, gate_ms: 2, draft_ms: 980, total_ms: 1100 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const printerResult: PipelineResult = {
  triage: {
    type: "Incident",
    type_conf: 0.88,
    queue: "IT Support",
    queue_conf: 0.81,
    priority: "low",
    priority_conf: 0.79,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-10233",
      similarity: 0.84,
      subject: "Floor printer offline after power cut",
      body_snippet: "The shared printer shows offline for everyone on the floor.",
      answer_snippet: "The printer picked up a new IP after the outage. We reserved its address and re-added the queue.",
      language: "en",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Thanks for reporting this. Shared printers sometimes pick up a new network address after a restart; we will reserve its address and re-add the print queue [TKT-10233].",
    cited_ticket_ids: ["TKT-10233"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 29, retrieval_ms: 95, gate_ms: 2, draft_ms: 1020, total_ms: 1146 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const vpnDe: PipelineResult = {
  ...escalatedOutage,
  triage: { ...escalatedOutage.triage, language: "de", priority_conf: 0.81 },
  draft: {
    ...escalatedOutage.draft,
    reply:
      "Vielen Dank für Ihre Meldung. Wir behandeln dies als Störung mit hoher Priorität und haben einen Techniker alarmiert [TKT-04187]. In einem ähnlichen Fall war das Zertifikat des VPN-Gateways abgelaufen [TKT-04187]. Wir melden uns, sobald die Ursache bestätigt ist.",
  },
  timings_ms: { triage_ms: 36, retrieval_ms: 118, gate_ms: 4, draft_ms: 1502, total_ms: 1660 },
}

export const TICKETS: InboxTicket[] = [
  {
    id: "TKT-12408",
    subject: "VPN down for all remote clinicians, EMR unreachable",
    body: "Since 08:40 none of our remote clinicians can connect to the VPN. The EMR integration times out for everyone working from home and we have patient calls booked all morning. Please treat this as urgent.",
    customer: "Northside Health Clinic",
    receivedMin: 2,
    group: "triage",
    cluster: "vpn",
    result: escalatedOutage,
    brief: vpnBrief,
  },
  {
    id: "TKT-12407",
    subject: "Doppelte Abbuchung der Novemberrechnung",
    body: "Guten Tag, die Rechnung für November wurde zweimal von unserem Geschäftskonto abgebucht. Bitte erstatten Sie den doppelten Betrag und bestätigen Sie mir kurz den Eingang.",
    customer: "Kanzlei Weber & Partner",
    receivedMin: 6,
    group: "triage",
    result: autoDraftBilling,
    flagged: ["Wir garantieren Ihnen außerdem eine Gutschrift für den nächsten Monat."],
  },
  {
    id: "TKT-12405",
    subject: "Telemedicine video calls fail to connect",
    body: "Our video consultations will not start this morning. The app shows 'connecting' and then drops. Staff in the office are fine, only people on VPN are affected.",
    customer: "Riverside Family Practice",
    receivedMin: 9,
    group: "triage",
    cluster: "vpn",
    result: { ...escalatedOutage, timings_ms: { triage_ms: 37, retrieval_ms: 109, gate_ms: 4, draft_ms: 1388, total_ms: 1538 } },
    brief: vpnBrief,
  },
  {
    id: "TKT-12402",
    subject: "Passwort-Zurücksetzung: Link abgelaufen",
    body: "Hallo, ich habe gestern einen Link zum Zurücksetzen meines Passworts bekommen, aber er funktioniert nicht mehr. Ich komme nicht in mein Konto.",
    customer: "Stadtwerke Ostfeld",
    receivedMin: 14,
    group: "triage",
    result: passwordResult,
  },
  {
    id: "TKT-12399",
    subject: "Outlook keeps asking for my password after update",
    body: "Since yesterday's Office update Outlook pops up a password prompt every few minutes. Entering it works for a while, then it asks again. Two colleagues have the same problem.",
    customer: "Halvorsen Logistics",
    receivedMin: 23,
    group: "triage",
    result: outlookResult,
    brief: {
      summary: "Repeated Outlook credential prompts for at least three users after the latest Office build.",
      cause: "A legacy registry policy disables modern authentication after the update.",
      causeIds: ["TKT-08817"],
      pastFix: "Remove the legacy policy and clear cached credentials.",
      pastFixIds: ["TKT-08817"],
      steps: [
        "Confirm the affected users are on the same Office build.",
        "Check for the legacy authentication policy in the device registry.",
        "Rule out a conditional-access change before touching devices.",
      ],
    },
  },
  {
    id: "TKT-12396",
    subject: "VPN trennt sich alle paar Minuten",
    body: "Seit heute Morgen trennt sich der VPN-Client ständig. Unsere Praxis kann keine Befunde aus dem EMR abrufen.",
    customer: "Praxis Dr. Lindner",
    receivedMin: 12,
    group: "escalated",
    cluster: "vpn",
    result: vpnDe,
    brief: vpnBrief,
  },
  {
    id: "TKT-12393",
    subject: "EMR integration unreachable from home offices",
    body: "Home-office staff get a gateway timeout when opening patient records. On-site machines work.",
    customer: "Northside Health Clinic",
    receivedMin: 17,
    group: "escalated",
    cluster: "vpn",
    result: escalatedOutage,
    brief: vpnBrief,
  },
  {
    id: "TKT-12388",
    subject: "Laptop for new hire starting Monday",
    body: "We have a new sales associate starting Monday. Could you prepare a standard laptop with the usual software?",
    customer: "Halvorsen Logistics",
    receivedMin: 41,
    group: "drafted",
    result: laptopResult,
  },
  {
    id: "TKT-12384",
    subject: "Third-floor printer shows offline",
    body: "The shared printer on the third floor shows offline for everyone since the power cut last night.",
    customer: "Stadtwerke Ostfeld",
    receivedMin: 55,
    group: "drafted",
    result: printerResult,
  },
]

export const OUTAGE = {
  cluster: "vpn",
  label: "VPN gateway failure",
  windowMin: 18,
  baseline: "4.1× baseline",
}

export const INBOUND_24H = volumeByHour.map((d) => ({ hour: d.hour, high: d.high, rest: d.medium + d.low }))
