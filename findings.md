# Findings & Decisions

## Requirements
- Create `task_plan.md`, `findings.md`, and `progress.md` in the repo root only.
- Capture the standalone `opencode-harness` repo state.
- Record known likely blockers from the latest audit.
- Do not modify any other files in this step.

## Research Findings
- The repo root is currently narrowed to: `.git`, `.gitignore`, `.opencode/`, `LICENSE`, `opencode.json`, `package.json`, `README.md`, `src/`, `tsconfig.json`.
- Root `src/` currently contains only `index.ts`, `lib/`, and `plugin.ts`.
- The repository has already been reshaped into a standalone `opencode-harness` repository.
- The active continuation point is `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/experiment-plugins-tools-2026-04-01.md`.
- Current work is cleanup and hardening rather than another extraction pass.
- Phase 4 build hardening is complete: `package.json` now targets built artifacts under `dist/`.
- Phase 4 added runnable package-root validation/build scripts and expanded the publish surface to ship built output.
- Validation commands completed successfully: `npm run typecheck`, `npm run build`, and `npm pack --dry-run`.
- Root `opencode.json` points to `./.opencode/plugins/harness-control-plane.ts`.
- `.opencode/plugins/harness-control-plane.ts` is currently a clean 2-line wrapper that only re-exports from `../../src/plugin`.
- `.opencode/` now contains only `agents/`, `commands/`, `plugins/`, `rules/`, `skills/`, and `tools/`.
- Phase 5 persistence hardening is complete: `.opencode/tools/context-checkpoint.ts` now uses durable JSON storage under `.opencode/state/opencode-harness/checkpoints.json`.
- Phase 6 docs cleanup is complete for the identified stale references.
- Phase 7 final verification is complete.
- The final strict audit verdict is READY.
- Final verification passed root layout integrity, build/publish readiness, root `opencode.json` to thin wrapper plugin resolution, durable checkpoint behavior, and 8-layer coverage.
- Minor caveats are non-blocking: the wrapper plugin remains intentionally thin, and the durable checkpoint file remains a repo-local operational artifact that should stay in normal verification coverage.
- Failed session review of `session-ses_2b52.md` and `session-ses_2b53.md` found repeated validation/audit output with effectively no corrective doc edits.
- The two failed sessions duplicated scope instead of resuming prior work, which amplified churn and consumed budget without moving artifacts forward.
- The failed sessions mixed forward-looking spec authoring with implementation-audit logic even after the user framed the docs as pre-implementation design artifacts.
- Skill loading occurred, but the sessions did not apply the loaded skills to produce corrected outputs.
- The sessions ended without an output gate that required modified docs or a routed recovery decision.
- `docs/requirements-2026-04-02.md` and `docs/user-stories-2026-04-02.md` contain useful structure, but they are not yet safe as execution inputs.
- The docs currently misrepresent the relationship between platform `doom_loop` behavior and harness-level circuit-breaker policy.
- The docs currently describe custom tools like `delegate-task`, `context-checkpoint_save`, and `context-checkpoint_restore` more like declarations than implementable requirements.
- The docs include invented or insufficiently grounded APIs such as `reserveConcurrencySlot()` and `getAvailableSpawnCapacity()`.
- The docs blur harness-specific environment variables with platform-native OpenCode configuration.
- The docs need clearer treatment of `permission.task` semantics and more grounded expectations for `/harness-doctor`.
- The OMO role mapping is directionally useful, but the conductor/researcher/builder split is still too imprecise to use as an implementation contract.
- The next safe sequence is: repair requirements -> align user stories -> audit code against corrected docs -> execute feature waves.
- REQUIREMENTS REWRITE (v3.0) COMPLETED: 443 lines, 8 specific corrections applied (V3-1 through V3-8). doom_loop now correctly framed as permission action, custom tools marked as plugin-registered, invented APIs removed, env vars marked harness-specific, platform boundary table added as Section 14.
- USER STORIES REWRITE (v3.0) COMPLETED: Category routing aligned to 4 categories (research, implementation, review, visual-engineering), 26 agent-instruction criteria tagged, 40 requirement trace references added, invented platform API references removed, doom_loop descriptions corrected, /harness-doctor reduced to 5 concrete checks.
- KEY DISCREPANCIES FOUND BETWEEN CODE AND DOCS: MAX_DESCENDANTS_PER_ROOT=50 in code vs docs saying 10; concurrency default=1 per lane in code vs docs saying 3; no tests exist at all; wisdom system referenced in agent instructions but has no code implementation.

