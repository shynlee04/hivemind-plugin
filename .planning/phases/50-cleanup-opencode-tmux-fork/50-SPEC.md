---
phase: 50-cleanup-opencode-tmux-fork
type: specification
date: 2026-06-02
status: draft
authored_by: hm-specifier
contract: awc-50-spec
eam_followed: EARS (Easy Approach to Requirements Syntax)
depends_on:
  - phase 49 (closed, commits 209ca5f8 + a3f3f647)
  - 49-CLOSE-PIVOT-2026-06-02.md §4 (synthesis phase plan)
  - 49-CLOSE-PIVOT-2026-06-02.md §5 (decision record)
supersedes: 45-01 (sync-fork.sh), 45-02 (sync-fork.bats), 45-CI job
downstream_unblocks: P51, P52, P53, P54, P55
---

<!-- EARS-5 revised per L0 decision D-P50-EARS5-NARROW-2026-06-02 (Option B) -->

# Phase 50 — SPECIFICATION: Cleanup opencode-tmux Fork + Script Coupling

## 1. Goal

**Verbatim from AWC `awc-50-spec` taskBoundary + ROADMAP P50 entry (lines 1934-1943):**

> Phase 50 cleanup: drop opencode-tmux fork and CI script coupling. 4 deletions in single atomic commit. L1: tsc passes, vitest passes, no dead imports.
>
> **ROADMAP P50 Goal:** Remove the `opencode-tmux/` package, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` job in `.github/workflows/ci.yml` (lines 64-82) — all artifacts of the now-deferred P45 vendor-sync strategy. After P50, no references to the fork, the sync script, or the BATS-vendor-sync CI job remain in the repo. This is the **PIVOT** phase that transitions from external-fork to in-tree synthesis (P51-P55).
>
> **Plan 50-01:** Remove `opencode-tmux/` directory (~932 LOC source + 1,820 LOC test), `scripts/sync-fork.sh` (126 LOC), `tests/scripts/sync-fork.bats` (210 LOC), and the `bats-vendor-sync` job from `.github/workflows/ci.yml` (L64-82) — single atomic commit with clean verification (tsc + vitest + grep + CI lint). No dead imports in `src/`.

This is the **PIVOT** phase that transitions from external-fork to in-tree synthesis (P51-P55). Phase 50 itself adds **zero new runtime code**; it only removes dead fork artifacts and makes the repository importable as a self-contained `hivemind` npm package without the `@hivemind/opencode-tmux` runtime dependency.

## 2. Scope (4 explicit deletions in a single atomic commit)

The execute-phase (Checkpoint 10, gsd-executor) MUST perform all four changes in a single atomic commit. The commit message MUST follow the exact format specified in EARS-7.

### 2.1 Deletion 1: `opencode-tmux/` directory

```bash
git rm -rf opencode-tmux/
```

Drops the entire `@hivemind/opencode-tmux` fork package. Verified contents at execution time (2026-06-02):

```
opencode-tmux/
├── .github/                    # PR/issue templates (drop)
├── .gitignore                  # drop
├── .npmignore                  # drop
├── LICENSE                     # drop
├── README.md                   # drop
├── bun.lock                    # drop
├── bunfig.toml                 # drop
├── coverage/                   # 24 subdirs of coverage reports (drop)
├── dist/                       # built artifacts (drop)
├── node_modules/               # 31 entries (drop)
├── package.json                # v0.6.0, peer @opencode-ai/plugin ^1.15.13
├── src/                        # 9 subdirs, 1,820 LOC test + 932 LOC source
│   ├── index.ts                # default export only
│   ├── tmux.ts                 # PaneState + shell quoting
│   ├── grid-planner.ts         # PaneGridPlanner DFS + 500ms debounce
│   ├── session-manager.ts      # 5 interlocking state sets
│   └── __tests__/              # 1,820 LOC test, 3 files
└── tsconfig.json               # drop
```

**Note:** `git rm -rf` is preferred over `rm -rf` to ensure the deletion is properly staged and the working tree remains consistent. The `.gitkeep` in `.planning/phases/50-cleanup-opencode-tmux-fork/` (the phase directory, not `opencode-tmux/`) is preserved — see Gray-Area Question #2.

### 2.2 Deletion 2: `scripts/sync-fork.sh` (126 LOC, 5,401 bytes)

```bash
git rm scripts/sync-fork.sh
```

Drops the P45 vendor-sync shell script that orchestrated the `opencode-tmux` fork → main repo sync with conflict detection, dry-run mode, and pinned file protection. Becomes MOOT post-fork-drop (per close-pivot §3.3).

### 2.3 Deletion 3: `tests/scripts/sync-fork.bats` (210 LOC, 7,683 bytes)

```bash
git rm tests/scripts/sync-fork.bats
```

Drops the BATS test suite that exercised `sync-fork.sh` scenarios (3 BATS cases per P45-02). Becomes MOOT along with Deletion 2.

**Note:** If `tests/scripts/` becomes empty after this deletion, the directory SHOULD be preserved (not `git rm`'d) with a `.gitkeep` to keep the directory structure navigable. See Gray-Area Question #2.

### 2.4 Deletion 4: `bats-vendor-sync` job in `.github/workflows/ci.yml` (lines 64-82)

Edit `.github/workflows/ci.yml` to remove:

1. The job header `  bats-vendor-sync:` (line 64)
2. The job `    name: BATS vendor-sync tests` (line 65)
3. The `runs-on: ubuntu-latest` line (line 66)
4. The `continue-on-error: true` line (line 67)
5. The `steps:` block (lines 68-82), including:
   - `Checkout` (uses actions/checkout@v4)
   - `Setup Node.js 22` (uses actions/setup-node@v4)
   - `Install BATS` (apt-get install)
   - `Run BATS suite` (bats tests/scripts/sync-fork.bats)

**Also remove** the comment block at lines 59-63:

```yaml
  # Phase 49 (REQ-07): BATS vendor-sync test surface in CI.
  # Per D-08: BATS is verification, not gating — continue-on-error at JOB level
  # means a flaky BATS environment (e.g. missing apt package on a future runner
  # image) does NOT block the PR. The red BATS job is a soft signal in the
  # Actions UI; humans investigate.
