HIVEMIND - THE AGENTS HARNESS+ META DEV KIT FRAMEWORK

## Philosophies

True agents workflows = mindful, intelligent, adaptive agents that truly aid human-being;  autonomy as needed while maintaining multi-dimensional expertise regardless of context rots, maintaining comprehensions and expert-advisor among the complex shifting of user’s cognitive layers and intents.

## Agents and meta concepts harness - as agents’ HIVE = colaboration and MIND = share one hierarchical and relational neurons and mindset

We start with the OpenCode as open source and to make everything more easily grabbed, first let’s make the harness engineering that we are approaching into 3 tiers:

```markdown
## Tier 1

The “Hard Harness”, requires a setup that matches the full complexity of Hivemind‑only. It involves installing additional npm packages, employing deterministic and programmatic methods, and meeting the requirements of the OpenCode SDK. 

## Tier 2

The “Opencode‑Dependable” setup, includes tools, plugins, hooks, commands, agents, sub‑agents, rules, prompts, workflows, permissions, shell commands, and other elements that work only under Opencode. Although they share naming conventions with other agentic coding platforms, they are configured and chained in a way that optimizes autonomous, multi‑role agent workflows.

## Tier 3 

The “SKILLS” tier, is a flexible, fail‑safe harness that enhances but does not disrupt or pollute the system; it provides depth, breadth, and coverage for diverse use cases and projects across multiple development industries in any context.

```

- Yet as said above just the “soft” Tier - 3 (those of OpenCode) commands, agents, sub-agents, permissions, config, tools, skills etc → can bring multiple combination of build for users

## However to “manipulate” and harness the workflows become more state-of-the-art - we need tier 1 and tier 2 hence our “architecture and engineering” shapes here:

for the part below, I would not discuss deeply about architecture but more like the meta concept harness as “actors”, as runtime interception and steering. There are multiple schools of these, like the interception and states, the the deterministic and programatic executions, and to top them with tools loops and tools and engines etc making ai agents as powerful as ever. However we top them up into these

1. Hierarchical + relational  / or domain-specific of knowing own boundaries + granularity control: these architecture concepts  are built around:
    1. Tools  (with or without engines) as utilities → giving agents upper hand at certain tasks that the mix of above without these can block, degrade the “intelligence”, “efficiency” of agents as for context confusion, lack of accuracy, → the doc-intelligence tools 

ETC

===

Architecture-proposal-1

```markdown
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

```

Architecture-proposal-2

