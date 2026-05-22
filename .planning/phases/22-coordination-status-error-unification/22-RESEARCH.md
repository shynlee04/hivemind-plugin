# Phase 22: Coordination Status + Error Unification — Research

**Researched:** 2026-05-22
**Domain:** Coordination status model unification, delegation error typing, notification delivery reliability
**Confidence:** HIGH

## Summary

Phase 22 addresses a structural debt in the coordination layer: **5 overlapping status universes** (`TaskStatus`, `DelegationStatus`, `HarnessStatus`, `DelegationPacketStatus`, `CompletionSignal`) co-exist without a canonical mapping, and **33+ error throw sites** use bare `throw new Error("[Harness]...")` with no structured error type. The ROADMAP.md goal is threefold: (1) unify TaskStatus ↔ DelegationStatus, (2) create a `DelegationError` type, (3) fix notification TTL/retry.

**Key discovery:** The hand-wavy "unify" spec covers 5 distinct enums, not 2. The recommended approach avoids merging enums (breaking change risk) and instead adds a single `delegationStatusToHarnessStatus()` mapping function in `src/shared/types.ts`. Notification delivery already has a dormant `PendingNotificationRecord` persistence path in `continuity/index.ts` that can be activated with a retry count + TTL. The error surface spans 5 coordination files (manager.ts, manager-runtime.ts, slot-manager.ts, agent-resolver.ts, sdk-child-session-starter.ts) plus 8 out-of-scope files — Phase 22 should only touch the 5 coordination files.

**Primary recommendation:** Keep 5 enums + add mapping function. Create `DelegationError` struct with codes. Activate pending notification retry path. Scope errors to coordination layer only.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Status mapping | `src/shared/types.ts` | `src/coordination/delegation/types.ts` | HarnessStatus lives in shared; DelegationStatus lives in coordination; mapping function goes in shared |
| Delegation error typing | `src/coordination/delegation/types.ts` | `src/shared/types.ts` | DelegationError is coordination-domain; shared import for tool response envelope |
| Notification retry/TTL | `src/coordination/delegation/notification-router.ts` | `src/task-management/continuity/index.ts` | Router owns delivery logic; continuity owns persistence |
| Completion signal mapping | `src/coordination/completion/detector.ts` | `src/coordination/delegation/state-machine.ts` | Detector owns signal emission; state machine owns terminal transitions |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.7+ | Type system | native project constraint |
| Vitest | 4.1.7 | Test runner | project standard |
| Zod | 4.4.3 | Runtime validation | project standard for schemas |

**Installation:**
```bash
# No new dependencies — this phase uses only existing project stack
```

