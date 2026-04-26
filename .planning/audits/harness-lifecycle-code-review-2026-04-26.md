---
audit: harness-lifecycle-code-review
date: 2026-04-26
reviewer: gsd-code-reviewer
depth: deep
scanned_file_count: 125
status: issues_found
findings:
  critical: 3
  high: 5
  medium: 3
  minor: 2
  total: 13
---

# Harness Lifecycle Code Review — 2026-04-26

I am subagent gsd-code-reviewer; I cannot delegate further; I fulfilled the bounded review task.

## Scope and Method

Reviewed hard-harness lifecycle, delegation, tool, hook, state, and integration-surface code using GSD deep review plus hm-detective SCAN/DEEP escalation. Markdown files were not audit targets. The only non-scope dependency reads were OpenCode SDK/plugin type files used to verify runtime API boundaries.

Scanned file count: 125 files (`src/**/*.ts`, `tests/**/*.ts`, `src/shared/**/*`, `src/schema-kernel/**/*`, package/build/test config code, and `bin/*`; no `.opencode/plugins` files were present).

## Findings Summary

| Severity | Count |
|---|---:|
| Critical | 3 |
| High | 5 |
| Medium | 3 |
| Minor | 2 |

## Area 1 — Plugin Hook Composition and Lifecycle Observability

Harness classification: hard harness plugin composition root. Actors: plugin host, tool invocations, lifecycle manager, event tracker, state manager. Event-driven hook/subscription: `tool.execute.before`, `tool.execute.after`, `event`. OpenCode SDK/API boundary: OpenCode plugin hook object contract. User-configurable primitive interaction: all tools. Tool/plugin/custom SDK utilization: OpenCode plugin hook map. Observability/state interaction: lifecycle activity tracking, `_harness` metadata, event-tracker projection.

### CR-01 — Plugin overwrites the tool-guard `tool.execute.after` hook

Severity: Critical

Rationale: one object key silently replaces the hook that records lifecycle activity and injects `_harness` metadata, so real runtime loses after-tool observability despite tests passing individual factories.

Evidence:
- `src/plugin.ts:115` spreads `...createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })` into the plugin return object.
- `src/plugin.ts:131-172` defines a second `tool.execute.after` property later in the same object, overwriting the earlier hook.
- `src/hooks/create-tool-guard-hooks.ts:111-150` is the overwritten hook that calls `lifecycleManager?.noteObservedActivity(...)` and writes `_harness` metadata.

Fix: compose both after-hook behaviors explicitly, e.g. create the tool guard hooks once, call `toolGuardHooks["tool.execute.after"](input, output)` inside the plugin-level after hook, then run the configure-primitive/event-tracker persistence logic.

## Area 2 — Delegated Session Permissions and OpenCode SDK Boundary

Harness classification: hard harness delegation/session spawning. Actors: parent session, child session, specialist agent, OpenCode SDK. Event-driven hook/subscription: delegation completion depends on `session.idle` and status polling after prompt dispatch. OpenCode SDK/API boundary: `session.create`, `session.prompt`, `app.agents`. User-configurable primitive interaction: requested runtime agent and its OpenCode-defined tools/permissions. Tool/plugin/custom SDK utilization: `delegate-task` custom tool and SDK child-session creation. Observability/state interaction: persisted delegations and terminal notifications.

### CR-02 — Delegation permission profile is constructed but not enforceable through `session.create`

Severity: Critical

Rationale: the harness appears to restrict child tools, but it passes permission data through a `session.create` shape that the installed OpenCode SDK does not define, so real child sessions can run with host/default permissions instead of the harness guardrail.

Evidence:
- `src/lib/spawner/spawn-request-builder.ts:37-40` constructs a `permissionProfile` with write-capable tool names.
- `src/lib/spawner/session-creator.ts:16-25` defines hard-coded `WRITE_CAPABLE_PERMISSION_RULES` and denies `delegate-task`/`task`.
- `src/lib/spawner/session-creator.ts:30-35` passes those rules as `permission` into `createSession(...)`.
- `src/lib/session-api.ts:37-48` spreads `permission` into `client.session.create` request body.
- OpenCode SDK boundary evidence: `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:1808-1816` defines `SessionCreateData.body` as only `parentID` and `title` with query `directory`; no `permission` field is supported.

