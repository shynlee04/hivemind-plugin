# Coding Conventions

> Generated: 2026-02-28 | Source: src/ (~120 source files, ~14 tool files, ~11 hook files, ~60 lib files, ~14 schema files)

## File Naming

**Pattern:** kebab-case for all source files.

**Source files:** `kebab-case.ts`
- `src/tools/hivemind-session.ts`
- `src/lib/hierarchy-tree.ts`
- `src/lib/session-engine.ts`
- `src/schemas/brain-state.ts`
- `src/hooks/session-lifecycle.ts`

**Test files:** `kebab-case.test.ts` — test files mirror source names with `.test.ts` suffix, located in `tests/` (separate from source):
- `tests/tool-gate.test.ts` (tests `src/hooks/tool-gate.ts`)
- `tests/hierarchy-tree.test.ts` (tests `src/lib/hierarchy-tree.ts`)
- `tests/schemas.test.ts` (tests `src/schemas/brain-state.ts` + `hierarchy.ts`)
- Subdirectories mirror source: `tests/code-intel/` → `src/lib/code-intel/`, `tests/hooks/` → `src/hooks/`, `tests/lib/` → `src/lib/`

**TSX files (dashboard):** PascalCase for React components:
- `src/dashboard-v2/src/panels/TimeTravelPanel.tsx`
- `src/dashboard-v2/src/components/HelpOverlay.tsx`

**Inconsistency:** One directory uses snake_case: `src/hooks/session_coherence/` and `src/lib/session_coherence.ts` — the rest of the codebase uses kebab-case exclusively.

## Import & Export Patterns

### Import Extensions

**ALL local imports MUST use `.js` extension** — required by `"module": "NodeNext"` in `tsconfig.json`:

```typescript
// CORRECT — every import from local modules uses .js
import { createStateManager } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import type { BrainState } from "../schemas/brain-state.js"

// WRONG — will fail TypeScript compilation
import { createStateManager } from "../lib/persistence"
```

Evidence: `src/tools/hivemind-session.ts:1-24`, `src/hooks/session-lifecycle.ts:13-38`, `src/hooks/tool-gate.ts:1-11`

### Import Ordering

Consistent 3-group pattern observed across all files:

1. **External packages** (node builtins and npm packages)
2. **Internal library imports** (`../lib/`, `../schemas/`)
3. **Sibling imports** (`./`)

```typescript
// Group 1: External
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"

// Group 2: Internal (cross-layer)
import { getEffectivePaths } from "../lib/paths.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

// Group 3: Sibling / same-layer
import { createSessionLifecycleHook } from "./session-lifecycle.js"
```

Evidence: `src/tools/hivemind-codemap.ts:13-36`, `src/index.ts:37-69`

### Export Patterns

**Named exports exclusively.** Only ONE default export exists in the entire codebase:

```typescript
// src/index.ts:186
export default HiveMindPlugin
```

Every other module uses named exports:

```typescript
export function createHivemindSessionTool(directory: string): ToolDefinition { ... }
export function createSessionLifecycleHook(log: Logger, ...) { ... }
export const BRAIN_STATE_VERSION = "1.0.0"
export type SessionMode = "plan_driven" | "quick_fix" | "exploration"
export interface BrainState { ... }
```

### Barrel Exports

Every directory has an `index.ts` barrel file:

- `src/index.ts` — package entry point (plugin factory)
- `src/tools/index.ts` — re-exports all tool factory functions
- `src/hooks/index.ts` — re-exports all hook factory functions
- `src/lib/index.ts` — re-exports public library functions
- `src/schemas/index.ts` — re-exports all schemas

**Pattern:** Tools and hooks barrel use named re-exports:
```typescript
export { createHivemindSessionTool } from "./hivemind-session.js"
```

**Pattern:** Lib and schemas barrel use wildcard re-exports:
```typescript
export * from "./logging.js";
export * from "./persistence.js";
```

