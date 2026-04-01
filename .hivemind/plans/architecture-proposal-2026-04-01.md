# Architecture Proposal — HiveMind src/ Restructure — 2026-04-01

## 1. Executive Summary

- **One authority, one contract.** Every domain (trajectory, task, handoff, contract, journal, doc, runtime) gets exactly one feature module that owns its state, one tool surface that exposes it, and zero cross-domain imports. The current codebase has 6 upward imports and 3 cross-layer violations — all traceable to a missing "contracts" boundary between tool args and feature implementations.
- **Lifecycle-driven module placement.** Modules are grouped by which lifecycle events they respond to, not by file count. The 7 lifecycle events (plugin load, session create, message turn, tool execution, session compact, session idle, session delete) map to exactly 5 module families: Assembly, Journal, State, Routing, and Admin.
- **CQRS where writes collide, not everywhere.** The journal, trajectory ledger, and task state are write-heavy with multiple callers — they get CQRS boundaries. Session entry, prompt compilation, and config resolution are read-only or single-writer — they don't need CQRS.
- **Factory composition over barrel exports.** Every tool, hook, and manager is created via `createXXX()` factory functions. A central `createPlugin()` function assembles them. No barrel file re-exports entire directories — every import is explicit and traceable.
- **npm modularity by dependency weight.** The core package ships only what every consumer needs: trajectory, task, handoff, contract, journal, and runtime tools. Doc intelligence (remark dependency), admin surfaces (ink/json-render), and i18n ship as optional add-ons.
- **Dead code removal before restructuring.** 14 files with zero external consumers, 2 deprecated files, and 4 potentially dead subdirectories are eliminated from the target architecture. They don't get moved — they get deleted.
- **Hook alias registry for SDK drift.** All 11 OpenCode hook names are centralized in one registry with fallback aliases. When OpenCode renames `experimental.text.complete` to `text.complete`, one file changes — not 6 scattered import sites.

---

## 2. Runtime Lifecycle → Module Map

### Plugin Load

| Aspect | Detail |
|--------|--------|
| **Module** | `src/plugin/` (assembly) |
| **Reads** | `.opencode/plugins/` config, runtime attachment settings |
| **Writes** | `.opencode/agents/hivefiver.md` (if missing) |
| **Hooks subscribed** | All 11 hooks wired here |
| **Tools available** | All tools registered via `createToolRegistry()` |
| **State managed** | SDK context, turn snapshot loader, skill injection map, NL-first dispatch keys |
| **Key function** | `createHiveMindPlugin(input: PluginInput) → PluginReturn` |

### Session Created (`session.created`)

| Aspect | Detail |
|--------|--------|
| **Module** | `src/hooks/session/session-lifecycle-hook.ts` |
| **Reads** | Runtime attachment snapshot, trajectory ledger |
| **Writes** | `.hivemind/sessions/journey-events/{sessionId}.json` (V3 init) |
| **Hooks subscribed** | `event` → session.created handler |
| **Tools available** | All 13 tools (plugin-load registered) |
| **State managed** | Session V3 file creation, subagent parent linkage |
| **Key function** | `handleSessionCreated(sdkSessionId, properties) → void` |

### Message Turn (`chat.message` + `messages.transform`)

| Aspect | Detail |
|--------|--------|
| **Modules** | `src/hooks/chat/message-journal-hook.ts`, `src/hooks/chat/message-transform-hook.ts` |
| **Reads** | Turn snapshot, trajectory ledger, agent-work contract, session state |
| **Writes** | Session JSON (turnCount++), in-memory injection payload |
| **Hooks subscribed** | `chat.message`, `experimental.chat.messages.transform` |
| **Tools available** | All tools; NL-first dispatch may auto-trigger `hivemind_runtime_command` |
| **State managed** | Turn counter, injection payload store, start-work routing decision |
| **Key functions** | `handleChatMessage()`, `createMessagesTransformHandler()` |

### Tool Execution (`tool.execute.before` + `tool.execute.after`)

| Aspect | Detail |
|--------|--------|
| **Modules** | `src/hooks/tool/tool-observer-hook.ts`, `src/tools/*/` (each tool) |
| **Reads** | Tool args, trajectory ledger (for event recording) |
| **Writes** | Session JSON (toolCallCount++), trajectory ledger (transition events) |
| **Hooks subscribed** | `tool.execute.before`, `tool.execute.after`, `permission.ask` |
| **Tools available** | Invoked tool + all other tools |
| **State managed** | Tool event tracking, trajectory transition recording, permission auto-allow |
| **Key functions** | `recordToolEvent()`, `handleToolExecution()` |

### Session Compacted (`session.compacting` + `session.compacted`)

| Aspect | Detail |
|--------|--------|
| **Modules** | `src/hooks/compaction/compaction-inject-hook.ts`, `src/hooks/compaction/compaction-journal-hook.ts`, `src/hooks/session/session-lifecycle-hook.ts` |
| **Reads** | Turn snapshot, agent-work contract, trajectory ledger |
| **Writes** | Session JSON (compactionCount++), markdown events, recovery checkpoint |
| **Hooks subscribed** | `experimental.session.compacting`, `event` → session.compacted |
| **Tools available** | All tools |
| **State managed** | Compaction context injection, recovery checkpoint creation, journal append |
| **Key functions** | `createCompactionHandler()`, `createCompactionJournalHandler()`, `createRecoveryCheckpoint()` |

### Session Idle (`session.idle`)

| Aspect | Detail |
|--------|--------|
| **Module** | `src/hooks/session/session-lifecycle-hook.ts` |
| **Reads** | Session JSON, trajectory ledger, SDK client session data |
| **Writes** | Trajectory ledger (idle event, if active) |
| **Hooks subscribed** | `event` → session.idle |
| **Tools available** | All tools |
| **State managed** | Idle event recording on trajectory |
| **Key function** | `handleSessionIdle(sdkSessionId) → void` |

### Session Deleted (`session.deleted`)

| Aspect | Detail |
|--------|--------|
| **Module** | `src/hooks/session/session-lifecycle-hook.ts` |
| **Reads** | Session JSON, trajectory ledger |
| **Writes** | Session JSON (status→"errored", endedAt set), trajectory ledger (deletion event) |
| **Hooks subscribed** | `event` → session.deleted |
| **Tools available** | All tools |
| **State managed** | Session status transition, trajectory event recording |
| **Key function** | `handleSessionDeleted(sdkSessionId) → void` |

---

## 3. Ideal Directory Structure

