// Ten real tickets from Tobi-Bueck/customer-support-tickets, with TKT ids from data/split.py.
// Triage scores, clarifying questions and drafts are hand-written demo data until the API is wired.
// Precedent similarity is TF-IDF cosine, not the embedding score the retriever will return.
import type { TicketCase } from "@/lib/types"

export const TICKETS: TicketCase[] = [
  {
    "ticket_id": "TKT-17628",
    "subject": "Multiple Products Affected by System Outage Urgently",
    "body": "Facing a system outage impacting Django SAP ERP. It seems recent code modifications or server misconfigurations might be the cause. Restarting services and reviewing logs could help resolve the issue. Immediate assistance is needed to restore functionality as soon as possible.",
    "received": "08:12",
    "dataset": {
      "row": 20735,
      "type": "Incident",
      "queue": "Technical Support",
      "priority": "high"
    },
    "category": "Outages and slowdowns",
    "note": "An outage on Django SAP ERP across several products. Two past tickets describe the same outage [TKT-42560] [TKT-59244], and both replies asked for the recent code changes first.",
    "route": "Technical Support on-call · outage bridge",
    "triage": {
      "type": "Incident",
      "type_conf": 0.91,
      "queue": "Technical Support",
      "queue_conf": 0.88,
      "priority": "high",
      "priority_conf": 0.86,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "",
      "cited_ticket_ids": [],
      "grounded": true,
      "issues": [],
      "sentences": []
    },
    "timings_ms": {
      "triage_ms": 41,
      "retrieval_ms": 118,
      "gate_ms": 4,
      "draft_ms": 0,
      "total_ms": 163
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-42560",
        "similarity": 0.852,
        "subject": "System Outage Impacting Several Products Urgently",
        "body_snippet": "",
        "answer_snippet": "Received your email about the system outage affecting Django SAP ERP. I acknowledge the urgency and am ready to assist in restoring functionality as soon as possible. For a more thorough investigation, could you please provide details on the recent code changes made? Additionally, I would prefer to discuss this further over a call; my number is <tel_num>.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Incident",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-59244",
        "similarity": 0.72,
        "subject": "System Outage Impacting Various Products Urgently",
        "body_snippet": "",
        "answer_snippet": "Received your email about the system outage affecting Django SAP ERP. I understand the urgency and am here to assist in restoring functionality as soon as possible. For a better investigation, could you please provide details on the recent code changes made? Additionally, I would prefer to discuss this further via a call. Please send the logs and we can proceed from there. My contact number is <tel_num>.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Incident",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-53276",
        "similarity": 0.388,
        "subject": "Service Problem",
        "body_snippet": "",
        "answer_snippet": "Acknowledged the email regarding the service disruption and will proceed to investigate further. Please allow for a convenient call to discuss the next steps in resolving the issue that is affecting the products and users.",
        "language": "en",
        "queue": "Service Outages and Maintenance",
        "type": "Incident",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-27040",
    "subject": "Report of Website and Social Media Outage",
    "body": "Dear Customer Support, \n\nMay I inform you that our website and social media pages have unexpectedly ceased to function. There is a possibility that this could be due to a server or network malfunction. We have attempted to resolve the issue by rebooting the server and verifying the network connections, yet the problem remains unresolved. \nCould you please address this matter promptly and offer a solution at your earliest convenience? \nThank you for your help and we are eagerly awaiting your response.",
    "received": "08:40",
    "dataset": {
      "row": 48331,
      "type": "Incident",
      "queue": "Service Outages and Maintenance",
      "priority": "high"
    },
    "category": "Outages and slowdowns",
    "note": "Website and social media both down, server already rebooted. Past outage replies asked for the exact error message and server details [TKT-41460] [TKT-58154].",
    "route": "Service Outages and Maintenance · on-call engineer",
    "triage": {
      "type": "Incident",
      "type_conf": 0.9,
      "queue": "Service Outages and Maintenance",
      "queue_conf": 0.86,
      "priority": "high",
      "priority_conf": 0.84,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "",
      "cited_ticket_ids": [],
      "grounded": true,
      "issues": [],
      "sentences": []
    },
    "timings_ms": {
      "triage_ms": 37,
      "retrieval_ms": 131,
      "gate_ms": 3,
      "draft_ms": 0,
      "total_ms": 171
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-58154",
        "similarity": 0.403,
        "subject": "Reported Problem with Data Analytics Dashboard Loading",
        "body_snippet": "",
        "answer_snippet": "To <name>, we regret the inconvenience caused by the failure of the data analytics dashboard to load. We are looking into the matter and will check the server resources assigned to your account <acc_num>. For further troubleshooting, could you kindly provide the specific error message you are encountering? If necessary, we can schedule a call at <tel_num> to delve deeper into the issue and provide a prompt solution. We appreciate your patience and will strive to resolve the issue swiftly.",
        "language": "en",
        "queue": "IT Support",
        "type": "Incident",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-43041",
        "similarity": 0.391,
        "subject": "Problem with Website Integrations Malfunction",
        "body_snippet": "",
        "answer_snippet": "I have noted your concern about the website integration issues. I will look into the API connectivity and will get back to you shortly to discuss additional troubleshooting steps. Alternatively, I can arrange a call at a time convenient for you to address and resolve the issue.",
        "language": "en",
        "queue": "Service Outages and Maintenance",
        "type": "Problem",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-41460",
        "similarity": 0.371,
        "subject": "(no subject)",
        "body_snippet": "",
        "answer_snippet": "Dear customer, thank you for contacting us regarding the unexpected interruption. We apologize for any inconvenience and are ready to assist. Could you please provide the server and database connection details along with the specific error message you are encountering? We will analyze this information and contact you at <tel_num> to discuss additional troubleshooting steps.",
        "language": "en",
        "queue": "IT Support",
        "type": "Incident",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-15737",
    "subject": "Hohe Priorität: Sicherheitsverletzung entdeckt",
    "body": "Support-Team,\nes wurde eine kritische Sicherheitslücke bezüglich der ResearchGate-API von BioTrust entdeckt. Diese Verletzung birgt ein erhebliches Risiko der unbefugten Offenlegung von Patientendaten. Es ist unerlässlich, dass wir sofort Maßnahmen ergreifen, um unbefugten Zugriff zu verhindern.",
    "received": "08:55",
    "dataset": {
      "row": 29929,
      "type": null,
      "queue": "Science/Research",
      "priority": "critical"
    },
    "category": "Security and data breaches",
    "note": "The dataset has no type for this ticket, and its queue (Science/Research) is outside the 10 support queues. It reports a security gap that could expose patient data. Past security tickets only partly match [TKT-49976] [TKT-53582].",
    "route": "Security review · incident lead paged",
    "triage": {
      "type": "Incident",
      "type_conf": 0.72,
      "queue": "Other",
      "queue_conf": 0.66,
      "priority": "high",
      "priority_conf": 0.9,
      "language": "de",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "",
      "cited_ticket_ids": [],
      "grounded": true,
      "issues": [],
      "sentences": []
    },
    "timings_ms": {
      "triage_ms": 44,
      "retrieval_ms": 126,
      "gate_ms": 4,
      "draft_ms": 0,
      "total_ms": 174
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-49976",
        "similarity": 0.309,
        "subject": "Sicherheitslücke in dem Krankenhaus-System",
        "body_snippet": "",
        "answer_snippet": "Take immediate actions to address the gap and secure the patients' data.",
        "language": "de",
        "queue": "Technical Support",
        "type": "Incident",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-53582",
        "similarity": 0.273,
        "subject": "Probleme mit der IT-System-Sicherheit",
        "body_snippet": "",
        "answer_snippet": "Wir nehmen diese Meldung von einem unbefugten Zugriff sehr ernst und werden sofort einfallen. Bitte geben Sie mehr Details zur Meldung und zur Systemkonfiguration an, damit wir besser helfen können. Sollten weitere Diskussionen erforderlich sein, rufen Sie uns an der angegebenen Telefonnummer <tel_num> auf.",
        "language": "de",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "low"
      },
      {
        "ticket_id": "TKT-54770",
        "similarity": 0.264,
        "subject": "Verletzung der Sicherheitsregeln im System",
        "body_snippet": "",
        "answer_snippet": "Wir haben den Bericht über die Sicherheitsverletzung erhalten. Möchten Sie weitere Details zur Angelegenheit geben? Wir werden die Angelegenheit untersuchen, die notwendigen Maßnahmen ergreifen und das Problem lösen. Bitte kontaktieren Sie den registrierten Kontakt für weitere Diskussionen.",
        "language": "de",
        "queue": "Technical Support",
        "type": "Incident",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-55945",
    "subject": "Unterstützung für temporäre Laden-Probleme aufgrund geplanten Updates",
    "body": "Wir haben temporäre Probleme mit der Ladenfunktion nach dem geplanten Update. Möglicherweise sind Server-Konfigurationsänderungen die Ursache. Die Verbindung steht. Bitte leeren Sie den Cache und starten Sie die Dienste neu. Das Problem besteht jedoch weiterhin.",
    "received": "08:20",
    "dataset": {
      "row": 55470,
      "type": "Incident",
      "queue": "Technical Support",
      "priority": "medium"
    },
    "category": "Integrations and software bugs",
    "note": "Something stopped working after a planned update and clearing the cache didn't help. The past tickets are only weak matches, and the ticket itself is ambiguous.",
    "route": null,
    "triage": {
      "type": "Incident",
      "type_conf": 0.88,
      "queue": "Technical Support",
      "queue_conf": 0.58,
      "priority": "medium",
      "priority_conf": 0.8,
      "language": "de",
      "key_terms": []
    },
    "clarifications": [
      {
        "field": "queue",
        "question": "\"Ladenfunktion\" can mean loading (pages or data) or the shop (Laden). Which one is it?",
        "ask_requester": "Meinen Sie mit „Ladenfunktion“ das Laden von Seiten bzw. Daten oder die Shop-Funktion?",
        "options": [
          {
            "label": "Loading pages or data",
            "reply": "Then it resembles the platform problems after updates in [TKT-56072]. Those replies asked for the recent configuration changes and exact error messages. The matches are still weak, so a person should take it.",
            "effect": {
              "conf": 0.86
            }
          },
          {
            "label": "The online shop",
            "reply": "No past ticket covers a shop failure after an update. I'm handing it to a person.",
            "effect": {
              "conf": 0.86,
              "reason": "No past ticket covers a shop failure after an update"
            }
          }
        ]
      }
    ],
    "draft": {
      "reply": "",
      "cited_ticket_ids": [],
      "grounded": true,
      "issues": [],
      "sentences": []
    },
    "timings_ms": {
      "triage_ms": 39,
      "retrieval_ms": 102,
      "gate_ms": 3,
      "draft_ms": 0,
      "total_ms": 144
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-22815",
        "similarity": 0.293,
        "subject": "Probleme mit der Verbindung zu Datenanalysewerkzeugen",
        "body_snippet": "",
        "answer_snippet": "Sehr geehrte [name], wir bedauern, dass Sie Probleme mit der Verbindung zu Ihren Datenanalysewerkzeugen auf Ihren Geräten haben. Um Ihnen helfen zu können, bitte wir Sie, uns weitere Details zu geben, insbesondere, wann die Softwareupdates und Konfigurationsänderungen durchgeführt wurden. Wir werden die genauen Fehler melden und eine Lösung finden.",
        "language": "de",
        "queue": "Product Support",
        "type": "Incident",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-56072",
        "similarity": 0.284,
        "subject": "Issue mit digitale Plattformen",
        "body_snippet": "",
        "answer_snippet": "schreibe Ihnen bestätigen, dass das Problem mit den digitalen Plattformen bekannt ist. es tut mir leid, dass Sie Serviceausfälle erleben. verstehe, dass Sie bereits versucht haben, die Dienste neu zu starten und die Netzwerkverbindungen zu überprüfen. weiterhin helfen, wäre es nützlich, wenn Sie weitere Details zu den jüngsten Updates und Konfigurationsänderungen geben könnten, die durchgeführt wurden. Zusätzlich wäre es hilfreich, wenn Sie genaue Fehlermeldungen und Symptome mitteilen könnten, die Sie beobachten. Falls nötig, können wir telefonisch besprechen, wie wir die Angelegenheit lösen können.",
        "language": "de",
        "queue": "Service Outages and Maintenance",
        "type": "Problem",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-12858",
        "similarity": 0.279,
        "subject": "Irrigation System Connectivity Issue",
        "body_snippet": "",
        "answer_snippet": "Vielen Dank, dass Sie uns wegen der Verbindungsprobleme mit Ihrem Bewässerungssystem kontaktiert haben. Um Ihnen besser helfen zu können, teilen Sie uns bitte die Modellnummer des Geräts sowie die Art des verwendeten Netzwerks mit (z. B. WLAN, Ethernet). Bitte geben Sie auch an, ob Fehlermeldungen angezeigt werden. Sobald wir diese Informationen haben, können wir gezieltere Schritte zur Fehlerbehebung vorschlagen.",
        "language": "de",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-49389",
    "subject": "Concern About Billing Discrepancies",
    "body": "Our marketing agency has encountered unexpected billing inconsistencies across various digital product subscriptions. These issues might be due to errors in the payment processing software integration. We have already verified the payment details and contacted customer support for resolution. We would greatly appreciate it if you could look into this matter and provide a solution as soon as possible. Please let us know if there is any additional information needed to resolve this issue.",
    "received": "09:03",
    "dataset": {
      "row": 18890,
      "type": "Incident",
      "queue": "Billing and Payments",
      "priority": "medium"
    },
    "category": "Billing and payments",
    "note": "Close match to earlier billing-discrepancy tickets [TKT-31649] [TKT-56816]. Billing tickets can involve money owed, which changes who handles it.",
    "route": null,
    "triage": {
      "type": "Incident",
      "type_conf": 0.64,
      "queue": "Billing and Payments",
      "queue_conf": 0.92,
      "priority": "medium",
      "priority_conf": 0.84,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [
      {
        "field": "type",
        "question": "Is the customer asking for a refund or credit, or only for an explanation of the charges?",
        "ask_requester": "Are you requesting a refund or credit, or an explanation of the charges?",
        "options": [
          {
            "label": "Explanation only",
            "reply": "Then the earlier replies apply directly: ask which subscriptions are affected, the exact amounts and the transaction dates [TKT-31649] [TKT-56816].",
            "effect": {
              "conf": 0.9
            }
          },
          {
            "label": "Refund or credit",
            "reply": "Refunds need approval in Billing, so I'm handing it to a person with the details collected so far.",
            "effect": {
              "conf": 0.9,
              "set": {
                "type": "Request"
              },
              "adds_text": "refund"
            }
          }
        ]
      }
    ],
    "draft": {
      "reply": "Hello,\n\nThank you for reporting the billing discrepancies across your digital product subscriptions. We understand you've already verified your payment details and contacted customer support [TKT-31649].\n\nSo we can investigate, please send us:\n1. The subscriptions that are affected [TKT-56816]\n2. The exact discrepancy for each, such as the expected and charged amounts [TKT-31649]\n3. The dates of the disputed transactions and any earlier correspondence with our support team [TKT-56816]\n4. Contact details for the person responsible for billing on your account [TKT-05423]\n\nOnce we have these, we'll review the account and follow up with a resolution.\n\nBest regards,\nBilling and Payments",
      "cited_ticket_ids": [
        "TKT-05423",
        "TKT-31649",
        "TKT-56816"
      ],
      "grounded": false,
      "issues": [
        "3 sentences not supported by a precedent"
      ],
      "sentences": [
        {
          "text": "Hello,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Thank you for reporting the billing discrepancies across your digital product subscriptions.",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "We understand you've already verified your payment details and contacted customer support [TKT-31649].",
          "supported": true,
          "source_ticket_id": "TKT-31649",
          "score": 0.83
        },
        {
          "text": "So we can investigate, please send us:",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "The subscriptions that are affected [TKT-56816]",
          "supported": true,
          "source_ticket_id": "TKT-56816",
          "score": 0.78
        },
        {
          "text": "The exact discrepancy for each, such as the expected and charged amounts [TKT-31649]",
          "supported": true,
          "source_ticket_id": "TKT-31649",
          "score": 0.83
        },
        {
          "text": "The dates of the disputed transactions and any earlier correspondence with our support team [TKT-56816]",
          "supported": true,
          "source_ticket_id": "TKT-56816",
          "score": 0.78
        },
        {
          "text": "Contact details for the person responsible for billing on your account [TKT-05423]",
          "supported": true,
          "source_ticket_id": "TKT-05423",
          "score": 0.62
        },
        {
          "text": "Once we have these, we'll review the account and follow up with a resolution.",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "Best regards,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Billing and Payments",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 35,
      "retrieval_ms": 98,
      "gate_ms": 3,
      "draft_ms": 1240,
      "total_ms": 1376
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-31649",
        "similarity": 0.831,
        "subject": "Query Regarding Billing Discrepancies",
        "body_snippet": "",
        "answer_snippet": "Acknowledged receipt of the email regarding the billing discrepancies across multiple digital product subscriptions for the marketing agency. We understand that the payment details have been verified and customer support has already been contacted. We appreciate the efforts being made to resolve this issue. We will investigate the matter further and would appreciate it if you could provide specific details on the subscriptions affected and the exact discrepancies being experienced. Additionally, knowing the dates of the disputed transactions and any relevant correspondence with customer support would be helpful. Please provide any further information needed.",
        "language": "en",
        "queue": "Billing and Payments",
        "type": "Incident",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-56816",
        "similarity": 0.781,
        "subject": "Concern Regarding Billing Discrepancies",
        "body_snippet": "",
        "answer_snippet": "Acknowledging receipt of the email regarding the billing discrepancies across multiple digital product subscriptions for the marketing agency. We understand that payment details have been verified and customer support has already been contacted. We appreciate your efforts in resolving the issue. To proceed, could you please provide specific details on the subscriptions affected and the exact discrepancies you are experiencing? Additionally, it would be helpful to know the dates of the disputed transactions and any relevant correspondence with customer support. Thank you.",
        "language": "en",
        "queue": "Billing and Payments",
        "type": "Incident",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-05423",
        "similarity": 0.624,
        "subject": "Concerns About Billing Variations",
        "body_snippet": "",
        "answer_snippet": "Please review the account and provide the necessary contact information related to the billing discrepancies.",
        "language": "en",
        "queue": "Billing and Payments",
        "type": "Incident",
        "priority": "low"
      }
    ]
  },
  {
    "ticket_id": "TKT-15072",
    "subject": "Verbesserung der Sicherheit medizinischer Daten",
    "body": "Sehr geehrte Kundenservice, ich möchte die Implementierung eines verbesserten Sicherheitsprotokolls zur Sicherung medizinischer Daten und die Verbesserung der IT-Infrastruktur der Klinik beantragen. Es ist wichtig, den Schutz sensibler Patientendaten und die Verhütung von Cyberangriffen sicherzustellen. Ich schätze eine Rückmeldung mit Informationen, die die Bearbeitung des Problems beschreibt. Bitte lassen Sie mich wissen, welche weitere Maßnahmen ergriffen werden können, um die Sicherheit medizinischer Daten zu gewährleisten. Vielen Dank für Ihre Unterstützung in dieser Angelegenheit.",
    "received": "09:31",
    "dataset": {
      "row": 51632,
      "type": "Change",
      "queue": "Product Support",
      "priority": "medium"
    },
    "category": "Security and data breaches",
    "note": "A Change request to improve security for medical data. Past replies on this topic reviewed current protocols and offered a call [TKT-06332] [TKT-43552].",
    "route": null,
    "triage": {
      "type": "Change",
      "type_conf": 0.87,
      "queue": "Product Support",
      "queue_conf": 0.74,
      "priority": "medium",
      "priority_conf": 0.8,
      "language": "de",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Anfrage zur Verbesserung der Sicherheit medizinischer Daten. Wir nehmen den Schutz sensibler Patientendaten sehr ernst und überprüfen derzeit die bestehenden Sicherheitsprotokolle [TKT-06332] [TKT-43552].\n\nDamit wir passende Maßnahmen vorschlagen können, schildern Sie uns bitte genauer, welche Systeme und welche Probleme betroffen sind [TKT-43710]. Gern vereinbaren wir auch einen Gesprächstermin, um die nächsten Schritte zu besprechen [TKT-06332].\n\nÜber die ergriffenen Maßnahmen halten wir Sie auf dem Laufenden [TKT-06332].\n\nMit freundlichen Grüßen\nIhr Product-Support-Team",
      "cited_ticket_ids": [
        "TKT-06332",
        "TKT-43552",
        "TKT-43710"
      ],
      "grounded": true,
      "issues": [],
      "sentences": [
        {
          "text": "Sehr geehrte Damen und Herren,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "vielen Dank für Ihre Anfrage zur Verbesserung der Sicherheit medizinischer Daten.",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Wir nehmen den Schutz sensibler Patientendaten sehr ernst und überprüfen derzeit die bestehenden Sicherheitsprotokolle [TKT-06332] [TKT-43552].",
          "supported": true,
          "source_ticket_id": "TKT-06332",
          "score": 0.42
        },
        {
          "text": "Damit wir passende Maßnahmen vorschlagen können, schildern Sie uns bitte genauer, welche Systeme und welche Probleme betroffen sind [TKT-43710].",
          "supported": true,
          "source_ticket_id": "TKT-43710",
          "score": 0.46
        },
        {
          "text": "Gern vereinbaren wir auch einen Gesprächstermin, um die nächsten Schritte zu besprechen [TKT-06332].",
          "supported": true,
          "source_ticket_id": "TKT-06332",
          "score": 0.42
        },
        {
          "text": "Über die ergriffenen Maßnahmen halten wir Sie auf dem Laufenden [TKT-06332].",
          "supported": true,
          "source_ticket_id": "TKT-06332",
          "score": 0.42
        },
        {
          "text": "Mit freundlichen Grüßen",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Ihr Product-Support-Team",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 42,
      "retrieval_ms": 121,
      "gate_ms": 4,
      "draft_ms": 0,
      "total_ms": 167
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-43710",
        "similarity": 0.457,
        "subject": "Sicherung medizinischer Daten und Verbesserung der IT-Infrastruktur",
        "body_snippet": "",
        "answer_snippet": "Geliebter [Name], ich werde Ihnen helfen, die Sicherung medizinischer Daten und die Verbesserung der IT-Infrastruktur zu verbessern. Um die aktuellen Probleme besser zu verstehen, bitten wir Sie, uns mehr Details zu den betreffenden Problemen zu geben. Bitte rufen Sie mich unter [Telefonnummer] an, um eine weitere Diskussion und Empfehlungen zur Verbesserung der IT-Infrastruktur durchzuführen.",
        "language": "de",
        "queue": "Customer Service",
        "type": "Change",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-06332",
        "similarity": 0.422,
        "subject": "(no subject)",
        "body_snippet": "",
        "answer_snippet": "<name>, wir schätzen Ihr Anliegen bezüglich der Verbesserung der Sicherheitsprotokolle für Krankenhaus-IT-Systeme zum Schutz medizinischer Daten. Derzeit überprüfen wir unsere Sicherheitsmaßnahmen und implementieren zusätzliche Protokolle, um die Vertraulichkeit und Integrität der Patientendaten zu sichern. Über die ergriffenen Maßnahmen werden wir Sie informieren. Bei weiteren Fragen können Sie gern einen passenden Gesprächstermin unter <tel_num> vereinbaren.",
        "language": "de",
        "queue": "Product Support",
        "type": "Change",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-43552",
        "similarity": 0.393,
        "subject": "Verbessern der Sicherheit bei medizinischem Datenschutz",
        "body_snippet": "",
        "answer_snippet": "Sehr geehrte [name], wir nehmen die Sicherheit medizinischer Daten in unseren Hospital-IT-Systemen sehr ernst. Wir werden die aktuellen Protokolle überprüfen und notwendige Verbesserungen einleiten, um mögliche Verletzungen zu vermeiden und sensible Patientendaten zu schützen. Sie können sich gerne an [tel_num] wenden, um weitere Details zu unserem nächsten Schritt zu besprechen.",
        "language": "de",
        "queue": "General Inquiry",
        "type": "Change",
        "priority": "low"
      }
    ]
  },
  {
    "ticket_id": "TKT-56088",
    "subject": "Problem with Syncing Project Updates Across Devices",
    "body": "The user is unable to sync project updates across devices using the Smart-Thermometer Chef applications following recent software updates. Despite clearing the app cache and reinstalling, the issue still exists. The user has attempted multiple troubleshooting steps but the problem continues.",
    "received": "08:05",
    "dataset": {
      "row": 10751,
      "type": "Problem",
      "queue": "Customer Service",
      "priority": "low"
    },
    "category": "Integrations and software bugs",
    "note": "Sync stopped after a software update, even after a reinstall. This is filed under Customer Service, but the closest past tickets were handled by Technical Support [TKT-30602] [TKT-37024].",
    "route": null,
    "triage": {
      "type": "Problem",
      "type_conf": 0.85,
      "queue": "Customer Service",
      "queue_conf": 0.55,
      "priority": "low",
      "priority_conf": 0.82,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [
      {
        "field": "queue",
        "question": "Is this a how-to question, or a fault that started with the update?",
        "ask_requester": "Did syncing stop working after the update, or do you need help setting it up?",
        "options": [
          {
            "label": "A fault after the update",
            "reply": "Then it belongs with Technical Support, where [TKT-30602] and [TKT-37024] were handled. I've moved it.",
            "effect": {
              "conf": 0.89,
              "set": {
                "queue": "Technical Support"
              }
            }
          },
          {
            "label": "A how-to question",
            "reply": "Then Customer Service can keep it.",
            "effect": {
              "conf": 0.87
            }
          }
        ]
      },
      {
        "field": "context",
        "question": "Do we know which app version and devices the user has?",
        "ask_requester": "Which app version and which devices are you using?",
        "options": [
          {
            "label": "No",
            "reply": "I'll ask for the app and device versions in the reply, as past replies did [TKT-41410]."
          },
          {
            "label": "Yes, from their account",
            "reply": "Good. I'll still ask for any error messages, which past replies needed to move forward [TKT-30602]."
          }
        ]
      }
    ],
    "draft": {
      "reply": "Hello,\n\nThanks for letting us know that project updates no longer sync across devices in the Smart-Thermometer Chef app since the recent software update, even after clearing the cache and reinstalling.\n\nTo investigate, could you please send us:\n1. The app version and device models you're using [TKT-41410]\n2. Details of the recent software update and any error messages you see [TKT-30602] [TKT-37024]\n\nIf it's easier, we can also schedule a call to go through the issue together [TKT-30602].\n\nBest regards,\nSupport team",
      "cited_ticket_ids": [
        "TKT-30602",
        "TKT-37024",
        "TKT-41410"
      ],
      "grounded": false,
      "issues": [
        "3 sentences not supported by a precedent"
      ],
      "sentences": [
        {
          "text": "Hello,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Thanks for letting us know that project updates no longer sync across devices in the Smart-Thermometer Chef app since the recent software update, even after clearing the cache and reinstalling.",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "To investigate, could you please send us:",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "The app version and device models you're using [TKT-41410]",
          "supported": true,
          "source_ticket_id": "TKT-41410",
          "score": 0.39
        },
        {
          "text": "Details of the recent software update and any error messages you see [TKT-30602] [TKT-37024]",
          "supported": true,
          "source_ticket_id": "TKT-30602",
          "score": 0.42
        },
        {
          "text": "If it's easier, we can also schedule a call to go through the issue together [TKT-30602].",
          "supported": true,
          "source_ticket_id": "TKT-30602",
          "score": 0.42
        },
        {
          "text": "Best regards,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Support team",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 36,
      "retrieval_ms": 109,
      "gate_ms": 3,
      "draft_ms": 0,
      "total_ms": 148
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-30602",
        "similarity": 0.425,
        "subject": "Trouble with ClickUp Integration Smart-Thermometer",
        "body_snippet": "",
        "answer_snippet": "Investigating the ClickUp integration issue with the Smart-Thermometer. To assist further, could you please provide details on the recent software updates and any specific error messages you are encountering? I would like to schedule a call to discuss the issue in more depth and work towards a resolution. I am available for a call at your convenience. Please let me know a suitable time to reach you at <tel_num> regarding account <acc_num>.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-37024",
        "similarity": 0.398,
        "subject": "Trouble with ClickUp Integration and Smart-Thermometer",
        "body_snippet": "",
        "answer_snippet": "We are looking into the ClickUp integration issue with the Smart-Thermometer. To assist further, could you please provide details on the recent software updates and any specific error messages you are encountering? We would like to schedule a call to discuss the issue in depth and work towards a resolution. I am available to call at your convenience. Please let me know a suitable time to reach you at <tel_num> regarding account <acc_num>.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-41410",
        "similarity": 0.386,
        "subject": "ClickUp Integration Issue with Smart-Thermometer",
        "body_snippet": "",
        "answer_snippet": "We are looking into the ClickUp integration issue with the Smart-Thermometer. To assist further, could you please provide details on the recent software updates and any exact error messages you are seeing? It would be helpful to schedule a call to discuss the issue in more depth and work towards a resolution. I am available for a call at your convenience. Please let me know a suitable time to reach you at <tel_num> regarding account <acc_num>.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-38613",
    "subject": "Inquiry on Adobe Effects Details",
    "body": "Is it possible to receive comprehensive specifications and integration guidelines for Adobe Effects 2021 SaaS platform? I would greatly appreciate any documentation or resources that can help me understand the integration process.",
    "received": "08:47",
    "dataset": {
      "row": 24678,
      "type": "Request",
      "queue": "Technical Support",
      "priority": "low"
    },
    "category": "Integrations and software bugs",
    "note": "Documentation request that matches an earlier ticket almost word for word [TKT-26136].",
    "route": null,
    "triage": {
      "type": "Request",
      "type_conf": 0.93,
      "queue": "Technical Support",
      "queue_conf": 0.9,
      "priority": "low",
      "priority_conf": 0.88,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "Hello,\n\nThank you for your interest in the Adobe Effects 2021 SaaS platform. We'll send the detailed specifications and integration guidelines, along with the related documentation, to you by email [TKT-26136].\n\nIf you're also working with Adobe After Effects, we can include a list of the available integrations and resources [TKT-18838].\n\nBest regards,\nTechnical Support",
      "cited_ticket_ids": [
        "TKT-18838",
        "TKT-26136"
      ],
      "grounded": false,
      "issues": [
        "2 sentences not supported by a precedent"
      ],
      "sentences": [
        {
          "text": "Hello,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Thank you for your interest in the Adobe Effects 2021 SaaS platform.",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "We'll send the detailed specifications and integration guidelines, along with the related documentation, to you by email [TKT-26136].",
          "supported": true,
          "source_ticket_id": "TKT-26136",
          "score": 0.91
        },
        {
          "text": "If you're also working with Adobe After Effects, we can include a list of the available integrations and resources [TKT-18838].",
          "supported": true,
          "source_ticket_id": "TKT-18838",
          "score": 0.46
        },
        {
          "text": "Best regards,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Technical Support",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 33,
      "retrieval_ms": 94,
      "gate_ms": 3,
      "draft_ms": 1110,
      "total_ms": 1240
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-26136",
        "similarity": 0.913,
        "subject": "Inquiry for Adobe Effects Details",
        "body_snippet": "",
        "answer_snippet": "Detailed specifications and integration guidelines for the Adobe Effects 2021 SaaS platform, along with relevant documentation, will be sent via email.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Request",
        "priority": "low"
      },
      {
        "ticket_id": "TKT-18838",
        "similarity": 0.458,
        "subject": "Support Required for Adobe After Effects Integrations",
        "body_snippet": "",
        "answer_snippet": "I will provide you with the available integrations and resources for Adobe After Effects shortly.",
        "language": "en",
        "queue": "Product Support",
        "type": "Request",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-39466",
        "similarity": 0.418,
        "subject": "Support Needed for Integrations of Adobe After Effects",
        "body_snippet": "",
        "answer_snippet": "I will offer you a detailed list of available integrations and related resources for Adobe After Effects shortly.",
        "language": "en",
        "queue": "Product Support",
        "type": "Request",
        "priority": "medium"
      }
    ]
  },
  {
    "ticket_id": "TKT-07574",
    "subject": "Assistance Required for Project Management Tool",
    "body": "Customer Support, please address the issue with the project management tool that has gained attention. The loading times have notably increased during peak hours and might be due to server limitations under high traffic. I have tried clearing the cache and refreshing the app, but the problem remains unresolved. I would be greatly helped if you could look into this matter and provide a solution as soon as possible. This increased loading time is impacting my productivity and overall experience with the tool. Please inform me of any updates.",
    "received": "09:12",
    "dataset": {
      "row": 20031,
      "type": "Problem",
      "queue": "Technical Support",
      "priority": "low"
    },
    "category": "Outages and slowdowns",
    "note": "Slow loading at peak hours, cache already cleared. Matches earlier project-tool performance tickets [TKT-28395] [TKT-48781].",
    "route": null,
    "triage": {
      "type": "Problem",
      "type_conf": 0.86,
      "queue": "Technical Support",
      "queue_conf": 0.81,
      "priority": "low",
      "priority_conf": 0.66,
      "language": "en",
      "key_terms": []
    },
    "clarifications": [
      {
        "field": "priority",
        "question": "Is the slowdown affecting just this user, or the whole team?",
        "ask_requester": "Is the slowdown only on your account, or are colleagues affected too?",
        "options": [
          {
            "label": "Just this user",
            "reply": "Then it isn't clearly a capacity problem yet. The past reply asked about server load and active users to confirm [TKT-48781].",
            "effect": {
              "conf": 0.88
            }
          },
          {
            "label": "The whole team",
            "reply": "Team-wide slowdowns at peak hours point to server capacity. I've raised it to medium and routed it to IT Support, which handled [TKT-48781].",
            "effect": {
              "conf": 0.9,
              "set": {
                "priority": "medium",
                "queue": "IT Support"
              },
              "reason": "Slowdown affects the whole team: route to IT Support"
            }
          }
        ]
      }
    ],
    "draft": {
      "reply": "Hello,\n\nThank you for reporting the longer loading times in the project management tool during peak hours, and for already trying the cache and refresh steps. We're sorry for the impact on your work [TKT-28395].\n\nTo find the cause, could you tell us roughly how many users are active when it slows down, and at what times of day it happens [TKT-48781]? We're also happy to set up a call to gather the details [TKT-35585].\n\nWe'll look into the loading times and update you as soon as we have a solution [TKT-28395].\n\nBest regards,\nTechnical Support",
      "cited_ticket_ids": [
        "TKT-28395",
        "TKT-35585",
        "TKT-48781"
      ],
      "grounded": false,
      "issues": [
        "2 sentences not supported by a precedent"
      ],
      "sentences": [
        {
          "text": "Hello,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Thank you for reporting the longer loading times in the project management tool during peak hours, and for already trying the cache and refresh steps.",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "We're sorry for the impact on your work [TKT-28395].",
          "supported": true,
          "source_ticket_id": "TKT-28395",
          "score": 0.71
        },
        {
          "text": "To find the cause, could you tell us roughly how many users are active when it slows down, and at what times of day it happens [TKT-48781]?",
          "supported": true,
          "source_ticket_id": "TKT-48781",
          "score": 0.41
        },
        {
          "text": "We're also happy to set up a call to gather the details [TKT-35585].",
          "supported": true,
          "source_ticket_id": "TKT-35585",
          "score": 0.4
        },
        {
          "text": "We'll look into the loading times and update you as soon as we have a solution [TKT-28395].",
          "supported": true,
          "source_ticket_id": "TKT-28395",
          "score": 0.71
        },
        {
          "text": "Best regards,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Technical Support",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 38,
      "retrieval_ms": 105,
      "gate_ms": 3,
      "draft_ms": 1320,
      "total_ms": 1466
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-28395",
        "similarity": 0.71,
        "subject": "Needed Assistance for Project Support",
        "body_snippet": "",
        "answer_snippet": "Thank you for bringing this issue to our attention and apologizing for any inconvenience caused. We will look into the project management tool's loading times and aim to provide a solution in a timely manner. Additional steps will be taken to resolve the issue as soon as possible.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "low"
      },
      {
        "ticket_id": "TKT-48781",
        "similarity": 0.408,
        "subject": "Concern Regarding Project Management Tool Performance",
        "body_snippet": "",
        "answer_snippet": "Regarding the performance lag issue with the project management tool, could you please provide details on the current server load and the number of users currently accessing the tool? This information will help us identify the root cause and provide a suitable solution. We can schedule a call at your convenient time via <tel_num> to discuss this further. We are committed to resolving the issue as soon as possible to minimize its impact on your project.",
        "language": "en",
        "queue": "IT Support",
        "type": "Problem",
        "priority": "high"
      },
      {
        "ticket_id": "TKT-35585",
        "similarity": 0.404,
        "subject": "Issues with Slow Loading Times",
        "body_snippet": "",
        "answer_snippet": "We will investigate the issue with the slow loading times on the project dashboard. Please, let's discuss at a convenient time to gather more information and resolve the issue as soon as possible.",
        "language": "en",
        "queue": "Technical Support",
        "type": "Problem",
        "priority": "high"
      }
    ]
  },
  {
    "ticket_id": "TKT-54875",
    "subject": "Fehler bei der Projektzeitplan-Synchronisation",
    "body": "Unvorhergesehene Probleme beim Projektzeitplan-Synchronisieren traten auf. Es könnte ein Inkompatibilität zwischen den Express.js und MySQL-Versionen die Ursache sein. Ich habe versucht, den Server neu zu starten, die Logs zu analysieren und die Datenbankverbindungen zu überprüfen. Trotz dieser Maßnahmen ist der Fehler leider bestehen geblieben. Ich würde Ihre Unterstützung in der Lösung dieses Problems sehr schätzen.",
    "received": "09:40",
    "dataset": {
      "row": 55493,
      "type": "Incident",
      "queue": "Product Support",
      "priority": "low"
    },
    "category": "Integrations and software bugs",
    "note": "Schedule sync fails, possibly an Express.js and MySQL version mismatch. The closest past reply asked for the exact versions first [TKT-45286].",
    "route": null,
    "triage": {
      "type": "Incident",
      "type_conf": 0.89,
      "queue": "Product Support",
      "queue_conf": 0.9,
      "priority": "low",
      "priority_conf": 0.87,
      "language": "de",
      "key_terms": []
    },
    "clarifications": [],
    "draft": {
      "reply": "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihre Nachricht zum Fehler bei der Projektzeitplan-Synchronisation und dafür, dass Sie den Server bereits neu gestartet und die Logs geprüft haben [TKT-45286].\n\nDamit wir die mögliche Inkompatibilität zwischen Express.js und MySQL untersuchen können, teilen Sie uns bitte mit:\n1. welche Versionen von Express.js und MySQL Sie aktuell verwenden [TKT-45286],\n2. welche Fehlermeldungen in den Logs erscheinen [TKT-13079],\n3. mit welchem Gerät und Browser Sie das Programm nutzen [TKT-50120].\n\nGern besprechen wir das Problem auch telefonisch. Nennen Sie uns dazu bitte einen passenden Zeitpunkt [TKT-45286].\n\nMit freundlichen Grüßen\nIhr Product-Support-Team",
      "cited_ticket_ids": [
        "TKT-13079",
        "TKT-45286",
        "TKT-50120"
      ],
      "grounded": false,
      "issues": [
        "2 sentences not supported by a precedent"
      ],
      "sentences": [
        {
          "text": "Sehr geehrte Damen und Herren,",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "vielen Dank für Ihre Nachricht zum Fehler bei der Projektzeitplan-Synchronisation und dafür, dass Sie den Server bereits neu gestartet und die Logs geprüft haben [TKT-45286].",
          "supported": true,
          "source_ticket_id": "TKT-45286",
          "score": 0.72
        },
        {
          "text": "Damit wir die mögliche Inkompatibilität zwischen Express.js und MySQL untersuchen können, teilen Sie uns bitte mit:",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "welche Versionen von Express.js und MySQL Sie aktuell verwenden [TKT-45286],",
          "supported": true,
          "source_ticket_id": "TKT-45286",
          "score": 0.72
        },
        {
          "text": "welche Fehlermeldungen in den Logs erscheinen [TKT-13079],",
          "supported": true,
          "source_ticket_id": "TKT-13079",
          "score": 0.37
        },
        {
          "text": "mit welchem Gerät und Browser Sie das Programm nutzen [TKT-50120].",
          "supported": true,
          "source_ticket_id": "TKT-50120",
          "score": 0.36
        },
        {
          "text": "Gern besprechen wir das Problem auch telefonisch.",
          "supported": false,
          "source_ticket_id": null,
          "score": 0.0
        },
        {
          "text": "Nennen Sie uns dazu bitte einen passenden Zeitpunkt [TKT-45286].",
          "supported": true,
          "source_ticket_id": "TKT-45286",
          "score": 0.72
        },
        {
          "text": "Mit freundlichen Grüßen",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        },
        {
          "text": "Ihr Product-Support-Team",
          "supported": true,
          "source_ticket_id": null,
          "score": 1.0
        }
      ]
    },
    "timings_ms": {
      "triage_ms": 40,
      "retrieval_ms": 112,
      "gate_ms": 4,
      "draft_ms": 1460,
      "total_ms": 1616
    },
    "sources": {
      "triage": "mock",
      "retrieve": "mock",
      "gate": "mock",
      "draft": "mock"
    },
    "precedents": [
      {
        "ticket_id": "TKT-45286",
        "similarity": 0.723,
        "subject": "Fehlschlag der Projektzeitplan-Synchronisation",
        "body_snippet": "",
        "answer_snippet": "Sehr geehrter <name>,\n\nich antworte auf Ihre E-Mail über das Projektzeitplan-Synchronisationsproblem. Dank Ihrer Bemühungen, durch Serverneustart und Logprüfung zu intervenieren. Um das Kompatibilitätsproblem zwischen den Express.js und MySQL-Versionen weiter zu untersuchen, könnten Sie mir bitte mitteilen, welche spezifischen Versionen Sie zurzeit verwenden. Darüber hinaus wäre ich für einen Telefonanruf, um die Angelegenheit weiter zu diskutieren, zu sprechen. Wann ist Ihnen ein passender Zeitpunkt? Teilen Sie mir bitte eine geeignete Zeit mit, und ich werde mich bei Ihnen melden, um Ihnen bei der Lösung des Synchronisationsproblems in Ihrem Projektzeitplan zu helfen.\n\nMit freundlichen Grüßen",
        "language": "de",
        "queue": "Product Support",
        "type": "Incident",
        "priority": "low"
      },
      {
        "ticket_id": "TKT-13079",
        "similarity": 0.368,
        "subject": "Probleme mit dem Projektzeitplan",
        "body_snippet": "",
        "answer_snippet": "Sehr geehrte <name>, ich schreibe, um die Eingabe Ihrer E-Mail zu bestätigen, in der Sie ein Problem mit den Zeitplänen melden, die nicht synchronisiert werden. Ich entschuldige mich für die Unannehmlichkeiten, die Ihnen dadurch entstanden sind, und ich freue mich darauf, Ihnen dabei zu helfen, dieses Problem zu lösen. Sie haben erwähnt, dass Sie das System neu gestartet und die Einstellungen überprüft haben, aber das Problem behält sich trotz dieser Bemühungen bei. Ich würde gerne einige zusätzliche Informationen sammeln, um das Problem besser zu verstehen. Könnten Sie mir bitte mehr Details über die Integrationseinwandteile, die Sie als möglichen Ursprung des Problems vermuten, geben? Zudem wäre es hilfreich, wenn Sie mir Ihre <acc_num> und eine detaillierte Beschreibung der Fehlernachrichten angeben könnten, die Sie sehen. Ich werde diese Informationen überprüfen und Sie mit einer Lösung oder zur Anforderung nach weiteren Details kontaktieren, falls nötig. Wenn erforderlich, könnte ich es mir zur Aufnahme eines Anrufs mit Ihnen am <tel_num> vorstellen, um das Problem weiter zu besprechen.",
        "language": "de",
        "queue": "Product Support",
        "type": "Problem",
        "priority": "medium"
      },
      {
        "ticket_id": "TKT-50120",
        "similarity": 0.365,
        "subject": "Problematik beim Projektzeitplan",
        "body_snippet": "",
        "answer_snippet": "Sehr geehrte <name>, ich bin froh, dass Sie sich bei uns gemeldet haben, um das Problem mit der Projektzeitplanung zu melden, das Sie erleben. Ich entschuldige mich für die Unannehmlichkeiten und werde Ihnen mein Bestes geben, um dieses Problem zu lösen. Könnten Sie bitte mir mehr Informationen über das recent Update oder die Integrationsproblematik geben, von denen Sie sprechen, beispielsweise datumsangaben und Fehlermeldungen? Zudem verwenden Sie welches Gerät und welchen Browser, um das Programm zu bedienen? Diese Informationen werden mir helfen, das Problem besser zu verstehen. Wenn erforderlich, werde ich einen Anruf vereinbaren, um die Angelegenheit weiter zu besprechen. Bitte teilen Sie mir einen geeigneten Zeitpunkt für den Anruf mit <tel_num>.",
        "language": "de",
        "queue": "Product Support",
        "type": "Problem",
        "priority": "high"
      }
    ]
  }
]

// Incident counts from the full dataset (type = Incident), grouped into SentinelDesk categories by
// keyword rules (EN + DE). Real counts; the category rules are a first draft.
export const INCIDENT_SOURCES = {
  "queues": [
    "Technical Support",
    "Product Support",
    "Customer Service",
    "IT Support",
    "Billing and Payments",
    "Service Outages and Maintenance",
    "Other teams"
  ],
  "data": {
    "all": [
      {
        "name": "Security and data breaches",
        "n": 4347,
        "high": 1965,
        "medium": 1673,
        "low": 709,
        "de": 1856,
        "queues": [
          1817,
          822,
          449,
          436,
          211,
          106,
          506
        ]
      },
      {
        "name": "Outages and slowdowns",
        "n": 5809,
        "high": 3035,
        "medium": 1867,
        "low": 907,
        "de": 2209,
        "queues": [
          2431,
          1046,
          448,
          779,
          63,
          678,
          364
        ]
      },
      {
        "name": "Billing and payments",
        "n": 858,
        "high": 248,
        "medium": 415,
        "low": 195,
        "de": 345,
        "queues": [
          16,
          8,
          4,
          3,
          804,
          2,
          21
        ]
      },
      {
        "name": "Accounts and sign-in",
        "n": 432,
        "high": 122,
        "medium": 179,
        "low": 131,
        "de": 185,
        "queues": [
          143,
          61,
          75,
          89,
          5,
          5,
          54
        ]
      },
      {
        "name": "Integrations and software bugs",
        "n": 5641,
        "high": 2190,
        "medium": 2326,
        "low": 1125,
        "de": 2610,
        "queues": [
          2259,
          1340,
          611,
          579,
          55,
          135,
          662
        ]
      },
      {
        "name": "Hardware and devices",
        "n": 589,
        "high": 249,
        "medium": 206,
        "low": 134,
        "de": 270,
        "queues": [
          262,
          89,
          53,
          84,
          4,
          62,
          35
        ]
      },
      {
        "name": "Data, backup and recovery",
        "n": 87,
        "high": 44,
        "medium": 30,
        "low": 13,
        "de": 43,
        "queues": [
          53,
          12,
          9,
          8,
          0,
          1,
          4
        ]
      },
      {
        "name": "Questions and requests",
        "n": 1681,
        "high": 604,
        "medium": 667,
        "low": 410,
        "de": 713,
        "queues": [
          428,
          451,
          280,
          96,
          24,
          57,
          345
        ]
      }
    ],
    "en": [
      {
        "name": "Security and data breaches",
        "n": 2491,
        "high": 1121,
        "medium": 958,
        "low": 412,
        "de": 0,
        "queues": [
          1056,
          480,
          242,
          247,
          118,
          59,
          289
        ]
      },
      {
        "name": "Outages and slowdowns",
        "n": 3600,
        "high": 1892,
        "medium": 1148,
        "low": 560,
        "de": 0,
        "queues": [
          1519,
          694,
          282,
          459,
          19,
          424,
          203
        ]
      },
      {
        "name": "Billing and payments",
        "n": 513,
        "high": 151,
        "medium": 254,
        "low": 108,
        "de": 0,
        "queues": [
          0,
          0,
          0,
          0,
          502,
          0,
          11
        ]
      },
      {
        "name": "Accounts and sign-in",
        "n": 247,
        "high": 76,
        "medium": 102,
        "low": 69,
        "de": 0,
        "queues": [
          89,
          30,
          39,
          57,
          4,
          1,
          27
        ]
      },
      {
        "name": "Integrations and software bugs",
        "n": 3031,
        "high": 1099,
        "medium": 1303,
        "low": 629,
        "de": 0,
        "queues": [
          1144,
          779,
          354,
          291,
          28,
          65,
          370
        ]
      },
      {
        "name": "Hardware and devices",
        "n": 319,
        "high": 131,
        "medium": 113,
        "low": 75,
        "de": 0,
        "queues": [
          146,
          50,
          20,
          53,
          1,
          32,
          17
        ]
      },
      {
        "name": "Data, backup and recovery",
        "n": 44,
        "high": 20,
        "medium": 17,
        "low": 7,
        "de": 0,
        "queues": [
          24,
          7,
          7,
          4,
          0,
          1,
          1
        ]
      },
      {
        "name": "Questions and requests",
        "n": 968,
        "high": 344,
        "medium": 404,
        "low": 220,
        "de": 0,
        "queues": [
          240,
          260,
          159,
          54,
          16,
          32,
          207
        ]
      }
    ],
    "de": [
      {
        "name": "Security and data breaches",
        "n": 1856,
        "high": 844,
        "medium": 715,
        "low": 297,
        "de": 1856,
        "queues": [
          761,
          342,
          207,
          189,
          93,
          47,
          217
        ]
      },
      {
        "name": "Outages and slowdowns",
        "n": 2209,
        "high": 1143,
        "medium": 719,
        "low": 347,
        "de": 2209,
        "queues": [
          912,
          352,
          166,
          320,
          44,
          254,
          161
        ]
      },
      {
        "name": "Billing and payments",
        "n": 345,
        "high": 97,
        "medium": 161,
        "low": 87,
        "de": 345,
        "queues": [
          16,
          8,
          4,
          3,
          302,
          2,
          10
        ]
      },
      {
        "name": "Accounts and sign-in",
        "n": 185,
        "high": 46,
        "medium": 77,
        "low": 62,
        "de": 185,
        "queues": [
          54,
          31,
          36,
          32,
          1,
          4,
          27
        ]
      },
      {
        "name": "Integrations and software bugs",
        "n": 2610,
        "high": 1091,
        "medium": 1023,
        "low": 496,
        "de": 2610,
        "queues": [
          1115,
          561,
          257,
          288,
          27,
          70,
          292
        ]
      },
      {
        "name": "Hardware and devices",
        "n": 270,
        "high": 118,
        "medium": 93,
        "low": 59,
        "de": 270,
        "queues": [
          116,
          39,
          33,
          31,
          3,
          30,
          18
        ]
      },
      {
        "name": "Data, backup and recovery",
        "n": 43,
        "high": 24,
        "medium": 13,
        "low": 6,
        "de": 43,
        "queues": [
          29,
          5,
          2,
          4,
          0,
          0,
          3
        ]
      },
      {
        "name": "Questions and requests",
        "n": 713,
        "high": 260,
        "medium": 263,
        "low": 190,
        "de": 713,
        "queues": [
          188,
          191,
          121,
          42,
          8,
          25,
          138
        ]
      }
    ]
  }
} as const
