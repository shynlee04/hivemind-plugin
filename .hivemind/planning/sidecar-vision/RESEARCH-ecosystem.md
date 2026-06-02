[LANGUAGE: Write this file in en per Language Governance.]
# Ecosystem Research: GUI/Control-Panel Patterns for Hivemind Sidecar

**Date:** 2026-06-02
**Research Scope:** OpenCode ecosystem GUI patterns, json-render dashboards, plugin→browser communication, terminal+GUI hybrids, anti-patterns
**Sidecar Goal:** Next.js 16 + @json-render/react bidirectional control plane bridging human operators, Hivemind runtime, and native OpenCode

---

## 1. Reference Architectures Found

### Reference 1: OpenChamber — Full-Stack GUI for OpenCode

**Repository:** github.com/openchamber/openchamber (3.1k+ stars, 1,464 commits)
**Stack:** Web/PWA (React) + Desktop (Tauri) + VS Code Extension
**Significance:** The most mature OpenCode GUI project

**Architecture:**
- Connects to OpenCode's existing server API via OpenAPI 3.1 spec (`opencode serve`)
- Does NOT fork or modify OpenCode — pure frontend replacement
- Web version built with React + PWA; desktop via Tauri
- Also ships as VS Code extension and GitHub Actions

**Key GUI Features Relevant to Sidecar:**
- Workspace file browser with inline editing and syntax highlighting
- Beautiful diff viewer (Pierre) with stacked/inline modes
- Integrated terminal with per-directory sessions and tabbed interface
- Clickable file paths in messages that jump to exact line locations
- Password-protected web UI, Cloudflare tunnel support, QR code for mobile access
- Connect to external OpenCode server or launch embedded one

**Communication Pattern:** REST API polling from browser → OpenCode server. `OPENCODE_PORT` + `OPENCODE_SKIP_START` env vars for external server mode.

**What to Learn:**
- Proves you can build a rich GUI on top of OpenCode's server API without modifying OpenCode itself
- Tauri gives native desktop + web from the same codebase
- Password-protected web UI is a must for local-only tools

**What to Avoid:**
- The project ships 4 separate distributions (web, desktop, VSCode, GitHub Actions) — that is scope creep for sidecar. Sidecar should be web-only (Next.js) initially.

---

### Reference 2: opencode-pty — Plugin with Embedded Web UI

**Repository:** github.com/shekohex/opencode-pty
**Stack:** OpenCode plugin + React web interface
**Significance:** Only OpenCode plugin that ships its own browser-based web UI

**Architecture:**
- OpenCode plugin adds PTY session management tools
- Plugin starts an embedded web server (REST API on a local port)
- React-based web UI connects to the REST API for monitoring/interacting with PTY sessions
- Slash commands: `/pty-open-background-spy` and `/pty-show-server-url`

**REST API Pattern (canonical for sidecar):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/sessions` | List all PTY sessions |
| POST | `/api/sessions` | Create new PTY session |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions/:id/input` | Send input to session |
| GET | `/api/sessions/:id/buffer/plain` | Get session output |
| DELETE | `/api/sessions` | Clear all sessions |
| GET | `/health` | Health check with metrics |

**What to Learn:**
- Plugin-embedded web server is a proven pattern — the plugin starts a local HTTP server, the browser connects to it
- REST API for session management is sufficient; no need for WebSocket initially
- Health endpoint with metrics is essential for debugging
- Slash commands to open/reveal the web UI is a good UX pattern

**What to Avoid:**
- Their web UI is a standalone React app, not embedded in a larger control plane — for sidecar, the web UI should be the primary interface, not an accessory

---

### Reference 3: AgentDock / Agent of Empires — tmux + Web Dashboard

**Repository:** github.com/vishalnarkhede/agentdock, agent-of-empires.com
**Stack:** React + Vite + xterm.js + WebSocket + tmux
**Significance:** Proves the terminal+web hybrid pattern for agent management

**Architecture:**
- tmux sessions managed through a web dashboard
- xterm.js for live terminal output streaming in the browser
- WebSocket for real-time session output updates
- Git worktrees for agent isolation
- Mobile-optimized interface (phone/tablet access)

