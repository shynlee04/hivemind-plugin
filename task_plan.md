# Task Plan: Standalone Harness Cleanup

## Goal
Finish the standalone `opencode-harness` pack cleanup, then recover the stalled spec/debug loop so the repo is self-contained, buildable, and working from forward-looking, internally consistent planning artifacts aligned with the active loop tracked against `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/experiment-plugins-tools-2026-04-01.md`.

## Current Phase
Phase 10 — complete

## Phases

### Phase 1: Repository Extraction Baseline
- [x] Reduce root to standalone harness files only
- [x] Confirm core manifest and source layout exist
- [x] Remove unrelated monorepo surface area from the root
- **Status:** complete

### Phase 2: Standalone Identity Refresh
- [x] Reshape repo into standalone `opencode-harness`
- [x] Preserve key root docs/config files needed for a pack
- [x] Keep `.opencode/` alongside `src/` as the retained harness surface
- **Status:** complete

### Phase 3: Audit and Gap Capture
- [x] Review current standalone repo state
- [x] Capture likely remaining blockers from latest audit
- [x] Resume planning-with-files tracking in repo root
- **Status:** complete

### Phase 4: Packaging and Build Hardening
- [x] Replace source-first `package.json` entrypoints so `main`, `types`, and `exports` no longer resolve to `./src/*.ts`
- [x] Add explicit build/test scripts to `package.json` so distributable validation is runnable from the package root
- [x] Expand `package.json` publish surface beyond `src`, `README.md`, and `tsconfig.json` so built artifacts can ship
- [x] Implement the README-promised build pipeline before claiming publish readiness
- [x] Verify root `opencode.json` continues to resolve `./.opencode/plugins/harness-control-plane.ts` correctly through the hardened packaging flow
- [x] Keep Phase 4 focused on build/publish hardening only; plugin-wrapper surgery is not currently needed because `.opencode/plugins/harness-control-plane.ts` is a clean re-export shim
- **Status:** complete

### Phase 5: State Persistence Hardening
- [x] Replace in-memory-only context-checkpoint behavior with durable persistence
- [x] Verify checkpoint lifecycle inside standalone harness boundaries
- [x] Record follow-up cleanup required for persistence-related docs/tests
- **Status:** complete

### Phase 6: Integration and Docs Cleanup
- [x] Remove stale integration references from the standalone pack
- [x] Clean outdated docs/config language that still assumes prior repo shape
- [x] Verify README and surrounding docs describe standalone usage only after Phase 4/5 hardening lands
- **Status:** complete

### Phase 7: Final Verification and Pack Readiness
- [x] Re-audit root contents, packaging flow, and docs consistency
- [x] Confirm blockers are closed or explicitly tracked
- [x] Prepare the repo for the next implementation loop
- **Status:** complete

### Phase 8: Spec Recovery Planning
- [x] Investigate failed session artifacts for root-cause patterns
- [x] Validate forward-looking spec docs against OpenCode and OMO constraints
- [x] Produce an approval-gated recovery plan for doc correction before implementation resumes
- **Status:** complete

### Phase 9: Spec Correction Execution
- [x] Research OpenCode platform capabilities from SDK lib (opencode-platform-reference >>>, oh-my-openagent-reference >>>)
- [x] Rewrite `docs/requirements-2026-04-02.md` to remove platform/implementation contradictions
- [x] Rewrite `docs/user-stories-2026-04-02.md` so stories align with corrected requirements and MVP scope
- [x] Re-validate the corrected docs against reference constraints before any code work resumes
- **Status:** complete

### Phase 10: Feature Gap Audit and Implementation Waves
- [x] Audit current source and `.opencode/` surfaces against corrected requirements (103/110 requirements met)
- [x] Group missing/broken features into implementation waves with verification gates
- [x] Wave 1: Vitest test infrastructure (Task 1) — commit fba0243d
- [x] Wave 2: Core constant/config fixes (Tasks 2-5) — commits 774b627c, ca573062, 74a1f5dc, 7f137ba4
- [x] Wave 3: Prompt format + PERM-007 (Tasks 6-7) — commits 5a7513c6, ed0524d0
- [x] Wave 4: Missing features (Tasks 8-10) — session cancel (76588d80), SSE completion, env concurrency
- [x] Wave 5: Verification (Tasks 11-14) — 58 tests pass, typecheck clean, build clean, pack clean
- **Status:** complete

## Key Questions
1. Which contradictions in the forward-looking docs must be corrected before any new implementation work can be trusted?
2. How should recovery be staged so failed-session behavior does not repeat in the next cycle?
3. Which feature gaps should remain blocked until the spec layer is repaired and re-approved?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Resume with file-based planning in repo root | Keeps the cleanup loop state persistent across sessions |
| Treat Phase 4 build hardening, then Phase 5 persistence hardening, then Phase 6 docs cleanup as the next sequence | Latest audit confirmed packaging blockers before persistence and docs can be closed confidently |
| Keep the active loop anchored to the experiment activity note | Preserves continuity with the broader detox/harness migration work |
| Target built artifacts under `dist/` for package entrypoints and publish output | Aligns standalone packaging with the validated build pipeline and pack dry-run |
| Persist context checkpoints in `.opencode/state/opencode-harness/checkpoints.json` | Replaces process-local memory with durable standalone state storage |
| Treat `docs/requirements-2026-04-02.md` and `docs/user-stories-2026-04-02.md` as forward-looking design inputs, not implementation status reports | Matches the user's explicit framing for the docs |
| Correct the spec layer before auditing or implementing missing features | Prevents another validation-only loop based on contradictory requirements |
| Gate each recovery cycle behind user authorization | Matches the requested multi-round planning workflow |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None in this planning step | 1 | Planning files created directly in the repo root |

## Notes
- Root is expected to remain limited to standalone harness artifacts.
- Root `src/` is currently limited to `index.ts`, `lib/`, and `plugin.ts`.
- `.opencode/plugins/harness-control-plane.ts` is a 2-line wrapper re-exporting from `../../src/plugin`, so Phase 4 can stay focused on package hardening.
- Phase 4 completed with package entrypoints targeting `dist/`, package scripts in place, and dry-run validation passing for typecheck, build, and pack.
- `.opencode/tools/context-checkpoint.ts` now persists durable JSON state at `.opencode/state/opencode-harness/checkpoints.json`.
- Phase 6 docs cleanup closed the identified stale references, and Phase 7 final verification is now complete.
- Final strict audit verdict: READY.
- Final verification passed for root layout, build/publish readiness, the thin wrapper plugin path, durable checkpoint storage, and 8-layer coverage.
- Minor caveats remain informational only: the thin wrapper plugin is intentionally kept as a minimal re-export shim, and durable checkpoint state continues to live in repo-local JSON storage that should remain included in routine smoke checks.
- This plan is intentionally concise and should be expanded only as new blockers are confirmed.
- Failed sessions `session-ses_2b52.md` and `session-ses_2b53.md` exposed a process failure: repeated validation without converging doc edits.
- Phase 8 closes only the recovery-planning work; Phase 9 doc corrections and Phase 10 feature-wave execution still require explicit approval before proceeding.