```
src/
├── plugin/                          # Plugin assembly — wires everything (≤250 LOC)
│   ├── index.ts                     # Single entry: createHiveMindPlugin()
│   ├── tool-registry.ts             # createToolRegistry() — assembles all tools
│   ├── hook-registry.ts             # createHookRegistry() — assembles all hooks
│   ├── hook-alias-registry.ts       # OpenCode hook name → capability mapping
│   └── sdk-context.ts               # SDK client initialization/reset
│
├── tools/                           # LLM-facing tool surfaces (thin adapters)
│   ├── index.ts                     # Tool catalog metadata only (no factories)
│   ├── trajectory/
│   │   ├── trajectory-tool.ts       # createTrajectoryTool() — 6 actions
│   │   └── trajectory-tool-types.ts # Tool args + pressure contracts
│   ├── task/
│   │   ├── task-tool.ts             # createTaskTool() — 7 actions
│   │   └── task-tool-types.ts
│   ├── handoff/
│   │   ├── handoff-tool.ts          # createHandoffTool() — 6 actions
│   │   └── handoff-tool-types.ts
│   ├── contract/
│   │   ├── contract-tool.ts         # createContractTool() — 3 actions (create/update/export)
│   │   └── contract-tool-types.ts
│   ├── journal/
│   │   └── journal-tool.ts          # createJournalTool() — event writer
│   ├── doc/
│   │   ├── doc-tool.ts              # createDocTool() — 5 actions (optional add-on)
│   │   └── doc-tool-types.ts
│   ├── runtime/
│   │   ├── runtime-status-tool.ts   # createRuntimeStatusTool() — inspect only
│   │   ├── runtime-command-tool.ts  # createRuntimeCommandTool() — execute
│   │   └── runtime-tool-types.ts    # Shared types for both runtime tools
│   └── admin/                       # Optional admin add-on
│       ├── init-tool.ts             # createInitTool() — bootstrap (placeholder → real)
│       ├── doctor-tool.ts           # createDoctorTool() — diagnostics (placeholder → real)
│       └── config-tool.ts           # createConfigTool() — settings management
│
├── features/                        # Domain logic — state, business rules, persistence
│   ├── trajectory/
│   │   ├── index.ts                 # Exports TrajectoryManager
│   │   ├── trajectory-manager.ts    # Orchestrates ledger operations
│   │   └── trajectory-types.ts      # Domain types (not tool args)
│   ├── workflow/
│   │   ├── index.ts                 # Exports WorkflowManager
│   │   ├── workflow-manager.ts      # Orchestrates task lifecycle
│   │   ├── task-lifecycle.ts        # Task CRUD, activation, verification
│   │   └── workflow-types.ts
│   ├── handoff/
│   │   ├── index.ts                 # Exports HandoffManager
│   │   ├── handoff-manager.ts       # Delegation CRUD + continuity sync
│   │   └── handoff-types.ts
│   ├── contract/
│   │   ├── index.ts                 # Exports ContractEngine
│   │   ├── contract-store.ts        # JSON file CRUD with locking
│   │   ├── intent-classifier.ts     # Regex-based intent classification
│   │   ├── chain-executor.ts        # Chain action dispatch
│   │   └── contract-types.ts
│   ├── journal/
│   │   ├── index.ts                 # Exports EventSink
│   │   ├── event-sink.ts            # Persistence contract + implementation
│   │   ├── consolidated-writer.ts   # V3 session JSON writer
│   │   ├── markdown-writer.ts       # Human-readable event log
│   │   └── journal-types.ts
│   ├── doc-intelligence/            # Optional add-on feature
│   │   ├── index.ts
│   │   └── doc-adapter.ts           # Delegates to intelligence layer
│   ├── runtime/
│   │   ├── index.ts
│   │   ├── runtime-status.ts        # Status snapshot builder
│   │   ├── runtime-command.ts       # Command execution dispatcher
│   │   └── runtime-types.ts
│   └── admin/                       # Optional admin add-on feature
│       ├── bootstrap.ts             # hm-init logic
│       ├── diagnostics.ts           # hm-doctor logic
│       └── config-manager.ts        # hm-settings logic
│
├── hooks/                           # OpenCode hook handlers (grouped by event type)
│   ├── index.ts                     # Barrel: createHookRegistry
│   ├── session/
│   │   ├── session-lifecycle-hook.ts    # session.created/idle/deleted/error
│   │   └── session-types.ts
│   ├── chat/
│   │   ├── message-journal-hook.ts      # chat.message → journal recording
│   │   ├── message-transform-hook.ts    # messages.transform → context injection
│   │   └── chat-types.ts
│   ├── tool/
│   │   ├── tool-observer-hook.ts        # tool.execute.before/after
│   │   └── tool-types.ts
│   ├── compaction/
│   │   ├── compaction-inject-hook.ts    # session.compacting → context injection
│   │   ├── compaction-journal-hook.ts   # session.compacting → journal append
│   │   └── compaction-types.ts
│   └── system/
│       ├── system-transform-hook.ts     # system.transform → prompt modification
│       ├── text-complete-hook.ts        # text.complete → turn journaling
│       └── system-types.ts
│
├── intelligence/                    # Read-only document parsing (shared by doc tool)
│   ├── doc/
│   │   ├── index.ts
│   │   ├── read-ops.ts              # skim, read, chunk, search operations
│   │   ├── formats/md.ts            # Markdown AST parsing via remark
│   │   ├── safety.ts                # Path traversal protection
│   │   └── doc-types.ts
│   └── index.ts
│
├── core/                            # Lowest-level state persistence (file I/O only)
│   ├── index.ts
│   ├── trajectory/
│   │   ├── index.ts
│   │   ├── trajectory-ledger.ts     # Ledger file I/O (read/write/ensure)
│   │   └── trajectory-types.ts      # Ledger schema types
│   └── workflow/
│       ├── index.ts
│       ├── task-state.ts            # Task state file I/O
│       ├── workflow-authority.ts    # Authority file bootstrap/inspect
│       └── workflow-types.ts
│
├── schema-kernel/                   # Zod schemas — contract authority
│   ├── index.ts
│   ├── config-records.ts            # User preferences, governance config
│   ├── agent-records.ts             # Agent templates, purpose classes
│   ├── skill-injection-records.ts   # Skill injection rules
│   └── runtime-contracts.ts         # Runtime status, capability schemas
│
├── shared/                          # Cross-cutting utilities (leaf layer)
│   ├── index.ts
│   ├── paths.ts                     # .hivemind/ path resolution
│   ├── tool-response.ts             # ToolResponse<T> envelope
│   ├── tool-helpers.ts              # parseList, renderToolResult
│   ├── logging.ts                   # Structured logging
│   ├── pressure-contract.ts         # Runtime pressure contracts
│   ├── errors.ts                    # Error hierarchy
│   ├── contracts/
│   │   ├── runtime-events.ts
│   │   └── runtime-status.ts
│   └── intake-record/               # Intake record types + validation
│       ├── intake-record-types.ts
│       ├── intake-record-factory.ts
│       ├── intake-record-validation.ts
│       └── intake-record-serialization.ts
│
├── recovery/                        # State assessment and repair
│   ├── index.ts
│   ├── recovery-engine.ts
│   └── recovery-types.ts
│
├── control-plane/                   # CLI primitive registry and gate resolution
│   ├── index.ts
│   ├── control-plane-registry.ts    # 4 primitives: hm-init/doctor/harness/settings
│   ├── control-plane-handler.ts     # Command dispatch
│   ├── sdk-runtime.ts               # SDK lifecycle management
│   └── control-plane-types.ts
│
├── commands/                        # Slash command bundle registry
│   └── slash-command/
│       ├── index.ts
│       ├── command-bundles.ts       # 10 command bundles
│       ├── command-discovery.ts
│       ├── command-runner.ts
│       └── command-types.ts
│
├── context/                         # Prompt packet compilation
│   └── prompt-packet/
│       ├── index.ts
│       ├── prompt-packet-types.ts
│       ├── prompt-packet-normalize.ts
│       ├── prompt-packet-renderers.ts
│       └── prompt-compiler.ts
│
├── delegation/                      # Handoff file CRUD (used by handoff feature)
│   ├── index.ts
│   ├── delegation-store.ts          # File CRUD for .hivemind/handoffs/
│   ├── delegation-packet.ts         # Packet factory
│   └── delegation-record.schema.ts  # Zod validation schemas
│
├── session/                         # Session entry/intake (renamed from session-entry)
│   ├── index.ts
│   ├── intake-gates.ts              # Gate resolution for hm-init/hm-settings
│   ├── profile-resolution.ts        # Language, preset, profile resolution
│   ├── lineage-router.ts            # hivefiver vs hiveminder
│   ├── purpose-classifier.ts        # Purpose classification
│   ├── readiness-gates.ts           # Readiness gate resolution
│   ├── session-state.ts             # Session state detection
│   └── session-types.ts
│
├── governance/                      # Planning projection (read-only)
│   ├── index.ts
│   └── planning-projection.ts
│
└── archive/                         # Legacy schema re-exports (read-only, no writes)
    └── schema-kernel/
        ├── index.ts
        ├── evidence-records.ts
        ├── lifecycle-records.ts
        ├── orchestration-records.ts
        └── shared.ts
```

