# SentinelDesk

Hackathon project: multilingual incident triage and grounded resolution copilot.

- Python pipeline (triage, retrieval, gate, drafting) at the repo root; shared contracts in `shared/contracts.py` (tell the team before changing it).
- Frontend: Next.js + shadcn/ui + Tailwind in `web/`. Before any UI work, use the `sentinel-ui` skill (`.claude/skills/sentinel-ui`, also `.agents/skills/sentinel-ui`) and follow `web/DESIGN.md`.
- `main` requires a reviewed pull request; work on a branch.
