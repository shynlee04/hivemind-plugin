# Phase 58: tmux-orchestration-programmatic-pool-interactive-delegate - Context

**Gathered:** 2026-06-03
**Updated:** 2026-06-04 — P58-extension scope expansion (5 new REQs REQ-58-07..10 + REQ-58-META; 17 new decisions D-58-18..34 added; 6/6 original REQs LOCKED and unchanged; 11/11 REQs total)
**Status:** Ready for planning (P58-extension; original 6 REQs already executed & verified per `58-CLOSE.md`)

**Mode:** `--auto` for both original (6/6 decisions D-58-01..06 locked at P58 ship) and extension (no live interview required — scope fully specified by `58-META-ANALYSIS.md` + `.planning/debug/p58-symptom-diagnosis-2026-06-04.md` + `.planning/debug/tmux-delegate-streaming-gaps.md` per `58-SPEC.md:8`)

---

<domain>
## Phase Boundary

P58 now has a **dual mandate**:

1. **Original P58 mandate** (LOCKED + EXECUTED 2026-06-03/04): Close 6 architectural gaps (G1–G6) in the in-tree tmux visual orchestration layer. **Status: SHIPPED** — 6/6 BATS scenarios at slots 62–67 green, 13/13 ACs verified, 27-tool-key + P20 invariants preserved, 27 atomic commits per `58-CLOSE.md:6-13`. The 17 implementation decisions D-58-01..17 (in this CONTEXT.md, preserved verbatim from the original 2026-06-03 gathering) are LOCKED — they are not re-discussed.

2. **P58-extension mandate** (NEW 2026-06-04): Absorb the 4 user-visible symptoms (S1–S4) that surfaced after P58's original ship per `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:6-19` and `.planning/debug/tmux-delegate-streaming-gaps.md:13-36`, plus 3 process changes (META-01..03) to prevent recurring symptom-exclusion pattern per `58-META-ANALYSIS.md:120-214`. 5 new REQs (REQ-58-07..10 + REQ-58-META) + 24 new ACs (37 total) added to `58-SPEC.md` on 2026-06-04.

P58-extension preserves the 27-tool-key invariant, the 11 BATS slots 62-67, the P20 no-new-deps rule, the 17 D-58-01..17 decisions, and the 13 original ACs. **No new tool keys, no new `package.json` dependencies, no new `src/features/tmux/*.ts` modules, no regression on the original 6 BATS scenarios at slots 62–67.** The 5 new REQs add: 1 new `capturePaneContent()` method on `TmuxMultiplexer` + 1 polling loop in `SessionManager` + 1 new in-memory event bus file `src/features/session-tracker/streaming/child-event-stream.ts` (<= 100 LOC) + 2 new actions on `delegation-status` (`peek`, `progress`) + 1 new action on `tmux-copilot` (`peek`, user-tier) + 1 new `USER_SESSION` permission tier + 1 behavioral change to `dispatch()` (fire-and-forget) + 4 new BATS scenarios (slots 71–74, post-67, per D-58-21) + 3 template/methodology updates (`spec.md`, `VERIFICATION.md`, `ROADMAP.md`) + 1 new governance file `.planning/USER-PAIN-BACKLOG.md`.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**11 requirements are locked (6 original REQ-58-01..06 + 5 extension REQ-58-07..10 + REQ-58-META).** See `58-SPEC.md` for full requirements, boundaries, and acceptance criteria. The 6 original REQs are LOCKED and unchanged; the 5 extension REQs layer on top without re-opening them.

**Downstream agents MUST read `58-SPEC.md` before planning or implementing.** Requirements are NOT duplicated here.

**In scope (from SPEC.md) — ORIGINAL P58 (LOCKED 2026-06-03, EXECUTED 2026-06-04):**
- 1 new types file: `src/coordination/delegation/pool-types.ts` (<= 60 LOC, exporting `DelegationPool`, `DelegationPoolEntry`, `DelegationLifecycleStatus`)
- 1 new method on `DelegationManager`: `getPoolSnapshot(): DelegationPool`
- 1 new optional field on `DelegationRecord`: `tmuxSessionId: string | null` (backward-compatible)
- 1 new method on `session-tracker`: `recordDelegationTerminal(delegationId, status, tmuxSessionId?)`
- 2 new event types on `SessionTrackerEvent`: `delegation-dispatched`, `delegation-terminal`
- 3 new actions on `tmux-copilot`: `forward-prompt`, `take-over`, `release`
- 1 new action on `delegation-status`: `pool`
- 1 new policy comment block on `src/tools/delegation/delegate-task.ts`
- 6 new BATS scenarios at `tests/scripts/tmux/62..67-*.bats` (one per gap, slot 67 per `58-CLOSE.md:184` resolved from initial 61 due to P56 collision)
- 1 extension to `tmux_bats_require_dist` in `tests/scripts/tmux/helpers.bash` (require `dist/coordination/delegation/pool-types.js`)
- Wiring at `src/plugin.ts:920-926` to respect `manualOverride` flag

