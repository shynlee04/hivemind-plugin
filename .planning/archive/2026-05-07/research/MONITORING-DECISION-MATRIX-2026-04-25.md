# Monitoring Surface Decision Matrix: Sidecar GUI vs Tmux vs Hybrid

**Date:** 2026-04-25
**Confidence:** HIGH (codebase evidence + industry patterns + OMO source analysis)

---

## 1. OMO Tmux Integration — How It Works

**Source:** `OMO-ARCHITECTURE-DEEP-DIVE.md` (source code analysis, HIGH confidence)

**Architecture:**
- `TmuxSessionManager` — tracks pane IDs per agent session
- `tmuxConfig` injected at plugin init via `createManagers()`
- `onSubagentSessionCreated` callback syncs tmux state when agents spawn
- Background agents spawn in separate tmux panes automatically

**What users see:**
- Live terminal output from each agent in its own pane
- Multiple agents visible simultaneously in split panes
- Standard terminal interaction (scroll, copy, search)

**What users CANNOT do:**
- No structured metrics (token counts, status dashboards, task graphs)
- No cross-session analytics
- No configuration UI — all config is file-based
- No non-technical user access — requires terminal literacy

**Limitations:**
- tmux must be installed and configured (`tmux.enabled = true`)
- Pane layout is manual or scripted — no adaptive layout
- No persistence of output beyond tmux scrollback buffer
- macOS default tmux has limited features; users often need `tmux -f` customization

---

## 2. Product-Detox Sidecar — What Was Built, What Broke

**Source:** `MEMORY-ARCHITECTURE-V2.9.5.md` §5, `2026-03-30-sidecar-architecture-plan.md`

**What was built (Phase 1-3):**
- Next.js 15 + React 19 + `@json-render/react` browser dashboard
- 36 shadcn components, 7-tab architecture (Dashboard, Settings, Contracts, Sessions, Knowledge, Planner, Builder)
- SSE event stream via OpenCode `client.event.subscribe()`
- 5s polling + SSE for real-time updates
- File-based bridge: plugin hooks write to `.hivemind/activity/state/`, sidecar reads
- Tool-based bridge: sidecar calls OpenCode tools via HTTP client

**What broke (F-01 DISASTROUS, F-02 CRITICAL):**
1. **Spec pipeline broken** — `dashboard-spec.json` never written to disk; dashboard reads from non-existent file
2. **Empty actions in registry** — interactive UI non-functional (buttons do nothing)
3. **353 uncommitted files** — no atomic decomposition; giant batch commit
4. **No hook bridge** — OpenCode plugin hooks (`tool.execute.before/after`, `system.transform`) fire in-process only; sidecar is external and can't access them
5. **Planner/Builder tabs** — Phase 4/5 placeholders never implemented

**Root cause:** The file-based bridge pattern was architecturally sound but the write side (plugin hooks producing specs) was never implemented. The sidecar was built as a reader with no writer feeding it.

---

## 3. Industry Patterns (2026)

### Agent Flow (patoles/agent-flow)
- **Stack:** Next.js + SSE relay + Claude Code hooks
- **Pattern:** Event relay server receives Claude Code hook events → SSE to browser
- **Key insight:** Uses Claude Code's native hook system (`pnpm run setup` configures hooks) — no plugin needed
- **Status:** Active, VS Code extension + standalone web app

### Claude Code Agent Monitor (hoangsonss)
- **Stack:** SQLite3 + Express + React + Vite + WebSockets
- **Pattern:** Hook events → SQLite → WebSocket → browser dashboard
- **Features:** Session tracking, tool usage analytics, Kanban board, notifications
- **Key insight:** Persistent storage (SQLite) enables historical analysis, not just live monitoring

### Synapse / Mission Control / ai-maestro
- **Pattern:** Dashboard orchestrating multiple Claude/Aider/Cursor agents across machines
- **Common stack:** SQLite + WebSocket/SSE + React
- **Key insight:** Multi-machine orchestration requires persistent state + network protocol

### Common 2026 Pattern
```
Claude Code hooks → Event relay/log → SSE/WebSocket → Browser dashboard
```
The winning pattern is **hooks as data source, browser as presentation**. No one is building tmux-based monitoring as a product.

---

## 4. Technical Feasibility Comparison

### Option A: Browser Sidecar

| Aspect | Assessment |
|--------|-----------|
| Integration surface | OpenCode SSE events (`client.event.subscribe()`) + file reads + tool calls |
| Data pipeline | Hooks → file/continuity → SSE bridge → browser |
| Complexity | **HIGH** — requires event relay, SSE bridge, Next.js app, spec writer |
| What exists | PtyManager (spawn/buffer/read/write/kill tools already built) |
| What's missing | SSE bridge tool, event writer hook, browser app |
| MVP effort | **~800-1200 LOC** (SSE bridge ~200, event hook ~150, minimal React app ~450) |
| Maintenance | Ongoing — React deps, Next.js upgrades, CSS themes |

