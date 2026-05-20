---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
focus: concerns
---

# Codebase Concerns

**Analysis Date:** 2026-05-20

## Tech Debt

**Session tracker module-size pressure:**
- Issue: `src/features/session-tracker/capture/event-capture.ts` is 702 LOC and `src/features/session-tracker/index.ts` is 561 LOC, both above the 500 LOC module cap stated in `src/features/session-tracker/AGENTS.md` and `src/features/AGENTS.md`.
- Files: `src/features/session-tracker/capture/event-capture.ts`, `src/features/session-tracker/index.ts`, `src/features/session-tracker/AGENTS.md`
- Impact: Session capture remains the highest-complexity runtime feature; changes to classification, fork handling, retry queues, or manifest writes require extra regression scope.
- Fix approach: Split `event-capture.ts` by lifecycle event family and reduce `index.ts` to public facade + dependency wiring only. Keep persistence, routing, and cleanup in dedicated files.

**Composition root near size cap:**
- Issue: `src/plugin.ts` is 493 LOC and still owns startup migration, notification replay, dependency assembly, hook composition, and tool registration in one file.
- Files: `src/plugin.ts`
- Impact: Any new tool, hook, migration, or runtime wiring can push the composition root over the cap and increase risk of business logic creeping back into the plugin layer.
- Fix approach: Extract tool registration map, startup tasks, and hook composition into small factory modules while keeping `src/plugin.ts` as the only exported plugin authority.

**Synchronous filesystem calls remain widespread:**
- Issue: Source contains 44 `readFileSync`, 32 `writeFileSync`, 40 `mkdirSync`, 91 `existsSync`, 13 `readdirSync`, 19 `renameSync`, and related synchronous calls.
- Files: `src/tools/config/bootstrap-init.ts`, `src/tools/config/bootstrap-recover.ts`, `src/tools/config/configure-primitive.ts`, `src/task-management/continuity/index.ts`, `src/task-management/continuity/delegation-persistence.ts`, `src/features/doc-intelligence/router.ts`, `src/plugin.ts`
- Impact: Cold-start and CLI paths tolerate sync I/O, but plugin startup and tool execution paths can block the Node.js event loop during active OpenCode sessions.
- Fix approach: Keep sync I/O only in CLI/bootstrap cold paths. Convert runtime tool, hook, and plugin-init paths to `fs/promises` with bounded concurrency.

**Legacy compatibility and migration code still lives in runtime surfaces:**
- Issue: Source contains 25 `legacy` references and 10 `deprecated` references. `src/plugin.ts` still performs one-shot deletion of `.hivemind/event-tracker/` at startup.
- Files: `src/plugin.ts`, `src/coordination/delegation/manager.ts`, `src/shared/types.ts`, `src/task-management/continuity/index.ts`, `src/routing/behavioral-profile/resolve-behavioral-profile.ts`
- Impact: Runtime startup carries historical migration behavior and compatibility paths that are easy to forget during refactors.
- Fix approach: Track each compatibility path with an owner and removal gate. Move startup migrations out of `src/plugin.ts` before adding more migrations.

## Known Bugs

