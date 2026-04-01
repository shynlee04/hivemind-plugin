# Code Skepticism Report — Architecture Proposal 2026-04-01

**Scope:** Full `src/` restructuring proposal for HiveMind OpenCode plugin
**Files Analyzed:** 315 TypeScript files, ~37,254 LOC across 19 top-level directories
**Evidence Sources:** 9 investigation reports (tools, features, hooks, plugin, shared, remaining layers, runtime lifecycle, oh-my-openagent patterns, SDK capabilities) + prior skeptic review (2026-03-31, 372 lines)
**Reviewer:** code-skeptic
**Date:** 2026-04-01
**Overall Risk:** HIGH

---

## Verdict: GO WITH CONDITIONS — 12 conditions must be met before Phase 0 begins

The proposal is structurally sound in its diagnosis (upward imports, dead code, cross-layer violations) but over-engineers the cure. The migration path is too aggressive, the factory pattern adoption is premature, and several "solutions" create more complexity than the problems they solve. The prior review (2026-03-31) identified 6 false assumptions, 4 over-engineering risks, and 3 critical missing contexts — this review builds on those findings with deeper evidence from the expanded investigation set.

Below are the specific conditions that must be addressed.

---

## Critical Findings (Must Fix Before Migration)

### C1: Phase 2v (runtime-entry split) is not safely decomposable

**Location:** Proposal §9 Phase 2, commit 2v (lines 700-708)

The proposal claims runtime-entry can be split across 3 sub-commits (2v-1, 2v-2, 2v-3), each independently revertible. This is **false**.

**Evidence from inventory** (`inventory-remaining-layers-2026-03-31.md` lines 132-160): `runtime-entry` has 24 files, 3,000 LOC, with cross-imports to `core/`, `governance/`, `control-plane/`, `commands/`, `recovery/`, `shared/`, `sdk-supervisor/`, and `tools/hivefiver-setting/`. The `command.ts` file (296 LOC) imports from `workflow-continuity.ts` (289 LOC), which imports from `agent-work-contract/`. The `init.handler.ts` (266 LOC) imports from `sdk-runtime.ts`. The `settings.ts` (200 LOC) imports from `tools/hivefiver-setting/`.

These files are **not** cleanly separable into "runtime logic," "session logic," and "admin logic." The `executeRuntimeEntryCommandBundle()` function in `command.ts` orchestrates auto-recovery, handler dispatch, turn output export, AND session contract linkage in a single function. You cannot extract "runtime logic" without breaking the command dispatch chain.

**Required fix:** Phase 2v must be a SINGLE commit, not 3 sub-commits. Or better: defer runtime-entry split to a separate PR after all other moves are complete and verified.

### C2: Phase 3 Step 2 (move tool arg types) is not atomic

**Location:** Proposal §9 Phase 3 Step 2 (lines 727-732)

The proposal says "Move tool arg types to feature contracts" for 6 tool directories simultaneously. This requires:
- Moving 6 `types.ts` files
- Updating 6 tool files to import from new locations
- Updating 6 feature files that currently import from `tools/*/types.js`

**Evidence from inventory** (`inventory-features-layer-2026-03-31.md` lines 274-289): All 6 upward imports are type-only. The proposal treats this as a simple move, but if ANY of the 6 moves fails type-checking, the entire Phase 3 Step 2 is broken. There is no incremental path here.

**Required fix:** Move ONE tool's types at a time, with type-check gates between each. Start with the simplest (`trajectory/types.ts` — 35 LOC) and work up to the most complex (`handoff/types.ts` — 118 LOC).

### C3: `shared/logging.ts` → `hooks/sdk-context.ts` reverse dependency is not addressed

**Location:** Proposal §5 Dependency Graph (lines 419-426) and §5 Import Rules (lines 431-438)