**Agent of Empires:**
- TUI (terminal) and web dashboard — same sessions, same data, choice of interface
- Written in Rust, manages tmux sessions
- Web dashboard works from any browser, including phone
- Docker sandboxing for agent isolation

**What to Learn:**
- xterm.js is the standard for streaming terminal output in browser — use it for sidecar terminal views
- tmux is the de facto runtime for AI agent teams (per HN consensus) — sidecar should integrate with tmux, not replace it
- Mobile-friendly dashboard is a differentiator for operators who need to check status on the go

**What to Avoid:**
- Don't build a full terminal emulator from scratch — use xterm.js
- Don't fight tmux — integrate with it (as Hivemind's `tmux-copilot` tool already does)

---

## 2. json-render Dashboard Patterns Available

### Component Library: @json-render/shadcn

**Source:** github.com/vercel-labs/json-render (13k+ stars, 215 commits, 200+ releases)
**Package:** `@json-render/shadcn` — 36 pre-built shadcn/ui components

**Architecture (Three-Layer):**
1. **Schema** — `@json-render/core`: Zod-based schema definitions
2. **Catalog** — `defineCatalog(schema, { components, actions })` — pick what AI can generate
3. **Registry** — `defineRegistry(catalog, { components })` — map to actual React implementations

**The 36 Components by Category:**

| Category | Components |
|----------|-----------|
| **Layout** (4) | `Card`, `Stack`, `Grid`, `Separator` |
| **Navigation** (4) | `Tabs`, `Accordion`, `Collapsible`, `Pagination` |
| **Overlay** (5) | `Dialog`, `Drawer`, `Tooltip`, `Popover`, `DropdownMenu` |
| **Content** (8) | `Heading`, `Text`, `Image`, `Avatar`, `Badge`, `Alert`, `Carousel`, `Table` |
| **Feedback** (3) | `Progress`, `Skeleton`, `Spinner` |
| **Input** (12) | `Button`, `Link`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Toggle`, `ToggleGroup`, `ButtonGroup` |

**Built-in State Actions (free with @json-render/react):**
- `setState(path, value)` — set value at state path
- `pushState(path, value)` — push to array
- `removeState(path, index)` — remove from array
- `validateForm` — validate and write result
- Validation timing: `change`, `blur`, `submit`

**Custom Components:**
You can extend the catalog with custom components (e.g., `Metric`, `DelegationTree`, `SessionTimeline`) alongside standard ones — just define Zod props and a React implementation.

**What This Means for Sidecar:**
- Do NOT build a custom UI component library — use all 36 shadcn components from `@json-render/shadcn`
- Custom components needed: `SessionCard`, `DelegationTree`, `PressureGauge`, `AgentStatus`, `TrajectoryTimeline`, `SessionDiffView`
- The schema→catalog→registry pattern is exactly right for sidecar's AI-generated dashboards
- `StateStore` (available via `@json-render/zustand` or `@json-render/jotai`) gives the state management pattern
- Built-in actions (`setState`, `pushState`, `removeState`) cover 80% of state requirements

**Available State Store Adapters:**
- `@json-render/zustand`
- `@json-render/jotai`
- `@json-render/xstate`
- `@json-render/redux`

### Devtools

`@json-render/devtools-react` provides a drop-in inspector panel with:
- Spec tree viewer
- State editor
- Action log
- Stream log
- Catalog browser
- DOM picker
- Hotkey: `Ctrl/Cmd + Shift + J` (tree-shakes to null in production)

This is invaluable for sidecar development and debugging.

---

## 3. Communication Pattern Recommendations

### The OpenCode Server Architecture

OpenCode's own architecture provides the template:

```
opencode TUI ←→ opencode Server (OpenAPI 3.1) ←→ LLM Providers
                        ↑
                   SDK / REST clients
