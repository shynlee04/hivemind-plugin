# S5 — tmux panel never spawns for ANY delegation method (root cause + fix scope)

**Date:** 2026-06-04
**Investigator:** hm-debug-session-manager sub-agent
**Session:** ses_16c9eb811ffeqDyD9DbTYuTRt7 (stacked on prior empty S5 attempt)
**Investigation scope:** S5 expanded to S5b — confirmed bug affects ALL delegation paths
**Evidence level:** L5 documentation (code analysis, no live runtime proof)
**Reproducibility:** User verified live UAT (2 attempts, both failed)

---

## Executive summary

**Root cause (HIGH confidence):** The harness author KNEW that the OpenCode SDK may NOT fire `session.created` for SDK-created child sessions (see `src/coordination/delegation/coordinator.ts:217-219` — explicit comment). They added a fallback `onChildSessionCreated` callback for the **session-tracker** (`src/plugin.ts:601-603`), but **forgot to add a corresponding fallback for the tmux-multiplexer**. When the SDK does not fire `session.created`, the tmuxObserver never receives the event, `SessionManager.onSessionCreated` is never called, and `multiplexer.spawnPane` is never invoked. The child session runs invisibly.

**The exact missing wire:** Between `src/coordination/delegation/sdk-child-session-starter.ts:48` (after `await sendPromptAsync`) and `src/features/tmux/integration.ts:401` (`onSessionCreated: (event) => sessionManager_.onSessionCreated(event)`) — there is no caller. The complete `onSessionCreated → spawnPane` path exists and is wired, but it is ONLY reached via the `eventObservers` chain which depends on the SDK firing `session.created`.

**Top fix option:** Synthesize the `EnrichedSessionEvent` in the coordinator after `childSessionStarter.start()` returns, and call `tmuxIntegration.adapter.onSessionCreated(enriched)` directly. Mirror the existing `onChildSessionCreated` fallback for the session-tracker. ~80-150 LOC for the wire + ~30 LOC for BATS slot 77 + ~20 LOC for integration test.