**Evidence from inventory** (`inventory-hooks-plugin-shared-2026-03-31.md` lines 169-183): `shared/logging.ts` imports from `hooks/sdk-context.js` (line 8). This is a reverse dependency — the shared leaf layer depends on the hooks layer. The proposal's dependency graph shows `shared/` importing only from `schema-kernel/`, which is **incorrect** for the current codebase.

The proposal's Phase 3 Step 4 mentions this ("`shared/logging.ts` → `hooks/sdk-context.ts` reverse dependency → move SDK context initialization to `shared/sdk-adapter.ts`") but the solution is wrong. Creating a new `shared/sdk-adapter.ts` that imports from stdlib only won't work because SDK context initialization requires `PluginInput` from `@opencode-ai/plugin` — which is NOT stdlib.

**Required fix:** Either (a) move `logging.ts` out of `shared/` into `plugin/` where SDK context is available, or (b) make logging accept an SDK client as a constructor parameter rather than importing it directly. Do NOT create a "stdlib-only" SDK adapter — that's a contradiction.

### C4: CQRS classification for trajectory ledger is wrong

**Location:** Proposal §4 Module Classification Matrix (line 377) and §4 CQRS Rationale (lines 376-384)

The proposal marks trajectory ledger as "Yes" for CQRS with rationale "Tool writes + hook auto-writes; needs conflict resolution."

**Evidence from runtime lifecycle map** (`runtime-lifecycle-map-2026-03-31.md` lines 218-234, 288-294): The trajectory ledger is written by `recordTrajectoryEvent()` which is called from:
1. Tool execution (`hivemind_trajectory` tool)
2. `event-handler.ts` (session events: created, idle, deleted, compacted)

But the event handler is a **single sequential process** — OpenCode fires events one at a time. There is no concurrent write scenario. The "conflict resolution" the proposal fears does not exist in the current runtime model.

**Required fix:** Remove trajectory ledger from CQRS classification. It's a single-writer (tools) + sequential event recorder (hooks). No locking, no conflict resolution needed.

### C5: Circular dependency `runtime-entry/settings.ts` ↔ `tools/hivefiver-setting/` not flagged as cycle

**Location:** Proposal §9 Phase 3 Step 1 (lines 719-724)

**Evidence from prior review** (2026-03-31, lines 27-29): `features/runtime-entry/settings.ts:13` imports `buildHmSettingDashboardProof` from `tools/hivefiver-setting/index.js` (runtime function import). Meanwhile, `tools/hivefiver-setting/tools.ts:25` imports `loadRuntimeBindingsSnapshot` from `features/runtime-entry/snapshot-loader.js`. This is a **circular dependency at the module level** — not a simple upward import.

The proposal treats this as a simple "fix runtime function imports" step. It's actually a cycle-breaking refactor. If Phase 3 Step 1 moves `buildHmSettingDashboardProof` without also updating the import in `hivefiver-setting/tools.ts`, the build breaks.

**Required fix:** Phase 3 Step 1 must be a single atomic operation: (a) move the function, (b) update BOTH import sites, (c) verify type-check. Not two separate steps.

### C6: The proposal's dependency graph is a fiction

**Location:** Proposal §5 Dependency Graph (lines 388-438)

The proposed layer hierarchy has 8 layers (0-7) with clean "can import / cannot import" rules. But the actual codebase has:
- `shared/logging.ts` → `hooks/sdk-context.js` (shared → hooks, violating "shared is leaf")
- `plugin/messages-transform-adapter.ts` → `hooks/start-work/start-work-router.ts` (plugin → hooks, violating "plugin can't import hooks")
- `plugin/input-helpers.ts` → `features/agent-work-contract/hooks/` (plugin → feature hooks)
- `features/runtime-entry/settings.ts` → `tools/hivefiver-setting/` (features → tools, the circular dependency)

The proposal's import rules table (§5, lines 431-438) shows a clean hierarchy that doesn't match reality. It claims "Shared (6) → Schema (7) only" but `shared/logging.ts` imports from hooks. It claims "Plugin (1) → Tools (2), Hooks (5), Shared (6), Schema (7)" but plugin also imports from features.

