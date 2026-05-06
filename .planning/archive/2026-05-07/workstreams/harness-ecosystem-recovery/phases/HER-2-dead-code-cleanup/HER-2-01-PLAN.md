---
phase: HER-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/work-contract/
  - src/lib/supervisor/
  - src/lib/recovery-engine.ts
  - src/lib/runtime-detection/codemap.ts
  - src/lib/runtime-detection/codescan.ts
  - src/lib/runtime-detection/file-watcher.ts
  - src/lib/runtime-detection/index.ts
autonomous: true
requirements: [HER-2-A, HER-2-B]

must_haves:
  truths:
    - "work-contract/ directory no longer exists"
    - "supervisor/ directory no longer exists"
    - "recovery-engine.ts no longer exists"
    - "runtime-detection/ only exports stack-synthesizer"
    - "npm run typecheck passes with 0 errors"
    - "npm test passes (no new failures)"
    - "npm run build succeeds"
  artifacts:
    - path: "src/lib/work-contract/"
      provides: "Removed entirely"
    - path: "src/lib/supervisor/"
      provides: "Removed entirely"
    - path: "src/lib/recovery-engine.ts"
      provides: "Removed entirely"
    - path: "src/lib/runtime-detection/index.ts"
      provides: "Barrel exporting only stack-synthesizer"
  key_links:
    - from: "src/lib/runtime-detection/index.ts"
      to: "src/lib/runtime-detection/stack-synthesizer.ts"
      via: "re-export"
      pattern: "export.*stack-synthesizer"
---

<objective>
Remove confirmed dead code modules with zero runtime consumers.

Purpose: Reduce dead code ratio from 13.7% to <5% by removing modules that are fully superseded or have no consumers.
Output: 4 module groups removed (~1,739 LOC), runtime-detection/ trimmed to only stack-synthesizer.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-CONTEXT.md

# Dead code inventory
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md

# Key source files
@src/plugin.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove work-contract/ directory (613 LOC — superseded by agent-work-contracts/)</name>
  <files>src/lib/work-contract/</files>
  <read_first>
    - src/lib/work-contract/index.ts (verify zero external imports)
    - src/lib/agent-work-contracts/ (verify replacement exists and is wired)
  </read_first>
  <action>
Remove the entire `src/lib/work-contract/` directory (5 files: agent-work-contract.ts, chain-executor.ts, compaction-packet.ts, index.ts, intent-classifier.ts — 613 LOC total).

This module is superseded by `src/lib/agent-work-contracts/` which is actively wired to `hivemind-agent-work-create` and `hivemind-agent-work-export` tools in plugin.ts.

Steps:
1. Verify no imports from `work-contract/` exist anywhere in `src/` (excluding the directory itself): `grep -rn "work-contract\|from.*work-contract" src/ --include="*.ts" | grep -v "work-contract/" | grep -v "node_modules"`
2. Delete the directory: `rm -rf src/lib/work-contract/`
3. Run typecheck: `npm run typecheck`
4. Run build: `npm run build`
  </action>
  <verify>
    <automated>test ! -d src/lib/work-contract && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/lib/work-contract/` directory does not exist
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
    - `grep -rn "work-contract" src/ --include="*.ts"` returns no matches outside of `.planning/`
  </acceptance_criteria>
  <done>work-contract/ removed, typecheck and build pass</done>
</task>

<task type="auto">
  <name>Task 2: Remove supervisor/ directory (419 LOC — superseded by sdk-supervisor/ and command-engine/)</name>
  <files>src/lib/supervisor/</files>
  <read_first>
    - src/lib/supervisor/index.ts (verify zero external imports)
    - src/tools/hivemind-sdk-supervisor.ts (verify replacement exists)
    - src/tools/hivemind-command-engine.ts (verify replacement exists)
  </read_first>
  <action>
Remove the entire `src/lib/supervisor/` directory (5 files: command-bundle.ts, context-renderer.ts, health.ts, index.ts, messages-transform.ts — 419 LOC total).

This module is fully superseded:
- Health checks → `sdk-supervisor/` (wired to plugin.ts line 33)
- Command routing → `command-engine/` (wired to plugin.ts line 34)
- Context rendering → `command-engine/renderCommandContext()` (wired)
- Message transforms → explicitly stripped in Phase 35 (no-op hook)

Steps:
1. Verify no imports from `supervisor/` exist anywhere in `src/` (excluding the directory itself): `grep -rn "supervisor\|from.*supervisor" src/lib/supervisor/ src/ --include="*.ts" | grep -v "supervisor/" | grep -v "node_modules" | grep -v "hivemind-sdk-supervisor" | grep -v "sdk-supervisor"`
2. Delete the directory: `rm -rf src/lib/supervisor/`
3. Run typecheck: `npm run typecheck`
4. Run build: `npm run build`
  </action>
  <verify>
    <automated>test ! -d src/lib/supervisor && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/lib/supervisor/` directory does not exist
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
    - `grep -rn "from.*supervisor" src/lib/ --include="*.ts"` returns no matches (excluding sdk-supervisor references)
  </acceptance_criteria>
  <done>supervisor/ removed, typecheck and build pass</done>
