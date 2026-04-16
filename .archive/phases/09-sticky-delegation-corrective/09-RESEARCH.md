# Phase 09: Sticky Delegation Corrective - Research

**Researched:** 2026-04-10 [VERIFIED: codebase read]
**Domain:** OpenCode delegated-session lifecycle hardening, notification durability, sync/async dispatch semantics, and execution-mode routing [VERIFIED: codebase read]
**Confidence:** MEDIUM [VERIFIED: codebase read + DeepWiki]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Message-count stability gate
- **D-01:** Integrate CompletionDetector into observeBackgroundCompletion(). After idle detection: get message count AND tool call count via client.session.messages(), feed to CompletionDetector via feedMessageCount(). Wait for stability timeout before marking complete.
- **D-02:** Stability check must track BOTH message count AND tool call count — both together constitute the evidence that a session actually processed work, not just that it was created and sat idle.

### Poll interval reduction
- **D-03:** Reduce DEFAULT_POLL_INTERVAL_MS from 15000 (15s) to 3000 (3s) to match oh-my-openagent responsiveness. This is a direct reduction, not configurable in this phase.

### Parent notification replay on resume
- **D-04:** Wire formatPendingNotificationsForSession() into createCoreHooks handleEvent(). When lifecycle phase transitions to 'created' or 'resumed', check pendingNotifications, format them, and inject via TUI toast.
- **D-05:** This is the integration point — not hydrateFromContinuity, which is a data-loading seam not a notification-injection seam.

### Sync mode output handling
- **D-06:** Keep sync mode (run_in_background=false) for dependent tasks that need control and synchronous results. It is NOT being replaced by background-only.
- **D-07:** Fix sync mode output crash by wrapping large responses in a structured JSON envelope { output: base64(assistant_text) }. This guarantees valid JSON regardless of response size.

### Parameter rename
- **D-08:** Rename run_in_background to async_dispatch in delegate-task tool schema. This clearly distinguishes from the background tool (OS subprocess management) and accurately describes the behavior (async child session dispatch).
- **D-09:** Update all tests and references to run_in_background → async_dispatch.

### User dispatch mode config
- **D-10:** Add runtime config fields to delegate-task schema: defaultDispatchMode (async/sync), tmuxAvailability (auto/enabled/disabled), pollInterval override (3s/5s/15s). Runtime reads these at launch time.

### Tmux full integration
- **D-11:** Full TmuxSessionManager integration — spawn delegated sessions in tmux panes when tmux is available. Pane process exit IS the completion signal (binary unambiguous, not a poll).
- **D-12:** Provides visual observability (user watches agents work in real-time) and a reliable fallback completion signal independent of session status polling.
- **D-13:** Integration approach: agent decides exact wiring based on existing background-manager patterns.

### Execution-mode routing (from Phase 08 context)
- **D-14:** builtin-process path (OS child process) uses process exit as completion signal — this already works correctly.
- **D-15:** builtin-subsession path (OpenCode child session) is the one that needs the stability gate fix. Both paths remain, with the subsession path now hardened.

### Notification delivery (from Phase 08 context)
- **D-16:** notifyParentSession → persistPendingNotification → formatPendingNotificationsForSession chain is now fully wired via handleEvent replay.
- **D-17:** Notification delivery is best-effort but now durable through persistence + replay rather than silently dropped on parent offline.

### the agent's Discretion
- Exact naming of the corrective sub-lanes inside Phase 08, as long as they preserve the bundled closure strategy above.
- Exact verification command split between bounded tests and full re-verification, as long as the corrective corridor and Phase 02 re-verification gate are both explicit.
- Exact doc wording for roadmap/state reconciliation, as long as ownership and dependency direction stay unambiguous.

### Deferred Ideas (OUT OF SCOPE)
- No tmux integration deferred — full integration is part of Phase 09
- No delegation redesign beyond the corrective corridor
</user_constraints>

## Project Constraints (from AGENTS.md)

