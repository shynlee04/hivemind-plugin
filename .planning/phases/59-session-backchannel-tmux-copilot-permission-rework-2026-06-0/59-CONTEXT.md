# Phase 59: Session Backchannel & tmux-copilot Permission Rework - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — user scoped to A,B,C via `--scope A,B,C`

<domain>
## Phase Boundary

Fix 3 flaw domains (A, B, C — Domain D excluded by user scope) identified during Phase 58.9 UAT. Source: `.hivemind/planning/tools-audit-58-9-2026-06-05/03-flaw-elaboration.md`.

This phase delivers 12 bug fixes across:
- **Domain A (A1-A3):** tmux-copilot permission gate — widen from hardcoded agent names to config-based levels; add sessionId→paneId resolution; add list-panes to USER_SESSION
- **Domain B (B1-B4):** Child session backchannel — expose interim child output; implement session-inject from parent to running child; surface child progress beyond counts; raise delegation timeout
- **Domain C (C1-C5):** Agent looping prevention — fix notification re-triggering; fix PeriodicNotifier deregistration timing; add response-dedup guard; add entropy to tool outputs

</domain>

<decisions>
## Implementation Decisions

### Domain A — tmux-copilot Permission Gate

- **A1:** Replace hardcoded `ORCHESTRATOR_AGENTS` list with config-based permission levels. Add `permissionLevel` field: `orchestrator` (full access), `observer` (peek + forward-prompt), `user` (list-panes + take-over + release + peek). Gate on level, not agent name.
- **A2:** Add `peek-by-session` action variant accepting `sessionId` instead of `paneId`. Maintain in-session paneId registry in session-tracker (paneId recorded when child session is spawned via tmux). Add resolution utility or field on session-record.
- **A3:** Add `"list-panes"` to `USER_SESSION_ALLOWED_ACTIONS` set. Any tmux-copilot actions a human user might need that require paneId discovery should include `list-panes` permission.

### Domain B — Child Session Backchannel

- **B1:** Add `interim` field to `delegation-status` response. Return last N tool call summaries from the child's session journal (tool name, status, timestamp). Use session-journal-export as the data source.
- **B2:** Add a new tool `session-inject` (or `session.prompt` wrapper) that parent agents can call with `{sessionId, prompt}` to inject instructions into a running child session via `sendPromptAsync`.
- **B3:** Add `progress` action to `delegation-status` returning structured child progress: current tool name, last decision summary, branch path, number of messages processed. Source from child's trajectory or session tracker.
- **B4:** Raise default delegation timeout from 60s to 300s (5 minutes). Make timeout configurable as a per-delegation option (delegate-task/task tool parameter).

### Domain C — Agent Looping from Child Emissions

- **C1-C2:** Ensure `sendPromptAsync` with `noReply: true` does not inject `<system_reminder>` tags visible to the parent agent on its next turn. Add idempotency guard: skip duplicate completion notification for the same delegation. Verify notification doesn't reawaken parent stream incorrectly.
- **C3:** Move `PeriodicNotifier.deregister()` call to execute BEFORE `routeTerminal()` in `handleCompletion`/`handleTimeout` flow. Eliminate the race window where notification is sent while notifier is still registered.
- **C4:** Add response-dedup guard. Track hash of last N response contents. If 3 consecutive identical responses detected, terminate the loop (flag to coordinator, do not generate more responses).
- **C5:** Add `modifiedAt` or sequence counter to delegation-status and session-hierarchy tool outputs. Ensure same tool call with same state returns different-enough output (timestamp changes) to avoid the "identical tool output" loop trap.

### the agent's Discretion

- Exact implementation details for side-effect-free notification (C1-C2 approach), the response-dedup mechanism (C4), and tool output entropy (C5) are at the implementer's discretion — provided the end behavior matches the described fixes.

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `src/tools/tmux-copilot.ts` — tmux permission gate, action schemas, USER_SESSION_ALLOWED_ACTIONS
- `src/coordination/delegation/coordinator.ts` — handleCompletion, handleTimeout, cleanup, PeriodicNotifier, routeTerminal
- `src/coordination/delegation/notification-handler.ts` — notifyDelegationTerminal, sendPromptAsync, reactivateSessionStream
- `src/tools/delegation/delegation-status.ts` — status tool with actionCount/toolCallCount
- `src/coordination/delegation/notification-router.ts` — route() → notifyDelegationTerminal
- `src/shared/task-status.ts` — task status types
- `src/plugin.ts` — plugin defaults (delegation timeout, agent configs)

### Established Patterns
- Session tracking via session-tracker (state JSON files in `.hivemind/state/`)
- Journal events via session-journal-export (append-only event timeline)
- CQRS boundaries: tools expose read/write surfaces through tool factory
- Permission gates use agent config comparison (current pattern: name-matching)

</code_context>

<specifics>
## Specific Ideas

- Domain D excluded by user scope (`--scope A,B,C`). D1 (universal-rules.md TDD governance truncation) is NOT in scope.
- The existing plan at `.hivemind/planning/59-session-backchannel-tmux-permission-rework/PLAN.md` references all 4 domains — the planner should filter to A,B,C only.
- For the permission level approach (A1): consider a simple role enum in the tool config rather than a full RBAC system.

</specifics>

<deferred>
## Deferred Ideas

- Domain D (universal-rules.md sync truncation) — will need separate phase or manual fix
- Domain D investigate: why `npm run build` sync truncates `assets/rules/universal-rules.md` to 102 lines
- Full RBAC for tmux-copilot — not needed for MVP, permission levels enough

</deferred>
