# Ideal Architecture Design — HiveMind Plugin

**Date:** 2026-04-01
**Author:** Architect
**Status:** proposed
**Evidence Base:** 11 investigation reports, 2 fresh research studies, ~267 files analyzed

---

## 1. Current State Assessment

The HiveMind plugin suffers from a **layer trust collapse**: the documented architecture (7 layers, strict CQRS, tool→feature→core delegation) describes an ideal that the codebase never fully achieved. The reality is 12 tools (not 7), 6 upward type-only imports from features into tools, a 1,121-line god-tool (`hivefiver-setting`) that reaches across 4 layers, 3 no-op stubs (`addEvent`, `addDiagnostic`, `maybeExecuteNlFirstRuntimeDispatch`) that silently swallow data, 14 dead files in the infrastructure layers, entire modules unwired (intelligence, governance, delegation, cli), agent-work contract tools living in the features layer instead of tools, and a plugin assembly that mixes inline handlers with factory functions without a registry pattern. The canonical pattern (tool→feature→core) works correctly for 8 of 12 tools, proving the design intent is sound — the violations are concentrated in settings, agent-work, and the event-writing path. The system is not broken; it is **incomplete** — designed but never enforced.

---

## 2. Ideal Layer Architecture

### Target Directory Structure

```
src/
├── plugin/                          # LAYER 0: Plugin entry + assembly
│   ├── opencode-plugin.ts           # Entry point (slim — delegates to registry + hook-composer)
│   ├── tool-registry.ts             # Central tool assembly (createToolRegistry)
│   ├── hook-composer.ts             # Hook assembly (createHooks)
│   ├── index.ts                     # Barrel export
│   ├── messages-transform-adapter.ts
│   ├── compaction-adapter.ts
│   ├── context-renderer/            # Context packet rendering (5 files)
│   ├── skill-exposure-map.ts
│   ├── skill-focus-renderer.ts
│   ├── runtime-snapshot.ts
│   ├── runtime-prompt.ts
│   ├── system-transform.ts
│   ├── messages-transform.ts
│   ├── synthetic-parts.ts
│   ├── injection-store.ts
│   ├── input-helpers.ts
│   ├── route-hint.ts
│   ├── evidence-reporter.ts
│   └── sdk-context.ts              # MOVED from hooks/ (owns SDK references)
│
├── hooks/                           # LAYER 1: Runtime interception (read-side)
│   ├── index.ts                     # Barrel
│   ├── event-handler.ts             # session.* lifecycle events
│   ├── tool-execution-handler.ts    # tool.execute.after
│   ├── text-complete-handler.ts     # text.complete (turn journaling)
│   ├── compaction-handler.ts        # session.compacting (journal)
│   ├── chat-message-handler.ts      # chat.message
│   ├── permission-handler.ts        # permission.ask (extracted from inline)
│   ├── shell-env-handler.ts         # shell.env (extracted from inline)
│   ├── command-context-handler.ts   # command.execute.before (extracted from inline)
│   ├── start-work/                  # Start-work routing
│   │   ├── index.ts
│   │   ├── start-work-router.ts
│   │   └── start-work-router-helpers.ts
│   ├── runtime-loader/              # Tool governance + runtime stage
│   │   ├── index.ts
│   │   ├── tool-governance.ts
│   │   └── runtime-stage.ts
│   └── auto-slash-command/          # Auto command plan
│       ├── index.ts
│       ├── auto-slash-command.ts
│       └── auto-slash-command-types.ts
│
├── tools/                           # LAYER 2: Agent-facing tool surfaces (write-side)
│   ├── index.ts                     # Tool barrel + agentToolCatalog
│   ├── trajectory/                  # hivemind_trajectory
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── task/                        # hivemind_task
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── handoff/                     # hivemind_handoff
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── runtime/                     # hivemind_runtime_status + hivemind_runtime_command
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── doc/                         # hivemind_doc
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── journal/                     # hivemind_journal (MOVED from hivemind-journal.ts)
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── contract/                    # hivemind_contract (NEW — merged from agent-work-contract/tools/)
│   │   ├── index.ts
│   │   ├── tools.ts                 # create + update + export actions
│   │   └── types.ts
│   ├── hm-init/                     # hivemind_hm_init (RENAMED from hivefiver-init)
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── hm-doctor/                   # hivemind_hm_doctor (RENAMED from hivefiver-doctor)
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   └── hm-config/                   # hivemind_hm_config (RENAMED + SPLIT from hivefiver-setting)
│       ├── index.ts
│       ├── tools.ts                 # Config read/propose only
│       └── types.ts
│
├── features/                        # LAYER 3: Domain logic (self-contained modules)
│   ├── trajectory/
│   │   ├── index.ts
│   │   └── trajectory.ts
│   ├── workflow/
│   │   ├── index.ts
│   │   └── task.ts
│   ├── handoff/
│   │   ├── index.ts
│   │   └── handoff.ts
│   ├── doc-intelligence/
│   │   ├── index.ts
│   │   └── doc.ts
│   ├── agent-work-contract/         # Engine + schema ONLY (tools extracted to tools/contract/)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── schema/
│   │   ├── engine/
│   │   └── hooks/
│   ├── event-tracker/               # DECOMPOSED (see Section 5)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── paths.ts
│   │   ├── consolidated-writer.ts   # Session JSON writer
│   │   ├── markdown-writer.ts       # Events markdown writer
│   │   └── session-structure.ts
│   ├── session-journal/
│   │   ├── index.ts
│   │   ├── session-resolver.ts
│   │   ├── hierarchy-writer.ts
│   │   └── error-log-writer.ts
│   ├── session-entry/
│   │   └── (unchanged — 13 files)
│   ├── runtime-entry/               # DECOMPOSED (settings extracted)
│   │   └── (minus settings-dashboard, settings-render, settings-spec-builder)
│   ├── runtime-observability/
│   │   └── (unchanged — 3 files)
│   └── runtime-admin/               # NEW — extracted from hivefiver-setting
│       ├── index.ts
│       ├── dashboard.ts             # Dashboard proof builder
│       ├── render.ts                # TUI rendering
│       ├── spec-builder.ts          # json-render spec
│       └── i18n/
│
├── core/                            # LAYER 4: State authority (file I/O + schemas)
│   ├── trajectory/
│   └── workflow-management/
│
├── intelligence/                    # LAYER 4: Read-only parsers (doc, future: code)
│   └── doc/
│
├── delegation/                      # LAYER 3.5: Handoff CRUD (between features and core)
│   ├── delegation-packet.ts
│   ├── delegation-record.schema.ts
│   ├── delegation-store.ts
│   └── index.ts
│
├── control-plane/                   # LAYER 3.5: CLI primitive registry
│   └── (unchanged — 6 files)
│
├── sdk-supervisor/                  # LAYER 4: Runtime health + status
│   └── (minus session-inspection.ts, diagnostic-log.ts — dead code removed)
│
├── schema-kernel/                   # LAYER 5: Contract schemas (leaf)
│   └── (minus default-agent-templates.ts — dead code removed)
│
├── recovery/                        # LAYER 4: State repair
│   └── (unchanged — 3 files)
│
├── commands/                        # LAYER 3.5: Slash command bundles
│   └── slash-command/
│
├── context/                         # LAYER 1.5: Prompt compilation
│   └── prompt-packet/
│
├── shared/                          # LAYER 6: Cross-cutting utilities (LEAF — imports nothing)
│   ├── index.ts
│   ├── paths.ts
│   ├── tool-response.ts
│   ├── tool-helpers.ts
│   ├── logging.ts                   # FIXED — no longer imports hooks/sdk-context.ts
│   ├── pressure-contract.ts
│   ├── opencode-knowledge.ts
│   ├── opencode-skill-registry.ts
│   ├── opencode-agent-registry.ts
│   ├── tiered-injection.ts
│   ├── skill-injection-loader.ts
│   ├── lifecycle-spine.ts
│   ├── entry-kernel-state.ts
│   ├── bootstrap-profile.ts
│   ├── config-groups.ts
│   ├── evidence-lane.ts
│   ├── keyword-matcher.ts
│   ├── errors.ts
│   ├── intake-record/
│   ├── contracts/
│   ├── runtime-attachment.ts        # Re-export from features/runtime-entry/attachment
│   └── event-sink.ts                # NEW — EventSink interface (replaces no-op stubs)
│
├── governance/                      # LAYER 4: Planning projections
│   └── (unchanged — 2 files, but WIRE it)
│
└── cli/                             # CLI entry points (not part of plugin runtime)
    └── (unchanged — 5 files, but WIRE it or delete)
```

