# SentinelDesk UI references and design brief

Scope: research only. The goal is an operator console that looks trustworthy because every claim on screen
points to its evidence. Researched 2026-11-21 from official docs and product pages, linked below.

> Images live in `ui-references/img/`, which is **gitignored** because the repo is public and these are
> vendor screenshots. They render only in a local checkout, not on GitHub. Every image comes from the
> vendor's own site, docs or CDN and was opened and checked by eye. Perplexity was dropped because it
> publishes no real UI image (its og:images are artwork); its inline-citation pattern is covered under
> Intercom.

## 1. References

### 1. Zendesk: auto assist and intelligent triage
<https://support.zendesk.com/hc/en-us/articles/7051314237466-Using-auto-assist-to-solve-tickets> ·
<https://support.zendesk.com/hc/en-us/articles/4550640560538>

![Zendesk auto assist rationale and sources](ui-references/img/zendesk-1.png)
*Steal: a "Why this suggestion was generated" popover listing clickable sources, with **Edit / Approve**
on the draft. Source: support.zendesk.com article 7051314237466.*

![Zendesk German draft with translation toggle](ui-references/img/zendesk-2.png)
*Steal: a German draft with a "Show in English" toggle in the header, the exact EN/DE case we need.
Source: same article.*

- Every predicted field has a confidence field next to it (Topic, Sentiment, Language). Zendesk tells
  admins to pick the confidence threshold for automatic action. That threshold is our risk dial.

### 2. Intercom: Copilot (also covers the Perplexity citation pattern)
<https://www.intercom.com/help/en/articles/9121374-copilot-explained>

![Intercom Copilot source hover preview](ui-references/img/intercom-1.png)
*Steal: numbered citation chips after each sentence; hovering one shows the source title, type, age and
the exact passage. Source: intercom.com/help article 9121374.*

![Intercom Copilot sources list and Improve answer](ui-references/img/intercom-2.png)
*Steal: "15 relevant sources found", then **See all** and **Improve answer**, with the sources the draft
used shown separately from the ones only found. Source: same article.*

### 3. PagerDuty: Operations Console, AI tab and Probable Origins
<https://www.pagerduty.com/platform/aiops/> · <https://docs.pagerduty.com/ai-automation/aiops/past-incidents>

![PagerDuty ops console with AI tab](ui-references/img/pagerduty-1.png)
*Steal: a dense list on the left and a detail rail on the right; status pills (Triggered, Acknowledged,
Resolved); an "Anomaly: similar to 4% of incidents" outlier chip; an AI summary that cites cases by ID and
says "AI generated content may be incorrect". Source: pagerduty.com/platform/aiops.*

![PagerDuty Probable Origins](ui-references/img/pagerduty-2.png)
*Steal: a "Frequent: similar to 69% of incidents" label under the title, and "95% likely origin" pills in
red. Source: pagerduty.com/platform/aiops.*

### 4. Linear: Triage Intelligence
<https://linear.app/docs/triage-intelligence>

![Linear Triage Intelligence pane](ui-references/img/linear-1.png)
*Steal: the suggestion pane sits under the title; a **dashed** outline means suggested and a solid ✓ means
applied; duplicate and related rows show a monospace ID. Source: linear.app/docs/triage-intelligence.*

![Linear suggestion reasoning popover](ui-references/img/linear-2.png)
*Steal: "Why this assignee was suggested" in two bullets, with Alternatives and **Accept suggestion** plus a
thumbs-down. Source: same page.*

### 5. Datadog: Bits Investigation
<https://www.datadoghq.com/blog/bits-ai-sre/>

![Datadog Bits investigation](ui-references/img/datadog-1.png)
*Steal: a **CONCLUSIVE** status chip next to the title; a hypothesis legend with Validated, Inconclusive and
Invalidated; chat on the left and the evidence tree on the right. Use the same three states for draft
sentences. Source: datadoghq.com/blog/bits-ai-sre.*

### 6. FireHydrant: Command Center
<https://docs.firehydrant.com/docs/the-command-center>

![FireHydrant Command Center](ui-references/img/firehydrant-1.jpg)
*Steal: SEV1 and status pills in the title row; a milestone stepper; an "AI Experiment" tag on the
generated Incident Summary with a **Regenerate** button; Suggested Incidents in the right rail.
Source: docs.firehydrant.com (Command Center cover image).*

### 7. Rootly: AI SRE
<https://rootly.com/ai-sre>

![Rootly AI SRE](ui-references/img/rootly-1.webp)
*Steal: the bot reply is structured as "What I've Found So Far" followed by **Likely Root Cause**, and the
mobile Summary shows a "Generated 22 hours ago" freshness stamp. Source: rootly.com/ai-sre (og:image).*

