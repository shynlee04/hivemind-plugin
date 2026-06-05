[LANGUAGE: Write this file in en per Language Governance.]
# Tools Audit — Round 4 Test (R4) — 2026-06-05

**Audit target:** 3 files in the Hivemind runtime
**Scope:** Actions, args, status values, integration points, flaws
**Method:** Read each file end-to-end, then catalog per the five-dimension rubric
**Date:** 2026-06-05

---

## File 1 — `src/tools/tmux-copilot.ts` (596 LOC)

### 1.1 Actions (9 total — beyond original 4)

| # | Action | Origin phase | Permission tier | Status values produced |
|---|--------|--------------|-----------------|------------------------|
| 1 | `send-keys` | Phase 43 | All agents (P59 R1) | `sent: true` / `sent: false` + `tmux-not-wired` / `tmux-error` |
| 2 | `list-panes` | Phase 43 | All agents | `panes[]` + `tmux-not-installed` / `tmux-timeout` / `tmux-error` |
| 3 | `compute-grid` | Phase 43 | All agents | `commands: SplitCommand[]` |
| 4 | `respawn` | Phase 43 | All agents | `respawned: true` / `respawned: false` (session-not-closed) |
| 5 | `forward-prompt` | P58 G4 (REQ-58-04) | All agents, but suppression-gated by `manualOverride` | `paneId+deliveredAt+byteLength` / `suppressed: true` / `sent: false` |
| 6 | `take-over` | P58 G5 (REQ-58-05) | All agents | `sessionId+paneId+takenBy+takenAt` (+ optional `promptDelivered/promptError/promptMode`) |
| 7 | `release` | P58 G5 (REQ-58-05) | All agents | `sessionId+releasedAt` |
| 8 | `peek` | P58.8 S2 (REQ-58-08) | All agents | raw: `paneId+content+capturedAt+byteLength`; summary: `activity{messageCount, toolCalls[], bashExecutions[], fileReads[], fileWrites[], lastAssistantMessage, files[]}` |
| 9 | `peek-by-session` | P59 A2 | All agents | Same as `peek` but with `sessionId` resolution |

**File-level claim vs. reality:** The file header comment line 5–6 says "4 actions: send-keys, list-panes, compute-grid, respawn" — this is **stale**. The discriminated union at lines 152–162 contains 9 actions, and the description string at line 211 omits `peek-by-session` entirely (only lists 8).

### 1.2 Args (per action)

**`send-keys`**
- `paneId: string.min(1)` — required
- `text: string` — required (no min)
- `literal: boolean?` — defaults to `false` inside execute

**`list-panes`**
- `mainPaneId: string?` — optional scoping

**`compute-grid`**
- `tree: PaneTreeNode` — required, recursive `{id: string.min(1), children?: PaneTreeNode[]}` (Zod lazy)

**`respawn`**
- `sessionId: string.min(1)` — required

**`forward-prompt`**
- `paneId: string.min(1)` — required
- `text: string` — required
- `literal: boolean?` — defaults to `true` inside execute (note: differs from `send-keys` which defaults to `false`)

**`take-over`**
- `sessionId: string.min(1)` — required
- `paneId: string.min(1)` — required
- `prompt: string?` — optional, if present → inject via `sendPrompt`
- `promptMode: enum["steer","respond"]?` — default `steer` (uses `noReply: true`)

**`release`**
- `sessionId: string.min(1)` — required

**`peek`**
- `paneId: string.min(1)` — required
- `maxBytes: number.int.positive?`
- `format: enum["summary","raw"]?` — default `summary`

**`peek-by-session`**
- `sessionId: string.min(1)` — required
- `maxBytes`, `format` — same as `peek`

**Top-level structural `args` (line 210–219):** Defined as a flat object using `tool.schema` — *not* the discriminated union. This is a deliberate concession: the SDK's `tool()` helper cannot accept a Zod discriminated union, so the framework sees a flat hint and the canonical parse happens at line 234 via `TmuxCopilotActionSchema.safeParse`. The flat `args` does **not** advertise `peek-by-session` action or `format` / `promptMode` fields, so the framework's hint to the LLM is incomplete relative to actual capabilities.

### 1.3 Status values (union members, 14+ variants)

```
| { available: false; reason: "tmux-not-wired" | "tmux-not-installed" | "tmux-timeout" }
| { available: false; reason: "tmux-error"; error: { message: string } }
| { sent: true; paneId: string }
| { sent: false; paneId: string; error: { message: string } }
| { panes: PaneState[] }
| { commands: SplitCommand[] }
| { respawned: true; paneId: string }
| { respawned: false; error: { reason: string } }
| { paneId: string; deliveredAt: string; byteLength: number }                  // forward-prompt success
| { suppressed: true; reason: "manualOverride" | "session-not-found"; paneId; textPreview; evaluatedAt }
| { sessionId: string; paneId: string; takenBy: string; takenAt: string }      // take-over success
| { sessionId: string; releasedAt: string }                                    // release success
| { paneId: string; content: string; capturedAt: string; byteLength: number }  // peek raw
| { sessionId; paneId; content; capturedAt; byteLength }                       // peek-by-session raw
| { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
| { error: { kind: "permission-denied"; agent: string } }
```

Note: when `take-over` receives a `prompt` arg, the response is *extended* with `promptDelivered`, `promptMode`, and conditionally `promptError` (line 383). This conditional shape is **not** in the declared `TmuxCopilotResult` union — the union type does not capture this optional field set. Consumers reading only the union type would miss these fields.

### 1.4 Integration points

