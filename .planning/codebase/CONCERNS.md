# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

### CQRS Architecture Violation in Hook Layer

- Issue: Five hook files perform direct filesystem writes (`mkdir`, `writeFile`) despite the AGENTS.md mandate that "hooks are read-only" and the `check-hooks-readonly.sh` boundary check explicitly forbidding it. The `src/internal/session-writers.ts` facade exists to solve this but is not used by these hooks.
- Files:
  - `src/hooks/chat-message-handler.ts` (line 46: `mkdir`)
  - `src/hooks/event-handler.ts` (line 217: `writeFile`)
  - `src/hooks/tool-execution-handler.ts` (line 40: `mkdir`)
  - `src/hooks/text-complete-handler.ts` (line 172: `mkdir`)
  - `src/hooks/compaction-handler.ts` (line 109: `mkdir`)
- Impact: The `npm test` command **fails** at the `lint:boundary` gate. Every `npm test` invocation exits with a non-zero code due to `check-hooks-readonly.sh`. This means CI is red and the project cannot publish cleanly via `prepublishOnly`.
- Fix approach: Refactor all five hook handlers to delegate writes through `src/internal/session-writers.ts` (the `SessionWriters` interface) instead of calling `mkdir`/`writeFile` directly. The consolidated-writer module already handles directory creation internally.

### Duplicated Session-Resolve Logic Across Hooks

- Issue: Four hook handlers contain near-identical session-resolution logic: find-by-SDK-ID → try-direct-path → create-new → symlink-backwards-compat. This is copy-pasted across `chat-message-handler.ts`, `tool-execution-handler.ts`, `compaction-handler.ts`, and `text-complete-handler.ts`.
- Files:
  - `src/hooks/chat-message-handler.ts` (lines 51-67)
  - `src/hooks/tool-execution-handler.ts` (lines 43-67)
  - `src/hooks/compaction-handler.ts` (lines 112-136)
  - `src/hooks/text-complete-handler.ts` (lines 82-102)
- Impact: Any bug fix or behavior change must be applied in four places. The `text-complete-handler.ts` and `compaction-handler.ts` also have factory variants (`createTextCompleteHandler`, `createCompactionJournalHandler`) that already use a slightly different internal pattern, creating two parallel implementations.
- Fix approach: Extract a `resolveOrCreateSession(sessionsDir, sdkSessionId)` helper in `src/features/event-tracker/consolidated-writer.ts` that encapsulates the full resolution chain. All hooks call this single function.

### Unreachable `handleCompaction` Standalone Function

- Issue: `src/hooks/compaction-handler.ts` exports both `createCompactionJournalHandler` (factory, used by plugin) and `handleCompaction` (standalone, unused). The standalone function duplicates the factory's logic and appears to be dead code.
- Files: `src/hooks/compaction-handler.ts` (lines 100-155)
- Impact: Dead code that confuses readers and must be maintained in parallel with the factory variant.
- Fix approach: Remove `handleCompaction` if no callers exist. Verify via grep.

### `sessionWriters` Uninitialized Singleton

- Issue: `src/internal/session-writers.ts` exports a default `sessionWriters` object that throws on every method call. It is designed to be replaced via `createSessionWriters(projectRoot)`, but this replacement is never performed at plugin boot — nothing calls `createSessionWriters` and reassigns the singleton.
- Files: `src/internal/session-writers.ts` (lines 135-156)
- Impact: Any caller using the default export will get runtime errors. The facade was built to solve the CQRS violation (above) but is not actually wired in.
- Fix approach: Either initialize it at plugin boot in `opencode-plugin.ts` or remove the singleton export entirely.

### Archive Directory With Orphaned Code

- Issue: `src/archive/schema-kernel/` contains 5 files defining Zod schemas and factory functions (`evidence-records.ts`, `lifecycle-records.ts`, `orchestration-records.ts`, `shared.ts`, `index.ts`). No source file in `src/` imports from this archive directory (confirmed via grep). The schemas appear to be superseded by the live `src/schema-kernel/` directory.
- Files: `src/archive/schema-kernel/evidence-records.ts`, `src/archive/schema-kernel/lifecycle-records.ts`, `src/archive/schema-kernel/orchestration-records.ts`, `src/archive/schema-kernel/shared.ts`, `src/archive/schema-kernel/index.ts`
- Impact: Dead code that adds confusion about which schema definitions are authoritative. Zero consumers.
- Fix approach: Delete the entire `src/archive/` directory.

## Known Bugs

### Test Suite Boundary Check Failure

