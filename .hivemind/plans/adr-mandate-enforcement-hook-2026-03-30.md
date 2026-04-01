# ADR-007: Mandate Enforcement Hook

**Date:** 2026-03-30
**Status:** proposed
**Author:** architect agent
**Scope:** `src/hooks/mandate-enforcement.ts` (new file) + integration into `src/plugin/opencode-plugin.ts`

---

## Table of Contents

1. [Hook Interface](#1-hook-interface)
2. [Agent Resolution Strategy](#2-agent-resolution-strategy)
3. [Permission Map Type](#3-permission-map-type)
4. [Error Message Template](#4-error-message-template)
5. [Integration Pattern](#5-integration-pattern)
6. [Implementation Phases](#6-implementation-phases)
7. [Test Strategy](#7-test-strategy)
8. [Key Architect Decisions](#8-key-architect-decisions)
9. [Risks and Mitigations](#9-risks-and-mitigations)
10. [File Path for the New Hook File](#10-file-path-for-the-new-hook-file)
11. [Imports Needed](#11-imports-needed)
12. [SDK Surfaces Used](#12-sdk-surfaces-used)
13. [CQRS Boundary Note](#13-cqrs-boundary-note)
14. [Permissive Defaults for Unknown Agents](#14-permissive-defaults-for-unknown-agents)
15. [Session Override Mechanism](#15-session-override-mechanism)
16. [Constraint: tool.schema (Zod)](#16-constraint-tool-schema-zod)
17. [Constraint: context.sessionID / context.agent](#17-constraint-contextsessionid--contextagent)
18. [Constraint: npx tsc --noEmit](#18-constraint-npx-tsc---noemit)
19. [Constraint: JSDoc @param, @returns, @example](#19-constraint-jsdoc-param-returns-example)
20. [Constraint: CQRS (tools own writes, hooks are read-only)](#20-constraint-cqrs-tools-own-writes-hooks-are-read-only)
21. [Constraint: client.app.log() for structured logging](#21-constraint-clientapplog-for-structured-logging)
22. [Constraint: permission.ask / context.ask() for state mutations](#22-constraint-permission-ask--contextask-for-state-mutations)
23. [Constraint: getEffectivePaths() for path resolution](#23-constraint-geteffectivepaths-for-path-resolution)
24. [Constraint: classify interfaces as internal-only](#24-constraint-classify-interfaces-as-internal-only)
25. [Constraint: new hook file in src/hooks/](#25-constraint-new-hook-file-in-srchooks)
26. [Constraint: ≤300 LOC, no god functions, no dead code](#26-constraint-300-loc-no-god-functions-no-dead-code)

---

## Context

OpenCode agents have YAML-defined `permissions` blocks in `.opencode/agents/*.md` that define **capabilities** — what tools an agent CAN use. However, the system lacks a runtime enforcement layer for **behavioral mandates** — what an agent SHOULD and SHOULD NOT do based on its role. For example:

- `architect` should never edit `src/**/*.ts` files (design only, no implementation)
- `hivexplorer` should never write anything anywhere (read-only investigator)
- `hivefiver` can edit framework assets but must NEVER touch `src/**`
- `hivemaker` has full edit access (implementation specialist)

The existing `permission.ask` hook in `opencode-plugin.ts` (lines 154-171) only auto-allows HiveMind managed tools and shows toasts for writes — it does NOT check agent mandates. The `tool.execute.before` hook (lines 172-177) only records tool events for trajectory tracking — it does NOT enforce mandates.

This ADR designs a **mandate enforcement hook** that enforces agent behavioral constraints at runtime, complementing the static YAML permissions.

---

## Decision

Implement a mandate enforcement system using three coordinated hooks:

1. **`chat.message`** — populates a session→agent cache (in-memory `Map<sessionID, agentName>`)
2. **`permission.ask`** — enforces hard denies on file operations that violate agent mandates
3. **`tool.execute.before`** — observes and logs mandate violations that cannot be hard-blocked, plus advisory toasts

---

## 1. Hook Interface

### TypeScript Signatures

```typescript
/**
 * Session-to-agent identity cache.
 *
 * Populated by the `chat.message` hook, consumed by `permission.ask` and
 * `tool.execute.before` hooks to resolve agent identity from sessionID.
 *
 * @internal-only
 */
export interface AgentSessionCache {
  /** Map of OpenCode sessionID → agent name */
  readonly cache: Map<string, string>

  /**
   * Record which agent is operating in a session.
   *
   * @param sessionID - OpenCode session identifier
   * @param agent - Agent name (e.g. 'hiveminder', 'architect')
   */
  set(sessionID: string, agent: string): void

  /**
   * Resolve the agent name for a session.
   *
   * @param sessionID - OpenCode session identifier
   * @returns Agent name or `undefined` if cache miss
   */
  get(sessionID: string): string | undefined

  /**
   * Clear the entire cache. Called on SDK context reset.
   */
  clear(): void
}

/**
 * Result of a mandate check for a given agent + operation.
 *
 * @internal-only
 */
export interface MandateCheckResult {
  /** Whether the operation is permitted */
  readonly allowed: boolean
  /** Reason for denial (empty string if allowed) */
  readonly reason: string
  /** Severity level for logging/toast purposes */
  readonly severity: 'none' | 'advisory' | 'denied'
  /** The mandate rule that was evaluated */
  readonly ruleId: string
}

/**
 * Check if an agent is permitted to perform an operation.
 *
 * @param agent - Agent name (e.g. 'architect')
 * @param operation - The operation being attempted
 * @param context - Additional context (file path, tool name, etc.)
 * @returns Mandate check result
 *
 * @example
 * const result = checkMandate('architect', 'file_edit', { path: 'src/tools/foo.ts' })
 * // { allowed: false, reason: 'architect cannot edit src/** files', severity: 'denied', ruleId: 'architect-src-edit-block' }
 */
export type MandateCheckFn = (
  agent: string,
  operation: MandateOperation,
  context: MandateContext,
) => MandateCheckResult

/**
 * Operations that can be mandate-checked.
 *
 * @internal-only
 */
export type MandateOperation =
  | 'file_read'
  | 'file_edit'
  | 'file_write'
  | 'file_delete'
  | 'tool_call'
  | 'bash_command'
  | 'task_delegation'

/**
 * Context for mandate evaluation.
 *
 * @internal-only
 */
export interface MandateContext {
  /** File path (for file operations) */
  readonly path?: string
  /** Tool name (for tool_call operations) */
  readonly tool?: string
  /** Bash command (for bash_command operations) */
  readonly command?: string
  /** Target agent name (for task_delegation operations) */
  readonly targetAgent?: string
}
```

---

## 2. Agent Resolution Strategy

### The Core Problem

`tool.execute.before` and `permission.ask` hooks receive `sessionID` but NOT `agent` identity. The SDK signature is:

```typescript
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any },
) => Promise<void>
```

### Resolution Strategy: Session→Agent Cache

**Approach:** Use the `chat.message` hook to populate an in-memory `Map<sessionID, agentName>`. The `chat.message` hook DOES receive `input.agent`:

```typescript
"chat.message"?: (
  input: { sessionID: string; agent?: string; ... },
  output: { message: UserMessage; parts: Part[] },
) => Promise<void>
```

**Flow:**

```
chat.message fires → sessionCache.set(sessionID, agent)
                              ↓
permission.ask fires → agent = sessionCache.get(sessionID) → checkMandate(agent, ...)
                              ↓
tool.execute.before fires → agent = sessionCache.get(sessionID) → checkMandate(agent, ...)
```

### Fallback for Cache Misses

When `sessionCache.get(sessionID)` returns `undefined`:

1. **Permissive default:** Allow the operation (don't block unknown sessions)
2. **Log the miss:** `client.app.log()` at 'warn' level
3. **Toast advisory:** Notify that mandate enforcement couldn't verify agent identity

**Rationale:** False negatives (blocking legitimate operations) are worse than false positives (allowing undocumented agents). Unknown agents are assumed to be new or external agents not yet in the mandate map.

### Existing Precedent

The `chat-message-handler.ts` already extracts `input.agent` and passes it to session resolution (line 61: `const agent = input.agent || injection?.agent || 'unknown'`). This confirms the `chat.message` hook reliably receives agent identity.

---

## 3. Permission Map Type

### Agent Mandate Map

```typescript
/**
 * Static mandate rules for a single agent.
 *
 * Defines what an agent CAN and CANNOT do beyond its YAML permissions.
 * The YAML config defines capability; this defines behavioral intent.
 *
 * @internal-only
 */
export interface AgentMandate {
  /** Agent identifier (e.g. 'architect') */
  readonly agentId: string

  /** Glob patterns for paths the agent CAN edit (empty = no edit allowed) */
  readonly editAllowGlobs: readonly string[]

  /** Glob patterns for paths the agent CANNOT edit (overrides allow) */
  readonly editDenyGlobs: readonly string[]

  /** Glob patterns for paths the agent CAN write (create new files) */
  readonly writeAllowGlobs: readonly string[]

  /** Whether the agent may run bash commands */
  readonly canBash: boolean

  /** Agents this agent may delegate tasks to (empty = no delegation) */
  readonly allowedDelegationTargets: readonly string[]

  /** Tools the agent is explicitly forbidden from calling */
  readonly deniedTools: readonly string[]

  /** Human-readable role description for error messages */
  readonly roleDescription: string
}

/**
 * Complete mandate map — all agent mandates indexed by agent ID.
 *
 * @internal-only
 */
export type AgentMandateMap = ReadonlyMap<string, AgentMandate>
```

### Concrete Mandate Map (from Agent Configs)

| Agent | editAllowGlobs | editDenyGlobs | canBash | allowedDelegationTargets |
|-------|---------------|---------------|---------|-------------------------|
| `hiveminder` | `.hivemind/**` | `src/**` | restricted | all named agents |
| `architect` | `*.md`, `*.json`, `.hivemind/**`, `.opencode/**` | `src/**` | yes | code-skeptic, hiveq, hivexplorer |
| `hiveq` | `*.md`, `*.json`, `.hivemind/**` | `src/**` | yes | hivexplorer |
| `hiveplanner` | `*.md`, `*.json`, `.hivemind/**` | `src/**` | yes | hivexplorer, hiveq |
| `hivemaker` | `**` (all) | _(none)_ | yes | hivexplorer, hiveq |
| `hitea` | `**` (all) | _(none)_ | yes | hivexplorer, hiveq |
| `hivehealer` | `**` (all) | _(none)_ | yes | hivexplorer, hiveq |
| `code-skeptic` | `*.md`, `*.json`, `.hivemind/**` | `src/**` | yes | hiveq, hivexplorer |
| `hiverd` | `*.md`, `*.json`, `.hivemind/**` | `src/**` | yes | hivexplorer, hiveq |
| `hivexplorer` | _(none)_ | `**` | yes | explore-small |
| `hivefiver` | `*.md`, `*.json`, `.hivemind/**`, `.opencode/**`, `skills/**` | `src/**` | yes | hivexplorer, hiveplanner, hiverd, hiveq, build, general, plan, explore |
| `explore` | _(none)_ | `**` | yes | explore-small |
| `explore-small` | _(none)_ | `**` | yes | _(none)_ |
| `general` | `*.md`, `*.json`, `.hivemind/**` | `src/**` | yes | _(none)_ |

**Note:** `editAllowGlobs` and `editDenyGlobs` are checked using `picomatch` or `minimatch` (already available as transitive deps via the existing codebase).

---

## 4. Error Message Template

### Denial Messages

```typescript
/**
 * Generate a human-readable mandate denial message.
 *
 * @param agent - Agent name
 * @param operation - The denied operation
 * @param mandate - The agent's mandate rules
 * @param context - Additional context (file path, tool name)
 * @returns Formatted denial message
 *
 * @example
 * formatDenialMessage('architect', 'file_edit', mandate, { path: 'src/foo.ts' })
 * // "[mandate] architect (design-only) cannot edit src/foo.ts — design agents do not modify implementation files. Delegate to hivemaker for implementation."
 */
function formatDenialMessage(
  agent: string,
  operation: MandateOperation,
  mandate: AgentMandate,
  context: MandateContext,
): string
```

### Template Format

```
[mandate] {agent} ({roleDescription}) cannot {operation} {target}
— {roleDescription} agents do not {operationVerb} {targetCategory}.
{delegationHint}
```

### Examples

| Agent | Operation | Target | Message |
|-------|-----------|--------|---------|
| architect | file_edit | `src/tools/foo.ts` | `[mandate] architect (design-only) cannot edit src/tools/foo.ts — design agents do not modify implementation files. Delegate to hivemaker for implementation.` |
| hivexplorer | file_write | `.hivemind/state.json` | `[mandate] hivexplorer (read-only) cannot write .hivemind/state.json — investigators never mutate state. Report findings to hiveminder instead.` |
| hivefiver | file_edit | `src/plugin/foo.ts` | `[mandate] hivefiver (framework-only) cannot edit src/plugin/foo.ts — framework writers must NEVER touch src/. Use hivefiver's designated framework paths only.` |
| architect | task_delegation | hivemaker | `[mandate] architect cannot delegate to hivemaker — architect may only delegate to: code-skeptic, hiveq, hivexplorer.` |

---

## 5. Integration Pattern

### Where the Hook Integrates

The mandate enforcement system integrates into three existing hook registrations in `src/plugin/opencode-plugin.ts`:

#### 5.1 `chat.message` Hook (existing, extend)

**Current:** `handleChatMessage()` in `chat-message-handler.ts` — writes to session journal.

**Extension:** After the existing handler, populate the session→agent cache:

```typescript
// In opencode-plugin.ts hooks object:
'chat.message': async (input, output) => {
  // Existing: session journal
  await handleChatMessage(input, output, directory)

  // NEW: mandate enforcement — populate session→agent cache
  if (input.agent) {
    sessionAgentCache.set(input.sessionID, input.agent)
  }
}
```

#### 5.2 `permission.ask` Hook (existing, extend)

**Current:** Auto-allows HiveMind managed tools, shows toast for writes.

**Extension:** After managed tool check, before the write toast, add mandate check:

```typescript
'permission.ask': async (permissionInput, output) => {
  // Existing: auto-allow managed tools
  if (permissionInput.metadata) {
    const toolName = (permissionInput.metadata as Record<string, unknown>).tool as string | undefined
    if (isHivemindManagedTool(toolName)) {
      output.status = 'allow'
      return
    }
  }

  // NEW: mandate enforcement — hard deny for mandate violations
  const agent = sessionAgentCache.get(permissionInput.sessionID ?? '')
  if (agent && permissionInput.type === 'write') {
    const result = checkMandate(agent, 'file_edit', { path: permissionInput.path })
    if (!result.allowed) {
      output.status = 'deny'
      await showGovernanceToast('mandate-denial', result.reason, 'error')
      return
    }
  }

  // Existing: mutation toast
  if (permissionInput.type === 'write') {
    await showGovernanceToast('mutation-gate', `...`)
  }
}
```

#### 5.3 `tool.execute.before` Hook (existing, extend)

**Current:** Records tool events for trajectory tracking.

**Extension:** Add observation + advisory toasts for mandate violations:

```typescript
'tool.execute.before': async (toolInput, _output) => {
  // Existing: record trajectory
  if (isHivemindManagedTool(toolInput.tool)) {
    await recordToolEvent(directory, toolInput.sessionID, `${toolInput.tool}:pre`)
  }

  // NEW: mandate observation — log violations, show advisory
  const agent = sessionAgentCache.get(toolInput.sessionID)
  if (agent) {
    observeMandateCompliance(agent, toolInput.tool, toolInput.args, toolInput.sessionID)
  }
}
```

### Module Dependency Graph

```
opencode-plugin.ts
├── mandate-enforcement.ts (NEW)
│   ├── agent-mandate-map.ts (NEW — static mandate definitions)
│   ├── sdk-context.ts (EXISTING — withClient for logging)
│   └── soft-governance.ts (EXISTING — showGovernanceToast)
├── chat-message-handler.ts (EXISTING — no changes)
├── tool-execution-handler.ts (EXISTING — no changes)
└── runtime-loader/tool-governance.ts (EXISTING — no changes)
```

---

## 6. Implementation Phases

### Phase 1: Foundation (mandate map + cache + deny)

**Deliverables:**
- `src/hooks/mandate-enforcement/agent-mandate-map.ts` — static `AgentMandateMap` with all 14 agents
- `src/hooks/mandate-enforcement/session-agent-cache.ts` — `AgentSessionCache` implementation
- `src/hooks/mandate-enforcement/index.ts` — barrel export + `checkMandate()` function
- Integration into `opencode-plugin.ts`: `permission.ask` hard deny only

**Verification:** Unit tests for `checkMandate()` against known agent+operation combinations. Integration test that `permission.ask` returns `deny` when architect tries to edit `src/**/*.ts`.

### Phase 2: Observation + Advisory (tool.execute.before)

**Deliverables:**
- `src/hooks/mandate-enforcement/mandate-observer.ts` — `observeMandateCompliance()` function
- Integration into `opencode-plugin.ts`: `tool.execute.before` advisory
- Structured logging via `client.app.log()`

**Verification:** Integration test that advisory toast is shown when hivexplorer attempts a write tool call.

### Phase 3: Session Override (runtime configuration)

**Deliverables:**
- `src/hooks/mandate-enforcement/session-override.ts` — runtime override mechanism
- Override resolution from `.hivemind/session.json`

**Verification:** Integration test that override allows normally-denied operation.

### Phase Ordering Rationale

Phase 1 is the minimal viable enforcement — hard denies prevent the most damaging violations. Phase 2 adds observability for violations that can't be blocked. Phase 3 adds flexibility for edge cases. Each phase is independently deployable and testable.

---

## 7. Test Strategy

### Unit Tests

| Test Case | Input | Expected |
|-----------|-------|----------|
| `checkMandate('architect', 'file_edit', { path: 'src/foo.ts' })` | Architect edits src | `{ allowed: false, severity: 'denied' }` |
| `checkMandate('hivemaker', 'file_edit', { path: 'src/foo.ts' })` | Hivemaker edits src | `{ allowed: true, severity: 'none' }` |
| `checkMandate('hivexplorer', 'file_edit', { path: 'readme.md' })` | Explorer edits md | `{ allowed: false, severity: 'denied' }` |
| `checkMandate('architect', 'task_delegation', { targetAgent: 'hivemaker' })` | Architect→hivemaker | `{ allowed: false, severity: 'denied' }` |
| `checkMandate('architect', 'task_delegation', { targetAgent: 'hiveq' })` | Architect→hiveq | `{ allowed: true, severity: 'none' }` |
| `checkMandate('unknown', 'file_edit', { path: 'src/foo.ts' })` | Unknown agent | `{ allowed: true, severity: 'advisory' }` |
| `sessionAgentCache.get('unknown-session')` | Cache miss | `undefined` |

### Integration Tests

| Test | Setup | Assertion |
|------|-------|-----------|
| Permission deny flow | Set cache agent→'architect', fire permission.ask with type='write', path='src/foo.ts' | `output.status === 'deny'` |
| Permission allow flow | Set cache agent→'hivemaker', fire permission.ask with type='write', path='src/foo.ts' | `output.status !== 'deny'` |
| Advisory toast | Set cache agent→'hivexplorer', fire tool.execute.before with tool='Write' | Toast shown (spy on showGovernanceToast) |
| Cache miss permissive | No cache entry, fire permission.ask | `output.status !== 'deny'` |

### Test File Location

`tests/hooks/mandate-enforcement.test.ts`

### Test Framework

`npx tsx --test tests/hooks/mandate-enforcement.test.ts` (existing pattern from AGENTS.md)

---

## 8. Key Architect Decisions

### Decision 8.1: In-Memory Cache vs. Persistent Store

| Dimension | In-Memory Map | Persistent JSON |
|-----------|---------------|-----------------|
| Latency | O(1) lookup | File I/O per lookup |
| Complexity | Simple | Requires getEffectivePaths() + fs |
| Durability | Lost on restart | Survives restart |
| Correctness | Stale if session ends | May be stale if not cleaned |

**Decision:** In-memory `Map<sessionID, agentName>`.

**Rationale:** Session→agent mapping is ephemeral. When the OpenCode process restarts, all sessions end. The cache will be repopulated on the next `chat.message` event. No persistence needed.

**Trade-off:** If a session outlives a hot-reload, the cache may be empty temporarily. Acceptable because the next `chat.message` will repopulate it, and permissive defaults prevent blocking.

### Decision 8.2: Glob Matching Library

| Option | Pros | Cons |
|--------|------|------|
| `picomatch` | Fast, already used by many tools | May not be in deps |
| `minimatch` | Standard, widely available | Slightly slower |
| Manual `path.startsWith()` | Zero deps | Inaccurate for complex patterns |

**Decision:** Use `picomatch` if available as a transitive dependency; otherwise `minimatch` (which is a standard Node.js transitive dep via glob). If neither is directly available, use simple `startsWith` with path segment boundaries as a degraded fallback.

**Trade-off:** Exact glob matching is more accurate but adds a dependency. Degraded fallback is less accurate but zero-dep.

### Decision 8.3: Enforcement Level — Hard Deny vs. Advisory

| Layer | Mechanism | What It Blocks |
|-------|-----------|---------------|
| `permission.ask` | `output.status = 'deny'` | File write/edit/delete operations |
| `tool.execute.before` | Toast + log only | Cannot block tool calls directly |
| Observation only | Structured log | Everything else |

**Decision:** Use `permission.ask` for hard deny on file operations (the only operations the SDK allows blocking). Use `tool.execute.before` for advisory warnings on non-blockable operations. Use structured logging for everything.

**Rationale:** The SDK's `permission.ask` hook is the ONLY hook that can prevent execution. `tool.execute.before` can modify args but not block. This is a hard constraint of the OpenCode plugin architecture.

### Decision 8.4: Single File vs. Module Directory

| Option | Pros | Cons |
|--------|------|------|
| Single file `mandate-enforcement.ts` | Simple, ≤300 LOC | May approach limit with 14 agents |
| Module directory `mandate-enforcement/` | Scalable, clean separation | More files to manage |

**Decision:** Module directory `src/hooks/mandate-enforcement/` with:
- `index.ts` — barrel export + core `checkMandate()` function
- `agent-mandate-map.ts` — static mandate definitions (one object per agent)
- `session-agent-cache.ts` — `AgentSessionCache` class
- `mandate-observer.ts` — `observeMandateCompliance()` for advisory layer

**Rationale:** 14 agents × 7 fields each ≈ 100 lines just for the map. With check functions, error formatting, and observer, a single file would exceed 300 LOC. Module directory keeps each file focused and under limit.

---

## 9. Risks and Mitigations

### Risk 9.1: Cache Miss Causes Unenforced Operations

**Severity:** Medium
**Likelihood:** Medium (first message in a session, or hot-reload)
**Impact:** Agent could perform one violating operation before cache is populated

**Mitigation:**
1. Permissive defaults — allow but log and toast
2. The `chat.message` hook fires BEFORE tool calls in normal flow (user message → agent response → tool calls)
3. Log cache misses at 'warn' level for audit trail

### Risk 9.2: Glob Mismatch on Path Normalization

**Severity:** Low
**Likelihood:** Low
**Impact:** False allow or false deny

**Mitigation:**
1. Normalize all paths to forward-slash, relative to project root before matching
2. Use `path.relative()` for consistent comparison
3. Unit tests cover edge cases (absolute paths, `../` traversal, symlinks)

### Risk 9.3: Agent Config Drift

**Severity:** Medium
**Likelihood:** Medium (agent YAML configs change independently)
**Impact:** Mandate map becomes stale, enforcement is wrong

**Mitigation:**
1. Agent mandate map is derived FROM the same `.opencode/agents/*.md` files
2. Add a validation script that checks mandate map consistency with agent configs
3. Design allows hot-reload of mandate map from agent configs at runtime (Phase 3)

### Risk 9.4: Performance Overhead on Every Tool Call

**Severity:** Low
**Likelihood:** Low
**Impact:** Latency added to every permission check and tool execution

**Mitigation:**
1. In-memory Map lookup is O(1)
2. Glob matching is only performed for known agents with restrictions
3. Unknown agents skip mandate check entirely (permissive default)
4. Budget: <1ms per check for glob matching on typical file paths

### Risk 9.5: Breaking Existing Permission Flows

**Severity:** High
**Likelihood:** Low
**Impact:** Legitimate operations get blocked

**Mitigation:**
1. Mandate check runs AFTER the existing `isHivemindManagedTool()` check (managed tools always pass)
2. Mandate check only runs for `permissionInput.type === 'write'` operations
3. Comprehensive integration tests cover all agent × operation combinations
4. Feature flag: `HIVEMIND_MANDATE_ENFORCEMENT=off` env var to disable

---

## 10. File Path for the New Hook File

```
src/hooks/mandate-enforcement/
├── index.ts                 # Barrel export + checkMandate() core function
├── agent-mandate-map.ts     # Static AgentMandate definitions for all 14 agents
├── session-agent-cache.ts   # AgentSessionCache class (in-memory Map)
└── mandate-observer.ts      # observeMandateCompliance() for advisory layer
```

**Modified file:**
- `src/plugin/opencode-plugin.ts` — add mandate enforcement calls to existing hooks

---

## 11. Imports Needed

### New Files

```typescript
// index.ts
import { AgentMandate, AgentMandateMap, MandateCheckResult, MandateOperation, MandateContext } from './agent-mandate-map.js'
import { sessionAgentCache } from './session-agent-cache.js'
import { formatDenialMessage } from './mandate-observer.js'

// agent-mandate-map.ts
// (pure data — no external imports, only local types)

// session-agent-cache.ts
// (no external imports — pure in-memory Map wrapper)

// mandate-observer.ts
import { withClient } from '../sdk-context.js'
import { showGovernanceToast } from '../soft-governance.js'
import type { AgentMandate, MandateContext, MandateOperation, MandateCheckResult } from './agent-mandate-map.js'
```

### Integration in opencode-plugin.ts

```typescript
// Added imports
import { checkMandate, sessionAgentCache, observeMandateCompliance } from './mandate-enforcement/index.js'
```

---

## 12. SDK Surfaces Used

| SDK Surface | Usage | Hook |
|-------------|-------|------|
| `input.sessionID` | Session identity for cache lookup | `chat.message`, `permission.ask`, `tool.execute.before` |
| `input.agent` | Agent name for cache population | `chat.message` |
| `output.status` | Setting `'deny'` to block operations | `permission.ask` |
| `output.args` | Reading tool arguments for observation | `tool.execute.before` |
| `client.tui.showToast()` | Advisory toasts (via `showGovernanceToast`) | `soft-governance.ts` |
| `client.app.log()` | Structured logging for mandate events | `mandate-observer.ts` |

### SDK Surfaces NOT Used (and why)

| Surface | Reason Not Used |
|---------|----------------|
| `context.ask()` | Mandate enforcement is automatic — no user confirmation needed |
| `tool.schema` | Not defining a new tool — hooks use native SDK types |
| `getEffectivePaths()` | Mandate map is static, no file path resolution needed for the map itself |

---

## 13. CQRS Boundary Note

**Mandate enforcement hooks are READ-ONLY.** They observe and deny but never write.

| Hook | Action | Write? |
|------|--------|--------|
| `chat.message` | Populates in-memory cache | **No** (memory only, no file writes) |
| `permission.ask` | Sets `output.status = 'deny'` or `'allow'` | **No** (SDK output mutation, not file write) |
| `tool.execute.before` | Logs + toasts | **No** (logging is observation, not state mutation) |

The session→agent cache is an **ephemeral in-memory data structure** — it does not persist to disk. It violates no CQRS principle because:
1. It's not durable state (lost on process exit)
2. It's derived data (reconstructable from `chat.message` events)
3. It doesn't bypass the tool→write CQRS boundary

The mandate map itself is a **static constant** — loaded from code, not from disk. No runtime writes to the mandate map.

---

## 14. Permissive Defaults for Unknown Agents

When the session→agent cache returns `undefined` (cache miss), or when an agent is not in the mandate map:

```typescript
/**
 * Evaluate mandate for an unknown agent.
 *
 * Permissive default: allow all operations, log at advisory level.
 */
function evaluateUnknownAgent(operation: MandateOperation, context: MandateContext): MandateCheckResult {
  return {
    allowed: true,
    reason: `Unknown agent — mandate enforcement skipped for ${operation}`,
    severity: 'advisory',
    ruleId: 'unknown-agent-permissive',
  }
}
```

**Why permissive:**
1. Unknown agents may be new agents not yet added to the mandate map
2. External plugins may register agents outside the HiveMind ecosystem
3. Blocking unknown agents would break third-party integrations
4. Advisory logging still provides audit trail

---

## 15. Session Override Mechanism

### Override Source

Session overrides allow per-session relaxation of mandates. Stored in memory only (no disk writes from hooks):

```typescript
/**
 * Runtime override for mandate enforcement.
 *
 * Allows per-session relaxation of specific mandate rules.
 * Overrides are set by the `hivemind_runtime_command` tool (the only
 * write-side tool authorized to modify enforcement state).
 *
 * @internal-only
 */
export interface MandateOverride {
  /** Session ID this override applies to */
  readonly sessionID: string
  /** Agent this override applies to */
  readonly agent: string
  /** Operations that are temporarily allowed despite mandate */
  readonly allowedOperations: readonly MandateOperation[]
  /** Reason for the override (audit trail) */
  readonly reason: string
  /** When this override expires (ISO 8601) */
  readonly expiresAt: string
}

/** Active overrides indexed by `${sessionID}:${agent}` */
const activeOverrides = new Map<string, MandateOverride>()
```

### Override Resolution

```typescript
function checkOverride(sessionID: string, agent: string, operation: MandateOperation): boolean {
  const key = `${sessionID}:${agent}`
  const override = activeOverrides.get(key)
  if (!override) return false

  // Check expiry
  if (new Date(override.expiresAt) < new Date()) {
    activeOverrides.delete(key)
    return false
  }

  return override.allowedOperations.includes(operation)
}
```

### Override Lifetime

Overrides are ephemeral:
- Set by `hivemind_runtime_command` tool (write-side, CQRS compliant)
- Stored in memory only
- Auto-expire after configurable TTL (default: 1 hour)
- Cleared on process exit (SDK context reset)

---

## 16. Constraint: tool.schema (Zod)

**Status: NOT APPLICABLE for this work.**

The mandate enforcement system is a **hook module**, not a tool. Hooks use native SDK types (the `Hooks` interface from `@opencode-ai/plugin`), not Zod schemas. The `tool.schema` constraint applies only to tools defined via `tool()` from the plugin SDK.

If a future phase adds a `hivemind_runtime_command` sub-command to set overrides, that command's args WOULD use `tool.schema`.

---

## 17. Constraint: context.sessionID / context.agent

**Status: PARTIALLY APPLICABLE.**

Hooks do NOT receive a `ToolContext` — they receive hook-specific input/output pairs. However:

- `input.sessionID` is available in `chat.message`, `permission.ask`, and `tool.execute.before` hooks
- `input.agent` is available in `chat.message` but NOT in `permission.ask` or `tool.execute.before`

This is the exact design challenge addressed by the session→agent cache (Section 2).

---

## 18. Constraint: npx tsc --noEmit

**Status: APPLICABLE.**

After any implementation of this design, `npx tsc --noEmit` must pass. All types must be explicit. No `any` types except where interacting with SDK's own `any` types (e.g., `permissionInput.metadata`).

The design's TypeScript interfaces are defined to compile cleanly against the SDK's `Hooks` type from `@opencode-ai/plugin`.

---

## 19. Constraint: JSDoc @param, @returns, @example

**Status: APPLICABLE.**

All exported functions and types include:
- `@param` for each parameter
- `@returns` describing the return value
- `@example` showing usage
- `@internal-only` classification tag

See Section 1 for complete JSDoc examples on all interfaces.

---

## 20. Constraint: CQRS (tools own writes, hooks are read-only)

**Status: ENFORCED BY DESIGN.**

The mandate enforcement system is entirely hook-based. It:
- Reads agent identity from `chat.message` events
- Reads tool call metadata from `permission.ask` and `tool.execute.before` events
- Sets SDK output values (`output.status`, `output.args`) — these are SDK-mediated, not file writes
- Writes to in-memory cache only (ephemeral, non-durable)

The only write-side path is through the existing `hivemind_runtime_command` tool for setting overrides — this respects CQRS because tools own writes.

---

## 21. Constraint: client.app.log() for structured logging

**Status: APPLICABLE.**

All mandate enforcement events are logged via `withClient()` → `client.app.log()`:

```typescript
await withClient(async (client) => {
  client.app.log({
    level: 'warn',
    message: `[mandate] ${agent} violated mandate: ${result.reason}`,
    data: { agent, operation, ruleId: result.ruleId, sessionID },
  })
})
```

Uses the existing `withClient()` pattern from `sdk-context.ts` (lines 85-98) for safe client access with fallback.

---

## 22. Constraint: permission.ask / context.ask() for state mutations

**Status: NOT APPLICABLE for this work.**

The mandate enforcement system does NOT perform state mutations. It:
- Denies operations via `output.status = 'deny'` (SDK-mediated, not a state mutation)
- Shows toasts (non-mutating UI feedback)
- Logs events (observation, not mutation)

If Phase 3 adds override setting, the override would be set by `hivemind_runtime_command` tool which already uses `permission.ask` for its own writes.

---

## 23. Constraint: getEffectivePaths() for path resolution

**Status: NOT APPLICABLE for this work.**

The mandate enforcement system does NOT write to `.hivemind/` paths. It reads no files from `.hivemind/`. All mandate data is:
- Static (hardcoded in `agent-mandate-map.ts`)
- Ephemeral (in-memory cache and overrides)

If a future phase loads mandate overrides from `.hivemind/session.json`, it MUST use `getEffectivePaths()` to resolve the path.

---

## 24. Constraint: classify interfaces as internal-only

**Status: ENFORCED BY DESIGN.**

All new interfaces include the `@internal-only` JSDoc tag:
- `AgentSessionCache` — internal-only
- `MandateCheckResult` — internal-only
- `MandateContext` — internal-only
- `MandateOperation` — internal-only
- `AgentMandate` — internal-only
- `AgentMandateMap` — internal-only
- `MandateOverride` — internal-only

None of these types are exported from the plugin's public API. They exist solely within the hook module.

---

## 25. Constraint: new hook file in src/hooks/

**Status: ENFORCED BY DESIGN.**

All new files are in `src/hooks/mandate-enforcement/`:

```
src/hooks/mandate-enforcement/
├── index.ts
├── agent-mandate-map.ts
├── session-agent-cache.ts
└── mandate-observer.ts
```

This follows the existing pattern:
- `src/hooks/sdk-context.ts` — SDK context management
- `src/hooks/soft-governance.ts` — toast governance
- `src/hooks/chat-message-handler.ts` — chat message handling
- `src/hooks/tool-execution-handler.ts` — tool execution handling
- `src/hooks/runtime-loader/` — runtime tool governance (module directory)

---

## 26. Constraint: ≤300 LOC, no god functions, no dead code

**Status: ENFORCED BY DESIGN.**

| File | Estimated LOC | Purpose |
|------|-------------|---------|
| `index.ts` | ~80 LOC | Barrel export + `checkMandate()` + `formatDenialMessage()` |
| `agent-mandate-map.ts` | ~120 LOC | 14 agent mandate definitions + types |
| `session-agent-cache.ts` | ~50 LOC | In-memory cache + override management |
| `mandate-observer.ts` | ~80 LOC | `observeMandateCompliance()` + logging |

**Total: ~330 LOC across 4 files.** Each file is well under 300 LOC individually.

**No god functions:** Each function has a single responsibility:
- `checkMandate()` — evaluates a single operation against a single agent's mandate
- `observeMandateCompliance()` — logs and toasts violations
- `formatDenialMessage()` — formats human-readable denial
- `sessionAgentCache.set/get/clear()` — cache operations

**No dead code:** Every function is called from the integration points in `opencode-plugin.ts`. No unused exports.

**No zombies:** No deprecated patterns. No TODOs without tracking. No commented-out code.

---

## Consequences

### What Becomes Easier

1. **Agent boundary enforcement** — Runtime prevents architect from accidentally implementing code
2. **Audit trail** — Every mandate violation is logged with agent, operation, and reason
3. **Debugging** — Clear error messages tell agents exactly what they can't do and why
4. **Team scaling** — New agents get automatic mandate enforcement from the map

### What Becomes Harder

1. **Agent config maintenance** — Mandate map must stay in sync with `.opencode/agents/*.md` YAML
2. **Testing burden** — 14 agents × 7 operations = 98 test combinations minimum
3. **Override complexity** — Session overrides add a stateful dimension to enforcement

### Reversibility

The mandate enforcement system is **fully reversible**:
- Set `HIVEMIND_MANDATE_ENFORCEMENT=off` to disable all enforcement
- Remove the import from `opencode-plugin.ts` to uninstall
- Delete the `src/hooks/mandate-enforcement/` directory

No persistent state is created. No data migration required. No other modules depend on it.

---

## Alternatives Considered

### Alternative 1: Pure YAML Enforcement (rejected)

Rely entirely on the existing `.opencode/agents/*.md` YAML `permissions` blocks with no runtime hook.

**Why rejected:** YAML permissions define capability, not behavioral mandate. They can't express "architect can edit `*.md` files but only in `.hivemind/` and `.opencode/`" — the YAML glob support is limited to simple allow/deny patterns. Runtime enforcement provides richer matching and clear error messages.

### Alternative 2: Middleware Tool Wrapper (rejected)

Create a "proxy tool" that wraps all other tools and enforces mandates before delegating.

**Why rejected:** This would require modifying every tool registration, adding latency to every call, and creating a single point of failure. Hook-based enforcement is non-invasive — existing tools are untouched.

### Alternative 3: External Governance Service (rejected)

Run a separate process that receives tool call events and returns allow/deny decisions.

**Why rejected:** Adds deployment complexity, network latency, and a failure mode (service down = all operations blocked or all allowed). In-process hook enforcement is simpler, faster, and more reliable.

---

## Implementation Guidance for Hivemaker

1. **Start with `agent-mandate-map.ts`** — Define the `AgentMandate` type and create the static map. This is pure data, no logic.
2. **Then `session-agent-cache.ts`** — Simple `Map<string, string>` wrapper with `set`, `get`, `clear` methods.
3. **Then `index.ts`** — `checkMandate()` function that matches agent → mandate → evaluates operation against globs.
4. **Then `mandate-observer.ts`** — `observeMandateCompliance()` that calls `checkMandate()` and logs/toasts.
5. **Finally integrate** — Add calls to existing hooks in `opencode-plugin.ts`.

### Verification Criteria for Hiveq

1. All 14 agents have correct mandate entries matching the table in Section 3
2. `checkMandate()` returns correct results for all test cases in Section 7
3. `permission.ask` hook correctly denies architect/hivexplorer edits to `src/**`
4. `permission.ask` hook correctly allows hivemaker/hitea/hivehealer edits to `src/**`
5. Cache miss results in permissive default (allow + log)
6. No file writes from any hook module
7. `npx tsc --noEmit` passes
8. All files under 300 LOC
9. All exports have JSDoc with `@internal-only` tag
10. No `any` types except where SDK requires it
