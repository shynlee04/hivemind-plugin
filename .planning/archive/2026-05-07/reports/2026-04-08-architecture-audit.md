# Architecture Audit Report

**Date:** 2026-04-08  
**Scope:** Full codebase audit — domain organization, CQRS boundaries, type integrity, runtime interception, security surface  
**Agents Used:** gsd-codebase-mapper, gsd-assumptions-analyzer, system-architect, gsd-verifier  

---

## 1. Executive Summary

The codebase implements most of the V3 Implementation Spec (2026-04-08) but **skipped Phase 2 plans entirely**. The V3 spec code is architecturally sound (hook factories, TaskStateManager, 47-LOC plugin), but diverges from the planned CONTEXT.md decisions (D-01 through D-18). Additionally, the `lib/` directory is a god-directory anti-pattern with 22 mixed-concern files, and 4 critical CQRS/security issues need immediate attention.

### Phase 2 Plans vs Reality

| Aspect | Phase 2 Plans (02-01 through 02-08) | What Was Built (V3 Spec) |
|--------|--------------------------------------|--------------------------|
| **Approach** | Incremental enhancement of existing code | Rewrite with new architecture |
| **Config** | `.hivemind/state/*.json` files | In-memory only, no config files |
| **Delegation packets** | Separate JSON files + manifest.json | Still in continuity.json only |
| **Background agents** | tmux + built-in adapter | Direct `child_process.spawn` only |
| **Circuit breaker** | Configurable per-session via budget-config.ts | Hardcoded in hook factory |
| **Session recovery** | Staleness check + risk assessment UI | Checkpoint capture/restore only |
| **Plan summaries** | 8 SUMMARY.md files required | **Zero** SUMMARY files created |
| **Tests** | 240 tests expected | **439 tests** passing (exceeds target) |

### V3 Spec Audit Results

| Phase | Item | Status |
|-------|------|--------|
| **Prerequisites** | 439 tests pass, typecheck clean, build clean | ✅ |
| **Phase 3.1** | TaskStateManager class | ✅ 242 LOC (target 200, +42 over) |
| **Phase 3.2** | SpawnReservation system | ✅ 273 LOC (target 250, +23 over) |
| **Phase 3.3** | CompletionDetector stability | ⚠️ Bug F3 fix ✅, `CompletionDetectorConfig` interface missing |
| **Phase 3.4** | Hook Factory Pattern | ✅ plugin.ts down to **47 LOC** (target <100) |
| **Phase 3.5** | Signature Circuit Breaker | ✅ 148 LOC, threshold=16, budget=400 |
| **Phase 3.6** | Delete agent-registry.ts | ⚠️ Content gutted, file + test still exist |
| **Phase 3.7** | Bug F1 — Transition Guard | ✅ 478 LOC, `isValidTransition` enforced |
| **Phase 4a** | Background Agents | ✅ 306 LOC |
| **Phase 4b** | Auto-Loop | ✅ embedded in session hooks |
| **Phase 4c** | Delegation Chain | ✅ continuity extended |
| **Phase 4d** | Task Queuing | ✅ enqueue/dequeue/peek/queueSize |
| **Phase 4e** | Category System | ✅ 120 LOC, 6 categories |
| **Phase 4f** | Session Recovery | ✅ 151 LOC |
| **Missing** | `tests/hooks/create-core-hooks.test.ts` | ⚠️ No test for core hooks factory |

---

## 2. Critical Issues (4)

### C-01: Dead Event Handler — Silent Data Loss

**Severity:** 🔴 CRITICAL  
**File:** `src/hooks/create-core-hooks.ts` + `src/plugin.ts`  
**Root Cause:** Object spread order in `plugin.ts` overwrites `createCoreHooks`'s `event` handler with `createSessionHooks`'s `event` handler.

```typescript
// plugin.ts assembly (simplified):
{
  ...createCoreHooks(deps),         // registers event handler A
  ...createSessionHooks(deps),      // overwrites event handler A with B
  ...createToolGuardHooks(deps),
}
```

**Impact:** The `createCoreHooks` event handler is **dead code** — it never executes. If `createSessionHooks` were removed, lifecycle event routing would silently break. No tests catch this because the surviving handler still works.

