---
status: closed
trigger: "phase-09-delegation-regression-chain"
created: 2026-04-11T00:00:00Z
updated: 2026-04-14T18:04:00Z
resolution: "confirmed — architectural gap diagnosed (no async notification mechanism), Phase 09.2 Plans 02-03 will address via parent-coordination wiring"
---

## Current Focus

hypothesis: CONFIRMED — The root cause is a fundamental architectural gap: OpenCode's session model provides no mechanism for an orchestrator session to "stand by" and receive asynchronous notifications. The observer correctly polls and detects completion, but the notification has nowhere to land because the orchestrator's turn/stream has already ended.
test: All evidence gathered — production code + session transcript + prior debug files all confirm
expecting: Root cause chain fully traced
next_action: Return diagnosis to orchestrator

## Symptoms

expected: Background delegate-task agents should complete and notify the orchestrator, which should then synthesize results and continue the workflow.
actual: Orchestrator shows "All 4 background delegate-task agents are live" and says "I'm standing by for completion notifications" but the main session stream ENDS. The whole session terminates without the orchestrator ever knowing what happened next.
errors: No explicit crash — the session just ENDS. The orchestrator's stream completes while background agents are still running.
reproduction: Delegate 4 background agents from an orchestrator session. The main orchestrator session stream ends. Background agents may or may not complete but the orchestrator never receives the results.
started: Persistent from Phase 09 through 09.1 — never fully resolved

## Eliminated

- hypothesis: "Background agents never start"
  evidence: Session transcript shows 3 system_reminder messages with "Delegated task started" — agents DID start
  timestamp: 2026-04-11T00:05:00Z

- hypothesis: "Observer polls incorrectly after Phase 09.1 bug fixes"
  evidence: Observer code at lifecycle-background-observer.ts correctly filters assistant-only messages (Bug 3 fix), returns "unknown" for unrecognized status (Bug 2 fix), doesn't cache external idle (Bug 4 fix). All 4 bug fixes verified present.
  timestamp: 2026-04-11T00:08:00Z

- hypothesis: "Queue acquisition blocks the parent session"
  evidence: Fixed in prior debug session (background-async-main-stall). lifecycle-manager.ts:380 now uses `void (async () => { ... })()` for background path, returning JSON immediately before queue acquisition.
  timestamp: 2026-04-11T00:10:00Z

- hypothesis: "Notification handler can't deliver because of Bug 1 (no 'started' branch)"
  evidence: Bug 1 was fixed in Phase 09.1. notification-handler.ts:105-106 now has explicit `status === "started"` branch. Started notifications DID arrive (3 system_reminder messages in transcript).
  timestamp: 2026-04-11T00:12:00Z

## Evidence

- timestamp: 2026-04-11T00:01:00Z
  checked: session-ses_283b.md (PRIMARY evidence — 537 lines)
  found: |
    SESSION TRANSCRIPT ANALYSIS:
    1. Session ses_283b8f39bffeApdlJWCxpyneb2 created at 6:22:04 PM, updated at 6:24:12 PM (total ~2 min)
    2. Orchestrator dispatched 4 background delegate-task agents (async_dispatch=true)
       - Agent 1: ses_283b78a3bffe96BSWtzkXbAzCr (src/lib/ analysis) — RUNNING
       - Agent 2: ses_283b78a34ffe1xhZCBSQ8Jw6pj (CQRS analysis) — RUNNING
       - Agent 3: ses_283b78a23ffewIUxCiATWCVP1K (uncertain dirs) — RUNNING
       - Agent 4: ses_283b78a10ffeuYPKgCe9fAcPo1 (dependency graph) — QUEUED (concurrency=3)
    3. 3 system_reminder messages arrived showing "Delegated task started" for agents 1-3
    4. Orchestrator said "I'm standing by for completion notifications"
    5. SESSION ENDS THERE. No completion notifications received. No synthesis of results.
    6. The session lasted ~2 minutes (6:22 PM to 6:24 PM)
    
    KEY OBSERVATION: The delegate-task tool returned ok:true with instruction "Task dispatched. Continue with other work — you'll be notified when complete." — but the orchestrator's stream ENDED before any completion could happen. The session was only active for ~2 minutes.
  implication: |
    The core failure mode is confirmed: orchestrator session terminates before background agents complete.
    The "standing by" message was the LAST thing the orchestrator said — the stream ended.
    No error, no crash — just a clean termination with no completion notification mechanism active.

