---
phase: CP-DT-01
plan: 06-runtime-gaps
type: gap_closure
wave: 6
date: 2026-05-18
depends_on:
  - CP-DT-01-01
  - CP-DT-01-02
  - CP-DT-01-03
  - CP-DT-01-04
  - CP-DT-01-05
files_modified:
  - .planning/STATE.md
  - .planning/ROADMAP.md
  - .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
  - .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
  - .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
  - .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md
  - .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
  - src/coordination/delegation/dispatcher.ts
  - src/coordination/delegation/monitor.ts
  - src/coordination/delegation/coordinator.ts
  - src/coordination/completion/detector.ts
  - src/tools/delegation/delegate-task.ts
  - src/tools/delegation/delegation-status.ts
  - src/coordination/delegation/manager.ts
  - src/features/auto-loop/index.ts
  - src/features/ralph-loop/index.ts
  - src/plugin.ts
  - tests/tools/delegation/delegate-task-v2.test.ts
  - tests/tools/delegation/delegation-status-v2.test.ts
  - tests/integration/delegation-v2-integration.test.ts
autonomous: false
requirements:
  - REQ-DT-01
  - REQ-DT-04
  - REQ-DT-06
  - REQ-DT-07
  - REQ-DT-08
  - REQ-DT-09
  - REQ-CD-01
  - REQ-CD-02
  - REQ-CD-03
  - REQ-MT-03
  - REQ-MT-04
  - REQ-AL-01
  - REQ-AL-02
  - REQ-RC-01
  - REQ-RC-02
  - REQ-RC-03
  - REQ-DC-01
  - REQ-DC-02
  - REQ-DC-03
  - REQ-DC-04
  - NFR-01
  - NFR-02
  - NFR-03
  - NFR-04
  - NFR-05
  - NFR-06
must_haves:
  truths:
    - "CP-DT-01 is explicitly marked RE-OPENED / RUNTIME BLOCKED until runtime dispatch proof exists."
    - "No planning artifact claims plugin ToolContext exposes context.task."
    - "delegate-task and delegation-status do not rely on a local ToolContext.task extension as runtime truth."
    - "Tests distinguish mocked dependency injection from OpenCode plugin runtime evidence."
    - "The 5 original plan summaries remain preserved as historical execution artifacts, not completion proof."
    - "Final verification includes L1-L3 evidence before any complete claim."
  artifacts:
    - path: ".planning/forensics/report-20260518-105705.md"
      provides: "Root-cause evidence for false context.task seam."
    - path: "node_modules/@opencode-ai/plugin/dist/tool.d.ts"
      provides: "Local SDK ToolContext contract for @opencode-ai/plugin 1.15.4."
    - path: "src/tools/delegation/delegate-task.ts"
      provides: "Current false runtime seam to remove or replace."
  key_links:
    - from: "CP-DT-01-03-SUMMARY.md"
      to: "src/tools/delegation/delegate-task.ts"
      via: "mocked/injectable native Task seam must be reclassified as non-runtime proof"
    - from: "CP-DT-01-05-SUMMARY.md"
      to: "tests/integration/delegation-v2-integration.test.ts"
      via: "integration tests must prove runtime contract limits, not only mocked SDK seams"
---

# CP-DT-01 Runtime Truth Gap Closure Plan

<objective>
Remediate CP-DT-01 after forensic evidence proved the central native Task seam false: OpenCode plugin `ToolContext` does not expose `context.task`. This plan preserves the original 5-plan trace as historical execution work, corrects governance truth first, then remediates code and tests in the same order as Plans 01-05.

Purpose: turn CP-DT-01 from a false complete claim into a runtime-truthful remediation loop.
Output: corrected planning artifacts, corrected dispatch contract, corrected tests, and fresh runtime evidence gate before any completion claim.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/forensics/report-20260518-105705.md
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
@.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md
@node_modules/@opencode-ai/plugin/package.json
@node_modules/@opencode-ai/plugin/dist/tool.d.ts
@src/tools/delegation/delegate-task.ts
@src/tools/delegation/delegation-status.ts
@src/coordination/delegation/coordinator.ts
@src/coordination/delegation/manager.ts
@src/plugin.ts
</context>