### 8. incident.io: insights dashboards
<https://docs.incident.io/ai/assistant> (core dashboards section)

![incident.io incidents by severity](ui-references/img/incidentio-1.png)
*Steal: one hue for severity (pale = minor, dark = critical), with an exact count and percentage per
severity and a proportional bar. Source: docs.incident.io (mintcdn core-dashboards).*

![incident.io alert frequency table](ui-references/img/incidentio-2.png)
*Steal: a stacked weekly volume chart above a sortable frequency table. This is how to show burst
detection. Source: same.*

- The investigation docs use named confidence levels (Speculation → Pattern match → Supported by context →
  Validated → Validated, alternatives ruled out). Name the kind of evidence behind "likely cause".

## 2. Recommended single-screen layout

Desktop is 1440 px wide: an input rail plus a two-column workspace, with no tabs. The screen reads from top
to bottom as verdict → evidence → draft. At 1024 px and below, the right column moves below the left one.

```
┌─ SentinelDesk ─────────────────────────────── model v3 · calibrated on 2,140 held-out · ⌘K ─┐
│ ▲ MAJOR OUTAGE?  14 "VPN" tickets in 20 min (5.6× baseline) · view cluster          [hide] │
├──────────────────────┬──────────────────────────────────────────────────────────────────────┤
│ TICKET               │ ┌ VERDICT ─────────────────────────────────────────────────────────┐ │
│ Subject [VPN drops…] │ │ ● Escalate to On-Call: P1 + low retrieval support   [DE→EN]       │ │
│ Body                 │ │   Type  Incident        ████████▌ 0.91  High                      │ │
│ [                  ] │ │   Queue Network/VPN     ██████▏   0.68  Med   ⓘ 4/5 neighbors      │ │
│ (no subject → "—")   │ │   Prio  P1 Critical     ███████▊  0.84  High                      │ │
│ [Analyze  ⌘↵]        │ │   ⏱ 412 ms  embed 38 · retrieve 21 · classify 64 · draft 271 · cite 18│ │
│ Samples ▾            │ └──────────────────────────────────────────────────────────────────┘ │
│  EN outage           │ ┌ INCIDENT BRIEF (escalated) ─────────────┐ ┌ EVIDENCE ─────────────┐ │
│  DE Passwort reset   │ │ Summary   VPN tunnel drops after FW...  │ │ #48213  0.87 ●used    │ │
│  Null subject        │ │ Likely    Expired IKE cert   [#48213]   │ │  "Renewed IKE cert…"  │ │
│  Prompt injection    │ │ cause     Supported by 2 tickets        │ │ #47790  0.81 ●used    │ │
│ ──────────────       │ │ Past fix  Renew cert, restart gw [#477] │ │ #45102  0.62 ○found   │ │
│ RED-TEAM PACK  TEST  │ │ First steps  1. Check cert expiry  2. … │ │ ▸ volume 30 d         │ │
│ [Run 24]  22✓ 1✗ 1⚠  │ │ Holding reply "We're aware…" [Copy]     │ └───────────────────────┘ │
│ ──────────────       │ └─────────────────────────────────────────┘                           │
│ RISK DIAL τ=0.80     │ ┌ DRAFT REPLY ───────── 5/6 supported · 1 unsupported ── [Copy] [⤓] ┐ │
│ ──●── auto 62%       │ │ The drops match a known certificate expiry on the gateway.[1][2]  │ │
│       acc 96.4%      │ │ ░We will refund your subscription.░ ⚠ unsupported                 │ │
└──────────────────────┴─┴────────────────────────────────────────────────────────────────────┴─┘
```

- The verdict badge is the first thing the eye lands on: a dot, a short label and a specific reason.
- Calibrated confidence appears three ways: a bar, the probability with two decimals in monospace, and a
  High/Med/Low band (Zendesk). The header says what the calibration is based on.
- Evidence rows are tagged `●used` or `○found` (Intercom). Unsupported sentences get a dotted amber
  underline and a ⚠, so color is never the only signal. Citation chips open on click and on focus.

## 3. Token set

Geist-style neutrals. The exact hex values are my own choices; Geist publishes CSS variables only.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` / `surface` / `surface-2` | `#FFFFFF` / `#FAFAFA` / `#F2F2F2` | `#0A0A0A` / `#111111` / `#1A1A1A` | page / cards / hover, chips |
| `border` / `border-strong` | `#E5E5E5` / `#D4D4D4` | `#262626` / `#3A3A3A` | 1 px card borders / inputs |
| `text-2` / `text-1` | `#6B6B6B` / `#171717` | `#A1A1A1` / `#EDEDED` | meta, latency / body |
| `accent` | `#2563EB` | `#60A5FA` | links, citation chips, focus ring |
| `ok` / `ok-bg` | `#15803D` / `#F0FDF4` | `#4ADE80` / `#052E16` | Auto-Draft Ready, supported |
| `warn` / `warn-bg` | `#B45309` / `#FFFBEB` | `#FBBF24` / `#2A1A04` | Med confidence, unsupported |
| `crit` / `crit-bg` | `#B91C1C` / `#FEF2F2` | `#F87171` / `#2A0A0A` | Escalate, P1, outage banner |