1. **`@opencode-ai/plugin/tool`** — `tool()` factory (line 32) and `tool.schema` (line 196) for the SDK tool contract.
2. **`zod`** — discriminated union schemas (line 33, 152–162).
3. **`../features/tmux/types.js`** — `getSessionManagerAdapter`, `setSessionManagerAdapter`, `PaneState`, `PaneTreeNode`, `SplitCommand` (line 34–40). Also `resolveSessionToPaneId`, `getSendPrompt`, `getSessionMessagesFetcher`, `getSessionPaneRegistryEntries` (line 43).
4. **`../shared/tool-helpers.js`** — `renderToolResult` (line 41) for envelope wrapping.
5. **`../features/session-tracker/index.js`** — `getManualOverrideState`, `setManualOverrideState` (line 42) for the take-over / release / forward-prompt suppression gate.
6. **`@opencode-ai/plugin`** runtime — `context.agent` and `context.sessionID` from the tool invocation context (line 190, 226, 319).
7. **Module-level test seam** — `__setTmuxMultiplexerForTesting` (line 594–596) for BATS tests; delegates to the existing `setSessionManagerAdapter` injection point.
8. **`Buffer.byteLength(payload, "utf8")`** — used twice (lines 333, 402, 448) for byte accounting.
9. **SDK `client.session.prompt`** — indirectly via the `getSendPrompt` getter, which is wired in `plugin.ts` (referenced at line 353) for `take-over` prompt injection.
10. **`EnrichedSessionEvent`** shape — read via `getSessionPaneRegistryEntries` (line 416–417) to resolve `paneId → sessionId`.

### 1.5 Flaws

1. **Stale header comment** (line 5–6): claims "4 actions" but the implementation has 9. Misleading to future readers; should be updated to match `TmuxCopilotActionSchema`.
2. **Description string omission** (line 211): the top-level `action` `describe()` lists only 8 of 9 actions — `peek-by-session` is missing. LLM agents will be unaware of the action unless they infer it from context.
3. **Stale "orchestrator-tier only" claim** (line 9–11): comment says "Permission-gated: orchestrator-tier agents may invoke any action (T-43-05)" but the code at lines 67–70 explicitly states "Agent-name-based denial removed in P59 R1" and the gate at line 227 only rejects null/undefined agent. The comment is internal doc drift.
4. **Stale description string** (line 204): the tool description ends with "All agents may invoke all actions. Agent-name-based denial removed in P59 R1." but the file header at lines 7–8 still describes the old tier system. Internal inconsistency.
5. **Inconsistent `literal` default** (line 252 vs 335): `send-keys` defaults to `false`, `forward-prompt` defaults to `true`. The asymmetry is undocumented in the schema. `forward-prompt` likely needs `true` to avoid sending newlines as Enter keypresses, but a reader has to find that inference.
6. **`take-over` optional fields missing from union type** (line 178–179): The `promptDelivered`, `promptMode`, and `promptError` fields added at line 383 are not part of the declared `TmuxCopilotResult` union. Type-level incompleteness that downstream consumers (tests, dashboards) will miss.
7. **`peek` summary mode has two divergent return shapes** (line 419–429 vs 484–492 vs 549–564): when the registry has no entry, returns an `activity` object with `note`. When the fetcher is not wired, returns a different `activity` object. When the fetcher succeeds, returns a fully populated `activity`. The two "missing" branches have different field sets — `messageCount` and `toolCalls: []` in one vs only `note` in the summary-fetcher-not-wired path. This makes downstream parsing brittle.
8. **`peek-by-session` invalid-input error uses `as unknown as z.ZodIssue`** (line 441): a fabricated ZodIssue is cast through `unknown`. This is a type-safety shortcut that bypasses the schema. A consumer checking `issues[0].code === "custom"` will work, but anyone iterating `issues` for diagnostics will get a synthetic issue that isn't a real parse failure.
9. **Inconsistent suppression check** (line 321): `forward-prompt` checks `overrideState?.manualOverride === true`, but `take-over` *sets* `manualOverride: true` (line 354) without first checking if the session is already under override by another operator. Two operators racing on `take-over` will both succeed; the second silently overwrites `takenBy` and `takenAt`.
10. **`take-over` audit field `takenBy` is hardcoded** (line 357, 381): always `"human-operator"` regardless of the actual caller (`context.agent` is available but ignored). The audit trail cannot distinguish which agent took the session over.
11. **`peek` with no registry entry does not actually call `buildSessionSummary`** (line 418–430): when the registry is empty, returns the empty activity envelope. But when the registry *does* have an entry, calls `buildSessionSummary` which itself re-resolves via `resolveSessionToPaneId` (line 478) — double-resolution path that wastes a Map lookup.
12. **`peek` summary path does not honor `maxBytes` for tool calls / bash / file lists** (line 505–527): only `lastAssistantMessage` and `peek-by-session` raw content slice by `maxBytes`. Tool-call arrays are sliced by a hardcoded `slice(-15)` / `slice(-10)` regardless of `maxBytes`. The intent of `maxBytes` is not consistently applied.
13. **`peek-by-session` summary and `peek` summary take different code paths** (line 431 vs 463): `peek` summary resolves the pane registry, then calls `buildSessionSummary` which *also* resolves. `peek-by-session` summary skips the registry pre-check and goes straight to `buildSessionSummary`. The duplication is small but real.
14. **`buildSessionSummary` arg-extraction heuristics** (line 517, 521, 525): `argValues.find((v) => v.length > 3)` and `argValues.find((v) => v.includes("/") || v.includes("."))` are fragile. The bash command picked is whichever arg is > 3 chars (often the wrong one for tools with `--flag value` shape). File path detection by `includes("/")` will miss relative paths like `foo.txt` and `bar.md`.
15. **No caller-agent audit in `setManualOverrideState`** (line 354, 388): the audit fields `takenBy`, `takenAt` (take-over) and `releasedAt` (release) are set, but no `releasedBy` is recorded. Release is unaccountable.
16. **`list-panes` error classification** (line 272–273): regex `/timeout/i.test(message)` matches any error message containing "timeout" anywhere — false positives from unrelated errors that mention the word.
17. **`list-panes` does not catch `message` as ENOENT when tmux binary is missing at adapter level** (line 271): relies on `err.code === "ENOENT"` propagation through the adapter — assumes the adapter throws `NodeJS.ErrnoException`. If the adapter wraps the error, classification fails and falls through to generic `tmux-error`.
18. **`respawn` does not validate that `paneId` returned from the adapter is non-empty** (line 299): the success branch returns whatever the adapter gave, even an empty string. No consumer check.
19. **`compute-grid` is not wrapped in try/catch** (line 288): unlike every other action, this one lets exceptions escape the adapter surface. Inconsistent error handling.
20. **`forward-prompt` text sent as `literal: true` by default** (line 335): for the orchestrator-forward sentinel, this is correct (you want newlines preserved as text, not interpreted as Enter). But the schema's `literal: boolean?` does not communicate this; an LLM caller could pass `literal: false` and have the sentinel interpreted as keystrokes, which would mangle the message.
21. **`renderToolResult` for `peek-by-session` invalid-input path uses literal `error: { kind: "invalid-input" as const, issues: [...] }`** (line 440–442): mixing the error envelope shape inside an `error: { kind: "invalid-input" }` field creates a double-nested error. A consumer expecting `result.error.kind === "invalid-input"` will find it nested inside another `error`. Schema/calling-convention drift.
22. **`forward-prompt` textPreview truncates at 80 chars without an ellipsis marker** (line 326): the slice is `input.text.slice(0, 80)`, so a caller cannot tell whether the preview is the full text or truncated. Minor UX issue for debugging.
23. **`peek` raw mode does not apply `maxBytes`** (line 400–410): unlike `peek-by-session` raw (line 453–455) which does `sessionContent.slice(-maxBytes)`, the regular `peek` raw path returns the full capture without honoring `maxBytes`. Inconsistent.
24. **No test for the `peek` raw empty-capture path with `maxBytes`** (line 401–402): when `capture === null`, `byteLength` is computed from `content` (empty string → 0). If `maxBytes > 0` and the caller expected a slice of something, they get `""` and no diagnostic.
25. **Caching of `getSendPrompt` happens once at module init** (line 363): if `plugin.ts` rewires the `sendPrompt` getter mid-session (a valid pattern for recovery from SDK disconnection), this tool will continue to use the stale reference. The other module-level functions (`getSessionPaneRegistryEntries`, `getSessionMessagesFetcher`) are called fresh each time, but `getSendPrompt` is called once and held.

