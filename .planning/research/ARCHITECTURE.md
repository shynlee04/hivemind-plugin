# Architecture: HiveMind Cognitive Mesh

**Domain:** AI Agent Context Governance
**Researched:** 2026-02-12

## Design Philosophy

> The architecture IS the idumb-v2 diagram. Five systems forming a cognitive mesh.
> The SDK is a materialization layer. The concepts are platform-portable.

### The Mesh, Not Features

Traditional plugin: "I have tools A, B, C."
HiveMind: "I have 5 systems that feed each other. Each system makes the others smarter."

```
Remove Auto-Hooks → drift goes undetected → sessions rot → mems become stale
Remove Sessions → no lifecycle → no export → mems have no source
Remove Agent Tools → agents can't read hierarchy → governance is blind
Remove Mems Brain → nothing persists → every session starts from zero
Remove System Core → nothing connects → 4 isolated features
```

The mesh degrades gracefully — remove one system and the others still work, but the intelligence multiplier disappears. That's by design: no single point of failure, but every system amplifies the others.

---

## System Architecture (Platform-Agnostic Concepts)

### Layer 1: Concepts (Portable)

These exist regardless of platform:

| System | Concept | What It Does | Feeds Into |
|--------|---------|-------------|------------|
| **System Core** | Brain state + hierarchy tree + detection | Orchestrates all other systems | Everything |
| **Auto-Hooks & Governance** | Time-to-stale, chain breaking, git commits, tool activation | Automatic reactions to agent behavior | Sessions, Core |
| **Session Management** | Session = plan, auto-export, long session handling, structure | Lifecycle of work units | Mems, Core |
| **Unique Agent Tools** | Hierarchy reading, fast read/extract, precision extraction, thinking frameworks | Make agents smarter | Core, Mems |
| **Mems Brain** | Shared brain, main shelves, metadata & IDs, just-in-time memory | Persistent cross-session knowledge | Core, Tools |

### Layer 2: Materialization (Platform-Specific)

On OpenCode, each concept materializes through specific SDK channels:

| Concept | OpenCode Materialization | SDK Surface |
|---------|------------------------|-------------|
| Brain state | `.hivemind/brain.json` + `hierarchy.json` | Filesystem |
| Time-to-stale | `event` hook → `session.idle` / `file.watcher.updated` | Event subscription |
| Chain breaking | Detection engine → system prompt injection | `chat.system.transform` |
| Git atomic commits | BunShell `$` → `git commit` | `$` (BunShell) |
| Tool activation | System prompt injection + tool metadata | `chat.system.transform` + `context.metadata()` |
| Session = plan | `client.session.*` (create, list, messages, summarize) | SDK Client |
| Auto-export | `client.session.messages()` → filesystem archive | SDK Client + FS |
| Long session handling | `experimental.session.compacting` + purification | Compaction hook |
| Session structure | `client.session.create({ body: { title } })` + manifest | SDK Client + FS |
| Hierarchy reading | Custom tools with tree traversal | `tool()` registration |
| Fast read/extract | `client.find.text()`, `client.file.read()`, `$\`rg\`` | SDK Client + BunShell |
| Precision extraction | `client.find.symbols()`, repomix via `$` | SDK Client + BunShell |
| Thinking frameworks | System prompt injection | `chat.system.transform` |
| Shared brain (mems) | `.hivemind/mems/` + git tracking | Filesystem + `$` |
| Just-in-time memory | Tool-triggered recall from shelves | `tool()` + FS |
| Visual governance | `client.tui.showToast()` | SDK Client TUI |

### Layer 3: On Claude Code (Future Portability Example)

| Concept | Claude Code Materialization |
|---------|---------------------------|
| Brain state | `.hivemind/brain.json` (same) |
| Time-to-stale | MCP server polling / tool_use interception |
| Chain breaking | System prompt via MCP |
| Session = plan | Conversation metadata API (when available) |
| Visual governance | Status messages in conversation |
| Fast read/extract | MCP tools wrapping fd/rg/repomix |
| Mems brain | `.hivemind/mems/` (same — filesystem is universal) |

---

## Component Boundaries

### Core Components (Platform-Agnostic)