```markdown
# Architecture Proposal — HiveMind src/ Restructure (REVISED) — 2026-04-01

> **Revision note:** This proposal addresses all 12 conditions from the code-skeptic review (2026-04-01). Changes from the original are marked with **[REVISED]**. The original proposal remains at `architecture-proposal-2026-04-01.md`.

---

## Condition Response Matrix

### Critical Findings (C1-C6)

| Condition | Status | Summary |
|-----------|--------|---------|
| **C1**: Phase 2v not safely decomposable | **ACCEPTED** | Defer runtime-entry split to separate PR. Move as-is first. |
| **C2**: Phase 3 Step 2 not atomic | **ACCEPTED** | One tool's types at a time, type-check between each. |
| **C3**: shared/logging.ts → hooks/sdk-context.ts fix wrong | **ACCEPTED** | Move logging.ts to plugin/ where SDK context is available. |
| **C4**: CQRS for trajectory ledger unnecessary | **ACCEPTED** | Remove from CQRS — writes are sequential, not concurrent. |
| **C5**: Circular dependency not flagged as cycle | **ACCEPTED** | Single atomic operation: move function + update BOTH import sites. |
| **C6**: Dependency graph is fictional | **ACCEPTED** | Show CURRENT state with violations alongside TARGET state. |

### Warnings (W1-W7)

| Condition | Status | Summary |
|-----------|--------|---------|
| **W1**: Factory pattern over-engineering | **ACCEPTED** | Drop Managers interface. Keep factory pattern only for tools. |
| **W2**: session/ as top-level breaks layer model | **ACCEPTED** | Keep as features/session/ — don't create new top-level. |
| **W3**: Dead code deletion may remove dynamic code | **ACCEPTED** | Add verification step before deletion. |
| **W4**: Tool priority ordering naming confusing | **ACCEPTED** | Rename to TOOL_TRIM_ORDER. |
| **W5**: No test strategy | **ACCEPTED** | Add Phase 0.5 for test stabilization. |
| **W6**: Self-contradiction on barrel exports | **ACCEPTED** | Drop "no barrel" claim. Use explicit named exports in index.ts. |
| **W7**: delegation/ is an island, not a leaf | **ACCEPTED** | Wire delegation before treating as leaf module. |

### Recommended Revisions (R1-R10)

| Condition | Status | Summary |
|-----------|--------|---------|
| **R1**: Add Phase 0.5 | **ACCEPTED** | Added as Phase 0.5 — Test Stabilization. |
| **R2**: Reduce Phase 2 from 22 to 12 commits | **ACCEPTED** | Combined to 12 atomic commits. |
| **R3**: Defer runtime-entry split | **ACCEPTED** | Moved to separate PR. |
| **R4**: Fix dependency graph | **ACCEPTED** | Current state + violations + resolution path shown. |
| **R5**: Add "What NOT to Change" | **ACCEPTED** | Added as §11. |
| **R6**: Specify Managers interface or remove | **ACCEPTED** | Removed — not adopting Managers interface. |
| **R7**: Add time estimates | **ACCEPTED** | Added to each phase. |
| **R8**: Fix Phase 0 grep command | **ACCEPTED** | Corrected pattern. |
| **R9**: Reconcile tool catalog inconsistency | **ACCEPTED** | Updated to 8 public tools (two contract tools). |
| **R10**: Remove hook alias registry code block | **ACCEPTED** | Removed from §7. |

---

## 1. Executive Summary

- **One authority, one contract.** Every domain (trajectory, task, handoff, contract, journal, doc, runtime) gets exactly one feature module that owns its state, one tool surface that exposes it, and zero cross-domain imports. The current codebase has 6 upward imports and 3 cross-layer violations — all traceable to a missing "contracts" boundary between tool args and feature implementations.
- **Lifecycle-driven module placement.** Modules are grouped by which lifecycle events they respond to, not by file count. The 7 lifecycle events (plugin load, session create, message turn, tool execution, session compact, session idle, session delete) map to exactly 5 module families: Assembly, Journal, State, Routing, and Admin.
- **CQRS where writes genuinely collide.** The journal and contract store have multiple concurrent writers — they get CQRS boundaries. The trajectory ledger is written sequentially (tools + event handler in single process) — it does NOT need CQRS. **[REVISED — per C4]**
- **Factory composition with explicit named exports.** Every tool uses `createXXX()` factory functions. A central `createPlugin()` function assembles them. Barrel `index.ts` files use explicit named exports (not `export * from`) for traceability. **[REVISED — per W6]**
- **npm modularity by dependency weight.** The core package ships only what every consumer needs: trajectory, task, handoff, contract, journal, and runtime tools. Doc intelligence (remark dependency), admin surfaces (ink/json-render), and i18n ship as optional add-ons via `peerDependencies`.
- **Dead code removal before restructuring.** 14 files with zero external consumers, 2 deprecated files, and 4 potentially dead subdirectories are eliminated from the target architecture. They don't get moved — they get deleted.
- **Hook alias registry deferred.** Instead of building a full fallback alias registry for a hypothetical SDK drift problem, we use explicit named exports with comments documenting the OpenCode hook name for each capability. **[REVISED — per skeptic review]**

---

## 2. Runtime Lifecycle → Module Map

*(Unchanged from original — the skeptic confirmed the lifecycle mapping is accurate.)*

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

**[REVISED per W2]** `session/` is now `features/session/` — no new top-level directory. This keeps it within the features layer and avoids the layer violation identified by the skeptic.

```
src/
├── plugin/                          # Plugin assembly — wires everything (≤250 LOC)
│   ├── index.ts                     # Single entry: createHiveMindPlugin()
│   ├── tool-registry.ts             # createToolRegistry() — assembles all tools
│   ├── hook-registry.ts             # createHookRegistry() — assembles all hooks
│   ├── sdk-context.ts               # SDK client initialization/reset
│   └── logging.ts                   # [REVISED per C3] Moved from shared/ — needs SDK context
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
│   │   ├── contract-create-tool.ts  # createContractCreateTool()
│   │   ├── contract-export-tool.ts  # createContractExportTool()
│   │   └── contract-tool-types.ts   # Shared types for both contract tools
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
│   │   ├── index.ts                 # Explicit named exports (no export * from)
│   │   ├── trajectory-manager.ts    # Orchestrates ledger operations
│   │   ├── trajectory-types.ts      # Domain types (not tool args)
│   │   └── contracts.ts             # Feature contracts (tool args moved here)
│   ├── workflow/
│   │   ├── index.ts
│   │   ├── workflow-manager.ts      # Orchestrates task lifecycle
│   │   ├── task-lifecycle.ts        # Task CRUD, activation, verification
│   │   ├── workflow-types.ts
│   │   └── contracts.ts
│   ├── handoff/
│   │   ├── index.ts
│   │   ├── handoff-manager.ts       # Delegation CRUD + continuity sync
│   │   ├── handoff-types.ts
│   │   └── contracts.ts
│   ├── contract/
│   │   ├── index.ts
│   │   ├── contract-store.ts        # JSON file CRUD with locking
│   │   ├── intent-classifier.ts     # Regex-based intent classification
│   │   ├── chain-executor.ts        # Chain action dispatch
│   │   ├── contract-types.ts
│   │   └── contracts.ts
│   ├── journal/
│   │   ├── index.ts
│   │   ├── event-sink.ts            # Persistence contract + implementation
│   │   ├── consolidated-writer.ts   # V3 session JSON writer
│   │   ├── markdown-writer.ts       # Human-readable event log
│   │   └── journal-types.ts
│   ├── session/                     # [REVISED per W2] Was top-level session/
│   │   ├── index.ts
│   │   ├── intake-gates.ts          # Gate resolution for hm-init/hm-settings
│   │   ├── profile-resolution.ts    # Language, preset, profile resolution
│   │   ├── lineage-router.ts        # hivefiver vs hiveminder
│   │   ├── purpose-classifier.ts    # Purpose classification
│   │   ├── readiness-gates.ts       # Readiness gate resolution
│   │   ├── session-state.ts         # Session state detection
│   │   └── session-types.ts
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
│   ├── index.ts                     # Explicit named exports
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

