// Queue for the Command Center mockup. The two shared fixtures are real pipeline shapes;
// the extra tickets are invented here so the queue reads like a live morning shift.
import { autoDraftBilling, escalatedOutage } from "@/lib/mock"
import type { PipelineResult } from "@/lib/types"

export type IncidentBrief = {
  summary: string
  cause: string
  steps: string[]
}

export type QueueTicket = {
  id: string
  subject: string
  body: string
  customer: string
  channel: "Email" | "Portal" | "Phone"
  received: string
  age: string
  cluster?: "vpn"
  result: PipelineResult | null
  /** English rendering of a German draft, for the operator. */
  translation?: string
  brief?: IncidentBrief
}

const vpnBrief: IncidentBrief = {
  summary:
    "Remote clinics lost VPN access at about 08:40 and cannot reach the EMR or start telemedicine sessions. Four tickets from three sites describe the same failure.",
  cause:
    "Most likely an expired VPN gateway certificate, the same failure as [TKT-04187], fixed by renewing it and restarting the gateway. Next most likely: a firewall rule from last night's change window blocking media ports [TKT-02256].",
  steps: [
    "Check the gateway certificate expiry on vpn-gw-01 and vpn-gw-02 [TKT-04187]",
    "Review firewall changes from the 02:00 window and roll back anything touching VPN or media ports [TKT-02256]",
    "If clients drop every few minutes instead, compare gateway MTU against the client profile [TKT-11902]",
    "Post a status update to affected clinics within 15 minutes",
  ],
}