```

The CI YAML MUST remain syntactically valid YAML after the edit. The remaining CI jobs (vitest, typecheck, lint) MUST be unchanged.

### 2.5 What is NOT in scope (must not be touched in P50)

Per AWC `allowedSurfaces`, P50 is restricted to the 4 surfaces above. The following MUST remain unchanged:

- `src/features/tmux/fork-bridge.ts` (156 LOC) — kept intact; P51 will rewrite
- `src/features/tmux/integration.ts` (191 LOC) — kept intact; P51 will rewrite
- `src/features/tmux/observers.ts` (93 LOC) — kept intact; P53 will extend
- `src/tools/tmux-copilot.ts` — kept intact (L100-112 `TmuxCopilotResult` union from P49 fix-2 is contract-stable for P52)
- `src/plugin.ts` — kept intact (L391 log "26 custom tools", L647-671 tool spread)
- `tests/lib/tmux/integration.test.ts` (364 LOC) — kept intact
- `tests/lib/tmux/tmux-copilot.test.ts` (12 tests) — kept intact
- `tsconfig.json`, `package.json` — kept intact (P51+ may modify)
- `.planning/ROADMAP.md` — kept intact (no ROADMAP changes in P50)
- `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` — kept intact (seed status remains `planted`)

## 3. Non-Goals (verbatim from AWC)

The following are **explicitly out of scope** for P50 and MUST NOT be addressed by gsd-executor:

1. Replacing `src/features/tmux/fork-bridge.ts` with in-tree classes — **P51**
2. Synthesizing new tmux classes (`tmux-multiplexer.ts`, `session-manager.ts`, `grid-planner.ts`) — **P51**
3. Wiring `tmux-copilot` tool to real in-tree classes (factory swap) — **P52**
4. Pane monitoring hook (`pane-monitor.ts`) + journal integration — **P53**
5. Session persistence + restart-recovery (`persistence.ts`) — **P54**
6. E2E UAT against the seed's 4 success criteria — **P55**
7. Re-writing P42/P43/P45 UAT.md / VERIFICATION.md to reference P53 L1 evidence — **P53**
8. Adding `@json-render/react` or any new dependencies — **P51+**
9. Any tsconfig.json or package.json changes — **P51+**

## 4. EARS Acceptance Criteria

The execute-phase MUST satisfy all 7 EARS criteria. Each is independently falsifiable.

| Req ID | EARS Type | Requirement | Acceptance Criterion (Falsifiable) | Verification Method | Priority |
|--------|-----------|-------------|------------------------------------|---------------------|----------|
| **EARS-1** | ubiquitous | After the deletion commit, the working tree SHALL NOT contain `opencode-tmux/`, `scripts/sync-fork.sh`, or `tests/scripts/sync-fork.bats`. | `test ! -e opencode-tmux && test ! -e scripts/sync-fork.sh && test ! -e tests/scripts/sync-fork.bats` exits 0 | automated check (bash `test -e`) | HIGH |
| **EARS-2** | ubiquitous | After the deletion commit, `.github/workflows/ci.yml` SHALL NOT contain the `bats-vendor-sync` job. | `grep -q "BATS vendor-sync tests" .github/workflows/ci.yml` returns non-zero (no match) | automated check (grep) | HIGH |
| **EARS-3** | state-driven | When `npm run typecheck` is run after the deletion, it SHALL exit 0. | `npm run typecheck; echo $?` outputs `0` | automated test | HIGH |
| **EARS-4** | state-driven | When `npm test` is run after the deletion, all vitest suites SHALL pass. Baseline ≥ 256/258 from P49; P50 adds 0 new tests. | `npm test` exits 0; vitest reporter shows `Test Files` count = pre-deletion count (no tests removed) and `Tests` count = same or higher (0 new) | automated test (vitest) | HIGH |
| **EARS-5** | state-driven | When `grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/` is run, it SHALL return zero matches (no dead static import statements). | `grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/; echo $?` outputs `1` (grep exits 1 when no match) | automated check (grep) | HIGH |
| **EARS-6** | unwanted | The deletion SHALL NOT break the existing `tests/lib/tmux/tmux-copilot.test.ts` 12/12 baseline. | After P50 commits, `npx vitest run tests/lib/tmux/tmux-copilot.test.ts` reports 12 passed, 0 failed | automated test (vitest) | HIGH |
| **EARS-7** | unwanted | The commit message SHALL follow the format `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit`. | `git log -1 --format=%s` outputs the exact string above (verbatim) | inspection (git) | MEDIUM |

### 4.1 EARS-5 Ambiguity Flag (RESOLVED per L0 decision D-P50-EARS5-NARROW-2026-06-02 — Option B)

**Original score: 5/5 (VAGUE) — RESOLVED in Checkpoint 4 retry by L0 binding decision.** EARS-5 was flagged because the original grep `grep -r "opencode-tmux" src/ tests/` could not be satisfied by the 4-deletion scope in §2. After the atomic commit executes, 8 string references remain in 3 files outside `allowedSurfaces` (JSDoc comments in `fork-bridge.ts` L5/13/31/53/66, a `FORK_PACKAGE_DIR` string constant in `integration.ts:197`, and a comment + conditional guard in `integration.test.ts` L310/315). P51 will clean these up when `fork-bridge.ts` is rewritten and `buildInTreeSessionManager` replaces the fork.

**Resolution applied (Option B per L0 decision D-P50-EARS5-NARROW-2026-06-02):** EARS-5 was narrowed to check only static `import` statements:

```sh
grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/
```

The 4-deletion scope satisfies this criterion — no live `import` from `@hivemind/opencode-tmux` exists today; the 8 remaining string references are all JSDoc comments or string constants, not import statements. The narrowed criterion proves what P50 can honestly prove: no dead static imports remain. The remaining 8 string references are explicitly out of scope per AWC `allowedSurfaces` and will be removed by P51.

**Rationale for Option B (L0 binding):**

- (a) The original "no references" semantic was over-broad. JSDoc comments and string constants don't cause runtime errors. P50's atomic-commit boundary per `49-CLOSE-PIVOT-2026-06-02.md` §6 is sacred — the AWC `allowedSurfaces` is a hard contract.
- (b) P51 (`src/features/tmux/fork-bridge.ts` rewrite) will eliminate the 8 remaining string references. P50's narrowed EARS-5 closes the loop on what P50 can prove (no static imports) while preserving the audit trail that the 8 remaining refs are P51's responsibility, not P50's.
- (c) The narrowed criterion is a strict subset of the original; nothing in §2 changes. The atomic commit still deletes exactly 4 entries.

**Post-resolution score: 1/5 (Crystal Clear).** All 7 EARS criteria are now unambiguous. See §10 (Decision Record) for the full decision rationale and the L0 binding decision ID.

## 5. Verification Commands (L1 evidence contract)

The execute-phase MUST run and capture all four commands. Output is required for the verify-work (Checkpoint 10 → 11) gate.

```bash
# EARS-3: typecheck
npm run typecheck
# Expected: exit 0

