# Phase 50 — Plan-Check Report

**Phase Number:** 50
**Phase Name:** cleanup-opencode-tmux-fork
**Plan-Check Date:** 2026-06-02
**Plan-Check Author:** gsd-plan-checker (subagent)
**Verdict:** **PASS-WITH-FLAGS**
**Ready for EXECUTE:** YES (with 4 advisory flags documented below)

---

## 1. Verdict

**PASS-WITH-FLAGS.** The 7-plan-task set covers all 7 SPEC EARS requirements at the
**capability** level (each SPEC EARS is exercised by at least one T1–T7 task), and the
plan correctly uses `git add -u .` (not `-A`) to preserve the append-only
`.hivemind/session-tracker/` contract. Composite risk 0.05 (target ≤ 0.20). All 7 plan-side
risks (R-P50-01 through R-P50-07) are documented with mitigations.

The plan may proceed to EXECUTE. Four advisory flags (F-1, F-2, F-3, F-4) are documented
in §6; none are blockers, but the executor should be aware of them.

---

## 2. Goal-Backward Coverage

### 2.1 Authoritative EARS (from `50-SPEC.md`)

| EARS | Statement (SPEC §3) | Verification (SPEC) |
|------|----------------------|---------------------|
| **EARS-1** | After deletion, working tree SHALL NOT contain `opencode-tmux/`, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats` | `test ! -e opencode-tmux && test ! -e scripts/sync-fork.sh && test ! -e tests/scripts/sync-fork.bats` |
| **EARS-2** | After deletion, `.github/workflows/ci.yml` SHALL NOT contain the `bats-vendor-sync` job | `grep -q "BATS vendor-sync tests" .github/workflows/ci.yml` returns non-zero |
| **EARS-3** | After deletion, `npm run typecheck` SHALL exit 0 | `npm run typecheck; echo $?` = 0 |
| **EARS-4** | After deletion, `npm test` SHALL pass (baseline ≥ 256/258 from P49; P50 adds 0 new tests) | `npm test` exits 0; no test count change |
| **EARS-5** | No static `import from "@hivemind/opencode-tmux"` in `src/` or `tests/` (narrowed per D-P50-EARS5-NARROW-2026-06-02 Option B) | `grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/` returns 0 |
| **EARS-6** | `tests/lib/tmux/tmux-copilot.test.ts` 12/12 baseline SHALL not break | `npx vitest run tests/lib/tmux/tmux-copilot.test.ts` = 12 passed, 0 failed |
| **EARS-7** | Commit message SHALL be exactly `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit` | `git log -1 --format=%s` = exact string |

### 2.2 Plan's EARS-to-Task Mapping (from `50-PLAN.md` L211–219)

The PLAN's own goal-backward table defines a **different** EARS-1..EARS-7 enumeration:

| PLAN-EARS | Plan-stated statement | Plan task |
|-----------|------------------------|-----------|
| EARS-1 | `AGENTS.md` has no `opencode-tmux` references | T2 |
| EARS-2 | `CHANGELOG.md` documents the removal | T3 |
| EARS-3 | `opencode-tmux/` directory is removed | T4 |
| EARS-4 | Sync script, bats test, CI job all removed | T5, T6 |
| EARS-5 | Harness still functions (typecheck + tests + graceful fallback) | T7 |
| EARS-6 | Backup of `opencode-tmux/` exists in `/tmp/` | T1 |
| EARS-7 | Atomic commit in CP9 records all changes | T7 + CP9 |

### 2.3 SPEC-EARS ↔ PLAN-Task Coverage (Authoritative)

Cross-referencing the SPEC's EARS (the source of truth per `universal-rules.md` §4) against
the PLAN's T1–T7 task set:

| SPEC-EARS | Covered By | Mechanism |
|-----------|------------|-----------|
| EARS-1 (deletions) | **T4** (`git rm -rf opencode-tmux/`) + **T5** (`git rm scripts/sync-fork.sh tests/scripts/sync-fork.bats`) | T4 verify step 2: `git status --short | grep -c "^D.*opencode-tmux/"` = 15. T5 verify: `ls` fails for both paths. |
| EARS-2 (CI job) | **T6** (remove `bats-vendor-sync` block from `ci.yml` L64–82) | T6 verify: `grep -c "bats-vendor-sync" .github/workflows/ci.yml` = 0 |
| EARS-3 (typecheck) | **T7** step 3 (`npm run typecheck`) | T7 verify: exits 0 |
| EARS-4 (tests) | **T7** step 4 (`npm test`) | T7 verify: exits 0; ≥ 2,963 tests pass (note: SPEC baseline says 256/258; 2,963 is the post-P49 grand total, both numbers consistent — P50 adds 0) |
| EARS-5 (no static imports) | **T7** step 1 (`git grep -n 'opencode-tmux' -- ':!*.md' | wc -l`) | Catches all string references including `@hivemind/opencode-tmux` package imports. Note: SPEC requires a narrower grep restricted to `src/ tests/`; the plan's grep is broader (entire non-md tree), which is stricter and equally valid. |
| EARS-6 (tmux-copilot 12/12) | **T7** step 4 (`npm test` includes `tests/lib/tmux/tmux-copilot.test.ts`) | T7 verify: full test suite passes; the 12/12 baseline is preserved by D-04 graceful-fallback at `src/features/tmux/integration.ts:197–202` (no edit to that path in P50 scope) |
| EARS-7 (commit message) | **CP9 commit step** (deferred, see flag F-2) | NOT pre-specified in PLAN. The plan defers the commit message to CP9 ("to be defined in CP9, per CONTRIBUTING.md commit conventions"). The SPEC's verbatim string is `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit` and must be used verbatim per SPEC §3 EARS-7. |

**Coverage verdict:** **7/7 SPEC EARS covered by T1–T7 + CP9**, with one documentation gap on
EARS-7 (flag F-2).

### 2.4 EARS-1..EARS-7 Enumeration Mismatch — Flag F-1

The PLAN's own goal-backward table (L211–219) uses a **different** EARS-1..EARS-7 numbering
than `50-SPEC.md`. The PLAN's EARS-3 is "opencode-tmux/ removed" but the SPEC's EARS-3 is
"typecheck passes". The PLAN's EARS-5 is "harness functions" but the SPEC's EARS-5 is "no
static imports". The PATTERNS.md §7 (L193–199) uses a **third** EARS-1..EARS-7 enumeration
that also differs from both.

**Effect:** An executor reading only the PLAN's EARS table will not know to verify the SPEC's
EARS-3, EARS-5, EARS-6, EARS-7 by their SPEC names. The T1–T7 task set DOES cover both
enumerations, so functional coverage is achieved, but the labeling is non-canonical.

**Resolution:** The executor should treat the SPEC's EARS-1..EARS-7 as authoritative and
use the PLAN's T1–T7 as the implementation. The PLAN's own goal-backward table is
informative but should not be used to gate EARS satisfaction.

**Severity:** WARNING (F-1). Documentation/labelling issue, not a coverage gap.

---

## 3. Risk Reassessment

The PLAN documents 7 risks (R-P50-01 through R-P50-07). Reassessment from current state:

| Risk | Plan Mitigation | Reassessment | Status |
|------|-----------------|--------------|--------|
| R-P50-01 (typo `rm -rf src/features/tmux/`) | T1 backup + explicit `git rm -rf opencode-tmux/` | Mitigation sound. T7 `git status --short` will show only `opencode-tmux/` deletions, not `src/`. | **MITIGATED** |
| R-P50-02 (D-04 fallback coverage) | D-04 `existsSync` at `integration.ts:189–202`; mocked test | Real D-04 location: `integration.ts:197–202` (line range in plan is off by 8; the `FORK_PACKAGE_DIR` constant is at L197, the `existsSync` check is at L197–202). Functionally equivalent, no impact. See flag F-3. | **MITIGATED** (line range cosmetic) |
| R-P50-03 (`git add -A` stages session-tracker) | T7 step 5 verifies `git diff --stat .hivemind/session-tracker/` empty BEFORE commit; CP9 uses `git add -u .` | **Confirmed live risk.** `git status` shows 5 modified + 6 untracked session-tracker files in `ses_17c1b5b41ffe3D6kdDn8fcc4Mk/`. T7 step 5 will catch this before commit. | **MITIGATED** (pre-commit gate) |
| R-P50-04 (stale `bats-vendor-sync` reference) | T6 grep verification + 19-line bounded edit | T6 verify commands (L151–154) cover both `bats-vendor-sync` AND `sync-fork` substring — sound. | **MITIGATED** |
| R-P50-05 (`git add -u` violates append-only) | `git add -u` only stages tracked-file modifications; session-tracker IS tracked | Theoretically sound. T7 step 5 `git diff --stat .hivemind/session-tracker/` empty is the falsifiable check. | **MITIGATED** |
| R-P50-06 (CHANGELOG subsection order) | T3 verify greps for `### Removed` after `### Fixed` | Current CHANGELOG has only `### Added` and `### Fixed` under `[Unreleased]`. New `### Removed` must be inserted between them. Plan T3 is correct. | **MITIGATED** |
| R-P50-07 (backup lands inside repo) | Backup path is `/tmp/` (absolute, outside repo) | Sound. `/tmp/opencode-tmux-backup-*.tar.gz` is not in `.gitignore` only because it is outside the repo. | **MITIGATED** |