### Layer Import Rules (Enforced)

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| `shared/` | Nothing (stdlib only) | Everything above |
| `schema-kernel/` | `shared/`, archive | `core/`, `features/`, `tools/`, `hooks/`, `plugin/` |
| `core/` | `shared/`, `schema-kernel/` | `features/`, `tools/`, `hooks/`, `plugin/` |
| `intelligence/` | `shared/`, `schema-kernel/` | `core/`, `features/`, `tools/`, `hooks/`, `plugin/` |
| `sdk-supervisor/` | `shared/`, `schema-kernel/`, `core/` | `features/`, `tools/`, `hooks/`, `plugin/` |
| `recovery/` | `shared/`, `core/` | `features/`, `tools/`, `hooks/`, `plugin/` |
| `delegation/` | `shared/`, `schema-kernel/` | `core/`, `features/`, `tools/`, `hooks/`, `plugin/` |
| `control-plane/` | `shared/`, `schema-kernel/`, `commands/` | `features/`, `tools/`, `hooks/`, `plugin/` |
| `commands/` | `shared/`, `control-plane/`, `schema-kernel/` | `features/`, `tools/`, `hooks/`, `plugin/` |
| `context/` | `shared/`, `schema-kernel/` | `core/`, `features/`, `tools/`, `hooks/`, `plugin/` |
| `features/` | `shared/`, `core/`, `intelligence/`, `delegation/`, `control-plane/`, `commands/`, `schema-kernel/`, `sdk-supervisor/`, `recovery/`, `context/` | `tools/`, `hooks/`, `plugin/` |
| `tools/` | `shared/`, `features/` (one delegation per tool) | `core/`, `hooks/`, `plugin/`, `delegation/`, `control-plane/`, `sdk-supervisor/` |
| `hooks/` | `shared/`, `features/`, `core/`, `recovery/` | `tools/`, `plugin/`, `delegation/`, `control-plane/` |
| `plugin/` | `shared/`, `hooks/`, `tools/`, `features/`, `context/` | `core/` (indirect via features) |

