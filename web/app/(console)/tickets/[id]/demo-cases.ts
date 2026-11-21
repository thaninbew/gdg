// Page-local demo cases for the shared demo IDs used by /submit (PR #21) and /demo.
// Hand-written fixtures, isolated to this page: not in the shared store, inbox or dashboard.
// Precedents are real kb tickets reused from lib/fixtures.ts; their similarity to these new
// requests is illustrative. Remove once the backend persists tickets under one ID.
import type { TicketCase } from "@/lib/types"

export interface DemoCustomer {
  name: string
  org: string
  criticalCare: boolean
  /** What the customer saw after sending on /submit. */
  sees: string
}

export interface BriefLine {
  label: string
  /** May cite [TKT-xxxxx]. */
  text: string
}

export type DemoCase = TicketCase & { customer: DemoCustomer; brief?: BriefLine[] }

const MOCK = { triage: "mock", retrieve: "mock", gate: "mock", draft: "mock" } as const

const BILLING_PRECEDENTS: TicketCase["precedents"] = [
  {
    ticket_id: "TKT-31649",
    similarity: 0.71,
    subject: "Query Regarding Billing Discrepancies",
    body_snippet: "",
    answer_snippet:
      "Acknowledged receipt of the email regarding the billing discrepancies across multiple digital product subscriptions for the marketing agency. We understand that the payment details have been verified and customer support has already been contacted. We appreciate the efforts being made to resolve this issue. We will investigate the matter further and would appreciate it if you could provide specific details on the subscriptions affected and the exact discrepancies being experienced. Additionally, knowing the dates of the disputed transactions and any relevant correspondence with customer support would be helpful. Please provide any further information needed.",
    language: "en",
    queue: "Billing and Payments",
    type: "Incident",
    priority: "medium",
  },
  {
    ticket_id: "TKT-56816",
    similarity: 0.68,
    subject: "Concern Regarding Billing Discrepancies",
    body_snippet: "",
    answer_snippet:
      "Acknowledging receipt of the email regarding the billing discrepancies across multiple digital product subscriptions for the marketing agency. We understand that payment details have been verified and customer support has already been contacted. We appreciate your efforts in resolving the issue. To proceed, could you please provide specific details on the subscriptions affected and the exact discrepancies you are experiencing? Additionally, it would be helpful to know the dates of the disputed transactions and any relevant correspondence with customer support. Thank you.",
    language: "en",
    queue: "Billing and Payments",
    type: "Incident",
    priority: "medium",
  },
  {
    ticket_id: "TKT-05423",
    similarity: 0.59,
    subject: "Concerns About Billing Variations",
    body_snippet: "",
    answer_snippet: "Please review the account and provide the necessary contact information related to the billing discrepancies.",
    language: "en",
    queue: "Billing and Payments",
    type: "Incident",
    priority: "low",
  },
]

const OUTAGE_PRECEDENTS: TicketCase["precedents"] = [
  {
    ticket_id: "TKT-59244",
    similarity: 0.63,
    subject: "System Outage Impacting Various Products Urgently",
    body_snippet: "",
    answer_snippet:
      "Received your email about the system outage affecting Django SAP ERP. I understand the urgency and am here to assist in restoring functionality as soon as possible. For a better investigation, could you please provide details on the recent code changes made? Additionally, I would prefer to discuss this further via a call. Please send the logs and we can proceed from there. My contact number is <tel_num>.",
    language: "en",
    queue: "Technical Support",
    type: "Incident",
    priority: "high",
  },
  {
    ticket_id: "TKT-42560",
    similarity: 0.6,
    subject: "System Outage Impacting Several Products Urgently",
    body_snippet: "",
    answer_snippet:
      "Received your email about the system outage affecting Django SAP ERP. I acknowledge the urgency and am ready to assist in restoring functionality as soon as possible. For a more thorough investigation, could you please provide details on the recent code changes made? Additionally, I would prefer to discuss this further over a call; my number is <tel_num>.",
    language: "en",
    queue: "Technical Support",
    type: "Incident",
    priority: "high",
  },
  {
    ticket_id: "TKT-53276",
    similarity: 0.41,
    subject: "Service Problem",
    body_snippet: "",
    answer_snippet:
      "Acknowledged the email regarding the service disruption and will proceed to investigate further. Please allow for a convenient call to discuss the next steps in resolving the issue that is affecting the products and users.",
    language: "en",
    queue: "Service Outages and Maintenance",
    type: "Incident",
    priority: "high",
  },
]

