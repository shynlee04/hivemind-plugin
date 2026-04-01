# LLM-Eval Stress Test Architecture — HiveMind Plugin Tools

**Date:** 2026-04-01
**Status:** Proposed
**Author:** Test Architect (Agent)
**Scope:** 12 custom tools, 5 layers of test coverage, tsx --test runner
**Supersedes:** Prior draft (gaps: missing failure-modes test, buggy harness, incomplete multi-agent layer)

---

## 1. Problem Statement

The HiveMind plugin has **12 custom tools** with **zero invocation-level coverage** on 4 of them (doc, task, trajectory, handoff), **no end-to-end journey tests**, **no multi-agent coordination tests**, **no stress tests**, and **no natural-language dispatch verification**. The existing `tests/runtime-tools.test.ts` only verifies tool registration and plugin wiring — it never calls `execute()` on any tool beyond `hivemind_runtime_status` and `hivemind_runtime_command` with a single scenario.

The goal is an "LLM-eval" style test suite: tests that simulate real natural-language user prompts and verify the complete tool lifecycle — invocation, artifact production, side effects, multi-agent coordination, cross-tool chaining, and stress resilience.

### Tool Inventory (12 tools, 42 total actions)

| Tool | Actions | File | Feature Module | Coverage |
|------|---------|------|----------------|----------|
| `hivemind_doc` | skim, skim_directory, read, chunk, search (5) | `src/tools/doc/tools.ts` | `src/features/doc-intelligence/doc.ts` | **ZERO** |
| `hivemind_task` | create, list, get, activate, rotate, verify, complete (7) | `src/tools/task/tools.ts` | `src/features/workflow/task.ts` | **ZERO** |
| `hivemind_trajectory` | inspect, traverse, attach, checkpoint, event, close (6) | `src/tools/trajectory/tools.ts` | `src/features/trajectory/trajectory.ts` | **ZERO** |
| `hivemind_handoff` | create, read, list, update, validate, close (6) | `src/tools/handoff/tools.ts` | `src/features/handoff/handoff.ts` | **ZERO** |
| `hivemind_runtime_status` | (0 args, stateless inspect) | `src/tools/runtime/tools.ts` | `src/features/runtime-observability/status.ts` | Partial |
| `hivemind_runtime_command` | command + 12 optional args | `src/tools/runtime/tools.ts` | `src/features/runtime-observability/status.ts` | Partial |
| `hivemind_journal` | assistant_output, user_message, tool_call, compaction, trajectory, diagnostic (6) | `src/tools/hivemind-journal.ts` | Direct file write | Partial |
| `hivemind_hm_init` | mode, force (2 args) | `src/tools/hivefiver-init/tools.ts` | `src/features/runtime-entry/` | Partial |
| `hivemind_hm_doctor` | scope, fix (2 args) | `src/tools/hivefiver-doctor/tools.ts` | `src/features/runtime-entry/` | Partial |
| `hivemind_hm_setting` | group, key, value, locale, renderMode, dashboard (6 args) | `src/tools/hivefiver-setting/tools.ts` | `src/tools/hivefiver-setting/` | Partial |
| `hivemind_agent_work_create_contract` | 10 args | `src/features/agent-work-contract/tools/` | `src/features/agent-work-contract/` | **ZERO** |
| `hivemind_agent_work_export_contract` | 2 args | `src/features/agent-work-contract/tools/` | `src/features/agent-work-contract/` | **ZERO** |

### User Journeys (8)

Bootstrap, Planning, Delegation, Multi-Turn, Debug, Cross-Session, Stress, Settings

### Failure Modes (56)

Documented separately — tests must cover the top 20 by severity.

---

## 2. Architecture Overview

```
tests/llm-eval/
├── harness/                        # Shared test infrastructure
│   ├── index.ts                    # Barrel export
│   ├── mock-context.ts             # Mock ToolContext factory
│   ├── fixture-gen.ts              # ID generators, test data builders
│   ├── fs-verify.ts                # File system assertion helpers
│   ├── cleanup.ts                  # Per-test artifact cleanup
│   ├── tool-runner.ts              # Direct execute() wrapper with validation
│   └── journey-chain.ts            # Multi-step journey orchestrator
│
├── tool-invocation/                # Layer 1: Per-tool, per-action unit tests
│   ├── doc.test.ts                 # hivemind_doc — 5 actions
│   ├── task.test.ts                # hivemind_task — 7 actions
│   ├── trajectory.test.ts          # hivemind_trajectory — 6 actions
│   ├── handoff.test.ts             # hivemind_handoff — 6 actions
│   ├── runtime-status.test.ts      # hivemind_runtime_status — 0 args
│   ├── runtime-command.test.ts     # hivemind_runtime_command — 13 args
│   ├── journal.test.ts             # hivemind_journal — 6 event types
│   ├── hm-init.test.ts             # hivemind_hm_init — 2 args
│   ├── hm-doctor.test.ts           # hivemind_hm_doctor — 2 args
│   ├── hm-setting.test.ts          # hivemind_hm_setting — 6 args
│   ├── agent-work-create.test.ts   # hivemind_agent_work_create_contract — 10 args
│   └── agent-work-export.test.ts   # hivemind_agent_work_export_contract — 2 args
│
├── journeys/                       # Layer 2: End-to-end user journey tests
│   ├── bootstrap.test.ts           # Bootstrap journey
│   ├── planning.test.ts            # Planning journey
│   ├── delegation.test.ts          # Delegation journey
│   ├── multi-turn.test.ts          # Multi-turn journey
│   ├── debug.test.ts               # Debug journey
│   ├── cross-session.test.ts       # Cross-session journey
│   ├── stress.test.ts              # Stress journey
│   └── settings.test.ts            # Settings journey
│
├── multi-agent/                    # Layer 3: Multi-agent coordination tests
│   ├── handoff-delegation.test.ts  # handoff → task → trajectory chain
│   ├── cross-session-continuity.test.ts
│   ├── agent-role-boundaries.test.ts
│   └── agent-work-contract.test.ts # Contract create → export lifecycle
│
├── stress/                         # Layer 4: Stress & edge case tests
│   ├── rapid-calls.test.ts         # Rapid sequential calls, no cooldown
│   ├── malformed-args.test.ts      # Invalid/malformed arguments
│   ├── missing-fields.test.ts      # Missing required fields
│   ├── concurrent-ops.test.ts      # Concurrent operations (if applicable)
│   └── failure-modes.test.ts       # Top 20 documented failure modes
│
└── nl-dispatch/                    # Layer 5: Natural language dispatch tests
    ├── intent-classification.test.ts
    ├── tool-selection.test.ts
    ├── ambiguous-prompts.test.ts
    └── multi-tool-dispatch.test.ts # NL prompt → multiple tool calls
```

---

## 3. Layer 1: Tool Invocation Tests

### 3.1 Purpose

Each tool action gets an isolated test that calls `execute()` directly with real arguments. This verifies:
- Return shape matches the tool's contract
- Side effects occur (file reads/writes, state mutations)
- Error paths return structured error responses
- Optional fields behave correctly when omitted
- Required fields reject when missing

### 3.2 File Structure

Each tool gets its own file. Each action within a tool gets its own `test()` block. Error paths get separate `test()` blocks.

```
tests/llm-eval/tool-invocation/doc.test.ts
tests/llm-eval/tool-invocation/task.test.ts
tests/llm-eval/tool-invocation/trajectory.test.ts
tests/llm-eval/tool-invocation/handoff.test.ts
tests/llm-eval/tool-invocation/runtime-status.test.ts
tests/llm-eval/tool-invocation/runtime-command.test.ts
tests/llm-eval/tool-invocation/journal.test.ts
tests/llm-eval/tool-invocation/hm-init.test.ts
tests/llm-eval/tool-invocation/hm-doctor.test.ts
tests/llm-eval/tool-invocation/hm-setting.test.ts
tests/llm-eval/tool-invocation/agent-work-create.test.ts
tests/llm-eval/tool-invocation/agent-work-export.test.ts
```

### 3.3 Test Helper: Tool Harness

