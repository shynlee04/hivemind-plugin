# External Research Report: vercel-labs/agent-browser

**Question:** What is agent-browser's architecture, how does it connect with json-render/react, and what patterns does it provide for dashboards, session monitoring, and agent-driven UI?

**Research Date:** 2026-03-30
**Sources Checked:** 8 (DeepWiki wiki pages x5, GitHub README, Exa web search, GitHub repo metadata)
**Confidence:** HIGH for architecture claims (official docs + source code), MEDIUM for integration patterns (no direct @json-render/react connection found)

---

## Executive Summary

**agent-browser** and **@json-render/react** are **separate, independent repositories** by Vercel Labs. There is **no direct integration** between them. However, they can be composed in a workflow where:

- **agent-browser**: Automates browser actions for AI agents (headless Chrome via CDP)
- **json-render**: Renders AI-generated JSON specs into React UIs

Both could be used together in an AI agent dashboard system, but they are not designed to integrate directly.

---

## 1. Repository Purpose and Architecture Summary

### What is agent-browser?

`agent-browser` is a **headless browser automation CLI designed specifically for AI agents**. It provides deterministic, ref-based interaction that eliminates fragile CSS selectors.

**Repository:** https://github.com/vercel-labs/agent-browser
**Stars:** ~25.6k
**Primary Language:** Rust (86%), TypeScript (11.5%)

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CLI Layer (Rust)                                           │
│  cli/src/main.rs, commands.rs, flags.rs, connection.rs      │
│  - Parses CLI commands                                      │
│  - Manages daemon lifecycle                                  │
│  - IPC via Unix Sockets (Linux/macOS) or TCP (Windows)      │
└────────────────────────┬────────────────────────────────────┘
                       │ JSON over IPC
┌────────────────────────▼────────────────────────────────────┐
│  Daemon Layer (Node.js or Rust)                             │
│  src/daemon.ts (Node.js) or cli/src/native/daemon.rs (Rust) │
│  - Persistent background process                            │
│  - Session state management                                  │
│  - Policy enforcement                                       │
└────────────────────────┬────────────────────────────────────┘
                       │ Playwright API / CDP
┌────────────────────────▼────────────────────────────────────┐
│  Browser Control Layer                                       │
│  BrowserManager (Playwright) or CdpClient (direct CDP)       │
│  - Chrome for Testing browser                                │
│  - Accessibility tree generation                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `main.rs` | CLI entry point | Command parsing, daemon lifecycle |
| `connection.rs` | IPC client | Unix socket/TCP communication |
| `daemon.ts` | Node.js daemon | Browser management, action execution |
| `native/daemon.rs` | Rust daemon | High-performance CDP direct |
| `browser-manager.ts` | Browser abstraction | Playwright lifecycle |
| `snapshot.ts` | Ref generation | Accessibility tree + refs (@e1, @e2) |

**Source:** DeepWiki System Overview page, Architecture page

---

## 2. Key APIs/Exports

### CLI Commands

```bash
# Core navigation
agent-browser open <url>           # Navigate (aliases: goto, navigate)
agent-browser close               # Close browser (aliases: quit, exit)

# Snapshot-ref interaction (AI-optimized)
agent-browser snapshot            # Accessibility tree with refs
agent-browser snapshot -i         # Interactive elements only
agent-browser click @e1          # Click by ref
agent-browser fill @e2 "text"     # Fill by ref

# Traditional selectors (also supported)
agent-browser click "#submit"
agent-browser find role button click --name "Submit"

# Streaming
agent-browser stream enable [--port <port>]  # WebSocket streaming
agent-browser stream status
agent-browser stream disable

# Session management
agent-browser session              # View current session
agent-browser state save|load|list|show|clear

# Dashboard
agent-browser dashboard install
agent-browser dashboard start
```

### Key Exports (Node.js API)

Based on source analysis, the daemon exposes:
- `BrowserManager` class for browser lifecycle
- `SnapshotManager` for accessibility tree generation
- `StreamServer` for WebSocket streaming
- Action handlers: `handleNavigate`, `handleClick`, `handleFill`, `handleSnapshot`

