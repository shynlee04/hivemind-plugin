# Codebase Concerns

**Analysis Date:** 2026-04-25

## Tech Debt

### `notification-handler.ts` — Dead Code Retained
- **Issue:** Entire module (`src/lib/notification-handler.ts`, 179 LOC) is `@deprecated` and NOT imported by any active delegation path. Retained for "potential future re-integration" but has been dead since WaiterModel replaced push notifications with stability polling.
- **Files:** `src/lib/notification-handler.ts`
- **Impact:** Increases bundle size, confuses new contributors, creates maintenance burden for code that never runs. The `@deprecated` comment says "remove by Phase 20" — a deadline that has likely passed.
- **Fix approach:** Delete the file entirely. If push notifications are needed later, they can be reimplemented from scratch or restored from git history.

### `lifecycle-manager.ts` — Stub Implementation
- **Issue:** `src/lib/lifecycle-manager.ts` (152 LOC) is a minimal stub. The comment says "Stripped to compile after 09-13 module deletion. Plan 14-02 will replace this." Key methods like `isValidTransition`, `noteObservedActivity`, and `launchDelegatedSession` are either no-ops or thin facades.
- **Files:** `src/lib/lifecycle-manager.ts`
- **Impact:** Lifecycle validation is effectively disabled. `isValidTransition` always returns `true`, meaning no transition guards are enforced. `noteObservedActivity` is a no-op, so activity tracking never happens.
- **Fix approach:** Complete Plan 14-02 implementation or remove the stub and inline what's needed.

### `continuity.ts` Module-Level Singleton
- **Issue:** `src/lib/continuity.ts:19` declares `let storeCache: ContinuityStoreFile | undefined` — a module-level singleton that prevents isolated unit testing. Any test that loads this module shares the same cache.
- **Files:** `src/lib/continuity.ts`
- **Impact:** Tests cannot verify isolated store behavior. Tests must clear or reset the singleton between cases, creating hidden coupling.
- **Fix approach:** Inject the cache as a constructor parameter or use a factory function that returns a fresh store instance.

### `asString` Duplicated in Two Modules
- **Issue:** `asString` function exists in both `src/lib/helpers.ts:87` and is duplicated in `src/lib/continuity.ts`.
- **Files:** `src/lib/helpers.ts`, `src/lib/continuity.ts`
- **Impact:** Risk of divergence if one copy is updated and the other is not.
- **Fix approach:** Export from `helpers.ts` only, import in `continuity.ts`.

### `types.ts` Bloated at 405 LOC
- **Issue:** `src/lib/types.ts` is the largest file in the codebase (405 LOC). It mixes type definitions, constants, and exported values. As the leaf node imported by most modules, any change cascades widely.
- **Files:** `src/lib/types.ts`
- **Impact:** High blast radius for changes. File is hard to navigate. Violates the 500 LOC target (close to ceiling).
- **Fix approach:** Split into `types/` directory: `task-types.ts`, `session-types.ts`, `policy-types.ts`, `constants.ts`.

### `delegation-manager.ts` at 309 LOC — Largest Functional Module
- **Issue:** `src/lib/delegation-manager.ts` (309 LOC) handles WaiterModel dispatch, stability polling, persistence, command delegation, SDK delegation, PTY integration, and spawner coordination. It imports from 12 different modules.
- **Files:** `src/lib/delegation-manager.ts`
- **Impact:** High coupling. Changes to any delegation aspect risk affecting others. Hard to unit test in isolation.
- **Fix approach:** Extract PTY-specific logic and spawner coordination into separate modules. DelegationManager should orchestrate, not implement.

### `state.ts` Uses `[key: string]: unknown` Index Signature
- **Issue:** `src/lib/state.ts:46` defines `SessionStatus` with `[key: string]: unknown` index signature, which defeats TypeScript's type safety.
- **Files:** `src/lib/state.ts`
- **Impact:** Any property can be added to `SessionStatus` without compiler detection. Runtime errors from typos go undetected.
- **Fix approach:** Define explicit properties or use a `Record<string, unknown>` wrapper type.

## Known Bugs

### `sdk-delegation.ts` — Generic Error on Recovery
- **Issue:** `src/lib/sdk-delegation.ts:63` throws `new Error("missing")` — a bare error with no `[Harness]` prefix and no context about what is missing. This breaks the convention that all harness errors use `[Harness]` prefix.
- **Files:** `src/lib/sdk-delegation.ts`
- **Trigger:** Child session status check during recovery returns no type field.
- **Workaround:** None — error is caught immediately and delegation is marked as error.
- **Fix approach:** Change to `throw new Error("[Harness] Child session status type missing on recovery")`.

## Security Considerations

### Continuity File Path from Environment Variables
- **Issue:** `src/lib/continuity.ts:27-34` reads `OPENCODE_HARNESS_CONTINUITY_FILE` and `OPENCODE_HARNESS_STATE_DIR` from environment variables without validation. A malicious value could redirect writes to arbitrary paths.
- **Files:** `src/lib/continuity.ts`
- **Current mitigation:** `resolve()` normalizes the path but does not restrict to a base directory.
- **Recommendations:** Add path validation to ensure the resolved path stays within an allowed directory tree (e.g., `.opencode/state/`).