### LOC Targets per Module

| Module | Target LOC | Rationale |
|--------|-----------|-----------|
| Each tool file | ≤100 LOC | Thin adapter — Zod schema + execute delegation only |
| Each tool-types file | ≤80 LOC | Args + pressure contracts only |
| Each feature manager | ≤200 LOC | Orchestrates core + delegation, no direct file I/O |
| Each core file | ≤150 LOC | Pure file I/O — read, write, ensure |
| Each hook file | ≤120 LOC | Event handler + journal write delegation |
| shared/ files | ≤100 LOC | Single-purpose utilities |
| plugin/ files | ≤250 LOC total | Assembly only — no business logic |
| schema-kernel/ files | ≤150 LOC | Zod schemas only |

---

## 4. Module Classification Matrix

| Current Location | Ideal Location | Intent | CRUD Group | CQRS? | Actor |
|-----------------|---------------|--------|-----------|-------|-------|
| `tools/trajectory/` | `tools/trajectory/` | Deterministic tool | 1 | No | Agent calls during planning/implementation |
| `tools/task/` | `tools/task/` | Deterministic tool | 1 | No | Agent calls during workflow execution |
| `tools/handoff/` | `tools/handoff/` | Deterministic tool | 1 | No | Agent calls during delegation |
| `tools/doc/` | `tools/doc/` | Deterministic tool | 1 | No | Agent calls during discovery/research |
| `tools/runtime/` | `tools/runtime/` | Deterministic tool | 1 | No | Agent calls for status/command |
| `tools/hivemind-journal.ts` | `tools/journal/` | Hybrid (deterministic + auto) | 3 | Yes | Agent calls + hooks auto-write |
| `tools/hivefiver-init/` | `tools/admin/` | Deterministic tool | 1 | No | Agent calls during bootstrap |
| `tools/hivefiver-doctor/` | `tools/admin/` | Deterministic tool | 1 | No | Agent calls during diagnostics |
| `tools/hivefiver-setting/` | `tools/admin/` | Deterministic tool | 1 | No | Agent calls for config management |
| `features/agent-work-contract/` | `features/contract/` + `tools/contract/` | Hybrid (deterministic + auto) | 3 | Yes | Agent calls + chain executor auto-dispatch |
| `features/doc-intelligence/` | `features/doc-intelligence/` | Deterministic adapter | 1 | No | Called by doc tool only |
| `features/event-tracker/` | `features/journal/` | Auto-writer | 2 | Yes | Hooks auto-write on every turn |
| `features/handoff/` | `features/handoff/` | Deterministic adapter | 1 | No | Called by handoff tool only |
| `features/runtime-entry/` | Split: `features/runtime/` + `session/` + `features/admin/` | Hybrid | 3 | Partial | Multiple actors |
| `features/runtime-observability/` | `features/runtime/` | Deterministic adapter | 1 | No | Called by runtime tools |
| `features/session-entry/` | `session/` | Deterministic resolver | 1 | No | Hooks call during message turn |
| `features/session-journal/` | `features/journal/` | Auto-writer | 2 | Yes | Hooks auto-write |
| `features/trajectory/` | `features/trajectory/` | Deterministic adapter | 1 | No | Called by trajectory tool |
| `features/workflow/` | `features/workflow/` | Deterministic adapter | 1 | No | Called by task tool |
| `core/trajectory/` | `core/trajectory/` | Auto-writer (file I/O) | 2 | No | Feature managers call |
| `core/workflow-management/` | `core/workflow/` | Auto-writer (file I/O) | 2 | No | Feature managers call |
| `hooks/event-handler.ts` | `hooks/session/` | Auto-writer | 2 | Yes | OpenCode fires events |
| `hooks/tool-execution-handler.ts` | `hooks/tool/` | Auto-writer | 2 | Yes | OpenCode fires tool events |
| `hooks/text-complete-handler.ts` | `hooks/system/` | Auto-writer | 2 | Yes | OpenCode fires text events |
| `hooks/compaction-handler.ts` | `hooks/compaction/` | Auto-writer | 2 | Yes | OpenCode fires compaction |
| `hooks/chat-message-handler.ts` | `hooks/chat/` | Auto-writer | 2 | Yes | OpenCode fires messages |
| `hooks/transform-handler.ts` | `hooks/system/` | Hook-subscribed | 1 | No | OpenCode fires transform |
| `hooks/start-work/` | `session/` | Deterministic resolver | 1 | No | Message transform hook calls |
| `hooks/runtime-loader/` | `hooks/tool/` | Hook-subscribed | 1 | No | Plugin assembly uses |
| `hooks/auto-slash-command/` | Delete | Dead code | — | — | — |
| `hooks/workflow-integration/` | Delete | Dead code | — | — | — |
| `plugin/opencode-plugin.ts` | `plugin/index.ts` | Assembly | — | No | OpenCode loads plugin |
| `plugin/messages-transform-adapter.ts` | `hooks/chat/message-transform-hook.ts` | Hook-subscribed | 2 | No | OpenCode fires messages.transform |
| `plugin/compaction-adapter.ts` | `hooks/compaction/compaction-inject-hook.ts` | Hook-subscribed | 2 | No | OpenCode fires session.compacting |
| `plugin/context-renderer/` | `context/prompt-packet/` | Deterministic renderer | 1 | No | Message transform calls |
| `plugin/skill-exposure-map.ts` | `plugin/` | Hook-subscribed | 1 | No | Message transform calls |
| `plugin/synthetic-parts.ts` | `plugin/` | Deterministic helper | 1 | No | Message transform calls |
| `plugin/injection-store.ts` | `hooks/chat/` | Hybrid | 3 | No | Message transform → text.complete |
| `shared/` | `shared/` | Utility | — | No | All layers |
| `intelligence/doc/` | `intelligence/doc/` | Deterministic parser | 1 | No | Doc feature calls |
| `sdk-supervisor/` | Delete (merge into `features/runtime/`) | Deterministic | 1 | No | Runtime tools call |
| `delegation/` | `delegation/` | Deterministic store | 1 | No | Handoff feature calls |
| `cli/` | Delete (merge into `features/admin/`) | Deterministic | 1 | No | CLI entry point |
| `control-plane/` | `control-plane/` | Deterministic registry | 1 | No | Session entry calls |
| `governance/` | `governance/` | Deterministic projection | 1 | No | Runtime entry calls |
| `recovery/` | `recovery/` | Deterministic engine | 1 | No | Event handler calls |
| `commands/slash-command/` | `commands/slash-command/` | Deterministic registry | 1 | No | Control plane calls |
| `context/prompt-packet/` | `context/prompt-packet/` | Deterministic compiler | 1 | No | Plugin assembly calls |

