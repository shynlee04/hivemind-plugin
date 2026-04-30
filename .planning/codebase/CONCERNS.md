# Codebase Concerns

**Analysis Date:** 2026-04-28

## Tech Debt

**DelegationManager — Size exceeds target:**
- Issue: `src/lib/delegation-manager.ts` at 656 LOC exceeds the project's 500 LOC per-module cap. Contains WaiterModel dispatch, dual-signal completion, safety ceiling management, grace-period cleanup, PTY integration, and notification scheduling — at least 3 distinct concerns.
- Files: `src/lib/delegation-manager.ts`
- Impact: Complex debugging, harder to test in isolation, increased risk of merge conflicts. The class manages 5 Map instances (`delegations`, `delegationsBySession`, `safetyTimers`, `gracePeriodTimers`, `activePolling`) simultaneously.
- Fix approach: Extract safety-ceiling timer management into `src/lib/delegation-safety.ts` (~120 LOC). Extract grace-period cleanup into `src/lib/delegation-cleanup.ts` (~100 LOC). This would bring delegation-manager below 450 LOC.

**Types module — Exceeds 500 LOC:**
- Issue: `src/lib/types.ts` at 514 LOC is above the 500 LOC cap. Contains delegation types, lifecycle types, continuity types, runtime policy types, and config workflow re-exports all in one file.
- Files: `src/lib/types.ts`
- Impact: Import overhead — every module that imports a single type pulls in the entire file's parse cost. The config-workflow re-exports (lines 506-514) add indirection.
- Fix approach: Extract delegation types into `src/lib/types/delegation.ts`, lifecycle types into `src/lib/types/lifecycle.ts`, and keep `types.ts` as a barrel re-export file only.

**Duplicated utility function:**
- Issue: `asString` is implemented in both `src/lib/helpers.ts` and `src/lib/continuity.ts`. AGENTS.md explicitly calls this out as a known code smell.
- Files: `src/lib/helpers.ts`, `src/lib/continuity.ts`
- Impact: Two implementations can diverge over time. Bug fixes to one won't propagate to the other.
- Fix approach: Consolidate into `helpers.ts` only; have `continuity.ts` import from `helpers.ts`.

**Module-level singleton in continuity store:**
- Issue: `src/lib/continuity.ts:23` — `let storeCache: ContinuityStoreFile | undefined` is a module-level singleton that persists across test runs.
- Files: `src/lib/continuity.ts`
- Impact: Prevents truly isolated unit testing — test files must unmock `node:fs` and manually reset state. Tests currently use `vi.unmock("node:fs")` in nested positions which vitest warns "will become an error in a future version."
- Fix approach: Refactor to a `ContinuityStore` class with injectable filesystem adapter, or at minimum expose a `resetStoreCache()` function for tests. The test files `tests/lib/continuity.test.ts` and `tests/lib/delegation-persistence.test.ts` also need their `vi.unmock()` calls moved to module top-level before vitest enforces this.

**Documentation drift — notification-handler status:**
- Issue: `src/lib/AGENTS.md` describes `notification-handler.ts` as "DEPRECATED: Dead code. WaiterModel polling replaces push notifications. Retained for potential re-integration." However, the actual code was re-activated in Phase 16.2 and is actively used by `delegation-manager.ts` via `notifyDelegationTerminal()`. The source file comments say "Re-activated in Phase 16.2."
- Files: `src/lib/notification-handler.ts`, `src/lib/AGENTS.md`
- Impact: Developers may avoid modifying or deleting code they believe is dead. Confusion about whether new features should use this module.
- Fix approach: Update `src/lib/AGENTS.md` to reflect the current status: "Notification delivery for parent sessions (re-activated Phase 16.2). Provides fire-and-forget terminal-state notifications with durable pending-notification queuing."

**Deprecated constants still exported:**
- Issue: `STABILITY_THRESHOLD` and `STABILITY_POLL_INTERVAL_MS` in `src/lib/types.ts:495-498` are marked `@deprecated` but still exported. No importers found in current `src/`.
- Files: `src/lib/types.ts`
- Impact: API surface pollution. External consumers may depend on deprecated constants.
- Fix approach: Remove or add a deprecation warning log on first access. Search for any `.opencode/` or `.hivemind/` consumers before removal.