**Critical rule:** `shared/` MUST NOT import from `hooks/`. The current `shared/logging.ts → hooks/sdk-context.ts` violation must be fixed by moving `sdk-context.ts` to `plugin/`.

---

## 3. Module Classification Matrix

| Module | Nature | Owner | Lifecycle | CRUD Group |
|--------|--------|-------|-----------|------------|
| `hivemind_trajectory` | Agent-deterministic tool | Agent (explicit call) | Per-session, per-turn | Deterministic |
| `hivemind_task` | Agent-deterministic tool | Agent (explicit call) | Per-workflow | Deterministic |
| `hivemind_handoff` | Agent-deterministic tool | Agent (explicit call) | Per-delegation | Deterministic |
| `hivemind_doc` | Agent-deterministic tool | Agent (explicit call) | On-demand | Deterministic |
| `hivemind_runtime_status` | Agent-deterministic tool | Agent (explicit call) | On-demand | Deterministic |
| `hivemind_runtime_command` | Agent-deterministic tool | Agent (explicit call) | Per-command | Deterministic |
| `hivemind_contract` | Agent-deterministic tool | Agent (explicit call) | Per-contract | Deterministic |
| `hivemind_journal` | Auto-appended writer | Hook (text.complete, tool.after) | Per-turn, per-event | Auto-appended |
| `hivemind_hm_init` | Agent-deterministic tool | Agent (explicit call) | Bootstrap | Deterministic |
| `hivemind_hm_doctor` | Agent-deterministic tool | Agent (explicit call) | Diagnostics | Deterministic |
| `hivemind_hm_config` | Agent-deterministic tool | Agent (explicit call) | On-demand | Deterministic |
| `event-handler` | Hook-subscribed feature | OpenCode event system | Per-event | Auto-appended |
| `tool-execution-handler` | Hook-subscribed feature | OpenCode hook system | Per-tool-call | Auto-appended |
| `text-complete-handler` | Hook-subscribed feature | OpenCode hook system | Per-turn | Auto-appended |
| `compaction-handler` | Hook-subscribed feature | OpenCode hook system | Per-compaction | Auto-appended |
| `chat-message-handler` | Hook-subscribed feature | OpenCode hook system | Per-message | Auto-appended |
| `agent-work-contract/engine` | Programmatic store | Features + tools | CRUD lifecycle | Hybrid |
| `event-tracker/consolidated-writer` | Programmatic store | Hooks + tools | Per-event | Auto-appended |
| `event-tracker/markdown-writer` | Programmatic renderer | Hooks + tools | Per-event | Auto-appended |
| `delegation/delegation-store` | Programmatic store | Features (handoff) | CRUD lifecycle | Hybrid |
| `core/trajectory/store` | Programmatic store | Features (trajectory) | CRUD lifecycle | Deterministic |
| `core/workflow-management/task-lifecycle` | Programmatic store | Features (workflow) | CRUD lifecycle | Deterministic |
| `start-work-router` | Routing logic | Hook (messages.transform) | Per-turn | Hybrid |
| `control-plane/registry` | Static registry | Plugin init | Plugin load | Deterministic |
| `sdk-supervisor/runtime-status` | Query function | Tools (runtime_status) | On-demand | Deterministic |

