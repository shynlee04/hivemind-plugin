# Phase 22: Coordination Status + Error Unification — Specification

**Spec date:** 2026-05-22
**Domain:** Coordination status model unification, delegation error typing, notification delivery reliability
**Primary source:** `.planning/phases/22-coordination-status-error-unification/22-RESEARCH.md`
**ROADMAP spec:** `.planning/ROADMAP.md:619-621`
**Phase dependency:** Phase 21.2 (front-agent switching prototype) — must be complete or explicitly deferred
**Status:** LOCKED

---

## 1. Source Audit

### Source path

- `.planning/phases/22-coordination-status-error-unification/22-RESEARCH.md` (355 lines) — primary research artifact
- `.planning/ROADMAP.md:619-621` — authoritative spec: "Unify TaskStatus ↔ DelegationStatus. Create DelegationError type. Fix notification TTL/retry."

### Date of review

2026-05-22

### Stakeholders / actors

- **DelegationManager**: Facade that creates/manages delegations — consumes DelegationStatus, emits [Harness] errors
- **NotificationRouter**: Routes completion notifications to parent sessions — owns pending notification queue
- **CompletionDetector**: Dual-signal completion detection — maps session events to CompletionSignal
- **Tool consumers** (`delegation-status.ts`, `delegate-task.ts`): Display delegation status — consume DelegationPacketStatus
- **State machine** (`state-machine.ts`): Enforces DelegationStatus transitions
- **Continuity module** (`continuity/index.ts`): Persists pending notifications — dormant retry path

### Explicit MUST/SHOULD/MAY from source

| Type | Statement | Source line |
|------|-----------|-------------|
| MUST | Add `delegationStatusToHarnessStatus()` mapping function in `src/shared/types.ts` | RESEARCH.md:11 |
| MUST | Create `DelegationErrorCode` const union in `src/coordination/delegation/types.ts` | RESEARCH.md:158-178 |
| MUST | Create `DelegationError` struct in `src/coordination/delegation/types.ts` | RESEARCH.md:187-192 |
| MUST | Create `createDelegationError()` factory in `src/coordination/delegation/types.ts` | RESEARCH.md:194-200 |
| MUST | Activate notification retry counter with `maxRetries` in `notification-router.ts` | RESEARCH.md:9-10 |
| MUST | Add notification TTL expiry to pending notifications | RESEARCH.md:9-10 |
| MUST | Scope changes to 5 coordination files + `src/shared/types.ts` + `src/task-management/continuity/index.ts` | RESEARCH.md:137-140 |
| MUST NOT | Merge enums (TaskStatus, DelegationStatus, HarnessStatus, etc.) | RESEARCH.md:123 |
| MUST NOT | Create global `HarnessError` class | RESEARCH.md:124 |
| SHOULD | Keep raw `throw new Error("[Harness]...")` for fatal preflight failures | RESEARCH.md:266 |
| MAY | Update `PendingNotificationRecord` in `continuity/index.ts` to carry retry count + TTL | RESEARCH.md:226-237 |
| MAY | Verify TERMINAL_EVENTS mapping in `detector.ts` | RESEARCH.md:81 |

### Implicit requirements

- Mapping function is **opt-in** — existing direct imports of DelegationStatus continue to work unchanged
- DelegationError struct is NOT an Error subclass — it is a plain data structure for tool responses and notifications
- Notification retry is lightweight (`setTimeout` + counter) — no cron/scheduler within Phase 22 scope

### Out-of-scope statements

- "The remaining 10+ sites are Phase 33 (Async I/O + Typed Errors) work" — RESEARCH.md:139
- "Full error typing of manager.ts is Phase 33 work" — RESEARCH.md:266
- Full scheduler for notifications "belongs in Phase 25 (Notification Redesign)" — RESEARCH.md:132

---

## 2. Ambiguity Gate

