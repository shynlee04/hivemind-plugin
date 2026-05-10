# HiveMind Checkpoint Harness — Design Specification

**Date:** 2026-04-07
**Status:** Approved — Audit Complete, Ready for Implementation Planning
**Architecture:** Single Package with Internal Module Boundaries

---

## 1. Purpose

A multi-agent orchestration framework built on OpenCode primitives that provides:

1. **Turn-based checkpoint validation** — agents advance through phases only after gate conditions pass
2. **Incremental skill unlocking** — tools and prompts become available conditionally per phase
3. **Compaction-resilient state** — orchestrator reconstructs context after `SessionCompaction.prune()`
4. **Soft-harness discovery** — Phase 0 negotiates requirements with the user before execution
5. **Cross-dependency validation** — critic subagents review work against locked requirements

The framework is distributed as a single npm package (`hivemind`) with internal module boundaries, a CLI, an OpenCode plugin, and a set of `.opencode/` assets (agents, commands, skills). Users install it, run `harness init`, and get a checkpoint-gated pipeline.

---

## 2. Architecture

### 2.1 Package Structure

Single npm package with three internal directories enforcing clear boundaries:

```
src/
├── kernel/         Pure state engine (zero OpenCode dependency)
├── plugin/         OpenCode adapter (runtime gating + state injection)
└── cli/            Build-time validation + runtime management
```

Plus an `assets/` directory containing `.opencode/` templates validated at build time and loaded at runtime.

Single `package.json` publishes as `hivemind`. Internal module boundaries enforced via import rules (kernel imports nothing from plugin/cli).

### 2.2 Dependency Graph

```
kernel  ←  plugin  (reads GateResult, applies permission.ask gating)
kernel  ←  cli     (validates schemas, manages state files)
plugin  ←  assets  (agents/skills/commands loaded by OpenCode at runtime)
```

No circular dependencies. Kernel depends on nothing external except Zod v4.

### 2.3 Cross-Layer Interface

The kernel exports types derived exclusively from Zod schemas (§3.2). The primary cross-layer type is `GateResult`, inferred from `GateResultSchema`:

```typescript
// In schemas.ts — single source of truth
export type GateResult = z.infer<typeof GateResultSchema>
```

No standalone type definitions exist outside Zod schemas. All kernel types (`SessionPad`, `RequirementsLock`, `ReviewVerdict`, `GateResult`) are `z.infer` derivatives, eliminating schema-type drift.

---

## 3. Kernel Package (`packages/kernel/`)

### 3.1 Files

| File | LOC Target | Purpose |
|------|-----------|---------|
| `schemas.ts` | ~120 | Zod v4 schemas for all state types |
| `gate.ts` | ~80 | `evaluateGate()` pure function |
| `pad-store.ts` | ~100 | File CRUD for session agent pads |
| `lock-store.ts` | ~80 | Requirements lock file management |
| `state-recovery.ts` | ~60 | `reconstructState()` for compaction recovery |

### 3.2 Zod v4 Schemas (`schemas.ts`)

All structured output uses Zod v4 for validation. Key schemas:

**SessionPad** — The orchestrator's durable working state per session:

```typescript
const SessionPadSchema = z.object({
  id: z.string(),                              // "pad-001", "pad-002", "pad-003"
  sessionId: z.string().nullable(),            // null = pad slot available
  status: z.enum(["active", "released"]),      // pad availability
  version: z.number().default(0),              // optimistic concurrency — incremented on every write
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  pipelinePath: z.string(),                    // path to pipeline.md
  currentPhase: z.string(),                    // e.g., "phase-1"
  currentTask: z.string(),                     // e.g., "phase-1-1"
  checkpointStatus: z.record(z.string(), z.enum([
    "pending", "in_progress", "completed", "blocked", "failed"
  ])),
  gateRetries: z.record(z.string(), z.number()).default({}),
  // ^ keyed by checkpoint ID, value = consecutive rejection count
  // Reset to 0 on gate pass. When >= 3, orchestrator escalates to human.
})
```

**RequirementsLock** — Locked requirements after Phase 0 negotiation:

```typescript
// Task IDs MUST be globally unique across all phases.
// Convention: "{phaseId}-{localTaskNum}" e.g., "phase-1-1", "phase-2-3"
// This ensures dependsOn references are unambiguous.
const TaskSchema = z.object({
  id: z.string(),
  command: z.string(),
  skill: z.string(),
  gate: z.string(),        // Human-readable gate condition e.g., "zero-lsp-errors", "tests-pass"
  dependsOn: z.array(z.string()).default([]),
  editScope: z.array(z.string()).default([]),  
  // ^ Glob patterns for file paths this task is allowed to edit.
  // e.g., ["src/types/**", "src/schemas/**"] — used by permission-gate.ts to scope edit access.
  // Empty array = no edit allowed (read-only task).
  // Populated during Phase 0 negotiation from project structure analysis.
})

const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  locked: z.boolean(),
  requirements: z.array(z.object({
    id: z.string(),
    description: z.string(),
    locked: z.boolean(),
  })),
  tasks: z.array(TaskSchema),
})

const RequirementsLockSchema = z.object({
  version: z.number(),
  lockedAt: z.string().datetime(),
  phases: z.array(PhaseSchema),
})
```