---

## File 2 — `src/tools/tmux-state-query.ts` (162 LOC)

### 2.1 Actions (3 total)

| # | Action | Origin phase | Permission tier | Status values produced |
|---|--------|--------------|-----------------|------------------------|
| 1 | `list-sessions` | Phase 52 | All agents (P59 R1) | `sessions: SessionSummary[]` (always empty — see flaws) |
| 2 | `get-session` | Phase 52 | All agents | `session: SessionSummary \| null` (always null — see flaws) |
| 3 | `get-summary` | Phase 52 | All agents | `summary: { total, active, spawning }` (always zero — see flaws) |

**File-level claim:** Header says "3 actions: list-sessions, get-session, get-summary" (line 10) — matches implementation.

### 2.2 Args (per action)

**`list-sessions`** — no args beyond `action` literal.
**`get-session`**
- `sessionId: string.min(1)?` — declared as `.optional()` in the Zod schema (line 56), but the dispatch switch (line 144) ignores it entirely and always returns `null`. The sessionId is collected but never used.
**`get-summary`** — no args beyond `action` literal.

**Top-level structural `args` (line 104–112):** flat shape with `action` and `sessionId`. The schema cannot express the optional `sessionId` requirement distinction (per-action conditional requirement) — the flat `s.string().optional()` is a lossy hint.

### 2.3 Status values (6 union members)

```
| { available: false; reason: "tmux-not-wired" }
| { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
| { error: { kind: "permission-denied"; agent: string } }
| { sessions: SessionSummary[] }
| { session: SessionSummary | null }
| { summary: { total: number; active: number; spawning: number } }
```

The `permission-denied` variant is **declared but never produced** — the execute body (line 113–161) has no permission check, no return of `permission-denied`. Dead code in the union.

### 2.4 Integration points

1. **`@opencode-ai/plugin/tool`** — `tool()` factory and `tool.schema` (line 17, 97).
2. **`zod`** — discriminated union (line 18, 63–67).
3. **`../features/tmux/types.js`** — `getSessionManagerAdapter` (line 19) for bridge check only.
4. **`../shared/tool-helpers.js`** — `renderToolResult` (line 20) for envelope.
5. **`SessionSummary` interface** — exported (line 37–44) for downstream consumers; the shape is fully defined but never populated by the tool body.
6. **`tmuxStateQueryToolName` const** — exported (line 91) for callers that want the tool name as a string.

### 2.5 Flaws

1. **All three actions are stubs** (line 142, 150, 158): every action returns a hardcoded empty value regardless of the actual state. The code comments at line 138–141, 145–149, 153–157 explicitly acknowledge this and blame the adapter surface for not exposing the needed methods. **The tool is non-functional** — calling it always returns zeros and empty arrays.
2. **`get-session` accepts a `sessionId` arg but ignores it** (line 56, 144): the schema declares `sessionId.optional()` and the framework's flat `args` (line 111) advertises it, but the dispatch body returns `{ session: null }` unconditionally. A caller passing a `sessionId` will see a successful response with `null` — indistinguishable from "no session found" or "sessionId omitted".
3. **Dead `permission-denied` union variant** (line 76): declared but never produced. The P59 R1 comment at line 26 says "all agents allowed" but the union still includes the variant. Either remove it or produce it.
4. **Stale comment "Orchestrator-tier only"** (line 103): the description string says "Orchestrator-tier only" but the execute body has no gate. Same drift as tmux-copilot.ts line 9–11.
5. **Empty `_context` parameter** (line 115): context is unused. The `permission-denied` variant cannot be produced even if the gate were added, because `_context` is destructured but `agent` is never read.
6. **No graceful handling of `tmux-not-installed` / `tmux-timeout`** (line 129–132): unlike `tmux-copilot.ts:262-285`, this tool only checks `adapter === null`. A tmux binary present but failing would not be classified. Inconsistent error surface across sibling tools.
7. **Tool is exported and registered but produces no useful data**: consumers wired to this tool (per the exported `tmuxStateQueryToolName` constant) get empty responses. The tool is a placeholder waiting on `SessionManagerAdapter.getSessions()` extension. Until that lands, **this tool should not be registered** — it returns misleading "everything is fine" data to observability consumers.
8. **No documentation of the stub state in the description** (line 100–103): the description string says "Returns tracked session information without mutating any state" without noting that all three actions return empty/null/zero results. LLM callers will rely on this tool and get nothing.
9. **`get-summary` always reports `total: 0, active: 0, spawning: 0`** (line 158): even if a tmux integration is wired, the tool will report 0 sessions. A healthcheck or observability consumer that watches this number for liveness will see a permanently-zero dashboard. False-negative risk.
10. **The `SessionSummary` interface shape is unused** (line 37–44): the interface is exported with 6 fields but the tool body never constructs an instance. Downstream type imports compile but are dead.
11. **Schema accepts `sessionId: ""` via the flat `args` but rejects it via Zod** (line 56 vs 111): the Zod schema is `string.min(1).optional()`, but the flat `s.string().optional()` does not enforce min(1). The framework's hint to the LLM permits an empty sessionId that will then fail Zod parse — producing a graceful `{error: invalid-input}` rather than a "no such session" result.

