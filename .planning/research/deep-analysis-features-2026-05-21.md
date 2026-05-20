# Deep Analysis: src/features/ — Comprehensive Feature Assessment

**Analysis Date:** 2026-05-21
**Inspector:** mimo-v2.5-pro-precision (GSD codebase mapper)
**Scope:** All 67 `.ts` files across 10 feature submodules
**Total LOC inspected:** 12,669

---

## 1. Feature Maturity Matrix

| Feature | LOC | Files | Wired | Tests | Maturity | Quality Score |
|---------|-----|-------|-------|-------|----------|---------------|
| session-tracker | 7,745 | 27 | ✅ Full | ✅ 3 test files | ACTIVE | B- |
| bootstrap | 2,259 | 9 | ✅ Tools | ✅ 3 test files | ACTIVE | B |
| runtime-pressure | 625 | 5 | ✅ Tool | ❌ None | ACTIVE | B |
| doc-intelligence | 454 | 5 | ✅ Tool | ❌ None | ACTIVE | B |
| agent-work-contracts | 400 | 4 | ✅ Tool | ❌ None | ACTIVE | B |
| background-command | 398 | 5 | ✅ Plugin | ⚠️ 1 integration test | ACTIVE | B |
| prompt-packet | 348 | 4 | ❌ None | ❌ None | DESIGNED_ONLY | C- |
| sdk-supervisor | 312 | 2 | ✅ Tool | ✅ 2 test files | ACTIVE | B |
| auto-loop | 66 | 2 | ✅ Spawner | ✅ 2 test files | ACTIVE | A |
| ralph-loop | 62 | 2 | ✅ Spawner | ✅ 2 test files | ACTIVE | A |

**Total:** 12,669 LOC / 67 `.ts` files / 10 features

---

## 2. Feature-by-Feature Analysis

### 2.1 session-tracker (7,745 LOC — 61% of all feature code)

**Purpose:** Read-side session knowledge capture under `.hivemind/session-tracker/`. Replaces the broken `event-tracker`.

**Wiring:** Fully wired in `src/plugin.ts` lines 248, 337-349, 364-377, 380-396, 440-448, 451.

**File breakdown (by subdirectory):**

| Directory | Files | LOC | Purpose |
|-----------|-------|-----|---------|
| `capture/` | 3 | 1,554 | Event/message/tool hook handlers |
| `persistence/` | 9 | 2,271 | Atomic write, indices, manifests, queues |
| `recovery/` | 1 | 415 | Post-disconnection session rebuild |
| `transform/` | 2 | 274 | Agent metadata, snake_case→camelCase normalization |
| `hooks/` | 1 | 76 | PreToolUse classification hook (legacy artifact?) |
| Root level | 11 | 3,155 | index.ts, types.ts, bootstrap, classification, etc. |

**Lifecycle flow:**
```
plugin.ts → SessionTracker.initialize()
  → hierarchyIndex.buildFromDisk()    // rebuild in-memory index from disk
  → constructDependencies()           // create all writers/handlers
  → recovery.initialize()             // read project-continuity.json
  → projectIndexWriter.initializeIndex()
  → seedTurnCounters()                // from existing .md files
  → cleanupOrphanedTmpFiles()
  → cleanupOrphanDirectories()
  → projectContinuityChecker.ensureCompleteness()
  → startRetryFlushLoop()             // periodic retry queue flush

Hook callbacks:
  handleSessionEvent()      → eventCapture
  handleChatMessage()       → sessionRouter.route() → messageCapture / childRecorder
  handleToolExecuteAfter()  → classifier.classify() → toolCapture / toolDelegation
  handleToolExecuteBefore() → toolDelegation.handleToolExecuteBefore()
```

**Complexity hotspots (exceed 500 LOC cap):**

| File | LOC | Cap | Over |
|------|-----|-----|------|
| `capture/event-capture.ts` | 702 | 500 | +40% |
| `index.ts` | 561 | 500 | +12% |

