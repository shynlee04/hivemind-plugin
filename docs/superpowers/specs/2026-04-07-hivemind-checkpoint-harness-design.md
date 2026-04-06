# HiveMind Checkpoint Harness — Design Specification

**Date:** 2026-04-07
**Status:** Draft — Pending Review
**Architecture:** Layered Kernel (Approach A, revised)

---

## 1. Purpose

A multi-agent orchestration framework built on OpenCode primitives that provides:

1. **Turn-based checkpoint validation** — agents advance through phases only after gate conditions pass
2. **Incremental skill unlocking** — tools and prompts become available conditionally per phase
3. **Compaction-resilient state** — orchestrator reconstructs context after `SessionCompaction.prune()`
4. **Soft-harness discovery** — Phase 0 negotiates requirements with the user before execution
5. **Cross-dependency validation** — critic subagents review work against locked requirements

The framework is distributed as an npm package with a CLI, an OpenCode plugin, and a set of `.opencode/` assets (agents, commands, skills). Users install it, run `harness init`, and get a checkpoint-gated pipeline.

---

## 2. Architecture

### 2.1 Package Structure

Three packages in a monorepo, each with clear boundaries:

```
packages/
├── kernel/         Pure state engine (zero OpenCode dependency)
├── plugin/         OpenCode adapter (thin, <250 LOC total)
└── cli/            Build-time validation + runtime management
```

Plus an `assets/` directory containing `.opencode/` templates validated at build time and loaded at runtime.

### 2.2 Dependency Graph

```
kernel  ←  plugin  (reads GateResult, applies permissions)
kernel  ←  cli     (validates schemas, manages state files)
plugin  ←  assets  (agents/skills/commands loaded by OpenCode at runtime)
```

No circular dependencies. Kernel depends on nothing external except Zod v4.

### 2.3 Cross-Layer Interface

The kernel exports one primary type consumed by both plugin and CLI:

```typescript
type GateResult = {
  currentPhase: string         // e.g., "phase-1"
  currentTask: string          // e.g., "phase-1-1"
  unlocked: string[]           // e.g., ["phase-1-1", "phase-1-2"]
  gateStatus: "locked" | "unlocked" | "blocked"
  blockers?: string[]          // reason strings if blocked
}
```

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
```

### 3.3 Gate Evaluation (`gate.ts`)

```typescript
function evaluateGate(
  reviews: Map<string, ReviewVerdict>,
  requirements: RequirementsLock,
): GateResult
```

Logic:
1. Iterate phases in order
2. For each phase, check all task review files
3. If all tasks in a phase are `approved`, that phase is unlocked
4. Return the first phase with unapproved tasks as `currentPhase/currentTask`
5. If dependencies (`dependsOn`) are not approved, mark as `blocked` with blocker reasons

### 3.4 Pad Store (`pad-store.ts`)

Manages `.hivemind/session-agents-trackpad/` with a maximum of 3 pads (3 parallel sessions).

Operations:
- `readPad(id: string): SessionPad` — reads and validates with Zod
- `writePad(pad: SessionPad): void` — validates before write, deep-clone-on-read
- `listPads(): SessionPad[]` — returns all existing pads
- `acquirePad(sessionId: string): SessionPad` — finds first pad with `status: "released"` and claims it (sets sessionId, status: "active"). Error if all 3 pads are active.
- `releasePad(id: string): void` — sets `status: "released"`, `sessionId: null`
- `incrementRetry(padId: string, checkpointId: string): void` — increments `gateRetries[checkpointId]`
- `resetRetry(padId: string, checkpointId: string): void` — sets `gateRetries[checkpointId]` to 0

Constraint: **Any pad edit requires full read before write** (optimistic concurrency).

### 3.5 Lock Store (`lock-store.ts`)

Manages `.hivemind/requirements.lock.json`:

- `readLock(): RequirementsLock` — reads and validates with Zod
- `writeLock(lock: RequirementsLock): void` — only during Phase 0, fails if lock already exists
- `lockField(phaseId: string, requirementId: string): void` — marks a requirement as `locked: true`
- `isLocked(phaseId: string, requirementId: string): boolean`

### 3.6 State Recovery (`state-recovery.ts`)

```typescript
function reconstructState(
  padPath: string,
  planPath: string,
  lockPath: string,
): { pad: SessionPad, plan: string, requirements: RequirementsLock, gateResult: GateResult }
```

Called by the plugin's `prompt-inject.ts` hook to rebuild orchestrator context after compaction. Reads all three state files and computes the current gate result.

---

## 4. Plugin Package (`packages/plugin/`)

### 4.1 Files

| File | LOC Target | Purpose |
|------|-----------|---------|
| `index.ts` | ~40 | Plugin entry — composes hooks, registers tools |
| `hooks/prompt-inject.ts` | ~80 | `experimental.chat.system.transform` — inject phase context |
| `hooks/gate-watcher.ts` | ~60 | `tool.execute.after` — detect reviews → evaluate gate → setPermission |
| `hooks/tool-descriptor.ts` | ~40 | `tool.definition` — augment skill tool description |
| `hooks/compaction-monitor.ts` | ~30 | `event` — monitor session.compacted events for logging |
| `tools/gate-check.ts` | ~80 | Custom tool: validate a phase/task checkpoint |

### 4.2 Plugin Entry (`index.ts`)

Registers 4 hooks and 1 custom tool. Uses kernel for all state reads. No business logic in this file — only composition.

### 4.3 Prompt Injection (`hooks/prompt-inject.ts`)

**Hook:** `experimental.chat.system.transform`

Behavior:
1. Read the session's pad from `.hivemind/session-agents-trackpad/`
2. Call `reconstructState()` from kernel
3. Read `.hivemind/templates/phase-N.txt` for the current phase's prompt template
4. Append to `output.system`:
   ```
   <harness_context>
   Session: pad-00N
   Current phase: phase-1, Task: phase-1-1
   Unlocked checkpoints: phase-0-1, phase-1-1, ...
   Gate retries: phase-1-2=1 (of max 3)
   
   <phase_instructions>
   [contents of phase-N.txt]
   </phase_instructions>
   
   <prerequisites_reminder>
   Before proceeding, ensure: [list locked requirements for current phase]
   </prerequisites_reminder>
   
   <stop_conditions>
   Stop if: gate fails 3x on same checkpoint, user sends "pause"/"stop", all checkpoints complete
   </stop_conditions>
   </harness_context>
   ```

This fires before every LLM call, ensuring the orchestrator always has current state even after compaction.

### 4.4 Gate Watcher (`hooks/gate-watcher.ts`)

**Hook:** `tool.execute.after`

Behavior:
1. Check if the completed tool call was a `task` dispatch to `code-critic`
2. If yes, read all review files from `.hivemind/reviews/`
3. Call `evaluateGate()` from kernel
4. If `gateResult.gateStatus === "unlocked"`:
   - Call `Session.setPermission()` to enable next phase tools
   - `PermissionNext.disabled()` filters out denied tools from the LLM's tool list on the next call
   - The permission ruleset uses last-match-wins semantics: broad deny rules first, specific allow rules last
   - The next LLM call will pick up updated permissions + injected prompt
5. If `gateResult.gateStatus === "blocked"`:
   - Inject blocker information via the prompt injection hook (next call)

**Race condition prevention:** The hook runs synchronously within the tool execution pipeline. No concurrent state mutation is possible — OpenCode processes hooks sequentially per session.

### 4.5 Tool Descriptor (`hooks/tool-descriptor.ts`)

**Hook:** `tool.definition`

Behavior:
1. If `toolID === "skill"`, append current phase context to the tool's description
2. Example: `"Current harness phase: phase-2. Load the http-handlers skill for instructions."`
3. This tells the agent which skill to load without bloating the base context

**PRUNE_PROTECTED_TOOLS:** The OpenCode platform protects the `skill` tool from pruning by default (`PRUNE_PROTECTED_TOOLS = ["skill"]`). This means loaded SKILL.md content survives `SessionCompaction.prune()`. The harness relies on this platform guarantee. Additionally, the orchestrator agent's self-setup protocol (§6.2) instructs the agent to reload its skill as the first action on every turn, providing a belt-and-suspenders recovery path.

### 4.6 Compaction Monitor (`hooks/compaction-monitor.ts`)

**Hook:** `event`

Behavior:
1. Listen for `session.compacted` events
2. Log the compaction event to `.hivemind/session-agents-trackpad/pad-NNN.json` (update `updatedAt`)
3. The `prompt-inject.ts` hook will automatically inject reconstructed state on the next LLM call

This hook is informational only — it does not block or modify any flow. Its purpose is to leave an audit trail of compaction events for debugging.

### 4.7 Gate Check Tool (`tools/gate-check.ts`)

Custom tool registered via `tool()` API. The `code-critic` subagent uses this.

**Arguments:**
- `phase: string` — Phase ID (e.g., "phase-1")
- `task: string` — Task ID (e.g., "phase-1-1")

**Behavior:**
1. Read `.hivemind/requirements.lock.json` and validate requirements integrity
2. Run test command (configurable, default: `bun test`) — capture exit code
3. Check for existing review files for dependencies listed in `dependsOn`
4. Return structured result:
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

## Subagent Permission Templates
When creating phase-worker sessions, include these permission rules:
- Phase 1: edit allow src/types/*, bash allow 'bun test *'
- Phase 2: edit allow src/handlers/*, bash allow 'bun test *'
- (adjust per project structure)

## Stop Conditions
- All checkpoints completed
- Gate fails 3 consecutive times on same checkpoint → escalate to human
- User sends "pause" or "stop"
```