# EARS-4: full test suite
npm test
# Expected: exit 0; all vitest suites pass
# Baseline: ≥ 256/258 from P49 (no tests removed; 0 new in P50)

# EARS-1: deleted files
ls -la opencode-tmux scripts/sync-fork.sh tests/scripts/sync-fork.bats 2>&1
# Expected: "No such file or directory" for all three

# EARS-2: ci.yml job removed
grep -c "BATS vendor-sync tests" .github/workflows/ci.yml
# Expected: 0 (or grep returns non-zero exit if used with -q)

# EARS-5: no dead static imports (RESOLVED via Option B per D-P50-EARS5-NARROW-2026-06-02)
grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/ || echo "no dead static imports"
# Expected: zero matches (no live import statements; remaining 8 string references are JSDoc/string constants handled in P51)

# EARS-6: tmux-copilot tests intact
npx vitest run tests/lib/tmux/tmux-copilot.test.ts
# Expected: 12 passed, 0 failed

# EARS-7: commit message format
git log -1 --format=%s
# Expected: "phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit"

# Single-commit verification
git log --oneline -5
# Expected: exactly 1 new commit on top of the P49 closure commit (209ca5f8 or a3f3f647)

# Git stat — 4 file changes
git log -1 --stat
# Expected: 4 lines in the stat — one for opencode-tmux/ deletion, one for sync-fork.sh, one for sync-fork.bats, one for ci.yml (modified)
```

## 6. Dependency on P49 Closure

This section quotes the relevant parts of `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md`:

### 6.1 §4 — Seed Success Criteria Status (defines why P50 is needed)

> The seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` is "planted" status 2026-05-31. After P55, status advances to `germinated` (live) or remains `planted` if P53–P54 fail to deliver L1 evidence.
>
> The seed's 4 success criteria:
> 1. Human can see all active subagent sessions in tmux panes — L5 (planning only) → P53 delivers
> 2. Human can prompt orchestrator to intervene in specific sessions — L5 → P52
> 3. Sessions survive parent process restart — L5 → P54
> 4. Orchestrator can query tmux state for delegation decisions — L5 → P52