</task>

<task type="auto">
  <name>Task 3: Remove recovery-engine.ts facade (72 LOC — zero consumers, recovery/ modules are wired directly)</name>
  <files>src/lib/recovery-engine.ts</files>
  <read_first>
    - src/lib/recovery-engine.ts (verify zero external imports)
    - src/lib/recovery/index.ts (verify recovery/ modules are independently wired)
  </read_first>
  <action>
Remove `src/lib/recovery-engine.ts` (72 LOC). This is a facade that bundles `recovery/` subsystem operations. The underlying `recovery/` modules ARE wired directly through their own tools — the facade has zero consumers.

Steps:
1. Verify no imports from `recovery-engine` exist anywhere in `src/`: `grep -rn "recovery-engine\|from.*recovery-engine" src/ --include="*.ts" | grep -v "recovery-engine.ts"`
2. Delete the file: `rm src/lib/recovery-engine.ts`
3. Run typecheck: `npm run typecheck`
4. Run build: `npm run build`
  </action>
  <verify>
    <automated>test ! -f src/lib/recovery-engine.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/lib/recovery-engine.ts` does not exist
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
    - `grep -rn "recovery-engine" src/ --include="*.ts"` returns no matches
  </acceptance_criteria>
  <done>recovery-engine.ts removed, typecheck and build pass</done>
</task>

<task type="auto">
  <name>Task 4: Remove runtime-detection/ dead files (407 LOC) and update barrel</name>
  <files>
    src/lib/runtime-detection/codemap.ts
    src/lib/runtime-detection/codescan.ts
    src/lib/runtime-detection/file-watcher.ts
    src/lib/runtime-detection/index.ts
  </files>
  <read_first>
    - src/lib/runtime-detection/index.ts (verify current exports)
    - src/lib/runtime-detection/stack-synthesizer.ts (verify it's the only live module)
    - src/lib/framework-detector.ts (verify current imports — stack-synthesizer has no external consumers but is kept as a useful utility)
  </read_first>
  <action>
Remove 3 dead files from `src/lib/runtime-detection/` and update the barrel:

1. Delete `codemap.ts` (3,448 LOC bytes / ~120 LOC)
2. Delete `codescan.ts` (5,445 LOC bytes / ~180 LOC)
3. Delete `file-watcher.ts` (3,778 LOC bytes / ~107 LOC)
4. Update `index.ts` to export only from `stack-synthesizer.ts`:

```typescript
export { synthesizeTechStack, type SynthesizedStack } from "./stack-synthesizer.js"
```

Note: `stack-synthesizer.ts` (90 LOC) is kept because it's a useful utility even though it has no current consumers — it provides tech stack synthesis that may be needed by future phases.

Steps:
1. Verify no imports from the dead files exist: `grep -rn "codemap\|codescan\|file-watcher" src/ --include="*.ts" | grep -v "runtime-detection/" | grep -v "node_modules"`
2. Delete the 3 files
3. Update `index.ts` barrel
4. Run typecheck: `npm run typecheck`
5. Run build: `npm run build`
  </action>
  <verify>
    <automated>test ! -f src/lib/runtime-detection/codemap.ts && test ! -f src/lib/runtime-detection/codescan.ts && test ! -f src/lib/runtime-detection/file-watcher.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/lib/runtime-detection/codemap.ts` does not exist
    - `src/lib/runtime-detection/codescan.ts` does not exist
    - `src/lib/runtime-detection/file-watcher.ts` does not exist
    - `src/lib/runtime-detection/index.ts` exists and exports only from `stack-synthesizer.js`
    - `src/lib/runtime-detection/stack-synthesizer.ts` still exists
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>runtime-detection/ dead files removed, barrel updated, typecheck and build pass</done>
</task>

</tasks>

<verification>
1. `npm run typecheck` — 0 errors
2. `npm run build` — succeeds
3. `npm test` — no new failures (pre-existing 2 failures in session-journal tests are acceptable)
4. Dead code audit: `grep -rn "work-contract\|supervisor\|recovery-engine\|codemap\|codescan\|file-watcher" src/lib/ --include="*.ts"` returns 0 matches (excluding stack-synthesizer references)
</verification>

<success_criteria>
- ~1,739 LOC of confirmed dead code removed
- 4 module groups eliminated (work-contract/, supervisor/, recovery-engine.ts, runtime-detection/ dead files)
- Zero new typecheck errors
- Zero new test failures
- Build succeeds
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-01-SUMMARY.md`
</output>
