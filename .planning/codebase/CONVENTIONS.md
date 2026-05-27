# Code Conventions

**Generated:** 2026-05-26

## Overview

This codebase follows strict TypeScript conventions with a focus on type safety, modularity, and maintainability. The project uses ESLint with TypeScript strict mode, Prettier for formatting, and follows a domain-driven modular architecture.

## Tech Stack

- **Language:** TypeScript 5.0+
- **Target:** ES2022
- **Build Tool:** TypeScript compiler (tsc)
- **Test Framework:** Vitest 4.1.7
- **Type Validation:** Zod 4.4.3
- **Package Manager:** npm

## Code Style

### Linter and Formatter

- **TypeScript Compiler Options:**
  - `src/tsconfig.json` defines strict mode with `strict: true`
  - `noUnusedLocals: true` - no unused local variables
  - `noUnusedParameters: true` - no unused parameters
  - `noImplicitReturns: true` - all code paths must return
  - `noFallthroughCasesInSwitch: true` - no fallthrough in switches
  - `verbatimModuleSyntax: true` - explicit import type for type-only imports

### File Extensions

- Source files use `.ts` extension (no `.tsx` detected in this backend-focused codebase)
- Test files use `.test.ts` convention

### Naming Conventions

#### Files and Directories

```
Directory pattern: lowercase-with-hyphens
- coordination/delegation/
- task-management/continuity/
- features/session-tracker/

File pattern: lowercase-with-hyphens
- session-tracker.ts
- delegation-manager.ts
- pty-runtime.ts
```

#### Variables and Constants

```typescript
// camelCase for variables and functions
const sessionID: string
let rootBudget: RootBudget

// UPPER_SNAKE_CASE for constants
export const MAX_DESCENDANTS_PER_ROOT = 10
export const SESSION_TRACKER_MAX_DEPTH = 7
```

#### Functions and Methods

```typescript
// camelCase, imperative mood (verb-based names)
function ensureStats(sessionID: string): SessionStats
function extractSdkErrorMessage(error: unknown): string
function unwrapData<T = unknown>(response: unknown): T
function getNestedValue(value: unknown, path: string[]): unknown
```

#### Classes and Components

Classes use PascalCase and follow a single-responsibility principle:

```typescript
export class TaskStateManager {
  private rootBudgets: Map<string, RootBudget>
  private sessionStats: Map<string, SessionStats>
  
  constructor() {
    this.rootBudgets = new Map()
    this.sessionStats = new Map()
  }
}

export class DelegationManager {
  private delegations: Map<string, DelegationRecord>
}
```

#### Type Definitions

```typescript
// PascalCase for types, interfaces, and type aliases
export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed"
export interface PermissionRule {
  permission: string
  pattern: string
  action: PermissionAction
}
export type PendingNotification = TaskNotification & {
  createdAt: number
  delivered: boolean
}
```

## Import Organization

### Module Structure

Imports follow a consistent order within files:

```typescript
import type { DelegationMeta } from "../types.js"  // Type imports first
import { TaskStateManager } from "../state.js"     // Named imports second

// Default imports would follow (none detected in this codebase)
```

### File Organization Pattern

```
src/
├── index.ts                          # Entry point re-exports
├── shared/                           # Leaf utilities and types
│   ├── types.ts                      # Shared type definitions
│   ├── helpers.ts                    # Utility functions
│   └── security/                      # Security utilities
├── tools/                            # Tool entrypoints
├── coordination/                      # Delegation and concurrency
├── task-management/                   # Session state management
├── config/                            # Configuration workflow
├── features/                          # Runtime features
└── schema-kernel/                     # Zod schemas
```

## Module Design

### Barrel Files Pattern

Barrel files use index.ts to re-export modules:

```typescript
// src/index.ts
export type { TaskStatus, TaskNotification } from "./shared/types.js"
export { TaskStateManager } from "./shared/state.js"
export { HarnessControlPlane } from "./plugin.js"

// src/shared/index.ts
export * from "./types.js"
export * from "./helpers.js"
```

### Single Responsibility Pattern

Each module has a single, well-defined responsibility:

- `src/shared/types.ts` - Type definitions only
- `src/shared/helpers.ts` - Utility functions only
- `src/shared/state.ts` - Task state management only
- `src/task-management/continuity/index.ts` - Session persistence only

### Module Size Constraints

- Maximum module size: 500 lines of code
- This keeps modules maintainable and testable

## Error Handling

### Error Types and Structures

Errors follow a consistent pattern with harness prefix:

```typescript
// In src/shared/helpers.ts
throw new Error(`[Harness] ${message}`)
```

### Try-Catch Patterns

Errors are caught and re-thrown with context:

```typescript
try {
  const result = await tool.execute(args, context)
  return result
} catch (error) {
  const message = extractSdkErrorMessage(error)
  throw new Error(`[Harness] ${message}`)
}
```

### Error Propagation

- Errors propagate up the call chain without silent swallowing
- SDK errors are extracted and re-wrapped with `[Harness]` prefix
- Type guards check for error structures before processing

## Type Safety

### Strict Mode

TypeScript strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true
  }
}
```

### Type Inference

```typescript
// Type inference with z.infer
export type PromptSkimResult = z.infer<typeof PromptSkimResultSchema>
export type PromptAnalysisFinding = z.infer<typeof PromptAnalysisFindingSchema>
```

### Discriminated Unions

```typescript
export interface Response {
  kind: "success" | "error"
  data?: Data
  error?: string
}
```

## Code Organization

### File Naming

- Underscores in function names for internal/private methods (when applicable)
- Hyphens in file/directory names
- PascalCase for classes and types

### Directory Grouping

```
src/
├── tools/                    # Tool entrypoints (MCP tools)
│   ├── delegation/          # Delegation tools
│   ├── session/             # Session tools
│   └── prompt/              # Prompt tools
├── coordination/             # Delegation and concurrency
├── task-management/          # Session state and lifecycle
├── config/                   # Configuration workflow
├── features/                 # Runtime features
└── schema-kernel/            # Zod schemas
```

## Testing Conventions

### Test File Naming

- Format: `{test-target}.test.ts`
- Location: `tests/` directory mirrors `src/` structure

### Test Organization

```
tests/
├── lib/                       # Unit tests
├── integration/               # Integration tests
├── sidecar/                   # Sidecar component tests
└── features/                  # Feature-specific tests
```

## Documentation Standards

### JSDoc Comments

Functions should include JSDoc with:
- Description of purpose
- Parameter types and descriptions
- Return type description
- Examples when helpful

```typescript
/**
 * Extract a human-readable error message from OpenCode SDK error objects.
 *
 * SDK error structures vary — this function checks all known shapes:
 *   - String error: used as-is
 *   - Named errors: error.data.message
 *   - BadRequestError: error.errors[] array
 *
 * @param error - The error object to extract message from
 * @returns Human-readable error message string
 */
function extractSdkErrorMessage(error: unknown): string {
  // ...
}
```

## Special Conventions

### Harness Prefix

All harness-related errors use `[Harness]` prefix to indicate source:

```typescript
throw new Error(`[Harness] ${message}`)
```

### Session Naming

Sessions use camelCase with descriptive names:

```typescript
export const DELEGATION_MANAGER_KEY = "default"
export const SESSION_TRACKER_MAX_DEPTH = 7
```

### Type Guards

Type guards are used extensively for runtime type checking:

```typescript
export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}
```

---

*Convention analysis: 2026-05-26*