**Fix:** Merge both event handlers into one, or use an event fan-out pattern.

---

### C-02: Hook Performs Disk Write — CQRS Violation

**Severity:** 🔴 CRITICAL  
**File:** `src/hooks/create-session-hooks.ts` (~line 184)  
**Root Cause:** `session.compacting` hook calls `patchSessionContinuity()` — a synchronous disk write inside a read-side hook.

```typescript
// In create-session-hooks.ts:
"experimental.session.compacting": async (event, ctx) => {
  const checkpoint = captureCheckpoint(sessionID, taskState)
  await patchSessionContinuity(sessionID, { compactionCheckpoint: checkpoint })  // ← DISK WRITE
}
```

**Impact:** Violates the CQRS hard boundary (tools write, hooks read). If the disk write fails during compaction preparation, compaction proceeds with inconsistent checkpoint state. Also couples hook execution to I/O latency.

**Fix:** Capture checkpoint data in the hook, let a write-side handler persist it asynchronously.

---

### C-03: Hook Triggers Model Inference — Side Effect in Read Path

**Severity:** 🔴 CRITICAL  
**File:** `src/hooks/create-session-hooks.ts` (~line 160)  
**Root Cause:** Auto-loop event handler calls `sendPrompt()` — an SDK write operation that triggers AI model inference, inside a read-side event hook.

```typescript
// In create-session-hooks.ts event handler:
if (!output.includes(completionSignal) && iterations < maxIterations) {
  await sendPrompt(client, sessionID, { /* retry prompt */ })  // ← SDK WRITE
}
```

**Impact:** A read-side hook is initiating model inference. If the SDK prompt fails, the hook has already mutated `autoLoopStates` and `stateManager` (added warnings), leaving partial state. Also creates a hidden retry loop that the user cannot observe or control.

**Fix:** Move auto-loop retry logic to a write-side tool or lifecycle manager, not an event hook.

---

### C-04: Arbitrary Command Execution — Security Surface

**Severity:** 🔴 CRITICAL  
**File:** `src/tools/background/index.ts`  
**Root Cause:** Background tool accepts `command` as a raw string argument with no allowlist, sandbox, or path restriction.

```typescript
args: {
  command: s.string().describe("Command to execute"),
  args: s.array(s.string()).describe("Command arguments"),
  cwd: s.string().optional().describe("Working directory"),
}
```

**Impact:** A compromised or misbehaving builder agent can spawn any system command with the privileges of the OpenCode process. Combined with `cwd` override, can operate on any filesystem path.

**Fix:** Add command allowlist, restrict `cwd` to project root, or require explicit user permission for non-whitelisted commands.

---

## 3. Moderate Issues (8)

### M-01: Zombie Module
**File:** `src/plugins/prompt-enhance.ts`  
**Content:** Single comment: "ZOMBIE MODULE — gutted in Phase 2 cleanup."  
**Action:** Delete file.

### M-02: Zombie Test File
**File:** `tests/lib/agent-registry.test.ts`  
**Root Cause:** Tests for deleted `agent-registry.ts` module.  
**Action:** Delete test file.

### M-03: Zombie Schemas
**File:** `src/schema-kernel/prompt-enhance.schema.ts`  
**Unused schemas:**
- `ContextBudgetRecordSchema` — context-budget tool was removed
- `EnhancedPromptOutputSchema` — no tool produces this output
- `PipelineStateSchema` — no tool tracks pipeline state

**Action:** Remove unused schemas or document as future contracts.

### M-04: Synchronous Disk I/O on Every Mutation
**File:** `src/lib/continuity.ts`  
**Root Cause:** `persistStore()` uses `writeFileSync()` on every `recordSessionContinuity`, `patchSessionContinuity`, `deleteSessionContinuity`, `patchSessionDelegationPacket`.

A single delegated session lifecycle triggers **5-10 synchronous disk writes**. Under concurrent load, these serialize on the same file.

**Impact:** Latency on every state mutation. No batching, no debouncing, no async writeback.

**Action:** Consider async writeback with fsync, or batch mutations into a single write.

### M-05: Circuit Breaker Has No Time Window
**File:** `src/hooks/create-tool-guard-hooks.ts`  
**Root Cause:** Counter never resets. Tracks consecutive identical `(toolName, stableStringify(args))` pairs with no sliding window.

