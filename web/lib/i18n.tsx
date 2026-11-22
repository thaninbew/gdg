"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import type { Language } from "@/lib/types"

// One language setting for the whole console. Interface text is written in English in the
// components and translated here; copilot content (notes, questions, replies) has its own table.
// Customer messages, past tickets and draft replies are never translated: they're the customer's
// words or go to the customer. Port of the preview's dictionary (docs/preview).

const CONTENT_DE: Record<string, string> = {
  "An outage on Django SAP ERP across several products. Two past tickets describe the same outage [TKT-42560] [TKT-59244], and both replies asked for the recent code changes first.": "Ein Ausfall von Django SAP ERP über mehrere Produkte. Zwei frühere Tickets beschreiben denselben Ausfall [TKT-42560] [TKT-59244], und beide Antworten fragten zuerst nach den letzten Codeänderungen.",
  "Website and social media both down, server already rebooted. Past outage replies asked for the exact error message and server details [TKT-41460] [TKT-58154].": "Website und Social Media sind beide ausgefallen, der Server wurde bereits neu gestartet. Frühere Antworten zu Ausfällen fragten nach der genauen Fehlermeldung und den Serverdetails [TKT-41460] [TKT-58154].",
  "The dataset has no type for this ticket, and its queue (Science/Research) is outside the 10 support queues. It reports a security gap that could expose patient data. Past security tickets only partly match [TKT-49976] [TKT-53582].": "Der Datensatz enthält keinen Typ für dieses Ticket, und seine Warteschlange (Science/Research) liegt außerhalb der 10 Support-Warteschlangen. Es meldet eine Sicherheitslücke, die Patientendaten offenlegen könnte. Frühere Sicherheitstickets passen nur teilweise [TKT-49976] [TKT-53582].",
  "Something stopped working after a planned update and clearing the cache didn't help. The past tickets are only weak matches, and the ticket itself is ambiguous.": "Nach einem geplanten Update funktioniert etwas nicht mehr, und das Leeren des Caches hat nicht geholfen. Die früheren Tickets passen nur schwach, und das Ticket selbst ist mehrdeutig.",
  "Close match to earlier billing-discrepancy tickets [TKT-31649] [TKT-56816]. Billing tickets can involve money owed, which changes who handles it.": "Passt gut zu früheren Tickets über Abrechnungsabweichungen [TKT-31649] [TKT-56816]. Bei Abrechnungstickets kann es um geschuldetes Geld gehen, was ändert, wer sie bearbeitet.",
  "A Change request to improve security for medical data. Past replies on this topic reviewed current protocols and offered a call [TKT-06332] [TKT-43552].": "Eine Änderungsanfrage zur Verbesserung der Sicherheit medizinischer Daten. Frühere Antworten zu diesem Thema prüften die aktuellen Protokolle und boten ein Gespräch an [TKT-06332] [TKT-43552].",
  "Sync stopped after a software update, even after a reinstall. This is filed under Customer Service, but the closest past tickets were handled by Technical Support [TKT-30602] [TKT-37024].": "Die Synchronisierung funktioniert seit einem Software-Update nicht mehr, auch nach einer Neuinstallation. Das Ticket liegt beim Kundenservice, aber die ähnlichsten früheren Tickets hat der technische Support bearbeitet [TKT-30602] [TKT-37024].",
  "Documentation request that matches an earlier ticket almost word for word [TKT-26136].": "Eine Dokumentationsanfrage, die fast wörtlich einem früheren Ticket entspricht [TKT-26136].",
  "Slow loading at peak hours, cache already cleared. Matches earlier project-tool performance tickets [TKT-28395] [TKT-48781].": "Langsames Laden zu Spitzenzeiten, der Cache wurde bereits geleert. Passt zu früheren Leistungstickets zum Projekttool [TKT-28395] [TKT-48781].",
  "Schedule sync fails, possibly an Express.js and MySQL version mismatch. The closest past reply asked for the exact versions first [TKT-45286].": "Die Zeitplan-Synchronisierung schlägt fehl, möglicherweise wegen nicht passender Express.js- und MySQL-Versionen. Die ähnlichste frühere Antwort fragte zuerst nach den genauen Versionen [TKT-45286].",
  "Opened from Find a ticket. It hasn't been through triage in this demo, so there are no past tickets or draft yet. The labels shown are the dataset's.": "Über „Ticket finden“ geöffnet. Es wurde in dieser Demo noch nicht triagiert, daher gibt es noch keine früheren Tickets und keinen Entwurf. Die angezeigten Angaben stammen aus dem Datensatz.",
  "\"Ladenfunktion\" can mean loading (pages or data) or the shop (Laden). Which one is it?": "„Ladenfunktion“ kann das Laden (von Seiten oder Daten) oder den Shop (Laden) meinen. Was ist gemeint?",
  "Loading pages or data": "Laden von Seiten oder Daten",
  "Then it resembles the platform problems after updates in [TKT-56072]. Those replies asked for the recent configuration changes and exact error messages. The matches are still weak, so a person should take it.": "Dann ähnelt es den Plattformproblemen nach Updates in [TKT-56072]. Diese Antworten fragten nach den letzten Konfigurationsänderungen und genauen Fehlermeldungen. Die Übereinstimmungen sind weiterhin schwach, daher sollte eine Person übernehmen.",
  "The online shop": "Der Onlineshop",
  "No past ticket covers a shop failure after an update. I'm handing it to a person.": "Kein früheres Ticket behandelt einen Shop-Ausfall nach einem Update. Ich übergebe es an eine Person.",
  "Is the customer asking for a refund or credit, or only for an explanation of the charges?": "Möchte der Kunde eine Erstattung oder Gutschrift, oder nur eine Erklärung der Kosten?",
  "Explanation only": "Nur eine Erklärung",
  "Then the earlier replies apply directly: ask which subscriptions are affected, the exact amounts and the transaction dates [TKT-31649] [TKT-56816].": "Dann gelten die früheren Antworten direkt: Fragen Sie, welche Abonnements betroffen sind, nach den genauen Beträgen und den Transaktionsdaten [TKT-31649] [TKT-56816].",
  "Refund or credit": "Erstattung oder Gutschrift",
  "Refunds need approval in Billing, so I'm handing it to a person with the details collected so far.": "Erstattungen müssen von der Abrechnung genehmigt werden, daher übergebe ich es mit den bisher gesammelten Angaben an eine Person.",
  "Is this a how-to question, or a fault that started with the update?": "Ist das eine Anleitungsfrage oder ein Fehler, der mit dem Update begann?",
  "A fault after the update": "Ein Fehler nach dem Update",
  "Then it belongs with Technical Support, where [TKT-30602] and [TKT-37024] were handled. I've moved it.": "Dann gehört es zum technischen Support, wo [TKT-30602] und [TKT-37024] bearbeitet wurden. Ich habe es verschoben.",
  "A how-to question": "Eine Anleitungsfrage",
  "Then Customer Service can keep it.": "Dann kann der Kundenservice es behalten.",
  "Do we know which app version and devices the user has?": "Wissen wir, welche App-Version und welche Geräte der Nutzer hat?",
  "No": "Nein",
  "I'll ask for the app and device versions in the reply, as past replies did [TKT-41410].": "Ich frage in der Antwort nach App- und Geräteversionen, wie es frühere Antworten taten [TKT-41410].",
  "Yes, from their account": "Ja, aus seinem Konto",
  "Good. I'll still ask for any error messages, which past replies needed to move forward [TKT-30602].": "Gut. Ich frage trotzdem nach Fehlermeldungen, die frühere Antworten zum Weiterkommen brauchten [TKT-30602].",
  "Is the slowdown affecting just this user, or the whole team?": "Betrifft die Verlangsamung nur diesen Nutzer oder das ganze Team?",
  "Just this user": "Nur diesen Nutzer",
  "Then it isn't clearly a capacity problem yet. The past reply asked about server load and active users to confirm [TKT-48781].": "Dann ist es noch nicht eindeutig ein Kapazitätsproblem. Die frühere Antwort fragte zur Bestätigung nach Serverlast und aktiven Nutzern [TKT-48781].",
  "The whole team": "Das ganze Team",
  "Team-wide slowdowns at peak hours point to server capacity. I've raised it to medium and routed it to IT Support, which handled [TKT-48781].": "Teamweite Verlangsamungen zu Spitzenzeiten deuten auf die Serverkapazität hin. Ich habe die Priorität auf mittel erhöht und es an den IT-Support weitergeleitet, der [TKT-48781] bearbeitet hat.",
  "Noted. Re-checked the sources with your answer.": "Notiert. Ich habe die Quellen mit Ihrer Antwort erneut geprüft.",
  "Technical Support: outage bridge": "Technischer Support: Ausfall-Bridge",
  "Technical Support on-call: outage bridge": "Bereitschaft technischer Support: Ausfall-Bridge",
  "Service Outages and Maintenance: on-call engineer": "Serviceausfälle und Wartung: Bereitschaftstechniker",
  "Security review: incident lead paged": "Sicherheitsprüfung: Vorfallleitung alarmiert",
  "Technical Support: Tier 2 review": "Technischer Support: Prüfung auf Stufe 2",
  "Technical Support: Tier 2 review (shop)": "Technischer Support: Prüfung auf Stufe 2 (Shop)",
  "Billing and Payments: refund approval": "Abrechnung und Zahlungen: Erstattungsfreigabe",
  "IT Support: capacity review": "IT-Support: Kapazitätsprüfung",
  "Service desk review": "Prüfung durch den Service Desk",
  "Service desk, agent requested review": "Service Desk, Prüfung vom Agenten angefordert",
};