**`as any` type cast in runtime-validator:**
- Issue: `src/lib/runtime-validator.ts:200` uses `(primitives.config as any).permission` to bypass TypeScript type checking. This is a known tech debt pattern referenced in `src/lib/AGENTS.md`.
- Files: `src/lib/runtime-validator.ts`
- Impact: Type safety is lost at this boundary. If the config shape changes, this cast silently returns `undefined` instead of producing a compile error.
- Fix approach: Define a proper `ConfigPrimitive` type that includes an optional `permission` field. Use the `PrimitiveMap` generic to constrain the config entry shape.

**Permission schema still a placeholder:**
- Issue: `src/schema-kernel/agent-frontmatter.schema.ts:121` — the `permission` field is typed as `z.record(z.string(), z.unknown())` with the comment "Tool permission rules (placeholder until permission.schema.ts exists)." The `permission.schema.ts` file does exist.
- Files: `src/schema-kernel/agent-frontmatter.schema.ts`, `src/schema-kernel/permission.schema.ts`
- Impact: Permission validation is lenient (`z.unknown()`), not enforcing the actual permission schema shape. Malformed permission configs pass validation silently.
- Fix approach: Replace `z.record(z.string(), z.unknown())` with the permission schema from `permission.schema.ts`.

**Total codebase size significantly exceeds target architecture:**
- Issue: The project is at ~13,237 LOC vs. the target architecture proposal of ~4,000-5,000 LOC.
- Files: Entire `src/` directory
- Impact: Higher cognitive load for contributors, longer build times, harder to maintain module boundaries.
- Fix approach: This is expected growth from 31+ phases of development. Not an immediate concern but should inform future refactoring prioritization.

## Known Bugs

**Vitest vi.unmock hoisting warnings — will become errors:**
- Symptoms: Two test files emit warnings: "A vi.unmock('node:fs') call is not at the top level of the module. This will become an error in a future version."
- Files: `tests/lib/continuity.test.ts`, `tests/lib/delegation-persistence.test.ts`
- Trigger: Running `npm test` with vitest 4.1.5
- Workaround: None currently needed (warnings only), but future vitest versions will break these tests.

**SDK agent validation degradation on malformed responses:**
- Issue: In `src/lib/delegation-manager.ts:573-593`, when the OpenCode server's `/agent` endpoint returns agents with missing required string fields, the code catches the Zod validation error and gracefully degrades to unvalidated agent acceptance with a `console.warn`. While intentional (see R-AGENT-01 comment), this silently accepts malformed agent data.
- Files: `src/lib/delegation-manager.ts`
- Trigger: SDK Zod validation error "expected string, received undefined" from the OpenCode server.
- Workaround: The existing degradation is the workaround. A proper fix requires the upstream OpenCode SDK to handle partial agent data.

## Security Considerations

**Fire-and-forget prompt delivery:**
- Risk: `src/lib/session-api.ts` provides `sendPromptAsync()` which fires prompts without awaiting delivery confirmation. Errors are silently swallowed.
- Files: `src/lib/session-api.ts`
- Current mitigation: Notification failures are caught in `notification-handler.ts` and queued as pending notifications for replay on parent session lifecycle events.
- Recommendations: Add structured logging for `sendPromptAsync` failures. Consider a delivery audit trail.

**Synchronous filesystem I/O in critical paths:**
- Risk: `src/lib/continuity.ts` uses `writeFileSync`, `readFileSync`, and `renameSync` for persistence. A slow or failing disk can block the Node.js event loop, potentially causing delegation timeouts.
- Files: `src/lib/continuity.ts`, `src/lib/delegation-persistence.ts`, `src/lib/config-workflow/workflow-persistence.ts`
- Current mitigation: Atomic writes (write to temp file, then rename) prevent corruption from partial writes.
- Recommendations: Consider async filesystem APIs for non-critical persistence paths. The current sync approach is acceptable for the continuity store size (~10-100 records) but would be problematic if the store grows to thousands of records.

**Path traversal protection — scope limited to known boundaries:**
- Risk: `src/lib/security/path-scope.ts` provides robust path containment but is only applied in `continuity.ts` and `delegation-persistence.ts`. The `configure-primitive` tool writes to disk using paths from `configure-primitive-paths.ts` without the same containment assertions.
- Files: `src/lib/security/path-scope.ts`, `src/tools/configure-primitive.ts`, `src/tools/configure-primitive-paths.ts`
- Current mitigation: Path resolution uses `process.env.OPENCODE_CONFIG_DIR` or a user-home-relative default, hardcoded to `~/.config/opencode`.
- Recommendations: Apply `assertPathWithinRoot()` to all filesystem write operations in `configure-primitive.ts` and `config-compiler.ts`.

