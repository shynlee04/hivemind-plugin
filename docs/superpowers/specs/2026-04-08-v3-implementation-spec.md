# HiveMind V3 — Implementation Specification

**Date**: 2026-04-08
**Status**: SPEC — ready for Phase 3 implementation
**Prerequisites**: Phase 2 cleanup complete (240/240 tests, typecheck clean, build clean)
**Sources**: v3-synthesis-report, architecture-proposal, harness-clean-design, ARCHITECTURE.md

---

## Phase 2 Completion Summary

| Item | Status |
|------|--------|
| Zombie `src/plugins/prompt-enhance.ts` gutted | Done |
| 7 zombie test failures eliminated | Done |
| `package.json` exports fixed (`./plugin` → `./dist/plugin.js`) | Done |
| Phantom `bin.harness` and validate step removed | Done |
| `agent-registry.ts` confirmed zombie (0 production imports) | Documented |
| Result: 240 pass, 0 fail, typecheck clean, build clean | Verified |

---

## Phase 3 — Core Architecture

### 3.1 TaskStateManager Class

**Source**: OMO Pattern 1 (BackgroundManager consolidation)
**File**: `src/lib/state.ts`
**LOC Budget**: 200 (current: 106)

**Problem**: Session state is spread across 4 independent Maps with no cohesion. Functions like `ensureSessionStats()`, `reserveDescendant()`, `forgetSession()` are loose module-level functions.

**Public API**:
```typescript
export class TaskStateManager {
  // Session stats
  ensureStats(sessionID: string): SessionStats
  getStats(sessionID: string): SessionStats | undefined
  addWarning(sessionID: string, message: string): void

  // Root budget tracking
  reserveDescendant(rootID: string, maxDescendants: number): void
  rollbackReservation(rootID: string): void
  getRootBudget(rootID: string): RootBudget | undefined

  // Session-to-root mapping
  setSessionRoot(sessionID: string, rootID: string): void
  getSessionRoot(sessionID: string): string | undefined

  // Delegation metadata
  setDelegationMeta(sessionID: string, meta: DelegationMeta): void
  getDelegationMeta(sessionID: string): DelegationMeta | undefined

  // Subagent registry (OMO Pattern 10)
  registerSubagent(parentID: string, childID: string): void
  getSubagents(parentID: string): Set<string>

  // Cleanup
  forgetSession(sessionID: string): void
  clear(): void
}
```

**Dependency Rules**:
- Imports: `./types.js` only (leaf dependency)
- Imported by: `plugin.ts`, `hooks/*`, `tools/*`, `lifecycle-manager.ts`

**Test Contract** (`tests/lib/state.test.ts` — extend existing):
- TaskStateManager constructs with empty state
- ensureStats creates and returns consistent stats
- reserveDescendant/rollbackReservation are atomic
- registerSubagent tracks parent→children bidirectionally
- forgetSession cleans all Maps including subagent registry
- Warning cap enforced at 25

**Migration**: Export a singleton `export const taskState = new TaskStateManager()`. Existing loose functions become thin wrappers that delegate to the singleton during transition, then are removed.

---

### 3.2 Spawn Reservation System

**Source**: OMO Pattern 2 (atomic reserve/rollback)
**File**: `src/lib/concurrency.ts`
**LOC Budget**: 250 (current: ~150)

**Problem**: Current `reserveDescendant()` in state.ts does reservation but the concurrency queue (`DelegationConcurrencyQueue`) doesn't integrate with it. Race conditions possible when multiple agents spawn simultaneously.

**Public API** (additions to existing module):
```typescript
export interface SpawnReservation {
  readonly parentID: string
  readonly rootID: string
  readonly reservedAt: number
  release(): void
  rollback(): void
}

export function reserveSubagentSpawn(
  parentSessionID: string,
  taskState: TaskStateManager,
  maxDescendants?: number,
): SpawnReservation

// Existing DelegationConcurrencyQueue enhanced:
export class DelegationConcurrencyQueue {
  acquire(key: string, reservation: SpawnReservation): Promise<() => void>
  // ... existing methods
}
```

