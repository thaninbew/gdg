// The copilot's answers to operator questions about one ticket. Scripted stand-in for the model:
// answers come only from the ticket and its precedents, in English and German, so switching the
// console language rewrites a whole conversation. Swap `respond` for the API when it exists.
import { gateReasons, outcome, type CaseState } from "@/lib/gate"
import type { Language, TicketCase } from "@/lib/types"

export type Answer = Record<Language, string>
export interface CopilotMessage {
  q: string
  a: Answer
  done: boolean
  /** Asked in this session (not demo history), so the answer streams in once. */
  live?: boolean
}
export interface Conversation {
  id: string
  ticketId: string
  messages: CopilotMessage[]
  updated: string
}

// Customer messages in English, for "Translate to English" on the German demo tickets.
const TRANSLATION: Record<string, string> = {
  "TKT-15737":
    "Support team, a critical security vulnerability has been found in BioTrust's ResearchGate API. This breach poses a serious risk of unauthorized disclosure of patient data. We must act immediately to prevent unauthorized access.",
  "TKT-55945":
    "We're having temporary problems with the loading function after the planned update. Server configuration changes may be the cause. The connection is up. Please clear the cache and restart the services. The problem still persists.",
  "TKT-15072":
    "Dear customer service, I'd like to request an improved security protocol for protecting medical data and improvements to the clinic's IT infrastructure. Protecting sensitive patient data and preventing cyberattacks is important. I'd appreciate a reply describing how this will be handled and what further measures can be taken. Thank you for your support.",
  "TKT-54875":
    "Unexpected problems occurred while syncing the project schedule. An incompatibility between the Express.js and MySQL versions may be the cause. I tried restarting the server, analyzing the logs and checking the database connections, but the error persists. I'd appreciate your help resolving it.",
}

const DE_REASON: [RegExp, string][] = [
  [/^High-priority incident.*/, "Vorfall mit hoher Priorität: Bereitschaft alarmieren"],
  [/^Low classifier confidence \((\d+)%\)/, "Geringe Sicherheit der Klassifizierung ($1 %)"],
  [/^No close historical precedent \(best match (\d+)%\)/, "Kein ähnlicher früherer Fall (beste Übereinstimmung $1 %)"],
  [/^Possible prompt injection.*/, "Möglicher Manipulationsversuch im Ticket"],
  [/^Asks for a refund.*/, "Verlangt eine Erstattung oder rechtliche bzw. preisliche Zusage, die frühere Lösungen nicht stützen"],
  [/^Operator escalated from the inbox$/, "Vom Operator im Posteingang eskaliert"],
  [/^Operator sent it for review$/, "Vom Operator zur Prüfung gesendet"],
  [/^Slowdown affects the whole team.*/, "Die Verlangsamung betrifft das ganze Team: an IT Support weiterleiten"],
  [/^No past ticket covers a shop failure.*/, "Kein früheres Ticket deckt einen Shop-Ausfall nach einem Update ab"],
]
export const reasonIn = (r: string, lang: Language) => {
  if (lang === "en") return r
  for (const [re, de] of DE_REASON) if (re.test(r)) return r.replace(re, de)
  return r
}

const TYPE_DE: Record<string, string> = { Incident: "Vorfall", Request: "Anfrage", Problem: "Problem", Change: "Änderung" }
const PRIO_DE: Record<string, string> = { high: "hoch", medium: "mittel", low: "niedrig" }
// First real sentence of a past reply: one line, without the greeting ("Dear <name>,", "Sehr geehrte …,").
const firstSentence = (t: string) => {
  const flat = t.replace(/\s+/g, " ").replace(/^(dear|hello|hi|hallo|guten tag|sehr geehrte[rs]?)\b[^,]*,\s*/i, "").trim()
  return (flat.match(/^.*?[.!?](\s|$)/) ?? [flat])[0].trim()
}

// "answer in German", "auf Deutsch", ... switch the language; "Translate to English" never does.
const SWITCH_DE = /\b(answer|reply|respond|write|switch)\b[^.?!]*\b(in )?german\b|\bauf deutsch\b|\bdeutsch bitte\b|\bantworte(n)? (bitte )?(auf|in) deutsch\b/i
const SWITCH_EN = /\b(answer|reply|respond|write|switch)\b[^.?!]*\b(in )?english\b|\bauf englisch\b|\bantworte(n)? (bitte )?(auf|in) englisch\b|\bback to english\b/i
const DE_WORDS = /\b(der|die|das|und|ist|nicht|ich|wir|sie|warum|was|wie|wurde|kunde|kunden|soll|sollte|frühere?|bitte|können|welche|gibt|hat|haben|dieses?|diesem|zusammenfassung|fragen)\b|[äöüß]/gi
const isTranslate = (q: string) => /translat|übersetz|what does it say/i.test(q)

/** The language after this message: an explicit request, or writing in German, switches it. */
export function nextLanguage(current: Language, q: string): Language {
  if (isTranslate(q)) return current
  if (SWITCH_DE.test(q)) return "de"
  if (SWITCH_EN.test(q)) return "en"
  return (q.match(DE_WORDS) ?? []).length >= 2 ? "de" : current
}
const onlySwitch = (q: string) =>
  !isTranslate(q) && (SWITCH_DE.test(q) || SWITCH_EN.test(q)) && q.replace(SWITCH_DE, "").replace(SWITCH_EN, "").replace(/[^a-zäöüß]/gi, "").length < 12

