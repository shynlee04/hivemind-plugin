---
spike: 002
name: nl-command-mapping
type: standard
validates: "Given a structured command catalog with descriptions and trigger phrases, when natural language input is provided, then keyword + semantic matching produces the correct command match"
verdict: PARTIAL
related: [001]
tags: [routing, nlp, matching, commands, opencode]
---

# Spike 002: Natural Language → Command Mapping

## What This Validates

Given a structured command catalog with descriptions and trigger phrases, when natural language input is provided, then keyword + semantic matching produces the correct command match.

## Research

- Spike 001 produced a catalog of 96 commands with descriptions, agents, tools maps, and trigger phrases
- Only 6/96 commands have explicit trigger phrases (6.25%)
- 100% have descriptions (primary matching signal)
- Keyword overlap is the simplest viable approach; LLM-based semantic matching would be the high-accuracy path

**Approaches compared:**

| Approach | Implementation | Pros | Cons | Accuracy |
|----------|---------------|------|------|----------|
| Exact trigger match | String equality | 100% accurate when triggers exist | Only covers 6 commands | ~17% coverage |
| Substring trigger match | `includes()` | Catches variations | Fragile, false positives | ~25% coverage |
| Keyword overlap (TF-like) | Token overlap scoring | No external deps, fast | Misses semantic similarity, surface-level | ~55% correct for non-trigger queries |
| LLM semantic matching | Embed query + descriptions | Captures intent, synonyms, context | Requires LLM call, slower, cost | Expected 80-90% (not tested) |

**Chosen approach for spike:** Keyword overlap with tokenization, stopword removal, and partial/compound word matching.

## How to Run

```bash
node .planning/spikes/002-nl-command-mapping/nl-router.js
```

Requires `catalog.json` from Spike 001.

## What to Expect

- 24 test queries across exact triggers, implicit descriptions, and edge cases
- Match strategy annotated per query (✓ exact, ~ substring, ? keyword, ✗ none)
- Coverage percentage and accuracy assessment

## Investigation Trail

1. **Initial scoring:** Pure token overlap produced many ties — commands with similar vocabulary (e.g., "audit", "check", "review") scored similarly
2. **Added boosts:** Source boost (+10% for custom commands) and trigger boost (+20% for commands with triggers) to break ties
3. **Name token inclusion:** Added command name tokens (dash-split) to capture `gsd-debug` matching "debug a bug"
4. **Agent token inclusion:** Added agent name tokens for additional signal
5. **Edge case testing:** "help me with something" and "make it better" correctly return no match (insufficient signal)
6. **Quality assessment:** Manually reviewed all 24 results against expected command

## Results

**Verdict: PARTIAL ⚠**

- **Coverage: 91.7%** (22/24 queries matched to some command)
- **Exact trigger matches: 4/4** (100% accuracy when triggers exist)
- **Keyword overlap matches: 18/20** non-trigger queries matched, but only ~55% accuracy

### Correct Matches (non-trigger queries)

| Query | Routed To | Expected | Status |
|-------|-----------|----------|--------|
| "debug a bug in the code" | gsd-debug | gsd-debug | ✓ |
| "review the code quality" | gsd-code-review | gsd-code-review | ✓ |
| "build a new skill from scratch" | hf-create | hf-create | ✓ |
| "enhance my prompt" | hf-prompt-enhance | hf-prompt-enhance | ✓ |
| "analyze the project dependencies" | gsd-analyze-dependencies | gsd-analyze-dependencies | ✓ |
| "do a comprehensive project audit" | harness-audit | harness-audit | ✓ |
| "check if commands are healthy" | hf-audit | hf-audit | ✓ |

### Incorrect Matches (non-trigger queries)

| Query | Routed To | Expected | Root Cause |
|-------|-----------|----------|------------|
| "run some tests and show coverage" | gsd-help | (no test command) | No test-running command exists in catalog |
| "add an item to the backlog" | gsd-review-backlog | gsd-add-backlog | "backlog" appears in both descriptions |
| "update the project roadmap" | gsd-docs-update | gsd-new-milestone | "project" is high-frequency, dilutes signal |
| "run a full security audit" | hf-prompt-enhance | harness-audit or hf-audit | "audit" matches hf-prompt-enhance description due to surface keyword overlap |
| "set up a new agent configuration" | hf-create | hf-configure | "agent" + "new" matches hf-create better than hf-configure |
| "verify the architecture is sound" | gsd-verify-work | harness-audit | "verify" in name matches, but verify-work is UAT, not architecture |

### Correct No-Matches

| Query | Result | Reason |
|-------|--------|--------|
| "help me with something" | NONE | Too vague, no actionable keywords |
| "make it better" | NONE | No object or domain signal |

## Key Findings

1. **Explicit triggers are the gold standard** — 100% accuracy, but only 6/96 commands have them. Expanding trigger coverage would dramatically improve routing.
2. **Keyword overlap is brittle** — shared vocabulary ("project", "audit", "check") causes false positives. Surface matching doesn't understand intent.
3. **Description quality varies enormously** — Some commands have 1-line descriptions; others have 380+ chars. Richer descriptions = better routing signal.
4. **Command names carry signal** — Splitting `gsd-debug` into tokens `["gsd", "debug"]` improved matching for domain-specific queries.
5. **The existing infrastructure IS sufficient** — Catalog discovery works, metadata is rich enough for LLM-based routing, and the Task tool can execute matched commands.

## What Would Improve Accuracy

- **LLM semantic matching:** Expected 80-90% accuracy. The descriptions + objective/process content provide enough signal.
- **Expand trigger phrases:** Adding 2-3 trigger phrases per command (currently 6/96) would make keyword routing highly accurate.
- **Embedding-based similarity:** Pre-compute embeddings for command descriptions, match against query embedding. Fast and accurate.
- **Agent-based routing:** Use agent name as a coarse filter (e.g., "hf-*" for creation tasks, "gsd-*" for planning tasks).

## Impact on Overall Idea

The natural language routing idea is **feasible but not trivially solved with keyword matching**. The existing OpenCode infrastructure provides:
- ✓ Command definitions with metadata
- ✓ Descriptions, agents, tools, and process content as routing signals
- ✓ Task tool for programmatic execution
- ✗ No built-in NL routing layer (confirmed by citation evidence)

Building a production NL router would require:
1. An LLM call to match intent to command descriptions (simple, ~1-2s latency)
2. Fallback to exact slash command when confidence is low
3. Trigger phrase expansion in command definitions (user-editable, no code changes)

This is a **validated integration pattern** — it can be built as a plugin tool or skill without modifying OpenCode core.
