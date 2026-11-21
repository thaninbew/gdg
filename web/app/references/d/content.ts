// Mockup-only content for direction D: the incoming tickets (fixtures carry only the
// pipeline output), English translations, and the incident brief for the outage case.
import { autoDraftBilling, escalatedOutage } from "@/lib/mock"
import type { PipelineResult } from "@/lib/types"

export type SentenceKind = "courtesy" | "claim"

export interface IncomingTicket {
  id: string
  from: string
  org: string
  received: string
  subject: string
  body: string
  subjectEn?: string
  bodyEn?: string
}

export interface BriefContent {
  summary: string
  cause: { title: string; detail: string }[]
  steps: string[]
}

export interface CanvasCase {
  key: "billing" | "outage"
  label: string
  result: PipelineResult
  ticket: IncomingTicket
  // Sentences with no factual claim (greetings, process statements) are not grounding targets.
  courtesy: number[]
  replyEn?: string
  brief?: BriefContent
  outage?: { count: number; minutes: number; failure: string; ids: string[] }
}

export const CASES: CanvasCase[] = [
  {
    key: "billing",
    label: "Billing · DE",
    result: autoDraftBilling,
    courtesy: [0],
    ticket: {
      id: "TKT-20418",
      from: "Jana Weber",
      org: "Praxis Weber GmbH",
      received: "09:42",
      subject: "Novemberrechnung doppelt abgebucht",
      body: "Guten Tag,\n\nauf unserem Geschäftskonto sehe ich heute zwei identische Abbuchungen für die Novemberrechnung (RE-2026-11-0482, je 249,00 €). Bitte prüfen Sie das und erstatten Sie den doppelten Betrag.\n\nKönnen Sie mir außerdem sagen, wann das Geld wieder auf dem Konto ist?\n\nMit freundlichen Grüßen\nJana Weber",
      subjectEn: "November invoice charged twice",
      bodyEn:
        "Hello,\n\ntoday I can see two identical debits for the November invoice on our business account (RE-2026-11-0482, 249.00 € each). Please check this and refund the duplicate amount.\n\nCan you also tell me when the money will be back in the account?\n\nKind regards\nJana Weber",
    },
    replyEn:
      "Thank you for your message. We are reviewing the duplicate charge and, once it is confirmed, will refund the second amount [TKT-07731, TKT-03318]. The credit usually appears within 5–7 business days [TKT-07731]. We also guarantee you a credit for next month.",
  },
  {
    key: "outage",
    label: "VPN outage · EN",
    result: escalatedOutage,
    courtesy: [0, 3],
    ticket: {
      id: "TKT-20422",
      from: "Amara Okafor",
      org: "Northside Family Clinic",
      received: "08:21",
      subject: "VPN down for all remote clinicians, EMR unreachable",
      body: "Hi team,\n\nSince about 08:10 none of our remote clinicians can connect to the VPN. The client starts connecting and then fails. Nobody off-site can reach the EMR, and our 09:00 telehealth appointments are at risk.\n\nOn-site staff seem fine. Please treat this as urgent.\n\nAmara Okafor\nPractice Manager",
    },
    outage: {
      count: 4,
      minutes: 18,
      failure: "VPN connections failing for remote staff",
      ids: ["TKT-20419", "TKT-20420", "TKT-20421", "TKT-20422"],
    },
    brief: {
      summary:
        "Since about 08:10 remote clinicians at Northside Family Clinic cannot establish a VPN session, so the EMR is unreachable off-site. On-site access works. Three other customers reported the same failure in the last 18 minutes.",
      cause: [
        {
          title: "Expired VPN gateway certificate",
          detail:
            "Same symptom pattern: every remote user dropped at once. Fixed by renewing the certificate and restarting the gateway service; restored in 40 minutes [TKT-04187].",
        },
        {
          title: "Firewall rule from an overnight change",
          detail:
            "Less likely. A rule from a night change once blocked media ports; rolling it back fixed it [TKT-02256].",
        },
      ],
      steps: [
        "Check the expiry date of the VPN gateway certificate [TKT-04187].",
        "Review last night's change log for firewall rules touching VPN or media ports [TKT-02256].",
        "If the certificate has expired, renew it, restart the gateway service and ask users to reconnect [TKT-04187].",
        "Post a status update to the four affected customers within 15 minutes.",
      ],
    },
  },
]