**Secrets handling in environment variables:**
- Risk: Multiple modules read `process.env` directly without redaction (`OPENCODE_SESSION_ID`, `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_CONFIG_DIR`, `OPENCODE_HARNESS_CONCURRENCY_LIMIT`). Continuity store JSON is written to disk containing session data — potential for sensitive prompt content leakage.
- Files: `src/lib/continuity.ts`, `src/lib/session-api.ts`, `src/tools/delegate-task.ts`, `src/lib/lifecycle-manager.ts`, `src/lib/config-compiler.ts`
- Current mitigation: `src/lib/security/redaction.ts` provides `redactBoundaryFields()` used in the continuity store. `.env` files are in `.gitignore`. `.hivemind/state/` directory is not gitignored by default — depends on developer discipline.
- Recommendations: Add `.hivemind/state/` to `.gitignore`. Consider encrypting or hashing `OPENCODE_SESSION_ID` in logs. Audit continuity store for any stored prompt content that should be redacted.

## Performance Bottlenecks

**Synchronous JSON persistence blocks event loop:**
- Problem: `continuity.ts` calls `JSON.stringify()` on the entire session store and writes synchronously to disk on every persistence operation. With 50+ delegation records (the prune threshold), this can be ~100KB+ of JSON.
- Files: `src/lib/continuity.ts:300-330` (`persistStore()`)
- Cause: Synchronous `writeFileSync` + `renameSync` pattern
- Improvement path: Batch writes (debounce multiple rapid updates). Consider incremental append-only journal (`session-journal.ts` exists but is separate from the continuity store).

**Delegation timer proliferation under high concurrency:**
- Problem: Each delegation spawns a safety ceiling timer and a grace period timer. With `MAX_DELEGATIONS_BEFORE_PRUNE = 50`, up to 100 active timers can co-exist. Timer cleanup is manual and depends on `clearAllTimers()` being called correctly.
- Files: `src/lib/delegation-manager.ts:102` (`safetyTimers`, `gracePeriodTimers` Maps)
- Cause: Node.js `setTimeout` creates a system timer resource. Large numbers of concurrent timers increase event loop overhead.
- Improvement path: Replace per-delegation timers with a single polling loop that checks all delegations on a fixed interval (e.g., every 5 seconds). This reduces O(n) timers to O(1).

**No bundling or tree-shaking:**
- Problem: The package exports a flat `dist/` directory. All modules are compiled but there's no bundle step. Consumers import the entire module tree.
- Files: `package.json` exports, `tsconfig.json`
- Cause: ES module output with no bundler configured
- Improvement path: This is acceptable for a plugin consumed by OpenCode directly. Only address if bundle size becomes a concern.

## Fragile Areas

**DelegationManager — Central orchestration with complex state:**
- Files: `src/lib/delegation-manager.ts` (656 LOC), `src/lib/command-delegation.ts` (401 LOC), `src/lib/sdk-delegation.ts` (209 LOC)
- Why fragile: Tight coupling between dispatch, safety ceilings, status transitions, PTY/headless fallback, and notification. Changes to the Delegation interface in `types.ts` cascade through 5+ files. The dual-dispatch architecture (SDK vs command/PTY) has parallel timer management that must stay synchronized.
- Safe modification: Always update `types.ts` first, then delegation-manager, then SDK/command handlers. Verify transitions in `VALID_DELEGATION_TRANSITIONS` before adding new statuses. Run `tests/lib/delegation-manager.test.ts` (the most comprehensive test file) after any change.
- Test coverage: Well-tested (67 test files, 1105 tests passing). The delegation-manager test file covers dispatch, recovery, and terminal transitions.

**Continuity store — Singleton with sync I/O:**
- Files: `src/lib/continuity.ts` (455 LOC)
- Why fragile: Module-level singleton (`storeCache`), synchronous filesystem operations, dual-state architecture (in-memory Maps + durable JSON). Schema versioning (`CONTINUITY_VERSION = 1`) means any format change is a breaking change.
- Safe modification: Never change the on-disk JSON schema without bumping `CONTINUITY_VERSION` and providing a migration path. Always test with `tests/lib/continuity.test.ts` and verify state-root migration compatibility (`tests/lib/state-root-migration.test.ts`).
- Test coverage: Good. Tests cover normalization, CRUD, deep-clone, and migration paths.