**[REVISED per C4]** Trajectory ledger CQRS changed from "Yes" to "No" — writes are sequential, not concurrent.

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
| `features/runtime-entry/` | `features/runtime/` (as-is, deferred split) | Hybrid | 3 | Partial | Multiple actors |
| `features/runtime-observability/` | `features/runtime/` | Deterministic adapter | 1 | No | Called by runtime tools |
| `features/session-entry/` | `features/session/` | Deterministic resolver | 1 | No | Hooks call during message turn |
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
| `hooks/start-work/` | `features/session/` | Deterministic resolver | 1 | No | Message transform hook calls |
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
| `shared/logging.ts` | `plugin/logging.ts` **[REVISED per C3]** | Utility | — | No | Plugin + hooks |
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

**[REVISED per C4]** Trajectory ledger removed from CQRS.

| Module | CQRS? | Why |
|--------|-------|-----|
| Journal (event-tracker) | Yes | Multiple hooks write concurrently; needs write-side isolation |
| Contract store | Yes | Tool writes + chain executor auto-writes; needs locking |
| Trajectory ledger | **No** **[REVISED]** | Sequential writes only — tools call directly, event handler fires sequentially. No concurrent write scenario exists. |
| Handoff store | No | Single-writer (tool only); hooks only read |
| Session entry | No | Read-only resolution; no writes |
| Prompt packet | No | Read-only compilation; no writes |
| Config manager | No | Single-writer (tool only) |
| Runtime status | No | Read-only inspection |

---

## 5. Dependency Graph

**[REVISED per C6]** This section now shows the CURRENT state with violations alongside the TARGET state.

### Current State (with violations)

```
Layer 0: OpenCode SDK (external)
    ↓
Layer 1: Plugin Assembly (src/plugin/)
    ├── Imports: tools/, features/agent-work-contract/tools/, hooks/, shared/
    ├── ⚠️ VIOLATION: plugin/messages-transform-adapter.ts → hooks/start-work/start-work-router.ts
    ├── ⚠️ VIOLATION: plugin/input-helpers.ts → features/agent-work-contract/hooks/
    └── ⚠️ VIOLATION: plugin imports from features/ (agent-work-contract/tools/)
    ↓
Layer 2: Tool Surfaces (src/tools/)
    ├── Imports: features/, shared/, schema-kernel/
    ├── ⚠️ VIOLATION: hivefiver-setting/tools.ts → features/runtime-entry/, features/session-entry/, sdk-supervisor/, control-plane/
    └── ⚠️ VIOLATION: hivefiver-setting/tools.ts ↔ features/runtime-entry/settings.ts (CIRCULAR)
    ↓
Layer 3: Feature Modules (src/features/)
    ├── Imports: core/, shared/, schema-kernel/, delegation/, intelligence/
    ├── ⚠️ VIOLATION: 6 files import types from tools/ (upward dependency)
    │   ├── trajectory/trajectory.ts → tools/trajectory/types.js
    │   ├── workflow/task.ts → tools/task/types.js
    │   ├── handoff/handoff.ts → tools/handoff/types.js
    │   ├── doc-intelligence/doc.ts → tools/doc/types.js
    │   ├── runtime-observability/status.ts → tools/runtime/types.js
    │   └── runtime-entry/settings.ts → tools/hivefiver-setting/index.js (RUNTIME function, not type)
    └── ⚠️ VIOLATION: runtime-entry/settings.ts ↔ tools/hivefiver-setting/tools.ts (CIRCULAR)
    ↓
Layer 4: Core Persistence (src/core/)
    ├── Imports: shared/, schema-kernel/
    └── ✅ Clean — no violations
    ↓
Layer 5: Hook Handlers (src/hooks/)
    ├── Imports: features/, shared/, core/, control-plane/, commands/, plugin/
    └── ✅ Expected — hooks aggregate from all layers
    ↓
Layer 6: Shared Utilities (src/shared/)
    ├── Imports: schema-kernel/
    ├── ⚠️ VIOLATION: shared/logging.ts → hooks/sdk-context.js (shared → hooks, reverse dependency)
    └── ⚠️ VIOLATION: shared/runtime-attachment.ts → features/runtime-entry/attachment.js (shared → feature)
    ↓
Layer 7: Schema Kernel (src/schema-kernel/) — FOUNDATION
    ├── Imports: nothing (stdlib + @opencode-ai/plugin only)
    └── ✅ Clean — no violations
```

### Violation Resolution Map