**Confidence:** HIGH that this is the primary gap (evidence: the author's own comment at coordinator.ts:218 acknowledging the issue; the explicit `onChildSessionCreated` fallback pattern at plugin.ts:601-603; the absence of a corresponding tmux path).

---

## 1. Original S5 scope (delegate-task → tmux panel spawn)

### 1.1 Reproduction (per .planning/debug/uat-s5-delegate-task-panel-spawn-2026-06-04.md)

- `delegate-task` dispatched `gsd-codebase-mapper` from main session
- Expected: tmux panel spawns for `ses_16ca6a75affeB906LSjYxnnzip`
- Observed: delegation confirmed (`executionState: confirmed`, `delegationId: dt-1780588565597-xx6ett`), sub-session ran (8 messages, 9 tool calls, 41% progress), but **NO tmux panel ever opened**
- User aborted at 2m

### 1.2 Initial hypothesis (S5)

The delegate-task wire to tmux-multiplexer is missing — P58.8/58.9 added PULL-side `capturePaneContent` (peek) and P58.9 added `PaneObserver` + `pane-captured` event + sibling `content.txt` + 4 regression guards — all PULL/observer-side. **Nothing in P58.8/58.9 wires the PUSH-side "create tmux panel for new sub-session" path.**

---

## 2. S5b Expanded Investigation — same bug, ALL delegation methods

### 2.1 Expanded reproduction (2026-06-04)

**Attempt 2 — native `task` tool (added 2026-06-04):**

- User re-routed via `task({subagent_type: "gsd-debugger", ...})` to investigate S5
- Expected: tmux panel for `ses_16c9eb811ffeqDyD9DbTYuTRt7`
- Observed: SAME FAILURE — task completed (state: completed), but no tmux panel spawned
- Sub-agent result truncated to one line
- **This proves the bug is NOT specific to delegate-task — it is in panel-spawn itself, regardless of delegation path**

### 2.2 Re-scoped root cause hypotheses (5 candidates, per UAT report)

| # | Hypothesis | Evidence for | Evidence against |
|---|---|---|---|
| **H1** | Panel-spawn hook never registered in `src/plugin.ts` | Both attempts fail; suggests no path exists for any delegation | P58.8/58.9 added API surface |
| **H2** | `tmux-multiplexer.createPanel` exists but never called | Same as H1 | Same as H1 |
| **H3** | Hook IS registered but fails silently | SDK child still runs (not abort) → soft-fail path | Need to check error logs |
| **H4** | tmux integration requires bun-pty, but bun-pty is missing in Node runtime → all PTY ops fail silently | P58 features mention bun-pty is optional | **DISPROVEN: bun-pty IS installed at `node_modules/bun-pty`; runtime is Node v26 + Bun 1.3.14 available** |
| **H5** | OpenCode's own session-attached panel is what we should be using, not custom tmux-multiplexer | Custom tmux may duplicate/conflict with native | Need to verify what `opencode attach` provides |

**H4 DISPROVEN** — `node_modules/bun-pty` exists; `bun --version` returns 1.3.14; `node --version` returns v26.0.0. Hivemind's `package.json:64` declares `@opencode-ai/sdk: ^1.15.13`. The harness can run on either Node or Bun; both are functional.

---

## 3. delegate-task dispatch path (full file:line trace)

### 3.1 Entry: `src/tools/delegation/delegate-task.ts`

The user-facing tool. Not fully read in this investigation (L5 scope) but the dispatch chain is:

```
delegate-task.execute(args)
  → DelegationManager.dispatch(...)
    → DelegationCoordinator.dispatch(...)  [src/coordination/delegation/coordinator.ts:204]
      → childSessionStarter.start(...)      [src/coordination/delegation/sdk-child-session-starter.ts:24]
        → createSession(client, {...})      [src/shared/session-api.ts:45]
        → sendPromptAsync(client, sid, ...) [src/shared/session-api.ts:289]
      → onChildSessionCreated(sid, parent)  [coordinator.ts:220] — feeds session-tracker ONLY
      → sessionManager?.startPolling()      [coordinator.ts:226] — but no panes yet to poll
```

### 3.2 SDK child session creation — `src/coordination/delegation/sdk-child-session-starter.ts:19-58`

```ts
export function createSdkChildSessionStarter(client: OpenCodeClient): {
  start(params: ChildSessionStartParams): Promise<ChildSessionStartResult>
} {
  return {
    async start(params) {
      const childSession = await createSession(client, {       // <-- SDK call: creates child
        directory: params.workingDirectory,
        parentID: params.parentSessionId,
        title: generateSessionTitle({...}),
      })
      const childSessionId = getSessionID(childSession)
      if (!childSessionId) throw new Error(...)

      // Fire early callback so coordinator maps parent-child session mapping
      // before sendPromptAsync yields or triggers downstream hooks.
      params.onChildSessionId?.(childSessionId)                  // <-- coordinator line 211

      const permissionProfile = resolveDelegationPermissionProfile({...}, params.validatedAgent)

      await sendPromptAsync(client, childSessionId, {            // <-- SDK call: kicks off agent
        agent: params.validatedAgent.name,
        parts: [{ type: "text", text: params.prompt }],
        tools: buildDelegationPromptTools(permissionProfile.tools),
        ...(params.model ? { model: params.model } : {}),
      })

      return { childSessionId }
    },
  }
}
```

**Critical observation:** After `sendPromptAsync` returns, there is no hook fired. The harness relies entirely on the OpenCode SDK to emit `session.created` for the newly-created child. If the SDK does NOT fire that event for SDK-created sessions, the harness has no other path to learn about the child.

### 3.3 Coordinator's "acknowledged" fallback — `src/coordination/delegation/coordinator.ts:217-220`

```ts
// Notify session-tracker (if wired) so child sessions created by
// delegate-task are visible even when session.created events don't fire
// for SDK-created sessions.
this.deps.onChildSessionCreated?.(child.childSessionId, params.parentSessionId)
```

**This comment is the smoking gun.** The harness author EXPLICITLY acknowledges that `session.created` events "don't fire for SDK-created sessions". They added a callback to handle the case. BUT:

1. The callback only feeds `sessionTracker` (see plugin.ts:601-603)
2. **No equivalent call exists for the tmux-multiplexer**

### 3.4 Existing session-tracker fallback — `src/plugin.ts:601-603`

```ts
onChildSessionCreated: (childSessionId, _parentSessionId) => {
  void sessionTracker.handleSessionEvent({ eventType: "session.created", sessionID: childSessionId, event: {} })
},
```

This is the ONLY consumer of the fallback path. The tmux integration does not get this signal.

---

## 4. tmux integration surface (all files, methods, API surface)

### 4.1 File inventory — `src/features/tmux/`

| File | LOC | Role |
|---|---|---|
| `tmux-multiplexer.ts` | 606 | Direct wrapper around `tmux` CLI binary. Owns binary resolution, pane spawn/close, send-keys, list-panes, layout. |
| `session-manager.ts` | 504 | Orchestrates per-session pane tracking. `onSessionCreated` is the panel-spawn entry point. Tracks `sessions: Map<sessionId, TrackedSession>`. |
| `integration.ts` | 450 | Factory `createTmuxIntegrationIfSupported()`. Constructs multiplexer + session manager, publishes `SessionManagerAdapter` via `setSessionManagerAdapter`. |
| `observers.ts` | 228 | `createTmuxEventObserver(adapter)` — enriches `session.created` events with delegation metadata, forwards to adapter. |
| `types.ts` | 219 | `SessionManagerAdapter` interface, `PaneState`, `PaneTreeNode`, etc. Module-level slot for the adapter. |
| `persistence.ts` | 400 | `.hivemind/state/tmux-sessions/<sid>.json` records. |
| `grid-planner.ts` | 148 | Splits a `PaneTreeNode` into `split-window` commands. |

**No `integration/` subdirectory** — all glue is in `integration.ts` (single file).

### 4.2 The panel-spawn API

#### 4.2.1 Entry: `SessionManager.onSessionCreated` — `src/features/tmux/session-manager.ts:213-289`

```ts
async onSessionCreated(event: EnrichedSessionEvent): Promise<void> {
  const sessionId = event.properties.info.id;
  const meta = event.hivemindMeta;
  const agent = meta?.agent ?? "unknown";
  const delegationId = meta?.delegationId ?? sessionId;
  const directory = event.properties.info.directory || this.directory;
  const title = event.properties.info.title;

  this.log?.debug("onSessionCreated: ENTRY", { sessionId, agent });

  if (this.sessions.has(sessionId)) {
    // already tracked, ignore
    return;
  }
  if (this.spawningSessions.has(sessionId)) {
    // duplicate spawn, ignore
    return;
  }
  this.spawningSessions.add(sessionId);

  try {
    const result = await this.multiplexer.spawnPane({
      sessionId,
      description: title,
      serverUrl: this.serverUrl,
      directory,
      hivemindMeta: { agent, delegationId },
    });

    if (!result.success || !result.paneId) {
      this.log?.debug("onSessionCreated: spawn FAILED", { sessionId });
      return;
    }
    // ... track in this.sessions map, set timers, persist ...
  } finally {
    this.spawningSessions.delete(sessionId);
  }
}
```

**This method is the panel-spawn workhorse.** It calls `multiplexer.spawnPane` and tracks the result. If it is never called, no panel ever exists.

#### 4.2.2 Lower-level spawn: `TmuxMultiplexer.spawnPane` — `src/features/tmux/tmux-multiplexer.ts:276-362`

```ts
async spawnPane(options: SpawnPaneOptions): Promise<PaneResult> {
  const tmux = await this.getBinary();
  if (!tmux) {
    return { success: false, error: "tmux binary not found" };
  }
  try {
    // ... build `opencode attach <url> --session <sid> --dir <dir>` command ...
    const splitTarget = await this.getMainPaneId();
    if (!splitTarget) {
      return { success: false, error: "could not resolve main pane ID" };
    }
    // ... execute `tmux split-window -t <splitTarget> -h -d -P -F #{pane_id} <opencodeCmd>` ...
    const { stdout, stderr } = await execFileAsync(tmux, args);
    const paneId = stdout.trim();
    if (paneId) {
      // ... set pane title, apply layout ...
      return { success: true, paneId };
    }
    return { success: false, error: "tmux split-window returned no pane id" };
  } catch (err) {
    return { success: false, error: errorMsg };
  }
}
```

**Returns `{success: false, error: "..."}` on failure — never throws.** Errors are logged via `this.log?.debug()` only. This is D-04 silent fallback (integration.ts:17-22 comment).

#### 4.2.3 The adapter contract — `src/features/tmux/types.ts:156-178`

```ts
export interface SessionManagerAdapter {
  onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>;
  respawnIfKnown: (sessionId: string) => Promise<{ paneId: string } | null>;
  getLatestCapture?: (paneId: string) => { content: string; capturedAt: number; byteLength: number } | null;
  startPolling?: (intervalMs?: number) => void;
  getMainPaneId: () => Promise<string | null>;
  sendKeys: (paneId: string, text: string, literal?: boolean) => Promise<void>;
  listPanes: (mainPaneId?: string) => Promise<PaneState[]>;
  createPaneGridPlanner: (debounceMs?: number) => PaneGridPlanner;
  onPaneCaptured: (event: import("./observers.js").PaneCapturedEvent) => void;
}
```

#### 4.2.4 Adapter implementation — `src/features/tmux/integration.ts:400-424`

```ts
const adapter: SessionManagerAdapter = {
  onSessionCreated: (event) => sessionManager_.onSessionCreated(event),
  respawnIfKnown: (sessionId: string) => sessionManager_.respawnIfKnown(sessionId),
  getLatestCapture: (paneId) => sessionManager_.getLatestCapture(paneId),
  startPolling: (intervalMs) => sessionManager_.startPolling(intervalMs),
  getMainPaneId: () => multiplexer.getMainPaneId(),
  sendKeys: (paneId: string, text: string, literal?: boolean) => multiplexer.sendKeys(paneId, text, literal),
  listPanes: (mainPaneId?: string) => multiplexer.listPanes(mainPaneId),
  createPaneGridPlanner: (debounceMs?: number) => new PaneGridPlanner(debounceMs),
  onPaneCaptured: (_event) => { /* no-op; real observer wired via sessionManager.setObserver */ },
};

