# C8 Foundation — Pattern Document

**Analysis Date:** 2026-06-06
**Cluster:** C8 — Foundation
**Phase:** AUDIT-04 (Legacy Phase Audit)

---

## 1. Design Patterns to Follow

### 1.1 Module Extraction Pattern (for plugin.ts split)

**Pattern:** Extract self-contained function groups into dedicated modules, keeping the composition root as the orchestrator.

**Existing Example — `src/shared/helpers.ts`:**
```typescript
// helpers.ts exports pure functions with no cross-cluster imports
export function isObject(value: unknown): value is Record<string, unknown> { ... }
export function unwrapData<T>(response: unknown): T | undefined { ... }
export function stableStringify(obj: unknown): string { ... }
```

**Target Pattern for plugin-registration.ts:**
```typescript
// plugin-registration.ts — extracted registration functions
import type { Client } from "@opencode-ai/plugin"
import type { DelegationManager } from "../coordination/delegation/manager.js"

export function registerDelegationTools(client: Client, deps: DelegationModuleSetupOptions): void {
  // ... tool registration logic
}

export function registerSessionTools(client: Client, deps: DelegationModuleSetupOptions): void {
  // ... tool registration logic
}
```

**Target Pattern for one-shot-migrations.ts:**
```typescript
// one-shot-migrations.ts — extracted migration functions
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export async function migrateLegacyEventTracker(client: Client, stateDir: string): Promise<void> {
  const sentinel = join(stateDir, ".event-tracker-migrated")
  if (existsSync(sentinel)) return
  // ... migration logic
}
```

**Anti-pattern to Avoid:**
- Do NOT pass the entire `HarnessControlPlane` instance to registration functions — pass only the specific dependencies they need
- Do NOT create circular dependencies between `plugin.ts` and `plugin-registration.ts`

---

### 1.2 Leaf Module Pattern (for session-api decoupling)

**Pattern:** Foundation modules should have zero cross-cluster imports. They provide shared contracts that other clusters consume.

**Existing Example — `src/shared/session-naming.ts`:**
```typescript
// session-naming.ts — pure logic, zero imports from other clusters
export function generateSessionTitle(input: NamingInput): string { ... }
export function parseSessionTitle(title: string): ParsedNaming { ... }
```

**Target Pattern for session-api.ts after SR-01:**
```typescript
// session-api.ts — leaf module, imports only from shared/ and node:*
import { asString } from "./helpers.js"
import { generateSessionTitle, parseSessionTitle } from "./session-naming.js"
// NO imports from routing/, coordination/, hooks/, etc.
```

**Anti-pattern to Avoid:**
- Do NOT create a new shared wrapper for `resolveBehavioralProfile` — have C4 import directly from C1
- Do NOT move `getSessionBehavioralProfile` to a different shared file — it adds zero value

---

### 1.3 Typed Error Pattern (for Phase 34)

**Pattern:** All harness errors extend a base class with machine-readable properties.

**Existing Example — `src/shared/errors/commands.ts`:**
```typescript
export class CommandNotFoundError extends Error {
  readonly name = "CommandNotFoundError"
  constructor(command: string) {
    super(`[Harness] Command not found: ${command}`)
  }
}
```

**Target Pattern — HarnessError base class:**
```typescript
export class HarnessError extends Error {
  readonly code: string
  readonly cluster: string
  readonly module: string

  constructor(params: { code: string; cluster: string; module: string; message: string }) {
    super(`[Harness] ${params.message}`)
    this.code = params.code
    this.cluster = params.cluster
    this.module = params.module
    this.name = "HarnessError"
  }
}

// Specialized errors extend HarnessError
export class CommandNotFoundError extends HarnessError {
  constructor(command: string) {
    super({
      code: "COMMAND_NOT_FOUND",
      cluster: "C1",
      module: "resolve-command",
      message: `Command not found: ${command}`,
    })
  }
}
```

**Anti-pattern to Avoid:**
- Do NOT create error classes without `code`, `cluster`, `module` properties
- Do NOT use `throw new Error(...)` without `[Harness]` prefix

---

### 1.4 Tool Response Envelope Pattern

**Pattern:** All tools return a `ToolResponse<T>` envelope with `kind`, `data`, and optional `error`.