### 6.3 Code-Critic Agent — Permission Profile

```json
{
  "edit": {
    "*": "deny",
    ".hivemind/reviews/*.json": "allow"
  },
  "bash": {
    "*": "deny",
    "bun test *": "allow",
    "npm test *": "allow"
  },
  "question": "deny",
  "skill": "allow",
  "read": "allow",
  "grep": "allow"
}
```

### 6.4 Commands (4)

| Command | Purpose |
|---------|---------|
| `harness-doctor` | Diagnose harness state issues (delegates to CLI `harness validate`) |
| `start-work` | Initialize a new pipeline run (delegates to CLI `harness init` + creates pad) |
| `plan` | Create/modify pipeline plan (edits `.hivemind/plans/pipeline.md`) |
| `ultrawork` | Autonomous execution mode — runs all remaining phases without human intervention |

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
    → Session.setPermission() enables next phase tools
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
3. On next turn, orchestrator's self-setup protocol reads these files
4. Plugin's `prompt-inject.ts` injects reconstructed `<harness_context>` into system prompt
5. Orchestrator continues from where it left off

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
│   ├── phase-1-1.json            # ReviewVerdict (Zod validated)
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
| Kernel dependencies | Zod v4 only |
| Plugin dependencies | @opencode-ai/plugin, kernel |
| State persistence | File-based JSON (Zod validated) |
| Max parallel sessions | 3 (3 pads) |
| Max gate retries before escalation | 3 |
| Schema validation | Zod v4 for all structured output |
| Deep-clone-on-read | Yes (pad-store, lock-store) |
| Error prefix | `[Harness]` on all thrown errors |
| TypeScript | strict: true, noUnusedLocals, noUnusedParameters |

---

## 11. Out of Scope (MVP)

- Database-backed state (file-based is sufficient)
- Custom compaction strategies (use platform defaults)
- Multi-project orchestration (single project per session)
- Web dashboard / UI
- Plugin marketplace integration
- Real-time collaboration between sessions