**Design quality:**
- ✅ CQRS compliance: hooks route through SessionTracker, never write directly
- ✅ Dependency injection pattern (constructor-based)
- ✅ Atomic write pattern (write-to-tmp → `rename()`)
- ✅ Per-child serial write queues prevent concurrent corruption
- ✅ Stale queue detection with auto-reset
- ✅ Three-gate classification: SDK → HierarchyIndex → PendingDispatchRegistry
- ❌ `index.ts` (561 LOC) exceeds 500 LOC cap (GA-4 violation)
- ❌ `event-capture.ts` (702 LOC) exceeds 500 LOC cap significantly
- ❌ Massive module: 27 files, 7,745 LOC — architectural smell of over-engineering
- ⚠️ Per-child write queue + retry queue + retry flush loop = 3 concurrent write mechanisms that overlap

**Subdirectory structure assessment (capture/ vs persistence/ vs transform/):**
- `capture/` (3 files): Clean separation — owns hook handler logic only
- `persistence/` (10 files): **Overloaded** — combines atomic primitives, index writers, child writers, dispatch registry, retry queue, orphan quarantine, manifest writer. The `session-writer.ts` and `atomic-write.ts` overlap: `session-writer.ts` implements markdown formatting while `atomic-write.ts` provides the low-level file I/O. This is a reasonable split.
- `transform/` (2 files): **schema-normalizer.ts appears unused.** No imports found from other modules. AgentTransform is actively used by message-capture.ts.
- `hooks/` (1 file): `session-classification-hook.ts` creates a factory function pattern that is NOT connected to plugin.ts. The plugin uses `tool-delegation.ts`'s `handleToolExecuteBefore` instead. This hook is a **legacy artifact** — designed for CP-ST-05-01 but superseded by a different wiring pattern.

**PendingDispatchRegistry analysis:**
- **Not a queue workaround.** It solves a specific race: PreToolUse doesn't know the child session ID yet; PostToolUse does. The registry bridges this gap with a 30-second TTL.
- **Is it needed?** Yes, in theory. Without it, `session.created` events for child sessions could arrive before PostToolUse fires, causing Gate 1 (SDK) and Gate 2 (HierarchyIndex) to miss the child → session gets misclassified as root.
- **Is it over-engineered?** Possibly. It has 3 reverse indices (childID→entry, callID→childID, parentID→callIDs), `getAnyActiveEntry()`, `updateWithChildID()`, and 30-second cleanup. The 312 LOC could likely be replaced by a simpler `Map<string, {parentID, subagentType}>` + `Map<string, string>` with periodic purge.

**Test coverage:**
- `tests/features/session-tracker/session-tracker.test.ts`
- `tests/tools/hivemind/session-tracker.test.ts`
- `tests/hooks/observers/session-tracker-consumer.test.ts`
- Adequate coverage for a module this size

---

### 2.2 bootstrap (2,259 LOC)

**Purpose:** Primitive loading, framework detection, runtime validation at initialization time.

**Wiring:** Wired through tools (`bootstrap-init`, `bootstrap-recover`) referenced in `plugin.ts` lines 422-424. Not directly instantiated in plugin.ts — tools create instances on demand.

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `cross-primitive-validator.ts` | 373 | Cross-primitive dependency validation |
| `primitive-loader.ts` | 361 | Loads OpenCode primitives from filesystem |
| `runtime-validator.ts` | 352 | Runtime environment validation |
| `primitive-registry.ts` | 291 | Registry of discovered primitives |
| `framework-detector.ts` | 190 | Framework auto-detection |
| `primitive-scanners.ts` | 182 | Filesystem scanning for primitives |
| `structure.ts` | 146 | Bootstrap directory structure |
| `control-plane/gatekeeper.ts` | 211 | Gatekeeping decisions |
| `control-plane/gate-decision.ts` | ❓ (contained in gatekeeper/control-plane) | |
| `control-plane/index.ts` (barrel) | ❓ | |

**Design quality:**
- ✅ Modular separation of concerns
- ⚠️ `primitive-registry.ts` (291 LOC) and `primitive-loader.ts` (361 LOC) have overlapping responsibilities — both handle primitive lifecycle
- No single file exceeds 500 LOC cap