---

## File 3 — `src/coordination/delegation/coordinator.ts` (746 LOC)

### 3.1 Actions (public methods, 14)

| # | Method | Visibility | Origin phase | Return shape |
|---|--------|------------|--------------|--------------|
| 1 | `dispatch(params)` | public async | base | `DelegationResult` |
| 2 | `recordExecutionSignal(id, signal)` | public sync | base | void |
| 3 | `recordChildMessageSignal(childId, observedAt, excerpt)` | public sync | base | void |
| 4 | `recordChildToolSignal(childId, observedAt)` | public sync | base | void |
| 5 | `markExecutionUnconfirmed(id, elapsedSeconds)` | public async | base (+ P59 R3) | void |
| 6 | `handleCompletion(id, result)` | public sync | base | void |
| 7 | `handleTimeout(id)` | public sync | base | void |
| 8 | `attachChildSession(id, childId)` | public sync | base | void |
| 9 | `failDispatch(id, err)` | public sync | base | void |
| 10 | `abortDelegation(id, reason)` | public sync | base | `DelegationResult` |
| 11 | `cancelDelegation(id, reason)` | public sync | base | `DelegationResult` |
| 12 | `handleSessionIdle(childId)` | public sync | base | void |
| 13 | `handleSessionError(childId, err)` | public sync | base | void |
| 14 | `handleSessionDeleted(childId)` | public sync | base | void |
| 15 | `chain(delegations, sendPromptAsync?)` | public async | base | `DelegationResult[]` |

Plus 8 private helpers (`buildChainResult`, `unsubscribeChildEventBus`, `cleanup`, `findRecord`, `mergeCompletionResult`, `handleChildSessionTerminal`, `buildChildCompletionResult`, `routeTerminal`, `notificationTypeFor`, `createDelegationId`, `createRecord`, `errorResult`, `spawnTmuxPanelForChild`).

### 3.2 Args

`dispatch(params: DispatchParams)` where `DispatchParams = PreflightParams` (re-exported from `dispatcher.js`). The PreflightParams shape is not visible in this file but the dispatch body uses: `agent`, `parentSessionId`, `prompt`, `workingDirectory`, `surface`, `currentDepth`. `parentSessionId: "chain"` is hardcoded inside `chain()` (line 531) — a magic string.

`recordExecutionSignal` takes `ExecutionSignalInput` with `source: DelegationSignalSource` (an enum, not visible here), `observedAt?: number`, `actionDelta?: number`, `messageDelta?: number`, `toolDelta?: number`.

`chain(delegations: ChainStep[], sendPromptAsync?: (sessionId, prompt) => Promise<void>)` — `ChainStep` has `agent: string`, `prompt: string`, `usePreviousResult?: boolean`.

Constructor takes `DelegationCoordinatorDeps` with 11 keys (line 97–138): `childSessionStarter`, `dispatcher`, `monitor`, `notificationRouter`, `lifecycle`, `detector`, `periodicNotifier`, `onChildSessionCreated`, `client`, `sessionManager`, `tmuxIntegration`. The `tmuxIntegration` shape is intentionally narrow (line 135–137) to avoid a `src/coordination → src/features/tmux` import cycle — it carries only `adapter: SessionManagerAdapter`.

### 3.3 Status values

`DelegationStatus` is imported from `./types.js` (line 6) — not visible in this file. Used at:
- `lifecycle.transition(delegationId, "dispatched")` (line 199)
- `lifecycle.transition(delegationId, "running")` (line 250)
- `lifecycle.transition(delegationId, "error")` (line 468, in `failDispatch`)
- `lifecycle.transition(delegationId, "aborted")` (line 478)
- `lifecycle.transition(delegationId, "cancelled")` (line 488)
- `lifecycle.transition(delegationId, status)` (line 420, in `handleCompletion` — passes through `result.status`)

`record.executionState` is one of: `"pending"`, `"unconfirmed"`, `"confirmed"`, `"stalled"` (visible at line 319, 367, 376, 404, 410, 612).

`record.evidenceLevel` is one of: `"accepted-only"`, `"status-only"`, `"message"`, `"tool"`, `"message-and-tool"` (line 325–327, 405, 411, 605).

`record.signalSource` is `DelegationSignalSource` (enum, not visible).

`routeTerminal` dispatches on `DelegationNotification["type"]` which maps from status (line 659–663): `"completed" → "success"`, `"timeout" → "timeout"`, everything else → `"failure"`. The mapping is exhaustive *only for the three cases tested*; if a new `DelegationStatus` member is added (e.g., `"quarantined"`), it would route to `"failure"` silently. The function should probably use an exhaustive switch with `never` check.

`terminalKind` appears in `abortDelegation` and `cancelDelegation` (line 476, 487) as `"cancelled"` and the implicit kind from `result.terminalKind` (line 586). Not exhaustively documented in this file.

### 3.4 Integration points

1. **`.js` siblings in `delegation/`** — `dispatcher.js` (DelegationDispatcher, PreflightParams, PreflightResult), `lifecycle.js` (DelegationLifecycle), `monitor.js` (DelegationMonitor), `notification-router.js` (NotificationRouter), `periodic-notifier.js` (PeriodicNotifier), `types.js` (Delegation, DelegationNotification, DelegationResult, DelegationSignalSource, DelegationStatus), `slot-manager.js` (SlotHandle) — 7 sibling imports.
2. **`zod`** — `sdkMessageSchema` (line 43–50) for parsing SDK message bodies in `extractSdkMessageRole` and `extractSdkMessageError`.
3. **`../../shared/session-api.js`** — `OpenCodeClient` type, `getSessionMessages` helper (line 9).
4. **`../../features/session-tracker/streaming/child-event-stream.js`** — `childEventStream.unsubscribe` (line 10, 566).
5. **`../../shared/state.js`** — `getDelegationMeta` (line 11, 712) for tmux fallback event synthesis.
6. **`../../features/tmux/observers.js`** — `EnrichedSessionEvent` type (line 12, 713) for the same fallback.
7. **`../completion/notification-handler.js`** — `notifyParentSession` (line 13, 285) for the Phase 23 toast + context injection.
8. **`../../features/tmux/types.js`** — `SessionManagerAdapter` type via inline `import()` (line 136) — used to type the narrow `tmuxIntegration.adapter` field without creating a top-level import cycle.
9. **`OpenCodeClient.app.log`** — error logging envelope (line 227, 568, 738) for best-effort diagnostics.
10. **`getSessionMessages`** — called twice (line 206, 356, 396) for parent model resolution, stall detection, and live activity check.
11. **`sdkMessageSchema.safeParse`** — used inside `markExecutionUnconfirmed` (line 359, 363) to safely extract role and error fields.
12. **`process.cwd()`** — fallback for `workingDirectory` (line 245, 673) when params omit it.

