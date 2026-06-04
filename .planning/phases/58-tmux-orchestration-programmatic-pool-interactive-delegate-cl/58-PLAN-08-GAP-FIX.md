---
phase: 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
plan: 08
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/tmux/tmux-multiplexer.ts
  - src/features/tmux/session-manager.ts
  - src/coordination/delegation/manager-runtime.ts
  - src/coordination/delegation/coordinator.ts
  - src/tools/delegation/delegation-status.ts
  - src/tools/delegation/delegate-task.ts
  - src/tools/tmux-copilot.ts
  - src/features/session-tracker/streaming/child-event-stream.ts
  - tests/scripts/tmux/71-panel-live-update.bats
  - tests/scripts/tmux/72-user-inject.bats
  - tests/scripts/tmux/73-stream-stays-open.bats
  - tests/scripts/tmux/74-progress-mid-flight.bats
  - .opencode/get-shit-done/templates/spec.md
  - .opencode/get-shit-done/templates/verification.md
  - .planning/ROADMAP.md
  - .planning/USER-PAIN-BACKLOG.md
  - .planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md
autonomous: false
requirements: [REQ-58-07, REQ-58-08, REQ-58-09, REQ-58-10, REQ-58-META]
user_setup: []
gap_closure: true

must_haves:
  truths:
    - "After delegate-task, parent tmux panel receives child events in real time (capture-pane content updated within 1s of child tool.execute.after)"
    - "delegation-status {action: peek, delegationId} returns last captured pane content with non-empty content for active delegations"
    - "tmux-copilot {action: take-over} from user-session (agent='user') returns success, not permission-denied"
    - "After delegate-task returns, orchestrator's main stream remains open for 60+ seconds (mid-flight user messages accepted)"
    - "delegation-status {action: progress, delegationId} returns live counters AND lastEvent from in-memory bus"
    - ".planning/USER-PAIN-BACKLOG.md exists with S1-S4 entries and source citations"
    - "Human-driven UAT verdict (PASS/PARTIAL) from real human user is captured in 58-VERIFICATION-EXTEND.md"
    - "27-tool-key invariant preserved (no new tool registrations in src/plugin.ts)"
    - "AC#10 and AC#11 manualOverride regression continues to pass"
  artifacts:
    - path: src/features/tmux/tmux-multiplexer.ts
      provides: "capturePaneContent(paneId) method"
      contains: "capturePaneContent"
    - path: src/features/tmux/session-manager.ts
      provides: "5s polling loop with 15s backoff + getLatestCapture accessor"
      contains: "startPolling"
    - path: src/coordination/delegation/manager-runtime.ts
      provides: "void sendPromptAsync at line 244 + pre-send validation + SDK event subscription"
      contains: "void sendPromptAsync"
    - path: src/tools/delegation/delegation-status.ts
      provides: "peek action (S1) + progress action (S4) in Zod union"
      contains: '"peek"'
    - path: src/tools/tmux-copilot.ts
      provides: "USER_SESSION tier for take-over/release/peek + new peek action"
      contains: "USER_SESSION"
    - path: src/features/session-tracker/streaming/child-event-stream.ts
      provides: "In-memory event bus subscribing to child session events via SDK"
      contains: "childEventStream"
    - path: tests/scripts/tmux/71-panel-live-update.bats
      provides: "BATS test verifying capture-pane polling updates content within 7s"
    - path: tests/scripts/tmux/72-user-inject.bats
      provides: "BATS test verifying user-tier take-over/peek/release"
    - path: tests/scripts/tmux/73-stream-stays-open.bats
      provides: "BATS test verifying orchestrator stream stays open 60+s after dispatch"
    - path: tests/scripts/tmux/74-progress-mid-flight.bats
      provides: "BATS test verifying progress action returns live counters + lastEvent"
    - path: .planning/USER-PAIN-BACKLOG.md
      provides: "S1-S4 symptom entries with source citations"
      contains: "p58-symptom-diagnosis-2026-06-04.md"
    - path: .planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md
      provides: "REAL UAT evidence with human tester name + verdict per symptom"
      contains: "Human-Driven UAT"
  key_links:
    - from: src/features/tmux/session-manager.ts
      to: src/features/tmux/tmux-multiplexer.ts
      via: "multiplexer.capturePaneContent(paneId) call in polling loop"
      pattern: "capturePaneContent"
    - from: src/coordination/delegation/manager-runtime.ts
      to: src/features/session-tracker/streaming/child-event-stream.ts
      via: "subscribe to child session events after spawnDelegatedSession"
      pattern: "childEventStream.subscribe"
    - from: src/tools/delegation/delegation-status.ts
      to: src/features/session-tracker/streaming/child-event-stream.ts
      via: "progress action reads lastEvent from in-memory bus"
      pattern: "getLastEvent"
    - from: src/tools/tmux-copilot.ts
      to: src/features/tmux/session-manager.ts
      via: "peek action calls session-manager.getLatestCapture(paneId)"
      pattern: "getLatestCapture"
---

<objective>
Close the 4 user-visible symptoms (S1-S4) that were excluded from P58's original scope, plus add 3 process changes (REQ-58-META) to prevent recurrence. This plan is the canonical re-ship for the P58 gap-fix; BATS-only verification is NOT sufficient — REAL UAT (human-driven) is the final gate per AC-58-META-04.

Purpose: Deliver a tmux-delegation layer where (a) the user's TUI sees child events live, (b) the user can directly interact with a running child session, (c) the orchestrator's main stream stays open during in-flight delegations, and (d) the orchestrator has real-time JIT context to answer "progress?" mid-flight. Also codify 3 process changes that force future SPECs to enumerate user-pain deferrals explicitly.

Output: 4 new BATS tests (RED-first), ~17 implementation commits, 5 integration/matrix/verification tasks. All 5 new REQs (REQ-58-07..10 + REQ-58-META) ship together or not at all.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SPEC.md (lines 184-290 = REQ-58-07..10 + REQ-58-META)
@/Users/apple/hivemind-plugin-private/.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-META-ANALYSIS.md
@/Users/apple/hivemind-plugin-private/.planning/debug/p58-symptom-diagnosis-2026-06-04.md
@/Users/apple/hivemind-plugin-private/.planning/debug/tmux-delegate-streaming-gaps.md
@/Users/apple/hivemind-plugin-private/src/features/tmux/tmux-multiplexer.ts
@/Users/apple/hivemind-plugin-private/src/features/tmux/session-manager.ts
@/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager-runtime.ts
@/Users/apple/hivemind-plugin-private/src/tools/tmux-copilot.ts
@/Users/apple/hivemind-plugin-private/src/tools/delegation/delegation-status.ts
@/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts
</context>

## Section 1: Plan Overview

| Field | Value |
|---|---|
| Plan name | 58-PLAN-08-GAP-FIX |
| Scope | REQ-58-07 (S1), REQ-58-08 (S2), REQ-58-09 (S3), REQ-58-10 (S4), REQ-58-META (process) |
| Estimated tasks | ~25 atomic commits (4 RED + 12 IMPL + 5 INTEGRATION + 4 META docs) |
| Wave structure | 4 waves (RED → IMPL → INTEGRATION → META) |
| Verification gate | REAL UAT (human-driven, META-04) — NOT BATS-only per D-58-36 |
| Invariants | 27-tool-key preserved; P20 no-new-deps; AC#10/AC#11 manualOverride regression; max 500 LOC per module |
| RED-FIRST | All 4 BATS tests authored and committed with `(red)` marker BEFORE implementation per D-58-38 |