**ReviewVerdict** — Written by code-critic to signal approval/rejection:

```typescript
// phase/task use string IDs matching TaskSchema.id convention
// e.g., phase: "phase-1", task: "phase-1-1"
const ReviewVerdictSchema = z.object({
  phase: z.string(),
  task: z.string(),
  reviewer: z.literal("code-critic"),
  timestamp: z.string().datetime(),
  verdict: z.enum(["approved", "rejected"]),
  checks: z.object({
    lspErrors: z.number(),
    testsPassed: z.boolean(),
    requirementsLocked: z.boolean(),
    crossDepsValid: z.boolean(),
  }),
  notes: z.string().optional(),
})
```

**GateResult** — The interface between kernel and plugin:

```typescript
// Uses string IDs for consistency with ReviewVerdict and TaskSchema.
// currentPhase e.g., "phase-1", currentTask e.g., "phase-1-1"
const GateResultSchema = z.object({
  currentPhase: z.string(),
  currentTask: z.string(),
  unlocked: z.array(z.string()),
  gateStatus: z.enum(["locked", "unlocked", "blocked"]),
  blockers: z.array(z.string()).optional(),
})

export type GateResult = z.infer<typeof GateResultSchema>
```

**PermissionRequest** — Adapts OpenCode's real `Permission` type for kernel use:

```typescript
// OpenCode's actual Permission type from @opencode-ai/plugin:
// { id, type, pattern?: string | string[], sessionID, messageID, callID?, title, metadata, time }
// We extract phase/toolName from metadata or title fields in the plugin layer.

const PermissionRequestSchema = z.object({
  type: z.string(),                    // OpenCode's Permission.type (not constrained to enum)
  pattern: z.union([z.string(), z.array(z.string())]).optional(),
  sessionID: z.string(),
  metadata: z.record(z.unknown()).optional(),
  title: z.string().optional(),
})

export type PermissionRequest = z.infer<typeof PermissionRequestSchema>
```

**PermissionOutput** — Matches OpenCode's actual hook output type:

```typescript
// OpenCode's real output: { status: "ask" | "ask" | "allow" }
// Note: no 'message' field exists in the real API. Denial messages must be
// communicated via prompt-inject.ts system prompt injection instead.
interface PermissionOutput {
  status: 'allow' | 'ask' | 'ask'
}
```

These types are exported from `schemas.ts` — no `any` types in the permission gating path. The plugin layer adapts OpenCode's real `Permission` type into `PermissionRequest` by extracting phase/toolName context from `metadata` or `title` fields.

### 3.3 Gate Evaluation (`gate.ts`)

```typescript
function evaluateGate(
  reviews: Map<string, ReviewVerdict>,
  requirements: RequirementsLock,
): GateResult

// Returns GateResult with gateStatus:
//   "locked"   — no reviews exist, or current phase has no approved reviews
//   "unlocked" — all phases completed, or all tasks up to current are approved
//   "blocked"  — dependsOn references invalid, or cycles detected
// Never throws. All error conditions are returned as blocked GateResult with blockers[].
```

**Pre-evaluation validation (runs before gate logic):**

1. **Phase ordering**: Sort `requirements.phases` lexicographically by `phase.id` before iteration. This ensures deterministic evaluation regardless of lock file insertion order.
2. **Task ID integrity**: Build a global `Set<string>` of all task IDs across all phases. If any `dependsOn` reference is not in this set, return immediately:
   ```typescript
   { gateStatus: "blocked", currentPhase: phases[0].id, currentTask: phases[0].tasks[0].id,
     unlocked: [], blockers: ["dependsOn references non-existent task: <id>"] }
   ```
3. **Cycle detection**: Validated once at lock-write-time in `writeLock()` (not per-gate). If a cycle is detected during Phase 0 negotiation, the lock file is rejected entirely. At gate evaluation time, cycles are assumed absent (validated at write time). If somehow a cycle exists in the lock file, return:
   ```typescript
   { gateStatus: "blocked", currentPhase: phases[0].id, currentTask: phases[0].tasks[0].id,
     unlocked: [], blockers: ["circular dependsOn detected: <cycle path>"] }
   ```

**Gate evaluation logic:**

1. Iterate phases in lexicographic order of `phase.id`
2. **Empty reviews case**: If `reviews` is an empty `Map` (no reviews exist yet), return:
   ```typescript
   { gateStatus: "locked", currentPhase: phases[0].id, currentTask: phases[0].tasks[0].id,
     unlocked: [], blockers: ["no reviews submitted yet"] }
   ```