| Check | Pass condition | Result |
|-------|---------------|--------|
| Specific | Actor, action, object, and context are named | ✅ — All requirements have named actors (DelegationManager, NotificationRouter, tool consumers) |
| Measurable | Observable output, state, event, metric, or error exists | ✅ — Each requirement produces a typed export, function, or testable behavior |
| Achievable | Project constraints do not contradict it | ✅ — No new dependencies, no breaking changes to existing exports |
| Relevant | Maps to the requested product/workflow goal | ✅ — Every requirement maps to ROADMAP.md:619-621 goal |
| Testable | At least one verification method exists | ✅ — All requirements have automated unit test + typecheck verification |

**No ambiguous terms found.** All design decisions have measurable thresholds and explicit boundaries.

---

## 3. Design Decisions (LOCKED)

| Decision | Choice | Rationale | Source |
|----------|--------|-----------|--------|
| D1 — Status model | Keep 5 enums + add mapping function | Merging enums is a breaking change across 11 import sites; mapping is zero-risk and opt-in | RESEARCH.md:11, 123 |
| D2 — Error typing | `DelegationErrorCode` union + `DelegationError` struct + factory | Plain data structure (not Error subclass); machine-readable with optional sessionId + timestamp | RESEARCH.md:117-119, 266 |
| D3 — Error scope | Only 5 coordination files + shared/types.ts + continuity/index.ts | 8 out-of-coordination files have different error domains; Phase 33 covers those | RESEARCH.md:137-140 |
| D4 — Notification retry | `setTimeout` + maxRetries counter; no cron/scheduler | Phase 22 scope is lightweight; full scheduler is Phase 25 | RESEARCH.md:128-132 |
| D5 — Status mapping opt-in | Existing direct imports continue unchanged | mapping function is called only at explicit boundary points | RESEARCH.md:153-154 |
| D6 — Raw throws preserved | Fatal preflight errors remain `throw new Error("[Harness]...")` | Only notification-route and tool-response paths get DelegationError | RESEARCH.md:266 |

---

## 4. Requirements

### P22-01: `delegationStatusToHarnessStatus()` mapping function

**Source:** RESEARCH.md:11, RESEARCH.md:203-223
**Condition:** The system SHALL provide a pure function `delegationStatusToHarnessStatus()` in `src/shared/types.ts` that maps all 5 `DelegationStatus` values (dispatched, running, completed, error, timeout) to corresponding `HarnessStatus` values via a bijective mapping table.
**Acceptance Criteria:**
- Given a `DelegationStatus` of `"dispatched"`, when the function is called, then it returns `"pending"` (or the HarnessStatus equivalent for in-progress).
- Given a `DelegationStatus` of `"error"`, when the function is called, then it returns the HarnessStatus error equivalent.
- Given a `DelegationStatus` of `"completed"`, when the function is called, then it returns the HarnessStatus success equivalent.
- Given a `DelegationStatus` of `"timeout"`, when the function is called, then it returns the HarnessStatus timeout equivalent.
- The function SHALL NOT mutate either enum.
**Verification Method:** Unit test (`npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "delegationStatusToHarnessStatus"`)
**Integration Notes:** Import from `src/shared/types.ts`; consumed by tool response shaping and notification payloads. Existing direct imports of `DelegationStatus` remain unaffected.
**Status:** LOCKED

### P22-02: `DelegationErrorCode` const union

**Source:** RESEARCH.md:158-178, RESEARCH.md:128-131
**Condition:** The system SHALL export a const union `DelegationErrorCode` from `src/coordination/delegation/types.ts` containing at minimum the following codes: `SLOT_LIMIT_REACHED`, `SLOT_ACQUIRE_TIMEOUT`, `PER_KEY_LIMIT_REACHED`, `UNKNOWN_AGENT`, `CHILD_SESSION_FAILED`, `CANNEL_TERMINAL`, `ADJUST_PROMPT_NO_SESSION`, `CHANGE_AGENT_NO_SESSION`, `RESUME_NO_PROMPT`, `RUNTIME_NOT_CONFIGURED`, `QUEUE_KEY_DRIFT`, `UNKNOWN_ERROR`.
**Acceptance Criteria:**
- Given the module is imported, when `DelegationErrorCode` is accessed, then it contains exactly the codes listed above as `as const` string literals.
- The type `DelegationErrorCode` (lowercase) SHALL be derived from `(typeof DelegationErrorCode)[keyof typeof DelegationErrorCode]`.
- Exhaustive switch over `DelegationErrorCode` SHALL be type-checked (no implicit `any`).
**Verification Method:** Unit test + TypeScript type check (`npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "DelegationErrorCode"`)
**Integration Notes:** Co-located with `DelegationError` struct and `createDelegationError()` factory in the same module.
**Status:** LOCKED