### 3.5 Flaws

1. **`chain()` uses `parentSessionId: "chain"` as a magic string** (line 531): the literal `"chain"` is used as a parent session ID for every step. This will not match any real session in `delegationByChildSession` lookups; if any downstream consumer tries to resolve the chain delegation back to a real parent, the resolution will fail. Should be a typed sentinel constant.
2. **`chain()` reuses the same `delegationId` accumulator logic via `this.createDelegationId()` in `buildChainResult`** (line 546): but the actual `dispatch()` call at line 528 also creates a new delegationId internally. The chain step's `delegationId` in the result and the delegationId registered in the active map are not the same. The chain result reports a delegationId that was never registered — `findRecord()` would return undefined for it.
3. **`createRecord` initial `childSessionId` is set to `delegationId`** (line 671): the placeholder is `childSessionId: delegationId`, not an empty string. This means until `attachChildSession` is called, the record's childSessionId is the same as the delegationId. The `delegationByChildSession.set(delegationId, delegationId)` self-mapping is then created at line 197 (via `lifecycle.register` side effects — see flaw 4). This is a real bug source: `getDelegationIdForChildSession(delegationId)` at line 451 will return `delegationId` for any lookup that happens to match the placeholder.
4. **`active.set` happens before `attachChildSession`** (line 196 vs 246/249): the record is inserted into `active` with the placeholder `childSessionId: delegationId` before the real child session ID is known. A `getDelegationIdForChildSession` lookup using the delegationId-as-childSessionId will succeed (returning the same delegationId). Symptom: spurious self-mappings in the registry.
5. **`recordExecutionSignal` overwrites `signalSource` without preserving the first observation** (line 321): `record.signalSource = signal.source` replaces rather than tracking the first source. A delegation confirmed first by a message then by a tool will have its source overwritten to "tool" — losing the message-first audit trail.
6. **`recordExecutionSignal` advances `firstActionAt` only on first call** (line 320): correct in isolation, but the propagation back to `lifecycle.register?.(record, false)` at line 330 happens *every* signal. For a long delegation with thousands of tool calls, this is thousands of lifecycle re-registrations per delegation — a hot-path performance concern.
7. **`markExecutionUnconfirmed` SDK poll happens for every check, not just the threshold** (line 394–401): the live SDK poll is supposed to be a "stalled check" at the 120s threshold (line 402–409), but the poll itself runs *unconditionally* when `hasAnyActivity` is false. If a child has produced no signals (legitimately slow), every check until the 120s threshold will make a network call to `getSessionMessages`. For a busy session with many slow children, this is a per-tick N+1.
8. **404 detection on SDK error uses substring match** (line 374): `msg.includes("404") || msg.includes("not found")` — false positives from error messages that mention "404" in a stack trace or a tool that stringifies "not found" anywhere. Should check `err.code` or `err.status` structurally.
9. **`abortDelegation` and `cancelDelegation` are near-duplicates** (line 475–493): both set explicitCancellation: true, call the same deregister/transition/monitor/route/cleanup sequence, and differ only in the literal status (`"aborted"` vs `"cancelled"`). The cleanup sequence is copy-pasted 5 times across `handleCompletion`, `handleTimeout`, `failDispatch`, `abortDelegation`, `cancelDelegation` (line 415–492). Each new terminal path is a chance for a missed cleanup step.
10. **`cleanup` does not call `lifecycle.transition`** (line 578–593): the function sets `active.record.status` and `active.record.completedAt` directly on the local copy, then calls `lifecycle.register?.(record, false)` (via `mergeCompletionResult` at line 587). It does **not** call `lifecycle.transition(delegationId, status)` — that's already done by the caller before `cleanup`. But this means a caller that forgets to transition will leave the lifecycle in a stale state. The implicit contract is undocumented.
11. **`markExecutionUnconfirmed` `error` string format is inconsistent** (line 366, 375, 406): three different error message patterns: `"[Harness] Child session assistant error: ${errorMsg}"`, `"[Harness] Child session ${record.childSessionId} was deleted or not found"`, `"[Harness] Delegation stalled without any activity after ${elapsedSeconds}s (no tools, no messages, no SDK messages)"`. Some start with the prefix, some are prefixed inside the function — should be a single helper.
12. **`getDelegationIdForChildSession` linear scan fallback** (line 451–460): the `delegationByChildSession` map is normally used, but a fallback linear scan of `this.active` is run if the map misses. This is O(N) per call. The map should be the source of truth; the linear scan is a safety net that masks missed `attachChildSession` calls.
13. **`unsubscribeChildEventBus` is fire-and-forget without awaiting** (line 566–575): the unsubscribe is wrapped in `void` and `.catch()`. If the unsubscribe is critical for resource cleanup (P58.8 S4 says "ring buffer does not grow unboundedly"), fire-and-forget means the cleanup may not complete before the next delegation. The function returns before the unsubscribe resolves.
14. **`spawnTmuxPanelForChild` is best-effort silent fallback** (line 700–745): the comment at line 696 explicitly states "D-04 silent-fallback" — failures are swallowed. The user has no signal that the tmux panel failed to spawn. For a multi-pane visual orchestration UX, a silent failure is a UX regression (the user expects to see the panel).
15. **`spawnTmuxPanelForChild` does not check whether the SDK event will also fire** (line 707–744): the function fires unconditionally when the deps are wired. The comment at line 268–269 claims idempotency via guards in `session-manager.ts:223-231`, but this is a cross-file contract that is not enforced at the call site. A future refactor of session-manager.ts could break the idempotency guarantee silently.
16. **`dispatch` returns a `status` that may be `"dispatched"`** (line 311): `this.deps.lifecycle.getStatus?.(delegationId)?.status ?? "dispatched"` — a successful return from `dispatch` reports `"dispatched"`, not `"running"` (which was just transitioned to at line 250). This is a stale-read race: the transition happened, but the local `status` was read before the transition was visible to `getStatus`. The caller sees a `"dispatched"` result and may interpret it as "not yet started".
17. **`dispatch` does not handle `attachChildSession` callback timing** (line 246, 249): the `onChildSessionId` callback inside `childSessionStarter.start()` (line 246) is called by the starter, then `attachChildSession` is called again explicitly at line 249 with `child.childSessionId`. The starter may have already updated the record via the callback, then line 249 updates it again — double work. The line 249 call is redundant if the starter always invokes `onChildSessionId` synchronously.
18. **`dispatch` does not await `notifyParentSession`** (line 285): `void notifyParentSession(...)` — the toast is fire-and-forget. If the SDK call hangs, the caller's dispatch does not see the failure. The comment does not justify the void.
19. **`extractSdkMessageError` falls back to `String(errorField)` which can be `"[object Object]"`** (line 86): for an object error with no `message` field, `String({foo:1})` returns `"[object Object]"`. The comment at line 73–75 explicitly says "deliberately does NOT use JSON.stringify" but offers no better fallback. An option would be `Object.entries(errorField).map(([k,v]) => `${k}=${v}`).join("; ")`.
20. **`getSessionMessages` errors in the parent-model lookup path are silently swallowed** (line 225–234): the catch block logs at `warn` level via `client.app.log`, but the function continues with `inheritedModel: undefined`. The child will be started with no model, falling back to defaults — a meaningful behavioral change that is invisible to the caller. Should at minimum surface a metric or trace.
21. **`routeTerminal` uses `message` as part of `idempotencyKey`** (line 656): `idempotencyKey: ${delegationId}:${type}:${message}`. If the message contains the same delegationId prefix and type, two distinct error messages (e.g., one with a timestamp embedded) will produce different keys — defeating the idempotency guarantee. The message should not be part of the key.
22. **`notificationTypeFor` is not exhaustive** (line 659–663): maps three statuses; if `DelegationStatus` adds a new member, the function returns `"failure"` silently. A `never` check in the else branch would catch this at compile time.
23. **`DispatchParams = PreflightParams` re-export** (line 89): couples the coordinator's input type to the dispatcher's internal preflight type. If `PreflightParams` evolves, the coordinator's signature evolves without semantic review. A dedicated `DispatchInput` type would document the boundary.
24. **`createRecord` initial `lastMessageCount: 0` and `toolCallCount: 0`** (line 672, 674): the record has 0/0 at creation, but `evidenceLevel: "accepted-only"`. The two counters and the evidence level are inconsistent at creation. Not a bug today, but a future refactor that reads counters to drive logic will see contradictions.
25. **`spawnTmuxPanelForChild` passes `hivemindMeta.depth: meta.depth` vs `depth: 1` fallback** (line 727, 732): the fallback uses `depth: 1` but the meta is keyed by `childSessionId` and could legitimately be at depth N. The fallback should be `0` or use the same depth inheritance as the parent.

