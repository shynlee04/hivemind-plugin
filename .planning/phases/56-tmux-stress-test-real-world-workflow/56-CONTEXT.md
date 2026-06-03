# Phase 56: Stress Test for Real-Life Tmux Use — Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Mode:** Auto-generated (spec-locked, implementation decisions only)

<domain>
## Phase Boundary

P56 is a **stress-test phase** that closes the verification gap left by P55. P55's 4 BATS scenarios prove each of the 4 seed success criteria in isolation; P56 proves the complete P50–P55 tmux visual orchestration layer works **together** as a coherent system in a single end-to-end scenario. The deliverable is 1 BATS scenario (`tests/scripts/tmux/61-stress-test-real-world-workflow.bats` — slot 61 follows the P55 `5X-tmux-...` naming convention and is reserved for the next-phase comprehensive scenario) + 1 L1+L2 evidence document. The scenario exercises 6 sub-flows in a single `@test` block: multi-agent spawn (3+ real tmux sessions), DFS grid layout (P51 `PaneGridPlanner` + `tmux split-window`), orchestrator intervention (`TmuxMultiplexer.sendKeys` to 3 panes), pane-captured journaling (P53 `pane-monitor` writes 3 journal entries), state-query + persistence integration (P52 `tmux-state-query` + P54 `persistence.persist`/`restoreAll` with 3 records), and the 27-tool-key invariant (vitest regression in teardown). L1 evidence: BATS pass output captured in `56-STRESS-EVIDENCE-2026-06-03.md`. L2 evidence: `tmux list-sessions` listing showing 3 live sessions + `ls -R .hivemind/journal/` tree showing 3+ journal files + `tmux-state-query get-session` JSON dump for session 0. GATE: 1/1 BATS scenario passes (all 6 sub-flows PASS) = stress test PASS. Partial failures (e.g., REQ-56-01..05 PASS but REQ-56-06 27-tool-key assertion FAILS) = stress test FAIL — the scenario is atomic and the 6 sub-flows are inseparable. Real OS process survival in the BATS — no mocks (per P54 D-54-12 precedent and P55 D-55-05). 2 atomic commits: (1) BATS + helper extension, (2) L1+L2 evidence + ROADMAP/STATE advance.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**6 requirements are locked.** See `56-SPEC.md` for full requirements, boundaries, and acceptance criteria. Downstream agents MUST read `56-SPEC.md` before planning or implementing.

**In scope (from SPEC.md):**
- 1 new BATS file at `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` (slot 61, single `@test` block with 6 sequential sub-flows)
- 1 manual L1+L2 evidence document: `.planning/phases/56-tmux-stress-test-real-world-workflow/56-STRESS-EVIDENCE-2026-06-03.md`
- Extension of `tests/scripts/tmux/helpers.bash` if needed (e.g., `tmux_bats_require_stress_facilities` checking tmux + node + git binaries) — additive only
- 2 atomic commits: (1) BATS + helper extension, (2) L1+L2 evidence + ROADMAP/STATE advance
- Real OS process survival in the BATS (no mocks)
- `BATS_TEST_TMPDIR` per-test isolation
- Teardown with `tmux kill-session` in the BATS file (defensive cleanup of 4 sessions: 3 from REQ-56-01 + 1 grid from REQ-56-02)
- Vitest regression run (`npx vitest run tests/integration/hook-registration.test.ts`) inside the BATS teardown to assert the 27-tool-key invariant

**Out of scope (from SPEC.md):**
- Modifications to any `src/**` file (P56 is verification-only — P51–P55 already shipped)
- New tools / new tool keys (27-tool-key invariant — P56 is verification-only)
- New `package.json` dependencies (P20 invariant — P56 is verification-only)
- New vitest files (P56 is BATS-only — vitest regression is a sanity check, not a new test)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03)
- Auto-pause / auto-detach orchestration (REQ-56-05 explicitly tests the `ready` state, which is excluded from `restoreAll`)
- New tmux-copilot actions (P56 exercises the existing 4 actions + 3 state-query actions — no new ones)
- Sidecar dashboard rendering of stress-test output
- Telemetry / metrics on stress-test runtime
- Multi-machine distributed stress test (single-host only)
- Persistent stress test daemon (P56 is a one-shot BATS scenario, not a long-running service)
- CP-PTY-00 docs/spec-only phase

</spec_lock>

