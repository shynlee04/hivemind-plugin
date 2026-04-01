# HiveMind Tools Test Gap Analysis

**Date:** 2026-04-01  
**Scope:** All test files in `tests/` and `src/tools/*.test.ts`  
**Test Runner:** `tsx --test` (Node.js built-in test runner) + `vitest` for integration tests  
**Git Commit:** See `git rev-parse HEAD` at investigation time

---

## Executive Summary

The HiveMind plugin has **12 test files** covering ~1,800 lines of test code. While there is solid unit-level coverage for individual modules, **4 out of 12 official tools have ZERO test coverage**. There are no end-to-end user journey tests, no multi-agent scenario tests, and no complete tool lifecycle tests. This represents a significant gap for LLM-eval stress testing.

---

## Tool Coverage Matrix

| Tool | Unit Tests | Integration Tests | User Journey | Multi-Agent | Lifecycle | Gap Severity |
|------|------------|-------------------|--------------|-------------|-----------|--------------|
| hivemind_doc | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | **CRITICAL** |
| hivemind_task | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | **CRITICAL** |
| hivemind_trajectory | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | **CRITICAL** |
| hivemind_handoff | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | **CRITICAL** |
| hivemind_runtime_status | Partial (rt-tools:151-184) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_runtime_command | Partial (rt-tools:186-220) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_agent_work_create_contract | Partial (rt-tools:103-148) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_agent_work_export_contract | Partial (rt-tools:103-148) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_journal | ✅ Full (src/tools:308 lines) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | MEDIUM |
| hivemind_hm_init | Partial (fiver-tools:42-117) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_hm_doctor | Partial (fiver-tools:123-200) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | HIGH |
| hivemind_hm_setting | ✅ Full (setting/*: 7 files) | ❌ NONE | ❌ NONE | ❌ NONE | ❌ NONE | LOW |

---

## Test File Analysis

### 1. `tests/runtime-tools.test.ts` (220 lines)

**What it covers:**
- Plugin registration of all 12 runtime tools
- Authority synchronization between plugin, managed tools, and catalog
- `hivemind_runtime_status` tool: executable command capabilities
- `hivemind_runtime_command` tool: hm-init redirect behavior

**What it does NOT cover:**
- Actual tool execution with real arguments
- Error conditions during tool execution
- Multi-tool invocation sequences
- User journey scenarios

**Test Level:** Unit-level (mock ToolContext, real filesystem)

---

### 2. `tests/runtime-resilience.test.ts` (412 lines)

**What it covers:**
- Documents 5 silent failure modes in the codebase:
  1. `command.ts:123-143` — Silent null exits in `maybeAutoRecoverEntry`
  2. `workflow-continuity.ts:101-125` — Malformed JSON silently swallowed
  3. `harness.ts` — Shallow harness health inference
  4. `delegation-store.ts` — Silent null returns
  5. `control-plane-registry.ts` — Null returns without status discriminator
- Control plane gate resolution for hm-init, hm-doctor, hm-harness, hm-settings

**What it does NOT cover:**
- These are documentation tests — they describe bugs rather than verify fixes
- No actual error recovery scenarios tested
- No multi-step recovery workflows

**Test Level:** Diagnostic/documentation (observes behavior, doesn't verify fixes)

---

### 3. `tests/integration/tool-invocations.test.ts`

**Status:** **FILE DOES NOT EXIST**

This was planned but never created. This is a CRITICAL gap for LLM-eval stress testing.

---

### 4. `tests/integration/multi-turn-accumulation.test.ts` (167 lines)

**What it covers:**
- Multi-turn accumulation across `handleChatMessage` and `handleTextComplete` handlers
- Turn numbering and ordering
- Counter accuracy (userMessageCount, assistantOutputCount)

**What it does NOT cover:**
- Complete session lifecycle (start → middle → end/compact)
- Tool invocation interleaving with chat messages
- Multi-agent session scenarios
- Error conditions during accumulation

**Test Level:** Integration (vitest, real filesystem, no mocks)
**Evidence:** `tests/integration/multi-turn-accumulation.test.ts:34-99`

---

### 5. `tests/nl-first-dispatch.test.ts` (85 lines)

**What it covers:**
- `maybeExecuteNlFirstRuntimeDispatch` preserving workflow route hints
- Control-plane route preservation without execution

**What it does NOT cover:**
- Actual dispatch execution
- Multi-turn NL-first scenarios
- Error conditions

**Test Level:** Unit-level

---

### 6. `tests/delegation-schema-validation.test.ts` (214 lines)

**What it covers:**
- Delegation record schema validation (reject malformed, accept valid)
- Invalid evidence kind detection
- Validation issue formatting

**What it does NOT cover:**
- Actual delegation handoff CRUD operations (createDelegationHandoff, readDelegationHandoff, updateDelegationHandoff are imported but NOT tested with real scenarios)
- Delegation state machine transitions
- Multi-agent delegation scenarios
- Delegation timeout and expiration

**Test Level:** Unit-level

---

### 7. `tests/task-lifecycle-corruption.test.ts` (179 lines)

**What it covers:**
- `readWorkflowTaskState` with corrupted JSON (SURFACES error vs silent fallback)
- `activateWorkflowTask` corruption handling
- `createWorkflowTask` corruption handling
- Schema validation for task state

**What it does NOT cover:**
- Happy-path task lifecycle (create → activate → complete)
- Task state transitions
- Concurrent task modifications
- Task persistence across sessions

**Test Level:** Unit-level (corruption scenarios only)

---

### 8. `tests/runtime-authority-live-sanity.test.ts` (85 lines)

**What it covers:**
- Managed runtime creation (`createManagedRuntime`)
- Attached runtime reuse (`attachManagedRuntime`)
- Command bundle execution (`executeSlashCommandBundle` with hm-init)
- Authority persistence across flows

**What it does NOT cover:**
- Complete user journey (attach → bootstrap → use tools → cleanup)
- Multi-session scenarios
- Authority conflicts
- Runtime teardown

**Test Level:** Integration (live OpenCode SDK, real filesystem)

---

### 9. `src/tools/hivemind-journal.test.ts` (308 lines)

**What it covers:**
- Journal tool file existence and exports
- Args schema validation (sessionId, eventType, payload, timestamp)
- Event type coverage: `assistant_output`, `user_message`, `tool_call`
- File path resolution
- Multiple session handling

**What it does NOT cover:**
- Error conditions (disk full, permissions)
- Concurrent journal writes
- Journal file corruption/recovery
- Complete event type set (handoff, trajectory_snapshot, task_complete, etc.)

**Test Level:** Unit-level with real filesystem

---

### 10. `src/tools/hivefiver-tools.test.ts` (347 lines)

**What it covers:**
- `hivemind_hm_init`: factory exists, description, args (mode, force), greenfield/brownfield modes
- `hivemind_hm_doctor`: factory exists, description, args (scope, fix)
- `hivemind_hm_setting`: factory exists, description, group/locale args

**What it does NOT cover:**
- Error conditions (invalid mode, disk full)
- Interactive mode behavior
- Force flag behavior
- Complete setting update flows

**Test Level:** Unit-level

---

### 11. `tests/integration/handler-bugs.test.ts` (253 lines)

**What it covers (3 bugs):**
1. **Bug 1:** `createEventHandler` — missing `initSession` before `addEvent` → ENOENT on session.idle
2. **Bug 2:** `createCompactionJournalHandler` — missing `initSession` → ENOENT on compaction
3. **Bug 3:** `createTextCompleteHandler` — missing `sdkSessionId` in `initSession` → findSessionBySdkId fails

**What it does NOT cover:**
- These are BUG PROOFS, not bug FIXES — they document existing issues
- No verification that bugs are actually fixed
- Handler retry logic
- Handler error recovery

**Test Level:** Integration (vitest, real filesystem)
**Evidence:** `tests/integration/handler-bugs.test.ts:34-80`

---

### 12. `tests/tools/hivefiver-setting/` (7 files, ~100 lines each)

**Files:**
- `hm-setting-wiring.test.ts` — Dashboard proof wiring
- `hm-setting-spec-expanded.test.ts` — Select, Tabs, Input, Button spec elements
- `hm-setting-spec-builder.test.ts` — Spec structure (Stack, Heading, Card, etc.)
- `hm-setting-render.test.ts` — TUI rendering
- `hm-setting-registry.test.ts` — Component registry expansion
- `hm-setting-localization.test.ts` — i18n fallback behavior
- `hm-setting-dashboard-tool.test.ts` — Dashboard mode output

**What it covers:**
- hm-setting tool factory, args, output shapes
- Dashboard pane40/pane60 structure
- Localization fallback
- Spec element types

**What it does NOT cover:**
- Actual setting persistence (file writes)
- Setting validation
- Complete setting update flow (read → propose → authorize → write)
- Error conditions

**Test Level:** Unit-level (TDD RED phase tests)

---

## Bug Reports Found (Documented but NOT Fixed)

### From `tests/runtime-resilience.test.ts`

| Bug | Location | Issue | Status |
|-----|----------|-------|--------|
| Silent null exits | `command.ts:123-143` | `maybeAutoRecoverEntry` returns null without reason | **OPEN** |
| JSON silently swallowed | `workflow-continuity.ts:101-125` | Malformed JSON filtered without error | **OPEN** |
| Shallow health inference | `harness.ts` | Single health check ≠ proven readiness | **OPEN** |
| Silent null returns | `delegation-store.ts` | ENOENT indistinguishable from corruption | **OPEN** |
| Null without status | `control-plane-registry.ts` | Error indistinguishable from no-match | **OPEN** |

### From `tests/integration/handler-bugs.test.ts`

| Bug | Handler | Issue | Status |
|-----|---------|-------|--------|
| Missing initSession | `createEventHandler` | ENOENT on session.idle | **OPEN** |
| Missing initSession | `createCompactionJournalHandler` | ENOENT on compaction | **OPEN** |
| Missing sdkSessionId | `createTextCompleteHandler` | findSessionBySdkId fails | **OPEN** |

---

## Gaps for LLM-Eval Stress Testing

### CRITICAL Gaps (4 tools with ZERO coverage)

| Tool | Why Critical | Required Tests |
|------|--------------|----------------|
| `hivemind_doc` | Discovery/planning phase tool — first tool often called | Doc retrieval, doc search, doc comparison, doc caching |
| `hivemind_task` | Core workflow task management | Task create, task activate, task complete, task list, task corruption |
| `hivemind_trajectory` | Session state tracking | Trajectory snapshot, trajectory lineage, trajectory recovery |
| `hivemind_handoff` | Multi-agent delegation | Handoff create, handoff accept, handoff reject, handoff timeout |

### HIGH Priority Gaps (tools with partial coverage)

| Tool | Missing Tests | Why Important |
|------|---------------|--------------|
| `hivemind_runtime_status` | Actual runtime inspection with real sessions | LLM needs to query runtime state |
| `hivemind_runtime_command` | Command execution with real workflows | LLM needs to trigger recovery |
| `hivemind_agent_work_*` | Contract creation/export in real workflows | Planning phase core tools |
| `hivemind_hm_init` | Greenfield/brownfield with real file writes | Bootstrap is critical path |
| `hivemind_hm_doctor` | Actual diagnostics with real corruption | Recovery is critical path |

### MEDIUM Priority Gaps

| Gap Category | What's Missing |
|--------------|---------------|
| **User Journey Tests** | Complete session lifecycle: attach → work → compact/cleanup |
| **Multi-Agent Tests** | Orchestrator → worker delegation flows |
| **Lifecycle Tests** | Tool invocation → state mutation → persistence → recovery |
| **Error Recovery** | All tools under: disk full, permissions error, corruption, timeout |
| **Concurrency** | Parallel tool invocations, race conditions |
| **Stress Tests** | Large payloads, rapid invocations, memory pressure |

---

## Test Runner Analysis

**Primary:** `tsx --test` (Node.js built-in test runner)
- Command: `npm test` → `tsx --test "tests/**/*.test.ts" "src/**/*.test.ts"`
- Used by: Most unit-level tests (node:test)

**Secondary:** `vitest`
- Used by: `tests/integration/multi-turn-accumulation.test.ts`
- Used by: `tests/integration/handler-bugs.test.ts`
- Reason: These use `describe/it/expect` from vitest

**Issue:** Mixed test runners can cause confusion. vitest globals vs node:test globals are not interchangeable.

---

## Recommendations for LLM-Eval Stress Testing

### 1. Immediate (Critical Tools)

Create tests for:
- `tests/tools/hivemind-task.test.ts` — Task CRUD + corruption
- `tests/tools/hivemind-trajectory.test.ts` — Trajectory snapshots + lineage
- `tests/tools/hivemind-handoff.test.ts` — Delegation state machine
- `tests/tools/hivemind-doc.test.ts` — Doc retrieval and search

### 2. Short-term (User Journeys)

Create integration tests:
- `tests/integration/complete-session-lifecycle.test.ts` — Fresh → work → compact
- `tests/integration/multi-agent-delegation.test.ts` — Orchestrator → worker → return
- `tests/integration/tool-error-recovery.test.ts` — Each tool under error conditions

### 3. Medium-term (Stress & Concurrency)

- `tests/stress/rapid-invocation.test.ts` — 100+ rapid tool calls
- `tests/stress/large-payload.test.ts` — Max-sized arguments
- `tests/concurrency/race-conditions.test.ts` — Parallel writes to same state

---

## Evidence Files

| Evidence | Path |
|----------|------|
| Tool Catalog | `src/tools/index.ts:28-137` |
| Test Runner Config | `package.json:56` |
| Bug Documentation | `tests/runtime-resilience.test.ts:1-412` |
| Handler Bugs | `tests/integration/handler-bugs.test.ts:1-253` |

---

*Generated by hivexplorer for LLM-eval stress testing preparation*