**BATS slot renumbering (D-58-21 LOCKED):** The original `58-SPEC.md:197,214,232,249` text references "slot 67/68/69/70" for the 4 new BATS scenarios, but **BATS 67 is already used** by the G1 grep-guard at `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats` per `58-SUMMARY.md:45` and `58-CLOSE.md:184`. Per D-58-21, the 4 new BATS scenarios are renumbered to **slots 71-74**:

| Slot | Filename | REQ |
|------|----------|-----|
| **71** | `tests/scripts/tmux/71-panel-live-update.bats` | S1 (REQ-58-07) |
| **72** | `tests/scripts/tmux/72-user-inject.bats` | S2 (REQ-58-08) |
| **73** | `tests/scripts/tmux/73-stream-stays-open.bats` | S3 (REQ-58-09) |
| **74** | `tests/scripts/tmux/74-progress-mid-flight.bats` | S4 (REQ-58-10) |

The BATS scenarios below honor D-58-21's renumbering. References to slots 67-70 in the rest of this plan are amended to 71-74.

**Pre-conditions:** BATS slot 61 (`61-stress-test-real-world-workflow.bats`) pre-existing failure is NOT a P58 regression per `58-VERIFICATION.md:9-10` — documented, not in scope. `dist/plugin.js:368` "26 custom tools" comment is off-by-one (verifier counts 27) — not a real bug, not in scope.

## Section 2: Architecture Decisions

### S1 (REQ-58-07) — capture-pane polling

| File | Rationale |
|---|---|
| `src/features/tmux/tmux-multiplexer.ts` | Add `capturePaneContent(paneId)` method: runs `tmux capture-pane -t <paneId> -p` with 5000-char cap, 2s timeout. Pure addition; no behavioral change to `spawnPane`/`listPanes`. |
| `src/features/tmux/session-manager.ts` | Add 5s polling loop on active delegations; backoff to 15s on stable content (compare hash to last capture). Emits `pane-captured` events with full content (P53 hook currently emits metadata-only). |
| `src/tools/delegation/delegation-status.ts` | Add `peek` action to Zod union: `{action: "peek", delegationId?, paneId?, maxBytes?}`. Reads latest capture from in-memory cache. Tool key count UNCHANGED. |

### S2 (REQ-58-08) — user-actor affordance

| File | Rationale |
|---|---|
| `src/tools/tmux-copilot.ts:51-56` | Add `USER_SESSION` permission tier. Recognized when `context.agent === "user"` OR `context.agent === "__user__"`. Granted for `take-over`/`release`/`peek` ONLY; `send-keys` and `forward-prompt` remain orchestrator-only. |
| `src/tools/tmux-copilot.ts:175-180` | Add `peek` action: `{action: "peek", paneId, maxBytes?}`. Returns same shape as S1's `delegation-status peek`. Distinct tool but shared backing method. |
| `src/features/tmux/session-manager.ts` | Add `getLatestCapture(paneId)` public accessor. Used by both `tmux-copilot peek` and `delegation-status peek`. |

### S3 (REQ-58-09) — WaiterModel keep-alive

| File | Rationale |
|---|---|
| `src/coordination/delegation/manager-runtime.ts:230` | Add pre-send validation: assert `spawnDelegatedSession` returned valid `childSessionId` BEFORE fire-and-forget. Preserves synchronous error handling for spawn failures. |
| `src/coordination/delegation/manager-runtime.ts:244` | Replace `await sendPromptAsync(...)` with `void sendPromptAsync(...).catch(err => logger.error({err, dispatchId}, "background sendPromptAsync failed"))`. Fire-and-forget. |
| `src/coordination/delegation/coordinator.ts:200` | Add auto-poll callback: at `onChildSessionCreated`, register a `setInterval` invoking `delegation-status list` every 30s while delegations are active. Stops on `recordDelegationTerminal`. |
| `src/tools/delegation/delegate-task.ts:32` | Fix comment: replace `"always-background WaiterModel"` with `"true-fire-and-forget WaiterModel (P58.3)"`. Eliminates comment/src contradiction at line 32 vs 78-87. |

### S4 (REQ-58-10) — real-time child event streaming

| File | Rationale |
|---|---|
| `src/features/session-tracker/streaming/child-event-stream.ts` | NEW file, ≤ 100 LOC. In-memory `Map<sessionId, Event[]>` bus. Subscribes to child session events via SDK. Event shape: `{eventType, sessionId, emittedAt, payload: {toolName?, thought?, message?}}`. |
| `src/coordination/delegation/manager-runtime.ts` | After `spawnDelegatedSession`, call `childEventStream.subscribe(childSessionId, sdkClient)`. Wrap in `try/catch` to fallback gracefully. |
| `src/coordination/delegation/coordinator.ts` | At `recordDelegationTerminal`, call `childEventStream.unsubscribe(childSessionId)`. |
| `src/tools/delegation/delegation-status.ts` | Add `progress` action: `{action: "progress", delegationId}`. Returns `{delegationId, actionCount, messageCount, toolCallCount, lastEvent, capturedAt}`. |

### META (REQ-58-META) — process changes

| File | Rationale |
|---|---|
| `.planning/USER-PAIN-BACKLOG.md` | NEW file. Initial entries: S1, S2, S3, S4 from `p58-symptom-diagnosis-2026-06-04.md:14-17`. |
| `.opencode/get-shit-done/templates/spec.md:25-99` | Add `## User-Pain Coverage` section (between Acceptance Criteria and Ambiguity Report). |
| `.opencode/get-shit-done/templates/verification.md` | Add `## Human-Driven UAT` section. Tester must be real human. Verdict: PASS or PARTIAL-with-follow-up. |
| `.planning/ROADMAP.md` | Add `## Symptom Coverage Matrix` section. Atomic update with each phase close. |
| `.planning/phases/58-.../58-VERIFICATION-EXTEND.md` | NEW file. REAL UAT evidence for S1-S4. Human tester signs off each symptom. |

## Section 3: Wave 1 — RED Tests (4 tasks, MUST FAIL BEFORE IMPL)

RED-FIRST protocol per `58-SPEC.md:198, 216, 234, 251`. Each BATS test is authored, committed with `(red)` marker, and runs to FAIL before any implementation.

| # | File | ACs | Expected RED Output |
|---|------|-----|---------------------|
| R1 | `tests/scripts/tmux/71-panel-live-update.bats` | AC-58-07-01, AC-58-07-03 | `not ok 1 — peek action returned error: action "peek" not found in discriminated union` (Zod parse failure) |
| R2 | `tests/scripts/tmux/72-user-inject.bats` | AC-58-08-01, AC-58-08-03 | `not ok 1 — take-over returned permission-denied for agent "user"` (whitelist miss) |
| R3 | `tests/scripts/tmux/73-stream-stays-open.bats` | AC-58-09-01, AC-58-09-03 | `not ok 1 — orchestrator stream state="ended" at t=60s after delegate-task return` (await chain blocks) |
| R4 | `tests/scripts/tmux/74-progress-mid-flight.bats` | AC-58-10-01, AC-58-10-03 | `not ok 1 — progress action returned error: action "progress" not found` (Zod parse failure) |

