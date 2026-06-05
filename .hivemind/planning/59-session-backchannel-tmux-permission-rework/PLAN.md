[LANGUAGE: Write this file in en per Language Governance.]
# Phase 59 — Session Backchannel & tmux-copilot Permission Rework

**Phase number:** 59  
**Phase name:** Session Backchannel & tmux-copilot Permission Rework  
**Date:** 2026-06-05  
**Dependencies:** Phase 58.9 (sticky bug busting)  
**Source:** `.hivemind/planning/tools-audit-58-9-2026-06-05/03-flaw-elaboration.md`

---

## Scope

Fix **4 flaw domains** (14 sub-flaws) identified during Phase 58.9 UAT. These span tmux-copilot permission gating, child session backchannel communication, agent looping from child completion emissions, and universal-rules.md TDD governance truncation.

---

## Domain Breakdown

### Domain A — tmux-copilot Permission Gate (3 sub-flaws)

**Files affected:** `src/tools/tmux-copilot.ts`

| ID | Sub-flaw | Description |
|----|----------|-------------|
| A1 | ORCHESTRATOR_AGENTS hardcoded | `tmux-copilot.ts:59-64` — only 4 agents allowed. Any other agent (executor, planner, debugger, codebase-mapper) denied `peek`/`forward-prompt`. Parent cannot monitor own child's pane. |
| A2 | paneId required, not sessionId | `tmux-copilot.ts:174-178` — `peek`/`take-over` require `paneId` (e.g., `%12`), but parent agent knows only `sessionId`. Requires 3 extra tool calls to resolve. |
| A3 | list-panes forbidden for USER_SESSION | `tmux-copilot.ts:114-118` — `list-panes` not in `USER_SESSION_ALLOWED_ACTIONS`. Human user cannot discover paneIds needed for `take-over`. |

**Fix direction:**
- A1: Replace hardcoded 4-agent whitelist with agent-tier-based permission (all parent agents can peek at own child panes)
- A2: Add `sessionId`-based overload to `peek`/`forward-prompt` actions, with session-tracker lookup to resolve `sessionId` → `paneId`
- A3: Add `list-panes` to `USER_SESSION_ALLOWED_ACTIONS`

---

### Domain B — Child Session Backchannel (4 sub-flaws)

**Files affected:** `src/coordination/delegation/coordinator.ts`, `src/tools/delegation/delegation-status.ts`, `src/tools/tmux-copilot.ts`, plugin defaults

| ID | Sub-flaw | Description |
|----|----------|-------------|
| B1 | No interim output | `delegation-status` returns counts only (`actionCount`, `toolCallCount`, `messageCount`). No mechanism to read child's interim tool calls, decisions, or reasoning before completion. |
| B2 | forward-prompt is tmux keystrokes, not structured prompt | `forward-prompt` sends text to a tmux pane (terminal keystrokes), NOT a structured prompt to a child session. No `session.prompt` call from parent to a running child. |
| B3 | No child progress discovery | No action returns "what did the child just decide?", "what tool did the child just call?", "what is the child's current reasoning path?" |
| B4 | 60s delegation timeout too short | Default 60s — research tasks (reading 10+ files, writing output) timeout with 0 tool calls. |

**Fix direction:**
- B1: Add `get-child-messages` or `peek-child-session` action to delegation-status tool returning structured child output (messages, tool calls)
- B2: Add `send-prompt-to-child` action that calls `client.session.prompt()` on a running child session (not tmux pane keystrokes)
- B3: Enhance delegation-status with child progress summary (current step, last tool call, reasoning excerpt)
- B4: Increase default delegation timeout (e.g., 300s) or make configurable via plugin config

---

### Domain C — Agent Looping from Child Emissions (5 sub-flaws)

**Files affected:** `src/features/notification/notification-handler.ts`, `src/coordination/delegation/coordinator.ts`

| ID | Sub-flaw | Description |
|----|----------|-------------|
| C1 | notifyDelegationTerminal → sendPromptAsync → parent injection | `notification-handler.ts:328-363` — completion notification injects `<system_reminder>` into parent context via `sendPromptAsync` |
| C2 | `<system_reminder>` visible on parent's next response turn | Parent sees the completion notification in context, acknowledges it, generating a new turn — creates loop |
| C3 | PeriodicNotifier deregistration window | `deregister()` at `coordinator.ts:397` called AFTER `routeTerminal` at `coordinator.ts:633` — stream reawakened before notifier removed |
| C4 | No stream termination after N identical responses | Observed 7 consecutive identical closing messages within 2 minutes. No mechanism detects "Nth consecutive message about same completed child" |
| C5 | Tool output identical turn-to-turn | `delegation-status list` and `session-hierarchy get-manifest` return identical results on consecutive calls — no new information to break loop |

**Fix direction:**
- C1: Gate notification injection — only inject if parent hasn't already received this completion notification
- C2: Add deduplication — track completion notification hash, skip re-injection if already delivered
- C3: Move `deregister()` BEFORE `routeTerminal()` in the completion/cleanup sequence
- C4: Add stream termination after 3+ identical responses (detect by response hash dedup)
- C5: Add cache-busting or last-updated timestamp to delegation-status / hierarchy-manifest to differentiate identical-content responses

---

### Domain D — universal-rules.md TDD Governance Truncation (1 sub-flaw)

**Files affected:** `assets/rules/universal-rules.md`, `.opencode/rules/universal-rules.md`, `scripts/sync-assets.js`