Evidence: `src/tools/index.ts`, `src/hooks/index.ts`, `src/lib/index.ts`, `src/schemas/index.ts`

### Path Aliases

**None.** All imports use relative paths (`../lib/`, `../schemas/`, `./`). No `paths` or `baseUrl` configured in `tsconfig.json`.

## Naming Conventions

### Functions & Variables

**Functions:** camelCase, typically verb-prefixed:
- `create*` — factory functions: `createBrainState()`, `createStateManager()`, `createSessionLifecycleHook()`, `createHivemindSessionTool()`
- `load*` / `save*` — I/O operations: `loadAnchors()`, `saveAnchors()`, `loadTree()`, `saveTree()`, `loadConfig()`
- `is*` / `has*` / `should*` — boolean predicates: `isSessionLocked()`, `isSessionStale()`, `shouldSuggestCommit()`, `shouldAutoCommit()`
- `detect*` — detection: `detectChainBreaks()`, `detectBrownfield()`, `detectLongSession()`
- `build*` — constructors: `buildSessionFilename()`, `buildGovernanceSignals()`
- `handle*` — private action handlers: `handleSave()`, `handleList()`, `handleGet()`, `handleScan()`
- `to*` — converters: `toSuccessOutput()`, `toErrorOutput()`, `toAsciiTree()`, `toBrainProjection()`

**Variables:** camelCase for local variables:
```typescript
const stateManager = createStateManager(directory)
const effectiveDir = worktree || directory
const configPath = getEffectivePaths(directory).config
```

**Parameters:** camelCase. Unused parameters prefixed with underscore:
```typescript
async execute(args, _context) { ... }
export function createSoftGovernanceHook(log: Logger, directory: string, _initConfig: HiveMindConfig) { ... }
```

Evidence: `src/tools/hivemind-anchor.ts:39`, `src/hooks/soft-governance.ts:227-230`

### Types & Interfaces

**Types:** PascalCase with descriptive suffixes:
```typescript
export type SessionMode = "plan_driven" | "quick_fix" | "exploration"
export type GovernanceStatus = "LOCKED" | "OPEN"
export type GovernanceMode = "permissive" | "assisted" | "strict"
export type ToolCategory = "read" | "write" | "query" | "governance"
export type FieldLifecycle = "runtime" | "persistent" | "hybrid"
```

**Interfaces:** PascalCase, typically `*State`, `*Config`, `*Result`, `*Options`:
```typescript
export interface BrainState { ... }
export interface SessionState { ... }
export interface MetricsState { ... }
export interface HiveMindConfig { ... }
export interface StateManager { ... }
export interface ToolGateResult { ... }
export interface Logger { ... }
```

Evidence: `src/schemas/brain-state.ts:11-177`, `src/schemas/config.ts:230-252`

### Constants

**UPPER_CASE** for true constants and configuration values:
```typescript
export const BRAIN_STATE_VERSION = "1.0.0"
export const STRUCTURE_VERSION = "2.0.0"
export const HIVEMIND_DIR = ".hivemind"
export const MAX_CYCLE_LOG = 10
export const FAILURE_KEYWORDS = ["failed", "failure", ...] as const
const INJECTION_BUDGET_CHARS = 12000
const MS_PER_DAY = 86_400_000
```

**PascalCase** for `Set` and `Map` constants (treated as static lookup tables):
```typescript
const EXEMPT_TOOLS = new Set(["read", "glob", "grep", ...])
const WRITE_TOOLS = new Set(["write", "edit", "bash", ...])
```

Evidence: `src/schemas/brain-state.ts:87-94`, `src/lib/paths.ts:34-37`, `src/hooks/tool-gate.ts:14-24`

### Zod Schemas

**PascalCase with `Schema` suffix:**
```typescript
export const TrajectoryNodeSchema = z.object({ ... })
export const TaskNodeSchema = z.object({ ... })
export const ArtifactEventTypeSchema = z.enum([...])
export const PlanningStateSchema = z.object({ ... })
export const RequirementStatusSchema = z.enum([...])
```