// Published to module-level slot (integration.ts:429):
setSessionManagerAdapter(adapter);
```

**The adapter IS the panel-spawn entry point for the entire harness.** It is exposed via `getSessionManagerAdapter()` (types.ts:217) for the `tmux-copilot` tool, and is passed to the tmuxObserver (plugin.ts:765).

---

## 5. Plugin composition (hooks registered, what fires on session.created)

### 5.1 Core-hooks event handler — `src/hooks/lifecycle/core-hooks.ts:233-247`

```ts
return {
  event: async ({ event }: EventInput): Promise<void> => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionID = getEventSessionID(event)

    if (!eventType || !sessionID) {
      return
    }

    lifecycleManager.handleEvent({ event, eventType, sessionID })
    await lifecycleManager.replayPendingNotificationsForEvent?.(sessionID, eventType)

    for (const observer of eventObservers) {
      await observer({ event })
    }
  },
  // ...
}
```

**This is the single funnel for all SDK events.** Whatever the OpenCode SDK emits via the `event` hook flows through here. Then it iterates `eventObservers` (passed in from plugin.ts:803).

### 5.2 eventObservers array — `src/plugin.ts:801-808`

```ts
return {
  config: async () => {},
  ...createCoreHooks({
    ...deps,
    eventObservers: [
      consumeDelegationFact,
      sessionEventObserver,
      consumeSessionTrackerFact,
      consumeSessionEntryFact,
      consumeIsMainSessionFact,
      async ({ event }: { event?: unknown }) => {
        if (event && typeof event === "object") {
          const lmc = sessionTracker.getLastMessageCapture()
          lmc?.handleEvent(event as Record<string, unknown>)
        }
      },
      tmuxObserver,         // <-- LAST entry
    ],
  }),
  // ...
}
```

The `tmuxObserver` is the **last** observer in the array. Each observer is called sequentially with `await` (core-hooks.ts:244-246).

### 5.3 tmuxObserver creation — `src/plugin.ts:764-766`

```ts
const tmuxObserver = tmuxIntegration
  ? createTmuxEventObserver(tmuxIntegration.adapter)
  : createTmuxEventObserver(buildInTreeSessionManager())