<decisions>
## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| **D-56-01** | BATS file slot reservation: `61-stress-test-real-world-workflow.bats` (single comprehensive stress test scenario) | Slot reservation per the P55 `5X-tmux-...` naming convention established in D-55-01: P50 closed fork, P51 wrote slots 01-06, P52 added slot 52, P53 added slot 53, P54 added slots 54+56, P55 reserved 57-60 (one per seed success criterion). P56 reserves slot 61 — the first P56 slot — for the comprehensive stress test scenario. The `5X-tmux-...` naming convention (with `-tmux-` infix) is preserved. Slot 61 is a natural continuation of the P55 `5X-tmux-...` series; the SPEC reserves 61 explicitly to prevent later phases from claiming it. The "stress-test-real-world-workflow" suffix describes the scenario's purpose: a real-life, end-to-end multi-agent workflow that exercises the full P50-P55 chain. |
| **D-56-02** | Spawn 3 real tmux sessions via `tmux new-session -d -s e2e-test-{pid}-{i} -c <project> 'sleep 600'` (i=0,1,2) where `{pid}` is the BATS process PID and `{i}` is the loop index; `sleep 600` (10-min sleep) is the agent placeholder | The "3 sessions" count matches ROADMAP L2031 "(1) orchestrator spawns 3+ sub-agents via delegate-task". The session name pattern `e2e-test-{pid}-{i}` is unique per BATS run (the PID ensures no collision across runs; the index ensures no collision within a run). The `sleep 600` placeholder is deterministic (no false-positive probe renders in `cat` output — the placeholder is silent) and long enough to survive the 60-second stress test budget (REQ-56-01 acceptance). The 3 sessions are spawned sequentially in a loop — the PIDs are captured via `$!` after each `tmux new-session` call and asserted to differ across the 3 spawns (proving 3 distinct OS processes, not 3 PIDs reused by a single process). The choice of `sleep 600` over `cat` (P55 BATS slot 58's choice) is intentional: `cat` would echo the probe string back, masking whether the tmux server's pane-buffer reflects the send-keys delivery; `sleep 600` keeps the pane-buffer clean and lets the probe string appear in the tmux server's pane-buffer (visible in `capture-pane` output) without echo interference. |
| **D-56-03** | Extend `tests/scripts/tmux/helpers.bash` with `tmux_bats_require_stress_facilities()` checking tmux + node + (optional) opencode + git binaries on PATH | The current `tmux_bats_require_dist` helper (P55 EXECUTE) checks 6 dist artifacts (`integration.js`, `types.js`, `pane-monitor.js`, `persistence.js`, `grid-planner.js`, `tmux-copilot.js`). P56 adds a SECONDARY helper `tmux_bats_require_stress_facilities` that checks the EXTERNAL binaries: `command -v tmux` (required), `command -v node` (required), `command -v git` (required for vitest regression in REQ-56-06 teardown), and `command -v opencode` (optional — the stress test does NOT require OpenCode, but the vitest test setup may load it). Each missing required binary triggers `skip "<binary> not on PATH — stress test requires it"`. The helper is additive — no removal of P53/P54/P55 helpers. The rationale: the P55 BATS files work in a CI environment where the build (`npx tsc`) is run before BATS, but the P56 stress test runs a vitest regression in teardown (REQ-56-06), which is a separate runtime requirement. A stress-test-specific helper makes the dependency explicit. |
| **D-56-04** | Stress test scope: 6 sub-flows in one `@test` block — REQ-56-01 (spawn 3) + REQ-56-02 (grid layout 3 nodes) + REQ-56-03 (sendKeys 3) + REQ-56-04 (journal 3) + REQ-56-05 (persist 3 + state-query 1) + REQ-56-06 (27-tool-key vitest regression) | The 6 sub-flows are the minimal set that exercises the P50-P55 chain end-to-end: P51 (grid-planner, multiplexer) + P52 (observers, tmux-copilot, tmux-state-query) + P53 (pane-monitor journal) + P54 (persistence) + P55 (BATS infrastructure) + P49 (27-tool-key invariant). The "all 6 in one `@test` block" choice is deliberate: a single scenario proves the system is coherent (the modules interoperate), whereas 6 separate `@test` blocks would only prove each module works in isolation (P55 already proved that). The "inseparability" property means partial failures are NOT a soft pass — if any of the 6 sub-flows fails, the stress test FAILS as a whole, and a follow-up P57 gap-remediation phase is required. This is stricter than P55's GATE (3/4 = advance), but justified: P56 is a stress test, not a UAT — the contract is "the system works end-to-end", and any gap in the chain breaks the contract. |
| **D-56-05** | Cleanup policy: `teardown()` function kills all 4 tmux sessions (3 from REQ-56-01 + 1 grid from REQ-56-02) via `tmux kill-session -t <name> 2>/dev/null || true`, disposes the P53 `pane-monitor` hook via `hook.dispose()` to clear in-flight retry timers, and runs the vitest regression for REQ-56-06 | The teardown pattern is the P55 BATS slot 56 / slot 60 precedent: `tmux kill-session -t <name> 2>/dev/null || true` ensures the test does not fail if the session was already killed (e.g., by the test itself or by a prior teardown). The `hook.dispose()` call is the P53 D-53-11 contract — the hook schedules `setTimeout(..., 5000)` for the first retry, and a leaked hook would keep timers alive after the test ends (BATS would report the test as "still running" indefinitely). The vitest regression is run in teardown (not in the `@test` block) so that a vitest failure does NOT block the stress test's main assertions (the BATS scenario's exit code is determined by the `@test` block's `assert` calls; teardown runs unconditionally after the `@test` block completes or fails). The vitest regression output is captured and asserted in the L1 evidence. |
| **D-56-06** | Stress test runtime budget: ≤ 60 seconds wall clock (per P49 audit precedent — P49 audit mandated ≤60s BATS scenarios; P55's BATS files were ≤15s individually) | P49's audit of the in-tree tmux subsystem established a 60-second per-scenario budget for BATS scenarios that exercise multi-component integration. P56's stress test exercises 6 sub-flows in one scenario, but the per-sub-flow runtime is bounded: REQ-56-01 spawn (3 × `tmux new-session` ≈ 100ms each = 300ms) + REQ-56-02 grid (1 × `PaneGridPlanner` + 3 × `tmux split-window` ≈ 200ms) + REQ-56-03 sendKeys (3 × `TmuxMultiplexer.sendKeys` + 200ms wait = 500ms) + REQ-56-04 journaling (3 × hook write + drain = 500ms) + REQ-56-05 persistence + state-query (3 × `persistence.persist` + 1 × fresh-process `restoreAll` + 1 × `tmux-state-query` = 1500ms) + REQ-56-06 vitest regression (`hook-registration.test.ts` ≈ 5 seconds) = ~8 seconds total. The 60-second budget includes CI-environment slack (vitest startup ≈ 3-5s, BATS warmup ≈ 1s, tmux server handshake ≈ 1s per spawn). If the actual runtime exceeds 60s, the scenario fails the runtime budget and a follow-up optimization is required (no deferral — the budget is hard). |
| **D-56-07** | Use real timers (no `vi.useFakeTimers()`); the P53 hook's exponential backoff and rate cap are exercised with real `setTimeout`/`setImmediate` | The P53 `pane-monitor` hook schedules `setTimeout(..., 5000)` for the first retry and uses `setImmediate` for batched journal writes. Fake timers (`vi.useFakeTimers()` from vitest, or `BATS_TEST_TMPDIR/fake-timers.bash` from BATS) would skip these timers and produce false-positive PASS results. The P55 D-55-05 contract is "real OS process survival in all 4 BATS — no mocks"; P56 follows the same contract. The hook's `__waitForPendingRetries?.()` test seam is the controlled-drain mechanism for in-flight retries: the BATS scenario calls it after the 3 `pane-captured` events to drain any retry-scheduled timers (without fake timers, the drain just `await`s pending promises). Real timers are slower (the 5s/10s/30s backoff would block for 5+ seconds on retry), but the happy path (no failure → no retry scheduled) completes in < 1 second. The stress test exercises the happy path only — failure modes (write errors, rate cap exceeded) are P53 unit-test territory, not P56 territory. |
| **D-56-08** | SC-isolation: zero SC-* work references in 56-SPEC.md, 56-CONTEXT.md, or the BATS file. The 2 SC-* string matches in 56-SPEC.md are the "SC-isolation" constraint statements (asserting absence of SC-* work) — they follow the P55 D-55-10 precedent. | R-P50-03 strict prohibition on `.hivemind/session-tracker/*` mutations; P56 BATS uses `BATS_TEST_TMPDIR` for all writes. The SC-isolation is a defensive measure against cross-phase contamination: if a future P57+ phase introduces a sidecar/companion surface (e.g., a sidecar dashboard), P56's BATS file must not couple to it. The BATS file imports only from `dist/features/tmux/`, `dist/hooks/`, and `dist/tools/` (the P51–P54 deliverables + the 2 tools from P52) — no other surface. The 2 SC-* string matches in 56-SPEC.md are the "SC-isolation" line in the Constraints section and the "SC-isolation" column in the Ambiguity Report — these are constraint statements, not SC-* work references. P55 SPEC has 2 SC-* string matches and P55 CONTEXT has 1 — the same pattern. The lint check `grep -E 'SC-[0-9]' 56-SPEC.md 56-CONTEXT.md 61-stress-test-real-world-workflow.bats` should return 0 matches (only `SC-isolation` is allowed). |
| **D-56-09** | 27-tool-key assertion in teardown: re-run `npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|Tests\s+[0-9]+ passed)'` and assert the output contains the "27 tool entries" assertion line | The vitest test at `tests/integration/hook-registration.test.ts:103` asserts `expect(toolKeys.length).toBe(27)`. Running the FULL vitest test in teardown proves the 27-tool-key invariant is preserved end-to-end (not just the assertion line — the entire test file, which also asserts `HarnessControlPlane` export, hook registration, `tool.execute.before`/`after` presence, etc.). The grep filter extracts the relevant lines for the L1 evidence; the full vitest output is captured in the evidence doc as a 2nd-level artifact. If the vitest test FAILS (e.g., a future PR accidentally adds a 28th tool), the teardown's `assert_success` fails, the BATS scenario fails, and the GATE is FAIL. This is the only "regression check" in P56 — the test is not duplicated in the BATS itself; it's a re-execution of the existing vitest test. |
| **D-56-10** | Journal cleanup: `BATS_TEST_TMPDIR/...` writes are auto-cleaned by BATS teardown; `.hivemind/journal/*` and `.hivemind/state/tmux-sessions/*` writes are gitignored per R-P50-03 spirit | The P53 BATS pattern (slot 55) and P55 BATS pattern (slot 57) use `${BATS_TEST_TMPDIR}/project/.hivemind/journal/` for journal writes. BATS auto-cleans `BATS_TEST_TMPDIR` after each test, so journal files are not leaked across test runs. The `.hivemind/journal/*` and `.hivemind/state/tmux-sessions/*` paths are gitignored at the project root (per the existing `.gitignore` patterns for the canonical Q6 internal state root). Even if a stress-test run wrote to the project tree (which it does NOT — the BATS scenario uses `BATS_TEST_TMPDIR`), the writes would not be committed. R-P50-03 spirit: never committed, runtime state stays on local disk only. The same `tmux_bats_make_project` helper from P55 creates the project dir under `BATS_TEST_TMPDIR` — P56 reuses the helper additively. |
| **D-56-11** | Gate logic: 1/1 BATS scenario passes (all 6 sub-flows PASS) = stress test PASS. Partial failures (e.g., REQ-56-01..05 PASS but REQ-56-06 27-tool-key assertion FAILS) require specific gap remediation in a follow-up P57 phase | The P56 GATE is stricter than P55's: P55 allowed 3/4 = advance (per D-55-04), P56 requires 1/1 = advance. The rationale: P55 proved 4 criteria in isolation (each criterion's BATS is a self-contained scenario), so a partial pass is meaningful — 3 working criteria + 1 broken is a known state. P56 proves the system is coherent (6 sub-flows in one scenario), so a partial pass is NOT meaningful — if any sub-flow fails, the system is not coherent. A follow-up P57 gap-remediation phase would isolate the failing sub-flow, fix it (in `src/**` if it's a code bug, in `tests/**` if it's a test bug), and re-run the stress test. The 6 sub-flows are inseparable: the failure must be reproducible in isolation to be fixable. If a sub-flow is "intermittently failing" or "fails only when 3 sessions are alive", the gap is in the test infrastructure, not the code. |
| **D-56-12** | SPEC drift tracking: 56-SPEC.md is documentation-of-contract; source-of-truth is the actual `src/**` code. If `src/features/tmux/persistence.ts` or `src/tools/tmux-copilot.ts` evolves (e.g., a new `SessionState` member is added), 56-SPEC.md is NOT auto-amended. SPEC amendments are deferred to the next governance pass. | P51 SPEC/CONTEXT, P52 SPEC/CONTEXT, P53 SPEC/CONTEXT, P54 SPEC/CONTEXT, P55 SPEC/CONTEXT all reference the locked source-of-truth at the time of authoring. When a `src/**` file is modified in a later phase, the older SPEC.md files are NOT retroactively updated — the source-of-truth is the actual `src/**` code, and the SPEC.md is a snapshot of the contract at the time of authoring. P56 follows the same pattern: if P57+ modifies `src/features/tmux/persistence.ts` (e.g., adds a new `SessionState` member), 56-SPEC.md's REQ-56-05 is NOT auto-amended. The drift is detected via `tsc --noEmit` and the vitest regression — if the source code changes, the stress test scenario will fail to compile or the assertions will mismatch. The fix is then to amend 56-SPEC.md in a follow-up SPEC.md patch commit. This is a documented governance pattern (see P55 D-55-12 for the tool-keys list, which is also a snapshot of the P49 contract). |

## Open Questions

None. All 12 gray areas (BATS slot reservation, runtime budget, evidence format, atomic commit structure, helpers.bash extension scope, BATS timing tolerance, teardown pattern, isolation, real-OS-process vs mock, journal cleanup, GATE logic, SPEC drift tracking) are resolved by the SPEC and the decisions above. The 1 BATS scenario is deterministic, the 6 sub-flows are pre-scoped, the runtime budget is bounded, the L1+L2 evidence format is text-described (matches P55 precedent), the 2 atomic commits are pre-scoped.

## the agent's Discretion

The implementer has flexibility for the following implementation details (no SPEC constraint, no user preference captured):

- Exact JSDoc depth on the BATS file header (each BATS file has a header comment block explaining the scenario; depth is at implementer's discretion)
- Specific `run` / `assert_success` / `assert_failure` style within BATS — must follow the P53/P54/P55 BATS precedent (consistent style across the stress test)
- Test fixture data shape for BATS — the synthetic `PaneCapturedEvent` payloads (e.g., for REQ-56-04) can use any well-formed payload that satisfies the 4-field shape `{ sessionId, paneId, contentLength, timestamp }`
- Exact wording of `tmux new-session -d -s <name>` session names — the `BATS_TEST_NUMBER` (`$$`) + `e2e-test-{pid}-{i}` pattern is recommended for uniqueness, but any unique-name scheme satisfies the SPEC
- Order of `mkdir` + `writeFile` calls inside the BATS — the SPEC mandates `tmux_bats_make_project` first, then spawn tmux sessions, then run the test logic; the implementer may extract a `setup_sessions()` helper for DRY
- Whether to extract the 3-session spawn as a separate BATS function or inline it in the `@test` block — both satisfy the SPEC
- Whether the vitest regression in teardown captures full output or just the grep-filtered lines — the SPEC mandates the grep filter for L1 evidence, but full output may be captured as an L2 artifact
- Whether the `tmux_bats_require_stress_facilities` helper in `helpers.bash` is a separate function or inlined in the BATS file's `setup()` — both satisfy the SPEC
- Specific `grep -c` vs `[[ ... == *...* ]]` style for capture-pane content matching — must produce a stable exit code
- The text-described L2 evidence for `tmux list-sessions` and `ls -R .hivemind/journal/` — format as ASCII-art, structured markdown table, or a tree-style layout; all satisfy the L2 evidence requirement
- Whether the `56-STRESS-EVIDENCE-2026-06-03.md` uses H1/H2/H3 headers or a flat structure — must have one section per REQ, but nesting depth is flexible
- Whether the 6 sub-flows in the `@test` block are separated by `echo` banners, blank lines, or `step()` calls — all are readable; the implementer chooses

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/56-tmux-stress-test-real-world-workflow/56-SPEC.md` — Locked spec: 6 EARS requirements (REQ-56-01..06), ambiguity gate PASSED at 0.08 ≤ 0.20, 21 acceptance criteria, 27-tool-key invariant locked, real-OS process survival required, stress test runtime budget 60s
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-SPEC.md` — Prior-phase SPEC format reference (4 EARS, P55) — same EARS structure
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-CONTEXT.md` — Prior-phase CONTEXT format reference (12 decisions) — same 12-decision structure
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md` — Prior-phase L1+L2 evidence pattern (one section per criterion with L1 BATS output + L2 screenshot/journal + verdict)
- `.planning/phases/54-session-persistence-restart-recovery/54-SPEC.md` — Prior-phase SPEC format reference (5 EARS, P54)
- `.planning/phases/54-session-persistence-restart-recovery/54-CONTEXT.md` — Prior-phase CONTEXT format reference (12 decisions)
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-SPEC.md` — P53 SPEC: `createPaneMonitorHook` factory pattern
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-CONTEXT.md` — P53 CONTEXT: D-53-05 (backoff schedule), D-53-06 (rate cap), D-53-13 (schemaVersion drift fix)
- `.planning/phases/52-wire-tmux-copilot-state-query/52-CONTEXT.md` — P52 CONTEXT: D-04 (tool placement), tmux-copilot factory wiring
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-SPEC.md` — P51 SPEC: `SessionManager` 6-param constructor + `TrackedSession` 7-field interface

### Roadmap and Requirements
- `.planning/ROADMAP.md:2029-2038` — P56 phase entry with goal, 7 sub-flows, requirements (REQ-04, REQ-05, REQ-07), gate logic
- `.planning/REQUIREMENTS.md` — Requirement registry (P56 traces to REQ-04 Tmux Visual Orchestration, REQ-05 Co-pilot Model, REQ-07 Cqrs Boundary)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; `src/features/tmux/` is the feature layer (P51–P54 deliverables)
- `.planning/codebase/STRUCTURE.md` — File placement: `src/features/<feature>/<role>.ts` for feature modules
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read, no `any`

### Source Code (read-only references for P56 implementer)
- `src/features/tmux/grid-planner.ts` (P51, 148 LOC) — `PaneGridPlanner` class with `computeSplitSequence(root)` (DFS preorder, depth-based direction) and `requestLayout(root, onComputed)` (500ms debounce). REQ-56-02 BATS test target.
- `src/tools/tmux-copilot.ts` (P43 + P49 widening, 235 LOC) — 4-action tool: `send-keys`, `list-panes`, `compute-grid`, `respawn`. REQ-56-03 BATS test target.
- `src/tools/tmux-state-query.ts` (P52, 177 LOC) — 3-action read-only tool: `list-sessions`, `get-session`, `get-summary`. REQ-56-05 BATS test target.
- `src/features/tmux/session-manager.ts` (P51 + P54 additive, 332 LOC) — `SessionManager` class with 7-param constructor; `respawnIfKnown`, `sendKeys`, `listPanes`, `createPaneGridPlanner` adapter methods. REQ-56-01 + REQ-56-05 BATS test target.
- `src/features/tmux/persistence.ts` (P54, 400 LOC) — `createSessionPersistence` factory; `SessionPersistence` interface (4 public methods + `__stateRoot` test seam). REQ-56-05 BATS test target.
- `src/hooks/pane-monitor.ts` (P53, 490 LOC) — `createPaneMonitorHook` factory; `pane-captured` event consumer; journal file writer. REQ-56-04 BATS test target.
- `src/features/tmux/observers.ts` (P52) — `createTmuxEventObserver` with `onPaneCaptured(cb)` registration. REQ-56-04 BATS test target.
- `src/features/tmux/types.ts` (P51 + unchanged through P54) — `SessionManagerAdapter` interface (6 methods). 27-tool-key invariant locked.

### Test Targets
- `tests/scripts/tmux/helpers.bash` (P51–P55, 53 LOC) — BATS test infrastructure. **May be extended** to add `tmux_bats_require_stress_facilities` (D-56-03). Current helpers: `tmux_bats_require_dist` (6 dist checks), `tmux_node_eval` (Node ESM), `tmux_bats_make_project` (fresh project), path resolution via `TMUX_BATS_ROOT`.
- `tests/integration/hook-registration.test.ts` (P49, ~150 LOC) — vitest test asserting 27 tool keys via `expect(toolKeys.length).toBe(27)`. **REQ-56-06 re-execution target.**
- `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` (P53, 107 LOC) — Reference BATS for REQ-56-04 (same hook, same shape — P56 stress test uses 3 real tmux sessions, not 1 synthetic event).
- `tests/scripts/tmux/56-session-persistence-kill-restart.bats` (P54, 101 LOC) — Reference BATS for REQ-56-05 (same persistence module — P56 stress test uses 3 records, not 1).
- `tests/scripts/tmux/57-live-pane-monitoring.bats` (P55, 1 scenario) — Reference BATS for REQ-56-04 (real tmux session integration — P56 stress test combines with REQ-56-01, -02, -03, -05 in one scenario).
- `tests/scripts/tmux/58-orchestrator-intervention.bats` (P55, 1 scenario) — Reference BATS for REQ-56-03 (TmuxMultiplexer.sendKeys delivery — P56 stress test uses 3 sessions instead of 1).
- `tests/scripts/tmux/59-session-persistence-restart.bats` (P55, 2 scenarios) — Reference BATS for REQ-56-05 (persistence round-trip + kill-restart — P56 stress test uses 3 records + state-query).
- `tests/scripts/tmux/60-visual-dependency-graph.bats` (P55, 1 scenario) — Reference BATS for REQ-56-02 (DFS grid layout — P56 stress test uses a 3-node tree instead of 5-node).
- `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` — **NEW FILE** (REQ-56-01..06, slot 61)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC, no `any`
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51, preserved through P56) — Graceful-fallback contract: no throw on missing prerequisites or filesystem errors
- R-P50-03 (spirit) — `.hivemind/{journal,state/tmux-sessions}/*` is local runtime state, never committed
- P20 invariant — No new `package.json` dependencies
- 27-tool-key invariant — No new tool registrations (P49 lock; P56 REQ-56-06 re-asserts via vitest regression in teardown)
- `.planning/AGENTS.md` §7 — CP-PTY runway note: P56 adds 1 BATS file to `tests/scripts/tmux/` and ~10 LOC to `helpers.bash` (optional) — both are `tests/**` additions, NOT `src/**` mutations. CP-PTY-00 docs/spec-only phase can land later without conflict.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/scripts/tmux/helpers.bash`** (P51–P55, 53 LOC) — BATS test infrastructure: `tmux_bats_require_dist` (skip if 6 dist files missing), `tmux_node_eval <js>` (Node ESM with `node --input-type=module -e`), `tmux_bats_make_project` (fresh project under BATS_TEST_TMPDIR), path resolution via `TMUX_BATS_ROOT`. P56 EXTENDS the helper additively (D-56-03).
- **`tests/scripts/tmux/{55,56,57,58,59,60}-*.bats`** (P53–P55) — Reference BATS for each REQ. P56 stress test combines all 4 P55 REQs into one scenario with a 6th REQ for 27-tool-key vitest regression.
- **`src/features/tmux/grid-planner.ts:PaneGridPlanner.computeSplitSequence`** (P51) — Pure function; deterministic; no I/O. The BATS test asserts the SplitCommand sequence + applies it to a real tmux session via `tmux split-window`.
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (P43 + P49) — 4-action tool; permission-gated to orchestrator-tier agents. The BATS test bypasses the permission gate by calling the underlying `adapter.sendKeys(paneId, text, literal)` directly (the BATS test simulates the permission-granted path).
- **`src/hooks/pane-monitor.ts:createPaneMonitorHook`** (P53) — Closure-captured state, `dispose()` teardown, no-throw error handling, `logWarn` fallback. P56 BATS uses the same factory with a real P52 `createTmuxEventObserver` and 3 real `pane-captured` events (one per session).
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (P54) — 4 public methods, 1 read-only test seam. P56 BATS uses `persist`, `restoreAll`, and `__stateRoot` test seam with 3 records.
- **`tests/integration/hook-registration.test.ts`** (P49) — vitest test asserting 27 tool keys. P56 BATS re-executes this test in teardown (REQ-56-06).

### Established Patterns
- **BATS file structure** (`tests/scripts/tmux/*.bats`) — Header comment (1-2 lines: filename + phase + REQ acceptance summary), `load "helpers"`, `setup()` block with `tmux_bats_require_dist` + `tmux_bats_make_project`, `@test "..."` blocks with `run` + `assert_success` + `jq` assertions, `teardown()` block with `tmux kill-session` cleanup.
- **BATS variable interpolation in `tmux_node_eval`** — Use single-quoted script with `${variable}` interpolation, then escape with `'\''` for nested single quotes. The P53/P54/P55 BATS files demonstrate the pattern (e.g., `run tmux_node_eval "import('${TMUX_BATS_ROOT}/dist/...').then(async (...) => { ... })"`).
- **`assert_success` vs `[ "$status" -eq 0 ]`** — P53/P54/P55 BATS files use both styles. The `[ "$status" -eq 0 ]` form is more explicit; the `assert_success` form is more concise. P56 stress test can use either; consistency across the 6 sub-flows is required.
- **BATS `run` + `[[ "$output" == *...* ]]`** — The substring match pattern. P55 BATS uses `[[ "$output" == *"split_count=4"* ]]` to check the `tmux_node_eval` stdout for a marker string. P56 stress test follows the same pattern (e.g., `[[ "$output" == *"journal_count=3"* ]]` for REQ-56-04).
- **`BATS_TEST_TMPDIR` isolation** — Each BATS test gets a fresh temp dir auto-cleaned after the test. The `tmux_bats_make_project` helper creates `${BATS_TEST_TMPDIR}/project/`. P56 stress test creates subdirs for journal + persistence writes inside this project dir.
- **Multi-session BATS pattern** — P55 BATS files use a single tmux session per scenario. P56 stress test uses 3-4 sessions in a single scenario — the session-name pattern `e2e-test-{pid}-{i}` ensures uniqueness and teardown kills them all.

### Integration Points
- **`tests/scripts/tmux/helpers.bash:tmux_bats_require_dist`** — P56 EXECUTE may add 1-3 lines to require external binaries (`tmux`, `node`, `git`) via a NEW helper `tmux_bats_require_stress_facilities` (D-56-03). The P56 EXECUTE is the first phase to require external binaries beyond the dist artifacts.
- **`src/features/tmux/grid-planner.ts:PaneGridPlanner.computeSplitSequence`** (REQ-56-02) — BATS test imports the class directly: `const { PaneGridPlanner } = await import('${TMUX_BATS_ROOT}/dist/features/tmux/grid-planner.js')` + `new PaneGridPlanner(0).computeSplitSequence(tree)`.
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (REQ-56-03) — BATS test uses the underlying adapter (`getSessionManagerAdapter()` from `dist/features/tmux/types.js`) rather than invoking the tool directly (the tool has a permission gate that requires an orchestrator-tier context, which the BATS does not provide). The adapter's `sendKeys(paneId, text, literal)` is the actual delivery mechanism.
- **`src/hooks/pane-monitor.ts:createPaneMonitorHook`** (REQ-56-04) — BATS test imports the hook factory and registers it with a P52 `createTmuxEventObserver`. The observer is invoked with 3 real `PaneCapturedEvent` payloads (synthesized by the BATS, but representing real tmux pane captures from 3 live sessions).
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (REQ-56-05) — BATS test imports the factory, calls `persist({ state: "ready", ... })` 3 times (one per session), simulates a fresh-harness-process restart by running `tmux_node_eval` in a new process that calls `persistence.restoreAll()`.
- **`src/tools/tmux-state-query.ts:tmuxStateQueryTool`** (REQ-56-05) — BATS test uses the underlying adapter (`getSessionManagerAdapter()` from `dist/features/tmux/types.js`) to call the `listPanes` / `getMainPaneId` / etc. methods that the state-query tool invokes. The BATS test does NOT invoke the tool directly (permission gate); it exercises the same adapter methods the tool uses.
- **`tests/integration/hook-registration.test.ts`** (REQ-56-06) — vitest test that P56 EXECUTE re-runs in the BATS teardown. The full vitest output is captured in the L1 evidence; the grep-filtered output is asserted in the teardown.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC — open to standard approaches. The 12 decisions above resolve all gray areas surfaced during discuss-phase. The implementer follows well-established patterns from P52/P53/P54/P55 BATS files and the P51 `helpers.bash` infrastructure. The 1 P56 BATS file is deterministic (no I/O randomness, no timing races beyond the explicit tolerance windows in D-55-08 and D-56-06's 60s budget). The UAT report follows the 1-section-per-REQ structure with L1 + L2 + verdict per section. The 2 atomic commits are pre-scoped.

</specifics>

<deferred>
## Deferred Ideas

- **P57 retry phase (if stress test GATE fails)** — Not authored yet. If the GATE evaluation results in 0/1 (the stress test scenario fails), the P56 EXECUTE writes a `56-CLOSE-PARTIAL.md` documenting the failing sub-flows and the operator decision. A future P57 phase would then author fix-up code in `src/**` (if the bug is in the code) or `tests/**` (if the bug is in the test) and re-run the stress test.
- **Distributed stress test across multiple machines** — P56 is a single-host stress test. A future phase could spawn 3+ tmux servers on different machines and exercise cross-machine orchestration. P56 leaves this for downstream scope.
- **Persistent stress test daemon (long-running)** — P56 is a one-shot BATS scenario. A future phase could add a `bin/stress-test-daemon.cjs` that runs the 6 sub-flows in a loop and reports metrics. P56 does not add telemetry.
- **Stress test runtime profiling** — No tracking of how long each sub-flow takes, memory usage, GC pressure, etc. P56 leaves runtime profiling to a future observability phase.
- **Stress test failure-injection** — P56 exercises the happy path only (3 sessions alive, no failures). A future phase could add chaos-engineering scenarios (random `kill -9` mid-test, disk-full errors, tmux server restart mid-test). P56 leaves this to a future resilience phase.
- **Multi-tool stress test (e.g., 5 sessions, 10 sessions, 100 sessions)** — P56 is fixed at 3 sessions (the minimum required by ROADMAP L2031). A future phase could add `bin/stress-test-scale.cjs` that spawns N sessions and measures throughput. P56 leaves scaling to a future load-test phase.
- **CI integration of the P56 BATS file** — The P56 BATS file is runnable via `bats --jobs 1 tests/scripts/tmux/61-stress-test-real-world-workflow.bats` but is not yet wired into `.github/workflows/ci.yml` (P56 EXECUTE does NOT mutate the CI workflow). A future phase could add a `tmux-stress-test` CI job that runs the BATS + captures the L1 evidence.
- **Telemetry / metrics on P56 BATS runtime** — No tracking of how long the stress test takes, how often it flakes, etc. P56 leaves telemetry to a future phase.

</deferred>

---

*Phase: 56-tmux-stress-test-real-world-workflow*
*Context gathered: 2026-06-03*
*Checkpoint 5 (CONTEXT & ASSUMPTIONS) complete — 12 decisions locked, ready for Checkpoint 6 (RESEARCH) or Checkpoint 7 (PATTERNS)*
*Next checkpoint: CP7 (PATTERNS) — generate `56-PATTERNS.md` for the BATS test patterns and L1+L2 evidence format before planning.*
