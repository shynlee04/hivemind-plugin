---
phase: P44-tool-intelligence-capability-layer
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - tests/features/capability-gate/capability-map.test.ts
  - src/coordination/spawner/spawn-request-builder.ts
  - src/hooks/guards/tool-guard-hooks.ts
  - src/features/session-tracker/capture/event-capture.ts
autonomous: true
requirements:
  - REQ-P44-01
must_haves:
  truths:
    - "CapabilityGate resolves all 31 registered tools (24 harness + 7 built-in), NOT 25"
    - "Resolution falls back to category-based defaults when agent has no frontmatter declarations"
    - "In-memory state is re-derivable from frontmatter + event log"
    - "Module has zero external dependencies"
    - "Module is 139 LOC existing; ~160 LOC new across 5 waves"
  artifacts:
    - path: src/features/capability-gate/index.ts
      provides: CapabilityGate class with resolveToolsForAgent, grantCapability, revokeCapability, getCapabilitySnapshot (111 LOC, ALREADY EXISTS)
    - path: src/features/capability-gate/types.ts
      provides: ToolCategory enum + ToolCapabilityRecord + CapabilitySnapshot + CapabilityMutationEvent types (28 LOC, ALREADY EXISTS)
    - path: tests/features/capability-gate/capability-map.test.ts
      provides: Unit tests covering all 31 tool classifications and AC-01a through AC-01e (NEEDS FIX: import path, tool count, 6 missing assertions)
  key_links:
    - from: src/features/capability-gate/index.ts
      to: src/coordination/spawner/spawn-request-builder.ts
      via: replace hardcoded READ_ONLY_TOOLS/WRITE_CAPABLE_TOOLS/WRITE_TOOLS with imports from capability-gate
      pattern: import.*capability-gate.*index
    - from: src/features/capability-gate/index.ts
      to: src/hooks/guards/tool-guard-hooks.ts
      via: import resolveToolsForAgent for tool access check before evaluateGovernance
      pattern: import.*capability-gate.*index
    - from: src/features/capability-gate/index.ts
      to: src/features/session-tracker/capture/event-capture.ts
      via: emitCapabilityEvent callback wires to session-tracker event pipeline
      pattern: capability_mutation
---

# P44-01: Wire CapabilityGate into Runtime — Execution Plan

**REQ:** REQ-P44-01
**Status:** READY
**Estimated LOC:** ~160 (139 LOC already exist; ~160 new/modified across 5 waves)
**Depends on:** none

## Existing Implementation (70% DONE — DO NOT REWRITE)

The following code already exists and is correct:

| File | LOC | Status |
|------|-----|--------|
| `src/features/capability-gate/index.ts` | 111 | DONE — CapabilityGate class, TOOL_CAPABILITY_MAP (31 entries), READ_ONLY_TOOLS, WRITE_CAPABLE_TOOLS, WRITE_TOOLS |
| `src/features/capability-gate/types.ts` | 28 | DONE — ToolCategory enum, ToolCapabilityRecord, CapabilitySnapshot, CapabilityMutationEvent |

### What's already working:
- `TOOL_CAPABILITY_MAP` — 31 entries covering all 24 harness + 7 built-in tools
- `CapabilityGate.resolveToolsForAgent(agentName)` — category-based resolution for l0/l1/l2/hf agents
- `CapabilityGate.grantCapability(sessionId, agentName, toolName)` — in-memory grant with optional event callback
- `CapabilityGate.revokeCapability(sessionId, agentName, toolName)` — in-memory revoke with optional event callback
- `CapabilityGate.getCapabilitySnapshot()` — returns frozen snapshot of current state
- Constants exported: `READ_ONLY_TOOLS`, `WRITE_CAPABLE_TOOLS`, `WRITE_TOOLS`

### What's NOT done (remaining 30% — this plan):
1. Failing test: wrong import path, expects 25 instead of 31, missing 6 tool assertions
2. `WRITE_CAPABLE_TOOLS` / `READ_ONLY_TOOLS` / `WRITE_TOOLS` duplicated in `spawn-request-builder.ts`
3. `resolveToolsForAgent()` NOT called by `spawn-request-builder.ts`
4. `resolveToolsForAgent()` NOT called by `tool-guard-hooks.ts`
5. `grantCapability()`/`revokeCapability()` event callbacks NOT connected to session-tracker
6. (Bootstrap seeding is P44-03, NOT this plan)

## Wave 1: Fix Failing Test (LOC: ~20)

### Task 1.1: Fix import path in capability-map.test.ts
**File:** `tests/features/capability-gate/capability-map.test.ts`
**Action:** FIX
**LOC:** ~5
**What:** Change import path from `../src/features/capability-gate/index.ts` to `../../src/features/capability-gate/index.js` (or whatever resolves correctly from `tests/features/capability-gate/` to `src/features/capability-gate/`).
**Done when:** `npx vitest run tests/features/capability-gate/capability-map.test.ts` no longer shows "Cannot find module" error.

