# Phase 51: Synthesize Core Tmux Classes In-Tree — Spec

**Date:** 2026-06-02
**Phase:** 51-synthesize-core-tmux-classes-in-tree
**Author:** gsd-spec-phase (--auto)
**Gate:** PASSED — ambiguity 0.172 (≤ 0.20) with all 4 dimensions above minimum

## Goal

Replace the in-tree `fork-bridge.ts` runtime-injection surface with three concrete classes synthesized from the opencode-tmux fork reference patterns (now removed by P50 but preserved in the backup tarball at `/tmp/opencode-tmux-backup-1780370747.tar.gz`). The phase delivers:

- **3 new files** at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` (~770 LOC combined), each function annotated with `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>` for traceability to the fork reference
- **1 rewrite** of `src/features/tmux/integration.ts` to a factory-of-real-classes (~200 LOC) that instantiates the new classes instead of importing the fork-bridge injection boundary
- **2 removals**: `src/features/tmux/fork-bridge.ts` (156 LOC) and its companion test `tests/lib/tmux/fork-bridge.test.ts` (65 LOC, tests removed code → dead test)
- **Net LOC reduction:** ~100 (770 added + 200 rewritten - 156 removed - 65 test removed - ~50 structural changes)
- **Tests:** 6 new BATS scenarios (2/cluster) for the 3 new classes, 15+ new vitest cases in `tests/lib/tmux/`
- **Untouched:** `tests/lib/tmux/integration.test.ts` (363 LOC) and `tests/lib/tmux/tmux-copilot.test.ts` (12 tests) — these exercise the `integration.ts` and tool contract and must continue to pass unchanged
- **L1 evidence:** BATS 6/6 pass, vitest 15+ pass (no regressions in the 363 LOC + 12 tests), `tsc --noEmit` exit 0

## Background

Phase 50 closed successfully on 2026-06-02 (commit chain ending at `5b49030f`) by removing the `opencode-tmux/` vendored fork, `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats`, and the `bats-vendor-sync` CI job — net 25 files, 3,497 deletions, 0 insertions. That cleanup was the **first half** of the P49 pivot decision: drop the external-fork vendor-sync approach and pivot to **in-tree synthesis**. P50–P55 is the in-tree synthesis sequence. **P51 is the second half's first phase** — re-implement the runtime contracts that the fork-bridge used to defer, as concrete in-tree classes.

**Current state (post-P50):**
- `src/features/tmux/fork-bridge.ts` (156 LOC) defines structural types (`PaneTreeNode`, `SplitDirection`, `SplitCommand`, `PaneState`, `PaneGridPlanner`, `PaneGridPlannerInternal`, `ForkSessionManager`, `ForkSessionManagerAdapter`) and a module-private singleton `adapter` with `setForkSessionManager`/`getForkSessionManager` — runtime-injection boundary, no implementations
- `src/features/tmux/integration.ts` (215 LOC) has a graceful-fallback factory `createTmuxIntegrationIfSupported` that imports `setForkSessionManager` from `fork-bridge.js`; D-04 `existsSync(node_modules/@hivemind/opencode-tmux)` check at L197-202 gates the bridge registration
- `src/features/tmux/observers.ts` (93 LOC, P42) provides `onSessionCreated` event surface
- The 3 concrete classes (`TmuxMultiplexer`, `SessionManager`, `PaneGridPlanner`) **do not exist in-tree** — they were deferred to the now-removed fork
- Pre-P50 backup tarball at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (16M) contains the reference patterns: `opencode-tmux/src/tmux.ts`, `session-manager.ts`, `grid-planner.ts` (plus their test files)

**Gap:** The runtime-injection boundary (`fork-bridge.ts`) is structurally correct but functionally hollow — there are no real `TmuxMultiplexer`/`SessionManager`/`PaneGridPlanner` implementations to inject. P52 (next phase) needs to swap the `tmux-copilot.ts` factory from `buildNoopForkSessionManager()` to `buildInTreeSessionManager()` — but that swap has nothing to wire to until P51 produces the concrete classes.

**Strategic constraint (per `.planning/AGENTS.md` and `.opencode/rules/universal-rules.md` §7):** P51–P55 in-tree synthesis uses **direct `child_process.spawn('tmux', args, { stdio: 'pipe' })`** for long-running child processes. It is **structurally separate** from CP-PTY-01..04 (the sidecar runway, which uses PTY for terminal-heavy work). The current in-tree runtime uses `execFile` + `promisify` (one-shot, headless) — P51 will introduce `spawn` for the new class lifecycle, but this is NOT a CP-PTY scope change.

**Strategic constraint (per P50-PATTERNS P-1):** D-04 graceful-fallback at `integration.ts:197-202` is the **load-bearing invariant** for runtime safety when the fork is absent. P51 must preserve this invariant — when tmux is unavailable on PATH, `createTmuxIntegrationIfSupported` returns `null` (silent no-op), and the `tmux-copilot` tool responds with `{available: false, reason: "fork-not-wired"}` (per the existing mock contract at `tests/lib/tmux/integration.test.ts:307-318`).

## Requirements

### REQ-51-01 — Synthesize 3 in-tree classes from opencode-tmux fork reference patterns

**Current state:** `fork-bridge.ts` defines structural types only; no concrete in-tree class implementations exist. The 3 fork source files (`opencode-tmux/src/{tmux,session-manager,grid-planner}.ts`) were removed in P50 but preserved verbatim in the backup tarball at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (F-1 from P50-CLOSE flags this backup as the pattern reference source).

**Target state:** 3 new files at:
- `src/features/tmux/tmux-multiplexer.ts` (~310 LOC) — `TmuxMultiplexer` class, direct `child_process.spawn('tmux', args, { stdio: 'pipe' })` for `sendKeys`, `listPanes`, `respawnIfKnown`
- `src/features/tmux/session-manager.ts` (~280 LOC) — `SessionManager` class, `getMainPaneId`, `onSessionCreated` (the `EnrichedSessionEvent` shape is canonical from P42 `observers.ts`)
- `src/features/tmux/grid-planner.ts` (~180 LOC) — `PaneGridPlanner` class with `computeSplitSequence` (public), `requestLayout` (debounced), `cancel` (debounce-clear)

Every function body copied from the fork source MUST be annotated with the header `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>` on the line immediately preceding the copied code block. Annotations are non-negotiable per ROADMAP — they preserve traceability if the fork reference is deleted or the tarball expires.

**Acceptance:**
1. `git status` shows 3 new untracked files at the exact paths above
2. `wc -l src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` reports a combined total in the range 720–820 LOC (target ~770, ±7% tolerance for whitespace)
3. `grep -c "ORIGIN: opencode-tmux/src" src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` reports ≥ 10 distinct ORIGIN lines (each public method + each significant private helper should be annotated)
4. Each new file exports the named class as a default export
5. The new classes satisfy the structural types defined in `fork-bridge.ts` (REQ-51-03 will delete `fork-bridge.ts` AFTER these classes are verified compatible)

**Traces to:** REQ-04 (tmux adapter integration), REQ-07 (grid planning)

### REQ-51-02 — Rewrite `integration.ts` as factory-of-real-classes

**Current state:** `src/features/tmux/integration.ts` (215 LOC) has a graceful-fallback factory `createTmuxIntegrationIfSupported` that imports `setForkSessionManager` from `./fork-bridge.js` and D-04 `existsSync(node_modules/@hivemind/opencode-tmux)` check at L197-202.

**Target state:** `src/features/tmux/integration.ts` (~200 LOC) rewritten as a factory-of-real-classes:
- Drops the `setForkSessionManager` import from `./fork-bridge.js`
- Drops the D-04 `existsSync(node_modules/@hivemind/opencode-tmux)` check (the fork package no longer exists)
- Adds new imports: `TmuxMultiplexer`, `SessionManager`, `PaneGridPlanner` from the new sibling files
- `createTmuxIntegrationIfSupported` now instantiates the 3 concrete classes and returns a `TmuxIntegration` that exposes the multiplexer/session-manager/grid-planner
- Preserves all other invariants: tmux binary resolution (`resolveBinary`), version detection (`getTmuxVersion`), port persistence (`readOrMigratePort`/`persistPort`/`detectServerUrl`), `TMUX` env-var check, opencode binary check, and the top-level `try/catch → return null` graceful-fallback

**Acceptance:**
1. `grep -n "fork-bridge" src/features/tmux/integration.ts` returns 0 matches (no import, no reference)
2. `grep -n "node_modules/@hivemind/opencode-tmux" src/features/tmux/integration.ts` returns 0 matches (D-04 fork-path check removed)
3. The factory function signature `createTmuxIntegrationIfSupported(projectDirectory, forkSessionManager?)` is preserved (the `forkSessionManager` parameter becomes a no-op for backward compatibility OR is removed; either is acceptable as long as the graceful-fallback contract is preserved)
4. `wc -l src/features/tmux/integration.ts` reports in the range 180–220 LOC (target ~200, ±10% tolerance)
5. The 5 helper exports (`resolveBinary`, `getTmuxVersion`, `readOrMigratePort`, `persistPort`, `detectServerUrl`) remain exported and unchanged in signature

**Traces to:** REQ-04 (tmux adapter integration), REQ-05 (tmux-copilot dispatch readiness for P52 swap)

### REQ-51-03 — Remove `fork-bridge.ts` and its companion test

**Current state:** `src/features/tmux/fork-bridge.ts` (156 LOC) defines the runtime-injection boundary; `tests/lib/tmux/fork-bridge.test.ts` (65 LOC) tests its `setForkSessionManager`/`getForkSessionManager` set/get/clear semantics.

**Target state:** Both files removed. The structural types (`PaneTreeNode`, `SplitDirection`, `SplitCommand`, `PaneState`, `PaneGridPlanner`, `PaneGridPlannerInternal`, `ForkSessionManager`, `ForkSessionManagerAdapter`) are either:
- Inlined into the new class files (each class file declares its own public types), OR
- Co-located in a new `src/features/tmux/types.ts` module that the 3 new class files import

The chosen placement is the implementation's call, but the final state must satisfy: `grep -rE "fork-bridge" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.archive --exclude-dir=dist src/ tests/ .opencode/` returns 0 matches.

**Acceptance:**
1. `ls src/features/tmux/fork-bridge.ts` reports "No such file or directory"
2. `ls tests/lib/tmux/fork-bridge.test.ts` reports "No such file or directory"
3. `grep -rE "fork-bridge" src/ tests/ .opencode/ --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null` returns 0 matches
4. `npm run typecheck` (or `tsc --noEmit`) exits 0
5. The 3 new class files (REQ-51-01) and the rewritten `integration.ts` (REQ-51-02) all typecheck without the bridge types

**Traces to:** REQ-04, REQ-05 (removes the no-op injection surface that P52 replaces)

### REQ-51-04 — Add 6 BATS scenarios (2/cluster) for the 3 new classes

**Current state:** 0 BATS files in the repo (P50 removed `tests/scripts/sync-fork.bats`; the `tests/scripts/` directory exists but is empty). BATS scenarios are the L1 cross-process integration test layer that exercises the `tmux` binary as a real child process.

**Target state:** 6 BATS files at `tests/scripts/tmux/`:
- `tmux-multiplexer.bats` (2 scenarios) — `send-keys` round-trip, `list-panes` after fixture session
- `session-manager.bats` (2 scenarios) — session create + respawn, `onSessionCreated` event capture
- `grid-planner.bats` (2 scenarios) — `computeSplitSequence` for a 3-node tree, `requestLayout` debounce timing

Each BATS file:
- Sets up an isolated tmux server (unique `-L` socket per scenario, killed in `teardown`)
- Uses `@test` blocks with descriptive names
- Asserts exit codes, stdout content, and tmux server state via `tmux list-sessions`
- Tears down completely (no orphan tmux servers across test runs)

**Acceptance:**
1. `ls tests/scripts/tmux/*.bats | wc -l` reports 6
2. `bats tests/scripts/tmux/` reports "6 tests, 0 failures" (or "ok 6" in TAP output)
3. No orphan tmux servers after the run: `tmux list-sessions 2>/dev/null | grep -v "failed to connect"` shows no leftover test sessions
4. Each BATS file is independently runnable: `bats tests/scripts/tmux/tmux-multiplexer.bats` reports 2 tests passing in isolation

**Traces to:** REQ-04 (cross-process L1 evidence), REQ-07 (grid-planner scenarios)

### REQ-51-05 — Add 15+ vitest cases in `tests/lib/tmux/`

**Current state:** `tests/lib/tmux/` has 4 vitest files:
- `fork-bridge.test.ts` (65 LOC, 4 tests) — **REMOVING per REQ-51-03**
- `integration.test.ts` (363 LOC) — **UNTOUCHED** (per ROADMAP and the L1 invariant: existing tests must continue to pass)
- `observers.test.ts` (212 LOC, 8 tests) — **UNTOUCHED** (P42 surface)
- `tmux-copilot.test.ts` (12 tests) — **UNTOUCHED** (per ROADMAP)

**Target state:** 3 new vitest files in `tests/lib/tmux/`, 5+ test cases each, total 15+ new cases:
- `tmux-multiplexer.test.ts` — constructor, `sendKeys` mock-checks stdin, `listPanes` mock-checks stdout parsing, `respawnIfKnown` returns null for unknown session, `respawnIfKnown` returns pane-id for known session
- `session-manager.test.ts` — constructor, `getMainPaneId` returns configured ID, `onSessionCreated` is called by observer, lifecycle state transitions (init → ready → paused)
- `grid-planner.test.ts` — `computeSplitSequence` on 1-node tree (empty result), on 3-node tree (2 splits), on 5-node tree (4 splits), `requestLayout` debounce timing, `cancel` clears pending debounce

**Acceptance:**
1. `ls tests/lib/tmux/*.test.ts` reports 6 files (3 new + integration.test.ts + observers.test.ts + tmux-copilot.test.ts)
2. `npx vitest run tests/lib/tmux/` reports ≥ 15 new test cases passing (count from `--reporter=verbose` output)
3. Zero regressions: the existing 4 untouched test files (integration.test.ts, observers.test.ts, tmux-copilot.test.ts, and the 4 tests from the now-removed fork-bridge.test.ts) all continue to pass
4. The 3 new test files use vitest globals (no `import { describe, it, expect }` if vitest.config.ts has `globals: true`)

**Traces to:** REQ-04, REQ-05, REQ-07

### REQ-51-06 — Preserve D-04 graceful-fallback invariant (extend the contract, don't break it)

**Current state:** `integration.ts:197-202` D-04 `existsSync(node_modules/@hivemind/opencode-tmux)` check. The `tmux-copilot` tool's graceful-unavailable contract is verified by `tests/lib/tmux/integration.test.ts:307-318` mock which returns `{available: false, reason: "fork-not-wired"}` when the bridge is null.

**Target state:** When tmux is unavailable (binary not on PATH, `TMUX` env-var not set, opencode binary not on PATH, or any error during detection), `createTmuxIntegrationIfSupported` returns `null` — same as today. The `tmux-copilot` tool must continue to respond with `{available: false, reason: "fork-not-wired"}` (or an equivalent contract that the existing test at L307-318 still satisfies). The D-04 `existsSync` check is **removed** (no more fork path to check) but the **graceful-unavailable behavior is preserved** — a different gate, same observable contract.

**Acceptance:**
1. `tests/lib/tmux/integration.test.ts:307-318` continues to pass without modification (UNTOUCHED test)
2. `tests/lib/tmux/tmux-copilot.test.ts` (12 tests) continues to pass without modification (UNTOUCHED test)
3. The new `integration.ts` (per REQ-51-02) has a `try/catch → return null` top-level wrapper identical to the current L212-214

**Traces to:** REQ-05 (tool contract preservation), D-04 invariant from P50-PATTERNS P-1

### REQ-51-07 — Atomic commit + L1 evidence in `51-VERIFICATION.md`

**Current state:** Phase 51 is in PLANNING state; no `51-SPEC.md`, no code changes, no verification artifact.

**Target state:** After all 6 file-creation/rewrite/removal tasks and 2 test additions complete, a single atomic git commit captures the entire change set. The commit message references REQ-04, REQ-05, REQ-07. A subsequent `51-VERIFICATION.md` is created in `.planning/phases/51-synthesize-core-tmux-classes-in-tree/` documenting the L1 evidence (BATS run output, vitest run output, tsc exit code).

**Acceptance:**
1. `git log --oneline -1` after the work shows 1 new commit (the atomic synthesis commit) with message: `chore(51): execute 51-01 — synthesize 3 in-tree tmux classes + remove fork-bridge (3 new + 1 rewrite + 2 removals, 6 BATS + 15 vitest, tsc 0)`
2. `git show --stat HEAD` shows 7 file paths: 3 new class files + 1 rewrite of integration.ts + 1 deletion of fork-bridge.ts + 1 deletion of fork-bridge.test.ts + N new test files (≥ 3 vitest + 6 BATS)
3. `git diff HEAD~1 --stat` net change is in the range -200 to +800 LOC (allows for test additions)
4. `51-VERIFICATION.md` exists in the phase directory and includes the verbatim output of: `bats tests/scripts/tmux/`, `npx vitest run tests/lib/tmux/`, and `npx tsc --noEmit`

**Traces to:** Quality contract HMQUAL-08 (atomic commits with evidence)

## Boundaries

### In scope

- **3 new files** at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` (~770 LOC combined)
- **1 rewrite** of `src/features/tmux/integration.ts` (~200 LOC) as factory-of-real-classes
- **2 removals**: `src/features/tmux/fork-bridge.ts` + `tests/lib/tmux/fork-bridge.test.ts`
- **6 BATS scenarios** at `tests/scripts/tmux/*.bats` (2 per class)
- **15+ vitest cases** at `tests/lib/tmux/{tmux-multiplexer,session-manager,grid-planner}.test.ts` (5+ per class)
- **ORIGIN annotations** on every copied function with format `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>`
- **1 atomic git commit** capturing all 7 file mutations + test additions
- **L1 verification**: BATS 6/6, vitest 15+, tsc 0

### Out of scope

- **`tests/lib/tmux/integration.test.ts`** (363 LOC) — UNTOUCHED; existing tests must continue to pass
- **`tests/lib/tmux/observers.test.ts`** (212 LOC, 8 tests) — UNTOUCHED; P42 surface preserved
- **`tests/lib/tmux/tmux-copilot.test.ts`** (12 tests) — UNTOUCHED; P52 swap will not break this contract
- **`src/tools/tmux-copilot.ts`** factory swap from `buildNoopForkSessionManager` to `buildInTreeSessionManager` — this is **P52 work**
- **`src/tools/tmux-state-query.ts`** read-only query tool — this is **P52 work**
- **`observers.ts` expansion** with `session-state-changed` + `pane-captured` subscriptions — this is **P52 work**
- **`src/hooks/pane-monitor.ts`** live monitoring hook — this is **P53 work**
- **`src/features/tmux/persistence.ts`** session persistence + UUIDv7 IDs — this is **P54 work**
- **4 BATS E2E scenarios** against the seed's 4 success criteria — this is **P55 work**
- **CP-PTY-01..04 sidecar runway** (PTY-heavy work) — out of scope per `.opencode/rules/universal-rules.md` §7
- **SC-PTY-01 read-only terminal projection** — DEFERRED
- **Backup tarball deletion** at `/tmp/opencode-tmux-backup-1780370747.tar.gz` — retained until P51 close, may be deleted in P51-CLOSE if P51 didn't reference it (per P50-CLOSE F-1)
- **Migrating `fork-bridge.ts` types to a shared `types.ts`** — implementation choice; if a `types.ts` is created, it's a side-effect of REQ-51-03, not a new requirement

## Constraints

- **Node ≥ 20.0.0** (project constant from `package.json` engines)
- **OpenCode SDK ≥ 1.1.0** (peer dependency)
- **TypeScript 5.x strict mode** (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- **Module system**: ESNext + NodeNext resolution
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports
- **D-04 graceful-fallback invariant** preserved (REQ-51-06)
- **CP-PTY runway separation** (per `.opencode/rules/universal-rules.md` §7) — direct `child_process.spawn` only, no PTY coupling
- **Pattern source**: `/tmp/opencode-tmux-backup-1780370747.tar.gz` (16M, F-1 from P50-CLOSE) — extracted pattern files are at `opencode-tmux/src/{tmux,session-manager,grid-planner}.ts` in the tarball
- **Test framework**: vitest (existing) + BATS (new, post-P50 removal)
- **Append-only invariant**: `.hivemind/session-tracker/*.jsonl` MUST NOT be modified by P51
- **Atomic commit**: all file mutations in 1 git commit (per P50-PATTERNS P-3 `git add -u` discipline)

## Acceptance Criteria

A reviewer can verify the phase complete by checking **every** box below:

- [ ] 3 new files exist at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` with combined LOC in range 720–820
- [ ] `src/features/tmux/integration.ts` rewritten to ~200 LOC, no `fork-bridge` import, no D-04 `existsSync` fork-path check, factory instantiates the 3 new classes
- [ ] `src/features/tmux/fork-bridge.ts` and `tests/lib/tmux/fork-bridge.test.ts` deleted
- [ ] `grep -rE "fork-bridge" src/ tests/ .opencode/ --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist` returns 0 matches
- [ ] ORIGIN annotations present: `grep -c "ORIGIN: opencode-tmux/src" src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` reports ≥ 10
- [ ] 6 BATS files at `tests/scripts/tmux/*.bats`, all 6 scenarios pass
- [ ] 15+ new vitest cases in `tests/lib/tmux/{tmux-multiplexer,session-manager,grid-planner}.test.ts`, all pass
- [ ] `tests/lib/tmux/integration.test.ts` (363 LOC) and `tests/lib/tmux/tmux-copilot.test.ts` (12 tests) UNTOUCHED and pass
- [ ] `npx tsc --noEmit` exits 0
- [ ] 1 atomic git commit capturing all 7 file mutations + test additions
- [ ] `51-VERIFICATION.md` exists with verbatim output of BATS run, vitest run, and tsc run
- [ ] D-04 graceful-fallback observable contract preserved: `tmux-copilot` tool returns `{available: false, reason: "fork-not-wired"}` (or equivalent) when tmux is unavailable
- [ ] `.hivemind/session-tracker/*.jsonl` not modified

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.88 | 0.75 | ✓ | 3 specific files, exact LOC, exact annotations, exact test counts from ROADMAP |
| Boundary Clarity | 0.80 | 0.70 | ✓ | Explicit in/out lists; only minor ambiguity was `fork-bridge.test.ts` fate (resolved inline: REMOVE) and BATS file path (resolved inline: `tests/scripts/tmux/`) |
| Constraint Clarity | 0.82 | 0.65 | ✓ | Pattern source is the backup tarball; D-04 preservation is explicit; framework is vitest+BATS; tsc strict + verbatimModuleSyntax |
| Acceptance Criteria | 0.78 | 0.70 | ✓ | Concrete test counts and exit codes; L1 evidence chain specified |
| **Ambiguity (gate)** | **0.172** | **≤ 0.20** | **✓** | **PASSED** — all 4 dimensions above minimum, composite below 0.20 |

**Calculation:** `1.0 - (0.35×0.88 + 0.25×0.80 + 0.20×0.82 + 0.20×0.78) = 1.0 - 0.828 = 0.172`

`[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.`

No dimensions are below minimum. No flagged assumptions for the planner.

## Metadata

- **Spec generated:** 2026-06-02
- **Source files consulted:** ROADMAP.md (P51 entry, L1949-1958), REQUIREMENTS.md (full), 50-CLOSE.md (full), 50-PATTERNS.md (full), `src/features/tmux/fork-bridge.ts` (full), `src/features/tmux/integration.ts` (full), `tests/lib/tmux/fork-bridge.test.ts` (full), backup tarball at `/tmp/opencode-tmux-backup-1780370747.tar.gz` (file listing only)
- **Codebase scout verdict:** Current state confirmed (3 in-tree tmux files present, all BATS removed, fork tarball intact with 3 source files for synthesis)
- **Next step:** `/gsd-discuss-phase 51` — discuss-phase will detect this SPEC.md and focus on implementation decisions (e.g., which `types.ts` strategy for REQ-51-03)