**Impact:** If an agent calls `read` 15 times with the same args early in the session, then legitimately needs to call it once more later, the breaker trips. No recovery path.

**Action:** Add sliding window (reset after N non-matching calls) or time-based decay.

### M-06: No Path Sandboxing on Session-Patch
**File:** `src/tools/session-patch/tools.ts`  
**Root Cause:** Accepts `sessionFilePath` as an absolute path with no validation that it's within an allowed directory.

**Impact:** An agent could patch any file on the filesystem that the process has write access to.

**Action:** Validate `sessionFilePath` is within project root or `.opencode/` directory.

### M-07: DelegationPacket.plan Always Null
**File:** `src/lib/delegation-packet.ts`  
**Root Cause:** `DelegationPacket` has a `plan` field with a `setPlan` mutator, but no code calls `setPlan()`.

**Action:** Either wire plan capture into the delegation flow, or remove the field.

### M-08: helpers.ts Mixed Concerns
**File:** `src/lib/helpers.ts`  
**Root Cause:** Mixes pure utilities (`isObject`, `stableStringify`, `deepClone`) with domain-specific logic (`buildPromptText`, `getPromptToolCompatibility`).

**Impact:** If `types.ts` changes (e.g., `PermissionRule` shape), `helpers.ts` must be updated — but it's supposed to be a leaf utility module.

**Action:** Extract domain logic into owning domains (`routing/`, `delegation/`), keep only pure utils in `helpers.ts`.

---

## 4. Good Practices (15)

| # | Practice | Evidence |
|---|----------|----------|
| 1 | Type centralization | All core types in `src/lib/types.ts` |
| 2 | Schema re-exports | Tools import from `schema-kernel/`, not duplicate |
| 3 | Zod consistency | All 5 tools use `tool.schema` for arg definitions |
| 4 | Clone-on-read | `continuity.ts` returns deep clones, not references |
| 5 | Normalizer protection | `continuity-normalizers.ts` validates all fields from disk |
| 6 | Budget enforcement | `MAX_TOOL_CALLS_PER_SESSION = 400` enforced in `tool.execute.before` |
| 7 | Depth checks | `MAX_DEPTH = 3` enforced in `delegate-task.ts` |
| 8 | Two-phase budget commit | `reserveSubagentSpawn` + `commitDescendant` pattern |
| 9 | Continuity hydration | State restored from disk on startup |
| 10 | Cycle detection | `walkParentChain()` detects and breaks cycles |
| 11 | Permission scoping | Per-agent allow/ask lists enforced |
| 12 | Dependency injection | All hook factories accept `HookDependencies` bundles |
| 13 | Error prefix convention | All errors prefixed with `[Harness]` |
| 14 | LOC limits respected | Most modules under 500 LOC |
| 15 | CQRS clean in most hooks | `createToolGuardHooks`, `createCoreHooks` are read-only |

---

## 5. Type System Integrity

### Centralized Types ✅

`src/lib/types.ts` is the leaf type hub — depends on nothing, imported by everything. Exports:

- `DelegationMeta`, `SessionStats`, `LoopWindow`, `RootBudget`
- `SessionContinuityRecord`, `SessionContinuityMetadata`
- `SessionLifecycleState`, `SessionLifecyclePhase`, `SessionLifecycleQueueState`, `SessionLifecycleObservation`
- `DelegationPacket`, `DelegationPacketStatus`
- `DelegationRouteResolution`, `SessionPromptParams`, `SessionToolProfile`
- `CompactionCheckpointData`
- Constants: `MAX_DESCENDANTS_PER_ROOT`, `VALID_AGENTS`, `VALID_DELEGATION_CATEGORIES`

### Schema-Kernel Coverage Gap ⚠️

Schema-kernel only covers **prompt-enhance pipeline** tools:
- `PromptSkimResultSchema` ✅ (consumed)
- `PromptAnalysisResultSchema` ✅ (consumed)
- `SessionPatchRecordSchema` ✅ (consumed)
- `ContextBudgetRecordSchema` ❌ (zombie — 0 consumers)
- `EnhancedPromptOutputSchema` ❌ (zombie — 0 consumers)
- `PipelineStateSchema` ❌ (zombie — 0 consumers)