const UI_DE: Record<string, string> = {
  "New conversation":"Neue Unterhaltung", "Delete conversation":"Unterhaltung löschen", "Customer sees":"Das sieht der Kunde",
  "Inbox":"Posteingang", "Copilot":"Copilot", "Dashboard":"Übersicht", "Dusk":"Dusk", "Lime seed":"Lime seed",
  "Find a ticket":"Ticket finden", "New ticket":"Neues Ticket", "New chat":"Neuer Chat", "Mock":"Demo",
  "All":"Alle", "Clarify":"Klären", "Escalate":"Eskalieren", "Draft ready":"Entwurf bereit",
  "Priority":"Priorität", "Ticket":"Ticket", "Subject":"Betreff", "Queue":"Warteschlange", "Confidence":"Sicherheit", "Status":"Status", "Received":"Eingang", "Type":"Typ",
  "High":"Hoch", "Medium":"Mittel", "Low":"Niedrig", "high":"hoch", "medium":"mittel", "low":"niedrig",
  "Confident":"Sicher", "Likely":"Wahrscheinlich", "Ambiguous":"Unklar", "Accept":"Übernehmen", "Accepted":"Übernommen",
  "Incident":"Vorfall", "Request":"Anfrage", "Problem":"Problem", "Change":"Änderung",
  "English":"Englisch", "German":"Deutsch",
  "Triage":"Triage", "Full message":"Ganze Nachricht", "Less":"Weniger", "More":"Mehr",
  "Copilot read":"Einschätzung des Copilots", "Clarify before drafting":"Vor dem Entwurf klären", "Other answer":"Andere Antwort", "Answer":"Antworten",
  "Answer in your own words":"Antwort in eigenen Worten", "Ask requester":"Beim Kunden nachfragen",
  "Escalate to on-call engineer":"An Bereitschaftstechniker eskalieren", "Page on-call":"Bereitschaft alarmieren", "Assign to me":"Mir zuweisen",
  "Approve and send":"Freigeben und senden", "Edit":"Bearbeiten", "Done":"Fertig", "Regenerate":"Neu erzeugen", "Start over":"Neu beginnen",
  "Evidence":"Belege", "No similar past tickets found.":"Keine ähnlichen früheren Tickets gefunden.",
  "Ask the copilot":"Copilot fragen", "Continue in Copilot":"Im Copilot fortsetzen", "Question about this ticket":"Frage zu diesem Ticket",
  "Message":"Nachricht", "Ask":"Fragen", "Delete":"Löschen", "Delete all":"Alle löschen", "Cancel":"Abbrechen", "Current":"Aktuell",
  "About ticket":"Zum Ticket", "No conversation selected.":"Keine Unterhaltung ausgewählt.", "No conversations yet.":"Noch keine Unterhaltungen.",
  "Open in Copilot":"Im Copilot öffnen", "Delete this conversation":"Diese Unterhaltung löschen", "Open full screen":"Vollbild öffnen", "Full screen":"Vollbild",
  "Close panel":"Bereich schließen", "Close":"Schließen", "Reply language":"Antwortsprache", "Language":"Sprache", "Palette":"Farbschema",
  "Light theme":"Helles Design", "Dark theme":"Dunkles Design", "System theme":"Systemdesign", "Color theme":"Farbdesign", "Time range":"Zeitraum",
  "No tickets match these filters.":"Keine Tickets entsprechen diesen Filtern.", "Clear filters":"Filter zurücksetzen", "Clear language filter":"Sprachfilter entfernen",
  "Open":"Offen", "Escalation rate":"Eskalationsquote", "Drafts ready":"Entwürfe bereit", "Volume by priority":"Volumen nach Priorität",
  "Where incidents come from":"Woher Vorfälle kommen", "Team":"Team", "Outage burst":"Ausfallspitze",
  "Find a customer's ticket":"Ticket eines Kunden finden", "Describe the issue":"Problem beschreiben", "What the customer says, or a ticket number":"Was der Kunde sagt, oder eine Ticketnummer",
  "Search":"Suchen", "Search terms":"Suchbegriffe", "Ticket number":"Ticketnummer", "Number contains":"Nummer enthält",
  "Strong match":"Starke Übereinstimmung", "Partial match":"Teilweise Übereinstimmung", "Weak match":"Schwache Übereinstimmung",
  "Customer confirmed":"Vom Kunden bestätigt", "Open ticket":"Ticket öffnen",
  "Ticket language":"Ticketsprache", "Queue status":"Status der Warteschlange", "No incidents for this language.":"Keine Vorfälle in dieser Sprache.",
  "The customer sees it in My requests.":"Der Kunde sieht es unter „Meine Anfragen“.", "suggested":"vorgeschlagen", "Back to inbox":"Zurück zum Posteingang",
  "Question sent to the customer":"Frage an den Kunden gesendet", "Draft reply in German":"Antwortentwurf auf Deutsch", "Draft reply in English":"Antwortentwurf auf Englisch",
  "Auto-draft ready":"Automatischer Entwurf bereit", "Invalid citation":"Ungültige Quelle", "Supported":"Belegt", "Unsupported":"Ohne Beleg",
  "Too close to call. Ask the customer which one fits:":"Zu knapp für eine Entscheidung. Fragen Sie den Kunden, was zutrifft:",
  "For customers without their ticket number. Matches are shown to you only.":"Für Kunden ohne Ticketnummer. Treffer sehen nur Sie.",
  "Read the subject back to the customer before you confirm. With no name or email to check, the details they give are the only proof.":"Lesen Sie dem Kunden den Betreff vor, bevor Sie bestätigen. Ohne Name oder E-Mail sind seine Angaben der einzige Nachweis.",
  "No match. Ask for something specific: an error message, the product name, or when it started.":"Kein Treffer. Fragen Sie nach etwas Konkretem: einer Fehlermeldung, dem Produktnamen oder wann es anfing.",
  "No ticket with that number. Check the digits with the customer, or describe the issue instead.":"Kein Ticket mit dieser Nummer. Prüfen Sie die Ziffern mit dem Kunden oder beschreiben Sie stattdessen das Problem.",
  "English or German.":"Englisch oder Deutsch.", "Message to triage":"Nachricht zur Triage", "Triage ticket":"Ticket triagieren",
  "Undo":"Rückgängig", "Chat cleared":"Chat geleert", "Started a new chat":"Neuer Chat gestartet", "The previous one is in Copilot.":"Der vorherige ist im Copilot.",
  "Conversation deleted":"Unterhaltung gelöscht", "Question sent to requester":"Frage an den Kunden gesendet", "Triage API not connected":"Triage-API nicht verbunden",
  "Start the backend, then submit again.":"Starten Sie das Backend und senden Sie erneut.", "Demo data. Nothing was sent.":"Demodaten. Es wurde nichts gesendet.",
  "Writing":"Schreibt", "Ticket preview":"Ticketvorschau", "Conversations":"Unterhaltungen", "Conversation":"Unterhaltung", "Ticket queue":"Ticket-Warteschlange",
  "Safety gate":"Sicherheitsprüfung", "Pipeline latency":"Pipeline-Latenz", "Escalation":"Eskalation", "Status filter":"Statusfilter",
  "Retrieval":"Suche", "Gate":"Prüfung", "Draft":"Entwurf", "Total":"Gesamt", "skipped":"übersprungen",
  "Incidents":"Vorfälle", "Share":"Anteil",
  // queues, categories and team names
  "Technical Support":"Technischer Support", "Product Support":"Produktsupport", "Customer Service":"Kundenservice", "IT Support":"IT-Support",
  "Billing and Payments":"Abrechnung und Zahlungen", "Returns and Exchanges":"Rücksendungen und Umtausch", "Service Outages and Maintenance":"Serviceausfälle und Wartung",
  "Sales and Pre-Sales":"Vertrieb und Vorverkauf", "Human Resources":"Personalwesen", "General Inquiry":"Allgemeine Anfrage", "Other":"Sonstiges", "Other teams":"Andere Teams",
  "Outages and slowdowns":"Ausfälle und Verlangsamungen", "Integrations and software bugs":"Integrationen und Softwarefehler", "Security and data breaches":"Sicherheit und Datenlecks",
  "Questions and requests":"Fragen und Anfragen", "Billing and payments":"Abrechnung und Zahlungen", "Hardware and devices":"Hardware und Geräte",
  "Accounts and sign-in":"Konten und Anmeldung", "Data, backup and recovery":"Daten, Sicherung und Wiederherstellung",
  // copilot suggestions shown in English mode keep their own German set
  "Translate to English":"Ins Englische übersetzen", "Summarize":"Zusammenfassen",
};

