# External Replies Reconciled Execution Plan

## Purpose

This document reconciles the returned `DeepWiki` and `Devin` replies against the current repository state as of March 6, 2026.

Its job is to do three things:

1. Preserve the external findings that still match current code and current OpenCode behavior.
2. Reject stale or contradicted claims so they do not contaminate the next refactor wave.
3. Convert the surviving signal into an execution-grade phased plan for the next engineering pass.

This is a planning artifact only. It does not reopen already-fixed budget or mutation-flush work.

---

## Executive Verdict

- `DeepWiki` is the high-value source for OpenCode-native behavior in this round.
- `Devin` is materially stale on several repo facts and cannot be used as a current-state authority.
- We should keep `Devin` only for a few architectural themes that still match the current repo after local verification.
- The next refactor wave should stay narrow:
  - prompt-surface ownership
  - `tool-gate` write demotion
  - `task_id` continuity
  - `hivemind_inspect.traverse`
  - child-session injection minimization

---

## Repo-Verified Corrections

These facts are current and override stale external claims:

- `src/lib/injection-orchestrator.ts` exists and is active.
- `src/lib/session-role.ts` exists and is active.
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` exists and uses the shared injection ledger.
- `tests/budget-hook-cap.test.ts` exists.
- `tests/budget-session-continuity.test.ts` exists.
- `tests/injection-dedupe-contract.test.ts` exists.
- `src/lib/compaction-engine.ts` uses `DEFAULT_COMPACTION_BUDGET`.
- `src/hooks/soft-governance.ts` already flushes mutations on tool boundaries.
- `src/hooks/messages-transform.ts` still prepends both `packCognitiveState()` output and a separate anchor header.
- `src/hooks/session-lifecycle.ts` still injects a separate status layer via `buildStatusBlock()`.
- `src/hooks/tool-gate.ts` still queues mutations.
- `src/tools/hivemind-inspect.ts` supports `scan`, `deep`, `drift`, and `introspect`, but not `traverse`.
- `src/schemas/brain-state.ts` still defines `CycleLogEntry` without `task_id`.

---

## External Reply Triage

### DeepWiki

#### Keep

- Child sessions created with `parentID` are new sessions, not prompt-history clones.
- Hooks re-run per child session and per resumed `task_id` session.
- `messages.transform` lacks a first-class `sessionID` input and must derive it from message info.
- `tool.definition` description mutation is safer than parameter mutation for hinting.
- Compaction plus re-injection can duplicate context if the repo injects the same concepts in multiple surfaces.
- There is no native first-class `resumed` flag on sessions.

#### Keep With Empirical Validation

- Whether `system.transform` always receives `sessionID` in the exact paths we use.
- Whether child-session first-turn `messages.transform` always has enough message info to recover `sessionID`.
- The exact duplication behavior for compaction plus resume plus child session restart in our plugin stack.

#### Discard

- Nothing major. The DeepWiki reply is directionally sound; the remaining uncertainty is runtime nuance, not obvious staleness.

### Devin

#### Discard As Stale

- Missing-file claims for:
  - `src/lib/injection-orchestrator.ts`
  - `src/lib/session-role.ts`
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- Missing-test claims for:
  - `tests/budget-hook-cap.test.ts`
  - `tests/budget-session-continuity.test.ts`
  - `tests/injection-dedupe-contract.test.ts`
- Claim that `src/lib/compaction-engine.ts` still uses `LEGACY_COMPACTION_BUDGET`
- Any recommendation that assumes the old repo shape where the shared injection ledger and session-role module do not exist

#### Keep As High-Level Themes Only

- Prompt-surface ownership should be consolidated.
- `tool-gate` should likely stop being a state writer over time.
- `task_id` continuity belongs in an existing state surface, not a new state system.
- `hivemind_inspect.traverse` should start narrow.
- Cognitive-packer-led prompt ownership is the right direction.

---

## Reconciled Design Decisions

### 1. Prompt-Surface Ownership

Target ownership for the next refactor wave:

- `system[]`
  - governance instruction
  - stable warnings and mode signals
  - short next-step or behavior constraints
  - no duplicated hierarchy/status rendering if the same information already appears in structured cognitive context
- `messages[] prepend`
  - canonical structured context
  - `packCognitiveState()` output
  - first-turn coherence when required
  - role-aware minimal handoff content when session is a child
- `messages[] append`
  - checklist
  - auto-realign
  - short terminal guidance only
- compaction-only surfaces
  - compaction and continuation payloads that should not be repeated on ordinary turns

Immediate implication:

- `buildAnchorContext()` is the first clear duplicate candidate.
- `buildStatusBlock()` is the second clear duplicate candidate.
- We should remove or gate those only after adding coverage that proves the same information remains available through the structured packer path.

### 2. `tool-gate` Mutation Strategy

Decision:

- Do not rip out `tool-gate` writes immediately.
- Demote `tool-gate` from writer to advisory in a staged migration.

Reason:

- It still participates in pre-execution drift and complexity signaling.
- A direct removal risks changing timing behavior before replacement coverage exists.

Migration target:

- `soft-governance.ts` remains the single persisted write boundary.
- `tool-gate.ts` becomes pre-execution advisory only.
- Any state derived in `tool-gate.ts` that still matters should be recomputed or persisted in `soft-governance.ts`.

### 3. `task_id` Continuity Storage

Decision:

- Store `task_id` in `CycleLogEntry` as an optional field.
- Keep session lineage in the session-split payload and related continuity artifacts.
- Do not introduce a new continuity state store yet.

Reason:

- `cycle_log` is already hot state that hooks and exports can see.
- This is additive, low-risk, and keeps continuity attached to the existing session record.

Potential additive fields:

- `task_id?: string`
- `parent_session_id?: string`

### 4. `hivemind_inspect.traverse`

Decision:

- Phase in `traverse` as a tree-first action, not a generalized graph traversal system.

First version:

- operate on `hierarchy-tree.ts`
- reuse current ancestor and node lookup helpers
- avoid graph-wide relationship stitching in v1

Suggested v1 shape:

```ts
type InspectAction =
  | "scan"
  | "deep"
  | "drift"
  | "introspect"
  | "traverse"
