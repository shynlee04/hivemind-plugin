# opencode-tmux Fork Audit

> Audit of `FloSchl8/opencode-tmux` forked to `shynlee04/opencode-tmux`
>
> **Work contract:** `awc_a56669fb-1eab-4f96-aadd-f4602d04349e`
> **Date:** 2026-05-31
> **Trajectory:** `traj-phase-tmux-int`

---

## 1. Summary

`opencode-tmux` is a minimal OpenCode plugin written in TypeScript/Bun that auto-spawns tmux panes for OpenCode subagent (child) sessions. When a child session is created, it splits a new tmux pane horizontally and runs `opencode attach <serverUrl> --session <id> --dir <dir>` in it. Pane lifecycle is driven entirely by OpenCode events — no polling, no background daemon.

**Source LOC:** 594 (5 files)  
**Test LOC:** 1,186 (5 files)  
**Total LOC:** 1,780  
**90% coverage threshold** enforced in `bunfig.toml`

**Fork URL:** https://github.com/shynlee04/opencode-tmux  
**Upstream:** https://github.com/FloSchl8/opencode-tmux

---

## 2. Codebase Structure

```
opencode-tmux/
├── package.json              # @floschl/opencode-tmux, peer dep on @opencode-ai/plugin ^1.15.5
├── tsconfig.json             # ES2022, ESNext modules, strict
├── bunfig.toml               # 90% coverage threshold
├── README.md                 # Usage, config reference, event table
├── LICENSE                   # MIT
├── .github/workflows/ci.yml  # CI + publish to npm
├── bun.lock
└── src/
    ├── index.ts              # (41 LOC) Plugin entrypoint — Plugin factory function
    ├── config.ts             # (73 LOC) Config loading from opencode-tmux.json
    ├── session-manager.ts    # (241 LOC) Session lifecycle ↔ Tmux pane mapping
    ├── tmux.ts               # (211 LOC) Tmux multiplexer operations
    ├── util.ts               # (28 LOC) Logger wrapper
    └── __tests__/
        ├── index.test.ts
        ├── config.test.ts
        ├── session-manager.test.ts
        ├── tmux.test.ts
        └── util.test.ts
```

---

## 3. Event-Driven Architecture

### 3.1 Entrypoint (`src/index.ts`)

```typescript
const OpencodeTmux: Plugin = async (input: PluginInput) => {
  const config = loadConfig(input.directory);
  const tmux = new TmuxMultiplexer(config.layout, config.mainPaneSize);
  if (!tmux.isInsideSession()) return {};         // silent no-op
  if (!await tmux.isAvailable()) { /* log error */ return {}; }
  const mgr = new SessionManager(input, config, tmux);
  return { event: async ({ event }) => { /* dispatch */ } };
};
```

The plugin is an OpenCode Plugin factory. It returns an `{ event }` hook that receives three event types:

### 3.2 Event Dispatch

| Event | Handler | Condition | Action |
|-------|---------|-----------|--------|
| `session.created` | `mgr.onSessionCreated()` | `info.parentID` is truthy | Spawn tmux pane with `opencode attach` |
| `session.status` | `mgr.onSessionStatus()` | `status.type === "idle"` + `autoClose: true` | Close pane |
| `session.status` | `mgr.onSessionStatus()` | `status.type === "busy"` + session in `closedSessions` | Re-spawn pane |
| `session.deleted` | `mgr.onSessionDeleted()` | Always | Kill pane, clear tracking |

### 3.3 Session Manager State (`src/session-manager.ts`)

Six in-memory maps track session-pane relationships:

| Map | Purpose |
|-----|---------|
| `sessions: Map<sessionId, TrackedSession>` | Active sessions with their pane IDs |
| `knownSessions: Map<sessionId, KnownSession>` | All child sessions ever seen (for respawn) |
| `spawningSessions: Set<sessionId>` | Sessions currently being spawned (dedup) |
| `spawnedSessions: Set<sessionId>` | Sessions that completed spawn (dedup guard) |
| `closedSessions: Set<sessionId>` | Sessions auto-closed due to idle (eligible for respawn) |
| `pendingClose: Set<sessionId>` | Sessions that went idle during spawn (deferred close) |

