# Structure Restructuring Plan

**Generated:** 2026-05-08
**Scope:** Full `src/` directory restructuring
**Maintainability Index:** 5.2/10 (Moderate — actionable gaps)
**Type:** Structural Refactor (multi-module, cross-cutting)

---

## 1. Current State Analysis

### 1.1 Module Inventory

| Directory | File Count | LOC (est.) | Role |
|-----------|-----------|------------|------|
| `src/lib/` | 56 entries (30 standalone + 15 subdirs) | ~6,500 | Business logic dump |
| `src/hooks/` | 10 files | ~1,100 | Hook factories |
| `src/tools/` | 19 entries (13 standalone + 3 subdirs) | ~2,800 | Tool implementations |
| `src/shared/` | 3 files | ~110 | Leaf utilities |
| `src/schema-kernel/` | 19 files | ~2,200 | Zod schemas (well-organized) |
| `src/plugin.ts` | 1 file | ~187 | Composition root |
| `src/index.ts` | 1 file | ~27 | Public API re-exports |
| `src/cli/` | 5 entries | ~400 | CLI substrate |
| `src/sidecar/` | 1 file | ~120 | Read-only state guards |
| `src/harness/` | .gitkeep only | 0 | Reserved |
| `src/kernel/` | .gitkeep only | 0 | Reserved |

### 1.2 Dependency Graph (Current)

```
types.ts (leaf — no imports from harness)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts → state.ts, types.ts
├── continuity.ts → types.ts, security/*, config-subscriber.ts
├── delegation-persistence.ts → types.ts, continuity.ts, config-subscriber.ts, security/*
├── delegation-types.ts → (leaf)
├── session-api.ts → helpers.ts, behavioral-profile/*
├── runtime.ts → helpers.ts, types.ts
├── completion-detector.ts → (leaf)
├── notification-handler.ts → session-api.ts, types.ts, continuity.ts
├── lifecycle-manager.ts → completion-detector.ts, continuity.ts, notification-handler.ts,
│                          delegation-manager.ts, session-api.ts, state.ts, types.ts
├── delegation-manager.ts → command-delegation.ts, concurrency.ts, completion-detector.ts,
│                           delegation-persistence.ts, delegation-state-machine.ts, pty/*,
│                           sdk-delegation.ts, category-gates.ts, category-gate-audit.ts,
│                           app-api.ts, session-api.ts, runtime-policy.ts, config-subscriber.ts,
│                           spawner/*, types.ts, behavioral-profile/*
├── delegation-state-machine.ts → delegation-persistence.ts, notification-handler.ts,
│                                 session-api.ts, types.ts
├── sdk-delegation.ts → completion-detector.ts, helpers.ts, session-api.ts, types.ts
├── command-delegation.ts → helpers.ts, pty/*, types.ts
├── auto-loop.ts → (leaf — pure async)
├── ralph-loop.ts → (leaf — pure async)
├── config-subscriber.ts → schema-kernel/*
├── config-compiler.ts → schema-kernel/*
├── app-api.ts → session-api.ts, helpers.ts
├── category-gates.ts → types.ts, behavioral-profile/*
├── category-gate-audit.ts → continuity.ts
├── execution-lineage.ts → types.ts, session-journal.ts
├── session-journal.ts → security/*
├── journal-query.ts → session-journal.ts
├── journal-replay.ts → session-journal.ts
├── framework-detector.ts → (leaf)
├── primitive-loader.ts → schema-kernel/*
├── primitive-registry.ts → primitive-scanners.ts
├── primitive-scanners.ts → primitive-registry.ts (circular!)
├── cross-primitive-validator.ts → schema-kernel/*, runtime-validator.ts
├── runtime-validator.ts → cross-primitive-validator.ts (circular!)
├── runtime-policy.ts → types.ts, category-gates.ts
├── workspace-runtime-policy.ts → types.ts
├── plugin-tool-output-summary.ts → security/*
├── bootstrap-structure.ts → (leaf)
├── security/path-scope.ts → (leaf)
├── security/redaction.ts → (leaf)
├── pty/* → (leaf cluster)
├── spawner/* → types.ts, session-api.ts, helpers.ts, behavioral-profile/*
├── behavioral-profile/* → (leaf cluster)
├── session-entry/* → (leaf cluster)
├── event-tracker/* → security/*
├── doc-intelligence/* → (leaf cluster)
├── trajectory/* → (leaf cluster)
├── runtime-pressure/* → (leaf cluster)
├── agent-work-contracts/* → (leaf cluster)
├── sdk-supervisor/* → (leaf cluster)
├── command-engine/* → (leaf cluster)
├── control-plane/* → primitive-registry.ts
├── config-workflow/* → types.ts
├── recovery/* → continuity.ts, types.ts
├── prompt-packet/* → (leaf cluster)
└── runtime-detection/* → (leaf cluster)
```

### 1.3 Maintainability Scores

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Complexity** | 4/10 | `src/lib/` has 56 entries; `delegation-manager.ts` at 500 LOC; mixed concerns |
| **Coupling** | 3/10 | `types.ts` imported by ~30 modules; `continuity.ts` imported by ~10 modules |
| **Test Coverage** | 6/10 | Tests exist in `tests/lib/` and `tests/tools/` but coverage gaps in subdirs |
| **Documentation** | 7/10 | AGENTS.md files, JSDoc, inline comments |
| **Dependency Freshness** | 8/10 | Modern deps, strict TypeScript |
| **Architectural Debt** | 4/10 | Circular deps (primitive-scanners ↔ primitive-registry, runtime-validator ↔ cross-primitive-validator); mixed concerns in lib/ |

**Maintainability Index:** (4×0.25) + (3×0.20) + (6×0.20) + (7×0.10) + (8×0.10) + (4×0.15) = **4.9/10** (At Risk)

---

## 2. Target Structure Mapping

### 2.1 `src/lib/` → Target Locations

