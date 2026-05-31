---
phase: P44-tool-intelligence-capability-layer
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - tests/features/capability-gate/capability-map.test.ts
  - src/coordination/spawner/spawn-request-builder.ts
autonomous: true
requirements:
  - REQ-P44-01
must_haves:
  truths:
    - "CapabilityGate resolves all 31 registered tools (24 harness + 7 built-in), NOT 25"
    - "Resolution falls back to category-based defaults when agent has no frontmatter declarations"
    - "In-memory state is re-derivable from frontmatter + event log"
    - "Module has zero external dependencies"
     - "Module is 139 LOC existing; ~35 LOC new across 2 waves"
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
---

# P44-01: Wire CapabilityGate into Runtime — Execution Plan

**REQ:** REQ-P44-01
**Status:** READY
**Estimated LOC:** ~35 (139 LOC already exist; ~35 new/modified across 2 waves)
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

### What's NOT done (remaining — this plan):
1. Failing test: wrong import path, expects 25 instead of 31, missing 6 tool assertions
2. `WRITE_CAPABLE_TOOLS` / `READ_ONLY_TOOLS` / `WRITE_TOOLS` duplicated in `spawn-request-builder.ts`

### Deferred to P44-03 and P44-04:
- `resolveToolsForAgent()` NOT called by `spawn-request-builder.ts` → P44-03
- `resolveToolsForAgent()` NOT called by `tool-guard-hooks.ts` → P44-04
- `grantCapability()`/`revokeCapability()` event callbacks NOT connected to session-tracker → P44-04

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

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all existing + new tests)
- [ ] `npx vitest run tests/features/capability-gate/capability-map.test.ts` — all assertions pass, map size = 31
- [ ] `grep -c "const READ_ONLY_TOOLS" src/coordination/spawner/spawn-request-builder.ts` returns `0` (deduplicated)
- [ ] `grep -n "capability-gate" src/coordination/spawner/spawn-request-builder.ts` shows import line