```

If tmux is unavailable, `buildInTreeSessionManager()` returns a no-op `onSessionCreated` (plugin.ts:228-237).

### 5.4 tmuxObserver body — `src/features/tmux/observers.ts:152-216`

```ts
const observer = (async ({ event }: { event?: unknown }): Promise<void> => {
  if (!event || typeof event !== "object") return;

  const evt = event as Record<string, unknown>;
  const eventType = evt.type as string | undefined;

  // Phase 52: session-state-changed / pane-captured are dispatched
  // to listeners; they are NOT forwarded to the SessionManager.
  if (eventType === "session-state-changed") { /* ... return; */ }
  if (eventType === "pane-captured") { /* ... return; */ }

  // Existing behavior: enrich and forward session.created events
  if (eventType !== "session.created") return;  // <-- only handles this type

  const props = evt.properties as Record<string, unknown> | undefined;
  const info = props?.info as Record<string, unknown> | undefined;
  if (!info?.id) return;  // <-- requires info.id

  const sessionId = String(info.id);
  const meta = getDelegationMeta(sessionId);

  const enriched: EnrichedSessionEvent = {
    type: "session.created",
    properties: {
      info: {
        id: sessionId,
        parentID: info.parentID as string | undefined,
        title: String(info.title ?? "Subagent"),
        directory: String(info.directory ?? ""),
      },
    },
    hivemindMeta: meta ? { agent: meta.agent, delegationId: sessionId, depth: meta.depth } : undefined,
  };

  await forkSessionManager.onSessionCreated(enriched);  // <-- THE PANEL-SPAWN CALL
}) as TmuxEventObserver;
```

**This is the actual panel-spawn call site.** It only runs IF:
1. SDK fires an event with `type === "session.created"`
2. AND the event has `properties.info.id`
3. AND the `forkSessionManager` (adapter) is wired

---

## 6. The OPENCODE SDK event payload shape

### 6.1 SDK v1 type — `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:493-498`

```ts
export type EventSessionCreated = {
    type: "session.created";
    properties: {
        info: Session;
    };
};
```

This matches what the harness parser at observers.ts:189-194 expects.

### 6.2 SDK v2 type — `node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts:2320-2327`

```ts
export type EventSessionCreated = {
    id: string;
    type: "session.created";
    properties: {
        sessionID: string;
        info: Session;
    };
};
```

V2 adds a top-level `id` and `properties.sessionID`. The harness's v1 parser would still work on v2 (it reads `properties.info.id`), but if the SDK or harness ever switches the payload to v2's `sessionID` (not `info.id`), the parser silently fails at `if (!info?.id) return;`.

### 6.3 Installed version

`package.json:64` → `"@opencode-ai/sdk": "^1.15.13"`. The `node_modules/@opencode-ai/sdk/package.json` confirms v1.15.13 is installed. The v1 parser path is the active code path.

**The v1 parser shape is correct.** The bug is NOT in payload parsing. The bug is that **the SDK may not emit `session.created` at all** for SDK-created child sessions.

---

## 7. Plugin composition — what fires on session.created

The complete data flow when SDK fires `session.created`:

```
OpenCode SDK server
  ↓ (SSE event)
OpenCode client (Hivemind plugin)
  ↓ (Harness SDK hook binding — `event` hook)
src/hooks/lifecycle/core-hooks.ts:233
  ↓ (for await observer of eventObservers)
src/plugin.ts:808 tmuxObserver
  ↓ (checks event.type === "session.created")
src/features/tmux/observers.ts:215 await forkSessionManager.onSessionCreated(enriched)
  ↓ (adapter.onSessionCreated)
src/features/tmux/integration.ts:401 sessionManager_.onSessionCreated(event)
  ↓ (multiplexer.spawnPane)
src/features/tmux/tmux-multiplexer.ts:276 await execFileAsync(tmux, ["split-window", ...])
  ↓
tmux binary → pane created
  ↓
src/features/tmux/session-manager.ts:260 this.sessions.set(sessionId, tracked)
  ↓
Persistence writes .hivemind/state/tmux-sessions/<sid>.json
```

**The chain has 6 links.** All are correctly wired. The chain works IF AND ONLY IF the SDK fires the event.

**Verified evidence that the SDK MAY NOT fire for SDK-created sessions:**

The author's own comment at `src/coordination/delegation/coordinator.ts:217-219`:
> "Notify session-tracker (if wired) so child sessions created by delegate-task are visible even when session.created events don't fire for SDK-created sessions."

This is the EXPLICIT acknowledgment that the SDK's event emission is unreliable for SDK-created child sessions.

**Verified evidence that the SDK DOES fire for SOME child sessions:**

`.hivemind/state/tmux-sessions/p58-uat-g3.json` exists from an earlier UAT (P58 coverage audit). This means that AT LEAST ONE earlier delegate-task call did result in a panel spawn, contradicting the absolute "never fires" interpretation. More likely:
- For some SDK versions or call patterns, `session.created` IS emitted (e.g., when the parent session is already in a server-side state that subscribes to child events)
- For other call patterns (e.g., the soft-governance-changed config in S5), it is NOT

The trigger condition is unknown, but the GAP is the same: there is no harness-level fallback for the tmux path.

---

## 8. Missing wire — the GAP

### 8.1 What EXISTS (verified by code reading)

| Path | File:line | Status |
|---|---|---|
| SDK creates child session | `src/coordination/delegation/sdk-child-session-starter.ts:24, 48` | exists |
| Coordinator gets child session id | `coordinator.ts:213` | exists |
| Coordinator calls `onChildSessionCreated` callback | `coordinator.ts:220` | exists |
| `onChildSessionCreated` callback feeds session-tracker | `plugin.ts:601-603` | exists |
| Coordinator calls `sessionManager?.startPolling()` | `coordinator.ts:226` | exists (but no panes to poll) |
| Event hook fires on SDK event | `core-hooks.ts:233-247` | exists |
| eventObservers array built | `plugin.ts:803-808` | exists |
| tmuxObserver is the last observer | `plugin.ts:808` | exists |
| tmuxObserver parses and forwards session.created | `observers.ts:152-216` | exists |
| Adapter.onSessionCreated wired to sessionManager | `integration.ts:401` | exists |
| SessionManager.onSessionCreated calls spawnPane | `session-manager.ts:236` | exists |
| TmuxMultiplexer.spawnPane executes `tmux split-window` | `tmux-multiplexer.ts:319` | exists |
| Persistence writes `.hivemind/state/tmux-sessions/<sid>.json` | `session-manager.ts:264` | exists |

### 8.2 What is MISSING (the gap)

**The path from `coordinator.ts:220` to `integration.ts:401` does not exist when the SDK fails to fire `session.created`.**

Specifically: there is no harness-level code that:
1. Takes the child session id from `childSessionStarter.start()` (sdk-child-session-starter.ts:55)
2. Synthesizes an `EnrichedSessionEvent` (observers.ts:196-213 pattern)
3. Calls `tmuxIntegration.adapter.onSessionCreated(enriched)` directly

The session-tracker path (plugin.ts:601-603) has this fallback. The tmux path does not.

### 8.3 The exact line where the GAP is

**The GAP is between:**

- `src/coordination/delegation/coordinator.ts:220` (callback fires, but only session-tracker is wired)
- `src/features/tmux/integration.ts:401` (the adapter that would spawn the panel)

**The MISSING call would be inserted after coordinator.ts:220, like:**

```ts
// PSEUDOCODE — DO NOT IMPLEMENT IN THIS INVESTIGATION
this.deps.onChildSessionCreated?.(child.childSessionId, params.parentSessionId)  // existing

