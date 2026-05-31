---
phase: P44-tool-intelligence-capability-layer
plan: 04
type: execute
wave: 2
depends_on: ["P44-01", "P44-02", "P44-03"]
files_modified:
  - src/features/capability-gate/index.ts
  - src/hooks/guards/tool-guard-hooks.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/handlers/capability-mutation-handler.ts
  - src/features/session-tracker/capture/handlers/capability-snapshot-handler.ts
  - tests/features/capability-gate/capability-gate-orphans.test.ts
  - tests/hooks/guards/tool-guard-hooks.capability.test.ts
  - tests/features/session-tracker/capability-events.test.ts
autonomous: true
requirements:
  - REQ-P44-04
  - REQ-P44-05
  - REQ-P44-06
must_haves:
  truths:
    - "getOrphanedTools() returns tools in TOOL_CAPABILITY_MAP not declared by any agent"
    - "tool-guard-hooks consults resolveToolsForAgent() before allowing tool execution"
    - "capability_mutation events are persisted to session-tracker via handler pipeline"
    - "capability_snapshot events capture periodic state for audit and recovery"
    - "No external policy engine or runtime dependency added"
    - "All 31 tools (24 harness + 7 built-in) accounted for in orphan detection"
  artifacts:
    - path: src/features/capability-gate/index.ts
      provides: CapabilityGate.getOrphanedTools(agentToolDeclarations) — returns Set of unmapped tool names
      contains: "getOrphanedTools"
    - path: src/hooks/guards/tool-guard-hooks.ts
      provides: resolveToolsForAgent call in tool.execute.before handler feeding governance context
      contains: "resolveToolsForAgent"
    - path: src/features/session-tracker/capture/handlers/capability-mutation-handler.ts
      provides: EventHandler for capability_mutation events
      contains: "capability_mutation"
    - path: src/features/session-tracker/capture/handlers/capability-snapshot-handler.ts
      provides: EventHandler for capability_snapshot events
      contains: "capability_snapshot"
  key_links:
    - from: src/features/capability-gate/index.ts
      to: src/hooks/guards/tool-guard-hooks.ts
      via: import CapabilityGate + resolveToolsForAgent for runtime tool access check
      pattern: import.*capability-gate.*index
    - from: src/features/capability-gate/index.ts
      to: src/features/session-tracker/capture/event-capture.ts
      via: emitCapabilityEvent callback wired to capability_mutation handler
      pattern: capability_mutation
    - from: src/features/session-tracker/capture/event-capture.ts
      to: src/features/session-tracker/capture/handlers/capability-mutation-handler.ts
      via: handler registered in this.handlers map under capability_mutation key
      pattern: CapabilityMutationHandler
---

# P44-04: Orphaned Tool Governance + Runtime Enforcement — Execution Plan

**REQ:** REQ-P44-04, REQ-P44-05, REQ-P44-06
**Status:** READY
**Estimated LOC:** ~120
**Depends on:** P44-01 (CapabilityGate wiring + test fix), P44-02 (agent frontmatter declarations), P44-03 (spawner JIT injection)

## Context

P44-01 fixed the failing test, deduplicated constants, and established the base wiring
stubs in spawn-request-builder and tool-guard-hooks. P44-02 standardized all 31 hm-*
agent frontmatter with `tools:` declarations. P44-03 wired `resolveToolsForAgent()`
into the spawner's `resolveDelegationPermissionProfile`.

This plan closes the remaining gaps:
1. **Orphaned tool detection** — identify tools registered but never declared by agents
2. **Runtime tool enforcement in hooks** — capability-aware governance evaluation
3. **Session tracker event types** — `capability_mutation` and `capability_snapshot` handlers

### Correct API Reference (DO NOT use canExecute)

| Method | Signature | Purpose |
|--------|-----------|---------|
| `resolveToolsForAgent` | `(agentName: string): string[]` | Get allowed tool set for agent |
| `grantCapability` | `(sessionId: string, agentName: string, toolName: string): void` | Grant tool to agent in session |
| `revokeCapability` | `(sessionId: string, agentName: string, toolName: string): void` | Revoke tool from agent in session |
| `getCapabilitySnapshot` | `(): CapabilitySnapshot` | Frozen state snapshot |
| `getOrphanedTools` | **NEW** `(agentToolDeclarations: Map<string, string[]>): Set<string>` | Find unassigned tools |