P50 is the necessary precondition: the seed's 4 success criteria cannot be delivered by P51-P55 if the `@hivemind/opencode-tmux` runtime dependency remains, because the fork's `fork-bridge.ts:127-138` relies on a `context.task` SDK field that does not exist in `@opencode-ai/plugin` v1.15.4 (per close-pivot §2.3).

### 6.2 §5 — P50-P55 Phase Plan (defines P50's position)

> | Phase | Goal | Scope | L-Target |
> | ----- | ---- | ----- | -------- |
> | P50 | Drop opencode-tmux fork + remove CI/script coupling | 4 deletions + 1 commit | L1 tsc + vitest pass with no dead imports |

P50 is the **first** of 6 synthesis phases (P50-P55). It carries the lowest risk: pure deletion, no new logic. P51 carries the highest risk (rewriting SessionManager 5 state sets in-tree).

### 6.3 §6 — Boundary Contracts Locked for P50-P55

> - `src/features/tmux/fork-bridge.ts` — REMOVE in P50 (fork dropped). [NOTE: Per AWC `allowedSurfaces`, this REMOVAL is **deferred to P51**; P50 only deletes the on-disk `opencode-tmux/` package and the sync script. The in-tree `fork-bridge.ts` glue remains to keep the 12/12 `tmux-copilot.test.ts` baseline green.]

P50 does NOT depend on the in-tree `fork-bridge.ts` removal; P51 does.

### 6.4 §9 — Decision Record (D-PIVOT-04 is P50's charter)

> | ID | Decision | Date |
> | -- | -------- | ---- |
> | D-PIVOT-04 | P45 vendor-sync artifacts (scripts/, bats, ci job) removed in P50 | 2026-06-02 |