---

## Cross-File Observations

1. **Phase comment drift:** All three files have stale or contradictory phase comment markers. `tmux-copilot.ts` header says "Phase 43 design notes" with action count "4" (line 4–5), but the implementation is 9 actions spanning P43 → P59. `tmux-state-query.ts` is the only one whose header matches its implementation.

2. **Adapter-bridge pattern consistency:** Both `tmux-copilot.ts` and `tmux-state-query.ts` use `getSessionManagerAdapter()` for the same `null → "tmux-not-wired"` graceful path. The coordinator uses a different `tmuxIntegration.adapter` injection point — three different injection patterns for the same backing system.

3. **`tmux-state-query.ts` is a stub while `tmux-copilot.ts` is production-grade:** the sibling tools have dramatically different maturity. The `tmuxStateQueryToolName` export implies registration, but the implementation returns empty results. An LLM agent picking between the two for "list sessions" will get useful data from `tmux-copilot:list-panes` and useless data from `tmux-state-query:list-sessions`.

4. **Error envelope inconsistency:** `tmux-copilot.ts` uses `{ error: { kind: "invalid-input", issues: [...] } }` and `{ error: { kind: "permission-denied", agent: "..." } }`. `tmux-state-query.ts` uses the same shape but never produces `permission-denied`. The coordinator's `errorResult` produces `{ delegationId, error: "[Harness] ...", status: "error" }` — a completely different shape (no `kind` discriminator). Three different error conventions across three files.

5. **`sessionId` resolution paths:** Both `tmux-copilot.ts:peek` and `tmux-copilot.ts:peek-by-session` resolve via `resolveSessionToPaneId` / `getSessionPaneRegistryEntries`. The coordinator's `getDelegationIdForChildSession` resolves the inverse mapping (childSessionId → delegationId). Three different resolution paths for three different lookup directions, none unified.

6. **Manual override audit gap:** `tmux-copilot.ts:take-over` records `takenBy` (hardcoded "human-operator") and `takenAt`, but `release` records only `releasedAt` (no `releasedBy`). The audit trail is asymmetric — the entry is accountable, the exit is not.

7. **Stubbed observability:** `tmux-state-query.ts:list-sessions` returns `[]` with a comment blaming the adapter surface. The P58.8 S1 and S5b fixes in `coordinator.ts` show that the same system does have session-level state (via `getDelegationMeta` and `EnrichedSessionEvent`). The query tool could read from these state sources instead of the adapter, but the implementation chose not to.

8. **Comment-density vs. behavior-density ratio:** `tmux-copilot.ts` has 596 lines with extensive multi-paragraph comments at the top and inline rationale at every action. `coordinator.ts` has 746 lines with 3 long block comments (P58.8 S1, S5b, P58.8 S4) and 1 architectural comment at lines 21–36. `tmux-state-query.ts` is the leanest at 162 lines but has the smallest behavior (3 stubbed actions). The comment volume inversely correlates with behavior shipped.

