# Phase 58 UAT Symptom Diagnosis Report

**Date:** 2026-06-04
**Phase:** 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
**Status:** SHIPPED 2026-06-04 on `feature/harness-implementation`
**Verdict:** All 4 symptoms reproduce. 4/4 are OUT-OF-SCOPE for P58 per `58-SPEC.md:13`. P58 correctly shipped against its 6 stated requirements; the symptoms are the gap between P58's surface contract and the user's real-world need. Follow-ups: P58.1, P58.2, P58.3.

---

## 1. Symptom→Spec→Phase Mapping

| # | Symptom (corrected) | 58-SPEC ref | P58 in-scope? | BATS coverage | Evidence |
|---|---------------------|-------------|----------------|---------------|----------|
| S1 | tmux-spawned child panel cuts off after first prompt. Native `task` works correctly. | NOT mentioned | NO | None | `58-SPEC.md:13` |
| S2 | No user→child affordance (no inject/intervene/forward). No key-send (pause/abort/resume) from user TUI. | D-58-09..12 cover `forward-prompt` (G4) and `take-over`/`release` (G5) for ORCHESTRATOR actors | PARTIAL (orchestrator actor only) | `64-forward-prompt.bats`, `65-takeover-release.bats` | `src/tools/tmux-copilot.ts:51-56, 187-193` |
| S3 | Orchestrator main stream ends early when no more work; does NOT block. WaiterModel expects main stream to STAY OPEN while delegations in flight. `delegate-task` should be non-blocking + open stream; native `task` is blocking + queues. | NOT mentioned | NO | None | `src/coordination/delegation/manager-runtime.ts:202, 204, 244` |
| S4 | Orchestrator has no live JIT context. Cannot answer "progress?" mid-flight. Reports not filed because session not complete, AND orchestrator doesn't know what sub-agent is doing. | NOT mentioned | NO | None | `dist/plugin.js:805-837` (init-only replay), `dist/plugin.js:718-735` (forensic capture only) |

P58's 6 stated requirements (G1 grep guard, G2 pool status API, G3 abort+resume pane survival, G4 forward-prompt sentinel, G5 take-over/release, G6 intervention test seam) address 0 of 4 user-visible symptoms directly. G4 and G5 are gated to ORCHESTRATOR actors only (`src/tools/tmux-copilot.ts:51-56`), not the user. The user is the actor; the harness is not.

---

## 2. Root Cause Per Symptom

### S1: tmux panel cut-off after first prompt

**Root cause:** OpenCode's tmux panel is the SDK's native child session panel — not a harness-owned surface. When `delegate-task` spawns a child, harness does NOT subscribe the parent to the child's session event stream. Child messages are captured forensically via `chat.message` hook (`dist/plugin.js:718-735`) into session-tracker, but live panel streaming requires SDK `client.session.subscribe()` which is never called for the child after dispatch.

The native `task` tool's panel update works because OpenCode's `task` handler internally subscribes the parent. `delegate-task` takes a different code path (`src/coordination/delegation/manager-runtime.ts:202-244`: `await semaphore.acquire` → `await spawnDelegatedSession` → `await sendPromptAsync`) that bypasses this subscription.

**In-scope verdict:** OUT-OF-SCOPE for P58. Panel is OpenCode SDK surface, not harness surface.

### S2: No user→child affordance

**Root cause:** `src/tools/tmux-copilot.ts:51-56` defines `ORCHESTRATOR_AGENTS = ['hm-l0-orchestrator', 'hm-orchestrator', 'hf-l0-orchestrator', 'hf-l1-coordinator']` whitelist. `src/tools/tmux-copilot.ts:187-193` runtime permission gate returns `permission-denied` for non-orchestrators.

`src/tools/delegation/delegation-status.ts:25` actions enum is `status|list|control|find-stackable|pool|get` — no `peek` (live stream), no `inject` (user push), no `progress` (mid-flight summary). The `status` action returns `progressPct` (line 123) but it is CALCULATED from record counters (`actionCount`, `messageCount`, `toolCallCount`), not from a real-time SDK stream.