3. For each phase, check all task review files:
   - If a task has `dependsOn` references, verify each dependency task has an `approved` review
   - If any dependency is missing or `rejected`, mark as `blocked` with specific blocker: `"<depTaskId>: dependency not approved"`
4. If all tasks in a phase are `approved`, that phase is unlocked — add all its task IDs to `unlocked`
5. Return the first phase with unapproved tasks as `currentPhase/currentTask`
6. Collect all completed task IDs into `unlocked` array

### 3.4 Pad Store (`pad-store.ts`)

Manages `.hivemind/session-agents-trackpad/` with a maximum of 3 pads (3 parallel sessions).

Operations:
- `readPad(id: string): SessionPad` — reads and validates with Zod. Throws `[Harness] Pad not found: <id>` if file does not exist. Throws `[Harness] Pad validation failed: <id>` with Zod error details if JSON is invalid.
- `writePad(pad: SessionPad): void` — **Atomic write with optimistic concurrency:**
  1. Read current pad from disk, get its `version`
  2. If `pad.version !== currentVersion`, throw `[Harness] Pad version conflict: <id> (expected <current>, got <pad.version>)` — caller must re-read and retry
  3. Increment `pad.version++`
  4. Write to `<id>.tmp`, then `fs.renameSync(<id>.tmp, <id>.json)` (atomic on POSIX)
  5. Update `updatedAt` to current ISO datetime
- `listPads(): SessionPad[]` — returns all existing pads (deep-cloned)
- `acquirePad(sessionId: string): SessionPad` — finds first pad with `status: "released"` and claims it. Uses `writePad` (version check prevents double-acquire). Throws `[Harness] All pads active` if none available.
- `releasePad(id: string): void` — sets `status: "released"`, `sessionId: null`. Uses `writePad`.
- `incrementRetry(padId: string, checkpointId: string): void` — full read → modify `gateRetries[checkpointId]++` → `writePad`
- `resetRetry(padId: string, checkpointId: string): void` — full read → set `gateRetries[checkpointId] = 0` → `writePad`

**Error behavior:** All operations throw with `[Harness]` prefix. File-not-found is a thrown error (not silent). Corrupted JSON (partial write) is caught by Zod validation and thrown as `[Harness] Pad validation failed`.

### 3.5 Lock Store (`lock-store.ts`)

Manages `.hivemind/requirements.lock.json`:

- `readLock(): RequirementsLock` — reads and validates with Zod. Throws `[Harness] Requirements lock not found` if file doesn't exist. Throws `[Harness] Requirements lock validation failed` with Zod error details on invalid JSON.
- `writeLock(lock: RequirementsLock): void` — only during Phase 0, fails with `[Harness] Requirements lock already exists` if lock file already present. **Before writing, validates:**
  1. All task IDs are globally unique
  2. All `dependsOn` references point to existing task IDs
  3. No circular dependencies (topological sort on task graph)
  If any validation fails, throws `[Harness] Lock validation failed: <reason>`.
  Validates with Zod before write. Uses atomic write (tmp + rename).
- `lockField(phaseId: string, requirementId: string): void` — marks a requirement as `locked: true`. Full read → modify → write cycle. Throws `[Harness] Requirement not found: <phaseId>/<requirementId>` if IDs don't match.
- `isLocked(phaseId: string, requirementId: string): boolean` — returns `false` if lock file doesn't exist (not an error — pre-negotiation state).

### 3.6 State Recovery (`state-recovery.ts`)

```typescript
function reconstructState(
  padPath: string,
  planPath: string,
  lockPath: string,
  reviewDir: string,
): { pad: SessionPad, plan: string, requirements: RequirementsLock, gateResult: GateResult }
```

Called by the plugin's `prompt-inject.ts` hook to rebuild orchestrator context after compaction. Reads all state files and computes the current gate result.

**Error handling (explicit for each input):**

| Input | File Not Found | Invalid JSON / Zod Failure | Empty File |
|-------|---------------|---------------------------|------------|
| `padPath` | Throw `[Harness] Pad file not found: <padPath>` | Throw `[Harness] Pad validation failed: <padPath>` with Zod error details | Throw `[Harness] Pad file empty: <padPath>` |
| `lockPath` | Throw `[Harness] Requirements lock not found: <lockPath>` | Throw `[Harness] Requirements lock validation failed: <lockPath>` | Throw `[Harness] Requirements lock empty: <lockPath>` |
| `planPath` | Return `plan: ""` (empty plan is valid — may not exist yet) | Throw `[Harness] Plan file unreadable: <planPath>` | Return `plan: ""` |
| `reviewDir` | Return empty `Map` (no reviews yet — valid initial state) | Skip individual invalid review files, log warning to stderr: `[Harness] Skipping invalid review: <filename>` | N/A (directory exists but empty) |

All thrown errors use `[Harness]` prefix. The function never returns `null` or `undefined` — it either returns a valid reconstruction or throws. Callers should catch and handle gracefully (e.g., inject error context into compaction prompt).