---

## 4. Tool Redesign

### Final Tool Inventory (11 tools)

| # | Tool ID | Actions | File | Change |
|---|---------|---------|------|--------|
| 1 | `hivemind_trajectory` | inspect, traverse, attach, checkpoint, event, close | `tools/trajectory/tools.ts` | Keep (canonical) |
| 2 | `hivemind_task` | create, list, get, activate, rotate, verify, complete | `tools/task/tools.ts` | Keep (canonical) |
| 3 | `hivemind_handoff` | create, read, list, update, validate, close | `tools/handoff/tools.ts` | Keep (canonical) |
| 4 | `hivemind_doc` | skim, skim_directory, read, chunk, search | `tools/doc/tools.ts` | Keep (canonical) |
| 5 | `hivemind_runtime_status` | (no args — pure inspection) | `tools/runtime/tools.ts` | Keep (canonical) |
| 6 | `hivemind_runtime_command` | command + 10 optional args | `tools/runtime/tools.ts` | Keep (canonical) |
| 7 | `hivemind_contract` | create, update, export | `tools/contract/tools.ts` | **NEW** — merged from agent-work-contract/tools/ |
| 8 | `hivemind_journal` | sessionId + eventType + payload + timestamp | `tools/journal/tools.ts` | **MOVED** from `hivemind-journal.ts` to subdirectory |
| 9 | `hivemind_hm_init` | mode (greenfield/brownfield/auto), force | `tools/hm-init/tools.ts` | **RENAMED** from hivefiver-init |
| 10 | `hivemind_hm_doctor` | scope (all/skills/agents/config/paths), fix | `tools/hm-doctor/tools.ts` | **RENAMED** from hivefiver-doctor |
| 11 | `hivemind_hm_config` | group, key, value, locale, renderMode | `tools/hm-config/tools.ts` | **RENAMED + SPLIT** from hivefiver-setting |

### Tools Killed/Merged

| Old Tool | Action | Rationale |
|----------|--------|-----------|
| `hivemind_agent_work_create_contract` | Merged into `hivemind_contract` | Two tools operating on one authority surface |
| `hivemind_agent_work_export_contract` | Merged into `hivemind_contract` | Same authority, same store |
| `classify-intent-tool` (unregistered) | Internal service only | Never registered, no public use case |
| `hivefiver-setting` (old name) | Renamed + split | Dashboard/TUI extracted to `features/runtime-admin/` |

### Tool Boundary Rules

1. **Every tool follows the 3-file pattern:** `index.ts` (barrel) + `tools.ts` (factory) + `types.ts` (types + pressure contracts)
2. **Every tool calls exactly ONE feature-layer `execute*Action` function** — no direct core/delegation/control-plane imports
3. **Every tool factory signature:** `createXxxTool(projectRoot: string) => ReturnType<typeof tool>`
4. **Pressure contracts:** Every action maps to a pressure contract from `shared/pressure-contract.ts`
5. **No tool exceeds 100 LOC** (tools.ts) — thin wrappers only

### hivefiver-setting Decomposition

Current: 7 files, 1,121 LOC, imports from 4 layers beyond features.

Decomposed into:
- `tools/hm-config/` (3 files, ~300 LOC) — config read/propose only, calls `features/runtime-entry/settings.ts`
- `features/runtime-admin/` (4 files, ~800 LOC) — dashboard proof, TUI rendering, json-render spec, i18n

The tool no longer imports from `sdk-supervisor/`, `control-plane/`, or `session-entry/`. It imports only from `features/runtime-entry/settings.ts` which aggregates the cross-layer dependencies internally.

---

## 5. Feature Redesign

### Feature Grouping Strategy

