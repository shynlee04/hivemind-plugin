# Phase 52: Wire tmux-copilot + State Query API — Specification

**Created:** 2026-06-02
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 4 locked

## Goal

Keep the public contract of `src/tools/tmux-copilot.ts` identical while swapping its factory from `buildNoopForkSessionManager()` to `buildInTreeSessionManager()`; add a read-only `src/tools/tmux-state-query.ts` tool exposing session metadata; expand `src/features/tmux/observers.ts` with two new event subscription types.

## Background

P50-P51 closed the opencode-tmux fork dependency by synthesizing three concrete in-tree classes (`TmuxMultiplexer`, `SessionManager`, `PaneGridPlanner`) and rewriting `integration.ts` as a factory-of-real-classes. The bridge pattern (module-level mutable `SessionManagerAdapter` state populated at plugin-init time) is in place.

What exists today:
- `src/tools/tmux-copilot.ts` (235 LOC) — 4-action discriminated union tool that forwards to `getSessionManagerAdapter()` or returns `{available: false, reason: "tmux-not-wired"}` when the adapter is null. Currently wired to `buildNoopForkSessionManager()` in `src/plugin.ts`.
- `src/features/tmux/observers.ts` (93 LOC) — single event observer for `session.created` enrichment via `ForkSessionManager`.
- `src/features/tmux/session-manager.ts` — `SessionManager` class with internal `TrackedSession` records in a `Map<string, TrackedSession>`, each tracking `sessionId`, `agent`, `delegationId`, `directory`, `paneId`, `spawnTime`.
- `src/features/tmux/types.ts` — `SessionManagerAdapter` interface and `setSessionManagerAdapter`/`getSessionManagerAdapter` bridge.
- `src/plugin.ts` — composition root registering all tools and hooks.

The gap: the factory rename is a one-line change, but no read-only observability API exists for downstream consumers (P53 hook, sidecar dashboard) to query session metadata. The observer only handles `session.created` — `session-state-changed` and `pane-captured` event types need to be defined before P53 can subscribe to them.

## Requirements

1. **Factory rename**: Rename `buildNoopForkSessionManager` to `buildInTreeSessionManager` in `src/plugin.ts`.
   - Current: `src/plugin.ts` defines and calls `buildNoopForkSessionManager()` — function name reflects the deleted `fork-bridge.ts` no-op stub
   - Target: `src/plugin.ts` defines and calls `buildInTreeSessionManager()` — function name reflects the real in-tree `SessionManager` + `TmuxMultiplexer` chain. The function signature, return type, and behavior remain identical.
   - Acceptance: `git grep buildNoopForkSessionManager src/` returns empty; `git grep buildInTreeSessionManager src/` returns exactly 1 definition and 1 call site

2. **State query tool**: Create `src/tools/tmux-state-query.ts` — a read-only tool exposing session metadata via 3 actions (`list-sessions`, `get-session`, `get-summary`).
   - Current: No tool exists — consumers cannot query tracked session metadata
   - Target: Tool exists with discriminated union Zod schema (3 actions), orchestrator-tier permission gate, graceful `{available: false, reason: "tmux-not-wired"}` fallback, and `SessionSummary` result types derived from `SessionManager`'s internal `TrackedSession` records
   - Acceptance: Tool responds correctly for all 3 actions; returns available:false when adapter is null; enforces permission gate

3. **Observer expansion**: Expand `src/features/tmux/observers.ts` with `TmuxEventType` union, `SessionStateChangedEvent` and `PaneCapturedEvent` interfaces, and listener registration methods (`onSessionStateChanged`, `onPaneCaptured`).
   - Current: Observer only handles `session.created` via `ForkSessionManager`, no event type union, no listener registry
   - Target: Observer defines `TmuxEventType = "session.created" | "session-state-changed" | "pane-captured"`, exports both event interfaces, and provides registration methods for the two new event types while preserving existing `session.created` behavior
   - Acceptance: `TmuxEventType` has exactly 3 values; `SessionStateChangedEvent` and `PaneCapturedEvent` interfaces exist; `createTmuxEventObserver` returns registration methods; existing behavior unchanged

4. **Test coverage**: Add test suites for the state query tool and expanded observer.
   - Current: No tests exist for state query or new observer features
   - Target: `tests/lib/tmux-state-query.test.ts` (6+ vitest cases covering all 3 actions, adapter-null, permission-denied), `tests/lib/tmux-observers.test.ts` (5+ vitest cases covering registration, dispatch, multiple listeners, existing behavior preservation), BATS scenarios (3: no noop ref, one in-tree ref, tool file exists)
   - Acceptance: All vitest cases pass; BATS 3/3 pass; `tsc --noEmit` exits 0; `npm run test` passes without regressions