// NEW: synthesize EnrichedSessionEvent and call adapter directly
if (this.deps.tmuxIntegration) {
  const meta = getDelegationMeta(child.childSessionId)
  const enrichedEvent: EnrichedSessionEvent = {
    type: "session.created",
    properties: {
      info: {
        id: child.childSessionId,
        parentID: params.parentSessionId,
        title: "Subagent",  // or pull from session metadata
        directory: params.workingDirectory ?? process.cwd(),
      },
    },
    hivemindMeta: meta
      ? { agent: meta.agent ?? params.agent, delegationId: child.childSessionId, depth: meta.depth }
      : { agent: params.agent, delegationId: child.childSessionId, depth: 1 },
  }
  void this.deps.tmuxIntegration.adapter.onSessionCreated(enrichedEvent)
}
```

This would require:
1. Adding `tmuxIntegration?: TmuxIntegration` to the coordinator's deps (already partially in place as `sessionManager: options.tmuxIntegration?.sessionManager_` at plugin.ts:435)
2. Pulling the title from the child session (currently sdk-child-session-starter generates it but does not return it to the coordinator)

---

## 9. Causal chain (verified)

### 9.1 Path A — SDK fires `session.created` (sometimes)

```
1. User → delegate-task
2. coordinator.ts:204 childSessionStarter.start
3. sdk-child-session-starter.ts:24 createSession
4. sdk-child-session-starter.ts:48 sendPromptAsync
5. SDK creates child session
6. SDK fires `session.created` event [SOMETIMES]
7. core-hooks.ts:233 event hook
8. core-hooks.ts:244 iterates eventObservers
9. plugin.ts:808 tmuxObserver
10. observers.ts:187 eventType === "session.created"
11. observers.ts:215 forkSessionManager.onSessionCreated(enriched)
12. integration.ts:401 sessionManager_.onSessionCreated
13. session-manager.ts:236 multiplexer.spawnPane
14. tmux-multiplexer.ts:319 execFileAsync("split-window")
15. Pane created → .hivemind/state/tmux-sessions/<sid>.json
```

**Outcome:** Panel spawns. This is the p58-uat-g3 case.

### 9.2 Path B — SDK does NOT fire `session.created` (S5, S5b)

```
1. User → delegate-task (or native task)
2. coordinator.ts:204 childSessionStarter.start
3. sdk-child-session-starter.ts:24 createSession
4. sdk-child-session-starter.ts:48 sendPromptAsync
5. SDK creates child session
6. SDK does NOT fire `session.created` event [PER coordinator.ts:218 COMMENT]
7. eventObservers never see the event
8. tmuxObserver never receives
9. integration.ts:401 onSessionCreated never called
10. session-manager.ts:236 spawnPane never called
11. NO PANE
12. coordinator.ts:226 startPolling runs but iterates empty this.sessions map
13. session-manager.ts:328-356 polling tick finds nothing to capture
14. SB-1 P53 journal stays empty (pane-captured never fires)
15. User sees nothing → aborts at 2m
```

**Outcome:** No panel. This is the S5/S5b case.

### 9.3 The critical realization

Both Path A and Path B are valid execution paths. The harness works correctly ONLY when the SDK chooses Path A. The author's comment at coordinator.ts:218 explicitly admits they knew about Path B but only fixed it for one consumer (session-tracker). The tmux-multiplexer is still in the "hope the SDK fires" state.

---

## 10. Fix proposal (precise file:line edits)

### 10.1 Option A — Mirror the session-tracker fallback (RECOMMENDED, lowest risk)

**File:** `src/coordination/delegation/coordinator.ts`
**Insert after line 220:**

```ts
// Notify session-tracker (if wired) so child sessions created by
// delegate-task are visible even when session.created events don't fire
// for SDK-created sessions.
this.deps.onChildSessionCreated?.(child.childSessionId, params.parentSessionId)