**Existing Example — `src/shared/tool-response.ts`:**
```typescript
export type ToolResponse<T> =
  | { kind: "success"; data: T }
  | { kind: "error"; error: string }
  | { kind: "pending"; message?: string }

export function success<T>(data: T): ToolResponse<T> {
  return { kind: "success", data }
}

export function error(message: string): ToolResponse<never> {
  return { kind: "error", error: message }
}
```

**Usage Pattern (from any tool):**
```typescript
import { success, error } from "../../shared/tool-response.js"
import { renderToolResult } from "../../shared/tool-helpers.js"

const result = await doSomething()
if (!result.ok) {
  return renderToolResult(error(result.message))
}
return renderToolResult(success(result.data))
```

---

### 1.5 State Singleton Pattern

**Pattern:** Module-level singleton with `clear()` method for test isolation.

**Existing Example — `src/shared/state.ts`:**
```typescript
export class TaskStateManager {
  private rootBudgets = new Map<string, number>()
  // ...

  clear(): void {
    this.rootBudgets.clear()
    // ... clear all maps
  }
}

export const taskState = new TaskStateManager()
```

**Test Pattern:**
```typescript
import { taskState } from "../../shared/state.js"

afterEach(() => {
  taskState.clear()
})
```

**Anti-pattern to Avoid:**
- Do NOT forget `taskState.clear()` in `afterEach` — causes test pollution
- Do NOT create additional singletons — use the existing `taskState`

---

## 2. Anti-Patterns to Avoid

### 2.1 Cross-Cluster Import from Foundation

**What happens:** A `src/shared/` module imports from `src/routing/`, `src/coordination/`, `src/hooks/`, or any other cluster.

**Why it's wrong:** Foundation modules should be leaf nodes. Cross-cluster imports create fragile coupling and make the shared layer dependent on implementation details.

**Do this instead:** Have the consuming cluster (C4, C5, etc.) import directly from the source cluster. Remove the wrapper function from the shared module.

**Example (the violation to fix):**
```typescript
// ❌ WRONG — src/shared/session-api.ts imports from C1 routing
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"

export function getSessionBehavioralProfile(client: Client) {
  return resolveBehavioralProfile(client)  // zero value wrapper
}
```

```typescript
// ✅ CORRECT — C4 imports directly from C1
// src/hooks/lifecycle/core-hooks.ts
import { resolveBehavioralProfile } from "../../routing/behavioral-profile/resolve-behavioral-profile.js"
```

---

### 2.2 Wildcard Re-exports in Public API

**What happens:** `src/index.ts` uses `export * from "./some-module.js"` which exposes ALL exported symbols.

**Why it's wrong:** Internal types, classes, and functions become part of the public npm contract. Removing them later is a breaking change.

**Do this instead:** Use explicit re-exports:
```typescript
// ❌ WRONG
export * from "./coordination/concurrency/queue.js"

// ✅ CORRECT
export { Queue } from "./coordination/concurrency/queue.js"
export type { QueueOptions } from "./coordination/concurrency/queue.js"
```

---

### 2.3 `as any` Casts

**What happens:** Code uses `as any` to bypass TypeScript type safety.

**Why it's wrong:** SDK type changes silently break runtime behavior. No compiler error, no test failure, just runtime misbehavior.

**Do this instead:** Define proper type narrowing or use `unknown` with runtime checks:
```typescript
// ❌ WRONG
const result = await (client as any).session.prompt(...)

// ✅ CORRECT
const sessionClient = client.session as { prompt?: (...args: unknown[]) => unknown }
if (typeof sessionClient.prompt === "function") {
  const result = await sessionClient.prompt(...)
}
```

---

### 2.4 Module-Level Mutable State Without Documentation

**What happens:** A module exports a mutable singleton without documenting the shared-state implications.

**Why it's wrong:** Test suites that import the module share state. If test A mutates the singleton, test B sees the mutation.

**Do this instead:** Document the singleton pattern and provide a `clear()` method:
```typescript
/**
 * @singleton Process-wide state manager. Call `clear()` in test `afterEach` blocks
 * to prevent test pollution.
 */
export const taskState = new TaskStateManager()
```

---