**Dependency Rules**:
- Imports: `./types.js`, `./state.js`
- Imported by: `plugin.ts` (delegate-task tool)

**Test Contract** (`tests/lib/concurrency.test.ts` — new file):
- reserveSubagentSpawn creates reservation atomically
- reservation.rollback() restores budget
- reservation.release() is idempotent
- Concurrent reservations against same root are serialized
- Exceeding MAX_DESCENDANTS_PER_ROOT throws with `[Harness]` prefix

---

### 3.3 Dual-Signal Completion Verification

**Source**: OMO Pattern 3 (stability window)
**File**: `src/lib/completion-detector.ts`
**LOC Budget**: 250 (current: ~200)

**Problem**: Current implementation has two-signal detection but may not match OMO's stability window (message count unchanged for 10s across 3+ polls at 3s intervals). Bug F3: `feedMessageCount` has no fallback when message count is unavailable.

**Public API** (modifications):
```typescript
export interface CompletionDetectorConfig {
  stabilityTimeoutMs: number    // default: 10000
  stabilityPollIntervalMs: number  // default: 3000
  stabilityPollCount: number    // default: 3
  watchTimeoutMs: number        // default: 180000
}

export class CompletionDetector {
  constructor(config?: Partial<CompletionDetectorConfig>)
  watch(sessionID: string, timeoutMs?: number): Promise<CompletionResult>
  feed(sessionID: string, event: TerminalEvent): void
  feedMessageCount(sessionID: string, count: number): void  // Bug F3: graceful no-op if count is NaN/undefined
  cancel(sessionID: string): void
}
```

**Bug F3 Fix**: `feedMessageCount()` must guard against `NaN`, `undefined`, and negative values. Return early without updating state if count is invalid.

**Test Contract** (`tests/lib/completion-detector.test.ts` — extend existing):
- Stability window requires N consecutive stable polls before resolving
- feedMessageCount with NaN/undefined/negative is a no-op (Bug F3)
- Terminal event during stability window resolves immediately
- Timeout resolves as `"timeout"` after watchTimeoutMs

---

### 3.4 Hook Factory Pattern

**Source**: OMO Pattern 5 (createCoreHooks, createSessionHooks, createToolGuardHooks)
**Files**:
- `src/hooks/create-core-hooks.ts` (NEW — 150 LOC)
- `src/hooks/create-session-hooks.ts` (NEW — 150 LOC)
- `src/hooks/create-tool-guard-hooks.ts` (NEW — 150 LOC)
- `src/plugin.ts` (REFACTOR — 467 → <100 LOC)

**Problem**: `plugin.ts` is a 467 LOC monolith containing inline hook logic, tool definitions, circuit breaker, event handling, and delegation. Target is <100 LOC assembly-only.

**Public API**:
```typescript
// src/hooks/create-core-hooks.ts
export function createCoreHooks(deps: HookDependencies): CoreHooks
// Returns: event handler, system.transform, messages.transform

// src/hooks/create-session-hooks.ts
export function createSessionHooks(deps: HookDependencies): SessionHooks
// Returns: experimental.session.compacting, session lifecycle handlers

// src/hooks/create-tool-guard-hooks.ts
export function createToolGuardHooks(deps: HookDependencies): ToolGuardHooks
// Returns: tool.execute.before (circuit breaker + budget), tool.execute.after (metadata)

// src/hooks/types.ts (NEW)
export interface HookDependencies {
  taskState: TaskStateManager
  lifecycleManager: HarnessLifecycleManager
  completionDetector: CompletionDetector
  concurrencyQueue: DelegationConcurrencyQueue
  log: (msg: string) => void
}
```