| Current File | Target Location | Rationale |
|-------------|----------------|-----------|
| `types.ts` | `src/shared/types.ts` | Leaf types — cross-cutting, imported everywhere |
| `helpers.ts` | `src/shared/helpers.ts` | Pure utilities — leaf, no side effects |
| `state.ts` | `src/shared/state.ts` | In-memory state manager — cross-cutting |
| `task-status.ts` | `src/shared/task-status.ts` | Status type system — leaf |
| `concurrency.ts` | `src/coordination/concurrency/index.ts` | Queue management — coordination concern |
| `continuity.ts` | `src/task-management/continuity/index.ts` | Session persistence — task management |
| `delegation-persistence.ts` | `src/task-management/continuity/delegation-persistence.ts` | Delegation record I/O — persistence |
| `delegation-types.ts` | `src/coordination/delegation/types.ts` | Delegation type definitions |
| `delegation-manager.ts` | `src/coordination/delegation/manager.ts` | Core delegation orchestrator |
| `delegation-state-machine.ts` | `src/coordination/delegation/state-machine.ts` | Delegation state transitions |
| `sdk-delegation.ts` | `src/coordination/sdk-delegation/index.ts` | SDK delegation handler |
| `command-delegation.ts` | `src/coordination/command-delegation/index.ts` | Command delegation (PTY/headless) |
| `completion-detector.ts` | `src/coordination/completion/detector.ts` | Two-signal completion |
| `notification-handler.ts` | `src/coordination/completion/notification-handler.ts` | Async completion notification |
| `lifecycle-manager.ts` | `src/task-management/lifecycle/index.ts` | Session lifecycle state machine |
| `session-api.ts` | `src/shared/session-api.ts` | Typed SDK wrappers — cross-cutting |
| `runtime.ts` | `src/shared/runtime.ts` | Event→status mapping — cross-cutting |
| `runtime-policy.ts` | `src/shared/runtime-policy.ts` | Runtime policy resolution — cross-cutting |
| `workspace-runtime-policy.ts` | `src/shared/workspace-runtime-policy.ts` | Workspace policy reader |
| `auto-loop.ts` | `src/coordination/spawner/auto-loop.ts` | Auto-loop orchestration |
| `ralph-loop.ts` | `src/coordination/spawner/ralph-loop.ts` | Ralph-loop orchestration |
| `config-subscriber.ts` | `src/config/subscriber.ts` | Config caching — config realm |
| `config-compiler.ts` | `src/config/compiler.ts` | Config compilation — config realm |
| `app-api.ts` | `src/shared/app-api.ts` | SDK app API wrapper — cross-cutting |
| `category-gates.ts` | `src/coordination/delegation/category-gates.ts` | Category gate logic |
| `category-gate-audit.ts` | `src/coordination/delegation/category-gate-audit.ts` | Category gate audit |
| `execution-lineage.ts` | `src/task-management/journal/execution-lineage.ts` | Execution lineage tracking |
| `session-journal.ts` | `src/task-management/journal/index.ts` | Session journal writer |
| `journal-query.ts` | `src/task-management/journal/query.ts` | Journal query API |
| `journal-replay.ts` | `src/task-management/journal/replay.ts` | Journal time-machine replay |
| `framework-detector.ts` | `src/features/bootstrap/framework-detector.ts` | Framework detection |
| `primitive-loader.ts` | `src/features/bootstrap/primitive-loader.ts` | Primitive loading |
| `primitive-registry.ts` | `src/features/bootstrap/primitive-registry.ts` | Primitive catalog |
| `primitive-scanners.ts` | `src/features/bootstrap/primitive-scanners.ts` | Primitive scanning |
| `cross-primitive-validator.ts` | `src/features/bootstrap/cross-primitive-validator.ts` | Cross-primitive validation |
| `runtime-validator.ts` | `src/features/bootstrap/runtime-validator.ts` | Runtime validation |
| `plugin-tool-output-summary.ts` | `src/shared/plugin-tool-output-summary.ts` | Tool output summary — leaf |
| `bootstrap-structure.ts` | `src/features/bootstrap/structure.ts` | Bootstrap constants — leaf |
| `security/path-scope.ts` | `src/shared/security/path-scope.ts` | Path scope validation — leaf |
| `security/redaction.ts` | `src/shared/security/redaction.ts` | Redaction utilities — leaf |
| `pty/*` | `src/features/background-command/pty/*` | PTY management — feature |
| `spawner/*` | `src/coordination/spawner/*` | Session spawning — coordination |
| `behavioral-profile/*` | `src/shared/behavioral-profile/*` | Profile resolution — cross-cutting |
| `session-entry/*` | `src/routing/session-entry/*` | Session entry — routing |
| `event-tracker/*` | `src/task-management/journal/event-tracker/*` | Event tracking — journal |
| `doc-intelligence/*` | `src/features/doc-intelligence/*` | Doc parsing — feature |
| `trajectory/*` | `src/task-management/trajectory/*` | Trajectory ledger — task management |
| `runtime-pressure/*` | `src/features/runtime-pressure/*` | Pressure model — feature |
| `agent-work-contracts/*` | `src/features/agent-work-contracts/*` | Work contracts — feature |
| `sdk-supervisor/*` | `src/features/sdk-supervisor/*` | SDK supervision — feature |
| `command-engine/*` | `src/features/command-engine/*` | Command engine — feature |
| `control-plane/*` | `src/features/bootstrap/control-plane/*` | Control plane — bootstrap |
| `config-workflow/*` | `src/config/workflow/*` | Config workflow — config realm |
| `recovery/*` | `src/task-management/recovery/*` | Recovery — task management |
| `prompt-packet/*` | `src/shared/prompt-packet/*` | Prompt packets — cross-cutting |
| `runtime-detection/*` | `src/features/bootstrap/runtime-detection/*` | Runtime detection — bootstrap |

### 2.2 `src/hooks/` → Target Locations

| Current File | Target Location | Rationale |
|-------------|----------------|-----------|
| `create-core-hooks.ts` | `src/hooks/lifecycle/core-hooks.ts` | Session lifecycle hooks |
| `create-session-hooks.ts` | `src/hooks/lifecycle/session-hooks.ts` | Session lifecycle hooks |
| `create-tool-guard-hooks.ts` | `src/hooks/guards/tool-guard-hooks.ts` | Tool guard hooks |
| `governance-block.ts` | `src/hooks/transforms/governance-block.ts` | System prompt transform |
| `hook-cqrs-boundary.ts` | `src/hooks/composition/cqrs-boundary.ts` | CQRS boundary classification |
| `plugin-event-observers.ts` | `src/hooks/observers/event-observers.ts` | Event observers |
| `toggle-gates.ts` | `src/hooks/transforms/toggle-gates.ts` | Toggle gate helpers |
| `tool-after-composer.ts` | `src/hooks/transforms/tool-after-composer.ts` | Tool after transform |
| `types.ts` | `src/hooks/types.ts` | Hook dependency types |