<constraints>
- Do not mark CP-DT-01 complete until runtime proof exists.
- Do not treat mocked `nativeTask` injection as L1 evidence.
- Do not depend on future OpenCode changes to add `task` to `ToolContext`.
- Do not rewrite unrelated dirty worktree changes.
- Validate OpenCode API/signature claims against local installed package and online/upstream evidence before changing source contracts.
- Preserve original Plans 01-05 and summaries as historical artifacts; add remediation status instead of deleting them.
</constraints>

<tasks>

<task type="manual-first">
  <name>Task 1: Correct governance truth before source edits</name>
  <read_first>
    .planning/forensics/report-20260518-105705.md,
    .planning/STATE.md,
    .planning/ROADMAP.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
  </read_first>
  <action>
    Update planning artifacts so they state the corrected truth:
    - CP-DT-01 status is `RE-OPENED / RUNTIME BLOCKED`.
    - OpenCode plugin `ToolContext` for `@opencode-ai/plugin` 1.15.4 has no `task` field.
    - Assumption A1 is disproven for plugin custom tools, not deferred.
    - `CP-DT-01-01` through `CP-DT-01-05` are historical implementation waves requiring remediation, not runtime completion proof.
    - `CP-DT-01-GATE-SPEC.md` invalidates DC-01 PASS and AP-07 PASS until runtime-contract tests and runtime smoke evidence exist.
  </action>
  <acceptance_criteria>
    - `grep -R "RE-OPENED / RUNTIME BLOCKED" .planning/STATE.md .planning/ROADMAP.md .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/*.md` returns matches.
    - `grep -R "context.task" .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-*.md` shows only invalid/disproven/mocked-seam references, not runtime-ready claims.
    - `.planning/ROADMAP.md` contains `CP-DT-01-06-RUNTIME-GAPS-2026-05-18-PLAN.md`.
  </acceptance_criteria>
</task>

<task type="research-then-code">
  <name>Task 2: Reassess Plan 01/02 coordination contracts under verified dispatch limits</name>
  <read_first>
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md,
    src/coordination/delegation/dispatcher.ts,
    src/coordination/delegation/monitor.ts,
    src/coordination/delegation/coordinator.ts,
    src/coordination/completion/detector.ts
  </read_first>
  <action>
    Reassess preflight, monitoring, lifecycle, and dual-signal completion so they do not assume child-session dispatch exists via `context.task`. Keep SDK-free pure coordination where valid, but make dispatch result types explicitly represent one of these verified outcomes:
    - supported runtime child-session dispatch path, if proven by current OpenCode APIs;
    - unsupported runtime dispatch path with clear error and no false delegation record completion;
    - external command/PTY dispatch path only if routed to CP-PTY scope and explicitly marked as non-native-task.
  </action>
  <acceptance_criteria>
    - `src/coordination/delegation/**` types include an explicit unsupported/blocked dispatch state or a verified dispatch proof path.
    - Coordinator/monitor tests fail before remediation when runtime dispatch is unavailable but lifecycle claims success.
    - Coordinator/monitor tests pass after remediation and no test labels mocked dispatch as L1 runtime proof.
  </acceptance_criteria>
</task>

<task type="tdd">
  <name>Task 3: Rewrite Plan 03 tool contract without false ToolContext.task seam</name>
  <read_first>
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md,
    node_modules/@opencode-ai/plugin/package.json,
    node_modules/@opencode-ai/plugin/dist/tool.d.ts,
    src/tools/delegation/delegate-task.ts,
    src/tools/delegation/delegation-status.ts,
    tests/tools/delegation/delegate-task-v2.test.ts,
    tests/tools/delegation/delegation-status-v2.test.ts
  </read_first>
  <action>
    Replace the local `ToolContext` extension that adds `task?: NativeTask`. The tool contract must either call a verified OpenCode child-session mechanism or return a truthful unsupported/error response that instructs the caller which supported harness path to use. Restart/redirect in `delegation-status` must follow the same verified contract and must not read `context.task`.
  </action>
  <acceptance_criteria>
    - `grep -R "task?: NativeTask\|context\.task" src/tools/delegation/delegate-task.ts src/tools/delegation/delegation-status.ts` returns no runtime seam usage.
    - Tests assert plugin `ToolContext` shape does not include `task`.
    - Tests assert mocked/injected `nativeTask` paths are classified as test seam only or removed.
    - `npx vitest run tests/tools/delegation/delegate-task-v2.test.ts tests/tools/delegation/delegation-status-v2.test.ts --reporter=verbose` passes.
  </acceptance_criteria>