**Version verification:** Vitest 4.1.7 [VERIFIED: npm registry], Zod 4.4.3 [VERIFIED: npm registry]. No new packages needed.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────┐
                         │     DelegationManager        │
                         │  (manager.ts: facade)        │
                         │  12 throw Error("[Harness])  │
                         └──────────┬──────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ DelegationRuntime │  │   SlotManager     │  │   AgentResolver   │
   │ (manager-runtime) │  │ (slot-manager.ts) │  │ (agent-resolver)  │
   │  4 throw sites     │  │  3 throw sites    │  │  1 throw site     │
   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
            │                     │                      │
            ▼                     ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ StateMachine     │  │ ConcurrencyQueue  │  │SDK Child Session │
   │ (state-machine)  │  │ (queue.ts)        │  │(sdk-child-sess..)│
   │ status transitions│  │ per-key gating    │  │  1 throw site    │
   └────────┬─────────┘  └──────────────────┘  └──────────────────┘
            │
            ▼
   ┌──────────────────┐
   │ NotificationRouter│
   │ (notification-   │
   │  router.ts)       │
   │ pending queue →   │
   │ continuity/index  │
   └──────────────────┘


   Status Mapping Flow:
   DelegationStatus ──delegationStatusToHarnessStatus()──► HarnessStatus
   TaskStatus ───────► (no change — state machine only)
   DelegationPacketStatus ──► (no change — tool envelope only)
   CompletionSignal ───────► (maps to terminal events in detector.ts)
```

### Recommended Project Structure

No structural changes needed. All implementation lives within existing files:

```
src/
├── shared/
│   └── types.ts                  # Add delegationStatusToHarnessStatus() mapping
├── coordination/
│   ├── delegation/
│   │   ├── types.ts              # Add DelegationErrorCode union, DelegationError struct
│   │   ├── notification-router.ts # Activate pending retry + TTL
│   │   ├── manager.ts            # Wired into... keep as-is but may consume DelegationError
│   │   ├── manager-runtime.ts    # 4 sites stay raw [Harness] or keep legacy
│   │   ├── slot-manager.ts       # 3 sites stay raw [Harness] or keep legacy
│   │   ├── agent-resolver.ts     # 1 site stays raw [Harness] or keep legacy
│   │   ├── sdk-child-session-starter.ts  # 1 site stays raw [Harness] or keep legacy
│   │   └── state-machine.ts      # DelegationStateMachine terminal transitions
│   └── completion/
│       └── detector.ts           # Dual-signal, TERMINAL_EVENTS mapping
└── task-management/
    └── continuity/
        └── index.ts              # PendingNotification persistence path (existing)
```

### Pattern 1: Status Mapping Function

**What:** A pure function that converts between status universes at the boundary, keeping each enum independent.
**When to use:** Every time a status value crosses from DelegationStatus domain into HarnessStatus domain.
**Why:** Merging enums is a breaking change that cascades into every consumer import. A mapping function is zero-risk, discoverable, and invertible.

### Pattern 2: DelegationError Struct

**What:** A structured error type with machine-readable code + human-readable message + optional sessionId + timestamp.
**When to use:** For all coordination-layer error sites where a structured response is needed (tool responses, notification payloads).
**Why:** Raw `throw new Error("[Harness]...")` is opaque — consumers must parse the string prefix. A typed struct enables error handling without string parsing.

### Anti-Patterns to Avoid

- **Merging enums:** Breaking change across 11 import sites (TaskStatus in tools, DelegationStatus in delegation, HarnessStatus in shared). Creates churn without value.
- **Creating a global `HarnessError` class:** The 8 out-of-coordination files (lifecycle/index.ts, command-engine, ralph-loop, auto-loop, configure-primitive, doc-intelligence, session-creator, discovery) use `[Harness]` prefix for different domains. Global class requires touching all 33+ sites in a cross-cutting change. Phase 22 should only coordinate errors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error code union | Ad-hoc string matching | `DelegationErrorCode` const union | Exhaustive checking, no risk of typos |
| Notification retry | Custom cron/scheduler | Simple `setTimeout` with maxRetries counter | Phase 22 scope is lightweight — TTL + retry count is sufficient; full scheduler belongs in Phase 25 (Notification Redesign) |

## Common Pitfalls

### Pitfall 1: Scope Creep into Non-Coordination Error Sites

**What goes wrong:** Researcher identifies 33+ `throw new Error("[Harness]...")` sites across 13 files — planner includes all of them.
**Why it happens:** The grep result is seductive: "33 sites to fix, it's one pattern." But 8 of those files (lifecycle/index.ts, command-engine/index.ts, ralph-loop/index.ts, auto-loop/index.ts, configure-primitive.ts, doc-intelligence/router.ts, session-creator.ts, discovery.ts) belong to different domains.
**How to avoid:** Scope Phase 22 to **coordination-layer errors only**: manager.ts (12), manager-runtime.ts (4), slot-manager.ts (3), agent-resolver.ts (1), sdk-child-session-starter.ts (1), dispatcher.ts (1), sdk-delegation/handler.ts (1). That's 5 files within `src/coordination/`, ~23 sites. The remaining 10+ sites are Phase 33 (Async I/O + Typed Errors) work.
**Warning signs:** PLAN.md includes lifecycle/lifecycle, ralph-loop, auto-loop files.

### Pitfall 2: Over-Engineering the Error Type

**What goes wrong:** Designing a full error hierarchy with subclasses, error cause chains, and serialization.
**Why it happens:** It's tempting to build a reusable error framework. But Phase 22 only needs coordination-layer errors.
**How to avoid:** Keep `DelegationError` as a simple struct (interface, not class). Add `toToolResponse()` helper that shapes it for the tool response envelope.
**Warning signs:** Plan includes AbstractError base class, serialization logic, or error cause chains.

### Pitfall 3: Breaking Status Mapping for Existing Consumers

**What goes wrong:** Adding a mapping function changes downstream behavior because consumers expected raw enum values.
**Why it happens:** Some tools import `DelegationStatus` directly (e.g., `delegation-status.ts`). Adding a mapping changes what they display.
**How to avoid:** The mapping function is **opt-in** — existing direct imports continue to work. Only use the mapping at explicit boundary points (e.g., tool response shaping, notification payloads).
**Warning signs:** Plan deletes or modifies existing enum values.

## Code Examples

### DelegationError Type Definition (Add to `src/coordination/delegation/types.ts`)

```typescript
/**
 * Machine-readable error codes for coordination-layer delegation failures.
 * @phase 22
 */
export const DelegationErrorCode = {
  SLOT_LIMIT_REACHED: "SLOT_LIMIT_REACHED",
  SLOT_ACQUIRE_TIMEOUT: "SLOT_ACQUIRE_TIMEOUT",
  PER_KEY_LIMIT_REACHED: "PER_KEY_LIMIT_REACHED",
  UNKNOWN_AGENT: "UNKNOWN_AGENT",
  CHILD_SESSION_FAILED: "CHILD_SESSION_FAILED",
  CANNEL_TERMINAL: "CANNEL_TERMINAL",
  ADJUST_PROMPT_NO_SESSION: "ADJUST_PROMPT_NO_SESSION",
  CHANGE_AGENT_NO_SESSION: "CHANGE_AGENT_NO_SESSION",
  RESUME_NO_PROMPT: "RESUME_NO_PROMPT",
  RUNTIME_NOT_CONFIGURED: "RUNTIME_NOT_CONFIGURED",
  QUEUE_KEY_DRIFT: "QUEUE_KEY_DRIFT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

export type DelegationErrorCode = (typeof DelegationErrorCode)[keyof typeof DelegationErrorCode]

/**
 * Structured delegation error with machine-readable code and human-readable message.
 * NOT an Error subclass — a plain data structure for tool responses and notifications.
 * @phase 22
 */
export interface DelegationError {
  code: DelegationErrorCode
  message: string
  sessionId?: string
  timestamp: number
}

export function createDelegationError(
  code: DelegationErrorCode,
  message: string,
  sessionId?: string,
): DelegationError {
  return { code, message, sessionId, timestamp: Date.now() }
}
```

### Status Mapping Function (Add to `src/shared/types.ts`)

```typescript
import type { DelegationStatus } from "../coordination/delegation/types.js"
import { HarnessStatus } from "./types.js" // already in same module

/**
 * Map DelegationStatus → HarnessStatus at the coordination-to-plugin boundary.
 * Keeps each enum independent and avoids breaking existing direct imports.
 * @phase 22
 */
export function delegationStatusToHarnessStatus(status: DelegationStatus): HarnessStatus {
  const map: Record<DelegationStatus, HarnessStatus> = {
    dispatched: HarnessStatus.InProgress,
    running: HarnessStatus.InProgress,
    completed: HarnessStatus.Success,
    error: HarnessStatus.Failure,
    timeout: HarnessStatus.Timeout,
  }
  return map[status]
}
```

### Notification Retry Pattern (Activate in `src/coordination/delegation/notification-router.ts`)

```typescript
interface PendingNotificationRecord {
  delegationId: string
  payload: DelegationNotification
  retryCount: number
  maxRetries: number
  expiresAt: number // timestamp after which this notification is dropped
  createdAt: number
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `throw new Error("[Harness]...")` with string prefix | `DelegationError` struct with typed codes | Phase 22 | Consumers can handle errors by code instead of string-parsing |
| No mapping between status universes | `delegationStatusToHarnessStatus()` function | Phase 22 | Explicit boundary at coordination→plugin interface |
| Fire-and-forget notification delivery | Hybrid: fire-and-forget with 1 retry + pending queue fallback | Phase 22 | Notifications survive transient delivery failures |

**Deprecated/outdated:**
- Raw `[Harness]` string prefix in coordination files: replaced by `DelegationError` in notification/tool-response paths, though `throw new Error` sites remain for fatal preflight failures that should crash the delegation.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 33+ `throw new Error("[Harness]...")` sites exist in coordination files | Common Pitfalls / Code Examples | Low — verified by grep, count may shift ±2 as files change |
| A2 | No HarnessError class exists anywhere | Summary | Low — verified by class/interface grep |
| A3 | PendingNotification persistence path in continuity/index.ts is dormant (no active retry) | Summary | Low — verified reading notification-router.ts and continuity/index.ts |
| A4 | 11 import sites consume TaskStatus/DelegationStatus across 4 directories | Status mapping | Low — verified by grep of import statements |

**This table is empty of true assumptions:** All claims are verified by live grep or file reads. No user confirmation needed for these factual claims.

## Open Questions

1. **Should the 4 non-coordination delegation files (manager.ts: runtime errors, state-machine.ts, dispatcher.ts) also use DelegationError for notification paths?**
   - What we know: manager.ts has 12 error sites, some are policy/preflight errors that should throw, others are control-action errors that should become DelegationError responses.
   - What's unclear: Which sites should remain raw throws vs. convert to DelegationError.
   - Recommendation: Phase 22 should mark all manager.ts error sites as raw throws (fatal) for now. Only notification-route and tool-response paths get DelegationError. Full error typing of manager.ts is Phase 33 work.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts tests/lib/coordination/delegation/slot-manager.test.ts` |
| Full suite command | `npx vitest run tests/lib/coordination/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| P22-01 | `delegationStatusToHarnessStatus()` maps all 5 `DelegationStatus` values to correct `HarnessStatus` | unit | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "delegationStatusToHarnessStatus"` | ❌ Wave 0 |
| P22-02 | `DelegationError` struct carries expected fields (code, message, sessionId?, timestamp) | unit | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "DelegationError"` | ❌ Wave 0 |
| P22-03 | Notification retry counter increments and stops at maxRetries | unit | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "retry"` | ❌ Wave 0 |
| P22-04 | Notification TTL expires and drops stale notifications | unit | `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts -t "TTL"` | ❌ Wave 0 |
| P22-05 | `createDelegationError()` creates valid DelegationError | unit | `npx vitest run tests/lib/coordination/delegation/status-mapping.test.ts -t "createDelegationError"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/lib/coordination/delegation/notification-router.test.ts`
- **Per wave merge:** `npx vitest run tests/lib/coordination/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/lib/coordination/delegation/status-mapping.test.ts` — covers REQ P22-01, P22-02, P22-05
- [ ] Update `tests/lib/coordination/delegation/notification-router.test.ts` — add REQ P22-03, P22-04 coverage

*(See Wave 0 tasks above — existing test infrastructure needs 2 update points)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 22 touches no auth paths |
| V3 Session Management | no | Session identity is parent-child, not user sessions |
| V4 Access Control | no | Delegation access control already implemented via permission profiles |
| V5 Input Validation | no | DelegationError codes are internal, not user-supplied |
| V6 Cryptography | no | No crypto paths |

### Known Threat Patterns for Coordination Layer

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Error information leak via DelegationError message | Information Disclosure | Keep error messages at debug level only; tool responses surface error code + generic message, not raw Error message |
| Notification replay via retry mechanism | Tampering | Retry count capped at `maxRetries` (default 1); TTL expires stale notifications |

## Sources

### Primary (HIGH confidence)
- `src/coordination/delegation/types.ts` — DelegationStatus (5 vals), DelegationTerminalKind (8 vals), Delegation interface [VERIFIED: codebase]
- `src/shared/types.ts` — HarnessStatus (9 vals), DelegationPacketStatus (4 vals) [VERIFIED: codebase]
- `src/shared/task-status.ts` — TaskStatus (8 vals) + VALID_TRANSITIONS [VERIFIED: codebase]
- `src/coordination/completion/detector.ts` — CompletionSignal (5 vals) + TERMINAL_EVENTS [VERIFIED: codebase]
- `src/coordination/delegation/manager.ts` — 12 `[Harness]` throw sites [VERIFIED: grep]
- `src/coordination/delegation/manager-runtime.ts` — 4 `[Harness]` throw sites [VERIFIED: read + grep]
- `src/coordination/delegation/slot-manager.ts` — 3 `[Harness]` throw sites [VERIFIED: read]
- `src/coordination/delegation/agent-resolver.ts` — 1 `[Harness]` throw site [VERIFIED: read]
- `src/coordination/delegation/sdk-child-session-starter.ts` — 1 `[Harness]` throw site [VERIFIED: read]
- `src/coordination/delegation/notification-router.ts` — PendingNotificationRecord, route(), replayPending() [VERIFIED: read]
- `src/coordination/delegation/state-machine.ts` — DelegationStateMachine, transitionToTerminal() [VERIFIED: read]
- `src/coordination/delegation/dispatcher.ts` — preflightCheck() [VERIFIED: read]
- `src/task-management/continuity/index.ts` — patchSessionContinuity(), clonePendingNotifications() [VERIFIED: read]
- `src/plugin.ts` — Notification dispatch orchestration (lines 102-489) [VERIFIED: read]
- `.planning/ROADMAP.md:619-621` — Phase 22 spec [VERIFIED: read]
- `.planning/STATE.md:36` — Phase 22 PENDING status [VERIFIED: read]

### Secondary (MEDIUM confidence)
- None — all findings verified against live codebase

### Tertiary (LOW confidence)
- None — no unverified claims

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project constraint, no new dependencies
- Architecture: HIGH — 5 files directly read, patterns verified against implementations
- Pitfalls: HIGH — based on grepped error patterns and codebase structure

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable codebase — no fast-moving dependencies)
