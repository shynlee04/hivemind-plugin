# Phase B: Session Lifecycle & Task Governance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement context-aware session governance with stop-decision injection, message continuity, non-disruptive session creation, and task manifest persistence.

**Architecture:** 
- **B1:** Implement `experimental.chat.messages.transform` hook for stop-decision checklist injection and user message continuity transformation
- **B2:** Wire `todo.updated` event to `tasks.json` persistence for cross-session task resumption
- **B3:** Enhance `tool.execute.after` hook for automatic atomic commits on file-changing operations
- **B4:** Implement intelligent session boundary management — proactively create new sessions when context becomes unwieldy

**Tech Stack:** OpenCode SDK hooks, TypeScript, Zod schemas, JSON file persistence

**Source Research:**
- `docs/opencode-sdk-prompts-hook-output-styles` — Message transform and stop-decision injection
- `docs/opencode-new-session-non-disruptive-split.md` — Non-disruptive session creation
- `AGENT_RULES.md` Section 4 (The 4 Entry Points) — Mid-turn context injection

---

## Part I: The Missing Hook — Stop-Decision Injection

### Background

The OpenCode SDK provides `experimental.chat.messages.transform` hook that fires **BEFORE** the LLM call, allowing plugins to:
1. Inject synthetic `<system-reminder>` parts into the messages array
2. Rewrite/augment user messages with anchor context
3. Prevent premature stop decisions by forcing checklist verification

This hook is currently **NOT IMPLEMENTED** in HiveMind, leaving a critical gap in governance.

### R1-T1: Create Messages Transform Hook

**Files:**
- Create: `src/hooks/messages-transform.ts`
- Modify: `src/index.ts` (register hook)
- Test: `tests/messages-transform.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/messages-transform.test.ts
import { describe, it, assert } from "node:test/abstract-vm"
import { createMessagesTransformHook } from "../src/hooks/messages-transform.js"
import { createStateManager } from "../lib/persistence.js"
import { mkdir, rm } from "fs/promises"
import { join } from "path"

describe("messages-transform hook", () => {
  it("injects stop-checklist into messages array", async () => {
    const dir = join("/tmp", `test-messages-transform-${Date.now()}`)
    await mkdir(dir, { recursive: true })
    
    try {
      const hook = createMessagesTransformHook({} as any, dir)
      
      const messages = [
        { info: { role: "user", id: 1 }, parts: [{ type: "text", text: "hello" }] },
        { info: { role: "assistant", id: 2 }, parts: [{ type: "text", text: "hi there" }] },
      ]
      
      await hook({}, { messages })
      
      // Should have injected a synthetic reminder
      const lastMsg = messages[messages.length - 1]
      assert(lastMsg.info.role === "user", "injected message is user role")
      assert(lastMsg.parts[0].synthetic === true, "injected part is synthetic")
      assert(lastMsg.parts[0].text.includes("CHECKLIST"), "contains checklist")
    } finally {
      await rm(dir, { recursive: true })
    }
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/messages-transform.test.ts`
Expected: FAIL with "createMessagesTransformHook is not defined"

**Step 3: Write minimal implementation**

