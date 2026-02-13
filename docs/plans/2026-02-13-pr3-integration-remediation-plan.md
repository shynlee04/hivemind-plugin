# PR #3 Integration Remediation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the PR #3 integration to production-grade quality for OpenCode ecosystem workflows (install/init/scan/dashboard/governance) across first-time and existing users, with complete EN/VI UX and brownfield reliability.

**Architecture:** Fix correctness regressions first (compile/test/release blockers), then ship ecosystem integration as explicit modules: asset sync, framework detection, brownfield orchestration, and dashboard observability. Add contract tests per integration entry point (CLI, slash command artifacts, hooks, and config persistence) before behavior expansion.

**Tech Stack:** TypeScript (NodeNext), @opencode-ai/plugin, @clack/prompts, tsx tests, existing HiveMind hooks/tools.

---

## Plan Fusion (Your Added Plan + Existing Plan)

### Accepted Now (Batch 1)

1. Create proper `.opencode` sync flow for existing and first-time users.
2. Add project/global path-awareness and explicit target strategy.
3. Extend ecosystem asset groups (`commands`, `skills`, plus optional `agents`, `workflows`, `templates`, `prompts`, `references` when packaged).
4. Add full test coverage for sync/idempotency/no-clobber behavior.
5. Keep strict verification gate (`typecheck`, tests, build, pack dry-run).

### Partially Accepted (Scheduled Later in This Plan)

1. Brownfield scan/orchestration expansion (framework detection + automation phases).
2. YAML/script orchestration pipeline (high value, but high blast radius; phase after core sync reliability).
3. Dashboard expansion for all ecosystem modules.

### Rejected / Not Needed

1. Re-adding "missing tools" as separate tools (`check_drift`, `self_rate`, `list_shelves`, `hierarchy_prune`, `hierarchy_migrate`) because this branch intentionally merged them into unified tools (`scan_hierarchy`, `recall_mems`, `hierarchy_manage`) for HC3.
2. "Register 5th hook" task is already completed on current `HEAD` (`event` hook exists in `src/index.ts`).

### Current Baseline (as of current HEAD, before this execution batch)

1. Parser regression from PR #3 is fixed.
2. Test suite and typecheck currently pass.
3. Main remaining gap: OpenCode ecosystem sync path for old and new users (including path strategy and full asset grouping).

---

## Execution Status (2026-02-13 Batch 1)

### Completed

1. Merged both plans into a single prioritized roadmap (with accepted/rejected scope).
2. Added TDD coverage for asset sync behavior:
   - project target default
   - global target
   - both targets
   - no-clobber default
   - overwrite mode
   - init + re-init refresh integration
3. Implemented `sync-assets` subsystem and CLI command.
4. Added `--target` and `--overwrite` flag support to init/sync flows.
5. Enabled existing-user refresh path: re-running `init` now syncs missing OpenCode assets without resetting `.hivemind`.
6. Updated README and CLI help docs.
7. Verification passed:
   - `npm run typecheck`
   - `npm test` (45/45 pass)
   - `npm run build`
   - `npm pack --dry-run`
   - `npm pack --dry-run`

### Next Batch

1. Expand packaged ecosystem groups (`agents`, `workflows`, `templates`, `prompts`, `references`) with format validation.
2. Brownfield scan/orchestration hardening (`scan --action analyze|recommend|orchestrate`).
3. EN/VI terminology hardening and legacy migration shim for renamed automation mode.

---

## Execution Status (2026-02-13 Batch 2)

### Completed

1. Added asset validation layer in `sync-assets`:
   - `commands`: markdown + frontmatter required
   - `skills`: `SKILL.md` required
2. Added invalid-asset accounting in sync reports (`invalid` per group, `totalInvalid` global).
3. Added `sourceRootDir` test harness override to enable deterministic validation tests.
4. Added tests for optional ecosystem group syncing when packaged (`agents`, `workflows`, `templates`, `prompts`, `references`).
5. Updated CLI sync summary to include invalid counts.
6. Verification passed:
   - `npm run typecheck`
   - `npm test` (45/45 pass)
   - `npm run build`

### Next Batch

1. Brownfield scan/orchestration hardening (`scan --action analyze|recommend|orchestrate`).
2. EN/VI terminology hardening and legacy migration shim for renamed automation mode.
3. Optional: package and ship concrete starter assets for `agents/workflows/prompts/templates/references`.

---

## Execution Status (2026-02-13 Batch 3)

### Completed

1. Finished EN/VI terminology hardening for automation level UX:
   - user-facing mode label switched to `coach`
   - retained legacy alias compatibility for `retard` inputs
2. Added strict compatibility helpers in config schema:
   - `isCoachAutomation(level)`
   - `normalizeAutomationLabel(level)`