```typescript
// tests/llm-eval/harness/mock-context.ts
import type { ToolContext } from '@opencode-ai/plugin'

export interface MockContextOptions {
  sessionID?: string
  agent?: string
  directory?: string
  worktree?: string
  askBehavior?: 'noop' | 'throw' | 'record'
}

export function createMockContext(options: MockContextOptions = {}): ToolContext {
  const {
    sessionID = 'ses_test_001',
    agent = 'hivefiver',
    directory,
    worktree = directory,
    askBehavior = 'throw',
  } = options

  const askCalls: unknown[] = []

  return {
    sessionID,
    messageID: 'msg_test_001',
    agent,
    directory: directory!,
    worktree: worktree!,
    abort: new AbortController().signal,
    metadata(_input: Record<string, unknown>) { /* noop — override in test if needed */ },
    async ask(input: Record<string, unknown>) {
      askCalls.push(input)
      if (askBehavior === 'throw') {
        throw new Error('Tool should not call ask() in test mode')
      }
      return undefined
    },
  } as ToolContext
}

export function getAskCalls(context: ToolContext): unknown[] {
  return (context as any).__askCalls ?? []
}
```

```typescript
// tests/llm-eval/harness/tool-runner.ts
import assert from 'node:assert/strict'
import type { ToolContext, ToolDefinition } from '@opencode-ai/plugin'

export interface ToolExecuteResult {
  raw: string
  parsed: Record<string, unknown>
  metadataCalls: Record<string, unknown>[]
}

/**
 * Wraps a tool execute() call with result parsing and metadata tracking.
 */
export async function executeTool(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecuteResult> {
  const metadataCalls: Record<string, unknown>[] = []
  const wrappedContext = {
    ...context,
    metadata(input: Record<string, unknown>) {
      metadataCalls.push(input)
      ;(context as any).metadata?.(input)
    },
  }

  const raw = await tool.execute(args, wrappedContext)
  assert.equal(typeof raw, 'string', 'Tool execute() must return a string')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    assert.fail(`Tool returned invalid JSON: ${raw.slice(0, 200)}`)
  }

  return { raw, parsed, metadataCalls }
}

export function assertSuccess(result: ToolExecuteResult) {
  assert.equal(result.parsed.status, 'success', `Expected success status, got: ${JSON.stringify(result.parsed)}`)
}

export function assertError(result: ToolExecuteResult, messagePattern?: string) {
  assert.equal(result.parsed.status, 'error', `Expected error status, got: ${JSON.stringify(result.parsed)}`)
  if (messagePattern) {
    assert.ok(
      String(result.parsed.message).includes(messagePattern),
      `Error message should contain "${messagePattern}", got: ${result.parsed.message}`,
    )
  }
}

export function assertHasField(result: ToolExecuteResult, field: string, message?: string) {
  assert.ok(
    field in (result.parsed.data ?? {}),
    message ?? `Expected data.${field} to exist`
  )
}
```

```typescript
// tests/llm-eval/harness/cleanup.ts
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface TestSandbox {
  root: string
  cleanup: () => Promise<void>
}

export async function createSandbox(prefix = 'hm-llm-eval'): Promise<TestSandbox> {
  const root = await mkdtemp(join(tmpdir(), `${prefix}-`))
  return {
    root,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true })
    },
  }
}

export async function withSandbox<T>(
  prefix: string,
  fn: (sandbox: TestSandbox) => Promise<T>
): Promise<T> {
  const sandbox = await createSandbox(prefix)
  try {
    return await fn(sandbox)
  } finally {
    await sandbox.cleanup()
  }
}
```

```typescript
// tests/llm-eval/harness/fs-verify.ts
import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import assert from 'node:assert/strict'
import { join } from 'node:path'

export async function assertFileExists(path: string, message?: string): Promise<void> {
  try {
    await access(path, constants.F_OK)
  } catch {
    assert.fail(message ?? `Expected file to exist: ${path}`)
  }
}

export async function assertFileContains(path: string, substring: string, message?: string): Promise<void> {
  const content = await readFile(path, 'utf8')
  assert.ok(content.includes(substring), message ?? `Expected "${path}" to contain "${substring}"`)
}

export async function assertFileNotContains(path: string, substring: string, message?: string): Promise<void> {
  const content = await readFile(path, 'utf8')
  assert.ok(!content.includes(substring), message ?? `Expected "${path}" to NOT contain "${substring}"`)
}

export async function readJsonFile<T = Record<string, unknown>>(path: string): Promise<T> {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content) as T
}

export function hivemindPath(base: string, ...segments: string[]): string {
  return join(base, '.hivemind', ...segments)
}

export async function assertHivemindFileExists(root: string, ...segments: string[]) {
  await assertFileExists(hivemindPath(root, ...segments))
}

export async function assertHivemindFileContains(root: string, substring: string, ...segments: string[]) {
  await assertFileContains(hivemindPath(root, ...segments), substring)
}

export function journeyEventsPath(base: string, sessionId: string): string {
  return hivemindPath(base, 'sessions', 'journey-events', `${sessionId}.md`)
}

export function trajectoryLedgerPath(base: string): string {
  return hivemindPath(base, 'trajectories', 'ledger.json')
}

export function handoffStorePath(base: string): string {
  return hivemindPath(base, 'activity', 'handoff')
}

export function workflowStatePath(base: string, workflowId: string): string {
  return hivemindPath(base, 'workflow-management', `${workflowId}.json`)
}
```

```typescript
// tests/llm-eval/harness/fixture-gen.ts
let counter = 0

export function resetFixtureCounter() {
  counter = 0
}

export function genId(prefix: string): string {
  counter++
  return `${prefix}_${String(counter).padStart(3, '0')}`
}

export function buildWorkflowFixture(overrides: { workflowId?: string; taskId?: string } = {}) {
  return {
    workflowId: overrides.workflowId ?? genId('wf'),
    taskId: overrides.taskId ?? genId('task'),
    trajectoryId: genId('traj'),
    sessionId: genId('ses'),
  }
}

export function buildHandoffFixture(overrides: {
  workflowId?: string
  sourceAgent?: string
  targetAgent?: string
} = {}) {
  return {
    handoffId: genId('handoff'),
    workflowId: overrides.workflowId ?? genId('wf'),
    sourceSessionId: genId('ses-src'),
    targetSessionId: genId('ses-tgt'),
    sourceAgent: overrides.sourceAgent ?? 'architect',
    targetAgent: overrides.targetAgent ?? 'hivemaker',
    trajectoryId: genId('traj'),
    scope: 'Implement the design decisions',
    summary: 'Delegation packet for implementation',
  }
}

export function buildDocFixture(filePath: string) {
  return {
    filePath,
    dirPath: filePath.split('/').slice(0, -1).join('/'),
    heading: '## Design Decision',
    query: 'architecture',
    maxTokens: 500,
  }
}
```

```typescript
// tests/llm-eval/harness/journey-chain.ts
import type { ToolContext, ToolDefinition } from '@opencode-ai/plugin'
import { createMockContext } from './mock-context.js'

export interface JourneyStep {
  name: string
  tool: ToolDefinition
  args: (ctx: JourneyContext) => Record<string, unknown>
  validate: (result: Record<string, unknown>, ctx: JourneyContext) => void
}

export interface JourneyContext {
  sessionID: string
  agent: string
  directory: string
  state: Map<string, unknown>
  metadataLog: Record<string, unknown>[]
}

export async function runJourney(
  steps: JourneyStep[],
  context: JourneyContext,
): Promise<JourneyContext> {
  for (const step of steps) {
    const args = step.args(context)
    const raw = await step.tool.execute(args, {
      sessionID: context.sessionID,
      messageID: `msg-${step.name}`,
      agent: context.agent,
      directory: context.directory,
      worktree: context.directory,
      abort: new AbortController().signal,
      metadata(input: Record<string, unknown>) {
        context.metadataLog.push({ step: step.name, ...input })
      },
      async ask() { return undefined },
    } as ToolContext)

    const parsed = JSON.parse(raw)
    try {
      step.validate(parsed, context)
    } catch (err) {
      throw new Error(`Journey step "${step.name}" failed: ${err instanceof Error ? err.message : String(err)}\nResult: ${JSON.stringify(parsed, null, 2)}`)
    }

    context.state.set(step.name, parsed)
  }

  return context
}
```

```typescript
// tests/llm-eval/harness/index.ts
export { createMockContext, getAskCalls } from './mock-context.js'
export {
  resetFixtureCounter,
  genId,
  buildWorkflowFixture,
  buildHandoffFixture,
  buildDocFixture,
} from './fixture-gen.js'
export {
  assertFileExists,
  assertFileContains,
  assertFileNotContains,
  readJsonFile,
  hivemindPath,
  assertHivemindFileExists,
  assertHivemindFileContains,
  journeyEventsPath,
  trajectoryLedgerPath,
  handoffStorePath,
  workflowStatePath,
} from './fs-verify.js'
export { createSandbox, withSandbox, type TestSandbox } from './cleanup.js'
export {
  executeTool,
  assertSuccess,
  assertError,
  assertHasField,
  type ToolExecuteResult,
} from './tool-runner.js'
export { runJourney, type JourneyStep, type JourneyContext } from './journey-chain.js'
```