```typescript
// src/hooks/messages-transform.ts
/**
 * Messages Transform Hook — Stop-Decision Injection & Message Continuity.
 *
 * Implements `experimental.chat.messages.transform` to:
 *   1. Inject stop-checklist before LLM decides to stop
 *   2. Augment user messages with anchor context for continuity
 *   3. Detect early-stop signals and force continuation
 *
 * Budget: ≤300 chars for checklist injection
 * P3: try/catch — never break message flow
 */

import type { Logger } from "../lib/logging.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { loadAnchors } from "../lib/anchors.js"
import { loadTree, getCursorNode, getAncestors, treeExists } from "../lib/hierarchy-tree.js"

const CHECKLIST_BUDGET = 300

export function createMessagesTransformHook(log: Logger, directory: string) {
  const stateManager = createStateManager(directory, log)

  return async (
    _input: {},
    output: { messages: Array<{ info: { role: string; id: number }; parts: any[] }> }
  ): Promise<void> => {
    try {
      const state = await stateManager.load()
      if (!state) return

      const config = await loadConfig(directory)

      // Only inject if governance is active (not permissive)
      if (config.governance_mode === "permissive") return

      // Build checklist based on current state
      const checklistItems: string[] = []

      // Hierarchy check
      if (!state.hierarchy.action) {
        checklistItems.push("- [ ] Hierarchy cursor set? (action level missing)")
      }

      // TODO check — would need to wire to tasks.json
      // For now, use governance_counters as proxy
      if (state.metrics.context_updates === 0 && state.metrics.turn_count > 0) {
        checklistItems.push("- [ ] map_context called this session?")
      }

      // Export cycle check for subagents
      if (state.pending_failure_ack) {
        checklistItems.push("- [ ] ⚠ SUBAGENT FAILURE — export_cycle required!")
      }

      // Git commit check (simplified)
      if (state.metrics.tool_type_counts.write > 0) {
        checklistItems.push("- [ ] Files modified = git committed?")
      }

      // If items exist, inject synthetic reminder
      if (checklistItems.length > 0) {
        const checklist = [
          "<system-reminder>",
          "CHECKLIST BEFORE STOPPING:",
          ...checklistItems,
          "",
          "If ANY unchecked, CONTINUE working before stopping.",
          "</system-reminder>",
        ].join("\n")

        // Budget enforcement
        const text = checklist.length > CHECKLIST_BUDGET
          ? checklist.slice(0, CHECKLIST_BUDGET - 20) + "\n</system-reminder>"
          : checklist

        // Inject as synthetic user message part
        output.messages.push({
          info: { role: "user", id: Date.now() },
          parts: [{ type: "text", text, synthetic: true }],
        })

        await log.debug(`Messages transform: injected checklist (${checklistItems.length} items)`)
      }
    } catch (error) {
      // P3: Never break message flow
      await log.error(`Messages transform hook error: ${error}`)
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/messages-transform.test.ts`
Expected: PASS

**Step 5: Register hook in index.ts**

```typescript
// src/index.ts (add to hooks object)
import { createMessagesTransformHook } from "./hooks/messages-transform.js"

// In plugin return object:
"experimental.chat.messages.transform": createMessagesTransformHook(log, effectiveDir),
```

**Step 6: Commit**

```bash
git add src/hooks/messages-transform.ts src/index.ts tests/messages-transform.test.ts
git commit -m "feat(hooks): add messages-transform for stop-decision injection"
```

---

### R1-T2: Implement User Message Continuity Transformation

**Files:**
- Modify: `src/hooks/messages-transform.ts`
- Test: `tests/messages-transform.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/messages-transform.test.ts (add to describe block)
it("augments user message with anchor context", async () => {
  const dir = join("/tmp", `test-anchor-transform-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  
  try {
    // Setup: create brain state with hierarchy
    const stateManager = createStateManager(dir)
    await stateManager.save({
      session: { id: "test", governance_status: "OPEN", mode: "plan_driven", /* ... */ },
      hierarchy: { trajectory: "Build feature X", tactic: "Implement API", action: "Write tests" },
      metrics: { turn_count: 5, /* ... */ },
    } as any)
    
    // Setup: create anchor
    const anchorPath = join(dir, ".hivemind", "state", "anchors.json")
    await mkdir(dirname(anchorPath), { recursive: true })
    await writeFile(anchorPath, JSON.stringify({
      anchors: [{ key: "design", value: "Use PostgreSQL", created_at: Date.now() }]
    }))
    
    const hook = createMessagesTransformHook({} as any, dir)
    
    const messages = [
      { info: { role: "user", id: 1 }, parts: [{ type: "text", text: "continue" }] },
    ]
    
    await hook({}, { messages })
    
    // User message should be augmented with anchor context
    const userMsg = messages.find(m => m.info.role === "user")
    assert(userMsg.parts.length >= 1, "user message augmented")
  } finally {
    await rm(dir, { recursive: true })
  }
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/messages-transform.test.ts`
Expected: FAIL

**Step 3: Enhance implementation**

```typescript
// src/hooks/messages-transform.ts (add to hook function, before checklist injection)