**Test coverage:**
- `tests/plugin/bootstrap-tools-registration.test.ts`
- `tests/tools/bootstrap-init.test.ts`
- `tests/tools/bootstrap-recover.test.ts`

---

### 2.3 prompt-packet (348 LOC) — DESIGNED_ONLY

**Purpose:** Packet creation and compaction-preservation for cross-compaction context survival.

**Wiring:** **NOT WIRED.** Zero imports from plugin.ts, coordination, or any tool. This is pure designed-but-never-connected code.

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `kernel-packet.ts` | 149 | KernelPacket type (46 fields!) + factory function |
| `compaction-preservation.ts` | 108 | toCompactionPacket / fromCompactionPacket |
| `delegation-packet.ts` | 73 | Delegation packet constructor |
| `index.ts` | 18 | Barrel exports |
| `AGENTS.md` | 41 | Guidance (L5 docs only) |

**Compaction preservation analysis:**
The SPEC says prompt-packet is for "compact survival" — preserving critical context across OpenCode compaction events. Looking at the implementation:

- `toCompactionPacket()` takes a `KernelPacket` and `CompactionExtras`, produces a `CompactionPreservationPacket` with stripped-down fields (no codemap, no tool calls, deep-module fields removed).
- `fromCompactionPacket()` restores a `KernelPacket` from a compaction packet + base kernel.
- **Reality check:** Nothing calls these functions. The `session-tracker/event-capture.ts`'s `handleSessionCompacted()` method captures compaction events directly via hooks, writing to `.md` files. It does NOT use prompt-packet.

**Root cause:** Prompt-packet was designed before session-tracker took over compaction capture. The session-tracker's approach (hook-driven capture to `.md` files) supersedes the packet-based approach. The packet types remain defined but unreferenced.

**Key exports not consumed anywhere:**
- `createKernelPacket()` — depends on `SessionContinuityRecord` from shared/types, but no coordination or tool imports this
- `createDelegationPacket()` — same dependency
- `toCompactionPacket()` / `fromCompactionPacket()` — unused

**Verdict:** **348 LOC of dead code.** The `SessionContinuityRecord` type is also in `shared/types.ts` but prompt-packet's dependency chain suggests it was designed for an earlier architecture that was superseded.

---

### 2.4 auto-loop (66 LOC) / ralph-loop (62 LOC)

**Purpose:** Sequential delegation execution engines. Auto-loop runs one agent repeatedly; ralph-loop cycles through a list.

**Wiring:** Wired through `src/coordination/spawner/auto-loop.ts` and `src/coordination/spawner/ralph-loop.ts` (lines 69-70 of plugin.ts import these). The feature modules themselves are pure computation — the actual wiring is in coordination.

**Design quality:**
- ✅ Clean, minimal design — both are pure classes with single `run()` method
- ✅ Clear types with discriminated status
- ✅ Proper validation in constructor
- ⚠️ `AutoLoopEngine.run()` accumulates results but has no backpressure or rate limiting
- ⚠️ `RalphLoopEngine` treats all failures as terminal — no retry logic

**Test coverage:** ✅ 2 test files each

---

### 2.5 background-command (398 LOC)

**Purpose:** PTY and headless command execution. Gracefully falls back to `node:child_process` when `bun-pty` is absent.

**Wiring:** Wired in `plugin.ts` line 44 (`createPtyManagerIfSupported`), line 136 (passed to `setupDelegationModules`), line 404 (`run-background-command` tool).

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `pty/pty-manager.ts` | 145 | PTY session lifecycle manager |
| `pty/pty-types.ts` | 110 | Type definitions for PTY API |
| `pty/pty-buffer.ts` | ~80 | Output buffer for PTY streams |
| `pty/pty-runtime.ts` | 21 | Factory with graceful fallback |
| `pty/bun-pty.d.ts` | ~42 | Type declarations for bun-pty module |

**Design quality:**
- ✅ Graceful fallback from bun-pty to node:child_process
- ✅ Factory pattern (`createPtyManagerIfSupported`)
- ✅ Healthy separation of types, manager, buffer
- ❌ `pty-manager.ts` imports `spawn` from `bun-pty` directly — if bun-pty isn't installed, this throws at module load time. The `createPtyManagerIfSupported` try-catch prevents this, but only if it's the sole import site.