### CQRS Rationale

| Module | CQRS? | Why |
|--------|-------|-----|
| Journal (event-tracker) | Yes | Multiple hooks write concurrently; needs write-side isolation |
| Trajectory ledger | Yes | Tool writes + hook auto-writes; needs conflict resolution |
| Task state | Yes | Tool writes + trajectory bootstrap writes; needs atomic updates |
| Contract store | Yes | Tool writes + chain executor auto-writes; needs locking |
| Handoff store | No | Single-writer (tool only); hooks only read |
| Session entry | No | Read-only resolution; no writes |
| Prompt packet | No | Read-only compilation; no writes |
| Config manager | No | Single-writer (tool only) |
| Runtime status | No | Read-only inspection |

---

## 5. Dependency Graph

```
Layer 0: OpenCode SDK (external)
    ↓
Layer 1: Plugin Assembly (src/plugin/)
    ├── Creates tools via createToolRegistry()
    ├── Creates hooks via createHookRegistry()
    ├── Initializes SDK context
    └── Wires hook aliases
    ↓
Layer 2: Tool Surfaces (src/tools/)
    ├── Thin adapters: Zod schema + execute() → feature delegation
    ├── Import: features/, shared/, schema-kernel/
    └── Never import: hooks/, plugin/, other tools/
    ↓
Layer 3: Feature Modules (src/features/)
    ├── Domain logic: business rules, orchestration
    ├── Import: core/, shared/, schema-kernel/, delegation/, intelligence/
    └── Never import: tools/, hooks/, plugin/
    ↓
Layer 4: Core Persistence (src/core/)
    ├── Pure file I/O: read, write, ensure
    ├── Import: shared/, schema-kernel/
    └── Never import: features/, tools/, hooks/
    ↓
Layer 5: Hook Handlers (src/hooks/)
    ├── Event-driven: respond to OpenCode lifecycle
    ├── Import: features/, shared/, session/, context/
    └── Never import: tools/, plugin/
    ↓
Layer 6: Shared Utilities (src/shared/) — LEAF
    ├── Cross-cutting: paths, errors, logging, pressure contracts
    └── Import: schema-kernel/ only
    ↓
Layer 7: Schema Kernel (src/schema-kernel/) — FOUNDATION
    ├── Zod schemas: contract authority
    └── Import: nothing (stdlib only)
```

### Import Rules

| From Layer | Can Import | Cannot Import |
|-----------|-----------|--------------|
| Plugin (1) | Tools (2), Hooks (5), Shared (6), Schema (7) | Features (3), Core (4) |
| Tools (2) | Features (3), Shared (6), Schema (7) | Hooks (5), Plugin (1), Other Tools (2) |
| Features (3) | Core (4), Shared (6), Schema (7), Delegation, Intelligence | Tools (2), Hooks (5), Plugin (1) |
| Core (4) | Shared (6), Schema (7) | Features (3), Tools (2), Hooks (5) |
| Hooks (5) | Features (3), Shared (6), Session (5a), Context (5b) | Tools (2), Plugin (1) |
| Shared (6) | Schema (7) | Everything above |
| Schema (7) | Nothing | Everything |

### Circular Dependency Prevention

1. **No feature imports its own tool types.** Move shared action types to `feature/contracts.ts` — the feature owns them.
2. **No hook imports tool factories.** Hooks call feature functions directly.
3. **No shared imports hooks.** Logging uses SDK `client.app.log()` directly, not hook-layer SDK context.
4. **Delegation is a leaf module.** It has no imports from features, tools, or hooks — only shared and schema-kernel.