| Feature | Hook Dependency | Self-Sustaining? | Decomposition |
|---------|----------------|------------------|---------------|
| `trajectory` | No | Yes | Keep as-is (2 files, 179 LOC) |
| `workflow` | No | Yes | Keep as-is (2 files, 191 LOC) |
| `handoff` | No | Yes | Keep as-is (2 files, 272 LOC) |
| `doc-intelligence` | No | Yes | Keep as-is (2 files, 103 LOC) |
| `agent-work-contract` | Yes (hooks extract event packets) | Hybrid | Remove tools/ subdirectory; keep engine + schema + hooks |
| `event-tracker` | Yes (hooks call writers) | Hybrid | Remove dead classifier/parser/writers subdirectories |
| `session-journal` | Yes (hooks call resolver) | Hybrid | Keep as-is (3 files, 171 LOC) |
| `session-entry` | Yes (hooks call intake) | Hybrid | Keep as-is (13 files, 1,028 LOC) |
| `runtime-entry` | Yes (hooks + tools) | Hybrid | Remove settings-dashboard/render/spec-builder (→ runtime-admin) |
| `runtime-observability` | No | Yes | Keep as-is (3 files, 408 LOC) |
| `runtime-admin` (NEW) | No | Yes | Dashboard proof, TUI rendering, spec builder, i18n |

### event-tracker Decomposition

Current: 19 files, 2,584 LOC — includes dead classifier/, parser/, writers/ subdirectories.

Target:
```
features/event-tracker/
├── index.ts                    # Barrel
├── types.ts                    # Core types (kept — 380 LOC is acceptable with interface decomposition)
├── paths.ts                    # Path resolution (remove @deprecated functions)
├── consolidated-writer.ts      # Session JSON writer (FIX addEvent/addDiagnostic or remove)
├── markdown-writer.ts          # Events markdown writer
└── session-structure.ts        # Session structure utilities
```

**Dead code removed:**
- `classifier/` (4 files) — no external consumers
- `parser/` (7 files) — no external consumers
- `writers/` (3 files, except formatter.ts if used by markdown-writer)

**Decision on addEvent/addDiagnostic:** Either implement them properly (write to the correct V3 file paths) or remove them entirely and update all callers to use the markdown-writer or consolidated-writer directly. No no-op stubs.

### event-tracker God File Resolution

| File | Current LOC | Target LOC | Strategy |
|------|-------------|------------|----------|
| `types.ts` | 380 | ≤250 | Extract `SessionV3`, `IndexEntry`, `SynthesisInput`, `SessionTreeNode` to separate type files |
| `consolidated-writer.ts` | 442 | ≤300 | Extract counter logic to `counters.ts`, status logic to `status.ts` |
| `markdown-writer.ts` | 434 | ≤300 | Extract TOC generation to `toc.ts` |

---

## 6. Hook Redesign

### Hook Inventory (11 hooks — same count, reorganized)

| Hook | Handler | Current Location | Target Location | Change |
|------|---------|-----------------|-----------------|--------|
| `event` | `createEventHandler()` | hooks/event-handler.ts | hooks/event-handler.ts | Keep |
| `experimental.chat.system.transform` | `createTransformHandler()` | hooks/transform-handler.ts | hooks/transform-handler.ts | Keep |
| `chat.message` | `handleChatMessage()` | hooks/chat-message-handler.ts | hooks/chat-message-handler.ts | Keep |
| `permission.ask` | Inline in plugin | plugin/opencode-plugin.ts | hooks/permission-handler.ts | **Extract** |
| `tool.execute.before` | Inline in plugin | plugin/opencode-plugin.ts | hooks/tool-governance.ts | **Extract** |
| `shell.env` | Inline in plugin | plugin/opencode-plugin.ts | hooks/shell-env-handler.ts | **Extract** |
| `command.execute.before` | Inline in plugin | plugin/opencode-plugin.ts | hooks/command-context-handler.ts | **Extract** |
| `tool.execute.after` | `handleToolExecution()` | hooks/tool-execution-handler.ts | hooks/tool-execution-handler.ts | Keep |
| `experimental.text.complete` | `createTextCompleteHandler()` | hooks/text-complete-handler.ts | hooks/text-complete-handler.ts | Keep |
| `experimental.chat.messages.transform` | `createMessagesTransformHandler()` | plugin/messages-transform-adapter.ts | plugin/messages-transform-adapter.ts | Keep |
| `experimental.session.compacting` | Dual handlers | hooks/compaction-handler.ts | hooks/compaction-handler.ts | Keep |

