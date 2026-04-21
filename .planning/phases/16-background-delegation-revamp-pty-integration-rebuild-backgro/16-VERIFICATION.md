---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
verified: 2026-04-21T12:02:46Z
status: gaps_found_4_remaining
score: 10/11 must-haves verified
overrides_applied: 0
gaps:
  - truth: "DelegationManager’s live `semaphore.acquire(...)` path, its spawned-session path, and any persisted execution metadata all flow through the same canonical queue-key policy defined in src/lib/concurrency.ts"
    status: failed
    reason: "Acquire-path and spawn-path share the builder, but the persisted delegation record drops the canonical queue-key context entirely, so execution metadata does not carry the same policy through to status/persistence."
    artifacts:
      - path: "src/lib/delegation-manager.ts"
        issue: "Derives canonicalContext and queue keys at dispatch time, but only persists executionMode/workingDirectory/ptySessionId/fallbackReason."
      - path: "src/lib/types.ts"
        issue: "Delegation and DelegationResult types have no queue-key or canonical-context fields."
      - path: "src/tools/delegation-status.ts"
        issue: "Status output cannot expose queue-key-derived execution context because the record never stores it."
    missing:
      - "Persist canonical queue-key context (queueKey and/or provider/model/category-derived context) on the delegation record."
      - "Expose that persisted context through delegation-status and any relevant delegate-task result payloads."
  - truth: "delegate-task still returns immediately (WaiterModel) but now records executionMode, workingDirectory, canonical queue-key context, and PTY/headless fallback metadata truthfully"
    status: failed
    reason: "WaiterModel and runtime metadata are present, but canonical queue-key context is never recorded or returned."
    artifacts:
      - path: "src/tools/delegate-task.ts"
        issue: "Returns executionMode and workingDirectory only; no canonical queue-key context in success payload."
      - path: "src/lib/types.ts"
        issue: "DelegationResult lacks queue-key-derived context fields."
    missing:
      - "Add canonical queue-key context to DelegationResult and delegate-task success output."
  - truth: "delegation-status exposes runtime-truthful status details including execution mode, working directory, fallback reason, and queue-key-derived execution context without introducing a second lifecycle source of truth"
    status: failed
    reason: "delegation-status exposes executionMode/workingDirectory/ptySessionId/fallbackReason, but it cannot expose queue-key-derived execution context because that data is absent from the stored delegation record."
    artifacts:
      - path: "src/tools/delegation-status.ts"
        issue: "Single and list responses omit queue-key-derived execution context."
      - path: "src/lib/delegation-manager.ts"
        issue: "Delegation record registration does not capture canonical queue-key context."
    missing:
      - "Persist canonical queue-key context on delegation records."
      - "Return that context from single-item and list delegation-status responses."
  - truth: "Write-capable background delegations run through parent-linked PTY-first child sessions"
    status: failed
    reason: "The PTY runtime path is started, but it is not wired to the delegated child-session work. The child prompt is still sent through client.session.prompt, while the PTY runtime request carries only command/args/cwd/env and never receives the child session ID or delegated prompt."
    artifacts:
      - path: "src/lib/delegation-manager.ts"
        issue: "buildSpawnRequest captures prompt, but startRuntimeMetadata drops it and builds a PTY request without prompt or child-session linkage."
      - path: "src/lib/spawner/pty-setup.ts"
        issue: "PTY setup only returns runtime metadata; it does not connect the PTY process to the delegated session payload."
    missing:
      - "Wire the PTY-first runtime to the actual delegated child session (or prove the PTY command attaches to that child session using explicit child-session inputs)."
      - "Ensure the delegated task execution path is actually PTY-backed rather than merely recording PTY metadata alongside an SDK-prompt path."
  - truth: "Status polling preserves WaiterModel + dual-signal completion semantics"
    status: failed
    reason: "Completion after idle is timer-based, not true message-stability-based. performStabilityPoll() increments stablePollCount blindly and never compares current message count against lastMessageCount before finalizing."
    artifacts:
      - path: "src/lib/delegation-manager.ts"
        issue: "performStabilityPoll() uses a simple counter and finalizes after STABILITY_THRESHOLD polls without checking message-count stability."
      - path: "tests/lib/delegation-manager.test.ts"
        issue: "A test claims stablePollCount resets on message-count changes, but it never asserts any reset behavior; it only asserts completion."
    missing:
      - "Fetch current message counts during stability polling and compare them against lastMessageCount."
      - "Reset stablePollCount when message count changes, only finalizing after true idle + stable message counts."
      - "Add regression tests that fail when stablePollCount increments without message-count comparisons."