- Symptoms: `npm test` fails at the `lint:boundary` step. The test runner never reaches actual test execution because the boundary lint fails first.
- Files: All hook files listed in CQRS violation above
- Trigger: Run `npm test` at any time
- Workaround: Run `tsx --test "src/**/*.test.ts"` directly, skipping the boundary check

### TypeScript Compilation Error in Test File

- Symptoms: `npx tsc --noEmit` reports `TS6133: 'result' is declared but its value is never read` in `src/features/event-tracker/session-structure.test.ts` line 144
- Files: `src/features/event-tracker/session-structure.test.ts` (line 144)
- Trigger: Run `npx tsc --noEmit`
- Workaround: None — this is a compilation warning that does not block the build but indicates an incomplete test assertion

### `@deprecated` Import Still in Plugin Assembly

- Issue: `src/plugin/opencode-plugin.ts` line 42 imports `writeDiagnosticLog` with a `@deprecated` JSDoc tag, yet uses it in the `experimental.text.complete` handler (line 241). The deprecated import suggests this function should be replaced by session journal handlers.
- Files: `src/plugin/opencode-plugin.ts` (line 42, line 241)
- Symptoms: No runtime failure yet, but the deprecated function may be removed in a future release, causing a sudden break.
- Workaround: None

## Security Considerations

### `permission.ask` Auto-Allows All HiveMind Tools

- Risk: The `permission.ask` hook in `opencode-plugin.ts` (lines 149-157) automatically allows any tool call where `isHivemindManagedTool(toolName)` returns true, without user confirmation. This means all 11 HiveMind tools bypass the user consent gate entirely.
- Files: `src/plugin/opencode-plugin.ts` (lines 149-157), `src/hooks/runtime-loader/index.ts` (contains `isHivemindManagedTool`)
- Current mitigation: The tools are internal-only and governed by their own internal logic. They cannot write arbitrary files — writes go through `getHivemindPath()`.
- Recommendations: Consider whether certain high-impact tools (like `hivemind_runtime_command` which can execute commands) should still require user consent. The current blanket auto-allow may be overly permissive.

### Synchronous Filesystem Operations in Plugin Init Path

- Risk: `ensureAgentProjection()` in `opencode-plugin.ts` (lines 70-82) uses `existsSync`, `mkdirSync`, `readFileSync`, and `writeFileSync` synchronously during plugin initialization. This blocks the event loop during plugin load.
- Files: `src/plugin/opencode-plugin.ts` (lines 70-82)
- Current mitigation: Only runs once at plugin startup; the operations are small (single file copy).
- Recommendations: Convert to async equivalents or accept the one-time synchronous cost with a comment justifying it.

### Path Traversal in Session ID Handling

- Risk: Session IDs are used directly in file paths (`join(sessionsDir, semanticSessionId)`) in multiple locations. If a session ID contained `../`, it could escape the sessions directory.
- Files: `src/features/event-tracker/consolidated-writer.ts`, `src/hooks/chat-message-handler.ts`, `src/hooks/tool-execution-handler.ts`
- Current mitigation: Session IDs are generated internally with `ses_YYYY-MM-DDTHHmmss_<purpose>_<agent>` format. SDK session IDs come from the OpenCode server. The risk is theoretical since neither source produces malicious IDs.
- Recommendations: Add a path-safety check (reject IDs containing `..` or `/`) in `getSessionPath()` in `src/shared/paths.ts`.

## Performance Bottlenecks

### Consolidated Writer File I/O on Every Turn

- Problem: Every assistant turn triggers at least 3 file I/O operations: read session JSON → modify in memory → write temp file → rename (atomic). The `text.complete` handler triggers up to 5 operations (read, increment counter, add turn, add event, rename).
- Files: `src/features/event-tracker/consolidated-writer.ts` (643 lines, handles all session I/O)
- Cause: Single JSON file per session pattern requires full read-modify-write cycles. The atomic write (temp + rename) is correct for safety but doubles I/O.
- Improvement path: Consider a write-ahead log or append-only format for high-frequency events, with periodic compaction to the full JSON. Alternatively, batch events within a turn into a single write operation.

### `findSessionBySdkId` Scans All Session Files

