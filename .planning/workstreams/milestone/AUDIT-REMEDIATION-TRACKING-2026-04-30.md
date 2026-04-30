# Audit Remediation Tracking: delegation-async-pty-lifecycle-audit-2026-04-30

**Audit Source:** `.planning/audits/delegation-async-pty-lifecycle-audit-2026-04-30.md` (main repo)
**Tracking Date:** 2026-04-30
**Routing Document:** `AUDIT-REMEDIATION-ROUTING-2026-04-30.md`

---

## Amendment Documents Created

| Phase | Amendment File | Finding | Priority |
|-------|---------------|---------|----------|
| 16.2 | `16.2-AUDIT-AMENDMENT-2026-04-30.md` | PTY 100% non-functional on Node.js | P0 CRITICAL |
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

## Status Overrides

| Phase | Previous Status | Amended Status | Reason |
|-------|-----------------|----------------|--------|
| 16.2 | REMEDIATED | **NOT REMEDIATED** | `bun-pty` crashes Node.js; lazy load does not prevent crash |
| 36 | PENDING | **BLOCKED** | `CompletionDetector` exists but is not wired to SDK delegation finalization; `sdk-delegation.ts` has parallel adaptive polling |
| 46 | COMPLETE | **PARTIAL** | New critical gap: REM-HIGH-05 (policy gate blocks async) |
| 48.4 | COMPLETE WITH DEFERRED GAPS | **NOT COMPLETE** | Zero tests is a coverage failure, not a deferred gap |
| 38 | PENDING | **PARTIAL** | State persistence works (files exist, `mkdirSync` present) but has zero test coverage |
| 32 | COMPLETE (7/7) | **INCOMPLETE** | Phantom phases remain in docs; Phase 2 status inflated |
| 16.4 | COMPLETE | **INCOMPLETE** | Two divergent codebases not reconciled |
| 49 | COMPLETE WITH PARTIAL EVIDENCE | **NEEDS UPDATE** | Must verify headless-only commands after PTY removal |
| 2 | 9/9 plans, 18/18 verified | **0/8 complete, 1 research doc** | Only RESEARCH.md exists in main repo `.planning/phases/02/` |

---

## Verification Gates

### Gate 1: Node.js Compatibility (Phase 16.2)
- [ ] `npm test` passes on Node.js (not Bun)
- [ ] `run-background-command` works without `bun-pty`
- [ ] No "PTY not available" errors

### Gate 2: Completion Detection (Phase 36)
- [x] `CompletionDetector` exists in worktree (127 LOC, instantiated in `lifecycle-manager.ts:73`)
- [ ] `CompletionDetector` wired to SDK delegation finalization via `onComplete` callback
- [ ] `sdk-delegation.ts` adaptive polling removed (`performStabilityPoll()`, `calculateAdaptiveInterval()`)
- [ ] Single completion detection path for all delegation types
- [ ] Tests verify event-driven completion for SDK delegations

### Gate 3: Async Dispatch (Phase 46)
- [ ] `run_in_background: true` always calls `sendPromptAsync`
- [ ] No policy flag gates dispatch mode
- [ ] Explicit error if runtime lacks async support

### Gate 4: Test Coverage (Phase 48.4)
- [ ] 50+ tests in worktree (was 0)
- [ ] Coverage for delegation modules > 80%
- [ ] Tests pass on Node.js

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