## Wave 1-3 Implementation Results

- **48 tests passing** across 4 test files (helpers, constants, prompt-builder, tool-restriction)
- All 7 tasks completed with TDD discipline (failing test → fix → passing test → commit)
- Key fixes applied:
  - MAX_DESCENDANTS_PER_ROOT 50→10 (GRD-002)
  - doom_loop deny→allow (PERM-002)
  - DEFAULT_CONCURRENCY_LIMIT 1→3 in concurrency.ts (CON-003)
  - Builder temperature 0.2→0.15 (CAT-004)
  - buildPromptText rewritten to produce 6-section format: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT (CAT-009)
  - Per-delegation tool restriction enforcement in tool.execute.before (PERM-007)
- **Known remaining issue**: `src/lib/lifecycle-manager.ts` line 115 still passes `1` explicitly to `DelegationConcurrencyQueue(1)`, overriding the `DEFAULT_CONCURRENCY_LIMIT=3` from concurrency.ts. Task 10 will fix this.
- **delegate-task tool is broken** in this environment (TypeError: undefined is not an object evaluating this._client). All work must be done directly.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Treat the repo as a standalone pack, not a slice of the old monorepo | Matches the current root layout and user direction |
| Prioritize packaging/build, persistence, and stale-doc cleanup | These are the highest-risk remaining blockers named by the latest audit |
| Resume planning-with-files from the repo root | Makes the loop state explicit and recoverable in future sessions |
| Sequence remaining work as build hardening -> persistence hardening -> docs cleanup | The latest audit confirmed packaging blockers must close before later phases can be validated cleanly |
| Publish from `dist/` rather than direct TypeScript source entrypoints | Keeps package consumers aligned with built artifacts and verified pack output |
| Store checkpoint durability state in `.opencode/state/opencode-harness/checkpoints.json` | Gives the standalone harness a persistent, repo-local checkpoint store |
| Separate spec-repair work from code-gap work | The failed sessions showed that mixing them creates validation churn without output |
| Use the failed sessions as anti-pattern evidence, not as authoritative outputs | Their main value is root-cause diagnosis, not reusable deliverables |
| Require explicit user approval between recovery cycles | Prevents overcommitting into implementation before the spec layer is trusted |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Source-first package entrypoints and missing validation/build scripts | Resolved in Phase 4 by targeting `dist/`, adding scripts, and passing `npm run typecheck`, `npm run build`, and `npm pack --dry-run` |
| Publish surface excluded built output | Resolved in Phase 4 by expanding package publish contents to include build artifacts |
| Root `opencode.json` still references `.opencode/plugins/harness-control-plane.ts` directly | Re-verified through the hardened packaging flow; no wrapper refactor was needed |
| `.opencode/tools/context-checkpoint.ts` remained entirely in-memory | Resolved in Phase 5 with durable JSON persistence at `.opencode/state/opencode-harness/checkpoints.json` |
| Stale integration/docs still referenced the old repository shape | Resolved in Phase 6 for the identified stale references |
| `.opencode/plugins/harness-control-plane.ts` is already only a thin re-export wrapper | Confirmed unchanged; Phase 4 stayed focused on packaging/build hardening |
| Final strict audit required whole-pack readiness confirmation | Resolved in Phase 7 with a READY verdict across root layout, build/publish readiness, thin wrapper plugin, durable checkpoints, and 8-layer coverage |
| Session investigation showed repeated validation without document convergence | Recovery plan now puts doc correction ahead of any further implementation audit |
| Forward-looking docs contain platform-model contradictions and underspecified tool semantics | Recovery plan gates feature-gap work on spec correction and re-validation |

## Resources
- `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/experiment-plugins-tools-2026-04-01.md`
- `README.md`
- `package.json`
- `opencode.json`
- `src/`
- `session-ses_2b52.md`
- `session-ses_2b53.md`
- `docs/requirements-2026-04-02.md`
- `docs/user-stories-2026-04-02.md`
- `docs/recovery-plan-2026-04-02.md`

## Visual/Browser Findings
- None captured in this planning step.
