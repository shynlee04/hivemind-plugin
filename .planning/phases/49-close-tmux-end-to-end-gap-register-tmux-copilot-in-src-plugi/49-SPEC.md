# Phase 49: Tmux E2E Completion — Specification

**Created:** 2026-06-01
**Ambiguity score:** 0.18 (gate: ≤ 0.20)
**Requirements:** 7 locked

## Goal

Close the runtime gap for tmux end-to-end: register the existing `tmux-copilot` tool in `src/plugin.ts`, replace the `buildNoopForkSessionManager()` no-op with real adapter wiring via the fork-bridge, wire co-pilot intervention entry points, add BATS to the CI workflow, run the BATS suite, and close paperwork gaps (P42 VERIFICATION.md + UAT.md, P45 45-01 SUMMARY.md).

## Background

**P42 (fork extension) delivered:**
- Fork `opencode-tmux` → `@hivemind/opencode-tmux` with copilot config
- `src/features/tmux/` module — integration factory, port persistence, version detection
- Event observer pattern for `session.created` enrichment with `hivemindMeta`
- Wired via `createTmuxIntegrationIfSupported()` at `src/plugin.ts:408`
- Observer registered at `src/plugin.ts:594-595` with a **no-op** `ForkSessionManager`

**P43 (co-pilot model) delivered:**
- `src/tools/tmux-copilot.ts` — 189 LOC, 4 actions (send-keys, list-panes, compute-grid, respawn), Zod discriminated union, orchestrator-tier permission gate, graceful `fork-not-wired` fallback
- `src/features/tmux/fork-bridge.ts` — opaque singleton adapter bridge (`setForkSessionManager`/`getForkSessionManager`), structural typing (no compile-time fork import)
- `src/features/tmux/observers.ts` — event observer factory with enrichment
- `src/features/tmux/integration.ts` — factory accepts optional `forkSessionManager` adapter
- `buildNoopForkSessionManager()` at `src/plugin.ts:215` — retains no-op behavior for builds without the fork package

**P45 (vendor sync script) delivered:**
- `scripts/sync-fork.sh` — bash sync script with pinned-file conflict detection
- `tests/scripts/sync-fork.bats` — 3-scenario BATS test suite (210 LOC)

**What exists today (gaps):**

| Gap | Current State | Target |
|-----|---------------|--------|
| Tool registration | `tmuxCopilotTool` NOT listed in `src/plugin.ts` tool array — agents cannot call it | Tool registered and agent-discoverable |
| SessionManager wiring | Observer at L594-595 hardcodes `buildNoopForkSessionManager()` — no live adapter path through the bridge | Observer uses `getForkSessionManager()` at runtime, falling back to noop when bridge unwired |
| Co-pilot wiring | `createTmuxIntegrationIfSupported()` called without `forkSessionManager` arg at L408 | Co-pilot adapter injected when the fork is available |
| BATS in CI | `.github/workflows/ci.yml` has no BATS step — `tests/scripts/sync-fork.bats` never runs in CI | BATS suite executes in CI pipeline (single matrix node, bats-core installed) |
| P42 paperwork | No `VERIFICATION.md` or `UAT.md` in `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/` | Both documents written and committed |
| P45 paperwork | `45-01-SUMMARY.md` missing — only `45-02-SUMMARY.md` exists | Summary written for plan 45-01 |
| P43 re-verification | REQ-05 (runtime-injection boundary) needs stricter verification per ROADMAP | GSD verify-work passes with stricter REQ-05 check |

## Requirements

1. **Register `tmuxCopilotTool` in `src/plugin.ts`**: Import and register the existing tool so orchestrator agents can discover and invoke it.
   - Current: `tmuxCopilotTool` is defined at `src/tools/tmux-copilot.ts` but never imported or added to the tool registry in `src/plugin.ts`
   - Target: `import { tmuxCopilotTool } from "./tools/tmux-copilot.js"` exists in `src/plugin.ts`; the tool is added to the exported tools array (or equivalent registration point)
   - Acceptance: After the change, `grep -c "tmuxCopilot" src/plugin.ts` returns ≥2 (import + registration); TypeScript compiles without errors; the tool appears in the tool surface visible to agents