### Task 1.2: Update expected tool count from 25 to 31
**File:** `tests/features/capability-gate/capability-map.test.ts`
**Action:** FIX
**LOC:** ~2
**What:** In the "classifies all 25 harness tools (map size)" test, change `.toBe(25)` to `.toBe(31)`. Update the test description string to match. Update the "remaining 4" test to "remaining 10" since there are now 10 session-category tools beyond the 14 orphaned + 7 built-in = 21 → 31 - 21 = 10.
**Done when:** Test assertion matches actual map size of 31.

### Task 1.3: Add assertions for 6 missing tools
**File:** `tests/features/capability-gate/capability-map.test.ts`
**Action:** FIX
**LOC:** ~13
**What:** The test currently asserts 14 orphaned tools + 7 built-ins + 4 session tools = 25. But the map has 31 entries. The 6 missing tools are: `session-delegation-query`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `hivemind-sdk-supervisor`, `session-patch`, `prompt-skim`. Add these to the "remaining" test block (which should now cover all 10 non-orphaned, non-built-in tools: `session-tracker`, `session-hierarchy`, `session-context`, `session-journal-export`, `session-delegation-query`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `hivemind-sdk-supervisor`, `session-patch`, `prompt-skim`).
**Done when:** `npx vitest run tests/features/capability-gate/capability-map.test.ts` — all assertions pass, map size = 31, all tools accounted for.

## Wave 2: Deduplicate Constants (LOC: ~15)

### Task 2.1: Remove WRITE_CAPABLE_TOOLS / READ_ONLY_TOOLS / WRITE_TOOLS from spawn-request-builder.ts
**File:** `src/coordination/spawner/spawn-request-builder.ts`
**Action:** MODIFY
**LOC:** ~5 (net deletion)
**What:** Delete lines 28-30 (the local `READ_ONLY_TOOLS`, `WRITE_CAPABLE_TOOLS`, `WRITE_TOOLS` constants). These are identical duplicates of what `capability-gate/index.ts` already exports. Replace with import:
```typescript
import { READ_ONLY_TOOLS, WRITE_CAPABLE_TOOLS, WRITE_TOOLS } from "../../features/capability-gate/index.js";
```
**Done when:** `grep -c "const READ_ONLY_TOOLS" src/coordination/spawner/spawn-request-builder.ts` returns 0. `npm run typecheck` passes.

### Task 2.2: Verify all spawn-request-builder references resolve
**File:** `src/coordination/spawner/spawn-request-builder.ts`
**Action:** VERIFY (no code change expected)
**LOC:** 0
**What:** Confirm that lines 78-79 (usage of `READ_ONLY_TOOLS`), line 80 (usage of `WRITE_TOOLS`), lines 91/99 (usage of `WRITE_CAPABLE_TOOLS`) all resolve via the new import. If any test imports these constants from spawn-request-builder, update those imports too.
**Done when:** `npm run typecheck` passes. `npm test` passes.

### Task 2.3: Update tests that reference old spawn-request-builder constants
**File:** `tests/coordination/spawner/` (if exists)
**Action:** MODIFY
**LOC:** ~10
**What:** Search for any test files that import `READ_ONLY_TOOLS`, `WRITE_CAPABLE_TOOLS`, or `WRITE_TOOLS` from `spawn-request-builder`. If found, update imports to come from `capability-gate/index` or keep importing from spawn-request-builder (which now re-exports from capability-gate). Add a grep check in verification.
**Done when:** `grep -rn "from.*spawn-request-builder.*READ_ONLY" tests/` returns empty or imports resolve correctly. `npm test` passes.

## Wave 3: Wire CapabilityGate into Spawner (LOC: ~40)

### Task 3.1: Replace hardcoded tool arrays with CapabilityGate.resolveToolsForAgent
**File:** `src/coordination/spawner/spawn-request-builder.ts`
**Action:** MODIFY
**LOC:** ~25
**What:** In `resolveDelegationPermissionProfile()` (or the main export function), after determining the agent name, create a `CapabilityGate` instance and call `resolveToolsForAgent(agentName)` to get the tool list. Use this as the primary tool resolution path, falling back to the current `READ_ONLY_TOOLS` default only if `resolveToolsForAgent` returns empty. The current logic (lines 78-111) uses `isReviewOnlyTask` to decide between READ_ONLY and WRITE_CAPABLE. The new logic should:
1. Call `resolveToolsForAgent(agentName)` to get the category-based tool set
2. If `isReviewOnlyTask` is true, intersect the result with READ_ONLY_TOOLS
3. If explicit tools are in frontmatter (`params.tools`), use those instead
4. Remove direct usage of `WRITE_CAPABLE_TOOLS` and `WRITE_TOOLS` in the spawner logic — capability-gate now owns this
**Done when:** `grep -n "WRITE_CAPABLE_TOOLS\|WRITE_TOOLS" src/coordination/spawner/spawn-request-builder.ts` shows only the import line (or no references if fully replaced). `npm run typecheck` passes.