P50 is the direct execution of D-PIVOT-04.

## 7. Downstream Contract (what P51+ will assume post-P50)

After P50 completes, the repository state will be:

### 7.1 REMOVED (gone from disk and git history's HEAD)

- ✅ `opencode-tmux/` (the entire fork package)
- ✅ `scripts/sync-fork.sh`
- ✅ `tests/scripts/sync-fork.bats`
- ✅ `.github/workflows/ci.yml` `bats-vendor-sync` job (lines 64-82 plus comment block 59-63)

### 7.2 PRESERVED UNCHANGED (P51+ will modify, NOT P50)

| File | LOC | Status | P51+ Action |
|------|-----|--------|-------------|
| `src/features/tmux/fork-bridge.ts` | 156 | UNCHANGED in P50 | P51 will REMOVE (per D-PIVOT-06) |
| `src/features/tmux/integration.ts` | 191 | UNCHANGED in P50 | P51 will REWRITE to factory-of-real-classes |
| `src/features/tmux/observers.ts` | 93 | UNCHANGED in P50 | P53 will EXTEND with `session-state-changed` + `pane-captured` subscriptions |
| `src/tools/tmux-copilot.ts` | 224 | UNCHANGED in P50 (L100-112 union is contract-stable) | P52 will SWAP factory from `buildNoopForkSessionManager` to `buildInTreeSessionManager` |
| `src/plugin.ts` (L391 log, L647-671 tool spread) | — | UNCHANGED in P50 | UNCHANGED in P51-P55 |
| `tests/lib/tmux/integration.test.ts` | 364 | UNCHANGED in P50 | P51 will KEEP (per close-pivot "existing `integration.test.ts` (363 LOC) + `tmux-copilot.test.ts` (12 tests) untouched") |
| `tests/lib/tmux/tmux-copilot.test.ts` | 12 tests | UNCHANGED in P50 | UNCHANGED in P51-P55 |
| `tsconfig.json` | — | UNCHANGED in P50 | P51+ may add paths for `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` |
| `package.json` | — | UNCHANGED in P50 (no dep on `@hivemind/opencode-tmux` ever existed) | P51+ may add `@json-render/react` and other deps |

### 7.3 Branch / Commit State Assumption

- Branch: `feature/harness-implementation` (current, per close-pivot §2.1)
- P49 closure commits: `209ca5f8` and `a3f3f647` (the closure + a follow-up)
- P50 commit: 1 atomic commit on top of P49 closure, message: `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit`

P51 will start from this P50 HEAD and execute its 1 plan (`51-01`).

## 8. Composite Clarity Score (self-reported per gsd-spec-phase gate)

The 7 EARS criteria are scored on the 1-5 ambiguity rubric (per agent context §Ambiguity Scoring Rubric):

| Req ID | Score | Rationale | Flagged? |
|--------|-------|-----------|----------|
| EARS-1 | 1 (Crystal Clear) | Direct file-existence check; no interpretation needed | NO |
| EARS-2 | 1 (Crystal Clear) | Substring grep is unambiguous; `name: BATS vendor-sync tests` is unique | NO |
| EARS-3 | 1 (Crystal Clear) | `npm run typecheck; echo $?` is the standard falsifiable check | NO |
| EARS-4 | 2 (Low Ambiguity) | "Baseline ≥ 256/258" is approximate; the falsifiable part is "all pass with 0 new" | NO |
| EARS-5 | **1 (Crystal Clear)** | **RESOLVED** per L0 decision `D-P50-EARS5-NARROW-2026-06-02` (Option B). Static-import grep is unambiguous after narrowing. The 4-deletion scope satisfies the narrowed criterion (no live import from `@hivemind/opencode-tmux` exists today; remaining 8 string refs are JSDoc/string constants handled in P51). | **NO (RESOLVED — see §10 Decision Record)** |
| EARS-6 | 1 (Crystal Clear) | `vitest run` against a specific file with known test count | NO |
| EARS-7 | 1 (Crystal Clear) | Verbatim string match | NO |

**Average ambiguity:** (1+1+1+2+1+1+1) / 7 = **1.143** (raw) — post-EARS-5 resolution
**Normalized composite ambiguity:** (1.143 − 1) / 4 = **0.036** (in [0, 1] scale, where 0=clear, 1=vague)

