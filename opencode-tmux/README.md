# opencode-tmux

<p align="center">
  <a href="https://github.com/FloSchl8/opencode-tmux/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/FloSchl8/opencode-tmux/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@floschl/opencode-tmux"><img src="https://img.shields.io/npm/v/%40floschl%2Fopencode-tmux" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@floschl/opencode-tmux"><img src="https://img.shields.io/npm/dm/%40floschl%2Fopencode-tmux" alt="npm downloads" /></a>
  <a href="https://github.com/FloSchl8/opencode-tmux/blob/main/LICENSE"><img src="https://img.shields.io/github/license/FloSchl8/opencode-tmux" alt="License" /></a>
  <a href="https://github.com/FloSchl8/opencode-tmux/stargazers"><img src="https://img.shields.io/github/stars/FloSchl8/opencode-tmux" alt="GitHub Stars" /></a>
  <a href="https://github.com/FloSchl8/opencode-tmux/forks"><img src="https://img.shields.io/github/forks/FloSchl8/opencode-tmux" alt="GitHub Forks" /></a>
  <a href="https://github.com/FloSchl8/opencode-tmux/commits/main"><img src="https://img.shields.io/github/last-commit/FloSchl8/opencode-tmux" alt="Last Commit" /></a>
  <img src="https://img.shields.io/badge/Bun-black?logo=bun" alt="Bun" />
</p>

Auto-spawn tmux panes for OpenCode subagent sessions — when OpenCode creates a child session, this plugin splits a new tmux pane and attaches it automatically.

## How It Works

When OpenCode fires a `session.created` event for a child session (one with a `parentID`), the plugin:
1. Splits a new tmux pane horizontally
2. Runs `opencode attach <serverUrl> --session <id> --dir <dir>` in it
3. Applies your configured layout
4. Closes the pane when the session goes idle (if `autoClose: true`)

Pane lifecycle is driven entirely by OpenCode events — no background polling.

## Requirements

- **tmux ≥ 3.0** installed and in `PATH`
- OpenCode must be **running inside a tmux session** (the plugin is a no-op otherwise)
- `opencode` binary must be in `PATH` (for the `attach` command in spawned panes)

## Usage

OpenCode must be started as a server with an explicit port so the plugin knows the `serverUrl` to pass to `opencode attach` in spawned panes:

```bash
opencode --port 3000
```

Without a port, the plugin cannot construct the `serverUrl` and the `opencode attach <serverUrl> --session <id>` command in new tmux panes will fail.

## Installation

```bash
bun add @floschl/opencode-tmux
```

Register the plugin in your `opencode.json` (global `~/.config/opencode/opencode.json` or project-local):

```json
{
  "plugin": ["@floschl/opencode-tmux"]
}
```

## Configuration

Create `opencode-tmux.json` with the plugin's settings. Keys are flat (no nesting):

**Global** (`~/.config/opencode/opencode-tmux.json`):
```json
{
  "layout": "main-vertical",
  "mainPaneSize": 60,
  "autoClose": true
}
```

**Project-local** (either path works; `<project>/opencode-tmux.json` takes precedence):
- `<project>/opencode-tmux.json`
- `<project>/.opencode/opencode-tmux.json`

Project-local config overrides global config. Unset keys fall back to defaults.

## Configuration Reference

All keys go directly in `opencode-tmux.json` (flat, no nesting).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layout` | string | `"main-vertical"` | tmux layout: `main-vertical`, `main-horizontal`, `tiled`, `even-horizontal`, `even-vertical` |
| `mainPaneSize` | number | `60` | Main pane size as percentage (10–90). Used with `main-vertical` / `main-horizontal` layouts |
| `autoClose` | boolean | `true` | Close pane automatically when session goes idle |

## Event Handling

| Event | Action |
|-------|--------|
| `session.created` (child only) | Spawn new tmux pane with `opencode attach` |
| `session.status` → `idle` | Close pane (if `autoClose: true`) |
| `session.status` → `busy` | Re-spawn pane if session is known but pane was closed |
| `session.deleted` | Close pane unconditionally |

## Debugging

Set `OPENCODE_TMUX_DEBUG=1` to enable verbose stderr logging:

```bash
OPENCODE_TMUX_DEBUG=1 opencode --port 4096
```

## Limitations

- **tmux only** — no support for other terminal multiplexers
- **Child sessions only** — top-level sessions (no `parentID`) are ignored
- Requires OpenCode to be started from within an active tmux session
- The `opencode attach` command must be available in the spawned pane's `PATH`