const deOutage: PipelineResult = {
  ...escalatedOutage,
  triage: { ...escalatedOutage.triage, type_conf: 0.89, queue_conf: 0.81, priority_conf: 0.74, language: "de" },
  draft: {
    reply:
      "Vielen Dank für Ihre Meldung. Wir behandeln den Ausfall mit höchster Priorität und haben den Bereitschaftsdienst alarmiert [TKT-04187]. In einem ähnlichen Fall war das Zertifikat des VPN-Gateways abgelaufen, und der Dienst lief nach der Erneuerung wieder [TKT-04187]. Wir melden uns, sobald die Ursache bestätigt ist.",
    cited_ticket_ids: ["TKT-04187"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 41, retrieval_ms: 118, gate_ms: 4, draft_ms: 1522, total_ms: 1685 },
}

const mailbox: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.93,
    queue: "IT Support",
    queue_conf: 0.88,
    priority: "low",
    priority_conf: 0.86,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-08812",
      similarity: 0.91,
      subject: "Access to shared mailbox for new staff",
      body_snippet: "Please give our new receptionist access to the front-desk mailbox.",
      answer_snippet:
        "We added the user to the mailbox permission group. The mailbox appears in Outlook within about 30 minutes, after a restart.",
      language: "en",
    },
    {
      ticket_id: "TKT-05540",
      similarity: 0.84,
      subject: "Shared mailbox missing after access granted",
      body_snippet: "Access was approved yesterday but the mailbox still does not show up.",
      answer_snippet: "We re-synced the mailbox permissions and the folder appeared after the next Outlook start.",
      language: "en",
    },
    {
      ticket_id: "TKT-01977",
      similarity: 0.72,
      subject: "Neuer Mitarbeiter braucht Zugriff auf Teampostfach",
      body_snippet: "Bitte Zugriff auf das Postfach der Anmeldung einrichten.",
      answer_snippet: "Der Zugriff wurde über die Berechtigungsgruppe eingerichtet.",
      language: "de",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Thanks for the request. We will add Jonas Brandt to the clinic-nord shared mailbox through its permission group [TKT-08812]. It appears in Outlook within about 30 minutes, after a restart [TKT-08812]. If it is still missing tomorrow, reply here and we will re-sync the permissions [TKT-05540].",
    cited_ticket_ids: ["TKT-08812", "TKT-05540"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 33, retrieval_ms: 91, gate_ms: 3, draft_ms: 1104, total_ms: 1231 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const teamsEcho: PipelineResult = {
  triage: {
    type: "Problem",
    type_conf: 0.81,
    queue: "Technical Support",
    queue_conf: 0.78,
    priority: "medium",
    priority_conf: 0.69,
    language: "de",
  },
  precedents: [
    {
      ticket_id: "TKT-09917",
      similarity: 0.86,
      subject: "Echo in Teams-Anrufen",
      body_snippet: "Gesprächspartner hören sich selbst doppelt, seit dem neuen Headset.",
      answer_snippet:
        "Die Echounterdrückung im Headset-Treiber war deaktiviert. Nach dem Treiber-Update war das Echo verschwunden.",
      language: "de",
    },
    {
      ticket_id: "TKT-06120",
      similarity: 0.79,
      subject: "Teams call echo when docked",
      body_snippet: "Callers hear an echo only when my laptop is on the docking station.",
      answer_snippet:
        "Setting the dock's audio device as default for both speaker and microphone in Teams removed the echo.",
      language: "en",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Vielen Dank für Ihre Nachricht. Bitte aktualisieren Sie den Headset-Treiber, da eine deaktivierte Echounterdrückung diese Störung schon einmal verursacht hat [TKT-09917]. Wenn Sie an einer Dockingstation arbeiten, wählen Sie in Teams dasselbe Audiogerät für Lautsprecher und Mikrofon [TKT-06120]. Geben Sie uns gern Bescheid, ob das Echo danach verschwunden ist.",
    cited_ticket_ids: ["TKT-09917", "TKT-06120"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 36, retrieval_ms: 104, gate_ms: 3, draft_ms: 1287, total_ms: 1430 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const printer: PipelineResult = {
  triage: {
    type: "Incident",
    type_conf: 0.74,
    queue: "IT Support",
    queue_conf: 0.71,
    priority: "medium",
    priority_conf: 0.54,
    language: "de",
  },
  precedents: [
    {
      ticket_id: "TKT-06688",
      similarity: 0.77,
      subject: "Drucker gibt leere Seiten aus",
      body_snippet: "Der Etagendrucker zieht Papier ein, druckt aber nichts.",
      answer_snippet: "Die Tonerkartusche hatte noch das Transportsiegel. Nach dem Entfernen druckte das Gerät normal.",
      language: "de",
    },
    {
      ticket_id: "TKT-03904",
      similarity: 0.68,
      subject: "Blank pages from network printer after driver push",
      body_snippet: "Since this morning's update every job comes out blank.",
      answer_snippet: "The pushed universal driver was wrong for this model. We reinstalled the vendor driver on the print server.",
      language: "en",
    },
  ],
  escalate: true,
  reasons: ["Priority confidence 54% is below the 60% gate", "Two plausible causes with no clear match"],
  draft: {
    reply:
      "Vielen Dank für Ihre Meldung. Ein Techniker prüft den Drucker im 2. OG. Bitte kontrollieren Sie bis dahin, ob an der neuen Tonerkartusche noch das Transportsiegel klebt [TKT-06688].",
    cited_ticket_ids: ["TKT-06688"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 37, retrieval_ms: 96, gate_ms: 3, draft_ms: 988, total_ms: 1124 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const passwordReset: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.9,
    queue: "IT Support",
    queue_conf: 0.88,
    priority: "low",
    priority_conf: 0.83,
    language: "en",
  },
  precedents: [
    {
      ticket_id: "TKT-10233",
      similarity: 0.9,
      subject: "Reset link says expired immediately",
      body_snippet: "I clicked the reset link right away and it says it has expired.",
      answer_snippet:
        "Reset links expire after 15 minutes and a second request invalidates the first. We sent one fresh link and asked the user to open it in a private window.",
      language: "en",
    },
    {
      ticket_id: "TKT-07002",
      similarity: 0.76,
      subject: "Kennwort-Link funktioniert nicht",
      body_snippet: "Der Link aus der E-Mail führt zu einer Fehlerseite.",
      answer_snippet: "Der Mailfilter hatte den Link umgeschrieben. Wir haben einen neuen Link per SMS gesendet.",
      language: "de",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Thanks for letting us know. Reset links expire after 15 minutes, and requesting a second link cancels the first [TKT-10233]. We have sent you one new link; please open it within 15 minutes in a private browser window [TKT-10233].",
    cited_ticket_ids: ["TKT-10233"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 31, retrieval_ms: 88, gate_ms: 2, draft_ms: 932, total_ms: 1053 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "real" },
}

const visio: PipelineResult = {
  triage: {
    type: "Request",
    type_conf: 0.92,
    queue: "IT Support",
    queue_conf: 0.83,
    priority: "low",
    priority_conf: 0.88,
    language: "de",
  },
  precedents: [
    {
      ticket_id: "TKT-08455",
      similarity: 0.88,
      subject: "Visio-Lizenz für Projektteam",
      body_snippet: "Drei Kolleginnen brauchen Visio für die Prozessdokumentation.",
      answer_snippet:
        "Die Lizenzen wurden über das Software-Portal zugewiesen, nachdem die Kostenstelle die Freigabe erteilt hatte.",
      language: "de",
    },
    {
      ticket_id: "TKT-04471",
      similarity: 0.73,
      subject: "Request a Project license",
      body_snippet: "I need Microsoft Project for the renovation schedule.",
      answer_snippet: "Licenses need cost-center approval; we assigned it once the approval arrived in the portal.",
      language: "en",
    },
  ],
  escalate: false,
  reasons: [],
  draft: {
    reply:
      "Vielen Dank für Ihre Anfrage. Visio-Lizenzen vergeben wir über das Software-Portal, sobald Ihre Kostenstelle die Freigabe erteilt hat [TKT-08455, TKT-04471]. Bitte stellen Sie den Antrag dort; die Zuweisung erfolgt direkt nach der Freigabe [TKT-08455].",
    cited_ticket_ids: ["TKT-08455", "TKT-04471"],
    grounded: true,
    issues: [],
  },
  timings_ms: { triage_ms: 34, retrieval_ms: 93, gate_ms: 3, draft_ms: 1066, total_ms: 1196 },
  sources: { triage: "real", retrieve: "real", gate: "real", draft: "mock" },
}

export const TICKETS: QueueTicket[] = [
  {
    id: "TKT-12045",
    subject: "Outlook synchronisiert keine Termine mehr",
    body: "Seit heute früh erscheinen neue Termine nicht mehr im Kalender auf dem Handy. Am PC ist alles da.",
    customer: "Praxis Lindenhof",
    channel: "Email",
    received: "09:18",
    age: "now",
    result: null,
  },
  {
    id: "TKT-12044",
    subject: "VPN tunnel down for all remote clinics",
    body: "None of our remote clinicians can connect to the VPN since about 08:40. The EMR is unreachable and we have patients waiting for telemedicine appointments. This is affecting all three of our satellite sites.",
    customer: "Riverside Health Partners",
    channel: "Phone",
    received: "09:14",
    age: "4m",
    cluster: "vpn",
    result: escalatedOutage,
    brief: vpnBrief,
  },
  {
    id: "TKT-12043",
    subject: "Novemberrechnung doppelt abgebucht",
    body: "Guten Tag, die Rechnung für November wurde zweimal von unserem Geschäftskonto abgebucht. Bitte erstatten Sie den doppelten Betrag.",
    customer: "Zahnarztpraxis Keller",
    channel: "Email",
    received: "09:11",
    age: "7m",
    result: autoDraftBilling,
    translation:
      "Thank you for your message. We are checking the duplicate charge and, once confirmed, will refund the second amount [TKT-07731, TKT-03318]. The credit usually appears within 5–7 business days [TKT-07731]. We also guarantee you a credit for next month.",
  },
  {
    id: "TKT-12041",
    subject: "Clinicians cannot open EMR from home",
    body: "Our doctors working from home get a connection timeout when opening the EMR. The office network seems fine.",
    customer: "Northgate Family Medicine",
    channel: "Portal",
    received: "09:09",
    age: "9m",
    cluster: "vpn",
    result: { ...escalatedOutage, timings_ms: { triage_ms: 36, retrieval_ms: 107, gate_ms: 4, draft_ms: 1391, total_ms: 1538 } },
    brief: vpnBrief,
  },
  {
    id: "TKT-12040",
    subject: "VPN-Client verbindet nicht mehr",
    body: "Der VPN-Client meldet seit 08:45 einen Zertifikatsfehler. Keiner im Homeoffice kommt ins Praxissystem.",
    customer: "MVZ Am Stadtpark",
    channel: "Email",
    received: "09:06",
    age: "12m",
    cluster: "vpn",
    result: deOutage,
    brief: vpnBrief,
    translation:
      "Thank you for your report. We are treating the outage with top priority and have paged the on-call engineer [TKT-04187]. In a similar case the VPN gateway certificate had expired, and service returned after it was renewed [TKT-04187]. We will get back to you as soon as the cause is confirmed.",
  },
  {
    id: "TKT-12038",
    subject: "Add new hire to the clinic-nord shared mailbox",
    body: "Jonas Brandt starts on reception today. Please give him access to the clinic-nord@ shared mailbox.",
    customer: "Riverside Health Partners",
    channel: "Portal",
    received: "09:00",
    age: "18m",
    result: mailbox,
  },
  {
    id: "TKT-12036",
    subject: "Teams-Telefonie: Echo bei allen Anrufen",
    body: "Bei Teams-Anrufen hören die Patienten ihre eigene Stimme als Echo. Betrifft nur meinen Arbeitsplatz.",
    customer: "Physio Hansen",
    channel: "Email",
    received: "08:52",
    age: "26m",
    result: teamsEcho,
    translation:
      "Thank you for your message. Please update the headset driver, since disabled echo cancellation has caused this problem before [TKT-09917]. If you work on a docking station, select the same audio device for speaker and microphone in Teams [TKT-06120]. Let us know whether the echo is gone afterwards.",
  },
  {
    id: "TKT-12035",
    subject: "Telemedicine video sessions fail to start",
    body: "Since this morning every video consultation fails at 'connecting'. Phone calls work.",
    customer: "Bayview Pediatrics",
    channel: "Phone",
    received: "08:47",
    age: "31m",
    cluster: "vpn",
    result: { ...escalatedOutage, timings_ms: { triage_ms: 39, retrieval_ms: 115, gate_ms: 4, draft_ms: 1447, total_ms: 1605 } },
    brief: vpnBrief,
  },
  {
    id: "TKT-12029",
    subject: "Drucker im 2. OG druckt nur leere Seiten",
    body: "Nach dem Tonerwechsel kommen nur noch leere Seiten aus dem Drucker im zweiten Stock.",
    customer: "Kanzlei Vogt & Partner",
    channel: "Portal",
    received: "08:21",
    age: "57m",
    result: printer,
    translation:
      "Thank you for your report. A technician will check the printer on the 2nd floor. Until then, please check whether the transport seal is still on the new toner cartridge [TKT-06688].",
  },
  {
    id: "TKT-12024",
    subject: "Password reset link expired",
    body: "I requested a password reset twice and both links say they have expired as soon as I open them.",
    customer: "Harbor Dental Group",
    channel: "Email",
    received: "08:06",
    age: "1h 12m",
    result: passwordReset,
  },
  {
    id: "TKT-12019",
    subject: "Lizenz für Visio anfordern",
    body: "Ich brauche Visio für die Dokumentation unserer Abläufe. Wie beantrage ich eine Lizenz?",
    customer: "MVZ Am Stadtpark",
    channel: "Portal",
    received: "07:41",
    age: "1h 37m",
    result: visio,
    translation:
      "Thank you for your request. We assign Visio licenses through the software portal once your cost center has approved [TKT-08455, TKT-04471]. Please submit the request there; the license is assigned right after approval [TKT-08455].",
  },
]
