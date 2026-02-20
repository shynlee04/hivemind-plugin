# HiveMind v3.0 — Relational Cognitive Engine

## What This Is

A Context-Aware Governance Layer for OpenCode that prevents drift and manages session state across lifecycles. Runs as an in-process plugin using native EventEmitter + fs.watch for file monitoring. Provides 6 canonical tools (session, inspect, memory, anchor, hierarchy, cycle) with Zod-validated schemas and FK-constrained graph storage.

## Core Value

**Every turn, the agent has pristine context.** The cognitive packer compiles deterministic XML from the graph, filters stale/false_path nodes, and injects it automatically via hooks. No lost decisions, no repeated work.

## Requirements

### Validated

<!-- Already implemented and working -->

- ✓ 6 canonical tools wired (hivemind-session, inspect, memory, anchor, hierarchy, cycle)
- ✓ Graph-RAG with UUID FKs (graph-nodes.ts, graph-state.ts)
- ✓ Cognitive Packer produces deterministic XML (cognitive-packer.ts)
- ✓ Session swarms via SDK (session-swarm.ts with noReply: true)
- ✓ In-process event engine (event-bus.ts, watcher.ts)
- ✓ 126 tests passing (99.2% pass rate)
- ✓ TypeScript strict mode, type-check clean
- ✓ Atomic file I/O with proper-lockfile
- ✓ Zod schemas at all layer boundaries

### Active

<!-- Current scope. Building toward these. -->

- [ ] **FOUNDATION-01**: Validate all Phase 1-6 components work correctly end-to-end
- [ ] **FOUNDATION-02**: Verify cognitive packer produces correct XML output
- [ ] **FOUNDATION-03**: Verify session lifecycle hooks inject context properly
- [ ] **FOUNDATION-04**: Verify FK constraints prevent orphaned nodes
- [ ] **TUI-01**: Migrate dashboard from Ink to OpenTUI (React or SolidJS)
- [ ] **TUI-02**: Build TUI that displays real-time session state
- [ ] **TUI-03**: Build TUI that shows hierarchy tree (trajectory → tactic → action)
- [ ] **TUI-04**: Build TUI that shows memory/anchors
- [ ] **TUI-05**: Build TUI that shows tool execution log
- [ ] **TUI-06**: Ensure TUI works with bilingual EN/VI support

### Out of Scope

- React/Bun as runtime (OpenTUI requires Bun, but plugin runs in Node.js - use child_process spawn)
- HTTP/WebSocket servers (in-process only)
- External database (filesystem persistence only)
- Mobile app (terminal UI only)
- OAuth/authentication (runs inside OpenCode context)

## Context

**Architecture:**
- **Tools Layer** (src/tools/): 6 dumb dispatchers, ≤100 lines each, write-only
- **Libraries Layer** (src/lib/): 42 files, pure TS business logic
- **Hooks Layer** (src/hooks/): 13 files, SDK event listeners, read-auto
- **Schemas Layer** (src/schemas/): 8 files, Zod validation with FK constraints
- **Dashboard Layer** (src/dashboard/): 18 files, Ink TUI (migration pending)

**Current State:**
- 95 source files, ~20,000 lines TypeScript
- 43 test files, ~12,000 lines
- Dashboard uses Ink+React (needs OpenTUI migration)
- i18n infrastructure exists (i18n.ts with EN/VI)

**Known Issues:**
- 1 failing test in integration.test.ts (legacy patterns)
- Documentation not updated (US-025 pending)
- Dashboard components are stubs (TODO comments)

## Constraints

- **Runtime**: Node.js 20+ for plugin, Bun required for OpenTUI dashboard
- **SDK**: Must use @opencode-ai/plugin for all tool/hook registration
- **Architecture**: Tools ≤100 lines, no business logic in tools
- **Storage**: Filesystem only (.hivemind/ directory)
- **UI Framework**: OpenTUI (@opentui/react or @opentui/solid), NOT Ink

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| In-Process Event Engine | No HTTP/WebSocket overhead, native EventEmitter | ✓ Good |
| OpenTUI for Dashboard | Native OpenCode integration, Bun-powered | — Pending |
| Zod for all validation | Type inference + runtime validation | ✓ Good |
| Filesystem persistence | No external dependencies, portable | ✓ Good |
| FK constraints in schemas | Prevent orphaned nodes at validation time | ✓ Good |
| Bilingual EN/VI | Non-dev finance users in Vietnam | ✓ Good |

---
*Last updated: 2026-02-18 after GSD initialization*