The user IS the orchestrator of the top-level session, but `tmux-copilot` gates on agent NAME, not session role.

**In-scope verdict:** PARTIALLY in-scope. P58 added `forward-prompt` (G4) and `take-over`/`release` (G5) for orchestrator-actor use. User-actor case was not part of the spec.

### S3: Orchestrator main stream ends early

**Root cause:** `src/coordination/delegation/manager-runtime.ts:202, 204, 244` `dispatch()` chain is fully synchronous (`await semaphore.acquire` → `await spawnDelegatedSession` → `await sendPromptAsync`). The function does not return until sendPrompt completes, which ties the dispatch to the orchestrator's main loop turn.

The WaiterModel (per `src/tools/delegation/delegate-task.ts:32` "always-background WaiterModel") is supposed to dispatch and return immediately, with the parent stream remaining open and sub-agent progress delivered as it arrives. But the implementation `await`s sendPrompt, which:
1. Forces the parent to "wait" via the await chain even though dispatch conceptually should be fire-and-forget
2. Combined with the SDK emitting only `session.created` (`src/features/tmux/session-manager.ts:6-9`, not session.completed or status updates), the orchestrator's main loop has no signal to stay open
3. `src/coordination/delegation/coordinator.ts:163` then `await getSessionMessages` to pull on completion — the runtime treats completion detection as a pull, not a push

**In-scope verdict:** OUT-OF-SCOPE for P58. However, the implementation pattern is at odds with the WaiterModel contract advertised in `src/tools/delegation/delegate-task.ts:32` — the comment contradicts the code at line 78-87.

### S4: No live JIT context

**Root cause:** JIT context is RECORDED but NOT EXPOSED live. Three layers:

1. **Forensic capture (works):** `dist/plugin.js:718-735` `chat.message` hook records child messages; `dist/plugin.js:767-785` `tool.execute.after` records tool signals; flows into session-tracker and journal at `.hivemind/journal/<sid>/` (P53 pane-monitor, `dist/plugin.js:655-658`).

2. **Live push (does NOT work):** `dist/plugin.js:805-837` `replayPendingDelegationNotifications` runs at INIT only. The NotificationRouter wires `monitor.inject` / `injectUrgent` / `periodicNotifier` callbacks (`dist/plugin.js:295, 308-323, 324-328, 331-340`) that call `sdkSendPromptAsync` to append to parent TUI — but these fire ONLY when the monitor detects progress in periodicNotifier or on explicit inject. There is no SDK event subscription for the child that auto-fires on each child message.

3. **User query path (does NOT work):** `src/tools/delegation/delegation-status.ts:25` has no `peek` or `progress` action. `status` returns snapshot at query time, with `progressPct` calculated from counters (line 120, 123), not from a real-time stream.

**In-scope verdict:** OUT-OF-SCOPE for P58. JIT context was not in the 6 REQs.

---

## 3. What The WaiterModel Actually Does

**Intended behavior (advertised in `src/tools/delegation/delegate-task.ts:32`):**
1. Orchestrator calls `delegate-task`
2. Tool validates request, immediately returns a delegation ID
3. Dispatch happens in background (fire-and-forget)
4. Child agent runs autonomously
5. Notifications are pushed to parent TUI as the child progresses
6. Completion is signaled via dual-signal (doer+verifier agreement)
7. Orchestrator's main stream remains open; can ask for progress, can inject, can abort

**De-facto implementation:**
1. Orchestrator calls `delegate-task` (`src/tools/delegation/delegate-task.ts:23-87`)
2. Tool calls `coordinator.dispatch(params)` (line 78-87)
3. `coordinator.dispatch` → `src/coordination/delegation/manager-runtime.ts:202-244` chain:
   - `await semaphore.acquire` (line 202) — BLOCKS
   - `await spawnDelegatedSession` (line 204) — BLOCKS
   - `await sendPromptAsync` (line 244) — BLOCKS