[LANGUAGE: Write this file in en per Language Governance.]
---

## Cross-File Interaction Analysis

This section traces the runtime data and control flow between `tmux-copilot.ts`, `tmux-state-query.ts`, and `coordinator.ts` as they execute during a typical delegated session lifecycle. Each interaction below is verified against the source code lines cited.

### I.1 Shared backing system: `SessionManagerAdapter`

All three files interact (directly or indirectly) with the same tmux-integration backing system:

| File | Interaction surface | What it reads / writes |
|------|---------------------|------------------------|
| `tmux-copilot.ts` | `getSessionManagerAdapter()` (line 243), `setSessionManagerAdapter()` via test seam (line 595) | Calls `sendKeys`, `listPanes`, `createPaneGridPlanner`, `respawnIfKnown`, `getLatestCapture`, `onSessionCreated` |
| `tmux-state-query.ts` | `getSessionManagerAdapter()` (line 129) | Reads adapter existence only — never invokes any adapter method (see flaws 1, 2, 7 in §2.5) |
| `coordinator.ts` | `tmuxIntegration.adapter: SessionManagerAdapter` (line 136, 707) | Calls `adapter.onSessionCreated` directly via `spawnTmuxPanelForChild` (line 736) |

**Interaction risk:** Three different injection points for the same backing system. `tmux-copilot.ts` and `tmux-state-query.ts` use the module-level `getSessionManagerAdapter()` getter; `coordinator.ts` carries the adapter as a *dep* (`DelegationCoordinatorDeps.tmuxIntegration`). If the plugin-init order wires the module-level adapter before the coordinator's deps, the two views are the same. If a refactor introduces a second adapter instance, the tools will operate on different state than the coordinator.

### I.2 Dispatch → Panel-spawn → Manual-override chain

The most consequential cross-file interaction is the dispatch pipeline that flows from `coordinator.ts` through `tmux-copilot.ts`:

1. **Coordinator dispatches a child** (`coordinator.ts:dispatch` line 192–312)
   - Calls `childSessionStarter.start()` (line 239) to create the SDK child session.
   - Sets up `lifecycle.register`, `lifecycle.transition("dispatched")` (line 197, 199), notification router registration, and dual-signal completion watching.

2. **Coordinator synthesizes a tmux panel-spawn event** (`coordinator.ts:spawnTmuxPanelForChild` line 700–745)
   - Builds an `EnrichedSessionEvent` with `hivemindMeta` from `getDelegationMeta` (line 712).
   - Invokes `tmuxIntegration.adapter.onSessionCreated(enriched)` (line 736).
   - This is the S5b fix: the SDK may not fire `session.created`, so the coordinator synthesizes the event the tmuxObserver would have produced.

3. **Coordinator starts capture-pane polling** (`coordinator.ts:281`)
   - `this.deps.sessionManager?.startPolling()` ensures the parent tmux panel receives child events in real time.

4. **Operator (via LLM) calls `tmux-copilot:peek`** (`tmux-copilot.ts:394–432`)
   - `peek` summary mode resolves the paneId → sessionId via `getSessionPaneRegistryEntries` (line 416–417), then calls `buildSessionSummary` (line 477).
   - `buildSessionSummary` calls `getSessionMessagesFetcher()` (line 479) — wired from `plugin.ts` to `client.session.messages`.

5. **Operator calls `tmux-copilot:take-over`** (`tmux-copilot.ts:349–385`)
   - Calls `setManualOverrideState(input.sessionId, { manualOverride: true, takenBy: "human-operator", takenAt: Date.now() })` (line 354–358).
   - Optionally injects a prompt via `getSendPrompt()` (line 363–376).

6. **Coordinator's forward-prompt (if used) hits the suppression gate** (`tmux-copilot.ts:301–329`)
   - Reads `getManualOverrideState(context.sessionID)` (line 320) — note: this reads the *operator's* session override, not the *target pane's* override. This is a likely bug: `forward-prompt` is invoked from the orchestrator's session, and `context.sessionID` is the orchestrator's session, but the override state is keyed by the *target* child session. The suppression check reads the wrong session's state.
   - If suppression fires, returns `suppressed: true` with a preview (line 322–328). Otherwise prepends sentinel and calls `adapter.sendKeys` (line 331–335).

