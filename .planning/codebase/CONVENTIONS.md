# Hivemind — Coding Conventions

> **Source:** Extracted from `src/`, `tsconfig.json`, `package.json`, `AGENTS.md`, `CONTRIBUTING.md`, and codebase-wide pattern analysis.
> **Last updated:** 2026-06-02

---

## Table of Contents

1. [TypeScript Configuration](#1-typescript-configuration)
2. [Module System & Imports](#2-module-system--imports)
3. [Naming Conventions](#3-naming-conventions)
4. [Code Structure & Organization](#4-code-structure--organization)
5. [Error Handling](#5-error-handling)
6. [Type Patterns](#6-type-patterns)
7. [Architecture Rules (Non-Negotiable)](#7-architecture-rules-non-negotiable)
8. [Architecture Patterns (CQRS & 9-Surface)](#8-architecture-patterns-cqrs--9-surface)
9. [Commit Conventions](#9-commit-conventions)
10. [Documentation Standards](#10-documentation-standards)
11. [Anti-Patterns to Avoid](#11-anti-patterns-to-avoid)
12. [State Management](#12-state-management)
13. [SDK Integration Patterns](#13-sdk-integration-patterns)

---

## 1. TypeScript Configuration

The project uses **strict TypeScript** via `tsconfig.json` with the following locked settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| `target` | `ES2022` | Modern JavaScript output with class fields, async iteration |
| `module` | `NodeNext` | Native ESM with `.js` extensions on imports |
| `moduleResolution` | `NodeNext` | ESM-compatible module resolution |
| `strict` | `true` | All strict checks enabled |
| `noUnusedLocals` | `true` | No dead local variables |
| `noUnusedParameters` | `true` | No dead function parameters (prefix with `_` to suppress) |
| `noImplicitReturns` | `true` | All code paths must return explicitly |
| `noFallthroughCasesInSwitch` | `true` | No accidental switch fallthrough |
| `verbatimModuleSyntax` | `true` | **Must use `import type` for type-only imports** |
| `declaration` | `true` | `.d.ts` files emitted for consumers |
| `declarationMap` | `true` | Go-to-definition for consumers |
| `sourceMap` | `true` | Debugging in development |
| `skipLibCheck` | `true` | Skip `node_modules` type checking (build speed) |

**Key rule:** `verbatimModuleSyntax: true` means type-only imports MUST use `import type { ... }` syntax. This is **enforced by the compiler**.

```typescript
// ✅ CORRECT — type-only import
import type { Plugin } from "@opencode-ai/plugin"
import type { Delegation, DelegationNotificationType } from "./coordination/delegation/types.js"

// ✅ CORRECT — value import (runtime usage)
import { tool } from "@opencode-ai/plugin/tool"

// ❌ WRONG — mixing value and type without `import type`
import { Plugin, type SomeType } from "..."
```

### Strict Null Checks

All variables are non-nullable by default. Use `| null` or `| undefined` explicitly:

```typescript
// ✅ CORRECT
function findSession(id: string): SessionRecord | undefined

// ❌ WRONG — implicit any or silent null
function findSession(id: string): SessionRecord  // might lie
```

---

## 2. Module System & Imports

### ESM-Only (No CommonJS)

- `"type": "module"` in `package.json`
- All imports use **relative paths with `.js` extension** (NodeNext convention)
- No `require()` calls — use `import` / `export` exclusively
- No `__dirname` or `__filename` — use `import.meta.url` with `fileURLToPath` when needed

### Import Order Convention

Imports follow a strict 4-group order, separated by blank lines:

```typescript
// Group 1: External SDK / third-party (alphabetical by package)
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// Group 2: Internal project imports (alphabetical by module path)
import { HarnessControlPlane } from "../../src/plugin.js"
import { createDelegateTaskTool } from "../../src/tools/delegation/delegate-task.js"

// Group 3: Type-only internal imports (when separated for clarity)
import type { Delegation, RuntimePolicy } from "../../src/shared/types.js"

// Group 4: Inline destructured imports from barrel exports
import * as concurrencyQueue from "../../src/coordination/concurrency/queue.js"
const { buildDelegationQueueKey } = concurrencyQueue
```

### Barrel Re-exports

`src/index.ts` is the public API barrel — re-exports from major modules:

```typescript
export { HarnessControlPlane } from "./plugin.js"
export { HarnessControlPlane as default } from "./plugin.js"
export * from "./shared/helpers.js"
export * from "./shared/types.js"
// ... etc
```

Never add implementation logic to `src/index.ts` — it is a pure re-export surface.

---

## 3. Naming Conventions

### Files & Directories

| Convention | Pattern | Examples |
|------------|---------|----------|
| Source files | `kebab-case.ts` | `session-api.ts`, `tool-response.ts` |
| Test files | `kebab-case.test.ts` | `helpers.test.ts`, `delegate-task.test.ts` |
| Directories | `kebab-case/` | `session-tracker/`, `runtime-pressure/` |
| Config files | Pascal/kebab | `vitest.config.ts`, `tsconfig.json` |

### Code Identifiers

| Construct | Convention | Examples |
|-----------|------------|----------|
| Classes | `PascalCase` | `TaskStateManager`, `DelegationManager`, `SlotManager` |
| Interfaces | `PascalCase` | `RuntimePolicy`, `Delegation`, `HookDependencies` |
| Types | `PascalCase` | `TaskStatus`, `SessionStatusType`, `PermissionAction` |
| Functions | `camelCase` | `unwrapData`, `createSession`, `getNestedValue` |
| Variables | `camelCase` | `stateDir`, `tempDir`, `previousStateDir` |
| Constants | `UPPER_SNAKE_CASE` | `WATCH_TIMEOUT_MS`, `MAX_DELEGATIONS_BEFORE_PRUNE` |
| Private class fields | `camelCase` (no `_` prefix) | `private delegations = new Map()` |
| Type parameters | Single uppercase | `<T>`, `<K extends string>` |

### Module Exports

Prefer **named exports** over default exports:

```typescript
// ✅ CORRECT — named export
export function unwrapData<T>(response: unknown): T { ... }

// ✅ CORRECT — named class export
export class TaskStateManager { ... }

// ✅ ACCEPTABLE — default for plugin entrypoint
export { HarnessControlPlane as default } from "./plugin.js"
```

### Project Prefixes (from AGENTS.md)

| Prefix | Lineage | Purpose |
|--------|---------|---------|
| `hm-*` | Harness Module | L0-L3 runtime agents/skills (shipped) |
| `hf-*` | HiveFiver | Meta-builder authoring agents/skills (shipped) |
| `gate-*` | Quality Gate | Lifecycle/spec/evidence quality gates (internal) |
| `stack-*` | Stack Reference | Framework/library reference skills (internal) |
| `gsd-*` | Get Shit Done | Developer tooling (NOT shipped) |

---

## 4. Code Structure & Organization

### Module Organization

```
src/<module>/
├── index.ts              # Public API (re-exports only)
├── types.ts              # Module-specific types/exports
├── helpers.ts            # Pure functions, utilities
└── *.ts                  # Implementation files
```

### Max Module Size

- **500 LOC per module** (hard limit, enforced in code review)
- **Exception:** `src/plugin.ts` (~756 LOC) — composition root, acknowledged exception
- If a module exceeds 500 LOC, split by responsibility

### Module Dependency Rules

```
src/shared/types.ts (LEAF — imports NOTHING from src/)
   ↓
src/shared/helpers.ts, src/shared/state.ts (NEAR-LEAF)
   ↓
src/coordination/, src/task-management/, src/hooks/, src/tools/
   ↓
src/plugin.ts (COMPOSITION ROOT — imports from all modules)
```

**Critical constraint:** `src/shared/types.ts` must remain a leaf — it cannot import from any other `src/` module (except `coordination/delegation/types.ts` for shared delegation types).

### File Placement

| File Type | Location | Notes |
|-----------|----------|-------|
| Source code | `src/<module>/` | Organized by domain |
| Tests | `tests/<module>/` | Mirrors `src/` structure |
| Integration tests | `tests/integration/` | Cross-module scenarios |
| CLI scripts | `bin/` | Executable entrypoints |
| Build scripts | `scripts/` | Node.js scripts for build pipeline |
| Documentation | `docs/` | Architecture, development guides |
| Planning docs | `.planning/` | Roadmaps, phase plans, codebase maps |

---

## 5. Error Handling

### Error Prefix

All thrown errors from harness code MUST use the `[Harness]` prefix:

```typescript
throw new Error(`[Harness] Invalid session ID '${sessionID}'`)
throw new Error(`[Harness] Root session ${rootID} exceeded descendant budget`)
```

### Custom Error Classes

Domain-specific errors are defined in `src/shared/errors/commands.ts`:

```typescript
export class CommandNotFoundError extends Error {
  readonly name = "CommandNotFoundError" as const
  constructor(message?: string) {
    super(message ?? "Command not found")
  }
}
```

Pattern for custom errors:
1. Extend `Error`
2. `readonly name = "XxxError" as const` — enables discriminated unions
3. Provide sensible default message
4. The `name` property is used for error type discrimination

### Error Shape (Tool Responses)

All tools return a standard `ToolResponse` envelope:

```typescript
type ToolResponse<T = unknown> = {
  kind: "success" | "error" | "pending"
  message: string
  data?: T
  metadata?: Record<string, unknown>
}
```

Helper functions: `success()`, `error()`, `pending()` in `src/shared/tool-response.ts`.

### SDK Error Extraction

The `extractSdkErrorMessage()` helper in `src/shared/helpers.ts` handles multiple SDK error shapes:
- String errors
- Named errors with `data.message`
- Validation error arrays with `errors[]`
- Top-level `message` property

### Blocked State Rules

When a function encounters an unrecoverable state:
1. Log the condition (add warning to session stats)
2. Throw with `[Harness]` prefix
3. Include diagnostic context in the error message

---

## 6. Type Patterns

### Explicit Return Types

All exported functions MUST have explicit return types:

```typescript
// ✅ CORRECT
export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

// ❌ WRONG — relying on inference for public API
export function isObject(value: unknown) {
```

### Type Guards

Use type predicates (`is Type` return type) for runtime type narrowing:

```typescript
export function isObject(value: unknown): value is Record<string, unknown>
export function isSuccess(response: ToolResponse): response is ToolResponse & { kind: "success" }
```

### Discriminated Unions

Use discriminated union types with `kind` or `status` as the discriminant:

```typescript
export type DelegationStatus =
  | "dispatched"
  | "running"
  | "completed"
  | "error"
  | "timeout"
  | "aborted"
  | "cancelled"
```

### Type-only Imports (verbatimModuleSyntax)

Since `verbatimModuleSyntax: true`, ALL type-only imports MUST use `import type`:

```typescript
import type { PermissionRule } from "./types.js"
import type { HarnessLifecycleManager } from "../task-management/lifecycle/index.js"
```

### No `any` Types

New code must NOT use `any`. Prefer in order:
1. Exact types/interfaces
2. `unknown` with type guards
3. `Record<string, unknown>` for dynamic objects
4. Generics `<T>` for flexible but typed patterns

```typescript
// ✅ CORRECT
function unwrapData<T = unknown>(response: unknown): T

// ❌ WRONG
function unwrapData(response: any): any
```

### Utility Types Pattern

Define reusable type utilities near their usage, not in a central file:

```typescript
// In the consuming file
type MockClient = {
  session: { create: ReturnType<typeof vi.fn>; ... }
}
```

---

## 7. Architecture Rules (Non-Negotiable)

### No Circular Dependencies

- `src/shared/types.ts` is the **root leaf** — imports nothing from `src/` except `coordination/delegation/types.ts`
- Max dependency chain depth: **2 levels** from leaf
- Violations cause build failures and are blocked in code review

### Max Module Size: 500 LOC

- Enforced in code review
- `src/plugin.ts` is the sole exception (~756 LOC)
- If a module grows beyond 500 LOC, split by responsibility

### `[Harness]` Prefix on All Thrown Errors

- Every `throw new Error(...)` from harness code MUST start with `[Harness]`
- This enables consumers to distinguish harness errors from SDK errors

### No `any` Types

- Zero tolerance for new `any` types
- Legacy `any` must be refactored when touched

### Dual-Layer State

- **Durable layer:** JSON files in `.hivemind/state/` via `src/task-management/continuity/`
- **In-memory layer:** Maps in `src/shared/state.ts` via `TaskStateManager`
- Both layers must remain in sync — the durable layer is source of truth across restarts

### Deep-Clone-on-Read

The continuity store deep-clones records on read to prevent mutation aliasing:

```typescript
// Inside continuity/index.ts — deep clone before returning
return JSON.parse(JSON.stringify(record))
```

### State Root Separation (Q6)

- `.hivemind/` = Internal runtime state (journals, lineage, continuity, delegation state)
- `.opencode/` = OpenCode primitives ONLY (agents, skills, commands — configuration, not state)
- **Never store runtime state in `.opencode/`**

### CQRS Boundaries

- **Tools** = Write-side: state mutation, session creation, delegation dispatch
- **Hooks** = Read-side: observation, event handling, response shaping — NO durable writes
- **Hooks cannot perform durable writes** — enforced by `assertHookWriteBoundary()` in `src/hooks/composition/cqrs-boundary.ts`

### Session Lifecycle Phases

```
created → queued → dispatching → running → completed
                                       ↘ failed
```

Valid transitions enforced by `HarnessLifecycleManager` in `src/task-management/lifecycle/index.ts`.

---

## 8. Architecture Patterns (CQRS & 9-Surface)

### CQRS Model
The harness follows a strict Command-Query Responsibility Segregation model:

| Surface | Type | Authority | Examples |
|---------|------|-----------|----------|
| Tools | Write | State mutation | `delegate-task`, `execute-slash-command` |
| Hooks | Read | Observation | `session.created`, `tool.execute.after` |
| Plugin | Assembly | Wiring | `plugin.ts` composition root |
| Shared | Leaf | Contracts | `types.ts`, `helpers.ts` |
| State | In-memory | Runtime | `TaskStateManager` |
| Continuity | Durable | Persistence | `session-continuity.json` |
| Config | Loaded | Settings | `opencode.json`, runtime policy |
| Features | Independent | Capabilities | session-tracker, auto-loop, PTY |
| Schema | Declarative | Validation | Zod schemas in `schema-kernel/` |

### Hook Classification

Hooks fall into three categories (enforced by `classifyHookEffect()`):

| Category | Example | Durable Write Allowed |
|----------|---------|----------------------|
| Response-shaping | `messages.transform`, `shell.env` | ❌ |
| Guard-decision | `tool.execute.before` | ❌ |
| Event-driven | `session.created`, `tool.execute.after` | ❌ (observe only) |

### Delegation Model

WaiterModel delegation with dual-signal completion:

1. **Dispatch** — child session created and prompted
2. **Monitor** — pool for message count stability + completion signals
3. **Detect** — `CompletionDetector` confirms via dual-signal (status + message analysis)
4. **Complete** — result extracted, parent notified

Delegation states: `dispatched → running → completed/error/timeout/aborted/cancelled`

---

## 9. Commit Conventions

### Format

```
type(scope): description — why
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `test` | Test additions or changes |
| `docs` | Documentation only |
| `chore` | Build, CI, tooling, dependencies |
| `discuss` | Planning, research, design discussion |
| `check` | Audit, validation, gate verification |

### Scopes

| Scope | Area |
|-------|------|
| `tools` | Tool implementations (`src/tools/`) |
| `hooks` | Hook factories (`src/hooks/`) |
| `lib` | Shared utilities, types, helpers |
| `schema` | Zod schemas, config validation |
| `cli` | CLI substrate |
| `plugin` | Plugin composition root |
| `coordination` | Delegation, concurrency, completion |
| `continuity` | Session state persistence |
| `trajectory` | Execution lineage tracking |
| `features` | Runtime features (session-tracker, PTY, etc.) |
| `docs` | Documentation files |
| `config` | Configuration, runtime policy |

### Examples

```
feat(tools): add delegation timeout override — prevents orphaned sessions
fix(lib): deep-clone continuity reads — mutation aliasing caused stale state
test(hooks): add auto-loop boundary tests — coverage gap in session hooks
refactor(trajectory): remove unused ledger parameter and fix rawArgs typing
docs(architecture): update component diagram — added 4 new hook factories
chore: update session tracking, workflow states, and add project continuity summary
```

### Atomic Commits Rule

**One logical change = One commit.** Do NOT bundle unrelated changes:
- Each commit must pass `npm run typecheck && npm test`
- No partial build or test failure states
- Commit even document changes atomically
- Branch naming: `feat/your-feature`, `fix/issue-description`, `refactor/module-name`

---

## 10. Documentation Standards

### JSDoc

All exported functions and classes MUST have JSDoc comments:

```typescript
/**
 * Extract a human-readable error message from OpenCode SDK error objects.
 *
 * SDK error structures vary — this function checks all known shapes:
 *   - String error: used as-is
 *   - Named errors (UnknownError, MessageAbortedError): `error.data.message`
 *   - BadRequestError: `error.errors[]` array with `.message` or `.reason`
 *   - Fallback: includes error name if available
 */
function extractSdkErrorMessage(error: unknown): string
```

### Section Comments

Use `// ----------` separator comments for logical grouping within files:

```typescript
// ---------------------------------------------------------------------------
// Session stats
// ---------------------------------------------------------------------------
```

### Inline Comments

- Use `/** */` for documentation
- Use `//` for implementation notes
- Use `// TODO(phase): message` for known gaps
- Use `// HACK: message` for temporary workarounds (with phase reference)
- Use `// PERF: message` for performance-related notes

---

## 11. Anti-Patterns to Avoid

### Code Anti-Patterns

| Anti-Pattern | Why | Correction |
|---|---|---|
| Static `.md` files acting as agent definitions | Creates ambiguity — config belongs in `.opencode/` | Use OpenCode agent YAML/Frontmatter format |
| Bash scripts outside `bin/` | Harder to maintain, test, and audit | Place CLI tools in `bin/` directory |
| Governance scripts that block progression | Scripts should report facts, not judge | Keep scripts pure (exit 0, no governance logic) |
| Feature bloat | Modules over 500 LOC become untestable | Split modules by responsibility |
| Skill proliferation | Too many skills cause context waste | Target ~20 skill files, not hundreds |
| Using `any` type | Disables type checking entirely | Use `unknown` + type guards |
| Skipping `import type` | Compiler error with `verbatimModuleSyntax` | Always use `import type` for type-only |
| Direct `require()` | Breaks ESM module system | Use `import` / `import()` |
| Runtime state in `.opencode/` | Violates Q6 architectural decision | Store state only in `.hivemind/` |
| Hooks performing durable writes | Violates CQRS — hooks are read-only | Use tools for state mutation |
| Circular dependencies | Causes runtime errors, hard to debug | Keep `types.ts` as leaf; enforce dependency direction |

### Delegation Anti-Patterns

| Anti-Pattern | Why | Correction |
|---|---|---|
| Fire-and-forget delegation | Lost sessions, orphaned processes | Always track delegation IDs and monitor |
| No dual-signal completion | False "done" claims from subagents | Use CompletionDetector with status + message analysis |
| Delegation depth > 3 | Unmanageable nesting, context loss | Escalate to user for architectural split |
| Generic agent delegation | Agents lack domain specialization | Always dispatch to named `hm-*`/`hf-*` specialists |
| Cross-lineage confusion | hm-* executing meta-concept work | Route meta-concept tasks to hf-* lineage |

---

## 12. State Management

### TaskStateManager (`src/shared/state.ts`)

In-memory state tracker holding:
- **Session stats:** tool call counts, loop windows, warnings
- **Root budgets:** descendant session limits, reserved slots
- **Session-to-root mapping** for hierarchy traversal
- **Delegation metadata:** root ID, depth, agent, queue key
- **Subagent registrations:** session-to-subagent mapping

Key methods:
```typescript
ensureStats(sessionID): SessionStats
reserveDescendant(rootID, maxDescendants): number
getDelegationMeta(sessionID): DelegationMeta | undefined
registerSubagent(parentSession, subagentSession): void
```

### Continuity Store (`src/task-management/continuity/`)

Durable JSON persistence at `.hivemind/state/session-continuity.json`:
```typescript
recordSessionContinuity(record): void
getSessionContinuity(sessionID): SessionContinuityRecord | undefined
listSessionContinuity(): SessionContinuityRecord[]
patchSessionContinuity(sessionID, patch): void
```

Features:
- Deep-clone-on-read to prevent mutation aliasing
- Automatic quarantine of corrupt files (`*.corrupt-<timestamp>`)
- Transparent migration from legacy paths

### Delegation Persistence (`src/task-management/continuity/delegation-persistence.ts`)

```typescript
persistDelegations(delegations: Map<string, Delegation>): void
readPersistedDelegations(): Delegation[]
```

---

## 13. SDK Integration Patterns

### OpenCode Plugin SDK

The harness implements the `@opencode-ai/plugin` SDK:

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"
```

Plugin structure in `src/plugin.ts`:
1. **Dependency instantiation:** Create all manager/singleton instances
2. **Hook registration:** Wire lifecycle, session, tool guards, observers
3. **Tool registration:** Register all custom tools on the plugin surface
4. **Export:** Return the `Plugin` object

### SDK Client Wrapper (`src/shared/session-api.ts`)

Wraps `@opencode-ai/sdk` with:
- Session validation (`assertValidSessionID`)
- Error unwrapping (`unwrapData`)
- Safe defaults for timeout/polling

```typescript
export async function createSession(client: OpenCodeClient, opts: CreateSessionOptions): Promise<SessionRecord>
export async function sendPrompt(client: OpenCodeClient, sessionID: string, prompt: string): Promise<unknown>
export async function abortSession(client: OpenCodeClient, sessionID: string): Promise<unknown>
```

### Tool Implementation Pattern

Each tool follows a **factory function** pattern:

```typescript
// Factory receives its narrow dependencies
export function createDelegateTaskTool(
  manager: DelegationManager,
): Tool {
  return tool({
    name: "delegate-task",
    description: "Delegate work to a specialist agent",
    parameters: DelegateTaskInputSchema,
    execute: async (args, ctx) => {
      // 1. Validate inputs
      // 2. Call manager/domain logic
      // 3. Return ToolResponse
    },
  })
}
```

### Hook Factory Pattern

Each hook follows a **factory function** pattern:

```typescript
export function createCoreHooks(deps: HookDependencies) {
  return {
    "lifecycle.phase.change": async (event) => { ... },
    "session.created": async (event) => { ... },
  }
}
```

---