- Problem: `findSessionBySdkId(sessionsDir, sdkSessionId)` reads and parses every JSON file in the sessions directory to find one by SDK ID in metadata. This is O(n) where n is the number of sessions.
- Files: `src/features/event-tracker/consolidated-writer.ts` (used by every hook handler on every turn)
- Cause: The reverse lookup (SDK ID → semantic ID) has no index. The backwards-compat symlinks only cover the forward direction.
- Improvement path: Maintain an in-memory LRU cache mapping SDK session IDs to semantic IDs. The `text-complete-handler.ts` already has a local `sdkToConsolidatedCache` (line 50) but it is per-handler-instance and not shared across hooks.

### Runtime Status Snapshot Builds From Multiple File Reads

- Problem: `buildRuntimeStatusSnapshot` in `src/sdk-supervisor/runtime-status.ts` (300 lines) reads and parses multiple JSON files from `.hivemind/state/` to assemble a status report. Each `hivemind_runtime_status` tool call triggers this.
- Cause: No caching layer between file system and status tool.
- Improvement path: Cache the status snapshot with a short TTL (e.g., 5 seconds) keyed by session ID. Invalidate on tool execution events.

## Fragile Areas

### Plugin Entry Point Complexity

- Files: `src/plugin/opencode-plugin.ts` (281 lines)
- Why fragile: The single `HiveMindPlugin` function wires 12 tools, 8 hooks, and multiple handlers. Adding a new tool or hook requires touching this file directly. The function contains inline logic for `permission.ask` auto-allow, `shell.env` injection, and `command.execute.before` context injection — mixing assembly with business logic.
- Safe modification: Extract hook registrations into separate adapter modules (similar to how `compaction-adapter.ts` and `messages-transform-adapter.ts` already work). Keep the plugin file as pure assembly.
- Test coverage: Zero test coverage. No test file exists for `opencode-plugin.ts`.

### Control Plane Registry Keyword Detection

- Files: `src/control-plane/control-plane-registry.ts` (268 lines)
- Why fragile: CLI command detection relies on substring matching of user messages against keyword lists (`EXPLICIT_KEYWORDS`). This is brittle — a user casually mentioning "initialize hivemind" in a question could trigger the init gate unexpectedly.
- Safe modification: Consider requiring exact command syntax (e.g., `/hm-init`) or a prefix pattern rather than substring search within free-form messages.
- Test coverage: Zero test coverage.

### Dual Handler Pattern (Factory + Standalone)

- Files: `src/hooks/compaction-handler.ts` exports both `createCompactionJournalHandler` (factory) and `handleCompaction` (standalone). `src/hooks/chat-message-handler.ts` and `src/hooks/tool-execution-handler.ts` export only standalone functions. `src/hooks/text-complete-handler.ts` exports only a factory.
- Why fragile: Three different patterns across four hook files. The plugin entry point uses the factory pattern for some (`compaction`, `text-complete`, `transform`) and standalone functions for others (`event`). This inconsistency makes it unclear which pattern to follow for new hooks.
- Safe modification: Standardize on the factory pattern (`createXxxHandler(deps)`) for all hooks. The plugin entry already has the dependency injection setup.
- Test coverage: Zero direct test coverage for any hook handler files.

## Scaling Limits

### Single-Process File-Based State

- Current capacity: All state (sessions, tasks, trajectories, workflows, contracts, handoffs) is stored as JSON files in `.hivemind/`. The file system is the database.
- Limit: No concurrent access control beyond `proper-lockfile` (listed in dependencies). Multiple OpenCode instances running against the same project directory could corrupt state files during simultaneous read-modify-write cycles.
- Scaling path: The `proper-lockfile` dependency is available but not used for session writes. For single-user scenarios this is acceptable. Multi-user would require a proper database or at minimum advisory locking on all state file writes.

### In-Memory State Without Persistence Safeguards

- Current capacity: `src/hooks/sdk-context.ts` holds SDK context in module-level variables. `src/plugin/skill-exposure-map.ts` holds cached config in a module-level `let`. `src/hooks/transform-handler.ts` uses `setInjectionPayload`/`getAndClearInjectionPayload` for per-turn injection state.
- Limit: All module-level state is lost on process restart. No recovery mechanism exists for in-flight operations.
- Scaling path: Acceptable for current architecture since OpenCode sessions are ephemeral. Document the assumption that process restart loses all in-memory state.

## Dependencies at Risk

### `@opencode-ai/sdk` as Dependency AND Peer Dependency

- Risk: `@opencode-ai/sdk` (^1.2.27) appears in both `dependencies` and `peerDependencies`. The `peerDependenciesMeta` marks it as non-optional, meaning npm will warn if the consumer doesn't have it installed.
- Files: `package.json` (line 81, line 103)
- Impact: Confusing dependency declaration. Consumers may get version conflicts or double-installation warnings.
- Migration plan: Move `@opencode-ai/sdk` to `peerDependencies` only (non-optional), since the plugin runs inside OpenCode which already provides the SDK. Remove from `dependencies`.