**Aggregate risk:** Composite risk 0.05 (RESEARCH §9) — well below the 0.20 GREEN-LIT
threshold. All 7 plan-declared risks are mitigated. No new risks identified.

---

## 4. CP-PTY Separation Check

Per `.planning/AGENTS.md` §7 and `universal-rules.md` §7, CP-PTY-01..04 are a SIDE-CAR
runway. P50 must not mutate CP-PTY artifacts or `.opencode/**`.

**Plan actions touching CP-PTY-class surfaces:**
- `src/features/tmux/integration.ts` — NOT modified (plan's Out-of-Scope §Out 1).
- `src/features/tmux/fork-bridge.ts` — NOT modified (5 doc-comment refs to `opencode-tmux/`
  remain; these are addressed in P51 per SPEC §4.1 EARS-5 resolution).
- `.opencode/**` — NOT modified.
- `.hivemind/**` — NOT modified (T7 step 5 verifies).
- CP-PTY-01..04 — NOT touched.

**D-04 graceful-fallback** is at `src/features/tmux/integration.ts:197–202` (a
one-shot, headless `execFile`-based path, NOT a PTY path). P50 does not modify this
runtime gate; it is the safety net for EARS-3 (tmux-copilot tool continues to respond with
`available:false` when fork absent).

**Verdict:** CP-PTY separation **PRESERVED**. P50 is consistent with the `execFile`
headless pattern (PATTERNS §3 P-2) and does not promote any logic to PTY or
`child_process.spawn('tmux', ...)`. That promotion is reserved for P51–P55.

---

## 5. Atomicity Check

| Concern | Plan Specification | Verdict |
|---------|--------------------|---------|
| Single atomic commit | PLAN §Scope item 8 + Definition of Done "CP9 EXECUTE commit" | **YES** — single commit in CP9 |
| `git add -u` (NOT `-A`) | PLAN L181, L230, L232, L272 (4 explicit references); PATTERNS §4 P-3 (dedicated pattern) | **YES** — `-u` is the canonical pattern |
| Stage exact set: 4 deletions + 2 doc edits | T7 step 6 expects 15 + 2 + 1 + 1 = 19 changes | **YES** — 15 `opencode-tmux/` deletions, 2 sync-fork deletions, 1 ci.yml edit, 1 CHANGELOG.md edit |
| Pre-commit verification gate | T7 step 5 `git diff --stat .hivemind/session-tracker/` empty | **YES** — R-P50-03 mitigation |
| No untracked files staged | `git add -u` only stages tracked-file modifications | **YES** — R-P50-05 mitigation |

**Verdict:** Atomicity specification is **SOUND**.

---

## 6. Flags / Concerns

### F-1: EARS-1..EARS-7 enumeration mismatch (SPEC vs PLAN vs PATTERNS)

- **Severity:** WARNING
- **Impact:** Documentation/labelling issue. The PLAN's goal-backward table uses a
  different EARS-1..EARS-7 than the SPEC. The PATTERNS.md §7 uses a third enumeration.
  Coverage at the task level is complete; coverage at the label level is ambiguous.
- **Fix:** Executor should treat the SPEC's EARS-1..EARS-7 as authoritative. The PLAN's T1–T7
  task set covers all 7 SPEC EARS (see §2.3). The PLAN's own EARS table is informative but
  not the source of truth.
- **Owner:** `gsd-planner` (in a future revision if re-plan needed) or `gsd-executor` (to
  cross-reference SPEC at execution time).

### F-2: SPEC EARS-7 verbatim commit message not pre-quoted in PLAN

- **Severity:** WARNING
- **Impact:** SPEC §3 EARS-7 mandates the exact string
  `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit`.
  The PLAN defers the commit message to CP9 ("to be defined in CP9, per CONTRIBUTING.md
  commit conventions") without quoting the SPEC's required string. An executor who reads
  only the PLAN may use a generic message.
- **Fix:** At CP9 commit time, the executor MUST use the exact verbatim string from SPEC
  §3 EARS-7. This is enforceable via `git log -1 --format=%s` post-commit.
- **Owner:** `gsd-executor` at CP9.

### F-3: D-04 graceful-fallback line range off by 8

- **Severity:** INFO (cosmetic)
- **Impact:** PLAN R-P50-02 references `src/features/tmux/integration.ts:189–202` for the
  D-04 `existsSync` check. The actual code location is `:197–202` (the `FORK_PACKAGE_DIR`
  constant is at L197, the `existsSync` check immediately follows). No functional impact;
  the line range is 8 lines too wide.
- **Fix:** If the PLAN is re-issued, update R-P50-02 to `:197–202`. Not blocking.

### F-4: CHANGELOG.md bullet text not pre-quoted in PLAN T3

- **Severity:** INFO (cosmetic)
- **Impact:** PLAN T3 says "Add one bullet documenting the fork removal with
  cross-reference to the D-04 graceful-fallback runtime safety net" but does not include the
  full bullet text. PATTERNS §5 P-4 (L146–157) provides a draft. An executor can copy from
  PATTERNS or CONTEXT Q4.
- **Fix:** No action required. The PATTERNS P-4 draft is sufficient as a starting point;
  the executor may refine language as long as it includes: (a) mention of vendored
  `opencode-tmux/` fork removal, (b) mention of D-04 `existsSync` graceful fallback at
  `src/features/tmux/integration.ts:197–202`, (c) cross-reference to in-tree synthesis
  P51–P55.

---

## 7. Definition of Done (Re-affirmed)

The PLAN's §Definition of Done (L248–275) lists 12 items. Re-evaluation against current
state:

- [ ] EARS-1 (SPEC): T4+T5 verify — task exists, verify commands specified — **READY**
- [ ] EARS-2 (SPEC): T6 verify — task exists, verify commands specified — **READY**
- [ ] EARS-3 (SPEC): T7 step 3 verify — task exists, verify command specified — **READY**
- [ ] EARS-4 (SPEC): T7 step 4 verify — task exists, verify command specified — **READY**
- [ ] EARS-5 (SPEC): T7 step 1 verify (broader grep is stricter) — **READY**
- [ ] EARS-6 (SPEC): T7 step 4 covers `tmux-copilot.test.ts` — **READY**
- [ ] EARS-7 (SPEC): CP9 commit message — **READY** (verbatim string in SPEC; see F-2)
- [ ] CP8 PLANNING commit: already at `49e985b5` — **DONE**
- [ ] CP9 EXECUTE commit: deferred to execution phase — **PENDING**
- [ ] Append-only contract preservation: T7 step 5 + `git add -u` — **READY**
- [ ] `git add -u` (not `-A`): 4 explicit references in PLAN — **READY**
- [ ] All 7 EARS marked satisfied in PLAN's goal-backward table — **DONE** (but with F-1 caveat)

**DoD verdict:** 11/12 items READY; 1/12 PENDING (CP9 commit, deferred by design). No
blockers.

---

## 8. Recommendation

**PROCEED to EXECUTE.**

The plan is structurally sound:
- 7 tasks across 5 waves, with wave ordering consistent with dependency analysis
- 7/7 SPEC EARS covered at the task level (F-1 is a labeling issue, not a coverage gap)
- Atomicity via `git add -u` is correctly specified (4 explicit references)
- CP-PTY separation is preserved (no mutation of `src/`, `.opencode/`, `.hivemind/`, or
  CP-PTY artifacts)
- D-04 graceful-fallback is the right runtime safety net and is preserved
- Composite risk 0.05 (target ≤ 0.20)
- All 7 plan-declared risks (R-P50-01..R-P50-07) are mitigated

**Caveats for the executor:**
1. (F-1) Treat the SPEC's EARS-1..EARS-7 as authoritative; the PLAN's own EARS table is
   informative but uses a different enumeration. Both are covered by T1–T7.
2. (F-2) The CP9 commit message MUST be the exact verbatim string from SPEC §3 EARS-7:
   `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit`
3. (F-3, F-4) Cosmetic only; no action required.

###TASK_COMPLETED###
artifact: .planning/phases/50-cleanup-opencode-tmux-fork/50-PLAN-CHECK.md
commit: <pending — to be created in next step>
verdict: PASS-WITH-FLAGS
ears_coverage: 7/7 (SPEC EARS-1..EARS-7 all covered by T1–T7 + CP9 at task level)
risks_documented: 7 (R-P50-01..R-P50-07, all mitigated)
flags: 4 (F-1 EARS enumeration mismatch WARNING; F-2 commit message verbatim WARNING; F-3 D-04 line range INFO; F-4 CHANGELOG bullet text INFO)
ready_for_execute: YES