### New Events to Subscribe

| Event | Purpose | Priority |
|-------|---------|----------|
| `session.error` | Error recovery + trajectory event | P1 |
| `session.idle` | Idle detection (currently handled via event catch-all but addEvent is no-op) | P2 |
| `permission.replied` | Audit permission decisions for governance | P3 |

### Inline Handler Extraction Rationale

The current plugin has 4 inline handlers (`permission.ask`, `tool.execute.before`, `shell.env`, `command.execute.before`) that mix business logic with plugin assembly. Each should become a named handler with a `createXxxHandler()` factory, following the oh-my-openagent pattern. This makes them:
- Testable independently
- Swappable via configuration
- Documentable with clear responsibilities

---

## 7. Plugin Assembly Redesign

### Current Problem

`opencode-plugin.ts` (257 LOC) mixes:
- Plugin initialization (8 side effects)
- Tool registration (12 inline factory calls)
- Hook wiring (4 inline handlers + 7 extracted handlers)
- Context management

### Target: Registry + Composer Pattern

```typescript
// src/plugin/opencode-plugin.ts (target: ≤150 LOC)
export const HiveMindPlugin: Plugin = async (input) => {
  const { directory } = input;

  // Phase 1: Initialize context
  initSdkContext(input);
  const turnSnapshot = createTurnSnapshotLoader(directory);

  // Phase 2: Compose hooks
  const hooks = createHooks({ directory, turnSnapshot });

  // Phase 3: Register tools
  const tools = createToolRegistry({ directory });

  // Phase 4: Side effects
  ensureAgentProjection(directory);
  initSkillInjection(directory);

  return { ...hooks, tool: tools };
};
```

### Central Tool Registry (`src/plugin/tool-registry.ts`)

```typescript
export function createToolRegistry(args: { directory: string }) {
  const d = args.directory;
  return {
    hivemind_runtime_status: createHivemindRuntimeStatusTool(d),
    hivemind_runtime_command: createHivemindRuntimeCommandTool(d),
    hivemind_contract: createContractTool(d),           // NEW merged tool
    hivemind_doc: createHivemindDocTool(d),
    hivemind_task: createTaskTool(d),
    hivemind_trajectory: createTrajectoryTool(d),
    hivemind_handoff: createHivemindHandoffTool(d),
    hivemind_journal: createHivemindJournalTool(d),     // NEW subdirectory
    hivemind_hm_init: createHivemindHmInitTool(d),
    hivemind_hm_doctor: createHivemindHmDoctorTool(d),
    hivemind_hm_config: createHivemindHmConfigTool(d),  // RENAMED
  };
}
```

### Hook Composer (`src/plugin/hook-composer.ts`)

```typescript
export function createHooks(args: HookComposerArgs) {
  const { directory, turnSnapshot } = args;
  return {
    event: createEventHandler(directory),
    'experimental.chat.system.transform': createTransformHandler({ directory }),
    'chat.message': handleChatMessage(directory),
    'permission.ask': createPermissionHandler(directory),
    'tool.execute.before': createToolBeforeHandler(directory),
    'shell.env': createShellEnvHandler(directory),
    'command.execute.before': createCommandContextHandler(directory, turnSnapshot),
    'tool.execute.after': handleToolExecution(directory),
    'experimental.text.complete': createTextCompleteHandler({ directory }),
    'experimental.chat.messages.transform': createMessagesTransformHandler({...}),
    'experimental.session.compacting': createCompactionHandler({...}),
  };
}
```

---

## 8. Layer Rules — Enforcement Strategy

### The 6 Upward Violations (features → tools)

| Current Import | Resolution |
|---------------|------------|
| `features/trajectory/trajectory.ts` → `tools/trajectory/types.js` | Move types to `features/trajectory/types.ts` or `shared/contracts/trajectory.ts` |
| `features/workflow/task.ts` → `tools/task/types.js` | Move types to `features/workflow/types.ts` or `shared/contracts/task.ts` |
| `features/handoff/handoff.ts` → `tools/handoff/types.js` | Move types to `features/handoff/types.ts` or `shared/contracts/handoff.ts` |
| `features/doc-intelligence/doc.ts` → `tools/doc/types.js` | Move types to `features/doc-intelligence/types.ts` |
| `features/runtime-observability/status.ts` → `tools/runtime/types.js` | Move types to `features/runtime-observability/types.ts` |
| `features/runtime-entry/settings.ts` → `tools/hivefiver-setting/index.js` | Break by extracting dashboard/spec/i18n to `features/runtime-admin/` |