**Delegation runtime-truth status is inconsistent across governance docs:**
- Symptoms: `AGENTS.md` says CP-DT-01 is complete, while `.planning/STATE.md` and `.planning/ROADMAP.md` describe CP-DT-01 as runtime-blocked or reopened around native Task proof.
- Files: `AGENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `src/tools/delegation/delegate-task.ts`
- Trigger: Planning/state refreshes happen independently from root instructions and codebase maps.
- Workaround: Treat `.planning/STATE.md` and `.planning/ROADMAP.md` as current gating signals until a fresh validation artifact reconciles CP-DT-01.

**Fire-and-forget startup recovery still lacks direct failure surfacing:**
- Symptoms: `delegationManager.recoverPending()` is called with `void` and no `.catch()`. `replayPendingDelegationNotifications()` is also started with `void` at plugin init.
- Files: `src/plugin.ts:241-262`, `src/plugin.ts:473-490`
- Trigger: Corrupt continuity files, SDK failures, or TUI append failures during plugin startup.
- Workaround: Some internal functions catch failures, but there is no startup health state for callers to inspect.
- Fix approach: Attach `.catch()` logging to all startup promises and expose a read-only startup diagnostics summary through `hivemind-sdk-supervisor` or a doctor check.

## Security Considerations

**Session tracker persists raw user and assistant text without redaction:**
- Risk: User prompts, assistant outputs, and tool-derived excerpts can contain credentials or sensitive local context and are written to `.hivemind/session-tracker/` markdown/JSON artifacts.
- Files: `src/features/session-tracker/capture/message-capture.ts`, `src/features/session-tracker/persistence/session-writer.ts`, `src/features/session-tracker/capture/tool-capture.ts`, `src/shared/security/redaction.ts`
- Current mitigation: Redaction exists for continuity, delegation persistence, journal summaries, delegation status, and plugin tool output summaries.
- Recommendations: Apply `redactTextSecrets()` or boundary-specific redaction in session tracker writers before persisting captured message/tool content.

**Environment file present:**
- Risk: `.env` exists in the repository working tree. Contents were not read and must not be copied into planning artifacts.
- Files: `.env`
- Current mitigation: `.gitignore` should keep local env files out of version control.
- Recommendations: Keep pre-commit or CI secret scanning enabled and document that session tracker capture may persist prompt-provided secrets unless redaction is expanded.

**Background command execution depends on caller context:**
- Risk: `run-background-command` correctly requires `context.sessionID`, but non-OpenCode or malformed runtime contexts fail at tool execution time.
- Files: `src/tools/hivemind/run-background-command.ts`, `src/coordination/command-delegation/handler.ts`
- Current mitigation: `requireCallerSessionId()` blocks callerless output/input/list/terminate access and ownership checks guard PTY session reads.
- Recommendations: Keep all future command-control actions behind caller-visible delegation ownership checks; never add unauthenticated list/read shortcuts.

## Performance Bottlenecks

**Session search scans session files sequentially:**
- Problem: `handleSearchSessions()` iterates session directories and reads markdown plus child JSON files sequentially. It warns when files exceed 1 MB, but still loads each target file into memory.
- Files: `src/tools/hivemind/session-tracker.ts:227-283`, `src/tools/hivemind/session-tracker.ts:77-129`
- Cause: Search is implemented as filesystem scan + full-file read rather than an indexed query.
- Improvement path: Add a small searchable index under `.hivemind/session-tracker/` or bound scans by recency before reading full files.

**Long-lived timers and process maps require cleanup discipline:**
- Problem: Delegation, session tracker, and command delegation maintain timers/maps for polling, retry queues, PTY exit polling, and headless command output.
- Files: `src/features/session-tracker/index.ts`, `src/features/session-tracker/persistence/retry-queue.ts`, `src/coordination/command-delegation/handler.ts`, `src/coordination/delegation/manager-runtime.ts`, `src/shared/state.ts`
- Cause: WaiterModel delegation and session capture depend on polling/intervals where OpenCode does not expose every lifecycle event.
- Improvement path: Centralize timer ownership and expose diagnostics for active timers, pending retries, headless commands, and delegation maps.

**Headless command output is buffered in memory:**
- Problem: Headless command fallback stores stdout/stderr in memory up to `MAX_HEADLESS_OUTPUT_CHARS`.
- Files: `src/coordination/command-delegation/handler.ts:35-37`, `src/coordination/command-delegation/handler.ts:204-220`
- Cause: The command delegation fallback has no streaming persistence surface.
- Improvement path: Keep truncation, but add explicit output-size metadata to user-facing results and consider disk-backed chunks for long-running commands.

## Fragile Areas

**Delegation facade still bridges v2 coordinator and legacy runtime adapter:**
- Files: `src/coordination/delegation/manager.ts`, `src/coordination/delegation/manager-runtime.ts`, `src/coordination/delegation/coordinator.ts`, `src/tools/delegation/delegate-task.ts`, `src/tools/delegation/delegation-status.ts`
- Why fragile: `DelegationManager` preserves historical APIs while delegating newer paths to injected coordinator/lifecycle modules. Some methods fall back to `requireRuntime()` and some call only coordinator hooks.
- Safe modification: Identify whether a change targets SDK delegation, command delegation, PTY fallback, or facade compatibility before editing. Add regression tests for both coordinator-injected and runtime-adapter paths.
- Test coverage: Strong unit coverage exists under `tests/lib/coordination/delegation/` and `tests/tools/delegation/`, but live OpenCode native Task proof remains a separate gate.

**PTY availability and command fallback contract:**
- Files: `src/features/background-command/pty/pty-runtime.ts`, `src/features/background-command/pty/pty-manager.ts`, `src/coordination/command-delegation/handler.ts`, `tests/lib/pty/pty-runtime.test.ts`
- Why fragile: `PtyManager` imports `bun-pty` directly and only reports supported when `globalThis.Bun` exists; command delegation falls back to headless `node:child_process` when PTY is unavailable.
- Safe modification: Keep the PTY feature optional and verify both Bun-present and Bun-absent paths whenever changing command execution.
- Test coverage: PTY runtime tests mock `bun-pty`; fallback behavior needs integration proof in a real Node-only environment.

**Session tracker classification and persistence pipeline:**
- Files: `src/features/session-tracker/index.ts`, `src/features/session-tracker/initialization.ts`, `src/features/session-tracker/session-router.ts`, `src/features/session-tracker/persistence/hierarchy-index.ts`, `src/features/session-tracker/persistence/hierarchy-manifest.ts`, `src/features/session-tracker/orphan-cleanup.ts`
- Why fragile: The module combines SDK parent metadata, pending-dispatch registry, hierarchy indexes, immediate child writes, and cleanup/quarantine behavior.
- Safe modification: Preserve classify-before-I/O ordering and add focused tests for root sessions, known children, unknownSub sessions, forks, and orphan cleanup.
- Test coverage: Broad tests exist in `tests/features/session-tracker/`, but runtime preservation should still be validated against real OpenCode hook payloads.

**Codebase maps can become stale quickly:**
- Files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONVENTIONS.md`
- Why fragile: Existing maps are dated 2026-05-15 and include stale facts such as old session tracker LOC and abbreviated path labels.
- Safe modification: Refresh maps after phase execution and include `last_mapped_commit` in every core map.
- Test coverage: Documentation accuracy is inspection-based only.

