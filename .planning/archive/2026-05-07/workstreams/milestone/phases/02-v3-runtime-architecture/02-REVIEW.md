---
phase: 02-v3-runtime-architecture
reviewed: 2026-04-08T16:31:06Z
depth: deep
files_reviewed: 34
files_reviewed_list:
  - .planning/phases/02-v3-runtime-architecture/02-04-SUMMARY.md
  - .planning/phases/02-v3-runtime-architecture/02-05-SUMMARY.md
  - .planning/phases/02-v3-runtime-architecture/02-06-SUMMARY.md
  - src/plugin.ts
  - src/hooks/create-core-hooks.ts
  - src/hooks/create-session-hooks.ts
  - src/hooks/create-tool-guard-hooks.ts
  - src/hooks/types.ts
  - src/lib/background-manager.ts
  - src/lib/concurrency.ts
  - src/lib/continuity.ts
  - src/lib/continuity-normalizers.ts
  - src/lib/delegation-export.ts
  - src/lib/delegation-packet.ts
  - src/lib/execution-mode.ts
  - src/lib/governance-engine.ts
  - src/lib/helpers.ts
  - src/lib/lifecycle-background-observer.ts
  - src/lib/lifecycle-manager.ts
  - src/lib/lifecycle-queue.ts
  - src/lib/lifecycle-state.ts
  - src/lib/injection-engine.ts
  - src/lib/session-api.ts
  - src/lib/session-recovery.ts
  - src/lib/specialist-router.ts
  - src/lib/state.ts
  - src/lib/types.ts
  - src/tools/delegate-task.ts
  - tests/hooks/create-core-hooks.test.ts
  - tests/hooks/create-session-hooks.test.ts
  - tests/hooks/create-tool-guard-hooks.test.ts
  - tests/lib/background-manager-harden.test.ts
  - tests/lib/governance-engine.test.ts
  - tests/lib/injection-engine.test.ts
  - tests/lib/session-recovery.test.ts
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-08T16:31:06Z
**Depth:** deep
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed the Phase 02 execution changes around session recovery, governance, injection evaluation, hook wiring, and continuity interactions. The overall direction is solid and the new tests cover the happy-path builder flow well, but there are three correctness issues in the new integration seams.

The highest-risk regressions are in runtime injection/governance integration: non-builder sessions can receive builder-only injection guidance, historical governance violations can permanently suppress future injections, and governance metadata can be mismatched under overlapping tool calls. Residual test gaps remain around critic/researcher injection paths and concurrent before/after hook pairing.

## Warnings

### WR-01: Specialist injection is hardcoded to the builder lane

**File:** `src/lib/injection-engine.ts:111-116`
**Issue:** `specialist-route-guidance` reports the matched `effectiveAgent`, but its payload is always builder-specific (`"Honor the routed builder specialist guidance..."` and `"builder-specialist-lane"`). If routing resolves to `critic` or `researcher`, those sessions will still receive builder instructions/skills, which is a functional regression in session-start and compaction injection.
**Fix:** Generate this payload from the resolved route instead of using a static builder payload.

```ts
const specialist = context.route?.effectiveAgent
return {
  matched: true,
  reason: `Route matched the ${specialist} specialist lane.`,
  evidence: [...],
  payload: {
    rules: [`Honor the routed ${specialist} specialist guidance for this session.`],
    skills: [`${specialist}-specialist-lane`],
    commands: [],
    tools: [],
  },
}
```

### WR-02: Any historical block violation permanently suppresses all future injections

**File:** `src/hooks/create-core-hooks.ts:31-45`, `src/hooks/create-session-hooks.ts:47-61`, `src/lib/governance-engine.ts:148-166`
**Issue:** Injection suppression is derived from the append-only governance violation log, not current governance state. Once a session records any `block` violation, both hooks suppress *all* injection candidates for that session forever, even if the blocking rule is later removed or the block was meant for a single tool invocation only.
**Fix:** Track current session block state separately, or recompute suppression from active rules/current evaluation context rather than historical violations.

```ts
// bad: historical violations
const blockingViolation = listGovernanceViolations().find(...)

// better: current block state
const governance = evaluateGovernance({ scope: "tool.execute.before", sessionID, toolName: undefined })
const blocked = governance.blocks.length > 0
```

### WR-03: Governance metadata can be attached to the wrong tool call

**File:** `src/hooks/create-tool-guard-hooks.ts:65`, `src/hooks/create-tool-guard-hooks.ts:77-84`, `src/hooks/create-tool-guard-hooks.ts:142-143`
**Issue:** `recentGovernance` is keyed only by `sessionID`. If two tool executions overlap in the same session, the later `tool.execute.before` overwrites the earlier result, and the first `tool.execute.after` can read/delete the wrong governance payload. That makes `_harness.governance` nondeterministic under overlapping calls.
**Fix:** Correlate before/after state with a per-invocation key (request ID, monotonic hook token, or tool signature carried through both hooks) instead of plain `sessionID`.

```ts
const invocationKey = `${sessionID}:${toolName}:${sequence++}`
recentGovernance.set(invocationKey, governance)
// carry invocationKey forward and read/delete by that exact key in after-hook
```

---

_Reviewed: 2026-04-08T16:31:06Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