3. Completed CLI hardening:
   - help text and flags now document `coach` with legacy alias note
   - status/settings output now normalizes legacy values to `coach`
4. Completed hook and dashboard hardening:
   - first-run guidance updated to `coach` terminology
   - argument-back automation logic now uses compatibility helper
   - dashboard strings and snapshot fields migrated to `coach` profile naming
5. Updated README to align with inclusive terminology and compatibility note.
6. Updated tests for new terminology + migration behavior:
   - coverage includes legacy alias acceptance and init-time normalization.
7. Verification passed:
   - `npm run typecheck`
   - `npm test` (45/45 pass)
   - `npm run build`

### Next Batch

1. Brownfield scan/orchestration hardening (`scan --action analyze|recommend|orchestrate`).
2. Package and ship concrete starter ecosystem assets for optional groups (`agents/workflows/templates/prompts/references`).
3. Expand README/runbook coverage for brownfield flow and legacy-user migration path.

---

## Execution Status (2026-02-13 Batch 4)

### Completed

1. Implemented brownfield scan action pipeline in `scan_hierarchy`:
   - `action: "analyze"` detects framework mode (`gsd/spec-kit/both/none`), BMAD signals, stack hints, stale-context signals.
   - `action: "recommend"` emits remediation runbook with lifecycle command sequence.
   - `action: "orchestrate"` performs safe non-destructive bootstrap (anchors + project-intel memory baseline).
2. Added reusable scan core in `src/lib/project-scan.ts` and exported via `src/lib/index.ts`.
3. Added TDD coverage for new scan actions:
   - `tests/scan-actions.test.ts` validates analyze/recommend/orchestrate behavior and persisted artifacts.
4. Packaged real optional OpenCode ecosystem starter assets:
   - `agents/hivemind-brownfield-orchestrator.md`
   - `workflows/hivemind-brownfield-bootstrap.yaml`
   - `templates/hivemind-brownfield-session.md`
   - `prompts/hivemind-brownfield-remediation.md`
   - `references/hivemind-brownfield-checklist.md`
5. Added package distribution coverage for new asset groups in `package.json`.
6. Strengthened sync validation rules for optional groups in `src/cli/sync-assets.ts`.
7. Added sync coverage for packaged optional assets in `tests/sync-assets.test.ts`.
8. Updated command contracts and docs:
   - `commands/hivemind-scan.md`
   - `commands/hivemind-status.md`
   - `commands/hivemind-compact.md`
   - `README.md` (brownfield runbook, existing-user upgrade path, optional ecosystem asset docs).
9. Verification passed:
   - `npm run typecheck`
   - `npm test` (46/46 pass)
   - `npm run build`
   - `npm pack --dry-run`

### Next Batch

1. Optional: add CLI `scan` wrapper command for users who want brownfield analysis outside OpenCode tool calls.
2. Optional: add stronger schema validation for packaged workflow/agent files (beyond extension checks).
3. Optional: expand Vietnamese section with explicit brownfield runbook parity text.

---

## Execution Status (2026-02-13 Batch 5)

### Completed

1. Completed all three optional Batch 4 follow-ups:
   - Added CLI `scan` wrapper command (`src/cli/scan.ts`, `src/cli.ts`).
   - Strengthened schema validation for optional ecosystem groups in sync pipeline (`src/cli/sync-assets.ts`).
   - Added Vietnamese brownfield runbook parity content in `README.md`.
2. Added and updated test coverage for new behavior:
   - `tests/cli-scan.test.ts`
   - `tests/sync-assets.test.ts` (schema-validation cases)
3. Verification gate passed in strict sequential order:
   - `npm run typecheck`
   - `npm test` (`47/47` pass)
   - `npm run build`
   - `npm pack --dry-run` (tarball includes `dist/` and optional ecosystem assets)
4. Practical real-world scenario matrix executed in isolated temp projects:
   - install from packed tarball + first-run init
   - EN + VI initialization coverage
   - existing-user re-init refresh + sync idempotency/no-clobber + overwrite path
   - brownfield `scan` (`analyze`/`recommend`/`orchestrate`) pre-init guard + post-init orchestration
   - global vs project `.opencode` targeting via `XDG_CONFIG_HOME`
5. Dashboard runtime integrity validated:
   - confirmed graceful fallback message when `ink/react` are not installed
   - installed `ink/react` in isolated temp project and verified TUI launch/render loop
   - fixed runtime React warning by adding stable keyed `Panel` elements in `src/dashboard/server.ts`
6. Practical matrix result: `25` pass / `0` fail (plus dashboard runtime checks above).

### Practical Matrix Checklist

