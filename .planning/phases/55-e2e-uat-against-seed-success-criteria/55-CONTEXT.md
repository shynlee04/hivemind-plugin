# Phase 55: E2E UAT Against Seed's 4 Success Criteria — Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-locked, implementation decisions only)

<domain>
## Phase Boundary

P55 is a **verification-only phase**. No new `src/**` files, no new tool registrations, no new `package.json` deps, no new vitest cases. The deliverable is 4 BATS scenarios (one per seed success criterion) + 1 manual L2 evidence document. The seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` advances from `planted` to `germinated` on gate pass. Tests live at `tests/scripts/tmux/{57,58,59,60}-*.bats` (slot reservation per P50/P51/P52/P53/P54 `5X-tmux-...` pattern; existing BATS slots: 01-06 + 52-56). L1 evidence: BATS pass output captured in `55-E2E-UAT-2026-06-02.md`. L2 evidence: text-described screenshots of the tmux grid (criterion 4) + journal entry excerpts (criterion 1). GATE: 3/4 PASS advances ROADMAP to P56+; 2/4 or fewer triggers P56 retry-phase planning (per close-pivot §7 partial-pass strategy). Real OS process survival in all 4 BATS — no mocks (per P54 D-54-12 precedent). 3 atomic commits: (1) BATS + helpers.bash, (2) UAT report + L2 evidence, (3) ROADMAP/STATE advance.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**4 requirements are locked.** See `55-SPEC.md` for full requirements, boundaries, and acceptance criteria. Downstream agents MUST read `55-SPEC.md` before planning or implementing.

**In scope (from SPEC.md):**
- 4 new BATS files at `tests/scripts/tmux/{57,58,59,60}-*.bats` (one scenario each, except slot 59 which has 2 — `ready-state kill` + `detached-state restore`)
- Extension of `tests/scripts/tmux/helpers.bash` `tmux_bats_require_dist` to require 2 additional `dist/` files (`grid-planner.js`, `tools/tmux-copilot.js`)
- 1 manual L2 evidence document: `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md` (one section per criterion with L1 BATS output + L2 screenshot/journal + verdict)
- 3 atomic commits: (1) BATS + helpers.bash, (2) UAT report + L2 evidence, (3) ROADMAP/STATE advance
- Real OS process survival in all 4 BATS (no mocks)
- `BATS_TEST_TMPDIR` per-test isolation
- Teardown with `tmux kill-session` in every BATS file

**Out of scope (from SPEC.md):**
- Modifications to any `src/**` file (P55 is verification-only — P51–P54 already shipped)
- New tools / new tool keys (27-tool-key invariant)
- New `package.json` dependencies (P20 invariant)
- New vitest files (P51–P54 already covered module-internal unit logic; P55 is integration)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03)
- Auto-pause / auto-detach orchestration
- `session-state-changed` hook subscription
- CP-PTY-00 docs/spec-only phase
- Cross-process file locking, schema migration, sidecar dashboard, persistence telemetry

</spec_lock>

<decisions>
## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| **D-55-01** | BATS file naming: `57-live-pane-monitoring.bats`, `58-orchestrator-intervention.bats`, `59-session-persistence-restart.bats`, `60-visual-dependency-graph.bats` | Slot reservation per P50/P51/P52/P53/P54 pattern: P50 closed fork, P51 wrote `01-mcp-server-pty.bats` through `06-graceful-degradation.bats`, P52 added slot 52 (`52-tmux-copilot-factory-swap.bats`), P53 added slot 53 (`53-tmux-state-query-tool.bats`), P54 added slots 54 (`54-tmux-observer-expansion.bats`) and 56 (the persistence kill-restart), and P55 reserves 57–60. The `5X-tmux-...` naming convention (`-tmux-` infix) is preserved for slots 52+ (P51/P52 introduced the convention; P53/P54 followed it). Slot 57 corresponds to REQ-55-01 (live pane monitoring); 58 to REQ-55-02; 59 to REQ-55-03; 60 to REQ-55-04. The numeric ordering matches the seed criteria's natural order (live → intervention → persistence → visual graph) so a casual reader can match criterion → BATS file. |
| **D-55-02** | Each BATS runs in isolation: `bats --jobs 1 tests/scripts/tmux/5X-<name>.bats` (no parallelism) | The close-pivot §7 mitigation strategy is "each criterion becomes its own BATS scenario." Isolation prevents cross-BATS state contamination (e.g., a leftover tmux session from BATS 57 polluting BATS 58's `tmux new-session -d -s <name>` with an "already exists" error). `--jobs 1` is the conservative invocation; BATS supports `--jobs N` for parallelism, but the close-pivot §7 partial-pass logic requires that the GATE count is per-BATS not per-aggregate-run. Running in isolation also produces clean per-criterion L1 evidence (each BATS's stdout is its own criterion's proof). Per P54 BATS slot 56 pattern: 1 scenario, run in isolation, teardown kills tmux session. |
| **D-55-03** | L1 evidence = BATS pass output captured verbatim in `55-E2E-UAT-2026-06-02.md`; L2 evidence = text-described screenshots of tmux grid (criterion 4) + journal entry excerpts (criterion 1) in the same document | The seed success criteria are user-visible contracts (a human "sees" pane content, "sees" the tmux grid, "intervenes" with `send-keys`). L1 is the automated machine-verifiable proof (BATS pass). L2 is the human-readable narrative proof (what the operator would see if they were watching). The "screenshots" are text-described (ASCII-art / structured markdown) rather than binary PNG files because the L2 evidence must be commit-friendly (no binary blobs in the planning/governance sector per `.planning/AGENTS.md` §5 naming conventions — text artifacts are git-trackable; binary blobs are not). The journal entry excerpt is a `jq`-formatted print of the on-disk JSON (the 7 fields for criterion 1) — human-readable, machine-verifiable, no screenshot needed. |
| **D-55-04** | GATE logic: `PASS_COUNT = count(PASS verdicts across 4 criteria)`; `if PASS_COUNT >= 3 → seed advances to germinated, ROADMAP proceeds to P56+`; `if PASS_COUNT == 2 → P56 retry-phase planning triggered (7-day grace per close-pivot §7)`; `if PASS_COUNT <= 1 → hard fail, no grace period, P57 escalates to user` | The close-pivot §7 mitigation is explicit: "P55 risks over-promising: 4 seed success criteria in one phase is ambitious. Mitigation: each criterion becomes its own BATS scenario; partial passes still advance ROADMAP." The 3/4 threshold is the canonical "M-of-N soft pass" pattern: 1 failing criterion is a known-good partial, 2 failing criteria requires retry-phase planning, 3+ failing criteria indicates a deeper architectural issue requiring user escalation. The 7-day grace period applies to the 2/4 case only — close-pivot §7 names it as "if 2/4 with at least 1 of criteria 1+2" — but P55 SPEC interprets this strictly: 2/4 = retry planning; the grace period is operational (how long the user has to review + decide), not technical. The 1/4 hard-fail triggers P57 escalation because the 3 failing criteria indicate a regression in the in-tree synthesis (P51–P54 each have their own unit tests; if 3/4 of the integration BATS fail, the unit tests are passing but the integration is broken — a fundamentally different class of problem). |
| **D-55-05** | Real OS process survival in all 4 BATS — no mocks. Per P54 D-54-12 precedent | A mocked test (stubbing `fs.writeFile` + `fs.readdir` + `tmux-cp`) would prove the BATS-internal logic in isolation but would NOT prove the end-to-end contract: the seed success criteria are about live OS processes (live tmux server, live harness process, live pane rendering). The P54 BATS slot 56 establishes the precedent: the kill-restart test uses real `tmux new-session` + real `kill -9 <node-pid>` + fresh `tmux_node_eval` (a real OS process boundary). P55 follows the same pattern. The D-04 silent-fallback contract is NOT tested in P55 (P51–P54 unit tests cover that) — P55 BATS exercises the happy path only. |
| **D-55-06** | BATS pattern: `load "helpers"` + `tmux_bats_require_dist` + `tmux_bats_make_project` for setup; `tmux_node_eval` for ESM module invocation. Per P53/P54 precedent | The helpers.bash infrastructure (P51) provides 4 helpers: `tmux_bats_require_dist` (skip if dist missing), `tmux_node_eval <js>` (run Node ESM with `node --input-type=module -e`), `tmux_bats_make_project` (fresh project under BATS_TEST_TMPDIR), and path resolution via `TMUX_BATS_ROOT`. P55 extends `tmux_bats_require_dist` with 2 new checks (`dist/features/tmux/grid-planner.js` + `dist/tools/tmux-copilot.js`) — additive only, no removal of P53/P54 checks. The `tmux_node_eval` invocation is the standard pattern from P53 BATS slot 55 and P54 BATS slot 56 (uses `node --input-type=module -e <script>` and `import('${TMUX_BATS_ROOT}/dist/...')` for ESM module resolution). The setup pattern (`tmux_bats_require_dist` then `tmux_bats_make_project`) is identical across all P52/P53/P54 BATS files. |
| **D-55-07** | Each BATS uses `BATS_TEST_TMPDIR` for project isolation; teardown with `tmux kill-session` (defensive cleanup) | `BATS_TEST_TMPDIR` is a per-test BATS-managed temp dir (auto-cleaned after the test). Each BATS creates `${BATS_TEST_TMPDIR}/project/.hivemind/{journal,state/tmux-sessions}/` for the journal and persistence writes — no contamination of the project tree (R-P50-03 spirit). The teardown pattern (`tmux kill-session -t <name> 2>/dev/null || true`) is the P54 BATS slot 56 precedent: a leftover tmux session from a failed/aborted test would persist and block the next test. The `|| true` ensures teardown does not fail the test if the session was already killed (e.g., by the test itself). |
| **D-55-08** | BATS timing tolerance: ±100ms for backoff/scheduling (criterion 1 — `__waitForPendingRetries` drain); ±200ms for capture-pane probe visibility (criterion 2 — tmux keystroke flush + capture-pane race); no tolerance for persistence tests (criterion 3) and SplitCommand tests (criterion 4) | Criterion 1 (live pane monitoring) has a 100ms tolerance on the `__waitForPendingRetries` drain because the P53 hook schedules `setTimeout(..., 5000)` for the first retry — but in the happy path (no failure), the write completes synchronously and the wait is a no-op. The 100ms tolerance absorbs any microtask scheduling jitter. Criterion 2 (orchestrator intervention) has a 200ms tolerance on the `tmux capture-pane` poll because tmux's keystroke-to-buffer pipeline is async: `sendKeys` returns immediately, the keystrokes are buffered by tmux server, and the receiving process (e.g., `cat`) reads them. The 200ms is a conservative lower bound on this pipeline. Criterion 3 (persistence) has NO tolerance because `fs.writeFile` is synchronous from the caller's perspective once the Promise resolves — the file exists exactly when `persist()` resolves. Criterion 4 (visual graph) has NO tolerance because `PaneGridPlanner.computeSplitSequence` is a pure function (no I/O, no async, no scheduling). The timing tolerances are explicit in each BATS file's `run` commands. |
| **D-55-09** | `55-E2E-UAT-2026-06-02.md` format: 1 section per criterion with (a) L1 evidence = BATS pass output verbatim, (b) L2 evidence = text-described screenshot or journal excerpt, (c) verdict line per criterion (`PASS` or `FAIL`) | The 1-section-per-criterion structure makes the document scannable: a reviewer can jump from criterion 1 → criterion 4 without reading the whole document. The L1+L2 per-section structure mirrors the P49 close-pivot evidence model (L1 automated + L2 human-readable). The verdict line at the end of each section enables the GATE logic to be computed by `grep -c 'verdict: PASS' 55-E2E-UAT-2026-06-02.md` (machine-verifiable) — but the GATE is evaluated by the human reviewer reading the document, not by an automated count (the verdicts encode operator judgment about partial passes, e.g., "the BATS passed but the journal entry timestamp was off by 5s — does that count as PASS?"). |
| **D-55-10** | SC-isolation: no SC-* work referenced; `rootSessionId` separation enforced. P55 BATS files are scoped to the in-tree tmux features only — no `sidecar/` references, no `.hivemind/session-tracker/*` reads or writes, no `compositions/` cross-references | R-P50-03 strict prohibition on `.hivemind/session-tracker/*` mutations; P55 BATS uses `BATS_TEST_TMPDIR` for all writes. The SC-isolation is a defensive measure against cross-phase contamination: if a future P56+ phase introduces a sidecar/companion surface (e.g., a sidecar dashboard), P55's BATS files must not couple to it. The 4 BATS files import only from `dist/features/tmux/`, `dist/hooks/`, and `dist/tools/` (the P51–P54 deliverables) — no other surface. |
| **D-55-11** | Atomic commits (no intermediate commits): 1 commit for BATS+helpers, 1 commit for UAT report + L2 evidence, 1 commit for ROADMAP/STATE advance. Per AGENTS.md §Atomicity + close-pivot §4 | AGENTS.md §Atomicity is non-negotiable: "one logical change = one commit. Do not bundle multiple unrelated changes into a single commit. If a change is large, break it down into smaller, atomic commits with meaningful messages." The 3-commit structure for P55 is: (1) BATS+helpers is the "test code" change; (2) UAT report + L2 evidence is the "verification artifact" change; (3) ROADMAP/STATE advance is the "governance update" change. Each is independently revertable: if the BATS are wrong, revert (1); if the UAT report has issues, revert (2); if the gate evaluation needs re-running, revert (3). The close-pivot §4 reference is the original P49 close-pivot which established the "1 commit per deliverable" pattern. |
| **D-55-12** | 27 tool keys unchanged (no new tool registrations — P55 is verification only). Per D-04 (P50/P51, preserved through P55) | The 27-tool-key invariant (locked at P51) is preserved through P55: the 4 BATS files do not register new tools, do not import new tool modules, do not extend the `SessionManagerAdapter` interface. The `tmux-copilot` tool (P43 + P49 widening) is exercised by BATS slot 58, but no new action is added to its 4-action discriminated union. The 27 keys are: `delegate-task`, `delegation-status`, `session-hierarchy`, `session-tracker`, `session-delegation-query`, `hivemind`, `prompt-enhance`, `nl-route`, `nl-extract`, `nl-batch`, `tmux-copilot`, `tmux-state-query`, `mcp-server-pty`, `healthcheck`, `config-workflow`, `session-recovery`, `tmux-pane-pip`, `session-journal-export`, `boot-02-init`, `boot-02-bootstrap-recover`, `tmux-mcp-server`, `create-governance-session`, `tmux-copilot-list-panes`, `validate-restart`, `tmux-copilot-send-keys`, `tmux-copilot-compute-grid`, `tmux-copilot-respawn` — P55 does NOT add to this list. |

## Open Questions

None. All 12 gray areas (BATS slot reservation, gate threshold strictness, L2 evidence format, atomic commit structure, helpers.bash extension scope, BATS timing tolerance, teardown pattern, isolation, real-OS-process vs mock, etc.) are resolved by the SPEC and the decisions above. The 4 BATS files are deterministic, the GATE logic is binary, the L2 evidence is text-described, the 3 atomic commits are pre-scoped.

## the agent's Discretion

The implementer has flexibility for the following implementation details (no SPEC constraint, no user preference captured):

- Exact JSDoc depth on BATS file headers (each BATS file has a header comment block explaining the scenario; depth is at implementer's discretion)
- Specific `run` / `assert_success` / `assert_failure` style within BATS — must follow the P53 BATS slot 55 / P54 BATS slot 56 precedent (consistent style across all 4 P55 BATS files)
- Test fixture data shape for BATS — the synthetic event payloads (e.g., the `PaneCapturedEvent` shape for criterion 1) can use any well-formed payload that satisfies the 4-field shape `{ sessionId, paneId, contentLength, timestamp }`
- Exact wording of `tmux new-session -d -s <name>` session names — the `BATS_TEST_NUMBER` (`$$`) suffix is recommended for uniqueness, but any unique-name scheme satisfies the SPEC
- Order of `mkdir` + `writeFile` calls inside the BATS — the SPEC mandates `tmux_bats_make_project` first, then spawn tmux session, then run the test logic; the implementer may extract a `setup_session()` helper for DRY
- Whether to extract the `restoreAll` alive-filter as a separate BATS variable or inline it in the assertion — both satisfy the SPEC
- Specific `grep -c` vs `[[ ... == *...* ]]` style for capture-pane content matching — must produce a stable exit code
- The text-described screenshot for criterion 4 (the tmux grid) — format as ASCII-art, structured markdown table, or a tree-style layout; all satisfy the L2 evidence requirement
- Whether the `55-E2E-UAT-2026-06-02.md` uses H1/H2/H3 headers or a flat structure — must have one section per criterion, but nesting depth is flexible
- Vitest test organization: P55 adds 0 vitest files (out of scope per SPEC); the implementer is NOT permitted to add vitest even if it would simplify the BATS setup
- BATS test organization: 1 scenario per file except BATS slot 59 (2 scenarios — `ready-state kill` + `detached-state restore`); implementer may combine into a single scenario with sub-assertions or split into 2 separate `@test` blocks
- Whether the `tmux_bats_require_dist` extension in `helpers.bash` is a 2-line additive change or extracted into a helper — both satisfy the SPEC

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-SPEC.md` — Locked spec: 4 EARS requirements (REQ-55-01..04), ambiguity gate PASSED at 0.08 ≤ 0.20, 21 acceptance criteria, 27-tool-key invariant locked, real-OS process survival required
- `.planning/phases/54-session-persistence-restart-recovery/54-SPEC.md` — Prior-phase SPEC format reference (5 EARS, P54)
- `.planning/phases/54-session-persistence-restart-recovery/54-CONTEXT.md` — Prior-phase CONTEXT format reference (12 decisions)
- `.planning/phases/54-session-persistence-restart-recovery/54-VERIFICATION.md` — Prior-phase L1 evidence pattern (8 L1 sections: tsc, vitest, full vitest, BATS, full BATS, git diff, grep count, etc.)
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-SPEC.md` — P53 SPEC: `createPaneMonitorHook` factory pattern
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-CONTEXT.md` — P53 CONTEXT: D-53-05 (backoff schedule), D-53-06 (rate cap), D-53-13 (schemaVersion drift fix)
- `.planning/phases/52-wire-tmux-copilot-state-query/52-CONTEXT.md` — P52 CONTEXT: D-04 (tool placement), tmux-copilot factory wiring
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-SPEC.md` — P51 SPEC: `SessionManager` 6-param constructor + `TrackedSession` 7-field interface
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md` — §4 seed success criteria table, §7 UAT strategy (partial-pass gate logic), §6 boundary contracts

### Roadmap and Requirements
- `.planning/ROADMAP.md:2016-2020` — P55 phase entry with goal, requirements (REQ-04, REQ-05, REQ-07), gate logic
- `.planning/ROADMAP.md:2018` — Gate logic: 3/4 PASS = advance; 2/4 = P56 retry
- `.planning/REQUIREMENTS.md` — Requirement registry (P55 traces to REQ-04 Tmux Visual Orchestration, REQ-05 Co-pilot Model, REQ-07 Cqrs Boundary)
- `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` — The seed that advances from `planted` to `germinated` on gate pass

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; `src/features/tmux/` is the feature layer (P51–P54 deliverables)
- `.planning/codebase/STRUCTURE.md` — File placement: `src/features/<feature>/<role>.ts` for feature modules
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read, no `any`

### Source Code (read-only references for P55 implementer)
- `src/features/tmux/grid-planner.ts` (P51, 148 LOC) — `PaneGridPlanner` class with `computeSplitSequence(root)` (DFS preorder, depth-based direction) and `requestLayout(root, onComputed)` (500ms debounce). REQ-55-04 BATS test target.
- `src/tools/tmux-copilot.ts` (P43 + P49 widening, 235 LOC) — 4-action tool: `send-keys`, `list-panes`, `compute-grid`, `respawn`. REQ-55-02 BATS test target.
- `src/features/tmux/session-manager.ts` (P51 + P54 additive, 332 LOC) — `SessionManager` class with 7-param constructor; `respawnIfKnown`, `sendKeys`, `listPanes`, `createPaneGridPlanner` adapter methods. REQ-55-02 + REQ-55-03 BATS test target.
- `src/features/tmux/persistence.ts` (P54, 400 LOC) — `createSessionPersistence` factory; `SessionPersistence` interface (4 public methods + `__stateRoot` test seam). REQ-55-03 BATS test target.
- `src/hooks/pane-monitor.ts` (P53, 490 LOC) — `createPaneMonitorHook` factory; `pane-captured` event consumer; journal file writer. REQ-55-01 BATS test target.
- `src/features/tmux/observers.ts` (P52) — `createTmuxEventObserver` with `onPaneCaptured(cb)` registration. REQ-55-01 BATS test target.
- `src/features/tmux/types.ts` (P51 + unchanged through P54) — `SessionManagerAdapter` interface (6 methods). 27-tool-key invariant.

### Test Targets
- `tests/scripts/tmux/helpers.bash` (P51, 46 LOC) — BATS test infrastructure. **MUST be extended** to require `dist/features/tmux/grid-planner.js` and `dist/tools/tmux-copilot.js` (D-55-06).
- `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` (P53, 107 LOC) — Reference BATS for REQ-55-01 (same hook, same shape — but P55 uses real tmux session, not synthetic event).
- `tests/scripts/tmux/56-session-persistence-kill-restart.bats` (P54, 101 LOC) — Reference BATS for REQ-55-03 (same persistence module — but P55 tests SessionManager → persistence → kill → restore, not just persistence round-trip).
- `tests/scripts/tmux/57-live-pane-monitoring.bats` — **NEW FILE** (REQ-55-01, slot 57)
- `tests/scripts/tmux/58-orchestrator-intervention.bats` — **NEW FILE** (REQ-55-02, slot 58)
- `tests/scripts/tmux/59-session-persistence-restart.bats` — **NEW FILE** (REQ-55-03, slot 59; 2 scenarios)
- `tests/scripts/tmux/60-visual-dependency-graph.bats` — **NEW FILE** (REQ-55-04, slot 60)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC, no `any`
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51, preserved through P55) — Graceful-fallback contract: no throw on missing prerequisites or filesystem errors
- R-P50-03 (spirit) — `.hivemind/{journal,state/tmux-sessions}/*` is local runtime state, never committed
- P20 invariant — No new `package.json` dependencies
- 27-tool-key invariant — No new tool registrations
- `.planning/AGENTS.md` §7 — CP-PTY runway note: P55 adds 4 BATS files to `tests/scripts/tmux/` and ~10 LOC to `helpers.bash` — both are `tests/**` additions, NOT `src/**` mutations. CP-PTY-00 docs/spec-only phase can land later without conflict.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/scripts/tmux/helpers.bash`** (P51, 46 LOC) — BATS test infrastructure: `tmux_bats_require_dist` (skip if dist missing), `tmux_node_eval <js>` (Node ESM with `node --input-type=module -e`), `tmux_bats_make_project` (fresh project under BATS_TEST_TMPDIR), path resolution via `TMUX_BATS_ROOT`. P55 extends `tmux_bats_require_dist` additively.
- **`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`** (P53) — Reference BATS for REQ-55-01: 3 scenarios proving `createPaneMonitorHook` writes 7-field JSON on `pane-captured` events. P55 BATS slot 57 is a stricter E2E test using a REAL tmux session (not synthetic event).
- **`tests/scripts/tmux/56-session-persistence-kill-restart.bats`** (P54) — Reference BATS for REQ-55-03: 1 scenario proving `persistence.persist` + `restoreAll` round-trip across fresh node processes. P55 BATS slot 59 is a stricter E2E test combining persistence with the SessionManager → kill → restart chain.
- **`src/features/tmux/grid-planner.ts:PaneGridPlanner.computeSplitSequence`** (P51) — Pure function; deterministic; no I/O. The BATS slot 60 test asserts the SplitCommand sequence + applies it to a real tmux session via `tmux split-window`.
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (P43 + P49) — 4-action tool; permission-gated to orchestrator-tier agents. The BATS slot 58 test bypasses the permission gate by calling the underlying `adapter.sendKeys(paneId, text, literal)` directly (the BATS test simulates the permission-granted path).
- **`src/hooks/pane-monitor.ts:createPaneMonitorHook`** (P53) — Closure-captured state, `dispose()` teardown, no-throw error handling, `logWarn` fallback. P55 BATS slot 57 uses the same factory with a real P52 `createTmuxEventObserver` and a real `pane-captured` event.
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (P54) — 4 public methods, 1 read-only test seam. P55 BATS slot 59 uses `persist`, `restoreAll`, and `__stateRoot` test seam.

### Established Patterns
- **BATS file structure** (`tests/scripts/tmux/*.bats`) — Header comment (1-2 lines: filename + phase + REQ acceptance summary), `load "helpers"`, `setup()` block with `tmux_bats_require_dist` + `tmux_bats_make_project`, `@test "..."` blocks with `run` + `assert_success` + `jq` assertions, `teardown()` block with `tmux kill-session` cleanup.
- **BATS variable interpolation in `tmux_node_eval`** — Use single-quoted script with `${variable}` interpolation, then escape with `'\''` for nested single quotes. The P53/P54 BATS files demonstrate the pattern (e.g., `run tmux_node_eval "import('${TMUX_BATS_ROOT}/dist/...').then(async (...) => { ... })"`).
- **`assert_success` vs `[ "$status" -eq 0 ]`** — P53/P54 BATS files use both styles. The `[ "$status" -eq 0 ]` form is more explicit; the `assert_success` form is more concise. P55 can use either; consistency across the 4 P55 BATS files is required.
- **BATS `run` + `[[ "$output" == *...* ]]`** — The substring match pattern. P53 BATS slot 55 uses `[[ "$output" == *"written=1"* ]]` to check the `tmux_node_eval` stdout for a marker string. P55 BATS follows the same pattern (e.g., `[[ "$output" == *"split_count=4"* ]]` for criterion 4).
- **`BATS_TEST_TMPDIR` isolation** — Each BATS test gets a fresh temp dir auto-cleaned after the test. The `tmux_bats_make_project` helper creates `${BATS_TEST_TMPDIR}/project/`. P55 BATS files create subdirs for journal + persistence writes inside this project dir.

### Integration Points
- **`tests/scripts/tmux/helpers.bash:tmux_bats_require_dist`** — P55 EXECUTE adds 2 lines: `if [[ ! -f "${TMUX_BATS_DIST}/grid-planner.js" ]]; then skip "..."; fi` + `if [[ ! -f "${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js" ]]; then skip "..."; fi`. The P55 EXECUTE is the first phase to require these 2 `dist/` files.
- **`src/features/tmux/grid-planner.ts:PaneGridPlanner.computeSplitSequence`** (REQ-55-04) — BATS slot 60 imports the class directly: `const { PaneGridPlanner } = await import('${TMUX_BATS_ROOT}/dist/features/tmux/grid-planner.js')` + `new PaneGridPlanner(0).computeSplitSequence(tree)`.
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (REQ-55-02) — BATS slot 58 uses the underlying adapter (`getSessionManagerAdapter()` from `dist/features/tmux/types.js`) rather than invoking the tool directly (the tool has a permission gate that requires an orchestrator-tier context, which the BATS does not provide). The adapter's `sendKeys(paneId, text, literal)` is the actual delivery mechanism.
- **`src/hooks/pane-monitor.ts:createPaneMonitorHook`** (REQ-55-01) — BATS slot 57 imports the hook factory and registers it with a P52 `createTmuxEventObserver`. The observer is invoked with a real `PaneCapturedEvent` payload (synthesized by the BATS, but representing a real tmux pane capture).
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (REQ-55-03) — BATS slot 59 imports the factory, calls `persist({ state: "ready" or "detached", ... })`, simulates a kill via `kill -9 <pid>`, then calls `restoreAll()` in a fresh `tmux_node_eval` process.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC — open to standard approaches. The 12 decisions above resolve all gray areas surfaced during discuss-phase. The implementer follows well-established patterns from P52/P53/P54 BATS files and the P51 `helpers.bash` infrastructure. The 4 P55 BATS files are deterministic (no I/O randomness, no timing races beyond the explicit tolerance windows in D-55-08). The UAT report follows the 1-section-per-criterion structure with L1 + L2 + verdict per section.

</specifics>

<deferred>
## Deferred Ideas

- **Auto-pause / auto-detach orchestration** — The P54 persistence layer records state transitions; the logic that decides when to transition `ready → paused` or `ready → detached` is a downstream concern (P56+ if 2/4 gate fails; otherwise, future). The P55 BATS slot 59 explicitly tests the `detached` state via direct `persist({ state: "detached", ... })` call — but no SessionManager code path currently sets `state: "detached"` (P54 only sets `ready` and `failed`).
- **`session-state-changed` hook subscription** — P53 D-53-12 deferred this; P54 deferred-ideas §3 confirmed; P55 does not add a subscriber. The P52 observer's `onSessionStateChanged` registration method is exposed but unconsumed.
- **Sidecar dashboard rendering of session state + tmux grid** — Separate downstream scope (Q2 from `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`). The L2 evidence in P55 (text-described screenshots) is a planning/governance artifact, not a sidecar UI.
- **P56 retry phase (if 2/4 gate fails)** — Not authored yet. If the gate evaluation results in `PASS_COUNT == 2`, the P55 EXECUTE writes a `55-CLOSE-PARTIAL.md` documenting the failed criteria and the operator decision (per close-pivot §7 7-day grace period). A future P56 phase would then author fix-up BATS + UAT report.
- **P57 escalation (if 1/4 hard fail)** — Not authored yet. If the gate evaluation results in `PASS_COUNT <= 1`, the P55 EXECUTE writes a `55-CLOSE-FAILED.md` documenting the architectural regression (3+ integration BATS failing when unit tests pass) and the user escalation.
- **Automated gate evaluation** — The GATE logic in D-55-04 is currently evaluated by a human reviewer reading `55-E2E-UAT-2026-06-02.md`. A future phase could add a `bin/uat-gate.cjs` script that parses the verdict lines and computes `PASS_COUNT` automatically, but P55 leaves the evaluation human-driven (matches the close-pivot §7 "operator judgment" model).
- **P55 BATS slot 59's `detached-state` scenario requires manual `state: "detached"` injection** — The SessionManager currently only sets `state: "ready"` (on `onSessionCreated`) and `state: "failed"` (on `handleSessionClose`). A future orchestrator (P56+ if needed) would set `state: "detached"` when a session is detached. P55 BATS slot 59's second scenario injects the `detached` state directly via `persist({ state: "detached", ... })` to prove the `restoreAll` filter works for detached records — this is forward-compatible with the future orchestrator.
- **BATS slot reservation for P56+** — If P55 advances to P56+, future phases can reserve slots 61, 62, etc. The `5X-tmux-...` convention continues. P55 does not pre-reserve beyond slot 60.
- **CI integration of the 4 new BATS files** — The 4 P55 BATS files are runnable via `bats --jobs 1 tests/scripts/tmux/{57,58,59,60}-*.bats` but are not yet wired into `.github/workflows/ci.yml` (P55 EXECUTE does NOT mutate the CI workflow). A future phase could add a `tmux-uat` CI job that runs the 4 BATS + captures the L1 evidence.
- **Telemetry / metrics on P55 BATS runtimes** — No tracking of how long each BATS takes to run, how often they flake, etc. P54 D-54 deferred this. P55 does not add telemetry.

---

*Phase: 55-e2e-uat-against-seed-success-criteria*
*Context gathered: 2026-06-02*
*Checkpoint 5 (CONTEXT & ASSUMPTIONS) complete — 12 decisions locked, ready for Checkpoint 6 (RESEARCH) or Checkpoint 7 (PATTERNS)*
*Next checkpoint: CP7 (PATTERNS) — generate `55-PATTERNS.md` for the BATS test patterns and L2 evidence format before planning.*