</task>

<task type="tdd">
  <name>Task 4: Adjust Plan 04 auto-loop, ralph-loop, and chaining to corrected dispatch contract</name>
  <read_first>
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md,
    src/features/auto-loop/index.ts,
    src/features/ralph-loop/index.ts,
    src/coordination/delegation/coordinator.ts,
    src/coordination/delegation/manager.ts,
    tests/lib/features/auto-loop.test.ts,
    tests/lib/features/ralph-loop.test.ts,
    tests/lib/coordination/delegation/manager-decomposition.test.ts
  </read_first>
  <action>
    Ensure auto-loop, ralph-loop, and chaining stop truthfully when dispatch is runtime-blocked, and only continue iterations when the corrected dispatch contract returns a real terminal result. Previous-result prompt chaining must not fabricate success from a blocked dispatch state.
  </action>
  <acceptance_criteria>
    - Auto-loop tests cover blocked dispatch and stop without creating fake next iteration success.
    - Ralph-loop tests cover blocked dispatch and preserve per-agent failure reporting.
    - Manager facade tests cover corrected dispatch status propagation.
    - `npx vitest run tests/lib/coordination/delegation/manager-decomposition.test.ts tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose` passes.
  </acceptance_criteria>
</task>

<task type="verification-gated">
  <name>Task 5: Rebuild Plan 05 plugin/runtime evidence and final gates</name>
  <read_first>
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md,
    src/plugin.ts,
    tests/integration/delegation-v2-integration.test.ts,
    tests/lib/coordination/delegation/full-pipeline.test.ts,
    tests/tools/delegation/delegate-task-e2e.test.ts,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md,
    .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
  </read_first>
  <action>
    Update plugin wiring and integration tests so evidence labels match reality. Runtime-contract tests must prove either a verified child-session dispatch mechanism or a truthful blocked state. Final validation must require L1-L3 runtime proof before changing CP-DT-01 back to complete.
  </action>
  <acceptance_criteria>
    - Integration/e2e tests do not claim mocked SDK seams prove live OpenCode Task execution.
    - `npm run typecheck` passes.
    - Focused delegation tests pass.
    - `CP-DT-01-VALIDATION.md` records the exact evidence level for each claim.
    - Completion remains blocked unless L1 runtime smoke proves `delegate-task` starts or correctly coordinates a child/subagent session through a verified mechanism.
  </acceptance_criteria>
</task>

</tasks>

<verification_commands>
1. `grep -R "RE-OPENED / RUNTIME BLOCKED" .planning/STATE.md .planning/ROADMAP.md .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/*.md`
2. `grep -R "task?: NativeTask\|context\.task" src/tools/delegation/delegate-task.ts src/tools/delegation/delegation-status.ts`
3. `npx vitest run tests/tools/delegation/delegate-task-v2.test.ts tests/tools/delegation/delegation-status-v2.test.ts --reporter=verbose`
4. `npx vitest run tests/lib/coordination/delegation/ tests/lib/features/auto-loop.test.ts tests/lib/features/ralph-loop.test.ts --reporter=verbose`
5. `npx vitest run tests/integration/delegation-v2-integration.test.ts tests/tools/delegation/delegate-task-e2e.test.ts --reporter=verbose`
6. `npm run typecheck`
</verification_commands>

<stop_conditions>
- Stop if OpenCode upstream/local SDK still exposes no verified custom-tool child-session dispatch path and no alternative supported harness path has been selected.
- Stop if any artifact tries to reclassify mocked `nativeTask` injection as L1 evidence.
- Stop if source edits require CP-PTY scope before CP-DT docs record that dependency.
- Stop before CP-PTY-01 routing if CP-DT-01 remains runtime-blocked.
</stop_conditions>

<handoff>
After this plan is accepted, execute in order:
1. `/gsd-execute-phase CP-DT-01 --wave 6 --text`
2. `/gsd-code-review CP-DT-01 --depth=deep`
3. `/gsd-validate-phase CP-DT-01`
4. `/gsd-verify-work CP-DT-01 --runtime-smoke-required`

If the GSD command parser cannot resolve `CP-DT-01` because ROADMAP uses a non-numeric phase key, manually route the same plan file to `gsd-executor` with this file as the authoritative execution prompt.
</handoff>