**Review loading:** Reads all `*.json` files from `reviewDir`, validates each against `ReviewVerdictSchema`, skips invalid ones (with warning), and builds the `Map<string, ReviewVerdict>` needed by `evaluateGate()`.

---

## 4. Plugin Package (`packages/plugin/`)

**The plugin is REQUIRED.** It provides runtime gating, state injection, and compaction resilience. Without it, the harness is just static config files with no dynamic behavior.

### 4.1 Files

| File | LOC Target | Purpose |
|------|-----------|---------|
| `index.ts` | ~40 | Plugin entry — composes hooks, registers tools |
| `hooks/permission-gate.ts` | ~100 | `permission.ask` — dynamic tool gating based on phase state |
| `hooks/prompt-inject.ts` | ~80 | `experimental.chat.system.transform` — inject phase context + compaction recovery |
| `hooks/tool-descriptor.ts` | ~40 | `tool.definition` — augment tool descriptions with lock warnings |
| `tools/gate-check.ts` | ~80 | Custom tool: validate a phase/task checkpoint |

### 4.2 Plugin Entry (`index.ts`)

Registers 3 hooks and 1 custom tool. Uses kernel for all state reads. No business logic in this file — only composition.

### 4.3 Permission Gate (`hooks/permission-gate.ts`)

**Hook:** `permission.ask`

This is the **core runtime gating mechanism**. It intercepts every permission request and decides whether to allow or ask based on the current gate state.

```typescript
import type { Plugin } from '@opencode-ai/plugin'
import { evaluateGate, reconstructState, isToolAllowedForPhase } from '../kernel/index.js'
import type { PermissionRequest, PermissionOutput } from '../kernel/schemas.js'

// Adapt OpenCode's real Permission type → our PermissionRequest
function adaptPermission(nativePermission: any): PermissionRequest {
  return {
    type: nativePermission.type,
    pattern: nativePermission.pattern,
    sessionID: nativePermission.sessionID,
    metadata: nativePermission.metadata,
    title: nativePermission.title,
  }
}

// Extract phase context from permission metadata or title
function extractPhase(request: PermissionRequest): string | null {
  if (request.metadata?.phase) return String(request.metadata.phase)
  if (request.title?.includes('phase-')) {
    const match = request.title.match(/(phase-\d+)/)
    return match ? match[1] : null
  }
  return null
}

export function createPermissionGate(directory: string) {
  return async (nativePermission: any, output: PermissionOutput) => {
    try {
      const request = adaptPermission(nativePermission)
      const phase = extractPhase(request)
      
      const { gateResult, requirements } = await reconstructState(
        `${directory}/session-agents-trackpad/`, 
        `${directory}/plans/pipeline.md`,
        `${directory}/requirements.lock.json`,
        `${directory}/reviews/`,
      )
      
      // Override gate result phase if extractable from permission
      const effectivePhase = phase ?? gateResult.currentPhase
      
      if (isToolAllowedForPhase(request, effectivePhase, gateResult, requirements)) {
        output.status = 'allow'
      } else {
        output.status = 'ask'
        // Note: no message field in real OpenCode API — denial context is
        // communicated via prompt-inject.ts system prompt injection
      }
    } catch {
      // State files missing or corrupted — ask
      output.status = 'ask'
    }
  }
}
```

**`PermissionRequest` type** (defined in `schemas.ts`, not `any`):

```typescript
const PermissionRequestSchema = z.object({
  type: z.enum([
    'read', 'edit', 'bash', 'glob', 'grep', 'list', 
    'skill', 'question', 'task', 'webfetch', 'write',
    'mcp', 'fetch', 'notebook',
  ]),
  pattern: z.string().optional(),       // file glob, bash command, agent name, etc.
  toolName: z.string().optional(),      // specific tool being invoked
  phase: z.string().optional(),         // override phase if provided
})
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>
```

**Permission gating logic:**