**Cross-primitive validator — Complex validation logic:**
- Files: `src/lib/cross-primitive-validator.ts` (373 LOC), `src/lib/config-compiler.ts` (380 LOC), `src/lib/runtime-validator.ts` (305 LOC)
- Why fragile: Permission deadlock detection, inheritance chain validation, category collision detection — these are complex logical checks that are easy to get wrong. The validator produces warnings/warnings/blocks but the downstream behavior when validation fails is not always clear.
- Safe modification: Always add test cases for the specific validation scenario before changing validator logic. The test files `tests/lib/cross-primitive-validator.test.ts` and `tests/lib/config-compiler.test.ts` provide good coverage.
- Test coverage: Good for cross-primitive-validator and config-compiler. Runtime-validator has tests.

**Schema kernel — 6 untested schema files:**
- Files: `src/schema-kernel/agent-frontmatter.schema.ts`, `src/schema-kernel/command-frontmatter.schema.ts`, `src/schema-kernel/config-precedence.schema.ts`, `src/schema-kernel/mcp-server.schema.ts`, `src/schema-kernel/permission.schema.ts`, `src/schema-kernel/skill-metadata.schema.ts`, `src/schema-kernel/tool-definition.schema.ts`
- Why fragile: Schemas define the validation contract for all `.opencode/` primitives. Schema changes without tests can silently break or relax validation for agents, commands, and skills.
- Safe modification: Always add test cases in `tests/schema-kernel/` before modifying any schema. Currently only `opencode-config.schemas.test.ts` and `prompt-enhance.schema.test.ts` exist in the schema test directory.
- Test coverage: **Minimal.** 6 of 8 schema files in `src/schema-kernel/` have zero dedicated tests.

## Scaling Limits

**Maximum delegation descendants per root session:**
- Current capacity: `MAX_DESCENDANTS_PER_ROOT = 10` (defined in `src/lib/types.ts:28`)
- Limit: Root sessions cannot spawn more than 10 child delegations. Exceeding this triggers warning in `state.ts`.
- Scaling path: Increase constant or make it configurable via `RuntimePolicy`. Consider per-agent limits instead of global.

**Maximum in-memory delegations before pruning:**
- Current capacity: `MAX_DELEGATIONS_BEFORE_PRUNE = 50` (defined in `src/lib/types.ts:474`)
- Limit: After 50 delegation records accumulate in memory, terminal delegations older than `DEFAULT_PRUNE_MAX_AGE_MS` (30 minutes) are pruned. Active delegations are unaffected.
- Scaling path: This is already generous for most use cases. If needed, make configurable via environment variable.

**Single-file continuity store:**
- Current capacity: All sessions stored in one JSON file (`.hivemind/state/continuity.json`). No sharding or partitioning.
- Limit: With thousands of session records, parse/serialize time grows linearly. Sync I/O blocks event loop.
- Scaling path: Shard by session ID prefix, or switch to SQLite for the continuity store. The `session-journal.ts` already provides an append-only alternative that could be extended.

**Concurrency queue — single-process only:**
- Current capacity: `DelegationConcurrencyQueue` in `src/lib/concurrency.ts` is in-process. No distributed coordination.
- Limit: Multiple OpenCode instances on the same project would not coordinate concurrency.
- Scaling path: Acceptable for single-user OpenCode usage. If multi-user collaboration is needed, consider a Redis-backed semaphore or file-lock-based coordination.

## Dependencies at Risk

**bun-pty — Platform-dependent, lazy-loaded:**
- Risk: `bun-pty@^0.4.8` is an optional, lazy-loaded dependency (`src/lib/pty/pty-runtime.ts:15` does a dynamic `import()`). It is only available in Bun runtimes and falls back gracefully. However, the PTY-backed command delegation path (`src/lib/command-delegation.ts`) has substantial code (401 LOC) that is largely unused on Node.js.
- Impact: Maintenance burden for PTY-specific code that most users can't use. Testing PTY features requires Bun.
- Migration plan: Keep lazy-loaded for now. Consider extracting all PTY code behind a `PtyProvider` interface to make the dependency truly optional at the package level.

**@opencode-ai/sdk — Tightly version-coupled peer dependency:**
- Risk: `@opencode-ai/sdk@^1.14.28` is both a direct dependency and a peer dependency. The `<0.2.0` version means breaking changes are expected. The SDK is labeled `[REQUIRES OpenCode RUNTIME]` in tools, meaning it only works inside the OpenCode environment.
- Impact: Any breaking change in the SDK will require coordinated updates to type wrappers, session API calls, and tool registrations.
- Migration plan: Monitor SDK changelog. Pin to exact version in production deployments. The typed wrappers in `session-api.ts` provide some isolation but the SDK's internal types leak through the `client` parameter.