**Refactored plugin.ts** (~80 LOC):
```typescript
export const HarnessControlPlane: Plugin = async (client) => {
  const taskState = new TaskStateManager()
  const lifecycleManager = createHarnessLifecycleManager(/* ... */)
  const completionDetector = new CompletionDetector()
  const concurrencyQueue = new DelegationConcurrencyQueue()

  const deps: HookDependencies = { taskState, lifecycleManager, completionDetector, concurrencyQueue, log: client.app.log }

  return {
    ...createCoreHooks(deps),
    ...createSessionHooks(deps),
    ...createToolGuardHooks(deps),
    tool: {
      "delegate-task": createDelegateTaskTool(deps),
      "prompt-skim": createPromptSkimTool(client.app.directory),
      "prompt-analyze": createPromptAnalyzeTool(client.app.directory),
      "session-patch": createSessionPatchTool(client.app.directory),
    },
  }
}
```

**Dependency Rules**:
- `src/hooks/types.ts` — leaf (type definitions only)
- `src/hooks/create-*.ts` — imports types.ts, lib/state.ts, lib/helpers.ts
- `src/plugin.ts` — imports all hook factories + tool factories (assembly only)

**Test Contract**:
- `tests/hooks/create-core-hooks.test.ts` — event routing, system transform injection, messages transform
- `tests/hooks/create-session-hooks.test.ts` — compaction handling, lifecycle patching
- `tests/hooks/create-tool-guard-hooks.test.ts` — circuit breaker trips, budget enforcement, warning accumulation
- Existing `tests/integration/prompt-enhance-pipeline.test.ts` must still pass (regression)

---

### 3.5 Signature-Based Circuit Breaker

**Source**: OMO Pattern 9 (toolName::JSON(sortedInput) tracking)
**File**: `src/hooks/create-tool-guard-hooks.ts` (embedded in tool guard factory)
**LOC Budget**: included in 3.4's 150 LOC

**Problem**: Current circuit breaker uses simple consecutive signature match. OMO's approach is smarter: `makeToolSignature(toolName, args)` creates `toolName::stableStringify(args)`.

**Current state**: `makeToolSignature()` already exists in `src/lib/helpers.ts`. The circuit breaker logic in `plugin.ts` (lines 110-145) already uses it. This is mostly a migration task: move the logic into the hook factory.

**Public API**: No new public API — the circuit breaker becomes internal to `createToolGuardHooks()`.

**Test Contract** (in `tests/hooks/create-tool-guard-hooks.test.ts`):
- Same tool+args ≥16 consecutive times → throws `[Harness] Circuit breaker tripped`
- Different tool resets counter
- Same tool with different args resets counter
- Budget exceeded → throws `[Harness] Session exceeded the tool call budget`

---

### 3.6 Delete Zombie agent-registry.ts

**File**: `src/lib/agent-registry.ts` (DELETE — 112 LOC)
**Test**: `tests/lib/agent-registry.test.ts` (DELETE)
**Export**: Remove `export * from "./lib/agent-registry.js"` from `src/index.ts`

**Rationale**: Zero production imports confirmed in Phase 2. Handwritten YAML parser is fragile. Agent configuration will be handled by the category system (Phase 4e) using proper typed config, not YAML parsing.

---

### 3.7 Bug F1 — Transition Guard

**Source**: harness-clean-design (Bug F1)
**File**: `src/lib/lifecycle-manager.ts`

**Problem**: Missing transition guard — invalid phase transitions are silently accepted. A session in `completed` phase can be moved back to `running`.

**Fix**: Add `isValidTransition(from: SessionLifecyclePhase, to: SessionLifecyclePhase): boolean` guard. Reject invalid transitions with `[Harness]` warning (soft policy, not hard block per D-04).

**Valid transitions** (from types.ts):
```
created → queued | dispatching
queued → dispatching
dispatching → running
running → completed | failed
```

**Test Contract** (`tests/lib/lifecycle-manager.test.ts` — new file):
- Valid transitions accepted
- Invalid transitions logged as warning, not applied
- Terminal phases (completed, failed) reject all transitions

---

## Phase 4 — Runtime Features

### 4a. Background Agents

**Source**: OMO BackgroundManager + opencode-pty research (Path B: child_process.spawn)
**Files**:
- `src/lib/background-manager.ts` (NEW — 300 LOC)
- `src/tools/background/index.ts` (NEW — tool definition)

