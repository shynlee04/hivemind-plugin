---
updated_at: "2026-04-23T00:00:00Z"
---

## Architecture Overview

**Plugin composition pattern**: `opencode-harness` is a TypeScript npm package implementing the OpenCode Plugin interface. `src/plugin.ts` is the single composition root that instantiates shared dependencies, wires 3 hook factories, and registers 6 tools. All business logic lives in dedicated modules under `src/lib/`, `src/hooks/`, `src/tools/`, and `src/shared/`.

## Key Components

| Component | Path | Responsibility |
|-----------|------|---------------|
| Composition Root | `src/plugin.ts` | Plugin entry: wires hooks + tools, lazy-loads PTY, instantiates DelegationManager |
| Public API | `src/index.ts` | Re-exports all lib modules for external consumption |
| Types (leaf) | `src/lib/types.ts` | Shared types + constants, zero imports (dependency leaf) |
| Delegation Manager | `src/lib/delegation-manager.ts` | Core orchestrator: WaiterModel dispatch, dual-signal completion, SDK + command delegation |
| SDK Delegation | `src/lib/sdk-delegation.ts` | SDK-based child session management with adaptive polling |
| Command Delegation | `src/lib/command-delegation.ts` | Headless process spawning for CLI-based delegation |
| Spawner | `src/lib/spawner/` | Session creation, concurrency key resolution, working directory resolution |
| Continuity Store | `src/lib/continuity.ts` | Durable JSON persistence with deep-clone-on-read, dual-layer state |
| Lifecycle Manager | `src/lib/lifecycle-manager.ts` | Session lifecycle state machine (stub: launch throws, pending restoration) |
| Session API | `src/lib/session-api.ts` | Typed OpenCode SDK wrappers |
| Completion Detector | `src/lib/completion-detector.ts` | Two-signal completion: session.idle + stability timer |
| Concurrency | `src/lib/concurrency.ts` | Keyed semaphore (FIFO queue per model+agent+category) |
| PTY Manager | `src/lib/pty/pty-manager.ts` | Lazy-loaded bun-pty wrapper with graceful fallback |
| Runtime Policy | `src/lib/runtime-policy.ts` | Trusted runtime policy loading and resolution |
| Core Hooks | `src/hooks/create-core-hooks.ts` | event, messages.transform, shell.env hooks |
| Session Hooks | `src/hooks/create-session-hooks.ts` | Session compaction and auto-loop hooks |
| Tool Guard Hooks | `src/hooks/create-tool-guard-hooks.ts` | Circuit breaker and tool budget enforcement |
| Tools | `src/tools/` | 6 plugin tools: delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch |
| Shared | `src/shared/` | Tool response envelope (success/error) + helper conventions |
| Schema Kernel | `src/schema-kernel/` | Zod schemas for prompt-enhance pipeline |

## Data Flow

```
User prompt → OpenCode SDK event
  → plugin.ts (event observer)
    → lifecycle-manager.ts (state machine update)
    → continuity.ts (durable persist)
    → hooks (messages.transform, tool guards)

Delegation flow:
  delegate-task tool → DelegationManager
    → concurrency.ts (queue key semaphore)
    → spawner/session-creator.ts (SDK child session)
    OR command-delegation.ts (headless CLI process)
    → sdk-delegation.ts (WaiterModel adaptive polling)
    → completion-detector.ts (dual-signal: idle + stability)
    → delegation-status tool (result retrieval)
```

## Conventions

- **TypeScript strict mode**: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`
- **ES2022 target** with NodeNext module resolution
- **Dual-layer state**: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`), hydrated on startup
- **Deep-clone-on-read** in continuity store to prevent mutation aliasing
- **`[Harness]` prefix** on all thrown errors
- **Max module size**: 500 LOC
- **Dependency chain**: max 2 levels deep; `types.ts` is the leaf node
- **Max 500 LOC per module**: delegation-manager.ts (~448) is the largest
- **Test structure**: `tests/` mirrors `src/` — `tests/lib/`, `tests/tools/`, `tests/plugins/`, `tests/integration/`
- **27 test files** across lib, tools, plugins, integration, and schema-kernel