### Permission Rules Hardcoded in Spawner
- **Issue:** `src/lib/spawner/session-creator.ts:20-29` hardcodes `WRITE_CAPABLE_PERMISSION_RULES` including `delegate-task: deny` and `task: deny`. These are not configurable and cannot be overridden by workspace policy.
- **Files:** `src/lib/spawner/session-creator.ts`
- **Current mitigation:** Deny is the safe default for delegation recursion.
- **Recommendations:** Make permission profiles configurable via runtime policy if agents need to delegate further.

### `unwrapData` Exposes SDK Errors Directly
- **Issue:** `src/lib/helpers.ts:75-85` `unwrapData` throws with the raw SDK error message. If the SDK error contains sensitive data (tokens, internal paths), it propagates to the user.
- **Files:** `src/lib/helpers.ts`
- **Current mitigation:** `[Harness]` prefix is added.
- **Recommendations:** Sanitize error messages before re-throwing. Strip known sensitive patterns.

## Performance Bottlenecks

### Stability Polling with Fixed Intervals
- **Issue:** `src/lib/sdk-delegation.ts:46-53` uses a fixed `STABILITY_POLL_INTERVAL_MS` for all SDK delegations. There is no adaptive backoff — every delegation polls at the same rate regardless of activity.
- **Files:** `src/lib/sdk-delegation.ts`, `src/lib/types.ts` (constant definition)
- **Cause:** Simple timer-based design, no event-driven alternative.
- **Improvement path:** Use exponential backoff for idle sessions, or switch to event-driven completion detection via `CompletionDetector`.

### `continuity.ts` Synchronous File I/O
- **Issue:** `src/lib/continuity.ts` uses `readFileSync` and `writeFileSync` for all persistence operations. On large continuity stores, this blocks the event loop.
- **Files:** `src/lib/continuity.ts`
- **Cause:** Synchronous fs operations chosen for simplicity.
- **Improvement path:** Switch to async `readFile`/`writeFile` with a write queue to prevent concurrent writes.

### PTY Buffer Truncation Without Warning
- **Issue:** `src/lib/pty/pty-buffer.ts` truncates content when the buffer cap is exceeded. No warning is emitted, so output may be silently lost.
- **Files:** `src/lib/pty/pty-buffer.ts`
- **Improvement path:** Emit a warning or provide a configurable behavior (truncate vs. grow vs. error).

## Fragile Areas

### `delegation-manager.ts` — Callback-Based Handler Architecture
- **Issue:** `CommandDelegationHandler` and `SdkDelegationHandler` are constructed with callback objects (`src/lib/command-delegation.ts:16-22`, `src/lib/sdk-delegation.ts:15-21`). The callback shape is not typed as an interface, so mismatches between DelegationManager and handlers are only caught at runtime.
- **Files:** `src/lib/command-delegation.ts`, `src/lib/sdk-delegation.ts`, `src/lib/delegation-manager.ts`
- **Why fragile:** Adding a new callback requires changes in three places (handler type, handler constructor, DelegationManager instantiation). No compiler enforcement.
- **Safe modification:** Define a `CommandDelegationCallbacks` interface and `SdkDelegationCallbacks` interface in `types.ts`.
- **Test coverage:** Partially covered by `tests/lib/delegation-manager.test.ts` but callback contract is not explicitly tested.

### `plugin.ts` — Dynamic PTY Import
- **Issue:** `src/plugin.ts:33` uses `await import("./lib/pty/pty-manager.js")` for lazy loading. If the import succeeds but `isSupported()` returns false, `ptyManager` is null and `run-background-command` tool is not registered.
- **Files:** `src/plugin.ts`
- **Why fragile:** Silent degradation — users may not realize PTY support is unavailable until they try to use the tool.
- **Test coverage:** `tests/plugins/plugin-lifecycle.test.ts` verifies conditional registration but not the failure path.

### `messages-transform.ts` — No Tests
- **Issue:** `src/hooks/messages-transform.ts` (92 LOC) has no corresponding test file. The `transformMessages` function is critical for prompt-enhance sessions but is completely untested.
- **Files:** `src/hooks/messages-transform.ts`
- **Risk:** Changes to trigger detection or context packet injection could break silently.
- **Priority:** High — this is user-facing functionality.

### `hooks/` Directory — No Test Coverage
- **Issue:** `tests/hooks/` directory exists but is empty. None of the hook factories (`create-core-hooks.ts`, `create-session-hooks.ts`, `create-tool-guard-hooks.ts`) have unit tests.
- **Files:** `src/hooks/create-core-hooks.ts` (136 LOC), `src/hooks/create-session-hooks.ts` (269 LOC), `src/hooks/create-tool-guard-hooks.ts` (153 LOC)
- **Risk:** Tool guard enforcement (circuit breaker, budget limits) and auto-loop behavior are untested. These are critical safety features.
- **Priority:** High — safety-critical code without tests.

