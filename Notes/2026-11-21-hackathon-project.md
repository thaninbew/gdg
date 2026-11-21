# Hackathon project: support ticket classification and automation with Toffee and Loki

Source: [Granola note](https://notes.granola.ai/t/70a3f184-c17f-4b9c-aec7-72bc64359e4f-008umkv4)  
Date: 2026-11-21

## Data Preprocessing and Label Strategy

- Priority labels: merging 5 levels down to 3 (critical, high/medium, low)
  - “Critical” kept because it aligns with security/incident response conventions (CVE, Tenable)
  - “Very low” dropped, folded into low
- Queue categories: 52 total, plan to merge duplicates
- Working subset of 20,000 rows for initial testing; full dataset run after setup
- Dataset is English and German only; no French needed
  - Attack examples to cover: English, German, French, English/German mixed, Russian (non-Latin script for broader coverage)
  - Translated entries keep their language tag so classifiers still work; English version is just for human readability

## Classification Pipeline and Accuracy

- Three-part pipeline:
  1. Cheap local text/keyword model for tagging (type, team, urgency): under 1 second, no LLM needed
  2. Gemini API for priority reclassification (still running)
  3. ChromaDB RAG for general inquiry responses: returns 5 most similar non-duplicate, non-empty tickets, language-agnostic
- Accuracy check on 1,000 sample: 35.8% agreement with original labels
  - Likely a label mismatch bug: model used 3 labels (low/medium/critical) against dataset’s 5
  - Rerunning with updated zip file to confirm
- Confidence scores on predictions: implemented but not yet validated
- Safety keyword logic: if 90%+ of queries containing a word are marked critical, flag it as a safety keyword
- RAG baseline goal: end-to-end system running first, then hybrid/keyword search improvements

## UI, Demo Flow, and Features

- Pages being built: customer ticket intake form, ticket detail view (engineer side)
- Anomaly detection: aggregate ticket types; flag broader outage if volume exceeds 2 sigma in a period (similar to Datadog/Down Detector)
- AI auto-resolution flowchart drafted: classify, check risk/verifiability, human review if ambiguous
  - Low-risk, deterministic tickets can be resolved by agent directly
  - Ambiguity reduction: agent asks a clarifying question before escalating
  - Agent response target: under 1-2 seconds; timing to be tested before deciding on UX
- Demo strategy: guided demo script (pre-filled inputs, automated click-through) alongside live version
  - Reduces failure risk; can rehearse full flow beforehand
- Logo pushed to repo: desk lamp style with gradient, lion motif

## Repo and Tooling

- PR approval permissions: being opened up so all team members can approve
- No CI pipeline: agreed it would slow things down
- Agent (unnamed) running to review and merge PRs; can be triggered via Discord ping
- Repo to stay private until submission
- Google API credits link needed: currently using personal OpenRouter account (~$0.30 spent)
- `tasks.md` in repo provides agent context for each workstream

## Next Steps

- Rerun priority classification with updated zip file
  - Previous run compared 3 labels against 5, causing the 35.8% accuracy result; updated labels should fix this.
- Add AI auto-resolution flowchart to GitHub repo
  - Flowchart drafted; needs to be pushed so the UI can be built around it.
- Share Google API credits link in Discord
  - Team member has been covering costs on personal OpenRouter account.
- Test agent response latency end-to-end
  - Determine if under 1-2 seconds is achievable before deciding on UX for async vs. instant replies.

Chat with meeting transcript: https://notes.granola.ai/t/1e9d578a-7019-43dd-b8b2-7fa92ab7b3b3