---

## 6. Tool Catalog Design

### Registration Strategy

All tools are registered through a single `createToolRegistry()` function in `src/plugin/tool-registry.ts`:

```
createToolRegistry({ directory, featureFlags, config }) → Record<string, ToolDefinition>
```

### Public Tools (Core Package)

| Tool ID | Factory | Actions | CRUD Group | Priority |
|---------|---------|---------|-----------|----------|
| `hivemind_trajectory` | `createTrajectoryTool()` | inspect, traverse, attach, checkpoint, event, close | 1 | High |
| `hivemind_task` | `createTaskTool()` | create, list, get, activate, rotate, verify, complete | 1 | High |
| `hivemind_handoff` | `createHandoffTool()` | create, read, list, update, validate, close | 1 | High |
| `hivemind_contract` | `createContractTool()` | create, update, export | 3 | High |
| `hivemind_journal` | `createJournalTool()` | write (event types) | 3 | High |
| `hivemind_runtime_status` | `createRuntimeStatusTool()` | inspect only | 1 | High |
| `hivemind_runtime_command` | `createRuntimeCommandTool()` | command dispatch | 1 | High |

### Optional Add-on Tools

| Tool ID | Factory | Actions | Package | Priority |
|---------|---------|---------|---------|----------|
| `hivemind_doc` | `createDocTool()` | skim, skim_directory, read, chunk, search | docs add-on | Medium |
| `hivemind_hm_config` | `createConfigTool()` | group, key, value, render | admin add-on | Medium |
| `hivemind_hm_init` | `createInitTool()` | mode, force | admin add-on | Low (placeholder) |
| `hivemind_hm_doctor` | `createDoctorTool()` | scope, fix | admin add-on | Low (placeholder) |

### Tool Priority Order (for context trimming)

```typescript
const LOW_PRIORITY_TOOL_ORDER = [
  // Admin tools — least critical for orchestration
  "hivemind_hm_doctor",
  "hivemind_hm_init",
  "hivemind_hm_config",
  // Doc tools — useful but not core
  "hivemind_doc",
  // Journal — important but hooks auto-write
  "hivemind_journal",
  // Contract — needed for advanced workflows
  "hivemind_contract",
  // Runtime — needed for observability
  "hivemind_runtime_command",
  "hivemind_runtime_status",
  // Core orchestration — highest priority
  "hivemind_handoff",
  "hivemind_task",
  "hivemind_trajectory",
] as const
```

### Internal vs Public Classification

| Classification | Tools | Rationale |
|---------------|-------|-----------|
| **Public** | trajectory, task, handoff, contract, journal, runtime_status, runtime_command | Agent-callable, durable state, core orchestration |
| **Add-on public** | doc, config, init, doctor | Agent-callable but optional dependency weight |
| **Internal** | classify-intent (unregistered) | Feature-local service, no agent use case |

---

## 7. Hook Strategy

### Hook Grouping by Event Type

| Group | Hooks | OpenCode Hook Keys |
|-------|-------|-------------------|
| **Session lifecycle** | session-lifecycle-hook | `event` (session.created/idle/deleted/error/compacted) |
| **Chat** | message-journal-hook, message-transform-hook | `chat.message`, `experimental.chat.messages.transform` |
| **Tool observer** | tool-observer-hook | `tool.execute.before`, `tool.execute.after`, `permission.ask` |
| **Compaction** | compaction-inject-hook, compaction-journal-hook | `experimental.session.compacting` |
| **System** | system-transform-hook, text-complete-hook | `experimental.chat.system.transform`, `experimental.text.complete` |
| **Environment** | (inline in plugin) | `shell.env`, `command.execute.before` |

### Hook Alias Registry

```typescript
// src/plugin/hook-alias-registry.ts
interface HookAlias {
  capability: string          // Internal capability name
  primary: string             // Preferred OpenCode hook name
  fallbacks: string[]         // Alternative names for SDK drift
  required: boolean           // Fail plugin load if missing
}

const HOOK_ALIAS_REGISTRY: HookAlias[] = [
  { capability: "session-lifecycle", primary: "event", fallbacks: [], required: true },
  { capability: "message-journal", primary: "chat.message", fallbacks: [], required: true },
  { capability: "message-transform", primary: "experimental.chat.messages.transform", fallbacks: ["chat.messages.transform"], required: true },
  { capability: "tool-before", primary: "tool.execute.before", fallbacks: [], required: true },
  { capability: "tool-after", primary: "tool.execute.after", fallbacks: [], required: true },
  { capability: "permission-gate", primary: "permission.ask", fallbacks: [], required: true },
  { capability: "compaction", primary: "experimental.session.compacting", fallbacks: ["session.compacting"], required: true },
  { capability: "system-transform", primary: "experimental.chat.system.transform", fallbacks: ["chat.system.transform"], required: true },
  { capability: "text-complete", primary: "experimental.text.complete", fallbacks: ["text.complete"], required: true },
  { capability: "shell-env", primary: "shell.env", fallbacks: [], required: true },
  { capability: "command-before", primary: "command.execute.before", fallbacks: [], required: true },
]
```

### Hook Subscription Pattern

Every hook is created via a factory and registered through the alias registry:

```
createHookRegistry({ directory, managers, aliasRegistry }) → HookRegistry
  ↓
For each alias in registry:
  1. Resolve hook name (primary → fallbacks)
  2. Create hook via createXXXHook()
  3. Wrap in safeHook() for error isolation
  4. Register on resolved hook name
  5. Track disposable hooks for cleanup
```

### Hook Composition

Hooks compose through the `Managers` interface — not through direct imports:

```
Hook → Manager → Feature → Core
```

No hook imports another hook. No hook imports a tool. Hooks receive managers as constructor args.

---

## 8. Feature Grouping

### Self-Sustaining Features (on/off, no hook dependency)

| Feature | Module | Purpose | npm Package |
|---------|--------|---------|-------------|
| Trajectory | `features/trajectory/` | Ledger management | core |
| Workflow | `features/workflow/` | Task lifecycle | core |
| Handoff | `features/handoff/` | Delegation CRUD | core |
| Contract | `features/contract/` | Agent-work contracts | core |
| Doc Intelligence | `features/doc-intelligence/` | Markdown parsing | docs add-on |
| Recovery | `recovery/` | State repair | core |

### Hook-Subscribed Features (need hook wiring)