**Public API**:
```typescript
export class BackgroundManager {
  spawn(config: BackgroundAgentConfig): Promise<BackgroundTask>
  getTask(taskID: string): BackgroundTask | undefined
  listTasks(): BackgroundTask[]
  kill(taskID: string): void
  onComplete(taskID: string): Promise<BackgroundResult>
}

export interface BackgroundAgentConfig {
  command: string
  args: string[]
  cwd: string
  env?: Record<string, string>
  timeout?: number  // default: 300000 (5min)
  parentSessionID: string
}

export interface BackgroundTask {
  id: string
  status: "running" | "completed" | "failed" | "killed"
  pid: number
  startedAt: number
  stdout: string  // ring buffer, last 10KB
  stderr: string  // ring buffer, last 10KB
}
```

**Data Flow**:
```
LLM calls background-spawn tool
  → BackgroundManager.spawn() acquires SpawnReservation
    → child_process.spawn() with stdio: 'pipe'
      → stdout/stderr collected in ring buffers
      → CompletionDetector.watch() monitors exit
        → On exit: notifyParentSession(), releaseReservation()
```

**Dependency Rules**:
- Imports: `node:child_process`, `./types.js`, `./state.js`, `./concurrency.js`, `./completion-detector.js`
- Imported by: `plugin.ts` (tool registration)

**Test Contract** (`tests/lib/background-manager.test.ts`):
- spawn() creates child process and returns task
- stdout/stderr captured in ring buffer (truncated at 10KB)
- kill() sends SIGTERM, then SIGKILL after 5s
- timeout kills process after configured duration
- onComplete() resolves with exit code and output
- spawn() acquires reservation, kill() releases it

---

### 4b. Auto-Loop / Ralph-Loop

**Source**: OMO Pattern 8 (ralph-loop-as-hook)
**File**: `src/hooks/create-session-hooks.ts` (extend, +80 LOC)

**Mechanism**: Implements a retry loop as a session-tier hook. When an agent's output doesn't contain `<promise>DONE</promise>`, the hook re-dispatches the prompt with accumulated context.

**Public API**:
```typescript
export interface AutoLoopConfig {
  maxIterations: number     // default: 5
  completionSignal: string  // default: "<promise>DONE</promise>"
  backoffMs: number         // default: 1000
}
```

**Data Flow**:
```
Agent completes turn
  → session hook checks output for completionSignal
    → If found: mark session completed, stop
    → If not found AND iterations < max:
      → Re-inject context + retry count into prompt
      → Re-dispatch via sendPrompt()
    → If iterations >= max: mark failed, warn
```

**Test Contract** (in `tests/hooks/create-session-hooks.test.ts`):
- Loop terminates when `<promise>DONE</promise>` found
- Loop stops at maxIterations
- Retry count injected into re-dispatch context
- Backoff delay applied between iterations

---

### 4c. Delegation Chain with Artifact Format

**Source**: opencode-conductor lifecycle artifact structure
**File**: `src/lib/continuity.ts` (extend, +100 LOC)

**Enhancement**: Delegation packets adopt Conductor's artifact structure. Each delegation writes structured artifacts to the continuity store.

**Wire Format** (stored in continuity JSON):
```typescript
export interface DelegationPacket {
  spec: string          // task description (from delegate-task tool)
  plan: string | null   // agent's plan (populated after agent starts)
  artifacts: string[]   // file paths created/modified
  commits: string[]     // commit SHAs
  parentChain: string[] // [rootID, ...intermediateIDs, thisID]
  status: "pending" | "running" | "completed" | "failed"
}
```

**Test Contract** (`tests/lib/continuity.test.ts` — extend existing):
- DelegationPacket roundtrips through JSON serialize/deserialize
- parentChain correctly walks delegation hierarchy
- Artifact list updated on session patch events

---

### 4d. Task Queuing

**Source**: OMO per-key FIFO queue + spawn reservations
**File**: `src/lib/concurrency.ts` (extend, +80 LOC)

