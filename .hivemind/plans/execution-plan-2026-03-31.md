# Execution Plan — Tool System Refactoring — 2026-03-31

## Plan Summary
This plan reconciles the architect's structural concerns with the skeptic's risk controls and intentionally favors the skeptic on any change that could create churn without clear payoff. The execution order is test-first, low-risk cleanup second, structural merges and renames third, dependency and hook fixes after that, and documentation last. The existing `tool-refactoring-plan-2026-03-31.md` is broader and more aggressive than the evidence-supported scope here; this plan supersedes it for the current execution window. Baseline execution is eight gated phases, with Phase 4 treated as a conditional decision checkpoint rather than an automatic refactor.

## Phase 0: Safety Net (Tests First)
### Tasks
- [ ] Task 1: Decide the canonical journal session-path rule before editing code: either keep truncated session IDs and align tests to that behavior, or change path resolution only with a backward-compatible adapter that still reads existing `.hivemind/` journal paths.
- [ ] Task 2: Fix the three failing journal tests so the test suite reflects the chosen canonical path rule and add one regression case that proves existing journal data remains readable.
- [ ] Task 3: Fix the failing `hivemind_hm_setting` test by aligning the test fixture with the actual valid config-group key/value contract; do not broaden the tool schema without evidence.
- [ ] Task 4: Add dedicated regression/smoke tests for `hivemind_trajectory` covering factory registration, supported actions, and feature-dispatch routing.
- [ ] Task 5: Add dedicated regression/smoke tests for `hivemind_task` covering factory registration, supported actions, and feature-dispatch routing.
- [ ] Task 6: Add dedicated regression/smoke tests for `hivemind_handoff` covering factory registration, supported actions, and feature-dispatch routing.
- [ ] Task 7: Add dedicated regression/smoke tests for `hivemind_doc` covering factory registration, supported actions, and feature-dispatch routing.
- [ ] Task 8: Record the phase as one atomic commit only after all gates pass.
### Dependencies: none
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 8-12 hours
### Delegation: sequential baseline repair by 1 hivemaker agent, then parallel smoke-test additions across up to 4 isolated hivemaker slices, then 1 hiveq verification pass; atomic commit after verification

## Phase 1: Dead Code Removal
### Tasks
- [ ] Task 1: Remove the confirmed dead `dashboard-v2/` stub.
- [ ] Task 2: Remove the confirmed exported-but-unused standalone handlers (`handleCompaction()`, `handleTextComplete()`, `handleSessionIdleEvent()`) only if Phase 0 tests confirm no behavioral dependency remains.
- [ ] Task 3: Remove any now-unused imports created by the deletions.
- [ ] Task 4: Update the stale AGENTS.md tool count from 7 to the currently observed registered count before merger work begins, so documentation matches the pre-refactor baseline.
- [ ] Task 5: Record the phase as one atomic cleanup commit.
### Dependencies: Phase 0
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 2-3 hours
### Delegation: single hivemaker cleanup slice followed by 1 hiveq verification pass; sequential

## Phase 2: Tool Mergers
### Tasks
- [ ] Task 1: Merge `hivemind_runtime_status` and `hivemind_runtime_command` into a single `hivemind_runtime` public tool while preserving separate read vs execute actions internally.
- [ ] Task 2: Preserve backward compatibility for existing callers by keeping alias/shim registration or equivalent compatibility wrappers for the old runtime tool names until the documentation phase is complete.
- [ ] Task 3: Merge `hivemind_agent_work_create_contract` and `hivemind_agent_work_export_contract` into `hivemind_contract` with `create`, `update`, and `export` actions, while keeping the feature authority and persisted contract schema unchanged.
- [ ] Task 4: Register the existing unregistered `classify-intent-tool` only if it can be exposed without changing persisted `.hivemind/` contract data or colliding with the merged contract tool surface; otherwise leave implementation untouched and register it as an explicitly scoped compatibility/experimental surface.
- [ ] Task 5: Update plugin registration, tool catalogs, barrel exports, and tests so the merged surfaces are discoverable and verifiable from one canonical inventory.
- [ ] Task 6: Add or update regression coverage proving old runtime/contract entry points still resolve during the transition window.
- [ ] Task 7: Record the phase as one atomic merger commit.
### Dependencies: Phase 1
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 8-10 hours
### Delegation: sequential 3-slice wave — runtime merge, contract merge/classify registration, then central registration/catalog update — followed by 1 hiveq verification pass

