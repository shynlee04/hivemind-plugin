# Codebase Concerns

**Analysis Date:** 2026-05-12

## Tech Debt

### plugin.ts Composition Root Bloat

- **Issue:** `src/plugin.ts` is 242 LOC against a documented target of 100 LOC. The composition root has accumulated business logic responsibilities beyond its "thin" charter — including inline error handling, session observer wiring, and legacy event-tracker bridge code.
- **Files:** `src/plugin.ts`
- **Impact:** Violates ARCHITECTURE.md directive ("plugin.ts is a thin composition root — no business logic"). Makes the bootstrap surface harder to reason about and test. Every new tool/hook requires a new import and registration line here.
- **Fix approach:** Extract session observer wiring into `src/hooks/observers/`, extract the event-tracker bridge into a dedicated compatibility module, and keep only tool registration and dep instantiation in plugin.ts. Target: ~100 LOC.

### Steering Engine — Empty Shell

- **Issue:** The steering engine feature has only 3 source files (`types.ts`, `steering-state.ts`, `schema/steering-policy.schema.ts`) with empty `conditions/` and `templates/` directories. The actual evaluation engine (policy evaluator, condition evaluator, injection builder, template renderer) has never been implemented. The test `tests/features/steering-engine/injection-builder.test.ts` fails because the source module `injection-builder.js` does not exist.
- **Files:** `src/features/steering-engine/steering-state.ts`, `src/features/steering-engine/types.ts`, `src/features/steering-engine/schema/steering-policy.schema.ts`, `src/features/steering-engine/conditions/`, `src/features/steering-engine/templates/`, `tests/features/steering-engine/injection-builder.test.ts`
- **Impact:** The steering engine is non-functional. Policy definitions can be parsed but never evaluated. Sessions receive no steering injections regardless of configuration. The empty directories give a false impression of completeness.
- **Fix approach:** Either implement the policy evaluator, condition matchers (hierarchy, depth, lineage, turns_since, phase, compaction, task_boundary), injection builder, and template renderer; or remove the entire steering engine feature and mark it as deferred.

### delegation_systems Config — Partial Runtime Consumer

- **Issue:** The `delegation_systems` config field in `.hivemind/configs.json` has a Zod schema and tests but incomplete runtime consumers. Only `background_delegation` is consumed (by `run-background-command.ts:160`). The `delegate_task` and `native_task` flags have no runtime consumer — delegation is always-on regardless of their values.
- **Files:** `src/schema-kernel/hivemind-configs.schema.ts` (schema with 3 sub-fields), `src/tools/hivemind/run-background-command.ts:160` (only consumer), `src/coordination/delegation/manager.ts` (no config check)
- **Impact:** Users who set `native_task: false` or `delegate_task: false` expecting restricted delegation will not get the expected behavior. This is a documented 🔴 CRITICAL issue in STATE.md. CP-PTY-04 has planned fixes but not yet implemented.
- **Fix approach:** Wire `delegation_systems.delegate_task` into `DelegationManager.dispatch()` and `native_task` into the spawner/task dispatch paths. See CP-PTY-04 PLAN.md.

### Schema-Kernel Barrel File Size

- **Issue:** `src/schema-kernel/index.ts` is 377 LOC — a barrel file that re-exports everything from every schema module. When any tool imports from this barrel, it forces the entire schema tree to be loaded. This increases cold-start time and module graph size.
- **Files:** `src/schema-kernel/index.ts`
- **Impact:** Unnecessary import-time cost for consumers that need only one or two schemas. The large barrel also makes it harder to identify circular dependencies.
- **Fix approach:** Convert barrel to direct-path imports at consumer sites. Either keep index.ts as a convenience barrel but migrate tools to direct imports, or remove barrel and add per-schema entrypoints to `package.json` exports.

### Stale `state/` Directory at Project Root