## Scaling Limits

### `MAX_DESCENDANTS_PER_ROOT = 10`
- **Issue:** `src/lib/types.ts:22` caps descendant sessions at 10 per root. This is a hardcoded constant with no runtime policy override.
- **Files:** `src/lib/types.ts`
- **Current capacity:** 10 concurrent child sessions per root.
- **Limit:** Tasks requiring >10 parallel delegations will fail.
- **Scaling path:** Move to runtime policy configuration.

### `warningCap = 25` Per Session
- **Issue:** `src/lib/state.ts:39` caps warnings at 25 per session. After 25 warnings, additional warnings are silently dropped.
- **Files:** `src/lib/state.ts`
- **Limit:** Important warnings beyond #25 are lost.
- **Scaling path:** Use a circular buffer or log dropped warnings to continuity store.

## Dependencies at Risk

### `@opencode-ai/sdk` — Untyped Client Usage
- **Issue:** The AGENTS.md notes "`client: any` is known tech debt from SDK." While new code avoids `any`, the SDK client itself may have untyped surfaces that propagate `unknown` or `any` through the codebase.
- **Risk:** SDK API changes between versions could cause runtime errors not caught by the type checker.
- **Migration plan:** Pin SDK version strictly. Add integration tests that verify SDK call shapes.

## Test Coverage Gaps

### Hook Factories — No Tests
- **What's not tested:** `createCoreHooks`, `createSessionHooks`, `createToolGuardHooks` — all hook factories.
- **Files:** `src/hooks/create-core-hooks.ts`, `src/hooks/create-session-hooks.ts`, `src/hooks/create-tool-guard-hooks.ts`
- **Risk:** Tool budget enforcement, circuit breaker logic, auto-loop behavior, and message transformation are untested. A regression in any of these would go undetected.
- **Priority:** High

### `messages-transform.ts` — No Tests
- **What's not tested:** Prompt-enhance trigger detection, context packet building, message injection.
- **Files:** `src/hooks/messages-transform.ts`
- **Risk:** Broken prompt-enhance functionality.
- **Priority:** High

### `notification-handler.ts` — Tests for Dead Code
- **What's not tested:** The file `tests/lib/notification-handler.test.ts` exists but tests deprecated code that is never called.
- **Files:** `tests/lib/notification-handler.test.ts`, `src/lib/notification-handler.ts`
- **Risk:** Wasted CI time, false sense of coverage.
- **Priority:** Low — delete both files together.

### `runtime-policy.ts` — Partial Coverage
- **What's not tested:** `loadRuntimePolicy` with complex nested workspace policies, `getRuntimePolicyForSession` with partial overrides.
- **Files:** `src/lib/runtime-policy.ts`
- **Risk:** Policy validation bugs could allow invalid limits or reject valid configurations.
- **Priority:** Medium

### `continuity.ts` — Module Singleton Not Tested
- **What's not tested:** Store cache isolation, concurrent read/write behavior, deep-clone-on-read correctness.
- **Files:** `src/lib/continuity.ts`
- **Risk:** Cache pollution between tests, mutation aliasing bugs.
- **Priority:** Medium

## Validation Decision Concerns

### C8: 0 of 25 hm-* Skills Pass RICH Gate (Q5)
- **Issue:** Every `hm-*` skill must pass RICH Pattern 1/2/3 third-party synthesis. Current honest status: 0 of 25 skills pass. This is NOT a threshold to lower — it is a quality process that requires individual crafting.
- **Files:** `.opencode/skills/hm-*/SKILL.md`, `.planning/RICH-SKILL-QUALITY-GATE.md`
- **Impact:** Skills may lack real third-party evidence, bundled assets, and comparative analysis. Quality claims are unsubstantiated.
- **Fix approach:** Phase 27-30 research artifacts feed synthesis. Use `skill-development`, `skill-creator`, and `skill-judge` for crafting. Each skill requires dedicated synthesis — no batch lowering.
- **Status:** Honest status documented. Resolution is ongoing work, not a bug fix.

### C9: `.hivemind/` Migration Requires Compatibility Bridge (Q6)
- **Issue:** All internal deep module state must migrate from `.opencode/state/opencode-harness/` to `.hivemind/` at project root. During transition, existing data must remain readable.
- **Files:** `src/lib/continuity.ts`, `src/lib/delegation-persistence.ts`, future `src/lib/session-journal.ts`
- **Impact:** Writers may continue targeting old path, creating dual-write or data loss. Other plugins may overwrite `.opencode/` state.
- **Fix approach:** One-way migration `.opencode/state/` → `.hivemind/`. Compatibility bridge reads existing `.opencode/state/opencode-harness/` during transition. New writers target `.hivemind/` exclusively.
- **Status:** Architecture documented in PROJECT.md and ARCHITECTURE.md. Implementation pending Phase 25+.

---

*Concerns audit: 2026-04-25*