2. **Replace build-time noop with runtime bridge lookup**: The event observer must use `getForkSessionManager()` at runtime instead of a compile-time-constructed noop, so the adapter can be swapped via `setForkSessionManager()` without recompilation.
   - Current: `src/plugin.ts:594-595` passes `buildNoopForkSessionManager()` as a compile-time argument to `createTmuxEventObserver()`
   - Target: The observer at the wiring point reads from the fork-bridge at runtime (`getForkSessionManager()`), defaulting to noop behavior when the bridge returns `null`
   - Acceptance: The noop factory at `src/plugin.ts:215` is either removed entirely or kept only as a fallback; the observer wiring no longer passes a compile-time adapter; TypeScript compiles cleanly; when no adapter is registered, the tool still returns `{available: false, reason: "fork-not-wired"}`

3. **Wire co-pilot adapter injection at bootstrap**: When the fork package `@hivemind/opencode-tmux` is present and tmux is available, the co-pilot adapter (ForkSessionManagerAdapter) must be injected into the fork-bridge so the `tmux-copilot` tool can dispatch real tmux commands.
   - Current: `createTmuxIntegrationIfSupported()` at `src/plugin.ts:408` is called without a `forkSessionManager` argument — the bridge stays null
   - Target: A wiring path exists such that when the fork plugin is loaded, it calls `createTmuxIntegrationIfSupported(projectDir, adapter)` to register a real adapter — OR the integration factory itself detects the vendored fork code and constructs a minimal adapter
   - Acceptance: After wiring, when `@hivemind/opencode-tmux` is present, `getForkSessionManager()` returns a non-null adapter; `tmux-copilot` tools can dispatch actions; when the fork is absent, behavior remains unchanged (returns `fork-not-wired`)

4. **Add BATS to CI workflow**: Add a `bats` job or step to `.github/workflows/ci.yml` that runs the existing `tests/scripts/sync-fork.bats` suite.
   - Current: `.github/workflows/ci.yml` has no BATS installation or execution
   - Target: CI workflow includes a step to install `bats` (`npm install -g bats` or `apt-get install bats`) and runs `bats tests/scripts/sync-fork.bats` on a single Node.js matrix node (e.g., node-version 22)
   - Acceptance: CI job succeeds when all BATS tests pass (3 scenarios); if BATS is unavailable, the step is skipped with a warning rather than failing the pipeline

5. **Write P42 VERIFICATION.md and UAT.md**: Create the missing verification and UAT artifacts for Phase 42.
   - Current: No VERIFICATION.md or UAT.md exists in `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/`
   - Target: Both files exist with content matching Phase 42's 5 requirements (fork extension, metadata titles, plugin integration, auto-init, graceful degradation)
   - Acceptance: Both files exist at the expected paths; VERIFICATION.md has ≥5 requirement entries with pass/fail evidence; UAT.md has ≥3 test scenarios matching P42 SPEC requirements

6. **Write P45 45-01 SUMMARY.md**: Create the missing plan summary for Phase 45 plan 01.
   - Current: Only `45-02-SUMMARY.md` exists; no `45-01-SUMMARY.md` in the Phase 45 directory
   - Target: Summary document exists documenting plan 45-01 outcomes (scripts/sync-fork.sh creation, pinned-file conflict detection)
   - Acceptance: File exists at `.planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md` with documented deliverables and verification status

7. **gsd-verify-work for P43 with stricter REQ-05**: Run the verification workflow for Phase 43 with a stricter check on REQ-05 (runtime-injection boundary), ensuring the bridge pattern is complete and the observer wiring is correct.
   - Current: P43 VERIFICATION.md exists with all 6 REQs verified, but the observer still has a noop adapter (this was intentional at P43 time but now needs closure)
   - Target: `gsd-verify-work` passes for P43 with the additional constraint that REQ-05's observer wiring is validated against the updated runtime-bridge lookup pattern
   - Acceptance: Verification output shows all P43 requirements (including REQ-05) passing with the updated wiring; any gaps found are documented and addressed

## Boundaries

**In scope:**
- `src/plugin.ts` modifications: import + register `tmuxCopilotTool`, update observer wiring to use runtime bridge lookup
- `src/features/tmux/` modifications: any needed adapter wiring entry points
- `.github/workflows/ci.yml` modification: add BATS job/step
- Phase 42 paperwork: VERIFICATION.md + UAT.md (retrospective — documents what was already delivered)
- Phase 45 paperwork: 45-01-SUMMARY.md (retrospective — documents plan 01 outcomes)
- P43 re-verification: stricter REQ-05 verification with updated wiring
- BATS suite execution: run existing `tests/scripts/sync-fork.bats` and capture pass/fail evidence