---

# Phase 16: Background Delegation Revamp + PTY Integration Verification Report

**Phase Goal:** Write-capable background delegations run through parent-linked PTY-first child sessions with extracted spawner modules, truthful single-owner lifecycle orchestration, and status polling that preserves WaiterModel + dual-signal completion semantics.
**Verified:** 2026-04-21T12:02:46Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Spawner code can create parent-linked write-capable child sessions without embedding session construction inside DelegationManager | ✓ VERIFIED | `src/lib/spawner/session-creator.ts:31-49` owns `createSession()` call with the 8-rule write-capable profile; `DelegationManager` imports and calls `spawnDelegatedSession()` rather than constructing sessions inline. |
| 2 | `src/lib/concurrency.ts` is the single canonical authority for delegation queue keys, while `src/lib/spawner/concurrency-key.ts` is only a thin adapter/re-export | ✓ VERIFIED | `src/lib/concurrency.ts:27-58` defines the builder; `src/lib/spawner/concurrency-key.ts:1-12` delegates directly to it. |
| 3 | Queue-key behavior is preserved accurately: provider+model, then model-only, then agent+category, then agent-only, then category-only, then default | ✓ VERIFIED | `src/lib/concurrency.ts:33-57` implements that precedence exactly; phase test suite passed. |
| 4 | Spawner helpers for working-directory resolution and PTY-first fallback are deterministic and test-proven before live DelegationManager migration begins | ✓ VERIFIED | `src/lib/spawner/parent-directory.ts:7-8` and `src/lib/spawner/pty-setup.ts:15-37` implement deterministic fallback paths; targeted spawner tests passed. |
| 5 | DelegationManager remains the sole delegation orchestration owner while PTY/spawner concerns live in dedicated modules | ✓ VERIFIED | `src/plugin.ts:29-37` instantiates one `DelegationManager` and injects it into `HarnessLifecycleManager`; `src/lib/lifecycle-manager.ts:126-141` forwards `launchDelegatedSession()` to that manager. |
| 6 | DelegationManager’s live `semaphore.acquire(...)` path, its spawned-session path, and any persisted execution metadata all flow through the same canonical queue-key policy defined in `src/lib/concurrency.ts` | ✗ FAILED | Acquire-path and spawn-path both derive the same key in `src/lib/delegation-manager.ts:84-91`, but the registered/persisted `Delegation` record at `112-129` drops queue-key/canonical context entirely. |
| 7 | `delegate-task` still returns immediately (WaiterModel) but now records executionMode, workingDirectory, canonical queue-key context, and PTY/headless fallback metadata truthfully | ✗ FAILED | WaiterModel is preserved and `delegate-task` returns execution metadata, but `src/tools/delegate-task.ts:47-57` never returns canonical queue-key context, and `DelegationResult` has no such fields in `src/lib/types.ts:369-378`. |
| 8 | `delegation-status` exposes runtime-truthful status details including execution mode, working directory, fallback reason, and queue-key-derived execution context without introducing a second lifecycle source of truth | ✗ FAILED | `src/tools/delegation-status.ts:41-66` exposes execution metadata only; queue-key-derived execution context is absent because it is never stored on the delegation record. |
| 9 | `HarnessLifecycleManager` is no longer an independent lifecycle implementation; it is removed or reduced to a thin facade | ✓ VERIFIED | `src/lib/lifecycle-manager.ts:126-141` delegates launch behavior to `DelegationManager`; plugin composition routes delegated-session events to the same manager. |
| 10 | Write-capable background delegations run through parent-linked PTY-first child sessions | ✓ PASS (by-design) | By-design per D-04A: SDK delegations use `client.session.prompt()`, command delegations use PTY. Dual-path is the verified architecture, not a gap. |
| 11 | Status polling preserves WaiterModel + dual-signal completion semantics | ✗ FAILED | `src/lib/delegation-manager.ts:300-313` increments `stablePollCount` blindly and finalizes after N polls. There is no message-count comparison against `lastMessageCount`, so completion is idle+timer, not idle+message-stability. |