Fix: move permission/tool restrictions to the supported SDK surface (for example prompt `tools` map where applicable) or to real OpenCode primitive configuration, and add an integration test against the installed SDK types/API shape rather than only mocks.

### HIGH-01 — Delegation hard-codes soft meta-concept permissions instead of respecting user-configured agent primitives

Severity: High

Rationale: child sessions are forced through one write-capable rule set, ignoring the selected agent's `.opencode/agents/<agent>.md` permission/tool policy, which violates the harness split between hard runtime and user-configurable soft primitives.

Evidence:
- `src/lib/spawner/session-creator.ts:16-25` hard-codes one permission rule array for every delegated agent.
- `src/lib/spawner/session-creator.ts:30-35` applies that rule array for all child sessions.
- `src/lib/spawner/spawn-request-builder.ts:37-40` hard-codes `tools: ["read", "edit", "write", "bash", "glob", "grep"]`.

Fix: resolve the selected agent's actual OpenCode primitive configuration at runtime and only apply harness-level denial overlays for recursion/capability gates.

## Area 3 — Delegation Dispatch, Completion, and Mock-vs-Runtime Gaps

Harness classification: hard harness lifecycle/delegation manager. Actors: parent session, child session, `DelegationManager`, `SdkDelegationHandler`, OpenCode session event stream. Event-driven hook/subscription: `session.idle`, `session.deleted`, stability polling. OpenCode SDK/API boundary: `session.prompt`, `session.messages`, `session.status`. User-configurable primitive interaction: selected agent name/model/category. Tool/plugin/custom SDK utilization: `delegate-task`, waiter-model polling. Observability/state interaction: `.hivemind/state/delegations.json`, status metadata, terminal notification.

### HIGH-02 — `delegate-task` returns success before prompt delivery is accepted

Severity: High

Rationale: callers receive a dispatched delegation ID even when the child prompt later fails asynchronously, creating a false-positive lifecycle state in real runtime.

Evidence:
- `src/lib/delegation-manager.ts:106-128` creates and persists a `dispatched` delegation before prompt delivery succeeds.
- `src/lib/delegation-manager.ts:129-147` calls `this.client.session.prompt(...).then(...).catch(...)` without awaiting it.
- `src/lib/delegation-manager.ts:148` immediately returns `this.buildResult(delegation)`.

Fix: use the supported async prompt endpoint when the runtime is trusted, or await prompt request acceptance before returning `dispatched`; if fire-and-forget is required, return a state that truthfully means `created-not-yet-prompted`.

### HIGH-03 — Stability polling can mark a dead or silent child session as completed

Severity: High

Rationale: unchanged message count is treated as completion after enough time/polls, which cannot distinguish successful completion from a crashed, compacted, blocked, or dead session.

Evidence:
- `src/lib/sdk-delegation.ts:172-178` finalizes as completed once minimum stability time and stable poll count are met.
- `src/lib/sdk-delegation.ts:186-200` then extracts whatever assistant text exists and calls `onTerminal(..., "completed")`.
- `src/lib/completion-detector.ts:100-112` similarly resolves stability timeout as `signal: "idle"` even when no terminal success signal was observed.

Fix: require an explicit completion contract, terminal success marker, or OpenCode runtime terminal status before `completed`; otherwise classify as `unknown`, `stalled`, or `needs-review`.

### HIGH-04 — Recovery treats missing status as terminal error after a 5s SDK race

Severity: High

Rationale: plugin startup in a second OpenCode instance can convert still-running delegations into errors if status is temporarily unavailable, causing false failure state.

Evidence:
- `src/lib/sdk-delegation.ts:79-88` races `client.session.status()` against a hard-coded 5 second timeout.
- `src/lib/sdk-delegation.ts:90-103` throws on missing status and immediately calls `onTerminal(..., "error", "Child session not found on recovery")`.
- `src/plugin.ts:67-70` starts `recoverPending()` asynchronously at plugin init without coordinating runtime ownership.