### P22-03: `DelegationError` struct

**Source:** RESEARCH.md:187-192
**Condition:** The system SHALL export an interface `DelegationError` from `src/coordination/delegation/types.ts` with fields: `code: DelegationErrorCode`, `message: string`, `sessionId?: string`, `timestamp: number`.
**Acceptance Criteria:**
- Given the interface is defined, when a `DelegationError` object is created, then it has a required `code` property typed as `DelegationErrorCode`.
- Given a `DelegationError` object, when `.sessionId` is omitted, then it is `undefined` (optional).
- Given a `DelegationError` object, when `.timestamp` is accessed, then it is a `number` (Unix epoch milliseconds).
- The interface SHALL NOT extend `Error` — it is a plain data structure.
**Verification Method:** Unit test + type check (`npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "DelegationError"`)
**Integration Notes:** Created exclusively via `createDelegationError()` factory. Used in tool response paths and notification payloads.
**Status:** LOCKED

### P22-04: `createDelegationError()` factory

**Source:** RESEARCH.md:194-200
**Condition:** The system SHALL export a function `createDelegationError(code: DelegationErrorCode, message: string, sessionId?: string): DelegationError` from `src/coordination/delegation/types.ts` that creates a valid `DelegationError` with the current timestamp (`Date.now()`).
**Acceptance Criteria:**
- Given valid `code` and `message` arguments, when the factory is called, then it returns a `DelegationError` with the given code and message.
- Given a `sessionId` argument, when the factory is called, then the returned error includes `sessionId`.
- Without a `sessionId` argument, when the factory is called, then `sessionId` is `undefined` in the returned error.
- The `timestamp` field SHALL be set to `Date.now()` at call time.
**Verification Method:** Unit test (`npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "createDelegationError"`)
**Integration Notes:** Primary factory for creating coordination-layer errors. Used instead of `throw new Error("[Harness]...")` for notification/tool-response paths.
**Status:** LOCKED

### P22-05: Notification retry counter

**Source:** RESEARCH.md:226-237, RESEARCH.md:128-132
**Condition:** The system SHALL add a retry counter to pending notification delivery in `src/coordination/delegation/notification-router.ts` such that a failed delivery attempt increments a counter and the notification is dropped when `retryCount >= maxRetries`.
**Acceptance Criteria:**
- Given a pending notification with `retryCount: 0` and `maxRetries: 1`, when the first delivery attempt fails, then `retryCount` increments to 1 and the notification is re-queued.
- Given a pending notification with `retryCount: 1` and `maxRetries: 1`, when the second delivery attempt fails, then the notification is dropped (not re-queued).
- The `maxRetries` default SHALL be `1` (one retry after initial failure).
**Verification Method:** Unit test (`npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "retry"`)
**Integration Notes:** Activates retry on `PendingNotificationRecord` in `notification-router.ts`. Continuity persistence uses a separate type `PendingNotification` (shared/types.ts) — see P22-07b for that schema update.
**Status:** LOCKED

### P22-06: Notification TTL expiry

**Source:** RESEARCH.md:226-237, RESEARCH.md:132
**Condition:** The system SHALL add a TTL (time-to-live) expiry to pending notifications in `src/coordination/delegation/notification-router.ts` such that any pending notification whose `expiresAt` timestamp is in the past is silently dropped during replay.
**Acceptance Criteria:**
- Given a pending notification with `expiresAt` set to a past timestamp, when `replayPending()` is called, then the expired notification is NOT included in the replayed results.
- Given a pending notification with `expiresAt` set to a future timestamp, when `replayPending()` is called, then the notification IS included in the replayed results.
- The default TTL SHALL be 5 minutes from creation.
**Verification Method:** Unit test (`npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "TTL"`)
**Integration Notes:** TTL prevents stale notifications from accumulating in the pending queue indefinitely. Complements the retry counter — a notification can be dropped via retry exhaustion OR TTL expiry.
**Status:** LOCKED

