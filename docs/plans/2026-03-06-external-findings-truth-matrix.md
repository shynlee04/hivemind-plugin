# External Findings Truth Matrix

## Purpose

This document reconciles two external analyses against the current repository state as of 2026-03-06.

It exists to prevent stale external claims from re-entering planning as if they were still unresolved. The current repository is the source of truth. External analyses are useful only when they align with current code, tests, and verification results.

## Source Weighting

1. Tier 1: Repo-verified current truth
2. Tier 2: External analysis that still aligns with current code
3. Tier 3: Stale external claims kept only as historical caution

## Why The Second External Response Is Partially Obsolete

The second response assumed an older repo shape. It is partially obsolete because it states that the following are missing or unresolved when they are present or already fixed:

- `src/lib/injection-orchestrator.ts` exists.
- `src/lib/session-role.ts` exists.
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` exists.
- `tests/budget-hook-cap.test.ts` exists.
- `tests/budget-session-continuity.test.ts` exists.
- `tests/injection-dedupe-contract.test.ts` exists.
- `src/lib/compaction-engine.ts` uses `DEFAULT_COMPACTION_BUDGET`.
- `src/hooks/soft-governance.ts` already flushes mutations on tool boundaries.

Those claims are retained here only as examples of stale external drift.

## Findings Matrix

| Claim | Source | Current Repo Verdict | Evidence Path | Planning Action |
|---|---|---|---|---|
| `src/lib/injection-orchestrator.ts` is missing | External answer 2 | `confirmed-stale` | `src/lib/injection-orchestrator.ts` | Discard as stale |
| `src/lib/session-role.ts` is missing | External answer 2 | `confirmed-stale` | `src/lib/session-role.ts` | Discard as stale |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` is missing | External answer 2 | `confirmed-stale` | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Discard as stale |
| `tests/budget-hook-cap.test.ts` is missing | External answer 2 | `confirmed-stale` | `tests/budget-hook-cap.test.ts` | Discard as stale |
| `tests/budget-session-continuity.test.ts` is missing | External answer 2 | `confirmed-stale` | `tests/budget-session-continuity.test.ts` | Discard as stale |
| `tests/injection-dedupe-contract.test.ts` is missing | External answer 2 | `confirmed-stale` | `tests/injection-dedupe-contract.test.ts` | Discard as stale |
| compaction still uses legacy `1800` budget | External answer 2 | `confirmed-stale` | `src/lib/compaction-engine.ts:167`, `src/lib/budget.ts:34` | Discard as stale |
| mutation flush is missing in `soft-governance.ts` | External answer 2 | `confirmed-stale` | `src/hooks/soft-governance.ts:723` | Discard as stale |
| `messages-transform.ts` still prepends separate anchor header content | External answer 1 | `confirmed-current` | `src/hooks/messages-transform.ts:220`, `src/hooks/messages-transform.ts:630` | Carry forward |
| `messages-transform.ts` still prepends cognitive packer output | External answer 1 | `confirmed-current` | `src/hooks/messages-transform.ts:618` | Carry forward |
| `session-lifecycle.ts` still injects a separate status layer | External answer 1 | `confirmed-current` | `src/hooks/session-lifecycle.ts:210`, `src/hooks/session-lifecycle.ts:304` | Carry forward |
| `session-lifecycle.ts` still independently owns part of per-turn prompt composition | External answer 1 | `confirmed-current` | `src/hooks/session-lifecycle.ts:204`, `src/hooks/session-lifecycle.ts:311` | Carry forward |
| prompt-surface overlap still exists across plugin, system, and message channels | External answer 1 | `confirmed-current` | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`, `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts` | Carry forward |
| the overlap is still the same as the old "three equal systems" model | External answer 1 | `confirmed-stale` | current code shows shared ledger and partial dedupe in `src/lib/injection-orchestrator.ts` and hook call sites | Reframe, do not repeat old framing |
| `hivemind_inspect` lacks a `traverse` action | External answers 1 and 2 | `confirmed-stale` | `src/tools/hivemind-inspect.ts` | Keep only as historical context |
| `tool-gate.ts` still queues mutations | External reconciliation plan | `confirmed-current` | `src/hooks/tool-gate.ts:284` | Carry forward |
| `soft-governance.ts` is already the main flush boundary | External reconciliation plan | `confirmed-current` | `src/hooks/soft-governance.ts:716-723` | Carry forward |
| `CycleLogEntry` does not retain `task_id` | External answer 1 | `confirmed-stale` | `src/schemas/brain-state.ts`, `src/hooks/soft-governance.ts`, `src/tools/hivemind-cycle.ts` | Mark resolved locally |
| delegation continuity should capture `task_id` for resumed work | External answer 1 | `confirmed-current` | `src/schemas/brain-state.ts`, `src/hooks/soft-governance.ts`, `src/tools/hivemind-cycle.ts`, `tests/cycle-task-id.test.ts` | Mark completed locally |
| child sessions likely receive too much prompt context | External answer 1 | `needs-research` | plugin and hooks exist; exact OpenCode child-session metadata access still needs external/runtime confirmation | Send to DeepWiki |
| `task_id` resumption is important to long-haul continuity | External answer 1 | `needs-research` | repo has no normalized continuity envelope yet; OpenCode behavior should be re-confirmed | Send to DeepWiki and Devin |
| multi-state tension between `brain.json`, `graph/*.json`, and `hierarchy.json` is still real | External answers 1 and 2 | `confirmed-current` | `src/hooks/messages-transform.ts`, `src/hooks/session-lifecycle.ts`, `src/lib/cognitive-packer.ts`, `src/lib/hierarchy-tree.ts`, `src/schemas/brain-state.ts` | Carry forward |
| `cognitive-packer.ts` is the strongest current candidate for canonical context compilation | External answer 1 | `needs-design-decision` | `src/lib/cognitive-packer.ts`, current hooks still render other status layers | Carry forward as design decision |
| question-tool-first clarification flow is not yet end-to-end in the repo | External answer 1 | `confirmed-current` | current pieces exist in `src/lib/session_coherence.ts`, `src/hooks/messages-transform.ts`, but not as one normalized workflow | Carry forward |
| research artifacts should live on disk with selective retrieval, not full prompt injection | External answer 1 | `needs-design-decision` | compatible with current compaction/selective-retrieval direction, but storage contract not chosen | Carry forward |

## Live Claims To Keep

These claims survive reconciliation and should directly inform the next planning wave:

- Prompt-surface ownership is not fully consolidated.
- `messages-transform.ts` still injects both cognitive context and a separate anchor header.
- `session-lifecycle.ts` still injects a separate status layer.
- `hivemind_inspect` now has tree-based traversal, but not graph/related traversal.
- `tool-gate.ts` still queues mutations while `soft-governance.ts` is already the flush boundary.
- Delegation continuity is still under-modeled beyond `task_id`, because no normalized delegation envelope exists yet.
- The repo still operates across three state families with overlapping conceptual truth.
- Child-session injection minimization remains unresolved.
- Clarification -> exploration -> research assembly remains fragmented.

## Claims To Discard

- Missing-file and missing-test claims from the stale external response
- Legacy compaction-budget claim
- Legacy mutation-flush gap claim
- Any architecture recommendation that assumes the pre-budget-hardening or pre-flush repo shape

## Questions That Still Need External Help

- What OpenCode exposes cheaply inside plugin hooks for child-session identification and `parentID` awareness
- How `task_id` resumption interacts with synthetic parts, compaction, and replayed user messages
- Whether `tool.definition` is a safe place to enforce structured-output hints for internal tools without confusing the model
