# Help desk ticket classification and routing system design

Source: [Granola meeting notes](https://notes.granola.ai/t/b0234ef0-da90-491c-a35e-45b397ee7842-008umkv4)  
Date: 2026-11-21

These are meeting discussion notes. Proposed features and next steps are not necessarily implemented in the repository.

## Classification Architecture

- Two-layer classification required: type first, then queue.
  - Type: incident, problem, or request (broad).
  - Queue: specific categories (tech support, returns, billing, etc.).
- Priority assigned by model inference, not user input.
  - Asking users to self-report priority yields unreliable answers.
- Confidence thresholds for ambiguous classifications.
  - Below ~0.7: flag as ambiguous, prompt clarifying question.
  - High-confidence scores (0.95 vs. 0.98): not displayed.
  - Use tiers or plain language (“slightly ambiguous”) instead of raw percentages.
  - If both type and queue are below threshold: two clarifying questions acceptable.

## Model Usage Strategy

- Use LLM only where deterministic code cannot handle the case.
  - Reduces hallucination risk and cost.
  - Code handles the majority of cases; model handles edge cases.
- Feed model only context relevant to the classified category.
  - E.g., billing context for billing tickets, tech support context for incidents.
  - Giving the model all context causes hallucinations.
- Benchmark against the provided dataset to evaluate classification accuracy.

## Baseline vs. Differentiators

- Every team will likely implement:
  1. Ticket sorting with confidence scores.
  2. Escalation logic for uncertain/risky tickets.
  3. Historical ticket citations.
- Differentiator ideas discussed:
  - Multi-channel ingestion: web form, voice/audio (via Gemini multimodal), email.
  - Accessibility: speech-to-text for blind/visually impaired users (flagged as bonus feature).
  - Mock Slack/WhatsApp integrations in the UI demo.

## UI and Tech Stack

- Stack: Next.js, ShadCN component library, MongoDB.
- Design inspiration: Datadog (graph visualization) + PagerDuty (modern, clean).
- Color scheme: gradient, possibly Gemini-style blue gradient.
- Backend JSON POST structure pushed to repo; UI team can run fake data independently.
- Design references to be added to repo.

## Repo and Demo Logistics

- Branch protection: PR required before merging to main, one approval required.
  - Prevents agents from pushing directly to main.
- Demo format: 5-minute live demo, 3-minute judge Q&A.
  - Prioritize visually impressive elements (graphs, dashboard) for live demo.
- Hosting: GitHub Pro for test site, or localhost as fallback.

## Next Steps

- Add design references to the repo.
  - Finalize Datadog/PagerDuty-inspired color scheme so UI work can begin.
- Enable branch protection on main.
  - Require one PR approval before merging; prevents accidental agent pushes.
- Map out ticket categories and cross off deterministic ones.
  - Identify which of the ~16 category combinations can be handled by code alone before building model logic.