**Required fix:** The dependency graph must show the CURRENT state (with violations) alongside the TARGET state. The migration path must explicitly enumerate each violation and how it will be resolved.

---

## Warnings (Risks to Mitigate)

### W1: Factory pattern adoption adds indirection without solving a current problem

**Location:** Proposal §9 Phase 4 (lines 744-754)

The current codebase works fine with direct exports. Every tool file exports a function that returns a `ToolDefinition`. Every hook file exports a function that returns a hook handler. The proposal wants to wrap ALL of these in `createXXX()` factories with a `Managers` interface.

**Evidence from inventory** (`inventory-tools-layer-2026-03-31.md` lines 308-324): The current pattern is consistent — 6 of 9 tools follow the 3-file structure (`index.ts` + `tools.ts` + `types.ts`). The execute pattern is uniform: call feature-layer function, check result, render response.

Adding factories means:
- Every tool needs a factory function
- Every hook needs a factory function
- A `Managers` type must be defined and maintained
- Every factory must receive the managers interface as constructor args

This is indirection for indirection's sake. The oh-my-openagent pattern works for them because they have 48 hooks and 26 tools. HiveMind has 11 hooks and 12 tools.

**Mitigation:** Adopt factories only for tools (where the SDK `tool()` helper already acts as a factory). Do NOT adopt the `Managers` interface pattern. Hooks can continue to receive their dependencies directly.

### W2: `session/` as a new top-level directory breaks the layer model

**Location:** Proposal §3 Ideal Directory Structure (lines 281-289)

The proposal creates `src/session/` as a new top-level directory containing intake gates, profile resolution, lineage routing, purpose classification, readiness gates, session state detection, and session types.

**Evidence from inventory** (`inventory-features-layer-2026-03-31.md` lines 189-214): These files currently live in `features/session-entry/` (13 files, 1,028 LOC). They import from `control-plane/`, `commands/slash-command/`, `shared/`, and `context/prompt-packet/`.

The proposal's dependency graph (§5, lines 388-426) places `session/` at "Layer 5a" alongside hooks. But `session/` imports from `control-plane/` which is at "Layer 6" in the proposal. This creates a layer violation that the proposal doesn't acknowledge.

**Mitigation:** Either keep `session/` as `features/session/` (staying within the features layer) or explicitly define its layer position and update the dependency graph accordingly.

### W3: Phase 1 dead code deletion may remove dynamically-loaded code

**Location:** Proposal §9 Phase 1 (lines 637-663)

The proposal marks `cli/`, `governance/`, and `sdk-supervisor/` for deferred deletion/merge. But it also marks `hooks/auto-slash-command/` and `hooks/workflow-integration/` as dead code.

**Evidence from inventory** (`inventory-hooks-plugin-shared-2026-03-31.md` lines 36-38): `auto-slash-command/` is "not imported outside hooks barrel" but IS exported from `hooks/index.ts`. The `workflow-integration/` module is similarly "not imported outside hooks barrel" but IS exported.

If any code dynamically imports from the hooks barrel (e.g., via `require()` with a variable path, or via plugin config), these "dead" modules would break at runtime.

**Mitigation:** Before deleting, run `grep -rn "auto-slash-command\|workflow-integration" src/` to confirm zero references including string literals. Also check `opencode.json` and any plugin config files.

### W4: Tool priority ordering is backwards in naming

**Location:** Proposal §6 Tool Catalog Design (lines 481-502)

The `LOW_PRIORITY_TOOL_ORDER` array lists tools from lowest to highest priority, with `hivemind_trajectory` at the end (highest priority). But the array name says "LOW_PRIORITY" — implying tools at the START are low priority and get trimmed first.

**Evidence from oh-my-openagent patterns** (`oh-my-openagent-patterns-2026-04-01.md` lines 289-298): oh-my-openagent trims tools "in order until under cap" — meaning the FIRST tools in the array are removed first.