```typescript
// kernel/permission-gate.ts

// Phase-scoped edit path mapping — derived from RequirementsLock
function getPhaseEditPaths(
  currentPhase: string, 
  requirements: RequirementsLock,
): string[] {
  const phase = requirements.phases.find(p => p.id === currentPhase)
  if (!phase) return []
  return [...new Set(phase.tasks.flatMap(t => t.editScope ?? []))]
}

// Extract allowed test commands from the current phase's tasks
function getAllowedTestCommands(
  currentPhase: string,
  requirements: RequirementsLock,
): string[] {
  const phase = requirements.phases.find(p => p.id === currentPhase)
  if (!phase) return []
  // Collect unique gate conditions that reference test commands
  const commands = phase.tasks.map(t => t.gate).filter(Boolean)
  return [...new Set(commands)]
}

// Simple glob matching without external dependency
// Supports: *, **, ?, {a,b} patterns
function matchesGlob(filePath: string, pattern: string): boolean {
  // Minimal implementation — use micromatch for production
  const regex = new RegExp(
    '^' + pattern
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__DOUBLESTAR__/g, '.*')
      .replace(/\?/g, '.') + '$'
  )
  return regex.test(filePath)
}

export function isToolAllowedForPhase(
  permission: PermissionRequest, 
  currentPhase: string,
  state: GateResult,
  requirements: RequirementsLock,
): boolean {
  const { unlocked } = state
  
  // Phase 0 (discovery): only read, question, glob, grep, list
  if (currentPhase === 'phase-0') {
    return ['read', 'question', 'glob', 'grep', 'list'].includes(permission.type)
  }
  
  // Skill: allowed only for the current phase's designated skill
  if (permission.type === 'skill') {
    const phase = requirements.phases.find(p => p.id === currentPhase)
    if (!phase) return false
    const allowedSkills = phase.tasks.map(t => t.skill).filter(Boolean)
    return allowedSkills.includes(permission.pattern as string ?? '')
  }
  
  // Edit: allowed only in phase-scoped paths
  if (permission.type === 'edit') {
    const allowedPaths = getPhaseEditPaths(currentPhase, requirements)
    const pattern = Array.isArray(permission.pattern) 
      ? permission.pattern[0] 
      : (permission.pattern ?? '')
    return allowedPaths.some(p => matchesGlob(pattern, p))
  }
  
  // Bash: data-driven from lock file gate conditions
  if (permission.type === 'bash') {
    const allowedCommands = getAllowedTestCommands(currentPhase, requirements)
    const cmd = (Array.isArray(permission.pattern) 
      ? permission.pattern[0] 
      : (permission.pattern ?? '')).trim()
    
    // Check if command matches any allowed test command pattern
    return allowedCommands.some(allowed => {
      // Convert gate condition to regex (e.g., "bun test" → /^bun test/)
      const escaped = allowed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^${escaped}(\\s+\\S+)*$`)
      return regex.test(cmd) && !cmd.includes('&&') && !cmd.includes('|') && !cmd.includes(';')
    })
  }
  
  // Task: only allow phase-worker and code-critic
  if (permission.type === 'task') {
    return ['phase-worker', 'code-critic', 'explore', 'researcher'].includes(
      Array.isArray(permission.pattern) ? permission.pattern[0] : (permission.pattern ?? '')
    )
  }
  
  // Read operations: always allowed
  if (['read', 'glob', 'grep', 'list'].includes(permission.type)) {
    return true
  }
  
  // Everything else: denied by default
  return false
}
```

**Key design decisions:**
1. **Skill is phase-gated** — not always allowed. Each phase's tasks declare which skills they use.
2. **Bash is data-driven from lock file** — test commands are declared in task `gate` conditions, not hardcoded. Works with any test runner (jest, pytest, cargo test, etc.).
3. **Unknown permission types are denied** — no silent allow-through for new permission types.
4. **`getPhaseEditPaths()` derives from `RequirementsLock`** — the mapping is data-driven, not hardcoded.
5. **All agents get broad static permissions** — the `permission.ask` hook does the real gating based on phase state. No dynamic agent file generation needed.
6. **No external glob dependency in kernel** — `matchesGlob` is a minimal implementation. Plugin can pass `micromatch` if needed.

### 4.4 Prompt Injection (`hooks/prompt-inject.ts`)

**Hook:** `experimental.chat.system.transform`

**Phase-to-template mapping** (defined once, data-driven):

```typescript
// The template file for a phase is: .hivemind/templates/{phase.id}.txt
// This is a naming convention enforced by `harness validate`.
// Phase IDs with hyphens map directly: "phase-1" → "phase-1.txt"
// Custom phase IDs work: "design-phase" → "design-phase.txt"
function resolveTemplatePath(phaseId: string, templatesDir: string): string {
  return path.join(templatesDir, `${phaseId}.txt`)
}
```

If the template file does not exist for the current phase, the `<phase_instructions>` section is omitted entirely (not an error — some phases may not have templates). A warning is logged to stderr: `[Harness] No template found for phase: <phaseId>`.

Behavior:
1. Read the session's pad from `.hivemind/session-agents-trackpad/`
2. Call `reconstructState()` from kernel (passes `reviewDir` for gate evaluation)
3. Resolve template path: `.hivemind/templates/{currentPhase}.txt` — read if exists, skip if not
4. Append to `output.system` (which is `string[]` — use `.push()`, not string concatenation):
   ```typescript
   output.system.push(`
<harness_context>
Session: pad-00N
Current phase: phase-1, Task: phase-1-1
Unlocked checkpoints: phase-0-1, phase-1-1, ...
Gate retries: phase-1-2=1 (of max 3)

<phase_instructions>
[contents of {currentPhase}.txt — omitted if file does not exist]
</phase_instructions>

<prerequisites_reminder>
Before proceeding, ensure: [list locked requirements for current phase]
</prerequisites_reminder>

<stop_conditions>
Stop if: gate fails 3x on same checkpoint, user sends "pause"/"stop", all checkpoints complete
</stop_conditions>
</harness_context>
`)
   ```

This fires before every LLM call, ensuring the orchestrator always has current state even after compaction. This is the **primary and only** compaction recovery mechanism — no separate compaction-monitor hook or orchestrator self-setup file reads are needed.

### 4.5 Tool Descriptor (`hooks/tool-descriptor.ts`)

**Hook:** `tool.definition`

Behavior:
1. Read current gate state from `.hivemind/`
2. For each tool, check if it's locked for the current phase
3. If locked, append a warning to the tool's description:
   ```
   ⚠️ LOCKED: This tool is not available until phase phase-2 passes gate validation.
   Current phase: phase-1. Complete all tasks and pass code-critic review to unlock.
   ```
4. For the `skill` tool, append current phase context:
   ```
   Current harness phase: phase-2. Load the http-handlers skill for instructions.
   ```

This provides **visual tool gating** — the LLM sees which tools are locked directly in the tool description, reducing wasted tool call attempts.

### 4.6 Gate Check Tool (`tools/gate-check.ts`)

Custom tool registered via `tool()` API. The `code-critic` subagent uses this.

**Arguments:**
- `phase: string` — Phase ID (e.g., "phase-1")
- `task: string` — Task ID (e.g., "phase-1-1")

**Behavior:**
1. Read `.hivemind/requirements.lock.json` and validate requirements integrity
2. Run test command (configurable via `gateCheck.testCommand` in `.hivemind/config.json`, default: `bun test`) — capture exit code
   - **Timeout:** configurable via `gateCheck.timeoutMs` (default: `120_000` = 2 minutes). If the subprocess exceeds the timeout, kill it and return:
     ```
     Gate check for phase-1/phase-1-1: BLOCKED
     
     FAIL tests: Timed out after 120s (command: bun test)
     ```
   - Use `child_process.spawn()` with a `setTimeout` kill wrapper — never `exec()` which buffers indefinitely
3. Check for existing review files for dependencies listed in `dependsOn`
4. If the lock file is missing or invalid JSON, return immediately:
   ```
   Gate check for phase-1/phase-1-1: BLOCKED
   
   FAIL requirements: requirements.lock.json not found or invalid
   ```
5. Return structured result:
   ```
   Gate check for phase-1/phase-1-1: ALL PASSED (or BLOCKED)
   
   PASS requirements_locked: All locked fields intact
   PASS tests: 12 tests passed
   PASS dep:phase-0-1: Dependency approved
   ```

---

## 5. CLI Package (`packages/cli/`)

### 5.1 Commands

| Command | Purpose |
|---------|---------|
| `harness init` | Bootstrap `.hivemind/` directory structure with default templates |
| `harness validate` | Validate all `.hivemind/` files against Zod schemas |
| `harness status` | Show current phase/task/unlock state (reads pad + lock + reviews) |
| `harness reset` | Wipe session pads (requires `--force` flag) |

### 5.2 `harness init`

Creates:
```
.hivemind/
├── session-agents-trackpad/    # Empty (pads created on first session)
├── reviews/                    # Empty (reviews written by code-critic)
├── templates/                  # Phase prompt templates (user edits these)
│   ├── phase-0.txt             # Discovery phase template
│   ├── phase-1.txt             # Phase 1 template (example)
│   └── ...
├── plans/
│   └── pipeline.md             # Empty pipeline template
└── requirements.lock.json      # Not created until Phase 0 completes
```

Also generates `.opencode/` assets:
```
.opencode/
├── agents/
│   ├── orchestrator.md         # Primary coordinator with self-setup protocol
│   ├── phase-worker.md         # Subagent: executes tasks
│   ├── code-critic.md          # Subagent: read-only reviewer
│   ├── explore.md              # Subagent: fast codebase investigation
│   └── researcher.md           # Subagent: web/API cross-validation
├── commands/
│   ├── harness-execute.md      # Execute current phase task
│   ├── harness-review.md       # Review completed work
│   ├── harness-doctor.md       # Diagnose harness state issues
│   └── harness-status.md       # Show current state
└── skills/
    ├── gate-review/            # code-critic review protocol
    ├── onboarding/             # Tool usage + harness conventions
    ├── api-types/              # Example: type definitions
    ├── http-handlers/          # Example: handler implementation
    └── testing/                # Example: test patterns
