# C8 Foundation — Research Document

**Analysis Date:** 2026-06-06
**Cluster:** C8 — Foundation
**Phase:** AUDIT-04 (Legacy Phase Audit)

---

## 1. Best Practices for Plugin Decomposition

### 1.1 Composition Root Splitting Strategy

**Research Source:** Clean Architecture principles, plugin.ts analysis

The composition root (`plugin.ts`) is the most cross-cutting file by design — it imports from every cluster to wire them together. The challenge is splitting it without creating circular dependencies.

**Recommended Approach:**

1. **Extract by lifecycle phase:**
   - **Registration phase** (tool registration): Self-contained functions that receive dependencies as parameters
   - **Migration phase** (one-shot migrations): Side effects that run once at startup
   - **Composition phase** (HarnessControlPlane): The factory that orchestrates everything

2. **Dependency injection pattern:**
   ```typescript
   // plugin.ts imports plugin-registration.ts
   import { registerDelegationTools, registerSessionTools } from "./plugin-registration.js"
   
   // plugin.ts passes dependencies to registration functions
   registerDelegationTools(client, { delegationManager, completionDetector, ... })
   ```

3. **Avoid circular dependencies:**
   - `plugin.ts` → `plugin-registration.ts` (one direction)
   - `plugin.ts` → `one-shot-migrations.ts` (one direction)
   - `plugin-registration.ts` → `plugin.ts` (NEVER)

**Reference Implementations:**
- Next.js `createServer()` pattern — composition root delegates to factory functions
- Express `app.use()` pattern — middleware registration is separate from app creation

### 1.2 Module Size Targets

| Module | Current LOC | Target LOC | Strategy |
|--------|-------------|------------|----------|
| `plugin.ts` | 1,076 | ~200 | Keep only factory + setup |
| `plugin-registration.ts` | — | ~600 | Extract 4 registration functions |
| `one-shot-migrations.ts` | — | ~276 | Extract 2 migration functions |

**Total:** 1,076 → 1,076 (same LOC, better organization)

---

## 2. Error Taxonomy Patterns

### 2.1 HarnessError Base Class Design

**Research Source:** Node.js Error class, TypeScript error patterns