### 2.3 `src/tools/` → Target Locations

| Current File | Target Location | Rationale |
|-------------|----------------|-----------|
| `delegate-task.ts` | `src/tools/delegation/delegate-task.ts` | Delegation tool |
| `delegation-status.ts` | `src/tools/delegation/delegation-status.ts` | Delegation status tool |
| `session-patch/` | `src/tools/session/session-patch/` | Session patching |
| `session-journal-export.ts` | `src/tools/session/session-journal-export.ts` | Journal export |
| `configure-primitive.ts` | `src/tools/config/configure-primitive.ts` | Primitive config |
| `configure-primitive-paths.ts` | `src/tools/config/configure-primitive-paths.ts` | Primitive paths |
| `validate-restart.ts` | `src/tools/config/validate-restart.ts` | Restart validation |
| `hivemind-doc.ts` | `src/tools/hivemind/hivemind-doc.ts` | Doc intelligence |
| `hivemind-trajectory.ts` | `src/tools/hivemind/hivemind-trajectory.ts` | Trajectory management |
| `hivemind-pressure.ts` | `src/tools/hivemind/hivemind-pressure.ts` | Pressure model |
| `hivemind-agent-work.ts` | `src/tools/hivemind/hivemind-agent-work.ts` | Agent work contracts |
| `hivemind-sdk-supervisor.ts` | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | SDK supervision |
| `hivemind-command-engine.ts` | `src/tools/hivemind/hivemind-command-engine.ts` | Command engine |
| `prompt-skim/` | `src/tools/prompt/prompt-skim/` | Prompt skimming |
| `prompt-analyze/` | `src/tools/prompt/prompt-analyze/` | Prompt analysis |
| `run-background-command.ts` | `src/tools/hivemind/run-background-command.ts` | Background command |
| `bootstrap-init.ts` | `src/tools/config/bootstrap-init.ts` | Bootstrap init |
| `bootstrap-recover.ts` | `src/tools/config/bootstrap-recover.ts` | Bootstrap recover |

### 2.4 Directories Unchanged

| Directory | Reason |
|-----------|--------|
| `src/schema-kernel/` | Already well-organized — no changes needed |
| `src/shared/` | Expand with leaf modules from lib/ |
| `src/cli/` | Already organized — no changes needed |
| `src/sidecar/` | Already organized — no changes needed |
| `src/harness/` | Reserved — .gitkeep only |
| `src/kernel/` | Reserved — .gitkeep only |

---

## 3. Files That Don't Fit

### 3.1 Anomalies Detected

| Issue | File(s) | Resolution |
|-------|---------|------------|
| **Circular dependency** | `primitive-scanners.ts` ↔ `primitive-registry.ts` | Break by extracting shared types to `types.ts` |
| **Circular dependency** | `runtime-validator.ts` ↔ `cross-primitive-validator.ts` | Break by extracting shared types to `types.ts` |
| **Mixed concerns** | `delegation-manager.ts` (500 LOC) | Already at cap — no further growth allowed |
| **Orphan directory** | `src/harness/`, `src/kernel/` | Keep as reserved (.gitkeep) |
| **Missing routing layer** | No `src/routing/` exists | Create from `session-entry/*` |

### 3.2 Files Requiring Special Handling

| File | Issue | Approach |
|------|-------|----------|
| `types.ts` | Re-exports from `delegation-types.ts` and `config-workflow/` | Split re-exports into domain-specific barrels |
| `continuity.ts` | 465 LOC, mixed concerns (I/O + normalization + clone + CRUD) | Split into `store-io.ts`, `normalizers.ts`, `clone-helpers.ts`, `api.ts` |
| `delegation-manager.ts` | 500 LOC, imports from 15+ modules | Already extracted state-machine; monitor for further splits |

---

## 4. Phased Migration Plan

### Phase 0: Preparation (Pre-migration)

**Goal:** Establish safety net before any moves.

| Step | Action | Verification |
|------|--------|-------------|
| 0.1 | Run full test suite: `npm test` | All tests pass |
| 0.2 | Run typecheck: `npm run typecheck` | No errors |
| 0.3 | Create branch: `git checkout -b refactor/structure-restructuring` | Branch exists |
| 0.4 | Document current import graph (automated) | Graph file created |
| 0.5 | Verify all `.gitkeep` files exist in target dirs | Dirs registered |

**Rollback:** `git checkout main && git branch -D refactor/structure-restructuring`

---

### Phase 1: Leaf Modules → `src/shared/` (Lowest Risk)

**Goal:** Move leaf modules with zero downstream consumers outside `src/lib/`.

**Files to move:**
1. `src/lib/types.ts` → `src/shared/types.ts`
2. `src/lib/helpers.ts` → `src/shared/helpers.ts`
3. `src/lib/state.ts` → `src/shared/state.ts`
4. `src/lib/task-status.ts` → `src/shared/task-status.ts`
5. `src/lib/runtime.ts` → `src/shared/runtime.ts`
6. `src/lib/runtime-policy.ts` → `src/shared/runtime-policy.ts`
7. `src/lib/workspace-runtime-policy.ts` → `src/shared/workspace-runtime-policy.ts`
8. `src/lib/app-api.ts` → `src/shared/app-api.ts`
9. `src/lib/plugin-tool-output-summary.ts` → `src/shared/plugin-tool-output-summary.ts`
10. `src/lib/security/path-scope.ts` → `src/shared/security/path-scope.ts`
11. `src/lib/security/redaction.ts` → `src/shared/security/redaction.ts`
12. `src/lib/session-api.ts` → `src/shared/session-api.ts`
13. `src/lib/behavioral-profile/*` → `src/shared/behavioral-profile/*`
14. `src/lib/prompt-packet/*` → `src/shared/prompt-packet/*`

**Procedure per file:**
1. Create target directory with `.gitkeep` if needed
2. `git mv` the file
3. Update all imports in the moved file (relative paths)
4. Update all consumers (grep for old import path)
5. Run `npm run typecheck`
6. Run `npm test`
7. Commit: `refactor: move {file} to src/shared/`

