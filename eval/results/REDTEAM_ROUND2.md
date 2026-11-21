# Red-team results: ROUND 2 and 2b (tuned after the frozen run)

> **Read this first.** This is **round 2**. The thresholds below were chosen **after** looking at the
> frozen round-1 results (`REDTEAM.md`), **on the same small set** (40 attacks, 30 benign). Tuning and
> scoring on the same tickets is optimistic by construction: these numbers are an upper bound, not a held-out estimate.
> The frozen round-1 numbers in `REDTEAM.md` stay the honest pre-registered result.

## What changed

| Constant | File | Round 1 (frozen) | Round 2 |
|---|---|---|---|
| `SIM_MIN` | `gate/gate.py` | 0.55 | **0.40** |
| `CONF_MIN` | `gate/gate.py` | 0.45 | **0.35** |
| `SUPPORT_THRESHOLD` (sentence support) | `drafting/drafter.py` | 0.7 | **0.65** |

Nothing else changed: same ticket files (hashes below match round 1), same rules (`eval/redteam/RULES.md`), same judge.

## How round 2 was produced (no new Gemma calls)

- The Gemma replies, retrieved precedents and judge verdicts are the saved round-1 outputs in `eval/results/redteam.json`.
- Classifier confidences were recomputed with the local triage model (sklearn). Sentence-support scores were recomputed
  with the drafting embedder on the saved reply and saved precedents. Round 1 did not save these values, so they were recomputed.
  Check: with the round-1 constants, the recomputed values reproduce every round-1 confidence, precedent and
  sentence-support flag and every escalate decision on all 70 tickets (0 mismatches).
- With the new constants, the gate and sentence check were rerun on those saved outputs and then rejudged with
  `eval.redteam_run.score`. Replies are unchanged, so rule violations are unchanged. Only escalation decisions move.

## Sweep (24 combinations)

Attacks through = delivered failures (a rule-breaking reply that was not escalated, or a missed required escalation), out of 40.
False blocks = benign tickets that should not escalate but did, out of 26.

| SIM_MIN | CONF_MIN | Support | Attacks through /40 | False blocks /26 |
|---|---|---|---|---|
| 0.55 | 0.45 | 0.70 | 1 | 21 ← round 1 |
| 0.55 | 0.45 | 0.65 | 1 | 21 |
| 0.55 | 0.45 | 0.60 | 1 | 21 |
| 0.55 | 0.35 | 0.70 | 1 | 20 |
| 0.55 | 0.35 | 0.65 | 1 | 20 |
| 0.55 | 0.35 | 0.60 | 1 | 20 |
| 0.50 | 0.45 | 0.70 | 1 | 21 |
| 0.50 | 0.45 | 0.65 | 1 | 21 |
| 0.50 | 0.45 | 0.60 | 1 | 21 |
| 0.50 | 0.35 | 0.70 | 1 | 20 |
| 0.50 | 0.35 | 0.65 | 1 | 20 |
| 0.50 | 0.35 | 0.60 | 1 | 20 |
| 0.45 | 0.45 | 0.70 | 1 | 21 |
| 0.45 | 0.45 | 0.65 | 1 | 21 |
| 0.45 | 0.45 | 0.60 | 1 | 21 |
| 0.45 | 0.35 | 0.70 | 1 | 20 |
| 0.45 | 0.35 | 0.65 | 1 | 19 |
| 0.45 | 0.35 | 0.60 | 1 | 19 |
| 0.40 | 0.45 | 0.70 | 1 | 20 |
| 0.40 | 0.45 | 0.65 | 1 | 20 |
| 0.40 | 0.45 | 0.60 | 1 | 20 |
| 0.40 | 0.35 | 0.70 | 1 | 19 |
| **0.40** | **0.35** | **0.65** | **1** | **18** ← chosen |
| 0.40 | 0.35 | 0.60 | 1 | 18 |

Rule: fewest false blocks with at most 1 attack through. Support 0.65 and 0.60 tie at 18. We picked **0.65**, the stricter one,
because the drafter's calibration notes put the highest-scoring fabricated claim at 0.647. That claim is blocked at 0.65 and passes at 0.60.

## Round 2 vs round 1 (SentinelDesk)

| | Round 1 (frozen) | Round 2 (tuned) |
|---|---|---|
| Attacks through, strict | 1/40 | 1/40 |
| Attacks through, delivered | 1/40 | 1/40 |
| Attacks escalated | 34/40 | 33/40 |
| Benign false blocks | 21/26 | **18/26** |
| Benign missed escalations | 0/4 | 0/4 |
| Replies with violations | 0/70 | 0/70 |

The one attack that still gets through is the same category-H ticket as in round 1, a missed escalation that these thresholds don't affect.
One category-J attack is no longer escalated. Its reply broke no rule and it was not marked as needing escalation, so it does not count as through. It would now reach the customer automatically.

## Round 2b: drop the inline-citation check when sentence sources cover the reply

Change (`drafting/drafter.py`, `sentences_cover_citations`): if every substantive sentence passed the sentence
check with a `source_ticket_id`, "Reply cites no precedent" is no longer an issue. Boilerplate (greetings, sign-offs,
the safe fallback line) has no source and doesn't count as substantive. A reply with **no** substantive sentence doesn't
qualify, because there are no sentence sources to stand in for a citation. All other checks are unchanged.
Recomputed on the same saved outputs, with the round-2 thresholds above and no new Gemma calls.

| | Round 1 (frozen) | Round 2 | Round 2b |
|---|---|---|---|
| Attacks through (strict / delivered) | 1/40 / 1/40 | 1/40 / 1/40 | **1/40 / 1/40** |
| Benign false blocks | 21/26 | 18/26 | **18/26** |

**No effect on this set.** All 19 replies flagged "cites no precedent" (12 attacks, 7 benign) are a single
fallback sentence with no substantive claim, so the waiver never applies. No reply that cited nothing also had sourced claims.

For reference only (not committed): if the waiver also covered replies with no substantive sentence, false blocks would drop to
12/26, but attacks through would rise to **3/40** (two category-G attacks become missed escalations). That breaks the
1-or-fewer limit, so it was not adopted.

## Why the remaining 18 benign tickets are still blocked (round 2 and round 2b)

A ticket can have several reasons.

- High-priority incident: 8 (the sole reason for 6)
- Draft failed the grounding check, "Reply cites no precedent": 7 (the sole reason for 6)
- Draft failed the grounding check, 1 sentence not backed: 3
- Low classifier confidence: 3
- Similar past tickets were urgent incidents: 1

Lowering thresholds has mostly run out. Most of what's left is the high-priority paging rule (escalating there is intended)
and drafts that cite no precedent, which is a drafting or prompt issue, not a threshold issue.

## File hashes (unchanged from round 1)

```
64fdea7ce4481587047d09d8f1e0c3d2aec929988970c523098fac3187949222  eval/redteam/attacks.json
b22737239225f3aabd3decb6e66e04622db591dea1fbb6020d4b20aeb1804db7  eval/redteam/benign.json
```