### 2.5 Dead Types in Shared Contracts

**What happens:** Types are exported from `types.ts` but never imported by any runtime module.

**Why it's wrong:** Bloats the file, confuses developers, and creates false dependencies.

**Do this instead:** Remove dead types. If a type is needed in the future, it can be re-added:
```typescript
// ❌ WRONG — exporting types with zero consumers
export type SessionPromptParams = { ... }
export type HarnessStatus = "active" | "inactive" | "error"

// ✅ CORRECT — only export types that are actually used
export type SessionContinuityRecord = { ... }  // 28 consumers
export type RuntimePolicy = { ... }  // 4 consumers
```

---

## 3. Code Examples from Existing Codebase

### 3.1 Clean Module — `src/shared/app-api.ts` (24 LOC)

```typescript
import type { Client } from "@opencode-ai/plugin"

export async function getAppAgents(client: Client): Promise<AgentInfo[]> {
  const response = await client.app.agents()
  if (Array.isArray(response)) return response
  if (response && typeof response === "object" && "agents" in response) {
    return (response as { agents: AgentInfo[] }).agents
  }
  return []
}
```

**Why it's clean:**
- Single responsibility
- 24 LOC
- 4 consumers
- Defensive response handling
- No cross-cluster imports

---

### 3.2 Clean Security Module — `src/shared/security/redaction.ts` (118 LOC)

```typescript
const SENSITIVE_FIELD_PATTERN = /api[_-]?key|token|password|secret|authorization|credential/i
const DEFAULT_PRESERVE_FIELDS = new Set(["auth_type", "token_type", ...])

export function redactBoundaryFields(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj
  // ... recursive redaction logic
}
```

**Why it's clean:**
- Clear pattern matching
- Deterministic placeholders
- Immutable (returns new object)
- Set-based field preservation

---

### 3.3 Tool Registration Pattern — `src/plugin.ts` (current)

```typescript
function registerDelegationTools(
  client: Client,
  delegationManager: DelegationManager,
  // ... other deps
): void {
  client.tool.register({
    name: "delegate-task",
    description: "Delegate a task to a subagent",
    handler: async (args) => {
      const result = await delegationManager.ensureDispatch(args)
      return renderToolResult(result)
    },
  })
}
```

**Target after split:** Same pattern, but in `plugin-registration.ts` with explicit dependency injection.

---

## 4. Integration Patterns with Other Clusters

### 4.1 C8 → C3 Integration (Types Re-export)

**Pattern:** C8 re-exports C3 types for backward compatibility.

```typescript
// src/shared/types.ts (L370-399)
// Backward compatibility bridge — these types were moved to C3 but remain
// re-exported here to avoid breaking npm consumers.
export { DelegationStatus, POLL_INTERVAL_* } from "../coordination/delegation/types.js"
```

**Constraint:** Do NOT add new re-exports. The existing re-exports are a backward-compat bridge only.

---

### 4.2 C8 → C5 Integration (Tool Response)

**Pattern:** Every tool imports `success()`, `error()` from `tool-response.ts` and `renderToolResult()` from `tool-helpers.ts`.

```typescript
// Any tool file
import { success, error } from "../../shared/tool-response.js"
import { renderToolResult } from "../../shared/tool-helpers.js"

export function createMyTool(client: Client) {
  return {
    name: "my-tool",
    handler: async (args: MyArgs) => {
      try {
        const result = await doWork(args)
        return renderToolResult(success(result))
      } catch (e) {
        return renderToolResult(error(describeError(e)))
      }
    },
  }
}
```

---

### 4.3 C8 → C2 Integration (State + Continuity)

**Pattern:** C2 modules import `taskState` singleton from C8 for in-process state, and `path-scope` for file security.

```typescript
// C2 continuity module
import { taskState } from "../../shared/state.js"
import { assertPathWithinRoot } from "../../shared/security/path-scope.js"

export async function writeContinuity(sessionId: string, data: ContinuityData) {
  assertPathWithinRoot(dataPath, rootDir)
  taskState.setDelegationMeta(sessionId, data.meta)
  // ... write to disk
}
```

---

*Pattern document: 2026-06-06 — patterns derived from existing codebase and locked C8 decisions*