export const DEMO_CASES: DemoCase[] = [
  {
    ticket_id: "TKT-20418",
    subject: "Charged twice",
    body: "Our business account shows two identical debits today for the November invoice (RE-2026-11-0482, €249.00 each). Please check this and refund the duplicate amount.",
    received: "09:02",
    dataset: { row: -1, type: null, queue: "Billing and Payments", priority: "medium" },
    category: "Billing",
    note: "A duplicate debit on one invoice, with a refund request. Past billing replies asked for the transaction dates and amounts before any review [TKT-31649] [TKT-56816].",
    route: "Billing and Payments · refunds",
    customer: {
      name: "Jana Weber",
      org: "Weber Family Practice",
      criticalCare: false,
      sees: "Handed to Billing. A person will review it.",
    },
    triage: {
      type: "Request",
      type_conf: 0.82,
      queue: "Billing and Payments",
      queue_conf: 0.93,
      priority: "medium",
      priority_conf: 0.77,
      language: "en",
      key_terms: ["refund", "duplicate", "debits"],
    },
    clarifications: [],
    draft: {
      reply:
        "Hello Jana,\n\nThank you for reporting the duplicate debit for invoice RE-2026-11-0482.\n\nSo we can review it, please confirm:\n1. The dates of both transactions [TKT-31649]\n2. The exact amount of each debit [TKT-56816]\n\nA billing specialist will review the account and contact you [TKT-05423].\n\nBest regards,\nBilling and Payments",
      cited_ticket_ids: ["TKT-05423", "TKT-31649", "TKT-56816"],
      grounded: true,
      issues: [],
      sentences: [
        { text: "Hello Jana,", supported: true, source_ticket_id: null, score: 1 },
        { text: "Thank you for reporting the duplicate debit for invoice RE-2026-11-0482.", supported: true, source_ticket_id: null, score: 1 },
        { text: "So we can review it, please confirm:", supported: true, source_ticket_id: null, score: 1 },
        { text: "The dates of both transactions [TKT-31649]", supported: true, source_ticket_id: "TKT-31649", score: 0.81 },
        { text: "The exact amount of each debit [TKT-56816]", supported: true, source_ticket_id: "TKT-56816", score: 0.76 },
        { text: "A billing specialist will review the account and contact you [TKT-05423].", supported: true, source_ticket_id: "TKT-05423", score: 0.72 },
        { text: "Best regards,", supported: true, source_ticket_id: null, score: 1 },
        { text: "Billing and Payments", supported: true, source_ticket_id: null, score: 1 },
      ],
    },
    timings_ms: { triage_ms: 38, retrieval_ms: 104, gate_ms: 3, draft_ms: 1180, total_ms: 1325 },
    sources: MOCK,
    precedents: BILLING_PRECEDENTS,
  },
  {
    ticket_id: "TKT-20431",
    subject: "VPN down for all remote clinicians",
    body: "VPN is down for all of our remote clinicians since 08:10. Nobody off-site can reach the EMR and our 09:00 telehealth appointments are at risk.",
    received: "08:14",
    dataset: { row: -1, type: "Incident", queue: "Technical Support", priority: "high" },
    category: "Outages and slowdowns",
    note: "A VPN outage for every remote clinician on a critical-care account. Past outage replies asked for recent changes and logs, then moved to a call [TKT-59244] [TKT-42560].",
    route: "Technical Support on-call · outage bridge",
    customer: {
      name: "Amara Okafor",
      org: "Northside Family Clinic",
      criticalCare: true,
      sees: "Sent to on-call as urgent.",
    },
    brief: [
      { label: "Impact", text: "All remote clinicians, no EMR access" },
      { label: "Since", text: "08:10, telehealth at 09:00 at risk" },
      { label: "Account", text: "Northside Family Clinic, critical care" },
      { label: "First ask", text: "Recent network or config changes, and VPN gateway logs [TKT-59244]" },
      { label: "Then", text: "Move to a call with the clinic contact [TKT-42560]" },
    ],
    triage: {
      type: "Incident",
      type_conf: 0.93,
      queue: "Technical Support",
      queue_conf: 0.84,
      priority: "high",
      priority_conf: 0.9,
      language: "en",
      key_terms: ["vpn", "down", "nobody", "emr"],
    },
    clarifications: [],
    draft: {
      reply:
        "Hello Amara,\n\nThank you for reporting the VPN outage. Our on-call engineer has been paged.\n\nTo speed this up, please send any recent network or configuration changes and the VPN gateway logs [TKT-59244].\n\nWe will call you to work through next steps [TKT-42560].\n\nBest regards,\nTechnical Support",
      cited_ticket_ids: ["TKT-42560", "TKT-59244"],
      grounded: true,
      issues: [],
      sentences: [
        { text: "Hello Amara,", supported: true, source_ticket_id: null, score: 1 },
        { text: "Thank you for reporting the VPN outage.", supported: true, source_ticket_id: null, score: 1 },
        { text: "Our on-call engineer has been paged.", supported: true, source_ticket_id: null, score: 1 },
        {
          text: "To speed this up, please send any recent network or configuration changes and the VPN gateway logs [TKT-59244].",
          supported: true,
          source_ticket_id: "TKT-59244",
          score: 0.74,
        },
        { text: "We will call you to work through next steps [TKT-42560].", supported: true, source_ticket_id: "TKT-42560", score: 0.71 },
        { text: "Best regards,", supported: true, source_ticket_id: null, score: 1 },
        { text: "Technical Support", supported: true, source_ticket_id: null, score: 1 },
      ],
    },
    timings_ms: { triage_ms: 36, retrieval_ms: 112, gate_ms: 3, draft_ms: 1090, total_ms: 1241 },
    sources: MOCK,
    precedents: OUTAGE_PRECEDENTS,
  },
]