**R1 detail:** spawn tmux session with `cat`, write text via `tmux send-keys`, wait 7s, invoke `delegation-status {action: "peek"}`, assert written text present in returned `content` field. Exits 1 because `peek` action does not exist yet.

**R2 detail:** set up fake session record, invoke `tmux-copilot {action: "take-over", sessionId, paneId}` with `context.agent = "user"`, assert success and `manualOverride` flag set; invoke `peek`; invoke `release`; assert flag cleared. Exits 1 because `user` is not in `ORCHESTRATOR_AGENTS` whitelist.

**R3 detail:** dispatch `delegate-task` with a slow child prompt (e.g. `sleep 90`), wait 60s, assert the orchestrator's session is in `state: "active"` (not `ended`/`idle`). Exits 1 because the `await sendPromptAsync` chain blocks the dispatch return and the orchestrator's main loop ends early.

**R4 detail:** dispatch `delegate-task` with a prompt that invokes `bash`, wait 3s, call `delegation-status {action: "progress"}`, assert counters > 0 AND `lastEvent` non-null. Exits 1 because `progress` action does not exist and the in-memory bus is not yet wired.

**Commit format for R1-R4:** `phase-58-gap-fix(test): add (red) BATS test for {S1|S2|S3|S4}`

## Section 4: Wave 2 — Implementation (~17 tasks)

### Wave 2A: S1 (5 tasks, SEQUENTIAL — S4 shares manager-runtime.ts)

| # | File | Action | ACs |
|---|------|--------|-----|
| I1 | `src/features/tmux/tmux-multiplexer.ts` | Add `capturePaneContent(paneId: string): Promise<{content, capturedAt, byteLength}>` method. Spawns `tmux capture-pane -t <paneId> -p` via `Bun.spawn` (or `node:child_process` fallback per AGENTS.md PTY policy). 5000-char cap, 2s timeout. Returns `byteLength: 0` on timeout. | AC-58-07-01, AC-58-07-05 |
| I2 | `src/features/tmux/session-manager.ts` | Add `private lastCaptureHash: Map<string, string>` + `private latestCapture: Map<string, CaptureRecord>`. Add `startPolling(intervalMs = 5000)` method that iterates active delegations and calls `multiplexer.capturePaneContent`. Add `getLatestCapture(paneId): CaptureRecord \| null` public accessor. | AC-58-07-01, AC-58-07-02 |
| I3 | `src/features/tmux/session-manager.ts` | Implement backoff: if `hash(current) === hash(previous)`, double interval up to 15s; reset to 5s on change. Emit `pane-captured` events with full content (not metadata-only). | AC-58-07-01 |
| I4 | `src/tools/delegation/delegation-status.ts` | Add `peek` action to Zod union: `z.object({action: z.literal("peek"), delegationId: z.string().optional(), paneId: z.string().optional(), maxBytes: z.number().int().positive().optional()})`. Handler: resolves `paneId` from `delegationId` via DelegationManager if needed, reads `sessionManager.getLatestCapture(paneId)`, truncates to `maxBytes` if set. Returns `{paneId, content, capturedAt, byteLength}`. | AC-58-07-02, AC-58-07-05 |
| I5 | `src/coordination/delegation/manager-runtime.ts` | Start polling in `dispatch()`: after `spawnDelegatedSession`, call `sessionManager.startPolling()` if not already running. Wire into existing `onChildSessionCreated` callback. | AC-58-07-01 |

### Wave 2B: S2 (3 tasks, PARALLEL with 2A/2C)

| # | File | Action | ACs |
|---|------|--------|-----|
| I6 | `src/tools/tmux-copilot.ts:51-56` | Add `USER_SESSION` constant: `const USER_SESSION = "__user__"`. Add tier check: when `context.agent === "user"` OR `context.agent === USER_SESSION`, allow only `take-over`/`release`/`peek` actions. `send-keys` and `forward-prompt` still require orchestrator tier. | AC-58-08-01, AC-58-08-04 |
| I7 | `src/tools/tmux-copilot.ts:175-180` | Add `peek` action to Zod union: `z.object({action: z.literal("peek"), paneId: z.string(), maxBytes: z.number().int().positive().optional()})`. Handler calls `sessionManager.getLatestCapture(paneId)`, returns `{paneId, content, capturedAt, byteLength}`. | AC-58-08-02 |
| I8 | `src/tools/tmux-copilot.ts:264-275` | REGRESSION GUARD: confirm `forward-prompt` action still checks `manualOverride` FIRST before any user-tier widening. Add inline test comment marker. Re-run BATS 64 + 65 to verify. | AC-58-08-04 |

### Wave 2C: S3 (4 tasks, PARALLEL with 2A/2B)

| # | File | Action | ACs |
|---|------|--------|-----|
| I9 | `src/coordination/delegation/manager-runtime.ts:230` | Add pre-send validation: `if (!childSessionId) throw new Error("[Harness] spawnDelegatedSession returned no childSessionId; cannot fire-and-forget")`. Place BEFORE the fire-and-forget block. | AC-58-09-01, AC-58-09-02 |
| I10 | `src/coordination/delegation/manager-runtime.ts:244` | Replace `await sendPromptAsync(...)` with `void sendPromptAsync(...).catch(err => logger.error({err, dispatchId}, "background sendPromptAsync failed"))`. Fire-and-forget. | AC-58-09-01 |
| I11 | `src/coordination/delegation/coordinator.ts:200` | Add auto-poll callback: when `onChildSessionCreated` fires, register a `setInterval` invoking `delegation-status list` every 30s while delegations are active. Stops on `recordDelegationTerminal`. | AC-58-09-02 |
| I12 | `src/tools/delegation/delegate-task.ts:32` | Fix comment: change `"always-background WaiterModel"` to `"true-fire-and-forget WaiterModel (P58.3)"`. Verify via `grep -c 'true-fire-and-forget WaiterModel (P58.3)' src/tools/delegation/delegate-task.ts >= 1`. | AC-58-09-04 |

### Wave 2D: S4 (5 tasks, SEQUENTIAL after 2A + 2C — shares `delegation-status.ts` and `coordinator.ts`)