## Scaling Limits

**In-memory delegation/session state scales with process lifetime:**
- Current capacity: Bound mainly by process memory and explicit pruning calls.
- Limit: Long-running OpenCode sessions with many delegations can accumulate maps and timers.
- Files: `src/shared/state.ts`, `src/coordination/delegation/manager-runtime.ts`, `src/coordination/delegation/state-machine.ts`, `src/coordination/command-delegation/handler.ts`
- Scaling path: Add periodic state-size metrics, default pruning intervals, and guardrails for maximum active timers/delegations per root session.

**Global queue policy can still create fairness issues:**
- Current capacity: Concurrency is policy-driven and lane-based, but queue fairness depends on queue keys and caller behavior.
- Limit: Heavy use of one agent/queue key can delay unrelated work if policy limits are low.
- Files: `src/coordination/concurrency/queue.ts`, `src/shared/runtime-policy.ts`, `src/coordination/delegation/dispatcher.ts`
- Scaling path: Keep per-root and per-agent limits visible in diagnostics; consider fair scheduling across root sessions.

## Dependencies at Risk

**Native/runtime-sensitive packages:**
- Risk: `bun-pty`, `node-pty`, `@ast-grep/napi`, and `tree-sitter-*` packages are platform-sensitive and can fail in constrained CI or user environments.
- Impact: Background command, primitive scanning, and code-intelligence features can degrade or fail depending on host runtime.
- Files: `package.json`, `src/features/background-command/pty/pty-manager.ts`, `src/features/bootstrap/primitive-loader.ts`, `src/features/bootstrap/primitive-scanners.ts`
- Migration plan: Keep native paths optional at runtime, add Node-only and Bun-present CI coverage, and report degraded capabilities through `hivemind doctor`.

