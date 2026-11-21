# Customer `/submit`: backend test handoff

Branch `feat/customer-submit` (PR #21, on hold for design review). Nothing in the frontend calls the backend yet.

## Open it

| What | How |
|---|---|
| Rough two-page prototype (customer + operator tabs) | Download [`customer-submit-prototype.html`](customer-submit-prototype.html) and open it in a browser. Single file, no server. |
| Real `/submit` page | `git switch feat/customer-submit && cd web && pnpm install && pnpm dev`, then open `http://localhost:3000/submit` and use the **Demo** menu |
| Engineer UI (Toffy) | `/tickets`, `/tickets/[id]`, `/dashboard` on branch `toffy`; standalone [`docs/preview/sentineldesk-console.html`](https://github.com/thaninbew/gdg/blob/toffy/docs/preview/sentineldesk-console.html) |
| Backend | `uv run uvicorn api.server:app --port 8000` on `main` (`GET /health`, `POST /triage`) |

## What is real, fixture, or missing

| Piece | Status |
|---|---|
| `/submit` routing, the one pre-submit question, ticket IDs | **Fixture.** Local rules in `web/app/submit/logic.ts` (`analyze`, `resolve`, `ticketId`) |
| Invoice breakdown, the precedent `TKT-03990`, simulated paging, the sample product review | **Fixture.** Sample records in `logic.ts`, labelled Mock, Simulated or Sample on screen |
| `POST /triage` | **Real on `main`, not called by `/submit`.** No request from this branch has reached it |
| Clarifying-question endpoint | **Missing.** The backend has no clarify call; `/submit` asks fixed template questions |
| Ticket persistence and ID | **Missing.** `pipeline.run()` returns no ticket ID and stores nothing. `/submit` IDs are a local hash, so the same ID does not yet appear in Toffy's `/tickets/[id]` (his fixtures use other IDs) |
| Customer to operator link | **Missing between branches.** Only the rough prototype shows it, synthetically |

## Samples to test with

| Sample | Subject / body for `POST /triage` | `/submit` behaviour (fixture) |
|---|---|---|
| Question before submit | `""` / `Can you break down the charges on my latest invoice? The total is higher than last month.` | Continue, then "Which invoice?". `INV-2026-1104` gives a verified breakdown. ID `TKT-26887` |
| Question before submit | `""` / `The desktop app keeps signing me out every few minutes since I reset my password this morning.` | "Who is affected?": Just me gives a grounded answer, Everyone goes urgent. ID `TKT-25160` |
| Critical, no question | `VPN down for all remote clinicians` / `VPN is down for all of our remote clinicians since 08:10. Nobody off-site can reach the EMR and our 09:00 telehealth appointments are at risk.` | Sends directly, then "Sent to on-call as urgent" (Simulated). ID `TKT-20431` |

```bash
curl -s localhost:8000/triage -H 'content-type: application/json' \
  -d '{"subject":"VPN down for all remote clinicians","body":"VPN is down for all of our remote clinicians since 08:10. Nobody off-site can reach the EMR and our 09:00 telehealth appointments are at risk."}'
```

## Response shape to wire against

`POST /triage` returns `pipeline.run(subject, body)`. This shape is read from `pipeline.py` and `shared/contracts.py` at `main` `f1a1b4c`. It was not observed from a running server, and the values below are illustrative.

```jsonc
{
  "triage": { "type": "Incident", "type_conf": 0.81, "queue": "Technical Support", "queue_conf": 0.74,
              "priority": "high", "priority_conf": 0.69, "language": "en", "key_terms": ["vpn", "offline"] },
  "precedents": [ { "ticket_id": "TKT-04187", "similarity": 0.89, "subject": "", "body_snippet": "",
                    "answer_snippet": "…", "language": "en", "type": "Incident", "queue": "…", "priority": "high" } ],
  "escalate": true,
  "reasons": ["High-priority incident: page the on-call engineer"],
  "draft": { "reply": "…", "cited_ticket_ids": ["TKT-04187"], "grounded": true, "issues": [],
             "sentences": [ { "text": "…", "supported": true, "source_ticket_id": "TKT-04187", "score": 0.83 } ] },
  "timings_ms": { "triage_ms": 0, "retrieval_ms": 0, "gate_ms": 0, "draft_ms": 0, "total_ms": 0 },
  "sources": { "triage": "real", "retrieve": "real", "gate": "real", "draft": "real" }
}
```

An empty body returns 422. `web/lib/types.ts` on `main` does not yet include `key_terms`, the precedent `type`/`queue`/`priority`, or `draft.sentences`.

## Proposed wiring (not implemented)

1. On **Send request**, `POST /triage` with `subject` set to the starting point or `""`, and `body` set to the text plus the answered detail (for example `Invoice: INV-2026-1104`).
2. Map the response to the customer outcome:
   - an outage, security or high-priority reason gives urgent
   - `!escalate && draft.grounded` gives a suggested fix that cites `cited_ticket_ids`
   - any other escalation gives a handoff with the first reason
3. Keep the invoice breakdown local. There is no billing API.
4. A backend ticket ID and store, so `/submit` and `/tickets/[id]` share one ID.
5. Optionally, a clarify call that returns at most one short question when type or priority confidence is below 0.70. It only phrases the question; it never decides permissions or actions.