**Test coverage:** ⚠️ 1 integration test (`tests/tools/run-background-command.test.ts`)

---

### 2.6 doc-intelligence (454 LOC)

**Purpose:** Markdown parsing, chunking, and document routing for read-side consumption.

**Wiring:** Consumed by `src/tools/hivemind/hivemind-doc.ts` (plugin.ts line 411). Tool is registered. Feature is pure computation, no state.

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `router.ts` | 162 | Routes documents to skim/read/chunk/search actions |
| `types.ts` | 90 | All type definitions |
| `parser.ts` | ~100 | Markdown outline extraction + slugify |
| `chunker.ts` | ~90 | Heading-aware document chunking |
| `index.ts` | 14 | Barrel exports |

**Design quality:**
- ✅ Clean, read-side only — no state
- ✅ Headings-aware chunking (not byte-split)
- ⚠️ `estimatedTokens` uses a simplistic 4-char-per-token heuristic — will undercount for code-heavy docs

**Test coverage:** ❌ None

---

### 2.7 runtime-pressure (625 LOC)

**Purpose:** Pressure scoring, tool authority matrix, control-plane decisions for Phase 57 runtime governance.

**Wiring:** Consumed by `src/tools/hivemind/hivemind-pressure.ts` (plugin.ts line 413). Also imported by agent-work-contracts and sdk-supervisor.

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `authority-matrix.ts` | 252 | Tool-to-pressure-tier mapping |
| `types.ts` | 156 | All pressure type definitions |
| `control-plane.ts` | 161 | Decision-making logic based on pressure |
| `model.ts` | ~50 | Pressure scoring model |
| `index.ts` | 4 | Barrel exports |

**Design quality:**
- ✅ Clean separation of model/authority/control-plane
- ✅ Well-typed discriminated outcomes
- ⚠️ The tool authority matrix (`authority-matrix.ts` at 252 LOC) overlaps with `tool-capability-matrix` skill — potential duplication
- No file exceeds 500 LOC cap

**Test coverage:** ❌ None

---

### 2.8 agent-work-contracts (400 LOC)

**Purpose:** Durable contract creation and export for delegated work. Persists to `.hivemind/state/agent-work-contracts.json`.

**Wiring:** Consumed by `src/tools/hivemind/hivemind-agent-work.ts` (plugin.ts lines 419-420). Two tools registered: create + export.

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `operations.ts` | 162 | Contract CRUD + export operations |
| `store.ts` | 146 | File-based persistence with atomic write |
| `types.ts` | 89 | Contract type definitions |
| `index.ts` | 3 | Barrel exports |

**Design quality:**
- ✅ Proper atomic write pattern (writeFileSync → renameSync)
- ✅ Schema validation via Zod guard (`AgentWorkContractStoreSchema.safeParse`)
- ✅ Corrupt store quarantine
- ✅ Deep-clone-on-read for defensive copy
- ⚠️ Uses synchronous `fs` APIs (`readFileSync`, `writeFileSync`, `renameSync`) — blocks the event loop
- ⚠️ Crash safety: uses sync APIs + temp files, but one concurrent write from another agent could clobber
- No file exceeds 500 LOC cap

**Test coverage:** ❌ None

---

### 2.9 sdk-supervisor (312 LOC)

**Purpose:** Read-only SDK wrapper health inspection, heartbeat, bounded diagnostics, readiness checks.

**Wiring:** Consumed by `src/tools/hivemind/hivemind-sdk-supervisor.ts` (plugin.ts line 414).

**File breakdown:**

| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 202 | SdkSupervisor class + action dispatch |
| `types.ts` | 110 | All type definitions |

**Design quality:**
- ✅ Clean, focused class with 4 methods: health, heartbeat, diagnostics, readiness
- ✅ Action dispatcher pattern
- ✅ Bounded output (maxDiagnostics capped at 50)
- ⚠️ `isWrapperAvailable()` uses `|| true` for several wrappers — essentially always returns true, making the health check non-functional
- `walkParentChain` always returns `true` without checking anything

