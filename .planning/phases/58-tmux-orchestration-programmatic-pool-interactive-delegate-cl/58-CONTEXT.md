# Phase 58: tmux-orchestration-programmatic-pool-interactive-delegate - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning
**Mode:** `--auto` (agent-recommended choices; SPEC.md already auto-generated at 0.075 ambiguity)

<domain>
## Phase Boundary

Phase 58 is **production-readiness hardening** of the in-tree tmux visual orchestration layer (P51–P55 deliverables, 2,285 LOC across 7 modules at `src/features/tmux/`). It closes **6 architectural gaps (G1–G6)** that the P55 E2E UAT and the SC-01 SSE-pool integration surfaced:

| Gap | One-line |
|-----|----------|
| **G1** | Guard-rail: `delegate-task` must not invoke native `task` tool from `@opencode-ai/plugin` |
| **G2** | `DelegationManager.getPoolSnapshot(): DelegationPool` (frozen, JSON-serializable) |
| **G3** | `abortDelegation` + `resume` cycle preserving tmux pane state via `state: "paused"` |
| **G4** | `tmux-copilot forward-prompt` action (sentinel-prepended) for main-agent → delegate |
| **G5** | `tmux-copilot take-over` / `release` actions + `manualOverride` flag suppressing auto-prompts |
| **G6** | 3-event lifecycle (`delegation-queued` / `dispatched` / `terminal`) with `tmuxSessionId` cross-link |

The phase produces **6 BATS scenarios (slots 61–66)**, **1 frozen JSON-shape contract** (`DelegationPool`), **1 BATS-helper extension**, **1 grep-based regression guard**, and **0 new tool keys / 0 new modules / 0 new `.hivemind/` storage formats**. It is wiring + API surface additions on the P55-germinated tmux layer, not new surface creation.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**6 requirements are locked.** See `58-SPEC.md` for full requirements, boundaries, acceptance criteria, and the 6-round auto-mode interview log. Downstream agents MUST read `58-SPEC.md` before planning or implementing. Requirements are NOT duplicated here.

**In scope (from SPEC.md):**
- 1 new types file: `src/coordination/delegation/pool-types.ts` (<= 60 LOC, exporting `DelegationPool`, `DelegationPoolEntry`, `DelegationLifecycleStatus`)
- 1 new method on `DelegationManager`: `getPoolSnapshot(): DelegationPool`
- 1 new optional field on `DelegationRecord`: `tmuxSessionId: string | null` (backward-compatible)
- 1 new method on `session-tracker`: `recordDelegationTerminal(delegationId, status, tmuxSessionId?)`
- 2 new event types on `SessionTrackerEvent`: `delegation-dispatched`, `delegation-terminal`
- 3 new actions on `tmux-copilot`: `forward-prompt`, `take-over`, `release`
- 1 new action on `delegation-status`: `pool`
- 1 new policy comment block on `src/tools/delegation/delegate-task.ts`
- 6 new BATS scenarios at `tests/scripts/tmux/61..66-*.bats` (one per gap)
- 1 extension to `tmux_bats_require_dist` in `tests/scripts/tmux/helpers.bash` (require `dist/coordination/delegation/pool-types.js`)
- Wiring at `src/plugin.ts:920` to respect `manualOverride` flag

