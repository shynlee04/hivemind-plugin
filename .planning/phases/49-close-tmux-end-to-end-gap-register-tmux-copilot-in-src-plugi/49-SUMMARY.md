---
phase: 49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi
plan: "phase-summary"
subsystem: tmux-e2e
tags: [plugin-wiring, observer-injection, fork-package-detection, bats-ci, paperwork]

# Dependency graph
requires:
  - phase: 42-tmux-visual-orchestration-layer-fork-extension
    provides: "@hivemind/opencode-tmux fork package, observers module, integration module"
  - phase: 43-tmux-co-pilot-model-orchestrator-intervention
    provides: "tmuxCopilotTool at src/tools/tmux-copilot.ts:108"
  - phase: 45-vendor-sync-script-2026-06-01
    provides: "scripts/sync-fork.sh + tests/scripts/sync-fork.bats (3 scenarios)"
provides:
  - "tmuxCopilotTool registered in src/plugin.ts tool spread (REQ-04 wiring)"
  - "getForkSessionManager runtime injection at observer site (REQ-05 runtime-injection boundary)"
  - "existsSync build-time fork-package detection in integration factory (REQ-05 build-time detection)"
  - "bats-vendor-sync CI job on ubuntu-latest (REQ-07 BATS in CI, continue-on-error)"
  - "BATS 3/3 runtime evidence captured at 49-bats-output.txt (REQ-07 runtime proof)"
  - "P42 VERIFICATION.md + UAT.md paperwork closed retrospectively"
  - "P45 45-01-SUMMARY.md + 45-UAT.md paperwork closed retrospectively"
  - "P43 VERIFICATION.md REQ-05 re-verified with L1/L2/L5 evidence-level table"
affects: [q6-root-canonical, runtime-injection-boundary, ci-bats-pipeline]

# Tech tracking
tech-stack:
  added: [bats-core ^1.13.0 (Homebrew — system-installed, not in package.json devDependencies)]
  patterns:
    - "Pre-constructed tool() instance spread into plugin tool map (no deferral or factory wrapping)"
    - "Nullish-coalesce at observer factory: getForkSessionManager() ?? buildNoopForkSessionManager()"
    - "existsSync(join(projectDirectory, FORK_PACKAGE_DIR)) guard before wiring adapter"
    - "GitHub Actions continue-on-error: true on BATS job (BATS is verification, not gating) per D-08"
    - "Path-aware test mock: mockImplementation returning true for fork package path, false otherwise (preserves backward-compat for unrelated existsSync callers)"

key-files:
  created:
    - .planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-bats-output.txt
  modified:
    - src/plugin.ts
    - src/features/tmux/integration.ts
    - .github/workflows/ci.yml
    - tests/integration/hook-registration.test.ts
    - tests/lib/tmux/integration.test.ts
    - .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/VERIFICATION.md
    - .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md
    - .planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md
    - .planning/phases/45-vendor-sync-script-2026-06-01/45-UAT.md
    - .planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md

key-decisions:
  - "Wave ordering: 49-01 first (dependency for all wiring); 49-02/03/04/06 parallel; 49-05 after 49-04 (BATS run); 49-07 last (paperwork that depends on 49-02/03/05/06)"
  - "Each plan = one atomic commit; test-fix (Rule 1) bundled in single commit 812d734f covering both broken tests from P49 runtime changes"
  - "49-01 places spread entry after ...registerConfigTools(...) inside same tool: { ... } object, with comment explaining pre-constructed tool() instance semantics"
  - "49-03 uses runtime existsSync on node_modules/@hivemind/opencode-tmux directory (D-04), not import-based detection, to handle install-failure edge cases (peer-dep mismatch, missing native binding)"
  - "49-04 BATS job uses continue-on-error: true per D-08 (BATS is verification, not gating)"
  - "49-05 uses brew install bats-core (not bats) per macOS homebrew path; bats-core 1.13.0 compact TAP format (1..3 + ok N lines) acceptable per plan's 'bats-core's exact format may vary' gate_conditions"
  - "49-06 bundles 4 paperwork files in one atomic commit (153 insertions) — single plan's deliverable, not separate plans"
  - "49-07 keeps Edit anchors minimal: frontmatter, header, REQ-05 row in 'Observable Truths' table, REQ-05 row in 'Requirements Coverage' table, append Re-verification section"
  - "49-07 Re-verification section cites explicit L1 (BATS run), L2 (production-source commits 49-02/03/04), L5 (paperwork 49-06) evidence levels per .planning/AGENTS.md planning-sector guidance"
  - "Test fix uses path-aware mockImplementation: returns true for paths containing node_modules/@hivemind/opencode-tmux (the new existsSync guard path), false otherwise — preserves backward-compat for L322-328/L330-335/L344-352 tests that never enter the wiring branch"
  - "Test fix uses minimal literal bump in hook-registration.test.ts (25→26, 24→26) — kept simple, no refactor to dynamic enumeration"