**Test coverage:** ✅ 2 test files

---

## 3. Session-Tracker Deep Analysis

### 3.1 Lifecycle Summary

```
Plugin Load
  ↓
SessionTracker.initialize()
  ├── hierarchyIndex.buildFromDisk()     — scans session-continuity.json files
  ├── constructDependencies()            — creates 16+ internal objects
  ├── recovery.initialize()              — reads project-continuity.json
  ├── projectIndexWriter.initializeIndex()
  ├── seedTurnCounters()                 — parses existing .md files for turn counts
  ├── cleanupOrphanedTmpFiles()          — removes .tmp.* artifacts
  ├── cleanupOrphanDirectories()         — quarantines child dirs that shouldn't exist
  ├── projectContinuityChecker.ensureCompleteness()
  └── startRetryFlushLoop()              — 30s interval flush

Runtime (hook callbacks)
  ├── handleSessionEvent(event)
  │   └── eventCapture.handleSessionEvent()
  │       ├── session.created → Gate 0/1/2/3 → write root .md or child .json
  │       ├── session.idle → update status (child or main)
  │       ├── session.deleted → mark completed
  │       ├── session.error → mark error
  │       └── session.compacted → write compaction block
  ├── handleChatMessage(input, output)
  │   └── sessionRouter.route() → childRecorder or messageCapture
  │       ├── child → childWriter.appendChildTurn() + appendJourneyEntry()
  │       └── main → messageCapture → sessionWriter.appendUserTurn/appendAgentBlock
  ├── handleToolExecuteAfter(input, output)
  │   └── classifier.classify() → toolCapture or toolDelegation
  │       ├── child → toolDelegation.recordChildToolJourney()
  │       └── main → toolCapture → sessionWriter.appendToolBlock()
  └── handleToolExecuteBefore(params)
      └── toolDelegation.handleToolExecuteBefore()
          ├── pendingRegistry.add()
          └── pollForChildSessions() (fire-and-forget)
```

### 3.2 Active vs Legacy Files

**Active (24 of 27 files):**
All files in `capture/`, `persistence/`, `recovery/`, and root-level (except hooks/) are actively wired through `index.ts` or the dependency construction chain.

**Legacy/Migration Artifacts (3 files):**
1. **`hooks/session-classification-hook.ts`** (76 LOC) — Designed for CP-ST-05-01 "hooks-first" classification, but plugin.ts uses the `handleToolExecuteBefore` pattern on `ToolDelegation` instead. This file creates a factory function `createSessionClassificationHook()` that is never called.
2. **`transform/schema-normalizer.ts`** (155 LOC) — Defines `normalizeSessionRecord()` and `normalizeChildRecord()` and `toCamelCase()` but **none are imported or called** by any session-tracker module. The session-tracker writes raw data; normalization was apparently planned but never needed.
3. **`persistence/.gitkeep`** — Not a code file, but structurally unnecessary now that the directory is populated.

### 3.3 PendingDispatchRegistry Necessity

**Is it needed?** The three-gate classification is:
- Gate 1: SDK parentID (fast path)
- Gate 2: HierarchyIndex (fallback from persisted data)
- Gate 3: PendingDispatchRegistry (race condition guard)

Gate 3 exists because there's a race between `tool.execute.before` (PreToolUse) and `session.created`. The PreToolUse hook fires when a task is dispatched, but the child session ID isn't known yet. If `session.created` fires before `tool.execute.after` (PostToolUse), Gates 1 and 2 will fail to identify the session as a child.

**Simpler alternative:** A 2-field `Map<callID, {parentSessionID, subagentType}>` with a 30s cleanup would replace the 312 LOC implementation. The current version has 3 reverse indices, `getAnyActiveEntry()`, `updateWithChildID()`, and stale detection — over-engineered for what's fundamentally a temporary race window.

**Verdict:** Conceptually needed. Implementationally over-engineered by ~2x.

---

## 4. Prompt-Packet Analysis — The 348 LOC Orphan

**Status:** DESIGNED_ONLY — never wired into plugin.ts, coordination, or any tool.