- **Issue:** The project root contains a `state/` directory with `question-count.json` (empty counters) and `intent.json` (empty fields). These appear to be orphaned artifacts from an earlier session-tracking approach and are not part of the `.hivemind/` canonical state root.
- **Files:** `state/question-count.json`, `state/intent.json`
- **Impact:** Violates the Q6 architectural decision that `.hivemind/` is the only internal state root. Creates confusion about where state is stored. The files themselves are empty/unused.
- **Fix approach:** Remove `state/` directory and ensure any state writing now goes through `.hivemind/` authorities. Add `state/` to `.gitignore` if not already present, or delete entirely since content is stale.

## Known Bugs

### Failing Test: injection-builder.test.ts

- **Symptoms:** `tests/features/steering-engine/injection-builder.test.ts` fails with `Cannot find module '../../../src/features/steering-engine/injection-builder.js'`. The source file `injection-builder.ts` does not exist in `src/features/steering-engine/`.
- **Files:** `tests/features/steering-engine/injection-builder.test.ts`, `src/features/steering-engine/`
- **Trigger:** Running `npm test` or `npm run test:coverage`.
- **Impact:** 1 failed suite out of 152. The test file itself is still counted in "files passed" metrics, masking the failure. No tests actually run from this file (0 tests reported).
- **Workaround:** Either implement the injection builder module, or delete the test file and mark the feature deferred.

### Vitest Mock Hoist Warnings

- **Symptoms:** Vitest v4.1.x emits deprecation warnings: `A vi.unmock("node:fs") call in "tests/lib/continuity.test.ts" is not at the top level of the module. Although it appears nested, it will be hoisted... This will become an error in a future version.`
- **Files:** `tests/lib/continuity.test.ts`, `tests/lib/delegation-persistence.test.ts`
- **Trigger:** Running any test suite that includes these files.
- **Impact:** Currently warnings only, but will become hard errors in a future Vitest version. The mocked modules (`node:fs`) may not behave as expected due to hoisting reordering.
- **Fix approach:** Move the `vi.unmock("node:fs")` calls to the top level of each test file, outside any `describe` or `beforeEach` blocks.

### eval/ Tests Not Integrated Into Main Suite

- **Symptoms:** The `eval/` directory contains 3 test files (`stability.test.ts`, `coherence.test.ts`, `correctness.test.ts`) that test config compiler behavior under stress, but these are NOT under the `tests/` directory. They may or may not be picked up by the vitest config depending on include patterns.
- **Files:** `eval/stability.test.ts`, `eval/coherence.test.ts`, `eval/correctness.test.ts`
- **Impact:** These tests exist in a non-standard location and may not run as part of `npm test`. Their results are invisible to the standard test reporting.
- **Fix approach:** Either move eval tests into `tests/` or configure vitest to include the `eval/` directory. Ensure they appear in `npm test` output.

## Security Considerations

### Direct console.error in Production Code

- **Risk:** `state-machine.ts` uses `console.error()` directly (line 282) instead of using a structured logging approach or sanitized output. This could leak internal delegation state (delegation IDs, error messages) into stdout/stderr in a non-structurable way.
- **Files:** `src/coordination/delegation/state-machine.ts:282`, `src/coordination/completion/notification-handler.ts:232`
- **Current mitigation:** The error messages are prefixed with `[Harness]` for identification. No sensitive data (tokens, keys) appears in the logged values.
- **Recommendations:** Replace `console.error` with a structured logging approach that allows consumers to control output verbosity and routing. At minimum, wrap in a conditional that respects a debug/log level setting.

### Heavy console.warn Usage in Session Tracker

- **Risk:** `src/features/session-tracker/` has 25+ `console.warn()` calls across its capture, recovery, and persistence modules. These are in hot paths (capture every tool call, every event) meaning stdout pollution is significant. Some messages include session IDs and file paths that could aid reconnaissance.
- **Files:** `src/features/session-tracker/capture/event-capture.ts` (8 calls), `src/features/session-tracker/capture/tool-capture.ts` (2 calls), `src/features/session-tracker/capture/message-capture.ts` (3 calls), `src/features/session-tracker/index.ts` (8 calls), `src/features/session-tracker/recovery/session-recovery.ts` (5 calls), `src/features/session-tracker/persistence/project-index-writer.ts` (1 call)
- **Current mitigation:** Messages are prefixed and avoid credentials/tokens.
- **Recommendations:** Implement a structured logger that can be silenced in production. Most `console.warn` calls in capture paths should be `console.debug` or behind a verbose flag. This is also a performance concern (see below).