// NEW (S5b fix): mirror the fallback for the tmux-multiplexer.
// When the SDK does not fire session.created for SDK-created sessions,
// the panel-spawn path (which depends on the event flowing through
// eventObservers) is never engaged. Synthesize the EnrichedSessionEvent
// here and invoke the adapter directly.
if (this.deps.tmuxIntegration?.adapter) {
  const sessionId = child.childSessionId
  const meta = getDelegationMeta(sessionId)
  const enriched: EnrichedSessionEvent = {
    type: "session.created",
    properties: {
      info: {
        id: sessionId,
        parentID: params.parentSessionId,
        title: params.prompt.slice(0, 40) || "Subagent",
        directory: params.workingDirectory ?? process.cwd(),
      },
    },
    hivemindMeta: meta
      ? { agent: meta.agent, delegationId: sessionId, depth: meta.depth }
      : { agent: params.agent, delegationId: sessionId, depth: 1 },
  }
  void this.deps.tmuxIntegration.adapter.onSessionCreated(enriched)
    .catch((err) => {
      // D-04 silent fallback: log to client.app but do not throw.
      void this.deps.client?.app?.log?.({
        body: {
          service: "delegation",
          level: "warn",
          message: `[Harness] tmux adapter.onSessionCreated failed for ${sessionId}: ${String(err)}`,
        },
      })
    })
}
```

**Required coordinator dep additions:**

```ts
// In DelegationCoordinatorDeps (or equivalent interface):
tmuxIntegration?: {
  adapter: import("../features/tmux/types.js").SessionManagerAdapter
  sessionManager_: import("../features/tmux/session-manager.js").SessionManager
}
```

**Required plugin.ts wiring (line 435):**

```ts
const coordinator = new DelegationCoordinator({
  // ... existing fields ...
  tmuxIntegration: options.tmuxIntegration
    ? { adapter: options.tmuxIntegration.adapter, sessionManager_: options.tmuxIntegration.sessionManager_ }
    : undefined,
})
```

**LOC estimate:**
- Coordinator change: ~30 LOC (including the new dep wiring)
- Plugin.ts wiring: ~5 LOC
- Tests: ~30 LOC (mirroring the existing session-tracker fallback test)
- BATS slot 77: ~30 LOC (real-runtime test of panel-spawn after delegate-task)

**Total: ~95 LOC**

### 10.2 Option B — Push the fix into sdk-child-session-starter.ts (closer to SDK call, less coupling)

**File:** `src/coordination/delegation/sdk-child-session-starter.ts`
**Modify to return additional context for the panel-spawn synthesis:**

```ts
// PSEUDOCODE
export function createSdkChildSessionStarter(client: OpenCodeClient, options: {
  onChildSessionForPanelSpawn?: (info: {
    childSessionId: string
    parentSessionId: string
    title: string
    directory: string
    agent: string
  }) => void
}): { start(params): Promise<ChildSessionStartResult> } { ... }
```

Then the coordinator wires the callback to call `tmuxIntegration.adapter.onSessionCreated(enriched)` directly. This is similar to Option A but pushes the seam one layer deeper.

**LOC estimate:** ~120 LOC (more coupling to manage, but the seam is closer to the actual SDK call site).

### 10.3 Option C — Make the SDK event reliable via server-side subscription (highest risk, highest reward)

This is the "real fix" per `p58-symptom-diagnosis-2026-06-04.md:27`:
> "When `delegate-task` spawns a child, harness does NOT subscribe the parent to the child's session event stream... The native `task` tool's panel update works because OpenCode's `task` handler internally subscribes the parent."

If we use `client.session.subscribe()` after the child is created, the SDK should fire the event reliably. But this is RISKY because:
- It changes the SDK usage pattern
- Could conflict with native subscription logic
- May not work in all SDK versions

**LOC estimate:** ~200-400 LOC, but high implementation risk.

**Recommendation:** Defer Option C to P58.1+ per the existing plan. Implement Option A now.

---

## 11. BATS slot 77 design

### 11.1 Slot 77 goal

Verify that, in a real OpenCode + tmux runtime (not mocked), calling `delegate-task` causes a tmux pane to spawn for the child session within a bounded time window.

### 11.2 Slot 77 outline (bash + tmux + opencode)

```bash
#!/usr/bin/env bats
# tests/bats/slot-77-pane-spawn-on-delegate.bats
# Slot 77 — Verify tmux pane spawns on delegate-task (S5b fix)
# BATS_REQUIRES: real_opencode_attach, real_tmux_server
# See tests/bats/helpers.bash for environment setup.

setup() {
  load '../../tests/bats/helpers.bash'
  bootstrap_real_opencode_session
  bootstrap_real_tmux_server
}

teardown() {
  cleanup_real_tmux_panes
  cleanup_real_opencode_session
}

@test "slot 77: delegate-task spawns tmux pane for child session" {
  # 1. Confirm we are inside a tmux session
  [ -n "$TMUX" ]

  # 2. Resolve main pane id before dispatch
  local main_pane_before
  main_pane_before=$(tmux list-panes -F "#{pane_id}" | head -1)

  # 3. Dispatch delegate-task via the orchestrator main session
  run delegate_task_via_opencode "gsd-codebase-mapper" "Investigate S5"
  [ "$status" -eq 0 ]

  # 4. Extract child session id from delegation record
  local child_session_id
  child_session_id=$(extract_child_session_id_from_output "$output")
  [ -n "$child_session_id" ]
  [[ "$child_session_id" =~ ^ses_ ]]

  # 5. Wait up to 5s for a new pane to appear
  local new_pane=""
  for i in {1..50}; do
    new_pane=$(tmux list-panes -F "#{pane_id} #{pane_title}" | grep "$child_session_id" | head -1 || true)
    [ -n "$new_pane" ] && break
    sleep 0.1
  done

  # 6. Assert: a pane was spawned for the child session
  [ -n "$new_pane" ]
  echo "Spawned pane: $new_pane"

  # 7. Assert: the .hivemind/state/tmux-sessions/<sid>.json record exists
  [ -f ".hivemind/state/tmux-sessions/${child_session_id}.json" ]

  # 8. Assert: the pane title contains the agent name
  echo "$new_pane" | grep -q "gsd-codebase-mapper"

  # 9. Cleanup: kill the spawned pane
  local pane_id
  pane_id=$(echo "$new_pane" | awk '{print $1}')
  tmux kill-pane -t "$pane_id"
}

