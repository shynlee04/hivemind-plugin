---
phase: 01-dual-plane-runtime-backbone
plan: 01
task: 1
type: closeout
created: 2026-03-21
---

# Task 1 Closeout: Dual-Plane Owner Map

**Task:** Map the active dual-plane owners and the allowed adapter posture
**Date:** 2026-03-21
**Status:** ✅ Complete

---

## SDK Control-Plane Owner Map

The SDK control-plane owns bootstrap, attach/repair, orchestration, harness behavior, and client/server interaction **outside** the agent loop.

| Concern | Authoritative Owner | Location | Thin Adapter Posture |
|---------|-------------------|----------|---------------------|
| Server/client lifecycle | `@opencode-ai/sdk` | `src/control-plane/sdk-runtime.ts` | CLI entry via SDK primitives only |
| Session management | `@opencode-ai/sdk` via `client.session.*` | `src/sdk-supervisor/` | Supervisor surfaces session aggregates, not raw SDK calls |
| Runtime status assembly | `src/sdk-supervisor/runtime-status.ts` | `src/sdk-supervisor/` | Projects from schema-kernel + health summaries |
| Instance registry | `src/sdk-supervisor/instance-registry.ts` | `src/sdk-supervisor/` | Additive orchestration tracking |
| Health summaries | `src/sdk-supervisor/health.ts` | `src/sdk-supervisor/` | Aggregate supervisor health |

**Rule:** Code in `src/control-plane/` and `src/sdk-supervisor/` **MUST ONLY** import from `@opencode-ai/sdk`. No plugin hooks, no tool calls, no in-loop execution.

---

## Plugin Execution-Plane Owner Map

The plugin execution-plane owns hooks, tool registration, prompt/context injection, permission surfaces, and runtime-visible governance behavior **inside** the agent loop.

| Concern | Authoritative Owner | Location | Thin Adapter Posture |
|---------|-------------------|----------|---------------------|
| Plugin factory/assembly | `src/plugin/opencode-plugin.ts` | `src/plugin/` | Registers hooks + tools only; no business logic |
| Hook registration | SDK hook surfaces | `src/plugin/opencode-plugin.ts` | Thin delegation to hook handlers |
| Tool definitions | `src/tools/runtime/`, `src/tools/task/`, `src/tools/trajectory/`, `src/tools/doc/`, `src/tools/handoff/` | `src/tools/` | Each tool is a thin write-side adapter |
| Event handling | `src/hooks/event-handler.ts` | `src/hooks/` | Delegates to feature modules |
| Permission gates | `src/plugin/opencode-plugin.ts` (permission.ask hook) | `src/plugin/` | Auto-allows HiveMind managed tools; surfaces toasts for writes |
| Context injection | `src/plugin/context-renderer.ts`, `src/plugin/runtime-snapshot.ts` | `src/plugin/` | Projects from schema-kernel runtime records |
| Start-work routing | `src/hooks/start-work/start-work-router.ts` | `src/hooks/` | Resolves session entry without owning lifecycle |
| Runtime loader | `src/hooks/runtime-loader/` | `src/hooks/` | Governance inspection only; no durable writes |
| Soft governance | `src/hooks/soft-governance.ts` | `src/hooks/` | Uses `client.tui.showToast()` only |

**Rule:** Code in `src/plugin/`, `src/hooks/`, and `src/tools/` **MUST ONLY** import from `@opencode-ai/plugin`. No SDK client calls, no control-plane orchestration.

---

## Allowed Adapter Posture

### Thin Adapter Criteria

A file in `src/tools/`, `src/hooks/`, or `src/commands/` is a **thin adapter** when it:

1. Imports only from `@opencode-ai/plugin` (for plugin-side concerns)
2. Delegates business logic to authoritative feature modules (`src/features/`, `src/schema-kernel/`, `src/sdk-supervisor/`)
3. Does not reconstruct, duplicate, or cache authority-bearing state
4. Does not assert policy that belongs to an authoritative owner

### Shadow Authority Indicators (Anti-Patterns)

A file has become a **shadow authority** when it:

1. Reconstructs business truth instead of delegating to an authoritative module
2. Maintains its own state cache that bypasses the authoritative source
3. Asserts policy or scope decisions that should belong to one clear owner
4. Duplicates lifecycle, status, or orchestration ownership across multiple adapters

---

## Schema Kernel and Shared Contracts

Both planes consume `src/schema-kernel/` for persisted and cross-session contract authority:

| Contract | Owner | Consumers |
|----------|-------|-----------|
| Runtime status records | `src/schema-kernel/index.ts` | `src/tools/runtime/`, `src/sdk-supervisor/runtime-status.ts` |
| Runtime events | `src/shared/contracts/runtime-events.ts` | `src/hooks/event-handler.ts` |
| Runtime attachment | `src/shared/runtime-attachment.ts` | `src/control-plane/`, `src/sdk-supervisor/` |

---

## Evidence of Analysis

- Read: `src/plugin/opencode-plugin.ts`, `src/control-plane/sdk-runtime.ts`, `src/sdk-supervisor/index.ts`
- Read: `src/plugin/AGENTS.md`, `src/control-plane/AGENTS.md`, `src/sdk-supervisor/AGENTS.md`
- Read: `src/AGENTS.md` (Dual-Plane SDK Architecture rules)

---

## Acceptance Criteria Check

| Criterion | Status |
|-----------|--------|
| Contains explicit SDK control-plane owner map | ✅ |
| Contains explicit plugin execution-plane owner map | ✅ |
| Uses terms `authoritative owner` and `thin adapter` | ✅ |
| No later-phase scope claims (tool-surface clarification, module restoration) | ✅ |

---

*This artifact satisfies Task 1 of 01-01-PLAN.md*