**Import path changes:**
- `../lib/types.js` → `../shared/types.js` (in hooks, tools)
- `./types.js` → `./types.js` (within shared/ — no change)
- `../../lib/types.js` → `../../shared/types.js` (in nested tools/hooks)

**Rollback:** `git revert HEAD` per commit

---

### Phase 2: Task Management → `src/task-management/` (Medium Risk)

**Goal:** Move persistence, journal, lifecycle, recovery, trajectory.

**Files to move:**
1. `src/lib/continuity.ts` → `src/task-management/continuity/index.ts`
2. `src/lib/delegation-persistence.ts` → `src/task-management/continuity/delegation-persistence.ts`
3. `src/lib/session-journal.ts` → `src/task-management/journal/index.ts`
4. `src/lib/journal-query.ts` → `src/task-management/journal/query.ts`
5. `src/lib/journal-replay.ts` → `src/task-management/journal/replay.ts`
6. `src/lib/execution-lineage.ts` → `src/task-management/journal/execution-lineage.ts`
7. `src/lib/event-tracker/*` → `src/task-management/journal/event-tracker/*`
8. `src/lib/lifecycle-manager.ts` → `src/task-management/lifecycle/index.ts`
9. `src/lib/recovery/*` → `src/task-management/recovery/*`
10. `src/lib/trajectory/*` → `src/task-management/trajectory/*`

**Special handling for `continuity.ts`:**
- Split into 4 files before moving:
  - `continuity/store-io.ts` — disk I/O, atomic writes, quarantine
  - `continuity/normalizers.ts` — `normalizeContinuityRecord()`
  - `continuity/clone-helpers.ts` — all `clone*()` functions
  - `continuity/index.ts` — public API (re-exports)

**Import path changes:**
- `../lib/continuity.js` → `../task-management/continuity/index.js`
- `../lib/session-journal.js` → `../task-management/journal/index.js`
- `../lib/lifecycle-manager.js` → `../task-management/lifecycle/index.js`

**Rollback:** `git revert HEAD` per commit

---

### Phase 3: Coordination → `src/coordination/` (Medium-High Risk)

**Goal:** Move delegation, concurrency, completion, spawner.

**Files to move:**
1. `src/lib/delegation-types.ts` → `src/coordination/delegation/types.ts`
2. `src/lib/delegation-state-machine.ts` → `src/coordination/delegation/state-machine.ts`
3. `src/lib/delegation-manager.ts` → `src/coordination/delegation/manager.ts`
4. `src/lib/category-gates.ts` → `src/coordination/delegation/category-gates.ts`
5. `src/lib/category-gate-audit.ts` → `src/coordination/delegation/category-gate-audit.ts`
6. `src/lib/concurrency.ts` → `src/coordination/concurrency/index.ts`
7. `src/lib/completion-detector.ts` → `src/coordination/completion/detector.ts`
8. `src/lib/notification-handler.ts` → `src/coordination/completion/notification-handler.ts`
9. `src/lib/sdk-delegation.ts` → `src/coordination/sdk-delegation/index.ts`
10. `src/lib/command-delegation.ts` → `src/coordination/command-delegation/index.ts`
11. `src/lib/spawner/*` → `src/coordination/spawner/*`
12. `src/lib/auto-loop.ts` → `src/coordination/spawner/auto-loop.ts`
13. `src/lib/ralph-loop.ts` → `src/coordination/spawner/ralph-loop.ts`

**Import path changes:**
- `../lib/delegation-manager.js` → `../coordination/delegation/manager.js`
- `../lib/concurrency.js` → `../coordination/concurrency/index.js`
- `../lib/completion-detector.js` → `../coordination/completion/detector.js`

**Rollback:** `git revert HEAD` per commit

---

### Phase 4: Features → `src/features/` (Medium Risk)

**Goal:** Move standalone feature modules.

**Files to move:**
1. `src/lib/pty/*` → `src/features/background-command/pty/*`
2. `src/lib/doc-intelligence/*` → `src/features/doc-intelligence/*`
3. `src/lib/runtime-pressure/*` → `src/features/runtime-pressure/*`
4. `src/lib/agent-work-contracts/*` → `src/features/agent-work-contracts/*`
5. `src/lib/sdk-supervisor/*` → `src/features/sdk-supervisor/*`
6. `src/lib/command-engine/*` → `src/features/command-engine/*`
7. `src/lib/bootstrap-structure.ts` → `src/features/bootstrap/structure.ts`
8. `src/lib/framework-detector.ts` → `src/features/bootstrap/framework-detector.ts`
9. `src/lib/primitive-loader.ts` → `src/features/bootstrap/primitive-loader.ts`
10. `src/lib/primitive-registry.ts` → `src/features/bootstrap/primitive-registry.ts`
11. `src/lib/primitive-scanners.ts` → `src/features/bootstrap/primitive-scanners.ts`
12. `src/lib/cross-primitive-validator.ts` → `src/features/bootstrap/cross-primitive-validator.ts`
13. `src/lib/runtime-validator.ts` → `src/features/bootstrap/runtime-validator.ts`
14. `src/lib/control-plane/*` → `src/features/bootstrap/control-plane/*`
15. `src/lib/runtime-detection/*` → `src/features/bootstrap/runtime-detection/*`

**Circular dependency fix (before move):**
- Extract shared types from `primitive-scanners.ts` and `primitive-registry.ts` into `src/features/bootstrap/types.ts`
- Extract shared types from `cross-primitive-validator.ts` and `runtime-validator.ts` into `src/features/bootstrap/validation-types.ts`

**Rollback:** `git revert HEAD` per commit

---

### Phase 5: Config → `src/config/` (Low Risk)

**Goal:** Move config realm modules.

**Files to move:**
1. `src/lib/config-subscriber.ts` → `src/config/subscriber.ts`
2. `src/lib/config-compiler.ts` → `src/config/compiler.ts`
3. `src/lib/config-workflow/*` → `src/config/workflow/*`

**Import path changes:**
- `../lib/config-subscriber.js` → `../config/subscriber.js`
- `../lib/config-compiler.js` → `../config/compiler.js`

**Rollback:** `git revert HEAD` per commit

---