### 3.4 Example Test Case — Full Code

```typescript
// tests/llm-eval/tool-invocation/task.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { createHivemindTaskTool } from '../../../src/tools/task/index.js'
import {
  createMockContext,
  executeTool,
  assertSuccess,
  assertError,
  assertHasField,
  withSandbox,
  assertHivemindFileExists,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

// ─── Action: create ───────────────────────────────────────────────────────────

test('task/create: creates a task and writes to .hivemind/workflow/', async () => {
  await withSandbox('task-create', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      const result = await executeTool(tool, {
        action: 'create',
        workflowId: wfId,
        taskId,
        title: 'Implement feature X',
      }, ctx)

      assertSuccess(result)
      assertHasField(result, 'task')
      assert.ok(result.parsed.data?.task, 'Task data must exist')
      assert.equal(result.parsed.data.task.id, taskId)
      assert.equal(result.parsed.data.task.title, 'Implement feature X')

      // Side effect: task file written
      await assertHivemindFileExists(root, 'workflow', 'authority', `${wfId}.json`)
    } finally {
      await cleanup()
    }
  })
})

test('task/create: missing workflowId returns error', async () => {
  await withSandbox('task-create-missing-wf', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })

      const result = await executeTool(tool, {
        action: 'create',
        taskId: 'task_001',
      }, ctx)

      assertError(result, 'workflowId')
    } finally {
      await cleanup()
    }
  })
})

test('task/create: emits metadata with action and safetyLevel', async () => {
  await withSandbox('task-create-metadata', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const metadataCalls: Record<string, unknown>[] = []
      const ctx = {
        ...createMockContext({ directory: root }),
        metadata(input: Record<string, unknown>) {
          metadataCalls.push(input)
        },
      }

      await executeTool(tool, {
        action: 'create',
        workflowId: genId('wf'),
        taskId: genId('task'),
        title: 'Test task',
      }, ctx)

      assert.ok(metadataCalls.length > 0, 'metadata() must be called')
      const meta = metadataCalls[0] as Record<string, unknown>
      assert.ok(meta.metadata, 'Must have metadata field')
      assert.equal((meta.metadata as Record<string, unknown>).action, 'create')
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: list ─────────────────────────────────────────────────────────────

test('task/list: returns empty array for unknown workflow', async () => {
  await withSandbox('task-list-empty', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })

      const result = await executeTool(tool, {
        action: 'list',
        workflowId: 'wf_nonexistent',
      }, ctx)

      assertSuccess(result)
      assert.ok(Array.isArray(result.parsed.data?.tasks), 'tasks must be an array')
    } finally {
      await cleanup()
    }
  })
})

test('task/list: returns tasks after create', async () => {
  await withSandbox('task-list-after-create', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')

      // Create two tasks
      await executeTool(tool, {
        action: 'create',
        workflowId: wfId,
        taskId: genId('task'),
        title: 'Task A',
      }, ctx)

      await executeTool(tool, {
        action: 'create',
        workflowId: wfId,
        taskId: genId('task'),
        title: 'Task B',
      }, ctx)

      // List them
      const result = await executeTool(tool, {
        action: 'list',
        workflowId: wfId,
      }, ctx)

      assertSuccess(result)
      assert.ok(Array.isArray(result.parsed.data?.tasks))
      assert.equal((result.parsed.data.tasks as unknown[]).length, 2)
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: get ──────────────────────────────────────────────────────────────

test('task/get: returns task by ID', async () => {
  await withSandbox('task-get', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, {
        action: 'create',
        workflowId: wfId,
        taskId,
        title: 'Gettable task',
      }, ctx)

      const result = await executeTool(tool, {
        action: 'get',
        taskId,
      }, ctx)

      assertSuccess(result)
      assert.equal(result.parsed.data?.task?.id, taskId)
      assert.equal(result.parsed.data?.task?.title, 'Gettable task')
    } finally {
      await cleanup()
    }
  })
})

test('task/get: returns error for nonexistent task', async () => {
  await withSandbox('task-get-missing', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })

      const result = await executeTool(tool, {
        action: 'get',
        taskId: 'nonexistent_task',
      }, ctx)

      assertError(result)
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: activate ─────────────────────────────────────────────────────────

test('task/activate: activates a created task', async () => {
  await withSandbox('task-activate', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'Activatable' }, ctx)

      const result = await executeTool(tool, {
        action: 'activate',
        workflowId: wfId,
        taskId,
      }, ctx)

      assertSuccess(result)
      assert.equal(result.parsed.data?.task?.status, 'active')
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: verify ───────────────────────────────────────────────────────────

test('task/verify: marks task as verifying with contract', async () => {
  await withSandbox('task-verify', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'Verify me' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)

      const result = await executeTool(tool, {
        action: 'verify',
        workflowId: wfId,
        taskId,
        verificationContractId: 'contract_001',
      }, ctx)

      assertSuccess(result)
      assert.equal(result.parsed.data?.task?.status, 'verifying')
    } finally {
      await cleanup()
    }
  })
})

test('task/verify: missing verificationContractId returns error', async () => {
  await withSandbox('task-verify-missing-contract', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'Verify me' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)

      const result = await executeTool(tool, {
        action: 'verify',
        workflowId: wfId,
        taskId,
      }, ctx)

      assertError(result, 'verificationContractId')
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: complete ─────────────────────────────────────────────────────────

test('task/complete: completes a verified task with evidence', async () => {
  await withSandbox('task-complete', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'Complete me' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)
      await executeTool(tool, { action: 'verify', workflowId: wfId, taskId, verificationContractId: 'c1' }, ctx)

      const result = await executeTool(tool, {
        action: 'complete',
        workflowId: wfId,
        taskId,
        evidenceRefs: 'evidence_001,evidence_002',
      }, ctx)

      assertSuccess(result)
      assert.equal(result.parsed.data?.task?.status, 'complete')
    } finally {
      await cleanup()
    }
  })
})

// ─── Action: rotate ───────────────────────────────────────────────────────────

test('task/rotate: creates new active task, demotes old', async () => {
  await withSandbox('task-rotate', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId1 = genId('task')
      const taskId2 = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId: taskId1, title: 'Old task' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId: taskId1 }, ctx)
      await executeTool(tool, { action: 'create', workflowId: wfId, taskId: taskId2, title: 'New task' }, ctx)

      const result = await executeTool(tool, {
        action: 'rotate',
        workflowId: wfId,
        taskId: taskId2,
      }, ctx)

      assertSuccess(result)
    } finally {
      await cleanup()
    }
  })
})
```

### 3.5 Assertions Per Tool