**Inferred types use `z.infer<typeof *Schema>`:**
```typescript
export type TrajectoryNode = z.infer<typeof TrajectoryNodeSchema>
export type TaskNode = z.infer<typeof TaskNodeSchema>
export type ArtifactEvent = z.infer<typeof ArtifactEventSchema>
```

**Snake_case for schema field names** (JSON persistence compatibility):
```typescript
export const TrajectoryNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  active_plan_id: z.string().uuid().nullable(),
  active_task_ids: z.array(z.string().uuid()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
```

Evidence: `src/schemas/graph-nodes.ts:1-395`, `src/schemas/events.ts:16-156`

## Error Handling

### Pattern: try/catch with P3 Rule

**Every hook and tool wraps its entire execution in try/catch** — errors are logged but never thrown to prevent breaking the host (OpenCode). This is documented as the "P3" rule:

```typescript
// Pattern from src/hooks/session-lifecycle.ts:156-158
} catch (error) {
  await log.error(`Session lifecycle hook error: ${error}`)
}

// Pattern from src/hooks/soft-governance.ts:647-650
} catch (error) {
  // P3: Never break tool execution
  await log.error(`Soft governance hook error: ${error}`)
}

// Pattern from src/hooks/compaction.ts:241-244
} catch (error) {
  // P3: Never break compaction — this is critical
  await log.error(`Compaction hook error: ${error}`)
}
```

### Pattern: Tool Response Errors

Tools return structured JSON error responses via `toErrorOutput()` rather than throwing:

```typescript
// src/lib/tool-response.ts
export function toErrorOutput(error: string, suggestion?: string): string {
  const payload: ToolErrorPayload = { status: "error", error }
  if (suggestion) payload.suggestion = suggestion
  return JSON.stringify(payload, null, 2)
}

// Usage in src/tools/hivemind-codemap.ts:139-142
} catch (err) {
  return toErrorOutput(
    `Compression failed: ${err instanceof Error ? err.message : String(err)}`
  )
}
```

### Pattern: Error Type Narrowing

Consistent use of `unknown` for caught errors with explicit type narrowing:

```typescript
} catch (error: unknown) {
  await log.warn(`Toast dispatch failed for ${opts.key}: ${error}`)
}

} catch (err: unknown) {
  if (isNodeError(err) && err.code === "ENOENT") { return null }
  await logger?.error(`Failed to load brain state: ${err}`)
}
```

Evidence: All hook files, all tool files, `src/lib/persistence.ts:203-231`

### Pattern: Non-fatal Sub-operations

Sub-operations that should not block the main flow use nested try/catch with comment "P3" or "non-fatal":

```typescript
// src/hooks/soft-governance.ts:419
} catch {
  // P3: Entity checklist failure is non-fatal
}

// src/hooks/tool-gate.ts:348-350
} catch {
  // P3: TaskNode lookup failure is non-fatal
}
```

## Documentation Style

### JSDoc Comments

**Module-level JSDoc blocks are used on every file.** They describe the module's purpose, responsibilities, and consumers:

```typescript
/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped (2500 chars, lowest priority dropped)
 *   - Handles stale session auto-archival
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config re-read from disk each invocation (Rule 6)
 */
```

```typescript
/**
 * Detection Engine
 * Programmatic signal detection for drift, stuck patterns, and governance alerts.
 *
 * 5 sections: Types, Tool Classification, Counter Logic, Keyword Scanning, Signal Compilation
 *
 * Consumers:
 * - soft-governance.ts (tool.execute.after) → Sections 2-4
 * - session-lifecycle.ts (system.transform) → Section 5
 */
```

Evidence: `src/hooks/session-lifecycle.ts:1-11`, `src/lib/detection.ts:2-11`, `src/lib/hierarchy-tree.ts:1-17`

### Inline Comments