### `vitest` in devDependencies but `tsx --test` Used for Running Tests

- Risk: `vitest` (^4.1.1) is listed in devDependencies but the test script uses `tsx --test` (Node.js built-in test runner). Vitest is not used for anything in the project.
- Files: `package.json` (line 100)
- Impact: Unnecessary dependency. May confuse contributors who expect Vitest configuration files or Vitest-specific APIs.
- Migration plan: Remove `vitest` from devDependencies unless there is a plan to migrate.

### `@z_ai/coding-helper` — Unknown Utility Package

- Risk: `@z_ai/coding-helper` (^0.0.7) is listed in dependencies but has zero imports in the codebase (confirmed via grep).
- Files: `package.json` (line 83)
- Impact: Unnecessary dependency. Version 0.0.7 suggests pre-release/unstable.
- Migration plan: Remove from dependencies.

## Missing Critical Features

### No Integration or E2E Tests

- Problem: All 49 test files are unit tests. No tests verify that tools, hooks, and the plugin assembly work together. The plugin entry point (`opencode-plugin.ts`), all hook handlers, the CLI entry (`cli.ts`), and the control plane have zero test coverage.
- Blocks: Cannot safely refactor the plugin assembly, hook wiring, or tool registration without regression risk.
- Priority: High

### No Evidence Lane Validation in Production Code

- Problem: `src/tools/runtime/runtime-status-validator.ts` and `src/tools/runtime/runtime-command-validator.ts` contain evidence lane validation logic that uses `console.log` for output instead of returning structured results. These appear to be diagnostic scripts, not integrated into the tool execution path.
- Files: `src/tools/runtime/runtime-status-validator.ts`, `src/tools/runtime/runtime-command-validator.ts`
- Blocks: Cannot verify evidence lane coverage programmatically during tool execution.
- Priority: Medium

### Recovery Engine Has No Test Coverage

- Problem: `src/recovery/recovery-engine.ts` and `src/recovery/recovery-types.ts` implement state repair logic but have zero test coverage. These are critical for resilience.
- Files: `src/recovery/recovery-engine.ts`, `src/recovery/recovery-types.ts`
- Blocks: Cannot verify that state recovery actually repairs broken state correctly.
- Priority: Medium

## Test Coverage Gaps

### Massive Test Coverage Gap (~170 Files Untested)

- What's not tested: 170 of ~210 non-test source files have no corresponding `.test.ts` file. Critical untested areas include:
  - **Plugin assembly**: `src/plugin/opencode-plugin.ts` (281 lines)
  - **All 5 hook handlers**: `src/hooks/chat-message-handler.ts`, `src/hooks/event-handler.ts`, `src/hooks/tool-execution-handler.ts`, `src/hooks/text-complete-handler.ts`, `src/hooks/compaction-handler.ts`
  - **CLI entry**: `src/cli.ts` and all `src/cli/*.ts` files (5 files)
  - **Control plane**: `src/control-plane/*.ts` (6 files)
  - **Core state management**: `src/core/trajectory/*.ts` (6 files), `src/core/workflow-management/*.ts` (6 files)
  - **Delegation**: `src/delegation/*.ts` (4 files)
  - **Recovery**: `src/recovery/*.ts` (3 files)
  - **Intelligence/doc**: `src/intelligence/doc/*.ts` (6 files)
  - **All tool implementations**: `src/tools/**/*.ts` (no tool has its own test file; only `hivefiver-tools.test.ts` and `hivemind-journal.test.ts` exist)
- Files: See full list in exploration output (170 entries)
- Risk: Any change to untested code could introduce regressions unnoticed. The boundary lint catches architecture violations but not logic bugs.
- Priority: High for plugin assembly, hook handlers, and tool implementations; Medium for everything else

### Swallowed Errors (33 Silent catch Blocks)

- What's not tested: 33 locations use `catch { }` or `catch { /* ignore */ }` patterns with no error logging. Errors are silently swallowed, making debugging extremely difficult when something goes wrong in production.
- Files: Distributed across `src/` — see grep results for full list
- Risk: Silent failures in session writes, state reads, config loading, and event processing. Operators have no visibility into what's failing.
- Priority: High — at minimum, all silent catches should log to `console.error` or the structured logger.

---

*Concerns audit: 2026-03-27*