**Gate verdict:** **PASS** (≤ 0.20 threshold per gsd-spec-phase skill).

**Flagged count:** **0 / 7 = 0.000** (zero flagged items, all EARS unambiguous under the post-resolution grep scope). EARS-5 was the only flagged item; it has been resolved via Option B per L0 binding decision `D-P50-EARS5-NARROW-2026-06-02` (see §10 Decision Record).

## 9. L1 Evidence Requirement (per AWC `minimumEvidenceLevel: L1_RUNTIME_PROOF`)

P50 MUST collect **L1_RUNTIME_PROOF** for all 4 verification commands in §5. The verify-work (Checkpoint 11) gate REJECTS L5 docs-claims and accepts only:

- **L1 (Runtime Proof):** live `npm run typecheck` exit 0, live `npm test` exit 0, live `grep`/`ls` results captured in the SUMMARY or VERIFICATION artifact.
- **L5 (Docs Claim):** REJECTED. Any claim like "the fork is gone" without a live command output is insufficient.
- **Mocked assertions:** REJECTED. The deletion is structural; no mocks apply.

The execute-phase MUST capture command output (stdout + exit code) for ALL of §5 into `50-VERIFICATION.md` (or equivalent artifact in `.planning/phases/50-cleanup-opencode-tmux-fork/`).

## 10. Decision Record

This section captures the L0 binding decisions that resolved gray-area ambiguity during the Checkpoint 4 (SPECIFICATION) phase. Each decision is identified by a stable ID, dated, and tied to a falsifiable outcome.

### 10.1 D-P50-EARS5-NARROW-2026-06-02 — EARS-5 narrowed to static import grep (Option B)

**Date:** 2026-06-02
**Decided by:** L0 orchestrator (binding decision)
**Applied by:** hm-specifier in Checkpoint 4 retry
**Status:** ACTIVE — supersedes the original EARS-5 wording in this SPEC.md

**Original EARS-5 (5/5 VAGUE, flagged):**

> When `grep -r "opencode-tmux" src/ tests/` is run, it SHALL return zero matches.

**Issue:** The original criterion could not be satisfied by the 4-deletion scope in §2. After the atomic commit executes, 8 string references remain in 3 files outside `allowedSurfaces`:

| File | Line(s) | Form |
|------|---------|------|
| `src/features/tmux/fork-bridge.ts` | L5, L13, L31, L53, L66 | 4 JSDoc comments |
| `src/features/tmux/integration.ts` | L197 | `FORK_PACKAGE_DIR = "node_modules/@hivemind/opencode-tmux"` (string constant) |
| `tests/lib/tmux/integration.test.ts` | L310 | 1 comment (`existsSync(join(projectDirectory, "node_modules/@hivemind/opencode-tmux"))`) |
| `tests/lib/tmux/integration.test.ts` | L315 | 1 conditional guard |

All 8 references are either JSDoc comments or string constants — not live TypeScript `import` statements. The original "no references" semantic was over-broad; it conflated "no dead imports" (a real runtime concern) with "no text occurrences" (which conflates JSDoc, string constants, and imports).

**Decision (Option B):** Narrow EARS-5 to check only static `import` statements:

```sh
grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/
```

**New EARS-5 (1/5 Crystal Clear):**

> When `grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/` is run, it SHALL return zero matches (no dead static import statements).

**Acceptance criterion:** `grep ...; echo $?` outputs `1` (grep exits 1 when no match found).

**Why Option B (and not A or C):**

- **(A) Widen P50 scope** — REJECTED. Would expand AWC `allowedSurfaces` to include `fork-bridge.ts`, `integration.ts`, `integration.test.ts`. Violates the sacred 4-deletion boundary from `49-CLOSE-PIVOT-2026-06-02.md` §6 (commit boundary authority) and breaks the audit trail that P51 is the cleanup phase.
- **(B) Narrow EARS-5** — SELECTED. The narrowed criterion is a strict subset of the original; nothing in §2 changes. The 4-deletion scope satisfies this honestly: no live import statement references `@hivemind/opencode-tmux` today. The 8 remaining string references are explicitly out of scope and become P51's responsibility (which is the close-pivot D-PIVOT-06 plan anyway).
- **(C) Phase EARS-5 to P51** — REJECTED. Would leave P50 without a "no dead imports" gate, weakening the verification chain. The narrowed EARS-5 preserves P50's gate contract while honestly bounding it.