### P22-07a: `PendingNotificationRecord` schema update (notification-router.ts)

**Source:** RESEARCH.md:226-237, gsd-assumptions-analyzer finding #1
**Condition:** The system SHALL update the `PendingNotificationRecord` struct in `src/coordination/delegation/notification-router.ts` to include `retryCount: number`, `maxRetries: number`, and `expiresAt: number` fields, extending the current schema (`parentSessionId`, `notification`, `stateRoot`).
**Acceptance Criteria:**
- Given a `PendingNotificationRecord` is created after the update, when its fields are accessed, then `retryCount` (number), `maxRetries` (number), and `expiresAt` (number) are all present.
- The existing `parentSessionId`, `notification`, and `stateRoot` fields SHALL be preserved for backward compatibility.
- `createdAt` SHALL NOT be added — `PendingNotificationRecord` creation timestamp is tracked at runtime; persistence uses the separate `PendingNotification` type.
**Verification Method:** Unit test + type check (`npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "PendingNotificationRecord"`)
**Integration Notes:** NotificationRouter owns `PendingNotificationRecord` locally. Continuity persistence uses a different type (`PendingNotification` from shared/types.ts) — see P22-07b.
**Status:** LOCKED

### P22-07b: `PendingNotification` schema update (shared/types.ts)

**Source:** gsd-assumptions-analyzer finding #1
**Condition:** The system SHALL update the `PendingNotification` interface in `src/shared/types.ts` to include `retryCount: number` and `maxRetries: number` fields. `createdAt: number` already exists and SHALL NOT be re-added.
**Acceptance Criteria:**
- Given a `PendingNotification` is created after the update, when its fields are accessed, then `retryCount` (number) and `maxRetries` (number) are present.
- The existing `createdAt`, `delivered`, and `TaskNotification` inherited fields SHALL be preserved.
**Verification Method:** Unit test + type check (`npx vitest run tests/lib/coordination/continuity/continuity.test.ts -t "PendingNotification"`)
**Integration Notes:** This type flows through `continuity/index.ts` persistence path. The serialization format in `.hivemind/state/session-continuity.json` is backward-compatible — new fields are additive.
**Status:** LOCKED

### P22-08: `replayPending()` cleanup for expired records

**Source:** gsd-assumptions-analyzer finding #4
**Condition:** The system SHALL filter expired and exhausted records during `replayPending()` in `src/coordination/delegation/notification-router.ts`. Records with `expiresAt` in the past or `retryCount >= maxRetries` SHALL be silently dropped and removed from the in-memory pending routes Map.
**Acceptance Criteria:**
- Given a `PendingNotificationRecord` with `expiresAt` in the past, when `replayPending()` is called, the record is NOT included AND is removed from the in-memory Map.
- Given a `PendingNotificationRecord` with `retryCount >= maxRetries`, when `replayPending()` is called, the record is NOT included AND is removed from the in-memory Map.
**Verification Method:** Unit test (`npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "replayPending"`)
**Integration Notes:** Prevents memory leak from accumulated stale records. Removes from both the returned results and the internal `this.routes` Map.
**Status:** LOCKED

### P22-09: Scope boundary enforcement