1. Fresh install + init creates `.hivemind` and project `.opencode` assets.
2. Vietnamese strict/coach setup persists expected config and lock posture.
3. Existing-user refresh restores missing assets without clobber by default.
4. `sync-assets --overwrite` correctly replaces user-modified packaged files.
5. `scan --action orchestrate --json` blocks before init and returns guard code.
6. Brownfield detect/recommend flow surfaces framework conflict and lifecycle runbook.
7. Post-init orchestrate persists anchors + project-intel memory artifacts.
8. Global target writes to `${XDG_CONFIG_HOME}/opencode` without forcing project `.opencode`.
9. `--target both` populates both project and global OpenCode asset roots.
10. Dashboard behavior is safe in both dependency states (instructional fallback without deps, live TUI with deps).

### Plan Completion Assessment

1. Core integration scope from this remediation plan is complete for production-readiness checks implemented in-repo.
2. Real-life CLI and packaging paths are now validated in addition to test harnesses.
3. Remaining risk is ecosystem-runtime variability outside this repo (OpenCode host versions and external plugin interactions), which requires matrix validation in downstream environments.

---

### Task 1: Lock Baseline and Repro Matrix

**Files:**
- Create: `docs/verification/2026-02-13-pr3-baseline.md`
- Test: `tests/*.test.ts`

**Step 1: Capture merged-PR baseline in isolated worktree**
Run: `git worktree add /tmp/hm-pr3-review ef45569`
Expected: Detached worktree created at merge commit.

**Step 2: Record failing quality gates**
Run: `cd /tmp/hm-pr3-review && npm ci && npm run typecheck && npm test`
Expected: `typecheck` fails in `src/hooks/tool-gate.ts`; 5 test files fail from transform error.

**Step 3: Save evidence document**
Write exact failing commands, stack traces, and failing test list to `docs/verification/2026-02-13-pr3-baseline.md`.

**Step 4: Commit evidence only**
Run:
```bash
git add docs/verification/2026-02-13-pr3-baseline.md
git commit -m "docs: capture PR3 baseline failures and repro matrix"
```

### Task 2: Fix Gate-Breaking Parser Regression

**Files:**
- Modify: `src/hooks/tool-gate.ts`
- Test: `tests/tool-gate.test.ts`

**Step 1: Write failing regression test for framework advisory branch**
Add a test case in `tests/tool-gate.test.ts` that enters framework conflict path and asserts advisory return.

**Step 2: Run targeted test and verify fail**
Run: `npx tsx --test tests/tool-gate.test.ts`
Expected: Fails before fix (compile/transform error).

**Step 3: Repair malformed branch logic**
Replace broken branch with a single advisory return path and remove dead `CONFLICT_SAFE_TOOLS` usage.

**Step 4: Re-run targeted test**
Run: `npx tsx --test tests/tool-gate.test.ts`
Expected: PASS.

**Step 5: Re-run typecheck**
Run: `npm run typecheck`
Expected: PASS.

**Step 6: Commit fix**
```bash
git add src/hooks/tool-gate.ts tests/tool-gate.test.ts
git commit -m "fix(tool-gate): repair framework advisory branch and restore compile integrity"
```

### Task 3: Remove Non-Source Artifacts from Repository Flow

**Files:**
- Delete: `test_debug.txt`
- Delete: `test_output.txt`
- Delete: `test_output_2.txt`
- Modify: `.gitignore`

**Step 1: Add ignore patterns for ad-hoc logs**
Add patterns for root-level `test_output*.txt` and debug transcripts.

**Step 2: Delete tracked debug artifacts**
Remove the three files from source control.

**Step 3: Verify clean status**
Run: `git status --short`
Expected: only intended removals/ignore changes.

**Step 4: Commit cleanup**
```bash
git add .gitignore
git rm test_debug.txt test_output.txt test_output_2.txt
git commit -m "chore(repo): remove committed test output artifacts"
```

### Task 4: Existing-User Asset Sync Path (No Re-init Required)

**Files:**
- Modify: `src/cli/init.ts`
- Create: `src/cli/sync-assets.ts`
- Modify: `src/cli.ts`
- Test: `tests/entry-chain.test.ts`
- Test: `tests/integration.test.ts`

**Step 1: Add `sync-assets` command for existing installs**
Implement explicit CLI command to sync OpenCode assets without resetting `.hivemind` state.

**Step 2: Refactor asset extraction into reusable function**
Move extraction logic into `src/cli/sync-assets.ts` and call from both fresh init and sync command.

**Step 3: Add idempotency + no-clobber behavior**
Default behavior: preserve user-edited local files unless `--overwrite` flag is provided.

**Step 4: Add tests for old-user upgrade path**
Test scenario: initialized legacy project runs `hivemind sync-assets` and receives missing assets.