### Phase 6: Routing → `src/routing/` (Low Risk)

**Goal:** Create routing layer from session-entry.

**Files to move:**
1. `src/lib/session-entry/*` → `src/routing/session-entry/*`

**New files to create:**
- `src/routing/intent-classifier/index.ts` — purpose classifier (future)
- `src/routing/workflow-router/index.ts` — workflow dispatch (future)
- `src/routing/command-engine/index.ts` — command parsing (future)

**Rollback:** `git revert HEAD` per commit

---

### Phase 7: Hooks Reorganization (Low Risk)

**Goal:** Reorganize hooks by purpose, not creation method.

**Files to move:**
1. `src/hooks/create-core-hooks.ts` → `src/hooks/lifecycle/core-hooks.ts`
2. `src/hooks/create-session-hooks.ts` → `src/hooks/lifecycle/session-hooks.ts`
3. `src/hooks/create-tool-guard-hooks.ts` → `src/hooks/guards/tool-guard-hooks.ts`
4. `src/hooks/governance-block.ts` → `src/hooks/transforms/governance-block.ts`
5. `src/hooks/hook-cqrs-boundary.ts` → `src/hooks/composition/cqrs-boundary.ts`
6. `src/hooks/plugin-event-observers.ts` → `src/hooks/observers/event-observers.ts`
7. `src/hooks/toggle-gates.ts` → `src/hooks/transforms/toggle-gates.ts`
8. `src/hooks/tool-after-composer.ts` → `src/hooks/transforms/tool-after-composer.ts`
9. `src/hooks/types.ts` → `src/hooks/types.ts` (no change)

**Rollback:** `git revert HEAD` per commit

---

### Phase 8: Tools Reorganization (Low Risk)

**Goal:** Categorize tools by domain.

**Files to move:**
1. `src/tools/delegate-task.ts` → `src/tools/delegation/delegate-task.ts`
2. `src/tools/delegation-status.ts` → `src/tools/delegation/delegation-status.ts`
3. `src/tools/session-patch/` → `src/tools/session/session-patch/`
4. `src/tools/session-journal-export.ts` → `src/tools/session/session-journal-export.ts`
5. `src/tools/configure-primitive.ts` → `src/tools/config/configure-primitive.ts`
6. `src/tools/configure-primitive-paths.ts` → `src/tools/config/configure-primitive-paths.ts`
7. `src/tools/validate-restart.ts` → `src/tools/config/validate-restart.ts`
8. `src/tools/bootstrap-init.ts` → `src/tools/config/bootstrap-init.ts`
9. `src/tools/bootstrap-recover.ts` → `src/tools/config/bootstrap-recover.ts`
10. `src/tools/hivemind-doc.ts` → `src/tools/hivemind/hivemind-doc.ts`
11. `src/tools/hivemind-trajectory.ts` → `src/tools/hivemind/hivemind-trajectory.ts`
12. `src/tools/hivemind-pressure.ts` → `src/tools/hivemind/hivemind-pressure.ts`
13. `src/tools/hivemind-agent-work.ts` → `src/tools/hivemind/hivemind-agent-work.ts`
14. `src/tools/hivemind-sdk-supervisor.ts` → `src/tools/hivemind/hivemind-sdk-supervisor.ts`
15. `src/tools/hivemind-command-engine.ts` → `src/tools/hivemind/hivemind-command-engine.ts`
16. `src/tools/run-background-command.ts` → `src/tools/hivemind/run-background-command.ts`
17. `src/tools/prompt-skim/` → `src/tools/prompt/prompt-skim/`
18. `src/tools/prompt-analyze/` → `src/tools/prompt/prompt-analyze/`

**Rollback:** `git revert HEAD` per commit

---

### Phase 9: Plugin Composition Root Update (High Risk)

**Goal:** Update `src/plugin.ts` and `src/index.ts` to use new paths.

**Files to update:**
1. `src/plugin.ts` — update all imports
2. `src/index.ts` — update all re-exports

**Procedure:**
1. Update imports in `src/plugin.ts` to new paths
2. Update re-exports in `src/index.ts` to new paths
3. Run `npm run typecheck`
4. Run `npm test`
5. Commit: `refactor: update plugin composition root for new structure`

**Rollback:** `git revert HEAD`

---

### Phase 10: Cleanup (Low Risk)

**Goal:** Remove empty directories, update AGENTS.md files.

| Step | Action |
|------|--------|
| 10.1 | Remove empty `src/lib/` directory (should be empty after all moves) |
| 10.2 | Update `src/AGENTS.md` with new structure |
| 10.3 | Update `src/lib/AGENTS.md` → remove (directory gone) |
| 10.4 | Create `src/shared/AGENTS.md` with new module inventory |
| 10.5 | Create `src/task-management/AGENTS.md` |
| 10.6 | Create `src/coordination/AGENTS.md` |
| 10.7 | Create `src/features/AGENTS.md` |
| 10.8 | Create `src/config/AGENTS.md` |
| 10.9 | Create `src/routing/AGENTS.md` |
| 10.10 | Update `src/hooks/AGENTS.md` with new subdirectory structure |
| 10.11 | Update `src/tools/AGENTS.md` with new subdirectory structure |
| 10.12 | Run full test suite: `npm test` |
| 10.13 | Run typecheck: `npm run typecheck` |
| 10.14 | Final commit: `refactor: complete structure restructuring` |

---

## 5. Import Path Change Summary

### 5.1 High-Impact Changes (affect 10+ files)

| Old Path | New Path | Affected Files |
|----------|----------|----------------|
| `../lib/types.js` | `../shared/types.js` | ~30 files |
| `../lib/helpers.js` | `../shared/helpers.js` | ~15 files |
| `../lib/continuity.js` | `../task-management/continuity/index.js` | ~10 files |
| `../lib/session-api.js` | `../shared/session-api.js` | ~10 files |
| `../lib/state.js` | `../shared/state.js` | ~8 files |
| `../lib/lifecycle-manager.js` | `../task-management/lifecycle/index.js` | ~5 files |
| `../lib/delegation-manager.js` | `../coordination/delegation/manager.js` | ~5 files |

### 5.2 Medium-Impact Changes (affect 3-9 files)