If HiveMind's array is interpreted the same way, `hivemind_hm_doctor` (first in array) would be trimmed first, and `hivemind_trajectory` (last) would be kept. This is correct behavior. But the array name is confusing — it should be `TRIM_ORDER` or `LOWEST_PRIORITY_FIRST`.

**Mitigation:** Rename to `TOOL_TRIM_ORDER` and add a comment: "Tools removed in this order when max_tools cap is reached."

### W5: No test strategy for the migration

**Location:** Proposal §9 (all phases)

Every phase gate says "`npx tsc --noEmit` passes" and some say "`npm test` passes." But the proposal doesn't address:
- The 3 currently failing journal tests
- The 5 tools with zero test coverage (trajectory, task, handoff, runtime, doc)
- How to verify that moved modules still work at runtime in OpenCode

**Evidence from inventory** (`inventory-tools-layer-2026-03-31.md` lines 267-279): Only `hivemind-journal.ts` has dedicated tests (10 test cases). The integration test file `hivefiver-tools.test.ts` covers init/doctor/setting.

**Mitigation:** Add a Phase 0.5: Fix all failing tests and add smoke tests for the 5 untested tools BEFORE any file moves. Failing tests make it impossible to verify migration correctness.

### W6: The proposal contradicts itself on barrel exports

**Location:** Proposal §1 Executive Summary line 8 vs §3 Ideal Directory Structure

Line 8 says: "No barrel file re-exports entire directories — every import is explicit and traceable."

But the proposed directory structure (§3, lines 105-302) has `index.ts` barrel files in EVERY module: `tools/index.ts`, `features/trajectory/index.ts`, `features/workflow/index.ts`, `hooks/index.ts`, `shared/index.ts`, `core/index.ts`, `schema-kernel/index.ts`, etc.

**Mitigation:** Either drop the "no barrel" claim or remove the `index.ts` files from the proposed structure. You can't have both.

### W7: `delegation/` module is an island, not a leaf

**Location:** Proposal §5 Circular Dependency Prevention line 445

The proposal says: "Delegation is a leaf module. It has no imports from features, tools, or hooks — only shared and schema-kernel."

**Evidence from inventory** (`inventory-remaining-layers-2026-03-31.md` lines 96-101): The current `delegation/` module has **zero external consumers** in `src/`. It's not a leaf — it's an island. The `features/handoff/handoff.ts` file imports from `delegation/` but the inventory shows no `src/` consumers import from `src/delegation/`.

**Mitigation:** Before treating delegation as a leaf module, verify it's actually imported. If it's truly unwired, wiring it up is a prerequisite to the restructuring, not a consequence.

---

## Observations (Fine but Worth Noting)

### O1: The proposal correctly identifies the `hivefiver-setting` upward dependency problem

The tool imports from 4 layers beyond features (`features/runtime-entry/`, `features/session-entry/`, `sdk-supervisor/`, `control-plane/`). This is the most cross-layer-coupled file in the codebase. Moving it to `tools/admin/` and extracting the config surface is the right call.

### O2: Lifecycle-driven module placement is a good organizing principle

Grouping by which lifecycle events modules respond to (rather than by file count) makes the architecture more navigable. The runtime lifecycle map confirms the 7-event chain is accurate.

### O3: Dead code removal before restructuring is correct

Moving dead code to new locations creates the illusion of value. Deleting it first (with git history preservation) is the right approach. The 14 dead files + 2 deprecated files + 4 dead subdirectories are correctly identified.

### O4: The proposal correctly demotes the hook alias registry

The previous version proposed a full alias registry with fallbacks. The revised version uses explicit named exports with comments. This is the right level of complexity for a problem that doesn't exist yet.

### O5: Single package with peerDependencies is the right call

The previous proposal's 3-package npm split would have created maintenance overhead far exceeding the ~700KB dependency savings. Dynamic imports for optional features is the correct compromise.

### O6: The proposal correctly preserves the `hivemind_contract_*` two-tool pattern