**Out of scope:**
- Fork code modifications (opencode-tmux/) — the vendored fork is not changed in this phase
- New tmux-copilot tool actions — only registration of existing 4 actions
- Phase 44 features (visual dependency graph, session-tracker replay) — separate phase
- Phase 46/47/48 (build pipeline, docs, CI/CD release) — separate phases
- Modifying the fork-bridge interface — adding new methods to ForkSessionManager is out of scope
- Creating new BATS test scenarios — only running the existing suite
- Adding BATS coverage for tmux-copilot tool — shell-testing Hivemind TypeScript tools is out of scope

## Constraints

- **Bridge pattern preserved**: Hivemind must NOT directly `import` any TypeScript/JavaScript from `opencode-tmux/` — the fork-bridge's structural typing pattern (no compile-time coupling) must be preserved
- **No new test infrastructure**: BATS must be installed via existing package manager (`apt`, `brew`, or `npm`) — no custom test harness
- **Backward compatibility**: When the fork package is absent, all Hivemind behavior must remain unchanged — `tmux-copilot` returns `{available: false, reason: "fork-not-wired"}`, delegation continues normally
- **Atomic commits**: Each requirement should be a separate commit (tool registration, bridge wiring, CI change, each paperwork artifact)
- **BATS in CI only on Linux**: BATS suite runs on Linux CI only (Node 22 matrix node); macOS and Windows nodes skip

## Acceptance Criteria

- [ ] `tmuxCopilotTool` is imported and registered in `src/plugin.ts` — TypeScript compiles without errors
- [ ] Event observer wiring in `src/plugin.ts` uses runtime `getForkSessionManager()` lookup instead of compile-time noop — verified by grep
- [ ] When `getForkSessionManager()` returns `null`, the `tmux-copilot` tool returns `{available: false, reason: "fork-not-wired"}` — existing tests pass
- [ ] `.github/workflows/ci.yml` has a BATS step that installs `bats` and runs `tests/scripts/sync-fork.bats`
- [ ] CI BATS suite passes 3/3 scenarios — verified by manual run or CI dry-run
- [ ] `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/VERIFICATION.md` exists — documents P42's 5 requirements with pass/fail evidence
- [ ] `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` exists — documents P42 UAT scenarios
- [ ] `.planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md` exists — documents plan 01 outcomes
- [ ] P43 re-verification passes with REQ-05 updated to verify runtime bridge wiring — document in P43 VERIFICATION.md
- [ ] `npm run typecheck` exits 0 (no type errors)
- [ ] `npm test` passes (existing 2900+ test suite)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                |
|--------------------|-------|------|--------|--------------------------------------|
| Goal Clarity       | 0.88  | 0.75 | ✓      | 7 plans from ROADMAP are clear       |
| Boundary Clarity   | 0.80  | 0.70 | ✓      | Bridge pattern preservation locked   |
| Constraint Clarity | 0.75  | 0.65 | ✓      | No fork imports, backward compat     |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 11 pass/fail criteria                |
| **Ambiguity**      | 0.18  | ≤0.20| ✓      | Gate passed                          |

## Interview Log

| Round | Perspective     | Question summary                                       | Decision locked                                    |
|-------|-----------------|-------------------------------------------------------|----------------------------------------------------|
| 1     | Researcher      | What exists today across P42/P43/P45?                 | tmux-copilot.ts exists but unregistered; bridge exists but unwired; BATS exists but not in CI; 3 paperwork gaps identified |
| 2     | Researcher      | What's the delta for each gap?                        | Tool registration (~5 LOC), bridge wiring (observer refactor), CI step (~3 LOC), 3 paperwork files |
| 3     | Simplifier      | What's the irreducible core?                          | Register tool + wire bridge + run BATS + close paperwork — co-pilot adapter injection is a stretch goal |
| 4     | Boundary Keeper | What explicitly will NOT be done?                     | No fork code changes, no new tool actions, no Phase 44 features |
| 5     | Failure Analyst | What breaks if bridge wiring is wrong?                | Tool returns `fork-not-wired` — graceful degradation is correct; real failure is silent errors |
| 6     | Seed Closer     | What makes REQ-02 acceptance unambiguous?             | Observer uses `getForkSessionManager()` at runtime, not compile-time noop |

---

*Phase: 49-close-tmux-end-to-end-gap*
*Spec created: 2026-06-01*
*Next step: /gsd-discuss-phase 49 — implementation decisions (how to build what's specified above)*