Severity colors appear only on badges, the banner's left edge, sentence underlines and dots, never as
large fills. Type: **Geist** for UI text and **Geist Mono** (`tabular-nums`) for IDs, scores and latency.
Sizes: 12 meta · 13 tables/rail · 14 body · 16 section titles (600) · 20 verdict (600). Spacing uses a
4 px grid; card radius is 8 px and chip radius 6 px.

## 4. Attention-to-detail touches

1. Latency split by stage (`embed 38 · retrieve 21 · classify 64 · draft 271`) in monospace, with eval p50.
2. Language badge `EN` / `DE` / `DE→EN` plus a "show original" toggle (Zendesk).
3. Cmd/Ctrl+Enter submits, the hint is shown on the button, and the body field has focus on load.
4. Skeletons shaped like the final cards, filled in stage by stage with the verdict first.
5. A copy button that copies plain text without citation chips and confirms with "Copied" for 1.5 s.
6. An empty subject shows `— (no subject)` with a chip "classified from body only".
7. Every escalation gives a specific reason ("P1 + similarity < 0.55", "Confidence 0.48 below τ 0.80").
8. Low evidence is stated plainly: "No similar ticket above 0.50. Draft withheld." Missing values show `--`.
9. One-click sample tickets: EN outage, DE password reset, null subject, prompt injection.
10. Red-team runs are tagged `TEST` and kept out of live metrics (FireHydrant GAMEDAY).
11. Monospace ticket IDs open the full past ticket in a drawer, with the matched passage highlighted.
12. Risk dial readout: "At τ 0.80: auto-handle 62% at 96.4% accuracy (eval n=2,140)".
13. Generated sections carry a freshness or regenerate affordance (Rootly, FireHydrant) and model/index provenance.
14. When a ticket contains embedded instructions, a visible chip says "ignored embedded instructions".

## 5. Design systems

The ranking is for a modern, startup-feel console that shows a lot of evidence in a small space. The modern
options come first; enterprise systems follow for comparison.

| System | Fit for SentinelDesk | Streamlit cost | Next.js cost |
|---|---|---|---|
| **Vercel Geist** | High: quiet neutrals, mono numerals, ⌘K hints; the Vercel/Linear look | Cheap: config.toml only (Geist fonts on Google Fonts) | Medium: no public component kit, so pair it with shadcn |
| **shadcn/ui** | High: Badge, HoverCard, Tooltip, Table, Skeleton, Chart, all dense and neutral | Medium: community `streamlit-shadcn-ui` (third party, partial coverage) or CSS | Cheapest: copy-in components on Tailwind and Radix |
| **Radix Themes** | High: polished defaults, scale-based color, built-in density control | Medium: approximate it with config and CSS | Cheap: one package, `<Theme>` wrapper |
| **Tremor** | Medium: charts, KPI cards and tracker bars, not a full system | n/a: use Altair/Plotly to mimic it | Cheap: pairs with shadcn |
| **GitHub Primer** | High for dev tools: Label/StateLabel, dense DataTable | Medium: config only | Medium: `@primer/react` |
| **IBM Carbon** | High density and strong status guidance, but feels enterprise | Cheap: IBM Plex via Google Fonts, radius 0 | Heavy: `@carbon/react` |
| **Material 3** | Medium: recognizable to a GDG/Google audience, but roomy and consumer-style | Cheap: Streamlit's default already looks close | Medium: MUI; `@material/web` is in maintenance mode |
| **Atlassian (ADS)** | Closest domain (Jira Service Management), Lozenge status pills | Partial: Atlassian fonts not on Google Fonts | Heavy: `@atlaskit/*`, brand assets restricted |

**Vercel Geist**: <https://vercel.com/geist/introduction>
![Geist](ui-references/img/geist-1.jpg)
*Steal: input with a ⌘K hint, segmented toggle, copyable command field and a code card. Source:
vercel.com/geist (og:image).*

**shadcn/ui**: <https://ui.shadcn.com>
![shadcn/ui dashboard](ui-references/img/shadcn-1.png)
*Steal: KPI cards with small delta chips (`+12.5%`), mono numerals and a dark neutral rail. Source:
github.com/shadcn-ui/ui (apps/v4 opengraph-image).*

**Radix Themes**: <https://www.radix-ui.com/themes>
![Radix Themes](ui-references/img/radix-1.png)
*Steal: KPI grid with ↑/↓ delta badges and quiet cards with an icon action in the corner. Source:
radix-ui.com/themes (og:image).*

