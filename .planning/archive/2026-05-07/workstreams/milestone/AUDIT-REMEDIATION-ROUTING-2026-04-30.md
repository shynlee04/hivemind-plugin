# Audit Remediation Routing: delegation-async-pty-lifecycle-audit-2026-04-30

**Audit Source:** `.planning/audits/delegation-async-pty-lifecycle-audit-2026-04-30.md` (main repo)
**Routing Date:** 2026-04-30
**Auditor:** hm-l1-coordinator
**Target:** GSD workstream phases amendment + gap filling + remediation

---

## Executive Summary

The comprehensive audit reveals **8 critical findings** requiring cross-phase remediation. This document routes each finding to the responsible phase, amends phase requirements where the audit exposes false claims or missing work, and creates new gap-closure work items.

**Audit verdict:** Main repo is clean but basic (247 tests). Worktree is ambitious, broken, and untested. Two divergent codebases exist. Planning metadata contains phantom references and inflated completion claims.

---

## Critical Finding → Phase Routing Matrix

| # | Audit Finding | Severity | Primary Phase | Secondary Phase(s) | Action |
|---|--------------|----------|---------------|-------------------|--------|
| 1 | **PTY 100% non-functional on Node.js** — `bun-pty` crashes at module resolution | CRITICAL | [Phase 16.2](#phase-162-pty-wiring) | Phase 49, Phase 48.4 | Remove or replace PTY subsystem |
| 2 | **Dual-signal completion claim is false** — `SdkDelegationHandler` uses 4-threshold adaptive polling, not 2-signal design | CRITICAL | [Phase 36](#phase-36-lifecycle-state-machine) | Phase 46, Phase 16.3 | Replace adaptive polling with `CompletionDetector` |
| 3 | **"Always-background" is conditional** — `builtinAsyncBackgroundChildSessions` policy flag gates async behavior | CRITICAL | [Phase 46](#phase-46-delegation-dispatch-completion-recovery-truth) | Phase 16, Phase 36 | Remove policy gate; always async when `run_in_background: true` |
| 4 | **Zero tests in worktree** — All critical paths untested | CRITICAL | [Phase 48.4](#phase-484-production-evidence--coverage-recovery) | Phase 16, Phase 46, Phase 36 | Add integration tests for delegation flow |
| 5 | **No runtime state files on disk** — `session-continuity.json`, `delegations.json` missing; `.hivemind/state/brain.json` empty | HIGH | [Phase 38](#phase-38-q6-state-root-migration) | Phase 66, Phase 25 | Fix continuity file creation; add startup check |
| 6 | **Phantom phase references** — Phases 9, 14, 16, 48–53 referenced but don't exist in `.planning/phases/` | HIGH | [Phase 32](#phase-32-traceability-reconciliation) | Phase 31 | Delete phantom references; update docs |
| 7 | **Two divergent codebases** — Main repo clean+tested vs worktree broken+untested | HIGH | [Phase 16.4](#phase-164-architecture-baseline) | Phase 11 | Merge concepts; port tests; delete worktree duplicates |
| 8 | **Native `task` tool disabled** — No fallback if harness delegation breaks | MEDIUM | [Phase 45](#phase-45-opencode-sdk-permission-boundary) | Phase 46 | Document or enable fallback |

---

## Phase 16.2: PTY Wiring + OMO Safety Patterns

**Current Status:** REMEDIATED (CR-01, CR-03 resolved) — **AUDIT OVERRIDE: NOT REMEDIATED**

**Audit Evidence:**
- `pty-manager.ts:1` imports `bun-pty` at module level — Bun-only native module
- `pty-runtime.ts:13-21` dynamic import does NOT prevent crash because `pty-manager.ts` imports `bun-pty` at top level before lazy load is reached
- `command-delegation.ts:126-143` — `recoverPtyDelegation` always fails after restart; logs exact string matching "29 consecutive child session not found on recovery"
- `run-background-command.ts:179-181` — `output`, `input`, `list`, `terminate` actions all return error "PTY not available" on Node.js

**Required Amendments:**

1. **DELETE or REPLACE `bun-pty`** — The `bun-pty` dependency must be removed. Options:
   - Option A: Replace with `node-pty` (cross-platform, works on Node.js)
   - Option B: Remove PTY entirely; use headless `child_process.spawn` only (recommended — pragmatic)
   - Option C: Make `bun-pty` an optional dependency with graceful degradation (still fails on import)

2. **Fix `createPtyManagerIfSupported()` lazy load** — If PTY is kept, the lazy loader must prevent `bun-pty` from being imported at module level. Move the import inside the dynamic import block.

3. **Document PTY non-resumability** — PTY OS processes cannot survive harness restarts. Recovery is impossible. Remove recovery code path or make it return `non-resumable-after-restart` truthfully.

4. **Simplify `run-background-command`** — If PTY is removed, simplify tool to single `run` action with stdout/stderr capture. Remove `output`, `input`, `list`, `terminate` actions.

**Verification Criteria:**
- [ ] `npm test` passes on Node.js (not Bun)
- [ ] `run-background-command` tool works without `bun-pty` installed
- [ ] No "PTY session not found on recovery" errors after restart

---

## Phase 36: Lifecycle State Machine Enforcement

**Current Status:** PENDING (depends on Phase 35)

**Audit Evidence:**
- `completion-detector.ts` (main repo, 124 LOC) — true two-signal design (terminal events + stability timer), **tested**
- `sdk-delegation.ts:146-201` (worktree) — multi-threshold adaptive polling: `MIN_IDLE_TIME_MS` (5s), `MIN_STABILITY_TIME_MS` (10s), `STABLE_POLLS_REQUIRED` (3 polls), `DEFAULT_STALE_TIMEOUT_MS` (45min) — **untested**
- `lifecycle-manager.ts` (worktree, 213 LOC) — facade; creates `CompletionDetector` at line 73 but **never uses it**

**Required Amendments:**

1. **Replace worktree adaptive polling with main repo `CompletionDetector`** — Port the main repo's event-driven two-signal design to the worktree. Delete `calculateAdaptiveInterval()`, `MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS`, `STABLE_POLLS_REQUIRED`.

2. **Wire `CompletionDetector` in `lifecycle-manager.ts`** — The instantiated `CompletionDetector` at line 73 must be fed events (`session.idle`, `session.error`, `session.deleted`) from the event observer.

3. **Enforce 500 LOC module limit** — Split `lifecycle-manager.ts` (706 LOC main repo, 213 LOC worktree facade) into:
   - `background-observer.ts` (event feeding + completion detection)
   - `recovery-manager.ts` (session recovery logic)
   - `notification-scheduler.ts` (parent notification logic)

4. **Normalize status models** — Worktree has 4 overlapping status enums. Pick one canonical status:
   - Delete `HarnessStatus` (8 values)
   - Delete `DelegationPacketStatus` (4 values)
   - Use `DelegationStatus` (5 values: `dispatched`, `running`, `completed`, `error`, `timeout`) as canonical runtime status
   - Map to `SessionLifecyclePhase` (6 values) for continuity records only

**Verification Criteria:**
- [ ] `CompletionDetector` is used in worktree delegation flow
- [ ] No adaptive polling thresholds remain in `sdk-delegation.ts`
- [ ] All modules under 500 LOC
- [ ] Status model has single canonical enum

---

## Phase 46: Delegation Dispatch, Completion & Recovery Truth

**Current Status:** COMPLETE (HIGH-02/03/04) — **AUDIT OVERRIDE: PARTIAL — HIGH-02/03/04 complete but new critical gap found**

**Audit Evidence:**
- `delegation-manager.ts:208-211` — `sendPromptAsync` used ONLY when `runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions` is `true`; otherwise uses blocking `sendPrompt`
- Tool description says "always-background WaiterModel" (`delegate-task.ts:35`) but implementation is conditional
- `buildDelegationPromptTools` sets `"task": false`, `"delegate-task": false` for all delegated sessions — no fallback

**Required Amendments:**

1. **Remove `builtinAsyncBackgroundChildSessions` policy gate** — When `run_in_background: true` is passed to `delegate-task`, ALWAYS use `sendPromptAsync` (or equivalent non-blocking dispatch). Background should be the default behavior, not gated by a policy flag.

2. **Document or enable native `task` tool fallback** — If harness delegation fails, there is no fallback to OpenCode's native `task` tool. Either:
   - Allow delegated sessions to use native `task` for nested delegation, OR
   - Document that harness delegation is the only supported path and failures are terminal

3. **Fix "always-background" claim** — Update `delegate-task.ts:35` description to truthfully describe conditional async behavior, OR make it actually always-background.

**Verification Criteria:**
- [ ] `run_in_background: true` always triggers async dispatch regardless of policy
- [ ] Tool description matches actual behavior
- [ ] Fallback behavior documented if native `task` remains disabled

---

## Phase 48.4: Production Evidence & Coverage Recovery

**Current Status:** COMPLETE WITH DEFERRED RUNTIME GAPS — **AUDIT OVERRIDE: NOT COMPLETE — Zero tests is a coverage failure**

**Audit Evidence:**
- `.worktrees/harness-experiment/tests/` — Directory exists but all subdirectories are empty
- Worktree has **0 tests** for `delegation-manager.ts`, `sdk-delegation.ts`, `command-delegation.ts`, `pty-manager.ts`, `run-background-command.ts`
- Main repo has 247 tests; worktree has 0

**Required Amendments:**

1. **Create `tests/lib/delegation-manager.test.ts`** — Test dispatch, recovery, terminal notification, status transitions
2. **Create `tests/lib/sdk-delegation.test.ts`** — Test completion detection (after replacing adaptive polling), message harvesting, session polling
3. **Create `tests/tools/delegate-task.test.ts`** — Test tool parameter validation, background mode, error handling
4. **Create `tests/tools/run-background-command.test.ts`** — Test `run` action, headless fallback, truncation
5. **Create `tests/lib/delegation-persistence.test.ts`** — Test JSON serialization, normalization, recovery

**Verification Criteria:**
- [ ] Worktree test count > 0 (target: 50+ covering critical paths)
- [ ] All delegation flows have test coverage
- [ ] PTY/headless branches both tested (or PTY branch removed)

---

## Phase 38: Q6 State Root Migration

**Current Status:** PENDING (depends on Phase 35)

**Audit Evidence:**
- `find` for `session-continuity.json` returned 0 results
- `find` for `delegations.json` returned 0 results
- `.hivemind/state/brain.json` — all fields `null`, `[]`, or `false`
- `.hivemind/delegation/` — empty directory

**Required Amendments:**

1. **Fix continuity file path creation** — `continuity.ts:90-96` must ensure `mkdirSync(dirname(continuityFile), { recursive: true })` runs before first write.

2. **Add startup file existence check** — If continuity file is missing on startup, create it with empty valid JSON.

3. **Verify `OPENCODE_HARNESS_CONTINUITY_FILE` default** — Ensure default path points to `.hivemind/state/` (per Q6) and not `.opencode/state/`.

4. **Write initial state on first delegation** — The first `delegate-task` call should trigger file creation, not fail silently.

**Verification Criteria:**
- [ ] `.hivemind/state/session-continuity.json` exists after first harness startup
- [ ] `.hivemind/delegations.json` exists after first delegation
- [ ] Recovery test simulates process restart and verifies state restoration

---

## Phase 32: Traceability Reconciliation

**Current Status:** COMPLETE (7/7 tasks) — **AUDIT OVERRIDE: INCOMPLETE — Phantom phases remain**

**Audit Evidence:**
- User context referenced phases 9, 14, 16, 48, 52, 53
- `.planning/phases/` contains only `01-baseline-cleanup/` and `02-v3-runtime-architecture/`
- `.planning/ROADMAP.md:39-50` — Phase 2: 0/8 complete (only RESEARCH.md exists)

**Required Amendments:**

1. **Delete phantom phase references** — Remove all references to non-existent phases from:
   - `ROADMAP.md`
   - `STATE.md`
   - User-facing documentation
   - AGENTS.md

2. **Correct Phase 2 status** — Status is NOT "9/9 plans complete, 18/18 verified" — only RESEARCH.md exists. Mark accurately.

3. **Archive or create missing phases** — Either:
   - Create placeholder directories for referenced phases with `STATUS-PHANTOM.md`, OR
   - Remove all references and renumber subsequent phases

**Verification Criteria:**
- [ ] No phase references exist without corresponding `.planning/phases/` directory
- [ ] Phase 2 status reflects actual filesystem state
- [ ] ROADMAP.md and STATE.md are consistent

---

## Phase 16.4: Harness Architecture Baseline & Migration Control Plane

**Current Status:** COMPLETE (4 plans executed, summaries deferred to backlog 999.1) — **AUDIT OVERRIDE: INCOMPLETE — Two codebases not reconciled**

**Audit Evidence:**
- Main repo `src/` — Clean, minimal, 247 passing tests, basic inline `delegate-task`
- Worktree `.worktrees/harness-experiment/src/` — Advanced features but 0 tests, broken on Node.js, not wired into main branch

**Required Amendments:**

1. **Merge worktree delegation concepts into main repo** — Port:
   - `DelegationManager` agent validation
   - Category gates
   - Concurrency keys
   - Safety ceilings
   - But NOT the complexity (adaptive polling, PTY, policy gates)

2. **Port main repo tests to worktree** — Or merge worktree features into main repo and run main repo's test suite.

3. **Delete worktree duplicates** — Once merged, remove worktree files that are copies of main repo with added complexity.

4. **Establish single source of truth** — The `.worktrees/harness-experiment/` should not be a parallel codebase. It should be a feature branch or deleted.

**Verification Criteria:**
- [ ] One canonical `src/` tree exists
- [ ] All features from worktree are either merged or explicitly rejected
- [ ] Test suite passes on the canonical tree

---

## Phase 45: OpenCode SDK Permission Boundary

**Current Status:** COMPLETE (REM-CR-02, REM-HIGH-01)

**Audit Evidence:**
- `plugin.ts:50-54` — `mustNot: ["task"]` for researcher, builder, critic
- `delegation-manager.ts:90-95` — `buildDelegationPromptTools` sets `"task": false`, `"delegate-task": false`

**Amendment (Medium Priority):**

1. **Document native `task` disablement** — Add to AGENTS.md: "Native `task` tool is disabled for all agents. Harness `delegate-task` is the sole delegation path. If harness delegation fails, no fallback exists."

2. **Optional: Enable `task` for nested delegation** — Delegated child sessions could be allowed to use native `task` for one level of nested delegation, reducing harness complexity.

**Verification Criteria:**
- [ ] AGENTS.md documents the `task` disablement and its implications
- [ ] If enabled, nested `task` is tested

---

## Remediation Execution Order

| Order | Phase | Action | Rationale |
|-------|-------|--------|-----------|
| 1 | **16.2** | Remove/replace PTY | Blocks all Node.js execution |
| 2 | **16.4** | Merge codebases | Establishes single source of truth |
| 3 | **36** | Replace adaptive polling | Core delegation behavior |
| 4 | **46** | Remove policy gate | Fixes "always-background" lie |
| 5 | **48.4** | Add tests | Verify fixes don't regress |
| 6 | **38** | Fix state file creation | Enables recovery testing |
| 7 | **32** | Delete phantom phases | Planning hygiene |
| 8 | **45** | Document `task` disable | Transparency |

---

## Cross-Phase Dependencies (Amended)

```
16.2 (PTY fix) ──→ 48.4 (tests for PTY-less behavior)
     │
     └──→ 49 (UAT tool contract — update for headless-only)

16.4 (merge codebases) ──→ 36 (lifecycle state machine — use main repo CompletionDetector)
     │                    │
     └──→ 46 (delegation truth ──→ remove policy gate)
          │
          └──→ 48.4 (tests for merged behavior)

38 (state files) ──→ 66 (recovery engine — needs files to exist)
     │
     └──→ 25 (session journal — verify continuity writes)

32 (phantom phases) ──→ 31 (planning refresh — update all docs)
```

---

## Audit Closure Criteria

This routing is complete when:

1. All 8 findings have been assigned to phases with amended requirements
2. Phase statuses are updated to reflect audit override (e.g., Phase 16.2: NOT REMEDIATED)
3. New verification criteria are added to each affected phase
4. Cross-phase dependencies are updated
5. A tracking issue is created for each critical/high finding

**Next Action:** Phase leads review amended requirements and produce updated plans.