| Feature | Module | Hooks Needed | npm Package |
|---------|--------|-------------|-------------|
| Journal | `features/journal/` | chat.message, text.complete, tool.after, compaction, session events | core |
| Runtime | `features/runtime/` | event, command.before | core |
| Session Entry | `session/` | messages.transform | core |
| Context/Prompt | `context/prompt-packet/` | system.transform, messages.transform | core |

### External-Library-Dependent Features

| Feature | Module | Dependencies | npm Package |
|---------|--------|-------------|-------------|
| Doc Intelligence | `intelligence/doc/` | remark, unist-util-visit | docs add-on |
| Config Manager | `features/admin/config-manager.ts` | @json-render/*, ink | admin add-on |
| Skill Injection | `shared/tiered-injection.ts` | yaml frontmatter parsing | core |

### SDK-Dependent Features

| Feature | Module | SDK Surface Used | npm Package |
|---------|--------|-----------------|-------------|
| Runtime Status | `features/runtime/` | client.session, client.app.log | core |
| SDK Context | `plugin/sdk-context.ts` | PluginInput, client | core |
| Permission Gate | `hooks/tool/` | permission.ask hook | core |
| Shell Env | `plugin/index.ts` | shell.env hook | core |

---

## 9. Migration Path

### Phase 0: Import Audit and Dependency Mapping

**Goal:** Map every import relationship before moving anything. No file moves until this phase completes and is verified.

- Run full import audit: `grep -rn "from.*src/" src/` → map all cross-module dependencies
- Classify each import as: type-only (`import type`), runtime function, or value import
- Identify all dynamic imports (`import()`, `require()` via variable) — these are invisible to static analysis
- Map all string-referenced paths (command bundles, config files, agent files that reference tool/module names)
- Produce `dependency-audit.json` with: source file → target file → import type → phase assignment
- **Gate:** `npx tsc --noEmit` passes on current codebase before any changes
- **Rollback:** N/A — this phase makes no file changes

### Phase 1: Dead Code Elimination (Deprecate-Then-Delete)

**Goal:** Remove confirmed dead code with safety nets. No structural moves — only deletions.

**Sub-phase 1a: Deprecation (safe, reversible)**
- Rename confirmed-dead files to `*.deprecated.ts` suffix (not delete):
  - `sdk-supervisor/session-inspection.ts` → `session-inspection.deprecated.ts`
  - `sdk-supervisor/diagnostic-log.ts` → `diagnostic-log.deprecated.ts`
  - `core/workflow-management/workflow-router.ts` → `workflow-router.deprecated.ts`
  - `core/workflow-management/continuity.ts` → `continuity.deprecated.ts`
  - `intelligence/doc/doc-surface-router.ts` → `doc-surface-router.deprecated.ts`
  - `schema-kernel/default-agent-templates.ts` → `default-agent-templates.deprecated.ts`
  - `hooks/auto-slash-command/` → rename directory to `auto-slash-command.deprecated/`
  - `hooks/workflow-integration/` → rename directory to `workflow-integration.deprecated/`
- Remove barrel exports for deprecated files (update `index.ts` files)
- **Gate:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Verification:** Plugin loads in OpenCode, all 13 tools still register, all hooks still fire
- **Rollback:** `git revert` — single commit, no import path changes

**Sub-phase 1b: Deletion (after 1 release cycle of deprecation)**
- Delete `*.deprecated.ts` files and their barrel references
- Delete `dashboard-v2/` (already empty stub — no deprecation needed)
- **Gate:** `npx tsc --noEmit` passes, `npm test` passes, plugin loads in OpenCode
- **Rollback:** `git revert` — single commit

**What is NOT deleted in Phase 1:**
- `cli/` directory — defer to Phase 2 (may be dynamically loaded by command router)
- `governance/` directory — defer to Phase 2 (trace runtime-entry dependency first)
- `sdk-supervisor/` — defer to Phase 2 (merge, don't delete)

### Phase 2: Module Relocation (Atomic Per-Module Moves)

**Goal:** Move modules to ideal locations. One module per commit. Build passes after every commit.

**Rule:** Each module move is a single atomic commit that includes:
1. All source files in the module
2. All test files for the module
3. All updated import paths in consuming files
4. Barrel export updates

**Move order (each is one commit, build must pass between commits):**

| Commit | Move | Consumers to Update | Risk |
|--------|------|-------------------|------|
| 2a | `hooks/start-work/` → `session/` | `hooks/`, `plugin/` | Low — small module, few consumers |
| 2b | `hooks/runtime-loader/` → `hooks/tool/` | `hooks/`, `plugin/` | Low — internal reorganization |
| 2c | `core/workflow-management/` → `core/workflow/` | `features/workflow/`, `features/trajectory/`, `recovery/` | Medium — core module, many consumers |
| 2d | `features/session-entry/` → `session/` | `hooks/`, `features/runtime-entry/`, `plugin/` | Medium — cross-cutting consumers |
| 2e | `features/runtime-observability/` → `features/runtime/` | `tools/runtime/` | Low — single consumer |
| 2f | `features/agent-work-contract/` → `features/contract/` | `features/handoff/`, `features/runtime-entry/`, `plugin/` | High — hub module |
| 2g | `features/event-tracker/` + `features/session-journal/` → `features/journal/` | All hooks, `plugin/` | High — largest module, most consumers |
| 2h | `plugin/messages-transform-adapter.ts` → `hooks/chat/message-transform-hook.ts` | `plugin/` | Low — single file |
| 2i | `plugin/compaction-adapter.ts` → `hooks/compaction/compaction-inject-hook.ts` | `plugin/` | Low — single file |
| 2j | `plugin/context-renderer/` → `context/prompt-packet/` | `plugin/` | Medium — multiple files |
| 2k | `hooks/event-handler.ts` → `hooks/session/session-lifecycle-hook.ts` | `plugin/` | Medium — large file |
| 2l | `hooks/tool-execution-handler.ts` → `hooks/tool/tool-observer-hook.ts` | `plugin/` | Low — single file |
| 2m | `hooks/text-complete-handler.ts` → `hooks/system/text-complete-hook.ts` | `plugin/` | Low — single file |
| 2n | `hooks/compaction-handler.ts` → `hooks/compaction/compaction-journal-hook.ts` | `plugin/` | Low — single file |
| 2o | `hooks/chat-message-handler.ts` → `hooks/chat/message-journal-hook.ts` | `plugin/` | Low — single file |
| 2p | `hooks/transform-handler.ts` → `hooks/system/system-transform-hook.ts` | `plugin/` | Low — single file |
| 2q | `tools/hivefiver-init/` → `tools/admin/init-tool.ts` | `plugin/`, `tools/index.ts` | Low — placeholder tool |
| 2r | `tools/hivefiver-doctor/` → `tools/admin/doctor-tool.ts` | `plugin/`, `tools/index.ts` | Low — placeholder tool |
| 2s | `tools/hivefiver-setting/` → `tools/admin/config-tool.ts` | `plugin/`, `tools/index.ts`, `features/runtime-entry/` | High — upward dependency source |
| 2t | `tools/hivemind-journal.ts` → `tools/journal/journal-tool.ts` | `plugin/`, `tools/index.ts` | Low — single file |
| 2u | `sdk-supervisor/` → merge into `features/runtime/` | `tools/runtime/`, `features/runtime-entry/` | Medium — layer elimination |
| 2v | `features/runtime-entry/` → split across `features/runtime/`, `session/`, `features/admin/` | Multiple | **CRITICAL** — largest module |

**Critical move 2v strategy (runtime-entry split):**
- Do NOT split in one commit. Split in 3 sub-commits:
  - 2v-1: Extract runtime logic → `features/runtime/` (runtime-status, runtime-command, runtime-types)
  - 2v-2: Extract session logic → `session/` (intake-gates, profile-resolution, settings-delta)
  - 2v-3: Extract admin logic → `features/admin/` (bootstrap, diagnostics, config-manager)
- Each sub-commit must pass `npx tsc --noEmit` before proceeding
- If any sub-commit breaks the build, `git revert` that sub-commit and investigate

**Rollback strategy:**
- Each commit is independently revertible via `git revert <commit-sha>`
- If Phase 2 fails at any point, revert the failing commit and all subsequent commits
- Pre-phase checkpoint: `git tag pre-phase-2` before starting

### Phase 3: Contract Boundary Establishment

**Goal:** Eliminate all upward imports (both type-only AND runtime function imports).

**Step 1: Fix runtime function imports (the ones Phase 2 doesn't address)**
- `features/runtime-entry/settings.ts` imports `buildHmSettingDashboardProof` from `tools/hivefiver-setting/` → move this function to `features/admin/config-manager.ts` (the feature, not the tool)
- `plugin/input-helpers.ts` imports `ContractStore` from `features/agent-work-contract/` → import from `features/contract/` (new location after Phase 2)
- `plugin/context-renderer.builder.ts` imports from `features/agent-work-contract/schema/` → import from `features/contract/schema/` (new location)
- `hooks/event-handler.ts` imports `ContractStore` directly → import through `features/contract/` manager interface

**Step 2: Move tool arg types to feature contracts**
- `tools/trajectory/types.ts` → `features/trajectory/contracts.ts`
- `tools/task/types.ts` → `features/workflow/contracts.ts`
- `tools/handoff/types.ts` → `features/handoff/contracts.ts`
- `tools/doc/types.ts` → `features/doc-intelligence/contracts.ts`
- `tools/runtime/types.ts` → `features/runtime/contracts.ts`
- Update all tool files to import from feature contracts

**Step 3: Create registry functions**
- Create `src/plugin/tool-registry.ts` with `createToolRegistry()` — assembles all tools from their new locations
- Create `src/plugin/hook-registry.ts` with `createHookRegistry()` — assembles all hooks from their new locations
- Update `plugin/index.ts` to use registries instead of direct imports

**Step 4: Fix reverse dependencies**
- `shared/logging.ts` → `hooks/sdk-context.ts` reverse dependency → move SDK context initialization to `shared/sdk-adapter.ts` (stdlib-only, no hook imports)
- Replace all barrel `export * from` with explicit named exports

**Gate:** `npx tsc --noEmit` passes with zero upward imports verified by `grep -rn "from.*tools/" src/features/`

### Phase 4: Factory Pattern Adoption

**Goal:** All tools, hooks, and managers use `createXXX()` factory pattern.

- Convert all tool definitions to `createXXXTool()` factories
- Convert all hook handlers to `createXXXHook()` factories
- Create `Managers` type as interface boundary between layers
- Add `safeHook()` error isolation wrapper for all hooks
- Add `disposeCreatedHooks()` cleanup pattern

**Gate:** `npx tsc --noEmit` passes, `npm test` passes

### Phase 5: Agent File and Test Updates

**Goal:** Update all downstream references to moved modules and renamed tools.

- Update 14 agent files in `.opencode/agents/` to reference new tool names
- Update all test file import paths to match new module locations
- Move test files alongside their source files (co-locate `*.test.ts` with `*.ts`)
- Update `AGENTS.md` tool count and layer table
- Update skill files that reference old tool/module names
- Update `.hivemind/activity/` references if needed (documentation only)

**Gate:** `npx tsc --noEmit` passes, `npm test` passes, plugin loads in OpenCode

### Phase 6: Package Splitting (Optional)

**Goal:** Separate core from optional add-ons for npm distribution.

- Core package: trajectory, task, handoff, contract, journal, runtime tools + hooks
- Docs add-on: doc tool + intelligence/doc/ + remark dependency
- Admin add-on: init, doctor, config tools + @json-render/ink dependencies
- Use `peerDependencies` for optional features to avoid package fragmentation

**Gate:** All 3 packages build independently, integration tests pass across package boundaries

---

## 10. Trade-off Analysis

### Decision 1: Merge agent-work tools into single `hivemind_contract` tool

**Context:** Two tools (`hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`) operate on one authority surface.

**Options:**
- A: Keep two separate tools (current state)
- B: Merge into single `hivemind_contract` with create/update/export actions
- C: Keep two tools but rename to `hivemind_contract_create` + `hivemind_contract_export`

**Decision:** C (revised from B based on skeptic review)

**Rationale:** The skeptic correctly identified that merging create/update (write actions) with export (read action) creates a god-tool with mixed read/write concerns. More critically, the export action has a fundamentally different schema and purpose. Keeping them as two tools preserves independent context trimming (if `hivemind_contract_export` is trimmed, agents still have `hivemind_contract_create`), maintains the CQRS separation (write vs read), and avoids a switch-statement execute function. The rename to `hivemind_contract_*` prefix maintains the single-authority naming convention without the god-tool cost.

**Trade-off:** Public inventory stays at 12 tools instead of 11. Mitigated by consistent naming prefix that signals they belong to the same authority.

**Reversibility:** High — rename is a find-and-replace across agent files and tool registry.

**Downstream impact:** 14 agent files need tool name updates. Phase 5 covers this.

### Decision 2: Move tool arg types from tools/ to features/

**Context:** 6 feature files import types from `tools/*/types.ts` — upward dependency.

**Options:**
- A: Keep types in tools/ (current state — type-only imports, technically safe)
- B: Move types to features/ as contracts (feature owns its interface)
- C: Move shared types to shared/ (cross-feature primitives)

**Decision:** B

**Rationale:** The feature is the authority on what it accepts and returns. Tool arg types are feature contracts, not tool concerns. Moving them eliminates the upward dependency entirely rather than just tolerating it.

**Trade-off:** Tool files lose their self-contained type definitions. Mitigated by importing from `../features/xxx/contracts.ts` — still a clean import path.

**Reversibility:** High — move types back is a find-and-replace operation.

**Skeptic note addressed:** This decision only addresses type-only upward imports. Runtime function imports (e.g., `settings.ts` → `buildHmSettingDashboardProof`) are addressed separately in Phase 3 Step 1 — they require moving the function to the feature layer, not just the types.

### Decision 3: Delete dead code before restructuring

**Context:** 14 files with zero external consumers, 2 deprecated files, 4 dead subdirectories.

**Options:**
- A: Move dead code to ideal locations (preserve for potential future use)
- B: Delete dead code entirely (clean slate for restructuring)

**Decision:** B

**Rationale:** Dead code is cognitive debt. If it's needed later, git history preserves it. Moving dead code to new locations creates the illusion of value where none exists.

**Trade-off:** Loses placeholder implementations for init/doctor. Mitigated by documenting the intended functionality in the admin feature module.

**Reversibility:** High — `git revert` or cherry-pick from history.

### Decision 4: Group hooks by event type, not by feature

**Context:** Current hooks are scattered across `hooks/` root with no grouping.

**Options:**
- A: Keep flat structure (current state)
- B: Group by event type (session/, chat/, tool/, compaction/, system/)
- C: Group by feature (trajectory-hooks/, workflow-hooks/, etc.)

**Decision:** B

**Rationale:** Hooks respond to OpenCode lifecycle events, not HiveMind features. A session lifecycle hook touches trajectory, workflow, and recovery — it doesn't belong to any single feature. Grouping by event type makes the runtime lifecycle map obvious from directory structure alone.

**Trade-off:** Feature-related hooks are spread across multiple directories. Mitigated by the hook registry — all hooks for a capability are discoverable through one file.

**Reversibility:** Medium — requires moving files and updating imports.

**Skeptic note on hook alias registry:** The skeptic correctly identified that the hook alias registry solves a hypothetical problem (SDK drift) with real complexity. The registry is demoted from Phase 3 to "optional future work." Instead of a full alias registry, we use explicit named exports from `plugin/hook-registry.ts` with comments documenting the OpenCode hook name for each capability. If OpenCode renames hooks in the future, one file changes — the registry — but we don't build the fallback mechanism until there's evidence it's needed.

### Decision 5: Merge sdk-supervisor into features/runtime

**Context:** sdk-supervisor has 3 active files (health, instance-registry, runtime-status) and 2 dead files.

**Options:**
- A: Keep as separate layer (current state)
- B: Merge into features/runtime/

**Decision:** B

**Rationale:** sdk-supervisor is not a layer — it's a feature. It builds runtime status snapshots and health summaries. It has no consumers outside the runtime tool chain. Keeping it as a separate layer creates an artificial boundary where none exists.

**Trade-off:** Loses the "supervisor" naming which implies authority. Mitigated by clear function naming (`buildRuntimeStatusSnapshot`, `summarizeSupervisorHealth`).

**Reversibility:** Medium — extract back to separate directory is straightforward.

### Decision 6: Single package with optional peer dependencies

**Context:** Current single npm package includes remark, ink, json-render dependencies that not all consumers need.

**Options:**
- A: Single package (current state)
- B: Core + docs add-on + admin add-on (3 separate npm packages)
- C: Single package with optional peer dependencies + dynamic imports

**Decision:** C (revised from B based on skeptic review)

**Rationale:** The skeptic correctly identified that ~700KB of optional dependency weight is negligible for a plugin framework whose consumers already install OpenCode. The maintenance cost of 3 packages (3 package.json files, 3 version numbers, 3 publish workflows, cross-package type sharing) far exceeds the benefit. Instead, use `peerDependencies` for remark and ink/json-render, with dynamic `import()` for optional features. Consumers who don't need doc intelligence simply don't install remark — the code gracefully degrades.

**Trade-off:** Slightly larger default install for consumers who don't need optional features. Mitigated by dynamic imports — optional code is never loaded unless the feature is used.

**Reversibility:** High — splitting into separate packages later is straightforward if dependency weight becomes a real concern.

---

## Appendix: What Changed from Previous Proposal (2026-03-31)

| Previous Decision | New Decision | Reason for Change |
|------------------|-------------|-------------------|
| Keep `hivemind_hm_init` and `hivemind_hm_doctor` as "remove from stable" | Move to `tools/admin/` as optional add-on | Skeptic correctly noted they're intentional phased rollouts — don't delete, relocate to optional package |
| Split event-tracker into event-sink/event-rendering/event-classification | Merge into single `features/journal/` with internal submodules | Skeptic correctly identified that the current `classifier/`, `parser/`, `writers/` subdirectories already provide logical separation |
| Keep `hivefiver-setting` as single tool with mode flag | Split into `tools/admin/config-tool.ts` | The upward dependency violations (4 layers) are the real issue — splitting isolates the config surface from dashboard rendering |
| Extract agent-work tools to `src/tools/contract/` | Merge into single `hivemind_contract` tool in `tools/contract/` | Two tools on one authority surface is redundant — merge the public surface |
| Tier 2 probationary hook for `chat.message` | Keep as required core hook | Evidence shows it performs real work (turn snapshot reset, degraded-mode toast) — not probationary |
| Decompose runtime-entry into 4 sub-modules | Split across `features/runtime/`, `session/`, `features/admin/` | Runtime-entry is inherently cross-cutting — don't create artificial boundaries, instead distribute to natural homes |
| Merge agent-work tools into one | Keep two tools with `hivemind_contract_*` prefix | Skeptic correctly identified mixed read/write concerns and independent trimming value |
| 3-package npm split | Single package with peerDependencies + dynamic imports | Skeptic correctly identified maintenance cost exceeds ~700KB dependency savings |
| Hook alias registry with fallbacks | Explicit named exports, no fallback mechanism | Skeptic correctly identified YAGNI — no evidence of OpenCode hook renames |