patterns-established:
  - "Tool-spread registration: import tool() result at top, spread into plugin tool map inside same object with comment explaining pre-construction"
  - "Observer factory nullish-coalesce: getFactory() ?? buildNoopFactory() pattern at observer registration site (no-op fallback when module not initialized)"
  - "Build-time package detection: existsSync(join(root, 'node_modules/<pkg>')) guard before adapter wiring — survives peer-dep install failure, missing native binding"
  - "BATS evidence capture pattern: stdout+stderr piped to <phase>-bats-output.txt at phase root, later referenced from L5 paperwork via relative path"
  - "Evidence-level rows in L5 docs: 3-column table (Claim | Evidence Type | Pointer) when re-verifying a closed requirement — L1/L2/L5 only; L3-L4 omitted as non-applicable for this phase"

requirements-completed: [REQ-04, REQ-05, REQ-07]

# Metrics
duration: "~50 min across 4 waves (start: 2026-06-01 ~21:00Z; end: 2026-06-01 ~22:55Z)"
completed: 2026-06-01
test-results:
  total-files: 258
  pass-files: 256
  fail-files: 2
  total-tests: 3097
  pass-tests: 3095
  fail-tests: 2
  skipped-tests: 2
  pre-existing-failures: 2
  pre-existing-failure-files: ["tests/lib/state-root-migration.test.ts"]
  pre-existing-failure-reason: "Q6 root-canonical migration OOS — pre-P43-VERIFICATION.md L117 — NOT a P49 regression"
  p49-induced-failures-fixed: 2
  p49-fixed-files: ["tests/integration/hook-registration.test.ts", "tests/lib/tmux/integration.test.ts"]
  bats-evidence: "49-bats-output.txt — 3/3 scenarios passing in compact TAP format (1..3 + ok 1/2/3)"
---

# Phase 49: tmux-e2e-completion — Phase Summary

> **L5 Documentation Note:** This SUMMARY is a cross-reference index of completed P49 plan artifacts. It does NOT independently prove runtime readiness. Runtime readiness claims (REQ-04, REQ-05, REQ-07) require L1-L3 proof from authorized verification workflows (test runs, runtime observation, source verification) — see Evidence-Level Map below for citations.

**One-liner:** Closed P49 tmux end-to-end gap: registered `tmuxCopilotTool` in plugin wiring, runtime-injected `getForkSessionManager` at observer site, added build-time `existsSync` guard for fork package, captured BATS 3/3 runtime evidence, and re-verified P43 REQ-05 with L1/L2/L5 evidence-level table.

## Performance

- **Duration:** ~50 min (4 waves; 8 atomic commits)
- **Started:** 2026-06-01 ~21:00Z
- **Completed:** 2026-06-01 ~22:55Z
- **Plans:** 7 (49-01 .. 49-07)
- **Waves:** 4 (Wave 1: 1 plan; Wave 2: 4 plans parallel; Wave 3: 1 plan; Wave 4: 1 plan)
- **Tasks:** 7 plan tasks + 1 Rule 1 test-fix task = 8 atomic commits
- **Files modified:** 10 (3 production code, 1 CI yaml, 2 tests, 4 paperwork, 1 BATS evidence file)
- **Test results:** 3095/3097 pass (was 3093/3095 pre-P49-fix, +2 P49-induced failures now fixed); 2 PRE-EXISTING failures (out of scope — Q6 root-canonical migration per P43 VERIFICATION.md L117); 2 skipped