**In scope (from SPEC.md) — P58-EXTENSION (NEW 2026-06-04, NOT YET EXECUTED):**
- 1 new method on `TmuxMultiplexer`: `capturePaneContent(paneId: string): Promise<{ content: string; capturedAt: number; byteLength: number }>` at `src/features/tmux/tmux-multiplexer.ts` (5000-char cap, 2-second timeout per AC-58-07-01)
- 1 new polling loop in `SessionManager` at `src/features/tmux/session-manager.ts`: 5-second cadence for active delegations; 15-second backoff when content stable (hash-based detection)
- 1 new in-memory event bus file: `src/features/session-tracker/streaming/child-event-stream.ts` (<= 100 LOC, NEW directory; bounded buffer last 100 events per session per D-58-29)
- 2 new actions on `delegation-status`: `peek` (REQ-58-07, orchestrator-tier), `progress` (REQ-58-10)
- 1 new action on `tmux-copilot`: `peek` (REQ-58-08, user-tier only via `USER_SESSION` permission tier)
- 1 new permission tier `USER_SESSION` on `tmux-copilot` for `take-over`/`release`/`peek` actions ONLY (NOT `send-keys` or `forward-prompt`)
- 1 behavioral change to `dispatch()` in `src/coordination/delegation/manager-runtime.ts:244`: `await sendPromptAsync` → `void sendPromptAsync(...).catch(...)` (true fire-and-forget) with pre-send `childSessionId` validation at line 230
- 1 comment fix at `src/tools/delegation/delegate-task.ts:32`: "always-background WaiterModel" → "true-fire-and-forget WaiterModel (P58.3)"
- 4 new BATS scenarios at `tests/scripts/tmux/71..74-*.bats` (slots 71–74, post-67, per D-58-21/24/27/31 — resolves the SPEC's slot 67-70 reference against the existing BATS 67 G1 grep-guard file at `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats`)
- 3 template/methodology updates: `.opencode/get-shit-done/templates/spec.md` (User-Pain Coverage section), `.opencode/get-shit-done/templates/verification.md` (Human-Driven UAT section), `.planning/ROADMAP.md` (Symptom Coverage Matrix section)
- 1 new governance file: `.planning/USER-PAIN-BACKLOG.md` with initial entries S1, S2, S3, S4 from `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17`

**Out of scope (from SPEC.md):**
- **No new `src/features/tmux/*.ts` modules** — existing 7 in-tree modules sufficient
- **No new tool registrations in `src/plugin.ts`** — P55's 27-tool-key invariant locked through P58-extension
- **No new `package.json` dependencies** — P20 invariant preserved
- **No new `.hivemind/` storage formats** — `state: "paused"` already exists in `persistence.ts`
- **No SDK upgrade** — compatible with `@opencode-ai/plugin >= 1.1.0`
- **No new plan mode for delegated agents** — G1 guard-rail explicitly forbids
- **No sidecar-driven tmux projection (SC-04, SC-05)** — P58 only adds data layer
- **No multi-user session concurrency (collision detection)** — single-user assumption preserved
- **No auto-refresh of visual dependency graph**
- **No migration of `appendTuiPrompt` to `showTuiToast`**
- **No changes to `manager.ts` action enum** (existing 7 actions unchanged)
- **No widening of `ORCHESTRATOR_AGENTS` whitelist beyond `USER_SESSION` for the 3 specific actions** (send-keys and forward-prompt remain orchestrator-only)
- **No automatic `client.session.subscribe()` SDK augmentation** (REQ-58-10 uses existing `chat.message` and `tool.execute.after` hooks, not new SDK subscription)
- **(NEW P58-extension) No new SC-* sidecar UI work** — SC-04 (Session Explorer Panel) and SC-05 (Delegation Dashboard Panel) consume the P58 data layer but their rendering is out-of-scope

</spec_lock>

<decisions>
## Implementation Decisions

### ORIGINAL P58 DECISIONS (D-58-01..17) — LOCKED 2026-06-03, EXECUTED 2026-06-04, NOT RE-DISCUSSED

The following 17 decisions are LOCKED and reflect the as-built state of the 6 G1–G6 gaps per `58-SUMMARY.md` and `58-CLOSE.md`. They are preserved here for the planner/researcher's reference and MUST NOT be re-litigated.

#### G1 — `delegate-task` guard-rail (REQ-58-01)

- **D-58-01:** G1 policy comment block uses the **verbatim text** from `58-SPEC.md:40` placed immediately above the `createDelegateTaskTool` function export. The 3-sentence block calls out the 3 concrete failure modes (delegation lifecycle, session-tracker events, tmux pane projection) so a future contributor can evaluate the trade-off before reaching for the SDK shortcut. Comment style matches the existing P50/P51 `[Harness]`-prefixed policy comments at the top of `integration.ts` and `persistence.ts`.
- **D-58-02:** G1 BATS scenario (`67-delegate-task-no-native-task-tool.bats`, renamed from slot 61 per `58-SUMMARY.md:45` to resolve the P56 collision) is a **single `@test` block** with 3 sequential `run --` assertions chained, with `grep -v '//'` comment-line filter per `58-SUMMARY.md:148` (the POLICY comment itself would otherwise match the bare import regex).

#### G2 — Programmatic pool status API (REQ-58-02)

- **D-58-03:** `DelegationManager` exposes a **read-only `__getDelegationsForTesting(): ReadonlyMap<string, DelegationRecord>` test seam** (private, `__`-prefixed) for BATS slot 62. The seam shares state with `lifecycle.list()` via a `__testPoolMap` field set by the `createForTest()` static factory (added in PLAN-07 per `58-SUMMARY.md:24-25` to bypass the readonly field at construction time).
- **D-58-04:** `getPoolSnapshot()` applies **deep `Object.freeze`** at the top-level `DelegationPool` and at each `DelegationPoolEntry`. `promptPreview` strings are auto-frozen as primitive values. `Date`-typed fields are not used; only numeric epochs and primitive strings.
- **D-58-05:** `DelegationPoolEntry.promptPreview` is **truncated to 200 chars** (hard cap) and **single-line** (`\n` → space, `\r` stripped, `\t` → space). Truncation suffix-ellipsizes with the literal `…` (U+2026). Implementation is `sanitizePreview(raw: string): string` colocated with the type definitions in `pool-types.ts`.

#### G3 — Abort+resume pane survival (REQ-58-03)

- **D-58-06:** `abortDelegation` calls `sessionManager.persist({ ...record, state: "paused" })` **directly inside the existing `abortDelegation` method** at `manager.ts:285-287` (after the `terminalFallback` decision branch). No new wrapper method.
- **D-58-07:** `resume` re-syncs the paneId **BEFORE re-sending the prompt**: `const respawned = await sessionManager.respawnIfKnown(tmuxSessionId); if (respawned?.paneId && respawned.paneId !== record.paneId) { record.paneId = respawned.paneId; await sessionManager.persist(record); } await coordinator.sendPromptAsync(record);`.
- **D-58-08:** `handleResume` calls `sessionManager.persist({ ...record, state: "ready" })` AFTER `sendPromptAsync` resolves, transitioning `paused → ready`. The transition fires on success only.

#### G4 — Forward-prompt action (REQ-58-04)

- **D-58-09:** Sentinel line format: **`[orchestrator-forward <new Date().toISOString()>]\n`** (UTC ISO-8601, single space, single `\n` separator). `new Date().toISOString()` matches the `emittedAt` convention from P25 trajectory events.
- **D-58-10:** `byteLength` return field uses **UTF-8 byte count** of the full delivered string (sentinel + text), computed via `Buffer.byteLength(payload, 'utf8')`. Reported as a number, not a string. The `deliveredAt` field is the same `new Date().toISOString()` value used in the sentinel.

#### G5 — Take-over / release actions (REQ-58-05)

- **D-58-11:** `take-over` action payload: **`{ sessionId, paneId, takenAt: ISO, takenBy: "human-operator" }`** (single-actor model). The `takenBy` field is a literal string constant `"human-operator"` for now; future multi-user phases will widen the type to `takenBy: string`.
- **D-58-12:** `forward-prompt` suppression response shape: **`{ suppressed: true, reason: "manualOverride", paneId: string, textPreview: string (first 80 chars), evaluatedAt: ISO }`**. Reason is a typed string literal union (`"manualOverride" | "session-not-found"` future-proofed).

#### G6 — Session-tracker delegation events (REQ-58-06)

- **D-58-13:** `emittedAt` is **`Date.now()` numeric (ms epoch)** for monotonic checks. Matches P25 trajectory's numeric timestamp convention (sort-friendly, integer arithmetic).
- **D-58-14:** `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` signature: **`status: DelegationLifecycleStatus` (typed union), `tmuxSessionId?: string | null`**. Called from 2 sites: `terminalFallback` path and `abortDelegation` path (with `status: "aborted"`).
- **D-58-15:** SC-01 SSE pool event filter is extended **as a string array** in `src/sidecar/sse-pool.ts`. The 3 new event types are added to the existing filter array literal. Filter checked via `filter.includes(eventType)`.

#### Cross-cutting (original)

- **D-58-16:** All 6 BATS scenarios use **`BATS_TEST_TMPDIR`-isolated state roots** via the P55 `tmux_bats_make_project` helper. BATS slot 62 uses in-memory `delegations` Map; slot 63 writes persistence files to `${BATS_TEST_TMPDIR}/project/.hivemind/state/tmux-sessions/`.
- **D-58-17:** SC-01 SSE pool subscription is wired at the **`src/sidecar/sse-pool.ts` filter list** only. The `src/sidecar/delegation-tool-proxy.ts` route is **NOT modified**.

#### the agent's Discretion (original — D-58-18..29 in original numbering, preserved as 12 items)

The implementer has flexibility for these implementation details (no SPEC constraint, no user preference captured — `--auto` mode):

- Exact JSDoc depth on `DelegationPool` / `DelegationPoolEntry` / `DelegationLifecycleStatus`
- Specific `run --` vs `assert_success` style within BATS
- Order of policy comment sentences in G1
- Whether to extract the `getPoolSnapshot` / `__getDelegationsForTesting` pair as a separate test-helper module
- Specific `grep -E` regex flavor in the G1 BATS
- Exact `BATS_TEST_NUMBER` interpolation in session names
- Whether the `manualOverride` flag is top-level or nested under `policy: { manualOverride: boolean }`
- Specific `Object.freeze` ordering in `getPoolSnapshot`
- Whether `DelegationPool.capturedAt` uses `Date.now()` or `new Date().getTime()`
- Whether the 3 new SSE pool event types are added in insertion or alphabetical order
- Whether G6 BATS slot 66 uses `__testEventLog` seam or a mock event listener
- Whether `recordDelegationTerminal` is a top-level method or a method on a new `DelegationEventEmitter` sub-class

---

### P58-EXTENSION DECISIONS (D-58-18..34) — LOCKED 2026-06-04 (this update)

Per `--auto` mode, all 5 gray areas (S1, S2, S3, S4, META) were auto-selected; the recommended option was chosen for each. All decisions below are LOCKED and the implementer MUST follow them when building PLAN-08 (S1+S2) and PLAN-09 (S3+S4+META).

#### S1 — Live tmux pane content streaming (REQ-58-07)

- **D-58-18:** `capturePaneContent(paneId)` lives on **`TmuxMultiplexer`** as a new public method (single owner of tmux subprocess invocations per P51 boundary). Implementation: `tmux capture-pane -t <paneId> -p` with 5000-char content cap (matches tmux's `-S -5000` semantic for last-5000-lines) and 2-second `Promise.race` timeout (kills the child process on timeout, returns `{ content: "", capturedAt: Date.now(), byteLength: 0, timedOut: true }`). **DO NOT** extract to a new module — the polling-loop owner is `SessionManager` (D-58-19), not a separate capture module.
- **D-58-19:** Polling loop lives in **`SessionManager`** at `src/features/tmux/session-manager.ts` (existing owner of pane-monitor pattern from P53). Cadence: **5 seconds** for active delegations (`status: "dispatched" | "running" | "paused"`); **15 seconds** when content is stable (SHA-256 hash of the captured content matches the previous capture's hash). Per-session `setTimeout` is preferred over `setInterval` to avoid overlapping captures. Backoff resets to 5s on any content change. The loop is keyed by `tmuxSessionId` and tracks per-pane state in a `Map<tmuxSessionId, { lastContentHash: string, lastCapturedAt: number, stableTicks: number }>` field on the `SessionManager` instance. **DO NOT** add a new event to the P53 `pane-captured` event payload (would break SC-01 SSE pool consumers per T-58-07-T3 risk) — emit a NEW event `pane-content-captured` (separate discriminator) with the full content payload.
- **D-58-20:** `peek` action exists on **BOTH** `delegation-status` (orchestrator-tier, REQ-58-07) AND `tmux-copilot` (user-tier, REQ-58-08). Both share the SAME backing `capturePaneContent()` method on `TmuxMultiplexer` (single source of truth for capture logic) but have separate Zod schemas (per SPEC AC-58-08-02). `delegation-status peek` accepts `{ action: "peek", delegationId?: string, paneId?: string, maxBytes?: number }`; `tmux-copilot peek` accepts `{ action: "peek", paneId: string, maxBytes?: number }` (paneId-only — no delegationId lookup path for user-tier). Tool key count remains 27.
- **D-58-21:** **BATS slot numbering resolution**: The SPEC's `58-SPEC.md:197` references "slot 67" for `58-panel-live-update.bats`, but **BATS 67 is already used** by the G1 grep-guard at `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats` (per `58-SUMMARY.md:45` and `58-CLOSE.md:184`). Per the existing P58 pattern (slots 62–67), the 4 new BATS scenarios are numbered **slots 71–74** (post-67, gap of 4 slots to leave room for future P58.1/P58.2 follow-up phases that may also need BATS slots). Concretely: `71-panel-live-update.bats` (S1), `72-user-inject.bats` (S2), `73-stream-stays-open.bats` (S3), `74-progress-mid-flight.bats` (S4). The SPEC's AC-58-07-03/08-03/09-03/10-03 are amended to reference the new slot numbers — the SPEC's intent is preserved (one BATS per symptom); the file naming resolves the collision. **DO NOT** move the G1 BATS from slot 67 (would break the 58-SUMMARY.md:184 evidence trail).

#### S2 — User-actor affordance for tmux-copilot (REQ-58-08)

- **D-58-22:** `USER_SESSION` permission tier is a **new exported constant** in `src/tools/tmux-copilot.ts:51` (added BELOW the existing `ORCHESTRATOR_AGENTS` array at line 51, NOT inside it): `export const USER_SESSION_TIERS = new Set(["user", "__user__"] as const);`. The two names are the user-actor detection sentinels per D-58-23. Actions gated: `take-over`, `release`, `peek` ONLY. The gate is action-level (per-action whitelist), not tool-level (whole-tool whitelist). Implementation: in the runtime permission check at `src/tools/tmux-copilot.ts:175-180` (current line per P49 widening), check `if (USER_SESSION_TIERS.has(context.agent) && USER_SESSION_ALLOWED_ACTIONS.has(input.action)) return allow();` BEFORE the orchestrator-tier check. The `USER_SESSION_ALLOWED_ACTIONS` is a `Set<TmuxCopilotAction["action"]>` literal: `new Set(["take-over", "release", "peek"] as const)`. **DO NOT** widen `ORCHESTRATOR_AGENTS` (preserves P52 invariant `52-SPEC.md:63`).
- **D-58-23:** User-actor detection accepts **BOTH** `context.agent === "user"` AND `context.agent === "__user__"` (the `__user__` sentinel is for explicit invocation from the TUI session when the natural agent name is not "user"). The `__user__` sentinel is required because the TUI session's `context.agent` may be the active model provider name (e.g., `"anthropic/claude-sonnet-4-5"`) rather than the literal string `"user"`. The sentinel is set by the TUI's user-invocation path at `src/plugin.ts` (TUI hook) when forwarding a tool call to the harness.
- **D-58-24:** **REGRESSION GUARD enforcement** (D-58-22 / D-58-23 must NOT bypass AC-58-08-04): the `manualOverride` check at `src/plugin.ts:923-926` and `src/tools/tmux-copilot.ts:264-275` (forward-prompt) happens **BEFORE** the user-tier check in the action handler (defense in depth). The `forward-prompt` action's `manualOverride` check is NOT affected by the USER_SESSION tier widening because `forward-prompt` is NOT in the `USER_SESSION_ALLOWED_ACTIONS` set (per D-58-22). Verification: **BATS slot 65 (G5 takeover-release) and slot 64 (G4 forward-prompt) MUST continue to exit 0** after the USER_SESSION tier is added. The CI runner is updated to re-run both BATS scenarios as part of the P58-extension acceptance.

#### S3 — WaiterModel keep-alive (REQ-58-09)

- **D-58-25:** `void sendPromptAsync(this.client, delegation.childSessionId, promptBody).catch(err => logger.error({ err, dispatchId: delegation.id }, "background sendPromptAsync failed"))` at `src/coordination/delegation/manager-runtime.ts:244` (replaces the current `await sendPromptAsync(...)` on line 244). The fire-and-forget pattern ensures the dispatch() function returns BEFORE the SDK has acknowledged the prompt, keeping the orchestrator's main turn open. The `.catch` handler logs at `error` level but does NOT throw — the dispatch is "best effort" once the prompt has been sent; failures are visible in the journal/observability layer, not the orchestrator's main loop. **DO NOT** add a background worker / queue — minimal change preserves the existing dispatch chain structure.
- **D-58-26:** **Pre-send validation** at `src/coordination/delegation/manager-runtime.ts:230` (BEFORE the fire-and-forget): `if (!delegation.childSessionId || typeof delegation.childSessionId !== "string") { throw new [Harness]Error(\`dispatch ${delegation.id}: spawnDelegatedSession returned invalid childSessionId: \${delegation.childSessionId}\`); }`. This synchronous throw preserves error handling for spawn failures (the orchestrator's tool call still gets the error). After the validation passes, the fire-and-forget fires; the orchestrator's turn continues.
- **D-58-27:** **Comment fix** at `src/tools/delegation/delegate-task.ts:32` — change `"always-background WaiterModel"` to `"true-fire-and-forget WaiterModel (P58.3)"`. The fix is **verbatim** per SPEC AC-58-09-04. The BATS test (slot 73 per D-58-21) verifies via `grep -c 'true-fire-and-forget WaiterModel (P58.3)' src/tools/delegation/delegate-task.ts` returns `>= 1` AND `! grep -c 'always-background WaiterModel'` (the old text is absent). The fix is a 1-line text edit, not a behavior change — the behavior is fixed at line 244 per D-58-25.

#### S4 — Real-time child event streaming (REQ-58-10)

- **D-58-28:** Event bus file: `src/features/session-tracker/streaming/child-event-stream.ts` (new file, <= 100 LOC per SPEC In Scope, in a NEW subdirectory `src/features/session-tracker/streaming/`). Public surface: `subscribe(sessionId: string, listener: (event: ChildEvent) => void): () => void` (returns unsubscribe), `recordEvent(sessionId: string, event: ChildEvent): void` (called by the SDK event hook). The file is a sibling of `capture/` and `persistence/` (existing subdirs in `src/features/session-tracker/`). Bounded buffer: last **100 events per sessionId** (drops oldest on overflow). Implementation: `Map<sessionId, { events: RingBuffer<ChildEvent>, listeners: Set<Listener> }>`. Memory bound: 100 events × ~500 bytes/event × N active delegations = bounded. T-58-07-T3 risk (delegationEventLog unbounded) is accepted for the original G6 per `58-CLOSE.md:179`; the new event bus applies the same risk profile with the 100-event cap as a tighter bound.
- **D-58-29:** **Subscription hook** at `src/coordination/delegation/coordinator.ts:200` (per SPEC target, "when a delegation is dispatched, subscribe to that child session's event stream"). Implementation: `onChildSessionCreated((sessionId) => childEventStream.subscribe(sessionId, listener))` where `listener` forwards to the in-memory bus. **Unsubscribe** at `recordDelegationTerminal` call site (REQ-58-06's terminal event from D-58-14) — the bus drops the per-session entry on terminal.
- **D-58-30:** `progress` action on `delegation-status` returns **`{ delegationId: string, actionCount: number, messageCount: number, toolCallCount: number, lastEvent: { eventType: string, emittedAt: number, payload: { toolName?: string, thought?: string, message?: string } } | null, capturedAt: number }`**. `lastEvent` is from the in-memory bus (per D-58-28), not from the counter-based `progressPct` calculation. Counters are record-based (from `DelegationRecord.actionCount` etc. fields). `capturedAt` is `Date.now()` numeric epoch (matches D-58-13 convention). The action count on `delegation-status` grows from **7 to 8** (`status, get, list, control, find-stackable, pool, peek, progress`).
- **D-58-31:** `delegation-status peek` (REQ-58-07) and `delegation-status progress` (REQ-58-10) are **separate actions** with separate Zod schemas and separate case branches in the discriminated union. They do NOT share an action name (peek returns content; progress returns counters+lastEvent). The orchestrator can call either independently. **DO NOT** merge them into a single `live` action — the SPEC AC-58-07-02 and AC-58-10-02 have distinct response shapes.

#### META — Process changes to prevent recurring gaps (REQ-58-META)

- **D-58-32:** `.planning/USER-PAIN-BACKLOG.md` is **created** with initial entries S1, S2, S3, S4 **verbatim** from `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17`. Each entry has: `{id: "S{N}", date: "2026-06-04", symptom: <verbatim one-liner>, owned_phase: "P58-extension", status: "OPEN", source: ".planning/debug/p58-symptom-diagnosis-2026-06-04.md:{line}"}`. The file is `.planning/`-rooted (NOT under `.planning/phases/58-.../` — it is a cross-phase governance file, accessible to all future SPECs).
- **D-58-33:** The `## User-Pain Coverage` section template is added to `.opencode/get-shit-done/templates/spec.md` (after `## Acceptance Criteria` and before `## Ambiguity Report`). The template content (verbatim, per SPEC AC-58-META-01): each open symptom in `.planning/USER-PAIN-BACKLOG.md` is mapped to `addresses` (this phase fixes it) | `defers-to-P{N}` (a follow-up phase owns the fix; cross-link to that phase's SPEC required) | `not-relevant` (with 1-line justification). The `gsd-spec-phase` workflow gate (at `workflows/spec-phase.md` or the skill equivalent) is updated to fail SPEC.md commit if the section is missing OR if any open symptom is `defers-to-P{N}` with `N > current` AND no cross-link to the follow-up SPEC is provided. **DO NOT** make the section a 1-line bullet — the 3-option disposition per symptom is mandatory for traceability.
- **D-58-34:** The `## Human-Driven UAT` section template is added to `.opencode/get-shit-done/templates/verification.md` (after the existing test-result section). Template content (verbatim, per SPEC AC-58-META-02): `{ Date: {date}, Tester: {human user name — NOT "gsd-verifier" or "gsd-executor"}, Surfaces tested: {list of user-facing surfaces from REQ-58-META-01 step 1}, Procedure: {numbered steps the tester actually performed}, Verdict: PASS | FAIL | PARTIAL — {1-line reason per symptom tested} }`. The `gsd-verify-work` workflow is updated to enforce: (a) section presence is a HARD FAIL; (b) verdict `PASS` or `PARTIAL-with-explicit-follow-up` is required to ship (a `FAIL` verdict or missing section is a HARD FAIL).
- **D-58-35:** `.planning/ROADMAP.md` gets a `## Symptom Coverage Matrix` section (per SPEC AC-58-META-03). Initial entries (added atomically with the P58-extension close): S1, S2, S3, S4 with `Owned Phase = P58-extension`, `Status = OPEN`, `Last Updated = 2026-06-04`, `Source = .planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17`. The `gsd-update` workflow (or equivalent ROADMAP.md mutation handler) is updated to require the matrix update as part of any phase close. A phase cannot close (`[x]` in ROADMAP) without a corresponding matrix update — this is enforced by the close-pivot gate at `gsd-complete-milestone` / `gsd-close-phase`.
- **D-58-36:** **META-04: REAL UAT enforcement** — for the P58-extension re-ship, the `58-VERIFICATION.md` MUST have a `## Human-Driven UAT` section where the human user (the front-facing operator who filed the original complaint) signs off on S1, S2, S3, S4 being fixed. The BATS regression (slots 62–67 + 71–74) is necessary but NOT sufficient. The `gsd-verify-work` workflow's PASS verdict gate is updated to require the human tester entry before `VERIFIED — Ready to Ship` can be issued. **DO NOT** allow `gsd-verifier` or `gsd-executor` to fill in the tester field — automated padding defeats the regression-guard purpose.

#### Cross-cutting (P58-extension)

- **D-58-37:** **27-tool-key invariant preserved**: extension adds 2 new actions to `delegation-status` (peek, progress; grows from 6 to 8 actions) and 1 new action to `tmux-copilot` (peek; grows from 7 to 8 actions). Total: 0 new tool keys, 0 new `package.json` deps, 0 new `src/features/tmux/*.ts` modules. The 1 new file `src/features/session-tracker/streaming/child-event-stream.ts` is a session-tracker module (NOT a tmux module), so the P58 SPEC's "no new `src/features/tmux/*.ts`" invariant is preserved.
- **D-58-38:** **RED-FIRST TDD discipline** (per SPEC AC-58-07-04, AC-58-08-05, AC-58-09-05, AC-58-10-05): each new REQ (07–10) authors its BATS test BEFORE the implementation; commit messages include `(red)` marker for the failing-test commit and `(green)` for the passing commit. META changes (template updates, USER-PAIN-BACKLOG.md, ROADMAP.md matrix) are documentation-only and do NOT require TDD cycles. The TDD marker is a string suffix in the commit subject: `phase-58: PLAN-08 S1 — capturePaneContent (red)` and `phase-58: PLAN-08 S1 — capturePaneContent + BATS 71 (green)`.
- **D-58-39:** **Extension BATS scenarios use `BATS_TEST_TMPDIR` isolation** via the P55 `tmux_bats_make_project` helper. Slot 71 (S1) uses real tmux + `cat` (15s budget per AC-58-07-03); slot 72 (S2) uses a fake session record (10s budget per AC-58-08-03); slot 73 (S3) uses 60s wait + real dispatch (75s budget per AC-58-09-03); slot 74 (S4) uses 3s wait + real dispatch (15s budget per AC-58-10-03). Total BATS runtime budget for the 4 extension scenarios: ~115s. Combined with the 6 original scenarios (~50s) + 5 P55 regression scenarios (~30s) = ~195s total. The 5-min CI budget is preserved.

#### the agent's Discretion (extension — D-58-40..49 in numbering, 10 items)

The implementer has flexibility for these implementation details (no SPEC constraint, no user preference captured — `--auto` mode):

- Exact JSDoc depth on `capturePaneContent` / `ChildEvent` / `DelegationEventBase` types (each must have a docstring; depth is at implementer's discretion)
- Specific `setTimeout` vs `setInterval` choice for the polling loop in `SessionManager` (both work; `setTimeout` is recommended for backoff-safety)
- Whether the `RingBuffer<ChildEvent>` is a hand-rolled data structure or uses an existing library (hand-rolled matches the project's no-new-deps invariant)
- Exact SHA-256 truncation length for content-stable detection (8 hex chars = 32 bits is sufficient; full 64 chars is also fine)
- Whether the `USER_SESSION` tier is granted via a single `Set` membership check or a switch statement (both work; Set is recommended for action-list growth)
- Specific `__user__` sentinel value (could be `"__user__"`, `"tui-user"`, or `"human-operator"` — current decision is `"__user__"`)
- Order of `take-over` / `release` / `peek` entries in the `USER_SESSION_ALLOWED_ACTIONS` Set (insertion or alphabetical; cosmetic)
- Whether the `progress` action's `lastEvent` field uses a single `payload: { ... }` or a typed discriminated union per event type (single-payload is simpler; discriminated union is type-safer)
- Whether the `.planning/USER-PAIN-BACKLOG.md` initial entries use YAML frontmatter or markdown-only (markdown-only is simpler; YAML is parseable)
- Specific phrasing in the `## Human-Driven UAT` verdict field (PASS/PARTIAL/FAIL is mandatory; 1-line reason is recommended but the implementer may extend)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing the P58-extension.**

### SPEC and Phase Documents (extension-aware)
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SPEC.md` — **LOCKED spec** with 11 requirements (6 original REQ-58-01..06 + 5 extension REQ-58-07..10 + REQ-58-META), 37 acceptance criteria, in-scope/out-of-scope lists, 6-round auto-mode interview log + 1 EXT-1 round for the extension; ambiguity gate PASSED at 0.0775 ≤ 0.20
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-RESEARCH.md` — Research drifts Q1–Q3 (SessionTrackerEvent union, SC-01 filter, sendKeys hybrid mock) — all addressed in D-58-13..15
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PATTERNS.md` — 8 frozen patterns (G1–G6). The P58-extension does NOT add new patterns — it extends the existing patterns (per D-58-18..31 above)
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-CLOSE.md` — 2026-06-04 closeout for the original 6 REQs; 6/6 BATS green, 13/13 ACs, 27 atomic commits, 3,310 vitest pass. Use as the **execution evidence baseline** for the extension — the extension MUST NOT regress on these numbers
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-SUMMARY.md` — 2026-06-04 PLAN-07 execution summary; 5 execution gaps fixed (createForTest, __setTmuxMultiplexerForTesting, module-level recordDelegationTerminal, BATS 67 renumbering)
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION.md` — Independent gsd-verifier verdict (L1 evidence)
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION-REPORT.md` — 10/10 PASS verification report
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-META-ANALYSIS.md` — **CRITICAL for P58-extension** — root cause of the 4 user-visible symptoms + 3 process changes (META-01..03). Sections 5.1-5.3 are the template/VERIFICATION/ROADMAP design source
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-CHECK.md` — gsd-plan-checker PASS verdict for the original 6 REQs
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-PLAN-01..07.md` — 7 PLANs for the original 6 REQs. The P58-extension will add PLAN-08 (S1+S2) and PLAN-09 (S3+S4+META)
- `.planning/ROADMAP.md:510-520` — P58 phase entry with goal, dependencies, and post-extension status (the Symptom Coverage Matrix will be added here per D-58-35)
- `.planning/STATE.md` — Current phase state; P58-extension close will update the trajectory

### P58-Extension Source Documents (MANDATORY reading)
- `.planning/debug/p58-symptom-diagnosis-2026-06-04.md` — **Symptom definitions** S1–S4 with code:line citations for each gap. Lines 6–19 enumerate the 4 symptoms; lines 24–64 detail the implementation context for each
- `.planning/debug/tmux-delegate-streaming-gaps.md` — **Detailed gap analysis** for S1 (lines 60–75), S2 (lines 77–103), S3 (lines 105–174), S4 (lines 175–211). Lines 300–356 cover the 3 process changes
- `.planning/USER-PAIN-BACKLOG.md` — **NEW file (D-58-32)** — initial entries S1–S4 with source citations; will be the canonical source-of-truth for future SPECs to cross-reference

### Roadmap, Requirements, Templates
- `.planning/ROADMAP.md:510-520` — P58 phase entry: "tmux-orchestration-programmatic-pool-interactive-delegate: Close 6 architectural gaps..."
- `.planning/REQUIREMENTS.md` — Requirement registry (P58 traces to f-06 Multi-lane delegation, f-07 Trajectory, SIDECAR-01)
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; `src/features/tmux/` is the feature layer (P51–P55 deliverables); `src/features/session-tracker/` is the session-tracking layer
- `.planning/codebase/STRUCTURE.md` — File placement: `src/coordination/<feature>/<role>.ts` for coordination modules; `src/features/<feature>/<role>.ts` for feature modules. The new `src/features/session-tracker/streaming/child-event-stream.ts` follows this pattern
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read, no `any`

### GSD Templates (D-58-33..35 will modify these)
- `.opencode/get-shit-done/templates/spec.md` — **Will be extended** with `## User-Pain Coverage` section per D-58-33
- `.opencode/get-shit-done/templates/verification.md` — **Will be extended** with `## Human-Driven UAT` section per D-58-34
- `.opencode/get-shit-done/workflows/spec-phase.md` (or equivalent) — **Will be updated** to enforce the User-Pain Coverage section per D-58-33
- `.opencode/get-shit-done/workflows/verify-work.md` (or equivalent) — **Will be updated** to enforce the Human-Driven UAT section per D-58-34
- `.opencode/get-shit-done/workflows/complete-milestone.md` (or equivalent ROADMAP.md mutation handler) — **Will be updated** to require the Symptom Coverage Matrix update per D-58-35

### Source Code (read-only references for P58-extension implementer)

#### Tmux Feature Layer (S1 targets)
- `src/features/tmux/tmux-multiplexer.ts` (P51, ~400 LOC) — `TmuxMultiplexer` class; target of new `capturePaneContent(paneId)` method per D-58-18. The 5000-char cap and 2s timeout are SPEC-mandated (AC-58-07-01)
- `src/features/tmux/session-manager.ts` (P51 + P54, 332 LOC) — `SessionManager` 7-param constructor; target of new polling loop per D-58-19. The P53 pane-monitor pattern (5s/15s backoff) is the precedent
- `src/features/tmux/integration.ts` (P51) — silent-fallback contract per D-04 (P50/P51, preserved through P58-extension)
- `src/features/tmux/persistence.ts` (P54, 400 LOC) — `createSessionPersistence` factory; `SessionState` union already includes `paused`; the G3 abort+resume wiring at `manager.ts:285-287` is the reference for the S1 polling loop's persist call

#### Session-Tracker (S2, S4, META-01 targets)
- `src/features/session-tracker/types.ts` (P58 G6) — `SessionTrackerEvent` discriminated union at lines 95-98 with 3 new event types (`delegation-queued`, `delegation-dispatched`, `delegation-terminal`); S4's `ChildEvent` type is a NEW separate union in `streaming/child-event-stream.ts` (per D-58-28)
- `src/features/session-tracker/tool-delegation.ts` (P25.1 + P58 G6, 583 LOC) — `recordChildTaskDelegation()` and module-level `recordDelegationTerminal()`; S4's subscription hook at `coordinator.ts:200` (per D-58-29) calls `childEventStream.subscribe()`
- `src/features/session-tracker/index.ts` (P25.1) — in-memory `Map<sessionId, SessionRecord>`; the `USER_SESSION` tier's session-lookup path goes through this map
- `src/features/session-tracker/streaming/child-event-stream.ts` — **NEW FILE (D-58-28)** — in-memory event bus; bounded buffer last 100 events per session

#### Coordination Layer (S3, S4 targets)
- `src/coordination/delegation/manager-runtime.ts` (P58, ~280 LOC) — `dispatch()` function; target of S3 fire-and-forget change at line 244 per D-58-25. Pre-send validation at line 230 per D-58-26
- `src/coordination/delegation/manager.ts` (P24 + P51 + P58, 580 LOC) — `DelegationManager` class; the S4 subscription hook at `coordinator.ts:200` references `manager.getDelegation(delegationId)` for the sessionId lookup
- `src/coordination/delegation/coordinator.ts` (P24) — `dispatch()` and `sendPromptAsync` paths; S4 subscription hook at line 200 (per D-58-29)
- `src/coordination/delegation/pool-types.ts` (P58, 126 LOC) — `DelegationPool` frozen contract; not directly modified by the extension but `delegation-status pool` action (existing) is referenced for orchestrator parity

#### Tools (S1, S2 targets)
- `src/tools/delegation/delegation-status.ts` (P24.3.2 + P58, 780+ LOC) — 6-action tool (`status, get, list, control, find-stackable, pool`); extension adds 2 more actions: `peek` (S1, D-58-20) and `progress` (S4, D-58-30). Action count grows from 6 to 8
- `src/tools/tmux-copilot.ts` (P43 + P49 + P58, 351 LOC) — 7-action tool (`send-keys, list-panes, compute-grid, respawn, forward-prompt, take-over, release`); extension adds 1 more action: `peek` (S2, D-58-22). Action count grows from 7 to 8. `ORCHESTRATOR_AGENTS` array at line 51 — extension adds `USER_SESSION` constant BELOW (per D-58-22, not inside the existing array)
- `src/tools/delegation/delegate-task.ts` (P24 + P58, 23-99 LOC range) — `createDelegateTaskTool` factory; G1 policy comment at line 6 + S3 comment fix at line 32 per D-58-27. The 5-line fix at line 32 is documentation-only (text change); the behavior change is at `manager-runtime.ts:244` per D-58-25

#### Plugin Wiring (S2 REGRESSION GUARD target)
- `src/plugin.ts:920-926` — `appendTuiPrompt` wrapper; G5 manualOverride check (PRESERVED per AC-58-08-04). The S2 USER_SESSION tier does NOT modify this check; user-tier callers still go through the manualOverride check first
- `src/sidecar/sse-pool.ts` (SC-01) — event filter list (string array); G6 3 new event types already added (per D-58-15). S4's `ChildEvent` events flow through a NEW filter category (NOT through the existing `delegation` filter); the new category is `child-activity` (per D-58-28, separate discriminator)

### Test Targets (P58-extension)
- `tests/scripts/tmux/helpers.bash` (P51–P58, ~63 LOC) — BATS test infrastructure. **Will be extended** to add `dist/features/session-tracker/streaming/child-event-stream.js` to `tmux_bats_require_dist`'s dist artifact list
- `tests/scripts/tmtm/67-delegate-task-no-native-task-tool.bats` (P58 G1, 45 LOC) — PRESERVED at slot 67. The extension renumbers to slots 71–74 per D-58-21 (NOT moving the G1 file)
- `tests/scripts/tmux/71-panel-live-update.bats` — **NEW FILE** (REQ-58-07, slot 71, per D-58-21)
- `tests/scripts/tmux/72-user-inject.bats` — **NEW FILE** (REQ-58-08, slot 72, per D-58-21)
- `tests/scripts/tmux/73-stream-stays-open.bats` — **NEW FILE** (REQ-58-09, slot 73, per D-58-21; 75s budget per AC-58-09-03)
- `tests/scripts/tmux/74-progress-mid-flight.bats` — **NEW FILE** (REQ-58-10, slot 74, per D-58-21; 15s budget per AC-58-10-03)
- `tests/integration/hook-registration.test.ts` (P49, ~150 LOC) — vitest test asserting 27 tool keys — MUST continue to pass after extension (D-58-37 invariant)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC, no `any`
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51, preserved through P58) — Graceful-fallback contract: no throw on missing prerequisites or filesystem errors
- D-53-13 (P53, preserved through P58) — `schemaVersion` is a numeric literal (not a string) — applied to `DelegationPool.schemaVersion: 1`
- R-P50-03 — `.hivemind/{journal,state/tmux-sessions}/*` is local runtime state, never committed
- P20 invariant — No new `package.json` dependencies (preserved through P58-extension)
- 27-tool-key invariant — No new tool registrations in `src/plugin.ts` (preserved through P58-extension; D-58-37)
- P55 L1 evidence preservation — the 4 BATS scenarios at slots 57–60 must continue to exit 0
- P58 L1 evidence preservation — the 6 BATS scenarios at slots 62–67 must continue to exit 0 (D-58-21 renumbering to 71–74 does NOT touch the original 62–67)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (original P58 — D-58-01..17 references; PRESERVED through extension)
- **`src/features/tmux/persistence.ts:createSessionPersistence`** (P54, 400 LOC) — `SessionState` union already includes `paused` literal; G3 abort+resume reuses `persist()` directly. The `__stateRoot` test seam is the precedent for `__getDelegationsForTesting`
- **`src/features/tmux/session-manager.ts:respawnIfKnown(tmuxSessionId)`** (P54) — Returns a `paneId` (or null if no live pane). G3 calls this in `resume` BEFORE re-sending the prompt
- **`src/tools/tmux-copilot.ts:tmuxCopilotTool`** (P43 + P49 + P58, 351 LOC) — 8-action discriminated union after extension; G4 + G5 + S2 (peek) add 4 actions total
- **`src/tools/delegation/delegation-status.ts:delegationStatusTool`** (P24.3.2 + P58, 780+ LOC) — 8-action discriminated union after extension; G2 + S1 (peek) + S4 (progress) add 3 actions total
- **`src/features/session-tracker/tool-delegation.ts:recordChildTaskDelegation()` + module-level `recordDelegationTerminal()`** (P25.1 + P58) — Record `delegation-queued` / `delegation-dispatched` / `delegation-terminal` events; the new `child-event-stream.ts` (D-58-28) extends this with real-time child activity events
- **`src/coordination/delegation/manager.ts:DelegationManager.delegations`** (P24 + P58) — In-memory `Map<delegationId, DelegationRecord>` with `__testPoolMap` (P58 PLAN-07); G2 reads via `__getDelegationsForTesting`, G3 writes to it on `tmuxSessionId` field addition
- **`src/features/tmux/tmux-multiplexer.ts:TmuxMultiplexer.spawnPane()`** (P51) — `opencode attach` invocation pattern; the new `capturePaneContent` method (D-58-18) follows the same `tmux` subprocess invocation pattern but uses `capture-pane` instead of `send-keys`
- **`src/features/session-tracker/types.ts:SessionTrackerEvent` discriminated union** (P58 G6, lines 95-98) — 3-event contract; the new `ChildEvent` discriminated union in `streaming/child-event-stream.ts` (D-58-28) is a SEPARATE union, NOT an extension of `SessionTrackerEvent` (would break the frozen contract)

### Established Patterns
- **`__`-prefixed test seams** — `__stateRoot` (P54 persistence), `__waitForPendingRetries` (P53 pane-monitor), `__testEventLog` (P25.1 trajectory), `__getDelegationsForTesting` (P58 G2), `__setTmuxMultiplexerForTesting` (P58 PLAN-07). The new `child-event-stream.ts` does NOT need a `__`-prefixed seam (the bus is a public, in-memory data structure; tests use the public subscribe/recordEvent API)
- **BATS scenario structure** — `setup()` → `tmux_bats_require_dist` + `tmux_bats_make_project` → `@test "..."` blocks → `teardown()` with `tmux kill-session` cleanup. The 4 extension BATS (slots 71–74) follow the same structure
- **Grep-based regression guards** — P55 slot 60 + P58 slot 67 used grep-based BATS to assert absence of a string pattern; the S3 comment-fix verification (D-58-27) follows the same pattern (`grep -c 'true-fire-and-forget WaiterModel'` returns `>= 1`)
- **Real OS process survival** — Per P55 D-55-05 / P56 D-56-07, all BATS scenarios must exercise real tmux sessions, no mocks. P58-extension slots 71 (S1) and 73 (S3) use real `tmux new-session` + `cat` / `sleep` placeholders. Slot 72 (S2) uses a fake session record (no real tmux needed). Slot 74 (S4) uses a real dispatch with 3s wait
- **`BATS_TEST_TMPDIR` isolation** — Each BATS test gets a fresh temp dir auto-cleaned. The 4 extension BATS scenarios use the same pattern
- **`schemaVersion: 1` numeric literal** — Per D-53-13, `schemaVersion` MUST be a numeric literal (not a string). The new `child-event-stream.ts` does NOT introduce a `schemaVersion` (the bus is in-memory only, no persistence); if a future phase adds persistence, the same numeric-literal convention applies
- **Frozen JSON contract for SSE transport** — `JSON.stringify` round-trip preservation is the testable contract; `Object.freeze` enforces the immutability invariant at the TypeScript level. The new `capturePaneContent()` return value is NOT frozen (the polling loop mutates `lastContentHash`); only the public-facing tool responses (delegation-status peek, tmux-copilot peek) are frozen via the existing tool envelope
- **RED-FIRST TDD discipline** — Per D-58-38, each new REQ authors its BATS test BEFORE the implementation. The 4 extension BATS scenarios will be committed with `(red)` markers first
- **Single-actor `takenBy: "human-operator"`** — Per D-58-11 (preserved); the S2 USER_SESSION tier does NOT widen this (single-user assumption preserved per SPEC OOS line 178)

### Integration Points (P58-extension)
- **`src/features/tmux/tmux-multiplexer.ts:TmuxMultiplexer`** — New method `capturePaneContent(paneId: string): Promise<{ content: string; capturedAt: number; byteLength: number }>` (D-58-18)
- **`src/features/tmux/session-manager.ts:SessionManager`** — New polling loop with 5s/15s backoff per D-58-19; new per-pane state map; new `pane-content-captured` event emission
- **`src/features/session-tracker/streaming/child-event-stream.ts`** (NEW FILE) — Event bus per D-58-28; `subscribe()` + `recordEvent()` public API; bounded buffer per session
- **`src/coordination/delegation/coordinator.ts:200`** — Subscription hook per D-58-29; unsubscribe at `recordDelegationTerminal` call site
- **`src/coordination/delegation/manager-runtime.ts:244`** — Fire-and-forget change per D-58-25
- **`src/coordination/delegation/manager-runtime.ts:230`** — Pre-send validation per D-58-26
- **`src/tools/tmux-copilot.ts:51-56`** — New `USER_SESSION_TIERS` constant per D-58-22 (BELOW `ORCHESTRATOR_AGENTS`, not inside)
- **`src/tools/tmux-copilot.ts:175-180`** — Permission gate extension per D-58-22; user-tier check BEFORE orchestrator-tier check
- **`src/tools/tmux-copilot.ts:264-275`** — REGRESSION GUARD preserved: `forward-prompt`'s `manualOverride` check is NOT bypassed by the user-tier widening (per D-58-24)
- **`src/tools/delegation/delegation-status.ts`** — 2 new actions (`peek`, `progress`) per D-58-20 and D-58-30; action count grows from 6 to 8
- **`src/tools/tmux-copilot.ts`** — 1 new action (`peek`) per D-58-22; action count grows from 7 to 8
- **`src/tools/delegation/delegate-task.ts:32`** — Comment fix per D-58-27 (1-line text change, no behavior change)
- **`tests/scripts/tmux/helpers.bash:tmux_bats_require_dist`** — Extension adds `dist/features/session-tracker/streaming/child-event-stream.js` to the dist artifact list
- **`.planning/USER-PAIN-BACKLOG.md`** — NEW FILE per D-58-32 (created with initial entries S1–S4)
- **`.opencode/get-shit-done/templates/spec.md`** — Modified per D-58-33 (add `## User-Pain Coverage` section)
- **`.opencode/get-shit-done/templates/verification.md`** — Modified per D-58-34 (add `## Human-Driven UAT` section)
- **`.planning/ROADMAP.md`** — Modified per D-58-35 (add `## Symptom Coverage Matrix` section)

</code_context>

<specifics>
## Specific Ideas

### Auto-mode pass-cap compliance
- Per `hm-auto.md` §"CRITICAL — Auto-mode pass cap", this CONTEXT.md update is a **single-pass re-validation**. No follow-up pass to "find gaps" — the SPEC's 6-round auto-mode interview + EXT-1 round already locked all major decisions; this CONTEXT.md is the implementation-decision layer for the P58-extension.

### BATS slot 67 collision (D-58-21 resolution)
- The SPEC's `58-SPEC.md:197` references "slot 67" for `58-panel-live-update.bats`, but **BATS 67 is already used** by the G1 grep-guard at `tests/scripts/tmux/67-delegate-task-no-native-task-tool.bats` (per `58-SUMMARY.md:45` and `58-CLOSE.md:184`).
- The P58-extension renumbers the 4 new BATS scenarios to **slots 71–74** (post-67, gap of 4 slots). This matches the existing P58 pattern of "62–67 is the original P58 slot block; 71–74 is the P58-extension block; future P58.1/P58.2 follow-up phases can use 75+".
- The SPEC's AC-58-07-03/08-03/09-03/10-03 are amended to reference the new slot numbers — the SPEC's intent is preserved (one BATS per symptom); the file naming resolves the collision.
- **DO NOT** move the G1 BATS from slot 67 (would break the 58-SUMMARY.md:184 evidence trail).

### 27-tool-key invariant preservation across extension
- The extension adds 3 new actions across 2 tools: `peek` + `progress` on `delegation-status` (grows from 6 to 8 actions); `peek` on `tmux-copilot` (grows from 7 to 8 actions). Total: 0 new tool keys, 0 new `package.json` deps. The 1 new file `src/features/session-tracker/streaming/child-event-stream.ts` is a session-tracker module (NOT a tmux module).
- Verified by `tests/integration/hook-registration.test.ts:86-103` (existing vitest test) which counts 27 tool entries — this test MUST continue to pass after the extension.

### Frozen contract for SC-04 / SC-05 (extension preserves)
- The 3 original event types (`delegation-queued`, `delegation-dispatched`, `delegation-terminal`) and the `DelegationPool` shape are frozen at P58. The P58-extension adds 1 new event category (`child-activity` for `ChildEvent` from the streaming bus) but does NOT modify the existing 3-event contract. SC-04 / SC-05 consumers continue to work with the frozen contract; the new `child-activity` category is additive.

### SPEC drift detection
- Per P56 D-56-12 precedent, SPEC.md is documentation-of-contract; source-of-truth is `src/**`. The P58-extension SPEC drift detection happens via the 24 new acceptance criteria checkboxes + `tsc --noEmit` + vitest regression. No CI check is added in the P58-extension (would be a future phase).

### REGRESSION GUARD for AC-58-08-04
- The `manualOverride` check at `src/plugin.ts:923-926` and `src/tools/tmux-copilot.ts:264-275` (forward-prompt) MUST continue to pass after the USER_SESSION tier is added. The CI runner is updated to re-run BATS slot 65 (G5 takeover-release) and slot 64 (G4 forward-prompt) as part of the P58-extension acceptance — both MUST exit 0.

### META-04: Real UAT as verification gate
- For the P58-extension re-ship, the `58-VERIFICATION.md` MUST have a `## Human-Driven UAT` section where the human user (the front-facing operator who filed the original complaint) signs off on S1, S2, S3, S4 being fixed. The BATS regression (slots 62–67 + 71–74) is necessary but NOT sufficient.

### Process change verification (META-01..03)
- META-01 verification: `grep -c '## User-Pain Coverage' .opencode/get-shit-done/templates/spec.md` returns `>= 1`; the `gsd-spec-phase` gate is updated (file modification) and a meta-test confirms a SPEC missing the section fails the gate
- META-02 verification: `grep -c '## Human-Driven UAT' .opencode/get-shit-done/templates/verification.md` returns `>= 1`; the `gsd-verify-work` gate is updated and a meta-test confirms a VERIFICATION missing the section is HARD FAIL
- META-03 verification: `grep -c '## Symptom Coverage Matrix' .planning/ROADMAP.md` returns `>= 1`; the close-pivot gate is updated to require the matrix update

### Atomic commit plan for the extension (in dependency order)
1. **META-01 commit** (template + USER-PAIN-BACKLOG.md creation) — docs only, no code
2. **META-02 commit** (VERIFICATION.md template + gsd-verify-work gate update) — docs + workflow file
3. **META-03 commit** (ROADMAP.md matrix + close-pivot gate update) — docs + workflow file
4. **S1 PLAN-08 task 1**: BATS 71 (red) → capturePaneContent + polling loop + peek on delegation-status (green)
5. **S2 PLAN-08 task 2**: BATS 72 (red) → USER_SESSION tier + tmux-copilot peek (green) + REGRESSION GUARD re-run of BATS 64/65
6. **S3 PLAN-09 task 1**: BATS 73 (red) → fire-and-forget + comment fix (green)
7. **S4 PLAN-09 task 2**: BATS 74 (red) → child-event-stream.ts + delegation-status progress + coordinator hook (green)
8. **META-04 verification**: human-driven UAT sign-off on S1–S4 → VERIFIED verdict

### Defer-to-P{N} cross-references (META-01 traceability)
- The P58-extension's S1, S2, S3, S4 are `addresses` (this phase fixes them), NOT `defers-to-P{N}`. The META-01 section in the P58-extension's `58-SPEC.md` documents this disposition per symptom
- Future P58.1/P58.2 phases (post-P58-extension) would address any NEW symptoms that surface; the Symptom Coverage Matrix in `.planning/ROADMAP.md` (D-58-35) is the canonical source for "which symptom is owned by which phase"

</specifics>

<deferred>
## Deferred Ideas

### Deferred from P58-extension (NOT in scope per SPEC OOS)

- **SC-04 / SC-05 dashboard rendering of `DelegationPool` and the 3 lifecycle events + the new `ChildEvent` bus** — P58-extension adds the data layer only; the SC phases will render the dashboard. Per SPEC OOS line 177.
- **Multi-user session concurrency (collision detection for `take-over`)** — Per SPEC OOS line 178. Future phase will widen `takenBy: "human-operator"` to `takenBy: string` and add per-user `manualOverride` flags. NOT affected by the USER_SESSION tier widening (still single-actor per D-58-22).
- **Auto-refresh of visual dependency graph (`compute-grid` on delegation lifecycle events)** — Per SPEC OOS line 179. Future phase will wire `tmux-copilot compute-grid` to fire automatically on `delegation-terminal` events.
- **`appendTuiPrompt` → `showTuiToast` migration** — Per SPEC OOS line 180. Different layer (notification vs. orchestration); separate backlog.
- **Distributed `take-over` across multiple tmux servers** — Single-host assumption preserved. Future phase will coordinate take-over across multiple tmux server instances.
- **P58 G3 abort+resume — concurrent abort handling** — The SPEC's `abortDelegation` is single-shot; if 2 concurrent aborts hit the same delegation, the second is a no-op (terminal state). Future phase may add a `cancel` action that interrupts a `paused` resume.
- **P58 G6 `recordDelegationTerminal` re-entrancy** — If a terminal event fires while another is in flight, the second is silently dropped (idempotency by map-set semantics). Future phase may add explicit dedup.
- **P58 G4 `forward-prompt` text length validation** — The SPEC caps `text` at the Zod schema level (no explicit cap mentioned); future phase may add a `maxLength: 4096` cap.
- **P58 G5 `take-over` audit trail persistence** — Currently the event is emitted to the in-memory event log; future phase may persist it to `.hivemind/journal/session-overrides.jsonl`.
- **P58 G2 `DelegationPool` filtering** — Currently returns ALL delegations regardless of status. Future phase may add a `filter?: { status?: DelegationLifecycleStatus[] }` parameter.
- **(NEW P58-extension) Bounded buffer tuning for `child-event-stream.ts`** — 100 events per session is a D-58-28 default; future phase may tune based on observed memory pressure. Memory bound: 100 × ~500 bytes × N active = bounded but not free
- **(NEW P58-extension) Polling cadence tuning** — 5s/15s is a D-58-19 default; future phase may tune based on observed p95 latency. The D-53-05 backoff schedule (5s/15s/30s) is the precedent for cadence tuning
- **(NEW P58-extension) `USER_SESSION` tier widening beyond 3 actions** — Currently limited to `take-over`/`release`/`peek`. Future phase may add `send-keys` or `forward-prompt` to the user-tier whitelist, but this requires the `manualOverride` check to be PRESERVED (per D-58-24 REGRESSION GUARD)
- **(NEW P58-extension) `__user__` sentinel collision detection** — If multiple TUI sessions invoke tools concurrently, the `__user__` sentinel may collide. Future phase may add per-TUI-session UUIDs
- **(NEW P58-extension) Real SDK event subscription (replaces polling loop)** — Per SPEC OOS, REQ-58-10 uses existing `chat.message` and `tool.execute.after` hooks, not a new SDK subscription. The polling loop in D-58-19 is the fallback when SDK events are not available. Future phase may add a true SDK subscription to reduce polling latency
- **(NEW P58-extension) META process changes — non-P58 templates** — The 3 template/methodology updates (D-58-33..35) are scoped to the P58 extension. A future project-wide template audit may extend the same pattern to all GSD templates

### Reviewed Todos (not folded)
None — discussion stayed within P58-extension scope per the locked SPEC boundaries.

</deferred>

---

*Phase: 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl*
*Context originally gathered: 2026-06-03 (D-58-01..17)*
*Context updated: 2026-06-04 — P58-extension (D-58-18..39, 10 agent-discretion items)*
*Mode: --auto (22 implementation decisions locked for the extension; 6/6 original REQs unchanged)*
*Spec created: 2026-06-03 (6 requirements, 13 ACs, ambiguity 0.075) → UPDATED 2026-06-04 (11 requirements, 37 ACs, ambiguity 0.0775)*
*Original P58 close: 2026-06-04 per `58-CLOSE.md:7` (6/6 BATS green, 13/13 ACs verified, 27 atomic commits, SHIPPED)*
*Next checkpoint: PLAN-08 (S1 + S2 implementation) + PLAN-09 (S3 + S4 + META implementation) → BATS slots 71-74 + 3 template updates + ROADMAP matrix update*
