---
phase: 36.1-completion-detector-rewiring
priority: P0
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 2
amends: 36
depends_on: [36-lifecycle-state-machine-enforcement]
blocks: [37-async-result-harvesting, 48.1-runtime-correctness-lifecycle-queue-persistence-truth, 52-end-user-harness-workflow-acceptance]
gsd_agents: [gsd-executor, gsd-code-reviewer, gsd-verifier]
requirements: [PH36-04, PH36-05, PH36-06]
---

# Phase 36.1: CompletionDetector Re-Wiring

## Goal

Make `CompletionDetector` the **only** completion authority for SDK delegations. Remove the parallel adaptive-polling decision path in `SdkDelegationHandler` so completion semantics are event-driven and consistent with the main repo's tested two-signal design.

## Validation Source

Generated from `AUDIT-VALIDATION-AND-REMEDIATION-PLAN-2026-04-30.md` Finding 2 (VALIDATED). Evidence on disk:

- `src/lib/sdk-delegation.ts:6–8, 55, 180–202` uses 4 thresholds (`MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS`, `STABLE_POLLS_REQUIRED`, `DEFAULT_STALE_TIMEOUT_MS`) and `calculateAdaptiveInterval()` to drive finalization.
- `src/lib/lifecycle-manager.ts:73, 124, 166` instantiates `CompletionDetector` and calls `feed("session.idle", …)` and `cancel(…)`, but the SDK delegation finalization decision is made by the polling logic in `SdkDelegationHandler.performStabilityPoll`, not by the detector.
- Result: `CompletionDetector` is fed but does not drive completion. Two truths exist for "is this delegation done?" — they can disagree.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PH36-04 | `SdkDelegationHandler` MUST drive completion via `CompletionDetector` callbacks (terminal-event signal AND message-stability timer signal). Delete `calculateAdaptiveInterval`, `STABLE_POLLS_REQUIRED`, `MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS` constants and their consumers. | 36-AUDIT-AMENDMENT-2026-04-30.md §PH36-04 |
| PH36-05 | The orphaned `CompletionDetector` instance in `lifecycle-manager.ts:73` MUST be the single instance shared by `SdkDelegationHandler` (or removed if a per-delegation instance is more appropriate). No second completion authority. | 36-AUDIT-AMENDMENT-2026-04-30.md §PH36-05 |
| PH36-06 | Consolidate the four overlapping status enums (`HarnessStatus`, `DelegationStatus`, `SessionLifecyclePhase`, `DelegationPacketStatus`) to: `DelegationStatus` as canonical runtime status; `SessionLifecyclePhase` for continuity records; delete `HarnessStatus` and `DelegationPacketStatus`. | 36-AUDIT-AMENDMENT-2026-04-30.md §PH36-06 |

## Scope

- `src/lib/sdk-delegation.ts` — primary surgery
- `src/lib/lifecycle-manager.ts` — share `CompletionDetector` instance
- `src/lib/completion-detector.ts` — verify API surface is sufficient (terminal events + `feedMessageCount` + stability timer)
- `src/lib/types.ts:123–168` — status enum consolidation
- All consumers of `HarnessStatus` / `DelegationPacketStatus` — migrate to `DelegationStatus`
- `tests/lib/sdk-delegation.test.ts` — replace polling assertions with event-driven assertions
- `tests/lib/completion-detector.test.ts` — already covers detector logic; extend to cover the SDK-handler integration

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PH36-04 | gsd-executor | hm-test-driven-execution + hm-refactor |
| PH36-05 | gsd-executor | hm-refactor |
| PH36-06 | gsd-executor | hm-refactor (status enum migration) |
| All | gsd-code-reviewer | hm-code-review |
| All | gsd-verifier | gsd-verify-work |

## Key Files

- `src/lib/sdk-delegation.ts` (~454 LOC test coverage; ~161 LOC source)
- `src/lib/lifecycle-manager.ts`
- `src/lib/completion-detector.ts`
- `src/lib/types.ts`
- `src/lib/delegation-manager.ts` (consumer)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- `[Harness]` prefix on all thrown errors
- No circular dependencies
- RED-first TDD; do not delete failing tests, fix them or replace them with event-driven equivalents

## Constraints

- Existing 6,417 LOC of delegation tests are the safety net — they MUST stay green at every commit.
- Status-enum consolidation has wide blast radius; do it as the LAST commit in the phase, after PH36-04 and PH36-05 have stabilized completion behavior.
- Do not change observable behavior of `tests/lib/completion-detector.test.ts` cases — extend, don't rewrite.
