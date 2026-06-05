[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Flaw Elaboration — Phase 59 Investigation Brief

**Date:** 2026-06-05
**Prepared for:** gsd-debugger deep investigation
**Scope:** 3 flaw domains with sub-flaws

---

## Domain A: tmux-copilot Permission Gate (REQ-58-08 / D-58-22)

### A1. ORCHESTRATOR_AGENTS Hardcoded Exclusion

**File:** `src/tools/tmux-copilot.ts:59-64`
**Code:**
```typescript
const ORCHESTRATOR_AGENTS = [
  { name: "hm-l0-orchestrator", tier: "orchestrator" },
  { name: "hm-orchestrator", tier: "orchestrator" },
  { name: "hf-l0-orchestrator", tier: "orchestrator" },
  { name: "hf-l1-coordinator", tier: "orchestrator" },
]
const USER_SESSION = "__user__"
```

**Bug:** Only 4 specific agent names are permitted. Any agent that dispatches a child session (e.g., `hm-executor`, `hm-planner`, `hm-debugger`, `gsd-debugger`, `hm-codebase-mapper`) is denied by the gate at line 255. Even the parent of the child session cannot peek at its own child's pane.

**Impact:** ALL child sessions created by non-orchestrator agents have unusable tmux copilot features. The human user must manually call copilot from TUI.

**Reproduction:**
1. Agent `hm-codebase-mapper` dispatches a child session → child pane %12 is spawned
2. The `hm-codebase-mapper` agent calls `tmux-copilot({ action: "peek", paneId: "%12" })`
3. Permission denied because `"hm-codebase-mapper" ∉ ORCHESTRATOR_AGENTS`
4. The parent cannot verify child progress

### A2. `peek` and `forward-prompt` Require paneId Not sessionId (UX Gap)

**File:** `src/tools/tmux-copilot.ts:174-178`
**Schema:**
```typescript
const PeekActionSchema = z.object({
  action: z.literal("peek"),
  paneId: z.string().min(1),    // ← requires paneId
  maxBytes: z.number().int().positive().optional(),
})
```

**Bug:** The tool requires `paneId` (e.g., `%12`), but the parent agent knows only `sessionId` (e.g., `ses_168b971e...`). The agent must cross-reference tmux persistence files or hierarchy API to find the paneId, which requires 3 extra tool calls.

### A3. No `list-panes` Permission for USER_SESSION

**File:** `src/tools/tmux-copilot.ts:114-118`
```typescript
const USER_SESSION_ALLOWED_ACTIONS = new Set<string>([
  "take-over",
  "release",
  "peek",
])
```

**Bug:** `list-panes` is NOT in USER_SESSION_ALLOWED_ACTIONS. A human user who wants to `take-over` a session must first know the paneId. Without `list-panes`, the user cannot discover which panes exist or which paneId maps to which session.

---

## Domain B: Child Session Backchannel (WaiterModel Gap)

### B1. No Interim Output Access

**Files:** `src/coordination/delegation/coordinator.ts:192-290`, `src/tools/delegation/delegation-status.ts`

**Bug:** The WaiterModel dispatches a child session and waits for terminal status. There is NO mechanism to read the child's interim output/tool calls before completion. The `peek` action in tmux-copilot reads tmux pane content (terminal text), not the child's structured output (tool calls, decisions, reasoning).

**Impact:** A parent agent cannot:
- Know if child is making progress
- Read child's current state/branch/decision
- Decide to abort based on interim output
- Learn from child's partial findings

### B2. No `send-prompt-to-child` Mechanism

**Files:** `src/tools/tmux-copilot.ts:153-158`
```typescript
const ForwardPromptActionSchema = z.object({
  action: z.literal("forward-prompt"),
  paneId: z.string().min(1),   // ← tmux pane, not child session
  text: z.string(),
  literal: z.boolean().optional(),
})
```

**Bug:** `forward-prompt` sends text to a tmux pane (terminal keystrokes), NOT to a child session as a structured prompt. There is:
- No `session.prompt` call from parent to a running child
- No way to inject new instructions into a running child session
- No way to change the child's direction mid-execution

The only available actions are: wait for timeout, abort, or restart.

### B3. No Child Progress Discovery

**Files:** `src/tools/delegation/delegation-status.ts`

The `progress` action and `status` action return:
- `actionCount`, `toolCallCount`, `messageCount` — counts only, not content
- `childMessageCount` — opaque number
- `progressPct` — estimated percentage

No action returns: "what did the child just decide?", "what tool did the child just call?", "what is the child's current reasoning path?"

### B4. delegation-status Timeout Too Short

**File:** Plugin defaults

Default delegation timeout is 60s. Research tasks (reading 10+ files, writing output) cannot complete in 60s. The delegation times out with 0 tool calls because the agent was still loading/processing the prompt.

[LANGUAGE: Write this file in en per Language Governance.]
---

## Domain C: Agent Repetition — Observed Loop (Emission from Child → Parent)

### Observed Behavior (reproduced 2026-06-05 during Phase 58.9 UAT)

**Reproduction:**
1. Parent orchestrator session dispatches child session via `delegate-task` or `task` tool
2. Child session completes/fails after ~60s timeout
3. `handleCompletion`/`handleTimeout` fires in `coordinator.ts:390-414`
4. `routeTerminal(delegationId, type, message)` called at `coordinator.ts:633-634`
5. `notificationRouter.route({ delegationId, idempotencyKey, message, timestamp, type })` called
6. Inside notification router, `notifyDelegationTerminal` fires at `notification-handler.ts:328-363`
7. `sendPromptAsync(parentSessionId, { noReply: true, parts: [{ type: "text", text: notification }] })` called at line 353
8. The `notification` string contains `<system_reminder>` tags (built at `notification-handler.ts:59-126`)
9. This injects a `<system_reminder>Delegated task completed:</system_reminder>` into the parent session's context
10. On the parent's next response turn, the agent sees this `<system_reminder>` in context
11. Agent generates a response acknowledging the completed delegation
12. The platform processes this response as a new turn
13. If context hasn't changed between turns (same delegation list, same statuses), agent generates same/similar response
14. This repeats — parent keeps responding to the same delegation completion notification
15. Observed: 7 consecutive identical closing messages within 2 minutes (captured below)

**Observed loop output (verbatim):**
```
▣  Build · MiMo-V2.5-Pro · 1m 13s + Thought: 5.1s
`Phase 58.9 UAT done. 3 commits, 8 files...`

▣  Build · MiMo-V2.5-Pro · 1m 57s + Thought: 611ms
`Cảm ơn bạn! Phase 58.9 UAT hoàn thành. 3 commits...`

▣  Build · MiMo-V2.5-Pro · 2m 2s + Thought: 692ms
`Phase 58.9 hoàn thành. 3 commits...`

... repeated 5 more times at 4-10s intervals
```

### C1. Emission Path: notifyDelegationTerminal → sendPromptAsync → Parent Context

**Files:** `notification-handler.ts:328-363`, `notification-handler.ts:59-126`

**Observed code path:**
```
delegation completes
  → coordinator.ts:390 handleCompletion/delegationId, result)
  → coordinator.ts:401 this.routeTerminal(delegationId, notificationTypeFor(status), result)
  → coordinator.ts:633 notificationRouter.route({delegationId, idempotencyKey, message, timestamp, type})
  → notification-router.ts:route() → notifyDelegationTerminal(client, delegation)
  → notification-handler.ts:353 sendPromptAsync(client, parentSessionId, {noReply: true, text: "<system_reminder>\nDelegated task completed:\n..."})
  → parent session receives <system_reminder> with completion notification
  → parent session context now has notification + previous tool outputs
  → parent generates response (acknowledging completion)
  → platform processes response as new turn
  → parent sees same context + same notification → generates same response
  → repeat
```

**Observed:** `sendPromptAsync` at `notification-handler.ts:353` has `noReply: true`, which is documented as "no AI auto-response." However, the `<system_reminder>` tag IS visible to the agent on the next response turn. The agent does not generate a response TO the notification, but on the NEXT parent-initiated turn, the agent sees the `<system_reminder>` in its context and incorporates it into its response.

### C2. Emission Path: reactivateSessionStream → sendPromptAsync (empty) → Parent Reactivation

**Files:** `notification-handler.ts:187-206`

**Observed:**
```
reactivateSessionStream(client, sessionID)
  → sendPromptAsync(client, sessionID, {noReply: true, parts: [{type: "text", text: ""}]})
  → If parent stream was stopped, this empty prompt reawakens it
  → Parent session becomes responsive again
  → Parent now has context with the reawakening empty prompt + any queued notifications
```

**Observed:** `notifyDelegationTerminal` at line 352 comment says: "A single sendPromptAsync call reactivates the stream (if stopped) AND delivers the completion notification — no need for separate empty prompt." So the notification itself ALSO reactivates the stream.

### C3. PeriodicNotifier: Post-Completion Emissions

**Reproduction:** Check if `periodicNotifier.register()` at `coordinator.ts:298-305` continues emitting after delegation completes/transitions.

**Files:** `coordinator.ts:298-305`, `coordinator.ts:397`

**Observed:**
- `periodicNotifier.register()` at coordinator.ts:298 — registered after childSessionStarter.start()
- `periodicNotifier.deregister()` at coordinator.ts:397 — called inside cleanup()
- cleanup() at coordinator.ts:568 — called AFTER routeTerminal at coordinator.ts:633
- Sequence: handleCompletion → routeTerminal (sends notification) → cleanup (deregisters notifier)
- If routeTerminal (sendPromptAsync) triggers a reactivation BEFORE cleanup deregisters the notifier, there is a window where the parent stream is reawakened and the notifier is still registered

### C4. No Stream Termination on Parent Response

**Observed:** After the child completes and the parent receives the notification:
- Parent generates a response (acknowledging completion)
- Platform processes the response as a new turn
- No mechanism detects: "this is the Nth consecutive message about the same completed child"
- No mechanism terminates the parent's response loop
- Parent continues generating messages as long as the context supports new turns

### C5. Tool Output Stability Between Turns

**Observed:** If the parent calls tools that return delegation status:
- `delegation-status list` returns the same delegation list on consecutive calls
- `session-hierarchy get-manifest` returns the same hierarchy
- Tool outputs are identical turn-to-turn
- Context has NO new information between turns
- Agent generates same/similar response from same context
- This reinforces the loop

[LANGUAGE: Write this file in en per Language Governance.]
---

## Domain D: universal-rules.md TDD Governance Truncation

### D1. Source Template Missing Sections 7-10

**Reproduction:**
1. `git show HEAD:.opencode/rules/universal-rules.md` → 190 lines (committed version)
2. `cat assets/rules/universal-rules.md` → 102 lines (source template)
3. `cat .opencode/rules/universal-rules.md` → 102 lines (deployed version)
4. `npm run build` runs `scripts/sync-assets.js` which reflects `assets/rules/` to `.opencode/rules/`
5. Deployed file was overwritten with truncated template during build

**Observed:** Sections 7-10 deleted (88 lines lost):
- Section 7: Test-Driven Development Discipline (RED→GREEN→Coverage→REFACTOR cycle, one-test-at-a-time, public-interface discipline)
- Section 8: Anti-Patterns and Retry Budget (5 anti-patterns with detection and correction)
- Section 9: Relationship to Other Governance
- Section 10: Entry Point for New Contributors

**Files:** `assets/rules/universal-rules.md` (102 lines), `.opencode/rules/universal-rules.md` (102 lines), committed version at HEAD (190 lines)

---

## Summary Table

| ID | Domain | Type | Reproduction | File |
|----|--------|------|-------------|------|
| A1 | Permission | Observed | Non-orchestrator agents blocked from copilot | `tmux-copilot.ts:59-64` |
| A2 | UX | Observed | peek/take-over requires paneId, parent has sessionId | `tmux-copilot.ts:174-178` |
| A3 | UX | Observed | USER_SESSION cannot list-panes, cannot discover paneIds | `tmux-copilot.ts:114-118` |
| B1 | Backchannel | Observed | delegation-status returns counts only, not content | `coordinator.ts:192-290` |
| B2 | Backchannel | Observed | forward-prompt sends keystrokes to pane, not to child session | `tmux-copilot.ts:153-158` |
| B3 | Backchannel | Observed | No session.prompt from parent to running child | Plugin SDK surface |
| B4 | Timeout | Observed | 60s delegation timeout — research tasks timeout with 0 tool calls | Plugin defaults |
| C1 | Loop | Observed | notifyDelegationTerminal → sendPromptAsync → parent context injection | `notification-handler.ts:328-363` |
| C2 | Loop | Observed | notification <system_reminder> visible on parent's next response turn | `notification-handler.ts:59-126` |
| C3 | Loop | Observed | PeriodicNotifier registered before routeTerminal, deregistered after; window exists | `coordinator.ts:298-305,397,568` |
| C4 | Loop | Observed | No stream termination after Nth identical response | Agent core |
| C5 | Loop | Observed | Tool output (delegation-status, hierarchy) identical turn-to-turn | Multiple tools |
| D1 | Governance | Observed | assets/rules/universal-rules.md 102 lines vs HEAD 190 lines | `assets/rules/` sync