### Resolution Pattern

Move tool arg types and pressure contracts into the feature's own `types.ts` file. The tool imports from the feature, never the reverse. Types that are truly shared (pressure contracts, tool response envelopes) live in `shared/contracts/`.

### The shared/logging.ts Violation

**Current:** `shared/logging.ts` imports `hooks/sdk-context.ts` to call `getClient()`.

**Fix:** Move `sdk-context.ts` from `hooks/` to `plugin/`. The SDK context is a plugin-level concern (initialized at plugin load, used by plugin-layer components). `shared/logging.ts` should import from `plugin/sdk-context.js`, not `hooks/sdk-context.js`.

**Alternative:** Extract a `shared/sdk-client-provider.ts` interface that `plugin/sdk-context.ts` implements. `shared/logging.ts` depends only on the interface, not the implementation.

---

## 9. Dead Code Plan

### Kill (14 files + 3 functions + 5 deprecated paths)

| File/Function | Evidence | Action |
|---------------|----------|--------|
| `sdk-supervisor/session-inspection.ts` | `@deprecated`, only test imports | DELETE |
| `sdk-supervisor/diagnostic-log.ts` | `@deprecated`, zero consumers | DELETE |
| `core/workflow-management/workflow-router.ts` | No external consumers, trivial function | DELETE |
| `core/workflow-management/continuity.ts` | No external consumers, different `workflow-continuity.ts` exists | DELETE |
| `intelligence/doc/doc-surface-router.ts` | No external consumers | DELETE |
| `schema-kernel/default-agent-templates.ts` | No external consumers | DELETE |
| `commands/index.ts` (top-level barrel) | No external consumers (consumers import from slash-command/ directly) | DELETE |
| `core/trajectory/trajectory-assessment.ts` | Exported but no external consumers | QUARANTINE (move to tests if needed) |
| `event-tracker/classifier/` (4 files) | No external imports | DELETE |
| `event-tracker/parser/` (7 files) | No external imports | DELETE |
| `event-tracker/writers/formatter.ts` | Check if used by markdown-writer; if not | DELETE |
| `event-tracker/writers/index-writer.ts` | No external consumers | DELETE |
| `event-tracker/writers/synthesizer.ts` | No external consumers | DELETE |
| `hooks/event-handler.ts:handleSessionIdleEvent()` | Exported but not wired | DELETE |
| `hooks/text-complete-handler.ts:handleTextComplete()` | Standalone handler, only factory is wired | DELETE (keep factory) |
| `hooks/compaction-handler.ts:handleCompaction()` | Standalone handler, only factory is wired | DELETE (keep factory) |
| `hooks/runtime-loader/runtime-stage.ts:resolveRuntimeLoadStage()` | No external consumers | DELETE |
| `hooks/workflow-integration/workflow-continuity.ts:buildWorkflowIntegrationState()` | No external consumers | DELETE |
| `hooks/auto-slash-command/auto-slash-command.ts:createAutoSlashCommandPlan()` | No external consumers outside barrel | QUARANTINE |
| `runtime-entry/nl-first-dispatch.ts:maybeExecuteNlFirstRuntimeDispatch()` | All branches return `shouldDispatch: false` | DELETE or implement |

### Revive (wire or confirm dead)

| Module | Current Status | Decision |
|--------|---------------|----------|
| `intelligence/` | Unwired from src/ | WIRE via `features/doc-intelligence/` (already does import it) |
| `governance/` | Unwired from src/ | WIRE via `features/runtime-entry/` or DELETE |
| `delegation/` | Unwired from src/ | WIRE via `features/handoff/` (already does import it) |
| `cli/` | Unwired from src/ | WIRE as CLI entry points or DELETE shims |

---

## 10. Factory/Registry Pattern Adoption

### From oh-my-openagent