export const SUGGESTIONS: Record<Language, string[]> = {
  en: ["Why this route?", "What worked before?", "What should I ask the customer?"],
  de: ["Warum diese Zuordnung?", "Was hat früher geholfen?", "Was soll ich den Kunden fragen?"],
}
export function suggestionsFor(c: TicketCase, lang: Language) {
  const last = c.triage.language === "de" ? (lang === "de" ? "Ins Englische übersetzen" : "Translate to English") : lang === "de" ? "Zusammenfassen" : "Summarize"
  return [...SUGGESTIONS[lang], last]
}

function respondIn(c: TicketCase, s: CaseState, q: string, lang: Language, target: Language): string {
  const t = q.toLowerCase()
  const o = outcome(c, s)
  const r = gateReasons(c, s)
  const P = c.precedents
  const de = lang === "de"
  if (isTranslate(q))
    return TRANSLATION[c.ticket_id]
      ? de ? `Hier ist die Nachricht des Kunden auf Englisch: "${TRANSLATION[c.ticket_id]}"` : `Here's the customer's message in English: "${TRANSLATION[c.ticket_id]}"`
      : de ? "Die Nachricht des Kunden ist bereits auf Englisch." : "The customer's message is already in English."
  if (onlySwitch(q))
    return de ? `Alles klar, ich antworte ab jetzt auf ${target === "de" ? "Deutsch" : "Englisch"}.` : `Okay, I'll answer in ${target === "de" ? "German" : "English"} from now on.`
  if (/summar|tl;?dr|gist|what is this|what's this about|zusammenfass|worum geht/.test(t))
    return de
      ? `${c.triage.language === "de" ? "Deutschsprachiges" : "Englischsprachiges"} Ticket (${TYPE_DE[s.triage.type] ?? s.triage.type}) für ${s.triage.queue}, Priorität ${PRIO_DE[s.triage.priority]}. Der Kunde schreibt: „${firstSentence(c.body)}“`
      : `${c.triage.language === "de" ? "German" : "English"} ${s.triage.type.toLowerCase()} for ${s.triage.queue}, priority ${s.triage.priority}. ${c.note}`
  if (/why|reason|escalat|route|routed|team|queue|warum|grund|eskal|weiterleit|zugeordnet|zuordnung/.test(t)) {
    if (o === "escalate")
      return de
        ? `Es geht an eine Person, weil: ${r.map((x) => reasonIn(x, "de")).join("; ")}.`
        : `It goes to a person because: ${r.join("; ").toLowerCase()}.`
    const why = P.length
      ? de ? `Es geht an ${s.triage.queue}, weil die ähnlichsten früheren Tickets dort bearbeitet wurden [${P[0].ticket_id}].` : `It's routed to ${s.triage.queue} because the closest past tickets were handled there [${P[0].ticket_id}].`
      : de ? `Es ist ${s.triage.queue} zugeordnet.` : `It's in ${s.triage.queue}.`
    const next = o === "clarify" ? (de ? "Vor dem Entwurf brauche ich noch eine Antwort." : "I still need one answer before drafting.") : de ? "Die Prüfung blockiert keinen Entwurf." : "Nothing in the gate blocks a draft."
    return `${why} ${next}`
  }
  if (/ask|customer|information|missing|need from|details|fragen|kunde|angaben|informationen/.test(t)) {
    if (!P.length) return de ? "Für dieses Ticket gibt es noch keine früheren Tickets, auf die ich mich stützen kann." : "There are no past tickets for this one yet, so I can't say what to ask from precedent."
    const asks = P.flatMap((p) =>
      (p.answer_snippet.match(/[^.!?]*(could you|can you|please (provide|send|share|let)|bitte|könnten sie|teilen sie)[^.!?]*[.!?]/gi) ?? [])
        .slice(0, 1)
        .map((x) => `${x.trim()} [${p.ticket_id}]`)
    ).slice(0, 3)
    return asks.length
      ? `${de ? "Frühere Antworten haben zuerst nach diesen Angaben gefragt:" : "Past replies asked for these details first:"}\n${asks.map((a) => "• " + a).join("\n")}`
      : de ? `Frühere Antworten fragen nach nichts Bestimmtem. Ich würde die Angaben im Ticket bestätigen und ein Gespräch anbieten [${P[0].ticket_id}].` : `The past replies don't ask for anything specific. I'd confirm the details in the ticket and offer a call [${P[0].ticket_id}].`
  }
  if (/similar|past|before|last time|precedent|worked|history|fix|resolve|früher|vorher|geholfen|ähnlich|gelöst/.test(t))
    return !P.length
      ? de ? "Für dieses Ticket wurden noch keine früheren Tickets gefunden." : "No past tickets have been retrieved for this one yet."
      : `${de ? "Das hat früher geholfen:" : "Here's what worked before:"}\n${P.slice(0, 3).map((p) => `• ${p.subject}: ${firstSentence(p.answer_snippet)} [${p.ticket_id}]`).join("\n")}`
  return de
    ? "Ich kann nur anhand dieses Tickets und seiner früheren Tickets antworten. Fragen Sie zum Beispiel, warum es so zugeordnet wurde, was früher geholfen hat oder was Sie den Kunden fragen sollten."
    : "I can only answer from this ticket and its past tickets. Try asking why it was routed, what worked before, or what to ask the customer."
}

/** Both languages, so switching the console language rewrites the conversation instantly. */
export function respond(c: TicketCase, s: CaseState, q: string, target: Language): Answer {
  return { en: respondIn(c, s, q, "en", target), de: respondIn(c, s, q, "de", target) }
}
