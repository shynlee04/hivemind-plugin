# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Event-Driven OpenCode Plugin with Functional Feature Modules

**Key Characteristics:**
- Context-Aware Governance Layer: Intercepts OpenCode chat messages and plugin hooks to manage session context.
- Runtime-Generated State: All state is actively generated into the `.hivemind/` directory during execution. There are no manual authoring surfaces here.
- Modular Barrel Exports: Uses an `index.ts` pattern across all sub-directories for strict encapsulation and well-defined API boundaries.
- Synthetic Injection: Augments OpenCode conversations via synthetic parts rather than mutating the original text context directly.

## Layers

**Plugin Assembly Layer:**
- Purpose: Registers hooks, events, and tools to the OpenCode SDK boundary. Acts purely as an entry point with no business logic.
- Location: `src/plugin/`
- Contains: SDK plugin entry files (`src/plugin/opencode-plugin.ts`), context rendering tools (`src/plugin/context-renderer.ts`).
- Depends on: Hooks (`src/hooks/`), tools (`src/tools/`), and features (`src/features/`).
- Used by: The `@opencode-ai/plugin` SDK runtime.

**Hooks Layer:**
- Purpose: Processes non-durable OpenCode events and interactions (e.g. `tool.execute.before`, `chat.message`).
- Location: `src/hooks/`
- Contains: Event handlers, soft-governance alerts, start-work routing logic.
- Depends on: Core capabilities (`src/core/`), features (`src/features/`), shared utilities (`src/shared/`).
- Used by: Plugin assembly layer (`src/plugin/opencode-plugin.ts`).

**Features Layer:**
- Purpose: High-level domain capabilities with business rules.
- Location: `src/features/`
- Contains: Complex functional domains like `agent-work-contract/`, `handoff/`, `runtime-entry/`, `workflow/`.
- Depends on: Core logic (`src/core/`), shared constants (`src/shared/paths.ts`).
- Used by: Hooks (`src/hooks/`) and CLI (`src/cli.ts`).

**Core & State Layer:**
- Purpose: Domain state management and logic for core mechanics.
- Location: `src/core/`
- Contains: Tracking models (`src/core/trajectory/`), task definitions (`src/core/workflow-management/`).
- Depends on: Path authorities (`src/shared/paths.ts`) to write into `.hivemind/state/`.
- Used by: Features layer (`src/features/`), Tools layer (`src/tools/`).

**Tools Layer:**
- Purpose: Defines explicit capability interfaces injected into the LLM context.
- Location: `src/tools/`
- Contains: Handlers for operations like `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`.
- Depends on: Core logic and features to enact the desired behaviors.
- Used by: OpenCode chat sessions (mapped in `src/plugin/opencode-plugin.ts`).

## Data Flow

**Message Context Augmentation:**

1. User sends a message or invokes an action in OpenCode.
2. The `experimental.chat.messages.transform` hook in `src/plugin/opencode-plugin.ts` intercepts it.
3. The hook fetches the latest runtime snapshot via `src/plugin/runtime-snapshot.ts`, triggering a read from `.hivemind/session.json` and active trajectory files.
4. The snapshot data is passed to `src/plugin/context-renderer.ts`, which injects `TurnHierarchyContext` as synthetic parts.
5. The LLM receives the enriched prompt.

**State Management:**
- All persistent runtime state is written to paths resolved by `getEffectivePaths()` from `src/shared/paths.ts` (resolving strictly to `.hivemind/`).
- State mutations are executed by tools (`src/tools/`) or feature engines (`src/features/agent-work-contract/engine/contract-store.ts`).
- Hooks (`src/hooks/`) never perform durable `.hivemind/` state writing; they act as read-only or delegation routers.

## Key Abstractions

**TurnSnapshot:**
- Purpose: Represents the specific contextual point in time (active trajectories, tasks, workflows) for a single OpenCode chat message.
- Examples: `src/plugin/runtime-snapshot.ts`
- Pattern: Immutable snapshot cache initialized at turn start.

**EffectivePaths Authority:**
- Purpose: Centralized constant-resolution logic for any dynamic `.hivemind/` runtime path.
- Examples: `src/shared/paths.ts`
- Pattern: Factory function (`getEffectivePaths()`) enforcing a single root resolution instead of ad-hoc path combining.

**Agent Work Contract:**
- Purpose: Establishes defined operating constraints and deliverables for specific agent sub-routines.
- Examples: `src/features/agent-work-contract/schema/index.ts`, `src/features/agent-work-contract/tools/create-contract-tool.ts`
- Pattern: Validated JSON schemas saved to `.hivemind/agent-work-contract/`.

## Entry Points

**OpenCode Runtime Entry:**
- Location: `src/plugin/opencode-plugin.ts`
- Triggers: `@opencode-ai/plugin` framework lifecycle via `npm run dev` or packaged deployment.
- Responsibilities: Maps standard tool implementations, event listeners, and prompt manipulations directly to OpenCode plugin interfaces.

**CLI Entry:**
- Location: `src/cli.ts` (and `src/cli/init.ts`)
- Triggers: User executing `hm-init`, `hm-doctor`, or `hm-harness` via command line.
- Responsibilities: Bootstraps the local `.hivemind/` skeleton, validates active capabilities, and writes setup schemas prior to actual UI sessions.

## Error Handling

**Strategy:** Fail-safe degraded mode.

**Patterns:**
- If the core snapshot state is unhealthy, `src/plugin/opencode-plugin.ts` emits a warning toast ("Running in degraded mode") instead of crashing the OpenCode environment.
- Path resolutions use safe-defaults and catch missing directory conditions (using fallbacks).
- Tools follow strict Zod schema validation (seen in `agent-work-contract/schema/`) to reject invalid agent tool calls safely.

## Cross-Cutting Concerns

**Logging:** Uses a structured internal `Logger` from `src/shared/logging.ts` for tracing lifecycle events without bleeding into standard console output inappropriately.
**Validation:** Employs `zod` universally across all domain layers (e.g., `src/features/agent-work-contract/schema/`) to ensure any tool inputs or loaded `.hivemind/` states are strongly-typed and sane.
**Authentication:** Implicit within the OpenCode context. The system relies on local filesystem permissions and OpenCode workspace access, acting inside the user's active session boundaries.

---

*Architecture analysis: 2026-03-21*