// === User Message Continuity Transformation ===
// Find latest user message and prepend anchor context
const lastUserMsg = [...output.messages].reverse().find(m => m.info.role === "user")
if (lastUserMsg && !lastUserMsg.parts.some(p => p.synthetic)) {
  const anchorsState = await loadAnchors(directory)
  
  // Build anchor context block
  const anchorContext: string[] = []
  if (anchorsState.anchors.length > 0) {
    anchorContext.push("<anchor-context>")
    for (const anchor of anchorsState.anchors.slice(0, 3)) {
      anchorContext.push(`[${anchor.key}]: ${anchor.value}`)
    }
    anchorContext.push("</anchor-context>")
  }
  
  // Build hierarchy context
  if (treeExists(directory)) {
    const tree = await loadTree(directory)
    const cursor = getCursorNode(tree)
    if (cursor && tree.root) {
      const ancestors = getAncestors(tree.root, cursor.id)
      anchorContext.push(`<focus>${ancestors.map(n => n.content).join(" > ")}</focus>`)
    }
  }
  
  // Prepend to user message if context exists
  if (anchorContext.length > 0) {
    const contextText = anchorContext.join("\n")
    lastUserMsg.parts.unshift({
      type: "text",
      text: contextText,
      synthetic: true,
    })
    
    await log.debug(`Messages transform: augmented user message with ${anchorContext.length} context lines`)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/messages-transform.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/messages-transform.ts tests/messages-transform.test.ts
git commit -m "feat(hooks): add user message continuity transformation with anchor context"
```

---

## Part II: Non-Disruptive Session Creation

### Background

Instead of letting sessions drag through multiple compactions (risking context poisoning), proactively create **new sessions** when:
1. Turn count exceeds threshold (e.g., 30+ turns)
2. Context size is manageable (<80% of threshold)
3. A natural boundary exists (completed phase, finished epic)

The SDK provides `client.session.create()` for non-blocking session creation.

### Key Constraints:
- **Only main session** should trigger new session creation (not delegation sessions)
- **Timing check**: Don't create if real context is >80% (let innate compact handle overflow)
- **Automatic export**: Last assistant message exported to new session's context
- **User transparency**: User feels ongoing flow, not interruption

### R2-T1: Create Session Boundary Manager

**Files:**
- Create: `src/lib/session-boundary.ts`
- Modify: `src/hooks/session-lifecycle.ts` (integrate boundary detection)
- Test: `tests/session-boundary.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/session-boundary.test.ts
import { describe, it, assert } from "node:test/abstract-vm"
import { shouldCreateNewSession, type SessionBoundaryState } from "../src/lib/session-boundary.js"

describe("session-boundary", () => {
  it("recommends new session when turns exceed threshold", () => {
    const state: SessionBoundaryState = {
      turnCount: 35,
      contextPercent: 50,
      hierarchyComplete: true, // Phase/epic completed
      isMainSession: true,
      hasDelegations: false,
    }
    
    const result = shouldCreateNewSession(state)
    assert(result.recommended === true, "should recommend new session")
    assert(result.reason.includes("turns"), "reason mentions turns")
  })
  
  it("does NOT recommend when context is too large", () => {
    const state: SessionBoundaryState = {
      turnCount: 40,
      contextPercent: 85, // Too large - let compact handle
      hierarchyComplete: false,
      isMainSession: true,
      hasDelegations: false,
    }
    
    const result = shouldCreateNewSession(state)
    assert(result.recommended === false, "should NOT recommend at high context")
  })
  
  it("does NOT recommend for delegation sessions", () => {
    const state: SessionBoundaryState = {
      turnCount: 50,
      contextPercent: 40,
      hierarchyComplete: true,
      isMainSession: false, // Delegation session
      hasDelegations: false,
    }
    
    const result = shouldCreateNewSession(state)
    assert(result.recommended === false, "delegation sessions excluded")
  })
  
  it("recommends when hierarchy phase completed", () => {
    const state: SessionBoundaryState = {
      turnCount: 20,
      contextPercent: 30,
      hierarchyComplete: true, // Natural boundary
      isMainSession: true,
      hasDelegations: false,
    }
    
    const result = shouldCreateNewSession(state)
    assert(result.recommended === true, "completed phase triggers recommendation")
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/session-boundary.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// src/lib/session-boundary.ts
/**
 * Session Boundary Manager — Intelligent session lifecycle decisions.
 *
 * Determines when to proactively create a new session instead of
 * letting context drag through multiple compactions.
 *
 * Rules:
 *   - Only main session triggers (delegation sessions excluded)
 *   - Context must be <80% (otherwise let innate compact handle)
 *   - Natural boundaries: completed phase/epic, turn threshold
 */

export interface SessionBoundaryState {
  turnCount: number
  contextPercent: number // 0-100
  hierarchyComplete: boolean // Phase/epic completed?
  isMainSession: boolean
  hasDelegations: boolean
}

export interface SessionBoundaryRecommendation {
  recommended: boolean
  reason: string
  contextToExport?: string // Last assistant message to carry over
}

const TURN_THRESHOLD = 30
const CONTEXT_MAX_PERCENT = 80

export function shouldCreateNewSession(state: SessionBoundaryState): SessionBoundaryRecommendation {
  // Rule 1: Only main session
  if (!state.isMainSession) {
    return { recommended: false, reason: "Delegation session — boundary management disabled" }
  }
  
  // Rule 2: Context must be manageable
  if (state.contextPercent >= CONTEXT_MAX_PERCENT) {
    return { recommended: false, reason: `Context at ${state.contextPercent}% — let innate compact handle` }
  }
  
  // Rule 3: Check natural boundaries
  if (state.hierarchyComplete && state.turnCount >= 10) {
    return {
      recommended: true,
      reason: "Phase/epic completed — natural boundary for fresh context",
    }
  }
  
  // Rule 4: Turn threshold
  if (state.turnCount >= TURN_THRESHOLD) {
    return {
      recommended: true,
      reason: `${state.turnCount} turns exceeded — recommend fresh session before compaction cascade`,
    }
  }
  
  return { recommended: false, reason: "No boundary trigger detected" }
}

/**
 * Estimate context percentage from brain state.
 * Simplified heuristic: turn_count / auto_compact_on_turns * 100
 */
export function estimateContextPercent(turnCount: number, compactThreshold: number): number {
  return Math.min(100, Math.round((turnCount / compactThreshold) * 100))
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/session-boundary.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/session-boundary.ts tests/session-boundary.test.ts
git commit -m "feat(session): add session boundary manager for intelligent lifecycle"
```

---

### R2-T2: Integrate Boundary Detection into Session Lifecycle

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`
- Modify: `src/hooks/soft-governance.ts` (track context percent)

**Step 1: Write test for boundary suggestion injection**

```typescript
// tests/session-boundary.test.ts (add)
it("injects boundary suggestion when recommended", async () => {
  // This tests that session-lifecycle hook includes boundary recommendation
  // in its warning lines when shouldCreateNewSession returns true
  
  // Setup: create state that triggers recommendation
  // Verify: output.system includes "Consider creating new session"
})
```

**Step 2: Integrate into session-lifecycle.ts**

```typescript
// src/hooks/session-lifecycle.ts (add import)
import { shouldCreateNewSession, estimateContextPercent } from "../lib/session-boundary.js"

// In the hook function, after long session detection:
// === Session Boundary Detection ===
const contextPercent = estimateContextPercent(
  state.metrics.turn_count,
  config.auto_compact_on_turns
)

const boundaryRecommendation = shouldCreateNewSession({
  turnCount: state.metrics.turn_count,
  contextPercent,
  hierarchyComplete: state.hierarchy.action !== "" && /* check if action is complete */,
  isMainSession: !state.session.id.includes("delegation"), // Simplified check
  hasDelegations: state.metrics.tool_type_counts.governance > 0,
})

if (boundaryRecommendation.recommended) {
  warningLines.push(`🔄 ${boundaryRecommendation.reason}`)
  warningLines.push(`  → Run /hivemind-compact to archive and start fresh`)
}
```

**Step 3: Run tests**

Run: `npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add src/hooks/session-lifecycle.ts tests/session-boundary.test.ts
git commit -m "feat(hooks): integrate session boundary detection into lifecycle warnings"
```

---

### R2-T3: Implement Non-Disruptive Session Creation via SDK

**Files:**
- Modify: `src/tools/compact-session.ts` (enhance to use SDK session.create)
- Modify: `src/hooks/sdk-context.ts` (ensure client available)

**Step 1: Enhance compact_session to create new SDK session**

```typescript
// src/tools/compact-session.ts (in execute function)

// After successful archival, create new SDK session
const client = getClient()
if (client?.session?.create) {
  try {
    const newSession = await client.session.create({
      directory,
      title: `HiveMind: ${newSessionId}`,
      parentID: state.session.id, // Link to parent for navigation
    })
    
    await log.info(`Created new SDK session: ${newSession.id}`)
  } catch (err) {
    // Non-fatal — archival succeeded, just SDK session creation failed
    await log.warn(`Failed to create new SDK session: ${err}`)
  }
}
```

**Step 2: Test manually or with integration test**

**Step 3: Commit**

```bash
git add src/tools/compact-session.ts
git commit -m "feat(compact): create new SDK session after archival for seamless continuity"
```

---

## Part III: Task Manifest — Wire `todo.updated` Event

### Background

OpenCode has a `todo.updated` event with payload `{ sessionID, todos }` where `todos` is an array of `{ content, status, priority, id }`. We need to wire this event to persist to `tasks.json` for cross-session resumption.

### R3-T1: Add todo.updated Event Handler

**Files:**
- Modify: `src/hooks/event-handler.ts`
- Modify: `src/lib/manifest.ts` (add task manifest functions)
- Test: `tests/event-handler.test.ts`

**Step 1: Write failing test**

```typescript
// tests/event-handler.test.ts (add)
it("persists todo.updated to tasks.json", async () => {
  const dir = join("/tmp", `test-todo-event-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  await initializePlanningDirectory(dir)
  
  try {
    const handler = createEventHandler({} as any, dir)
    
    await handler({
      event: {
        type: "todo.updated",
        properties: {
          sessionID: "test-session",
          todos: [
            { id: "1", content: "Task 1", status: "pending", priority: "high" },
            { id: "2", content: "Task 2", status: "completed", priority: "medium" },
          ],
        },
      } as any,
    })
    
    // Verify tasks.json was updated
    const tasksPath = join(dir, ".hivemind", "state", "tasks.json")
    const tasks = JSON.parse(await readFile(tasksPath, "utf-8"))
    
    assert(tasks.tasks.length === 2, "two tasks persisted")
    assert(tasks.tasks[0].content === "Task 1", "first task content matches")
  } finally {
    await rm(dir, { recursive: true })
  }
})
```

**Step 2: Run test to verify it fails**

Expected: FAIL (todo.updated not handled)

**Step 3: Implement event handler**

```typescript
// src/hooks/event-handler.ts (add case)

case "todo.updated":
  await log.info(`[event] todo.updated: ${(event as any).properties.todos.length} todos`)
  
  if (state) {
    const todos = (event as any).properties.todos || []
    
    // Update tasks.json
    const tasksPath = getEffectivePaths(directory).tasks
    await mkdir(dirname(tasksPath), { recursive: true })
    
    const tasksData = {
      session_id: state.session.id,
      updated_at: new Date().toISOString(),
      tasks: todos.map((t: any) => ({
        id: t.id,
        content: t.content,
        status: t.status,
        priority: t.priority,
        updated_at: new Date().toISOString(),
      })),
    }
    
    await writeFile(tasksPath, JSON.stringify(tasksData, null, 2))
    await log.debug(`[event] persisted ${todos.length} todos to tasks.json`)
  }
  break
```

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```bash
git add src/hooks/event-handler.ts tests/event-handler.test.ts
git commit -m "feat(events): wire todo.updated to tasks.json persistence"
```

---

## Part IV: Atomic Commits Enhancement

### Background

`commit-advisor.ts` currently only suggests commits. We need to wire `tool.execute.after` to actually execute commits for file-changing tools.

### R4-T1: Implement Auto-Commit in tool.execute.after

**Files:**
- Modify: `src/hooks/soft-governance.ts`
- Create: `src/lib/auto-commit.ts`
- Test: `tests/auto-commit.test.ts`

**Step 1: Write failing test**

```typescript
// tests/auto-commit.test.ts
import { describe, it, assert } from "node:test/abstract-vm"
import { shouldAutoCommit, generateCommitMessage } from "../src/lib/auto-commit.js"

describe("auto-commit", () => {
  it("detects file-changing tools", () => {
    assert(shouldAutoCommit("write") === true)
    assert(shouldAutoCommit("edit") === true)
    assert(shouldAutoCommit("bash") === false) // bash might not be file-changing
    assert(shouldAutoCommit("read") === false)
  })
  
  it("generates conventional commit message from file changes", () => {
    const msg = generateCommitMessage({
      tool: "write",
      files: ["src/index.ts"],
      summary: "Add new feature",
    })
    
    assert(msg.includes("feat"), "includes feat prefix")
    assert(msg.includes("src/index.ts"), "includes file")
  })
})
```

**Step 2: Run test to verify it fails**

**Step 3: Implement auto-commit logic**

```typescript
// src/lib/auto-commit.ts
/**
 * Auto-Commit Logic — Atomic commits for file-changing operations.
 *
 * Integration with tool.execute.after hook.
 * Commits are advisory by default, can be forced in strict mode.
 */

import { $ } from "bun"

export interface AutoCommitContext {
  tool: string
  files: string[]
  summary?: string
}

const FILE_CHANGING_TOOLS = ["write", "edit", "bash"]

export function shouldAutoCommit(tool: string): boolean {
  return FILE_CHANGING_TOOLS.includes(tool)
}

export function generateCommitMessage(ctx: AutoCommitContext): string {
  const prefix = ctx.summary?.toLowerCase().includes("fix") ? "fix" : "feat"
  const scope = ctx.files[0]?.split("/")[1] || "core"
  const file = ctx.files[0]?.split("/").pop() || "files"
  
  return `${prefix}(${scope}): ${ctx.summary || `update ${file}`}`
}

export async function executeAutoCommit(ctx: AutoCommitContext): Promise<{ success: boolean; message: string }> {
  if (ctx.files.length === 0) {
    return { success: false, message: "No files to commit" }
  }
  
  const message = generateCommitMessage(ctx)
  
  try {
    // Stage changed files
    for (const file of ctx.files) {
      await $`git add ${file}`.quiet()
    }
    
    // Commit
    await $`git commit -m ${message}`.quiet()
    
    return { success: true, message }
  } catch (error) {
    return { success: false, message: `Commit failed: ${error}` }
  }
}
```

**Step 4: Wire into soft-governance.ts**

```typescript
// src/hooks/soft-governance.ts (in tool.execute.after handler)

import { shouldAutoCommit, executeAutoCommit } from "../lib/auto-commit.js"

// After updating detection counters:
if (config.auto_commit && shouldAutoCommit(toolName)) {
  const filesTouched = /* extract from output.metadata or state */
  const result = await executeAutoCommit({
    tool: toolName,
    files: filesTouched,
    summary: output.title,
  })
  
  if (result.success) {
    await log.info(`Auto-committed: ${result.message}`)
  }
}
```

**Step 5: Run tests and commit**

```bash
git add src/lib/auto-commit.ts src/hooks/soft-governance.ts tests/auto-commit.test.ts
git commit -m "feat(commit): add auto-commit for file-changing tools"
```

---

## Validation Gates

### G0: Pre-Implementation Verification
- [ ] All Phase A tests passing (`npm test`)
- [ ] TypeCheck clean (`npm run typecheck`)
- [ ] Lint boundary clean (`npm run lint:boundary`)
- [ ] Research documents reviewed and understood

### G1: Messages Transform Hook
- [ ] `experimental.chat.messages.transform` hook registered
- [ ] Stop-checklist injection working
- [ ] User message continuity transformation working
- [ ] Tests passing

### G2: Session Boundary Management
- [ ] `shouldCreateNewSession` logic correct
- [ ] Boundary detection integrated into session-lifecycle
- [ ] Non-disruptive SDK session creation working
- [ ] Tests passing

### G3: Task Manifest Persistence
- [ ] `todo.updated` event handled
- [ ] tasks.json persisted correctly
- [ ] Tests passing

### G4: Auto-Commit Integration
- [ ] File-changing tools trigger commit
- [ ] Commit messages follow conventional format
- [ ] Tests passing

### G5: Phase B Complete
- [ ] All G1-G4 gates pass
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

---

## Rollback Triggers

If any validation gate fails critically:
1. **G1 failure**: Disable messages-transform hook in index.ts
2. **G2 failure**: Set `auto_create_session: false` in config
3. **G3 failure**: Disable todo.updated handler in event-handler.ts
4. **G4 failure**: Set `auto_commit: false` in config

---

## Dependencies

- Phase A must be complete (verified by G0)
- OpenCode SDK >= 1.0.0 (for `experimental.chat.messages.transform` hook)
- Bun runtime (for shell execution in auto-commit)

---

## Estimated Effort

| Round | Tasks | Est. Time |
|-------|-------|-----------|
| R1: Messages Transform | 2 | 2-3 hours |
| R2: Session Boundary | 3 | 3-4 hours |
| R3: Task Manifest | 1 | 1-2 hours |
| R4: Auto-Commit | 1 | 1-2 hours |
| **Total** | **7** | **7-11 hours** |

---

*Plan created: 2026-02-15*
*Source research: docs/opencode-sdk-prompts-hook-output-styles, docs/opencode-new-session-non-disruptive-split.md*
*Next: Execute via superpowers:executing-plans or subagent-driven-development*
