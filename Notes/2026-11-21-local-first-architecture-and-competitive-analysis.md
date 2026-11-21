# Local-First Architecture and Competitive Analysis

Source: [Granola note](https://notes.granola.ai/t/fda5f1cf-6ab0-48be-ad36-a1992ec0b356-008umkv4)  
Date: 2026-11-21

## Architecture: Local-First Approach

- Core design decision: everything runs locally.
  - This is a key differentiator from other hackathon teams and avoids cloud data privacy issues.
  - One judge works at CVS in healthcare, making the privacy angle timely.
- A cloud extension is planned as a bonus feature:
  - Mask or redact data before sending it to any cloud API.
  - Support firms that already pay for cloud models and want to use them.

## Ticket Triage and Classification

- The immediate goal is to triage tickets into `low`, `medium`, and `critical`, rather than resolve them.
  - The challenge spec emphasizes surfacing solutions; actual ticket resolution stays in the company's own tools and interface.
- Urgency classification uses keyword probability: if 90% or more of the tickets containing a word are marked critical, flag that word for automatic review.
- Autonomous ticket resolution is a stretch or theoretical feature; the concept can be demonstrated without building it fully.
- Input validation can check text-based claims, but not image-based claims.

## Competitive Intelligence

- Public GitHub repos from concurrent GDG hackathons were collected and filtered by recent commits to find active teams.
- Repos were zipped and synthesized with Claude into a Markdown peer review, which was shared to Discord.
- Concurrent hackathons were also found in Germany and Hungary:
  - Hungarian repos were being reviewed.
  - Reaching out to the German team for collaboration was suggested.

## UI and Product Experience

- The current UI has an expandable ticket interface on the right.
  - Replace the transparent bars in the “where incidents come from” section; they feel claustrophobic.
  - Carvana and CarMax were references for a customer chat widget in the bottom corner.
- Proposed experience:
  - Customer-facing queries use a chat popup in the bottom-right corner.
  - Operators use a separate agent-facing view.
  - Email and chat messages go through the same backend pipeline.
- Add an FAQ or popular topics section; caching frequent questions could reduce latency.
- Build a website as a proof of concept for judges, with an offer to build it out further.

## Tooling and Infrastructure

- Switched from school credits to a $5 OpenRouter top-up after school credits proved unreliable.
- A tree graph for deterministic ticket categories was pushed to GitHub on the Tofu branch under the UI folder.
- A large CSV was pushed directly to GitHub because it was too large for Discord.
- A classifier-based harness to auto-click through repos was suggested by Jev; it was not built yet but may be useful custom tooling.
- A Mac server runs 24/7 for agents, the iMessage bot, CI, and project hosting. A Raspberry Pi from a Micro Center contact was being considered as an alternative.

## Next Steps

- Review the deterministic category diagram on the Tofu branch in the UI folder.
- Finalize the critical keyword list; category compression to `low`, `medium`, and `critical` using keyword probability is in progress.
- Build the judge-demo website UI using the Carvana-style chat widget, popular topics, and a shared chat/email pipeline.
- Share the ticket list and Claude peer review Markdown in Discord; the synthesis is done, and remaining data can be posted when time allows.