const FIELD_DE: Record<string, string> = {Type:"Typ", Queue:"Warteschlange", Priority:"Priorität", Context:"Kontext"};

const PATTERNS_DE: [RegExp, (...g: string[]) => string][] = [
  [/^Draft reply in (English|German)$/, (m, l) => `Antwortentwurf auf ${l === "German" ? "Deutsch" : "Englisch"}`],
  [/^Drafting reply in (English|German)$/, (m, l) => `Antwortentwurf auf ${l === "German" ? "Deutsch" : "Englisch"} wird geschrieben`],
  [/^Reading (\d+) past tickets$/, (m, n) => `Liest ${n} frühere Tickets`],
  [/^Checking (\d+) sentences against (\d+) past tickets$/, (m, a, b) => `Prüft ${a} Sätze anhand von ${b} früheren Tickets`],
  [/^(\d+) of (\d+) grounded$/, (m, a, b) => `${a} von ${b} belegt`],
  [/^(\d+) unsupported$/, (m, a) => `${a} ohne Beleg`],
  [/^(Type|Queue|Priority|Context) is ambiguous$/, (m, f) => `${FIELD_DE[f]} ist unklar`],
  [/^(\d+) precedents$/, (m, n) => `${n} frühere Tickets`],
  [/^Dataset row (\d+)$/, (m, n) => `Datensatzzeile ${n}`],
  [/^More \((\d+)\)$/, (m, n) => `Mehr (${n})`],
  [/^Changed from (.+)$/, (m, v) => `Geändert von ${translate("de", v)}`],
  [/^(\d+) conversations$/, (m, n) => `${n} Unterhaltungen`],
  [/^(\d+) answers?$/, (m, n) => `${n} ${n === "1" ? "Antwort" : "Antworten"}`],
  [/^Delete all (\d+)\?$/, (m, n) => `Alle ${n} löschen?`],
  [/^(\d+) tickets searchable$/, (m, n) => `${n} Tickets durchsuchbar`],
  [/^([\d,]+) incidents in dataset$/, (m, n) => `${n.replace(/,/g, ".")} Vorfälle im Datensatz`],
  [/^Ask anything about (TKT-\d+)\. Answers come only from the ticket and its past tickets\.$/, (m, id) => `Fragen Sie alles zu ${id}. Antworten stützen sich nur auf das Ticket und frühere Tickets.`],
  [/^Gemma 4 \(local\), ([\d.]+) s$/, (m, s) => `Gemma 4 (lokal), ${s.replace(".", ",")} s`],
  [/^Gemma 4 \(local\)$/, () => "Gemma 4 (lokal)"],
  [/^Approved (TKT-\d+)$/, (m, id) => `${id} freigegeben`], [/^Sent reply for (TKT-\d+)$/, (m, id) => `Antwort für ${id} gesendet`],
  [/^Escalated (TKT-\d+)$/, (m, id) => `${id} eskaliert`], [/^Paged on-call for (TKT-\d+)$/, (m, id) => `Bereitschaft für ${id} alarmiert`],
  [/^Assigned (TKT-\d+) to you$/, (m, id) => `${id} wurde Ihnen zugewiesen`], [/^Accepted triage for (TKT-\d+)$/, (m, id) => `Triage für ${id} übernommen`],
  [/^Linked (TKT-\d+) to this customer$/, (m, id) => `${id} mit diesem Kunden verknüpft`], [/^Deleted (\d+) conversations$/, (m, n) => `${n} Unterhaltungen gelöscht`],
  [/^(TKT-\d+) isn't in this session\. Live tickets appear after a customer sends one from \/submit\.$/, (m, id) => `${id} ist in dieser Sitzung nicht vorhanden. Live-Tickets erscheinen, sobald ein Kunde eines über /submit sendet.`],
  [/^Remove (.+)$/, (m, w) => `${w} entfernen`], [/^Clear filter (.+)$/, (m, f) => `Filter ${translate("de", f)} entfernen`],
  [/^Source (\d+): (TKT-\d+)$/, (m, n, id) => `Quelle ${n}: ${id}`], [/^Source (\d+)(, cited)?$/, (m, n, c) => `Quelle ${n}${c ? ", zitiert" : ""}`],
  [/^(.+): ([\d,]+) incidents\. Open in inbox\.$/, (m, n, k) => `${translate("de", n)}: ${k.replace(/,/g, ".")} Vorfälle. Im Posteingang öffnen.`],
  [/^(.+) priority$/, (m, p) => `Priorität ${translate("de", p).toLowerCase()}`],
  [/^Copilot certainty: (.+)$/, (m, c) => `Sicherheit des Copilots: ${translate("de", c)}`],
  [/^(Type|Queue|Priority) confidence$/, (m, f) => `Sicherheit ${FIELD_DE[f]}`],
];

function translate(lang: Language, s: string): string {
  if (lang !== "de" || !s) return s
  if (UI_DE[s] != null) return UI_DE[s]
  for (const [re, fn] of PATTERNS_DE) {
    const m = s.match(re)
    if (m) return fn(...(m as unknown as string[]))
  }
  return s
}

type I18n = {
  lang: Language
  setLang: (l: Language) => void
  /** Interface text: exact strings and the patterns above (counts, IDs). */
  t: (s: string) => string
  /** Copilot content: notes, questions, options, replies, routes. */
  tc: (s: string) => string
}

const I18nContext = createContext<I18n>({ lang: "en", setLang: () => {}, t: (s) => s, tc: (s) => s })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en")
  const t = useCallback((s: string) => translate(lang, s), [lang])
  const tc = useCallback((s: string) => (lang === "de" && s ? (CONTENT_DE[s] ?? CONTENT_DE[s.replace(" · ", ": ")] ?? s) : s), [lang])
  const value = useMemo(() => ({ lang, setLang, t, tc }), [lang, t, tc])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