Merging create/update with export would have created a god-tool with mixed read/write concerns. Keeping two tools with a consistent prefix preserves CQRS separation and independent context trimming.

### O7: The proposal correctly identifies `governance/` and `delegation/` as wired (revised from prior review)

The prior review (2026-03-31, lines 35-58) flagged these as false claims of being "unwired." The current proposal no longer lists them as unwired — this correction is acknowledged.

---

## Specific Challenges (Section by Section)

### §1 Executive Summary

**Line 5:** "6 upward imports and 3 cross-layer violations" — The inventory shows 6 upward imports (correct) but 3 cross-layer violations in plugin/shared specifically (`shared/logging.ts` → `hooks/sdk-context.ts`, `plugin/messages-transform-adapter.ts` → `hooks/start-work/`, `plugin/input-helpers.ts` → `features/agent-work-contract/hooks/`). The proposal doesn't enumerate these 3, making the claim unverifiable.

**Line 8:** "Factory composition over barrel exports" — The proposal contradicts itself here. It says "No barrel file re-exports entire directories" but then proposes `index.ts` barrel files for every module in the ideal directory structure (§3). Every single module has an `index.ts`.

### §2 Runtime Lifecycle → Module Map

**Lines 29-39 (Session Created):** The proposal says `src/hooks/session/session-lifecycle-hook.ts` handles `session.created`. But the current code handles it in `event-handler.ts` (493 LOC), which also handles `session.updated`, `session.error`, `session.deleted`, `session.diff`, `session.idle`, and `session.compacted`. Splitting one file into 7 event handlers across multiple files adds 6 new files for what is currently one cohesive event handler.

**Lines 41-51 (Message Turn):** The proposal splits message handling into `message-journal-hook.ts` and `message-transform-hook.ts`. But the current `messages-transform-adapter.ts` (179 LOC) does context injection, turn hierarchy building, skill bundle resolution, route hinting, AND injection payload storage. The `chat-message-handler.ts` (89 LOC) does journal recording. These are already separate files — the proposal just renames them.

### §3 Ideal Directory Structure

**Lines 105-302:** The proposed structure has 19 top-level directories — the same number as the current codebase. The restructuring shuffles files between directories but doesn't reduce the directory count. The claim of "simpler structure" is not supported by the evidence.

**Lines 142-179 (features/):** The proposal splits `features/agent-work-contract/` (22 files, 2,847 LOC) into `features/contract/` with 5 files. But `agent-work-contract` contains schema definitions (244 LOC Zod schemas), engine logic (293 LOC chain executor, 158 LOC intent classifier), hooks (88 LOC event handler, 101 LOC compaction preservation), AND tools (155 + 67 + 50 LOC). The proposal's `features/contract/` only accounts for `contract-store.ts`, `intent-classifier.ts`, `chain-executor.ts`, and `contract-types.ts`. Where do the hooks go? Where do the tools go? The proposal is incomplete.

### §5 Dependency Graph

**Lines 388-426:** The proposed layer hierarchy has 8 layers (0-7). But the actual import rules table (§5, lines 431-438) shows:
- Plugin (Layer 1) can import Tools (Layer 2) — but Plugin is ABOVE Tools in the hierarchy
- Hooks (Layer 5) can import Session (Layer 5a) and Context (Layer 5b) — sibling imports

This is not a strict hierarchy. It's a DAG with cross-layer imports. The proposal calls it a "hierarchy" but it's not — and that's fine, but the proposal should be honest about it.

**Line 445:** "Delegation is a leaf module. It has no imports from features, tools, or hooks." **Evidence from inventory** (`inventory-remaining-layers-2026-03-31.md` lines 96-101): The current `delegation/` module has NO external consumers at all. It's not a leaf — it's an island. Making it a leaf module means wiring it up first, which the proposal doesn't address.

### §6 Tool Catalog Design