**Step 5: Validate command help output**
Run: `node dist/cli.js help`
Expected: new command documented.

**Batch Priority:** P0 (execute first)

### Task 5: OpenCode Ecosystem Coverage Expansion

**Files:**
- Modify: `src/cli/sync-assets.ts`
- Create: `templates/opencode/*` (if needed)
- Modify: `README.md`
- Test: `tests/integration.test.ts`

**Step 1: Add asset groups beyond commands/skills**
Support sync for: `agents`, `prompts`, `templates`, `workflows`, and `references` when packaged.

**Step 2: Add per-group validation**
Validate required formats (frontmatter/schema/name fields) before writing to `.opencode/*`.

**Step 3: Implement report output**
CLI should print installed/skipped/invalid per group.

**Step 4: Add integration tests for each group**
Assert files land in expected `.opencode/<group>/` directories and are parseable.

**Batch Priority:** P0 (execute first)

### Task 6: Project-vs-Global `.opencode` Awareness

**Files:**
- Modify: `src/lib/paths.ts`
- Modify: `src/cli/sync-assets.ts`
- Modify: `src/cli/init.ts`
- Test: `tests/paths.test.ts`

**Step 1: Add OpenCode path resolver**
Implement utility that resolves project-local and global OpenCode paths with explicit strategy (`project`, `global`, `both`).

**Step 2: Add CLI flags**
Expose `--target project|global|both` for asset sync/init behavior.

**Step 3: Add tests for path strategy**
Cover each strategy and ensure no writes outside intended target.

**Batch Priority:** P0 (execute first)

### Task 7: Framework Detection and Brownfield Orchestration Hardening

**Files:**
- Modify: `src/lib/framework-context.ts`
- Modify: `src/lib/project-scan.ts`
- Modify: `src/commands/scan.ts`
- Test: `tests/framework-context.test.ts`
- Create: `tests/scan-command.test.ts`

**Step 1: Support multi-framework detection including BMAD**
Return explicit multi-mode states instead of precedence collapse (no hidden conflicts).

**Step 2: Expand artifact scan coverage**
Include `.bmad`, framework-specific docs, and conflict signatures.

**Step 3: Add deterministic scan outputs**
Emit machine-readable summary (JSON) alongside human report for downstream automation.

**Step 4: Add brownfield action modes**
Introduce `scan --action analyze|recommend|orchestrate`:
- `analyze`: detect only
- `recommend`: produce remediation plan
- `orchestrate`: execute safe non-destructive setup steps (anchors/mems/hierarchy bootstrap)

### Task 8: EN/VI UX and Terminology Compliance

**Files:**
- Modify: `src/cli/interactive-init.ts`
- Modify: `src/cli/init.ts`
- Modify: `src/hooks/session-lifecycle.ts`
- Modify: `src/schemas/config.ts`
- Modify: `README.md`
- Test: `tests/init-planning.test.ts`

**Step 1: Replace offensive mode label**
Rename automation mode key and all user-facing text to an inclusive alternative.

**Step 2: Add migration compatibility shim**
Read legacy saved value and map to the new mode value without breaking old configs.

**Step 3: Ensure EN/VI parity**
All setup and first-run guidance text should exist in both languages.

**Step 4: Add tests for migration + bilingual prompts**
Verify old config loads and interactive strings reflect selected language.

### Task 9: README + Command Contract Alignment

**Files:**
- Modify: `README.md`
- Modify: `commands/hivemind-scan.md`
- Modify: `commands/hivemind-status.md`
- Modify: `commands/hivemind-compact.md`

**Step 1: Align CLI docs with actual commands**
Ensure `scan`/`sync-assets` and flags are documented in command table and examples.

**Step 2: Add explicit old-user upgrade flow**
Document `npm update` + `hivemind sync-assets` without destructive re-init.

**Step 3: Add brownfield runbook**
Document expected agent sequence for “scan and refactor” including failure/override paths.

### Task 10: End-to-End Verification Gate

**Files:**
- Create: `docs/verification/2026-02-13-pr3-remediation-verification.md`

**Step 1: Run full quality gates**
Run:
```bash
npm run typecheck
npm test
npm run build
```
Expected: all pass.

**Step 2: Run packaging simulation**
Run: `npm pack --dry-run`
Expected: package contains only intended runtime assets.

**Step 3: Smoke test fresh + existing install flows**
Run scripted tests covering:
- fresh init
- existing project sync
- scan on brownfield fixture
- EN and VI wizard paths

**Step 4: Publish verification report**
Record command outputs and artifact checks in `docs/verification/2026-02-13-pr3-remediation-verification.md`.

---

Plan complete and saved to `docs/plans/2026-02-13-pr3-integration-remediation-plan.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