**Section delimiters use ASCII box-drawing patterns:**
```typescript
// ─── Handlers ─────────────────────────────────────────────────────────────
// ============================================================
// Section 1: Types
// ============================================================
```

**Inline comments explain "why" not "what":**
```typescript
// CHIMERA-3: Always return JSON for FK chaining - no conditionals
// CQRS: Queue mutation instead of direct save (hooks are read-only)
// FLAW-TOAST-007 FIX: Removed drift toast emission
// Rule 6: Re-read config from disk each invocation
// HC1 COMPLIANCE: Always allow, just advise
```

**Bug/fix reference tags are used in comments:**
- `CHIMERA-3` — FK chaining compliance
- `FLAW-TOAST-*` — Toast noise reduction fixes
- `HC1`/`HC4`/`HC5` — HiveMind compliance constraints
- `P3`/`P5` — Design principles (never break, config re-read)
- `CQRS` — Command/Query separation

### TODO/FIXME

Only 4 active TODO comments exist in production source (`src/lib/event-consumers.ts`), all identical: `// TODO: Wire telemetry or planning materialization when integration surface is mapped.`

No FIXME or HACK comments in the codebase.

## Tool Definition Pattern

Every tool follows this canonical structure in `src/tools/`:

```typescript
// 1. Module-level JSDoc with design principles
/**
 * hivemind_anchor — Unified anchor management tool with symmetric read/write.
 *
 * Design:
 *   1. Iceberg — minimal args, system handles storage
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — structured output
 *   4. HC4 Compliance — symmetric read/write flows
 *   5. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

// 2. Imports: @opencode-ai/plugin/tool, ../lib/*, ../schemas/*
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

// 3. Factory function: createHivemind*Tool(directory: string): ToolDefinition
export function createHivemindAnchorTool(directory: string): ToolDefinition {
  return tool({
    // 4. description: string (plain text, used by LLM)
    description: "Manage immutable anchors...",

    // 5. args: defined via tool.schema.* (Zod-like API from @opencode-ai/plugin)
    args: {
      action: tool.schema
        .enum(["save", "list", "get"])
        .describe("What to do: save | list | get"),
      key: tool.schema
        .string()
        .optional()
        .describe("Anchor key"),
    },

    // 6. execute(args, _context): async handler
    async execute(args, _context) {
      // 7. Switch on args.action, delegate to private handler functions
      switch (args.action) {
        case "save": return handleSave(directory, args)
        case "list": return handleList(directory)
        default: return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// 8. Private handler functions (async, return string via toSuccessOutput/toErrorOutput)
async function handleSave(directory: string, args: { ... }): Promise<string> {
  // ... business logic ...
  return toSuccessOutput("Anchor saved", entityId, metadata)
}
```

**Tool registration** in `src/index.ts`:
```typescript
tool: {
  hivemind_session: createHivemindSessionTool(effectiveDir),
  hivemind_inspect: createHivemindInspectTool(effectiveDir),
  // ... all 14 tools
},
```

Evidence: `src/tools/hivemind-anchor.ts`, `src/tools/hivemind-codemap.ts`, `src/tools/hivemind-session.ts`

## Hook Definition Pattern

Hooks use a **factory function pattern** capturing `log`, `directory`, and `config`:

```typescript
// 1. Factory function creates closure over dependencies
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  // 2. Internal state (state managers, etc.)
  const stateManager = createStateManager(directory, log)

  // 3. Returns async function matching OpenCode hook signature
  return async (
    input: { sessionID?: string; model?: unknown },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      // 4. Re-read config from disk (Rule 6 / P5)
      const config = await loadConfig(directory)
      // 5. Hook logic
    } catch (error) {
      // P3: Never break
      await log.error(`Hook error: ${error}`)
    }
  }
}
```