**Interaction flaw (compound, not in any single file):** the override state key mismatch between the producer (`take-over` sets it keyed by `input.sessionId` — the *target* session) and the consumer (`forward-prompt` reads it keyed by `context.sessionID` — the *caller's* session). The two files each look correct in isolation; the interaction is broken.

### I.3 Coordinator → Tmux fallback (S5b)

The P58.8 S5b fix is the most explicit cross-file interaction:

- **`coordinator.ts:269-275`** — after `childSessionStarter.start()` returns, calls `spawnTmuxPanelForChild` unconditionally.
- **`coordinator.ts:700-745`** — `spawnTmuxPanelForChild` reads `this.deps.tmuxIntegration` (line 707), bails silently if absent, otherwise calls `adapter.onSessionCreated`.
- **Idempotency contract** (per comment line 268–269): the underlying `SessionManager.onSessionCreated` has guards at `session-manager.ts:223-231` that return early on duplicate calls. This is a *cross-file invariant* documented only in the coordinator comment, not in the session-manager source.

**Interaction risk:** if `session-manager.ts` is refactored and the guards are removed or relaxed, the coordinator's idempotent fallback becomes a double-spawn hazard. The contract is implicit, not enforced.

### I.4 Coordination lifecycle vs. Manual override

`coordinator.ts` and `tmux-copilot.ts` both touch session state, but in orthogonal dimensions:

| Dimension | Owner | Mutator | Key |
|----------|-------|---------|-----|
| Delegation record | coordinator | `lifecycle.register` / `lifecycle.transition` | `delegationId` |
| Child → Delegation map | coordinator | `attachChildSession` | `childSessionId` |
| Manual override | tmux-copilot | `setManualOverrideState` | `sessionId` |
| Pane → Session map | tmux integration (via `getSessionPaneRegistryEntries`) | observer chain | `paneId` |
| Session → Pane map | tmux integration (via `resolveSessionToPaneId`) | adapter | `sessionId` |

**No shared key:** the coordinator and the copilot tool use different state stores that are linked only by the underlying `sessionId` value. There is no single source of truth that says "session X is under manual override AND is child of delegation Y AND lives in pane Z". A consumer wanting to correlate must do the joins manually.

### I.5 Error-envelope shape divergence (consumer impact)

A consumer that calls both `tmux-copilot:send-keys` and `coordinator:dispatch` (indirectly via the delegate-task tool that wraps coordinator) receives two structurally different success and error envelopes:

```
// tmux-copilot success (send-keys)
{ sent: true, paneId: "%5" }

// tmux-copilot error (send-keys fail)
{ sent: false, paneId: "%5", error: { message: "ENOENT: ..." } }

// tmux-copilot error (parse fail)
{ error: { kind: "invalid-input", issues: [...] } }

// tmux-state-query success (always empty)
{ sessions: [] }

// coordinator dispatch success
{ childSessionId, delegationId, evidenceLevel, executionState, queueKey, status }

// coordinator dispatch failure (failDispatch → errorResult)
{ delegationId, error: "[Harness] Native Task dispatch failed: ...", status: "error" }
```

A consumer that wants to write one error-handling path for both must normalize three different shapes: the `kind`-discriminated envelope, the `message`-string envelope, and the flat `error`-string envelope.

### I.6 `tmux-state-query.ts` interaction with siblings

`tmux-state-query.ts` is the most isolated of the three. Its only interaction is the `getSessionManagerAdapter()` bridge check (line 129) — the same bridge check `tmux-copilot.ts` uses. After that check, the tool returns a hardcoded empty/null/zero result (line 142, 150, 158) without invoking any adapter method.

**Net effect on the system:** the tool consumes the same wiring slot (the `getSessionManagerAdapter` channel) as `tmux-copilot.ts` but produces no data. An LLM agent orchestrating tmux operations may prefer `tmux-state-query:list-sessions` (returns `[]` cleanly) over `tmux-copilot:list-panes` (returns full pane state with errors if tmux is broken). The two tools are not complementary; they overlap in the "is tmux alive" diagnostic and diverge in utility.

### I.7 `coordinator.ts` interaction with the gate tools (out of scope but adjacent)

The coordinator does not call `tmux-copilot` or `tmux-state-query` directly. The interaction is one-way: the coordinator writes to the tmux adapter (via `spawnTmuxPanelForChild`), the tmux tools read from the same adapter. The reverse direction (a tmux tool calling the coordinator) does not exist. There is no feedback loop from pane state back to delegation state in the audited code.

**Implication:** the `manualOverride` state set by `tmux-copilot:take-over` is observable to the same tool (`forward-prompt` reads it at line 320) but **not** to the coordinator. The coordinator will keep dispatching child sessions, polling, and watching for completion signals even while a human operator has taken over a pane. The only coupling is the suppressed `forward-prompt` result, which is consumed by the orchestrator agent, not the coordinator.

### I.8 Notification side-channel (Phase 23)

`coordinator.ts:285-291` fires `notifyParentSession(client, parentSessionId, { sessionID, description, agent, status: "started" })`. This is a Phase 23 toast + context injection into the parent session. It does not touch the tmux state at all — it goes through the SDK `client.app.log` or `client.session.prompt` channel. The tmux tools and this notification channel are parallel but not intersecting.

### I.9 Cross-file resolution table

For an LLM agent that needs to navigate from a pane observation back to a delegation record:

```
paneId (from tmux-copilot:list-panes)
   ↓ getSessionPaneRegistryEntries() (tmux-copilot.ts:416)
sessionId
   ↓ getDelegationMeta(sessionId) (coordinator.ts:712, or shared/state.js)
{ agent, delegationId, depth }
   ↓ delegationId
Delegation record (via coordinator.active or lifecycle.getStatus)
```

This chain crosses all three files. The lookup is best-effort and may fail at any step:

- `getSessionPaneRegistryEntries` may return empty (no observer wired).
- `getDelegationMeta` may return undefined (no `EnrichedSessionEvent` ever fired for this child).
- `coordinator.active` may have already deleted the delegation (terminal cleanup at line 591).

There is no single API that gives "everything about pane X" in one call. A consumer that wants this must wire three lookups.

### I.10 Interaction matrix summary

| Consumer ↓ / Producer → | `coordinator:dispatch` | `coordinator:spawnTmuxPanelForChild` | `tmux-copilot:take-over` | `tmux-copilot:forward-prompt` | `tmux-state-query:*` |
|-------------------------|------------------------|--------------------------------------|--------------------------|-------------------------------|---------------------|
| `coordinator:handleCompletion` | sets completion callback (line 306) | n/a | n/a | n/a | n/a |
| `coordinator:handleTimeout` | triggered by lifecycle (line 432) | n/a | n/a | n/a | n/a |
| `coordinator:markExecutionUnconfirmed` | reads child state (line 351) | n/a | n/a | n/a | n/a |
| `tmux-copilot:forward-prompt` | n/a | sets panel, observer fires | **reads override** (wrong session key — see I.2) | n/a | n/a |
| `tmux-copilot:peek` | n/a | observer writes to capture buffer | n/a | n/a | n/a |
| `tmux-copilot:peek-by-session` | n/a | observer writes to capture buffer | n/a | n/a | n/a |
| `tmux-state-query:*` | n/a | n/a | n/a | n/a | self-only (no calls out) |

**Empty rows are not bugs in isolation** — they reflect the architectural choice that the tools do not loop. The empty cell at `tmux-copilot:forward-prompt → tmux-copilot:take-over` is the only true cross-file risk: the override state producer and consumer use different session keys.

---

## Summary Metrics

| File | LOC | Actions/Methods | Stubs | Status values | Integration pts | Flaws |
|------|-----|-----------------|-------|---------------|-----------------|-------|
| tmux-copilot.ts | 596 | 9 actions | 0 | 14+ variants | 10 | 25 |
| tmux-state-query.ts | 162 | 3 actions | 3 (all) | 6 variants | 6 | 11 |
| coordinator.ts | 746 | 15 public methods | 0 | 6 status + 4 executionState + 5 evidenceLevel | 12 | 25 |

**Total flaws documented:** 61
**Highest-risk category:** Inconsistencies across error envelopes (cross-file #4) and silent fallbacks (coordinator flaws #14, #20; tmux-state-query is a silent fallback by design).
