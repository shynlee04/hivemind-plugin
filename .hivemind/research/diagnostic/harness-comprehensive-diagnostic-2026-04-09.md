# HiveMind V3 Harness — Comprehensive Diagnostic Report

**Date:** 2026-04-09
**Scope:** Full `src/` codebase (49 files, ~7,719 LOC) + Session export `tools_hooks_session.md` (3,074 lines)
**Method:** 5 parallel specialist subagents (Tools, Hooks, Lifecycle Lib, Composition Root, Session Export)
**Status:** COMPLETE

---

## Executive Summary

The HiveMind V3 harness codebase is **architecturally sound** — clean separation of concerns, zero TODOs/FIXMEs across all 49 source files, consistent error handling, and successful reduction of plugin.ts from 447 LOC to 56 LOC. However, **one critical runtime bug** was discovered through session export analysis: the background task delegation system systematically fails — tasks dispatch successfully but immediately disappear from tracking. Additionally, 8 code-level issues and 12 architectural observations were identified.

---

## 🔴 CRITICAL: Background Task Delegation Failure

### What Happened (from session export)

In the `tools_hooks_session.md` session, the agent attempted to dispatch 2 background tasks (Pair Mapper + Edge Case Analyst) for Cycle 2 of a skills audit. **Four consecutive attempts across 2 dispatch rounds all failed identically:**

| Attempt | Line | Task ID | delegate-task Result | background status |
|---------|------|---------|---------------------|-------------------|
| 1A | 2488 | `bg_1_1775681398648` | `ok: true, phase: running` | ❌ Not found (line 2729) |
| 1B | 2550 | `bg_2_1775681398663` | `ok: true, phase: running` | ❌ Not found (line 2744) |
| 2A | 2811 | `bg_3_1775681480968` | `ok: true, phase: running` | ❌ Not found (line 2969) |
| 2B | 2873 | `bg_4_1775681481022` | `ok: true, phase: running` | ❌ Not found (line 2985) |

### Root Cause Analysis

The `delegate-task` tool and `background` tool use **completely separate tracking systems**:

1. **`delegate-task`** → calls `lifecycleManager.launchDelegatedSession()` → which uses `builtin-process` submode (since tmux unavailable) → spawns a Node.js child process via `BackgroundManager.spawn()`
2. **`background` tool** → reads from `BackgroundManager`'s internal task Map via `backgroundManager.listTasks(sessionID)`

**The disconnect:** `launchDelegatedSession()` in `lifecycle-manager.ts` creates the process through `runLifecycleProcessTask()` which calls `backgroundManager.spawn()`. The spawn returns a `BackgroundTask` snapshot. But the `background` tool only sees tasks that are registered against the **current session ID**. The lifecycle manager's background process runs under a **different session context** (the delegated child session), so `listTasks(sessionID)` with the parent's session ID returns nothing.

**Files involved:**
- `src/tools/delegate-task.ts` (lines 233-259) — dispatch flow
- `src/lib/lifecycle-manager.ts` (lines 205-394) — `launchDelegatedSession()`
- `src/lib/lifecycle-process-runner.ts` (lines 142-206) — `runLifecycleProcessTask()`
- `src/lib/background-manager.ts` (lines 352) — `spawn()` and `listTasks()`
- `src/tools/background/index.ts` (lines 91-97) — `listTasks(sessionID)`

**Additional evidence:** `background list` returned empty `[]` (line 2643) even immediately after successful dispatches.

### Impact
- **No background/parallel delegation possible** in this environment
- All 4 Cycle 2 tasks (pair mapping + edge case analysis) never completed
- The final fallback to `task` tool also failed with `Tool execution aborted` (lines 3052, 3068)

---

## 🟠 HIGH: Code-Level Bugs Found in src/

### Bug 1: `session-patch` old_value Always Empty
- **File:** `src/tools/session-patch/tools.ts`, line 85
- **What:** Regex captures only the heading text, then strips the heading → `old_value` is always `""`
- **Impact:** Audit trail is broken — no record of what was replaced
- **Fix:** Capture section body separately (two regex groups)