| Old Path | New Path | Affected Files |
|----------|----------|----------------|
| `../lib/concurrency.js` | `../coordination/concurrency/index.js` | ~4 files |
| `../lib/completion-detector.js` | `../coordination/completion/detector.js` | ~4 files |
| `../lib/runtime-policy.js` | `../shared/runtime-policy.js` | ~4 files |
| `../lib/config-subscriber.js` | `../config/subscriber.js` | ~4 files |
| `../lib/notification-handler.js` | `../coordination/completion/notification-handler.js` | ~3 files |
| `../lib/delegation-persistence.js` | `../task-management/continuity/delegation-persistence.js` | ~3 files |
| `../lib/session-journal.js` | `../task-management/journal/index.js` | ~3 files |

### 5.3 Low-Impact Changes (affect 1-2 files)

| Old Path | New Path | Affected Files |
|----------|----------|----------------|
| `../lib/auto-loop.js` | `../coordination/spawner/auto-loop.js` | 2 files |
| `../lib/ralph-loop.js` | `../coordination/spawner/ralph-loop.js` | 2 files |
| `../lib/category-gates.js` | `../coordination/delegation/category-gates.js` | 2 files |
| `../lib/framework-detector.js` | `../features/bootstrap/framework-detector.js` | 1 file |
| `../lib/primitive-loader.js` | `../features/bootstrap/primitive-loader.js` | 1 file |

---

## 6. Risk Assessment

### 6.1 Risk Matrix

| Phase | Risk | Probability | Impact | Mitigation |
|-------|------|------------|--------|------------|
| Phase 1 (Leaf) | Low | Low | Low | Leaf modules — no behavior change |
| Phase 2 (Task Mgmt) | Medium | Medium | Medium | Split continuity.ts before move |
| Phase 3 (Coordination) | High | Medium | High | delegation-manager.ts is 500 LOC — no further growth |
| Phase 4 (Features) | Medium | Low | Medium | Fix circular deps before move |
| Phase 5 (Config) | Low | Low | Low | Small module count |
| Phase 6 (Routing) | Low | Low | Low | Only session-entry moves |
| Phase 7 (Hooks) | Low | Low | Low | Reorganization only |
| Phase 8 (Tools) | Low | Low | Low | Reorganization only |
| Phase 9 (Plugin) | High | High | High | Composition root — all imports change |
| Phase 10 (Cleanup) | Low | Low | Low | Documentation only |

### 6.2 Critical Path

```
Phase 0 (Prep) → Phase 1 (Leaf) → Phase 2 (Task Mgmt) → Phase 3 (Coordination)
                                                              ↓
Phase 4 (Features) → Phase 5 (Config) → Phase 6 (Routing) → Phase 7 (Hooks)
                                                              ↓
                                              Phase 8 (Tools) → Phase 9 (Plugin) → Phase 10 (Cleanup)
```

**Phases 1-6 can be parallelized** (no interdependencies).
**Phase 9 depends on all prior phases** (imports must be finalized).

---

## 7. Verification Checklist

After each phase:
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] No circular dependencies introduced
- [ ] No module exceeds 500 LOC
- [ ] CQRS boundary preserved (tools write, hooks observe)
- [ ] `.gitkeep` files exist in all new directories
- [ ] Import paths use `.js` extensions (ESM)
- [ ] `import type` used for type-only imports

After Phase 10:
- [ ] `src/lib/` directory is empty or removed
- [ ] All AGENTS.md files updated
- [ ] `src/index.ts` re-exports work correctly
- [ ] `src/plugin.ts` composition root works correctly
- [ ] Full test suite passes
- [ ] Typecheck passes

---

## 8. Final Directory Structure