### Task 3.2: Add unit test for spawner-capability-gate wiring
**File:** `tests/coordination/spawner/spawn-request-builder.test.ts` (or create if missing)
**Action:** CREATE
**LOC:** ~15
**What:** Test that `resolveDelegationPermissionProfile` (or the relevant spawner function) uses `CapabilityGate.resolveToolsForAgent` under the hood. Mock an agent name like `"hm-l0-orchestrator"` and verify the returned tool list includes all 31 tools. Test with a review-only task and verify the tool list is intersected to read-only.
**Done when:** `npx vitest run tests/coordination/spawner/` passes with the new test.

## Wave 4: Wire CapabilityGate into Tool Guard Hooks (LOC: ~40)

### Task 4.1: Use CapabilityGate for tool access check in tool-guard-hooks
**File:** `src/hooks/guards/tool-guard-hooks.ts`
**Action:** MODIFY
**LOC:** ~25
**What:** In the `tool.execute.before` hook (or equivalent), before calling `evaluateGovernance`, add a capability check: instantiate (or import singleton) `CapabilityGate`, call `resolveToolsForAgent(agentName)` to get the allowed tool set, and if the requested tool is NOT in the allowed set, block the call with a clear error message like `"Tool {toolName} not in capability set for agent {agentName}"`. This check should happen BEFORE the existing governance evaluation so capability gate is the first line of defense.
**Done when:** `grep -n "capability-gate" src/hooks/guards/tool-guard-hooks.ts` shows the import. `npm run typecheck` passes.

### Task 4.2: Add unit test for tool guard integration
**File:** `tests/hooks/guards/tool-guard-hooks.test.ts` (or create if missing)
**Action:** CREATE
**LOC:** ~15
**What:** Test that a tool call for an agent that should NOT have access to a tool (e.g., an l2 agent trying to use a Govern-category tool when it shouldn't) is blocked by the capability gate check. Test that an agent that SHOULD have access passes through.
**Done when:** `npx vitest run tests/hooks/guards/` passes with the new test.

## Wave 5: Connect Grant/Revoke to Session Tracker (LOC: ~45)

### Task 5.1: Add capability_mutation event type to session-tracker
**File:** `src/features/session-tracker/capture/event-capture.ts`
**Action:** MODIFY
**LOC:** ~15
**What:** Add a new event type `capability_mutation` to the session-tracker event schema/handler. The event payload should match the `CapabilityMutationEvent` type from `capability-gate/types.ts`: `{ agentName, toolName, action: "grant" | "revoke", sessionId, timestamp }`. Add a handler in the capture pipeline that persists this event to the session journal.
**Done when:** `grep -n "capability_mutation\|CapabilityMutation" src/features/session-tracker/` returns matches. `npm run typecheck` passes.

### Task 5.2: Wire grantCapability/revokeCapability callbacks to emit session-tracker events
**File:** `src/features/capability-gate/index.ts` (or the integration point where CapabilityGate is instantiated)
**Action:** MODIFY
**LOC:** ~15
**What:** When creating the `CapabilityGate` instance (wherever it's wired into the runtime), pass an `emitCapabilityEvent` callback that calls the session-tracker's event capture with the `capability_mutation` event type. The CapabilityGate already supports this callback via its constructor parameter — it just needs to be connected. The wiring point is likely in `src/plugin.ts` or wherever the CapabilityGate singleton is created for the runtime.
**Done when:** `grep -n "emitCapabilityEvent\|capability_mutation" src/plugin.ts` (or wiring file) returns matches. `npm run typecheck` passes.

### Task 5.3: Add unit test for event emission
**File:** `tests/features/capability-gate/capability-gate-events.test.ts` (create new)
**Action:** CREATE
**LOC:** ~15
**What:** Test that when `grantCapability` / `revokeCapability` is called, the `emitCapabilityEvent` callback receives the correct `CapabilityMutationEvent` payload. Verify the event has the right `action`, `agentName`, `toolName`, `sessionId`, and `timestamp` fields.
**Done when:** `npx vitest run tests/features/capability-gate/capability-gate-events.test.ts` passes.

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all existing + new tests)
- [ ] `node -e "const {TOOL_CAPABILITY_MAP} = require('./dist/features/capability-gate/index.js'); console.log(TOOL_CAPABILITY_MAP.size)"` outputs `31`
- [ ] `grep -c "const READ_ONLY_TOOLS" src/coordination/spawner/spawn-request-builder.ts` returns `0` (deduplicated)
- [ ] `grep -n "capability-gate" src/coordination/spawner/spawn-request-builder.ts` shows import line
- [ ] `grep -n "capability-gate" src/hooks/guards/tool-guard-hooks.ts` shows import line
- [ ] `grep -rn "capability_mutation" src/features/session-tracker/` returns matches
- [ ] `grep -rn "emitCapabilityEvent" src/plugin.ts` returns matches (or wherever wired)
