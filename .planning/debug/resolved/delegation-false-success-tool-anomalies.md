---
status: diagnosed
trigger: "Investigate issue: delegation-false-success-tool-anomalies"
created: 2026-04-09T00:00:00.000Z
updated: 2026-04-09T00:28:00.000Z
---

## Current Focus

hypothesis: confirmed — false-success comes from a three-part chain: plugin-level BackgroundManager split, child-session ownership mismatch, and builtin-process stub behavior; remaining concerns are secondary or architectural
test: root cause validation complete from direct source inspection
expecting: structured diagnosis only
next_action: return diagnosis with priority-ordered next actions and routing recommendation

## Symptoms

expected: delegated background work should be trackable from the parent session, builtin-process should perform real work rather than echo the prompt, and runtime/delegation/governance behavior should be observable and trustworthy from the user side.
actual: delegate-task reports success with convincing lifecycle metadata, but background tasks appear missing or non-functional; diagnostic reports claim two critical bugs plus related architecture/tooling anomalies.
errors: background tasks reported as not found after successful delegate-task calls; false-success pattern; concerns about runtime, background delegation agents, harness lifecycle, configurability, and governance visibility.
reproduction: use the evidence already captured in `.hivemind/research/diagnostic/delegation-false-success-tool-anomalies-2026-04-09.md`, `.hivemind/research/diagnostic/harness-comprehensive-diagnostic-2026-04-09.md`, and current source files around delegate-task, lifecycle-manager, lifecycle-process-runner, background-manager, and tools/background.
started: issue identified from real run export/session analysis on 2026-04-09; phase state currently says 17/18 verified with one known runtime-policy seam still open.

## Eliminated

- hypothesis: the session-scoping mismatch alone fully explains why background tasks are not found
  evidence: plugin.ts creates one BackgroundManager for the background tool, while HarnessLifecycleManager creates a different internal BackgroundManager because plugin.ts does not pass backgroundManager into createHarnessLifecycleManager; this makes delegate-task and background tool read/write different task maps even before parentSessionID filtering is applied
  timestamp: 2026-04-09T00:16:00.000Z

## Evidence

- timestamp: 2026-04-09T00:05:00.000Z
  checked: provided diagnostic reports
  found: both reports claim a session-scoping mismatch and builtin-process no-op as the core false-success causes
  implication: current source must be checked directly because both reports infer behavior from the same runtime symptom

- timestamp: 2026-04-09T00:08:00.000Z
  checked: knowledge base + debug references
  found: no existing debug knowledge base file; thinking-models-debug and common-bug-patterns both point to simple single-point failures and state/source-of-truth mismatches as first checks
  implication: prioritize direct wiring and ownership checks before broader architectural theories

- timestamp: 2026-04-09T00:12:00.000Z
  checked: src/plugin.ts and src/lib/lifecycle-manager.ts
  found: plugin.ts creates `const backgroundManager = new BackgroundManager()` only for `createBackgroundTool(...)`, but `createHarnessLifecycleManager(...)` is called without a backgroundManager option, so lifecycle-manager falls back to `new BackgroundManager()` internally
  implication: delegate-task spawned process tasks and the background tool do not share the same task registry; parent session queries can never see tasks created by lifecycle-manager's private manager

- timestamp: 2026-04-09T00:14:00.000Z
  checked: src/lib/lifecycle-process-runner.ts and src/lib/execution-mode.ts
  found: research/headless delegation routes to `builtin-process`, and `buildBuiltinProcessCommand()` only runs `node -e` that reads HARNESS_DELEGATION_PROMPT and writes the prompt text to stdout
  implication: even if task tracking worked, builtin-process does not delegate real work through the SDK; it is a no-op/stub that returns the prompt body as fake output

- timestamp: 2026-04-09T00:15:00.000Z
  checked: src/lib/lifecycle-process-runner.ts and src/tools/background/index.ts
  found: `backgroundManager.spawn()` receives `parentSessionID: args.sessionID` (child session) while background tool ownership checks compare task.parentSessionID against the caller sessionID (normally the parent session)
  implication: even after unifying BackgroundManager instances, parent-owned background list/status/wait would still fail for delegate-task-created builtin-process tasks because ownership is written against the child session instead of the parent

- timestamp: 2026-04-09T00:17:00.000Z
  checked: tests/lib/background-manager-harden.test.ts, tests/tools/background.test.ts, tests/integration/v3-e2e.test.ts
  found: tests validate injected BackgroundManager behavior and direct background-tool ownership, but do not cover plugin wiring where the tool and lifecycle manager use separate BackgroundManager instances
  implication: the current false-success regression can pass unit/integration coverage because the failing composition-root wiring is untested

- timestamp: 2026-04-09T00:20:00.000Z
  checked: src/hooks/create-tool-guard-hooks.ts
  found: `tool.execute.after` injects a large `_harness` metadata object including continuity metadata, lifecycle, recovery, routing, and governance on every tool response
  implication: the reports are correct that metadata can amplify the illusion of progress, but this is an observability/noise concern layered on top of the real execution bugs rather than the root cause of missing work

- timestamp: 2026-04-09T00:22:00.000Z
  checked: .planning/STATE.md and src/schema-kernel/prompt-enhance.schema.ts
  found: project state explicitly says ContextBudgetRecordSchema, EnhancedPromptOutputSchema, and PipelineStateSchema are being kept as contracts/placeholders, even though they are not currently produced by active tools
  implication: calling them "dead schemas" is directionally true from runtime usage, but inaccurate as an immediate bug classification; this is a product/architecture cleanup decision, not the delegation failure root cause

- timestamp: 2026-04-09T00:23:00.000Z
  checked: .planning/STATE.md and src/hooks/create-tool-guard-hooks.ts
  found: runtimePolicyOverride is only consumed in tool guard policy resolution and has no live producer path in the inspected delegation flow; STATE.md already records this as the remaining Phase 02 verification seam
  implication: runtime-policy/governance trust concerns are partially valid but represent a known open architecture/verification gap, separate from the false-success delegation bug

## Resolution

root_cause: 
root_cause: delegate-task background execution is broken by composition and execution-path defects, not a single bug. The plugin wires the background tool to one BackgroundManager while lifecycle-manager uses a separate internal BackgroundManager, so delegated builtin-process tasks are invisible to the user-facing background tool. Even if that is fixed, lifecycle-process-runner stores delegated process tasks under the child session ID instead of the parent session ID, so parent ownership checks still fail. Even if both tracking issues are fixed, builtin-process only echoes HARNESS_DELEGATION_PROMPT to stdout and never invokes the OpenCode SDK, so the delegated work still does not actually run.
fix: diagnosis only — no fix applied
verification: validated against current source, tests, and phase state; no implementation performed
files_changed: []