```

### 5.3 `harness validate`

Reads all files in `.hivemind/` and validates them against Zod schemas:
- Pads: `SessionPadSchema`
- Lock: `RequirementsLockSchema`
- Reviews: `ReviewVerdictSchema` (all files in `reviews/`)
- Templates: checks they exist and are non-empty

Exits with code 0 on success, 1 on any validation failure with specific error messages.

### 5.4 Build-Time Integration

The CLI's `validate` command runs as a build step:
```json
{
  "scripts": {
    "build": "tsc && harness validate",
    "prepack": "npm run build"
  }
}
```

This ensures `.opencode/` assets and `.hivemind/` state files are structurally valid before packaging.

---

## 6. Assets (`assets/`)

### 6.1 Agents (5)

| Agent | Mode | Purpose |
|-------|------|---------|
| `orchestrator` | primary | Macro-level coordinator. Self-setup protocol on every turn. Dispatches phase-workers and code-critics via TaskTool. |
| `phase-worker` | subagent | Executes tasks within a phase. Loads phase-specific skills. Edits restricted to phase scope. |
| `code-critic` | subagent | Read-only reviewer. Validates against locked requirements. Writes approval to `.hivemind/reviews/`. Uses `gate-check` tool. |
| `explore` | subagent | Fast codebase investigation. Read-only. |
| `researcher` | subagent | Web/API cross-validation. Read-only. |

### 6.2 Orchestrator Agent — Self-Setup Protocol

The orchestrator's `.md` file contains this mandatory protocol:

```markdown
## On Every Turn
1. Read your session pad from .hivemind/session-agents-trackpad/ (determine which of 3 slots)
2. Read .hivemind/plans/pipeline.md for strategic context
3. Read .hivemind/requirements.lock.json for locked requirements
4. If compaction summary exists: reconstruct state from pad + plan + lock
5. Check todowrite for checkpoint state