**Enhancement**: The existing `DelegationConcurrencyQueue` gains task queue semantics. Agents can enqueue tasks that execute in order when slots become available.

**Public API** (additions):
```typescript
export interface QueuedTask {
  id: string
  key: string
  priority: number  // 0 = normal, 1 = high
  createdAt: number
  config: DelegationConfig
}

export class DelegationConcurrencyQueue {
  // Existing
  acquire(key: string): Promise<() => void>
  // New
  enqueue(task: QueuedTask): void
  dequeue(key: string): QueuedTask | undefined
  peek(key: string): QueuedTask | undefined
  queueSize(key: string): number
}
```

**Test Contract** (`tests/lib/concurrency.test.ts`):
- FIFO ordering per key
- Priority tasks dequeue before normal
- Queue size accurately tracked
- dequeue returns undefined when empty

---

### 4e. Category System

**Source**: OMO Pattern 10 (model fallback chains)
**File**: `src/lib/categories.ts` (NEW — 150 LOC)

**Public API**:
```typescript
export type DelegationCategory =
  | "research" | "implementation" | "review"
  | "visual-engineering" | "deep" | "quick"

export interface CategoryConfig {
  model: string
  fallbackChain: string[]
  temperature: number
  maxTokens: number
  toolProfile: "researcher" | "builder" | "critic"
}

export const CATEGORY_DEFAULTS: Record<DelegationCategory, CategoryConfig>

export function resolveModel(
  category: DelegationCategory,
  agentOverride?: string,
): string  // returns first available model in chain
```

**Dependency Rules**:
- Imports: `./types.js` only
- Imported by: `plugin.ts` (delegate-task tool), `src/hooks/create-core-hooks.ts`

**Test Contract** (`tests/lib/categories.test.ts`):
- Each category has a valid default config
- resolveModel falls back through chain
- Agent override takes precedence over category default
- Unknown category throws with `[Harness]` prefix

---

### 4f. Session Recovery

**Source**: OMO Pattern 4 (compaction checkpoint system)
**File**: `src/lib/compaction-checkpoint.ts` (NEW — 200 LOC)

**Public API**:
```typescript
export interface CheckpointData {
  agent: string
  model: string
  tools: string[]
  delegationMeta: DelegationMeta | null
  warnings: string[]
  sessionStats: Partial<SessionStats>
  capturedAt: number
}

export function captureCheckpoint(
  sessionID: string,
  taskState: TaskStateManager,
): CheckpointData

export function restoreCheckpoint(
  checkpoint: CheckpointData,
  taskState: TaskStateManager,
): void

export function formatCheckpointContext(
  checkpoint: CheckpointData,
): string  // Markdown-formatted for injection into compaction output
```

**Data Flow**:
```
experimental.session.compacting hook fires
  → captureCheckpoint() snapshots agent/model/tools/meta/warnings
  → Checkpoint stored in continuity JSON
  → formatCheckpointContext() → injected into output.context[]

On session resume after compaction:
  → restoreCheckpoint() rehydrates TaskStateManager
  → Agent continues with full metadata awareness
```

**Test Contract** (`tests/lib/compaction-checkpoint.test.ts`):
- captureCheckpoint produces complete snapshot
- restoreCheckpoint rehydrates state accurately
- formatCheckpointContext produces valid Markdown
- Checkpoint roundtrips through JSON (serialize/deserialize)

---

## Phase 5 — Integration

### E2E Test Contracts

**File**: `tests/integration/v3-e2e.test.ts` (NEW)

| Test | Verifies |
|------|----------|
| Full delegation flow | delegate-task → spawn reservation → queue acquire → sendPrompt → completion detect → notify parent |
| Background agent lifecycle | spawn → stdout capture → exit → notify → cleanup |
| Auto-loop termination | dispatch → no DONE → retry → DONE → complete |
| Category resolution | category config → model fallback → permission scoping |
| Compaction recovery | checkpoint → compaction → restore → verify state intact |
| Circuit breaker + budget | 16 identical calls → trip; 400 total → budget exceeded |