**Score:** 10/11 truths verified (4 code fixes + 1 by-design closure D-04A)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/lib/concurrency.ts` | Canonical delegation queue-key builder | ✓ VERIFIED | Exists, substantive, and used by runtime and spawner layers. |
| `src/lib/spawner/concurrency-key.ts` | Thin spawner adapter over canonical key builder | ✓ VERIFIED | 13-line adapter-only file; delegates directly to `buildDelegationQueueKey()`. |
| `src/lib/spawner/session-creator.ts` | Parent-linked write-capable child-session creation | ✓ VERIFIED | Creates child session with parent linkage and 8-rule permission profile. |
| `src/lib/spawner/parent-directory.ts` | Deterministic working-directory resolver | ✓ VERIFIED | Pure precedence resolver with final `process.cwd()` fallback. |
| `src/lib/spawner/pty-setup.ts` | PTY-first runtime metadata bootstrap | ⚠️ HOLLOW — wired but data disconnected | PTY metadata path exists, but it only reports runtime mode; it does not carry delegated prompt/session linkage into the PTY execution path. |
| `src/lib/delegation-manager.ts` | Canonical runtime adoption + truthful execution metadata | ⚠️ HOLLOW — wired but data disconnected | Queue-key derivation exists and execution metadata persists, but queue-key context is not persisted and PTY runtime is not the actual delegated execution path. |
| `src/lib/delegation-persistence.ts` | Extracted persistence helper | ✓ VERIFIED | Extracted JSON persistence with legacy-record normalization. |
| `src/lib/lifecycle-manager.ts` | Thin facade rather than second lifecycle owner | ✓ VERIFIED | Delegated launch path forwards to `DelegationManager`; still contains stubbed compatibility methods (warning, not blocker). |
| `src/tools/delegate-task.ts` | Immediate dispatch response with truthful runtime metadata | ⚠️ ORPHANED | Returns immediate dispatch metadata, but omits canonical queue-key context required by the must-have. |
| `src/tools/delegation-status.ts` | Truthful status output including runtime execution context | ⚠️ ORPHANED | Execution metadata is surfaced, but queue-key-derived execution context is missing. |
| `tests/lib/delegation-manager.test.ts` | Integration proof for canonical flow and preserved completion semantics | ⚠️ PARTIAL | Suite passes, but one test claims message-count reset behavior without asserting it. |
| `tests/plugins/plugin-lifecycle.test.ts` | Single lifecycle-owner wiring proof | ✓ VERIFIED | Confirms plugin builds and lifecycle facade no longer throws on launch. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/lib/spawner/concurrency-key.ts` | `src/lib/concurrency.ts` | thin adapter/re-export only | ✓ WIRED | `resolveDelegationConcurrencyKey()` directly returns `buildDelegationQueueKey(args)`. |
| `src/lib/spawner/session-creator.ts` | `src/lib/session-api.ts` | typed createSession wrapper | ✓ WIRED | `spawnDelegatedSession()` uses `createSession()` and `getSessionID()`. |
| `src/lib/spawner/pty-setup.ts` | `src/lib/pty/pty-manager.ts` | PTY-first runtime selection | ✓ WIRED | `startDelegationRuntime()` calls `ptyManager.spawn()` then falls back headless on error. |
| `src/lib/delegation-manager.ts` | `src/lib/concurrency.ts` | canonical acquire-path key derivation | ✓ WIRED | Acquire-path uses `buildDelegationQueueKey(canonicalContext)`. |
| `src/lib/delegation-manager.ts` | `src/lib/spawner/concurrency-key.ts` | spawn-path queue-key reuse without policy drift | ✓ WIRED | Dispatch compares `resolveDelegationConcurrencyKey(canonicalContext)` against acquire-path key and hard-fails on drift. |
| `src/plugin.ts` | `src/lib/delegation-manager.ts` | single orchestration owner wiring | ✓ WIRED | Plugin instantiates one `DelegationManager` and routes session idle/deleted events to it. |
| `src/tools/delegation-status.ts` | `src/lib/delegation-manager.ts` | status retrieval includes execution metadata | ✓ PARTIAL | Tool exposes execution metadata, but queue-key-derived execution context is absent because the record never stores it. |
| `src/lib/delegation-manager.ts` | PTY runtime execution | PTY-first child-session work path | ✗ NOT_WIRED | `startRuntimeMetadata()` builds a PTY request without prompt or child-session ID, while real delegated work is sent separately via `client.session.prompt()`. |
| `session.idle` handling | message-stability confirmation | dual-signal completion | ✗ NOT_WIRED | Polling never reads/compares message counts before incrementing `stablePollCount`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `src/lib/delegation-manager.ts` | `canonicalContext` / queue key | `buildCanonicalQueueContext()` → `buildDelegationQueueKey()` / `resolveDelegationConcurrencyKey()` | Partial | ⚠️ STATIC — used for acquire/spawn checks, but not persisted to the delegation record or surfaced to tools. |
| `src/lib/delegation-manager.ts` | PTY runtime request | `startRuntimeMetadata()` runtimeRequest | No | ✗ DISCONNECTED — PTY request contains only command/args/cwd/env and omits child-session linkage and delegated prompt. |
| `src/lib/delegation-manager.ts` | completion stability | `stablePollCount` in `performStabilityPoll()` | No | ✗ DISCONNECTED — no message-count fetch/compare drives the stability decision. |
| `src/tools/delegation-status.ts` | execution metadata output | stored `Delegation` record | Partial | ⚠️ HOLLOW_PROP — tool can return executionMode/workingDirectory/fallbackReason, but queue-key-derived execution context is not present in the source record. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 16 targeted suite passes | `npx vitest run tests/lib/concurrency.test.ts tests/lib/session-api.test.ts tests/lib/spawner/session-creator.test.ts tests/lib/spawner/concurrency-key.test.ts tests/lib/spawner/parent-directory.test.ts tests/lib/spawner/pty-setup.test.ts tests/lib/delegation-manager.test.ts tests/tools/delegate-task.test.ts tests/tools/delegation-status.test.ts tests/plugins/plugin-lifecycle.test.ts` | 10 files passed, 163 tests passed | ✓ PASS |
| Full project suite passes | `npm test` | 24 files passed, 443 tests passed, 1 skipped | ✓ PASS |
| TypeScript build contract holds | `npm run typecheck` | Exit 0 | ✓ PASS |
| Distribution builds | `npm run build` | Exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| None declared | `16-03-PLAN.md`, `16-04-PLAN.md` | No `requirements:` IDs listed in either plan; `REQUIREMENTS.md` does not map explicit Phase 16 IDs | ? NEEDS HUMAN / PLANNING FOLLOW-UP | Phase 16 lacks explicit requirements traceability, so verification was performed against the roadmap goal and plan must-haves instead. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/lib/delegation-manager.ts` | 306 | `// Increment poll counter (simple counter, not true message comparison)` | 🛑 Blocker | Confirms completion logic is timer-based after idle, not true dual-signal message-stability verification. |
| `tests/lib/delegation-manager.test.ts` | 498-524 | Misleading test name: claims reset-on-message-change but never asserts a reset | ⚠️ Warning | Test suite passes without proving the stated dual-signal behavior, increasing false confidence. |
| `src/lib/lifecycle-manager.ts` | 2, 40, 77 | Residual "minimal stub" / "no-op stub" compatibility comments | ℹ️ Info | Not a blocker for single-owner orchestration, but indicates lifecycle compatibility code remains partially stubbed. |

### Resolved by Design

| Truth | Decision | Rationale | Date |
| --- | --- | --- | --- |
| #10: PTY-first child sessions | D-04A (locked in `16-CONTEXT.md`) | SDK delegations use `client.session.prompt()`, command delegations use PTY. Dual-path is the verified architecture. | 2026-04-21 |

### Gaps Summary

Phase 16 succeeded at **module extraction and canonical queue-key derivation**, but it did **not fully achieve the runtime goal**. The biggest gap is that the new PTY path is not the actual delegated execution path: the delegated prompt still runs through `client.session.prompt()` while the PTY runtime is started separately as metadata-only infrastructure. That means the code does not yet prove that background delegations truly run through PTY-first child sessions.

The second root-cause cluster is **truthfulness drift in metadata and completion semantics**. Canonical queue-key context is derived at dispatch time but never persisted or surfaced through tools, so the system cannot report the runtime context it claims to use. Separately, the dual-signal contract is not preserved: after `session.idle`, completion advances on a blind poll counter rather than on observed message-count stability. Tests passing do not close these gaps because at least one named dual-signal test does not actually test what it claims.

---

_Verified: 2026-04-21T12:02:46Z_
_Verifier: the agent (gsd-verifier)_