**React/Ink sidecar dependencies inflate runtime footprint:**
- Risk: React 19 and multiple `@json-render/*` packages are runtime dependencies for a backend-oriented plugin.
- Impact: Install size and dependency churn increase for users that only need delegation/session harness functionality.
- Files: `package.json`, `src/cli/renderer.ts`, `src/sidecar/readonly-state.ts`
- Migration plan: Lazy-load UI/rendering dependencies and consider optional package boundaries for sidecar/CLI rendering.

## Missing Critical Features

**Runtime readiness evidence still depends on live OpenCode validation:**
- Problem: Unit tests cover many contracts, but several core claims require live OpenCode plugin/runtime proof: native Task dispatch, context injection, tool context shape, compact survival, and PTY/headless behavior.
- Blocks: Completion claims for CP-DT-01, CP-PTY-01 readiness, and production-level delegation confidence.
- Files: `.planning/STATE.md`, `.planning/ROADMAP.md`, `src/tools/delegation/delegate-task.ts`, `src/tools/hivemind/run-background-command.ts`, `src/plugin.ts`

**No typed structured error hierarchy:**
- Problem: Source has 100 `throw new Error` sites across 45 TypeScript files. Errors are string-prefix based rather than typed.
- Blocks: Callers cannot distinguish validation, permission, unavailable-runtime, not-found, and persistence failures without parsing messages.
- Files: `src/coordination/delegation/manager.ts`, `src/tools/hivemind/run-background-command.ts`, `src/shared/session-api.ts`

**Startup and runtime diagnostics are partial:**
- Problem: The plugin logs startup events and some warnings, but there is no unified health surface for recovery status, active timers, queue depth, pending notifications, PTY availability, and session tracker initialization outcome.
- Blocks: Operators cannot quickly determine whether the harness is healthy after restart.
- Files: `src/plugin.ts`, `src/features/sdk-supervisor/index.ts`, `src/tools/hivemind/hivemind-sdk-supervisor.ts`, `src/cli/commands/doctor.ts`

## Test Coverage Gaps

**Schema kernel dedicated tests are incomplete:**
- What's not tested: 16 of 18 schema files do not have direct `tests/schema-kernel/*.test.ts` coverage.
- Files: `src/schema-kernel/agent-frontmatter.schema.ts`, `src/schema-kernel/agent-work-contract.schema.ts`, `src/schema-kernel/bootstrap.schema.ts`, `src/schema-kernel/command-engine.schema.ts`, `src/schema-kernel/command-frontmatter.schema.ts`, `src/schema-kernel/config-precedence.schema.ts`, `src/schema-kernel/doc-intelligence.schema.ts`, `src/schema-kernel/mcp-server.schema.ts`, `src/schema-kernel/permission.schema.ts`, `src/schema-kernel/runtime-pressure.schema.ts`, `src/schema-kernel/sdk-supervisor.schema.ts`, `src/schema-kernel/session-tracker.schema.ts`, `src/schema-kernel/session-view.schema.ts`, `src/schema-kernel/skill-metadata.schema.ts`, `src/schema-kernel/tool-definition.schema.ts`, `src/schema-kernel/trajectory.schema.ts`
- Risk: Schema behavior may regress through indirect consumers only.
- Priority: Medium.

**Real-runtime integration coverage is still the main gap:**
- What's not tested: OpenCode plugin load, actual tool context injection, native Task child-session dispatch, and real PTY/headless execution across host runtimes.
- Files: `tests/plugins/plugin-lifecycle.test.ts`, `tests/tools/delegation/delegate-task.test.ts`, `tests/lib/pty/pty-runtime.test.ts`, `tests/lib/coordination/command-delegation.test.ts`
- Risk: Mocked SDK and unit tests can pass while runtime seams differ from the real OpenCode plugin environment.
- Priority: High.

---

## Phase 18 Cleanup

**Phase 18 cleanup:** `steering-engine/`, `runtime-detection/`, `toggle-gates`, and `recovery/` removed — all confirmed dead code per Phase 17 audit findings. Relevant concerns referencing these deleted modules have been removed from this document.

---

*Concerns audit: 2026-05-20*