- GSD command instructions supersede loading unrelated skills for this phase [VERIFIED: AGENTS.md]
- Keep the plugin/composition root thin; put runtime logic in `src/lib/*`, hooks, and tools rather than `src/plugin.ts` [VERIFIED: AGENTS.md]
- Respect dependency rules: `types.ts` is leaf, no circular dependencies, max module size target is 500 LOC [VERIFIED: AGENTS.md]
- Preserve strict TypeScript conventions: no new `any`, use `import type`, keep `[Harness]` error prefix behavior [VERIFIED: AGENTS.md]
- Use continuity as durable state plus in-memory maps as the dual-layer runtime model [VERIFIED: AGENTS.md]
- Verify with `npm run typecheck`, `npm test`, and `npm run build` before claiming completion [VERIFIED: AGENTS.md]

## Summary

Phase 09 should be planned as a corrective runtime-hardening phase, not a redesign phase. The current harness already has the right major seams: `CompletionDetector`, continuity-backed `pendingNotifications`, `system.transform` replay, explicit execution-family metadata, and a split between `builtin-process` and `builtin-subsession` execution. The key issue is that those seams are only partially integrated, so the planner should focus on wiring and verification, not invention. [VERIFIED: `src/lib/completion-detector.ts`, `src/lib/pending-notifications.ts`, `src/hooks/create-core-hooks.ts`, `src/lib/execution-mode.ts`, `src/lib/lifecycle-process-runner.ts`]

The highest-risk mismatch is completion detection. The current observer still treats `idle` as sufficient once `seenBusy` or a single startup window has elapsed, while the reference behavior described for oh-my-openagent uses a 3-second polling loop plus message-count stability before terminal completion. The second-highest risk is execution-mode mismatch: the classifier can emit `tmux-pane`, but the lifecycle manager currently has no dedicated tmux runner branch, so `tmux-pane` is effectively unimplemented. Notification replay is closer to done because `system.transform` already surfaces `pendingNotifications`; the missing planning work is to choose the authoritative event seam and verify replay timing. [VERIFIED: `src/lib/lifecycle-background-observer.ts`, `src/lib/execution-mode.ts`, `src/lib/lifecycle-manager.ts`, `src/hooks/create-core-hooks.ts`; CITED: DeepWiki code-yeongyu/oh-my-openagent background task completion answer]