**Source:** RESEARCH.md:137-140, RESEARCH.md:124
**Condition:** The system SHALL limit all Phase 22 changes to the following files only: `src/shared/types.ts` (mapping function + PendingNotification schema), `src/coordination/delegation/types.ts` (error types), `src/coordination/delegation/notification-router.ts` (retry + TTL + PendingNotificationRecord schema + replayPending cleanup), `src/coordination/completion/detector.ts` (TERMINAL_EVENTS verification only), `src/task-management/continuity/index.ts` (PendingNotification persistence — no struct change needed, flows from shared/types.ts), and `tests/lib/coordination/` (test files). The system SHALL NOT modify files outside this scope, specifically SHALL NOT modify lifecycle/, ralph-loop/, auto-loop/, configure-primitive/, doc-intelligence/, session-creator/, or discovery/.
**Acceptance Criteria:**
- Given a PR for Phase 22, when the diff is inspected, then no file outside the allowed list has been modified.
- Given the existing 8 out-of-coordination `[Harness]` error sites (lifecycle/command-engine/ralph-loop/auto-loop/configure-primitive/doc-intelligence/session-creator/discovery), when checked, then none have been touched.
**Verification Method:** Inspection of `git diff` against base branch, filtered to allowed file list
**Integration Notes:** This is a governance requirement — it exists to prevent the scope creep identified in Pitfall 1 of RESEARCH.md (lines 135-139).
**Status:** LOCKED

---

## 5. Acceptance Test Matrix

| REQ ID | Source path | Positive case | Negative case | Boundary case | Integration case | Verification method | Coverage state |
|--------|-------------|---------------|---------------|---------------|------------------|---------------------|----------------|
| P22-01 | RESEARCH.md:203-223 | Maps all 5 DelegationStatus values correctly | N/A — pure function, no invalid input | N/A — all 5 values covered | Cross-boundary: mapping function used in tool response shaping | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "delegationStatusToHarnessStatus"` | mapped |
| P22-02 | RESEARCH.md:158-178 | Exports const union with 12 codes | TypeScript exhaustiveness check | N/A — all codes are string literals | Cross-module: imported by DelegationError struct | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "DelegationErrorCode"` | mapped |
| P22-03 | RESEARCH.md:187-192 | Creates DelegationError with all required fields | N/A — interface, must be satisfied | sessionId is undefined when omitted | Cross-module: used as payload in notification routes | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "DelegationError"` | mapped |
| P22-04 | RESEARCH.md:194-200 | Returns valid DelegationError with timestamp | Throws nothing — factory is total function | No sessionId → undefined | Factory consumed by DelegationManager paths | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "createDelegationError"` | mapped |
| P22-05 | RESEARCH.md:226-237 | Retry counter increments and drops at maxRetries | Delivery succeeds on first try → no retry | maxRetries = 0 (no retry) | Retry state persists through `persistPending` callback | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "retry"` | mapped |
| P22-06 | RESEARCH.md:226-237 | TTL drops expired notifications | TTL not yet expired → notification delivered | expiresAt exactly equals Date.now() (dropped) | replayPending filters expired before returning | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "TTL"` | mapped |
| P22-07a | gsd-assumptions | PendingNotificationRecord gets retryCount, maxRetries, expiresAt | N/A — struct extension | Max fields null (edge-safe) | Cross-boundary: notification-router reads new fields for retry/TTL logic | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "PendingNotificationRecord"` | mapped |
| P22-07b | gsd-assumptions | PendingNotification gets retryCount, maxRetries; createdAt preserved | N/A — struct extension | retryCount default 0 | Persistence round-trip via continuity/index.ts | `npx vitest run tests/lib/coordination/continuity/continuity.test.ts -t "PendingNotification"` | mapped |
| P22-08 | gsd-assumptions | replayPending filters expired + exhausted records | No expired records → all returned | expiresAt === Date.now() | Memory cleanup: in-memory Map also purged | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "replayPending"` | mapped |
| P22-09 | RESEARCH.md:137-140 | Only allowed files in diff | Out-of-scope files detected → FAIL | Empty diff on unowned files | Gate check before merge | `git diff --name-only` inspection | mapped |

---

## 6. Scope Boundary

### IN SCOPE