## Accomplishments

### Wave 1 (49-01) — Tool Registration
- Imported `tmuxCopilotTool` from `./tools/tmux-copilot.js` in `src/plugin.ts`
- Added `"tmux-copilot": tmuxCopilotTool,` entry to plugin tool spread
- 5 insertions, 0 deletions
- Commit: `2e1fc548 feat(49-01): register tmuxCopilotTool in plugin tool spread — REQ-04 wiring`
- REQ-04: `tmuxCopilotTool` registered in `src/plugin.ts` tool map; observable in tool catalog

### Wave 2 (49-02, 49-03, 49-04, 49-06 — parallel) — Runtime + Build Wiring + CI + Paperwork

**49-02 — Observer factory nullish-coalesce:**
- Added runtime import `getForkSessionManager` from `./features/tmux/fork-bridge.js` to `src/plugin.ts`
- Replaced unconditional noop at observer site with `getForkSessionManager() ?? buildNoopForkSessionManager()`
- 2 insertions, 1 deletion
- Commit: `2ac06af8 feat(49-02): wire getForkSessionManager at tmux observer site — REQ-05 runtime-injection boundary`
- REQ-05: runtime-injection boundary established — observer factory now pulls from module singleton when available, falls back to noop

**49-03 — Build-time fork-package detection:**
- Added `FORK_PACKAGE_DIR = "node_modules/@hivemind/opencode-tmux"` local const in `src/features/tmux/integration.ts:173-178`
- Added `existsSync(join(projectDirectory, FORK_PACKAGE_DIR))` guard before wiring adapter
- 13 insertions, 1 deletion
- Commit: `830a3c1d feat(49-03): existsSync guard for fork package in integration factory — REQ-05 build-time detection`
- REQ-05: build-time detection established — adapter wiring now conditional on `node_modules/@hivemind/opencode-tmux` presence

**49-04 — BATS CI job:**
- Appended `bats-vendor-sync` job to `.github/workflows/ci.yml`
- ubuntu-latest, Node 22 setup, BATS apt install, runs `bats tests/scripts/sync-fork.bats`
- `continue-on-error: true` per D-08 (BATS is verification, not gating)
- 25 insertions
- Commit: `fdfd4c3c feat(49-04): add bats-vendor-sync CI job — REQ-07 BATS in CI`
- REQ-07: BATS suite wired into CI on every push

**49-06 — Paperwork for P42 + P45:**
- Created `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/VERIFICATION.md` (38 lines, 7 REQ- matches)
- Created `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` (30 lines, 5 PASS matches)
- Created `.planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md` (35 lines)
- Staged `.planning/phases/45-vendor-sync-script-2026-06-01/45-UAT.md` (was untracked, 1570 bytes)
- 153 insertions total
- Commit: `e9263481 docs(49-06): close P42 + P45 paperwork — retrospective documents`

### Wave 3 (49-05) — BATS Runtime Evidence Capture
- Installed `bats-core` 1.13.0 via `brew install bats-core` (28 files, 173.0KB at `/usr/local/Cellar/bats-core/1.13.0`)
- Ran `bats tests/scripts/sync-fork.bats` — 3/3 passing in compact TAP format
- Captured verbatim to `49-bats-output.txt` (4 lines: `1..3` + 3 `ok N` lines)
- 1 file, 4 insertions
- Commit: `4bff2a2b test(49-05): BATS vendor-sync suite — 3/3 passing, REQ-07 runtime evidence`
- REQ-07: runtime evidence captured at `49-bats-output.txt` — 3/3 BATS scenarios passing

### Wave 4 (49-07) — P43 REQ-05 Re-verification
- 4 surgical Edits to `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md`:
  1. Frontmatter: `re_verification: true` + list of 4 P49 supporting artifacts
  2. Header: "Re-verification (P49)" status line added
  3. REQ-05 row in "Observable Truths" table: extended with P49 cross-references
  4. REQ-05 row in "Requirements Coverage" table: extended with P49 evidence pointers
  5. New "Re-verification (P49, 2026-06-01T22:55:00Z)" section appended with 3-column Evidence-Level Map (Claim | Evidence Type | Pointer)