**File conflict correction (per D-58-29):** S4 does NOT modify `src/coordination/delegation/manager-runtime.ts` (per the delegation prompt's incorrect claim). S4 modifies:
- `src/features/session-tracker/streaming/child-event-stream.ts` (NEW file, D-58-28)
- `src/coordination/delegation/coordinator.ts:200` (subscription hook, D-58-29)
- `src/features/session-tracker/index.ts` (SessionTracker subscriber registration, D-58-29)
- `src/tools/delegation/delegation-status.ts` (progress action, D-58-30 — shares with S1's peek action at D-58-20)

S4's subscription is wired at `coordinator.ts:200` (the `onChildSessionCreated` callback per D-58-29), NOT in `manager-runtime.ts`. The SDK augmentation (`client.session.subscribe()`) is intentionally deferred to a follow-up phase per SPEC OOS line 336; the in-memory event bus uses existing `chat.message` and `tool.execute.after` hooks.

| # | File | Action | ACs |
|---|------|--------|-----|
| I13 | `src/features/session-tracker/streaming/child-event-stream.ts` | NEW file, ≤ 100 LOC. Export `ChildEventStream` class with: `private events: Map<sessionId, Event[]>`, `subscribe(sessionId, listener): () => void` (returns unsubscribe), `recordEvent(sessionId, event): void` (called by SDK event hook), `getLastEvent(sessionId): Event \| null`, `getCounters(sessionId): {actionCount, messageCount, toolCallCount}`. Bounded buffer: last 100 events per sessionId (drop oldest on overflow). | AC-58-10-02 |
| I14 | `src/features/session-tracker/streaming/child-event-stream.ts` | Singleton export `childEventStream = new ChildEventStream()`. Per D-58-28 the file is a sibling of `capture/` and `persistence/` (existing subdirs in `src/features/session-tracker/`). | AC-58-10-02 |
| I15 | `src/coordination/delegation/coordinator.ts:200` | At `onChildSessionCreated` callback: `childEventStream.subscribe(childSessionId, listener)`. Per D-58-29, the subscription is wired at `coordinator.ts:200` (the `onChildSessionCreated` location), NOT in `manager-runtime.ts`. Use existing `chat.message` and `tool.execute.after` hooks to feed the bus, NOT a new SDK subscription. | AC-58-10-01 |
| I16 | `src/coordination/delegation/coordinator.ts` | At `recordDelegationTerminal` path: call `childEventStream.unsubscribe(childSessionId)`. Wire into existing terminal event handler (REQ-58-06's terminal event from D-58-14). The bus drops the per-session entry on terminal. | AC-58-10-02 |
| I17 | `src/tools/delegation/delegation-status.ts` | Add `progress` action to Zod union: `z.object({action: z.literal("progress"), delegationId: z.string()})`. Handler: resolves child session ID, calls `childEventStream.getLastEvent(...)` AND `getCounters(...)`, returns `{delegationId, actionCount, messageCount, toolCallCount, lastEvent, capturedAt: Date.now()}`. Per D-58-30, `lastEvent` is from the in-memory bus (NOT from the counter-based `progressPct` calculation). | AC-58-10-02, AC-58-10-04 |

**Tool key invariant check:** `delegation-status` action count grows from 6 (P58 shipped) to 7 (peek) to 8 (progress). `tmux-copilot` action count grows from 7 to 8 (peek). NO new tools registered in `src/plugin.ts`. Total tool keys: 27 (unchanged).

## Section 5: Wave 3 — Integration (5 tasks)

| # | Task | Pass Criteria |
|---|------|---------------|
| V1 | BATS regression slots 57-60 + 62-66 + 71-74 all green | `bats tests/scripts/tmux/57-60-*.bats tests/scripts/tmux/62-66-*.bats tests/scripts/tmux/71-74-*.bats` — all exit 0. Slot 67 (G1 grep-guard) is the LOCKED P58 grep-guard file. Slot 61 (P55 stress test) pre-existing failure is NOT a P58 regression per `58-VERIFICATION.md:9-10` — documented, not in scope. |
| V2 | 27-tool-key invariant check | `tests/integration/hook-registration.test.ts:86-103` 6/6 PASS (per D-58-39 baseline). `src/plugin.ts` tool registration count is UNCHANGED (0 new tools; only new actions on existing tools). |
| V3 | AC#10/AC#11 regression | BATS 64 + 65 pass. Manual code review: `src/plugin.ts:923-926` still has `appendTuiPrompt` `manualOverride` check; `src/tools/tmux-copilot.ts:264-275` still has `forward-prompt` `manualOverride` check FIRST. Per D-58-24 the USER_SESSION tier widening (S2) does NOT bypass these checks. |
| V4 | vitest regression | `npx vitest run` exits 0. Baseline: 3,310 tests passing per `58-CLOSE.md:7-13`. |
| V5 | tsc clean | `npx tsc --noEmit` exits 0. No new `any` types. All new exports JSDoc'd. Max 500 LOC per module (`child-event-stream.ts` ≤ 100 LOC per D-58-28). |

**Failure handling:** V1 fail → rollback failing wave; investigate root cause. V2 fail → HARD STOP (P20 contract break). V3 fail → tighten user-tier to `take-over`/`release`/`peek` ONLY. V4/V5 fail → investigate, fix or split.

## Section 6: Wave 4 — META (5 tasks)

| # | File | Action | ACs |
|---|------|--------|-----|
| M1 | `.planning/USER-PAIN-BACKLOG.md` | NEW file. Initial entries S1-S4 with verbatim symptoms from `p58-symptom-diagnosis-2026-06-04.md:14-17` and `tmux-delegate-streaming-gaps.md:13-36`. Source citations to both debug reports. | AC-58-META-01 |
| M2 | `.opencode/get-shit-done/templates/spec.md:25-99` | Insert `## User-Pain Coverage` section between `## Acceptance Criteria` and `## Ambiguity Report`. Update `gsd-spec-phase` skill at `.claude/skills/gsd-spec-phase/SKILL.md` Step 4 to fail if section missing. | AC-58-META-01 |
| M3 | `.opencode/get-shit-done/templates/verification.md` | Add `## Human-Driven UAT` section. Update `gsd-verify-work` workflow to enforce. | AC-58-META-02 |
| M4 | `.planning/ROADMAP.md` | Append `## Symptom Coverage Matrix` section. Initial rows: S1-S4 mapped to P58.8 (this plan), with status transition OPEN→RESOLVED on ship. Source citations. | AC-58-META-03 |
| M5 | `.planning/phases/58-.../58-VERIFICATION-EXTEND.md` | NEW file. Real human user signs off on S1-S4 being fixed. Each symptom has a verdict (PASS/PARTIAL/FAIL) with 1-line reason. **Cannot be authored by gsd-verifier or gsd-executor**. | AC-58-META-04 |

**META wave ordering:** M1, M2, M3, M4 can run in parallel (independent files). M5 MUST run last (after Waves 1-3 complete and human tester signs off).

**Verifier enforcement update:** `.claude/skills/gsd-verify-work/SKILL.md` is updated to require both: (a) the `## Human-Driven UAT` section in `VERIFICATION.md`, AND (b) the `## Symptom Coverage Matrix` row update in `ROADMAP.md`. Missing either is HARD FAIL.

## Section 7: Dependency Order

```
Wave 1 [R1..R4] (red) ─┬─► Wave 2A (S1, I1..I5) ─► shares manager-runtime ─► Wave 2D (S4, I13..I17)
                       ├─► Wave 2B (S2, I6..I8)   [PARALLEL with 2A/2C, separate files]
                       ├─► Wave 2C (S3, I9..I12)  [PARALLEL with 2A/2B, separate files]
                       └─► Wave 3 [V1..V5] (after all of 2A-2D)
                              └─► Wave 4 [M1..M4 parallel; M5 last] ─► REAL UAT (FINAL)
```

**Sequencing rules:**
1. Wave 1 → Wave 2 (RED tests must exist before any implementation).
2. **S1 (2A) and S4 (2D) share `manager-runtime.ts` — SEQUENTIAL** (2A first, then 2D; parallel edits = merge conflicts).
3. S2 (2B) and S3 (2C) run parallel to S1+S4 (separate files: `tmux-copilot.ts`, `delegate-task.ts`, `coordinator.ts`).
4. Wave 3 after Wave 2; Wave 4 M1-M4 parallel with Wave 3; M5 last; REAL UAT is the FINAL gate per AC-58-META-04.

## Section 8: Verification Plan

### Per-task verification (Wave 2)

| Task | Automated Verify |
|------|------------------|
| I1 | `npx tsc --noEmit src/features/tmux/tmux-multiplexer.ts` exits 0 |
| I2 | `npx tsc --noEmit src/features/tmux/session-manager.ts` exits 0; `wc -l` ≤ 500 LOC |
| I3 | BATS 71 still passes (R1 → GREEN) |
| I4 | `npx tsc --noEmit src/tools/delegation/delegation-status.ts` exits 0 |
| I5 | BATS 71 re-run; assert capture-pane content updated within 7s |
| I6 | BATS 72 still passes (R2 → GREEN) |
| I7 | BATS 72 re-run; assert peek returns content |
| I8 | BATS 64 + 65 still pass; manual code-review check on `forward-prompt` line 264-275 |
| I9 | BATS 73 still passes (R3 → GREEN) |
| I10 | BATS 73 re-run; assert stream open at t=60s |
| I11 | BATS 73 re-run; assert `delegation-status list` callable at t=30s |
| I12 | `grep -c 'true-fire-and-forget WaiterModel (P58.3)' src/tools/delegation/delegate-task.ts >= 1` |
| I13-I14 | `npx tsc --noEmit src/features/session-tracker/streaming/child-event-stream.ts` exits 0; `wc -l` ≤ 100 LOC |
| I15 | BATS 74 still passes (R4 → GREEN) |
| I16 | BATS 74 re-run; assert terminal event triggers unsubscribe |
| I17 | BATS 74 re-run; assert `progress` returns counters + lastEvent |

### Per-wave verification (Wave 3)

Already detailed in Section 5. Summary: BATS regression + 27-tool-key + AC#10/AC#11 + vitest + tsc.

### FINAL gate — REAL UAT (Wave 4 / M5)

Per `58-SPEC.md:285` and AC-58-META-04: the human user (the front-facing operator who filed the original complaint in `p58-symptom-diagnosis-2026-06-04.md`) signs off on S1-S4 being fixed. The user opens their TUI and:

- **S1 sign-off:** "After `delegate-task`, the parent tmux panel receives child events in real time. I see tool calls, thoughts, and intermediate artifacts streaming into the tmux pane, not just the first prompt." (PASS/FAIL)
- **S2 sign-off:** "I can invoke `tmux-copilot {action: take-over}` and `peek` from my TUI session (without going through the orchestrator). The actions return success, not permission-denied." (PASS/FAIL)
- **S3 sign-off:** "After `delegate-task` returns, I can send a message and the orchestrator responds while delegations are still running. The main stream does not end early." (PASS/FAIL)
- **S4 sign-off:** "I can ask the orchestrator 'progress?' mid-flight and get a meaningful answer about what the child is currently doing (tool name, last event)." (PASS/FAIL)

A verdict of FAIL on ANY symptom is a HARD FAIL. The phase does not ship until all 4 are PASS or PARTIAL-with-explicit-follow-up.

## Section 9: Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **27-tool-key invariant broken** by Wave 2 implementation | LOW | CRITICAL (P20 l0-orchestrator contract) | Wave 3 V2 explicit check. Only `peek` (S1) and `progress` (S4) added to `delegation-status` union; only `peek` (S2) added to `tmux-copilot` union. ZERO new `tool({})` calls in `src/plugin.ts`. |
| R2 | **SDK signature mismatch** in S4 (child event subscription) | MEDIUM | HIGH (panel breaks) | Try/catch fallback in I15: if `client.session.subscribe` is undefined or throws, log warn and continue with counter-based progress. Re-verify against `@opencode-ai/plugin` source per `p58-symptom-diagnosis-2026-06-04.md:184`. |
| R3 | **Fire-and-forget loses error** in S3 (background send fails) | MEDIUM | MEDIUM | Pre-send validation in I9 ensures `childSessionId` is valid BEFORE fire-and-forget. `.catch(err => logger.error(...))` in I10 captures post-send failures. Spawn failures still throw synchronously. |
| R4 | **BATS 61 pre-existing failure** in `61-stress-test-real-world-workflow.bats` | HIGH (already failing) | LOW (not in P58 scope) | Per `58-VERIFICATION.md:9-10`, slot 61 is inherited P55-invariant debt (missing helper `tmux_bats_require_stress_facilities`). NOT a P58 regression. Document in V1 output; do not block ship. |
| R5 | **User-actor widens permission gate too broadly** in S2 | LOW | MEDIUM | I6 scopes the widening to `take-over`/`release`/`peek` ONLY. `send-keys` and `forward-prompt` remain orchestrator-only. AC#10/AC#11 regression check (V3) verifies `manualOverride` is still FIRST. |
| R6 | **AC#10/AC#11 manualOverride regression** in S2 | LOW | HIGH | V3 explicit BATS run: BATS 64 + 65 must pass. Manual code review of `src/plugin.ts:923-926` and `src/tools/tmux-copilot.ts:264-275`. I8 has inline test comment marker. |
| R7 | **P53 pane-monitor journal breaks** when polling emits new `pane-captured` events | LOW | MEDIUM | P53 hook already routes `pane-captured` events to journal. I3's polling emits events with full content. Verify journal file at `.hivemind/journal/<sid>/<ts>-pane.json` still has 7 fields per `53-SPEC.md:32-35`. |
| R8 | **Module size exceeds 500 LOC** | LOW | LOW | `child-event-stream.ts` is a NEW file at ≤ 100 LOC. Other files add 10-50 LOC each. Run `wc -l` per file in V5. |
| R9 | **REAL UAT is skipped or faked** in M5 (human tester does not actually run) | MEDIUM | CRITICAL (entire META wave's purpose is defeated) | Per `58-META-ANALYSIS.md:67-71` and `55-E2E-UAT-2026-06-02.md:484` precedent, M5 is the highest-risk single task. M5 cannot be authored by `gsd-verifier` or `gsd-executor`. The orchestrator MUST pause and wait for the human user's account. |

**Highest-priority risks:** R1 (27-tool-key), R2 (SDK signature), R9 (REAL UAT honesty). All three are HARD FAIL conditions if violated.

## Section 10: Atomic Commit Strategy

**Commit format:** `phase-58-gap-fix(<scope>): <description>`

**Scopes:** `test` (BATS), `S1`/`S2`/`S3`/`S4` (implementation), `META` (process/templates), `docs` (VERIFICATION-EXTEND, ROADMAP matrix).

### Wave 1 — RED Tests (4 commits)

```
phase-58-gap-fix(test): add (red) BATS 71-panel-live-update for S1 capture-pane
phase-58-gap-fix(test): add (red) BATS 72-user-inject for S2 user-tier whitelist
phase-58-gap-fix(test): add (red) BATS 73-stream-stays-open for S3 WaiterModel
phase-58-gap-fix(test): add (red) BATS 74-progress-mid-flight for S4 event bus
```

### Wave 2A — S1 (5 commits)

```
phase-58-gap-fix(S1): add capturePaneContent to TmuxMultiplexer
phase-58-gap-fix(S1): add SessionManager.startPolling + getLatestCapture
phase-58-gap-fix(S1): implement polling backoff (5s → 15s on stable content)
phase-58-gap-fix(S1): add peek action to delegation-status Zod union
phase-58-gap-fix(S1): wire polling start into dispatch() lifecycle
```

### Wave 2B — S2 (3 commits)

```
phase-58-gap-fix(S2): add USER_SESSION tier to tmux-copilot whitelist
phase-58-gap-fix(S2): add peek action to tmux-copilot Zod union
phase-58-gap-fix(S2): add regression guard marker for forward-prompt manualOverride
```

### Wave 2C — S3 (4 commits)

```
phase-58-gap-fix(S3): add pre-send validation before fire-and-forget
phase-58-gap-fix(S3): replace await sendPromptAsync with void at manager-runtime:244
phase-58-gap-fix(S3): add auto-poll callback to coordinator.onChildSessionCreated
phase-58-gap-fix(S3): fix WaiterModel comment at delegate-task.ts:32 (true-fire-and-forget)
```

### Wave 2D — S4 (5 commits)

```
phase-58-gap-fix(S4): create child-event-stream.ts with subscribe/unsubscribe API
phase-58-gap-fix(S4): add singleton childEventStream + ring buffer storage
phase-58-gap-fix(S4): wire subscribe into manager-runtime post-spawnDelegatedSession
phase-58-gap-fix(S4): wire unsubscribe into coordinator.recordDelegationTerminal
phase-58-gap-fix(S4): add progress action to delegation-status Zod union
```

### Wave 3 — Integration (3 commits)

```
phase-58-gap-fix(test): BATS 62-70 regression suite green
phase-58-gap-fix(docs): document 27-tool-key invariant preservation in 58-VERIFICATION.md
phase-58-gap-fix(docs): document AC#10/AC#11 regression pass in 58-VERIFICATION.md
```

### Wave 4 — META (5 commits)

```
phase-58-gap-fix(META): create .planning/USER-PAIN-BACKLOG.md with S1-S4
phase-58-gap-fix(META): add User-Pain Coverage section to spec.md template
phase-58-gap-fix(META): add Human-Driven UAT section to verification.md template
phase-58-gap-fix(META): add Symptom Coverage Matrix to .planning/ROADMAP.md
phase-58-gap-fix(docs): create 58-VERIFICATION-EXTEND.md with human UAT evidence
```

**Total: 29 atomic commits** (4 + 5 + 3 + 4 + 5 + 3 + 5 = 29).

**Commit discipline:**
- Each commit MUST pass `npm run typecheck` and `npm test` independently.
- RED test commits are the ONLY exception (they intentionally fail BATS).
- No bundling. One logical change = one commit.
- Commit message body explains WHY (not WHAT — git diff shows WHAT).

<tasks>

<task type="auto">
  <name>Wave 1: Author 4 RED BATS tests at slots 71-74 (per D-58-21 renumbering)</name>
  <files>tests/scripts/tmux/71-panel-live-update.bats, tests/scripts/tmux/72-user-inject.bats, tests/scripts/tmux/73-stream-stays-open.bats, tests/scripts/tmux/74-progress-mid-flight.bats</files>
  <read_first>
    - 58-SPEC.md:197,214,232,249 (BATS slot 67-70 references — amended to 71-74 per D-58-21)
    - tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats (slot 67 already exists per D-58-21; the 4 new slots renumber to 71-74)
    - tests/scripts/tmux/helpers.bash (BATS test infrastructure; may need extension for child-event-stream.js)
  </read_first>
  <action>Author 4 new BATS scenarios at slots 71-74 with (red) marker commits. Each scenario must FAIL when run. The 4 files are independent (no shared state) and CAN be committed in parallel. Wave 4 (META docs-only) can start in parallel with Wave 1 since no file conflicts. Per-task details: W1-T1 (slot 71 panel-live-update, AC-58-07-03), W1-T2 (slot 72 user-inject, AC-58-08-03), W1-T3 (slot 73 stream-stays-open, AC-58-09-03), W1-T4 (slot 74 progress-mid-flight, AC-58-10-03).</action>
  <verify>
    <automated>bats tests/scripts/tmux/71-74-*.bats</automated>
  </verify>
  <done>All 4 BATS files exist with (red) marker commits; running them exits non-zero; the failing test output names the missing implementation (e.g., "capturePaneContent is not a function" for slot 71, "USER_SESSION_TIERS is not defined" for slot 72, "sendPromptAsync is awaited" for slot 73, "childEventStream.subscribe is not a function" for slot 74)</done>
</task>

<task type="auto">
  <name>Wave 2: Implement S1, S2, S3, S4 across 17 atomic commits (5+3+4+5 = 17 tasks; RED→GREEN pairs per D-58-38)</name>
  <files>src/features/tmux/tmux-multiplexer.ts, src/features/tmux/session-manager.ts, src/features/session-tracker/streaming/child-event-stream.ts, src/coordination/delegation/coordinator.ts, src/coordination/delegation/manager-runtime.ts, src/tools/delegation/delegation-status.ts, src/tools/delegation/delegate-task.ts, src/tools/tmux-copilot.ts, tests/scripts/tmux/helpers.bash</files>
  <read_first>
    - 58-CONTEXT.md:139-198 (D-58-18 through D-58-36 — ALL implementation decisions are LOCKED)
    - 58-SPEC.md:184-290 (5 new REQs with Current/Target/Acceptance)
    - src/features/tmux/tmux-multiplexer.ts (capturePaneContent target per D-58-18)
    - src/features/tmux/session-manager.ts (polling loop target per D-58-19)
    - src/coordination/delegation/manager-runtime.ts:230,244 (fire-and-forget + pre-send validation per D-58-25, D-58-26)
    - src/tools/tmux-copilot.ts:51-56,175-180,264-275 (USER_SESSION + manualOverride REGRESSION GUARD per D-58-22, D-58-24)
    - src/coordination/delegation/coordinator.ts:200 (onChildSessionCreated hook per D-58-29 — S4 NOT manager-runtime.ts as delegation prompt claimed)
  </read_first>
  <action>Execute 17 implementation atomic commits in dependency order per Section 4: Wave 2A (S1, 5 commits I1..I5) → Wave 2B (S2, 3 commits I6..I8) → Wave 2C (S3, 4 commits I9..I12) → Wave 2D (S4, 5 commits I13..I17). Each commit turns one BATS scenario from RED to GREEN. S2 is parallel with all others (only touches tmux-copilot.ts). S1 and S4 share delegation-status.ts (SEQUENTIAL). S3 and S4 share coordinator.ts (SEQUENTIAL). Implementation honors D-58-18..36 LOCKED decisions.</action>
  <verify>
    <automated>bats tests/scripts/tmux/71-74-*.bats && bats tests/scripts/tmux/64-forward-prompt.bats && bats tests/scripts/tmux/65-takeover-release.bats</automated>
  </verify>
  <done>All 4 new BATS scenarios (71-74) exit 0; BATS 64/65 (REGRESSION GUARD for AC#10/AC#11 manualOverride) still exit 0; 17 atomic commits in dependency order with (green) markers</done>
</task>

<task type="auto">
  <name>Wave 3: Integration verification — 5 gates (BATS regression, 27-tool-key, AC#10/AC#11 REGRESSION GUARD, 3,310 vitest, tsc clean)</name>
  <files>(verification only — no new file writes)</files>
  <read_first>
    - tests/integration/hook-registration.test.ts:86-103 (27-tool-key assertion)
    - 58-CLOSE.md:7-13 (3,310 vitest baseline; 6/6 BATS green baseline)
    - src/plugin.ts (tool registration list — must remain at 27)
  </read_first>
  <action>Run 5 integration verification commands per Section 5: (V1) full BATS suite 57-60 + 62-66 + 71-74 all exit 0; (V2) `tests/integration/hook-registration.test.ts:86-103` shows 27 tool keys; (V3) BATS 64 + BATS 65 exit 0 (REGRESSION GUARD for AC#10/AC#11 manualOverride checks); (V4) full vitest suite 3,310/3,310 PASS; (V5) `npx tsc --noEmit` exits 0 with no `any` in new types. Each verification produces a commit (verification marker) with the output captured.</action>
  <verify>
    <automated>npx vitest run tests/integration/hook-registration.test.ts:86-103 && npx vitest run && npx tsc --noEmit</automated>
  </verify>
  <done>All 5 verification gates PASS; 27-tool-key invariant preserved; AC#10/AC#11 manualOverride REGRESSION GUARD verified; 3,310 vitest full suite PASS; tsc --noEmit clean; 3 verification commits captured</done>
</task>

<task type="auto">
  <name>Wave 4: META process changes — 4 docs-only commits (USER-PAIN-BACKLOG + spec template + verification template + ROADMAP matrix)</name>
  <files>.planning/USER-PAIN-BACKLOG.md, .opencode/get-shit-done/templates/spec.md, .opencode/get-shit-done/templates/verification.md, .planning/ROADMAP.md</files>
  <read_first>
    - 58-META-ANALYSIS.md:120-214 (3 process changes — Change 1, 2, 3 verbatim source)
    - 58-CONTEXT.md:200-275 (D-58-32 through D-58-36 LOCKED decisions for META)
    - .planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17 (S1-S4 symptom definitions verbatim)
  </read_first>
  <action>Execute 4 docs-only atomic commits per Section 6: (M1) create `.planning/USER-PAIN-BACKLOG.md` with initial entries S1-S4 verbatim from p58-symptom-diagnosis-2026-06-04.md:14-17 per D-58-32; (M2) add `## User-Pain Coverage` section to `.opencode/get-shit-done/templates/spec.md` per D-58-33 + update `gsd-spec-phase` workflow gate; (M3) add `## Human-Driven UAT` section to `.opencode/get-shit-done/templates/verification.md` per D-58-34 + update `gsd-verify-work` workflow gate; (M4) add `## Symptom Coverage Matrix` section to `.planning/ROADMAP.md` per D-58-35 + update close-pivot gate. All 4 commits use (docs) marker. Wave 4 can run in parallel with Wave 1 (no file conflicts).</action>
  <verify>
    <automated>grep -c '## User-Pain Coverage' .opencode/get-shit-done/templates/spec.md && grep -c '## Human-Driven UAT' .opencode/get-shit-done/templates/verification.md && grep -c '## Symptom Coverage Matrix' .planning/ROADMAP.md && grep -c '## S1' .planning/USER-PAIN-BACKLOG.md</automated>
  </verify>
  <done>4 docs-only commits with (docs) marker; USER-PAIN-BACKLOG.md exists with S1-S4 entries; spec.md template has User-Pain Coverage section; verification.md template has Human-Driven UAT section; ROADMAP.md has Symptom Coverage Matrix; workflow gates updated to enforce sections</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>META-04 REAL UAT gate (post-execution, human-driven sign-off on S1-S4)</name>
  <files>.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md</files>
  <what-built>17 implementation + 4 RED + 3 verification + 4 META docs = 28 atomic commits across 4 waves (4 RED + 17 IMPL + 3 INTEGRATION + 4 META = 28). All BATS scenarios 57-60, 62-66, 71-74 exit 0. 27-tool-key invariant preserved. AC#10/AC#11 manualOverride REGRESSION GUARD verified. 3,310 vitest PASS. tsc clean. USER-PAIN-BACKLOG.md, spec.md template, verification.md template, ROADMAP.md Symptom Coverage Matrix all in place.</what-built>
  <action>META-04 REAL UAT — the human front-facing operator runs 4 verification steps in their actual TUI environment (NOT BATS): (S1) Open user TUI, run `delegate-task` with a multi-step child prompt, switch focus to the tmux pane, observe for 30+ seconds. Assert: "I see all child messages streaming in real time, not just the first prompt." — PASS/FAIL. (S2) From user TUI, invoke `tmux-copilot {action: "take-over", sessionId, paneId}`. Assert: `{ ok: true, takenBy: "user" }`, NOT `permission-denied`. Then `peek` then `release`. — PASS/FAIL. (S3) Open user TUI, run `delegate-task` with 3+ dispatches, after 30s attempt a tool call. Assert: tool call returns successfully (orchestrator stream is active). — PASS/FAIL. (S4) Dispatch `delegate-task` with a `bash`-invoking child prompt, after 3s call `delegation-status {action: "progress", delegationId}`. Assert: `actionCount > 0` and `lastEvent !== null`. — PASS/FAIL. Verdict recorded in `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md` `## Human-Driven UAT` section per D-58-36.</action>
  <verify>
    <automated>grep -c '## Human-Driven UAT' .planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md</automated>
  </verify>
  <done>58-VERIFICATION-EXTEND.md exists with `## Human-Driven UAT` section; tester name is the front-facing operator (NOT `gsd-verifier` or `gsd-executor`); verdict is PASS or PARTIAL-with-explicit-follow-up (FAIL or missing = HARD FAIL per D-58-36)</done>
  <resume-signal>Type "approved" if all 4 symptoms PASS in real UAT, or describe the specific symptom that failed (S1/S2/S3/S4) with the procedure that exposed the issue. PARTIAL-with-explicit-follow-up is acceptable for ship; FAIL or missing section = HARD FAIL (phase does not ship per D-58-36).</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User TUI → tmux-copilot | User-actor invocation (S2) crosses this boundary; USER_SESSION_TIERS gate at `src/tools/tmux-copilot.ts:175-180` is the trust filter. |
| Orchestrator → child session | `src/coordination/delegation/manager-runtime.ts:244` fire-and-forget (S3) crosses this boundary; pre-send validation at line 230 is the trust anchor. |
| `capture-pane` subprocess → TmuxMultiplexer | `src/features/tmux/tmux-multiplexer.ts` capturePaneContent (S1) spawns tmux subprocess; 2s timeout + 5000-char cap is the trust boundary. |
| SDK event stream → child-event-stream bus | `src/coordination/delegation/coordinator.ts:200` (S4) subscribes to child events; 100-event buffer is the trust bound. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation |
|-----------|----------|-----------|-------------|------------|
| T-58-08-01 | Elevation of Privilege | `src/tools/tmux-copilot.ts` USER_SESSION widening (S2) | mitigate | USER_SESSION_ALLOWED_ACTIONS is limited to 3 actions (`take-over`/`release`/`peek`); `send-keys` and `forward-prompt` remain orchestrator-only per D-58-22; manualOverride check at `src/plugin.ts:923-926` and `src/tools/tmux-copilot.ts:264-275` (AC#10/AC#11) preserved per D-58-24 REGRESSION GUARD; BATS 64/65 must continue to exit 0 |
| T-58-08-02 | Tampering | `src/tools/delegation/delegate-task.ts:32` comment/src contradiction (S3) | mitigate | 1-line comment fix per D-58-27: `"always-background WaiterModel"` → `"true-fire-and-forget WaiterModel (P58.3)"`; verified by `grep -c 'true-fire-and-forget WaiterModel (P58.3)'` returning `>= 1` AND old string absent |
| T-58-08-03 | Denial of Service | `src/features/session-tracker/streaming/child-event-stream.ts` unbounded memory (S4) | mitigate | 100-event bounded buffer per sessionId per D-58-28; memory bound: 100 × ~500 bytes × N active = bounded; overflow drops oldest |
| T-58-08-04 | Denial of Service | `src/features/tmux/session-manager.ts` polling loop CPU cost (S1) | mitigate | 5s cadence + SHA-256 hash detection enables 15s backoff when content stable (D-58-19); per-session `setTimeout` not `setInterval` to avoid overlapping captures |
| T-58-08-05 | Information Disclosure | `src/tools/delegation/delegation-status.ts` `peek` action (S1) | mitigate | `peek` is orchestrator-tier only; `maxBytes` parameter caps content size at request time; tmux capture-pane returns terminal content (not keystrokes); sensitive content is the caller's responsibility |
| T-58-08-06 | Repudiation | S2 `take-over` audit trail | accept | Per SPEC OOS line 178 single-actor assumption preserved; the `session-override-taken` event is emitted to the in-memory event log (forensic); persistence to `.hivemind/journal/session-overrides.jsonl` is deferred to a follow-up phase |
| T-58-08-07 | Elevation of Privilege | `__user__` sentinel collision (S2) | accept | Per CONTEXT deferred idea; multi-TUI-session UUIDs deferred to a follow-up phase; current single-user assumption is acceptable per SPEC OOS line 178 |
| T-58-08-08 | Tampering | npm install / pnpm install for the gap-fix | mitigate | P20 invariant — 0 new `package.json` dependencies; gap-fix uses only existing TypeScript, zod, vitest, BATS, OpenCode SDK; no install task in the plan |
| T-58-08-09 | Spoofing | META-04 REAL UAT verdict (post-execution) | mitigate | Verdict MUST include the tester's name (NOT "gsd-verifier" or "gsd-executor" per D-58-36); PARTIAL-with-explicit-follow-up is acceptable but requires a documented follow-up; FAIL is HARD FAIL |
| T-58-08-10 | Information Disclosure | `.planning/USER-PAIN-BACKLOG.md` (META-01) | accept | The backlog contains symptom descriptions, not user PII; the file is at `.planning/`-root (governance sector) and is the canonical source-of-truth for future SPECs to cross-reference |
| T-58-08-SC | Tampering | npm/pip/cargo installs | mitigate | P20 invariant — 0 new deps; no install task in this plan; slopcheck applied to commit subjects (must include REQ ID or AC ID for traceability) |
</threat_model>

<verification>
Per-task: each Wave 2 task verified by re-running the relevant BATS scenario (71-74) and asserting exit 0; S2 implementation also re-runs BATS 64/65 (REGRESSION GUARD). After Wave 2: all 4 new BATS exit 0 + 27-tool-key check + AC#10/AC#11 REGRESSION GUARD. After Wave 3: BATS 57-60 + 62-66 + 71-74 all green, 3,310 vitest PASS, tsc --noEmit clean, 27-tool-key invariant preserved. After Wave 4: USER-PAIN-BACKLOG.md exists with S1-S4 entries, spec.md template has User-Pain Coverage section, verification.md template has Human-Driven UAT section, ROADMAP.md has Symptom Coverage Matrix. GATE 4 (META-04 REAL UAT): human-driven UAT in user TUI for S1-S4; verdict recorded in `58-VERIFICATION-EXTEND.md`; PASS or PARTIAL-with-follow-up required to ship; FAIL or missing = HARD FAIL per D-58-36.
</verification>

<success_criteria>
- 28 atomic commits with correct (red)/(green)/(docs)/(verification) markers per D-58-38
- 4 new BATS scenarios at slots 71-74 all exit 0 (1/1 each, ≤115s total per D-58-39)
- 6 original P58 BATS scenarios at slots 62-66 still exit 0 (regression check)
- 4 P55 BATS scenarios at slots 57-60 still exit 0 (regression check)
- BATS 64 (`64-forward-prompt.bats`) exit 0 (AC#11 REGRESSION GUARD)
- BATS 65 (`65-takeover-release.bats`) exit 0 (AC#10 REGRESSION GUARD)
- `tests/integration/hook-registration.test.ts:86-103` 6/6 PASS (27-tool-key invariant)
- 3,310 vitest full suite PASS
- `npx tsc --noEmit` exit 0, no `any` in new types (`ChildEvent`, `ChildEventStream`, `DelegationEventBase`)
- `src/tools/delegation/delegation-status.ts` action count = 8 (peek + progress added to existing 6)
- `src/tools/tmux-copilot.ts` action count = 8 (peek added to existing 7)
- `src/plugin.ts` tool registration count = 27 (UNCHANGED)
- `.planning/USER-PAIN-BACKLOG.md` exists with S1, S2, S3, S4 entries
- `.opencode/get-shit-done/templates/spec.md` contains `## User-Pain Coverage` section
- `.opencode/get-shit-done/templates/verification.md` contains `## Human-Driven UAT` section
- `.planning/ROADMAP.md` contains `## Symptom Coverage Matrix` section
- `src/tools/delegation/delegate-task.ts:32` contains `"true-fire-and-forget WaiterModel (P58.3)"` AND old `"always-background WaiterModel"` is absent
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-EXTEND.md` has `## Human-Driven UAT` section authored by the human front-facing operator (post-execution META-04 gate)
- Verdict in `58-VERIFICATION-EXTEND.md` is PASS or PARTIAL-with-explicit-follow-up (FAIL = phase does not ship)
</success_criteria>

<output>
Create `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-08-GAP-FIX-SUMMARY.md` when done (per GSD workflow's summary.md template)
</output>
