# Phase 6-7 Master Plan: Test Suite Completion & IPC Bridge

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete V3.0 stabilization with 100% test pass rate and implement the IPC bridge for Dashboard-to-Node.js communication.

**Architecture:** 
- **Phase 6**: Fix remaining integration test by updating legacy tool references to 6 canonical tools
- **Phase 7**: Implement append-only JSONL command queue for safe Bun↔Node.js IPC

**Tech Stack:** TypeScript, Node.js, Bun, React/Ink (current), OpenTUI (future), fs.watch, proper-lockfile

---

## Executive Summary

| Phase | Scope | Duration | Risk |
|-------|-------|----------|------|
| Phase 6 | Fix `tests/integration.test.ts` (1 test file) | 30 min | Low |
| Phase 7.1 | IPC Queue Library (`src/lib/ipc-queue.ts`) | 2 hours | Medium |
| Phase 7.2 | Dashboard Integration | 2 hours | Medium |
| Phase 7.3 | Hook Integration + Tests | 2 hours | Medium |

**Total Estimated Duration:** 6.5 hours

---

## Phase 6: Test Suite Completion

### Context

**Current Status:** 125/126 tests passing (99.2%)
**Remaining Failure:** `tests/integration.test.ts` - references 5 deleted legacy tools

### Tool Migration Mapping

| Old Tool | New Tool | Action Parameter |
|----------|----------|------------------|
| `scan_hierarchy` | `hivemind_inspect` | `{ action: "scan" }` |
| `save_anchor` | `hivemind_anchor` | `{ action: "save" }` |
| `think_back` | `hivemind_inspect` | `{ action: "drift" }` |
| `save_mem` | `hivemind_memory` | `{ action: "save" }` |
| `recall_mems` | `hivemind_memory` | `{ action: "recall" }` |

### Task 6.1: Update integration.test.ts Tool References

**Files:** `tests/integration.test.ts`

**Steps:**
1. Update imports to use canonical tools (hivemind-inspect, hivemind-anchor, hivemind-memory)
2. Update tool instantiation (createHivemindInspectTool, createHivemindAnchorTool, createHivemindMemoryTool)
3. Update tool calls with action parameters
4. Update assertions to parse JSON output: `JSON.parse(result).status === "success"`
5. Run: `npx tsx --test tests/integration.test.ts`
6. Commit: `git commit -m "fix: update integration.test.ts to use 6 canonical tools"`

### Rationale for Phase 6

1. **Why update instead of delete:** Integration tests provide critical E2E coverage
2. **Why JSON assertions:** All V3.0 tools return JSON for FK chaining
3. **Risk assessment:** Low - single test file, clear migration path

---

## Phase 7: IPC Bridge Implementation

### Problem Statement

```
Dashboard (Bun)          Node.js SDK (Main Process)
     │                           │
     │  Direct graph-io.ts call  │
     ├──────────────────────────►│
     │         EBUSY LOCK!       │
     │◄─────────────────────────┤
     │         DATA CORRUPTION   │

CAUSE: Cross-runtime file access without coordination
SOLUTION: Unidirectional command queue
```

### Architecture Decision: Append-Only JSONL Queue

**Rationale:**
1. **Atomic appends** - `appendFileSync` is atomic on all platforms
2. **No corruption risk** - Append-only never truncates mid-write
3. **Simple parsing** - One line = one command
4. **Debuggable** - Queue file is human-readable

**Alternatives Considered:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| JSONL Queue | Simple, atomic, debuggable | Requires polling/watch | ✅ CHOSEN |
| Unix Socket | Fast, bidirectional | Platform-specific | ❌ Rejected |
| HTTP Bridge | Language-agnostic | Overkill | ❌ Rejected |
| Shared Database | ACID guarantees | Adds SQLite | ❌ Rejected |

---

## Phase 7.1: IPC Queue Library

### Task 7.1.1: Create Command Types

**Files:** Create `src/schemas/ipc-commands.ts`

```typescript
import { z } from "zod"

export const CommandTypeSchema = z.enum([
  "add_mem",
  "update_task", 
  "compact_session",
  "toggle_drift_monitor",
  "prune_hierarchy",
])

export const CommandSchema = z.object({
  id: z.string().uuid(),
  type: CommandTypeSchema,
  payload: z.record(z.unknown()),
  timestamp: z.number().int().positive(),
  source: z.enum(["dashboard", "cli", "hook"]).default("dashboard"),
})

export type Command = z.infer<typeof CommandSchema>
export type CommandType = z.infer<typeof CommandTypeSchema>
```

### Task 7.1.2: Update Paths

**Files:** Modify `src/lib/paths.ts`

Add to `getEffectivePaths()` return object:
- `systemDir: join(hivemindDir, "system")`
- `commandQueuePath: join(hivemindDir, "system", "cmd_queue.jsonl")`
- `commandQueueLockPath: join(hivemindDir, "system", "cmd_queue.lock")`

### Task 7.1.3: Implement IPC Queue Library

**Files:** Create `src/lib/ipc-queue.ts`

**Key Functions:**
- `enqueueCommand(directory, type, payload)` - Atomic append to queue
- `dequeueCommands(directory)` - Read and parse all commands
- `clearQueue(directory)` - Truncate queue after processing
- `getQueueSize(directory)` - Monitor queue depth