```
src/
├── AGENTS.md
├── index.ts                          # Public API re-exports
├── plugin.ts                         # Composition root
│
├── shared/                           # Cross-cutting leaf utilities
│   ├── AGENTS.md
│   ├── types.ts                      # (from lib/types.ts)
│   ├── helpers.ts                    # (from lib/helpers.ts)
│   ├── state.ts                      # (from lib/state.ts)
│   ├── task-status.ts                # (from lib/task-status.ts)
│   ├── runtime.ts                    # (from lib/runtime.ts)
│   ├── runtime-policy.ts             # (from lib/runtime-policy.ts)
│   ├── workspace-runtime-policy.ts   # (from lib/workspace-runtime-policy.ts)
│   ├── app-api.ts                    # (from lib/app-api.ts)
│   ├── session-api.ts                # (from lib/session-api.ts)
│   ├── plugin-tool-output-summary.ts # (from lib/plugin-tool-output-summary.ts)
│   ├── tool-helpers.ts               # (existing)
│   ├── tool-response.ts              # (existing)
│   ├── security/
│   │   ├── path-scope.ts             # (from lib/security/)
│   │   └── redaction.ts              # (from lib/security/)
│   ├── behavioral-profile/           # (from lib/behavioral-profile/)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── profiles.ts
│   │   └── resolve-behavioral-profile.ts
│   └── prompt-packet/                # (from lib/prompt-packet/)
│       ├── index.ts
│       ├── compaction-preservation.ts
│       ├── delegation-packet.ts
│       └── kernel-packet.ts
│
├── task-management/                  # Graph-based, hierarchical, persistence
│   ├── AGENTS.md
│   ├── continuity/
│   │   ├── index.ts                  # (from lib/continuity.ts — public API)
│   │   ├── store-io.ts               # (split from continuity.ts)
│   │   ├── normalizers.ts            # (split from continuity.ts)
│   │   ├── clone-helpers.ts          # (split from continuity.ts)
│   │   └── delegation-persistence.ts # (from lib/delegation-persistence.ts)
│   ├── journal/
│   │   ├── index.ts                  # (from lib/session-journal.ts)
│   │   ├── query.ts                  # (from lib/journal-query.ts)
│   │   ├── replay.ts                 # (from lib/journal-replay.ts)
│   │   ├── execution-lineage.ts      # (from lib/execution-lineage.ts)
│   │   └── event-tracker/            # (from lib/event-tracker/)
│   │       ├── index.ts
│   │       ├── artifact-writer.ts
│   │       ├── classifier.ts
│   │       ├── delegation-evidence.ts
│   │       ├── document-store.ts
│   │       ├── dual-persistence.ts
│   │       ├── hook-event.ts
│   │       ├── markdown-renderer.ts
│   │       ├── parser.ts
│   │       ├── types.ts
│   │       └── writer.ts
│   ├── trajectory/                   # (from lib/trajectory/)
│   │   ├── index.ts
│   │   ├── ledger.ts
│   │   ├── store-operations.ts
│   │   └── types.ts
│   ├── recovery/                     # (from lib/recovery/)
│   │   ├── index.ts
│   │   ├── assess-state.ts
│   │   ├── create-checkpoint.ts
│   │   ├── failure-classes.ts
│   │   └── repair-state.ts
│   └── lifecycle/
│       └── index.ts                  # (from lib/lifecycle-manager.ts)
│
├── coordination/                     # Delegation, orchestration
│   ├── AGENTS.md
│   ├── delegation/
│   │   ├── types.ts                  # (from lib/delegation-types.ts)
│   │   ├── state-machine.ts          # (from lib/delegation-state-machine.ts)
│   │   ├── manager.ts                # (from lib/delegation-manager.ts)
│   │   ├── category-gates.ts         # (from lib/category-gates.ts)
│   │   └── category-gate-audit.ts    # (from lib/category-gate-audit.ts)
│   ├── sdk-delegation/
│   │   └── index.ts                  # (from lib/sdk-delegation.ts)
│   ├── command-delegation/
│   │   └── index.ts                  # (from lib/command-delegation.ts)
│   ├── concurrency/
│   │   └── index.ts                  # (from lib/concurrency.ts)
│   ├── completion/
│   │   ├── detector.ts               # (from lib/completion-detector.ts)
│   │   └── notification-handler.ts   # (from lib/notification-handler.ts)
│   └── spawner/                      # (from lib/spawner/)
│       ├── index.ts
│       ├── agent-primitive-policy.ts
│       ├── concurrency-key.ts
│       ├── parent-directory.ts
│       ├── session-creator.ts
│       ├── spawn-request-builder.ts
│       ├── spawner-types.ts
│       ├── auto-loop.ts              # (from lib/auto-loop.ts)
│       └── ralph-loop.ts             # (from lib/ralph-loop.ts)
│
├── features/                         # Standalone feature modules
│   ├── AGENTS.md
│   ├── background-command/
│   │   └── pty/                      # (from lib/pty/)
│   │       ├── bun-pty.d.ts
│   │       ├── pty-buffer.ts
│   │       ├── pty-manager.ts
│   │       ├── pty-runtime.ts
│   │       └── pty-types.ts
│   ├── doc-intelligence/             # (from lib/doc-intelligence/)
│   │   ├── index.ts
│   │   ├── chunker.ts
│   │   ├── parser.ts
│   │   ├── router.ts
│   │   └── types.ts
│   ├── runtime-pressure/             # (from lib/runtime-pressure/)
│   │   ├── index.ts
│   │   ├── authority-matrix.ts
│   │   ├── control-plane.ts
│   │   ├── model.ts
│   │   └── types.ts
│   ├── agent-work-contracts/         # (from lib/agent-work-contracts/)
│   │   ├── index.ts
│   │   ├── operations.ts
│   │   ├── store.ts
│   │   └── types.ts
│   ├── sdk-supervisor/               # (from lib/sdk-supervisor/)
│   │   ├── index.ts
│   │   └── types.ts
│   ├── command-engine/               # (from lib/command-engine/)
│   │   ├── index.ts
│   │   └── types.ts
│   └── bootstrap/
│       ├── structure.ts              # (from lib/bootstrap-structure.ts)
│       ├── framework-detector.ts     # (from lib/framework-detector.ts)
│       ├── primitive-loader.ts       # (from lib/primitive-loader.ts)
│       ├── primitive-registry.ts     # (from lib/primitive-registry.ts)
│       ├── primitive-scanners.ts     # (from lib/primitive-scanners.ts)
│       ├── cross-primitive-validator.ts
│       ├── runtime-validator.ts
│       ├── types.ts                  # (new — shared types for circular dep fix)
│       ├── validation-types.ts       # (new — shared types for circular dep fix)
│       ├── control-plane/            # (from lib/control-plane/)
│       │   ├── index.ts
│       │   ├── gate-decision.ts
│       │   └── gatekeeper.ts
│       └── runtime-detection/        # (from lib/runtime-detection/)
│           ├── index.ts
│           └── stack-synthesizer.ts
│
├── hooks/                            # Organized by purpose
│   ├── AGENTS.md
│   ├── types.ts                      # (existing)
│   ├── lifecycle/
│   │   ├── core-hooks.ts             # (from create-core-hooks.ts)
│   │   └── session-hooks.ts          # (from create-session-hooks.ts)
│   ├── guards/
│   │   └── tool-guard-hooks.ts       # (from create-tool-guard-hooks.ts)
│   ├── observers/
│   │   └── event-observers.ts        # (from plugin-event-observers.ts)
│   ├── transforms/
│   │   ├── governance-block.ts       # (from governance-block.ts)
│   │   ├── toggle-gates.ts           # (from toggle-gates.ts)
│   │   └── tool-after-composer.ts    # (from tool-after-composer.ts)
│   └── composition/
│       └── cqrs-boundary.ts          # (from hook-cqrs-boundary.ts)
│
├── tools/                            # Organized by category
│   ├── AGENTS.md
│   ├── delegation/
│   │   ├── delegate-task.ts
│   │   └── delegation-status.ts
│   ├── session/
│   │   ├── session-patch/
│   │   │   ├── index.ts
│   │   │   ├── tools.ts
│   │   │   └── types.ts
│   │   └── session-journal-export.ts
│   ├── config/
│   │   ├── configure-primitive.ts
│   │   ├── configure-primitive-paths.ts
│   │   ├── validate-restart.ts
│   │   ├── bootstrap-init.ts
│   │   └── bootstrap-recover.ts
│   ├── hivemind/
│   │   ├── hivemind-doc.ts
│   │   ├── hivemind-trajectory.ts
│   │   ├── hivemind-pressure.ts
│   │   ├── hivemind-agent-work.ts
│   │   ├── hivemind-sdk-supervisor.ts
│   │   ├── hivemind-command-engine.ts
│   │   └── run-background-command.ts
│   └── prompt/
│       ├── prompt-skim/
│       │   ├── index.ts
│       │   ├── tools.ts
│       │   └── types.ts
│       └── prompt-analyze/
│           ├── index.ts
│           ├── tools.ts
│           └── types.ts
│
├── config/                           # Config realm
│   ├── AGENTS.md
│   ├── subscriber.ts                 # (from lib/config-subscriber.ts)
│   ├── compiler.ts                   # (from lib/config-compiler.ts)
│   └── workflow/                     # (from lib/config-workflow/)
│       ├── index.ts
│       ├── workflow-guards.ts
│       ├── workflow-persistence.ts
│       ├── workflow-state.ts
│       └── workflow-types.ts
│
├── routing/                          # Intent → session → task pipeline
│   ├── AGENTS.md
│   └── session-entry/                # (from lib/session-entry/)
│       ├── index.ts
│       ├── intake-gate.ts
│       ├── language-resolution.ts
│       ├── profile-resolver.ts
│       └── purpose-classifier.ts
│
├── schema-kernel/                    # (unchanged)
│   └── ...
│
├── cli/                              # (unchanged)
│   └── ...
│
├── sidecar/                          # (unchanged)
│   └── ...
│
├── harness/                          # (reserved)
│   └── .gitkeep
│
└── kernel/                           # (reserved)
    └── .gitkeep
```