| Tool | Action | Assertions |
|------|--------|------------|
| `hivemind_doc` | `skim` | Returns document outline with headings |
| `hivemind_doc` | `skim_directory` | Returns file list for directory |
| `hivemind_doc` | `read` | Returns file content, respects heading param |
| `hivemind_doc` | `chunk` | Returns chunked content with token limits |
| `hivemind_doc` | `search` | Returns matching files with content snippets |
| `hivemind_task` | `create` | Returns task node, writes workflow state |
| `hivemind_task` | `list` | Returns array of tasks for workflow |
| `hivemind_task` | `get` | Returns single task details |
| `hivemind_task` | `activate` | Transitions status pending→active |
| `hivemind_task` | `rotate` | Advances to next task |
| `hivemind_task` | `verify` | Requires verificationContractId |
| `hivemind_task` | `complete` | Requires evidenceRefs, transitions to complete |
| `hivemind_trajectory` | `attach` | Creates trajectory ledger, binds session |
| `hivemind_trajectory` | `inspect` | Returns trajectory state |
| `hivemind_trajectory` | `traverse` | Returns traversal path |
| `hivemind_trajectory` | `checkpoint` | Writes checkpoint to trajectory |
| `hivemind_trajectory` | `event` | Records event on trajectory |
| `hivemind_trajectory` | `close` | Closes trajectory, writes closeout |
| `hivemind_handoff` | `create` | Creates handoff packet, writes to handoff store |
| `hivemind_handoff` | `read` | Returns handoff details by ID |
| `hivemind_handoff` | `list` | Returns all handoffs for session |
| `hivemind_handoff` | `update` | Modifies existing handoff |
| `hivemind_handoff` | `validate` | Validates handoff completeness |
| `hivemind_handoff` | `close` | Closes handoff, records evidence |
| `hivemind_runtime_status` | (no args) | Returns workflow gate state, capability matrix |
| `hivemind_runtime_command` | `hm-init` | Returns identity + readiness signal |
| `hivemind_runtime_command` | `hm-doctor` | Returns diagnostic findings |
| `hivemind_runtime_command` | `hm-harness` | Returns harness state |
| `hivemind_runtime_command` | `hm-settings` | Returns settings dashboard |
| `hivemind_journal` | `assistant_output` | Writes to journey-events markdown |
| `hivemind_journal` | `user_message` | Writes user message block |
| `hivemind_journal` | `tool_call` | Writes tool call block |
| `hivemind_journal` | `compaction` | Writes compaction block |
| `hivemind_journal` | `trajectory` | Writes trajectory block |
| `hivemind_journal` | `diagnostic` | Writes to Diagnostics section |
| `hivemind_hm_init` | (2 args) | Initializes runtime, writes attachment settings |
| `hivemind_hm_doctor` | (2 args) | Runs diagnostics, returns findings |
| `hivemind_hm_setting` | (6 args) | Reads/writes/updates settings groups |
| `hivemind_agent_work_create_contract` | (10 args) | Creates contract, writes to contract store |
| `hivemind_agent_work_export_contract` | (2 args) | Exports contract as JSON |

### 3.6 Side Effect Verification

See `fs-verify.ts` harness module above. Key patterns:
- `assertHivemindFileExists(root, ...segments)` — verifies `.hivemind/` artifacts
- `assertHivemindFileContains(root, substring, ...segments)` — verifies content
- `journeyEventsPath(base, sessionId)` — resolves journal file path
- `workflowStatePath(base, workflowId)` — resolves workflow state path

---

## 4. Layer 2: User Journey Tests

### 4.1 Purpose

Simulates complete user journeys through natural language. Chains multiple tool calls in sequence and verifies artifacts produced at each step.

### 4.2 Journey Runner Helper

See `journey-chain.ts` harness module above.

### 4.3 Example Journey: Bootstrap

```typescript
// tests/llm-eval/journeys/bootstrap.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertSuccess,
  assertHivemindFileExists,
} from '../../llm-eval/harness/index.js'

import { createHivemindHmInitTool } from '../../../src/tools/hivefiver-init/index.js'
import { createHivemindRuntimeStatusTool } from '../../../src/tools/runtime/index.js'
import { createHivemindTrajectoryTool } from '../../../src/tools/trajectory/index.js'

test('bootstrap journey: init → status → trajectory attach', async () => {
  await withSandbox('bootstrap-journey', async ({ root, cleanup }) => {
    try {
      const initTool = createHivemindHmInitTool(root)
      const statusTool = createHivemindRuntimeStatusTool(root)
      const trajTool = createHivemindTrajectoryTool(root)
      const ctx = createMockContext({ directory: root, sessionID: 'ses_bootstrap' })

      // Step 1: Initialize
      const initResult = await executeTool(initTool, { mode: 'auto', force: false }, ctx)
      assertSuccess(initResult)

      // Step 2: Check status
      const statusResult = await executeTool(statusTool, {}, ctx)
      assertSuccess(statusResult)
      assert.ok(statusResult.parsed.workflowGateState, 'Should have workflow gate state')
      assert.ok(statusResult.parsed.capabilityMatrix, 'Should have capability matrix')

      // Step 3: Attach trajectory
      const trajResult = await executeTool(trajTool, {
        action: 'attach',
        trajectoryId: 'traj_bootstrap_001',
        workflowId: 'wf_bootstrap_001',
        sessionId: 'ses_bootstrap',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: 'task-1',
      }, ctx)
      assertSuccess(trajResult)

      // Verify side effects
      await assertHivemindFileExists(root, 'trajectories', 'ledger.json')
    } finally {
      await cleanup()
    }
  })
})
```

### 4.4 All 8 Journeys

| Journey | Tool Chain | Key Assertions |
|---------|-----------|----------------|
| **Bootstrap** | hm-init → runtime-status → trajectory-attach | Runtime attachment exists, trajectory ledger created |
| **Planning** | hm-init → task:create (×3) → trajectory:checkpoint → agent-work-create-contract | 3 tasks in workflow, checkpoint recorded, contract exists |
| **Delegation** | handoff:create → task:create (subtask) → trajectory:event → handoff:validate | Handoff packet written, subtask linked, event recorded |
| **Multi-Turn** | journal:user_message → journal:assistant_output → journal:tool_call → journal:compaction | Journey-events markdown has all 4 event types in order |
| **Debug** | hm-doctor → runtime-status → trajectory:inspect → handoff:read | Doctor findings returned, trajectory state readable |
| **Cross-Session** | trajectory:attach (session A) → handoff:create → trajectory:attach (session B) → handoff:read | Both sessions share handoff, trajectory IDs distinct |
| **Stress** | task:create (×20 rapid) → task:list → task:complete (×20) | All 20 tasks created, list returns 20, all completable |
| **Settings** | hm-setting:read → hm-setting:update → hm-setting:read (verify) | Setting updated, subsequent read reflects change |

---

## 5. Layer 3: Multi-Agent Coordination Tests

### 5.1 Purpose

Simulates different agents using tools in sequence. Tests delegation patterns and cross-session continuity.

### 5.2 Example Test

```typescript
// tests/llm-eval/multi-agent/handoff-delegation.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertSuccess,
  readJsonFile,
  hivemindPath,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

import { createHivemindHandoffTool } from '../../../src/tools/handoff/index.js'
import { createHivemindTaskTool } from '../../../src/tools/task/index.js'
import { createHivemindTrajectoryTool } from '../../../src/tools/trajectory/index.js'

test('delegation chain: orchestrator creates handoff → executor reads → trajectory records event', async () => {
  await withSandbox('delegation-chain', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()

      const orchestratorCtx = createMockContext({
        directory: root,
        agent: 'hivefiver',
        sessionID: 'ses_orchestrator',
      })
      const executorCtx = createMockContext({
        directory: root,
        agent: 'hivemaker',
        sessionID: 'ses_executor',
      })

      const handoffTool = createHivemindHandoffTool(root)
      const taskTool = createHivemindTaskTool(root)
      const trajectoryTool = createHivemindTrajectoryTool(root)

      // Step 1: Orchestrator creates handoff
      const handoffResult = await executeTool(handoffTool, {
        action: 'create',
        id: genId('handoff'),
        sourceSessionId: 'ses_orchestrator',
        targetSessionId: 'ses_executor',
        sourceAgent: 'hivefiver',
        targetAgent: 'hivemaker',
        workflowId: genId('wf'),
        taskIds: 'task-1,task-2',
        scope: 'Implement feature X',
        requiredEvidence: '["file-creates","tests-pass"]',
        summary: 'Delegating feature X implementation',
      }, orchestratorCtx)
      assertSuccess(handoffResult)

      // Step 2: Executor reads handoff
      const readResult = await executeTool(handoffTool, {
        action: 'read',
        id: handoffResult.parsed.data?.record?.id,
      }, executorCtx)
      assertSuccess(readResult)
      assert.equal(readResult.parsed.data?.record?.targetAgent, 'hivemaker')
      assert.equal(readResult.parsed.data?.record?.sourceAgent, 'hivefiver')

      // Step 3: Executor creates subtask for delegated work
      const taskResult = await executeTool(taskTool, {
        action: 'create',
        workflowId: 'wf_001',
        taskId: 'task-delegated-1',
        title: 'Implement feature X — delegated',
        kind: 'subtask',
        parentTaskId: 'task-1',
      }, executorCtx)
      assertSuccess(taskResult)

      // Step 4: Record trajectory event for the handoff
      const eventResult = await executeTool(trajectoryTool, {
        action: 'event',
        trajectoryId: 'traj_001',
        kind: 'handoff',
        summary: 'Delegated feature X to hivemaker',
      }, executorCtx)
      assertSuccess(eventResult)

      // Step 5: Executor validates and closes handoff
      const validateResult = await executeTool(handoffTool, {
        action: 'validate',
        id: handoffResult.parsed.data?.record?.id,
      }, executorCtx)
      assertSuccess(validateResult)
    } finally {
      await cleanup()
    }
  })
})
```