**Hook registration** in `src/index.ts`:
```typescript
"experimental.chat.system.transform": createSessionLifecycleHook(log, effectiveDir, initConfig),
"experimental.chat.messages.transform": createMessagesTransformHook(log, effectiveDir),
"tool.execute.after": createSoftGovernanceHook(log, effectiveDir, initConfig),
"tool.execute.before": createToolGateHook(log, effectiveDir, initConfig),
"experimental.session.compacting": createCompactionHook(log, effectiveDir),
event: createEventHandler(log, effectiveDir),
```

**5 hook types:**
| Hook | File | Event | Signature |
|------|------|-------|-----------|
| System transform | `session-lifecycle.ts` | `experimental.chat.system.transform` | `(input, output: {system: string[]}) => void` |
| Messages transform | `messages-transform.ts` | `experimental.chat.messages.transform` | `(input, output: {messages}) => void` |
| Tool gate (before) | `tool-gate.ts` | `tool.execute.before` | `(input: {tool, sessionID, callID}, output: {args}) => void` |
| Soft governance (after) | `soft-governance.ts` | `tool.execute.after` | `(input: {tool, sessionID, callID}, output: {title, output, metadata}) => void` |
| Compaction | `compaction.ts` | `experimental.session.compacting` | `(input: {sessionID}, output: {context: string[]}) => void` |
| Event handler | `event-handler.ts` | `event` | `(input: {event: Event}) => void` |

Evidence: `src/hooks/session-lifecycle.ts:76-160`, `src/hooks/tool-gate.ts:84-394`, `src/index.ts:124-183`

## Testing Conventions

### Test Runner

**Node.js native test runner** via `tsx`:
```bash
npm test          # bash scripts/check-sdk-boundary.sh && tsx --test tests/*.test.ts
```

Config: No `jest.config.*` or `vitest.config.*`. Tests run directly with `tsx --test`.

Note: Only top-level `tests/*.test.ts` files are run by `npm test`. Subdirectory tests (`tests/code-intel/`, `tests/hooks/`, `tests/lib/`) must be run manually with `npx tsx --test tests/subdir/file.test.ts`.

### Custom Assertion Harness

Tests do NOT use `node:assert` or any assertion library. Instead, every test file defines a **custom harness**:

```typescript
let passed = 0
let failed_ = 0
function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}
```

Evidence: `tests/tool-gate.test.ts:20-30`, `tests/hierarchy-tree.test.ts:24-29`, `tests/schemas.test.ts:28-37`

### Test Organization

Tests use **explicit async function calls** rather than `describe()`/`it()` blocks:

```typescript
// Each test is a standalone async function
async function test_strict_blocks_write_without_session() {
  process.stderr.write("\n--- tool-gate: strict blocks write without session ---\n")
  const dir = await setup()
  // ... test logic ...
  assert(result.allowed, "strict mode allows write without session (HC1: advisory only)")
  await cleanup()
}

// Main function calls all tests sequentially
async function main() {
  process.stderr.write("=== tool-gate.test.ts ===\n")
  await test_strict_blocks_write_without_session()
  await test_strict_allows_exempt_tools()
  // ...
  process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
  if (failed_ > 0) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
```

### Setup/Teardown Pattern

```typescript
let tmpDir: string

async function setup(): Promise<string> {
  clearMutationQueue()
  tmpDir = await mkdtemp(join(tmpdir(), "hm-test-"))
  await initializePlanningDirectory(tmpDir)
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    clearMutationQueue()
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}
```

### Mocking

**No mocking framework.** Tests use:
1. **Temporary directories** (`mkdtemp`) with real filesystem I/O
2. **`noopLogger`** from `src/lib/logging.ts` as a silent logger
3. **Real state managers** operating on temp dirs
4. **Source code reading** for structural assertions (e.g., checking that certain patterns exist in source files):

```typescript
function testAsyncExclusiveLockContract(): void {
  const source = readFileSync(join(process.cwd(), "src", "lib", "persistence.ts"), "utf-8")
  const hasAsyncOpen = source.includes('await open(this.lockPath, "wx")')
  assert(hasAsyncOpen, "file lock uses async+exclusive")
}
```