## Performance Bottlenecks

### Session Tracker Capture — Excessive Logging on Hot Path

- **Problem:** Every tool call, message, and session event triggers multiple `console.warn` calls in the capture pipeline. For a typical delegation session with dozens of tool calls, this produces 100+ log lines for warn-level messages that are not actionable (mostly "event type not handled" or "session not found for event" noise).
- **Files:** `src/features/session-tracker/capture/event-capture.ts`, `src/features/session-tracker/capture/tool-capture.ts`, `src/features/session-tracker/capture/message-capture.ts`
- **Cause:** Defensive coding — many `catch` blocks and "expected" boundary conditions are logged at `warn` level instead of `debug`.
- **Improvement path:** Audit each `console.warn` call. If the condition is an expected edge case, demote to `console.debug`. If it indicates a real problem, add structured fields. Target: reduce per-tool-call log output by 80%.

### Schema-Kernel Barrel File

- **Problem:** `src/schema-kernel/index.ts` re-exports all 18+ schema modules. Importing from this barrel loads every schema definition, including heavy Zod schemas for configs, contracts, and command definitions.
- **Files:** `src/schema-kernel/index.ts`
- **Cause:** Barrel export pattern without tree-shakable import paths.
- **Improvement path:** Add per-schema entrypoints in `package.json` exports field, or migrate consumers to direct imports.

## Fragile Areas

### DelegationManager (~500 LOC)

- **Files:** `src/coordination/delegation/manager.ts`
- **Why fragile:** At exactly 500 LOC, this is at the hard cap. It orchestrates delegation dispatch, recovery, completion detector wiring, command delegation, SDK delegation, and concurrency acquisition. Any change to one flow risks breaking another. The `dispatchCommand` and `dispatch` methods share internal state but have different error handling paths.
- **Safe modification:** Add scoped tests before touching. Keep additions under 500 LOC total. Extract sub-responsibilities (recovery, command dispatch shaping) into helper modules.
- **Test coverage:** No direct unit tests exist for `DelegationManager`. Tests cover sub-components (state machine, category gates) but not the manager orchestration layer.

### DelegationStateMachine (~426 LOC)

- **Files:** `src/coordination/delegation/state-machine.ts`
- **Why fragile:** Complex state transitions with status validation, timer management, and reverse session-ID lookups. Uses `console.error` on error transitions which is non-structurable. The state machine has growing responsibility (SDK sessions, command sessions, safety timers, grace periods).
- **Safe modification:** Each new status must be registered in the validTransitions map AND the lifecycle hooks. Tests for state-machine transitions exist but may not cover all combinations.
- **Test coverage:** `tests/lib/coordination/delegation/` tests exist but the state machine is tested indirectly through delegation manager tests that don't exist.

### Session Tracker Capture Layer

- **Files:** `src/features/session-tracker/capture/event-capture.ts`, `src/features/session-tracker/capture/tool-capture.ts`, `src/features/session-tracker/capture/message-capture.ts`
- **Why fragile:** Three separate capture modules with overlapping concerns. Each has 6-8 `console.warn` catch-all handlers. The architecture splits capture across event, tool, and message boundaries but the boundaries are not clean — tool captures trigger event captures which trigger message captures. CP-ST-01 remediation found critical defects in this layer (project index frozen, child records write-once-only, child lifecycle events lost).
- **Safe modification:** Implement the CP-ST-01 planned fixes before adding new capture features. Add integration tests that verify end-to-end capture → persistence flow.
- **Test coverage:** Unit tests exist for individual capture functions, but no integration test proves a full capture → write → read cycle.