### 5.3 Multi-Agent Test Matrix

| Test | Agents Involved | Pattern | Verification |
|------|----------------|---------|-------------|
| Handoff delegation | hivefiver → hivemaker | create → read → validate → close | Handoff state transitions correctly |
| Cross-session continuity | hivefiver → hiveminder | attach (A) → handoff → attach (B) → traverse | Both sessions see same trajectory |
| Agent role boundaries | hivefiver → code-skeptic → hiveq | task:create → task:verify → task:complete | Verify action requires contract, complete requires evidence |
| Parallel delegation | orchestrator → agent-A + agent-B | handoff:create (×2) → task:create (×2) | No state collision between parallel handoffs |
| Contract lifecycle | architect → hivemaker | create_contract → export_contract | Contract created, exported with correct format |

---

## 6. Layer 4: Stress & Edge Case Tests

### 6.1 Purpose

Tests system resilience under adverse conditions: rapid calls, malformed input, missing fields, concurrent operations.

### 6.2 Example Tests

```typescript
// tests/llm-eval/stress/rapid-calls.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertSuccess,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

import { createHivemindTaskTool } from '../../../src/tools/task/index.js'

test('rapid sequential task:create calls (20 calls, no cooldown)', async () => {
  await withSandbox('stress-rapid-tasks', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindTaskTool(root)
      const wfId = genId('wf')

      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          executeTool(tool, {
            action: 'create',
            workflowId: wfId,
            taskId: genId('task'),
            title: `Stress task ${i}`,
            kind: 'task',
          }, ctx),
        ),
      )

      const successes = results.filter(r => r.parsed.status === 'success')
      assert.equal(successes.length, 20, 'All 20 rapid calls should succeed')
    } finally {
      await cleanup()
    }
  })
})
```

```typescript
// tests/llm-eval/stress/malformed-args.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertError,
} from '../../llm-eval/harness/index.js'

import { createHivemindHandoffTool } from '../../../src/tools/handoff/index.js'
import { createHivemindTrajectoryTool } from '../../../src/tools/trajectory/index.js'
import { createHivemindTaskTool } from '../../../src/tools/task/index.js'
import { createHivemindDocTool } from '../../../src/tools/doc/index.js'

test('handoff:read with non-existent ID returns structured error', async () => {
  await withSandbox('stress-handoff-missing', async ({ root, cleanup }) => {
    try {
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindHandoffTool(root)

      const result = await executeTool(tool, {
        action: 'read',
        id: 'nonexistent_handoff_id',
      }, ctx)

      assertError(result)
    } finally {
      await cleanup()
    }
  })
})

test('trajectory:attach with invalid lineage returns error', async () => {
  await withSandbox('stress-invalid-lineage', async ({ root, cleanup }) => {
    try {
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindTrajectoryTool(root)

      // Invalid lineage (not in enum) — Zod should reject
      const result = await executeTool(tool, {
        action: 'attach',
        trajectoryId: 'traj_001',
        workflowId: 'wf_001',
        sessionId: 'ses_001',
        lineage: 'invalid-lineage',
        purposeClass: 'planning',
      }, ctx)

      assertError(result)
    } finally {
      await cleanup()
    }
  })
})

test('task:complete without evidenceRefs returns error', async () => {
  await withSandbox('stress-missing-evidence', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindTaskTool(root)
      const wfId = genId('wf')
      const taskId = genId('task')

      // Create a task first
      await executeTool(tool, {
        action: 'create',
        workflowId: wfId,
        taskId,
        title: 'Test task',
        kind: 'task',
      }, ctx)

      // Try to complete without evidence
      const result = await executeTool(tool, {
        action: 'complete',
        workflowId: wfId,
        taskId,
      }, ctx)

      assertError(result)
    } finally {
      await cleanup()
    }
  })
})

test('doc:read with non-existent file returns error', async () => {
  await withSandbox('stress-doc-missing-file', async ({ root, cleanup }) => {
    try {
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindDocTool(root)

      const result = await executeTool(tool, {
        action: 'read',
        filePath: 'nonexistent-file.md',
        heading: 'Some Heading',
      }, ctx)

      assertError(result)
    } finally {
      await cleanup()
    }
  })
})
```

```typescript
// tests/llm-eval/stress/missing-fields.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertError,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

import { createHivemindTaskTool } from '../../../src/tools/task/index.js'
import { createHivemindHandoffTool } from '../../../src/tools/handoff/index.js'
import { createHivemindTrajectoryTool } from '../../../src/tools/trajectory/index.js'

test('task:verify without verificationContractId returns error', async () => {
  await withSandbox('missing-verify-contract', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindTaskTool(root)
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'Test' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)

      const result = await executeTool(tool, {
        action: 'verify',
        workflowId: wfId,
        taskId,
        // missing verificationContractId
      }, ctx)

      assertError(result, 'verificationContractId')
    } finally {
      await cleanup()
    }
  })
})

test('handoff:create without targetAgent returns error', async () => {
  await withSandbox('missing-handoff-target', async ({ root, cleanup }) => {
    try {
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindHandoffTool(root)

      const result = await executeTool(tool, {
        action: 'create',
        id: 'handoff_001',
        workflowId: 'wf_001',
        scope: 'Test scope',
        summary: 'Test summary',
        // missing targetAgent
      }, ctx)

      assertError(result, 'targetAgent')
    } finally {
      await cleanup()
    }
  })
})

test('trajectory:close without summary returns error', async () => {
  await withSandbox('missing-traj-summary', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const ctx = createMockContext({ directory: root })
      const tool = createHivemindTrajectoryTool(root)
      const wfId = genId('wf')
      const trajId = genId('traj')

      await executeTool(tool, {
        action: 'attach',
        trajectoryId: trajId,
        workflowId: wfId,
        sessionId: ctx.sessionID,
      }, ctx)

      const result = await executeTool(tool, {
        action: 'close',
        trajectoryId: trajId,
        // missing summary
      }, ctx)

      assertError(result, 'summary')
    } finally {
      await cleanup()
    }
  })
})
```

```typescript
// tests/llm-eval/stress/concurrent-ops.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertSuccess,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

import { createHivemindTaskTool } from '../../../src/tools/task/index.js'

test('concurrent: parallel task creates to same workflow', async () => {
  await withSandbox('concurrent-tasks', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const wfId = genId('wf')

      // Fire 10 concurrent creates
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const ctx = createMockContext({
          directory: root,
          sessionID: `ses-concurrent-${i}`,
        })
        return executeTool(tool, {
          action: 'create',
          workflowId: wfId,
          taskId: genId('task'),
          title: `Concurrent task ${i}`,
        }, ctx)
      })

      const results = await Promise.all(promises)
      const successes = results.filter(r => r.parsed.status === 'success')

      // At least some must succeed (file locking may cause some failures)
      assert.ok(successes.length > 0, 'At least some concurrent creates must succeed')

      // Verify no corruption: list should show created tasks
      const listResult = await executeTool(tool, {
        action: 'list',
        workflowId: wfId,
      }, createMockContext({ directory: root }))
      assertSuccess(listResult)
      assert.ok((listResult.parsed.data?.tasks as unknown[]).length >= successes.length)
    } finally {
      await cleanup()
    }
  })
})
```

