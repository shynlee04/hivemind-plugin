# Phase 58: Tmux Orchestration — Programmatic Pool & Interactive Delegate — Specification

**Created:** 2026-06-03
**Ambiguity score:** 0.075 (gate: ≤ 0.20)
**Requirements:** 6 locked (one per architectural gap G1–G6 from `.planning/ROADMAP.md:510`)
**Mode:** `--auto` (6 rounds, agent-recommended choices, all gates passed by round 5)
**Depends on:** Phase 57 (currently empty placeholder; P51–P55 in-tree synthesis is the actual upstream)

## Goal

Close the **6 architectural gaps** in the in-tree tmux visual orchestration layer so that (a) any consumer of the delegation system can introspect a typed programmatic pool of active delegations, (b) abort+resume preserves tmux pane state, (c) the main agent can forward prompts to any delegate via `appendTuiPrompt` (actually via `SessionManagerAdapter.sendKeys` with a sentinel — see REQ-58-04 for the locked naming), (d) the human operator can take over a delegate mid-flight and release control back to the orchestrator, and (e) every delegation lifecycle transition emits a session-tracker event the P53 pane-monitor hook and the SC-01 SSE pool can consume.

The phase produces **6 BATS scenarios (one per gap), 1 frozen JSON-shape contract (`DelegationPool`), 1 BATS-helper extension, 1 grep-based regression guard, and 0 new tool keys / 0 new modules / 0 new `.hivemind/` storage formats**. It is production-readiness hardening of the P55-germinated tmux layer; it does not introduce new surfaces.

## Background