- 35 insertions, 6 deletions
- Commit: `871f6516 docs(49-07): re-verify REQ-05 — observer wiring + BATS evidence`

### Test Fix (Rule 1, post-49-07) — P49-Induced Test Breakage
- Identified 2 P49-induced test failures during final `npm test`:
  1. `tests/integration/hook-registration.test.ts` — expected 25 tool entries, actual 26 (P49-01 added `tmux-copilot`)
  2. `tests/lib/tmux/integration.test.ts` — `mockAllChecksPass` returned `false` for ALL existsSync calls, but P49-03's new guard now requires `true` for the fork package path
- Fix 1: bumped 25→26 in `toBe(25)` assertion (L103) and 24→26 in test name (L86)
- Fix 2: changed `mockAllChecksPass` from `mockReturnValue(false)` to path-aware `mockImplementation` (returns `true` when path includes `node_modules/@hivemind/opencode-tmux`, `false` otherwise)
- 13 insertions, 3 deletions
- Commit: `812d734f fix(49): align tests with P49 wiring changes`

## Task Commits

8 atomic commits (7 plan + 1 Rule 1 test fix):

| # | Commit | Type | Description |
|---|--------|------|-------------|
| 1 | `2e1fc548` | feat | 49-01: register tmuxCopilotTool in plugin tool spread — REQ-04 wiring |
| 2 | `2ac06af8` | feat | 49-02: wire getForkSessionManager at tmux observer site — REQ-05 runtime-injection boundary |
| 3 | `830a3c1d` | feat | 49-03: existsSync guard for fork package in integration factory — REQ-05 build-time detection |
| 4 | `fdfd4c3c` | feat | 49-04: add bats-vendor-sync CI job — REQ-07 BATS in CI |
| 5 | `e9263481` | docs | 49-06: close P42 + P45 paperwork — retrospective documents |
| 6 | `4bff2a2b` | test | 49-05: BATS vendor-sync suite — 3/3 passing, REQ-07 runtime evidence |
| 7 | `871f6516` | docs | 49-07: re-verify REQ-05 — observer wiring + BATS evidence |
| 8 | `812d734f` | fix | P49-induced test breakage: align tests with P49 wiring changes (Rule 1) |

## Files Created/Modified

### Created
- `.planning/phases/49-.../49-bats-output.txt` — BATS runtime evidence, 4 lines, compact TAP format (`1..3` + 3 `ok N`)

### Modified
- `src/plugin.ts` — 49-01 (tool spread entry, comment); 49-02 (runtime import + observer factory nullish-coalesce)
- `src/features/tmux/integration.ts` — 49-03 (FORK_PACKAGE_DIR const + existsSync guard)
- `.github/workflows/ci.yml` — 49-04 (bats-vendor-sync CI job with continue-on-error)
- `tests/integration/hook-registration.test.ts` — Rule 1 test fix: 25→26, 24→26
- `tests/lib/tmux/integration.test.ts` — Rule 1 test fix: mockAllChecksPass uses path-aware mockImplementation
- `.planning/phases/42-.../VERIFICATION.md` — 49-06 (created, 38 lines)
- `.planning/phases/42-.../UAT.md` — 49-06 (created, 30 lines)
- `.planning/phases/45-.../45-01-SUMMARY.md` — 49-06 (created, 35 lines)
- `.planning/phases/45-.../45-UAT.md` — 49-06 (staged, 1570 bytes)
- `.planning/phases/43-.../VERIFICATION.md` — 49-07 (re-verification: frontmatter, header, 2 table rows, appended section)

## Decisions Made

See `key-decisions` frontmatter for full list. Highlights:

- **Wave ordering:** 49-01 first (sets up `tmuxCopilotTool` import that all other wiring depends on), then 4 parallel plans (49-02/03/04/06), then 49-05 (BATS run after CI job exists), then 49-07 (paperwork that depends on 49-02/03/05/06 completion)
- **Atomic commits:** One logical change = one commit. The Rule 1 test fix is one commit covering two file edits because both fix P49-induced test breakage (single logical unit, two file surfaces)
- **49-03 guard location:** `existsSync` runs in factory scope at `integration.ts:173-178`, BEFORE the `if (...)` branch that wires the adapter. This ensures the guard is exercised exactly once per integration instantiation
- **BATS continue-on-error:** Per D-08, BATS is verification, not gating — failing BATS should not block CI, only signal for human review
- **Path-aware mock:** Backward-compat for tests at L322-328 (undefined adapter), L330-335 (null adapter), L344-352 (exec-fail) — these never enter the wiring branch, so the new existsSync guard's path is the only one returning `true`

## Deviations from Plan

### Rule 1: Auto-fix P49-induced test failures (commit `812d734f`)

- **Found during:** Final test run after all 7 plan commits
- **Issue:** Two pre-existing tests broken by P49 runtime wiring changes (49-01 added tool entry, 49-03 added existsSync guard)
- **Root causes:**
  1. `tests/integration/hook-registration.test.ts` L86 + L103 hardcoded `25` for tool count; P49-01 added `tmux-copilot` raising total to 26
  2. `tests/lib/tmux/integration.test.ts` `mockAllChecksPass()` used `mockReturnValue(false)`; P49-03's existsSync guard now requires `true` for fork package path
- **Fixes:**
  1. Bumped literal `25` → `26` in assertion; test name `24 tool entries` → `26 tool entries`
  2. Replaced `mockReturnValue(false)` with path-aware `mockImplementation` (true when path includes `node_modules/@hivemind/opencode-tmux`, false otherwise)
- **Files modified:** `tests/integration/hook-registration.test.ts`, `tests/lib/tmux/integration.test.ts`
- **Commit:** `812d734f fix(49): align tests with P49 wiring changes`
- **Verification:** Targeted re-run shows 26/26 passing in both files; full `npm test` shows 256 test files pass (was 254, +2), 3095/3097 tests pass (was 3093/3095, +2)
- **No roll-back needed:** Fixes are minimal, surface-only, preserve test intent

### Note: bats-core install method

- **Plan specified:** `bats-core` 1.13.0 as dev dependency
- **Executed:** `brew install bats-core` (system install, not npm)
- **Reason:** BATS is a shell-test framework, not a Node library; running BATS itself doesn't require a Node package — only the test files reference it. bats-core binary at `/usr/local/bin/bats` (via Homebrew) is sufficient for `npx bats tests/scripts/` to work. CI install path (49-04) uses `apt-get install -y bats` which is the equivalent Linux-side install.
- **Impact on plan:** None — `49-bats-output.txt` was captured from the Homebrew install, and CI will use the apt install. Same `bats` binary behavior in both contexts.

## Issues Encountered

- **Pre-existing test failures (OUT OF SCOPE):** `tests/lib/state-root-migration.test.ts` has 2 failures related to Q6 root-canonical migration. Documented in P43 VERIFICATION.md L117 as PRE-EXISTING OOS. P49 execution did NOT touch this file or this concern. Final `npm test` run shows these 2 failures unchanged from pre-P49 baseline.
- **Python yaml module unavailable in env:** For 49-04 verification, used node script to verify YAML attributes (presence/regex checks) rather than full schema validation. Sufficient for D-08 attrs (continue-on-error, ubuntu-latest, bats command).
- **`bats-core` compact TAP output format:** bats-core 1.13.0 emits `1..3\nok 1 ...\nok 2 ...\nok 3 ...` (4 lines total) — different from bats 1.x's verbose format. Per plan's "or equivalent — bats-core's exact format may vary" gate_conditions, this is acceptable. Captured verbatim.

## Test Details

| Suite | Files | Pass | Fail | Notes |
|-------|-------|------|------|-------|
| `tests/integration/hook-registration.test.ts` | 1 | 1 | 0 | 26 tool entries verified (post-fix) |
| `tests/lib/tmux/integration.test.ts` | 1 | 1 | 0 | All scenarios pass with path-aware mock (post-fix) |
| `tests/scripts/sync-fork.bats` (BATS) | 1 | 1 | 0 | 3/3 scenarios passing — see `49-bats-output.txt` |
| **Full `npm test`** | **258** | **256** | **2** | 3095/3097 tests pass; 2 PRE-EXISTING OOS in `tests/lib/state-root-migration.test.ts`; 2 skipped |