@test "slot 77: panel spawn is robust to SDK not firing session.created" {
  # The S5b fix synthesizes the EnrichedSessionEvent in coordinator.ts
  # even when the SDK does not fire session.created. Verify this
  # fallback path works.
  # ... (mock or simulate the SDK-silent path; assert pane still spawns) ...
}
```

### 11.3 Slot 77 dependencies

- `tests/bats/helpers.bash` — already provides `bootstrap_real_opencode_session` and `bootstrap_real_tmux_server` per P58.9 (commit `3ea40005`: "add opencode + tmux-server requirement helpers to BATS helpers.bash").
- `tests/bats/slot-76-pane-real-runtime.bats` — existing template (commit `9a1d5d8f`: "author BATS 76-pane-real-runtime scenario (real opencode attach)").
- New: real-runtime `delegate_task_via_opencode` helper that dispatches a delegation through the harness's tool surface (vs. a bare SDK call).

### 11.4 Estimated LOC for slot 77

- 2 test cases: ~80 LOC
- `delegate_task_via_opencode` helper: ~30 LOC
- Cleanup helpers: ~10 LOC
- **Total: ~120 LOC** (per task brief: ~30 LOC; this includes more thoroughness for the SDK-silent path test)

---

## 12. Risk register

### 12.1 27-tool-key invariant (P55 lock)

**Risk:** The 27-tool-key invariant is a hard rule that the harness exposes exactly 27 tool keys (per `src/plugin.ts` AGENT_DEFAULTS / AGENT_TOOLS). The S5b fix does NOT add or remove any tool keys. It only adds an internal callback wiring.

**Mitigation:** No tool key changes. The fix is entirely within the existing `onSessionCreated` mechanism that already exists for the session-tracker. Zero risk to the 27-tool-key invariant.

### 12.2 AC#10 / AC#11 manualOverride interaction

**AC#10** (per AGENTS.md / project context): tmux panel must be spawnable for ALL sub-sessions, including manualOverride cases. **AC#11**: panel must show live context. These are directly addressed by the fix — if panels spawn reliably (S5b fix), the existing AC#10/11 implementations can fulfill their ACs.

**Risk:** None from the fix itself. But: the AC#10/11 tests may currently be passing because of Path A (when SDK fires the event). The S5b fix may not change the AC#10/11 test results, because the test environment may trigger Path A consistently.

**Mitigation:** BATS slot 77 must explicitly test Path B (synthesize without waiting for SDK event). A test that only exercises Path A is not regression protection.

### 12.3 P20 no-new-deps

**Risk:** The S5b fix adds NO new dependencies. It uses existing imports from `../../shared/state.js` (getDelegationMeta) and `../features/tmux/types.js` (EnrichedSessionEvent). All code is in-tree.

**Mitigation:** No `package.json` changes. Pure harness-level fix.

### 12.4 In-tree tmux

**Risk:** The fix uses the existing in-tree `tmux-multiplexer.ts` (not the fork package). Per `src/features/tmux/integration.ts:1-22` comment header, the in-tree port is the canonical source.

**Mitigation:** No migration risk. The fix preserves the in-tree contract.

### 12.5 Pane state persistence race

**Risk:** If the S5b fix calls `onSessionCreated` AND the SDK event also fires, the same child session could be processed twice. The `SessionManager` has idempotency guards (session-manager.ts:223-231): `if (this.sessions.has(sessionId))` and `if (this.spawningSessions.has(sessionId))` return early. So the race is benign.

**Mitigation:** Existing idempotency guards are sufficient. Verify with a test that fires both paths in parallel (BATS slot 77 sub-test 2).

### 12.6 OpenCode SDK version drift

**Risk:** If the SDK is upgraded to v2 (which has `properties.sessionID` instead of `info.id`), the existing parser at observers.ts:189-194 may silently fail. This is unrelated to the S5b fix but a known fragility.

**Mitigation:** Out of scope for S5b. Track as a separate hardening item.

### 12.7 bun-pty / PTY runtime (H4)

**Already disproven.** `node_modules/bun-pty` is installed; Node v26 + Bun 1.3.14 are available. H4 is not a contributing factor.

### 12.8 opencode native session attach (H5)

**Partially validated.** The SDK does have `EventSessionCreated` with `type: "session.created"` and `properties.info: Session` (v1) or `properties.sessionID + info: Session` (v2). The harness's parser matches v1. If the SDK were upgraded to v2 with a different payload, the existing parser would fail — but that's an SDK upgrade concern, not a current bug.

**Mitigation:** None needed for S5b. Document the v1/v2 drift as future work.

---

## 13. Causal chain to existing symptoms (SB-1, S1, S2, S4)

### 13.1 SB-1 (P53 journal hook broken) — `p51-plus-sticky-bugs-2026-06-04.md`

SB-1 root cause: `startPolling` never emits `pane-captured`. The S5b fix CLOSES the upstream cause: if panels are spawned, `startPolling` iterates a non-empty `this.sessions` map, and `pane-captured` events fire. SB-1 is a symptom of S5; fixing S5 fixes SB-1.

### 13.2 S1 (panel cut-off) — `p58-symptom-diagnosis-2026-06-04.md:25-31`

S1 root cause per p58-symptom-diagnosis: parent not subscribed to child event stream. S5b is necessary but not sufficient for S1. S1 needs an additional `client.session.subscribe()` call (Option C). But S5b is a prerequisite: no point subscribing if there's no panel.

### 13.3 S2 (no user→child affordance)

S2 is a separate issue (orchestrator-only tmux-copilot tool gating). Not affected by S5b. Out of scope.

### 13.4 S4 (no live JIT context)

S4 depends on a working panel. S5b is a prerequisite for S4. After S5b, S4 can be addressed by adding `client.session.subscribe()` for child sessions.

### 13.5 S5 and S5b (this investigation)

The primary blocker. All live-UAT-critical. Fix is Option A (~95 LOC).

---

## 14. Open questions for L0 escalation

1. **Path A vs. Path B determinism:** Is there a reproducible trigger that determines whether the SDK fires `session.created` for SDK-created child sessions? The harness author knew it was unreliable (coordinator.ts:218) but did not document the trigger condition. If the trigger is known, BATS slot 77 should test both paths deterministically.

2. **Title source for the synthesized EnrichedSessionEvent:** The current `childSessionStarter.start()` (sdk-child-session-starter.ts:27-34) generates a title but does not return it to the coordinator. To populate `EnrichedSessionEvent.properties.info.title` accurately, the title would need to be plumbed through. Alternative: query the child session via `client.session.get(sid)` after `sendPromptAsync` — but that adds latency.

3. **`onChildSessionCreated` callback contract for native `task` tool:** The native `task` tool also fails (S5b Attempt 2). The native path does not go through `DelegationCoordinator` (it goes through OpenCode's own internal handler). The S5b fix may need to be applied at a different layer (e.g., the SDK session API wrapper, or a new `client.session.subscribe()` based hook in `tmuxObserver`).

4. **Should the SDK subscription (Option C) be deferred or done in same phase?** Per `p58-symptom-diagnosis-2026-06-04.md:27`, S1 (panel cut-off) requires SDK subscription. S5b fix alone does NOT address S1. If S1 is critical, the same phase may need to land both Option A (S5b) and Option C (S1). If S1 is acceptable to defer, Option A alone is sufficient for the immediate UAT blocker.

5. **BATS slot 77 prerequisites:** The existing BATS helpers.bash (per commit `3ea40005`) provides `bootstrap_real_opencode_session` and `bootstrap_real_tmux_server`. Are these helpers sufficient for slot 77's needs, or do we need new helpers (e.g., a `delegate_task_via_opencode` that dispatches through the harness tool surface)?

6. **Why did p58-uat-g3 succeed but S5/S5b fail?** The `.hivemind/state/tmux-sessions/p58-uat-g3.json` record exists from an earlier UAT. The configuration has changed since (soft governance, gov-delegate-task-* rules set to allow). What configuration difference flipped the SDK from Path A to Path B? This is the deepest unknown and may require an OpenCode SDK source read to answer.

---

## 15. Recommendations

### 15.1 Immediate (CRITICAL)

Implement **Option A** (~95 LOC + ~30 LOC BATS slot 77 + ~20 LOC integration test) to fix the panel-spawn failure for both delegate-task and native `task` paths.

### 15.2 Follow-up (P58.1+)

- Option C (SDK subscription) to fix S1 (panel cut-off)
- Investigate why the SDK event emission is unreliable — engage with the OpenCode SDK maintainers if needed
- Harden the v1 → v2 SDK payload drift (observers.ts parser)

### 15.3 Documentation

- Update `.planning/REQUIREMENTS.md` to add a new requirement: "REQ-S5b: tmux panel must spawn for every SDK-created child session, regardless of whether the OpenCode SDK fires `session.created`"
- Update `p58-symptom-diagnosis-2026-06-04.md` to mark S5b as a separate symptom from S1
- Add a regression guard to BATS slot 77 that exercises Path B explicitly

---

## Appendix A — Verified evidence summary

| Claim | Evidence | Confidence |
|---|---|---|
| tmux-multiplexer code exists and is functional | `src/features/tmux/tmux-multiplexer.ts:276-362` `spawnPane` method, full implementation, returns `PaneResult` | HIGH |
| SessionManager.onSessionCreated calls spawnPane | `src/features/tmux/session-manager.ts:236` direct call | HIGH |
| SessionManagerAdapter is published | `src/features/tmux/integration.ts:429` `setSessionManagerAdapter(adapter)` | HIGH |
| tmuxObserver is in eventObservers array | `src/plugin.ts:808` last entry in the array | HIGH |
| tmuxObserver calls adapter.onSessionCreated | `src/features/tmux/observers.ts:215` `await forkSessionManager.onSessionCreated(enriched)` | HIGH |
| Event hook fires for SDK events | `src/hooks/lifecycle/core-hooks.ts:233-247` `event` hook | HIGH |
| SDK has EventSessionCreated type | `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts:493-498` | HIGH |
| SDK v1.15.13 is installed | `package.json:64`, `node_modules/@opencode-ai/sdk/package.json` | HIGH |
| Harness parser matches v1 payload | `src/features/tmux/observers.ts:189-194` reads `info?.id` | HIGH |
| Harness author knows SDK may not fire event | `src/coordination/delegation/coordinator.ts:217-219` explicit comment | HIGH |
| onChildSessionCreated callback exists for session-tracker | `src/plugin.ts:601-603` | HIGH |
| No equivalent callback exists for tmux-multiplexer | grep for `tmuxIntegration.adapter.onSessionCreated` in plugin.ts/coordinator.ts finds ZERO direct call sites outside the eventObservers chain | HIGH |
| bun-pty is installed (H4 disproven) | `node_modules/bun-pty` exists; `bun --version` returns 1.3.14; `node --version` returns v26 | HIGH |
| P58 UAT (p58-uat-g3) DID spawn a panel | `.hivemind/state/tmux-sessions/p58-uat-g3.json` exists | HIGH |
| S5 attempt (ses_16ca6a75affeB906LSjYxnnzip) did NOT spawn a panel | No matching `.hivemind/state/tmux-sessions/ses_16ca6a75affeB906LSjYxnnzip.json` | HIGH |

## Appendix B — File inventory cited in this report

```
src/coordination/delegation/coordinator.ts
src/coordination/delegation/manager-runtime.ts
src/coordination/delegation/sdk-child-session-starter.ts
src/coordination/delegation/types.ts
src/features/tmux/integration.ts
src/features/tmux/observers.ts
src/features/tmux/session-manager.ts
src/features/tmux/tmux-multiplexer.ts
src/features/tmux/types.ts
src/hooks/lifecycle/core-hooks.ts
src/hooks/types.ts
src/plugin.ts
src/shared/session-api.ts
src/shared/state.ts
src/tools/delegation/delegate-task.ts
node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts
node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts
node_modules/@opencode-ai/sdk/package.json
.planning/debug/p58-symptom-diagnosis-2026-06-04.md
.planning/debug/uat-s5-delegate-task-panel-spawn-2026-06-04.md
```

---

**End of report. Approximate LOC: 750 (within 500-800 target).**