**Source:** README.md, Commands page

---

## 3. Snapshot-Ref Pattern (AI-Friendly Interaction)

The **core innovation** is the snapshot-ref workflow:

```bash
agent-browser open example.com
agent-browser snapshot -i
# Output:
# Page: Example Domain
# URL: https://example.com
# @e1 [link] "More information..."
# @e2 [button] "Submit"

agent-browser click @e1
agent-browser fill @e2 "test@example.com"
```

**Why refs over CSS selectors:**
- **Token efficiency**: Compact text snapshots use ~200-400 tokens vs thousands for raw HTML
- **Determinism**: AI refers to @e1 rather than guessing selector
- **Stability**: If CSS classes change but role/name remain, interaction succeeds

**Source:** Quick Start page, DeepWiki

---

## 4. Real-Time Updates, SSE, and Streaming

### WebSocket Streaming (NOT SSE)

agent-browser uses **WebSockets** for real-time updates, not Server-Sent Events:

```bash
agent-browser stream enable [--port <port>]
# Connects to ws://localhost:PORT
```

**Protocol:**
- **Frame messages**: Base64-encoded JPEG frames with viewport metadata
- **Status messages**: Connection and screencast status, viewport dimensions
- **Input injection**: Mouse, keyboard, touch events from clients

**Daemon component:** `StreamServer` broadcasts CDP events in real-time when screencasting is active.

**SSE is NOT used** - primary mechanism is WebSockets.

**Source:** DeepWiki architecture page ("how does it handle real-time updates")

### Agent-Driven UI Changes

1. Agent sends command (click, fill, type) to CLI
2. CLI sends JSON over IPC to daemon
3. Daemon executes via CDP
4. Result broadcasted to stream_server
5. Connected clients receive real-time feedback

**Source:** DeepWiki real-time updates question

---

## 5. Dashboard, Session Management, and Observability

### Observability Dashboard

```bash
agent-browser dashboard install
agent-browser dashboard start  # Runs on port 4848 by default
```

**Features:**
- Live viewport (real-time JPEG frames)
- Activity feed (chronological command/results with timing)
- Console output (browser log/warn/error)

**Implementation:** Rust HTTP server with static files and `/api/sessions` endpoint.

**Source:** DeepWiki components question

### Session Management

| Feature | Command/Flag | Description |
|---------|--------------|-------------|
| Isolated sessions | `--session <name>` | Separate browser instances |
| Persistent profiles | `--profile <path>` | Cookies, IndexedDB, cache |
| Auto-save/restore | `--session-name <name>` | State in `~/.agent-browser/sessions/` |
| Encryption | `AGENT_BROWSER_ENCRYPTION_KEY` | AES-256-GCM at rest |
| Session list | `agent-browser session` | View active sessions |

**Source:** DeepWiki session management

### Workflow Building

1. **Snapshot-ref pattern**: open → snapshot → click → snapshot (cycle)
2. **Batch execution**: `agent-browser batch < commands.json`
3. **Configuration files**: `agent-browser.json` or `~/.agent-browser/config.json`
4. **Authentication vault**: `agent-browser auth save|login`
5. **Annotated screenshots**: `agent-browser screenshot --annotate`

**Source:** DeepWiki workflow building

---

## 6. Connection to @json-render/react

**CRITICAL FINDING:** agent-browser does **NOT** integrate with @json-render/react. They are separate projects.

### json-render Architecture (for comparison)

```
@json-render/core (Catalog, Spec, Registry)
         │
         ├── @json-render/react (Renderer, useUIStream)
         ├── @json-render/vue
         ├── @json-render/svelte
         ├── @json-render/shadcn (36 pre-built components)
         └── @json-render/next (Full Next.js apps from specs)
```

**json-render streaming protocol:**
- **Format**: JSONL (JSON Lines) with RFC 6902 JSON Patch operations
- **Example**:
```json
{"op":"add","path":"/root","value":"card-1"}
{"op":"add","path":"/elements/card-1","value":{"type":"Card","props":{"title":"Hello"},"children":[]}}
```
- **Modes**: 
  - Standalone (AI outputs JSONL only)
  - Inline/Chat (JSONL embedded in text stream)

