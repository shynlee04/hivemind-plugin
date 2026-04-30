# Audit Remediation Tracking: delegation-async-pty-lifecycle-audit-2026-04-30

**Audit Source:** `.planning/audits/delegation-async-pty-lifecycle-audit-2026-04-30.md` (referenced in original tracking; physical file not present in this branch)
**Tracking Date:** 2026-04-30
**Routing Document:** `AUDIT-REMEDIATION-ROUTING-2026-04-30.md`
**Validation Document:** `AUDIT-VALIDATION-2026-04-30.md` (added 2026-04-30 by Devin acting as `hm-l1-coordinator`)
**Last Revised:** 2026-04-30 (post-validation)

---

## ⚠ VALIDATION OVERRIDE — read first

The original tracking table classified all 8 audit findings as confirmed gaps. A line-by-line validation against the codebase at the head of `feature/harness-implementation` (= the audit's "worktree") found **5 of 8 findings to be incorrect**. See `AUDIT-VALIDATION-2026-04-30.md` for evidence per finding. The status overrides in §3 below are the **post-validation** statuses that supersede the original "Amended Status" column.

---

## 1. Amendment Documents (original) + Validation Verdicts

| Phase | Amendment File | Audit Claim | Validation Verdict | Priority (post-validation) |
|-------|---------------|-------------|--------------------|----------------------------|
| 16.2 | `phases/16-…/16.2-AUDIT-AMENDMENT-2026-04-30.md` | PTY 100% non-functional on Node | **VALIDATED w/ caveat** (try/catch swallows the import error at runtime; install-time + dead actions are real) | **P0** |
| 36 | `phases/36-…/36-AUDIT-AMENDMENT-2026-04-30.md` | Adaptive polling instead of dual-signal | **VALIDATED** | **P0** |
| 46 | `phases/46-…/46-AUDIT-AMENDMENT-2026-04-30.md` | Policy gate downgrades async | **VALIDATED** | **P1** (default `true` mitigates) |
| 48.4 | `phases/48.4-…/48.4-AUDIT-AMENDMENT-2026-04-30.md` | Zero tests in worktree | **REFUTED** — 84 test files, 1,414 specs, 6,417 LOC delegation tests | DROPPED → re-scoped to **48.4.1** (P2 green-bar + coverage) |
| 38 | `phases/38-…/38-AUDIT-AMENDMENT-2026-04-30.md` | No state files on disk | **REFUTED** — `.hivemind/state/{session-continuity,delegations}.json` exist with real data | DROPPED → narrowed to **38.1** (P3 `brain.json` + fresh-install regression) |
| 32 | `phases/32-…/32-AUDIT-AMENDMENT-2026-04-30.md` | Phantom phase references | **CONTEXTUAL** — phases live under `workstreams/milestone/phases/`, audit was looking at legacy `.planning/phases/` root | Re-scoped to **32.1** (P2 path-layout doc) |

---

## 2. New Phases Created (post-validation, this branch)

These were scaffolded under `.planning/workstreams/milestone/phases/` to address validated gaps and to re-scope refuted findings into accurate work items.

| Phase | Driver Finding | Priority | Depends On | Blocks |
|-------|----------------|----------|------------|--------|
| **16.2.1** PTY Subsystem Detox | 1 (validated) | P0 | — | 49, 16.4.1, 48.4.1 |
| **36.1** CompletionDetector Re-Wiring | 2 (validated) | P0 | 36 | 37, 48.1, 52 |
| **46.1** Always-Background Truth Reset | 3 (validated) | P1 | 46 | 16, 52 |
| **48.4.1** Node 20 Green-Bar + Coverage | 4 (refuted; re-scoped) | P2 | 16.2.1, 36.1, 46.1 | 49, 53 |
| **38.1** State Persistence Final Sweep | 5 (refuted; narrowed) | P3 | — | 66 |
| **32.1** Workstream Path Layout Doc | 6 (contextual; re-scoped) | P2 | — | 31 |
| **16.4.1** Branch Strategy Resolution | 7 (validated; inverted) | P2 | 16.2.1 | 53 |

---

## 3. Status Overrides (post-validation)

| Phase | Original Override | **Post-Validation Status** | Reason |
|-------|-------------------|----------------------------|--------|
| 16.2 | NOT REMEDIATED | **NOT REMEDIATED** (kept) | Real gap — install-time `bun-pty` + dead `output`/`input`/`terminate` actions |
| 36 | BLOCKED | **PARTIAL** (downgraded) | Adaptive polling confirmed; orphaned detector confirmed; PH36-01/-02/-03 may already be partially addressed — verify before re-implementing |
| 46 | PARTIAL | **PARTIAL** (kept, P1 not P0) | Default policy = `true` so most installs unaffected; gate must still be removed |
| 48.4 | NOT COMPLETE | **COMPLETE WITH NEW DEFERRED GAP** (reverted) | Test corpus exists (1,414 specs); replaced by 48.4.1 for Node-20 green-bar + coverage publication |
| 38 | BLOCKED | **PARTIAL** (downgraded) | State files exist; only `brain.json` + fresh-install regression remain |
| 32 | INCOMPLETE | **COMPLETE — pending path-layout doc** | No phantom phases; only documentation gap remains (32.1) |
| 16.4 | INCOMPLETE | **COMPLETE — pending branch-strategy ADR** | Two branches exist intentionally; ADR (16.4.1) closes the framing gap |
| 49 | NEEDS UPDATE | **NEEDS UPDATE** (kept) | Verify after 16.2.1 lands |
| 2 | 0/8, 1 doc | **9/9 plans, 18/18 verified** (REVERTED) | 27 .md files including all 9 PLANs, all 9 SUMMARIes, full lifecycle gates exist on disk; original "0/8" claim was based on examining the wrong path root |

---

## 4. Execution Order (post-validation)

| Order | Phase | Action | Blocks |
|-------|-------|--------|--------|
| 1 | **16.2.1** | Detox PTY subsystem; remove `bun-pty` from `dependencies` | 16.4.1, 48.4.1, 49 |
| 2 | **36.1** | Wire `CompletionDetector` as single completion authority; delete adaptive-polling constants | 37, 48.1, 52 |
| 3 | **46.1** | Remove `builtinAsyncBackgroundChildSessions` dispatch gate; align tool description | 16, 52 |
| 4 | **48.4.1** | Node 20 CI matrix + per-module coverage publication | 49, 53 |
| 5 | **38.1** | Resolve `brain.json` + add fresh-install regression test | 66 |
| 6 | **32.1** | Document workstream-rooted phase layout | 31 |
| 7 | **16.4.1** | Record branch-strategy ADR; enact canonical branch | 53 |

**Critical path** (P0 + P1): 16.2.1 → 36.1 → 46.1 → 48.4.1, est. 8–11 working days.
**Parallelizable** (½-day each): 38.1, 32.1, 16.4.1.

---

## 5. Verification Gates (post-validation)

Mapped to `AUDIT-VALIDATION-2026-04-30.md §6`:

| Gate | Phase | Pass Criteria (summary) |
|------|-------|-------------------------|
| G1 | 16.2.1 | `npm install --omit=optional && npm test` green on Node 20; no `bun-pty` postinstall |
| G2 | 36.1 | `grep -r "STABLE_POLLS_REQUIRED\|MIN_IDLE_TIME_MS\|MIN_STABILITY_TIME_MS\|calculateAdaptiveInterval" src/` returns 0 hits; CompletionDetector drives finalization |
| G3 | 46.1 | Dispatch path no longer references `builtinAsyncBackgroundChildSessions`; throws on missing async runtime |
| G4 | 48.4.1 | Node 20 CI green; ≥80% line coverage on delegation modules; report committed |
| G5 | 38.1 | `brain.json` schema-valid or removed; `tests/lib/continuity.test.ts` includes fresh-install case |
| G6 | 32.1 | `.planning/PROJECT.md` documents workstream layout; phase IDs resolve across all three workstream roots |
| G7 | 16.4.1 | ADR recorded; canonical branch updated in CI + GitHub |

Each phase's per-gate checklist lives in its `*-VERIFICATION.md`.

---

## 6. Blocker Chain (post-validation)

```
16.2.1 (PTY detox) ──┬──→ 49 (UAT update for headless)
                     ├──→ 16.4.1 (canonical branch decision)
                     └──→ 48.4.1 (Node 20 install must succeed)

36.1 (CompletionDetector) ─┬──→ 37 (result harvesting)
                           ├──→ 48.1 (runtime correctness)
                           └──→ 52 (end-user acceptance)

46.1 (async gate removal) ─┬──→ 16 (background delegation update)
                           └──→ 52 (end-user acceptance)

48.4.1 (green-bar) ───────→ 49, 53

38.1 (state sweep) ────────→ 66

32.1 (path layout) ───────→ 31

16.4.1 (branch ADR) ──────→ 53
```

---

## 7. Next Actions

1. **Phase 16.2.1 lead:** lock Option A/B/C, then execute `01-PLAN`. Expect Node-20 green install.
2. **Phase 36.1 lead:** execute `01-PLAN`. Status enum consolidation goes LAST (highest blast radius).
3. **Phase 46.1 lead:** execute `01-PLAN`. Coordinate `delegate-task` description copy with the tool catalog.
4. **Phase 48.4.1 lead:** wait on 16.2.1 + 36.1 + 46.1, then publish CI matrix + coverage.
5. **Parallel work:** 38.1 / 32.1 / 16.4.1 owners can start any time.
6. **Re-issue audit:** after 16.2.1 + 36.1 land, re-run a delegation-async-pty audit to verify the validated findings are closed.