```
src/
├── lib/
│   ├── hierarchy-tree.ts    → System Core: tree CRUD, stamps, queries, staleness
│   ├── detection.ts         → Auto-Hooks: 9 detection signals, escalation tiers
│   ├── planning-fs.ts       → Sessions: per-session files, manifest, templates
│   ├── mems.ts              → Mems Brain: shelves, save/recall, metadata
│   ├── chain-analysis.ts    → Auto-Hooks: orphan/break detection
│   ├── staleness.ts         → Auto-Hooks: time-to-stale logic
│   ├── persistence.ts       → System Core: brain.json read/write
│   └── session-export.ts    → Sessions: full session capture
├── schemas/
│   ├── brain-state.ts       → System Core: brain schema
│   ├── hierarchy.ts         → System Core: tree schema
│   └── config.ts            → System Core: user preferences
└── tools/
    ├── declare-intent.ts    → Sessions: start lifecycle
    ├── map-context.ts       → System Core: update hierarchy
    ├── compact-session.ts   → Sessions: archive + reset
    ├── scan-hierarchy.ts    → Agent Tools: read tree
    ├── save-anchor.ts       → Agent Tools: mark important context
    ├── think-back.ts        → Agent Tools: recall previous reasoning
    ├── check-drift.ts       → Auto-Hooks: manual drift check
    ├── self-rate.ts         → Agent Tools: self-assessment
    ├── export-cycle.ts      → Sessions: capture subagent results
    ├── save-mem.ts          → Mems Brain: persist knowledge
    ├── list-shelves.ts      → Mems Brain: browse storage
    └── recall-mems.ts       → Mems Brain: retrieve knowledge
```

### Materialization Layer (OpenCode-Specific)

```
src/
├── hooks/
│   ├── session-lifecycle.ts → Materializes: system prompt injection, bootstrap, evidence gate
│   ├── soft-governance.ts   → Materializes: turn tracking, detection signals, auto-capture
│   ├── tool-gate.ts         → Materializes: governance warnings (NEVER blocking)
│   ├── compaction.ts        → Materializes: hierarchy preservation across compaction
│   └── index.ts             → Wires hooks to OpenCode SDK
├── index.ts                 → Plugin entry: receives { client, $, directory, serverUrl }
└── cli.ts                   → CLI materialization (hivemind init/status/etc.)
```

### Key Boundary Rule

**Core components MUST NOT import from hooks or SDK.** They operate on pure data structures (brain state, hierarchy tree, mems). The materialization layer adapts these to the specific platform.

```
✅ hooks/session-lifecycle.ts imports from lib/detection.ts
✅ hooks/soft-governance.ts imports from lib/hierarchy-tree.ts
❌ lib/detection.ts imports from @opencode-ai/plugin
❌ lib/mems.ts imports from hooks/session-lifecycle.ts
```

This boundary is what makes the concepts portable.

---

## Data Flow: The Mesh in Action

### Flow 1: Agent Starts Working (Governance Chain)

```
Agent calls tool → tool.execute.after fires
  → soft-governance increments turn count
  → detection engine compiles signals (turn count, keyword flags, etc.)
  → session-lifecycle injects signals into system prompt
  → Agent sees: "[WARN] 8 turns without context update. Call map_context."
  → TUI shows toast: "⚠ Drift detected" (via client.tui.showToast)
```

**Systems involved:** Auto-Hooks → System Core → Session Management (prompt injection) → Visual governance (TUI)

### Flow 2: Session Gets Long (Compaction Chain)

```
Context window fills → OpenCode triggers compaction
  → compaction hook fires
  → reads hierarchy tree (System Core)
  → reads current detection state (Auto-Hooks)
  → injects context[] with hierarchy + metrics (budget-capped)
  → optionally customizes compaction prompt
  → Agent survives compaction with full awareness of what it was doing
```

**Systems involved:** Session Management → System Core → Auto-Hooks → Mems Brain (mems persist on disk, unaffected)

### Flow 3: Subagent Returns (Export Chain)

```
Task tool returns result → tool.execute.after fires
  → auto-capture: logs result in brain.cycle_log[]
  → failure detection: scans for "failed", "error", "blocked"
  → if failure: sets pending_failure_ack in brain state
  → session-lifecycle injects: "⚠ SUBAGENT REPORTED FAILURE. Call export_cycle."
  → Agent calls export_cycle → updates hierarchy node → saves to mems
```

**Systems involved:** Auto-Hooks → System Core → Session Management (prompt) → Mems Brain (persist)

### Flow 4: Fast Read/Extract (Agent Intelligence Chain)

```
Agent needs codebase context → calls scan_hierarchy (reads tree)
  → tree shows what's been explored vs unknown
  → agent uses built-in grep/glob tool → finds relevant files
  → OR uses repomix tool → packs focused codebase section
  → saves key findings via save_mem → mems brain stores on shelf
  → next session: recall_mems brings back the knowledge
```

**Systems involved:** Agent Tools → System Core → Mems Brain

---