**Impact on downstream phases:**

- **P51** (`src/features/tmux/fork-bridge.ts` rewrite per D-PIVOT-06) will eliminate the 8 remaining string references when the file is deleted/replaced with the in-tree `buildInTreeSessionManager` factory.
- **P52** (tmux-copilot factory swap) does not touch these references.
- **P53-P55** (observers, persistence, UAT) do not touch these references.
- The narrowed EARS-5 closes the loop on what P50 can prove (no static imports) while preserving the audit trail for P51.

**Verification command** (from §5, updated):

```sh
# EARS-5: no dead static imports (RESOLVED via Option B per D-P50-EARS5-NARROW-2026-06-02)
grep -rE 'from\s+["\x27]@hivemind/opencode-tmux["\x27]' src/ tests/ || echo "no dead static imports"
# Expected: zero matches
```

**Traceability:** This decision ID is referenced from §4.1, §5, §8, and the trajectory event `event-phase50-spec-done-2026-06-02` (revision summary). The decision is immutable once P50 execution begins; subsequent phases (P51+) must not retroactively modify this section.

## 11. Handoff to hm-intent-loop (Checkpoint 5)

The CONTEXT phase (Checkpoints 5–6 in `.opencode/rules/universal-rules.md` §4) MUST resolve the following 5 gray-area questions before plan-phase. Each question is bounded, answerable in one round, and blocks a specific downstream risk.

### 10.1 Question #1 (BLOCKING — EARS-5 resolution)

**Context:** EARS-5 (`grep -r "opencode-tmux" src/ tests/` returns zero) cannot be satisfied by the strict 4-deletion `allowedSurfaces`. 8 string matches remain in 3 files OUTSIDE the AWC scope: `src/features/tmux/fork-bridge.ts` (4 JSDoc comments), `src/features/tmux/integration.ts:197` (string constant), `tests/lib/tmux/integration.test.ts:310,315` (comment + conditional).

**Options to resolve:**
- **(A) Widen P50 scope** to delete the 4 JSDoc comments in `fork-bridge.ts` (safe — comments only) AND replace `integration.ts:197` `FORK_PACKAGE_DIR` constant with a renamed symbol (e.g., `LEGACY_FORK_PACKAGE_DIR = "node_modules/@hivemind/_deprecated_tmux_fork"`) AND update `integration.test.ts:310,315` to match. This keeps EARS-5 strict.
- **(B) Narrow EARS-5** to: `grep -rE 'from ["\x27]@hivemind/opencode-tmux' src/ tests/` returns zero (this is the actual "no dead imports" intent). The 4-deletion scope satisfies this.
- **(C) Phase EARS-5**: accept that 8 matches remain in P50 (intentional, to keep `fork-bridge.ts` test-compatible), and the cleanup of these references is part of P51's `fork-bridge.ts` removal. Add a new EARS-6.5: "After P51, the grep in EARS-5 returns zero."