**Lines 460-469:** The proposal lists 7 "Public Tools" but the tool count is wrong. It lists `hivemind_contract` as one tool with 3 actions, but Decision 1 (§10, lines 793-801) says to keep TWO tools with `hivemind_contract_*` prefix. The catalog should list 8 public tools, not 7.

**Lines 471-478:** The "Optional Add-on Tools" table lists `hivemind_hm_config` but the current tool is `hivemind_hm_setting`. The rename is not documented anywhere in the migration path.

### §7 Hook Strategy

**Lines 528-551:** The hook alias registry is demoted to "optional future work" in Decision 4 (§10, line 855), but the code block in §7 (lines 528-551) still shows the full registry implementation. This is inconsistent — either remove the code block or keep the registry.

**Lines 570-576:** "Hook → Manager → Feature → Core" — This composition pattern requires the `Managers` interface (Warning W1). The proposal doesn't show what the `Managers` interface looks like or which managers each hook needs.

### §8 Feature Grouping

**Lines 584-618:** The "SDK-Dependent Features" table lists `Runtime Status` using `client.session` and `client.app.log`. But the current `runtime-observability/status.ts` (298 LOC) imports from `commands/slash-command/`, `agent-work-contract/engine/`, `runtime-entry/workflow-continuity.js`, `sdk-supervisor/`, and `tools/runtime/types.js`. The proposal's `features/runtime/runtime-status.ts` would need all these imports — making it not just "SDK-dependent" but also "feature-dependent."

### §9 Migration Path

**Phase 0 (lines 624-634):** The proposal says "Run full import audit: `grep -rn 'from.*src/' src/`". This grep pattern is too broad — it will match `from './src/...'` (relative imports within src) and `from '../src/...'` (relative imports from outside src). The correct pattern is `grep -rn "from ['\"]\.\./" src/` to find cross-module imports.

**Phase 2 (lines 665-713):** 22 commits minimum. The proposal says "Build passes after every commit" but doesn't specify how to handle the case where commit 2f (`features/agent-work-contract/` → `features/contract/`) breaks commit 2g (`features/event-tracker/` + `features/session-journal/` → `features/journal/`) because event-tracker imports from agent-work-contract.

**Phase 5 (lines 757-767):** "Update 14 agent files in `.opencode/agents/`" — The proposal doesn't list which 14 files or what changes each needs. This is a significant omission.

---

## Recommended Revisions to the Proposal

### R1: Add Phase 0.5 — Test Stabilization
Before any file moves, fix the 3 failing journal tests and add smoke tests for the 5 untested tools. This is non-negotiable — you cannot verify migration correctness with failing tests.

### R2: Reduce Phase 2 from 22 commits to 12
Combine related moves:
- Combine 2h-2p (all hook renames) into 3 commits: session hooks, chat/tool hooks, compaction/system hooks
- Combine 2q-2t (all admin tool moves) into 1 commit
- Combine 2a-2b (small hook moves) into 1 commit

### R3: Defer runtime-entry split (Phase 2v) to a separate PR
The runtime-entry module is too cross-cutting to split safely during a mass migration. Move it to `features/runtime/` as-is first, then split it in a follow-up PR with dedicated testing.

### R4: Fix the dependency graph to reflect reality
The current graph shows a clean hierarchy that doesn't match the actual codebase. Add the 3 cross-layer violations explicitly and show how each will be resolved.

### R5: Add a "What NOT to Change" section
Document the intentional design decisions that should be preserved:
- V3 no-op pattern for `addEvent()`/`addDiagnostic()`
- Subagent session linking (no separate session files)
- Injection store pattern for turn-scoped context transfer
- Trajectory ledger as single source of truth

### R6: Specify the `Managers` interface or remove it
If the `Managers` interface is adopted (§7 Hook Composition), show the actual TypeScript interface. If it's not adopted, remove all references to it from the proposal.