## Boundaries

**In scope:**
- `buildNoopForkSessionManager` → `buildInTreeSessionManager` rename in `plugin.ts` (function name only — no behavior change)
- `src/tools/tmux-state-query.ts` creation (read-only, 3 actions, permission-gated)
- `src/features/tmux/observers.ts` expansion (2 new event types + listener registry)
- Test suites: `tests/lib/tmux-state-query.test.ts` (6+ vitest), `tests/lib/tmux-observers.test.ts` (5+ vitest), BATS scenarios (3)

**Out of scope:**
- P53 live pane monitoring hook (`src/hooks/pane-monitor.ts`) — subscribes to expanded observer events, that is Phase 53
- Writing journal entries to `.hivemind/journal/` — that is Phase 53
- Rewriting P42 UAT.md or P43 VERIFICATION.md — that is Phase 53
- Any behavioral change to `tmux-copilot.ts` actions — contract must remain identical
- TMUX integration beyond observer events — installation, version detection, port persistence already handled by `integration.ts`

## Constraints

- Permission gate: only orchestrator-tier agents (`hm-l0-orchestrator`, `hm-orchestrator`, `hf-l0-orchestrator`, `hf-l1-coordinator`) may invoke tmux tools
- Graceful degradation: all tools return `{available: false, reason: "tmux-not-wired"}` when `getSessionManagerAdapter()` returns null — no thrown exceptions
- Discriminated union Zod schemas: each action branch has its own payload shape, parsed via `safeParse`
- Bridge pattern: `setSessionManagerAdapter`/`getSessionManagerAdapter` in `types.ts` is the sole injection path — tools do not directly construct managers
- Observer contracts: `SessionStateChangedEvent` must carry `sessionId`, `previousState`, `currentState`, `timestamp`; `PaneCapturedEvent` must carry `sessionId`, `paneId`, `contentLength`, `timestamp`
- No additional constraints beyond standard project conventions (TypeScript strict, Zod validation, 500 LOC module cap)

## Acceptance Criteria

- [ ] `git grep buildNoopForkSessionManager src/` returns empty
- [ ] `git grep buildInTreeSessionManager src/` returns exactly 1 function definition and 1 call site in `src/plugin.ts`
- [ ] `src/tools/tmux-state-query.ts` exists with 3 actions: `list-sessions`, `get-session`, `get-summary`
- [ ] State query tool returns `{available: false, reason: "tmux-not-wired"}` when adapter is null
- [ ] State query tool enforces orchestrator-tier permission gate
- [ ] `src/features/tmux/observers.ts` exports `TmuxEventType` with exactly 3 values including `"session-state-changed"` and `"pane-captured"`
- [ ] `src/features/tmux/observers.ts` exports `SessionStateChangedEvent` and `PaneCapturedEvent` interfaces
- [ ] `createTmuxEventObserver` returns registration methods `onSessionStateChanged` and `onPaneCaptured`
- [ ] Existing `session.created` forwarding behavior in observer is unchanged
- [ ] `tests/lib/tmux-state-query.test.ts` has 6+ test cases, all passing
- [ ] `tests/lib/tmux-observers.test.ts` has 5+ test cases, all passing
- [ ] 3 BATS scenarios pass (no noop ref, one in-tree ref, tool file exists)
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run test` passes without regressions

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | ROADMAP + CONTEXT + PLAN specify   |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Explicit in/out of scope, P53 defer|
| Constraint Clarity | 0.85  | 0.65 | ✓      | Permission, schemas, bridge pattern|
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 14 pass/fail checks                |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      | Below gate, all minimums met       |

All dimensions meet or exceed minimums. No dimensions below threshold.

## Interview Log

| Round | Perspective     | Question summary            | Decision locked                          |
|-------|-----------------|-----------------------------|-----------------------------------------|
| —     | (auto mode)     | Initial ambiguity ≤ 0.20    | Skipped interview — SPEC.md derived from ROADMAP + CONTEXT.md + existing PLAN.md |

---

*Phase: 52-wire-tmux-copilot-state-query*
*Spec created: 2026-06-02*
*Next step: /gsd-discuss-phase 52 — implementation decisions (tool pattern, observer interface shape, test setup)*
