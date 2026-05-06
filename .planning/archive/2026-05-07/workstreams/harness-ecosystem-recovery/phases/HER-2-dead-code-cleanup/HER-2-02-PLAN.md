---
phase: HER-2
plan: 02
type: execute
wave: 2
depends_on: [HER-2-01]
files_modified:
  - src/plugin.ts
  - src/lib/notification-handler.ts
  - src/hooks/create-core-hooks.ts
  - src/lib/auto-loop.ts
  - src/lib/ralph-loop.ts
autonomous: true
requirements: [HER-2-C, HER-2-D]

must_haves:
  truths:
    - "auto-loop.ts is imported and registered in plugin.ts"
    - "ralph-loop.ts is imported and registered in plugin.ts"
    - "notification-handler.ts has no DEPRECATED tag"
    - "create-core-hooks.ts has correct comment about notification-handler"
    - "notification-handler.ts does not export buildTaskNotificationFromContinuity"
    - "npm run typecheck passes with 0 errors"
    - "npm test passes (no new failures)"
  artifacts:
    - path: "src/plugin.ts"
      provides: "auto-loop and ralph-loop imports added"
      contains: "auto-loop"
    - path: "src/lib/notification-handler.ts"
      provides: "Clean notification handler without DEPRECATED tag"
    - path: "src/hooks/create-core-hooks.ts"
      provides: "Correct comment about notification-handler status"
  key_links:
    - from: "src/plugin.ts"
      to: "src/lib/auto-loop.ts"
      via: "import"
      pattern: "import.*auto-loop"
    - from: "src/plugin.ts"
      to: "src/lib/ralph-loop.ts"
      via: "import"
      pattern: "import.*ralph-loop"
---

<objective>
Wire auto-loop and ralph-loop as runtime features in plugin.ts, and fix notification-handler boundary violations.

Purpose: Enable autonomous multi-iteration agent workflows (auto-loop) and validate-fix-redispatch cycles (ralph-loop). Clean up stale DEPRECATED tag and incorrect comments about notification-handler.
Output: 2 loop primitives wired, notification-handler boundary violations fixed.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-CONTEXT.md

# Key source files
@src/plugin.ts
@src/lib/auto-loop.ts
@src/lib/ralph-loop.ts
@src/lib/notification-handler.ts
@src/hooks/create-core-hooks.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix notification-handler boundary violations (D-06 through D-09)</name>
  <files>
    src/lib/notification-handler.ts
    src/hooks/create-core-hooks.ts
  </files>
  <read_first>
    - src/lib/notification-handler.ts (full file — verify DEPRECATED tag location, exports)
    - src/hooks/create-core-hooks.ts (line 8 — stale comment)
    - src/lib/lifecycle-manager.ts (line 9 — verify import is valid)
    - src/lib/delegation-state-machine.ts (line 22 — verify import is valid)
  </read_first>
  <action>
Fix 4 boundary violations in notification-handler.ts and create-core-hooks.ts:

**D-06: Remove DEPRECATED tag from notification-handler.ts**
- The file currently has a comment at line 1-8 that says "Re-activated in Phase 16.2" — this is correct. There is NO explicit "DEPRECATED" string in the file (verified via grep). The AGENTS.md documentation is already correct. No change needed for D-06.

**D-07: Fix stale comment in create-core-hooks.ts:8**
- Current: `Stripped in 35: notification-handler, messages-transform removed (dead code).`
- This is INCORRECT — notification-handler was re-activated in Phase 16.2 and is actively imported by lifecycle-manager.ts and delegation-state-machine.ts.
- Fix: Change line 8 to: `Stripped in 35: messages-transform removed (dead code). Notification-handler re-activated in Phase 16.2.`

**D-08: Remove unused export `buildTaskNotificationFromContinuity`**
- In `src/lib/notification-handler.ts`, remove the `buildTaskNotificationFromContinuity` function (lines 94-145 approximately).
- This function has tests but zero production callers (verified via grep).
- Keep all other exports: `buildNotificationMessage`, `formatToastMessage`, `notifyParentSession`, `replayPendingNotifications`, `notifyDelegationTerminal`, `TaskNotification` type.

**D-09: Keep all other exports** — `notifyDelegationTerminal` and `replayPendingNotifications` are on the runtime hot path (imported by delegation-state-machine.ts and lifecycle-manager.ts respectively).