**Design Requirements:**
- Machine-readable `code` field for programmatic handling
- `cluster` field for cross-cluster debugging
- `module` field for precise location identification
- `[Harness]` prefix for log filtering
- TUI-safe suppression (internal errors don't surface to users)

**Recommended Implementation:**

```typescript
export class HarnessError extends Error {
  readonly code: string
  readonly cluster: string
  readonly module: string

  constructor(params: {
    code: string
    cluster: string
    module: string
    message: string
    cause?: Error
  }) {
    super(`[Harness] ${params.message}`, { cause: params.cause })
    this.code = params.code
    this.cluster = params.cluster
    this.module = params.module
    this.name = "HarnessError"
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      cluster: this.cluster,
      module: this.module,
      message: this.message,
      stack: this.stack,
    }
  }
}
```

**Error Code Taxonomy:**

| Prefix | Cluster | Example |
|--------|---------|---------|
| `C1-*` | Governance | `C1-COMMAND-NOT-FOUND` |
| `C2-*` | Task Mgmt | `C2-CONTINUITY-READ-FAILED` |
| `C3-*` | Coordination | `C3-DELEGATION-TIMEOUT` |
| `C4-*` | Hooks | `C4-HOOK-EXECUTION-FAILED` |
| `C5-*` | Tools | `C5-TOOL-VALIDATION-FAILED` |
| `C8-*` | Foundation | `C8-SESSION-API-ERROR` |

### 2.2 Existing Error Classes

**Current state (`src/shared/errors/commands.ts`):**
```typescript
export class CommandNotFoundError extends Error {
  readonly name = "CommandNotFoundError"
  constructor(command: string) {
    super(`Command not found: ${command}`)
  }
}
// ... 4 more similar classes
```

**Migration path:** Extend `HarnessError` instead of `Error`:
```typescript
export class CommandNotFoundError extends HarnessError {
  constructor(command: string) {
    super({
      code: "C1-COMMAND-NOT-FOUND",
      cluster: "C1",
      module: "resolve-command",
      message: `Command not found: ${command}`,
    })
  }
}
```

---

## 3. TUI-Safe Logging Patterns

### 3.1 Current State

**Problem:** 56/125 `throw new Error(...)` sites lack `[Harness]` prefix. When these errors propagate to the TUI, they appear as generic errors with no context about which cluster or module originated them.

**Current error flow:**
```
Tool execution → throw new Error("session not found")
  → plugin.ts catches → shows in TUI toast
  → User sees "session not found" with no cluster context
```

### 3.2 Recommended Pattern

**TUI-safe error suppression:**
```typescript
// In plugin.ts or hook layer
try {
  await toolExecution()
} catch (error) {
  if (error instanceof HarnessError) {
    // Log internally — don't show in TUI
    client.app.log({
      level: "error",
      message: error.message,
      data: error.toJSON(),
    })
  } else {
    // Non-harness errors — show in TUI (user-facing)
    throw error
  }
}
```

**Log level mapping:**

| Error Type | TUI | Internal Log | User Notification |
|------------|-----|--------------|-------------------|
| `HarnessError` (internal) | ❌ Suppress | ✅ `client.app.log` | ❌ No |
| User-facing error | ✅ Show | ✅ `client.app.log` | ✅ Yes |
| SDK error | ✅ Show | ✅ `client.app.log` | ✅ Yes |

### 3.3 Logging Best Practices

**DO:**
- Use `client.app.log()` for structured logging
- Include `cluster`, `module`, `code` in log data
- Use appropriate log levels (`error`, `warn`, `info`, `debug`)

**DON'T:**
- Use `console.error()` / `console.warn()` (unstructured, not filterable)
- Show internal harness errors in TUI toast
- Log sensitive data (use `redactTextSecrets()` from `security/redaction.ts`)

---

## 4. Reference Implementations

### 4.1 Plugin Split — Express.js Pattern

**Reference:** Express.js `app.js` + `routes/` + `middleware/` separation

```
app.js (composition root)
  ├── imports routes/index.js (registration)
  ├── imports middleware/auth.js (guards)
  └── creates and configures Express app
```

**Applicable to Hivemind:**
```
plugin.ts (composition root)
  ├── imports plugin-registration.ts (tool registration)
  ├── imports one-shot-migrations.ts (startup side effects)
  └── creates and configures HarnessControlPlane
```

### 4.2 Error Taxonomy — NestJS Pattern

**Reference:** NestJS `HttpException` hierarchy

```typescript
// NestJS pattern
class HttpException extends Error {
  constructor(
    private readonly response: string | object,
    private readonly status: number,
  ) {
    super()
  }
}

class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(message || "Not Found", 404)
  }
}
```

**Applicable to Hivemind:**
```typescript
// Hivemind pattern
class HarnessError extends Error {
  constructor(params: { code: string; cluster: string; module: string; message: string }) {
    super(`[Harness] ${params.message}`)
  }
}

class CommandNotFoundError extends HarnessError {
  constructor(command: string) {
    super({ code: "C1-COMMAND-NOT-FOUND", cluster: "C1", module: "resolve-command", message: `Command not found: ${command}` })
  }
}
```

### 4.3 State Singleton — Vitest Pattern

**Reference:** Vitest `beforeEach`/`afterEach` for state isolation

```typescript
// Vitest pattern
import { taskState } from "../../shared/state.js"

beforeEach(() => {
  taskState.clear()
})

afterEach(() => {
  taskState.clear()
})
```

**Verification:** Check all test files that import `taskState` call `clear()`:
```bash
grep -rn "taskState" tests/ --include="*.ts" -l
# For each file, verify clear() is called in afterEach
```

### 4.4 Tool Response Envelope — OpenCode SDK Pattern

**Reference:** OpenCode SDK tool handler return type

```typescript
// OpenCode SDK expects tools to return:
// { content: [{ type: "text", text: string }] }

// Hivemind wraps this with ToolResponse<T>
const result: ToolResponse<MyData> = success(data)
return renderToolResult(result)
// → { content: [{ type: "text", text: JSON.stringify(data) }] }
```

---

## 5. Cross-Cluster Reference Patterns

### 5.1 C8 as Foundation Hub

**Current state:** C8 provides 125 imports to all other clusters. This is by design — the shared layer is the foundation.

**Key insight:** C8 should be a **provider**, not a **consumer**. After SR-01, C8 will have zero cross-cluster imports (leaf-only).

**Dependency direction:**
```
C1, C2, C3, C4, C5, C7 → C8 (consume shared modules)
C8 → (nothing — leaf module)
```

### 5.2 Module Cap Compliance

**Project rule:** Max 500 LOC per module

**Files exceeding cap:**
| File | LOC | Over | Strategy |
|------|-----|------|----------|
| `plugin.ts` | 1,076 | 115% | Split into 3 files |
| `session-api.ts` | 432 | 86% | Monitor, split if needed |

**Split criteria:**
1. Self-contained function group with clear boundary
2. No circular dependency risk
3. ≥ 100 LOC to extract (otherwise not worth a new file)

### 5.3 Test Coverage for Security Modules

**Current state:** `path-scope.ts` (5 test cases) and `redaction.ts` (4 test cases) have minimal coverage.

**Recommended additional test cases:**

**path-scope.ts:**
- TOCTOU race condition (symlink created between check and write)
- Unicode path escapes (e.g., `..%2F`, `%2e%2e/`)
- Deep nesting (10+ levels)
- Symlink chains (A → B → C → escape)
- Case-insensitive filesystem boundary crossing

**redaction.ts:**
- Mixed-case key patterns (`myApiKey`, `MyAPIToken`)
- URL-encoded secrets (`api_key%3Dsk-...`)
- Nested JSON field redaction
- Large payload performance (10KB+ JSON)
- `DEFAULT_PRESERVE_FIELDS` edge cases

---

## 6. Timing and Effort Estimates

| Task | Estimated Effort | Complexity |
|------|-----------------|------------|
| plugin.ts split (Phase 33) | 4-6 hours | Medium — requires careful dependency wiring |
| session-api extraction (SR-01) | 1 hour | Low — remove function + update C4 import |
| Dead code cleanup (Phase 35) | 1-2 hours | Low — delete types + verify compilation |
| HarnessError base class (Phase 34) | 2-3 hours | Medium — design + migrate existing errors |
| Error prefix audit (Phase 34) | 1-2 hours | Low — grep + find/replace |
| TUI-safe suppression (Phase 34) | 1 hour | Low — catch + log pattern |
| Journal write path (SR-02) | 1-2 hours | Low — wire existing functions |

**Total C8 effort:** 11-17 hours across all phases

---

*Research document: 2026-06-06 — best practices and reference implementations for C8 Foundation cluster*
