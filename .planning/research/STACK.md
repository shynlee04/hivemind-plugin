# Technology Stack: HiveMind Cognitive Mesh

**Project:** HiveMind v3
**Researched:** 2026-02-12

## Stack Philosophy

The stack serves the cognitive mesh. Every technology choice answers: "Does this help the 5 systems feed each other?" The SDK is the materialization layer — it gives us channels to manifest concepts. The concepts themselves (brain state, hierarchy, detection, mems) are pure TypeScript with zero SDK dependency.

## Recommended Stack

### Core Platform (Concept Layer — Platform-Agnostic)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.x | All concept logic | Type safety for brain state, hierarchy, detection schemas |
| Node.js | 20+ | Runtime | Plugin host for OpenCode, universal availability |
| Zod | 4.x | Schema validation | Tool schemas, brain state validation, config parsing |

### Materialization Layer (OpenCode-Specific)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@opencode-ai/plugin` | 1.1.53 | Plugin interface | Hooks, tool registration, BunShell access |
| `@opencode-ai/sdk` | 1.1.53 | SDK client | Sessions, TUI, files, find, events — the intelligence channels |

### SDK Client Channels (Verified Working from Plugins)

| Channel | SDK Method | Materializes Concept |
|---------|-----------|---------------------|
| **Sessions** | `client.session.create/list/get/messages/prompt/delete/summarize/fork` | Session = On-going Plan, Auto-Export |
| **TUI** | `client.tui.showToast({ body: { message, variant } })` | Visual governance (never blocking) |
| **Files** | `client.file.read({ query: { path } })`, `client.file.status()` | Fast Read, Codebase Awareness |
| **Search** | `client.find.text({ query: { pattern } })`, `client.find.files()`, `client.find.symbols()` | Fast Extract, Precision Extraction |
| **Events** | `event` hook — 32 event types (session.idle, file.edited, session.diff, etc.) | Auto-Hooks triggers (replacing turn-counting) |
| **Subprocess** | `$` BunShell — `` $`repomix --compress` ``, `` $`rg pattern` `` | Git Atomic Commits, repomix wrapping |
| **Context Inject** | `session.prompt({ body: { noReply: true, parts } })` | Silent context injection (plannotator pattern) |
| **Shell Env** | `shell.env` hook → inject `HIVEMIND_SESSION_ID` etc. | Governance state visible to scripts |
| **LLM Params** | `chat.params` hook → temperature, topP, topK | Mode-adaptive behavior |
| **Message Transform** | `experimental.chat.messages.transform` | Context window management |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| repomix | latest | Codebase packing | When agent needs whole-codebase awareness via `$` |
| ripgrep (rg) | system | Fast text search | Backup to `client.find.text()` via `$` |
| fd | system | Fast file find | Backup to `client.find.files()` via `$` |

### Testing & Dev

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node test runner | built-in | Unit + integration tests | Zero deps, TAP output, 705+ assertions |
| tsx | latest | TypeScript execution | Fast dev iteration |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Plugin SDK | `@opencode-ai/plugin` | Raw MCP server | MCP can't access hooks, TUI, sessions |
| State persistence | Filesystem (`.hivemind/`) | SDK storage API | No SDK storage exists; filesystem is portable |
| Subprocess | BunShell (`$`) | `child_process` | BunShell has streaming, JSON parsing, env injection built-in |
| Visual feedback | `client.tui.showToast()` | System prompt only | Toasts are immediate; prompt waits for next turn |
| Permission control | **NEVER** `permission.ask` | N/A | Blocking clashes with other plugins, contradicts soft governance |

## Installation

```bash
# Core (already in package.json)
npm install @opencode-ai/plugin @opencode-ai/sdk

# Dev
npm install -D typescript tsx
```

## Critical Rules

1. **Core lib/ MUST NOT import SDK** — concepts stay platform-portable
2. **SDK client used ONLY in hooks/ and tools/** — materialization layer
3. **NEVER use `permission.ask`** — soft governance always
4. **Client init in hooks, not plugin init** — avoid deadlock (oh-my-opencode #1301)
5. **Filesystem for persistence, SDK for intelligence** — dual channel

## Sources

- OpenCode SDK v1.1.53 source (packed in `plugin-refs/opencode-sdk.xml`)
- 8 real plugin repos verified (see `plugin-refs/README.md`)
- SDK client confirmed working: micode, subtask2, oh-my-opencode, opencode-pty, plannotator

---
*Last updated: 2026-02-12 after SDK verification + cognitive mesh reframing*