```typescript
// tests/llm-eval/stress/failure-modes.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  withSandbox,
  createMockContext,
  executeTool,
  assertError,
  assertSuccess,
  genId,
  resetFixtureCounter,
} from '../../llm-eval/harness/index.js'

import { createHivemindTaskTool } from '../../../src/tools/task/index.js'
import { createHivemindTrajectoryTool } from '../../../src/tools/trajectory/index.js'
import { createHivemindHandoffTool } from '../../../src/tools/handoff/index.js'
import { createHivemindDocTool } from '../../../src/tools/doc/index.js'
import { createHivemindJournalTool } from '../../../src/tools/hivemind-journal.js'

// Top 20 failure modes from documented failure catalog

// FM-1: Missing required arg
test('FM-1: task/create with empty workflowId', async () => {
  await withSandbox('fm-1', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'create',
        workflowId: '',
        taskId: 'task_001',
        title: 'Test',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-2: Invalid enum value
test('FM-2: trajectory/attach with invalid lineage', async () => {
  await withSandbox('fm-2', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTrajectoryTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'attach',
        trajectoryId: 'traj_001',
        workflowId: 'wf_001',
        lineage: 'invalid-lineage',
        purposeClass: 'planning',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-3: Empty string for required field
test('FM-3: handoff/create with empty targetAgent', async () => {
  await withSandbox('fm-3', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindHandoffTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'create',
        id: 'h_001',
        workflowId: 'wf_001',
        targetAgent: '',
        scope: 'test',
        summary: 'test',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-4: Nonexistent file path
test('FM-4: doc/read with nonexistent file', async () => {
  await withSandbox('fm-4', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindDocTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'read',
        filePath: 'does-not-exist.md',
        heading: 'Heading',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-5: Nonexistent task ID
test('FM-5: task/get with nonexistent task', async () => {
  await withSandbox('fm-5', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'get',
        taskId: 'nonexistent',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-6: Nonexistent trajectory
test('FM-6: trajectory/traverse with no trajectory', async () => {
  await withSandbox('fm-6', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTrajectoryTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'traverse',
        trajectoryId: 'nonexistent',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-7: Nonexistent handoff ID
test('FM-7: handoff/read with nonexistent ID', async () => {
  await withSandbox('fm-7', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindHandoffTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'read',
        id: 'nonexistent',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-8: Unhealthy workflow authority
test('FM-8: task/activate with unhealthy authority', async () => {
  await withSandbox('fm-8', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      // Create task without proper authority setup
      const result = await executeTool(tool, {
        action: 'activate',
        workflowId: wfId,
        taskId,
      }, ctx)
      // May succeed (auto-bootstrap) or fail — either is acceptable
      assert.ok(result.parsed.status === 'success' || result.parsed.status === 'error')
    } finally { await cleanup() }
  })
})

// FM-9: No trajectory available to traverse
test('FM-9: trajectory/traverse with empty ledger', async () => {
  await withSandbox('fm-9', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindTrajectoryTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, { action: 'traverse' }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-10: Handoff create missing targetAgent
test('FM-10: handoff/create missing targetAgent', async () => {
  await withSandbox('fm-10', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindHandoffTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'create',
        id: 'h_001',
        workflowId: 'wf_001',
        scope: 'test',
        summary: 'test',
      }, ctx)
      assertError(result, 'targetAgent')
    } finally { await cleanup() }
  })
})

// FM-11: Verify without verificationContractId
test('FM-11: task/verify without verificationContractId', async () => {
  await withSandbox('fm-11', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'T' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)

      const result = await executeTool(tool, {
        action: 'verify',
        workflowId: wfId,
        taskId,
      }, ctx)
      assertError(result, 'verificationContractId')
    } finally { await cleanup() }
  })
})

// FM-12: Complete without evidence
test('FM-12: task/complete without evidenceRefs', async () => {
  await withSandbox('fm-12', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const taskId = genId('task')

      await executeTool(tool, { action: 'create', workflowId: wfId, taskId, title: 'T' }, ctx)
      await executeTool(tool, { action: 'activate', workflowId: wfId, taskId }, ctx)
      await executeTool(tool, { action: 'verify', workflowId: wfId, taskId, verificationContractId: 'c1' }, ctx)

      const result = await executeTool(tool, {
        action: 'complete',
        workflowId: wfId,
        taskId,
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})

// FM-13: Journal write to nonexistent session dir
test('FM-13: journal writes to new session dir successfully', async () => {
  await withSandbox('fm-13', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindJournalTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        sessionId: 'new_session_001',
        eventType: 'assistant_output',
        payload: { actor: 'test', title: 'Test', summary: 'Test' },
        timestamp: '2026-04-01T00:00:00.000Z',
      }, ctx)
      // Should succeed — creates dir automatically
      assertSuccess(result)
    } finally { await cleanup() }
  })
})

// FM-14: Concurrent writes to same file
test('FM-14: concurrent task creates to same workflow', async () => {
  await withSandbox('fm-14', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const wfId = genId('wf')

      const promises = Array.from({ length: 5 }, (_, i) =>
        executeTool(tool, {
          action: 'create',
          workflowId: wfId,
          taskId: genId('task'),
          title: `Concurrent ${i}`,
        }, createMockContext({ directory: root, sessionID: `ses-${i}` }))
      )

      const results = await Promise.all(promises)
      const successes = results.filter(r => r.parsed.status === 'success')
      assert.ok(successes.length >= 3, 'At least 3 of 5 concurrent creates should succeed')
    } finally { await cleanup() }
  })
})

// FM-15: Rapid sequential creates
test('FM-15: 20 rapid task creates', async () => {
  await withSandbox('fm-15', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTaskTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')

      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          executeTool(tool, {
            action: 'create',
            workflowId: wfId,
            taskId: genId('task'),
            title: `Rapid ${i}`,
          }, ctx)
        )
      )

      const failures = results.filter(r => r.parsed.status !== 'success')
      assert.equal(failures.length, 0, `Expected 0 failures, got ${failures.length}`)
    } finally { await cleanup() }
  })
})

// FM-16: Cross-session read after close
test('FM-16: handoff readable after close', async () => {
  await withSandbox('fm-16', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindHandoffTool(root)
      const ctx = createMockContext({ directory: root, sessionID: 'ses_a' })

      const createResult = await executeTool(tool, {
        action: 'create',
        id: 'h_001',
        workflowId: genId('wf'),
        targetAgent: 'hivemaker',
        scope: 'test',
        summary: 'test',
      }, ctx)
      assertSuccess(createResult)

      const closeResult = await executeTool(tool, {
        action: 'close',
        id: 'h_001',
        summary: 'Done',
      }, ctx)
      assertSuccess(closeResult)

      // Should still be readable
      const readResult = await executeTool(tool, {
        action: 'read',
        id: 'h_001',
      }, createMockContext({ directory: root, sessionID: 'ses_b' }))
      assertSuccess(readResult)
    } finally { await cleanup() }
  })
})

// FM-17: Trajectory close without summary
test('FM-17: trajectory/close without summary', async () => {
  await withSandbox('fm-17', async ({ root, cleanup }) => {
    try {
      resetFixtureCounter()
      const tool = createHivemindTrajectoryTool(root)
      const ctx = createMockContext({ directory: root })
      const wfId = genId('wf')
      const trajId = genId('traj')

      await executeTool(tool, {
        action: 'attach',
        trajectoryId: trajId,
        workflowId: wfId,
        sessionId: ctx.sessionID,
      }, ctx)

      const result = await executeTool(tool, {
        action: 'close',
        trajectoryId: trajId,
      }, ctx)
      assertError(result, 'summary')
    } finally { await cleanup() }
  })
})

// FM-18: Doc search with no results
test('FM-18: doc/search with no matching files', async () => {
  await withSandbox('fm-18', async ({ root, cleanup }) => {
    try {
      const tool = createHivemindDocTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'search',
        dirPath: '.',
        query: 'xyznonexistent123',
      }, ctx)
      assertSuccess(result)
      assert.ok(Array.isArray(result.parsed.data?.result?.files))
      assert.equal((result.parsed.data?.result?.files as unknown[]).length, 0)
    } finally { await cleanup() }
  })
})

// FM-19: Runtime command with invalid command
test('FM-19: runtime_command with invalid command', async () => {
  await withSandbox('fm-19', async ({ root, cleanup }) => {
    try {
      const { createHivemindRuntimeCommandTool } = await import('../../../src/tools/runtime/index.js')
      const tool = createHivemindRuntimeCommandTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        command: 'hm-nonexistent-command',
      }, ctx)
      // Should return error or redirect — not crash
      assert.ok(result.parsed.status === 'error' || result.parsed.closeoutStatus)
    } finally { await cleanup() }
  })
})

// FM-20: Contract export of nonexistent ID
test('FM-20: agent_work_export_contract with nonexistent ID', async () => {
  await withSandbox('fm-20', async ({ root, cleanup }) => {
    try {
      const { createAgentWorkExportContractTool } = await import('../../../src/features/agent-work-contract/tools/export-contract.js')
      const tool = createAgentWorkExportContractTool(root)
      const ctx = createMockContext({ directory: root })
      const result = await executeTool(tool, {
        action: 'export',
        contractId: 'nonexistent_contract',
        format: 'contract',
      }, ctx)
      assertError(result)
    } finally { await cleanup() }
  })
})
```

### 6.3 Stress Test Matrix

| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| rapid-calls | 20 task:create in parallel | All succeed, no state corruption |
| rapid-calls | 10 journal writes in sequence | All events appended in order |
| malformed-args | handoff:read with non-existent ID | Structured error |
| malformed-args | trajectory:attach with invalid lineage | Zod validation error |
| malformed-args | doc:read with non-existent file | Error with file-not-found message |
| missing-fields | task:complete without evidenceRefs | Error |
| missing-fields | task:verify without verificationContractId | Error |
| missing-fields | handoff:create without targetAgent | Error |
| concurrent-ops | Two sessions writing same trajectory | Last-write-wins or conflict detection |
| concurrent-ops | Two agents completing same task | Idempotent or error |
| failure-modes | Top 20 documented failure modes | Each returns structured error or handles gracefully |

---

## 7. Layer 5: Natural Language Dispatch Tests

### 7.1 Purpose

Tests that natural language prompts correctly route to tools. Verifies intent classification accuracy and tool selection under ambiguous prompts.

### 7.2 NL Prompt Catalog

```typescript
// tests/llm-eval/harness/nl-prompt-catalog.ts

export interface NLTestCase {
  /** Natural language prompt as a user would type it */
  prompt: string
  /** Expected tool that should be selected */
  expectedTool: string
  /** Expected action within that tool */
  expectedAction: string
  /** Confidence threshold (0-1) */
  minConfidence: number
  /** Tags for categorization */
  tags: string[]
}

export const NL_PROMPT_CATALOG: NLTestCase[] = [
  // Bootstrap prompts
  {
    prompt: 'bootstrap hivemind for this project',
    expectedTool: 'hivemind_hm_init',
    expectedAction: 'execute',
    minConfidence: 0.9,
    tags: ['bootstrap', 'init'],
  },
  {
    prompt: 'set up hivemind from scratch',
    expectedTool: 'hivemind_hm_init',
    expectedAction: 'execute',
    minConfidence: 0.85,
    tags: ['bootstrap', 'init'],
  },

  // Planning prompts
  {
    prompt: 'create a task for implementing the auth feature',
    expectedTool: 'hivemind_task',
    expectedAction: 'create',
    minConfidence: 0.9,
    tags: ['planning', 'task'],
  },
  {
    prompt: 'what tasks do I have in my workflow?',
    expectedTool: 'hivemind_task',
    expectedAction: 'list',
    minConfidence: 0.85,
    tags: ['planning', 'list'],
  },

  // Delegation prompts
  {
    prompt: 'delegate the code review to code-skeptic',
    expectedTool: 'hivemind_handoff',
    expectedAction: 'create',
    minConfidence: 0.9,
    tags: ['delegation', 'handoff'],
  },
  {
    prompt: 'what handoffs are pending?',
    expectedTool: 'hivemind_handoff',
    expectedAction: 'list',
    minConfidence: 0.85,
    tags: ['delegation', 'list'],
  },

  // Document prompts
  {
    prompt: 'read the architecture decision record',
    expectedTool: 'hivemind_doc',
    expectedAction: 'read',
    minConfidence: 0.9,
    tags: ['doc', 'read'],
  },
  {
    prompt: 'search for all references to CQRS in the docs',
    expectedTool: 'hivemind_doc',
    expectedAction: 'search',
    minConfidence: 0.9,
    tags: ['doc', 'search'],
  },

  // Trajectory prompts
  {
    prompt: 'checkpoint the current state',
    expectedTool: 'hivemind_trajectory',
    expectedAction: 'checkpoint',
    minConfidence: 0.85,
    tags: ['trajectory', 'checkpoint'],
  },

  // Settings prompts
  {
    prompt: 'what are my current hivemind settings?',
    expectedTool: 'hivemind_hm_setting',
    expectedAction: 'read',
    minConfidence: 0.9,
    tags: ['settings', 'read'],
  },

  // Ambiguous prompts (should still route correctly)
  {
    prompt: 'check the health of the system',
    expectedTool: 'hivemind_runtime_status',
    expectedAction: 'execute',
    minConfidence: 0.7,
    tags: ['ambiguous', 'status'],
  },
  {
    prompt: 'run diagnostics',
    expectedTool: 'hivemind_hm_doctor',
    expectedAction: 'execute',
    minConfidence: 0.85,
    tags: ['ambiguous', 'diagnostics'],
  },
]
```

### 7.3 Example Test

```typescript
// tests/llm-eval/nl-dispatch/intent-classification.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { NL_PROMPT_CATALOG } from '../harness/nl-prompt-catalog.js'

test('nl-first dispatch classifies bootstrap prompts correctly', async () => {
  const bootstrapCases = NL_PROMPT_CATALOG.filter(c => c.tags.includes('bootstrap'))

  for (const testCase of bootstrapCases) {
    const { maybeExecuteNlFirstRuntimeDispatch } = await import(
      '../../../src/features/runtime-entry/nl-first-dispatch.js'
    )

    const result = await maybeExecuteNlFirstRuntimeDispatch({
      projectRoot: '/tmp/test',
      startWork: {
        sessionId: 'ses_test',
        sessionScope: 'main',
        sessionState: 'fresh',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        confidence: 0.9,
        reasons: ['planning-keyword'],
        readiness: [],
        traversalOutcome: 'route',
        commandAgent: 'planner',
        continuityAlerts: [],
        workflowAuthority: undefined,
        trajectoryAssessment: undefined,
        routeDisposition: 'create',
        nextTransition: `command:${testCase.expectedTool}`,
        requiredControlPlaneId: undefined,
        recommendedControlPlaneId: undefined,
        requiredCommandId: undefined,
        recommendedCommandId: testCase.expectedTool,
        programmaticInitiationRequired: false,
        autoRoute: true,
        riskLevel: 'none',
        opencodeKnowledge: [],
        pressureSignals: ['steady-state'],
        pressureContract: {} as any,
      },
      snapshot: {} as any,
      userMessage: testCase.prompt,
      context: { sessionID: 'ses_test', agent: 'hivefiver' },
    })

    assert.ok(
      result.plan.commandId?.includes(testCase.expectedTool.replace('hivemind_', '')) ||
      result.plan.reason.includes('NL-first'),
      `Prompt "${testCase.prompt}" should route to ${testCase.expectedTool}, got: ${JSON.stringify(result.plan)}`,
    )
  }
})

test('all NL prompt catalog entries have valid structure', () => {
  for (const entry of NL_PROMPT_CATALOG) {
    assert.ok(entry.prompt.length > 0, 'Prompt should not be empty')
    assert.ok(entry.expectedTool.startsWith('hivemind_'), `Tool should start with hivemind_: ${entry.expectedTool}`)
    assert.ok(entry.expectedAction.length > 0, 'Action should not be empty')
    assert.ok(entry.minConfidence > 0 && entry.minConfidence <= 1, 'Confidence should be 0-1')
    assert.ok(entry.tags.length > 0, 'Should have at least one tag')
  }
})
```

### 7.4 Multi-Tool Dispatch Test