**gray-matter — Frontmatter parsing:**
- Risk: `gray-matter@^4.0.3` is a stable but unmaintained-looking package (last major update was years ago). Used for parsing YAML frontmatter in agent/command/skill `.md` files.
- Impact: No known security issues, but no active maintenance either. If a YAML parsing vulnerability emerges, there's no clear upgrade path.
- Migration plan: Monitor for forks or alternatives. The project could replace gray-matter with direct `yaml` package usage plus a simple frontmatter delimiter parser (~30 LOC).

## Missing Critical Features

**No E2E integration tests for delegation lifecycle:**
- Problem: Only 1 integration test exists (`tests/integration/prompt-enhance-pipeline.test.ts`). There are no integration tests that exercise the full delegation flow: dispatch → polling → completion detection → result extraction → notification → cleanup.
- Blocks: Cannot confidently verify that delegation works end-to-end without manual testing against a live OpenCode instance.
- Priority: High. This is the core feature of the harness.

**Untested schema validation for 6 of 7 OpenCode primitive types:**
- Problem: `src/schema-kernel/` has 8 schema files but only 2 test files. Agent frontmatter, command frontmatter, config precedence, MCP server, permission, skill metadata, and tool definition schemas all lack dedicated tests.
- Blocks: Schema changes cannot be verified without manual testing. Invalid schemas could silently accept malformed `.opencode/` files.
- Priority: Medium. Schemas are validated indirectly through the config-compiler and runtime-validator tests, but edge cases (empty descriptions, invalid regexes, missing required fields) may not be covered.

**RICH gate quality gap:**
- Problem: Per Q5 validation decision (locked 2026-04-25), 0 of 25 `hm-*` skills pass the RICH gate. This is acknowledged as honest status, not a threshold-lowering justification.
- Blocks: Skills lack formal quality verification against the RICH criteria (Reference-able, Isolated, Clear, Honest).
- Priority: Low for harness code, high for the meta-concept quality program. This is a meta-concern tracked at the project level, not a code-level issue in `src/`.

## Test Coverage Gaps

**Untested area — Schema kernel (6 files):**
- What's not tested: Agent frontmatter validation, command frontmatter validation, config precedence rules, MCP server config shapes, permission rule formats, skill metadata validation, tool definition shapes.
- Files: `src/schema-kernel/agent-frontmatter.schema.ts`, `src/schema-kernel/command-frontmatter.schema.ts`, `src/schema-kernel/config-precedence.schema.ts`, `src/schema-kernel/mcp-server.schema.ts`, `src/schema-kernel/permission.schema.ts`, `src/schema-kernel/skill-metadata.schema.ts`, `src/schema-kernel/tool-definition.schema.ts`
- Risk: Schema regression during refactoring or Zod version upgrades could silently break validation for all `.opencode/` primitives.
- Priority: Medium

**Untested area — Shared utilities:**
- What's not tested: `tool-helpers.ts` (tool helper conventions) and `tool-response.ts` (standard tool response envelope).
- Files: `src/shared/tool-helpers.ts`, `src/shared/tool-response.ts`
- Risk: Changes to the standard tool response format could affect multiple tools without detection.
- Priority: Low (these are thin wrappers)

**Untested area — Event tracker document store:**
- What's not tested: `document-store.ts` which handles JSON document I/O for event tracker artifacts.
- Files: `src/lib/event-tracker/document-store.ts` (295 LOC)
- Risk: File corruption in event tracker artifacts could go undetected.
- Priority: Low (event tracker is non-critical infrastructure)

**Untested area — Configure primitive paths:**
- What's not tested: Path resolution logic for the `configure-primitive` tool.
- Files: `src/tools/configure-primitive-paths.ts`
- Risk: Path resolution bugs could cause writes to wrong directories.
- Priority: Medium

**Untested area — Config workflow types and spawner types:**
- What's not tested: Type-only modules that define interfaces.
- Files: `src/lib/config-workflow/workflow-types.ts`, `src/lib/spawner/spawner-types.ts`
- Risk: Minimal — these are type definitions only. No runtime behavior to test.
- Priority: Low

---

*Concerns audit: 2026-04-28*