---

## 9. Success Metrics

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Files in `src/lib/` | 56 | 0 | `ls src/lib/ \| wc -l` |
| Max module LOC | 500 | ≤500 | `wc -l src/**/*.ts \| sort -rn \| head -5` |
| Circular dependencies | 2 | 0 | `npx madge --circular src/` |
| Maintainability Index | 4.9 | ≥6.0 | Re-score after restructuring |
| Test pass rate | 100% | 100% | `npm test` |
| Typecheck pass | Yes | Yes | `npm run typecheck` |

---

## 10. Rollback Strategy

### Per-Phase Rollback
Each phase commits independently. Rollback: `git revert HEAD`

### Full Rollback
If restructuring fails catastrophically:
```bash
git checkout main
git branch -D refactor/structure-restructuring
```

### Partial Rollback
If a specific phase fails:
```bash
git log --oneline  # Find the phase commit
git revert <commit-hash>  # Revert just that phase
```

---

## 11. Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 0 (Prep) | 30 min | None |
| Phase 1 (Leaf) | 2 hours | Phase 0 |
| Phase 2 (Task Mgmt) | 3 hours | Phase 1 |
| Phase 3 (Coordination) | 4 hours | Phase 1 |
| Phase 4 (Features) | 2 hours | Phase 1 |
| Phase 5 (Config) | 1 hour | Phase 1 |
| Phase 6 (Routing) | 1 hour | Phase 1 |
| Phase 7 (Hooks) | 1 hour | Phases 1-6 |
| Phase 8 (Tools) | 1 hour | Phases 1-6 |
| Phase 9 (Plugin) | 2 hours | Phases 1-8 |
| Phase 10 (Cleanup) | 1 hour | Phase 9 |
| **Total** | **~18 hours** | |

**Parallelizable:** Phases 1-6 can run in parallel (4 hours with 3 agents).
**Critical path:** Phase 0 → Phase 1 → Phase 3 → Phase 9 → Phase 10 (10 hours).

---

## Appendix A: Circular Dependency Resolution

### A.1 `primitive-scanners.ts` ↔ `primitive-registry.ts`

**Current:**
- `primitive-scanners.ts` imports `PrimitiveEntry` from `primitive-registry.ts`
- `primitive-registry.ts` imports `scanAgents`, `scanCommands`, `scanSkills` from `primitive-scanners.ts`

**Fix:**
1. Extract `PrimitiveEntry` interface to `src/features/bootstrap/types.ts`
2. Both files import from `types.ts`
3. Circular dependency eliminated

### A.2 `runtime-validator.ts` ↔ `cross-primitive-validator.ts`

**Current:**
- `runtime-validator.ts` imports `PrimitiveMap` from `cross-primitive-validator.ts`
- `cross-primitive-validator.ts` imports `validateRuntime` from `runtime-validator.ts`

**Fix:**
1. Extract `PrimitiveMap` type to `src/features/bootstrap/validation-types.ts`
2. Both files import from `validation-types.ts`
3. Circular dependency eliminated

---

## Appendix B: `continuity.ts` Split Plan

### Current (465 LOC, mixed concerns)

```
continuity.ts
├── Store I/O (loadStoreFromDisk, persistStore, quarantineCorruptFile)
├── Normalizers (normalizeContinuityRecord, isGovernanceState)
├── Clone helpers (cloneDelegationMeta, cloneCompactionCheckpoint, ...)
└── Public API (getSessionContinuity, recordSessionContinuity, patchSessionContinuity, ...)
```

### Target (4 files, each <200 LOC)

```
continuity/
├── store-io.ts (~120 LOC)
│   ├── resolveContinuityFilePath()
│   ├── resolveLegacyFilePath()
│   ├── getContinuityFile()
│   ├── quarantineCorruptFile()
│   ├── emptyStore()
│   ├── isParsedStore()
│   ├── ensureStoreLoaded()
│   ├── loadStoreFromDisk()
│   └── persistStore()
├── normalizers.ts (~80 LOC)
│   ├── normalizeContinuityRecord()
│   ├── isGovernanceState()
│   └── cloneGovernanceState()
├── clone-helpers.ts (~80 LOC)
│   ├── cloneDelegationMeta()
│   ├── cloneCompactionCheckpoint()
│   ├── cloneDelegationPacket()
│   ├── cloneLifecycleState()
│   ├── clonePendingNotifications()
│   ├── cloneCapturedResult()
│   └── cloneContinuityRecord()
└── index.ts (~185 LOC)
    ├── listSessionContinuity()
    ├── getSessionContinuity()
    ├── getSessionToolProfile()
    ├── getSessionPromptParams()
    ├── getSessionContinuityMetadata()
    ├── recordSessionContinuity()
    ├── patchSessionContinuity()
    ├── patchSessionDelegationPacket()
    ├── deleteSessionContinuity()
    ├── getContinuityStoragePath()
    ├── getCanonicalStateDir()
    ├── getLegacyStateDir()
    ├── getGovernancePersistenceState()
    └── recordGovernancePersistenceState()
```