Steps:
1. Edit `src/hooks/create-core-hooks.ts` line 8 to fix the stale comment
2. Remove `buildTaskNotificationFromContinuity` function from `src/lib/notification-handler.ts`
3. Run typecheck: `npm run typecheck`
4. Run tests: `npm test` — expect same pre-existing 2 failures, no new failures
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | tail -3 && grep -c "DEPRECATED" src/lib/notification-handler.ts</automated>
  </verify>
  <acceptance_criteria>
    - `src/hooks/create-core-hooks.ts` line 8 does NOT say "notification-handler...removed (dead code)"
    - `src/lib/notification-handler.ts` does NOT contain `buildTaskNotificationFromContinuity`
    - `src/lib/notification-handler.ts` still exports `notifyDelegationTerminal` and `replayPendingNotifications`
    - `npm run typecheck` exits 0
    - No new test failures
  </acceptance_criteria>
  <done>notification-handler boundary violations fixed, stale comment corrected, unused export removed</done>
</task>

<task type="auto">
  <name>Task 2: Wire auto-loop and ralph-loop in plugin.ts (D-01, D-02, D-03)</name>
  <files>src/plugin.ts</files>
  <read_first>
    - src/plugin.ts (full file — understand current structure)
    - src/lib/auto-loop.ts (understand exports: runAutoLoop, AutoLoopOptions, AutoLoopResult, AutoLoopVerification)
    - src/lib/ralph-loop.ts (understand exports: runRalphLoop, RalphLoopOptions, RalphLoopResult, RalphValidation, escalationMessage)
    - src/hooks/plugin-event-observers.ts (understand event observer pattern)
  </read_first>
  <action>
Wire auto-loop.ts and ralph-loop.ts as runtime capabilities in plugin.ts.

These are pure DI orchestrators with no side effects — they are imported and re-exported so that tools and hooks can use them. The wiring pattern follows the existing convention: import the module, make it available through the deps bundle.

**D-01:** Wire both as runtime features in plugin.ts
**D-02:** auto-loop (146 LOC) — pure async orchestrator for self-referential dev loops. Import `runAutoLoop` and its types.
**D-03:** ralph-loop (182 LOC) — pure async orchestrator for validate-fix-redispatch cycles. Import `runRalphLoop`, `escalationMessage`, and its types.

Steps:
1. Add imports to `src/plugin.ts`:
   ```typescript
   import { runAutoLoop, type AutoLoopOptions, type AutoLoopResult, type AutoLoopVerification } from "./lib/auto-loop.js"
   import { runRalphLoop, escalationMessage, type RalphLoopOptions, type RalphLoopResult, type RalphValidation } from "./lib/ralph-loop.js"
   ```

2. Add to the `deps` bundle (line 74) so hooks and tools can access them:
   ```typescript
   const deps = {
     client,
     lifecycleManager,
     stateManager: taskState,
     runAutoLoop,
     runRalphLoop,
     escalationMessage,
   }
   ```

3. Update `src/hooks/types.ts` to add the new deps to the `HookDependencies` interface (if it doesn't already have them). Read the file first to check.

4. Run typecheck: `npm run typecheck`
5. Run build: `npm run build`
6. Run tests: `npm test`

Note: The loop primitives are pure functions — they don't register as tools or hooks. They are made available through the deps bundle so that future tool implementations (e.g., a `run-auto-loop` tool) can use them. This is the minimum viable wiring per D-01.
  </action>
  <verify>
    <automated>grep -c "auto-loop\|ralph-loop" src/plugin.ts && npm run typecheck 2>&1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `src/plugin.ts` contains `import.*auto-loop` and `import.*ralph-loop`
    - `src/plugin.ts` deps bundle includes `runAutoLoop` and `runRalphLoop`
    - `npm run typecheck` exits 0
    - `npm run build` exits 0
    - No new test failures
  </acceptance_criteria>
  <done>auto-loop and ralph-loop wired in plugin.ts deps bundle</done>
</task>

</tasks>

<verification>
1. `npm run typecheck` — 0 errors
2. `npm run build` — succeeds
3. `npm test` — no new failures
4. `grep -c "auto-loop\|ralph-loop" src/plugin.ts` — returns 2+ matches
5. `grep -c "DEPRECATED" src/lib/notification-handler.ts` — returns 0
6. `grep -c "buildTaskNotificationFromContinuity" src/lib/notification-handler.ts` — returns 0
</verification>

<success_criteria>
- auto-loop.ts and ralph-loop.ts imported and available in plugin.ts deps
- notification-handler.ts boundary violations fixed (D-06 through D-09)
- create-core-hooks.ts stale comment corrected
- Zero new typecheck errors
- Zero new test failures
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-2-dead-code-cleanup/HER-2-02-SUMMARY.md`
</output>