```

The server exposes:
- `/session/*` — CRUD for sessions
- `/tui/control/*` — bidirectional TUI control
- OpenAPI 3.1 spec at `/openapi.json`

**Key finding:** OpenCode's REST API does NOT have SSE streaming for session execution (confirmed by GitHub issue #13416). The TUI uses internal SSE, but the REST API returns complete responses only. This is a known limitation.

### Recommended: Hybrid REST + WebSocket

For the sidecar, use a **three-channel communication model**:

| Channel | Direction | Protocol | Use Case |
|---------|-----------|----------|----------|
| **Control** | Bidirectional | REST (HTTP) | Session CRUD, delegation dispatch, config management |
| **Stream** | Server→Client | WebSocket | Real-time session output, delegation progress, tool execution events |
| **State Sync** | Bidirectional | REST (HTTP polling) | Periodic state refresh, health checks, fallback when WebSocket drops |

**Why not pure SSE?**
- Sidecar needs bidirectional communication (operator sends commands → plugin executes)
- SSE is unidirectional (server→client only)
- WebSocket handles both directions and is well-supported in Next.js 16

**Why not pure REST?**
- Polling for real-time session output is wasteful (25MB/min bandwidth issue reported for OpenCode web UI)
- WebSocket gives sub-second latency for streaming delegation results

**Implementation Pattern:**

```typescript
// Plugin side (src/): Express/Hono server on a local port
const server = serve({
  port: SIDECAR_PORT, // e.g., 3099
  fetch: router
});

// WebSocket upgrade for streaming
server.ws('/ws', {
  async message(ws, data) {
    // Handle incoming commands from browser
    const { type, payload } = JSON.parse(data);
    switch(type) {
      case 'dispatch_delegation':
        const result = await delegationManager.dispatch(payload);
        ws.send(JSON.stringify({ type: 'delegation_result', result }));
        break;
    }
  }
});

// Browser side (apps/web/): Next.js API routes proxy to plugin server
// Or: direct WebSocket connection from browser to localhost:3099
```

### Security Model for Local-Only Tools

| Concern | Mitigation |
|---------|-----------|
| Localhost binding | Bind to `127.0.0.1` only (no `0.0.0.0`) |
| No auth for local | Skip password (like opencode web default) |
| CORS | Restrict to `localhost:*` origins |
| Plugin tool access | Plugin tools are gated by OpenCode permission system |
| WebSocket origin | Validate `Origin` header on upgrade |

For future network access: follow OpenCode's model — `OPENCODE_SERVER_PASSWORD` and `--cors` flags.

---

## 4. Terminal + GUI Hybrid Architecture Patterns

### Pattern A: "tmux as Runtime" (AgentDock / AoE / Batty)

**How it works:**
- tmux manages agent sessions as isolated panes/windows
- Web dashboard connects to tmux via `capture-pane` / `send-keys`
- xterm.js renders terminal output in browser
- Git worktrees isolate agent file changes

**Best for:** Multi-agent orchestration with full terminal access

**Hivemind relevance:** Hivemind already has `tmux-copilot` tool. The sidecar can build on this — add a web UI on top of the tmux state without replacing it.

### Pattern B: "Plugin as Backend, Browser as Frontend" (opencode-pty / VSCode Extensions)

**How it works:**
- Plugin runs an embedded HTTP server on a local port
- Browser (or webview) connects to the plugin's server
- Plugin API handles auth, state, and tool execution
- VSCode extensions use `WebView.postMessage()` for bidirectional communication

**Best for:** Single-plugin, single-session scenarios

**Hivemind relevance:** Closest to sidecar's architecture. The Hivemind plugin already has the full state management infrastructure — the sidecar just needs to expose it via HTTP/WebSocket.

### Pattern C: "Server-First SDK" (OpenCode itself)

**How it works:**
- Core is a server process with REST API
- Multiple clients connect to the same server:
  - TUI (Go binary, internal SSE)
  - Web UI (React, REST API)
  - IDE plugins (REST API + `/tui` control endpoint)
  - SDK clients (`@opencode-ai/sdk`)

**Best for:** Multi-client, multi-platform systems

**Hivemind relevance:** This is the aspirational architecture for sidecar. The Hivemind plugin should expose a clean API that the Next.js sidecar consumes, just like OpenCode's server exposes its API to multiple clients.

---

## 5. What to AVOID

### Anti-Patterns in Plugin-Browser Communication

| Anti-Pattern | Why It's Bad | Alternative |
|-------------|-------------|-------------|
| **Polling for real-time data** | 25MB/min bandwidth waste; poor UX latency | WebSocket or SSE for streams |
| **No reconnection logic** | Browser disconnects break long-running operations | Built-in WebSocket reconnection with exponential backoff |
| **Plugin starts server on random port** | Hard for browser to discover; adds complexity | Fixed port range (3099-3109) with health check discovery |
| **Bidirectional auth on localhost** | Unnecessary friction for local-only tools | No auth on localhost; optional password for network access |
| **Plugin opens browser without user consent** | Surprising, violates user agency | Slash command or explicit config to enable web UI |
| **No CORS headers** | Browser blocks cross-origin requests | Always set CORS for the sidecar origin |

### Common Mistakes When Building Sidecar Dashboards

1. **Building a custom component library instead of using shadcn/ui**
   - Mitigation: Use all 36 `@json-render/shadcn` components + extend with custom ones
   - The catalog/registry pattern gives both standard UI and custom extensions

2. **Over-engineering before proving the pattern**
   - Start with REST-only, add WebSocket when streaming is needed
   - Don't build distributed auth upfront (localhost-first)
   - Prove the control loop works in TUI before moving to GUI

3. **Duplicating TUI functionality in GUI**
   - The TUI is for fast terminal workflows (power users)
   - The GUI is for overview, monitoring, and non-terminal operators
   - Don't rebuild the chat interface — use OpenCode's existing web UI or SDK for that
   - Sidecar should show what TUI **cannot** easily show: delegation trees, pressure heatmaps, trajectory timelines

4. **Tight coupling to a specific OpenCode version**
   - OpenCode's API is still evolving
   - Sidecar should talk to OpenCode through the SDK or stable API surface
   - Plugin API as the interface, not internal Hivemind state (which is more stable but still evolving)

### What Should Stay in TUI vs Go to GUI

**Keep in TUI (terminal):**
- Fast chat/prompt interactions — terminal is faster for text
- Quick file edits — agent works better in terminal
- Permission approvals — security-critical; stay where user is already working
- One-shot commands — overhead of opening browser not worth it

**Move to GUI (sidecar):**
- Multi-session overview — seeing 10+ agent sessions at once
- Delegation hierarchy visualization — tree of parent/child sessions
- Trajectory/checkpoint timelines — temporal view of phase progression
- Pressure/heat metrics — color-coded status at a glance
- Diff review — visual diff viewer is better than terminal
- File explorer — tree navigation with search
- Settings/config editing — forms are easier than CLI flags
- Background/PTY session monitoring — persistent view of long-running processes

**Keep in BOTH:**
- Session status (TUI: `delegation-status`, GUI: dashboard cards)
- Agent state (TUI: `session-hierarchy`, GUI: tree visualization)
- Notifications (TUI: tui.toast, GUI: toast + badge count)

---

## 6. Recommended Build Pattern for Sidecar

### Architecture

```
┌──────────────────────────────────────────────┐
│              Browser (Next.js 16)               │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │ @json-render  │  │ Custom Components:   │   │
│  │ /shadcn (36)  │  │ SessionCard,         │   │
│  │ components    │  │ DelegationTree,      │   │
│  └──────────────┘  │ PressureGauge, ...    │   │
│                    └──────────────────────┘   │
│         RestController (REST + WS client)      │
└──────────────────────┬───────────────────────┘
                       │ HTTP/WebSocket (localhost:3xxx)
┌──────────────────────┴───────────────────────┐
│          Hivemind Plugin (src/ side)           │
│  ┌──────────────┐  ┌──────────────────────┐   │
│  │ SidecarServer │  │ Hivemind Runtime     │   │
│  │ (Hono + WS)   │◄─┤ (delegation,         │   │
│  │ port 3099     │  │  trajectory,         │   │
│  └──────────────┘  │  pressure, ...)      │   │
│                    └──────────────────────┘   │
│         OpenCode Plugin Lifecycle Hooks        │
└──────────────────────────────────────────────┘
```

### Communication Flow

1. **Plugin startup:** `SidecarServer` starts on port 3099, registers health endpoint
2. **Browser connects:** Next.js app reads localhost:3099 health → confirms sidecar is alive
3. **Read operations:** Browser GETs from plugin REST endpoints (sessions, delegations, trajectory)
4. **Write operations:** Browser POSTs commands (dispatch, approve, configure) via REST
5. **Streaming:** WebSocket connection streams delegation progress, tool execution events, pressure updates
6. **Discovery:** Plugin registers presence via `.hivemind/` state file so browser can find it

### Phased Delivery

| Phase | What | Comms |
|-------|------|-------|
| **P1** | Read-only dashboard: session list, delegation tree, trajectory timeline | REST only |
| **P2** | Read-write: approve checkpoints, dispatch delegations from GUI | REST + WS |
| **P3** | Streaming: live session output, real-time pressure updates | WebSocket |
| **P4** | AI-generated dashboards: json-render catalog for custom views | Full stack |

---

## 7. Research Sources

### Repositories Directly Examined
- `github.com/openchamber/openchamber` — Desktop/Web GUI for OpenCode
- `github.com/shekohex/opencode-pty` — PTY plugin with embedded Web UI + REST API
- `github.com/vercel-labs/json-render` — Generative UI framework (36 shadcn components)
- `github.com/kdcokenny/opencode-background-agents` — Async delegation plugin
- `github.com/kdcokenny/opencode-workspace` — Multi-agent orchestration harness (16 components)
- `github.com/Opencode-DCP/opencode-dynamic-context-pruning` — Context management plugin
- `github.com/vishalnarkhede/agentdock` — Web dashboard for tmux agents
- `agent-of-empires.com` — tmux-based agent session manager with web dashboard

### OpenCode Ecosystem
- `github.com/awesome-opencode/awesome-opencode` — Curated plugin/agent/resource list
- `opencode.ai/docs/server` — OpenAPI 3.1 server architecture
- `opencode.ai/docs/web` — Web interface documentation
- `opencode.ai/docs/ecosystem` — Ecosystem listing (kimaki, portal, OpenChamber, OpenWork, etc.)
- `opencode.ai/docs/plugins` — Plugin API reference (events, hooks, tools)

### Communication Pattern References
- GitHub issue #13416: SSE not available on REST API (anomalyco/opencode)
- REST vs WebSocket vs SSE: listiak.dev, oneuptime.com, websocket.org comparisons
- WebSocket + SSE: ably.com comparison, architectviewmaster.com

### Terminal+GUI Hybrid References
- "How tmux Became the Runtime for AI Agent Teams" — dev.to analysis
- Scion Web Dashboard with tmux integration — googlecloudplatform.github.io
- `agent-cli-helper` — tmux-based agent communication (HN discussion)

### json-render Specific
- `json-render.dev` — Official documentation and playground
- InfoQ coverage (March 2026) — Architecture overview
- The New Stack — Guillermo Rauch interview on generative UI vision
- zenn.dev — Three-layer architecture analysis (Schema → Catalog → Registry)

---

## Key Findings Summary

1. **OpenChamber is the closest reference** — full GUI for OpenCode, Tauri-based, 3.1k stars. Proves the pattern is viable.

2. **opencode-pty provides the plugin-embedded-server pattern** — plugin starts local HTTP server, browser connects. REST API for session management is proven.

3. **json-render/shadcn gives 36 ready-to-use components** — don't build UI primitives. Extend with 5-10 custom components for session/agent-specific views.

4. **Hybrid REST+WebSocket is the right comms model** — REST for control/CRUD, WebSocket for streaming. Skip SSE (unidirectional, not needed).

5. **tmux is the runtime, don't fight it** — Hivemind already has `tmux-copilot`. Sidecar should add a web visualization layer on top.

6. **Localhost-only first, auth optional** — follow OpenCode's security model (no auth on localhost, password for network access).

7. **Three most valuable references:**
   1. **OpenChamber** (openchamber/openchamber) — Full GUI architecture for OpenCode
   2. **opencode-pty** (shekohex/opencode-pty) — Plugin-embedded web server pattern
   3. **json-render/shadcn** (vercel-labs/json-render) — 36 component catalog + generative UI framework
