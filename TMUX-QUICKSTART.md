# Tmux Visual Orchestration — Quickstart

**Goal:** When you run `opencode` inside a tmux session, sub-agents you delegate to spawn in their own tmux panes so you can watch their work in real time.

**Prerequisites**

- `tmux` ≥ 2.6 (tested on 3.6b) — `brew install tmux` / `apt install tmux`
- `opencode` ≥ 1.1 (tested on 1.15.13) — `curl -fsSL https://opencode.ai/install | bash`
- A Hivemind harness project with the plugin installed (this repo, or any fork of it)

---

## 1. Add `server.port` to your `opencode.json`

The integration needs to know which port your opencode server listens on. The
recommended way is to add this to your project's `opencode.json`:

```json
{
  "server": { "port": 4096 }
}
```

The default is **4096** (opencode's documented default). Match the port you
launched opencode with (e.g. `opencode --port 4096`).

**Why this matters:** when you delegate a sub-agent, the harness spawns a
new tmux pane that runs `opencode attach http://localhost:<port>`. If the
port doesn't match the running opencode server, the pane will fail to
attach.

---

## 2. Launch opencode inside tmux

```sh
tmux new-session -A -s hivemind
opencode --port 4096
```

(The `--port` is required only if you set a non-default `server.port` in
`opencode.json`. The harness will auto-detect the port from the file.)

The Hivemind plugin auto-loads. You'll see a one-line status banner in
the OpenCode TUI log:

```
[Harness] Tmux visual orchestration: ENABLED (tmux 3.6b,
server=http://localhost:4096, binary=/usr/local/bin/tmux) —
sub-agents will spawn in tmux panes
```

If you see `DISABLED` instead, see **Troubleshooting** below.

---

## 3. Delegate a sub-agent

In the opencode TUI prompt:

> Delegate to gsd-executor: research the TypeScript strict mode best
> practices and write a summary

The harness will:
1. Spawn a new tmux pane on the right of your main opencode pane
2. Title the pane `[gsd-executor] <deleg-id> — <description>`
3. Run `opencode attach http://localhost:4096 --session <id>` in that pane
4. Stream the sub-agent's output into the pane in real time

You can see the sub-agent's progress without losing your main TUI context.

---

## 4. Orchestrator intervention (send keys to a pane)

From an orchestrator-tier agent (e.g. `hm-orchestrator`):

```sh
# Inside opencode prompt:
tmux-copilot action=send-keys paneId=%2 text="ls -la"
```

This sends keystrokes to pane `%2` (the second pane in the current tmux
window). The keystrokes arrive on the receiving OS process — useful for
intervening mid-delegation.

---

## 5. Query tmux state

```sh
# List tracked sessions + pane count
tmux-state-query action=get-summary

# List all panes in the current window
tmux-copilot action=list-panes
```

---

## What to expect

| Step | What happens | TUI log line |
|------|--------------|--------------|
| 1 | Plugin loads | `[Harness] Hivemind plugin loaded — registering 26 custom tools` |
| 2 | Tmux factory runs | `[Harness] Tmux visual orchestration: ENABLED (tmux 3.6b, server=http://localhost:4096, ...)` |
| 3 | Delegate a sub-agent | A new tmux pane appears, titled `[<agent>] <deleg-id> — <description>` |
| 4 | Sub-agent finishes | The pane stays alive (auto-close after 30 min) — kill it manually with `Ctrl-b x` if you want |
| 5 | Restart the harness | OpenCode restarts → plugin re-loads → same status banner reappears |

---

## Troubleshooting

### `DISABLED — tmux binary not found in PATH`

`tmux` is not installed. Install it:

```sh
brew install tmux   # macOS
sudo apt install tmux   # Debian/Ubuntu
```

### `DISABLED — process.env.TMUX is not set (run from inside a tmux session)`

You ran `opencode` outside of tmux. Either:

```sh
tmux new-session -A -s hivemind
opencode
```

…or accept the inline-only mode (sub-agents run in the same TUI, no
visual panes).

### `DISABLED — opencode binary not found in PATH`

The `opencode` CLI is not installed. Install it:

```sh
curl -fsSL https://opencode.ai/install | bash
```

### `ENABLED` but spawned panes fail with `connection refused`

The `server.port` in `opencode.json` doesn't match the port opencode is
listening on. Two options:

1. **Update `opencode.json`** to match the port you used:
   ```sh
   opencode --port 1234  # some other port
   ```
   Then add to `opencode.json`:
   ```json
   { "server": { "port": 1234 } }
   ```

2. **Remove the `server.port` block** and let the harness auto-detect.
   The harness will probe localhost for a live opencode server on the
   ports `[4096, 3000, 8080, 8000, 5328]`. The first one that responds
   is used.

### Sub-agent panes spawn but immediately exit

The session id from `tmux-copilot`'s `spawn` may have been lost across
restarts. Try:

```sh
tmux-state-query action=get-session sessionId=<id>
```

…and re-spawn with:

```sh
tmux-copilot action=respawn sessionId=<id>
```

---

## Example workflow

```sh
# Terminal 1 (in your shell)
$ tmux new-session -A -s hivemind

# In the tmux pane
$ opencode --port 4096
# (wait for TUI to render)
# TUI log: [Harness] Tmux visual orchestration: ENABLED ...

# In the opencode prompt:
> Delegate to gsd-executor: research TypeScript 5.6 strict mode
> behavior and write a 1-paragraph summary to
> .hivemind/journal/exec-summary.md

# → A new tmux pane appears on the right
# → Watch the sub-agent's tool calls stream in real time
# → When done, the pane title shows the deleg-id and description
# → Read .hivemind/journal/exec-summary.md to see the output
```

---

## Architecture reference

The integration lives in `src/features/tmux/` (in-tree, not a fork):

| File | Role |
|------|------|
| `integration.ts` | Factory: `createTmuxIntegrationIfSupported()` — silent-null per D-04 contract |
| `tmux-multiplexer.ts` | `TmuxMultiplexer` — `tmux` CLI wrapper (split, send-keys, list-panes, layout) |
| `session-manager.ts` | `SessionManager` — owns pane lifecycle for delegations |
| `grid-planner.ts` | `PaneGridPlanner` — DFS-preorder split-command sequencer |
| `persistence.ts` | Cross-restart session record persistence |
| `observers.ts` | `createTmuxEventObserver` — enriches `session.created` events |
| `pane-monitor.ts` (hooks/) | Journal hook for `pane-captured` events |
| `tmux-copilot.ts` (tools/) | Orchestrator intervention tool (4 actions) |
| `tmux-state-query.ts` (tools/) | Read-only state query tool (3 actions) |

See `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/`
for the design rationale and the in-plugin auto-init constraints.