## Phase 3: Tool Renames
### Tasks
- [ ] Task 1: Rename the internal `hivefiver-init` module path/folder family to `hm-init` using path-preserving moves.
- [ ] Task 2: Rename the internal `hivefiver-doctor` module path/folder family to `hm-doctor` using path-preserving moves.
- [ ] Task 3: Update all imports, barrel exports, plugin registrations, and tests to the renamed internal paths while preserving the public tool names `hivemind_hm_init` and `hivemind_hm_doctor`.
- [ ] Task 4: Verify no persisted `.hivemind/` records or runtime outputs depend on the old internal path names.
- [ ] Task 5: Record the phase as one atomic rename commit.
### Dependencies: Phase 2
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 3-5 hours
### Delegation: single hivemaker rename slice using `git mv`-style moves, then 1 hiveq verification pass; sequential

## Phase 4: hivefiver-setting Split (Conditional)
### Tasks
- [ ] Task 1: Run a go/no-go review after Phases 3 and 5 evidence is available; do not start this split automatically.
- [ ] Task 2: Default to **NO-GO / defer** unless all three criteria are met: (a) Phase 5 cannot remove the upward imports without further separation, (b) one concrete maintenance or verification failure remains attributable to the single-tool shape, and (c) the split can happen without creating a new public breaking surface or changing `.hivemind/` compatibility.
- [ ] Task 3: If the decision is **NO-GO**, record the deferral, keep `hivemind_hm_setting` as one public tool, and rely on Phase 5 to fix the upward imports through shared contracts/adapters.
- [ ] Task 4: If the decision is **GO**, execute only after Phase 5 and keep the public surface stable: extract internal helpers/presentation logic first, keep dashboard behavior behind the existing tool boundary unless a second tool is explicitly approved, and add targeted regression tests before any public split.
- [ ] Task 5: Record either the deferral note or the split as its own atomic commit.
### Dependencies: Decision review after Phase 3; implementation branch only after Phase 5
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 1-2 hours if deferred; 8-12 hours if approved for execution after Phase 5
### Delegation: architect + planner decision checkpoint first; if approved, 1 hivemaker execution slice followed by 1 hiveq verification pass; otherwise no implementation delegation

## Phase 5: Dependency Violation Fixes
### Tasks
- [ ] Task 1: Remove the upward dependency violations identified around the settings surface without introducing duplicated business logic.
- [ ] Task 2: Move the shared contracts/pressure-contract primitives that are currently creating cross-layer coupling into `src/shared/` or another shared authority module with clear ownership.
- [ ] Task 3: Update imports so feature layers stop depending on tool-owned contracts where those contracts have become shared authorities because of the Phase 2 mergers and Phase 3 renames.
- [ ] Task 4: Preserve compile-time-only type sharing where it remains harmless, but move any now-authoritative action/result types out of tool-local paths.
- [ ] Task 5: Prove that the dependency graph remains acyclic after the import moves.
- [ ] Task 6: Record the phase as one atomic dependency-fix commit.
### Dependencies: Phase 3; Phase 4 decision only if split is approved
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 5-8 hours
### Delegation: sequential hivemaker slices for shared-contract extraction then import rewiring, followed by 1 hiveq verification pass

## Phase 6: Plugin Hook Fixes
### Tasks
- [ ] Task 1: Replace the effective no-op behavior around `addEvent()` / `addDiagnostic()` with a real write path or an explicit degraded-mode signal so hook code no longer reports silent success.
- [ ] Task 2: Verify hook-name behavior in a real OpenCode runtime before renaming any hook binding; do not change `permission.ask`, `command.execute.before`, or `chat.message` on documentation evidence alone.
- [ ] Task 3: If runtime verification shows the current names work, document and test the verified names instead of renaming them.
- [ ] Task 4: If runtime verification shows a binding failure, implement the least-disruptive compatibility fix first (alias/fallback binding or corrected registration with compatibility coverage), preserving current behavior where possible.
- [ ] Task 5: Add regression coverage for the selected hook-binding strategy and for degraded event-sink reporting.
- [ ] Task 6: Record the phase as one atomic hook-fix commit.
### Dependencies: Phase 5
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 4-6 hours
### Delegation: sequential hivemaker implementation slice plus 1 hiveq runtime-verification slice in a real plugin-loaded environment before final commit