4. The await chain returns AFTER sendPrompt, which is AFTER the SDK has fired `session.created`
5. The orchestrator's main turn completes; the agent's main stream ends
6. There is NO subscription to child events after sendPrompt
7. Child runs in background, but the parent's main loop has closed its turn
8. The only way to see child progress is forensic replay at next init (`dist/plugin.js:805-837`)

**Implementation gap:** `src/coordination/delegation/manager-runtime.ts:244` `await sendPromptAsync` should be `void sendPromptAsync` (fire-and-forget), and the dispatch should set up an event subscription to forward child messages to the parent TUI in real time. Both fixes are required: fire-and-forget alone leaves the parent in the dark, and subscribe alone does not let the orchestrator continue without waiting for the child to finish.

---

## 4. Symptom 1 Deep Dive (the most consequential)

### What the user sees
1. Orchestrator calls `delegate-task` with task description
2. A new tmux pane appears (the child session)
3. The first prompt is delivered to the child (the parent sees the request going out)
4. The child processes the task
5. **The child does its work, but the parent's tmux panel for that child shows nothing after the first prompt.** Only the first user-facing message is visible.
6. Native `task` tool's panel does NOT have this issue.

### Code path comparison

**Native `task` tool path (works):**
- OpenCode's built-in `task` tool handler subscribes the parent session to the child's event stream
- Each child message is forwarded to the parent panel
- Completion is signaled via SDK's own mechanism

**`delegate-task` path (broken):**
- `src/tools/delegation/delegate-task.ts:23-87` builds a dispatch request
- Calls `coordinator.dispatch(params)`
- `src/coordination/delegation/coordinator.ts:9` imports `getSessionMessages` from `shared/session-api`; line 163 pulls parent messages for completion detection; line 287 pulls child messages for result
- Routes to `src/coordination/delegation/manager-runtime.ts:202-244`
- `await semaphore.acquire` (line 202) — block
- `await spawnDelegatedSession` (line 204) — block
- `await sendPromptAsync` (line 244) — block
- **No `client.session.subscribe()` call after sendPrompt**
- No event listener registered
- The child runs in SDK's session space, but the parent has no subscription
- The `chat.message` hook (`dist/plugin.js:718-735`) fires when the SDK notifies the harness, but the hook only writes to session-tracker forensic storage; it does NOT push to the parent panel

### The fix is two-part
1. **Subscribe:** After sendPrompt, register `client.session.subscribe(parentSessionId, ...)` or `client.session.messages(childSessionId, onMessage)`. This is what the native `task` tool does internally.
2. **Forward:** On each child message event, call `sdkSendPromptAsync(parentClient, parentSessionId, { parts: [...], noReply: true })` to append a non-reply part to the parent's TUI.

The infrastructure for (2) already exists at `dist/plugin.js:295` (`sdkSendPromptAsync` with `noReply: true` is the pattern used by `monitor.inject` callbacks).

### Why this is OUT-OF-SCOPE for P58
- P58's scope is "tmux-orchestration programmatic pool interactive delegate cl" — programmatic (not user-facing) interactive delegate (orchestrator-facing) commands
- P58 added 6 REQs (G1–G6) covering: pool types, status API, abort/resume, forward-prompt sentinel, take-over/release, intervention test seam
- `58-SPEC.md:13` explicitly states "P58 does not introduce new surfaces"
- The user-facing live panel update requires either:
  - (a) Modifying the OpenCode SDK client to subscribe to child events after dispatch (SDK surface, not harness surface), OR
  - (b) Adding a new harness tool that polls `getSessionMessages` and pushes results (creates a new tool surface, contradicts "no new surfaces")
- Either way, it requires a phase beyond P58

---

## 5. In-Scope vs Out-of-Scope

| Symptom | In-scope for P58? | Why |
|---------|---------------------|------|
| S1 panel cut-off | NO | OpenCode SDK surface; not harness surface. `58-SPEC.md:13` "P58 does not introduce new surfaces" |
| S2 no user affordance | PARTIAL | P58 added orchestrator-facing `forward-prompt` and `take-over`/`release`. User-actor is a follow-up (P58.2) |
| S3 main stream ends early | NO | 27-tool-key invariant: cannot add a tool to keep the main stream open without breaking the tool surface contract. `58-SPEC.md:13` |
| S4 no live JIT | NO | Requires SDK event subscription (S1 fix) or a new polling tool (new surface). Both out-of-scope |