### Option B: Tmux Monitoring

| Aspect | Assessment |
|--------|-----------|
| Integration surface | PtyManager.spawn() already works; `bun-pty` spawns into tmux panes |
| Data pipeline | Direct — spawn process → tmux pane, user sees output |
| Complexity | **LOW** — mostly configuration, not code |
| What exists | PtyManager (144 LOC), PtyBuffer, spawn/read/write/kill tools |
| What's missing | Tmux layout orchestration (~100 LOC), auto-pane-management |
| MVP effort | **~150-200 LOC** (tmux layout manager + pane lifecycle) |
| Maintenance | Minimal — tmux is stable, no browser deps |

### Option C: Hybrid (Recommended)

| Aspect | Assessment |
|--------|-----------|
| Phase 1 (MVP) | Tmux monitoring — immediate value, zero new infrastructure |
| Phase 2 (Post-MVP) | Browser sidecar — build AFTER event pipeline is proven |
| Data reuse | PtyManager + continuity store serve both surfaces |
| Complexity | **Staged** — low first, then moderate |

---

## 5. Decision Matrix

| Criterion | Tmux (B) | Browser (A) | Hybrid (C) |
|-----------|----------|-------------|------------|
| **MVP speed** | ⚡ Days | 🐌 Weeks | ⚡ Days → 🐌 Weeks |
| **Developer UX** | ✅ Native terminal | ❌ Browser switch | ✅ Best of both |
| **Non-tech UX** | ❌ No | ✅ Yes | ✅ Yes (Phase 2) |
| **Live agent output** | ✅ Direct | ⚠️ Via SSE | ✅ Direct + SSE |
| **Structured metrics** | ❌ Manual | ✅ Dashboard | ✅ Dashboard (Phase 2) |
| **Token analytics** | ❌ No | ✅ Yes | ✅ Yes (Phase 2) |
| **Task graph view** | ❌ No | ✅ Yes | ✅ Yes (Phase 2) |
| **Config UI** | ❌ File-only | ✅ Forms | ✅ Forms (Phase 2) |
| **Implementation risk** | 🟢 Low | 🔴 High (broke before) | 🟢 Staged risk |
| **Maintenance burden** | 🟢 Minimal | 🔴 React/Next.js deps | 🟡 Moderate |
| **Cross-platform** | ⚠️ macOS/Linux | ✅ Any browser | ✅ Any |
| **Offline/local** | ✅ Always | ⚠️ Needs server | ✅ Always + optional |

---

## 6. Recommended Approach: Hybrid (C) — Tmux First, Browser Later

**Rationale:**

1. **Tmux is the correct MVP** because PtyManager already exists (144 LOC, tested). The integration is spawning agents into tmux panes — ~150-200 LOC of layout management. Developers get immediate visual monitoring.

2. **Browser sidecar failed before** for a reason: the write-side pipeline (hooks producing specs/events) was never built. Building the event pipeline FIRST (as part of tmux monitoring) makes the browser sidecar trivially achievable later.

3. **The 2026 industry pattern** confirms this: hooks → event relay → SSE → browser. The event relay IS the hard part. Build it for tmux first (where failure is visible in terminal), then attach a browser reader.

**Phase structure:**
- **Phase N.1:** Tmux pane manager (spawn, layout, cleanup) — ~200 LOC
- **Phase N.2:** Event pipeline (hooks write events to continuity/store) — ~300 LOC
- **Phase N.3:** SSE bridge tool (read events, stream to HTTP) — ~200 LOC
- **Phase N.4:** Minimal browser dashboard (React, reads from SSE bridge) — ~500 LOC

**Key guardrail from architecture:** Sidecar may read/query/render/request, never write canonical state. This boundary was already locked in Phase 16.4.

---

## Sources

| Source | Confidence | Notes |
|--------|-----------|-------|
| OMO-ARCHITECTURE-DEEP-DIVE.md | HIGH | Source code analysis |
| MEMORY-ARCHITECTURE-V2.9.5.md | HIGH | Product-detox codebase analysis |
| opencode-pty-findings.md | HIGH | PTY research with source refs |
| 2026-03-30-sidecar-architecture-plan.md | HIGH | Product-detox plan (authored) |
| Agent Flow (GitHub) | MEDIUM | README only, not source |
| Claude Code Agent Monitor (GitHub) | MEDIUM | README only, 404 on extraction |
| Industry pattern (web search) | MEDIUM | Multiple agreeing sources |