## Phase 7: Documentation
### Tasks
- [ ] Task 1: Update AGENTS.md to reflect the final post-refactor tool inventory, hook posture, and any conditional Phase 4 deferral decision.
- [ ] Task 2: Update tool descriptions and catalog metadata so merged/renamed tools are described accurately and old names are clearly marked as compatibility aliases if still present.
- [ ] Task 3: Mark `tool-refactoring-plan-2026-03-31.md` as superseded or otherwise prevent it from competing with this execution plan.
- [ ] Task 4: Update any stale plan or reference docs that still claim the pre-refactor tool count or outdated hook/tool status.
- [ ] Task 5: Record the phase as one atomic documentation commit.
### Dependencies: Phases 1, 2, 3, 5, and 6; Phase 4 only if executed
### Gate: `npx tsc --noEmit` passes, `npm test` passes, `npm run build` succeeds
### Estimated effort: 2-3 hours
### Delegation: single hivemaker documentation slice followed by 1 hiveq accuracy review; sequential

## Dependency Graph
- Critical path (default / Phase 4 deferred): **Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 → Phase 7**.
- Phase 4 is a conditional branch, not part of the default critical path.
- Phase 4 decision point opens after Phase 3, but any approved split executes only **after Phase 5** because Phase 5 supplies the lower-risk shared-contract/import cleanup first.
- No phases should overlap at implementation time because Phases 2, 3, 5, and 6 all touch shared registration, imports, or runtime wiring.
- Verification is mandatory after every phase and must complete before the next phase begins.

## Risk Register
| Risk | Phase | Likelihood | Impact | Mitigation |
|------|-------|------------|--------|------------|
| Journal path fix changes persisted lookup behavior | 0 | Medium | High | Decide canonical path rule first; keep backward-compatible reads; add regression for existing `.hivemind/` journals |
| Tool merge breaks existing callers | 2 | Medium | High | Keep alias/shim compatibility for old tool names during transition; add transition tests |
| Internal rename misses imports or runtime references | 3 | Medium | Medium | Use path-preserving moves, run full gates, and verify persisted data does not depend on internal paths |
| `hivemind_hm_setting` split becomes churn without value | 4 | High | Medium | Default to defer; require explicit go criteria and keep split off critical path |
| Shared-contract extraction introduces new coupling or type drift | 5 | Medium | High | Move only true shared authorities, preserve DAG, and verify acyclic imports before commit |
| Hook-name changes break working runtime behavior | 6 | Medium | High | Runtime verification first; document verified names instead of renaming on doc mismatch alone |
| Event-sink fix surfaces degraded behavior that was previously hidden | 6 | Medium | Medium | Treat visibility as acceptable, add degraded-mode reporting, and verify no silent success remains |
| Conflicting older plan causes executor confusion | 7 | Medium | Medium | Explicitly supersede or annotate the broader `tool-refactoring-plan-2026-03-31.md` |

## Rollback Plan
- Use **one commit per phase**. No multi-phase commits.
- If a gate fails before commit, revert the working tree to the phase start and re-run only that phase.
- If a committed phase fails during the next phase, revert only the last committed phase; do not patch across multiple phases until the prior phase is green again.
- Keep backward-compatible aliases for merged tools until documentation and verification confirm the replacement surfaces are safe.
- Do not migrate or rewrite existing `.hivemind/` data in place; use additive adapters/read compatibility when path or tool-surface behavior changes.
- If Phase 4 is approved and later proves unstable, revert the Phase 4 commit independently and continue with the deferred single-tool posture.

## Total Estimated Effort
- **Baseline plan (Phase 4 deferred): 33-49 hours**
- **If Phase 4 is approved for execution after Phase 5: add 7-10 hours**
