// Realistic fixtures in the exact API shape, so pages can be built before the backend is ready.
import type { PipelineResult } from "@/lib/types"

export const escalatedOutage: PipelineResult = {
  triage: {
    type: "Incident",
    type_conf: 0.91,
    queue: "Technical Support",
    queue_conf: 0.84,
    priority: "high",
    priority_conf: 0.77,
    language: "en",
    key_terms: [],
  },
  precedents: [
    {
      ticket_id: "TKT-04187",
      similarity: 0.89,
      subject: "VPN tunnel down, clinic cannot reach EMR",
      body_snippet: "All remote clinicians lost VPN access at once; EMR integration is unreachable.",
      answer_snippet:
        "The VPN gateway certificate had expired. We renewed it, restarted the gateway service and asked users to reconnect. Service was restored within 40 minutes.",
      language: "en",
      type: "",
      queue: "",
      priority: "",
    },
    {
      ticket_id: "TKT-11902",
      similarity: 0.83,
      subject: "VPN-Verbindung bricht ständig ab",
      body_snippet: "Seit heute Morgen trennt sich der VPN-Client alle paar Minuten.",
      answer_snippet:
        "Wir haben die MTU auf dem Gateway angepasst und den Client auf die aktuelle Version aktualisiert.",
      language: "de",
      type: "",
      queue: "",
      priority: "",
    },
    {
      ticket_id: "TKT-02256",
      similarity: 0.78,
      subject: "Telemedicine sessions failing for all staff",
      body_snippet: "Video consultations fail to start since the network change last night.",
      answer_snippet:
        "A firewall rule from the overnight change blocked the media ports. We rolled the rule back and confirmed sessions connect again.",
      language: "en",
      type: "",
      queue: "",
      priority: "",
    },
  ],
  escalate: true,
  reasons: [
    "High-priority incident: page the on-call engineer",
    "Customer-facing clinical systems affected",
  ],
  draft: {
    reply:
      "Thank you for the report. We are treating this as a priority outage and an engineer has been paged [TKT-04187]. In a similar case the VPN gateway certificate had expired and service returned after it was renewed [TKT-04187]. We will update you as soon as we have confirmed the cause.",
    cited_ticket_ids: ["TKT-04187"],
    grounded: true,
    issues: [],
    sentences: [],
  },
  timings_ms: { triage_ms: 38, retrieval_ms: 112, gate_ms: 4, draft_ms: 1460, total_ms: 1614 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

export const autoDraftBilling: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.86,
    queue: "Billing and Payments",
    queue_conf: 0.92,
    priority: "medium",
    priority_conf: 0.64,
    language: "de",
    key_terms: [],
  },
  precedents: [
    {
      ticket_id: "TKT-07731",
      similarity: 0.87,
      subject: "Rechnung doppelt abgebucht",
      body_snippet: "Die Novemberrechnung wurde zweimal von meinem Konto abgebucht.",
      answer_snippet:
        "Die doppelte Abbuchung wurde bestätigt und die Erstattung veranlasst. Sie erscheint innerhalb von 5–7 Werktagen auf Ihrem Konto.",
      language: "de",
      type: "",
      queue: "",
      priority: "",
    },
    {
      ticket_id: "TKT-03318",
      similarity: 0.81,
      subject: "Charged twice for the same invoice",
      body_snippet: "My card shows two identical charges for this month's invoice.",
      answer_snippet:
        "We confirmed the duplicate charge and issued a refund for the second payment. Refunds usually appear within 5–7 business days.",
      language: "en",
      type: "",
      queue: "",
      priority: "",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Vielen Dank für Ihre Nachricht. Wir prüfen die doppelte Abbuchung und veranlassen nach Bestätigung die Erstattung des zweiten Betrags [TKT-07731, TKT-03318]. Die Gutschrift erscheint in der Regel innerhalb von 5–7 Werktagen [TKT-07731]. Wir garantieren Ihnen außerdem eine Gutschrift für den nächsten Monat.",
    cited_ticket_ids: ["TKT-07731", "TKT-03318"],
    grounded: true,
    issues: [],
    sentences: [],
  },
  timings_ms: { triage_ms: 35, retrieval_ms: 98, gate_ms: 3, draft_ms: 1210, total_ms: 1346 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "mock" },
}

// Hourly ticket volume by priority, for the operations charts.
export const volumeByHour = Array.from({ length: 24 }, (_, h) => {
  const burst = h >= 8 && h <= 10 ? 14 - Math.abs(9 - h) * 5 : 0
  return {
    hour: `${String(h).padStart(2, "0")}:00`,
    high: 1 + (h % 5 === 0 ? 2 : 0) + burst,
    medium: 6 + ((h * 7) % 5) + (h > 7 && h < 18 ? 6 : 0),
    low: 4 + ((h * 3) % 4) + (h > 7 && h < 18 ? 5 : 0),
  }
})

// Reliability curve: predicted confidence vs observed accuracy on the holdout split.
export const calibration = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((p, i) => ({
  predicted: p,
  observed: Math.min(1, p + [0.04, 0.03, -0.02, -0.04, -0.03, -0.05, -0.04, -0.02, -0.01][i]),
  ideal: p,
}))

// Risk dial: confidence threshold vs share of tickets auto-handled and their accuracy.
export const coverage = Array.from({ length: 19 }, (_, i) => {
  const t = 0.05 + i * 0.05
  return {
    threshold: Number(t.toFixed(2)),
    coverage: Number((1 - Math.pow(t, 1.6)).toFixed(3)),
    accuracy: Number((0.62 + 0.36 * Math.pow(t, 0.7)).toFixed(3)),
  }
})