Evidence: `tests/tool-gate.test.ts:34-48`, `tests/persistence-locking.test.ts:86-92`

### Test Naming

Test function names use `test_` prefix with snake_case description:
- `test_strict_blocks_write_without_session`
- `test_brain_state_creation`
- `test_stamps`
- `test_crud`

## Style Rules

### Indentation

**2 spaces.** Verified in `tsconfig.json` output formatting and all source files.

### Quotes

**Double quotes** throughout. No `.prettierrc` or `.eslintrc` configured — enforced by convention:
```typescript
import { createStateManager } from "../lib/persistence.js"
const logFile = `${logDir}/${service}.log`
```

### Semicolons

**Inconsistent.** Some files use semicolons (`src/schemas/brain-state.ts`, `src/lib/hierarchy-tree.ts`), others omit them (`src/lib/event-bus.ts`, `src/hooks/session-lifecycle.ts`). Both styles coexist.

Evidence: Compare `src/schemas/brain-state.ts` (semicolons) vs `src/hooks/session-lifecycle.ts` (no semicolons)

### Template Literals

**Template literals preferred** for string interpolation:
```typescript
await log.info(`Initializing HiveMind in ${effectiveDir}`)
return toErrorOutput(`Unknown action: ${args.action}`)
const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
```

String concatenation used only in `description` fields:
```typescript
description:
  "Manage session lifecycle. " +
  "Actions: start (declare intent), update (change focus), close (compact), status (inspect), resume (reopen). " +
  "Always returns JSON for FK chaining.",
```

### TypeScript Strictness

Full strict mode enabled in `tsconfig.json`:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Module System

ESM-only (`"type": "module"` in `package.json`), with `NodeNext` module resolution.

### Immutable State Updates

**Spread-based immutability** for all state mutations — no direct mutation of state objects:

```typescript
export function incrementTurnCount(state: BrainState): BrainState {
  return {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: state.metrics.turn_count + 1,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}
```

Evidence: All state mutation functions in `src/schemas/brain-state.ts:378-651`

### CQRS Pattern

**Hooks are read-only** — they queue mutations via `queueStateMutation()` rather than calling `stateManager.save()` directly. Only tools flush mutations:

```typescript
// Hook (read-intent, queues mutation):
queueStateMutation({
  type: "UPDATE_STATE",
  payload: newState,
  source: "soft-governance"
})

// Tool (write-boundary, flushes):
await flushMutations(stateManager)
await flushTaskManifestMutations()
```

Evidence: `src/hooks/soft-governance.ts:625-631`, `src/tools/hivemind-session.ts:184-185`

## Inconsistencies & Deviations

1. **Semicolon inconsistency:** ~40% of files use trailing semicolons, ~60% omit them. No linter enforces either style.

2. **snake_case directory:** `src/hooks/session_coherence/` and `src/lib/session_coherence.ts` use snake_case instead of the standard kebab-case.

3. **No linter/formatter configured:** No `.eslintrc`, `.prettierrc`, or `biome.json` exists. Style is enforced by convention only.

4. **Type import style mixed:** Some files use `import type { X }` (preferred), others use inline `import { type X }`:
   - Preferred: `import type { BrainState } from "../schemas/brain-state.js"` (e.g., `src/hooks/compaction.ts`)
   - Also seen: `import { type Logger } from "../lib/logging.js"` (e.g., `src/hooks/tool-gate.ts:1`)

5. **Test subdirectories not in CI:** `npm test` only runs `tests/*.test.ts` — subdirectory tests (`tests/code-intel/`, `tests/hooks/`, `tests/lib/`) require manual execution.

6. **Deprecated export preserved:** `src/hooks/tool-gate.ts:402` exports `createToolGateHookInternal()` marked `@deprecated` but still consumed by tests.

7. **Single default export:** `src/index.ts:186` — `export default HiveMindPlugin` — is the only default export. All other ~825 exports are named.

---

*Convention analysis: 2026-02-28*
