# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**Authority surfaces still depend on archived implementations:**
- Issue: live exports point at archive paths instead of first-class implementation surfaces.
- Files: `src/schema-kernel/index.ts`, `src/archive/schema-kernel/shared.ts`, `src/archive/schema-kernel/lifecycle-records.ts`, `src/archive/schema-kernel/orchestration-records.ts`, `src/archive/schema-kernel/evidence-records.ts`, `src/features/agent-work-contract/engine/contract-store.ts`, `src/features/agent-work-contract/engine/contract-store.archive.ts`
- Impact: maintainers have to reason across "canonical" and "archive" locations; refactors can break the real authority behind a stable API without touching the advertised surface.
- Fix approach: move the active implementations into non-archive directories, keep archive paths as thin compatibility shims, and update docs/tests to point at the new authority.

**Runtime validators currently return simulated success instead of executing real checks:**
- Issue: validator lanes report pass states from hard-coded evidence objects and comments such as "Simulate local diagnostics validation" and "Simulate integration check validation." 
- Files: `src/tools/runtime/runtime-command-validator.ts`, `src/tools/runtime/runtime-status-validator.ts`, `tests/runtime-validator-regression.test.ts`
- Impact: verification output can look authoritative even when no `tsc`, no integration probe, and no live boundary proof actually ran.
- Fix approach: replace simulated evidence with real command execution and boundary probes, then keep regression tests focused on summary semantics only.

**Schema/tool typing carries a known `any` escape hatch:**
- Issue: the create-contract tool keeps an explicit `as any` bridge because of a Zod version mismatch between the package root and the plugin dependency tree.
- Files: `src/features/agent-work-contract/tools/create-contract-tool.schema.ts`, `package.json`
- Impact: one of the most central tool contracts bypasses type safety exactly where argument schemas should be strongest.
- Fix approach: dedupe Zod versions across the package graph, then remove the `any` export and bind the tool args to a single schema authority.

**Stale workspace/script artifacts remain in the repo:**
- Issue: root scripts still reference `src/dashboard-v2`, and that directory only contains leftover artifacts instead of an active workspace.
- Files: `package.json`, `tsconfig.json`, `src/dashboard-v2/package-lock.json`, `src/dashboard-v2/src/index.tsx.bak`
- Impact: contributor setup and CI intent are harder to trust because the advertised typecheck lane does not match the current workspace layout.
- Fix approach: either restore the dashboard as a real workspace or remove the dead script/path references and leftover files.

## Known Bugs

**Root test command skips a large share of active tests:**
- Symptoms: `npm test` only runs `tests/*.test.ts`, while many active tests live under nested folders and co-located source paths.
- Files: `package.json`, `tests/unit/context-renderer/tool-precedence.test.ts`, `tests/unit/context-renderer/workflow-style.test.ts`, `tests/unit/context-renderer/turn-hierarchy.test.ts`, `src/plugin/context-renderer.test.ts`, `src/features/agent-work-contract/engine/contract-store.test.ts`, `src/hooks/start-work/start-work-router.test.ts`
- Trigger: running the root `test` script.
- Workaround: run targeted `tsx --test` commands for co-located and nested tests until the root script is widened.

**Workspace TUI tests are outside the root verification path:**
- Symptoms: the Bun-based OpenTUI app has its own tests and typecheck script, but the root package does not invoke them.
- Files: `package.json`, `apps/opentui/package.json`, `apps/opentui/tests/runtime-status.test.tsx`
- Trigger: relying on root `npm test` or `npm run typecheck` as full-repo validation.
- Workaround: run `npm --prefix apps/opentui test` and `npm --prefix apps/opentui run typecheck` separately.

## Security Considerations

**File path construction trusts raw IDs for persisted state:**
- Risk: contract IDs and delegation IDs are interpolated directly into filesystem paths with no slug or traversal guard.
- Files: `src/features/agent-work-contract/engine/contract-store.base.ts`, `src/features/agent-work-contract/schema/contract.ts`, `src/delegation/delegation-store.ts`, `src/delegation/delegation-record.schema.ts`
- Current mitigation: IDs must be non-empty strings and some callers generate IDs internally.
- Recommendations: constrain IDs to a safe character set in schema validation, normalize with `basename`-style protection, and reject any path segment containing separators or traversal markers.

**Runtime surface sync can delete local runtime assets by directory sweep:**
- Risk: sync deletes unmanaged command/agent/skill files and whole skill directories unless they are explicitly protected.
- Files: `src/features/runtime-observability/sync.ts`, `src/shared/opencode-skill-registry.ts`, `tests/runtime-surface-sync.test.ts`
- Current mitigation: `dryRun` and `protectedPaths` options exist.
- Recommendations: default to dry-run for interactive flows, log explicit deletion plans, and scope deletion to files with a managed marker instead of directory absence alone.

## Performance Bottlenecks

**Hot-path state access uses synchronous filesystem calls:**
- Problem: workflow authority, task lifecycle, delegation storage, trajectory ledger reads, and skill registry discovery all perform blocking disk I/O.
- Files: `src/core/workflow-management/workflow-authority.ts`, `src/core/workflow-management/task-lifecycle.ts`, `src/delegation/delegation-store.ts`, `src/core/trajectory/trajectory-store.ledger.ts`, `src/shared/opencode-skill-registry.ts`
- Cause: repeated use of `existsSync`, `readFileSync`, `writeFileSync`, `mkdirSync`, and `readdirSync` in request-time code paths.
- Improvement path: move these surfaces to async I/O, add memoization for read-mostly registries, and batch disk access when assembling status responses.