**P58 itself is correctly shipped.** The 13/13 ACs passed at L1 (green-bar BATS), the 6/6 gaps are closed, the 27-tool-key invariant is preserved, the P20 l0-orchestrator contract is intact, and the gate triad (lifecycle → spec → evidence) all PASS. The symptoms are the gap between P58's surface contract (programmatic orchestration, no new surfaces) and the user's real-world need (live panel + user-actor + persistent orchestrator + live JIT).

**Follow-up phases needed:**
- **P58.1 — Live JIT context delivery:** S1 + S4. Add SDK event subscription in dispatch path. Forward child messages to parent TUI. (New surface OR SDK augmentation — both require P58.1.)
- **P58.2 — User-direct child affordance:** S2. Add user-actor to tmux-copilot whitelist OR add new user-facing tool. Allow user to call `forward-prompt`, `peek`, `progress` directly.
- **P58.3 — WaiterModel true async dispatch:** S3. Make `delegate-task` fire-and-forget after sendPrompt (`void`, not `await`). Ensure orchestrator main stream remains open. Requires SDK semantic compatibility check.

---

## 6. Specific Fix Recommendations (DO NOT IMPLEMENT)

### Option A (P58.1 — addresses S1 + S4): Live JIT Context

**Location:** `src/coordination/delegation/manager-runtime.ts:244` (after sendPromptAsync)

**Change:** Add SDK event subscription:
```ts
// After sendPromptAsync returns successfully
const childSessionId = result.sessionId
if (childSessionId) {
  void this.deps.client.session.subscribe?.(childSessionId, async (event) => {
    if (event.type === "message" || event.type === "tool_use" || event.type === "tool_result") {
      await sdkSendPromptAsync(this.deps.parentClient, parentSessionId, {
        parts: [{ type: "text", text: formatChildEvent(event) }],
        noReply: true,
      })
    }
  })
}
```

**Risk:** New SDK surface dependency; may break if SDK version is incompatible; requires SDK signature verification. The 27-tool-key invariant is at risk if the subscription is implemented as a new tool. Prefer SDK-augmentation approach (subscribing inside the existing dispatch path, not a new tool).

### Option B (P58.3 — addresses S3): True Fire-and-Forget Dispatch

**Location:** `src/coordination/delegation/manager-runtime.ts:244` (the `await`)

**Change:** Replace `await sendPromptAsync` with `void sendPromptAsync` (fire-and-forget):
```ts
// Before:
await sendPromptAsync(...)
// After:
void sendPromptAsync(...).catch(err => {
  logger.error({ err, dispatchId }, "background sendPromptAsync failed")
})
```

**Risk:** Loss of synchronous error handling for spawn. If the prompt fails to send, the orchestrator's tool call returns success but the child never sees the prompt. Mitigation: add a pre-send validation check (validate that session was created before returning dispatch ID).

### Option C (P58.2 — addresses S2): User-Actor Whitelist

**Location:** `src/tools/tmux-copilot.ts:51-56`

**Change:** Add `user-actor` to `ORCHESTRATOR_AGENTS`, OR add separate `user-tmux-copilot` tool that bypasses the actor check.

**Risk:** User could disrupt in-flight orchestrator work. Need careful permission gating (e.g., allow user-actor only for delegations the user explicitly owns). AC#10 (`src/plugin.ts:923-926` `appendTuiPrompt` manualOverride check) and AC#11 (`src/tools/tmux-copilot.ts:264-275` `forward-prompt` manualOverride check FIRST) must continue to pass.

### Option D (P58 — minimal, addresses S2 partially): Document User-Actor Gap

**Action:** Update `58-SPEC.md:13` to acknowledge the user-actor gap is intentional for P58, with a pointer to P58.2. Update AC table to include an "Out of scope" column for traceability. Update the stale comment at `dist/plugin.js:368` ("registering 26 custom tools" — verifier counted 27) to match the actual count.