## Checkpoint Execution
For each pending checkpoint:
1. Dispatch phase-worker via TaskTool with checkpoint command + skill name
2. Dispatch code-critic via TaskTool for validation
3. Gate pass → update todowrite, advance
4. Gate fail → resume phase-worker (pass task_id) with fix instructions

## Permission Model
All agents receive broad static permissions in their agent definitions.
The `permission.ask` hook performs the real runtime gating based on:
- Current phase state (from SessionPad)
- Phase-scoped edit paths (from RequirementsLock task.editScope)
- Data-driven bash allowlists (from RequirementsLock task.gate conditions)

No dynamic permission injection or agent file generation is needed.

## Stop Conditions
- All checkpoints completed
- Gate fails 3 consecutive times on same checkpoint → escalate to human
- User sends "pause" or "stop"
```

### 6.3 Code-Critic Agent — Permission Profile

```json
{
  "edit": {
    "*": "ask",
    ".hivemind/reviews/*.json": "allow"
  },
  "bash": {
    "*": "ask",
    "bun test *": "allow",
    "npm test *": "allow"
  },
  "question": "ask",
  "skill": "allow",
  "read": "allow",
  "grep": "allow"
}
```

### 6.4 Commands (4)

| Command | Purpose |
|---------|---------|
| `harness-doctor` | Diagnose harness state issues (delegates to CLI `harness validate`) |
| `harness-execute` | Execute current phase task (routes to phase-worker with `$ARGUMENTS` for phase/task) |
| `harness-review` | Review completed work (routes to code-critic with `subtask: true`) |
| `harness-status` | Show current state (reads pad + lock + reviews, outputs summary) |

**Command example with $ARGUMENTS and !bash:**

```markdown
<!-- .opencode/commands/harness-execute.md -->
---
description: Execute a harness phase task
agent: phase-worker
subtask: true
---

Execute the current harness checkpoint.

Current state:
!`harness status`

Phase: $1
Task: $2

Load the appropriate skill via the skill tool first, then execute the task.
Work only within the scope defined by the current phase's permission profile.
```

### 6.5 Skills (5)

| Skill | Loaded By | Purpose |
|-------|-----------|---------|
| `gate-review` | code-critic | Review protocol: how to validate against requirements, write approval files |
| `onboarding` | orchestrator | Tool usage demo + harness conventions + schema locking patterns |
| `api-types` | phase-worker | Example Phase 1: type definition patterns |
| `http-handlers` | phase-worker | Example Phase 2: handler implementation patterns |
| `testing` | phase-worker | Example Phase 3: test patterns + coverage requirements |

These are **examples** demonstrating the checkpoint pattern. Users create their own phase-specific skills per project.

---

## 7. Checkpoint-Gate-Unlock Loop

### 7.1 Phase 0: Soft-Harness Discovery

1. Orchestrator uses `question` tool to negotiate requirements with user
2. Bite-size questions, one at a time
3. Compiles answers into `RequirementsLock`
4. Writes to `.hivemind/requirements.lock.json`
5. All fields marked `locked: true`
6. User approves the 5-phase × 4-task breakdown

### 7.2 Phase N: Execution Pipeline

```
orchestrator → todowrite(checkpoint: pending)
  → TaskTool(phase-worker, "execute checkpoint N")
    → phase-worker loads phase-N skill via skill tool
    → phase-worker edits files within phase scope
    → LSP diagnostics in tool output
  ← task_result + task_id
  
  → TaskTool(code-critic, "review checkpoint N")
    → code-critic loads gate-review skill
    → code-critic runs gate-check tool
    → code-critic writes .hivemind/reviews/{taskId}.json
  ← task_result with verdict

  if approved:
    → todowrite(checkpoint: completed)
    → resetRetry(padId, checkpointId)
    → gate-watcher hook fires
    → evaluateGate() → gateResult.unlocked updated
    → permission.ask hook now allows next phase tools
    → prompt-inject adds next phase template to next LLM call
    
  if rejected (retries tracked in pad.gateRetries):
    → incrementRetry(padId, checkpointId)
    → if gateRetries[checkpointId] < 3:
      → TaskTool(phase-worker, "fix issues", task_id=prev)
      → Re-validate via code-critic
    → if gateRetries[checkpointId] >= 3:
      → Escalate to human