- timestamp: 2026-04-11T00:05:00Z
  checked: Phase 09 UAT (09-UAT.md) — 15 items, 3 pass, 8 broken
  found: |
    Phase 09 UAT confirmed delegation is functionally broken at runtime. 604 tests pass but no test
    spawns a real child session through the OpenCode SDK. Of the 15 UAT items:
    - 3 PASS (build/typecheck/cleanup)
    - 8 CODE_EXISTS_BUT_BROKEN (completion detection, notification replay, sync envelope)
    - 3 CODE_EXISTS_UNTESTED (polling, tmux, tmux hard-failure)
    
    Critical gap: "Parent session coordinates — cannot close until all delegations complete AND all 
    front-facing user tasks complete" — status: MISSING. Fire-and-forget pattern, no coordination.
  implication: Phase 09 identified the fire-and-forget problem but never implemented the fix.

- timestamp: 2026-04-11T00:08:00Z
  checked: Phase 09.1 VERIFICATION (09.1-VERIFICATION.md) — 15/15 truths verified
  found: |
    Phase 09.1 verified 15/15 truths. All 4 bugs fixed:
    - Bug 1 (D-15): started notification branch — VERIFIED at notification-handler.ts:105-106
    - Bug 2 (D-16): unknown status default — VERIFIED at lifecycle-background-observer.ts:91,93
    - Bug 3 (D-17): assistant-only evidence — VERIFIED at lifecycle-background-observer.ts:56-58
    - Bug 4 (D-18): external idle not cached — VERIFIED at completion-detector.ts:51
    - 608 tests pass, typecheck clean
    
    BUT: Phase 09.1 UAT (09.1-UAT.md) has status "testing" with 0 passed, 1 issue, 17 pending.
    Test #1 reports MAJOR issue: "Orchestrator delegates 4 background agents, main session ends 
    without knowing what happens next."
  implication: |
    Phase 09.1 fixed the code-level bugs but did NOT address the architectural root cause.
    The verification checked code presence, not runtime behavior.
    The UAT's first test already confirmed the SAME failure mode still exists.

- timestamp: 2026-04-11T00:10:00Z
  checked: Production code — lifecycle-manager.ts lines 379-507 (async dispatch path)
  found: |
    The async dispatch path in launchDelegatedSession():
    1. Line 380: `void (async () => { ... })()` — fire-and-forget IIFE
    2. Inside IIFE: acquireLifecycleQueue() → patchLifecycle("running") → runLifecycleSubsessionTask()
    3. runLifecycleSubsessionTask() (lifecycle-process-runner.ts:323-411):
       - Calls sendPromptAsync() — fire-and-forget
       - Sends "started" notification via .then() 
       - Calls observeBackgroundCompletion() — void'd, fire-and-forget
       - Returns JSON immediately (line 385-410)
    4. launchDelegatedSession() returns JSON string immediately (line 509-533)
    
    The ENTIRE background pipeline is fire-and-forget:
    - sendPromptAsync → fire-and-forget
    - observeBackgroundCompletion → void'd, fire-and-forget
    - The orchestrator receives the JSON response and its turn ENDS
    - observeBackgroundCompletion polls in the background
    - When completion is detected, it calls notifyParentWithFallback()
    - notifyParentWithFallback calls client.session.prompt() on the parent
    - BUT the parent's turn has already ended — the notification is injected as a new turn
  implication: |
    The notification arrives via client.session.prompt() (line 146 of notification-handler.ts) which
    injects a message into the parent session. This creates a NEW turn in the parent session. But
    OpenCode's session model means the orchestrator LLM was already done — its stream completed.
    The injected notification becomes an orphaned message in the parent session history.
    
    This is the FUNDAMENTAL architectural gap: there is no "stand by and wait" mechanism in OpenCode's
    session model. The orchestrator's turn ends when it stops producing output. Background notifications
    arrive as new turns, but there's no code to wake up the orchestrator and synthesize results.

- timestamp: 2026-04-11T00:12:00Z
  checked: In-memory client (tests/lib/helpers/in-memory-client.ts — 58 LOC)
  found: |
    The in-memory client simulates SDK behavior:
    - session.prompt() returns empty { data: {} } (line 38) — ALWAYS succeeds
    - session.promptAsync() returns { status: 204 } (line 39) — ALWAYS succeeds
    - session.status() returns a map from _sessions (line 35-36)
    
    CRITICAL GAP: The in-memory client makes notification delivery ALWAYS succeed. In real OpenCode:
    - client.session.prompt() on a parent session injects a new user turn
    - The parent session must be in a state that accepts new turns
    - If the parent's turn ended, the injected prompt becomes the start of a new turn
    - The new turn has a fresh LLM invocation — it does NOT continue the orchestrator's prior turn
    
    Tests NEVER validate what happens when a notification arrives at a parent whose turn already ended.
  implication: |
    The test adapter masks the real failure mode. In production:
    1. Orchestrator finishes its turn (all delegate-task calls returned, orchestrator says "standing by")
    2. Orchestrator's stream ENDS — the LLM is done generating
    3. Background agent completes → observer detects completion → notifyParentWithFallback()
    4. notifyParentSession() calls client.session.prompt() on parent
    5. This creates a NEW turn in the parent session with the notification as a user message
    6. OpenCode may or may not invoke the LLM for this new turn — depends on platform behavior
    7. Even if invoked, the LLM has NO CONTEXT about what it was doing before — it's a fresh turn
    
    The tests never test this scenario because the in-memory adapter always succeeds synchronously.