### Bug 2: `background` cancel Race Condition
- **File:** `src/tools/background/index.ts`, lines 106-115
- **What:** After `backgroundManager.kill()`, re-reads task via `getOwnedTask()`. If `kill()` removes the task from internal storage, the re-read throws `[Harness] Background task not found.`
- **Impact:** Successful cancel masked as error
- **Fix:** Return the pre-kill task snapshot instead of re-reading

### Bug 3: `helpers.ts:unwrapData` Missing `[Harness]` Prefix
- **File:** `src/lib/helpers.ts`, line 25
- **What:** Throws plain `Error(message)` without the `[Harness]` prefix
- **Impact:** Inconsistent error branding — this error won't be recognizable as a harness error
- **Fix:** Change to `throw new Error(\`[Harness] \${message}\`)`

### Bug 4: `types.ts` Not a True Leaf Module
- **File:** `src/lib/types.ts`, line 1
- **What:** `import type { TaskStatus } from "./task-status.js"` — violates AGENTS.md claim "leaf — depends on nothing"
- **Impact:** Documentation inaccuracy, minor architectural concern (type-only import, no runtime cycle)
- **Fix:** Update AGENTS.md or move `TaskStatus` into types.ts

---

## 🟡 MEDIUM: Architectural Observations

### 1. AGENTS.md is Stale
AGENTS.md references constants that **no longer exist** in plugin.ts:
- `CIRCUIT_BREAKER_THRESHOLD` → now `DEFAULT_RUNTIME_POLICY.budget.repeatedSignatureThreshold` in `runtime-policy.ts`
- `MAX_TOOL_CALLS_PER_SESSION` → now `DEFAULT_RUNTIME_POLICY.budget.maxToolCallsPerSession` in `runtime-policy.ts`
- `AGENT_DEFAULTS` → now `CATEGORY_DEFAULTS` in `categories.ts`
- `AGENT_TOOLS` → now `AGENT_TOOLS` in `delegate-task.ts` (still exists but moved)

### 2. Duplicated Code: `formatRuntimeInjectionBlock`
**Identical 36-line function** in two files:
- `src/hooks/create-core-hooks.ts` lines 31-67
- `src/hooks/create-session-hooks.ts` lines 47-83

### 3. Unbounded Maps (Memory Leak Risk)
| Map | File | Growth Pattern |
|-----|------|----------------|
| `autoLoopStates` | `create-session-hooks.ts` | Only pruned on completion signal. Sessions that never complete leave entries forever. |
| `recentGovernance` | `create-tool-guard-hooks.ts` | Consumed by `after` handler, but entries persist if `after` never fires |
| `pendingInvocationKeys` | `create-tool-guard-hooks.ts` | Same — consumed by `after`, persists if `after` never fires |
| `governance violations` | `governance-engine.ts` | Appended on every evaluation match. No pruning/trimming. |

### 4. 14 lib Modules Not Re-exported from `index.ts`
Internal implementation modules hidden from public API. Likely intentional but should be documented:
`categories.ts`, `delegation-packet.ts`, `delegation-export.ts`, `specialist-router.ts`, `governance-engine.ts`, `injection-engine.ts`, `compaction-checkpoint.ts`, `execution-mode.ts`, `background-manager.ts`, `session-recovery.ts`, `continuity-normalizers.ts`, `continuity-clone.ts`, and 4 lifecycle-*.ts splits.

### 5. `ContextBudgetRecordSchema` Defined But Unused
- **File:** `src/schema-kernel/prompt-enhance.schema.ts`, lines 83-93
- **What:** Schema exists for a planned `context-budget` tool that was never implemented

### 6. `EnhancedPromptOutputSchema` and `PipelineStateSchema` — Infrastructure Without Implementation
- **File:** `src/schema-kernel/prompt-enhance.schema.ts`
- **What:** Full 6-phase pipeline state schema + output schema defined, but no tool currently produces them

