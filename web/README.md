# SentinelDesk web

Next.js + shadcn/ui console. Design rules: [DESIGN.md](DESIGN.md). Live reference: `/design`.

```bash
cd web
pnpm install
pnpm dev        # http://localhost:3000/design
```

## Demo scope (to be scoped out further)

Start with three pages. Routes and interactions are provisional, and more pages can follow once the demo flow is defined.

| Page | Initial scope |
| --- | --- |
| Triage inbox (`/tickets`) | Submit a ticket and see it routed by type, queue, and inferred priority. Filter the list and flag tickets that need clarification or escalation. |
| Ticket detail (`/tickets/[id]`) | Show the original message, classification, auto-triage decision and reason, and the evidence behind any suggested reply. Give the operator the draft and its citations, a clarifying question, or an escalation reason as appropriate. |
| Operations dashboard (`/dashboard`) | Show ticket volume, queue breakdown, and escalation rate. Chart selections can open the corresponding inbox view. |

### Auto-triage in ticket detail

1. Classify the ticket by type, then queue, and infer priority. Use deterministic handling where the rules already cover the case.
2. For cases that could use the LLM, check whether available evidence makes the proposed handling verifiable. If evidence is missing or the ticket is ambiguous, ask for clarification or route it for human review. Escalate high-risk cases with a reason.
3. For eligible tickets, generate a draft using relevant precedents. Check that its claims are supported, link the cited tickets, and flag or withhold unsupported output for review.

### Demo runtime

Run the console and backend locally for the demo. The UI can simulate a hosted workflow. Model access can use an existing subscription if it supports the demo flow, with the provider and access method still to be decided. Use fixtures while integration is pending and label simulated results as demo data.