| File | What changes | Why |
|------|-------------|-----|
| `src/shared/types.ts` | Add `delegationStatusToHarnessStatus()` mapping function (P22-01) + update `PendingNotification` schema (P22-07b) | Status boundary + notification field unification |
| `src/coordination/delegation/types.ts` | Add `DelegationErrorCode` union, `DelegationError` struct, `createDelegationError()` factory (P22-02/03/04) | Structured error types for coordination layer |
| `src/coordination/delegation/notification-router.ts` | Add retry counter (P22-05) + TTL expiry (P22-06) + PendingNotificationRecord schema (P22-07a) + replayPending cleanup (P22-08) | Activate dormant retry path + memory safety |
| `src/coordination/completion/detector.ts` | Verify TERMINAL_EVENTS mapping (no-code or trivial) | Ensure terminal events match DelegationStatus terminal states |
| `src/task-management/continuity/index.ts` | PendingNotification persistence — struct flows from shared/types.ts update (P22-07b), no separate change needed | Continuity persistence path |
| `tests/lib/coordination/delegation/status-mapping.test.ts` | New test file — covers P22-01, P22-02, P22-04 | Wave 0 test coverage |
| `tests/lib/coordination/delegation/notification-router.test.ts` | Extended — add P22-03, P22-05, P22-06, P22-07a, P22-08 coverage | Wave 0 test coverage |
| `tests/lib/coordination/continuity/continuity.test.ts` | Extended — add P22-07b coverage | Wave 0 test coverage |

### OUT OF SCOPE

| File/Domain | Why excluded |
|-------------|--------------|
| `src/coordination/delegation/manager.ts` (12 throw sites) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/manager-runtime.ts` (4 throw sites) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/slot-manager.ts` (3 throw sites) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/agent-resolver.ts` (1 throw site) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/sdk-child-session-starter.ts` (1 throw site) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/dispatcher.ts` (1 throw site) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/sdk-delegation/handler.ts` (1 throw site) | Fatal preflight errors — Phase 33 work |
| `src/coordination/delegation/state-machine.ts` | Terminal transitions already correct — no change needed |
| Lifecycle/, ralph-loop/, auto-loop/, configure-primitive/, doc-intelligence/, session-creator/, discovery/ | Different error domains — Phase 33 work |
| Enum merging (TaskStatus, DelegationStatus, etc.) | Breaking change — rejected per D1 |
| Global `HarnessError` class | Scope creep — rejected per D2 |

---

## 7. Evidence Map

### Error surface (coordination layer only)

| File | `[Harness]` throw sites | Phase 22 action |
|------|------------------------|-----------------|
| `src/coordination/delegation/manager.ts` | ~12 sites (lines 176, 181, 186, 197, 200, 207, 210, 213, 225, ...) | Keep as raw throws (fatal) — P22-08 enforces no-touch |
| `src/coordination/delegation/manager-runtime.ts` | ~4 sites | Keep as raw throws — P22-08 enforces no-touch |
| `src/coordination/delegation/slot-manager.ts` | ~3 sites | Keep as raw throws — P22-08 enforces no-touch |
| `src/coordination/delegation/agent-resolver.ts` | ~1 site | Keep as raw throws — P22-08 enforces no-touch |
| `src/coordination/delegation/sdk-child-session-starter.ts` | ~1 site | Keep as raw throws — P22-08 enforces no-touch |
| `src/coordination/delegation/notification-router.ts` | 0 (uses RouteResult) | Add retry + TTL — P22-05, P22-06 |

### Status universe map

| Status enum | Values | Location | Phase 22 action |
|-------------|--------|----------|-----------------|
| `TaskStatus` | 8: pending, queued, running, completed, failed, error, cancelled, interrupt | `src/shared/task-status.ts:3` | No change — consumed by state machine only |
| `DelegationStatus` | 5: dispatched, running, completed, error, timeout | `src/coordination/delegation/types.ts:1-7` | Input to mapping function (P22-01) |
| `HarnessStatus` | 9: pending, queued, dispatching, running, completed, error, cancelled, interrupt, failed | `src/shared/types.ts:134-144` | Output of mapping function (P22-01) |
| `DelegationPacketStatus` | 4: pending, running, completed, failed | `src/shared/types.ts:145` | No change — tool envelope only |
| `CompletionSignal` | 5: idle, error, deleted, timeout, cancelled | `src/coordination/completion/detector.ts:3` | VERIFY TERMINAL_EVENTS (P22-08) |