| Violation | Current | Resolution | Phase |
|-----------|---------|-----------|-------|
| shared/logging.ts → hooks/sdk-context.ts | Shared depends on hooks | Move logging.ts to plugin/ where SDK context is available | Phase 3 Step 4 |
| shared/runtime-attachment.ts → features/runtime-entry/ | Shared depends on feature | Re-export from features/runtime-entry/attachment.ts (already done) | Already fixed |
| plugin/messages-transform-adapter.ts → hooks/start-work/ | Plugin depends on hooks | Move start-work to features/session/ — hooks import from features, not vice versa | Phase 2 |
| plugin/input-helpers.ts → features/agent-work-contract/hooks/ | Plugin depends on feature hooks | Move to features/contract/ — plugin imports from features (acceptable) | Phase 2 |
| 6 type-only upward imports (features → tools) | Features import tool types | Move types to features/contracts.ts — feature owns its interface | Phase 3 Step 2 |
| runtime-entry/settings.ts ↔ hivefiver-setting/tools.ts | Circular dependency | Single atomic operation: move buildHmSettingDashboardProof to features/admin/config-manager.ts, update BOTH import sites | Phase 3 Step 1 |
| hivefiver-setting/tools.ts → 4 layers beyond features | Tool imports from runtime-entry, session-entry, sdk-supervisor, control-plane | Move to tools/admin/config-tool.ts with feature-layer delegation | Phase 2 |

### Target State (after migration)

```
Layer 0: OpenCode SDK (external)
    ↓
Layer 1: Plugin Assembly (src/plugin/)
    ├── Creates tools via createToolRegistry()
    ├── Creates hooks via createHookRegistry()
    ├── Initializes SDK context
    └── Imports: tools/, hooks/, shared/, schema-kernel/, plugin/logging.ts
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
    ├── Import: features/, shared/, features/session/, context/
    └── Never import: tools/, plugin/
    ↓
Layer 6: Shared Utilities (src/shared/) — LEAF
    ├── Cross-cutting: paths, errors, pressure contracts
    └── Import: schema-kernel/ only (logging moved to plugin/)
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
| Hooks (5) | Features (3), Shared (6), Session (3a), Context (5b) | Tools (2), Plugin (1) |
| Shared (6) | Schema (7) | Everything above |
| Schema (7) | Nothing | Everything |

### Circular Dependency Prevention

1. **No feature imports its own tool types.** Move shared action types to `feature/contracts.ts` — the feature owns them.
2. **No hook imports tool factories.** Hooks call feature functions directly.
3. **No shared imports hooks.** Logging moved to plugin/ where SDK context is available — shared/ has no hook imports. **[REVISED per C3]**
4. **Delegation is wired before restructuring.** Verify it's imported by features/handoff/ before treating as leaf. **[REVISED per W7]**
5. **Circular dependency fix is atomic.** The settings.ts ↔ hivefiver-setting/tools.ts cycle is broken in a single commit: move function + update BOTH import sites + verify type-check. **[REVISED per C5]**

---

## 6. Tool Catalog Design

**[REVISED per R9]** Updated to 8 public tools (two contract tools with `hivemind_contract_*` prefix).

### Registration Strategy

All tools are registered through a single `createToolRegistry()` function in `src/plugin/tool-registry.ts`:

```
createToolRegistry({ directory, featureFlags, config }) → Record<string, ToolDefinition>
```

### Public Tools (Core Package)

**[REVISED per R9]** Split contract into two tools with consistent prefix.

| Tool ID | Factory | Actions | CRUD Group | Priority |
|---------|---------|---------|-----------|----------|
| `hivemind_trajectory` | `createTrajectoryTool()` | inspect, traverse, attach, checkpoint, event, close | 1 | High |
| `hivemind_task` | `createTaskTool()` | create, list, get, activate, rotate, verify, complete | 1 | High |
| `hivemind_handoff` | `createHandoffTool()` | create, read, list, update, validate, close | 1 | High |
| `hivemind_contract_create` | `createContractCreateTool()` | create, update | 3 | High |
| `hivemind_contract_export` | `createContractExportTool()` | export | 1 | High |
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

### Tool Trim Order (for context trimming)

**[REVISED per W4]** Renamed from `LOW_PRIORITY_TOOL_ORDER` to `TOOL_TRIM_ORDER` with clarifying comment.

```typescript
// Tools removed in this order when max_tools cap is reached.
// First tools in array are trimmed first; last tools are kept.
const TOOL_TRIM_ORDER = [
  // Admin tools — least critical for orchestration
  "hivemind_hm_doctor",
  "hivemind_hm_init",
  "hivemind_hm_config",
  // Doc tools — useful but not core
  "hivemind_doc",
  // Journal — important but hooks auto-write
  "hivemind_journal",
  // Contract export — read-only, less critical than create
  "hivemind_contract_export",
  // Contract create — needed for advanced workflows
  "hivemind_contract_create",
  // Runtime — needed for observability
  "hivemind_runtime_command",
  "hivemind_runtime_status",
  // Core orchestration — highest priority (kept last)
  "hivemind_handoff",
  "hivemind_task",
  "hivemind_trajectory",
] as const
```

### Internal vs Public Classification

| Classification | Tools | Rationale |
|---------------|-------|-----------|
| **Public** | trajectory, task, handoff, contract_create, contract_export, journal, runtime_status, runtime_command | Agent-callable, durable state, core orchestration |
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

**[REVISED per R10]** Hook alias registry code block removed. Decision 4 demotes the registry to optional future work. Instead of a full alias registry, we use explicit named exports from `plugin/hook-registry.ts` with comments documenting the OpenCode hook name for each capability.

### Hook Subscription Pattern

Every hook is created via a factory and registered through the hook registry:

```
createHookRegistry({ directory, config }) → HookRegistry
  ↓