### R7: Add time estimates
The proposal has no time estimates. A rough estimate:
- Phase 0: 2 hours (import audit)
- Phase 0.5: 1-2 days (test fixes + smoke tests)
- Phase 1: 4 hours (dead code removal)
- Phase 2: 2-3 days (22 commits with type-check gates)
- Phase 3: 1 day (contract boundaries)
- Phase 4: 1 day (factory adoption)
- Phase 5: 4 hours (agent/test updates)
- Phase 6: Deferred

Total: 5-7 working days minimum.

### R8: Fix the Phase 0 grep command
Replace `grep -rn "from.*src/" src/` with `grep -rn "from ['\"]\.\./" src/` to correctly identify cross-module imports without matching self-references.

### R9: Reconcile tool catalog inconsistency
The catalog lists 7 public tools but Decision 1 says 8 (two `hivemind_contract_*` tools). Update the catalog to match the decision.

### R10: Remove the hook alias registry code block from §7
Decision 4 demotes the registry to optional future work. The code block in §7 should be removed or marked as "future consideration."

---

## What the Architect Got Right

1. **Dead code elimination before restructuring.** Moving dead code to new locations is cognitive debt. Deleting it first is correct.

2. **Grouping hooks by event type.** The current flat `hooks/` directory is hard to navigate. Session/chat/tool/compaction/system subdirectories make the runtime lifecycle obvious from directory structure.

3. **Merging sdk-supervisor into features/runtime.** The sdk-supervisor is not a layer — it's a feature. It has no consumers outside the runtime tool chain. Merging eliminates an artificial boundary.

4. **CQRS for journal and contract store.** The journal has multiple hooks writing concurrently (chat.message, text.complete, tool.after, compaction). The contract store has tool writes + chain executor auto-writes. These genuinely need write-side isolation.

5. **Explicit named exports over barrel re-exports.** The proposal correctly identifies that `export * from` creates implicit dependencies. Explicit named exports make import chains traceable.

6. **Single package with peerDependencies.** The 3-package split was over-engineering. Dynamic imports for optional features is the right compromise.

7. **Preserving the two-tool contract pattern.** Keeping `hivemind_contract_create` and `hivemind_contract_export` as separate tools preserves CQRS separation and independent context trimming.

8. **The lifecycle-to-module mapping.** Organizing by which lifecycle events modules respond to (rather than by file count) is a genuinely better organizing principle than the current structure.

9. **Correcting the governance/delegation wiring error from prior review.** The prior review flagged these as false claims. The current proposal no longer lists them as unwired — this correction is acknowledged.

---

## Assumptions Challenged

| # | Assumption | Risk if Wrong | Evidence |
|---|-----------|--------------|----------|
| 1 | "Trajectory ledger needs CQRS (tool writes + hook auto-writes)" | Unnecessary complexity — hooks write sequentially, not concurrently | `runtime-lifecycle-map-2026-03-31.md` lines 218-234 |
| 2 | "Factory pattern needed for all tools, hooks, managers" | Adds indirection without solving current problems | Current code works with direct exports; 11 hooks, 12 tools vs oh-my-openagent's 48 hooks, 26 tools |
| 3 | "runtime-entry can be split across 3 sub-commits" | Build breakage — files are cross-cutting, not separable | `inventory-remaining-layers-2026-03-31.md` lines 132-160 |
| 4 | "6 upward imports are the only layer violations" | Misses 3 reverse dependencies in plugin/shared | `inventory-hooks-plugin-shared-2026-03-31.md` lines 169-183 |
| 5 | "shared/logging.ts can move SDK context to stdlib-only adapter" | Contradiction — SDK context requires @opencode-ai/plugin | `inventory-hooks-plugin-shared-2026-03-31.md` line 169 |
| 6 | "Delegation module is a leaf" | It's an island — zero external consumers | `inventory-remaining-layers-2026-03-31.md` lines 96-101 |
| 7 | "Each Phase 2 commit is independently revertible" | Commit 2v's 3 sub-commits are interdependent | Proposal lines 700-708 |
| 8 | "Hook alias registry solves SDK drift" | YAGNI — no evidence of OpenCode hook renames | Decision 4, proposal line 855 |
| 9 | "No barrel file re-exports entire directories" | Contradicted by proposed structure — every module has index.ts | Proposal §1 line 8 vs §3 lines 105-302 |
| 10 | "7 public tools in catalog" | Decision 1 says 8 (two contract tools) | Proposal §6 lines 460-469 vs §10 lines 793-801 |