**Missing from schema-kernel:**
- `delegate-task` tool args — Zod used inline, no schema-kernel contract
- `background` tool args — Zod used inline, no schema-kernel contract
- `ContinuityStoreFile` — relies on normalizer layer, not Zod
- `SessionContinuityRecord` — same, normalizer-only validation

### Normalizer Layer as Informal Schema ⚠️

`src/lib/continuity-normalizers.ts` (~350 LOC) is a manual validation layer for `ContinuityStoreFile` records. It does the job of a Zod schema but with hand-written guards. If `types.ts` changes, the normalizer must be updated manually — no compile-time enforcement.

---

## 6. Runtime Interception Quality

### Hook Registry

| Hook | Provider | Fires On | Status |
|------|----------|----------|--------|
| `event` | `createSessionHooks` | ALL SDK events | ✅ Active |
| `event` | `createCoreHooks` | ALL SDK events | 🔴 DEAD (overwritten) |
| `messages.transform` | `createCoreHooks` | Every message transform | ✅ Active |
| `shell.env` | `createCoreHooks` | Every shell command | ✅ Active |
| `tool.execute.before` | `createToolGuardHooks` | Before every tool call | ✅ Active |
| `tool.execute.after` | `createToolGuardHooks` | After every tool call | ✅ Active |
| `experimental.session.compacting` | `createSessionHooks` | During compaction | ⚠️ CQRS violation |

### Potential Race Condition ⚠️

`tool.execute.after` reads `getSessionContinuity()` while `session.compacting` may be writing to it via `patchSessionContinuity()`. If compaction happens during tool execution, the hook could read stale or partially-written data.

### No Hook Composition

Each hook factory returns a single object with all its hooks. No middleware pattern, no ability to add/remove individual hooks at runtime. Acceptable for current scale but limits extensibility.

---

## 7. State Management Correctness

### Dual-Layer Architecture ✅

| Layer | Storage | Scope |
|-------|---------|-------|
| In-memory | `TaskStateManager` Maps | Process lifetime |
| Durable | `session-continuity.json` | Across restarts |

### One-Way Consistency: Memory → Disk Only ⚠️

`hydrateFromContinuity()` loads continuity into memory at startup. But `patchSessionContinuity()` writes to disk **without updating** `taskState`. After a restart, tool call counts and loop detection state are lost (only the last compaction checkpoint is restored).

### Singleton `taskState` is Process-Global

```typescript
export const taskState = new TaskStateManager()
```

Backward-compatible wrapper functions (`getDelegationMeta`, `setDelegationMeta`, etc.) call the singleton directly — any module can mutate global state without going through the dependency-injected manager.

---

## 8. Delegation Chain Correctness

| Aspect | Status |
|--------|--------|
| Parent-child lineage tracked | ✅ `walkParentChain()` + `sessionToRoot` Map |
| Task persistence | ✅ DelegationPacket in continuity JSON |
| Continuity across sessions | ✅ `hydrateFromContinuity()` on startup |
| Depth enforcement (MAX_DEPTH=3) | ✅ Checked in `delegate-task.ts` |
| Budget enforcement (reserve/rollback) | ✅ Two-phase commit pattern |
| Cycle detection | ✅ In `walkParentChain()` |
| `buildParentChain` depth | ⚠️ Only produces 2-level chains, but `buildDelegationPacketParentChain` correctly builds 3-level |
| `DelegationPacket.plan` | ⚠️ Always null — `setPlan()` never called |

---

## 9. Security Surface

| Aspect | Status | Detail |
|--------|--------|--------|
| Permission scoping per agent | ✅ researcher/builder/critic allow/ask lists |
| Tool budget enforcement | ✅ 400/session, throws `[Harness]` error |
| Circuit breaker | ✅ Signature-based, threshold=16 |
| Arbitrary command execution | 🔴 Background tool accepts raw `command` string |
| Path sandboxing | 🔴 Session-patch accepts any absolute path |
| Tool permission verification | ⚠️ Relies on OpenCode SDK, no client-side verification |

---

## 10. Domain Organization

### Current Structure: Flat `lib/` God Directory (22 files)