**Recommended:** (B) — it aligns with the close-pivot D-PIVOT-06 (fork-bridge removal is P51's job) and avoids scope creep in P50.

### 10.2 Question #2 (NON-BLOCKING — phase directory hygiene)

**Context:** `.planning/phases/50-cleanup-opencode-tmux-fork/` currently has only `.gitkeep`. After P50 commit, the directory SHOULD contain: `50-SPEC.md` (this file), `50-PLAN.md` (from plan-phase), `50-CONTEXT.md`, `50-RESEARCH.md` (if applicable), `50-PATTERNS.md` (if applicable), `50-VERIFICATION.md`, `50-SUMMARY.md`. Should we also add `50-UAT.md` as a no-op stub (`# P50 UAT: N/A — pure deletion, no new functionality; L1 evidence (tsc + vitest + grep) is the contract.`)?

**Recommended:** YES, add a no-op `50-UAT.md` stub for consistency with the 11-checkpoint phase loop artifact set.

### 10.3 Question #3 (NON-BLOCKING — AGENTS.md sync)

**Context:** Top-level `AGENTS.md` mentions the tmux synthesis path but does not name the `opencode-tmux` fork. Sector-level `src/features/tmux/AGENTS.md` (if it exists) may reference the fork as the source of patterns. After P50, should the executor update sector AGENTS.md to:
- Mark `fork-bridge.ts` as "DEPRECATED — scheduled for P51 removal"?
- Remove any historical reference to "opencode-tmux fork" as a dependency?

**Recommended:** YES, add a brief deprecation note in `src/features/tmux/AGENTS.md` (or create it if absent). The close-pivot already documents the deprecation; AGENTS.md sync makes it discoverable for future agents.

### 10.4 Question #4 (NON-BLOCKING — package.json)

**Context:** `package.json` does not currently declare `@hivemind/opencode-tmux` as a dependency (the fork was vendored in-tree at `opencode-tmux/`, not installed as an npm package). After P50, the working tree contains no reference to the fork. Should the executor add a `// formerly: opencode-tmux/` annotation in `package.json` to record the historical decision for future readers?

**Recommended:** NO. The close-pivot's D-PIVOT-04 + this SPEC.md + ROADMAP P50 entry already form a complete audit trail. Adding annotations to `package.json` is noise.

### 10.5 Question #5 (NON-BLOCKING — commit message trailer)

**Context:** EARS-7 mandates the exact commit message `phase(50): drop opencode-tmux fork and CI script coupling — 4 deletions in single commit`. Should the commit include trailers like `Refs: 49-CLOSE-PIVOT-2026-06-02.md`, `AWC: awc-50-spec`, or `P50-Plan: 50-01-PLAN.md`?

**Recommended:** NO trailers. The format is already specified verbatim in EARS-7. Any deviation breaks the falsifiable check. The traceability to the close-pivot, AWC, and plan is via the commit's `body` (or via `git notes` if needed).

## 12. Out of Scope (explicit no-go)

The following MUST NOT be addressed by gsd-executor in P50 (re-stated from AWC for emphasis):

- P51+ planning or implementation (in-tree synthesis, factory swap, monitoring, persistence, UAT)
- `fork-bridge.ts` removal or modification (P51)
- `integration.ts` rewrite (P51)
- `observers.ts` extension (P53)
- `tmux-copilot.ts` factory swap (P52)
- New tmux classes (`tmux-multiplexer.ts`, `session-manager.ts`, `grid-planner.ts`) — (P51)
- New tool `tmux-state-query.ts` — (P52)
- New hook `pane-monitor.ts` — (P53)
- New feature module `persistence.ts` — (P54)
- BATS scenarios for seed success criteria — (P55)
- UAT execution — (P55)
- Adding `@json-render/react` or any new npm dependencies — (P51+)
- tsconfig.json or package.json modifications — (P51+)
- `.opencode/`, `.hivemind/`, `dist/`, or any other surface outside AWC `allowedSurfaces`

## 13. References

- AWC contract: `awc-50-spec` (loaded via `hivemind-agent-work-export`)
- Close-pivot: `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md`
- ROADMAP: `.planning/ROADMAP.md` lines 1934-1943 (P50 entry), 1947-1956 (P51), 1960-1969 (P52), 1973-1982 (P53), 1986-1995 (P54), 1999-2008 (P55)
- Seed: `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` (4 success criteria)
- Code anchors:
  - `src/plugin.ts:391` — startup log "26 custom tools" (preserved)
  - `src/plugin.ts:647-671` — tool spread including `"tmux-copilot": tmuxCopilotTool` (preserved)
  - `src/tools/tmux-copilot.ts:100-112` — `TmuxCopilotResult` union (preserved)
  - `.github/workflows/ci.yml:64-82` — `bats-vendor-sync` job (DELETED in P50)
  - `scripts/sync-fork.sh` (126 LOC) — DELETED
  - `tests/scripts/sync-fork.bats` (210 LOC) — DELETED
  - `opencode-tmux/` (full package) — DELETED
- Universal rules: `.opencode/rules/universal-rules.md` §4 (11-checkpoint phase loop)
- Phase 0 governance: `.planning/AGENTS.md` (planning sector L5-evidence guidance)

---

**END OF SPECIFICATION — P50**

*This SPEC.md is a planning/governance artifact (L5 documentation) per `.planning/AGENTS.md` §1 and §6. It authorizes the P50 execution; it does not implement runtime code. Runtime readiness is claimed only after P50's L1 evidence is captured in `50-VERIFICATION.md`.*