---

## Wave 1: Orphaned Tool Detection (LOC: ~30)

### Task 1.1: Add `getOrphanedTools()` method to CapabilityGate
**File:** `src/features/capability-gate/index.ts`
**Action:** MODIFY
**LOC:** ~12
**What:** Add a static or instance method `getOrphanedTools(agentToolDeclarations)` that:
1. Accepts a `Map<string, string[]>` where keys are agent names and values are their declared tool lists
2. Collects all tool names that appear in `TOOL_CAPABILITY_MAP` but NOT in any agent's declaration
3. Returns a `Set<string>` of orphaned tool names
4. Method is pure — no side effects, no mutation of grants map
5. Total CapabilityGate module stays ≤ 150 LOC (currently 111 LOC, adding ~12 = 123 LOC)
**Done when:** `grep -n "getOrphanedTools" src/features/capability-gate/index.ts` returns the method. `npm run typecheck` passes.

### Task 1.2: Add unit tests for orphan detection
**File:** `tests/features/capability-gate/capability-gate-orphans.test.ts` (new)
**Action:** CREATE
**LOC:** ~18
**What:** Test the new `getOrphanedTools()` method:
1. Test with all 31 tools declared across agents → returns empty Set
2. Test with only 20 tools declared → returns Set of 11 orphaned tools
3. Test with zero declarations → returns Set of all 31 tools
4. Test that built-in tools (read, edit, write, glob, grep) are never orphaned (always in category defaults)
5. Verify the 14 historically orphaned tools from audit: `hivemind-sdk-supervisor`, `hivemind-session-view`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-doc`, `hivemind-command-engine`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `session-patch`, `prompt-analyze`, `prompt-skim`, `session-delegation-query`, `session-journal-export`, `session-context`
**Done when:** `npx vitest run tests/features/capability-gate/capability-gate-orphans.test.ts` — all tests pass.

---

## Wave 2: Runtime Tool Resolution in Hook Enforcement (LOC: ~40)

### Task 2.1: Wire `resolveToolsForAgent()` into tool-guard-hooks governance context
**File:** `src/hooks/guards/tool-guard-hooks.ts`
**Action:** MODIFY
**LOC:** ~25
**What:** In the `tool.execute.before` hook handler, add capability-aware check BEFORE existing `evaluateGovernance` call:
1. Import `CapabilityGate` from `../../features/capability-gate/index.js`
2. Create module-level singleton: `const capabilityGate = new CapabilityGate()`
3. In the before-hook, call `capabilityGate.resolveToolsForAgent(agentName)` to get the allowed tool set
4. If the requested `toolName` is NOT in the resolved set, add `capabilityDenied: true` to the governance context and return a structured denial with message: `"Tool {toolName} not in capability set for agent {agentName}"`
5. If the tool IS in the resolved set, proceed to existing `evaluateGovernance()` call unchanged
6. Do NOT throw — return graceful block to preserve workflow continuity
7. Existing governance checks (circuit breaker, tool budget) continue to function after capability check passes
**Done when:** `grep -n "resolveToolsForAgent" src/hooks/guards/tool-guard-hooks.ts` shows the call. `grep -n "canExecute" src/hooks/guards/tool-guard-hooks.ts` returns empty (no wrong method). `npm run typecheck` passes.

### Task 2.2: Add unit tests for capability-aware hook enforcement
**File:** `tests/hooks/guards/tool-guard-hooks.capability.test.ts` (new)
**Action:** CREATE
**LOC:** ~15
**What:** Test the hook enforcement integration:
1. Test: agent without `delegate-task` capability receives structured denial when calling `delegate-task`
2. Test: agent with all capabilities (l0-orchestrator) passes through normally
3. Test: denial message includes agent name and tool name
4. Test: denial does NOT throw (graceful block)
5. Test: existing governance checks still function after capability check passes
**Done when:** `npx vitest run tests/hooks/guards/tool-guard-hooks.capability.test.ts` — all 5 tests pass.

---

## Wave 3: Session Tracker Event Types (LOC: ~50)

### Task 3.1: Add `capability_mutation` handler to session-tracker
**File:** `src/features/session-tracker/capture/handlers/capability-mutation-handler.ts` (new)
**Action:** CREATE
**LOC:** ~20
**What:** Create a new event handler class following the existing handler pattern:
1. Import `HandlerDeps` from `./types.js`
2. Implement `EventHandler` interface with `handle(sessionID, event)` method
3. On `capability_mutation` event, append a `JourneyEntry` to the session file via `this.deps.sessionWriter.appendJourneyEntry()` with: `{ type: "capability_mutation", agentName, toolName, action: "grant" | "revoke", timestamp }`
4. Follow existing handler patterns (e.g., `session-created-handler.ts`) for structure
5. Event payload matches `CapabilityMutationEvent` from `capability-gate/types.ts`
**Done when:** `grep -n "capability_mutation" src/features/session-tracker/capture/handlers/capability-mutation-handler.ts` returns matches. File compiles.

### Task 3.2: Add `capability_snapshot` handler to session-tracker
**File:** `src/features/session-tracker/capture/handlers/capability-snapshot-handler.ts` (new)
**Action:** CREATE
**LOC:** ~15
**What:** Create a snapshot handler for periodic capability state dumps:
1. Import `HandlerDeps` from `./types.js`
2. Implement `EventHandler` interface with `handle(sessionID, event)` method
3. On `capability_snapshot` event, append a `JourneyEntry` with: `{ type: "capability_snapshot", snapshot: CapabilitySnapshot, trigger: "periodic" | "bootstrap" | "manual", timestamp }`
4. Used for audit trail and capability state recovery after harness restart
**Done when:** File compiles. `npm run typecheck` passes.

### Task 3.3: Register new handlers in event-capture.ts + wire CapabilityGate callbacks
**File:** `src/features/session-tracker/capture/event-capture.ts`
**Action:** MODIFY
**LOC:** ~10
**What:**
1. Import `CapabilityMutationHandler` and `CapabilitySnapshotHandler`
2. Add entries to `this.handlers` map in constructor:
   - `"capability_mutation": new CapabilityMutationHandler(this.deps)`
   - `"capability_snapshot": new CapabilitySnapshotHandler(this.deps)`
3. This completes P44-01 Wave 5 (which wired the `emitCapabilityEvent` callback) by providing the handler that receives the emitted events
**Done when:** `grep -n "capability_mutation\|capability_snapshot" src/features/session-tracker/capture/event-capture.ts` returns matches. `npm run typecheck` passes.

### Task 3.4: Add unit tests for capability event persistence
**File:** `tests/features/session-tracker/capability-events.test.ts` (new)
**Action:** CREATE
**LOC:** ~15
**What:**
1. Test: `grantCapability()` emits `capability_mutation` event with `action: "grant"`
2. Test: `revokeCapability()` emits `capability_mutation` event with `action: "revoke"`
3. Test: event payload has correct `agentName`, `toolName`, `sessionId`, `timestamp` fields
4. Test: `capability_snapshot` handler appends journey entry to session file
5. Test: replay of 10 mutation events produces correct final state
**Done when:** `npx vitest run tests/features/session-tracker/capability-events.test.ts` — all tests pass.

---

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all existing + new tests, zero regressions)
- [ ] `grep -rn "canExecute" src/` returns empty (no wrong method references)
- [ ] `grep -n "getOrphanedTools" src/features/capability-gate/index.ts` returns the method
- [ ] `grep -n "resolveToolsForAgent" src/hooks/guards/tool-guard-hooks.ts` shows import + call
- [ ] `grep -n "capability_mutation" src/features/session-tracker/capture/event-capture.ts` shows handler registration
- [ ] `grep -n "capability_snapshot" src/features/session-tracker/capture/event-capture.ts` shows handler registration
- [ ] CapabilityGate module ≤ 150 LOC (111 existing + ~12 new = ~123 LOC)

## Success Criteria

- [ ] All 3 waves committed individually
- [ ] `getOrphanedTools()` detects tools registered but never declared by any agent
- [ ] `resolveToolsForAgent()` is the ONLY capability check method used (no `canExecute`)
- [ ] Hook enforcement blocks unauthorized tool access with structured denial (no exception)
- [ ] `capability_mutation` events persist grant/revoke operations to session tracker
- [ ] `capability_snapshot` events capture periodic state for audit
- [ ] No external dependencies added
- [ ] No duplicate work from P44-01, P44-02, or P44-03
- [ ] All existing tests pass (zero regressions)
- [ ] Total new code ≤ 120 LOC (within 120-150 estimate)