```

```ts
{
  action: "traverse"
  node_id?: string
  direction?: "up" | "down" | "siblings"
  depth?: number
}
```

### 5. Child-Session Injection Minimization

Decision:

- This stays in the next implementation wave.
- We should move toward reduced injection for child sessions rather than equal injection across main and child sessions.

Reason:

- DeepWiki confirms hooks re-run independently for child sessions.
- That means a focused child task can currently receive the same heavy context surfaces as the main session unless we reduce them deliberately.

Target:

- main session: full governed surface set
- child session: governance plus minimal task-aligned structured context

---

## What We Should Not Carry Forward

- Any plan that starts by “correcting” missing files or tests already present in this repo.
- Any plan that reopens the compaction budget migration.
- Any plan that assumes `soft-governance.ts` does not already flush mutations.
- Any greenfield continuity envelope or new state store before we exhaust `cycle_log`, split lineage payloads, and export artifacts.
- Any broad graph-traversal system before a minimal tree-based `traverse` proves useful.

---

## Execution-Grade Phase Plan

### Phase 0: Coverage Lock Before Refactor

Purpose:

- lock the current surviving behavior before changing ownership

Files:

- `tests/injection-dedupe-contract.test.ts`
- `tests/budget-hook-cap.test.ts`
- `tests/budget-session-continuity.test.ts`
- `tests/messages-transform.test.ts`
- `tests/soft-governance.test.ts`
- `tests/tool-gate.test.ts`

Additions:

- verify current anchor header presence explicitly so its later removal is intentional
- verify `buildStatusBlock()` output is currently present in `system[]`
- add a child-session policy placeholder test marked around expected future reduction behavior

### Phase 1: Add `task_id` Continuity

Purpose:

- preserve delegation resume identity in existing state

Files:

- `src/schemas/brain-state.ts`
- `src/hooks/soft-governance.ts`
- `src/tools/hivemind-cycle.ts`
- `tests/cycle-intelligence.test.ts`
- new `tests/cycle-task-id.test.ts`

Change:

- extend `CycleLogEntry` with optional `task_id`
- capture `task_id` when the `task` tool returns it
- surface it in cycle exports

### Phase 2: Add `hivemind_inspect.traverse` v1

Purpose:

- provide typed navigation without widening the subsystem too early

Files:

- `src/tools/hivemind-inspect.ts`
- `src/lib/inspect-engine.ts`
- `src/lib/hierarchy-tree.ts`
- new `tests/hivemind-inspect-traverse.test.ts`

Change:

- add `traverse` action
- implement tree-only traversal using existing hierarchy helpers

### Phase 3: Prompt-Surface De-duplication

Purpose:

- remove duplicate context without destabilizing budgets or compaction continuity

Files:

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `src/lib/cognitive-packer.ts`
- `tests/messages-transform.test.ts`
- `tests/injection-dedupe-contract.test.ts`
- new `tests/injection-surface-ownership.test.ts`

Order:

1. prove packer coverage for anchor and status data
2. gate or remove `buildAnchorContext()`
3. gate or remove `buildStatusBlock()`
4. keep governance instruction and warning surfaces in `system[]`

### Phase 4: `tool-gate` Write Demotion

Purpose:

- make `soft-governance.ts` the sole persisted authority without losing pre-execution warnings

Files:

- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `tests/tool-gate.test.ts`
- `tests/soft-governance.test.ts`
- new `tests/tool-gate-readonly.test.ts`

Order:

1. move any required persisted data updates into `soft-governance.ts`
2. keep `tool-gate.ts` warning behavior unchanged
3. remove `queueStateMutation()` calls from `tool-gate.ts`

### Phase 5: Child-Session Injection Policy

Purpose:

- reduce prompt weight and duplication for delegated child sessions

Files:

- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/lib/session-role.ts`
- `tests/budget-session-continuity.test.ts`
- new `tests/child-session-injection-policy.test.ts`

Change:

- distinguish main versus child sessions
- reduce injected surfaces for child sessions
- keep continuity and governance intact

---

## Runtime Validation Questions Still Open

These should shape the next external or empirical pass, but they should not block Phases 1 and 2:

1. Is `system.transform` `sessionID` always present in the exact execution paths we use?
2. What is the safest low-cost session-kind detection pattern inside `messages.transform` for child sessions?
3. In our plugin stack, which compaction-plus-resume paths still duplicate meaningfully after re-injection?
4. Do we need any child-session-specific test harness around resumed `task_id` sessions before Phase 5?

---

## Final Recommendation

Use the returned `DeepWiki` reply as the OpenCode-native guide.

Use the returned `Devin` reply only after stripping it down to:

- prompt-surface ownership
- `tool-gate` demotion
- `task_id` continuity
- tree-first `traverse`
- cognitive-packer-led consolidation

Do not treat `Devin` as a current-state source for file existence, tests, or compaction-budget state.

The next engineering pass should begin with:

1. `task_id` continuity
2. `hivemind_inspect.traverse` v1
3. prompt-surface de-duplication

That sequence gives us continuity wins, better inspectability, and safer injection cleanup without reopening already-fixed foundation work.