**Tremor**: <https://tremor.so>
![Tremor](ui-references/img/tremor-1.png)
*Steal: an uptime tracker bar (one block per interval) for the burst timeline, plus status chips such as
overperforming and average. Source: tremor.so (og:image).*

**GitHub Primer**: <https://primer.style/product/components/data-table>
![Primer DataTable anatomy](ui-references/img/primer-1.png)
*Steal: DataTable anatomy (filter, sortable column, row actions, "21–40 of 70" footer) for the evidence
table. Source: github.com/primer/design (data-table.mdx).*

**IBM Carbon**: <https://carbondesignsystem.com/components/data-table/usage/>
![Carbon condensed table](ui-references/img/carbon-1.png)
*Steal: condensed rows with dot-plus-text status ("● Stable", "○ Disabled") and a summary rail. Source:
carbondesignsystem.com data-table usage.*

**Material 3**: <https://m3.material.io>
![Material 3 filter chips](ui-references/img/material3-1.webp)
*Steal: filter chips where a ✓ and a tonal fill mark the selected state, useful for sample tickets and
filters. Source: github.com/material-components/material-web docs.*

**Atlassian Design System**: <https://atlassian.design>
![Jira Service Management portal](ui-references/img/atlassian-1.png)
*Steal: a "Status update" banner with a colored left edge above the service desks, which is our outage
banner. Source: atlassian.com Jira Service Management incident-management page.*

### Recommendation

Use **Geist tokens with shadcn/ui components.** It is the most modern and startup-like option, and the
Vercel/Linear look reads as precise to judges. In Streamlit it costs one config file; if the team moves to
Next.js, shadcn components drop in on the same tokens. Choose Radix Themes instead only if you want a
single installed package rather than copied components.

`.streamlit/config.toml` (needs a recent Streamlit with `[theme.dark]` and palette keys; check with `streamlit version`):

```toml
[theme]
base = "light"
font = "Geist:https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap"
codeFont = "'Geist Mono':https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap"
baseFontSize = 14
baseRadius = "8px"
buttonRadius = "6px"
showWidgetBorder = true
showSidebarBorder = true
primaryColor = "#171717"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#FAFAFA"
textColor = "#171717"
linkColor = "#2563EB"
borderColor = "#E5E5E5"
dataframeBorderColor = "#E5E5E5"
dataframeHeaderBackgroundColor = "#FAFAFA"
codeBackgroundColor = "#F2F2F2"
redColor = "#B91C1C"
orangeColor = "#B45309"
greenColor = "#15803D"
blueColor = "#2563EB"
grayColor = "#6B6B6B"

[theme.dark]
primaryColor = "#EDEDED"
backgroundColor = "#0A0A0A"
secondaryBackgroundColor = "#111111"
textColor = "#EDEDED"
linkColor = "#60A5FA"
borderColor = "#262626"
dataframeBorderColor = "#262626"
dataframeHeaderBackgroundColor = "#111111"
codeBackgroundColor = "#1A1A1A"
redColor = "#F87171"
orangeColor = "#FBBF24"
greenColor = "#4ADE80"
blueColor = "#60A5FA"
grayColor = "#A1A1A1"
```

Near-black `primaryColor` gives the Geist and shadcn feel, with black primary buttons. Severity stays on
the palette keys, so `st.badge("Escalate", color="red")` and `:green-badge[Auto-Draft Ready]` pick up the
tokens. Set `[theme.light]` too if you want a light/dark toggle instead of following the system setting.

## 6. Streamlit vs Next.js

| Pattern | Streamlit | Next.js |
|---|---|---|
| Layout, cards, rail, badges | Cheap: `st.columns`, `st.container(border=True)`, `st.badge` | Cheap |
| Confidence bars, retrieval table | Cheap: `st.dataframe` with `ProgressColumn` | Cheap |
| Latency stages while running | Cheap: `st.status(type="step")`, `st.empty` | Medium (streaming) |
| Evidence on click | Cheap: `st.popover` | Cheap |
| Per-sentence underline + citation hover card | Medium: one `st.html` block with CSS `:hover`/`:focus-within` | Cheap (shadcn HoverCard) |
| Copy button | Cheap: `st.code(..., language=None)` | Cheap |
| Cmd/Ctrl+Enter submit | Partial: check that it triggers the form submit | Cheap |
| Skeleton loading | Hard | Cheap (shadcn Skeleton) |
| Risk dial curve | Cheap: `st.slider` + Altair | Medium |

**Recommendation:** use Streamlit with the Geist config above, and render the cited draft as one `st.html`
block. Switch to Next.js with shadcn only if someone can spend about a day on frontend.