### Cross-Primitive Validator (~373 LOC)

- **Files:** `src/features/bootstrap/cross-primitive-validator.ts`
- **Why fragile:** Validates references across agents, skills, commands, MCP servers, and permissions. Has deep nesting for cross-reference resolution. A change in one primitive type's schema can cascade validation failures here.
- **Safe modification:** Add per-type validation test before changing schema shapes.
- **Test coverage:** `tests/lib/cross-primitive-validator.test.ts` exists but may not cover all 5-primitive-type combinations.

## Scaling Limits

### Zero Integration or E2E Tests

- **Current capacity:** 2008 tests, all unit-level.
- **Limit:** No test verifies that tools register correctly, that hooks fire in the right order, that delegation dispatch → completion detection → persistence forms a working pipeline. All tests use mocked SDK clients and isolated modules.
- **Scaling path:** Add at minimum 1 smoke integration test that starts a real plugin lifecycle with a fake/lightweight OpenCode client. Add 1 E2E test for the delegation → completion → persistence pipeline. Target: 3-5 integration tests as a gate for future changes.

### No Coverage Enforcement

- **Current capacity:** `npm run test:coverage` runs but there is no coverage threshold in vitest config. Coverage is viewed manually (or not at all).
- **Limit:** Modules can fall to 0% coverage without CI noticing. The session tracker capture layer, for example, has complex error paths that are likely uncovered.
- **Scaling path:** Add a `coverage.threshold` in vitest config, starting at a realistic baseline (e.g., 60% branch coverage for src/).

## Dependencies at Risk

### @json-render/* and React Stack in Main Package

- **Risk:** `@json-render/core`, `@json-render/ink`, `@json-render/next`, `@json-render/react`, `ink`, `react` are listed as dependencies of the main `hivemind` npm package. These packages are only used by the sidecar dashboard (`sidecar/`), which has its own `package.json` and is a separate Next.js project. They are never imported from `src/`.
- **Impact:** Adds ~20MB+ of unnecessary dependencies to `npm install hivemind`, increasing install time and disk usage. The `ink` (terminal React) + `react` (UI React) combination is particularly heavy.
- **Migration plan:** Remove `@json-render/*`, `ink`, `react`, and `react-dom` from the main `package.json`. Sidecar manages its own dependencies.

### commander — Unused Dependency

- **Risk:** `commander` is listed in `package.json` dependencies but is never imported in any `src/` module (only mentioned in a comment in `src/cli/router.ts:6`). The CLI uses a custom router built on top of `CliCommand[]` and `CliCommandContext`.
- **Impact:** Adds unnecessary install weight.
- **Migration plan:** Remove `commander` from `package.json` dependencies.

### @opencode-ai/sdk vs @opencode-ai/plugin

- **Risk:** `@opencode-ai/sdk` is a runtime dependency while `@opencode-ai/plugin` is a peer dependency. Both provide OpenCode client types. The SDK is imported in `src/coordination/sdk-delegation/handler.ts` and `src/shared/session-api.ts`. The plugin is imported in all tool files via `tool()` factory. Version mismatches between the two could cause type incompatibilities.
- **Impact:** If `@opencode-ai/sdk` and `@opencode-ai/plugin` diverge in OpenCodeClient type, the SDK delegation handler could receive incompatible client objects.
- **Migration plan:** Either use `@opencode-ai/plugin` types exclusively (it re-exports the SDK types), or add a peer dependency constraint on `@opencode-ai/sdk` matching the plugin version.

### bun-pty + bun-types + node-pty (Triple PTY)

