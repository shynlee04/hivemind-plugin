---
phase: CP-PTY-04-cross-cutting-shell-integration
status: ready
created: 2026-05-08
updated: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred
depends_on:
  - CP-PTY-03-agent-subagent-background-task-coordination
  - MCM-03-config-plane-integration
allowed_surfaces_when_authorized:
  - src/tools/run-background-command.ts
  - src/tools/delegate-task.ts
  - src/tools/delegation-status.ts
  - src/tools/session-patch/**
  - src/lib/delegation-manager.ts
  - src/lib/session-api.ts
  - src/lib/runtime.ts
  - src/lib/runtime-policy.ts
  - src/lib/session-journal.ts
  - src/hooks/**
  - src/plugin.ts
  - tests/**
blocked_surfaces:
  - .opencode/**
  - .hivemind/**
---

# CP-PTY-04 Cross-Cutting Shell Integration

## Goal

Wire background shell/PTY/session delegation capabilities into the full Hivemind control plane — integrating `delegation_systems` config as runtime consumers, formalizing hook guards for background command tools, recording delegation events in the session journal, and proving plugin lifecycle cleanup.

## Rationale

CP-PTY-01 through CP-PTY-03 build the primitives and coordination layers. This phase handles the cross-cutting integration: the `delegation_systems` config field currently has **no runtime consumer** (schema exists, tests validate parsing, but nothing reads it at dispatch time), hook guards for background command tools are not formalized, delegation events don't flow into the session journal, and plugin lifecycle cleanup on session end is untested. This phase closes all four gaps.

## High-Level Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| CPPTY04-AC-01 | `delegation_systems.background_delegation` gates background command dispatch. | `npx vitest run tests/lib/delegation-systems-consumer.test.ts` |
| CPPTY04-AC-02 | Hook guards apply to `run-background-command` tool (PreToolUse/PostToolUse). | `npx vitest run tests/hooks/background-command-guards.test.ts` |
| CPPTY04-AC-03 | Delegation events recorded in session journal. | `npx vitest run tests/lib/delegation-journal.test.ts` |
| CPPTY04-AC-04 | Plugin lifecycle cleanup: session end → delegation cleanup. | `npx vitest run tests/lib/plugin-lifecycle-cleanup.test.ts` |
| CPPTY04-AC-05 | `delegation_systems.delegate_task` and `native_task` gate SDK dispatch. | `npx vitest run tests/lib/delegation-systems-consumer.test.ts` |
| CPPTY04-AC-06 | All new tests pass with `npm run typecheck && npm test`. | Full suite |

## Research Sources

- `src/schema-kernel/hivemind-configs.schema.ts` — `DelegationSystemsSchema` definition
- `src/lib/delegation-manager.ts` — `dispatch()` and `dispatchCommand()` entry points
- `src/lib/runtime-policy.ts` — `loadRuntimePolicy()`, `resolveConcurrencyForKey()`
- `src/hooks/create-tool-guard-hooks.ts` — `tool.execute.before` / `tool.execute.after`
- `src/hooks/plugin-event-observers.ts` — `createDelegationEventObserver()`
- `src/lib/session-journal.ts` — `createJournalEntry()`, `appendJournalEntry()`
- `src/plugin.ts` — composition root, tool registration, hook wiring
- `src/lib/lifecycle-manager.ts` — `cancelDelegatedSession()`, `handleEvent()`

## Dependencies

- CP-PTY-03: coordination layer must exist before cross-cutting integration.
- MCM-03: config plane integration ensures `delegation_systems` has a consumer.

## Out Of Scope

- Sidecar/tmux projection (SC-PTY-01) — separate read-model phase.
- New tool creation — this phase wires existing tools, not new ones.
- Changes to the Zod schema shape — `delegation_systems` schema is already correct.

---

## Tasks

### CPPTY04-T01: Wire `delegation_systems.background_delegation` as Runtime Consumer

**Description:** Add a runtime consumer in `DelegationManager.dispatchCommand()` that reads `getCachedConfig().delegation_systems.background_delegation` and blocks background command dispatch when the flag is `false`. This makes the config field functional rather than schema-only.

**Files:**
- `src/lib/delegation-manager.ts` — add config check in `dispatchCommand()`
- `tests/lib/delegation-systems-consumer.test.ts` (new) — test the gate behavior

**Implementation Details:**
1. In `dispatchCommand()`, before acquiring the semaphore, read `getCachedConfig().delegation_systems.background_delegation`.
2. If `false`, throw `[Harness] Background delegation disabled by delegation_systems config`.
3. If `true` or undefined (default), proceed normally.

**Test Scenarios:**
1. `background_delegation: true` → dispatch proceeds.
2. `background_delegation: false` → dispatch throws with config-disabled message.
3. `background_delegation` undefined (default) → dispatch proceeds (backwards compat).
4. Config change at runtime: disable → subsequent dispatch blocked, prior dispatches unaffected.

**Acceptance Criteria:**
- All 4 scenarios pass.
- Existing delegation-manager tests still pass.
- `npm run typecheck` passes.

**Estimated LOC:** ~15 (source) + ~120 (tests)

**Commit:** `feat: wire delegation_systems.background_delegation as runtime gate in dispatchCommand`

---

### CPPTY04-T02: Add Hook Guard Tests for Background Command Tools

**Description:** Add tests proving that `createToolGuardHooks()` applies PreToolUse and PostToolUse guards to `run-background-command` tool calls — including circuit breaker enforcement, tool budget tracking, and harness metadata injection.

**File:** `tests/hooks/background-command-guards.test.ts` (new)

**Test Scenarios:**
1. PreToolUse: `run-background-command` call increments session tool count.
2. PreToolUse: tool budget exceeded → guard blocks with `[Harness]` error.
3. PreToolUse: circuit breaker threshold (repeated signature) → guard blocks.
4. PostToolUse: harness metadata injected into tool output.
5. PreToolUse: unknown session ID → guard passes through (no crash).
6. PreToolUse: delegation metadata resolves per-session runtime policy.
7. PostToolUse: `delegate-task` tool also receives metadata injection.
8. PreToolUse: `delegation-status` tool passes through without budget enforcement.

**Acceptance Criteria:**
- All 8 scenarios pass.
- Tests use mock dependencies (no real SDK calls).
- `npm run typecheck` passes.

**Estimated LOC:** ~200

**Commit:** `test: add hook guard tests for background command tools`

---

### CPPTY04-T03: Wire Delegation Events into Session Journal

**Description:** Add journal recording for delegation lifecycle events (dispatch, completion, error, timeout, cascade cancel) so delegation activity appears in the session journal timeline.

**Files:**
- `src/lib/delegation-manager.ts` — emit journal entries on state transitions
- `src/lib/session-journal.ts` — add delegation event types to journal taxonomy
- `tests/lib/delegation-journal.test.ts` (new) — test journal recording

**Implementation Details:**
1. On `dispatch()` success → append journal entry: `eventType: "delegation.dispatched"`, actor: `"system"`.
2. On terminal transition (completed/error/timeout) → append journal entry: `eventType: "delegation.terminal"`.
3. On `cancelDelegatedSession()` → append journal entry: `eventType: "delegation.cancelled"`.
4. Journal entries include `childSessionId` and `parentSessionId` for lineage tracing.
5. Use `createJournalEntry()` with `stateRole: "audit trail"`.

**Test Scenarios:**
1. Dispatch → journal entry with `delegation.dispatched` event type.
2. Completion → journal entry with `delegation.terminal` event type and `completed` detail.
3. Error → journal entry with `delegation.terminal` event type and error detail.
4. Cancel → journal entry with `delegation.cancelled` event type.
5. Journal entries include correct `parentSessionId` and `childSessionId`.
6. Journal append failure does not block delegation dispatch (best-effort).

**Acceptance Criteria:**
- All 6 scenarios pass.
- Existing session-journal tests still pass.
- `npm run typecheck` passes.

**Estimated LOC:** ~40 (source) + ~180 (tests)

**Commit:** `feat: record delegation events in session journal`

---

### CPPTY04-T04: Add Plugin Lifecycle Cleanup Tests

**Description:** Add tests proving that plugin lifecycle events (session end, runtime restart) trigger delegation cleanup — including aborting active child sessions, marking delegations as terminal, and persisting final state.

**File:** `tests/lib/plugin-lifecycle-cleanup.test.ts` (new)

**Test Scenarios:**
1. Session end event → active delegations for that session transitioned to `error`.
2. Session end event → child sessions aborted via SDK.
3. Session end event → completion detector cancelled for child sessions.
4. Runtime restart → `recoverPending()` called, stale delegations handled.
5. Session end with no active delegations → no-op (no crash).
6. Multiple active delegations for same parent → all cleaned up.
7. Cleanup persistence: terminal delegations persisted after cleanup.

**Acceptance Criteria:**
- All 7 scenarios pass.
- Tests use mock `OpenCodeClient`.
- `npm run typecheck` passes.

**Estimated LOC:** ~200

**Commit:** `test: add plugin lifecycle cleanup tests for CP-PTY-04`

---

### CPPTY04-T05: Wire `delegation_systems.delegate_task` and `native_task` as Runtime Consumers

**Description:** Extend the `delegation_systems` config consumer to gate `delegate-task` (SDK delegation) and `native_task` (OpenCode native task tool) dispatch paths, completing the config-to-runtime wiring for all three delegation lanes.

**Files:**
- `src/lib/delegation-manager.ts` — add config check in `dispatch()` for `delegate_task`
- `src/plugin.ts` — gate `task` tool registration based on `native_task` config
- `tests/lib/delegation-systems-consumer.test.ts` — extend with SDK and native task scenarios

**Implementation Details:**
1. In `dispatch()`, before agent validation, read `getCachedConfig().delegation_systems.delegate_task`.
2. If `false`, throw `[Harness] SDK delegation disabled by delegation_systems config`.
3. In `plugin.ts`, conditionally register the `task` tool based on `native_task` config flag.
4. Default behavior: all flags default to `true` when undefined (backwards compat).

**Test Scenarios:**
1. `delegate_task: true` → SDK dispatch proceeds.
2. `delegate_task: false` → SDK dispatch throws with config-disabled message.
3. `native_task: true` → `task` tool registered in plugin.
4. `native_task: false` → `task` tool not registered in plugin.
5. All flags `false` → all delegation lanes blocked.
6. Mixed: `delegate_task: true`, `background_delegation: false` → SDK works, commands blocked.

**Acceptance Criteria:**
- All 6 scenarios pass.
- Existing delegation-manager and plugin tests still pass.
- `npm run typecheck` passes.

**Estimated LOC:** ~25 (source) + ~150 (tests)

**Commit:** `feat: wire delegation_systems.delegate_task and native_task as runtime gates`

---

### CPPTY04-T06: Create VERIFICATION.md

**Description:** Create the phase verification artifact mapping all acceptance criteria to test evidence.

**File:** `.planning/phases/CP-PTY-04-cross-cutting-shell-integration/VERIFICATION.md`

**Content:**
- Date-stamped verification report.
- Table mapping CPPTY04-AC-01 through CPPTY04-AC-06 to test file + pass count.
- Checklist: all tests pass, typecheck passes, config consumers wired, journal integration proven.
- Verdict: PASS or FAIL with remediation notes.

**Acceptance Criteria:**
- All 6 ACs mapped to evidence.
- `npm test` passes with 0 failures from new test files.

**Commit:** `docs: add CP-PTY-04 verification artifact`

---

## Wave Execution Plan

| Wave | Tasks | Parallel? | Rationale |
|------|-------|-----------|-----------|
| W1 | CPPTY04-T01, CPPTY04-T02 | Yes | Independent: T01 modifies delegation-manager, T02 adds hook tests |
| W2 | CPPTY04-T03, CPPTY04-T04 | Yes | Independent: T03 adds journal wiring, T04 adds lifecycle tests |
| W3 | CPPTY04-T05 | No | Depends on T01 pattern (same config consumer pattern) |
| W4 | CPPTY04-T06 | No | Depends on W1+W2+W3 evidence |

## Verification Commands

```bash
npm run typecheck                                    # Type-check all files
npx vitest run tests/lib/delegation-systems-consumer.test.ts
npx vitest run tests/hooks/background-command-guards.test.ts
npx vitest run tests/lib/delegation-journal.test.ts
npx vitest run tests/lib/plugin-lifecycle-cleanup.test.ts
npm test                                             # Full suite — no regressions
```

## Stop Conditions

- Any AC test file fails after 3 fix attempts → STOP, document remaining failures.
- `npm run typecheck` fails → STOP, fix type errors before continuing.
- Existing test suite regresses → STOP, fix regressions before adding new tests.
- Config consumer wiring breaks backwards compat → STOP, ensure defaults preserve existing behavior.
