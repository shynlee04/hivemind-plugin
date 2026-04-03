# Findings & Decisions

## Requirements
- Build meta-builder harness: 5 skill packs with zero-dependencies
- All skills must be directly callable AND detectable through natural language
- Bridge seamlessly to sibling authoring packages (agent, tool, command, workflow)
- Follow essentials.md: framework integrity, progressive disclosure, TDD, deterministic design
- Align with HiveMind v3 architecture (skills as config, tools as write, hooks as read)
- Consume 10 OpenCode soft meta concepts as background knowledge
- Long-haul iterative run — multiple batches, each building on previous

## Research Findings
- 4 skill packs completed in Milestone 1 (47 files, ~9,000 lines)
- 3 defects found in Milestone 1: planning-with-files duplicates, missing scripts, missing cross-refs
- Meta-builder parent skill was the critical missing piece — now created
- Cross-package bridging spec written (988 lines, 13 sections)
- All 5 skill packs now exist: use-authoring-skills, user-intent-interactive-loop, coordinating-loop, planning-with-files, meta-builder
- Total: ~60+ files, ~12,000+ lines across all packs
- HiveMind v3 alignment documented in meta-builder/references/04-hivemind-compatibility.md
- OpenCode concepts mapped in meta-builder/references/02-opencode-concepts.md
- Stacking rules defined in meta-builder/references/03-stacking-rules.md (max 3 skills per stack)

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