**Out of scope (from SPEC.md):**
- No new `src/features/tmux/*.ts` modules (existing 7 in-tree modules are sufficient)
- No new tool registrations in `src/plugin.ts` (P55's 27-tool-key invariant is locked)
- No new `package.json` dependencies (P20 invariant)
- No new `.hivemind/` storage formats (`state: "paused"` already exists in `persistence.ts` per P54)
- No SDK upgrade (compatible with `@opencode-ai/plugin >= 1.1.0`)
- No new plan mode for delegated agents (G1 guard-rail explicitly forbids it)
- No sidecar-driven tmux projection (SC-04, SC-05) — P58 only adds the data layer
- No multi-user session concurrency (collision detection deferred)
- No auto-refresh of visual dependency graph
- No `appendTuiPrompt` → `showTuiToast` migration (different layer)
- No changes to `manager.ts` action enum (existing 7 actions unchanged)

</spec_lock>

<decisions>
## Implementation Decisions

### G1 — `delegate-task` guard-rail (REQ-58-01)

- **D-58-01:** G1 policy comment block uses the **verbatim text** from `58-SPEC.md:40` placed immediately above the `createDelegateTaskTool` function export. The 3-sentence block calls out the 3 concrete failure modes (delegation lifecycle, session-tracker events, tmux pane projection) so a future contributor can evaluate the trade-off before reaching for the SDK shortcut. Comment style matches the existing P50/P51 `[Harness]`-prefixed policy comments at the top of integration.ts and persistence.ts.
- **D-58-02:** G1 BATS scenario (`61-delegate-task-no-native-task-tool.bats`) is a **single `@test` block** with 3 sequential `run --` assertions chained: (a) `grep -rE "from ['\"]@opencode-ai/plugin['\"]" src/tools/delegation/ | grep -E "\btask\b"` returns exit 1; (b) `grep -rE "createTaskTool" src/tools/delegation/` returns exit 1; (c) `grep -c "POLICY (P58, G1)" src/tools/delegation/delegate-task.ts` returns `>= 1`. Single-test pattern matches the P55 slot 60 G6 guard-rail scenario; 3 separate `@test` blocks would multiply CI runtime without adding signal.

### G2 — Programmatic pool status API (REQ-58-02)

- **D-58-03:** `DelegationManager` exposes a **read-only `__getDelegationsForTesting(): ReadonlyMap<string, DelegationRecord>` test seam** (private, `__`-prefixed) for BATS slot 62. The `getPoolSnapshot()` public method composes the typed `DelegationPool` from this map. The `__`-prefix convention matches the P54 `__stateRoot` test seam in `persistence.ts` — same governance pattern, same lint tolerance. The seam is documented with explicit JSDoc: "**TEST-ONLY:** do not call from production code; for BATS test fixtures only."
- **D-58-04:** `getPoolSnapshot()` applies **deep `Object.freeze`** at the top-level `DelegationPool` and at each `DelegationPoolEntry`. `promptPreview` strings are auto-frozen as primitive values. The deep-freeze contract matches the JSON-serializable invariant: `JSON.stringify` round-trips preserve the shape, and downstream SSE pool consumers receive a guaranteed-immutable snapshot. `Date`-typed fields are not used; only numeric epochs and primitive strings.
- **D-58-05:** `DelegationPoolEntry.promptPreview` is **truncated to 200 chars** (hard cap, inclusive of the sentinel-marker-length budget for forward-prompt echoes) and **single-line** (`\n` replaced with single space, `\r` stripped, `\t` collapsed to space). Truncation is suffix-ellipsized with the literal `…` character (U+2026) when the original exceeds 200 chars. Implementation is a pure helper `sanitizePreview(raw: string): string` colocated with the type definitions in `pool-types.ts`.

### G3 — Abort+resume pane survival (REQ-58-03)

- **D-58-06:** `abortDelegation` calls `sessionManager.persist({ ...record, state: "paused" })` **directly inside the existing `abortDelegation` method** at `manager.ts:153` (after the `terminalFallback` decision branch). No new wrapper method — the `persist()` API is already the canonical write surface (P54 precedent). The `state: "paused"` literal is already in the `SessionState` union (P54 invariant), so no schema change. PaneId is preserved (not reset) on the persist call.
- **D-58-07:** `resume` re-syncs the paneId **BEFORE re-sending the prompt**: `const respawned = await sessionManager.respawnIfKnown(tmuxSessionId); if (respawned?.paneId && respawned.paneId !== record.paneId) { record.paneId = respawned.paneId; await sessionManager.persist(record); } await coordinator.sendPromptAsync(record);`. Order is critical — sending the prompt to a stale paneId would lose the message. The persist after paneId change ensures restart-survival of the new paneId.
- **D-58-08:** `handleResume` calls `sessionManager.persist({ ...record, state: "ready" })` AFTER `sendPromptAsync` resolves, transitioning the persistence state `paused → ready` once the prompt has been re-delivered. The transition fires on success only; if `sendPromptAsync` throws, the record remains in `paused` and a future `resume` call can retry (matches P54 `restoreAll` filtering of `paused` records).

### G4 — Forward-prompt action (REQ-58-04)

- **D-58-09:** Sentinel line format: **`[orchestrator-forward <new Date().toISOString()>]\n`** (UTC ISO-8601, single space after the timestamp, single `\n` separator). `new Date().toISOString()` matches the `emittedAt` convention from P25 trajectory events (UTC-only, no timezone suffix). The leading `\n` after the timestamp ensures the next character starts on a fresh line in the receiving process's stdin (critical for `cat`-mode panes that line-buffer input).
- **D-58-10:** `byteLength` return field uses **UTF-8 byte count** of the full delivered string (sentinel + text), computed via `Buffer.byteLength(sentinel + text, 'utf8')`. UTF-8 matches tmux's byte-oriented buffer semantics and the `TextEncoder` standard. Reported in the response envelope as a number (not a string) for downstream log aggregation. The `deliveredAt` field is the same `new Date().toISOString()` value used in the sentinel — single source of truth for delivery timestamp.

### G5 — Take-over / release actions (REQ-58-05)

- **D-58-11:** `take-over` action payload: **`{ sessionId, paneId, takenAt: ISO, takenBy: "human-operator" }`** (single-actor model). The `takenBy` field is a literal string constant `"human-operator"` for now; the single-user assumption is preserved per SPEC OOS line 178. Future multi-user phases will widen the type to `takenBy: string`. The `paneId` is included in the event payload (not just the action argument) so the SC-01 SSE pool subscribers see which pane was claimed without re-querying the session record.
- **D-58-12:** `forward-prompt` suppression response shape: **`{ suppressed: true, reason: "manualOverride", paneId: string, textPreview: string (first 80 chars), evaluatedAt: ISO }`**. Includes the original delivery metadata (paneId + truncated text preview) for observability — the SC-01 SSE pool can show "user has taken over; orchestrator attempted to send 'E2E-FORWARD-PROBE-1780...' but it was suppressed" in the dashboard. Reason is a typed string literal union (`"manualOverride" | "session-not-found"` future-proofed).

### G6 — Session-tracker delegation events (REQ-58-06)

- **D-58-13:** `emittedAt` is **`Date.now()` numeric (ms epoch)** for monotonic checks, exposed as a number field in the event payload. Matches P25 trajectory's numeric timestamp convention (sort-friendly, integer arithmetic, no string parsing). The event consumer (SC-01 SSE pool) receives the number; stringification is the transport layer's job. Monotonicity assertion in BATS slot 66: `assert event2.emittedAt > event1.emittedAt` (strictly greater; ties are allowed within the same `setImmediate` tick but rare in practice).
- **D-58-14:** `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` signature: **`status: DelegationLifecycleStatus` (typed union, not raw string), `tmuxSessionId?: string | null`** (optional, defaults to `null` for delegations without a tmux attachment). The method is called from 2 sites: `terminalFallback` path (with the final status) and `abortDelegation` path (with `status: "aborted"`). The `resume` path does NOT call `recordDelegationTerminal` (it transitions `paused → running`, which is a non-terminal transition; terminal events fire only on completion / failure / abort).
- **D-58-15:** SC-01 SSE pool event filter is extended **as a string array** (not a Set) in `src/sidecar/sse-pool.ts`. The 3 new event types (`delegation-queued`, `delegation-dispatched`, `delegation-terminal`) are added to the existing filter array literal. Array-of-strings preserves JSON serialization compatibility for the SC-01 `/delegation-tool-proxy` SSE event types payload. The filter is checked via `filter.includes(eventType)` (O(n) but n=10 so acceptable).

### Cross-cutting

- **D-58-16:** All 6 BATS scenarios use **`BATS_TEST_TMPDIR`-isolated state roots** via the P55 `tmux_bats_make_project` helper. The `pool-types.ts` test in slot 62 uses an **in-memory `delegations` Map** (no disk writes) — the `__getDelegationsForTesting` seam feeds the snapshot directly. BATS slot 63 (abort+resume) writes persistence files to `${BATS_TEST_TMPDIR}/project/.hivemind/state/tmux-sessions/`, mirroring the P54 slot 56 pattern.
- **D-58-17:** SC-01 SSE pool subscription is wired at the **`src/sidecar/sse-pool.ts` filter list** only (per D-58-15). The `src/sidecar/delegation-tool-proxy.ts` route is **NOT modified** — the new event types flow through the existing SSE channel and the proxy route's event filter is a superset. SC-04 / SC-05 dashboard rendering of the new events is deferred to those phases.

### the agent's Discretion

The implementer has flexibility for these implementation details (no SPEC constraint, no user preference captured — `--auto` mode):

- Exact JSDoc depth on `DelegationPool` / `DelegationPoolEntry` / `DelegationLifecycleStatus` (each must have a docstring explaining the contract; depth is at implementer's discretion)
- Specific `run --` vs `assert_success` style within BATS — must follow the P53/P54/P55 BATS precedent (consistent style across the 6 scenarios)
- Order of policy comment sentences in G1 — the 3-sentence block from SPEC is the recommended order, but punctuation can be tuned
- Whether to extract the `getPoolSnapshot` / `__getDelegationsForTesting` pair as a separate test-helper module or inline in `manager.ts` — both satisfy the SPEC
- Specific `grep -E` regex flavor in the G1 BATS — must catch `from "@opencode-ai/plugin"` AND `from '@opencode-ai/plugin'` AND `from "@opencode-ai/plugin/task"` style imports; implementer chooses the tightest regex
- Exact `BATS_TEST_NUMBER` interpolation in session names (e.g., `tmux-58-slot62-${BATS_TEST_NUMBER}-${BATS_SUITE_TEST_NUMBER}` pattern)
- Whether the `manualOverride` flag is a top-level field on `SessionRecord` or nested under a `policy: { manualOverride: boolean }` sub-object — implementer chooses, but must be documented
- Specific `Object.freeze` ordering in `getPoolSnapshot` (freeze entries first, then top-level — or vice versa; both are correct)
- Whether the `DelegationPool.capturedAt` field uses `Date.now()` or `new Date().getTime()` (equivalent semantically; implementer picks)
- Whether the 3 new SSE pool event types are added to the filter list in insertion order or alphabetical order (cosmetic; implementer picks)
- Whether the G6 BATS slot 66 uses `__testEventLog` seam or a mock event listener for the 6-event assertion (both satisfy the SPEC)
- Whether the `recordDelegationTerminal` method is a top-level method on the session-tracker module or a method on a new `DelegationEventEmitter` sub-class (refactor scope is implementer's call)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SPEC.md` — **LOCKED spec** with 6 requirements (REQ-58-01..06, one per gap G1–G6), 13 acceptance criteria, in-scope/out-of-scope lists, 6-round auto-mode interview log, ambiguity gate PASSED at 0.075 ≤ 0.20
- `.planning/ROADMAP.md:510-520` — P58 phase entry with goal, dependencies (P57 currently empty; P51–P55 in-tree synthesis is the actual upstream)
- `.planning/phases/56-tmux-stress-test-real-world-workflow/56-CONTEXT.md` — Prior-phase CONTEXT format reference (12 decisions, 4-section template)
- `.planning/phases/56-tmux-stress-test-real-world-workflow/56-SPEC.md` — Prior-phase SPEC format reference (6 EARS, P56)
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-CONTEXT.md` — Prior-phase CONTEXT format reference (12 decisions)
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-SPEC.md` — Prior-phase SPEC format reference (4 EARS, P55)
- `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md` — Prior-phase L1+L2 evidence pattern
- `.planning/phases/54-session-persistence-restart-recovery/54-SPEC.md` — P54 SPEC: `state: "paused"` literal origin in `SessionState` union
- `.planning/phases/54-session-persistence-restart-recovery/54-CONTEXT.md` — P54 CONTEXT: persistence design + 7-param `SessionManager` constructor
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-CONTEXT.md` — P53 CONTEXT: D-53-05 (backoff schedule), D-53-13 (schemaVersion drift fix)
- `.planning/phases/52-wire-tmux-copilot-state-query/52-CONTEXT.md` — P52 CONTEXT: D-04 (tool placement), tmux-copilot factory wiring

### Roadmap and Requirements
- `.planning/ROADMAP.md:510` — P58 phase entry: "tmux-orchestration-programmatic-pool-interactive-delegate: Close 6 architectural gaps..."
- `.planning/REQUIREMENTS.md` — Requirement registry (P58 traces to f-06 Multi-lane delegation, f-07 Trajectory, SIDECAR-01)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; `src/features/tmux/` is the feature layer (P51–P55 deliverables)
- `.planning/codebase/STRUCTURE.md` — File placement: `src/coordination/<feature>/<role>.ts` for coordination modules; `src/features/<feature>/<role>.ts` for feature modules
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read, no `any`

### Source Code (read-only references for P58 implementer)

#### Coordination Layer (G1, G2, G3 targets)
- `src/coordination/delegation/manager.ts` (P24 + P51, ~450 LOC) — `DelegationManager` class with in-memory `delegations` Map; `abortDelegation` at line 153, `terminalFallback` path; target of new `getPoolSnapshot()` method and `__getDelegationsForTesting` test seam (D-58-03)
- `src/coordination/delegation/resume-resolver.ts` (P24, ~150 LOC) — `REQ-RC-01` resume eligibility logic; new `tmuxSessionId` field flows through here
- `src/coordination/delegation/types.ts` (P24) — `DelegationRecord` type; new `tmuxSessionId: string | null` optional field added here (D-58-06)
- `src/coordination/delegation/coordinator.ts` (P24) — `dispatch()` and `sendPromptAsync` paths; G3 resume hook point
- `src/coordination/delegation/state-machine.ts` (P24) — terminal state transitions; the new `recordDelegationTerminal` calls hook into `terminalFallback`

#### Tools (G1, G4, G5 targets)
- `src/tools/delegation/delegate-task.ts` (P24, 23-99 LOC range) — `createDelegateTaskTool` factory; G1 policy comment block added above this export (D-58-01)
- `src/tools/delegation/delegation-status.ts` (P24.3.2, 780 LOC) — 3 CLI actions (`list`, `status`, `find-stackable`); G2 adds a 4th `pool` action
- `src/tools/tmux-copilot.ts` (P43 + P49 widening, 235 LOC) — 4-action tool (`send-keys`, `list-panes`, `compute-grid`, `respawn`); G4 + G5 add 3 more actions (`forward-prompt`, `take-over`, `release`)

#### Session-Tracker (G6 target)
- `src/features/session-tracker/tool-delegation.ts` (P25.1, 234 LOC) — `recordChildTaskDelegation()` records ONE event (`queued`); G6 extends to also emit `delegation-dispatched` and adds `recordDelegationTerminal`
- `src/features/session-tracker/types.ts` (P25.1) — `SessionTrackerEvent` discriminated union; G6 adds 2 new event types (`delegation-dispatched`, `delegation-terminal`)
- `src/features/session-tracker/index.ts` (P25.1) — in-memory `Map<sessionId, SessionRecord>`; G5's `manualOverride` field is added here

#### Tmux Feature Layer (G3 wiring targets)
- `src/features/tmux/persistence.ts` (P54, 400 LOC) — `createSessionPersistence` factory; `SessionState` union already includes `paused`; G3 calls `persist({ state: "paused" })` from `abortDelegation`
- `src/features/tmux/session-manager.ts` (P51 + P54, 332 LOC) — `SessionManager` 7-param constructor; `respawnIfKnown` and `sendKeys` adapter methods; G3 calls `respawnIfKnown` before re-sending prompt
- `src/features/tmux/observers.ts` (P52) — `createTmuxEventObserver`; P53 pane-monitor hook subscribes here
- `src/features/tmux/integration.ts` (P51) — silent-fallback contract per D-04 (P50/P51, preserved through P58)

#### Plugin Wiring (G5 target)
- `src/plugin.ts:920` — `appendTuiPrompt` wrapper; G5 adds `if (sessionRecord?.manualOverride === true) return early;` check (D-58-11)
- `src/sidecar/sse-pool.ts` (SC-01) — event filter list (string array); G6 adds 3 new event types to this filter (D-58-15)

### Test Targets
- `tests/scripts/tmux/helpers.bash` (P51–P56, ~63 LOC) — BATS test infrastructure. **Will be extended** to add `pool-types.js` to `tmux_bats_require_dist`'s dist artifact list
- `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` (P53) — Reference BATS for hook pattern
- `tests/scripts/tmux/56-session-persistence-kill-restart.bats` (P54) — Reference BATS for `state: "paused"` pattern
- `tests/scripts/tmux/57-live-pane-monitoring.bats` (P55) — Reference BATS for real-tmux-session integration
- `tests/scripts/tmux/58-orchestrator-intervention.bats` (P55) — Reference BATS for `TmuxMultiplexer.sendKeys` delivery
- `tests/scripts/tmux/60-visual-dependency-graph.bats` (P55) — Reference BATS for DFS grid layout
- `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` (P56, 300 LOC) — Reference BATS for comprehensive-scenario + vitest-regression-in-teardown pattern
- `tests/integration/hook-registration.test.ts` (P49, ~150 LOC) — vitest test asserting 27 tool keys
- `tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats` — **NEW FILE** (REQ-58-01, slot 61 — note: P56 also reserved slot 61, conflict resolved by P58 using slots 61–66 and P56 staying at slot 61 per `56-SPEC.md` line 23)
- `tests/scripts/tmux/62-pool-status-api.bats` — **NEW FILE** (REQ-58-02, slot 62)
- `tests/scripts/tmux/63-abort-resume-pane-survival.bats` — **NEW FILE** (REQ-58-03, slot 63)
- `tests/scripts/tmux/64-forward-prompt.bats` — **NEW FILE** (REQ-58-04, slot 64)
- `tests/scripts/tmux/65-takeover-release.bats` — **NEW FILE** (REQ-58-05, slot 65)
- `tests/scripts/tmux/66-session-tracker-delegation-events.bats` — **NEW FILE** (REQ-58-06, slot 66)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC, no `any`
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51, preserved through P58) — Graceful-fallback contract: no throw on missing prerequisites or filesystem errors
- D-53-13 (P53, preserved through P58) — `schemaVersion` is a numeric literal (not a string) — applied to `DelegationPool.schemaVersion: 1`
- R-P50-03 — `.hivemind/{journal,state/tmux-sessions}/*` is local runtime state, never committed
- P20 invariant — No new `package.json` dependencies
- 27-tool-key invariant — No new tool registrations in `src/plugin.ts`; all new functionality attaches to existing tools' Zod discriminated unions
- P55 L1 evidence preservation — the 4 BATS scenarios at slots 57–60 must continue to exit 0
- P56 L1+L2 evidence preservation — slot 61 stress test must continue to pass (P58 slots 61–66 do NOT collide because P56 already claimed slot 61; P58 starts at slot 61 per `58-SPEC.md:42`, conflict noted)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (P54, 400 LOC) — `SessionState` union already includes `paused` literal; G3 abort+resume reuses `persist()` directly without a new wrapper. The `__stateRoot` test seam is the precedent for `__getDelegationsForTesting` (D-58-03).
- **`src/features/tmux/session-manager.ts:respawnIfKnown(tmuxSessionId)`** (P54) — Returns a `paneId` (or null if no live pane). G3 calls this in `resume` BEFORE re-sending the prompt (D-58-07).
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (P43 + P49, 235 LOC) — 4-action discriminated union; G4 + G5 add 3 more actions to the existing union (no new tool key, per 27-tool-key invariant).
- **`src/tools/delegation/delegation-status.ts:delegationStatusTool`** (P24.3.2, 780 LOC) — 3-action discriminated union; G2 adds 1 more action (`pool`).
- **`src/features/session-tracker/tool-delegation.ts:recordChildTaskDelegation()`** (P25.1) — Records `delegation-queued` event; G6 extends to also record `delegation-dispatched` and adds `recordDelegationTerminal()`.
- **`src/coordination/delegation/manager.ts:DelegationManager.delegations`** (P24) — In-memory `Map<delegationId, DelegationRecord>`; G2 reads via `__getDelegationsForTesting` test seam, G3 writes to it on `tmuxSessionId` field addition.

### Established Patterns
- **`__`-prefixed test seams** — `__stateRoot` (P54 persistence), `__waitForPendingRetries` (P53 pane-monitor), `__testEventLog` (P25.1 trajectory). G2 follows the pattern: `__getDelegationsForTesting(): ReadonlyMap<string, DelegationRecord>`.
- **BATS scenario structure** — `setup()` → `tmux_bats_require_dist` + `tmux_bats_make_project` → `@test "..."` blocks → `teardown()` with `tmux kill-session` cleanup. P58 follows the same structure for all 6 new BATS files.
- **Grep-based regression guards** — P55 slot 60 used a grep-based BATS to assert absence of a string pattern; P58 slot 61 follows the same pattern (3 grep assertions chained in one `@test` block per D-58-02).
- **Real OS process survival** — Per P55 D-55-05 / P56 D-56-07, all BATS scenarios must exercise real tmux sessions, no mocks. P58 slots 63, 64, 65 use real `tmux new-session` + `cat` / `sleep 600` placeholders.
- **`BATS_TEST_TMPDIR` isolation** — Each BATS test gets a fresh temp dir auto-cleaned. P58 BATS slot 63 writes persistence files to `${BATS_TEST_TMPDIR}/project/.hivemind/state/tmux-sessions/`; slot 62 is in-memory only.
- **`schemaVersion: 1` numeric literal** — Per D-53-13, `schemaVersion` MUST be a numeric literal (not a string). P58 G2 `DelegationPool.schemaVersion: 1` is a numeric literal type.
- **Frozen JSON contract for SSE transport** — `JSON.stringify` round-trip preservation is the testable contract; `Object.freeze` enforces the immutability invariant at the TypeScript level.

### Integration Points
- **`src/coordination/delegation/manager.ts:abortDelegation`** (line 153) — G3 wires `sessionManager.persist({ ...record, state: "paused" })` after the `terminalFallback` decision branch (D-58-06).
- **`src/coordination/delegation/manager.ts:resume`** (line ~180) — G3 wires `sessionManager.respawnIfKnown(tmuxSessionId)` BEFORE `coordinator.sendPromptAsync` (D-58-07).
- **`src/coordination/delegation/manager.ts:handleResume`** (line ~210) — G3 wires `sessionManager.persist({ ...record, state: "ready" })` AFTER `sendPromptAsync` resolves (D-58-08).
- **`src/features/session-tracker/tool-delegation.ts:recordChildTaskDelegation`** (line 234) — G6 extends this method to emit `delegation-dispatched` after the SDK child-session is created.
- **`src/features/session-tracker/tool-delegation.ts:recordDelegationTerminal`** (new) — G6 adds this method; called from 2 sites: `terminalFallback` path and `abortDelegation` path.
- **`src/plugin.ts:920` `appendTuiPrompt` wrapper** — G5 adds `if (sessionRecord?.manualOverride === true) return early;` check.
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool` discriminated union** — G4 + G5 add 3 more actions to the existing union's Zod schema.
- **`src/tools/delegation/delegation-status.ts:delegationStatusTool` discriminated union** — G2 adds 1 more action (`pool`).
- **`src/sidecar/sse-pool.ts` event filter** — G6 adds 3 new event types to the existing filter array.
- **`tests/scripts/tmux/helpers.bash:tmux_bats_require_dist`** — P58 EXECUTE adds `dist/coordination/delegation/pool-types.js` to the dist artifact list (1-line additive change).

</code_context>

<specifics>
## Specific Ideas

- **Auto-mode pass-cap compliance** — Per `hm-auto.md` §"CRITICAL — Auto-mode pass cap", P58 CONTEXT.md generation is a single-pass re-validation. No follow-up pass to "find gaps" — the SPEC's 6-round auto-mode interview already locked all major decisions; this CONTEXT.md is the implementation-decision layer below the spec.
- **BATS slot 61 conflict with P56** — P56 reserved slot 61 for the stress test scenario (`61-stress-test-real-world-workflow.bats`). P58 SPEC also references slot 61 for the G1 grep-guard scenario. **The conflict is acknowledged but not resolvable in this CONTEXT.md** — the implementer should follow the P58 SPEC's slot numbering (61–66) and accept that P58's G1 scenario will need to be renamed to slot 67 if the slot 61 collision is reported as a CI failure. This is a known issue and the slot reservation is conservative on P58's part.
- **SPEC drift detection** — Per P56 D-56-12 precedent, SPEC.md is documentation-of-contract; source-of-truth is `src/**`. P58 SPEC drift detection happens via the 13 acceptance criteria checkboxes + `tsc --noEmit` + vitest regression. No CI check is added in P58.
- **Frozen contract for SC-04 / SC-05** — The 3 new event types and the `DelegationPool` shape are frozen at this phase so that SC-04 (Session Explorer Panel) and SC-05 (Delegation Dashboard Panel) can consume them without an API change. Future changes require `schemaVersion` bump (currently `1`).

</specifics>

<deferred>
## Deferred Ideas

- **SC-04 / SC-05 dashboard rendering of `DelegationPool` and the 3 new event types** — P58 adds the data layer only; the SC phases will render the dashboard. Per SPEC OOS line 177.
- **P58 slot 61 collision with P56 stress test** — Acknowledged but deferred to a follow-up slot-renumbering phase. Per SPEC, P58's G1 scenario is at slot 61; P56 stress test also at slot 61; one must move. Lowest-cost resolution: P58 G1 renames to slot 67 (post-66) if the collision is reported.
- **Multi-user session concurrency (collision detection for `take-over`)** — Per SPEC OOS line 178. Future phase will widen `takenBy: "human-operator"` to `takenBy: string` and add per-user `manualOverride` flags.
- **Auto-refresh of visual dependency graph (`compute-grid` on delegation lifecycle events)** — Per SPEC OOS line 179. Future phase will wire `tmux-copilot compute-grid` to fire automatically on `delegation-terminal` events.
- **`appendTuiPrompt` → `showTuiToast` migration** — Per SPEC OOS line 180. Different layer (notification vs. orchestration); separate backlog.
- **Distributed `take-over` across multiple tmux servers** — Single-host assumption preserved. Future phase will coordinate take-over across multiple tmux server instances.
- **P58 G3 abort+resume — concurrent abort handling** — The SPEC's `abortDelegation` is single-shot; if 2 concurrent aborts hit the same delegation, the second is a no-op (terminal state). Future phase may add a `cancel` action that interrupts a `paused` resume.
- **P58 G6 `recordDelegationTerminal` re-entrancy** — If a terminal event fires while another is in flight, the second is silently dropped (idempotency by map-set semantics). Future phase may add explicit dedup.
- **P58 G4 `forward-prompt` text length validation** — The SPEC caps `text` at the Zod schema level (no explicit cap mentioned); future phase may add a `maxLength: 4096` cap.
- **P58 G5 `take-over` audit trail persistence** — Currently the event is emitted to the in-memory event log; future phase may persist it to `.hivemind/journal/session-overrides.jsonl`.
- **P58 G2 `DelegationPool` filtering** — Currently returns ALL delegations regardless of status. Future phase may add a `filter?: { status?: DelegationLifecycleStatus[] }` parameter.

</deferred>

---

*Phase: 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl*
*Context gathered: 2026-06-03*
*Mode: --auto (agent-recommended choices; 17 implementation decisions locked)*
*Spec created: 2026-06-03 (6 requirements, 13 acceptance criteria, ambiguity gate PASSED at 0.075)*
*Next checkpoint: CP7 (PATTERNS) — generate `58-PATTERNS.md` for the BATS test patterns and frozen-contract format before planning.*