```
src/lib/
├── types.ts                     # Type Authority
├── task-status.ts               # State Machine
├── state.ts                     # TaskStateManager
├── helpers.ts                   # Mixed: pure utils + domain logic
├── concurrency.ts               # Semaphore + reservations
├── continuity.ts                # Durable JSON store
├── continuity-normalizers.ts    # Manual validation layer
├── continuity-clone.ts          # Deep-clone for continuity
├── session-api.ts               # SDK client boundary
├── runtime.ts                   # Event→status inference
├── completion-detector.ts       # Async completion detection
├── notification-handler.ts      # Parent notifications
├── lifecycle-manager.ts         # God class (~480 LOC, 12 imports)
├── agent-registry.ts            # DEAD CODE (1-line comment)
├── delegation-packet.ts         # Packet factory
├── budget-config.ts             # Per-session budget config
├── background-manager.ts        # Process spawn/kill
├── categories.ts                # Category→model routing
├── compaction-checkpoint.ts     # Checkpoint capture/restore
├── lifecycle-state.ts           # Lifecycle state builders
├── lifecycle-queue.ts           # Lifecycle queue integration
└── lifecycle-background-observer.ts  # Background completion observer
```

### Proposed Structure: 13 Domain Directories

```
src/
├── types/           # Type Authority (types.ts + task-status.ts)
├── state/           # In-Memory State (TaskStateManager)
├── persistence/     # Continuity & Durability (continuity + clone + normalizers)
├── compaction/      # Checkpoint recovery (compaction-checkpoint.ts)
├── concurrency/     # Semaphore + reservations (concurrency.ts)
├── lifecycle/       # Orchestrator (manager + state + queue + observer + runtime + completion)
├── delegation/      # Packets + notifications + budget-config
├── routing/         # Category→model resolution (categories.ts)
├── sdk-client/      # OpenCode SDK boundary (session-api.ts)
├── background/      # Process management (background-manager.ts)
├── utils/           # Pure utilities only (helpers.ts — domain logic extracted)
├── hooks/           # Read-side (CQRS)
├── tools/           # Write-side (CQRS)
├── shared/          # Cross-cutting
├── schema-kernel/   # Zod contracts
└── plugin.ts        # Assembly root
```

### Migration Risk Assessment

| Risk | Files | Impact |
|------|-------|--------|
| HIGH | `lifecycle-manager.ts`, `plugin.ts` | Every import path changes |
| HIGH | `hooks/create-session-hooks.ts`, `hooks/create-tool-guard-hooks.ts` | All `../lib/` paths change |
| MEDIUM | `tools/delegate-task.ts`, `hooks/create-core-hooks.ts` | Import paths change |
| LOW | `shared/`, `schema-kernel/`, `types/` | Leaf files — consumers update paths |
| ZERO | `agent-registry.ts` | Dead code — delete |

**Total files requiring import updates:** ~25  
**Estimated effort:** 2-3 hours (mechanical path rewrites)  
**Breakage risk:** Low — TypeScript compiler catches missed imports immediately

### Dependency Graph (Proposed)

```
                    types/ (leaf)
                   /    |    \
              state/  utils/  routing/
                 |      |       |
              concurrency  sdk-client/
                 |      /    \
              persistence    background/
                 |      /
              compaction/
                    \
                  lifecycle/  ←─── deepest chain (4 levels)
                    /    \
               delegation/  hooks/
                    \      /
                   tools/ (write-side)
                      |
                   plugin.ts (assembly)
```

---

## 11. Module Size Report