```

### 7.3 Compaction Recovery

When `SessionCompaction.prune()` fires:
1. In-context message history is lost
2. But durable state survives: pad JSON, lock file, review files, pipeline.md
3. On next LLM call, `prompt-inject.ts` hook fires (`experimental.chat.system.transform`)
4. Hook calls `reconstructState()` and injects full `<harness_context>` into `output.system` (via `.push()`)
5. Orchestrator receives reconstructed state in system prompt — no file reads needed
6. Orchestrator continues from where it left off

**Design note:** This is the sole compaction recovery mechanism. The `prompt-inject` hook is the most reliable because it doesn't depend on agent behavior compliance (self-setup protocol) or internal compaction APIs (`experimental.session.compacting` whose output survival is unverified).

---

## 8. Storage Layout

All paths relative to project root:

```
.hivemind/
├── session-agents-trackpad/
│   ├── pad-001.json              # SessionPad (Zod validated)
│   ├── pad-002.json              # Max 3 pads for 3 parallel sessions
│   └── pad-003.json
├── reviews/
│   ├── phase-1-1.json            # ReviewVerdict (Zod validated) — latest review only
│   ├── phase-1-2.json
│   └── ...
├── templates/
│   ├── phase-0.txt               # Discovery phase prompt template
│   ├── phase-1.txt               # Injected via system.transform on unlock
│   └── ...
├── plans/
│   └── pipeline.md               # Human-readable pipeline state
└── requirements.lock.json        # RequirementsLock (Zod validated)
```

**Review file naming convention:**

- File name: `{taskId}.json` (e.g., `phase-1-1.json`)
- **Latest review is the canonical verdict** — the gate evaluation reads this file for the current decision.
- **Previous reviews are archived** — on retry, the existing file is renamed to `{taskId}.v{N}.json` before writing the new verdict. This preserves diagnostic history for human escalation.
- Retry history is tracked in `SessionPad.gateRetries[taskId]` (counter).
- Archive files are skipped by `state-recovery.ts` (only `*.json` files matching `{taskId}.json` pattern are loaded as canonical verdicts).

---

## 9. Testing Strategy

### 9.1 Kernel Tests (Strict TDD)

Every kernel function tested with vitest. Tests written before implementation.

Coverage targets:
- `gate.ts`: 100% branch coverage (all gate status paths)
- `pad-store.ts`: 100% including edge cases (3-pad limit, concurrent access)
- `lock-store.ts`: 100% including immutability enforcement
- `schemas.ts`: All parse/safeParse paths for each schema
- `state-recovery.ts`: All reconstruction paths including missing files

### 9.2 Plugin Tests

Hooks tested by mocking kernel functions. No OpenCode SDK imports in tests — the kernel functions are pure and mockable.

### 9.3 CLI Tests

Each command tested as a unit with a temp `.hivemind/` directory.

### 9.4 Integration Tests

End-to-end test: `harness init` → write requirements → simulate gate pass → verify state transitions.

---

## 10. Constraints

| Constraint | Value |
|-----------|-------|
| Max LOC per file | 300 |
| Kernel dependencies | Zod v4 only (no glob library — minimal matchesGlob inline) |
| Plugin dependencies | @opencode-ai/plugin, kernel |
| State persistence | File-based JSON (Zod validated) |
| Max parallel sessions | 3 (3 pads) |
| Max gate retries before escalation | 3 |
| Schema validation | Zod v4 for all structured output |
| Deep-clone-on-read | Yes (pad-store, lock-store) |
| Error prefix | `[Harness]` on all thrown errors |
| TypeScript | strict: true, noUnusedLocals, noUnusedParameters |
| Package structure | Single package with internal module boundaries |
| Compaction recovery | `prompt-inject` hook only (single mechanism) |
| Bash gating | Data-driven from lock file gate conditions |
| Permission gating | Hook-based (all agents get broad static permissions) |
| Permission types | Adapted from OpenCode's real Permission type |

---

## 11. Out of Scope (MVP)

- Database-backed state (file-based is sufficient)
- Custom compaction strategies (use platform defaults)
- Multi-project orchestration (single project per session)
- Web dashboard / UI
- Plugin marketplace integration
- Real-time collaboration between sessions