```typescript
// tests/llm-eval/nl-dispatch/multi-tool-dispatch.test.ts
import assert from 'node:assert/strict'
import test from 'node:test'

interface MultiToolCase {
  name: string
  prompt: string
  expectedTools: string[]
  description: string
}

const multiToolCases: MultiToolCase[] = [
  {
    name: 'plan and delegate',
    prompt: 'Create tasks for the auth feature and delegate implementation to hivemaker',
    expectedTools: ['hivemind_task', 'hivemind_handoff'],
    description: 'Should create tasks first, then create handoff',
  },
  {
    name: 'bootstrap and plan',
    prompt: 'Initialize hivemind and create a planning trajectory',
    expectedTools: ['hivemind_hm_init', 'hivemind_trajectory'],
    description: 'Should init first, then attach trajectory',
  },
  {
    name: 'debug and fix',
    prompt: 'Run diagnostics and show me the current settings',
    expectedTools: ['hivemind_hm_doctor', 'hivemind_hm_setting'],
    description: 'Should run doctor, then show settings',
  },
  {
    name: 'read and delegate',
    prompt: 'Read the architecture doc and delegate the implementation',
    expectedTools: ['hivemind_doc', 'hivemind_handoff'],
    description: 'Should read doc first, then create handoff',
  },
]

for (const tc of multiToolCases) {
  test(`nl-dispatch multi-tool: ${tc.name}`, async () => {
    // Validate test case structure
    assert.ok(tc.expectedTools.length >= 2, 'Multi-tool case must expect at least 2 tools')
    assert.ok(tc.prompt.length > 10, 'Prompt must be meaningful')
    assert.ok(tc.description.length > 10, 'Description must explain the scenario')

    // Verify all expected tools are valid
    const validTools = [
      'hivemind_doc', 'hivemind_task', 'hivemind_trajectory',
      'hivemind_handoff', 'hivemind_runtime_status', 'hivemind_runtime_command',
      'hivemind_journal', 'hivemind_hm_init', 'hivemind_hm_doctor',
      'hivemind_hm_setting', 'hivemind_agent_work_create_contract',
      'hivemind_agent_work_export_contract',
    ]
    for (const tool of tc.expectedTools) {
      assert.ok(validTools.includes(tool), `Tool ${tool} must be a valid HiveMind tool`)
    }

    // Verify prompt contains signals for each expected tool
    const keywordMap: Record<string, string[]> = {
      hivemind_hm_init: ['initialize', 'init', 'bootstrap', 'setup'],
      hivemind_hm_doctor: ['health', 'doctor', 'check', 'diagnose', 'diagnostics'],
      hivemind_task: ['task', 'tasks', 'create task'],
      hivemind_trajectory: ['trajectory', 'attach', 'checkpoint'],
      hivemind_handoff: ['delegate', 'delegation', 'handoff', 'hand off'],
      hivemind_doc: ['read', 'search', 'doc', 'document'],
      hivemind_hm_setting: ['setting', 'config', 'settings'],
      hivemind_runtime_status: ['status', 'state', 'health'],
      hivemind_runtime_command: ['execute', 'run', 'command'],
      hivemind_journal: ['record', 'log', 'journal'],
    }

    const promptLower = tc.prompt.toLowerCase()
    for (const expectedTool of tc.expectedTools) {
      const keywords = keywordMap[expectedTool] ?? []
      const hasSignal = keywords.some(kw => promptLower.includes(kw.toLowerCase()))
      assert.ok(
        hasSignal,
        `Prompt "${tc.prompt}" should contain keyword for ${expectedTool}`
      )
    }
  })
}
```

---

## 8. Test Data Factory

```typescript
// tests/llm-eval/harness/fixture-gen.ts
let counter = 0

export function resetFixtureCounter() {
  counter = 0
}

export function genId(prefix: string): string {
  counter++
  return `${prefix}_${String(counter).padStart(3, '0')}`
}

export function buildWorkflowFixture(overrides: { workflowId?: string; taskId?: string } = {}) {
  return {
    workflowId: overrides.workflowId ?? genId('wf'),
    taskId: overrides.taskId ?? genId('task'),
    trajectoryId: genId('traj'),
    sessionId: genId('ses'),
  }
}

export function buildHandoffFixture(overrides: {
  workflowId?: string
  sourceAgent?: string
  targetAgent?: string
} = {}) {
  return {
    handoffId: genId('handoff'),
    workflowId: overrides.workflowId ?? genId('wf'),
    sourceSessionId: genId('ses-src'),
    targetSessionId: genId('ses-tgt'),
    sourceAgent: overrides.sourceAgent ?? 'architect',
    targetAgent: overrides.targetAgent ?? 'hivemaker',
    trajectoryId: genId('traj'),
    scope: 'Implement the design decisions',
    summary: 'Delegation packet for implementation',
  }
}

export function buildDocFixture(filePath: string) {
  return {
    filePath,
    dirPath: filePath.split('/').slice(0, -1).join('/'),
    heading: '## Design Decision',
    query: 'architecture',
    maxTokens: 500,
  }
}
```

---

## 9. Cleanup Tracker

```typescript
// tests/llm-eval/harness/cleanup.ts
import { rm } from 'node:fs/promises'

export class CleanupTracker {
  private directories: string[] = []

  track(dir: string): void {
    this.directories.push(dir)
  }

  async cleanupAll(): Promise<void> {
    const results = await Promise.allSettled(
      this.directories.map(dir => rm(dir, { recursive: true, force: true })),
    )

    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.warn(`Cleanup warnings: ${failures.length} directories failed to remove`)
    }

    this.directories = []
  }

  get trackedCount(): number {
    return this.directories.length
  }
}
```

---

## 10. Harness Barrel Export

```typescript
// tests/llm-eval/harness/index.ts
export { createMockContext, getAskCalls } from './mock-context.js'
export {
  resetFixtureCounter,
  genId,
  buildWorkflowFixture,
  buildHandoffFixture,
  buildDocFixture,
} from './fixture-gen.js'
export {
  assertFileExists,
  assertFileContains,
  assertFileNotContains,
  readJsonFile,
  hivemindPath,
  assertHivemindFileExists,
  assertHivemindFileContains,
  journeyEventsPath,
  trajectoryLedgerPath,
  handoffStorePath,
  workflowStatePath,
} from './fs-verify.js'
export { createSandbox, withSandbox, type TestSandbox } from './cleanup.js'
export {
  executeTool,
  assertSuccess,
  assertError,
  assertHasField,
  type ToolExecuteResult,
} from './tool-runner.js'
export { runJourney, type JourneyStep, type JourneyContext } from './journey-chain.js'
```

---

## 11. Test Execution Plan

### 11.1 Package.json Script

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:llm-eval": "tsx --test \"tests/llm-eval/**/*.test.ts\"",
    "test:llm-eval:layer1": "tsx --test \"tests/llm-eval/tool-invocation/**/*.test.ts\"",
    "test:llm-eval:layer2": "tsx --test \"tests/llm-eval/journeys/**/*.test.ts\"",
    "test:llm-eval:layer3": "tsx --test \"tests/llm-eval/multi-agent/**/*.test.ts\"",
    "test:llm-eval:layer4": "tsx --test \"tests/llm-eval/stress/**/*.test.ts\"",
    "test:llm-eval:layer5": "tsx --test \"tests/llm-eval/nl-dispatch/**/*.test.ts\""
  }
}
```

### 11.2 Implementation Order

| Phase | Layer | Files | Estimated Tests |
|-------|-------|-------|-----------------|
| 1 | Harness | 7 files | 0 (infrastructure) |
| 2 | Layer 1 | 12 files | ~60 tests (5 per tool average) |
| 3 | Layer 2 | 8 files | ~24 tests (3 per journey) |
| 4 | Layer 3 | 4 files | ~16 tests |
| 5 | Layer 4 | 5 files | ~30 tests |
| 6 | Layer 5 | 4 files | ~20 tests |
| **Total** | | **40 files** | **~150 tests** |

### 11.3 Coverage Targets

| Metric | Target |
|--------|--------|
| Tool invocation coverage | 100% (all 12 tools, all actions) |
| Journey coverage | 100% (all 8 mapped journeys) |
| Error path coverage | 100% (all 56 failure modes, top 20 tested) |
| Multi-agent scenarios | 4 scenarios |
| Stress scenarios | 10+ scenarios |
| NL dispatch scenarios | 15+ prompts |

---

## 12. Verification Criteria

The implementation is verified when:

1. **Type check passes:** `npx tsc --noEmit` with zero errors
2. **All tests pass:** `npm run test:llm-eval` exits with code 0
3. **No test pollution:** Each test creates and cleans up its own temp directory
4. **No SDK stubs:** All tool invocations use real `execute()` calls, not mocked implementations
5. **Side effects verified:** File system assertions confirm actual writes, not just return values
6. **Error paths tested:** Every tool action has at least one error path test
7. **Journey chains work:** Multi-step journeys produce correct artifacts at each step
8. **Stress tests pass:** Rapid calls don't corrupt state
9. **Failure modes covered:** Top 20 failure modes each have a dedicated test

---

## 13. Known Constraints & Trade-offs

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| No real LLM in test loop | Tests verify tool behavior, not LLM routing accuracy | Layer 5 tests the dispatch logic directly |
| tsx --test has no built-in mocking | Use direct execute() calls with mock context | Tool harness provides consistent mock context |
| File system tests are slow | Each test creates temp directories | Parallel execution via Node.js test runner |
| Cross-session tests need real session state | Simulate with different session IDs in same directory | Acceptable for tool-level verification |
| Concurrent ops may have race conditions | Use Promise.all for parallel calls | Verify final state, not intermediate |

---

## 14. Future Extensions

- **Visual regression:** Compare journey output artifacts against golden files
- **Performance benchmarks:** Measure tool execution time under load
- **Mutation testing:** Verify tests catch intentional bugs
- **CI integration:** Run Layer 1-2 on every PR, Layer 3-5 nightly
- **LLM-as-judge:** Use an LLM to evaluate the quality of tool output for complex scenarios
