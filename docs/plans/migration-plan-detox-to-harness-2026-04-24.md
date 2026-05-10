# HiveMind V3 — Feature Migration Plan: Detox → Harness

**Document:** migration-plan-detox-to-harness-2026-04-24.md  
**Date:** 2026-04-24  
**Status:** Comprehensive Execution Plan  
**Authority:** Step-by-step migration guide for bringing cleaned v2.9.5-detox-dev features into feature/harness-implementation  
**Branches:**
- **Source:** `v2.9.5-detox-dev` (~15,000 LOC, mature but scattered)
- **Target:** `feature/harness-implementation` (~4,100 LOC, 514 tests passing, solid core)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Migration Phases (8 phases)](#2-migration-phases-8-phases)
3. [Feature-by-Feature Migration Matrix](#3-feature-by-feature-migration-matrix)
4. [Architecture Decisions](#4-architecture-decisions)
5. [Immediate Actions (Next 2 Weeks)](#5-immediate-actions-next-2-weeks)
6. [GSD Phase Recommendations](#6-gsd-phase-recommendations)
7. [Risk Mitigation](#7-risk-mitigation)

---

## 1. Executive Summary

### Current State of Both Branches

**feature/harness-implementation** (The Clean Core)
- ~4,100 LOC, 514 tests passing, TypeScript strict mode
- Solid delegation engine with WaiterModel dual-signal completion
- Durable JSON persistence (`continuity.ts`)
- Keyed semaphore concurrency control
- Lifecycle state machine with 6 phases
- **Missing:** Event tracking, session journaling, trajectory management, workflow/task lifecycle, recovery engine, runtime command dispatch, on-disk cross-session state (`.hivemind/`)
- **Gaps:** Only 1 tool (`delegate-task`) vs target of 5; no SSE completion detection; no session cancellation; constants mismatched (MAX_DESCENDANTS=50 vs spec 10); no debounced writes

**v2.9.5-detox-dev** (The Mature but Scattered Feature Set)
- ~15,000 LOC, 50+ modules, extensive feature coverage
- Has event-tracker, session-journal, trajectory, workflow-management, agent-work-contract, recovery engine, runtime-observability, runtime-entry, session-entry, doc-intelligence
- **Problems:** Feature bloat (agent-work-contract: 30 files for 1 concept), 22 governance scripts that block instead of report, 235 SKILL.md files (91% reduction needed), 57 agent files (77% reduction needed), 6 upward imports violating layer rules, no-op stubs (`addEvent`, `addDiagnostic`), 493 LOC god module (`hooks/event-handler.ts`)
- **Core mistake:** Treats skills as the product. Skills are instruction surface; harness is the runtime.

### Migration Philosophy

**Harness-first, gradual, safe.**

We do NOT merge detox into harness. We **extract and clean** individual features from detox, then **graft** them onto harness's solid core. Harness remains the single runtime authority throughout. Every feature brought over must:

1. Fit the harness module structure (`src/tools/`, `src/lib/`, `src/hooks/`, `shared/`)
2. Obey the 500 LOC module limit
3. Follow CQRS: tools write, hooks read
4. Have zero upward imports (features never import from tools)
5. Include tests before the phase completes
6. Be reversible via git checkpoint tags

**We are NOT:**
- Porting the entire detox codebase (67% LOC reduction is the target)
- Bringing governance scripts (all must be re-written as fact-reporting helpers)
- Merging skill packs (skills are re-authored, not moved)
- Trusting old documents blindly (everything is verified against running code)

### Success Criteria

| Metric | Baseline (Harness) | Target | Gate |
|--------|-------------------|--------|------|
| Total LOC | ~4,100 | ~6,000-7,000 | <8,000 |
| Tool Count | 1 | 5 | =5 |
| Test Count | 514 | >700 | All pass |
| Test Coverage | ~60% | >80% | >75% |
| Module Size Max | 401 LOC (continuity.ts) | ≤500 LOC | Enforced |
| TypeScript Errors | 0 | 0 | 0 |
| Circular Dependencies | 0 | 0 | 0 |
| Upward Imports | 0 | 0 | 0 |

---

## 2. Migration Phases (8 Phases)

---

### Phase 1: Foundation Hardening (Week 1, Days 1-3)

**Goal:** Fix harness constants and gaps before adding new features. The foundation must be solid before we build on it.

**Source:** Harness branch only — no detox code yet.

**Target Location:** `src/plugin.ts`, `src/lib/concurrency.ts`, `src/lib/routing.ts`, `opencode.json`, `src/lib/helpers.ts`

**Refactoring Required:**
- Change `MAX_DESCENDANTS_PER_ROOT` from 50 → 10 (`src/plugin.ts:38`)
- Change `doom_loop` from `"ask"` → `"allow"` (`opencode.json:25`)
- Change builder temperature from 0.2 → 0.15 (`src/lib/routing.ts:18`)
- Change default concurrency from 1 → 3, make configurable (`src/lib/concurrency.ts:37`)
- Rewrite `buildPromptText` to produce 6-section format (`src/lib/helpers.ts:77-107`)
  - Sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT
- Add `temperature` and `context` parameters to `delegate-task` tool (`src/plugin.ts`)

**Dependencies:** None — this is pure harness cleanup.

**Tests:**
- Unit tests for `buildPromptText` output format
- Unit tests for routing constant fixes
- Unit tests for concurrency config
- Integration test for delegate-task with new params

**Risk:** Low — these are configuration and format changes, not structural.

**Rollback:** `git revert` any single commit; all changes are independent.

**Checkpoint:** `git tag phase-1-foundation-hardening`

---

### Phase 2: Test Infrastructure & Event Tracker Core (Week 1-2, Days 4-7)

**Goal:** Bring over the event-tracker's consolidated-writer and markdown-writer as the foundation for session journaling. These are the most mature, self-contained modules in detox.

**Source:** `v2.9.5-detox-dev`
- `features/event-tracker/consolidated-writer.ts` — Session JSON writer
- `features/event-tracker/markdown-writer.ts` — Events markdown writer
- `features/event-tracker/types.ts` — Core types (trimmed)
- `features/event-tracker/paths.ts` — Path resolution
- `features/event-tracker/session-structure.ts` — Session structure utilities

**Target Location:**
- `src/lib/journal/` (new directory)
- `src/lib/journal/consolidated-writer.ts`
- `src/lib/journal/markdown-writer.ts`
- `src/lib/journal/paths.ts`
- `src/lib/journal/types.ts`
- `src/lib/journal/session-structure.ts`

**Refactoring Required:**
- **Remove dead code:** Delete classifier/, parser/, writers/ subdirectories from detox (no external consumers)
- **Fix no-op stubs:** `addEvent()` and `addDiagnostic()` must write to the correct V3 file paths or be removed entirely. Decision: implement them properly in the consolidated-writer.
- **Trim types.ts:** Extract `SessionV3`, `IndexEntry`, `SynthesisInput`, `SessionTreeNode` to separate files if >250 LOC each.
- **Adapt to harness patterns:** Use `[Harness]` prefix on errors, deep-clone-on-read, Zod schemas for validation.
- **Move path resolution:** Adapt `.hivemind/sessions/journey-events/` paths to harness's `.opencode/state/hivemind/` convention OR establish `.hivemind/` as the canonical cross-session state directory.

**Dependencies:** Phase 1 complete.

**Tests:**
- Unit tests for consolidated-writer JSON output
- Unit tests for markdown-writer formatting
- Unit tests for path resolution
- Integration test: write → read → verify roundtrip

**Risk:** Medium — event-tracker has the most hidden coupling. The markdown-writer may depend on trajectory types.

**Rollback:** `git tag phase-2-event-tracker`; revert to phase-1 tag if needed.

---

### Phase 3: Trajectory & Workflow Management (Week 2, Days 8-11)

**Goal:** Bring trajectory ledger and workflow task lifecycle into harness. These are self-contained, no hook dependency, and provide the core state management that hooks will later observe.

**Source:** `v2.9.5-detox-dev`
- `features/trajectory/` — Ledger management (2 files, 179 LOC)
- `features/workflow/` — Task lifecycle (2 files, 191 LOC)
- `core/trajectory/` — Ledger file I/O
- `core/workflow-management/` — Task state file I/O

**Target Location:**
- `src/lib/trajectory/` (new directory)
  - `trajectory-manager.ts` — Orchestrates ledger operations
  - `trajectory-store.ts` — File I/O wrapper
- `src/lib/workflow/` (new directory)
  - `workflow-manager.ts` — Orchestrates task lifecycle
  - `task-lifecycle.ts` — Task CRUD, activation, verification

**Refactoring Required:**
- **Remove CQRS:** Trajectory ledger does NOT need CQRS (writes are sequential, not concurrent). Keep it simple: tool calls write, event handler writes, no conflicts.
- **Merge core into lib:** The `core/` layer in detox is pure file I/O — merge into `src/lib/trajectory/` and `src/lib/workflow/` as store modules.
- **Adapt types:** Move tool arg types into feature contracts (features own their interfaces).
- **Keep under 500 LOC:** Split if any file exceeds limit.

**Dependencies:** Phase 2 complete (journal types needed for trajectory events).

**Tests:**
- Unit tests for trajectory CRUD
- Unit tests for task lifecycle transitions
- Unit tests for workflow activation/rotation
- Integration test: create workflow → add tasks → activate → complete

**Risk:** Low-Medium — these are well-isolated in detox. Main risk is type incompatibility.

**Rollback:** `git tag phase-3-trajectory-workflow`; revert to phase-2 tag if needed.

---

### Phase 4: Delegation/Handoff & Recovery Engine (Week 2-3, Days 12-15)

**Goal:** Enhance harness's existing delegation with handoff CRUD and recovery engine. Harness already has DelegationManager; we add the missing handoff store and recovery logic.

**Source:** `v2.9.5-detox-dev`
- `features/handoff/` — Delegation CRUD + continuity sync (2 files, 272 LOC)
- `delegation/` — Handoff file CRUD (already exists in harness as `delegation-persistence.ts`)
- `recovery/` — State assessment and repair (3 files)

**Target Location:**
- `src/lib/handoff/` (new directory)
  - `handoff-manager.ts` — CRUD + continuity sync
  - `handoff-types.ts`
- `src/lib/recovery/` (new directory)
  - `recovery-engine.ts` — State assessment and repair
  - `recovery-types.ts`

**Refactoring Required:**
- **Merge with existing delegation:** Harness already has `src/lib/delegation-manager.ts` and `src/lib/delegation-persistence.ts`. The detox handoff feature must integrate with these, not replace them.
- **Recovery engine integration:** Hook into harness's lifecycle-manager so recovery runs on session error events.
- **Remove intent classifier:** The detox `agent-work-contract/engine/intent-classifier.ts` uses regex — do NOT bring it. Intent classification is the conductor agent's job.
- **Remove chain executor:** The detox `agent-work-contract/engine/chain-executor.ts` is auto-dispatch logic that bypasses the harness. Do NOT bring it.

**Dependencies:** Phase 3 complete (trajectory needed for recovery checkpoints).

**Tests:**
- Unit tests for handoff CRUD
- Unit tests for recovery engine state assessment
- Integration test: simulate error → trigger recovery → verify checkpoint restored

**Risk:** Medium — integrating with existing delegation-manager requires careful interface alignment.

**Rollback:** `git tag phase-4-delegation-recovery`; revert to phase-3 tag if needed.

---

### Phase 5: Runtime Tools & Hooks (Week 3, Days 16-19)

**Goal:** Bring runtime status/command tools and the event handler hook infrastructure. This is the read-side CQRS layer.

**Source:** `v2.9.5-detox-dev`
- `features/runtime-observability/` — Status snapshot builder (3 files, 408 LOC)
- `features/runtime-entry/` — Command execution dispatcher (keep as-is, NO split yet)
- `hooks/event-handler.ts` — Main event router (493 LOC god module — MUST decompose)
- `hooks/tool-execution-handler.ts` — Tool execution observer
- `hooks/text-complete-handler.ts` — Turn journaling
- `hooks/compaction-handler.ts` — Context injection + journal append

**Target Location:**
- `src/tools/runtime/` (new directory)
  - `runtime-status-tool.ts`
  - `runtime-command-tool.ts`
- `src/hooks/` (enhance existing)
  - `event-handler.ts` — DECOMPOSE into `src/hooks/session-lifecycle-hook.ts`
  - `tool-observer-hook.ts` — Extract from existing inline logic
  - `compaction-handler.ts` — Keep but decompose if >500 LOC

**Refactoring Required:**
- **Decompose 493 LOC god module:** The detox `hooks/event-handler.ts` must be split:
  - `src/hooks/session-lifecycle-hook.ts` — session.created/idle/deleted/error
  - `src/hooks/chat/message-journal-hook.ts` — chat.message → journal recording
  - `src/hooks/tool/tool-observer-hook.ts` — tool.execute.before/after
  - `src/hooks/compaction/compaction-inject-hook.ts` — session.compacting → context injection
  - `src/hooks/compaction/compaction-journal-hook.ts` — session.compacting → journal append
- **Extract inline handlers from plugin.ts:** The harness plugin has 4 inline handlers (`permission.ask`, `tool.execute.before`, `shell.env`, `command.execute.before`). Extract these to named hook files following the factory pattern.
- **Runtime entry:** Move as-is from detox, DO NOT split yet (proven to be cross-cutting and unsafe to decompose during migration).

**Dependencies:** Phase 4 complete (handoff needed for event handler wiring).

**Tests:**
- Unit tests for each decomposed hook
- Unit tests for runtime status tool
- Unit tests for runtime command tool
- Integration test: full event lifecycle → hook fires → journal updated

**Risk:** HIGH — the 493 LOC god module is the most complex piece. Decomposition must be atomic per handler.

**Rollback:** `git tag phase-5-runtime-hooks`; revert to phase-4 tag if needed.

---

### Phase 6: Session Entry & Context Injection (Week 3-4, Days 20-23)

**Goal:** Bring session entry/intake and context rendering for message transforms.

**Source:** `v2.9.5-detox-dev`
- `features/session-entry/` — Session intake gates, profile resolution, readiness (13 files, 1,028 LOC)
- `context/prompt-packet/` — Prompt compilation (5 files)
- `plugin/context-renderer/` — Context packet rendering (moved to `context/prompt-packet/`)

**Target Location:**
- `src/lib/session/` (new directory)
  - `intake-gates.ts`
  - `profile-resolution.ts`
  - `session-state.ts`
- `src/lib/context/` (new directory)
  - `prompt-packet-types.ts`
  - `prompt-packet-renderers.ts`
  - `prompt-compiler.ts`

**Refactoring Required:**
- **Simplify session-entry:** The detox version has 13 files and complex type hierarchies. Extract only the intake gate resolution and profile resolution. Remove lineage-router (hivefiver vs hiveminder distinction is obsolete).
- **Context renderer:** Move from plugin layer to lib layer. Plugin should only assemble, not implement.
- **Remove NL-first dispatch auto-execution:** `maybeExecuteNlFirstRuntimeDispatch()` must remain a no-op (preserves route hints, no automatic execution).

**Dependencies:** Phase 5 complete (hooks needed for message transform wiring).

**Tests:**
- Unit tests for intake gate resolution
- Unit tests for profile resolution
- Unit tests for prompt packet compilation
- Integration test: message transform → context injected → prompt compiled

**Risk:** Medium — session-entry has complex types that may conflict with harness's simpler session model.

**Rollback:** `git tag phase-6-session-context`; revert to phase-5 tag if needed.

---

### Phase 7: On-Disk State & `.hivemind/` Directory (Week 4, Days 24-26)

**Goal:** Establish `.hivemind/` as the canonical cross-session intelligence directory, separate from `.opencode/state/hivemind/` (runtime state).

**Source:** Detox conventions + harness requirements.

**Target Location:**
- `.hivemind/` (new directory at repo root)
  - `sessions/journey-events/` — Session event JSON files (from event-tracker)
  - `state/trajectory-ledger.json` — Trajectory ledger
  - `state/workflow-state.json` — Workflow state
  - `handoffs/` — Delegation handoff records
  - `checkpoints/` — Recovery checkpoints

**Refactoring Required:**
- **Dual-state architecture:**
  - `.opencode/state/hivemind/` — Runtime state (continuity.json, session-continuity.json) — managed by harness, ephemeral
  - `.hivemind/` — Cross-session intelligence — durable, survives repo resets, gitignored
- **Path resolution:** Update all path constants in `shared/paths.ts` to use `.hivemind/` for intelligence data.
- **Migration of existing state:** If `.opencode/state/hivemind/` already has trajectory/workflow data, migrate it to `.hivemind/state/`.

**Dependencies:** Phase 6 complete (all features that write to disk must be in place first).

**Tests:**
- Unit tests for path resolution
- Integration test: write to `.hivemind/` → verify file exists → read back
- Integration test: state survives `rm -rf .opencode/state/`

**Risk:** Medium — changing state directories can break existing sessions.

**Rollback:** `git tag phase-7-hivemind-state`; revert to phase-6 tag if needed.

---

### Phase 8: Tool Rationalization & Plugin Slimming (Week 4-5, Days 27-30)

**Goal:** Final integration — register all new tools, slim plugin to <100 LOC, enforce boundary rules.

**Source:** Harness + migrated features.

**Target Location:** `src/plugin.ts`, `src/tools/`, `src/shared/`

**Refactoring Required:**
- **Create tool registry:** `src/plugin/tool-registry.ts` with `createToolRegistry()` — assembles all 5 tools:
  1. `hivemind_runtime_status` — inspect only
  2. `hivemind_runtime_command` — command dispatch
  3. `hivemind_delegation` — create/export/handoff (merges delegate-task + delegation-status)
  4. `hivemind_trajectory` — ledger operations
  5. `hivemind_task` — workflow task lifecycle
- **Create hook registry:** `src/plugin/hook-registry.ts` with `createHookRegistry()` — assembles all hooks.
- **Slim plugin.ts:** Reduce from ~447 LOC to <100 LOC (assembly only, zero business logic).
- **Boundary enforcement:**
  - Add `scripts/check-module-size.ts` — max 500 LOC
  - Add `scripts/check-plugin-size.ts` — max 100 LOC
  - Add `scripts/check-circular-deps.ts` — no circular dependencies
  - Add `scripts/check-tool-count.ts` — exactly 5 tools
  - Add `npm run lint:boundary` script

**Dependencies:** All prior phases complete.

**Tests:**
- Full test suite: `npm test` — all must pass
- Build verification: `npm run build`
- Type check: `npx tsc --noEmit`
- Boundary check: `npm run lint:boundary`
- Plugin load test: Verify OpenCode loads plugin and all 5 tools register
- E2E smoke test: Full delegation lifecycle

**Risk:** Low — this is assembly and verification. Risk is cumulative from prior phases.

**Rollback:** `git tag phase-8-final-integration`; revert to phase-7 tag if needed.

---

## 3. Feature-by-Feature Migration Matrix

| Feature | Detox Location | Harness Target | Rating | Refactor Needed | Priority |
|---------|---------------|----------------|--------|-----------------|----------|
| **trajectory** | `features/trajectory/`, `core/trajectory/` | `src/lib/trajectory/` | READY | Merge core into lib, remove CQRS | P0 |
| **workflow-management** | `features/workflow/`, `core/workflow-management/` | `src/lib/workflow/` | READY | Merge core into lib, remove CQRS | P0 |
| **handoff/delegation** | `features/handoff/`, `delegation/` | `src/lib/handoff/` | READY | Integrate with existing delegation-manager | P0 |
| **recovery-engine** | `recovery/` | `src/lib/recovery/` | READY | Hook into lifecycle-manager | P0 |
| **event-tracker** | `features/event-tracker/` | `src/lib/journal/` | NEEDS-REFACTOR | Delete classifier/parser/writers dead code, fix addEvent/addDiagnostic no-ops, decompose types.ts | P0 |
| **session-journal** | `features/session-journal/` | `src/lib/journal/` | NEEDS-REFACTOR | Merge with event-tracker, keep only hierarchy-writer and error-log-writer | P1 |
| **runtime-observability** | `features/runtime-observability/` | `src/tools/runtime/` | READY | Merge into runtime tools | P0 |
| **runtime-entry** | `features/runtime-entry/` | `src/lib/runtime/` | NEEDS-REFACTOR | Move as-is, DO NOT split yet, remove settings-dashboard/render/spec-builder (extract later) | P1 |
| **session-entry** | `features/session-entry/` | `src/lib/session/` | NEEDS-REFACTOR | Simplify — remove lineage-router, extract only intake-gates and profile-resolution | P1 |
| **hooks/event-handler** | `hooks/event-handler.ts` | `src/hooks/` (decomposed) | NEEDS-REFACTOR | DECOMPOSE 493 LOC god module into 5+ focused hooks | P0 |
| **agent-work-contract** | `features/agent-work-contract/` | `src/lib/contract/` (partial) | NEEDS-REFACTOR | Keep schema + store ONLY. Remove intent-classifier, chain-executor, anchor-recorder. Merge tools into `hivemind_contract`. | P2 |
| **doc-intelligence** | `features/doc-intelligence/`, `intelligence/doc/` | **DO NOT BRING** | TOO-BROKEN | Optional add-on; defer to post-v3.1 | P3 |
| **context-renderer** | `plugin/context-renderer/` | `src/lib/context/` | NEEDS-REFACTOR | Move from plugin to lib layer | P1 |
| **pressure-contract** | `shared/pressure-contract.ts` | `shared/pressure-contract.ts` | READY | Already exists in harness, extend if needed | P1 |
| **runtime-admin** | `features/runtime-admin/` (new) | `src/lib/admin/` (deferred) | TOO-BROKEN | Dashboard/TUI requires ink/json-render. Defer to add-on package. | P3 |

---

## 4. Architecture Decisions

### What to Bring Wholesale vs. What to Redesign

**Bring Wholesale (minimal changes):**
- `features/trajectory/` — Clean, self-contained, no hook dependency
- `features/workflow/` — Clean, self-contained, no hook dependency
- `features/handoff/` — Clean delegation CRUD
- `recovery/` — State repair logic is isolated
- `features/runtime-observability/` — Status snapshot builder

**Redesign During Migration:**
- `event-tracker` → `journal/`: Remove dead subdirectories (classifier/, parser/, writers/), fix no-op stubs, merge with session-journal
- `hooks/event-handler.ts` → Decomposed hooks: The 493 LOC god module MUST be split into focused handlers by event type
- `agent-work-contract` → Keep schema + store only. The engine (intent classifier, chain executor) is anti-pattern — agents decide, code executes.
- `session-entry` → Simplify from 13 files to 3-4 core files

**Leave Behind (do not bring):**
- `doc-intelligence/` — Optional add-on, requires remark dependency. Defer to post-v3.1.
- `runtime-admin/` — Dashboard/TUI requires ink/json-render. Defer to add-on package.
- `agent-work-contract/engine/intent-classifier.ts` — Regex intent classification is the conductor agent's job, not code's job.
- `agent-work-contract/engine/chain-executor.ts` — Auto-dispatch bypasses harness authority.
- All governance scripts (22 files) — Must be rewritten as fact-reporting helpers.
- All skill packs (235 SKILL.md files) — Re-author in `.opencode/skills/`, do not migrate.

### How to Maintain Harness as Single Runtime Authority

1. **Plugin assembly owns registration:** Only `src/plugin.ts` (or `src/plugin/tool-registry.ts`) registers tools with OpenCode. No feature registers itself.
2. **Feature modules are pure logic:** They export functions. They do not import from `tools/`, `hooks/`, or `plugin/`.
3. **Hooks observe, features execute:** Hooks call feature functions. Features never call hooks.
4. **State mutations via tools only:** The CQRS rule is: tools write, hooks read. If a hook needs to write, it delegates to a feature function that the tool also uses.
5. **DelegationManager is the single dispatch authority:** All background agent spawning goes through `src/lib/delegation-manager.ts`. No feature spawns sessions directly.

### How to Handle the `.hivemind/` On-Disk State

**Dual-State Architecture:**

| Directory | Purpose | Lifecycle | Managed By | Gitignored |
|-----------|---------|-----------|------------|------------|
| `.opencode/state/hivemind/` | Runtime state (continuity, session-continuity) | Ephemeral — safe to delete | `src/lib/continuity.ts` | Yes |
| `.hivemind/sessions/journey-events/` | Per-session event JSON files | Durable — survives resets | `src/lib/journal/` | Yes |
| `.hivemind/state/trajectory-ledger.json` | Active session bindings, workflow associations | Durable | `src/lib/trajectory/` | Yes |
| `.hivemind/state/workflow-state.json` | Task states, workflow progress | Durable | `src/lib/workflow/` | Yes |
| `.hivemind/handoffs/` | Delegation handoff records | Durable | `src/lib/handoff/` | Yes |
| `.hivemind/checkpoints/` | Recovery checkpoints | Durable | `src/lib/recovery/` | Yes |

**Migration of Existing State:**
- On first load of v3 plugin, detect if old state exists in `.opencode/state/hivemind/`
- If trajectory/workflow data found, migrate to `.hivemind/state/`
- Log migration event to journal
- Keep `.opencode/state/` for continuity store only

---

## 5. Immediate Actions (Next 2 Weeks)

### Week 1: Foundation + Event Tracker

**Day 1 (Monday):**
- [ ] Create migration branch: `git checkout -b migrate/detox-to-harness-2026-04-24`
- [ ] Tag baseline: `git tag migration-baseline`
- [ ] Phase 1: Fix constants (MAX_DESCENDANTS, doom_loop, builder temp, concurrency)
- [ ] Run tests: `npm test` — verify all 514 pass
- [ ] Commit: `phase-1: fix harness constants — align with v3 spec`
- [ ] Tag: `phase-1-foundation-hardening`

**Day 2 (Tuesday):**
- [ ] Phase 1 (continued): Rewrite `buildPromptText` to 6-section format
- [ ] Add temperature/context params to delegate-task
- [ ] Write unit tests for prompt format
- [ ] Commit: `phase-1: 6-section delegation prompt + tool params`

**Day 3 (Wednesday):**
- [ ] Audit detox event-tracker: read `features/event-tracker/` on detox branch
- [ ] Identify dead code (classifier/, parser/, writers/)
- [ ] Map imports: `grep -rn "from" features/event-tracker/`
- [ ] Phase 2: Create `src/lib/journal/` directory
- [ ] Port `consolidated-writer.ts` (adapted)
- [ ] Commit: `phase-2: port consolidated-writer`

**Day 4 (Thursday):**
- [ ] Phase 2 (continued): Port `markdown-writer.ts` and `session-structure.ts`
- [ ] Fix addEvent/addDiagnostic — implement properly or remove
- [ ] Write unit tests for journal writers
- [ ] Commit: `phase-2: port markdown-writer + session-structure`

**Day 5 (Friday):**
- [ ] Phase 2 (continued): Port types and paths
- [ ] Trim types.ts if >250 LOC
- [ ] Integration test: write → read roundtrip
- [ ] Commit: `phase-2: journal types + paths + tests`
- [ ] Tag: `phase-2-event-tracker`
- [ ] **Weekend checkpoint:** Run full test suite, verify no regressions

### Week 2: Trajectory + Workflow + Delegation

**Day 6 (Monday):**
- [ ] Phase 3: Create `src/lib/trajectory/` and `src/lib/workflow/`
- [ ] Port trajectory manager and store
- [ ] Commit: `phase-3: port trajectory manager + store`

**Day 7 (Tuesday):**
- [ ] Phase 3 (continued): Port workflow manager and task lifecycle
- [ ] Write unit tests for trajectory CRUD
- [ ] Commit: `phase-3: port workflow + task lifecycle`

**Day 8 (Wednesday):**
- [ ] Phase 3 (continued): Write unit tests for workflow
- [ ] Integration test: full workflow lifecycle
- [ ] Commit: `phase-3: trajectory + workflow tests`
- [ ] Tag: `phase-3-trajectory-workflow`

**Day 9 (Thursday):**
- [ ] Phase 4: Port handoff manager
- [ ] Integrate with existing `delegation-manager.ts`
- [ ] Commit: `phase-4: port handoff + integrate delegation`

**Day 10 (Friday):**
- [ ] Phase 4 (continued): Port recovery engine
- [ ] Hook into lifecycle-manager for error events
- [ ] Write tests for recovery
- [ ] Commit: `phase-4: recovery engine + tests`
- [ ] Tag: `phase-4-delegation-recovery`

### Quick Wins (Can be done in parallel by subagents)

1. **Fix constants:** 30 minutes, zero risk — just changes values
2. **Add test for buildPromptText:** 1 hour — validates 6-section format
3. **Delete dead code on detox branch:** 2 hours — remove classifier/, parser/, writers/ (no harness impact, just cleanup)
4. **Create `.hivemind/` directory structure:** 30 minutes — mkdir + path constants
5. **Write boundary check scripts:** 2 hours — module size, plugin size, circular deps, tool count

### Foundation Work (Must be done before feature migration)

1. **Import audit:** Map every import from detox features being ported. Identify hidden coupling.
2. **Type compatibility check:** Compare harness types with detox types. Identify mismatches.
3. **Test infrastructure:** Ensure harness test patterns work for new modules (vitest, globals, mocking).
4. **State directory decision:** Confirm `.hivemind/` vs `.opencode/state/` split with team.

---

## 6. GSD Phase Recommendations

### Phase Numbering

Since harness branch uses GSD conventions, we recommend decimal phases to insert between existing roadmap phases:

| GSD Phase | Name | Maps To | Duration |
|-----------|------|---------|----------|
| 10.1 | Foundation Hardening | Phase 1 | 3 days |
| 10.2 | Event Tracker Core | Phase 2 | 4 days |
| 10.3 | Trajectory & Workflow | Phase 3 | 4 days |
| 10.4 | Delegation & Recovery | Phase 4 | 4 days |
| 10.5 | Runtime Tools & Hooks | Phase 5 | 4 days |
| 10.6 | Session & Context | Phase 6 | 4 days |
| 10.7 | On-Disk State | Phase 7 | 3 days |
| 10.8 | Integration & Slimming | Phase 8 | 4 days |

### Phase Dependencies

```
10.1 (Foundation)
    ↓
10.2 (Event Tracker)
    ↓
10.3 (Trajectory + Workflow)
    ↓
10.4 (Delegation + Recovery)
    ↓
10.5 (Runtime + Hooks)
    ↓
10.6 (Session + Context)
    ↓
10.7 (On-Disk State)
    ↓
10.8 (Integration)
```

**Parallel tracks possible:**
- 10.3 and 10.4 can overlap slightly (trajectory tests running while handoff porting starts)
- 10.6 can start before 10.5 completes if event handler decomposition is done first

### GSD-Specific Deliverables per Phase

Each phase should produce:
- `PLAN.md` — Task breakdown with acceptance criteria
- `STATE.md` — Current state snapshot
- `tests/` — New tests for migrated features
- Git checkpoint tag
- Metrics file: `find src -name "*.ts" | xargs wc -l > metrics-phase-N.txt`

### GSD Verification Gates

After each phase:
1. **Build gate:** `npm run build` passes
2. **Type gate:** `npx tsc --noEmit` passes
3. **Test gate:** `npm test` passes (existing + new tests)
4. **Boundary gate:** `npm run lint:boundary` passes (if scripts exist)
5. **LOC gate:** `find src -name "*.ts" | xargs wc -l` — track growth

---

## 7. Risk Mitigation

### How to Avoid the Back-and-Forth Regressions That Plagued Delegation Background Designs

**What went wrong before:**
- The detox branch's delegation background designs went through 5+ iterations because:
  1. Features were designed in isolation without integrating with the lifecycle manager
  2. No-op stubs (`addEvent`, `addDiagnostic`) silently swallowed data, making debugging impossible
  3. The 493 LOC event handler god module mixed 7 different concerns, so fixing one broke another
  4. Tests were added AFTER features, not during — regressions were discovered late
  5. No checkpoint tags — failed experiments were hard to revert

**How we avoid it this time:**

1. **Integration-first design:** Every feature is integrated with the lifecycle manager BEFORE the phase is declared complete. No "we'll wire it later."
2. **No no-op stubs:** Every function either does something real or is deleted. Silent data loss is banned.
3. **God module decomposition:** The 493 LOC event handler is split BEFORE any new features are added. Each decomposed hook is tested independently.
4. **Test-first for migrated features:** For every detox feature being ported:
   - Write harness-style tests FIRST (using vitest, globals, mocking)
   - Port the feature SECOND
   - Verify tests pass THIRD
   - Only then declare phase complete
5. **Atomic commits with checkpoint tags:** Every commit is independently revertible. Every phase ends with a git tag.
6. **Constant verification:** Run `npm test` at least twice per day. Never accumulate changes across phases without testing.
7. **Single runtime authority:** No feature spawns sessions directly. All delegation goes through `DelegationManager`. No exceptions.

### Testing Strategy

**Layered Testing:**

| Layer | What | When | How |
|-------|------|------|-----|
| Unit | Individual functions | Every commit | Vitest, mock file I/O |
| Integration | Feature workflows | End of each phase | Real file I/O in temp dir |
| Plugin | Full plugin load | Phase 1, 5, 8 | Load in OpenCode, verify tools register |
| E2E | Full delegation lifecycle | Phase 8 only | Spawn real sessions, verify completion |

**Test Requirements for Migrated Features:**
- Every ported function must have at least one unit test
- Every tool must have an integration test
- Every hook must have a unit test with mocked events
- Coverage must not drop below 60% at any phase

### Validation Gates

**Per-Phase Gates (MUST pass before proceeding):**

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| Build | `npm run build` | Clean exit, dist/ produced |
| Type Check | `npx tsc --noEmit` | Zero errors |
| Tests | `npm test` | All pass, coverage ≥60% |
| Module Size | `scripts/check-module-size.ts` | No file >500 LOC |
| Plugin Size | `scripts/check-plugin-size.ts` | Plugin ≤100 LOC |
| Circular Deps | `scripts/check-circular-deps.ts` | Zero cycles |
| Upward Imports | `grep -rn "from.*tools/" src/features/` | Zero results |
| Tool Count | `scripts/check-tool-count.ts` | Exactly 5 tools |

**Final Gate (Phase 8 only):**
- E2E smoke test: `npm run test:e2e` — full delegation lifecycle
- Plugin loads in OpenCode without errors
- All 5 tools callable
- All hooks respond to events
- `.hivemind/` state persists across sessions

### Rollback Procedures

**Per-Phase Rollback:**

```bash
# If current phase fails:
git reset --hard phase-N-checkpoint
git clean -fd
npm install
npm test  # Verify clean state
```

**Emergency Rollback (full migration):**
```bash
git reset --hard migration-baseline
git clean -fd
npm install
npm test  # Verify 514 tests pass
```

**Rollback Triggers:**
- TypeScript errors cannot be resolved within 2 hours
- Test coverage drops below 60%
- Critical functionality breaks (delegation fails, hooks don't fire)
- Circular dependencies cannot be resolved
- Module size violations cannot be fixed
- Plugin fails to load in OpenCode

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Event handler decomposition breaks existing hooks | High | High | Decompose ONE handler at a time; test after each; keep original file until all extracted |
| Detox types conflict with harness types | Medium | High | Type compatibility audit before porting; create adapter layer if needed |
| addEvent/addDiagnostic implementation reveals hidden coupling | Medium | High | Prototype in isolation first; integrate only after tests pass |
| Session-entry complexity overflows module size limit | Medium | Medium | Simplify aggressively — remove lineage-router, extract only core gates |
| `.hivemind/` state migration loses existing data | Low | High | Backup `.opencode/state/` before migration; write migration script |
| Test failures mask migration issues | Medium | High | Phase 0.5: fix all harness tests BEFORE porting; never skip tests |
| runtime-entry cross-cutting imports break build | Medium | High | Move as-is, do NOT split during migration; defer split to v3.1 |
| Plugin slimming to <100 LOC breaks assembly | Low | Medium | Extract incrementally; verify plugin loads after each extraction |
| Concurrency model mismatch (detox vs harness) | Low | High | Harness's keyed semaphore is the authority; adapt detox code to use it |
| Skill/agent references to old tool names | Medium | Low | Phase 8 updates all references; grep for old names |

---

## Appendix A: Pre-Migration Checklist

- [ ] Create migration branch
- [ ] Tag baseline: `git tag migration-baseline`
- [ ] Run full test suite: `npm test` — confirm 514 pass
- [ ] Run type check: `npx tsc --noEmit` — confirm clean
- [ ] Document current metrics: `find src -name "*.ts" | xargs wc -l > metrics-baseline.txt`
- [ ] Verify detox branch builds: `git checkout v2.9.5-detox-dev && npm run build`
- [ ] Read detox feature files being ported (use grep to identify exact files)
- [ ] Confirm `.hivemind/` directory decision with team
- [ ] Set up boundary check scripts (or plan to write in Phase 8)

## Appendix B: Daily Standup Template

```markdown
### Day N: [Phase Name]

**Yesterday:**
- [Completed task]

**Today:**
- [Planned task]

**Blockers:**
- [Any blockers]

**Metrics:**
- LOC: [Current] / [Target]
- Tests: [Pass/Total] ([Coverage]%)
- Type errors: [Count]

**Risk:** [Green/Yellow/Red] — [Why]
```

## Appendix C: Communication Template

```markdown
### Phase N Progress Report

**Date:** YYYY-MM-DD
**Phase:** N — [Phase Name]
**Status:** [On Track / At Risk / Blocked]

**Completed:**
- [Task 1]
- [Task 2]

**In Progress:**
- [Task 3]

**Metrics:**
- LOC: [Current] / [Target]
- Modules: [Current] / [Target]
- Tests: [Pass/Total] ([Coverage]%)

**Next Steps:**
- [Next task 1]
- [Next task 2]

**Risks:**
- [Risk 1] — [Mitigation]
```

---

**Status:** ✅ Migration Plan Complete  
**Owner:** Migration Team  
**Next Action:** Begin Appendix A pre-migration checklist, then execute Phase 1

---

*End of Document*