**Implementation Notes:**
- Use `appendFileSync` for atomic appends
- Add `MAX_QUEUE_SIZE = 10000` to prevent runaway growth
- Validate commands with Zod schema

### Rationale for Phase 7.1

1. **Why JSONL:** Atomic appends, no corruption, human-readable
2. **Why UUID per command:** Deduplication and tracing
3. **Why size limit:** Prevent runaway growth from bugs

---

## Phase 7.2: Dashboard Integration

### Task 7.2.1: Create Dashboard IPC Client

**Files:** Create `src/dashboard/ipc-client.ts`

**Key Functions:**
- `initIpcClient(directory)` - Initialize with project root
- `createMemFromDashboard(mem)` - Queue memory creation
- `updateTaskFromDashboard(taskId, updates)` - Queue task update
- `triggerCompactionFromDashboard()` - Queue compaction
- `getPendingCommands()` - Get queue depth for UI feedback

### Task 7.2.2: Update MemCreationModal to Use IPC

**Files:** Modify `src/dashboard/components/MemCreationModal.tsx`

**Change:**
```typescript
// OLD: Direct call (causes EBUSY)
import { addGraphMem } from "../../lib/graph-io.js"
await addGraphMem(projectRoot, memData)

// NEW: Queue-based call
import { createMemFromDashboard } from "../ipc-client.js"
const commandId = createMemFromDashboard(memData)
```

### Rationale for Phase 7.2

1. **Why abstraction layer:** Dashboard components shouldn't know queue implementation
2. **Why command ID in response:** User feedback and debugging
3. **Risk:** Medium - requires testing concurrent access

---

## Phase 7.3: Hook Integration

### Task 7.3.1: Add Queue Processing to Event Handler

**Files:** Modify `src/hooks/event-handler.ts`

**Add:**
```typescript
import { dequeueCommands, clearQueue } from "../lib/ipc-queue.js"

async function processCommandQueue(directory: string): Promise<void> {
  const commands = dequeueCommands(directory)
  for (const cmd of commands) {
    switch (cmd.type) {
      case "add_mem":
        await addGraphMem(directory, cmd.payload)
        break
      case "update_task":
        await updateGraphTask(directory, cmd.payload.taskId, cmd.payload.updates)
        break
      case "compact_session":
        await compactSession(directory)
        break
    }
  }
  clearQueue(directory)
}
```

**Hook Integration Point:** Call `processCommandQueue()` in `session.idle` event

### Task 7.3.2: Add IPC Queue Tests

**Files:** Create `tests/ipc-queue.test.ts`

**Test Cases:**
1. `enqueueCommand` writes to queue file
2. `dequeueCommands` reads all commands
3. `clearQueue` truncates file
4. Concurrent writes don't corrupt data
5. Invalid commands are logged, not crash

### Rationale for Phase 7.3

1. **Why process on session.idle:** Safe point in event loop, no race conditions
2. **Why clear after processing:** Prevent double-processing
3. **Risk:** Medium - concurrent access testing required

---

## Dependency Graph

```
Phase 6 (Test Fix)
    │
    └──► [NO DEPENDENCY] Can start immediately

Phase 7.1 (IPC Library)
    │
    ├──► schemas/ipc-commands.ts (Task 7.1.1)
    ├──► lib/paths.ts (Task 7.1.2)
    └──► lib/ipc-queue.ts (Task 7.1.3) [DEPENDS ON 7.1.1, 7.1.2]

Phase 7.2 (Dashboard)
    │
    └──► dashboard/ipc-client.ts (Task 7.2.1) [DEPENDS ON 7.1.3]
    └──► dashboard/components/MemCreationModal.tsx (Task 7.2.2) [DEPENDS ON 7.2.1]

Phase 7.3 (Hook Integration)
    │
    └──► hooks/event-handler.ts (Task 7.3.1) [DEPENDS ON 7.1.3]
    └──► tests/ipc-queue.test.ts (Task 7.3.2) [DEPENDS ON 7.1.3]
```

---

## Quality Gates

| Phase | Gate Command | Expected |
|-------|--------------|----------|
| Phase 6 | `npm test` | 126/126 pass |
| Phase 7.1 | `npx tsc --noEmit` | No errors |
| Phase 7.2 | `npx tsc --noEmit` | No errors |
| Phase 7.3 | `npx tsx --test tests/ipc-queue.test.ts` | All pass |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Concurrent queue access | Atomic appendFileSync + size limit |
| Queue overflow | MAX_QUEUE_SIZE = 10000 |
| Command processing failure | Try-catch per command, log errors |
| Dashboard shows stale data | Polling interval + queue depth indicator |

---

## Files Summary

| Phase | Files to Create | Files to Modify |
|-------|-----------------|-----------------|
| 6 | - | `tests/integration.test.ts` |
| 7.1 | `src/schemas/ipc-commands.ts`, `src/lib/ipc-queue.ts` | `src/lib/paths.ts` |
| 7.2 | `src/dashboard/ipc-client.ts` | `src/dashboard/components/MemCreationModal.tsx` |
| 7.3 | `tests/ipc-queue.test.ts` | `src/hooks/event-handler.ts` |

---

*Plan created: 2026-02-17*
*Based on scanner/explorer intelligence reports*
