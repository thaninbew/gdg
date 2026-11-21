# Customer `/submit`: backend test handoff

Branch `feat/customer-submit` (PR #21). `/submit` calls the team API through a same-origin proxy, `web/app/submit/backend/route.ts`, which forwards to `SENTINEL_API_URL` (loopback only, default `http://127.0.0.1:8000`). When the API is down, the page falls back to local rules and says so.

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
| Classification panel and the send decision | **Wired to `POST /triage`** (`web/app/submit/pipeline.ts`). Verified against `api/server.py` running with `MOCK=triage,retrieve,gate,draft`; the real classifier, Chroma and Gemma have not been exercised from the page. The page shows a Mock badge whenever `sources` reports a stage as not real |
| Pre-submit question, ticket IDs, offline fallback | **Local.** `web/app/submit/logic.ts` (`analyze`, `resolve`, `ticketId`) |
| Invoice breakdown, sample answer, simulated paging, sample product review | **Fixture, offline only.** Sample records in `logic.ts`, labelled Sample, Simulated or Local rules on screen. No dataset ticket IDs are cited |
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

## Wiring (implemented in `pipeline.ts`)

- Nothing is classified while typing. On **Send request**: `POST /triage` with `subject` = Title and `body` = details plus the answered question as plain text (for example `Which invoice? INV-2026-1104`), since the contract has no clarification field.
- The response decides:
  - an on-call, outage, security or critical-service reason gives urgent
  - `escalate`, `!draft.grounded` or no supported sentence citing a returned precedent gives a handoff to `triage.queue`
  - otherwise an answer, citing only `supported` sentences whose `source_ticket_id` is in `precedents`
  - local samples never override the backend; the invoice breakdown appears only offline (no billing API)
- Receipts say "Demo: not saved, no one notified": there is no ticket store, and My requests lives in the browser session.

## Still missing

- A backend ticket ID and store, so `/submit` and `/tickets/[id]` share one ID.
- A clarify call that returns at most one short question when type or priority confidence is below 0.70. It only phrases the question; it never decides permissions or actions.

Run both: `uv run uvicorn api.server:app --port 8000` and `cd web && pnpm dev`, then open `/submit`.
