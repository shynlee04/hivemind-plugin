# Phase 50 Close — Cleanup opencode-tmux Fork + Script Coupling

**Date:** 2026-06-02
**Phase:** 50-cleanup-opencode-tmux-fork
**Plan:** 50-01 (single plan)
**Close commit:** See commit chain below.

## Phase

P50 was the **PIVOT** phase that transitions from the deferred P45 external-fork vendor-sync strategy to in-tree synthesis. Goal: remove the `opencode-tmux/` directory, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` job in `.github/workflows/ci.yml` (L64-82) — leaving zero references to the fork, the sync script, or the BATS-vendor-sync CI job in the repo. P50 supersedes P45/P46/P47/P48 per the P49 pivot decision.

## Outcome

**SUCCESS** — composite risk 0.05, all 7 EARS verified PASS, 3,102 tests pass, tsc clean.

- `tsc --noEmit` exit 0 (no type errors after dead-import purge)
- `vitest run` — full test suite passes, no dead-import failures
- `grep -rE "opencode-tmux|sync-fork|bats-vendor-sync" --exclude-dir=node_modules --exclude-dir=.git` returns 0 matches
- CI lint clean (`.github/workflows/ci.yml` job removed)
- 26 tool keys assertion at `tests/integration/hook-registration.test.ts:103` holds
- D-04 graceful-fallback at `src/features/tmux/integration.ts:197-202` preserved

## What delivered

- 21 vendored `opencode-tmux/*` files removed (~932 LOC source + 1,820 LOC test)
- `scripts/sync-fork.sh` removed (126 LOC)
- `tests/scripts/sync-fork.bats` removed (210 LOC)
- 24-line `bats-vendor-sync` job removed from `.github/workflows/ci.yml` (L64-82)
- CHANGELOG `### Removed` bullet documenting the cleanup
- **Net change:** 25 files, 3 insertions, 3,497 deletions

## What preserved

- **26 tool keys assertion** at `tests/integration/hook-registration.test.ts:103` — held, no regression
- **D-04 graceful-fallback** at `src/features/tmux/integration.ts:197-202` — intact, no regression
- **CP-PTY separation** — P50-P55 in-tree synthesis sequence vs CP-PTY-01..04 sidecar runway preserved
- **Lockfile independence** — 0 references in `package.json`/`package-lock.json` to removed artifacts
- **`.hivemind/session-tracker/*` append-only contract** — 84 files byte-identical pre/post, no mutation
- **Backup** — pre-removal snapshot preserved at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (16M) for recovery if P51 synthesis encounters missing pattern context

## Decisions honored

- **D-P50-EARS5-NARROW-2026-06-02 (Option B applied):** EARS-5 narrowed from "BATS scenarios exercise the cleanup surface" to "typecheck passes + tests pass + tmux adapter resolves gracefully" — because P50 is a pure removal phase, BATS scenarios are not applicable (the BATS files themselves are being deleted). Rationale: the original EARS-5 was authored when P50 was a refactor, not a removal. Scope reduced honestly to match the actual deliverable.
- **D-04 (graceful-fallback in `src/features/tmux/integration.ts`):** Preserved verbatim, no modification. The fallback path is a critical contract for runtime behavior when tmux is unavailable.
- **P49 pivot decision (2026-06-02):** Full rewrite synthesis, drop opencode-tmux fork entirely. P50 executes the first half of this pivot (removal); P51-P55 execute the second half (in-tree synthesis).

## Flags carried

- **F-1 (informational):** Pre-P50 backup at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (16M) — kept for P51 pattern reference if needed. Will be deleted after P51 close if not referenced.
- **F-2 (informational):** `.hivemind/session-tracker/*` accumulated 84 append-only files during P50 execution — expected behavior, no remediation needed.
- **F-3 (RESOLVED in commit):** Initial concern that `integration.ts` imports would dead-code after fork removal. Verified: `integration.ts` uses graceful-fallback pattern, not fork imports. No dead imports.
- **F-4 (RESOLVED in commit):** Initial concern that CI lint would fail on removed job reference. Verified: no other workflow files reference `bats-vendor-sync`.

## Backup

- **Path:** `/tmp/opencode-tmux-backup-1780370747.tar.gz`
- **Size:** 16M
- **Content:** Pre-removal snapshot of `opencode-tmux/` directory, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` job from `.github/workflows/ci.yml`
- **Retention:** Until P51 close (2026-06-02 + ~1 day). Will be deleted if P51 does not reference the backup.

## Commit chain

P50 artifact commit chain (chronological order):

1. `beb024f5` — chore(50): 50-SPEC.md — cleanup scope, EARS, verification matrix
2. `ad43e657` — chore(50): 50-CONTEXT.md — assumptions, gray areas, key decisions
3. `2625d83a` — chore(50): 50-RESEARCH.md — fork/script/CI-job reference patterns
4. `fd4668d6` — chore(50): 50-PATTERNS.md — removal patterns, preserved invariants
5. `49e985b5` — chore(50): 50-PLAN.md — single atomic commit plan
6. `f7634b49` — chore(50): 50-PLAN-CHECK.md — plan verification
7. `e9be4f77` — chore(50): execute 50-01 — remove fork + scripts + CI job (25 files, +3 -3497)
8. `5b49030f` — chore(50): 50-VERIFICATION.md — EARS verification, test results

P49 closure reference: `209ca5f8` (pivot decision that created P50).

## Next phase P51

P51: **Synthesize Core Tmux Classes In-Tree** (2026-06-02)

**Goal:** Replace the in-tree `fork-bridge.ts` runtime-injection surface with three concrete classes synthesized from the opencode-tmux fork reference patterns (now removed, but patterns documented in `50-PATTERNS.md` and preserved in the backup tarball).

**Deliverables:**
- 3 new files at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` (~770 LOC)
- Rewrite `src/features/tmux/integration.ts` to a factory-of-real-classes (~200 LOC)
- Remove `fork-bridge.ts` (138 LOC)
- Net LOC reduction: ~100

**Tests:**
- 6 BATS scenarios (1/cluster) for `tmux-multiplexer`, `session-manager`, `grid-planner`
- 15+ vitest cases in `tests/lib/tmux/`
- Existing `integration.test.ts` (363 LOC) + `tmux-copilot.test.ts` (12 tests) untouched

**L1 evidence required:** BATS 6/6, vitest 15+ pass, tsc exit 0.

**Depends on:** Phase 50 (closed).
**Requirements:** REQ-04, REQ-05, REQ-07.
