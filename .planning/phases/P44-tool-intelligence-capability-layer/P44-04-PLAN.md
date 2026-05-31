---
phase: P44-tool-intelligence-capability-layer
plan: 04
type: execute
wave: 2
depends_on: ["P44-01"]
files_modified:
  - src/hooks/guards/tool-guard-hooks.ts
  - src/task-management/lifecycle/index.ts
  - .opencode/agents/hm-*.md
autonomous: true
requirements:
  - REQ-P44-05
  - REQ-P44-06
must_haves:
  truths:
    - "tool-guard-hooks checks agent capability before tool execution"
    - "Capability mutation events are persisted to session tracker"
    - "Hook enforcement applies to all 31 tools via capabilityGate"
    - "Capability state is re-derivable from event log after compaction"
    - "No external policy engine or runtime dependency added"
---

# P44-04: Hook Enforcement + Mutation Events

## Objective
Wire the capability gate into the hook enforcement layer so that tool access
is validated at runtime, and persist capability mutation events so the ledger
survives agent profile compaction and context pruning.

## Context
- P44-01 provides `CapabilityGate` class with `resolveToolsForAgent(agentName)` and deduplicated constants
- P44-02 (parallel) updates all 31 hm-* agents with `tools:` frontmatter declarations
- P44-03 (after P44-01) wires `CapabilityGate` into `spawn-request-builder.ts`
- This plan closes the loop: runtime enforcement + persistence

## Tasks

### Task 1: Capability Check in tool-guard-hooks.ts
**Type:** auto  
**Files:** `src/hooks/guards/tool-guard-hooks.ts`

1. Import `CapabilityGate` singleton from `src/features/capability-gate/`
2. Before tool execution, call `capabilityGate.resolveToolsForAgent(agentName)` and check `.includes(toolName)`
3. If the tool is NOT in the resolved set, return blocked response with reason: "Agent {agentName} is not permitted to use tool {toolName}"
4. Log blocked attempt to session tracker event bus
5. Do NOT throw — return graceful block to preserve workflow continuity

**Verification:**
- [ ] Existing tests pass (no regression in unguarded tool paths)
- [ ] New test: agent without `grep` capability receives block when calling `grep`
- [ ] New test: agent with `grep` capability executes normally

---

### Task 2: Mutation Event Persistence
**Type:** auto  
**Files:** `src/task-management/lifecycle/index.ts`

1. Add `CAPABILITY_MUTATION` event type to session tracker event enum
2. On capability grant/revoke, emit event with:
   - `agentName`
   - `toolName`
   - `previousCapability` (boolean)
   - `newCapability` (boolean)
   - `trigger` (manual | admin | delegation)
   - `timestamp`
3. Event is append-only; never modifies existing events
4. On compaction/rehydration, `CapabilityGate` replays mutation events to rebuild in-memory state

**Verification:**
- [ ] Mutation event emitted on `grantCapability(agent, tool)`
- [ ] Mutation event emitted on `revokeCapability(agent, tool)`
- [ ] Replay of 10 mutation events produces correct final state
- [ ] Existing lifecycle tests pass unmodified

---

### Task 3: Hook Enforcement Integration Test
**Type:** auto  
**Files:** `tests/hooks/guards/tool-guard-hooks.capability.test.ts` (new)

1. Mock `CapabilityGate` with controlled `resolveToolsForAgent` responses
2. Test blocked tool call returns graceful block (no throw)
3. Test allowed tool call proceeds normally
4. Test event emitted on block
5. Test event NOT emitted on successful call

**Verification:**
- [ ] All 5 scenario tests pass
- [ ] Test isolation uses `OPENCODE_HARNESS_STATE_DIR` temp dir

---

### Task 4: Documentation + Smoke Test
**Type:** auto  
**Files:** `.opencode/agents/hm-*.md`

1. Add `tools:` section to all 31 hm-* agents (if not already present from P44-02)
2. Add inline comment explaining capability gate behavior
3. Run `npm run typecheck` — must pass
4. Run `npm test` — must pass (existing + new tests)
5. Create `tests/features/capability-gate/e2e-smoke.test.ts` (new):
   - Spin up real `CapabilityGate`
   - Verify `resolveToolsForAgent('hm-l0-orchestrator')` returns expected tools
   - Verify `resolveToolsForAgent('unknown-agent')` returns category defaults
   - Verify mutation event replay rebuilds state correctly

**Verification:**
- [ ] typecheck PASS
- [ ] npm test PASS
- [ ] e2e smoke test PASS

---

## Success Criteria
- [ ] All 4 tasks committed individually
- [ ] Capability gate blocks unauthorized tool access at hook level
- [ ] Mutation events persist capability changes
- [ ] All 31 hm-* agents have valid `tools:` frontmatter
- [ ] No external dependencies added
- [ ] All existing tests pass (no regressions)
- [ ] `CapabilityGate` class stays ≤ 150 LOC per must_have
- [ ] Total P44 new code ≤ 400 LOC (excluding frontmatter + tests)