**Risk:** None. Documentation only.

---

## 7. Verification Plan

Each fix requires its own BATS test:

| Fix | Test name | What it verifies |
|-----|-----------|------------------|
| A (P58.1) | `tests/scripts/tmux/58-panel-live-update.bats` | After `delegate-task`, parent's tmux panel receives child messages in real time (within 1s) |
| A (P58.1) | `tests/scripts/tmux/58-progress-mid-flight.bats` | Mid-flight, `delegation-status --action=progress` returns live counters (not stale snapshot) |
| B (P58.3) | `tests/scripts/tmux/58-stream-stays-open.bats` | After `delegate-task` returns, orchestrator's main stream remains open; can issue more tool calls |
| C (P58.2) | `tests/scripts/tmux/58-user-inject.bats` | User can call `forward-prompt`, `peek`, `progress` from user TUI; permission gate allows user-actor |
| D (P58) | `tests/scripts/tmux/58-user-actor-gap-acknowledged.bats` | Documentation test: SPEC.md and AC table acknowledge user-actor gap |

**Test placement:** All under `tests/scripts/tmux/` (correcting the task description's `tests/bats/slots/`). The P58 BATS slots are 62-67 (plus `58-orchestrator-intervention.bats`); slot 61 is pre-existing stress test (inherited P55-invariant debt, not a P58 regression).

**Regression guards (must continue to pass):**
- BATS-61 (`61-delegate-task-no-native-task-tool.bats`) G1 grep guard
- 27-tool-key invariant (src/plugin.ts tool registration)
- BATS slots 01-06 + 52-60 + 62-67 (all pass per `58-VERIFICATION.md:8-10`)
- AC#10 (`src/plugin.ts:923-926` `appendTuiPrompt` manualOverride check)
- AC#11 (`src/tools/tmux-copilot.ts:264-275` `forward-prompt` manualOverride check FIRST)
- P20 l0-orchestrator contract

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 27-tool-key invariant broken | HIGH (if A/B/C implemented) | CRITICAL (P20 l0-orchestrator contract) | Each fix must be reviewed against tool-key matrix in `src/plugin.ts`; prefer in-place SDK augmentation over new tools |
| SDK signature mismatch (Option A) | MEDIUM (SDK is a peer dep) | HIGH (panel breaks) | Version pin + integration test for SDK event subscription; verify against `@opencode-ai/plugin` source |
| Background send loses error (Option B) | MEDIUM | MEDIUM | Add pre-send validation; log on send failure; surface error in delegation record |
| User disrupts orchestrator (Option C) | LOW | MEDIUM | Permission gate on user-inject (allow only for user-owned delegations); manualOverride check preserved |
| Regression in P55/P58 BATS | MEDIUM | HIGH | Re-run full BATS suite (01-06, 52-67) after each fix |
| AC#10/AC#11 break (manualOverride) | LOW | HIGH | Re-test `64-forward-prompt.bats` and `65-takeover-release.bats` |
| P53 pane-monitor journal breaks | LOW | MEDIUM | Verify `dist/plugin.js:655-658` still wires; check journal files at `.hivemind/journal/` |
| Stale comment "26 custom tools" (`dist/plugin.js:368`) | LOW (cosmetic) | LOW | Update comment to match verifier's 27-tool count |

**Highest-priority risks:** 27-tool-key invariant and SDK signature. Both must be re-verified in any follow-up phase.

**Stale documentation evidence found during diagnosis:**
- `dist/plugin.js:368` comment says "registering 26 custom tools" but verifier counted 27 — off-by-one comment, not a real bug, but documents the current count accurately as 27 per `58-VERIFICATION.md`
- `src/tools/delegation/delegate-task.ts:32` claims "always-background WaiterModel" but the code at line 78-87 calls `coordinator.dispatch(params)` which `await`s the full chain (`manager-runtime.ts:202, 204, 244`) — the comment contradicts the code

These are pre-existing technical debt items, not P58 regressions. They should be cleaned up as part of P58.3 documentation pass.