| Pattern | Adoption | Impact |
|---------|----------|--------|
| `createToolRegistry()` | **Adopt** — central tool assembly in `plugin/tool-registry.ts` | Eliminates scattered registration, enables conditional tools |
| `createXXXTool()` factories | **Already in place** for 8/12 tools; extend to all | Consistency |
| `createHooks()` composition | **Adopt** — hook assembly in `plugin/hook-composer.ts` | Eliminates inline handlers |
| Layer hierarchy rules | **Adopt** — enforce with import rules table | Fixes 6 upward violations |
| Feature = self-contained module | **Already the intent**; enforce with boundaries | Fixes agent-work-tools-in-features |
| 200 LOC soft limit | **Adopt as 300 LOC** (project already uses 300) | Decompose 4 god files |

### What Does NOT Transfer

| Pattern | Why Not |
|---------|---------|
| Plugin-handlers config pipeline | HiveMind has simpler config; no 6-phase pipeline needed |
| Zod v4 schemas | HiveMind uses `tool.schema` (Zod re-export) correctly |
| 48 hooks | HiveMind needs ~11 hooks, not 48 |
| Manager class pattern | HiveMind uses functional stores, not classes — keep functional |
| `hidden` agents | No current use case |
| `steps` limits | No current use case |

---

## 11. Migration Strategy (High-Level Phases)

### Phase 0: Preparation (no code changes)

- Validate type-check passes: `npx tsc --noEmit`
- Create feature branch `refactor/ideal-architecture`
- Document all breaking changes in MIGRATION.md

### Phase 1: Dead Code Removal (safe, no behavior change)

- Delete 14 dead files
- Delete 5 dead exported functions
- Remove deprecated paths functions
- Remove no-op `addEvent()`/`addDiagnostic()` stubs (or implement them)
- Verify `npx tsc --noEmit` passes
- Verify `npm test` passes

### Phase 2: Boundary Normalization (structural moves)

- Move `sdk-context.ts` from `hooks/` to `plugin/`
- Fix `shared/logging.ts` import
- Move 6 upward type imports to feature-local types
- Extract agent-work tools to `tools/contract/`
- Rename `hivefiver-*` → `hm-*` directories
- Extract journal to `tools/journal/` subdirectory
- Verify type-check + tests

### Phase 3: hivefiver-setting Decomposition

- Extract dashboard/TUI/spec/i18n to `features/runtime-admin/`
- Rename tool to `hivemind_hm_config`
- Simplify tool to config-only (≤300 LOC)
- Verify type-check + tests

### Phase 4: Plugin Assembly Refactor

- Create `plugin/tool-registry.ts` (createToolRegistry)
- Create `plugin/hook-composer.ts` (createHooks)
- Extract 4 inline handlers to named hook files
- Slim `opencode-plugin.ts` to ≤150 LOC
- Verify type-check + tests

### Phase 5: Event Tracker Decomposition

- Delete dead classifier/parser/writers subdirectories
- Decompose god files (types, consolidated-writer, markdown-writer)
- Fix or remove addEvent/addDiagnostic
- Verify type-check + tests

### Phase 6: Verification Gate

- `npx tsc --noEmit` — zero errors
- `npm test` — all tests pass
- Manual verification of all 11 tools via runtime
- Update AGENTS.md with correct tool count (11, not 7)

---

## Verification Criteria (for hiveq)

1. **Layer rule compliance:** Zero imports from `tools/` in any `features/` file
2. **Tool count:** Exactly 11 tools registered in plugin
3. **No god files:** No source file exceeds 300 LOC (non-test)
4. **No dead code:** Zero files with zero external consumers
5. **No no-op stubs:** Every exported function has at least one non-test caller
6. **Type-check clean:** `npx tsc --noEmit` passes
7. **Test suite green:** `npm test` passes
8. **shared/ is leaf:** `shared/logging.ts` does not import from `hooks/`
9. **Plugin ≤150 LOC:** `opencode-plugin.ts` is slim assembly only
10. **AGENTS.md accuracy:** Tool count, layer descriptions match reality

---

## Trade-off Analysis Summary

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| Runtime status + command | Keep separate | Larger inventory, prevents god-tool |
| Agent-work tools location | Extract to tools/ | More files, cleaner boundaries |
| Hook count | Keep 11 (extract inlines) | Short-term complexity, long-term testability |
| EventSink contract | Strict, no no-ops | Forces immediate implementation, removes silent loss |
| Package split | Core + add-ons (deferred) | Simpler initial migration, modular later |
| Placeholder tools | Keep (renamed) | API continuity, still incomplete |
| Layer enforcement | Convention + type-check | Not tooling-enforced, relies on discipline |
| oh-my-openagent registry | Adopt selectively | Registry yes, managers no, config pipeline no |