---

## Evidence Collected

| Command/Source | Result |
|----------------|--------|
| `find src/ -name "*.ts" \| wc -l` | 315 TypeScript files |
| `find src/ -name "*.ts" -exec cat {} + \| wc -l` | 37,254 total LOC |
| `find src/ -maxdepth 1 -type d \| wc -l` | 19 top-level directories (including src/) |
| `git status --short` | 30+ uncommitted changes (mostly in .developing-skills/ and .codexdisabled/) |
| Read: `inventory-tools-layer-2026-03-31.md` | 324 lines — 12 tools registered, 5 with zero tests |
| Read: `inventory-features-layer-2026-03-31.md` | 371 lines — 99 files, 11,010 LOC, 6 upward violations |
| Read: `inventory-hooks-plugin-shared-2026-03-31.md` | 249 lines — 11 hooks wired, 3 reverse dependencies |
| Read: `inventory-remaining-layers-2026-03-31.md` | 236 lines — 14 dead files, 2 deprecated |
| Read: `runtime-lifecycle-map-2026-03-31.md` | 383 lines — full lifecycle chain verified |
| Read: `oh-my-openagent-patterns-2026-04-01.md` | 980 lines — factory patterns, layer rules |
| Read: `opencode-sdk-capabilities-2026-04-01.md` | 702 lines — 25+ event types, 15 plugin hooks |
| Read: `skeptic-review-2026-03-31.md` | 158 lines — previous findings, 5 "what not to touch" items |
| Read: `skeptic-review-2026-04-01.md` (prior) | 372 lines — 6 false assumptions, 4 over-engineering risks, 3 missing contexts |

---

## Anti-Patterns Detected in Proposal

| Anti-Pattern | Location | Description |
|--------------|----------|-------------|
| **Premature abstraction** | §9 Phase 4 (lines 744-754) | Factory pattern for all tools/hooks adds indirection without solving current problems |
| **Self-contradiction** | §1 line 8 vs §3 lines 105-302 | "No barrel files" claim contradicted by proposed structure with index.ts everywhere |
| **Inconsistent tool count** | §6 lines 460-469 vs §10 lines 793-801 | Catalog says 7 public tools; Decision 1 says 8 |
| **Optimistic sequencing** | §9 Phase 2 (lines 665-713) | 22 commits with interdependent moves; no rollback strategy for cascading failures |
| **Incomplete dead code analysis** | §9 Phase 1 (lines 637-663) | Doesn't verify dynamic imports or string-literal references before deletion |
| **Missing consumer impact** | §9 Phase 5 (lines 757-767) | Tool ID changes are breaking changes for npm consumers with no migration plan |
| **Fictional dependency graph** | §5 lines 388-438 | Shows clean hierarchy that doesn't match actual codebase violations |

---

## Final Assessment

The proposal is **structurally sound** in its diagnosis but **over-engineered** in its cure. The migration path is too aggressive (22 commits for Phase 2 alone), the factory pattern adoption solves no current problem, and several "solutions" (CQRS for trajectory, Managers interface, safeHook wrapper) add complexity without corresponding benefit.

The proposal should be revised to:
1. Fix tests first (Phase 0.5)
2. Reduce Phase 2 from 22 to 12 commits
3. Defer runtime-entry split to a separate PR
4. Remove or justify the Managers interface
5. Fix the dependency graph to reflect reality
6. Add time estimates
7. Reconcile tool catalog inconsistencies
8. Remove the hook alias registry code block
9. Fix the Phase 0 grep command

With these revisions, the proposal would be ready for execution. Without them, the migration risks bricking the plugin for 5-7 days of debugging import chains.