| Module | LOC | Limit | Status |
|--------|-----|-------|--------|
| `plugin.ts` | 47 | 100 | ✅ |
| `hooks/create-core-hooks.ts` | 82 | 150 | ✅ |
| `hooks/create-tool-guard-hooks.ts` | 148 | 150 | ✅ |
| `hooks/create-session-hooks.ts` | 305 | 150 | ⚠️ +155 over (auto-loop adds ~80) |
| `hooks/messages-transform.ts` | ~40 | 500 | ✅ |
| `lib/types.ts` | ~200 | 500 | ✅ |
| `lib/state.ts` | 242 | 200 | ⚠️ +42 over |
| `lib/concurrency.ts` | 273 | 250 | ⚠️ +23 over |
| `lib/continuity.ts` | ~635 | 500 | 🔴 +135 over |
| `lib/continuity-normalizers.ts` | ~350 | 500 | ✅ |
| `lib/continuity-clone.ts` | ~50 | 500 | ✅ |
| `lib/lifecycle-manager.ts` | 478 | 500 | ✅ (but 12 imports) |
| `lib/lifecycle-state.ts` | ~120 | 500 | ✅ |
| `lib/lifecycle-queue.ts` | ~60 | 500 | ✅ |
| `lib/lifecycle-background-observer.ts` | ~80 | 500 | ✅ |
| `lib/background-manager.ts` | 306 | 300 | ⚠️ +6 over |
| `lib/categories.ts` | 120 | 150 | ✅ |
| `lib/compaction-checkpoint.ts` | 151 | 200 | ✅ |
| `lib/delegation-packet.ts` | ~100 | 500 | ✅ |
| `lib/notification-handler.ts` | ~80 | 500 | ✅ |
| `lib/session-api.ts` | ~100 | 500 | ✅ |
| `lib/completion-detector.ts` | 124 | 250 | ✅ |
| `lib/helpers.ts` | ~150 | 500 | ✅ |
| `lib/runtime.ts` | ~60 | 500 | ✅ |
| `lib/task-status.ts` | ~80 | 500 | ✅ |
| `lib/budget-config.ts` | ~100 | 500 | ✅ |
| `lib/agent-registry.ts` | 1 | 500 | 🔴 DEAD |
| `src/plugins/prompt-enhance.ts` | 3 | 500 | 🔴 ZOMBIE |

**Total source LOC:** ~4,800 (target: 4,000-5,000) ✅

---

## 12. Recommendations — Priority Order

### P0: Fix Critical Issues (Before Anything Else)

1. **Remove dead event handler** — Delete `event` from `createCoreHooks` or merge with `createSessionHooks.event`
2. **Move disk writes out of hooks** — `session.compacting` hook captures checkpoint, async handler persists
3. **Move auto-loop out of hooks** — Retry logic belongs in lifecycle manager or write-side tool
4. **Sandbox background tool** — Add command allowlist or restrict `cwd` to project root

### P1: Clean Up Zombies

5. Delete `src/plugins/prompt-enhance.ts`
6. Delete `tests/lib/agent-registry.test.ts`
7. Delete `src/lib/agent-registry.ts`
8. Remove zombie schemas from schema-kernel

### P2: Domain Reorganization

9. Create domain directories per proposed structure
10. Move files (path-only changes, no logic changes)
11. Update all import paths
12. Run `npm run typecheck && npm test` to verify

### P3: Security & Robustness

13. Add circuit breaker sliding window
14. Add path sandboxing to session-patch
15. Wire `DelegationPacket.setPlan()` or remove field
16. Extract domain logic from `helpers.ts` into owning domains
17. Consider async writeback for continuity (debounce batched writes)

### P4: Missing Test Coverage

18. Add `tests/hooks/create-core-hooks.test.ts`

---

## 13. Phase 2 Plan Status

| Plan | File | Status | SUMMARY Created? |
|------|------|--------|-----------------|
| 02-01 | Concurrency Control (2c) | ✅ Implemented (concurrency.ts enhanced) | ❌ No |
| 02-02 | Circuit Breaker (2h) | ⚠️ Partial — hardcoded, not configurable | ❌ No |
| 02-03 | Background Agents (2a) | ✅ Implemented (background-manager.ts) | ❌ No |
| 02-04 | Delegation Chain (2b) | ✅ Implemented (delegation-packet.ts) | ❌ No |
| 02-05 | Session Recovery (2d) | ✅ Implemented (compaction-checkpoint.ts) | ❌ No |
| 02-06 | Specialist Classification (2g) | ✅ Implemented (categories.ts) | ❌ No |
| 02-07 | Context Governance (2e) | ❌ Not implemented | ❌ No |
| 02-08 | Injection Engine (2f) | ❌ Not implemented | ❌ No |

**Note:** Phase 2 plans were written but **never executed via the plan workflow**. The V3 spec implementation diverged from plan decisions (D-01 through D-18). No SUMMARY.md files were created for any plan.

---

*Report generated: 2026-04-08 16:55 UTC*