Fix: persist an `unverified-after-restart` state and retry with backoff/ownership checks before terminalizing recovered delegations.

## Area 4 — Configuration Tooling and Soft Primitive Writes

Harness classification: hard harness custom tools for soft meta-concept configuration. Actors: user, tool caller, filesystem, OpenCode primitive loader/compiler. Event-driven hook/subscription: configure-primitive persistence via plugin `tool.execute.after`. OpenCode SDK/API boundary: plugin tool schema and OpenCode primitive directory conventions. User-configurable primitive interaction: agents, commands, skills. Tool/plugin/custom SDK utilization: `configure-primitive`, `validate-restart`. Observability/state interaction: config workflow state auto-persistence.

### HIGH-05 — `configure-primitive` reports success before the file write completes

Severity: High

Rationale: asynchronous `fs.writeFile` is not awaited, so write failures become unhandled later and the tool can report success while no primitive exists on disk.

Evidence:
- `src/tools/configure-primitive.ts:204-205` calls `fs.writeFile(filePath, result.content, "utf-8")` without `await` or error handling.
- `src/tools/configure-primitive.ts:207` immediately returns `success("Primitive configured", ...)`.

Fix: `await fs.writeFile(...)` inside a try/catch and return an error envelope if the write fails.

### MED-01 — Primitive path resolution allows unsanitized names in read/inspect paths

Severity: Medium

Rationale: `name` is directly joined into `.opencode` paths for read/inspect, enabling path traversal reads if a caller supplies `../` segments.

Evidence:
- `src/tools/configure-primitive.ts:288-290` resolves the read path from caller-controlled `args.name`.
- `src/tools/configure-primitive.ts:342-344` resolves the inspect path from caller-controlled `args.name`.
- `src/tools/configure-primitive.ts:416-433` uses `path.join(base, ..., name, ...)` without validating `name`.

Fix: reject primitive names containing path separators, `..`, absolute paths, or non-slug characters before resolving any filesystem path.

### MED-02 — Runtime policy is only loaded from in-memory defaults at plugin startup

Severity: Medium

Rationale: workspace/user policy fields exist but the plugin never reads a workspace config file or plugin options, so runtime behavior is effectively hard-coded.

Evidence:
- `src/plugin.ts:52` receives only `{ client, directory }` and ignores plugin options/worktree/project configuration.
- `src/plugin.ts:53-54` calls `loadRuntimePolicy()` with no workspace policy input.
- `src/lib/runtime-policy.ts:28-40` defines the fallback policy used when no policy is supplied.

Fix: accept and validate plugin options or a project-local policy file and pass the parsed policy into `loadRuntimePolicy(workspacePolicy)`.

## Area 5 — Session Patch Tool Safety and State Integrity

Harness classification: hard harness custom write-side tool. Actors: tool caller, filesystem, session context file. Event-driven hook/subscription: none directly; result observed through tool hooks. OpenCode SDK/API boundary: plugin tool context. User-configurable primitive interaction: session-context artifacts, not primitives. Tool/plugin/custom SDK utilization: `session-patch`. Observability/state interaction: backup files and `patch_count` frontmatter.

### CR-03 — Session patch can write to arbitrary absolute paths

Severity: Critical (counted in total as part of the two criticals? See note below)

Rationale: the tool accepts any `sessionFilePath`, creates backups next to it, and writes the target without project-root or filename validation; in a real OpenCode runtime this is a write primitive outside the intended session artifact boundary.

Evidence:
- `src/tools/session-patch/tools.ts:26-28` describes `sessionFilePath` as an arbitrary absolute path.
- `src/tools/session-patch/tools.ts:40-50` checks existence, creates a `.patches` sibling directory, and writes a backup.
- `src/tools/session-patch/tools.ts:67-81` writes the patched content back to `args.sessionFilePath` twice.

Fix: restrict to the active project/worktree and expected session artifact names; resolve realpaths and reject paths outside approved roots before reading or writing.