- **Risk:** The project includes `bun-pty` (optional Bun-specific PTY), `bun-types` (Bun type definitions), and `node-pty` (cross-platform PTY). `bun-pty` is only importable in Bun runtime. `node-pty` requires native compilation (node-gyp). Both are always attempted at runtime via `createPtyManagerIfSupported()` which has a try-catch fallback chain.
- **Impact:** `npm install` runs `node-pty` native compilation on every install. If the build fails, the entire install may fail (depending on npm configuration). `bun-types` is not needed for compilation (it's a types-only package consumed as a dependency, not devDependency).
- **Migration plan:** Move `bun-types` to `devDependencies`. Document that `node-pty` and `bun-pty` are optional and failure is handled gracefully. Consider making both optional peer dependencies.

## Missing Critical Features

### f-04 Auto-Routing (CRITICAL)

- **Problem:** The auto-intent/workflow router (f-04) has never been implemented. There is no intent classification layer, no workflow routing, and no automatic skill selection based on user intent. The `category-gates.ts` specifically documents `checkSkillFilterAdvisory()` as "intentionally NOT called from any hook or tool yet — the WS-4 phase will wire it."
- **Files:** `src/routing/behavioral-profile/` (profile resolution only, no routing), `src/coordination/delegation/category-gates.ts:67-69`
- **Blocks:** Skill loading cannot be automatically scoped. Category gates cannot be wired. Behavioral profile resolution exists but has no consumer in the skill loading or delegation paths.
- **Priority:** 🔴 CRITICAL (per STATE.md)

### Steering Engine Injection Builder

- **Problem:** The steering engine spec (REQ-01 through REQ-07) defines a complete policy evaluation and injection pipeline. Only the state tracking and schema validation exist. The condition evaluator, policy matcher, injection builder, and template renderer are unimplemented.
- **Blocks:** Steering policies cannot be evaluated. Agents never receive contextual injection content.
- **Priority:** Medium — only blocks steering feature, not core delegation/continuity.

### E2E Tests (HIGH)

- **Problem:** Zero end-to-end tests exist. All 2008 tests are unit tests with mocked dependencies. There is no proof that the plugin loads, tools register, hooks compose, or delegation flows work in a real OpenCode environment.
- **Blocks:** Cannot ship with confidence. Integration bugs are discovered only at runtime.
- **Priority:** HIGH (per STATE.md)

## Test Coverage Gaps

### Coordination Module — Untested Core

- **What's not tested:** `DelegationManager` (`manager.ts`), `DelegationStateMachine` state transition orchestration, `CompletionDetector`, `CommandDelegationHandler`, spawner modules (`ralph-loop.ts`, `auto-loop.ts`, `session-creator.ts`, `agent-primitive-policy.ts`).
- **Files:** `src/coordination/delegation/manager.ts`, `src/coordination/delegation/state-machine.ts`, `src/coordination/completion/detector.ts`, `src/coordination/completion/notification-handler.ts`, `src/coordination/command-delegation/handler.ts`, `src/coordination/spawner/*`
- **Risk:** Core delegation logic (dispatch, completion, recovery) has no direct test coverage. Changes risk breaking the entire delegation pipeline without detection.
- **Priority:** 🔴 CRITICAL

### Tool Implementations — Untested Core

- **What's not tested:** All delegate-task, delegation-status, session-journal-export, execute-slash-command tools. The tool test files that exist (`tests/tools/`) test Zod schema validation and error cases but not the actual business logic of the tool handlers.
- **Files:** `src/tools/delegation/delegate-task.ts`, `src/tools/delegation/delegation-status.ts`, `src/tools/session/execute-slash-command.ts`, `src/tools/session/session-journal-export.ts`, `src/tools/session/session-patch/`
- **Risk:** Tool handlers can regress silently. Response shapes and error handling paths are untested.
- **Priority:** HIGH

### Zero Integration Tests

- **What's not tested:** Plugin lifecycle, hook registration → firing order, tool → feature → schema → response pipeline, delegation → completion → persistence flow, config → compiler → subscriber flow.
- **Files:** System-level across `src/plugin.ts`, `src/hooks/`, `src/tools/`
- **Risk:** Integration bugs are invisible until runtime. Module-level unit tests pass but the composed system fails.
- **Priority:** 🔴 CRITICAL

---

*Concerns audit: 2026-05-12*