- timestamp: 2026-04-11T00:15:00Z
  checked: Root cause reference (.planning/debug/delegation-root-cause-with-reference-2026-04-10.md)
  found: |
    Prior analysis identified 8 root causes. Most relevant to the current failure:
    
    RC-1: OpenCode's session status model is fundamentally insufficient (CRITICAL)
    RC-3: Parent notification delivery not durable (HIGH)
    RC-6: No message-count stability gate (already partially addressed)
    
    But the prior analysis missed the MOST FUNDAMENTAL issue: even with perfect completion detection
    and notification delivery, the orchestrator's TURN ENDS. The notification arrives as a new turn,
    not as a continuation of the orchestrator's prior turn.
    
    oh-my-openagent handles this differently — its BackgroundManager runs in the SAME process context
    and can directly invoke callback functions. The harness relies on OpenCode's session prompt API
    which creates new turns, not continuations.
  implication: |
    The root cause is at the PLATFORM LEVEL, not the code level. OpenCode's session model has no
    concept of "pause this turn and wait for a notification." The harness code is CORRECT for what
    it does — but what it does is architecturally incompatible with reliable async delegation.

- timestamp: 2026-04-11T00:18:00Z
  checked: Phase 09.2 CONTEXT — completion detection architecture
  found: |
    Phase 09.2 depends on Phase 09.1. Its decisions D-10 through D-14 address:
    - D-10: Start gate (thinking block + 2 tool calls before "started")
    - D-11: Backoff polling (15s initial, +5s, 60s cap)
    - D-12: True completion (last msg assistant + idle + 2 consecutive polls)
    - D-13: Failure handling (180s timeout, 2 retries)
    - D-14: PARENT COORDINATION — "main closes only when ALL delegations + ALL user tasks complete"
    
    D-14 is the ONLY decision that addresses the actual root cause. But it requires a mechanism that
    doesn't exist in OpenCode's session model.
  implication: |
    Phase 09.2 would add better completion detection (which is useful) but D-14 (parent coordination)
    requires solving the fundamental platform-level gap. Without it, the orchestrator still ends its
    turn and notifications become orphaned new turns.

- timestamp: 2026-04-11T00:20:00Z
  checked: Phase 09.3 CONTEXT — module restructuring
  found: |
    Phase 09.3 is purely structural (file reorganization, LOC discipline, config schema).
    It does NOT address any delegation functionality. It depends on 09.2 being complete.
  implication: Phase 09.3 is NOT blocked by the delegation bug — it's blocked by 09.2 dependency only.

## Resolution

root_cause: |
  THREE-LAYER ROOT CAUSE (not a single bug):
  
  **Layer 1 (Platform — PRIMARY):** OpenCode's session model has no "stand by and wait" mechanism. 
  When an orchestrator LLM finishes generating (says "standing by for completion notifications"), 
  its turn/stream ENDS. The background observer correctly detects completion and calls 
  notifyParentSession(), which injects a notification via client.session.prompt() on the parent. 
  But this creates a NEW turn in the parent session — it does NOT resume the orchestrator's prior 
  turn. The orchestrator has no context about the prior delegation, and there's no mechanism to 
  bridge the gap.
  
  **Layer 2 (Observer — PARTIALLY FIXED):** Phase 09.1 fixed the 4 code-level bugs that caused 
  false-completion in 12-21ms. The observer now correctly filters assistant-only evidence, returns 
  "unknown" for unrecognized status, and doesn't cache external idle events. These fixes are REAL 
  and CORRECT. But they only make the observer detect real completion — they don't solve the 
  "what happens after detection" problem.
  
  **Layer 3 (Test Coverage — MASKING):** The in-memory client adapter always succeeds for 
  client.session.prompt(), masking the real failure mode. 608 tests pass because they test against 
  a simplified model where notifications always arrive and always succeed. No test validates the 
  scenario where an orchestrator's turn ends before background work completes.

fix: 
verification: 
files_changed: []