## Patterns to Follow

### Pattern 1: Inform, Don't Block
**What:** All governance is soft — warnings, toasts, escalation, arguing back. Never `permission.ask`, never blocking.
**Why:** Multiple plugins coexist. Blocking clashes. Users hate it. Soft governance is more effective long-term.
**How it chains:** Detection → prompt injection → TUI toast → evidence gate escalation (INFO→WARN→CRITICAL→DEGRADED)

### Pattern 2: SDK Client in Hooks, Not Init
**What:** Use `client.*` from within hooks and tool handlers, never during plugin initialization.
**Why:** Deadlock: plugin init waits for server → server waits for plugin init (verified in oh-my-opencode #1301).
**How:** Store client reference: `let sdkClient; plugin = async ({ client }) => { sdkClient = client; return hooks; }`

### Pattern 3: Filesystem for Persistence, SDK for Intelligence
**What:** Brain state, mems, hierarchy → filesystem. Session awareness, search, toasts → SDK client.
**Why:** Filesystem survives everything (crashes, restarts, platform switches). SDK provides real-time intelligence.
**How:** Core lib reads/writes `.hivemind/`. Hooks use `client.*` for enrichment.

### Pattern 4: Event-Driven, Not Polling
**What:** Subscribe to `event` hook for `session.idle`, `file.edited`, `session.diff` instead of counting turns.
**Why:** Turn counting is a proxy. Events are the truth. An agent can make 20 productive turns or 2 drifting ones.
**How:** `event` hook → dispatch to appropriate system based on event type.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: SDK as Foundation
**What:** Building features that REQUIRE the SDK to function.
**Why bad:** Concepts become non-portable. Can't bring to Claude Code or Cursor.
**Instead:** Core logic in pure lib/. SDK in materialization layer only.

### Anti-Pattern 2: Permission Blocking
**What:** Using `permission.ask` to deny tool execution.
**Why bad:** Clashes with other plugins. User frustration. Defeats soft governance.
**Instead:** Escalating warnings via system prompt + TUI toasts.

### Anti-Pattern 3: Single-System Thinking
**What:** Building a feature that lives in only one system.
**Why bad:** Misses the mesh multiplier. A tool without governance awareness is just a command.
**Instead:** Every feature touches at least 2 systems. A tool saves to mems AND updates hierarchy AND triggers detection.

### Anti-Pattern 4: Shallow Tool Registration
**What:** Registering tools that just wrap CLI commands.
**Why bad:** Agent gets no cognitive benefit. It's `bash` with extra steps.
**Instead:** Tools that read hierarchy context, use detection signals, persist to mems. Cognitive prosthetics.

---

## Reference: SDK Channels Available (Verified)

| Channel | What It Provides | Used By |
|---------|-----------------|---------|
| `client.session.*` | Full session CRUD + prompt + messages + fork | Session Management |
| `client.tui.showToast()` | Visual notifications | Auto-Hooks (governance alerts) |
| `client.file.read/status` | File content + git status | Agent Tools |
| `client.find.text/files/symbols` | ripgrep, fd, LSP symbols | Agent Tools (fast extraction) |
| `event` hook (32 types) | Real-time system events | Auto-Hooks (triggers) |
| `$` BunShell | Subprocess spawning | Agent Tools (repomix, git, rg) |
| `chat.system.transform` | System prompt injection | All systems (governance delivery) |
| `chat.messages.transform` | Full message history manipulation | Session Management (context pruning) |
| `session.compacting` | Compaction context + prompt override | Session Management |
| `tool.execute.before/after` | Tool lifecycle tracking | Auto-Hooks (metrics, detection) |
| `shell.env` | Environment variable injection | System Core (governance vars) |
| `chat.params` | LLM parameter tuning | Auto-Hooks (temperature by mode) |
| `context.metadata()` | Real-time tool display updates | Agent Tools (progress feedback) |
| `context.ask()` | Dynamic user permission requests | Agent Tools (destructive ops) |

**NOT used (by design):** `permission.ask` (blocking), `auth` (not needed), `chat.headers` (not needed)

---

## Sources

- idumb-v2 diagram (user's architectural vision)
- OpenCode SDK v1.1.53 source (`@opencode-ai/plugin`, `@opencode-ai/sdk`)
- 8 plugin repos analyzed via repomix (see `.planning/research/plugin-refs/README.md`)
- SDK client verification: micode, subtask2, oh-my-opencode, opencode-pty, plannotator
- Stress test results from 6-agent parallel investigation

---
*Last updated: 2026-02-12 after SDK verification + cognitive mesh reframing*