### Plugin Verification Checklist

- [ ] `npm run typecheck` — 0 errors
- [ ] `npx vitest run` — all tests pass, 0 failures
- [ ] `npm run build` — clean build, dist/ populated
- [ ] `plugin.ts` < 100 LOC
- [ ] Total codebase 4,000-5,000 LOC
- [ ] No circular dependencies
- [ ] All modules < 500 LOC
- [ ] `import "opencode-harness"` resolves correctly
- [ ] `import "opencode-harness/plugin"` resolves correctly

---

## Dependency Graph

```
                    ┌─────────────┐
                    │  plugin.ts  │  <100 LOC, assembly only
                    │ (composition)│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  hooks/   │   │  tools/   │   │  tools/   │
    │ factories │   │ delegate  │   │ prompt-*  │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │                │                │
    ┌─────▼────────────────▼────────────────▼─────┐
    │                  src/lib/                     │
    │  ┌──────────────┐  ┌──────────────────┐      │
    │  │TaskStateManager│  │ lifecycle-manager │     │
    │  └──────┬───────┘  └────────┬─────────┘      │
    │         │                   │                 │
    │  ┌──────▼───────┐  ┌───────▼──────────┐      │
    │  │ concurrency  │  │ completion-detect │      │
    │  └──────┬───────┘  └────────┬─────────┘      │
    │         │                   │                 │
    │  ┌──────▼───────┐  ┌───────▼──────────┐      │
    │  │ continuity   │  │background-manager│      │
    │  └──────┬───────┘  └─────────────────┘       │
    │         │                                    │
    │  ┌──────▼───────┐  ┌──────────────┐          │
    │  │   runtime    │  │  categories  │          │
    │  └──────────────┘  └──────────────┘          │
    └──────────────────────────────────────────────┘
                           │
    ┌──────────────────────▼───────────────────────┐
    │              src/lib/types.ts                 │
    │         (LEAF — no imports, no deps)          │
    └──────────────────────────────────────────────┘
                           │
    ┌──────────────────────▼───────────────────────┐
    │           src/shared/* (LEAF)                 │
    │   tool-helpers.ts  │  tool-response.ts       │
    └──────────────────────────────────────────────┘
                           │
    ┌──────────────────────▼───────────────────────┐
    │         src/schema-kernel/* (LEAF)            │
    │        Zod contracts for tool outputs         │
    └──────────────────────────────────────────────┘
```

---

## Success Criteria

### Gate 1 — Phase 3 Complete
- [ ] TaskStateManager class replaces loose Map functions
- [ ] plugin.ts refactored to <100 LOC via hook factories
- [ ] Circuit breaker + budget in tool guard hooks
- [ ] Spawn reservation system with atomic rollback
- [ ] Completion detector has stability window + feedMessageCount guard (Bug F3)
- [ ] Lifecycle manager has transition guard (Bug F1)
- [ ] agent-registry.ts deleted (zombie)
- [ ] All existing tests pass + new tests for each module
- [ ] `npm run typecheck && npm test && npm run build` all clean

### Gate 2 — Phase 4 Complete
- [ ] Background agents spawn/kill/monitor via child_process
- [ ] Auto-loop retries until `<promise>DONE</promise>` or max iterations
- [ ] Delegation packets use Conductor wire format
- [ ] Task queue with FIFO ordering and priority support
- [ ] Category system resolves models with fallback chains
- [ ] Session recovery checkpoints survive compaction
- [ ] Each feature has dedicated test file

### Gate 3 — Phase 5 Complete (Ship-Ready)
- [ ] E2E integration test covers full delegation → completion flow
- [ ] Plugin loads and registers in OpenCode without errors
- [ ] Total codebase 4,000-5,000 LOC
- [ ] Zero circular dependencies
- [ ] All modules < 500 LOC
- [ ] `npm pack` produces valid package

---

*Spec authored: 2026-04-08. Supersedes all prior implementation plans.*