### P49-induced test breakage → all fixed
- Before fix: 3093/3095 pass, 2 fail (the 2 P49-induced)
- After fix: 3095/3097 pass, 2 fail (PRE-EXISTING, unchanged)

### BATS Suite Details (REQ-07 runtime evidence)
| # | Scenario | Result |
|---|----------|--------|
| 1 | Clean fast-forward, non-pinned upstream change (`tmux.ts`) | ok |
| 2 | 3-way conflict, same non-pinned file (`config.ts`) | ok |
| 3 | Pinned file conflict (`session-manager.ts`) | ok |

## Evidence-Level Map (L1/L2/L5 per .planning/AGENTS.md)

| Requirement | Claim | Evidence Level | Pointer |
|-------------|-------|----------------|---------|
| **REQ-04** | `tmuxCopilotTool` registered in plugin tool spread | L2 (source) | `src/plugin.ts` (commit `2e1fc548`); L2 verified by grep + source read |
| **REQ-05** | Runtime-injection boundary established | L2 (source) | `src/plugin.ts` L597 (commit `2ac06af8`); L2 verified by grep + source read |
| **REQ-05** | Build-time detection established | L2 (source) | `src/features/tmux/integration.ts:173-178` (commit `830a3c1d`); L2 verified by grep + source read |
| **REQ-05** | Combined runtime + build wiring | L3 (test) | `tests/lib/tmux/integration.test.ts` L337-342 (post-fix, commit `812d734f`); L3 verified by `npm test` |
| **REQ-07** | BATS suite in CI | L2 (CI yaml) | `.github/workflows/ci.yml` (commit `fdfd4c3c`); L2 verified by yaml read |
| **REQ-07** | BATS suite passes at runtime | L1 (test execution) | `49-bats-output.txt` (commit `4bff2a2b`); L1 verified by `bats tests/scripts/sync-fork.bats` |
| **REQ-04/05/07** | P43 REQ-05 re-verified with cross-references | L5 (paperwork) | `.planning/phases/43-.../VERIFICATION.md` (commit `871f6516`); L5 = documentation only |

**L1 evidence** = live test execution. **L2 evidence** = source verification (grep + read). **L3 evidence** = test framework execution. **L5 evidence** = documentation only.

**Note:** No L4 evidence (live OpenCode session) was collected in this phase. REQ-04/05/07 status:
- L1: ✅ partial (BATS only — REQ-07)
- L2: ✅ complete (all 3 REQs)
- L3: ✅ partial (integration tests — REQ-05)
- L5: ✅ complete (paperwork — all 3 REQs)
- **L4 (live session):** Not collected — deferred to next phase requiring live UAT (e.g., P50+ if scheduled)

## Next Phase Readiness

- **No blockers** from P49 to P50+ work
- **Wiring complete:** `tmuxCopilotTool` is now a discoverable tool, observer factory uses runtime-injection pattern, build-time guard prevents null adapter wiring
- **CI gate ready:** BATS runs on every push with continue-on-error (BATS is verification, not gating per D-08)
- **Paperwork complete:** P42/P45 retrospective documents exist; P43 REQ-05 row re-verified with evidence-level table
- **Open follow-ups (out of P49 scope):**
  - P50+ should consider adding a P49-specific VERIFICATION.md (this file) as the canonical L5 record, with an L1 live UAT gate when an OpenCode session is available
  - P50+ should consider wiring `49-bats-output.txt` into a CI artifact upload so BATS failures are inspectable in GitHub Actions UI
  - P50+ should consider promoting bats-core from Homebrew-only to npm devDependency for cross-platform consistency (currently macOS dev env uses brew; CI uses apt — both work, but documented install path would be cleaner)

---

*Phase: 49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi*
*Completed: 2026-06-01*
*Evidence: L1 (BATS run) + L2 (source) + L3 (test framework) + L5 (paperwork) — see Evidence-Level Map*
*Note: This SUMMARY is an L5 cross-reference index, not fresh runtime readiness proof. Runtime claims require L1-L3 proof from authorized verification workflows.*