For each hook capability:
  1. Create hook via createXXXHook()
  2. Register on OpenCode hook name (documented in comments)
  3. Track disposable hooks for cleanup
```

### Hook Composition

**[REVISED per W1]** Hooks receive their dependencies directly — NOT through a Managers interface. The Managers interface is dropped as over-engineering for a codebase with 11 hooks and 12 tools.

```
Hook → Feature function → Core
```

No hook imports another hook. No hook imports a tool. Hooks receive their dependencies as constructor args or closure captures.

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
| Session Entry | `features/session/` | messages.transform | core |
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
| Logging | `plugin/logging.ts` | client.app.log() | core |

---

## 9. Migration Path

### Phase 0: Import Audit and Dependency Mapping

**Goal:** Map every import relationship before moving anything. No file moves until this phase completes and is verified.

**[REVISED per R8]** Fixed grep command.

- Run full import audit: `grep -rn "from ['\"]\.\./" src/` → map all cross-module dependencies (not `from.*src/` which matches self-references)
- Classify each import as: type-only (`import type`), runtime function, or value import
- Identify all dynamic imports (`import()`, `require()` via variable) — these are invisible to static analysis
- Map all string-referenced paths (command bundles, config files, agent files that reference tool/module names)
- Produce `dependency-audit.json` with: source file → target file → import type → phase assignment
- **Gate:** `npx tsc --noEmit` passes on current codebase before any changes
- **Rollback:** N/A — this phase makes no file changes
- **Time estimate:** 2 hours

### Phase 0.5: Test Stabilization

**[NEW — per R1/W5]** Fix all failing tests and add smoke tests for untested tools BEFORE any file moves. Failing tests make it impossible to verify migration correctness.

- Fix the 3 currently failing journal tests
- Add smoke tests for the 5 untested tools: trajectory, task, handoff, runtime, doc
- Verify that moved modules still work at runtime in OpenCode
- **Gate:** `npm test` passes with zero failures
- **Rollback:** N/A — test fixes only
- **Time estimate:** 1-2 days

### Phase 1: Dead Code Elimination (Deprecate-Then-Delete)

**Goal:** Remove confirmed dead code with safety nets. No structural moves — only deletions.

**[REVISED per W3]** Added verification step before deletion.

**Sub-phase 1a: Verification (new)**
- Run `grep -rn "auto-slash-command\|workflow-integration" src/` to confirm zero references including string literals
- Check `opencode.json` and any plugin config files for dynamic references
- Verify no code dynamically imports from hooks barrel (e.g., via `require()` with variable path)
- **Gate:** Zero string-literal references found for dead modules

**Sub-phase 1b: Deprecation (safe, reversible)**
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

**Sub-phase 1c: Deletion (after 1 release cycle of deprecation)**
- Delete `*.deprecated.ts` files and their barrel references
- Delete `dashboard-v2/` (already empty stub — no deprecation needed)
- **Gate:** `npx tsc --noEmit` passes, `npm test` passes, plugin loads in OpenCode
- **Rollback:** `git revert` — single commit

**What is NOT deleted in Phase 1:**
- `cli/` directory — defer to Phase 2 (may be dynamically loaded by command router)
- `governance/` directory — defer to Phase 2 (trace runtime-entry dependency first)
- `sdk-supervisor/` — defer to Phase 2 (merge, don't delete)

- **Time estimate:** 4 hours

### Phase 2: Module Relocation (Atomic Per-Module Moves)

**Goal:** Move modules to ideal locations. One module per commit. Build passes after every commit.

**[REVISED per R2]** Reduced from 22 commits to 12 by combining related moves.

**Rule:** Each module move is a single atomic commit that includes:
1. All source files in the module
2. All test files for the module
3. All updated import paths in consuming files
4. Barrel export updates

**Move order (each is one commit, build must pass between commits):**

| Commit | Move | Consumers to Update | Risk |
|--------|------|-------------------|------|
| 2a | `hooks/start-work/` → `features/session/` + `hooks/runtime-loader/` → `hooks/tool/` | `hooks/`, `plugin/`, `features/session-entry/` | Low — small modules, few consumers |
| 2b | `core/workflow-management/` → `core/workflow/` | `features/workflow/`, `features/trajectory/`, `recovery/` | Medium — core module, many consumers |
| 2c | `features/session-entry/` → `features/session/` | `hooks/`, `features/runtime-entry/`, `plugin/` | Medium — cross-cutting consumers |
| 2d | `features/runtime-observability/` → `features/runtime/` + `sdk-supervisor/` → merge into `features/runtime/` | `tools/runtime/`, `features/runtime-entry/` | Medium — layer elimination |
| 2e | `features/agent-work-contract/` → `features/contract/` | `features/handoff/`, `features/runtime-entry/`, `plugin/` | High — hub module |
| 2f | `features/event-tracker/` + `features/session-journal/` → `features/journal/` | All hooks, `plugin/` | High — largest module, most consumers |
| 2g | Hook renames (batch): `event-handler.ts`→`session-lifecycle-hook.ts`, `tool-execution-handler.ts`→`tool-observer-hook.ts`, `chat-message-handler.ts`→`message-journal-hook.ts`, `transform-handler.ts`→`system-transform-hook.ts`, `text-complete-handler.ts`→`text-complete-hook.ts`, `compaction-handler.ts`→`compaction-journal-hook.ts` | `plugin/` | Medium — large file moves |
| 2h | Plugin adapters: `messages-transform-adapter.ts`→`message-transform-hook.ts`, `compaction-adapter.ts`→`compaction-inject-hook.ts`, `context-renderer/`→`context/prompt-packet/` | `plugin/` | Medium — multiple files |
| 2i | Admin tool moves (batch): `hivefiver-init/`→`admin/init-tool.ts`, `hivefiver-doctor/`→`admin/doctor-tool.ts`, `hivemind-journal.ts`→`journal/journal-tool.ts` | `plugin/`, `tools/index.ts` | Low — self-contained |
| 2j | `hivefiver-setting/` → `tools/admin/config-tool.ts` | `plugin/`, `tools/index.ts`, `features/runtime-entry/` | High — most cross-layer-coupled file |
| 2k | `cli/` → merge into `features/admin/` | CLI entry points only | Low — no internal consumers |
| 2l | `features/runtime-entry/` → `features/runtime/` (as-is, NO split) | Multiple | **DEFERRED SPLIT** — move as-is first, split in separate PR **[REVISED per R3/C1]** |

**[REVISED per C1/R3]** Commit 2l moves runtime-entry to features/runtime/ as-is. The split into runtime/session/admin sub-modules is deferred to a separate PR after all other moves are complete and verified. This avoids the cross-cutting decomposition problem identified by the skeptic.

**Rollback strategy:**
- Each commit is independently revertible via `git revert <commit-sha>`
- If Phase 2 fails at any point, revert the failing commit and all subsequent commits
- Pre-phase checkpoint: `git tag pre-phase-2` before starting

- **Time estimate:** 2-3 days

### Phase 3: Contract Boundary Establishment

**Goal:** Eliminate all upward imports (both type-only AND runtime function imports).

**Step 1: Fix circular dependency (atomic operation) [REVISED per C5]**
- `features/runtime/settings.ts` imports `buildHmSettingDashboardProof` from `tools/hivefiver-setting/` → move this function to `features/admin/config-manager.ts` (the feature, not the tool)
- `tools/hivefiver-setting/tools.ts` imports `loadRuntimeBindingsSnapshot` from `features/runtime-entry/snapshot-loader.js` → update to import from new location `features/runtime/snapshot-loader.js`
- **This is a single atomic commit:** (a) move the function, (b) update BOTH import sites, (c) verify type-check
- If build breaks, `git revert` immediately — do not proceed with other steps

**Step 2: Move tool arg types to feature contracts (one tool at a time) [REVISED per C2]**
- Move ONE tool's types at a time, with type-check gates between each:
  - Step 2a: `tools/trajectory/types.ts` → `features/trajectory/contracts.ts` (35 LOC — simplest)
  - Step 2b: `tools/task/types.ts` → `features/workflow/contracts.ts` (33 LOC)
  - Step 2c: `tools/doc/types.ts` → `features/doc-intelligence/contracts.ts` (22 LOC)
  - Step 2d: `tools/runtime/types.ts` → `features/runtime/contracts.ts` (111 LOC)
  - Step 2e: `tools/handoff/types.ts` → `features/handoff/contracts.ts` (118 LOC — most complex)
  - Step 2f: Contract tool types → `features/contract/contracts.ts`
- Each step: move types → update tool imports → update feature imports → `npx tsc --noEmit` → next step
- If any step fails type-checking, revert that step and investigate before proceeding

**Step 3: Fix reverse dependencies [REVISED per C3]**
- `shared/logging.ts` → `hooks/sdk-context.ts` reverse dependency → move `logging.ts` to `plugin/logging.ts` where SDK context is available
- Do NOT create a "stdlib-only" SDK adapter — that's a contradiction. The logging module needs `PluginInput` from `@opencode-ai/plugin`, which is not stdlib.
- Update all imports of `shared/logging.js` to `plugin/logging.js`

**Step 4: Create registry functions**
- Create `src/plugin/tool-registry.ts` with `createToolRegistry()` — assembles all tools from their new locations
- Create `src/plugin/hook-registry.ts` with `createHookRegistry()` — assembles all hooks from their new locations
- Update `plugin/index.ts` to use registries instead of direct imports

**Step 5: Replace barrel exports**
- Replace all barrel `export * from` with explicit named exports in `index.ts` files

**Gate:** `npx tsc --noEmit` passes with zero upward imports verified by `grep -rn "from.*tools/" src/features/`
- **Time estimate:** 1 day

### Phase 4: Factory Pattern Adoption (Tools Only)

**Goal:** All tools use `createXXX()` factory pattern. Hooks continue with direct exports.

**[REVISED per W1]** Dropped Managers interface. Factory pattern adopted only for tools.

- Convert all tool definitions to `createXXXTool()` factories
- Hooks continue to receive their dependencies directly — no Managers interface
- Add `safeHook()` error isolation wrapper for all hooks (lightweight, not over-engineered)
- Add `disposeCreatedHooks()` cleanup pattern

**Gate:** `npx tsc --noEmit` passes, `npm test` passes
- **Time estimate:** 1 day

### Phase 5: Agent File and Test Updates

**Goal:** Update all downstream references to moved modules and renamed tools.

- Update agent files in `.opencode/agents/` to reference new tool names
- Update all test file import paths to match new module locations
- Move test files alongside their source files (co-locate `*.test.ts` with `*.ts`)
- Update `AGENTS.md` tool count and layer table
- Update skill files that reference old tool/module names
- Update `.hivemind/activity/` references if needed (documentation only)

**Gate:** `npx tsc --noEmit` passes, `npm test` passes, plugin loads in OpenCode
- **Time estimate:** 4 hours

### Phase 6: Package Splitting (Optional)

**Goal:** Separate core from optional add-ons for npm distribution.

- Core package: trajectory, task, handoff, contract, journal, runtime tools + hooks
- Docs add-on: doc tool + intelligence/doc/ + remark dependency
- Admin add-on: init, doctor, config tools + @json-render/ink dependencies
- Use `peerDependencies` for optional features to avoid package fragmentation

**Gate:** All 3 packages build independently, integration tests pass across package boundaries
- **Time estimate:** Deferred

---

## 10. Trade-off Analysis

### Decision 1: Keep two contract tools with `hivemind_contract_*` prefix

**Context:** Two tools (`hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`) operate on one authority surface.

**Options:**
- A: Keep two separate tools (current state)
- B: Merge into single `hivemind_contract` with create/update/export actions
- C: Keep two tools but rename to `hivemind_contract_create` + `hivemind_contract_export`

**Decision:** C

**Rationale:** The skeptic correctly identified that merging create/update (write actions) with export (read action) creates a god-tool with mixed read/write concerns. Keeping them as two tools preserves independent context trimming, maintains the CQRS separation (write vs read), and avoids a switch-statement execute function.

**Trade-off:** Public inventory stays at 12 tools instead of 11. Mitigated by consistent naming prefix.

**Reversibility:** High — rename is a find-and-replace across agent files and tool registry.

### Decision 2: Move tool arg types from tools/ to features/

**Context:** 6 feature files import types from `tools/*/types.ts` — upward dependency.

**Options:**
- A: Keep types in tools/ (current state — type-only imports, technically safe)
- B: Move types to features/ as contracts (feature owns its interface)
- C: Move shared types to shared/ (cross-feature primitives)

**Decision:** B

**Rationale:** The feature is the authority on what it accepts and returns. Tool arg types are feature contracts, not tool concerns.

**Trade-off:** Tool files lose their self-contained type definitions. Mitigated by importing from `../features/xxx/contracts.ts`.

**Reversibility:** High — move types back is a find-and-replace operation.

### Decision 3: Delete dead code before restructuring

**Context:** 14 files with zero external consumers, 2 deprecated files, 4 dead subdirectories.

**Options:**
- A: Move dead code to ideal locations (preserve for potential future use)
- B: Delete dead code entirely (clean slate for restructuring)

**Decision:** B

**Rationale:** Dead code is cognitive debt. If it's needed later, git history preserves it.

**Trade-off:** Loses placeholder implementations for init/doctor. Mitigated by documenting the intended functionality.

**Reversibility:** High — `git revert` or cherry-pick from history.

### Decision 4: Group hooks by event type, not by feature

**Context:** Current hooks are scattered across `hooks/` root with no grouping.

**Options:**
- A: Keep flat structure (current state)
- B: Group by event type (session/, chat/, tool/, compaction/, system/)
- C: Group by feature (trajectory-hooks/, workflow-hooks/, etc.)

**Decision:** B

**Rationale:** Hooks respond to OpenCode lifecycle events, not HiveMind features.

**Trade-off:** Feature-related hooks are spread across multiple directories. Mitigated by the hook registry.

**Reversibility:** Medium — requires moving files and updating imports.

### Decision 5: Merge sdk-supervisor into features/runtime

**Context:** sdk-supervisor has 3 active files and 2 dead files.

**Options:**
- A: Keep as separate layer (current state)
- B: Merge into features/runtime/

**Decision:** B

**Rationale:** sdk-supervisor is not a layer — it's a feature. It has no consumers outside the runtime tool chain.

**Trade-off:** Loses the "supervisor" naming which implies authority. Mitigated by clear function naming.

**Reversibility:** Medium — extract back to separate directory is straightforward.

### Decision 6: Single package with optional peer dependencies

**Context:** Current single npm package includes remark, ink, json-render dependencies that not all consumers need.

**Options:**
- A: Single package (current state)
- B: Core + docs add-on + admin add-on (3 separate npm packages)
- C: Single package with optional peer dependencies + dynamic imports

**Decision:** C

**Rationale:** The skeptic correctly identified that ~700KB of optional dependency weight is negligible for a plugin framework. The maintenance cost of 3 packages far exceeds the benefit.

**Trade-off:** Slightly larger install size for consumers who don't need optional features. Mitigated by `peerDependencies` — they only install what they need.

**Reversibility:** Medium — splitting into separate packages later is possible but requires careful version management.

### Decision 7: Drop Managers interface [NEW]

**Context:** Original proposal adopted a Managers interface for hook composition.

**Options:**
- A: Adopt Managers interface (original proposal)
- B: Hooks receive dependencies directly (skeptic recommendation)

**Decision:** B

**Rationale:** The skeptic correctly identified that the Managers interface adds indirection without solving a current problem. HiveMind has 11 hooks and 12 tools — far fewer than oh-my-openagent's 48 hooks and 26 tools where the pattern makes sense.

**Trade-off:** Hooks have more direct coupling to their dependencies. Mitigated by factory functions that assemble dependencies at plugin load time.

**Reversibility:** High — adding a Managers interface later is a straightforward refactor.

### Decision 8: Defer runtime-entry split to separate PR [NEW]

**Context:** Original proposal split runtime-entry across 3 sub-commits during Phase 2.

**Options:**
- A: Split during Phase 2 (original proposal)
- B: Move as-is first, split in separate PR (skeptic recommendation)

**Decision:** B

**Rationale:** The skeptic provided concrete evidence that runtime-entry's 24 files and 3,000 LOC are cross-cutting — command.ts imports from workflow-continuity.ts which imports from agent-work-contract/. The `executeRuntimeEntryCommandBundle()` function orchestrates auto-recovery, handler dispatch, turn output export, AND session contract linkage in a single function. These files are not cleanly separable.

**Trade-off:** The runtime-entry module remains larger than ideal during the migration. Mitigated by moving it to `features/runtime/` as-is — at least it's in the right layer.

**Reversibility:** N/A — this is a sequencing decision, not a design decision.

---

## 11. What NOT to Change

**[NEW — per R5]** These are intentional design decisions that should be preserved during migration:

1. **V3 no-op pattern for `addEvent()`/`addDiagnostic()`.** These are intentionally no-ops in V3 schema — events go to separate files, not in-session. Don't "fix" this by making them write to session JSON.
2. **Subagent session linking (no separate session files).** Subagent sessions (`parentSessionId` present) do NOT get their own session files — they are linked to parent sessions only. Don't create separate session files for subagents.
3. **Injection store pattern for turn-scoped context transfer.** `setInjectionPayload()` / `getAndClearInjectionPayload()` provides turn-scoped context transfer between hooks (messages.transform → text.complete → compaction). Don't replace with file-based storage.
4. **Trajectory ledger as single source of truth.** The trajectory ledger (`.hivemind/state/trajectory-ledger.json`) is the single source of truth for active session bindings, workflow associations, and event history. Don't fragment this across multiple files.
5. **Dual compaction handling.** Both `compactionHandler` (context injection) and `compactionJournalHandler` (journal recording) run on compaction, plus `event` handler creates recovery checkpoints on `session.compacted`. Don't merge these into a single handler.
6. **NL-first dispatch as no-op execution.** `maybeExecuteNlFirstRuntimeDispatch()` preserves route hints but doesn't execute commands automatically. Don't enable automatic execution without explicit user confirmation.
7. **Tool pressure contracts.** Every tool's types.ts defines a `Record<ActionType, RuntimePressureContract>` mapping. Don't remove these — they're critical for runtime safety.

---

## 12. Time Estimates Summary

| Phase | Description | Estimate |
|-------|-------------|----------|
| Phase 0 | Import Audit and Dependency Mapping | 2 hours |
| Phase 0.5 | Test Stabilization | 1-2 days |
| Phase 1 | Dead Code Elimination | 4 hours |
| Phase 2 | Module Relocation (12 commits) | 2-3 days |
| Phase 3 | Contract Boundary Establishment | 1 day |
| Phase 4 | Factory Pattern Adoption (tools only) | 1 day |
| Phase 5 | Agent File and Test Updates | 4 hours |
| Phase 6 | Package Splitting | Deferred |
| **Total** | | **5-7 working days** |

---

## 13. Verification Criteria

Before declaring migration complete:

1. **Zero upward imports:** `grep -rn "from.*tools/" src/features/` returns nothing
2. **Zero reverse dependencies:** `grep -rn "from.*hooks/" src/shared/` returns nothing
3. **Zero circular dependencies:** `npx madge --circular src/` returns nothing
4. **All tests pass:** `npm test` passes with zero failures
5. **Type check passes:** `npx tsc --noEmit` passes with zero errors
6. **Plugin loads:** OpenCode loads the plugin and all 13 tools register
7. **All hooks fire:** All 11 hooks are wired and respond to their respective events
8. **No dead code in target:** No `*.deprecated.ts` files remain in the target structure
9. **Explicit named exports:** No `export * from` in any `index.ts` file
10. **TOOL_TRIM_ORDER correct:** Array named correctly with clarifying comment

---

## 14. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Phase 2 commit breaks subsequent commit | Medium | High | Each commit independently revertible; pre-phase checkpoint tag |
| Dead code is dynamically loaded | Low | High | Phase 1 verification step (grep string literals) |
| Circular dependency fix breaks build | Medium | Medium | Single atomic commit; immediate revert if broken |
| Tool type move fails type-check | Medium | Low | One tool at a time; type-check between each |
| Test failures mask migration issues | High | High | Phase 0.5 fixes tests before any moves |
| runtime-entry split fails | High | High | Deferred to separate PR; move as-is first |
| Agent files reference old tool names | Medium | Medium | Phase 5 covers all agent file updates |

```

Tab 6