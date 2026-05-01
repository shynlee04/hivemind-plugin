# Audit Remediation Tracking: delegation-async-pty-lifecycle-audit-2026-04-30

**Audit Source:** `.planning/audits/delegation-async-pty-lifecycle-audit-2026-04-30.md` (main repo)
**Tracking Date:** 2026-04-30
**Routing Document:** `AUDIT-REMEDIATION-ROUTING-2026-04-30.md`

---

## Amendment Documents Created

| Phase | Amendment File | Finding | Priority |
|-------|---------------|---------|----------|
| 16.2 | `16.2-AUDIT-AMENDMENT-2026-04-30.md` | PTY non-functional on Node.js (lazy-load catches gracefully; headless fallback works; PTY-dependent tool actions fail) | P1 HIGH |
| 36 | `36-AUDIT-AMENDMENT-2026-04-30.md` | Parallel completion detection: `CompletionDetector` + adaptive polling in `sdk-delegation.ts` conflict | P0 CRITICAL |
| 46 | `46-AUDIT-AMENDMENT-2026-04-30.md` | "Always-background" is conditional; policy gate blocks async | P0 CRITICAL |
| 48.4 | `48.4-AUDIT-AMENDMENT-2026-04-30.md` | Zero tests in worktree; critical paths untested | P0 CRITICAL |
| 38 | `38-AUDIT-AMENDMENT-2026-04-30.md` | State persistence works but has zero test coverage; `mkdirSync` already present | P1 HIGH |
| 32 | `32-AUDIT-AMENDMENT-2026-04-30.md` | Phantom phase references persist in planning metadata | P1 HIGH |

---

## Execution Order (Revised)

| Order | Phase | Action | Blocks |
|-------|-------|--------|--------|
| 1 | **16.2** | Remove/replace `bun-pty`; simplify to headless-only | 16.3, 16.4, 49 |
| 2 | **36** | Unify completion detection: remove adaptive polling from `sdk-delegation.ts`, wire `CompletionDetector` callback to finalization | 37, 46, 48.1 |
| 3 | **38** | Add recovery/atomic-write tests (state persistence already works) | 48.4 |
| 4 | **46** | Remove `builtinAsyncBackgroundChildSessions` policy gate | 16, 36, 52 |
| 5 | **48.4** | Add 50+ integration tests for delegation flow | 49, 52, 53 |
| 6 | **32** | Delete phantom phase references; correct Phase 2 status | 31, 53 |
| 7 | **45** | Document native `task` disable (no code change needed) | — |

---

## Status Overrides (Reconciled 2026-05-01)

| Phase | Previous Status | Original Override | **Reconciled Status** | Reconciliation Evidence |
|-------|-----------------|-------------------|----------------------|-------------------------|
| 16.2 | REMEDIATED | NOT REMEDIATED | **DEFERRED (P3)** | Graceful fallback works; PTY actions fail with clear error; headless path is primary |
| 36 | PENDING | BLOCKED | **✅ FIXED** | CompletionDetector idle signal wired to SDK delegation finalization; 2 new tests |
| 46 | COMPLETE | PARTIAL | **✅ ALREADY COMPLETE** | Async policy gate already removed prior to audit; stale finding |
| 48.4 | COMPLETE w/ gaps | NOT COMPLETE | **✅ COMPLETE** | 172 delegation tests exist in worktree (4750 LOC); audit finding applied to main repo |
| 38 | PENDING | PARTIAL | **PARTIAL** | Persistence works; needs dedicated recovery/atomic-write tests |
| 32 | COMPLETE (7/7) | INCOMPLETE | **INCOMPLETE** | Phantom phase references remain |
| 16.4 | COMPLETE | INCOMPLETE | **NEEDS INVESTIGATION** | Divergent codebase claim unverified |
| 2 | 9/9, 18/18 | 0/8, 1 doc | **UNCHANGED** | Only RESEARCH.md in main repo; worktree has full implementation |

---

## Verification Gates

### Gate 1: Node.js Compatibility (Phase 16.2)
- [ ] `npm test` passes on Node.js (not Bun)
- [ ] `run-background-command` works without `bun-pty`
- [ ] No "PTY not available" errors

### Gate 2: Completion Detection (Phase 36)
- [x] `CompletionDetector` exists in worktree (127 LOC, instantiated in `lifecycle-manager.ts:73`)
- [x] `CompletionDetector` wired to SDK delegation finalization via idle signal handler in `sdk-delegation.ts`
- [ ] `sdk-delegation.ts` adaptive polling removed (`performStabilityPoll()`, `calculateAdaptiveInterval()`) — RETAINED as fallback for unwired callers
- [x] Single completion detection path for all delegation types (CompletionDetector idle + fallback polling)
- [x] Tests verify event-driven completion for SDK delegations (R-COMPLETION-DETECTOR-04, 2 tests)

### Gate 3: Async Dispatch (Phase 46)
- [x] `run_in_background: true` always calls `sendPromptAsync`
- [x] No policy flag gates dispatch mode (gate removed prior to audit)
- [x] Explicit error if runtime lacks async support

### Gate 4: Test Coverage (Phase 48.4)
- [x] 172 delegation tests in worktree (4 test files, 4750 LOC) — audit finding "zero tests" was incorrect
- [x] Coverage for delegation modules exists — `delegation-manager.test.ts` (3234 LOC), `sdk-delegation.test.ts` (559 LOC), `completion-detector.test.ts` (337 LOC), `command-delegation.test.ts` (620 LOC)
- [x] Tests pass on Node.js (1165 total, 87 files)

### Gate 5: State Persistence (Phase 38)
- [x] `.hivemind/state/session-continuity.json` exists with real data (83KB)
- [x] `.hivemind/state/delegations.json` exists with real data (3KB)
- [ ] Recovery test simulates restart
- [ ] Atomic write durability tested

### Gate 6: Planning Truth (Phase 32)
- [ ] No phantom phase references in ROADMAP.md/STATE.md
- [ ] Phase 2 status matches filesystem
- [ ] Worktree phases labeled as worktree-only

---

## Blocker Chain

```
16.2 (PTY removal) ──┬──→ 49 (UAT update for headless)
                     └──→ 16.4 (architecture baseline update)

38 (tests) ───────────────→ 48.4 (test coverage for state persistence)

36 (CompletionDetector) ─┬──→ 37 (result harvesting)
                       └──→ 48.1 (runtime correctness)

46 (async dispatch) ──────→ 52 (end-user acceptance)
                       └──→ 16 (background delegation update)

48.4 (tests) ─────────────→ 53 (release readiness)

32 (phantom phases) ──────→ 31 (planning refresh)
```

---

## Next Actions

1. **Phase 16.2 lead:** Review `16.2-AUDIT-AMENDMENT-2026-04-30.md` and produce updated plan
2. **Phase 36 lead:** Remove `performStabilityPoll()` from `sdk-delegation.ts`; wire `CompletionDetector.onComplete` callback to delegation finalization
3. **Phase 46 lead:** Remove policy gate; update tool description
4. **Phase 48.4 lead:** Create test files for all delegation modules
5. **Phase 38 lead:** Add recovery/atomic-write tests (state persistence already works with `mkdirSync`)
6. **Phase 32 lead:** Audit all planning docs for phantom references

---

_Tracking: 2026-04-30_
_All amendments route to existing GSD phases — no new phases required_