The P51–P55 in-tree synthesis (closed 2026-06-02 per `.planning/STATE.md`) delivered 7 in-tree modules under `src/features/tmux/` (2,285 LOC), the `tmux-copilot` tool (P43 + P49 widening), the `pane-monitor` hook (P53), the `delegation-status` tool (P24.3.2), and the `session-tracker.recordChildTaskDelegation` integration (P25.1). The seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` is `germinated` (GATE 4/4 PASS at P55 close). P56 is the stress test; **P58 is the production-readiness hardening** that resolves 6 architectural gaps surfaced by the P55 E2E pass + the SC-01 SSE-pool integration work.

What exists today (anchored to the 6 gaps):

| Gap | Current state (code reality) |
|-----|------------------------------|
| **G1 — delegate-task must not invoke native task tool** | `src/tools/delegation/delegate-task.ts:23-99` calls `coordinator.dispatch(...)` (Hivemind `DelegationManager`). The native `task` tool is NOT imported. Gap is a **guard-rail**, not a current bug. |
| **G2 — programmatic pool status API for all active delegations** | `src/tools/delegation/delegation-status.ts` (780 LOC) has 3 CLI actions (`list`, `status`, `find-stackable`) — none return a typed `DelegationPool` consumable by `tmux-copilot` or the SC-01 SSE pool. |
| **G3 — abort+resume cycle preserving tmux session state** | `src/coordination/delegation/manager.ts:153` has `abortDelegation`; `src/coordination/delegation/resume-resolver.ts:17` has `REQ-RC-01` resume logic. **Missing:** tmux pane state preservation across abort (no `paused` transition in `persistence.ts`). |
| **G4 — main-agent-to-delegate prompt forwarding** | `src/plugin.ts:920` calls `appendTuiPrompt(client, line)` for TUI replay only. **Missing:** a forward path that takes a main-agent prompt and delivers it to a specific delegate's tmux pane (the global `appendTuiPrompt` writes to the TUI input, not a tmux pane). |
| **G5 — mid-flight user override (takeover/release) bypassing orchestrator auto-prompting** | **No code exists.** Orchestrator auto-prompting fires unconditionally on every delegation lifecycle event; there is no `manualOverride` flag on the session. |
| **G6 — deep session-tracker integration emitting delegation lifecycle events** | `src/features/session-tracker/tool-delegation.ts:234` `recordChildTaskDelegation()` records ONE event (`queued`). The P53 pane-monitor hook does NOT subscribe to delegation events. **Missing:** the 3-event contract (`queued`, `dispatched`, `terminal`) and the `tmuxSessionId` cross-link. |

The gap between current state and the phase target is the **6 deliverables in the Requirements section** below.

## Requirements

### 1. **G1 — delegate-task guard-rail against native `task` tool** (REQ-58-01)

The `delegate-task` tool shall route all dispatches exclusively through the in-tree Hivemind `DelegationManager.dispatch()` path. No code path in `src/tools/delegation/` may import the native `task` tool from `@opencode-ai/plugin` (or any equivalent shortcut to the OpenCode SDK's child-session `task` shortcut).

- **Current:** `src/tools/delegation/delegate-task.ts:23-99` already routes through `coordinator.dispatch()`; no `task` import. The gap is a **future-regression** risk: a contributor could reach for the SDK `task` shortcut for "simplicity." No automated guard prevents this.
- **Target:**
  - Add a policy comment block at the top of `src/tools/delegation/delegate-task.ts` (above the `createDelegateTaskTool` function) explaining: "**POLICY (P58, G1):** This tool MUST route via `coordinator.dispatch` only. Do NOT import the native `task` tool from `@opencode-ai/plugin` — it bypasses the Hivemind delegation lifecycle, session-tracker events, and tmux pane projection."
  - Add a grep-based BATS test at `tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats` (slot 61) that:
    1. Runs `grep -rE "from ['\"]@opencode-ai/plugin['\"]" src/tools/delegation/ | grep -E "\btask\b"` and asserts exit code 1 (no matches).
    2. Runs `grep -rE "createTaskTool" src/tools/delegation/` and asserts exit code 1.
    3. Asserts the policy comment is present in `delegate-task.ts` via `grep -c "POLICY (P58, G1)" src/tools/delegation/delegate-task.ts` returning `>= 1`.
- **Acceptance:** BATS slot 61 passes (1/1, exit 0). The grep assertions run on the **source** (`src/`), not the compiled `dist/`, so the guard catches in-progress changes. If a contributor imports the native `task` shortcut, the BATS fails with the exact offending line number, pointing to the regression. The BATS is runnable in isolation via `bats --jobs 1 tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats` and exits 0 within 5 seconds.

### 2. **G2 — programmatic pool status API for all active delegations** (REQ-58-02)

The `DelegationManager` shall expose a read-only `getPoolSnapshot(): DelegationPool` method that returns a frozen, JSON-serializable view of every delegation known to the in-memory `delegations` map, regardless of lifecycle status. The shape of `DelegationPool` is locked at this phase and shall not change without an explicit `schemaVersion` bump.

- **Current:** `src/coordination/delegation/manager.ts` keeps an in-memory `Map<delegationId, DelegationRecord>`. There is no read-only typed accessor. `src/tools/delegation/delegation-status.ts:780` has CLI-flavored `list` / `status` / `find-stackable` actions that compose a snapshot ad-hoc per call.
- **Target:**
  - Define a new types file `src/coordination/delegation/pool-types.ts` (new file, <= 60 LOC) exporting:
    - `DelegationLifecycleStatus = "queued" | "dispatched" | "running" | "completed" | "failed" | "aborted" | "paused"`
    - `DelegationPoolEntry` with fields: `id: string`, `agent: string`, `status: DelegationLifecycleStatus`, `depth: number`, `parentId: string | null`, `startedAt: number`, `promptPreview: string` (single line, no `\n`, <= 200 chars)
    - `DelegationPool` with fields: `schemaVersion: 1` (numeric literal per D-53-13), `capturedAt: number`, `delegations: DelegationPoolEntry[]`
  - Add `getPoolSnapshot(): DelegationPool` to the `DelegationManager` class (`src/coordination/delegation/manager.ts`). Implementation: pure function over the in-memory map; `promptPreview` truncates to 200 chars and replaces `\n` with a single space; returned object is `Object.freeze`-d at the top level and each entry.
  - Expose it via a new `action: "pool"` on `src/tools/delegation/delegation-status.ts` (add to the discriminated union). The action returns the frozen `DelegationPool` JSON with `schemaVersion: 1`.
- **Acceptance:**
  - `tsc --noEmit` clean (no `any` in the new types; `DelegationPool` is a strict readonly interface).
  - BATS slot 62 (`tests/scripts/tmux/62-pool-status-api.bats`): spawns 3 fake delegations via `tmux_node_eval` (write to the in-memory map via a test-seam factory), calls `getPoolSnapshot()` via the same Node ESM bridge, asserts: 3 entries returned; `schemaVersion === 1`; `delegations[i].id` is a UUIDv7; each `promptPreview` is <= 200 chars and contains no `\n`. **Snapshot is stable**: re-call returns the same `capturedAt`-ish epoch (within 50ms tolerance) but entries are equal.
  - BATS slot 62 also asserts the SC-01 SSE pool can consume the snapshot: re-validate JSON round-trip via `JSON.stringify(getPoolSnapshot())` and `JSON.parse(...)` (proves the shape survives serialization for SSE transport).
  - BATS slot 62 is runnable in isolation within 10 seconds.

### 3. **G3 — abort+resume cycle preserving tmux session state** (REQ-58-03)

`abortDelegation(delegationId)` shall transition the underlying tmux session's persistence record to `state: "paused"` (NOT `failed`), and `resume(delegationId)` shall rehydrate the tmux pane via `SessionManager.respawnIfKnown()` BEFORE re-sending the prompt via `coordinator.sendPromptAsync`. The pane must survive the abort and the resume must observe the same paneId.

- **Current:** `src/coordination/delegation/manager.ts:153` `abortDelegation` sets a terminal state; `src/coordination/delegation/resume-resolver.ts:17` `REQ-RC-01` checks resume eligibility. **Missing wiring:** the `SessionManager.persist()` call site does NOT receive a `state: "paused"` transition on abort — only the P54 `onSessionCreated` and `handleSessionClose` call sites exist. The result: a tmux pane attached to an aborted delegation is `state: "ready"` on disk, and `respawnIfKnown()` returns the same pane on restart but the prompt is re-sent as if it were a fresh start.
- **Target:**
  - Add a new optional `tmuxSessionId: string | null` field to `DelegationRecord` (default `null`, backward-compatible).
  - Wire a new persistence call site at `src/coordination/delegation/manager.ts:abortDelegation` (after the `terminalFallback` decision): if the delegation has a `tmuxSessionId` attached, call `sessionManager.persist({ ...record, state: "paused" })`.
  - Wire a new resume path at `src/coordination/delegation/manager.ts:resume` (before the `sendPromptAsync` call): if `tmuxSessionId` is set, call `sessionManager.respawnIfKnown(tmuxSessionId)` and, if the returned `paneId` differs from the original record's `paneId`, UPDATE the record's `paneId` BEFORE re-sending the prompt (so the prompt is delivered to the right pane).
  - Confirm `state: "paused"` literal is in `src/features/tmux/persistence.ts` `SessionState` union (already present per P54: `active | ready | paused | detached | failed` — no schema change).
  - Add the call to `sessionManager.persist` at `manager.ts:handleResume` to transition `paused -> ready` once the prompt has been re-sent.
- **Acceptance:**
  - BATS slot 63 (`tests/scripts/tmux/63-abort-resume-pane-survival.bats`):
    1. Spawn a real tmux session via `tmux new-session -d -s <name> 'sleep 600'`.
    2. Wire a fake delegation with `tmuxSessionId: <sid>`.
    3. Call `abortDelegation(<id>)` — assert the persistence file at `.hivemind/state/tmux-sessions/<sid>.json` has `jq -r .state` = `"paused"`.
    4. Call `resume(<id>)` — assert `respawnIfKnown(<sid>)` returns a non-null `paneId` matching the live tmux pane (`tmux list-panes -t <name> -F '#{pane_id}' | head -1`).
    5. Assert the persistence file now has `jq -r .state` = `"ready"`.
    6. Teardown: `tmux kill-session -t <name>`.
  - BATS slot 63 is runnable in isolation (`bats --jobs 1`) within 10 seconds.

### 4. **G4 — main-agent-to-delegate prompt forwarding** (REQ-58-04)

The `tmux-copilot` tool shall accept a new `forward-prompt` action that, given a `paneId` and a `text`, appends the text to the named tmux pane via the existing `SessionManagerAdapter.sendKeys()`. The naming `forward-prompt` is locked. The implementation MUST prepend a sentinel marker line `[orchestrator-forward <ISO-timestamp>]` so the user can visually distinguish orchestrator-forwarded text from agent-native output.

- **Current:** `src/tools/tmux-copilot.ts` (P43 + P49 widening, 235 LOC) has 4 actions: `send-keys`, `list-panes`, `compute-grid`, `respawn`. `send-keys` already takes `paneId` + `text` — but it is generic keystroke delivery (raw `tmux send-keys` invocation), not a "forward-prompt" semantic. The global `appendTuiPrompt` (`src/shared/session-api.ts:209`) writes to the TUI input, NOT to a tmux pane — so a true pane-targeted forward path does not exist.
- **Target:**
  - Add a 5th action `forward-prompt` to the `tmux-copilot` tool's Zod discriminated union.
  - Action signature: `{ action: "forward-prompt", paneId: string, text: string, literal?: boolean }` (`literal` defaults to `true`).
  - Implementation: prepend sentinel `[orchestrator-forward <ISO-timestamp>]\n` to `text`, then call `adapter.sendKeys(paneId, sentinel + text, literal)` (with `literal: true` by default so the leading newline is preserved as a clean break).
  - Return shape: `{ paneId, deliveredAt: <ISO-timestamp>, byteLength: <number> }`.
  - **Tool key invariant**: the 27 tool keys (P51–P55) remain unchanged — this adds a 5th action to the existing `tmux-copilot` tool's Zod discriminated union, NOT a new tool key.
- **Acceptance:**
  - BATS slot 64 (`tests/scripts/tmux/64-forward-prompt.bats`):
    1. Spawn a real tmux session via `tmux new-session -d -s <name> 'cat'` (cat keeps the pane alive and reads from stdin).
    2. Discover the live paneId via `tmux list-panes -t <name> -F '#{pane_id}' | head -1`.
    3. Call `tmux-copilot` `forward-prompt` action with `paneId` + `text="E2E-FORWARD-PROBE-1780434056"`.
    4. Wait 200ms for tmux to flush the keys to the receiving process.
    5. Capture the pane buffer via `tmux capture-pane -t <paneId> -p | grep -c 'orchestrator-forward'`.
    6. Assert grep count is `>= 1` (sentinel line visible) AND `grep -c 'E2E-FORWARD-PROBE-1780434056'` is `>= 1` (text delivered).
    7. Teardown: `tmux kill-session -t <name>`.
  - BATS slot 64 is runnable in isolation within 10 seconds.
  - `dist/tools/tmux-copilot.js` is required (extend `tmux_bats_require_dist`).

### 5. **G5 — mid-flight user override (takeover/release) bypassing orchestrator auto-prompting** (REQ-58-05)

The session-tracker and the `appendTuiPrompt` path shall respect a per-session `manualOverride: boolean` flag. When `true`, orchestrator auto-prompting is suppressed (no orchestrator-forwarded prompts are sent to the session's pane and no `appendTuiPrompt` calls are issued for the session). The flag is set by the new `tmux-copilot take-over` action and cleared by `tmux-copilot release`.

- **Current:** No code exists. Orchestrator auto-prompting fires unconditionally on every delegation lifecycle event. There is no `manualOverride` flag on the session, no `take-over` action, and no `release` action. A user typing in a tmux pane is at risk of input pollution from auto-prompts.
- **Target:**
  - Add 2 new actions to the `tmux-copilot` tool's Zod discriminated union: `take-over` and `release`.
  - Action signature `take-over`: `{ action: "take-over", sessionId: string, paneId: string }`. Sets `manualOverride: true` on the session record (stored in the in-memory `Map<sessionId, SessionRecord>` at `src/features/session-tracker/index.ts`); emits a `session-override-taken` event to the SC-01 SSE pool.
  - Action signature `release`: `{ action: "release", sessionId: string }`. Sets `manualOverride: false`; emits `session-override-released` event.
  - Modify `src/plugin.ts:920` `appendTuiPrompt` wrapper (and any other orchestrator-prompt injection point) to check the flag: if `manualOverride === true` for the target session, return early without calling the SDK.
  - Modify the G4 `forward-prompt` path to also check the flag: if `true`, return `{ suppressed: true, reason: "manualOverride" }` instead of calling `adapter.sendKeys`.
  - **Tool key invariant**: still 27 tool keys — 2 actions added to `tmux-copilot`'s union.
- **Acceptance:**
  - BATS slot 65 (`tests/scripts/tmux/65-takeover-release.bats`):
    1. Spawn a real tmux session via `tmux new-session -d -s <name> 'cat'`.
    2. Wire a fake session record with `sessionId: <sid>` and `manualOverride: false`.
    3. Call `take-over <sid> <paneId>` — assert the record now has `manualOverride: true` AND a `session-override-taken` event was emitted to the in-memory event log.
    4. Call `forward-prompt <paneId> "SHOULD-BE-SUPPRESSED-1780434056"` — assert the response has `suppressed: true` AND `tmux capture-pane` shows the text was NOT delivered.
    5. Call `release <sid>` — assert the record has `manualOverride: false` AND `session-override-released` event was emitted.
    6. Call `forward-prompt <paneId> "SHOULD-BE-DELIVERED-1780434056"` — assert the response has `deliveredAt` set AND `tmux capture-pane` shows the text WAS delivered.
    7. Teardown: `tmux kill-session -t <name>`.
  - BATS slot 65 is runnable in isolation within 10 seconds.

### 6. **G6 — deep session-tracker integration emitting delegation lifecycle events** (REQ-58-06)

The session-tracker shall emit **3 events per delegation lifecycle**: `delegation-queued` (when `recordChildTaskDelegation` is called), `delegation-dispatched` (when the SDK child-session is created), and `delegation-terminal` (when status transitions to `completed | failed | aborted | paused`). Each event payload includes a `tmuxSessionId: string | null` field for cross-linking with the tmux visual orchestration layer.

- **Current:** `src/features/session-tracker/tool-delegation.ts:234` `recordChildTaskDelegation()` records ONE event (the `queued` transition) into the in-memory map. The P53 pane-monitor hook (`src/hooks/pane-monitor.ts`) subscribes to `pane-captured` events from the P52 observer — it does NOT subscribe to delegation events. Missing: the 3-event contract, the `tmuxSessionId` cross-link, and the SC-01 SSE pool subscription.
- **Target:**
  - Add 2 new event types to `src/features/session-tracker/types.ts` `SessionTrackerEvent` discriminated union: `delegation-dispatched` and `delegation-terminal` (the `delegation-queued` is already there per P25.1).
  - Extend `src/features/session-tracker/tool-delegation.ts:recordChildTaskDelegation` to also emit `delegation-dispatched` when the SDK child-session is created (right after the SDK call returns a session id).
  - Add a new method `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` that emits `delegation-terminal` with the final status. Wire it into the `DelegationManager.terminalFallback` path AND the `abortDelegation` path (with `status: "aborted"`) AND the `resume` path (with `status: "running"` → no terminal emit).
  - Each event payload includes: `{ delegationId, agent, status, depth, parentId, tmuxSessionId: string | null, emittedAt: <ISO> }`.
  - Wire the SC-01 SSE pool to subscribe to the 3 new event types (add to its event filter list in `src/sidecar/sse-pool.ts`).
- **Acceptance:**
  - BATS slot 66 (`tests/scripts/tmux/66-session-tracker-delegation-events.bats`):
    1. Construct a fake `DelegationManager` with 2 delegations.
    2. Call `recordChildTaskDelegation` for both — assert 2 `delegation-queued` events in the in-memory event log.
    3. Trigger SDK child-session creation (simulated via test-seam) — assert 2 `delegation-dispatched` events, each with `tmuxSessionId: null` (no tmux attachment yet).
    4. Call `recordDelegationTerminal(<id1>, "completed")` and `abortDelegation(<id2>)` — assert 1 `delegation-terminal` event with `status: "completed"` and 1 with `status: "aborted"`.
    5. Assert all 6 events are in the in-memory log with `emittedAt` increasing monotonically.
    6. Assert the SC-01 SSE pool event filter accepts all 3 event types (smoke test via `filter.accepts("delegation-queued")` returns `true`).
  - BATS slot 66 is runnable in isolation within 5 seconds.
  - The 3 new event types are documented in `src/features/session-tracker/types.ts` with explicit JSDoc.

## Boundaries

**In scope:**
- 1 new types file: `src/coordination/delegation/pool-types.ts` (<= 60 LOC, exporting `DelegationPool`, `DelegationPoolEntry`, `DelegationLifecycleStatus`).
- 1 new method on `DelegationManager`: `getPoolSnapshot(): DelegationPool`.
- 1 new optional field on `DelegationRecord`: `tmuxSessionId: string | null` (backward-compatible).
- 1 new method on `session-tracker`: `recordDelegationTerminal(delegationId, status, tmuxSessionId?)`.
- 2 new event types on `SessionTrackerEvent`: `delegation-dispatched`, `delegation-terminal`.
- 3 new actions on `tmux-copilot`: `forward-prompt`, `take-over`, `release`.
- 1 new action on `delegation-status`: `pool`.
- 1 new policy comment block on `src/tools/delegation/delegate-task.ts`.
- 6 new BATS scenarios at `tests/scripts/tmux/61..66-*.bats` (one per gap).
- 1 extension to `tmux_bats_require_dist` in `tests/scripts/tmux/helpers.bash` (require `dist/coordination/delegation/pool-types.js`).
- Wiring at `src/plugin.ts:920` to respect `manualOverride` flag.

**Out of scope:**
- **No new `src/features/tmux/*.ts` modules.** — Existing 7 in-tree modules are sufficient; gaps are wiring + API surface additions.
- **No new tool registrations in `src/plugin.ts`.** — P55's 27-tool-key invariant is locked; all new actions attach to existing tools.
- **No new `package.json` dependencies.** — All implementations use existing TypeScript, zod, vitest, BATS, OpenCode SDK.
- **No new `.hivemind/` storage formats.** — `state: "paused"` already exists in `persistence.ts`; no schema change.
- **No new persistent state schema.** — `DelegationPool` is in-memory only; serialization is for SSE transport, not disk.
- **No SDK upgrade.** — Compatible with `@opencode-ai/plugin >= 1.1.0` (per existing peer dep).
- **No new plan mode for delegated agents.** — Out of scope; the G1 guard-rail explicitly forbids it.
- **No sidecar-driven tmux projection (SC-04, SC-05).** — Deferred to SC phases; P58 only adds the data layer (3 events, `DelegationPool` API) that SC-04/05 will consume.
- **No multi-user session concurrency (collision detection).** — Single-user assumption preserved; future phase.
- **No auto-refresh of visual dependency graph.** — `compute-grid` already exists; auto-trigger is a future phase.
- **No migration of `appendTuiPrompt` to `showTuiToast`.** — Different layer (notification vs. orchestration); separate backlog.
- **No changes to `src/coordination/delegation/manager.ts` action enum.** — Existing `action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"` is unchanged; the G3 wiring goes into the existing `abortDelegation` and `resume` methods.

## Constraints

- **No new tool keys.** P55's 27-tool-key invariant is locked through P58; new functionality MUST attach to existing tools' Zod discriminated unions. (G2 adds 1 action to `delegation-status`; G4 + G5 add 3 actions to `tmux-copilot`; total = 4 new actions across 2 tools, 0 new tool keys.)
- **`state: "paused"` already exists** in `src/features/tmux/persistence.ts` `SessionState` union per P54; no schema change required for G3.
- **`schemaVersion: 1`** MUST be a numeric literal (not a string) per D-53-13 (consistency with persistence.ts).
- **`promptPreview`** MUST be a single line (no `\n`) and <= 200 chars per `DelegationPool` frozen contract.
- **All 4 BATS test slots (51–54) from P55 must continue to pass** — no regression on the in-tree synthesis.
- **All 3,203+ vitest tests must continue to pass** — no regression in unit coverage.
- **`tsc --noEmit` must exit 0** — no `any` in the new types; `DelegationPool` is a strict readonly interface.
- **P20 invariant honored** — 0 new dependencies in `package.json`.
- **D-04 silent-fallback** preserved at `src/features/tmux/integration.ts:197-202`; no throw crosses the G3 abort+resume path.
- **P55 L1 evidence preserved** — the 4 BATS scenarios at slots 57–60 must continue to exit 0.
- **SC-01 SSE pool compatibility** — the new `DelegationPool` shape and the 3 new event types must be consumable by the existing SSE pool without breaking the SC-01 `delegation-tool-proxy` route.

## Acceptance Criteria

- [ ] BATS slot 61 (`61-delegate-task-no-native-task-tool.bats`) passes: 1/1, exit 0; `grep` returns 0 matches for native `task` shortcut in `src/tools/delegation/`; policy comment present in `delegate-task.ts`.
- [ ] BATS slot 62 (`62-pool-status-api.bats`) passes: 1/1, exit 0; 3 fake delegations surfaced; `schemaVersion === 1`; `promptPreview` <= 200 chars and no `\n`; JSON round-trip via `JSON.stringify` + `JSON.parse` succeeds.
- [ ] BATS slot 63 (`63-abort-resume-pane-survival.bats`) passes: 1/1, exit 0; abort transitions persistence to `paused`; resume rehydrates pane via `respawnIfKnown`; final state is `ready`.
- [ ] BATS slot 64 (`64-forward-prompt.bats`) passes: 1/1, exit 0; sentinel marker visible in pane buffer; probe text delivered to live process.
- [ ] BATS slot 65 (`65-takeover-release.bats`) passes: 1/1, exit 0; `take-over` sets `manualOverride: true`; `forward-prompt` returns `suppressed: true`; `release` clears flag; subsequent `forward-prompt` delivers.
- [ ] BATS slot 66 (`66-session-tracker-delegation-events.bats`) passes: 1/1, exit 0; 6 events total (2 `queued` + 2 `dispatched` + 1 terminal `completed` + 1 terminal `aborted`); `emittedAt` monotonic; SC-01 SSE pool filter accepts all 3 new event types.
- [ ] `tsc --noEmit` exits 0 with no new `any` types in `src/coordination/delegation/pool-types.ts`.
- [ ] All 3,203+ existing vitest tests pass (regression check).
- [ ] All 40+ existing BATS scenarios at slots 01–60 pass (regression check).
- [ ] `src/plugin.ts:920` `appendTuiPrompt` wrapper (and any other orchestrator-prompt injection point) checks `manualOverride` and returns early when `true`.
- [ ] G4 `forward-prompt` action also checks `manualOverride` and returns `{ suppressed: true, reason: "manualOverride" }` when `true`.
- [ ] `delegation-status` tool accepts a new `action: "pool"` and returns the frozen `DelegationPool` JSON.
- [ ] `DelegationPool` shape is documented in `src/coordination/delegation/pool-types.ts` with explicit JSDoc + readonly modifiers.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                                       |
|--------------------|-------|------|--------|---------------------------------------------------------------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | 6 gaps explicitly enumerated, each mapped to a discrete REQ-NN                            |
| Boundary Clarity   | 0.93  | 0.70 | ✓      | Explicit in-scope (8 items) + out-of-scope (11 items) with reasoning                         |
| Constraint Clarity | 0.82  | 0.65 | ✓      | P55 invariants, P54 schema, D-04 silent-fallback, D-53-13 schemaVersion all preserved      |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 13 pass/fail checkboxes; one BATS slot per gap; regression guards explicit                  |
| **Ambiguity**      | 0.075 | ≤0.20| ✓      | Gate passed comfortably by round 5; round 6 confirmed no defer                             |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective      | Question summary                                          | Decision locked                                                                                |
|-------|------------------|-----------------------------------------------------------|------------------------------------------------------------------------------------------------|
| 1     | Researcher       | Gap (1) current dispatch path?                            | `coordinator.dispatch` only; G1 is a guard-rail, not a current bug                             |
| 1     | Researcher       | Gap (2) pool API exists?                                  | No read-only typed accessor; 3 CLI actions on `delegation-status`; add `getPoolSnapshot()`   |
| 1     | Researcher       | Gap (3) abort+resume wiring?                              | `abortDelegation` + `resume-resolver` exist; missing `paused` transition in persistence        |
| 1     | Researcher       | Gaps (4)(5)(6) existence?                                 | (4) `appendTuiPrompt` writes to TUI not pane; (5) no code; (6) only `queued` event emitted    |
| 2     | Simplifier       | Minimum viable 50% cut?                                   | 3 sub-deliverables: API additions + wiring + observability; no new modules                     |
| 2     | Simplifier       | Definition of done?                                       | 6 BATS + 1 frozen contract + helper extension; tsc + 3,203+ vitest clean                        |
| 3     | Boundary Keeper  | Out of scope list?                                        | 11 items: no new modules, no new tools, no new deps, no new storage, no plan mode, etc.        |
| 3     | Boundary Keeper  | Adjacent tempting problems?                               | SC-04/05, plan mode, multi-user collision, auto-refresh grid, `showTuiToast` migration         |
| 3     | Boundary Keeper  | Final deliverable shape?                                  | 6 BATS at slots 61–66; helper extension; 27-tool-key invariant preserved                        |
| 4     | Failure Analyst  | Worst case for G5 takeover?                               | User types while orchestrator auto-prompts → flag-based suppression with explicit release     |
| 4     | Failure Analyst  | Worst case for G3 abort+resume?                           | Pane state lost on abort → `ready → paused → ready` is the only legal state machine path       |
| 4     | Failure Analyst  | Worst case for G6 fanout?                                 | N×M journal write storm → 3 events per delegation (queued + dispatched + terminal), fan-in     |
| 5     | Seed Closer      | Regret not specifying?                                    | `DelegationPool` JSON shape frozen NOW: 7-field entry, 3-field envelope, `schemaVersion: 1`   |
| 5     | Seed Closer      | Is G1 code or test?                                       | BOTH: 1-line policy comment + grep-based BATS that fails on native `task` shortcut import      |
| 6     | Seed Closer      | 6 gaps as discrete requirements?                          | 6 requirements tagged G1–G6; each with Current/Target/Acceptance                               |
| 6     | Seed Closer      | Any defer?                                                | No defer; all 6 gaps in scope; out-of-scope list explicit                                      |

**Auto-mode note:** All decisions above were selected by the agent based on codebase reality, P51–P55 deliverables, P54 `state: "paused"` literal, and the P55 BATS pattern. The user (front-facing operator) was not queried because `--auto` was set. If any decision is wrong, the user can re-run `hm-spec-phase 58` with `--no-auto` and a human will be asked.

---

*Phase: 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl*
*Spec created: 2026-06-03*
*Next step: /hm-discuss-phase 58 — implementation decisions (how to build what's specified above)*