**Contract summary lookup scales by scanning and sorting the full session store:**
- Problem: runtime status builds the latest session contract by listing every contract for a session and sorting in memory.
- Files: `src/features/runtime-observability/status.ts`, `src/features/agent-work-contract/engine/contract-store.archive.ts`
- Cause: `store.list(sessionId)` reads all contract JSON files, then `buildLatestSessionContractSummary` sorts them to find one record.
- Improvement path: keep an index keyed by session and `updatedAt`, or persist a "latest contract" pointer alongside continuity state.

**Document search walks markdown trees sequentially and loads every file:**
- Problem: markdown search and skim operations recurse through the entire tree and read full file contents for each candidate.
- Files: `src/intelligence/doc/read-ops.ts`, `src/intelligence/doc/formats/md.ts`
- Cause: recursive `walk()` plus full-content reads for outline extraction and search.
- Improvement path: add indexing/caching, parallelize bounded reads, and short-circuit large directories with explicit include scopes.

## Fragile Areas

**Plugin assembly concentrates many hook interactions in one file:**
- Files: `src/plugin/opencode-plugin.ts`, `tests/plugin-assembly-smoke.test.ts`, `tests/plugin-runtime.test.ts`
- Why fragile: one module coordinates event handling, permission gating, command context injection, message transforms, compaction injection, and NL-first dispatch state.
- Safe modification: isolate each hook into a small feature-specific adapter and keep `src/plugin/opencode-plugin.ts` as wiring only.
- Test coverage: smoke/integration coverage exists, but several relevant tests are outside the root `npm test` pattern.

**Task ledgers silently recover from malformed state by resetting to empty structures:**
- Files: `src/core/workflow-management/task-lifecycle.ts`, `src/core/workflow-management/workflow-authority.ts`
- Why fragile: unreadable JSON returns default empty task collections, which can mask corruption as "no tasks" instead of surfacing a repair-needed state.
- Safe modification: preserve parse failures as explicit diagnostics and route callers through repair flow instead of silent fallback.
- Test coverage: no root-level regression test currently proves corruption handling through the shipped `npm test` lane.

**The OpenTUI dashboard is still mock-driven and loosely typed:**
- Files: `src/tui/Dashboard.tsx`, `src/tui/components/ExecutionStatus.tsx`, `src/tui/sse.ts`
- Why fragile: hard-coded wiki data, hard-coded server URL, and `any[]` event state make runtime breakage more likely when the backend contract changes.
- Safe modification: replace mocks with typed adapters, inject the server endpoint from config, and lock event shapes to shared contracts.
- Test coverage: current root validation does not exercise `src/tui/**` directly.

## Scaling Limits

**Runtime surface mirroring scales with total shipped asset count:**
- Current capacity: acceptable for the current command/agent/skill set.
- Limit: every sync reads and rewrites all mirrored assets under `.opencode`, so startup/sync cost rises linearly with asset growth.
- Scaling path: add change detection via content hashing and update only modified assets.

**Contract and handoff persistence depend on per-file JSON stores:**
- Current capacity: workable for small session counts and short-lived artifacts.
- Limit: directory scans and file-per-record persistence get slower and more failure-prone as sessions, contracts, and handoffs accumulate.
- Scaling path: add indexed metadata files or move to a small embedded database while keeping the same public contract shapes.

## Dependencies at Risk

**The package depends on itself in `devDependencies`:**
- Risk: local installs and release workflows can resolve the published package differently from the workspace source tree.
- Impact: contributors may test against a hybrid of local source and published package metadata.
- Migration plan: remove `hivemind-context-governance` from `devDependencies` and rely on the workspace package itself during local development.

**Zod version skew is already affecting implementation choices:**
- Risk: two Zod authorities are present, and tool schema code documents the mismatch as an active workaround.
- Impact: future tool surfaces can accumulate more `any` escapes or runtime/schema divergence.
- Migration plan: pin one Zod version across direct and nested consumers or route all tool-schema creation through the SDK-exported schema surface only.

## Missing Critical Features

**Document intelligence remains markdown-first and read-only:**
- Problem: the live doc-intel surface explicitly omits multi-format support, indexing/xref, and any write-capable restoration.
- Blocks: richer repo intelligence workflows, cross-document linking, and non-markdown document handling.
- Files: `src/intelligence/doc/AGENTS.md`, `src/intelligence/doc/read-ops.ts`, `src/intelligence/doc/index.ts`

## Test Coverage Gaps

**Co-located feature tests are not covered by the default root suite:**
- What's not tested: contract engine, tool implementations, hook behavior, and start-work routing in the default `npm test` lane.
- Files: `package.json`, `src/features/agent-work-contract/tools/create-contract-tool.test.ts`, `src/features/agent-work-contract/tools/export-contract-tool.test.ts`, `src/features/agent-work-contract/engine/chain-executor.test.ts`, `src/features/agent-work-contract/engine/contract-store.test.ts`, `src/hooks/start-work/start-work-router.test.ts`
- Risk: feature regressions can merge while the root test command still passes.
- Priority: High

**OpenTUI workspace tests and typechecks are opt-in only:**
- What's not tested: the Bun workspace runtime client and view contract in normal root CI usage.
- Files: `apps/opentui/package.json`, `apps/opentui/tests/runtime-status.test.tsx`, `apps/opentui/src/views/runtime-status.tsx`
- Risk: frontend/runtime-contract drift can ship unnoticed.
- Priority: Medium

---

*Concerns audit: 2026-03-21*