### 7. `SessionPatchAction` and `PromptSkimAction` Types Defined But Never Used
- **Files:** `src/tools/session-patch/types.ts`, `src/tools/prompt-skim/types.ts`
- **What:** Type = `"execute"` defined but never referenced in any code

### 8. No `isPending()` Type Guard in `tool-response.ts`
- **File:** `src/shared/tool-response.ts`
- **What:** `isSuccess()` and `isError()` exist but `isPending()` does not, despite `kind: "pending"` being a valid value

### 9. `compaction-checkpoint.ts` Shallow Clones DelegationMeta
- **File:** `src/lib/compaction-checkpoint.ts`
- **What:** Uses spread operator for DelegationMeta clone — will break if DelegationMeta gets nested objects

### 10. `O(n²)` Cross-line Contradiction Detection
- **File:** `src/tools/prompt-analyze/tools.ts`, lines 102-129
- **What:** Pairwise comparison of all lines for contradictions. Acceptable for typical prompts (<200 lines) but could degrade on large inputs.

### 11. `specialist-router.ts` Keyword Scoring May Be Too Lenient
- **File:** `src/lib/specialist-router.ts`, lines 83-87
- **What:** Requires score ≥ 2 AND strictly higher than second-best. Single-keyword descriptions may fall through to `generalist-builder` fallback.

### 12. `concurrency.ts` Spawn Reservation Has No Timeout
- **File:** `src/lib/concurrency.ts`
- **What:** `reserveSubagentSpawn()` creates a reservation but has no automatic expiry. If `commitDescendant()` or `rollbackReservation()` is never called, the slot is permanently consumed.

---

## ✅ Achievements Confirmed

| Achievement | Evidence |
|------------|----------|
| **plugin.ts under 100 LOC** | 56 lines — pure composition root with zero business logic |
| **Zero TODOs/FIXMEs** | None found across all 49 source files |
| **Consistent `[Harness]` error prefix** | 15+ error sites use the prefix (1 exception: helpers.ts:unwrapData) |
| **Clean dependency graph** | Max 3 levels deep, no circular dependencies |
| **Well-structured type system** | 312 LOC in types.ts covering 27+ domain types |
| **Security hardening** | Command allowlist, CWD constraints, SIGTERM→SIGKILL safety net in background-manager |
| **Dual-layer state** | In-memory Maps (state.ts) + durable JSON (continuity.ts) with deep-clone-on-read |
| **6-phase lifecycle state machine** | `created → queued → dispatching → running → completed/failed` with validated transitions |

---

## Complete Module Inventory

### Tools (5 tool groups, 15 files, ~1,022 LOC)
| Tool | LOC | Features |
|------|-----|----------|
| `delegate-task` | 262 | Delegation with depth limit (3), agent permissions, category routing, execution mode classification |
| `session-patch` | 128 | Section replacement in session-context-prompt.md with backup and schema validation |
| `prompt-skim` | 109 | Complexity scoring (1-10), URL/path extraction, risk assessment |
| `prompt-analyze` | 178 | Per-line analysis (absolutes, vagueness, scope, contradictions), clarity scoring |
| `background` | 134 | Spawn/list/status/cancel/wait for background child processes |
| `schema-kernel` | 193 | 7 Zod schemas for pipeline validation |
| `shared` | 80 | ToolResponse type, render helpers |

### Hooks (5 files, 918 LOC)
| Hook | Events | Purpose |
|------|--------|---------|
| `tool-guard` | `tool.execute.before/after` | Governance, budget (400 calls), circuit breaker (16 signatures) |
| `session` | `event`, `experimental.session.compacting` | Auto-loop retry (5 iterations), compaction checkpoint injection |
| `core` | `event`, `system.transform`, `experimental.chat.system.transform`, `messages.transform`, `shell.env` | Event routing, runtime injection, prompt-enhance detection, non-interactive shell |
| `messages-transform` | (called by core) | Prompt-enhance trigger detection + context packet injection |