---

## 8. Handoff Packet

```yaml
requirements:
  - id: P22-01
    condition: delegationStatusToHarnessStatus() maps all 5 DelegationStatus values
    acceptance_tests:
      - positive: dispatched → pending-equivalent
      - positive: error → error-equivalent
    file: src/shared/types.ts
  - id: P22-02
    condition: DelegationErrorCode const union with 12 codes
    acceptance_tests:
      - positive: all codes present as const
      - negative: exhaustive switch type-check
    file: src/coordination/delegation/types.ts
  - id: P22-03
    condition: DelegationError interface with code, message, sessionId?, timestamp
    acceptance_tests:
      - positive: all required fields present
      - boundary: sessionId optional
    file: src/coordination/delegation/types.ts
  - id: P22-04
    condition: createDelegationError() factory
    acceptance_tests:
      - positive: returns valid DelegationError
      - boundary: no sessionId argument
    file: src/coordination/delegation/types.ts
  - id: P22-05
    condition: Notification retry counter
    acceptance_tests:
      - positive: increments on failure
      - boundary: stops at maxRetries
    file: src/coordination/delegation/notification-router.ts
  - id: P22-06
    condition: Notification TTL expiry
    acceptance_tests:
      - positive: expired dropped
      - boundary: exactly at expiry time
    file: src/coordination/delegation/notification-router.ts
  - id: P22-07a
    condition: PendingNotificationRecord schema (notification-router.ts) — add retryCount, maxRetries, expiresAt
    acceptance_tests:
      - positive: new fields present
      - boundary: createdAt NOT added (separate type)
    file: src/coordination/delegation/notification-router.ts
  - id: P22-07b
    condition: PendingNotification schema (shared/types.ts) — add retryCount, maxRetries; createdAt already exists
    acceptance_tests:
      - positive: new fields present
      - boundary: createdAt preserved (not re-added)
    file: src/shared/types.ts
  - id: P22-08
    condition: replayPending() filters expired + exhausted records, purges from in-memory Map
    acceptance_tests:
      - positive: expired records dropped from results AND Map
      - boundary: retryCount >= maxRetries dropped
    file: src/coordination/delegation/notification-router.ts
  - id: P22-09
    condition: Scope boundary enforced
    acceptance_tests:
      - positive: only allowed files changed
      - negative: out-of-scope files untouched
    verification: git diff --name-only

red_phase_expectation: tests fail before implementation
verification_commands:
  - npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts
  - npx vitest run tests/lib/coordination/delegation/notification-router.test.ts
  - npx vitest run tests/lib/coordination/continuity/continuity.test.ts -t "PendingNotification"
  - npx vitest run tests/lib/coordination/
  - npm run typecheck
blocked_items: []
traceability_matrix: ".planning/phases/22-coordination-status-error-unification/22-SPEC.md#5-acceptance-test-matrix"
source_synthesis:
  - ROADMAP.md:619-621 — spec authorization
  - RESEARCH.md:11 — keep 5 enums + add mapping
  - RESEARCH.md:158-178 — DelegationErrorCode design
  - RESEARCH.md:203-223 — mapping function design
  - RESEARCH.md:226-237 — notification retry + TTL pattern
  - RESEARCH.md:137-140 — scope boundary
```

---

## 9. Quality Self-Assessment

- [x] All sections present (Source Audit → Ambiguity Gate → Requirements → Test Matrix → Scope → Handoff)
- [x] Requirements are falsifiable (EARS "SHALL" syntax with testable acceptance criteria)
- [x] Traceability: every requirement links to RESEARCH.md line evidence
- [x] No vague terms — all thresholds numeric (maxRetries=1, TTL=5min)
- [x] No TODO/FIXME/placeholder content
- [x] Scope boundary explicitly defined (IN/OUT tables with file-level granularity)
- [x] Design decisions LOCKED — no open debates
- [x] Handoff packet complete for `hm-test-driven-execution`