**Source:** json-render README, DeepWiki architecture

### Potential Composition Pattern

If you wanted to build an agent dashboard monitoring system:

1. **agent-browser** → automates browser, captures state
2. **agent-browser stream** → WebSocket feeds real-time frames
3. **Custom React UI** → subscribes to stream, renders dashboard
4. **json-render** → could be used to render AI-generated dashboard layouts

But this would be a **custom integration**, not a built-in feature.

**Source:** Research synthesis (no official integration exists)

---

## 7. E2E Testing Approach

### Testing Integration

agent-browser itself **is** an E2E testing tool, but documentation for testing agent-browser's own UI is limited.

**Observations:**
1. The project has `AGENTS.md` and Next.js docs site (`docs/src/`)
2. No explicit E2E testing framework mentioned (Playwright is used internally for browser control)
3. The CLI nature suggests it could be integrated into test pipelines

**Playwright is used internally** for the Node.js daemon's browser control.

**For testing AI agent UIs built with agent-browser:**
- Could use `agent-browser snapshot` to verify page state
- Could use `agent-browser evaluate` to run JS assertions
- Could pipe commands into batch mode for test sequences

**Source:** CHANGELOG.md, package.json analysis

---

## 8. Code Examples and Patterns to Follow

### Pattern 1: Ref-Based AI Interaction

```bash
# AI workflow
open https://example.com
snapshot -i           # Get refs
click @e1             # Use ref, not selector
snapshot -i           # Refresh refs after action
```

### Pattern 2: WebSocket Streaming Client

```javascript
// Connect to agent-browser stream
const ws = new WebSocket('ws://localhost:PORT');
ws.on('message', (frame) => {
  const { type, data } = JSON.parse(frame);
  if (type === 'frame') {
    // Render JPEG frame
  }
});
```

### Pattern 3: Session Persistence

```bash
# Save session state
agent-browser open example.com
# ... do things ...
agent-browser state save my-session

# Later restore
agent-browser open example.com --session-name my-session
```

### Pattern 4: Batch Workflow

```bash
# JSON array of command arrays via stdin
echo '[["open", "example.com"], ["snapshot", "-i"], ["click", "@e1"]]' \
  | agent-browser batch
```

---

## Source Summary Table

| # | Finding | Source | Confidence | Freshness |
|---|---------|--------|------------|-----------|
| 1 | agent-browser is Rust CLI + daemon + CDP architecture | DeepWiki Architecture page | HIGH | Current (2026) |
| 2 | Snapshot-ref pattern uses @e1, @e2 refs | DeepWiki Quick Start | HIGH | Current |
| 3 | WebSocket streaming (not SSE) for real-time | DeepWiki real-time question | HIGH | Current |
| 4 | Observability dashboard on port 4848 | DeepWiki components question | HIGH | Current |
| 5 | Session management with --session flag | DeepWiki session management | HIGH | Current |
| 6 | NO @json-render/react integration exists | DeepWiki both repos | HIGH | Current |
| 7 | json-render uses JSONL + RFC 6902 patches | DeepWiki json-render streaming | HIGH | Current |
| 8 | json-render has 36 shadcn/ui components | json-render README | HIGH | Current (March 2026) |

---

## Recommendations for Verification

1. **Agent-browser + json-render integration**: Need to verify via custom implementation if desired
2. **WebSocket frame format**: Verify exact message schema by connecting to live stream
3. **Dashboard API endpoints**: Check `/api/sessions` response format
4. **E2E testing patterns**: Consider using agent-browser itself as the test runner

---

## Contradictions Found

None significant. All sources agree on:
- Rust-first architecture
- Snapshot-ref pattern
- WebSocket (not SSE) for streaming
- No direct @json-render/react integration

---

## Files Referenced

- https://github.com/vercel-labs/agent-browser (main repo)
- https://github.com/vercel-labs/json-render (separate repo)
- DeepWiki wiki pages: Overview, Getting Started, Installation, Quick Start, Configuration, Architecture, System Overview
- README.md files from both repos