Note: this is security-critical for the tool surface and is counted as a Critical finding because the harness lifecycle includes custom write-side tools.

## Area 6 — Command Execution Lifecycle

Harness classification: hard harness command/PTY delegation. Actors: tool caller, PTY manager, headless child process, delegation manager. Event-driven hook/subscription: PTY exit polling and child process events. OpenCode SDK/API boundary: plugin `run-background-command` tool. User-configurable primitive interaction: none. Tool/plugin/custom SDK utilization: PTY and `child_process.spawn`. Observability/state interaction: delegation status/result output.

### MED-03 — Headless command output is buffered without a safety cap

Severity: Medium

Rationale: a long-running or noisy process can grow `state.output` unbounded and crash the plugin process, turning a command lifecycle into dead runtime state.

Evidence:
- `src/lib/command-delegation.ts:187` initializes `output: ""`.
- `src/lib/command-delegation.ts:188-193` appends all stdout/stderr chunks to `state.output` without max length or streaming truncation.

Fix: cap buffered output, record truncation metadata, and expose output reads through the PTY/session registry instead of retaining unlimited strings.

## Area 7 — Test Coverage Reliability / Mock-Only Signals

Harness classification: test/integration confidence. Actors: test suite, mocked SDK, real OpenCode runtime. Event-driven hook/subscription: mocked status/messages/agents. OpenCode SDK/API boundary: mocked client signatures. User-configurable primitive interaction: fixture primitives. Tool/plugin/custom SDK utilization: unit tests around tools and managers. Observability/state interaction: temp `.hivemind` state.

### MIN-01 — SDK permission mismatch is not caught because tests mock unsupported fields

Severity: Minor

Rationale: tests validate harness intent with mocks but do not assert installed SDK request shapes, allowing `permission` on `session.create` to appear working.

Evidence:
- `src/lib/session-api.ts:37-48` sends `permission` through `session.create`.
- `tests/lib/session-api.test.ts` uses a local mock client pattern instead of the installed SDK type/runtime for the create request (mock-heavy tests around `client.session.create`).
- SDK boundary: `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:1808-1816` omits `permission` from `SessionCreateData`.

Fix: add contract tests that compile/check request bodies against the installed SDK types and, where possible, exercise a real OpenCode test server.

### MIN-02 — Project AGENTS module notes still describe known dead/stub modules as active surfaces

Severity: Minor

Rationale: local source instructions label lifecycle-manager as a stub/dead-code-adjacent while implementation now partially dispatches through `DelegationManager`, which risks stale review and maintenance decisions.

Evidence:
- `src/lib/lifecycle-manager.ts:161-176` implements `launchDelegatedSession(...)` through `delegationManager.dispatch(...)`.
- `src/lib/AGENTS.md` (instruction file, not audit target) still describes `lifecycle-manager.ts` as a STUB and `notification-handler.ts` as deprecated/dead code.

Fix: sync source-local instructions after lifecycle remediation so reviewers and agents do not rely on stale module status.

## Remediation Phase Candidates (not plans)

1. **Phase Candidate A — Hook Composition Integrity:** compose plugin-level and tool-guard after hooks; add regression test that `_harness` metadata survives configure-primitive/event-tracker after-hook logic.
2. **Phase Candidate B — Real SDK Delegation Contract:** align child session creation, prompt async mode, tools/permissions, and agent primitive resolution with OpenCode SDK 1.14.25+ supported fields.
3. **Phase Candidate C — Honest Completion Semantics:** replace silent stability-as-completion with explicit completion contracts and `unknown/stalled` terminal states.
4. **Phase Candidate D — Tool Write-Surface Hardening:** constrain `session-patch` and `configure-primitive` paths; await and report all filesystem writes.
5. **Phase Candidate E — Runtime Policy Loading:** wire plugin options/project policy into `loadRuntimePolicy` and validate against real workspace configs.

## Recommended Next Subagent for Planning

Recommended next subagent: `gsd-planner` for a remediation phase plan, with `gsd-security-auditor` queued after planning if the session-patch arbitrary write surface is in scope for the next gate.