### Core Lib (29 files, ~5,703 LOC)
| Module | LOC | Role |
|--------|-----|------|
| `lifecycle-manager` | 478 | Central orchestrator — delegation, event routing, lifecycle transitions |
| `continuity-normalizers` | 556 | Strict validation of all persisted records (19 normalizer functions) |
| `background-manager` | 352 | Child process management with security hardening |
| `concurrency` | 298 | Keyed FIFO semaphore + spawn reservation |
| `delegation-packet` | 254 | Packet lifecycle with status transitions |
| `governance-engine` | 275 | Rule evaluation, escalation, blocking |
| `injection-engine` | 267 | 3 injection candidates with governance integration |
| `types` | 312 | 27+ shared types, 3 constants |
| `runtime-policy` | 213 | Default policy (400 calls, 16 circuit breaker) |
| `execution-mode` | 195 | Task characteristic → execution submode mapping |
| `lifecycle-process-runner` | 319 | Sync/async execution for builtin-process and builtin-subsession |
| `compaction-checkpoint` | 151 | State capture before context compaction |
| `categories` | 120 | 6 delegation categories with model/temp/tool profiles |
| `specialist-router` | 164 | Agent selection via explicit/category/keyword scoring |
| `state` | 251 | 5 in-memory Maps, singleton TaskStateManager |
| `continuity` | 303 | Durable JSON persistence with deep-clone-on-read |
| `session-recovery` | 173 | Risk assessment for interrupted sessions |
| `session-api` | 120 | Typed SDK wrappers with cycle detection |
| `completion-detector` | 124 | Two-signal detection (event + stability timer) |
| `notification-handler` | 85 | Best-effort parent notification on completion |
| `continuity-clone` | 128 | Deep-clone utilities for all continuity structures |
| `helpers` | 121 | 8 pure utility functions |
| `runtime` | 69 | Event → status inference |
| `lifecycle-queue` | 139 | Priority queue with FIFO semaphore acquire/release |
| `lifecycle-state` | 123 | Phase transitions, status mapping |
| `lifecycle-runtime-policy` | 69 | Concurrency resolution with audit metadata |
| `lifecycle-background-observer` | 151 | Background session completion watcher |
| `delegation-export` | 89 | Export delegation packets to disk |
| `task-status` | 21 | Task status enum and transition map |

---

## Session Export Error Timeline (tools_hooks_session.md)

```
Line 2442: ❌ E1 — delegate-task: Invalid category "analysis"
Line 2459: ❌ E2 — delegate-task: Invalid category "analysis"
Line 2729: ❌ E3 — background status: bg_1 not found (delegate-task said ok)
Line 2744: ❌ E4 — background status: bg_2 not found (delegate-task said ok)
Line 2969: ❌ E5 — background wait: bg_3 not found (delegate-task said ok)
Line 2985: ❌ E6 — background wait: bg_4 not found (delegate-task said ok)
Line 3052: ❌ E7 — task tool: Tool execution aborted
Line 3068: ❌ E8 — task tool: Tool execution aborted
```

**Pattern:** delegate-task returns success → background tracking empty → task never completes → no output files written.

---

## Recommended Investigation Priority

| Priority | Item | Files |
|----------|------|-------|
| **P0** | Fix background task tracking disconnect | delegate-task.ts, lifecycle-manager.ts, lifecycle-process-runner.ts, background-manager.ts, background/index.ts |
| **P1** | Fix session-patch old_value bug | tools/session-patch/tools.ts:85 |
| **P1** | Fix background cancel race condition | tools/background/index.ts:106-115 |
| **P2** | Add `[Harness]` prefix to unwrapData | lib/helpers.ts:25 |
| **P2** | Update AGENTS.md (stale references) | AGENTS.md |
| **P2** | Extract shared formatRuntimeInjectionBlock | create-core-hooks.ts, create-session-hooks.ts |
| **P3** | Add TTL/size limits to unbounded Maps | create-session-hooks.ts, create-tool-guard-hooks.ts |
| **P3** | Add spawn reservation timeout | concurrency.ts |

---

_Generated: 2026-04-09_
_Method: 5-agent parallel swarm investigation (Tools, Hooks, Lifecycle, Composition Root, Session Export)_
_Total evidence: 49 source files + 3,074-line session export_
