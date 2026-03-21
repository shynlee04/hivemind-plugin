## CURRENT_STATE

- Runtime sync rewrites projected files unconditionally in `src/features/runtime-observability/sync.ts`, so repeated `hm-init`/`hm-doctor` paths do avoid stale assets but still pay needless write churn and make future deletion-safety changes harder to reason about.
- Latest session-contract lookup is duplicated at call sites via `list(sessionId).sort(...)[0]` in `src/features/runtime-observability/status.ts`, `src/plugin/input-helpers.ts`, `src/hooks/event-handler.ts`, and `src/features/agent-work-contract/engine/command-session-contract.ts` instead of being owned by the contract store.
- The cleanest remaining safe surfaces are additive runtime-sync behavior and additive contract-store helpers; known dirty files in `src/delegation/delegation-store.ts`, `src/features/handoff/handoff.ts`, and `tests/runtime-resilience.test.ts` should stay untouched.
- Higher-risk concern slices still exist, but async I/O conversion and schema-kernel canonical-path migration would cut across dirtier or more authority-sensitive sectors than this worktree can safely absorb now.

## TARGET_STATE

- Runtime sync keeps current entrypoint behavior and output shape, but skips writes when projected content is unchanged and reports the same deterministic mirror result.
- Contract-store owns a single additive latest-by-session lookup so status, plugin, hook, and command-session flows consume one authority method instead of repeating scan-plus-sort logic.
- Runtime sync deletion rules become tighter only where additive guards can reduce accidental removal risk without changing the default init/doctor contract or widening to blocked sectors.
- Each slice lands behind phase gates that are small enough for subagent-driven-development loops and easy to stop after a passing verification checkpoint.

## PHASES

### Phase 1 - Runtime sync write-skip and deterministic mirror preservation
- File targets: `src/features/runtime-observability/sync.ts`, `tests/runtime-surface-sync.test.ts`, `tests/sync-dry-run.test.ts`, and optionally `src/cli/runtime-assets.ts` only if signatures need additive metadata passthrough.
- Change shape: add a local content-compare helper used by plugin, command, agent, and skill projection writes so unchanged files are not rewritten; keep return contract stable unless a strictly additive field is clearly justified.
- Why safe: this is isolated to runtime projection, already has focused tests, and avoids the known dirty delegation/handoff surfaces.
- Why risky: `syncRuntimeSurface()`, `syncMirrorDirectory()`, and `syncSkillDirectory()` are already hotspot methods, so additive logic can accidentally change mirrored path ordering or dry-run semantics if helper extraction is sloppy.
- Best skill fit: run `review-and-refactor` after implementation to check helper placement and contract preservation; use `refactor-method-complexity-reduce` only if `syncRuntimeSurface()` or `syncSkillDirectory()` crosses the complexity threshold after the new helper lands.

### Phase 2 - Additive contract-store latest lookup and caller consolidation
- File targets: `src/features/agent-work-contract/engine/contract-store.archive.ts` or the owning contract-store layer, `src/features/agent-work-contract/engine/contract-store.test.ts`, `src/features/runtime-observability/status.ts`, `src/plugin/input-helpers.ts`, `src/hooks/event-handler.ts`, `src/features/agent-work-contract/engine/command-session-contract.ts`.
- Change shape: add an authority method such as `getLatestForSession(sessionId)` or equivalent additive API in the store, backed by current on-disk data, then replace repeated `list(...).sort(...)[0]` call-site logic with that API.
- Why safe: this is additive, avoids schema changes, does not require moving ownership into `src/schema-kernel/`, and directly removes duplicated logic from four call sites plus one local helper.
- Why risky: `upsertCommandSessionContract()` is already a hotspot, and changing how “latest” is resolved could accidentally alter continuity fallback behavior if the continuity-linked contract precedence is blurred.
- Best skill fit: run `review-and-refactor` after caller migration to confirm authority boundaries; use `refactor-method-complexity-reduce` on `upsertCommandSessionContract()` only if the helper swap triggers more branching during fallback cleanup.

### Phase 3 - Optional runtime sync deletion-safety tightening without entrypoint behavior flip
- File targets: `src/features/runtime-observability/sync.ts`, `tests/sync-dry-run.test.ts`, and only the runtime-entry/reporting files (`src/features/runtime-entry/init.handler.ts`, `src/features/runtime-entry/doctor.ts`) if an additive report field is required.
- Change shape: tighten deletion eligibility only for clearly managed runtime-projection surfaces, for example by requiring known managed extensions, preserving protected paths, and guarding skill-directory deletion so unmanaged nested content is never removed implicitly.
- Why safe: it stays inside the same runtime-sync seam and can be shipped after Phase 1 proves no-op projection stability.
- Why risky: deletion semantics are user-visible and easy to over-tighten or under-tighten; any change that alters current init/doctor success expectations or expands report contracts beyond additive metadata should be treated as a stop point.
- Best skill fit: run `review-and-refactor` before merge to ensure safety rules remain local to runtime sync; `refactor-method-complexity-reduce` applies only if deletion guards fragment `syncSkillDirectory()` into too many branches.

## VERIFICATION_GATES

- After Phase 1: run `npx tsc --noEmit`, then targeted tests `npx tsx --test tests/runtime-surface-sync.test.ts` and `npx tsx --test tests/sync-dry-run.test.ts`; gate on identical mirror outputs across repeated sync calls and unchanged dry-run behavior.
- After Phase 2: run `npx tsc --noEmit`, then targeted tests `npx tsx --test src/features/agent-work-contract/engine/contract-store.test.ts` plus any focused runtime-status or hook tests that already cover latest-contract consumption; gate on no remaining duplicated `list(...).sort(...)[0]` lookup at the identified call sites.
- After Phase 3: rerun `npx tsc --noEmit`, `npx tsx --test tests/sync-dry-run.test.ts`, and `npx tsx --test tests/runtime-surface-sync.test.ts`; gate on deletion behavior becoming narrower or equal in scope, never broader, and on init/doctor report compatibility staying additive.
- Final branch gate before handoff back to orchestrator: `npx tsc --noEmit` and the smallest relevant targeted test bundle above; only escalate to broader `npm test` if a phase touches shared behavior outside runtime sync or contract-store consumers.

## DEFERRED_ITEMS

- Blocked for this packet: async I/O conversion in `src/delegation/delegation-store.ts` and task-lifecycle/handoff-adjacent flows, because the worktree is already dirty in delegation and handoff surfaces and the change would widen blast radius beyond a bounded refactor loop.
- Blocked for this packet: schema-kernel canonical-path migration, because it changes contract authority ownership rather than delivering the smallest corrective slice; treat it as a separate design packet after additive consumers are simplified.
- Defer any change that requires touching `src/features/handoff/handoff.ts`, `tests/runtime-resilience.test.ts`, or runtime-entry default command behavior beyond additive reporting.
- Defer hotspot cleanup that is purely structural unless it becomes necessary to keep a touched method under project complexity limits.

## RECOMMENDED_EXECUTION_ORDER

1. Authorization loop A: implement Phase 1 only, verify, and stop for review because it delivers the highest safety-to-value gain while staying inside one seam.
2. Authorization loop B: if Phase 1 passes, implement Phase 2 as a separate additive store-authority slice, verify, and stop again so continuity-sensitive callers can be reviewed in isolation.
3. Authorization loop C: only if deletion risk remains worth addressing after A+B, implement Phase 3 as the final optional hardening slice; otherwise ship after Phase 2.
4. Keep all deferred items out of this execution order; they should become fresh packets with their own investigation because they are either cross-authority migrations or already overlap dirty files.
