# Devin Repo-Mapping Query Packet

> Status update 2026-03-06: This file is now a mixed prompt-plus-reply evidence artifact, not a clean outbound packet. Local repo truth has moved forward since the original prompt: `CycleLogEntry.task_id` continuity is implemented and `hivemind_inspect.traverse` v1 now exists. If a fresh outbound Devin packet is needed later, create a new file instead of reusing this one.

## Purpose

This packet is for repo-mapping and phased refactor planning only. It assumes the current repository state has already been reconciled locally.

## Settled Local Facts

Do not revisit these:

- `src/lib/injection-orchestrator.ts` exists.
- `src/lib/session-role.ts` exists.
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` exists.
- `tests/budget-hook-cap.test.ts` exists.
- `tests/budget-session-continuity.test.ts` exists.
- `tests/injection-dedupe-contract.test.ts` exists.
- `src/lib/compaction-engine.ts` already uses `DEFAULT_COMPACTION_BUDGET`.
- `src/hooks/soft-governance.ts` already flushes mutations on tool boundaries.

## Current Live Tensions

These are still current and need repo-specific refactor sequencing:

- prompt-surface ownership is still split across:
  - `src/hooks/session-lifecycle.ts`
  - `src/hooks/messages-transform.ts`
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `messages-transform.ts` still prepends:
  - cognitive packer output
  - separate anchor header
- `session-lifecycle.ts` still adds a separate status layer
- `tool-gate.ts` still queues mutations
- `hivemind_inspect` now has tree-based `traverse` v1; graph-related traversal is still open
- `CycleLogEntry.task_id` continuity is now implemented; normalized delegation-envelope work is still open
- state authority is still split across:
  - `brain.json`
  - `graph/*.json`
  - `hierarchy.json`

## Repo Slices To Inspect

- prompt surfaces
  - `src/hooks/session-lifecycle.ts`
  - `src/hooks/messages-transform.ts`
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
  - `src/lib/cognitive-packer.ts`
  - `src/lib/injection-orchestrator.ts`
- governance and continuity
  - `src/hooks/soft-governance.ts`
  - `src/hooks/tool-gate.ts`
  - `src/lib/session-split.ts`
  - `src/lib/session-role.ts`
  - `src/lib/session_coherence.ts`
  - `src/lib/compaction-engine.ts`
- inspect and schema
  - `src/tools/hivemind-inspect.ts`
  - `src/lib/inspect-engine.ts`
  - `src/lib/hierarchy-tree.ts`
  - `src/schemas/brain-state.ts`
  - `src/schemas/graph-nodes.ts`
- tests
  - `tests/messages-transform.test.ts`
  - `tests/soft-governance.test.ts`
  - `tests/tool-gate.test.ts`
  - `tests/compact-purification.test.ts`
  - `tests/injection-dedupe-contract.test.ts`
  - `tests/budget-hook-cap.test.ts`
  - `tests/budget-session-continuity.test.ts`

## Questions To Answer

### Q1: Injection Surface Consolidation

What is the safest staged path to consolidate prompt-surface ownership without destabilizing current tests?

I need:

- which surface should own which class of data
- what should be removed first as duplicate
- what should stay temporarily for compatibility
- what tests should be added before moving ownership

### Q2: `tool-gate` Mutation Strategy

Should `src/hooks/tool-gate.ts` stop queuing mutations entirely now that `soft-governance.ts` is already the flush boundary?

I need:

- repo-specific risks of removing tool-gate queuing
- any subtle behavior currently depending on those queued writes
- the safest migration path if the answer is yes

### Q3: Cognitive-Packer-Led Injection

What is the safest migration path from today’s duplicate status/anchor rendering toward cognitive-packer-led prompt injection?

I need:

- what to keep in `system[]`
- what to keep in `messages[] prepend`
- whether the anchor header should survive
- whether `buildStatusBlock()` should survive

### Q4: Delegation Continuity Storage

Where should delegation `task_id` and lineage references live in this repo?

Possible candidates:

- `cycle_log`
- `hivemind_cycle` export artifacts
- session split lineage payloads
- a normalized continuity envelope used by all three

I need the safest repo-local design, not a greenfield abstraction.

### Q5: `hivemind_inspect.traverse`

How should `traverse` be phased into `hivemind_inspect` without widening tool complexity too early?

I need:

- exact first version of the API
- exact files to touch
- relationship between tree traversal and graph traversal
- initial tests only, not the fully generalized future version

## What Not To Recommend

- Do not recommend replacing the current architecture wholesale.
- Do not recommend new tools/plugins/SDK layers unless you first prove an existing subsystem cannot absorb the change safely.
- Do not repeat already-settled file-existence or budget/flush findings.
- Do not answer with generic agent-framework patterns detached from these repo slices.

## Required Output Format

1. Current-state subsystem map
2. Keep / discard / refactor-now / refactor-later table
3. Refactor phases with exact files
4. Test-first migration sequence
5. Rollback concerns
6. What should remain unchanged

## Quality Bar

- Be repo-specific.
- Name exact files and functions.
- Prefer narrow phased moves over wide rewrites.
- Optimize for continuity, low-regression rollout, and compatibility with the current tests.


Now I have a thorough map of the entire codebase. Let me compile the full analysis.

---

## Repo-Mapping & Phased Refactor Analysis

### Corrections to "Settled Local Facts"

Three files listed as settled **do not exist** in either repository:

| Claimed File | Status |
|---|---|
| `src/lib/injection-orchestrator.ts` | **Does not exist** |
| `src/lib/session-role.ts` | **Does not exist** |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | **Does not exist** in either `opencode` or `hivemind-plugin` |

Three test files listed as settled also **do not exist**:

| Claimed Test | Status |
|---|---|
| `tests/budget-hook-cap.test.ts` | **Does not exist** |
| `tests/budget-session-continuity.test.ts` | **Does not exist** |
| `tests/injection-dedupe-contract.test.ts` | **Does not exist** |

The `.opencode/` directory in `shynlee04/opencode` is empty — there are no plugin files at all. The hivemind plugin lives entirely in `shynlee04/hivemind-plugin`. The `session.role` field exists as a string property on `SessionState` in `src/schemas/brain-state.ts` (line 25), not as a standalone module. [0-cite-0](#0-cite-0) 

---

### 1. Current-State Subsystem Map

```mermaid
graph TD
    subgraph "Prompt Surfaces (3 writers)"
        SL["session-lifecycle.ts\n(system[] writer)\nGovernance + bootstrap + status"]
        MT["messages-transform.ts\n(messages[] writer)\nCognitive packer + anchor + checklist"]
        CP["cognitive-packer.ts\n(XML compiler)\nReads graph/*.json, produces <hivemind_state>"]
    end

    subgraph "Governance & Continuity"
        SG["soft-governance.ts\n(tool.execute.after)\nCounters + detection + flush boundary"]
        TG["tool-gate.ts\n(tool.execute.before)\nAdvisory + drift + file-touch tracking"]
        SS["session-split.ts\nAuto-split on boundary"]
        SC["session_coherence.ts\nFirst-turn cross-session context"]
        CE["compaction-engine.ts\nPurification + archive + session reset"]
    end

    subgraph "Inspect & Schema"
        HI["hivemind-inspect.ts\nscan | deep | drift"]
        IE["inspect-engine.ts\nScanResult, InspectResult, DriftReport"]
        HT["hierarchy-tree.ts\nTree CRUD + rendering + gap detection"]
        BS["brain-state.ts\nBrainState + CycleLogEntry + MetricsState"]
        GN["graph-nodes.ts\nZod schemas: Trajectory, Plan, Phase, Task, Mem"]
    end

    subgraph "State Authority (3 stores)"
        BRAIN["brain.json\nSession + metrics + cycle_log + hierarchy flat"]
        GRAPH["graph/*.json\nTrajectory, plans, tasks, mems (relational)"]
        HIER["hierarchy.json\nNavigable tree with cursor"]
    end

    SL -->|"reads"| BRAIN
    MT -->|"reads"| BRAIN
    MT -->|"calls"| CP
    CP -->|"reads"| GRAPH
    SG -->|"queues mutations to"| BRAIN
    TG -->|"queues mutations to"| BRAIN
    SS -->|"reads + resets"| BRAIN
    SC -->|"reads archive"| HIER
    CE -->|"reads + resets"| BRAIN
    CE -->|"reads + resets"| HIER
    HI -->|"delegates to"| IE
    IE -->|"reads"| BRAIN
    IE -->|"reads"| HIER
``` [0-cite-1](#0-cite-1) [0-cite-2](#0-cite-2) [0-cite-3](#0-cite-3) [0-cite-4](#0-cite-4) 

---

### 2. Keep / Discard / Refactor-Now / Refactor-Later Table

| File | Verdict | Rationale |
|---|---|---|
| `src/hooks/session-lifecycle.ts` | **Refactor-now** | Still renders `buildStatusBlock()` (lines 152-157) and `buildMetricsBlock()` (lines 159-161) — both overlap with what `packCognitiveState` already provides in `<hivemind_state>` XML |
| `src/hooks/messages-transform.ts` | **Keep (canonical location)** | Already owns cognitive-packer injection (line 411), anchor prepend (line 418), and checklist append (line 534). This is the correct surface for messages[] |
| `src/lib/cognitive-packer.ts` | **Keep** | Well-structured context compiler with budget, staleness, and anti-pattern support. Should be the single source of injected cognitive state |
| `src/lib/injection-orchestrator.ts` | **Keep** | Historical external claim was stale. This file exists and is the shared injection-ledger/orchestration surface. |
| `src/lib/session-role.ts` | **Keep** | Historical external claim was stale. This file exists and owns session-kind/role resolution helpers. |
| `src/hooks/soft-governance.ts` | **Keep** | Canonical flush boundary (line 500-506). Counter engine is well-separated from prompt assembly |
| `src/hooks/tool-gate.ts` | **Refactor-later** | Still queues mutations (lines 223-229, 267-269) for drift score and file-touch tracking. These overlap with soft-governance |
| `src/lib/session-split.ts` | **Keep** | Clean split logic, already invoked from soft-governance |
| `src/lib/session_coherence.ts` | **Keep** | First-turn cross-session context is well-isolated |
| `src/lib/compaction-engine.ts` | **Keep** | Historical external claim was stale. Current repo already uses `DEFAULT_COMPACTION_BUDGET`. |
| `src/tools/hivemind-inspect.ts` | **Keep / Refactor-later** | `traverse` v1 now exists; future work is expansion beyond tree-only traversal. |
| `src/lib/inspect-engine.ts` | **Keep / Refactor-later** | Tree-only traversal is now implemented; future work is richer related traversal. |
| `src/lib/hierarchy-tree.ts` | **Keep** | Clean tree engine, already has `getAncestors`, `flattenTree`, `findNode` needed for traversal |
| `src/schemas/brain-state.ts` | **Keep / Refactor-later** | `CycleLogEntry.task_id` continuity is now implemented; remaining work is any future normalized delegation envelope. |
| `src/schemas/graph-nodes.ts` | **Keep** | Zod schemas are solid | [0-cite-5](#0-cite-5) [0-cite-6](#0-cite-6) [0-cite-7](#0-cite-7) [0-cite-8](#0-cite-8) 

---

### 3. Refactor Phases with Exact Files

#### Phase 0: Historical stale-reference section

This subsection is preserved as part of the returned external reply. Do not execute it literally against the current repo.

Remove all references to non-existent files from any documentation, planning artifacts, or code comments:
- `src/lib/injection-orchestrator.ts`
- `src/lib/session-role.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

#### Phase 1: Q4 — Historical continuity section

This subsection is now completed locally and should be read as resolved history, not active work.

**Files:**
- `src/schemas/brain-state.ts` — Add `task_id?: string` to `CycleLogEntry` interface
- `src/hooks/soft-governance.ts` — Extract `task_id` from `_output.metadata` when `input.tool === "task"` (around line 449-458)
- `src/tools/hivemind-cycle.ts` — Include `task_id` in export output

**Tests to add first:**
- `tests/cycle-intelligence.test.ts` — Add assertions for `task_id` presence in cycle log entries [0-cite-8](#0-cite-8) [0-cite-9](#0-cite-9) 

#### Phase 2: Q5 — Historical traverse bootstrap section

This subsection is now completed locally in tree-first form and should be read as resolved history, not active work.

**Files:**
- `src/lib/inspect-engine.ts` — Add `traverseTree(directory, nodeId?, direction?)` function
- `src/tools/hivemind-inspect.ts` — Add `"traverse"` to action enum, wire to engine
- `src/lib/hierarchy-tree.ts` — Already has `getAncestors`, `flattenTree`, `findNode`, `getCursorNode` — reuse these

**First-version API:**
```typescript
// Args:
{ action: "traverse", nodeId?: string, direction?: "up" | "down" | "siblings" }
// Returns:
{ nodes: Array<{ id, level, content, status, children_count }>, path: string[] }
```

**Tests to add first:**
- `tests/hivemind-inspect-traverse.test.ts` — Test: traverse from cursor up, traverse from root down, traverse siblings, traverse with no tree

**Relationship between tree and graph traversal:** Tree traversal (`hierarchy-tree.ts`) operates on `HierarchyNode` with `trajectory > tactic > action` levels and temporal stamps. Graph traversal (`graph-io.ts`) operates on `TrajectoryNode > PlanNode > PhaseNode > TaskNode` with UUID-based FK chains. The `traverse` action should start with the tree only. Graph traversal is a separate future action (`graph_walk` or similar) because the data models are different. [0-cite-10](#0-cite-10) [0-cite-11](#0-cite-11) [0-cite-12](#0-cite-12) 

#### Phase 3: Q1 — Injection Surface Consolidation

**Ownership map (target state):**

| Surface | Owner | Data Class |
|---|---|---|
| `system[]` (via `session-lifecycle.ts`) | Governance instruction, bootstrap context, governance signals, config behavior | Static/governance-only data |
| `messages[]` prepend (via `messages-transform.ts`) | Cognitive state XML (`<hivemind_state>`), first-turn coherence, auto-realign reminders | Dynamic per-turn data |
| `messages[]` append (via `messages-transform.ts`) | Pre-stop checklist | Terminal reminders |

**What to remove first (duplicates):**

1. `buildStatusBlock()` in `session-lifecycle.ts` (lines 152-157) — This renders `Session: ... | Mode: ... | Governance: ...` into `system[]`. The cognitive packer already provides this inside `<hivemind_state>` XML which is injected via `messages-transform.ts` (line 411-413). Remove from `session-lifecycle.ts`.

2. `buildMetricsBlock()` in `session-lifecycle.ts` (lines 159-161) — Renders `Turns: ... | Drift: ... | Files: ...`. Same data is in `<context_summary>` of the cognitive packer output. Remove.

3. The anchor header in `messages-transform.ts` `buildAnchorContext()` (lines 162-168) — The cognitive packer already includes `<anchors>` in its XML output (cognitive-packer.ts lines 361-383). The `buildAnchorContext` is a one-liner duplicate: `[SYSTEM ANCHOR: ${phase} | Active Task: ${task} | Hierarchy: ${hierarchyStatus}]`. This can be removed once you verify no test depends on the exact string format.

**What to keep temporarily for compatibility:**
- `buildStatusBlock()` — keep for 1 release cycle with a deprecation comment, remove in phase 3b
- `buildAnchorContext()` — keep for 1 release cycle, same

**Tests to add before moving ownership:**
- Test that cognitive packer output contains trajectory, drift score, anchor count, and files_touched count (covering the same data as `buildStatusBlock` and `buildMetricsBlock`)
- Test that removing `buildAnchorContext` doesn't cause any existing test to fail (run existing `tests/messages-transform.test.ts` with the anchor context function stubbed to return `""`) [0-cite-13](#0-cite-13) [0-cite-14](#0-cite-14) [0-cite-15](#0-cite-15) 

#### Phase 4: Q2 — `tool-gate` Mutation Strategy

**Current state:** `tool-gate.ts` queues mutations in two places:
1. Lines 223-229: `queueStateMutation` for drift score + file-touch updates
2. Lines 267-269: `queueStateMutation` for complexity nudge flag

`soft-governance.ts` (the `tool.execute.after` hook) also:
1. Increments turn count (line 202)
2. Updates detection state (lines 313-323)
3. Tracks tool health (line 426)
4. Queues the full state update (lines 502-506)

**Repo-specific risks of removing tool-gate queuing:**

1. **Drift score timing**: `tool-gate.ts` calculates drift using a *projected* turn count (`projectedTurnCount = state.metrics.turn_count + 1`, line 186). This pre-computation ensures the drift warning fires *before* the tool executes, not after. If you remove this, drift warnings would only appear on the *next* tool call (1-turn lag). For `strict` governance this matters.

2. **File-touch tracking**: `tool-gate.ts` calls `addFileTouched(state, `[via ${toolName}]`)` at line 190-191 *before* the tool runs. `soft-governance.ts` does NOT track file touches — it tracks tool types via `classifyTool()`. Removing tool-gate's file-touch would lose pre-execution tracking.

3. **Complexity nudge**: The `setComplexityNudgeShown()` at line 266 is gated by `!state.complexity_nudge_shown` and only fires once per session. Moving this to soft-governance would be safe but requires careful placement.

**Subtle behavior depending on queued writes:**
- The `applyPendingStateMutations()` call in `tool-gate.ts` itself (line 91) reads *previously queued* mutations from soft-governance. This means tool-gate sees the merged state from prior cycles. If you remove tool-gate's queuing, the merged state logic still works because soft-governance queues are applied.

**Safest migration path (if answer is yes — and it is partially yes):**

1. **Move file-touch tracking** to `soft-governance.ts` (add it alongside turn increment, around line 256-270). The `_output.metadata` in soft-governance has access to file paths. This is the correct location.
2. **Keep drift pre-computation in tool-gate** but stop queuing the state — instead, just emit the advisory/warning return value. The actual drift score update should be done once in soft-governance.
3. **Move complexity nudge** to soft-governance.
4. **Remove all `queueStateMutation` calls from tool-gate.ts** after the above moves.
5. **Do NOT remove tool-gate itself** — it still serves as the advisory/warning surface for pre-execution governance checks (framework conflict, locked session, no session state). [0-cite-16](#0-cite-16) [0-cite-17](#0-cite-17) [0-cite-18](#0-cite-18) 

#### Phase 5: Q3 — Cognitive-Packer-Led Injection

**Target state:**

| Location | What stays | What gets removed |
|---|---|---|
| `system[]` (session-lifecycle.ts) | `HIVE_MASTER_GOVERNANCE_INSTRUCTION` (always first), bootstrap blocks (first 2 turns only), `generateAgentBehaviorPrompt()`, governance signals from `buildGovernanceSignals()` | `buildStatusBlock()`, `buildMetricsBlock()`, `buildTaskBlock()` |
| `messages[]` prepend | `packCognitiveState()` (canonical cognitive state), first-turn coherence from `session_coherence.ts`, auto-realign reminders | `buildAnchorContext()` anchor header |
| anchor header | **Remove** — cognitive packer already includes `<anchors>` in XML | — |
| `buildStatusBlock()` | **Remove** — session/mode/governance is in `<hivemind_state>` and in the governance instruction | — |

**Specific answers:**
- **Anchor header should NOT survive** — `buildAnchorContext()` in messages-transform.ts (lines 162-168) is a plaintext duplicate of what the cognitive packer renders as structured XML with individual key-value pairs.
- **`buildStatusBlock()` should NOT survive** — it renders `Session: ... | Mode: ... | Governance: ...` which is metadata the cognitive packer provides in its `<hivemind_state session="..." ...>` attributes and the system prompt already contains the governance mode from `HIVE_MASTER_GOVERNANCE_INSTRUCTION`. [0-cite-19](#0-cite-19) [0-cite-20](#0-cite-20) [0-cite-21](#0-cite-21) 

---

### 4. Test-First Migration Sequence

| Order | Test to Write | Covers Phase |
|---|---|---|
| 1 | `tests/cycle-task-id.test.ts` — Assert `CycleLogEntry` has `task_id` when `tool === "task"` | Phase 1 |
| 2 | `tests/traverse-inspect.test.ts` — Assert `traverse` returns node path from cursor, from root, from specific nodeId | Phase 2 |
| 3 | `tests/cognitive-packer-coverage.test.ts` — Assert packed XML contains session mode, governance status, drift score, anchor count, files_touched count (proving it covers what `buildStatusBlock` + `buildMetricsBlock` render) | Phase 3 |
| 4 | `tests/injection-surface-dedup.test.ts` — Assert that with `buildStatusBlock` and `buildAnchorContext` removed, all data is still present in the combined system + messages output | Phase 3 |
| 5 | `tests/tool-gate-readonly.test.ts` — Assert tool-gate queues zero mutations, soft-governance handles file-touch and drift | Phase 4 |
| 6 | `tests/messages-transform-packer-only.test.ts` — Assert messages prepend contains exactly one `<hivemind_state>` block and no separate anchor header | Phase 5 |

---

### 5. Rollback Concerns

| Phase | Risk | Rollback Strategy |
|---|---|---|
| Phase 1 (task_id) | Additive-only schema change. Low risk. | `task_id` is optional (`?`). Old code ignores it. |
| Phase 2 (traverse) | New action on existing tool. Low risk. | Behind new enum value. Old `scan`/`deep`/`drift` untouched. |
| Phase 3 (dedup) | Medium risk — removing `buildStatusBlock` could lose data if cognitive packer fails to load graph files. | Keep both for 1 release with deprecation flag. Feature-flag the removal: `if (config.use_packer_only) skip buildStatusBlock()`. |
| Phase 4 (tool-gate mutations) | Medium risk — drift warnings may lag by 1 turn. | Add drift pre-check in soft-governance *before* main logic. Can revert by re-enabling `queueStateMutation` calls. |
| Phase 5 (anchor removal) | Low risk once Phase 3 tests pass. | Revert is single function re-enable. |

---

### 6. What Should Remain Unchanged

- **`HIVE_MASTER_GOVERNANCE_INSTRUCTION`** in `src/lib/governance-instruction.ts` — prepend to `system[]` every turn. No change. [0-cite-22](#0-cite-22) 
- **`soft-governance.ts`** counter/detection engine — already correct as the canonical flush boundary. [0-cite-18](#0-cite-18) 
- **`compaction-engine.ts`** — already uses `LEGACY_COMPACTION_BUDGET` from `budget.ts`. The budget migration is cosmetic and can wait. [0-cite-23](#0-cite-23) 
- **`session-split.ts`** — clean, invoked from soft-governance, no changes needed. [0-cite-24](#0-cite-24) 
- **`session_coherence.ts`** — first-turn coherence logic is well-isolated and correct. [0-cite-25](#0-cite-25) 
- **All existing test files** (`tests/messages-transform.test.ts`, `tests/soft-governance.test.ts`, `tests/tool-gate.test.ts`, `tests/compact-purification.test.ts`) — must continue passing through all phases.

- **`graph-nodes.ts` Zod schemas** — no changes needed. [0-cite-26](#0-cite-26) 
- **`hierarchy-tree.ts`** — no structural changes, only consumed by new `traverse` function. [0-cite-27](#0-cite-27) 

---

### Q4 Answer: Delegation Continuity Storage

The `task_id` and lineage references should live in **`CycleLogEntry`** (in `brain-state.ts`), not in a new normalized envelope. Here's why:

1. `CycleLogEntry` already captures subagent results (lines 69-81) and is auto-populated in `soft-governance.ts` when `input.tool === "task"` (line 449-451). [0-cite-28](#0-cite-28) 

2. The `output.metadata` from the task tool likely already contains the task ID — extract it there.

3. Session split lineage is already handled via `<session_lineage parent_session="..." reason="..." />` in `session-split.ts` (line 139). This covers the split case. [0-cite-29](#0-cite-29) 

4. The `hivemind_cycle` export already reads from `brain.session.id` and could include `cycle_log` entries with `task_id` — no new storage format needed. [0-cite-30](#0-cite-30) 

**Schema change:**
```typescript
// In src/schemas/brain-state.ts, CycleLogEntry:
export interface CycleLogEntry {
  timestamp: number;
  tool: string;
  output_excerpt: string;
  failure_detected: boolean;
  failure_keywords: string[];
  task_id?: string;           // ADD: FK to graph task or subagent task ID
  parent_session_id?: string; // ADD: for lineage tracing across splits
}
```

This keeps everything in `brain.json` (the hot store that every hook already reads) and avoids a fourth state authority.