| ID | Sub-flaw | Description |
|----|----------|-------------|
| D1 | Source template truncated | `assets/rules/universal-rules.md` is 102 lines vs HEAD committed version at 190 lines. Sections 7-10 deleted during `npm run build` sync: TDD discipline (RED→GREEN→Coverage→REFACTOR), anti-patterns and retry budget, governance relationships, contributor entry. |

**Fix direction:**
- D1: Restore missing sections 7-10 from git HEAD (`.opencode/rules/universal-rules.md` committed version), then update `assets/rules/universal-rules.md` to match, then sync to `.opencode/rules/`

---

## Cross-Cutting Considerations

1. **Symptom Coverage Matrix:** SB-4 (USER_SESSION widening trust boundary) and SB-8 (AC#10/AC#11 comment drift) are defers-to-P59 from Phase 58.9 — incorporate into Domain A scope.
2. **Dependency ordering:** Domain C (looping) may depend on Domain B (backchannel) fixes if the loop trigger is a completion notification that could be replaced by a polling-based backchannel.
3. **Backward compatibility:** All fixes must preserve the 27-tool-key invariant. No new tools without schema-first registration.
4. **Testing:** Each domain must have regression tests. BATS for tmux-copilot (Domain A), vitest integration for backchannel (Domain B), and loop-detection tests (Domain C).

---

## Task Breakdown by Domain

### Domain A — tmux-copilot Permission Gate
- [ ] Task A-01: Analyze current permission model — trace all gate checks in `tmux-copilot.ts`
- [ ] Task A-02: Replace hardcoded 4-agent whitelist with agent-tier-based or delegation-parent-based permission
- [ ] Task A-03: Add `sessionId` overload to `peek`/`forward-prompt` — resolve `sessionId → paneId` via session-tracker
- [ ] Task A-04: Add `list-panes` to `USER_SESSION_ALLOWED_ACTIONS`
- [ ] Task A-05: Write regression tests (BATS for tmux-copilot, vitest for permission logic)

### Domain B — Child Session Backchannel
- [ ] Task B-01: Audit current delegation-status tool — identify all interim content sources (child messages, tool calls)
- [ ] Task B-02: Add `get-child-messages` or `peek-child-session` action to delegation-status tool
- [ ] Task B-03: Add `send-prompt-to-child` action using `client.session.prompt()` on running child
- [ ] Task B-04: Enhance delegation-status with child progress summary fields
- [ ] Task B-05: Increase default delegation timeout or make configurable
- [ ] Task B-06: Write regression tests (vitest integration)

### Domain C — Agent Looping from Child Emissions
- [ ] Task C-01: Trace the full emission path — coordinator → notification-router → notification-handler → sendPromptAsync
- [ ] Task C-02: Add completion notification deduplication (hash-based, skip re-injection if already delivered)
- [ ] Task C-03: Reorder cleanup — call `deregister()` BEFORE `routeTerminal()` in completion/cleanup sequence
- [ ] Task C-04: Add stream termination after N identical responses (response hash dedup, N=3 threshold)
- [ ] Task C-05: Add cache-busting last-updated timestamp to delegation-status / hierarchy-manifest
- [ ] Task C-06: Write regression tests (loop detection, dedup, stream termination)

### Domain D — universal-rules.md Truncation
- [ ] Task D-01: Recover missing sections 7-10 from git HEAD (committed `.opencode/rules/universal-rules.md`)
- [ ] Task D-02: Restore `assets/rules/universal-rules.md` to match HEAD (190 lines)
- [ ] Task D-03: Run `npm run build` and verify `.opencode/rules/universal-rules.md` matches restored version
- [ ] Task D-04: Add integrity check or write guard to prevent future truncation on sync

---

## Files to Modify

| File | Domain | Change |
|------|--------|--------|
| `src/tools/tmux-copilot.ts` | A | Permission model rewrite, sessionId overload, USER_SESSION list-panes |
| `src/tools/delegation/delegation-status.ts` | B | Add get-child-messages/send-prompt-to-child actions, progress fields |
| `src/coordination/delegation/coordinator.ts` | B, C | Timeout config, cleanup ordering, notifier deregistration timing |
| `src/features/notification/notification-handler.ts` | C | Deduplication, response hash tracking |
| `src/features/notification/notification-router.ts` | C | Route gating for duplicate notifications |
| `assets/rules/universal-rules.md` | D | Restore sections 7-10 |
| `.opencode/rules/universal-rules.md` | D | Regenerated via sync after asset fix |
| `scripts/sync-assets.js` | D | Add write-guard or integrity check for critical files |

---

## Verification Plan

1. **Domain A:** BATS scenario verifying non-orchestrator parent can `peek` child pane via sessionId; USER_SESSION can `list-panes`
2. **Domain B:** vitest integration test — dispatch child, read interim messages via `get-child-messages`, send prompt via `send-prompt-to-child`
3. **Domain C:** vitest test — simulate completion notification → verify dedup blocks re-injection; verify deregister() fires before routeTerminal(); verify stream termination after N identical responses
4. **Domain D:** Run `diff` between `assets/rules/universal-rules.md` and HEAD committed version — must match; run `npm run build` → verify `.opencode/rules/universal-rules.md` matches
5. **Regression:** `npm run typecheck` clean, `npm test` passes, 27-tool-key invariant preserved