**Primary recommendation:** Plan Phase 09 around five implementation lanes: (1) harden `builtin-subsession` completion with a real stability gate, (2) reduce polling latency, (3) formalize notification replay via the core hook seam, (4) keep sync mode but return a structured envelope, and (5) either implement true tmux execution or explicitly block `tmux-pane` selection until the runner exists. [VERIFIED: codebase read + Phase 09 context]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | repo installed `5.9.3`; latest registry `6.0.2` (published 2026-03-23) [VERIFIED: npm ls + npm registry] | Runtime/library implementation language [VERIFIED: `package.json`] | Existing codebase and strict compiler settings are already built around TypeScript [VERIFIED: AGENTS.md + `package.json`] |
| Vitest | repo installed `1.6.1`; latest registry `4.1.4` (published 2026-04-09) [VERIFIED: npm ls + npm registry] | Unit/integration verification framework [VERIFIED: `package.json`] | Existing tests already cover observer, completion detector, routing, hooks, and E2E flows [VERIFIED: test file reads + grep] |
| `@opencode-ai/sdk` | repo installed `1.4.2`; latest registry `1.4.3` (published 2026-04-10) [VERIFIED: npm ls + npm registry] | Session create/get/prompt/promptAsync/messages/status access [VERIFIED: `src/lib/session-api.ts`] | Phase 09 changes depend on these SDK surfaces rather than raw HTTP calls [VERIFIED: `src/lib/session-api.ts`] |
| `@opencode-ai/plugin` | peer `>=1.1.0`; latest registry `1.4.3` (published 2026-04-10) [VERIFIED: `package.json` + npm registry] | Tool schema + plugin runtime integration [VERIFIED: `src/tools/delegate-task.ts`] | Delegate-task schema changes and hook wiring stay inside the plugin abstraction already used by the project [VERIFIED: `src/tools/delegate-task.ts`, `src/hooks/create-core-hooks.ts`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | repo installed `4.3.6`; latest registry `4.3.6` (published 2026-01-22) [VERIFIED: npm ls + npm registry] | Argument/schema validation [VERIFIED: `src/tools/delegate-task.ts`] | Use for the `delegate-task` rename and new runtime config fields rather than ad hoc parsing [VERIFIED: `src/tools/delegate-task.ts`] |
| Python 3 | host `3.13.7` [VERIFIED: environment audit] | Optional scripting support during tooling/tests [VERIFIED: environment audit] | Only for auxiliary scripts; not required for Phase 09 runtime logic [VERIFIED: codebase read] |
| tmux | host `MISSING` [VERIFIED: environment audit] | Optional visible-worker execution backend [VERIFIED: `src/lib/execution-mode.ts`] | Required only if Phase 09 actually implements D-11/D-12 on this machine; planner must include fallback/test strategy [VERIFIED: Phase 09 context + environment audit] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `CompletionDetector` | New observer-local stability state machine | Worse because it duplicates stability logic that already exists and is already unit-tested [VERIFIED: `src/lib/completion-detector.ts`, `tests/lib/completion-detector.test.ts`] |
| Continuity-backed pending notification replay | New runtime-only notification cache | Worse because `pendingNotifications` already persist in continuity and `system.transform` already consumes them [VERIFIED: `src/lib/pending-notifications.ts`, `src/lib/continuity.ts`, `src/hooks/create-core-hooks.ts`] |
| Keeping execution-family split | Flatten everything into one dispatch path | Worse because `builtin-process` already has a reliable process-exit completion signal while `builtin-subsession` needs different hardening [VERIFIED: `src/lib/lifecycle-process-runner.ts`, Phase 09 context] |

**Installation:**
```bash
# No new packages required for the core Phase 09 corrective work.
# Use the repo's existing install, then verify with the commands below.
npm install
```
[VERIFIED: `package.json` + codebase read]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── lib/
│   ├── completion-detector.ts          # shared stability-gate primitive
│   ├── lifecycle-background-observer.ts # subsession completion observation
│   ├── lifecycle-process-runner.ts      # sync/async process + subsession execution
│   └── pending-notifications.ts         # durable offline notification store
├── hooks/
│   └── create-core-hooks.ts             # replay/injection seam
└── tools/
    └── delegate-task.ts                 # schema, naming, dispatch defaults

tests/
├── lib/                                 # observer/detector/execution unit tests
├── hooks/                               # replay hook tests
└── integration/                         # end-to-end delegated lifecycle tests
```
[VERIFIED: codebase read]

### Pattern 1: Add the second completion signal at the observer seam
**What:** Keep `observeBackgroundCompletion()` as the orchestration seam, but stop letting `idle` terminate immediately; instead, fetch session messages, derive evidence, and feed the existing `CompletionDetector` until stability resolves. [VERIFIED: `src/lib/lifecycle-background-observer.ts`, `src/lib/completion-detector.ts`, Phase 09 context]
**When to use:** For `builtin-subsession` async delegated work only. [VERIFIED: `src/lib/execution-mode.ts`, Phase 09 context]
**Example:**
```typescript
// Source: src/lib/completion-detector.ts [VERIFIED: codebase read]
detector.feedMessageCount(sessionID, count)
const result = await detector.watch(sessionID, timeoutMs)
```

### Pattern 2: Replay durable notifications through the core hook, not hydration
**What:** Treat continuity as storage and `system.transform` / session-start hook logic as the replay seam that injects pending notifications into the user-visible session. [VERIFIED: `src/lib/pending-notifications.ts`, `src/hooks/create-core-hooks.ts`, Phase 09 context]
**When to use:** When the parent session was offline or delivery failed at completion time. [VERIFIED: `src/lib/lifecycle-background-observer.ts`, `tests/hooks/create-core-hooks.test.ts`]
**Example:**
```typescript
// Source: src/hooks/create-core-hooks.ts [VERIFIED: codebase read]
if ((continuity.metadata.pendingNotifications?.length ?? 0) > 0) {
  output.system = Array.isArray(output.system) ? output.system : []
  ;(output.system as string[]).push(
    formatPendingNotificationsForSession(continuity.metadata.pendingNotifications ?? []),
  )
  patchSessionContinuity(sessionID, { pendingNotifications: [] })
}
```

### Pattern 3: Preserve execution-family routing, but make `tmux-pane` real or unavailable
**What:** Keep the current classifier contract, but do not allow `tmux-pane` to silently fall through the subsession runner. [VERIFIED: `src/lib/execution-mode.ts`, `src/lib/lifecycle-manager.ts`]
**When to use:** Any plan touching D-11 through D-15. [VERIFIED: Phase 09 context]
**Example:**
```typescript
// Source: src/lib/execution-mode.ts [VERIFIED: codebase read]
if (characteristics.isParallel && characteristics.runInBackground && capabilities.hasTmux) {
  return { family: "visible-worker", submode: "tmux-pane", ... }
}
```

### Anti-Patterns to Avoid
- **Idle-only completion:** `idle` plus a startup window is still not proof of completed work. [VERIFIED: `src/lib/lifecycle-background-observer.ts`, Phase 09 root-cause doc]
- **New notification channel:** building a second offline notification store would duplicate continuity-backed `pendingNotifications`. [VERIFIED: `src/lib/pending-notifications.ts`, `src/lib/continuity.ts`]
- **Implicit tmux routing:** letting `tmux-pane` be selected without a dedicated runner hides a real implementation gap. [VERIFIED: `src/lib/execution-mode.ts`, `src/lib/lifecycle-manager.ts`]
- **Raw sync text returns:** returning large assistant text directly from sync delegation is already implicated in `Unexpected EOF` failures. [VERIFIED: `src/lib/lifecycle-process-runner.ts`, root-cause doc, `tests/tools/delegate-task-overflow.test.ts`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stability gating | Observer-local counters/timers | `CompletionDetector.feedMessageCount()` + `watch()` [VERIFIED: codebase read] | Existing primitive already handles timer reset/cancel semantics and has tests [VERIFIED: `tests/lib/completion-detector.test.ts`] |
| Offline completion replay | Separate in-memory replay queue | `pendingNotifications` in continuity + core hook replay [VERIFIED: codebase read] | Durable through resume and already partially wired [VERIFIED: `src/hooks/create-core-hooks.ts`, `tests/hooks/create-core-hooks.test.ts`] |
| Sync response safety | Ad hoc truncation or plain text return | Structured JSON envelope with encoded payload per D-07 [VERIFIED: Phase 09 context] | Planner needs a deterministic tool-safe return contract, not heuristic truncation [VERIFIED: root-cause doc] |
| Execution routing simplification | Remove `builtin-process` / `builtin-subsession` split | Keep split and harden the weak path [VERIFIED: Phase 09 context + codebase read] | `builtin-process` already works off process exit, so collapsing paths would throw away a reliable branch [VERIFIED: `src/lib/lifecycle-process-runner.ts`] |

**Key insight:** Phase 09 is mostly an integration-and-verification phase because the building blocks already exist; the planner should optimize for seam closure and contradiction removal, not greenfield architecture. [VERIFIED: codebase read]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Canonical continuity stores `runInBackground` (camelCase) inside metadata and delegation artifacts; no persisted raw `run_in_background` field was found in the source persistence path [VERIFIED: grep `runInBackground` + `src/lib/continuity-normalizers.ts` + `src/lib/delegation-packet.ts`] | **Code edit only** for tool schema rename; **no continuity data migration** required unless planner chooses to persist raw schema names elsewhere [VERIFIED: codebase read] |
| Live service config | None found in the repo for external services storing the old delegate-task field name; tmux is not installed on the current host [VERIFIED: codebase read + environment audit] | None on this machine; if tmux support is implemented, planner should treat host setup as a prerequisite, not a migration [VERIFIED: environment audit] |
| OS-registered state | No tmux panes, launchd entries, or other OS registrations were identified by the current environment audit; `tmux` is missing entirely [VERIFIED: environment audit] | No migration on this machine; add install/setup or fallback logic only [VERIFIED: environment audit] |
| Secrets/env vars | No environment variable or secret key name tied to `run_in_background` was found in the researched code paths; tmux detection only reads `TMUX`, `TMUX_PANE`, and `TERM_PROGRAM` [VERIFIED: `src/tools/delegate-task.ts`] | None for rename; keep tmux detection read-only [VERIFIED: codebase read] |
| Build artifacts | Historical markdown/session artifacts and tests still contain `run_in_background` references, but they are not runtime state for the plugin execution path [VERIFIED: grep results + test reads] | **Code/test/docs edits** required; **no build-artifact migration** required beyond normal rebuild/retest [VERIFIED: codebase read] |

## Common Pitfalls

### Pitfall 1: Treating `idle` as execution proof
**What goes wrong:** A child session can be marked complete before doing meaningful work. [VERIFIED: root-cause doc + `src/lib/lifecycle-background-observer.ts`]
**Why it happens:** The current observer relies on `seenBusy` or a startup window instead of stable evidence from session history. [VERIFIED: `src/lib/lifecycle-background-observer.ts`]
**How to avoid:** Make `client.session.messages()`-derived evidence mandatory before the completion transition. [VERIFIED: Phase 09 context]
**Warning signs:** Fast “completed” transitions after creation and no real child output. [VERIFIED: root-cause doc]

### Pitfall 2: Believing tmux support already exists because the classifier names it
**What goes wrong:** Plans assume `tmux-pane` is executable, but the lifecycle manager currently only special-cases `builtin-process`; everything else falls into the subsession runner. [VERIFIED: `src/lib/execution-mode.ts`, `src/lib/lifecycle-manager.ts`]
**Why it happens:** Classification and execution are ahead of each other. [VERIFIED: codebase read]
**How to avoid:** Add an explicit tmux execution branch or gate `tmux-pane` behind an availability + implementation check. [VERIFIED: codebase read + Phase 09 context]
**Warning signs:** Execution metadata says `tmux-pane`, but no tmux process/pane code path runs. [VERIFIED: codebase read]

### Pitfall 3: Clearing notification durability at the wrong seam
**What goes wrong:** Notifications are stored, but the planner picks hydration or another data seam instead of the actual user-visible replay seam. [VERIFIED: Phase 09 context + `src/hooks/create-core-hooks.ts`]
**Why it happens:** Persistence and display are separate concerns. [VERIFIED: codebase read]
**How to avoid:** Keep persistence in continuity and replay in the core hook/session-start path. [VERIFIED: `src/lib/pending-notifications.ts`, `src/hooks/create-core-hooks.ts`]
**Warning signs:** Pending notifications exist in continuity, but the parent never sees them. [VERIFIED: `tests/hooks/create-core-hooks.test.ts`]

### Pitfall 4: Breaking sync mode while fixing async mode
**What goes wrong:** The planner removes sync mode or changes its semantics even though the context explicitly keeps it. [VERIFIED: Phase 09 context]
**Why it happens:** The current sync return path is unstable and easy to mistake for a feature to delete. [VERIFIED: `src/lib/lifecycle-process-runner.ts`, root-cause doc]
**How to avoid:** Keep sync dispatch semantics, but change only the returned envelope/serialization contract. [VERIFIED: Phase 09 context]
**Warning signs:** Tests or docs stop exercising `run_in_background: false` / sync dispatch scenarios. [VERIFIED: `tests/integration/v3-e2e.test.ts`, `tests/tools/delegate-task.test.ts`]

## Code Examples

Verified patterns from official/current sources:

### Existing stability primitive to reuse
```typescript
// Source: src/lib/completion-detector.ts [VERIFIED: codebase read]
feedMessageCount(sessionID: string, count: number): void {
  const prev = this.messageCounts.get(sessionID)
  this.messageCounts.set(sessionID, count)

  if (prev === undefined) {
    this.startStabilityTimer(sessionID)
  } else if (prev !== count) {
    this.clearStabilityTimer(sessionID)
    this.startStabilityTimer(sessionID)
  }
}
```

### Existing notification replay seam
```typescript
// Source: src/hooks/create-core-hooks.ts [VERIFIED: codebase read]
await hooks["system.transform"]({ sessionID: "sess-pending" }, systemOutput)
// Existing test expects the output to contain:
// "Pending background task notifications:"
```
[VERIFIED: `tests/hooks/create-core-hooks.test.ts`]

### Reference behavior from oh-my-openagent
```text
Background tasks poll every ~3 seconds and require idle + message-count stability
before completion is accepted.
```
[CITED: DeepWiki code-yeongyu/oh-my-openagent background task completion answer]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Idle-only / weak startup-gate completion | Idle plus message-count stability before completion [CITED: DeepWiki; VERIFIED: Phase 09 context] | Current reference behavior in 2026 [CITED: DeepWiki code-yeongyu/oh-my-openagent background task completion answer] | Greatly reduces false-positive completions on slow-starting child sessions [VERIFIED: root-cause doc] |
| 15-second observer polls | 3-second polls in the reference system and locked 3-second target for Phase 09 [CITED: DeepWiki; VERIFIED: Phase 09 context] | Current 2026 reference + locked decision [CITED: DeepWiki; VERIFIED: Phase 09 context] | Faster detection and fewer missed transitions [VERIFIED: root-cause doc] |
| Best-effort notify-only delivery | Persistence plus replay on resume [VERIFIED: `src/lib/pending-notifications.ts`, `src/hooks/create-core-hooks.ts`] | Already partially implemented before Phase 09 [VERIFIED: codebase read] | Makes parent observability durable across offline gaps [VERIFIED: codebase read + Phase 09 context] |
| Raw sync assistant text returns | Structured tool-safe envelope with encoded payload [VERIFIED: Phase 09 context] | Locked for this phase [VERIFIED: Phase 09 context] | Preserves sync mode without parser crashes [VERIFIED: root-cause doc + Phase 09 context] |

**Deprecated/outdated:**
- `startupWindowElapsed` as a completion proof is outdated for this problem because it is time-based rather than work-based. [VERIFIED: root-cause doc + `src/lib/lifecycle-background-observer.ts`]
- The roadmap line that says tmux is deferred is stale relative to the locked Phase 09 context, which now requires tmux integration. [VERIFIED: `.planning/ROADMAP.md` + `09-CONTEXT.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tool-call count can be derived reliably from the shape returned by `client.session.messages()` without additional SDK support. [ASSUMED] | Architecture Patterns / Common Pitfalls | The planner could scope the stability gate incorrectly or underestimate parsing work. |
| A2 | The intended tmux implementation for this project should use pane/process exit as the completion signal even if the external oh-my-openagent reference uses tmux mostly for pane management plus polling. [ASSUMED] | Summary / Architecture Patterns | The planner could implement the wrong tmux contract or mis-state “parity” goals. |

## Open Questions (RESOLVED)

1. **How should tool-call count be computed from session messages?** [RESOLVED]
   - Resolution: Count tool calls from each message object's `parts[]` entries whose `type` is `"tool-call"`, `"tool_call"`, or `"tool"`, then add that total to `messages.length` to produce the combined stability evidence count used by the observer. [RESOLVED from Phase 09 plan direction + D-01/D-02]
   - Why this resolves the ambiguity: It gives the planner a concrete parsing rule that matches the existing session-message seam and is narrow enough to regression-test in `tests/lib/lifecycle-background-observer.test.ts`. [VERIFIED: `src/lib/session-api.ts` + plan revision]
   - Planning consequence: Plan 09-01 must explicitly add RED coverage for this parser rule before integrating it into `observeBackgroundCompletion()`. [RESOLVED]

2. **Should tmux be fully implemented in Phase 09 even though the roadmap still contains a stale deferred note?** [RESOLVED]
   - Resolution: Yes. `09-CONTEXT.md` is authoritative over the stale roadmap row, so Phase 09 implements the real tmux execution branch now, behind availability gating, with manual verification on a tmux-capable host as the environment prerequisite. [VERIFIED: `09-CONTEXT.md`, `.planning/ROADMAP.md`, environment audit]
   - Why this resolves the ambiguity: The locked decisions D-11 through D-13 require actual tmux execution parity, while the local host limitation only affects execution/validation strategy, not scope. [VERIFIED: `09-CONTEXT.md` + environment audit]
   - Planning consequence: Plan 09-05 must treat missing local tmux as a host prerequisite for live verification, not as a reason to defer implementation or silently downgrade the feature. [RESOLVED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, tests, runtime plugin execution | ✓ [VERIFIED: environment audit] | `v25.9.0` [VERIFIED: environment audit] | — |
| npm | Dependency install and script execution | ✓ [VERIFIED: environment audit] | `11.12.1` [VERIFIED: environment audit] | — |
| Python 3 | Auxiliary scripting only | ✓ [VERIFIED: environment audit] | `3.13.7` [VERIFIED: environment audit] | Not needed for core runtime changes [VERIFIED: codebase read] |
| tmux | D-11/D-12 visible-worker integration | ✗ [VERIFIED: environment audit] | — | Use current built-in execution family for local development; plan tmux install/setup or mock-based tests [VERIFIED: environment audit + codebase read] |

**Missing dependencies with no fallback:**
- None for the core non-tmux corrective work. [VERIFIED: environment audit + codebase read]

**Missing dependencies with fallback:**
- `tmux` is missing locally, so any real pane-spawn implementation needs either host setup or a gated/mock test strategy. [VERIFIED: environment audit]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (`repo installed 1.6.1`, latest registry `4.1.4`) [VERIFIED: npm ls + npm registry] |
| Config file | none; test execution is driven by `package.json` scripts [VERIFIED: `package.json`] |
| Quick run command | `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/completion-detector.test.ts tests/hooks/create-core-hooks.test.ts tests/tools/delegate-task.test.ts` [VERIFIED: test file reads + package scripts] |
| Full suite command | `npm test` [VERIFIED: `package.json`] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PH09-01 [ASSUMED] | `builtin-subsession` only completes after stability evidence, not first idle | unit/integration | `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/completion-detector.test.ts` | ✅ existing, but needs new assertions [VERIFIED: test reads] |
| PH09-02 [ASSUMED] | Pending notifications replay on session start/resume | unit | `npx vitest run tests/hooks/create-core-hooks.test.ts` | ✅ existing [VERIFIED: test reads] |
| PH09-03 [ASSUMED] | Sync dispatch returns structured envelope without `Unexpected EOF` | integration | `npx vitest run tests/integration/v3-e2e.test.ts tests/tools/delegate-task-overflow.test.ts` | ✅ existing, but envelope assertions need adding [VERIFIED: test reads + grep] |
| PH09-04 [ASSUMED] | `async_dispatch` rename preserves behavior and updates docs/tests | unit/integration | `npx vitest run tests/tools/delegate-task.test.ts tests/tools/delegate-task-overflow.test.ts tests/lib/background-manager-harden.test.ts` | ✅ existing [VERIFIED: test reads] |
| PH09-05 [ASSUMED] | Execution routing handles tmux/built-in paths honestly | unit | `npx vitest run tests/lib/execution-mode.test.ts tests/lib/background-manager-harden.test.ts` | ✅ existing [VERIFIED: test reads] |

### Sampling Rate
- **Per task commit:** quick command above. [VERIFIED: package/test reads]
- **Per wave merge:** `npm test`. [VERIFIED: `package.json`]
- **Phase gate:** `npm test && npm run typecheck && npm run build`. [VERIFIED: AGENTS.md + `package.json`]

### Wave 0 Gaps
- [ ] Add observer tests for “idle + unchanged messages/tool calls must remain pending until stability window passes.” [VERIFIED: current observer tests do not cover this locked behavior]
- [ ] Add sync-mode tests for structured encoded envelope decode path. [VERIFIED: current sync E2E returns raw string]
- [ ] Add execution test that proves `tmux-pane` is either executed by a real tmux runner or rejected/gated, not silently handled as subsession. [VERIFIED: `src/lib/lifecycle-manager.ts`, `src/lib/execution-mode.ts`]
- [ ] Add compatibility tests for `run_in_background` → `async_dispatch` rename scope across docs, tests, and tool description. [VERIFIED: grep + test reads]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [VERIFIED: codebase read] | Not in scope for this phase [VERIFIED: codebase read] |
| V3 Session Management | yes [VERIFIED: codebase read] | Continuity-backed lifecycle state plus explicit session SDK wrappers [VERIFIED: `src/lib/continuity.ts`, `src/lib/session-api.ts`] |
| V4 Access Control | yes [VERIFIED: codebase read] | Delegated agent permission rules and tool restriction profiles [VERIFIED: `src/tools/delegate-task.ts`] |
| V5 Input Validation | yes [VERIFIED: codebase read] | Zod/tool schema validation on delegate-task arguments [VERIFIED: `src/tools/delegate-task.ts`] |
| V6 Cryptography | limited [VERIFIED: codebase read] | If D-07 uses base64, treat it as encoding only; do not claim security properties from it [ASSUMED] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| False completion on slow-starting child session | Tampering / Repudiation | Require a second stable evidence signal before terminal transition [VERIFIED: root-cause doc + Phase 09 context] |
| Lost completion notification when parent is offline | Repudiation | Persist notifications in continuity and replay on parent resume/session-start [VERIFIED: `src/lib/pending-notifications.ts`, `src/hooks/create-core-hooks.ts`] |
| Delegated agent gets broader tools than intended | Elevation of Privilege | Keep permission-rule profiles centralized in `delegate-task.ts` and regression-test them after the rename/config changes [VERIFIED: `src/tools/delegate-task.ts`, tests] |
| Shell/process injection risk in tmux integration | Elevation of Privilege / Tampering | Reuse the existing execution classification and background-manager patterns; avoid free-form shell concatenation. [VERIFIED: AGENTS.md script rule + codebase read] |

## Sources

### Primary (HIGH confidence)
- `09-CONTEXT.md` — locked Phase 09 decisions and required integration targets. [VERIFIED: codebase read]
- `src/lib/lifecycle-background-observer.ts` — current completion observer behavior. [VERIFIED: codebase read]
- `src/lib/completion-detector.ts` — existing stability primitive. [VERIFIED: codebase read]
- `src/hooks/create-core-hooks.ts` — existing pending notification replay seam. [VERIFIED: codebase read]
- `src/lib/lifecycle-process-runner.ts` — current sync/async execution paths. [VERIFIED: codebase read]
- `src/lib/execution-mode.ts` and `src/lib/lifecycle-manager.ts` — execution classification vs actual runner behavior. [VERIFIED: codebase read]
- `package.json`, `npm ls`, `npm view` — project/runtime versions and script commands. [VERIFIED: npm registry + local install]

### Secondary (MEDIUM confidence)
- DeepWiki `code-yeongyu/oh-my-openagent` — current background completion behavior and polling cadence summary. [CITED: DeepWiki code-yeongyu/oh-my-openagent background task completion answer]
- `.planning/debug/delegation-root-cause-with-reference-2026-04-10.md` — canonical local root-cause synthesis for this repo. [VERIFIED: codebase read]

### Tertiary (LOW confidence)
- None. [VERIFIED: research record]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package manifest, installed versions, and registry versions were all checked directly. [VERIFIED: `package.json` + npm ls + npm registry]
- Architecture: MEDIUM — core local seams were read directly, but tmux completion semantics remain partially assumption-bound because the locked context and external reference do not fully agree. [VERIFIED: codebase read + ASSUMED item A2]
- Pitfalls: HIGH — each listed pitfall is tied to current code, tests, or the canonical root-cause document. [VERIFIED: codebase read + root-cause doc]

**Research date:** 2026-04-10 [VERIFIED: environment]
**Valid until:** 2026-05-10 for local code findings; re-check npm registry and external reference behavior sooner if planning slips or tmux support becomes in-scope on another host. [VERIFIED: registry timestamps + environment audit]