**How it happened:**
Prompt-packet (`kernel-packet.ts`, `delegation-packet.ts`, `compaction-preservation.ts`) was designed as part of an earlier session continuity architecture. The `KernelPacket` type (46 fields) was meant to carry session context across process boundaries and compaction events.

The session-tracker implementation (`CP-ST-*` phases) took a different approach — hook-driven capture to `.md` and `.json` files. Session compaction is handled by `event-capture.ts`'s `handleSessionCompacted()`, which writes directly to the session `.md` file. The prompt-packet approach was superseded but never removed.

**Wasted LOC calculation:**
- 348 LOC of dead TypeScript code
- plus ~41 LOC AGENTS.md documentation
- plus the `SessionContinuityRecord` type in `shared/types.ts` that only prompt-packet uses
- **Total wasted: ~400 LOC**

**Could it be resurrected?** Theoretically, `createKernelPacket()` could be used by `src/coordination/` to prepare delegation context. But the delegation dispatch path already builds its own context. The packet format (46 fields) would need to be reconciled with the current delegation architecture — a non-trivial effort with unclear benefit.

---

## 5. Unwired/Half-Wired Code Summary

| Feature/Module | LOC | Status | Waste |
|---------------|-----|--------|-------|
| `prompt-packet/` (all 4 files) | 348 | DESIGNED_ONLY — zero consumers | 100% wasted |
| `session-tracker/hooks/session-classification-hook.ts` | 76 | DESIGNED — never connected | 100% wasted |
| `session-tracker/transform/schema-normalizer.ts` | 155 | Defined — never imported | 100% wasted |
| **Total definitively wasted** | **579** | | |
| `PendingDispatchRegistry` over-engineering | ~150 | Used but over-engineered | ~50% excess |

---

## 6. Per-Feature Quality Scores

| Feature | Design | CQRS | Test Coverage | LOC Discipline | Wired | Score |
|---------|--------|------|---------------|----------------|-------|-------|
| auto-loop | A | N/A | A | A | A | **A** |
| ralph-loop | A | N/A | A | A | A | **A** |
| bootstrap | B | N/A | B | A | A | **B+** |
| runtime-pressure | B | N/A | D | B | A | **B** |
| doc-intelligence | B | N/A | D | A | A | **B** |
| agent-work-contracts | B | ✅ | D | A | A | **B** |
| background-command | B | N/A | C | A | A | **B** |
| sdk-supervisor | B | N/A | A | B | A | **B** |
| session-tracker | C | ✅ | B | **F** | A | **B-** |
| prompt-packet | C | N/A | D | A | **F** | **C-** |

**Key failures:**
- **session-tracker** loses points on LOC discipline (index.ts 561, event-capture.ts 702) and architectural complexity (27 files, 7,745 LOC)
- **prompt-packet** fails on wiring — zero consumers for 348 LOC of production code
- **Multiple features** have zero test coverage (runtime-pressure, doc-intelligence, agent-work-contracts)

---

## 7. Recommendations

1. **Remove prompt-packet** (348 LOC dead code) or wire it into the delegation pipeline. No middle ground.
2. **Remove `hooks/session-classification-hook.ts`** (76 LOC legacy artifact) — the `handleToolExecuteBefore` pattern has superseded it.
3. **Remove or wire `transform/schema-normalizer.ts`** (155 LOC) — if normalization isn't needed, remove it.
4. **Refactor `event-capture.ts`** (702 LOC) — split into lifecycle/compaction handlers (~400 LOC each).
5. **Refactor `session-tracker/index.ts`** (561 LOC) — at minimum extract the initialization block into the already-existing `initialization.ts`.
6. **Simplify `PendingDispatchRegistry`** — reduce from 3-reverse-index design to a simpler Map pair with periodic cleanup.
7. **Add tests** to runtime-pressure, doc-intelligence, and agent-work-contracts (combined 1,479 LOC of untested code).
8. **Review `isWrapperAvailable()` in sdk-supervisor** — the `|| true` fallbacks make health checks meaningless.
9. **Consider whether `background-command/pty/` belongs in features/** — it's more of an infrastructure utility than a "feature."
