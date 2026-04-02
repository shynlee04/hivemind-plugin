# Task Plan: Standalone Harness Cleanup

## Goal
Finish the standalone `opencode-harness` pack cleanup, then recover the stalled spec/debug loop so the repo is self-contained, buildable, and working from forward-looking, internally consistent planning artifacts aligned with the active loop tracked against `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/experiment-plugins-tools-2026-04-01.md`.

## Current Phase
Phase 11 — Wave 4 pending after Wave 1-3 implementation slice

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

### Phase 11: session-api.ts Event-Driven Rewrite (Approach A)
- [x] Wave 0: SessionCompletionTracker class — TDD RED+GREEN verified (12/12 tests, typecheck clean)
- [x] Wave 1: Rewrite `src/lib/session-api.ts` — delete all multi-path/fake SSE/polling, create 6 typed SDK wrappers
- [x] Wave 2: Rewrite `tests/lib/session-api.test.ts` — real contract tests, tracker unit tests
- [x] Wave 3: Migrate `src/lib/lifecycle-manager.ts` — use new typed imports, wire tracker
- [ ] Wave 4: Migrate `src/plugin.ts` — wire completionTracker to event hook, update imports
- [ ] Wave 5: Verification gate — typecheck, 58+ tests passing, build clean, pack clean
- [ ] Wave 6: Code review via critic agent, update AGENTS.md
- **Status:** in_progress

## Approach Decision
**Selected: Approach A (Event-Driven Tracker)**
- `session-api.ts` (~80 LOC) — 6 typed SDK wrapper functions, zero fallbacks, real `OpenCodeClient` type
- `session-completion-tracker.ts` (~100 LOC) — class fed by plugin's `event` hook, zero polling in normal path
- Degraded-mode: if no event fires within 80% of timeout, single poll via `client.session.messages()`
- Rationale: cleanest architecture, self-contained tracker class, zero coupling to SDK internals during wait

## Key Questions
1. Which contradictions in the forward-looking docs must be corrected before any new implementation work can be trusted? → RESOLVED in Phase 9
2. How should recovery be staged so failed-session behavior does not repeat in the next cycle? → RESOLVED in Phase 8
3. Which feature gaps should remain blocked until the spec layer is repaired and re-approved? → RESOLVED in Phase 10

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
| Use Approach A (Event-Driven Tracker) for session-api rewrite | Zero polling in normal path, real-time event routing through plugin hook, ~200 LOC vs 473, testable class, typed SDK calls |
| Create `SessionCompletionTracker` class in separate file | Separates completion detection from SDK wrapper functions, injectable for testing |
| Delete all multi-path fallback code | SDK has ONE canonical call shape per method — fallback paths are dead code masking real bugs |
| Delete all fake SSE functions | `client.event.subscribe()` doesn't exist. Plugins receive events via `event` hook, not SSE subscription |
| Wire tracker through plugin's `event` hook | Plugins run inside the server — they don't need SSE, they get events directly via hook |
| Cache tracker terminal results until `watch()` attaches | Prevents pre-watch idle/error/deleted events from being lost before lifecycle observation starts |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None in this planning step | 1 | Planning files created directly in the repo root |
| lifecycle-manager.ts:229 passes `{ id }` to abort instead of `{ path: { id } }` | Found during Phase 11 research | Will fix in Wave 3 migration |
| All session-api.ts tests test non-existent APIs (`client.event.subscribe`) | Found during Phase 11 research | Will rewrite entirely in Wave 2 |
| SessionCompletionTracker had a pre-watch race when terminal output arrived before watch registration | Found in code review after Wave 1 | Fixed by caching terminal results inside `SessionCompletionTracker` |

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
- **Phase 11 design doc:** `docs/designs/2026-04-02-session-api-rewrite.md` — contains all validated SDK facts and proposed architecture.
- **Phase 11 audit doc:** `docs/project/codebase-audit/honest-audit-2026-04-02.md` — exposes current session-api as 0% salvageable.
- **Key SDK facts (opencode-platform-reference >>>):** `client.session.create/get/abort/prompt/promptAsync/messages/children` all have single canonical call shapes. `client.event.subscribe()` is the real SSE API (returns `ServerSentEventsResult` with async iterable stream), but plugins should use the `event` hook instead. `Session` type has NO `status` field. Events: `session.idle` → `{ sessionID }`, `session.error` → `{ sessionID, error }`, `session.created/updated/deleted` → `{ info: Session }`.
- Code review after Wave 1 found a tracker pre-watch race; `SessionCompletionTracker` now caches terminal results so `watch()` resolves correctly even when completion/error lands before registration.
- This commit slice includes only the Wave 1 implementation-related files plus `task_plan.md` and `progress.md`; unrelated workspace changes stay unstaged.