### 3.4 Edge Cases Handled

- **Race: idle arrives during spawn** — `pendingClose` set defers close until spawn completes (Issue #3)
- **Duplicate `session.created`** — `isTrackedOrSpawning()` + `spawnedSessions` guard
- **Respawn on busy** — only if session was in `closedSessions` (auto-closed idle); NOT on `session.deleted`
- **Pane title** — cosmetic: `select-pane -T` with first 30 chars of session title
- **Layout reapply** — after spawn and close, layout is re-applied so remaining panes adjust

---

## 4. Tmux Integration (`src/tmux.ts`)

### 4.1 Pane Spawn

```typescript
const opencodeCmd = `opencode attach '${serverUrl}' --session '${sessionId}' --dir '${directory}'`;
// Executes: tmux split-window -t <mainPane> -h -d -P -F "#{pane_id}" <opencodeCmd>
// Then: tmux select-pane -t <pane> -T <title>
// Then: tmux select-layout <layout> ...
```

Key details:
- Splits **horizontally** (`-h`), **detached** (`-d`), prints pane ID (`-P -F "#{pane_id}"`)
- Shell-quotes all arguments using `'...'` pattern (handles single quotes via `'\''`)
- Targets the **current window** via `process.env.TMUX_PANE`
- Requires `opencode` binary in `PATH` inside the spawned pane

### 4.2 Pane Close

```typescript
// Sends Ctrl-C first (graceful), then kills
tmux send-keys -t <paneId> C-c
tmux kill-pane -t <paneId>
```

### 4.3 Layout

Five tmux layouts supported: `main-vertical` (default), `main-horizontal`, `tiled`, `even-horizontal`, `even-vertical`.

`mainPaneSize` (percentage, 10–90) is applied via `set-window-option main-pane-width` or `main-pane-height`.

### 4.4 Availability Checks

- `isInsideSession()` — checks `process.env.TMUX` (set by tmux)
- `isAvailable()` — runs `which tmux` / `where tmux`, caches result
- `getMainPaneId()` — finds pane index 0 via `tmux list-panes -F "#{pane_index} #{pane_id}"`

---

## 5. Configuration (`src/config.ts`)

Config file: `opencode-tmux.json` (flat, no nesting)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layout` | string | `"main-vertical"` | tmux layout |
| `mainPaneSize` | number | `60` | Main pane size % (clamped 10–90) |
| `autoClose` | boolean | `true` | Auto-close pane on idle |

**Config precedence:**
1. `<project>/opencode-tmux.json` (highest)
2. `<project>/.opencode/opencode-tmux.json` (fallback project)
3. `~/.config/opencode/opencode-tmux.json` (global)

---

## 6. Dependencies

| Dependency | Version | Role |
|-----------|---------|------|
| `@opencode-ai/plugin` | ^1.15.5 | OpenCode Plugin SDK (peer + dev) |
| `@opencode-ai/sdk` | (indirect) | Event type definitions (`EventSessionCreated`, etc.) |
| `bun` | — | Runtime, test runner, bundler |
| `typescript` | ^5.9.0 | Type checker |

---

## 7. Hivemind Integration Points

### 7.1 Session Event Pipeline

Hivemind's `src/task-management/continuity/` and `src/coordination/delegation/` already create child sessions that fire `session.created`. The plugin hooks into this via OpenCode's standard event system — **no Hivemind-specific changes needed for basic integration**.

The flow is:
```
Hivemind Delegation → OpenCode child session → session.created event → opencode-tmux → tmux pane
```

### 7.2 What Currently Works

- Hivemind's `delegate-task` creates child sessions → plugin catches `session.created` → spawns tmux pane
- Session status transitions (`idle`/`busy`) → plugin manages pane lifecycle
- Session deletion → plugin closes pane

### 7.3 What Needs to Change for Hivemind

| Area | Current | Required for Hivemind |
|------|---------|----------------------|
| **Pane identity** | Pane titled by agent name (first 30 chars) | Need Hivemind agent type + delegation ID in pane title |
| **Session hierarchy** | Only tracks parentID vs sessionId | Need Hivemind delegation depth / tree context |
| **Co-pilot model** | Not supported (child-only model) | Need ability to spawn panes for Hivemind's parallel "co-pilot" agents (not children, but sidecar sessions) |
| **Re-attach detection** | No re-attach logic if pane/window is lost | Need to re-detect and re-attach on Hivemind restart |
| **Hivemind state bridge** | No awareness of Hivemind delegation state | Need to read `delegation-persistence.ts` / session-tracker records |
| **Session metadata** | Only uses `session.info.title` | Need to pull agent type, delegation ID, work contract ID from Hivemind state |
| **Concurrency visibility** | Only `isServerRunning()` health check | Need to surface Hivemind queue / concurrency state in pane display |

### 7.4 Co-Pilot Model Extension

The current plugin **only spawns panes for child sessions** (those with a `parentID`). Hivemind's co-pilot model uses **independent parallel sessions** (same root, no parent). The plugin's guard `if (!info.parentID) return;` in `session-manager.ts:59` must be relaxed or replaced with a configurable policy:

- **Current:** `parentID` check filters to subagents only
- **Hivemind:** Add `copilot` mode that also spawns panes for non-child sessions tagged with `role: copilot` or a similar metadata flag

### 7.5 Session-Tracker Mapping

The Hivemind session-tracker (`src/task-management/continuity/session-tracker-v2/`) maintains durable session records. The plugin currently uses only ephemeral in-memory maps. For persistence across Hivemind restarts:

| Plugin Map | Hivemind Equivalent | Persistence Status |
|-----------|-------------------|-------------------|
| `sessions` | `session-tracker` active sessions | Ephemeral in plugin |
| `knownSessions` | `continuity.ts` delegation store | Ephemeral in plugin |
| `spawnedSessions` | Not tracked | Ephemeral in plugin |
| `closedSessions` | `session.status` events (replayable) | Ephemeral in plugin |

**Recommendation:** On Hivemind restart, replay recent session-tracker entries to re-create tmux panes for active sessions.

### 7.6 Server URL Contract

The plugin reads `serverUrl` from `PluginInput` (a `URL` object). This is set when OpenCode starts with `--port <N>`. Hivemind must ensure:

1. OpenCode is started with `--port` (required for `opencode attach` URL construction)
2. The port is stable across Hivemind sessions (or a discovery mechanism exists)
3. The `opencode` binary is available in spawned panes' `PATH`

---

## 8. Test Coverage Assessment

| Module | Tests | Key Coverage |
|--------|-------|-------------|
| `config.ts` | 13 tests | All config paths, clamping, fallback, debug logging |
| `index.ts` | 6 tests | No-op outside tmux, missing binary, event dispatch routing |
| `session-manager.ts` | 15 tests | Enabled flag, create/status/delete, race conditions, dedup, respawn |
| `tmux.ts` | 16 tests | Binary discovery, spawn/close/layout, shell quoting, env targeting |
| `util.ts` | 6 tests | Log level routing, fire-and-forget error handling |

**Test quality:** Excellent — covers race conditions (idle-during-spawn), deduplication, all layout types, shell injection via single quotes, and abort/timeout scenarios.

---

## 9. Build and CI

```bash
bun run build     # bun build → dist/ + tsc --emitDeclarationOnly
bun run typecheck # tsc --noEmit
bun test          # bun test --coverage --isolate
```

CI runs on `ubuntu-latest` and `macos-latest` (matrix). Publish to npm happens on `main` branch pushes (after tests pass).

---

## 10. Key Files to Modify for Hivemind Extension

| File | Modification |
|------|-------------|
| `src/session-manager.ts` | Relax `parentID` guard for co-pilot sessions; add Hivemind metadata enrichment |
| `src/session-manager.ts` | Add re-attach/restore logic from session-tracker |
| `src/tmux.ts` | Add pane title format with Hivemind delegation info |
| `src/config.ts` | Add `copilot: boolean`, `agentLabelFormat: string` config keys |
| `src/index.ts` | Add lifecycle hooks for Hivemind restart signal |
| `package.json` | Rename to `@hivemind/opencode-tmux` |
