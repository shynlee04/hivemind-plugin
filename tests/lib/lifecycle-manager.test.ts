import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, describe, it, expect, vi } from "vitest"
import {
  createHarnessLifecycleManager,
  isValidTransition,
} from "../../src/lib/lifecycle-manager.js"
import { getSessionContinuity } from "../../src/lib/continuity.js"
import { buildDelegationQueueKey, reserveSubagentSpawn } from "../../src/lib/concurrency.js"
import { recordSessionContinuity } from "../../src/lib/continuity.js"
import { taskState } from "../../src/lib/state.js"
import type { SessionLifecyclePhase } from "../../src/lib/types.js"
import type { ExecutionModeResult } from "../../src/lib/execution-mode.js"

const continuityDir = mkdtempSync(join(tmpdir(), "hivemind-lifecycle-test-"))
process.env.OPENCODE_HARNESS_CONTINUITY_FILE = join(continuityDir, "session-continuity.json")

afterAll(() => {
  rmSync(continuityDir, { recursive: true, force: true })
})

function flushAsyncWork(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return { promise, resolve, reject }
}

function buildExecution(overrides: Partial<ExecutionModeResult> = {}): ExecutionModeResult {
  return {
    family: "built-in",
    submode: "builtin-subsession",
    rationale: "Test path uses builtin subsession execution.",
    characteristics: {
      isParallel: false,
      isInteractive: true,
      isResearch: false,
      isHeadless: false,
      runInBackground: false,
    },
    capabilityEvidence: {
      hasTmux: false,
      projectRoot: process.cwd(),
    },
    ...overrides,
  }
}

describe("lifecycle transition guard", () => {
  // --- valid forward transitions ---
  it("created → queued is valid", () => {
    expect(isValidTransition("created", "queued")).toBe(true)
  })

  it("created → dispatching is valid", () => {
    expect(isValidTransition("created", "dispatching")).toBe(true)
  })

  it("queued → dispatching is valid", () => {
    expect(isValidTransition("queued", "dispatching")).toBe(true)
  })

  it("dispatching → running is valid", () => {
    expect(isValidTransition("dispatching", "running")).toBe(true)
  })

  it("running → completed is valid", () => {
    expect(isValidTransition("running", "completed")).toBe(true)
  })

  it("running → failed is valid", () => {
    expect(isValidTransition("running", "failed")).toBe(true)
  })

  // --- invalid transitions from terminal states ---
  it("completed → running is INVALID (rejected)", () => {
    expect(isValidTransition("completed", "running")).toBe(false)
  })

  it("completed → created is INVALID (rejected)", () => {
    expect(isValidTransition("completed", "created")).toBe(false)
  })

  it("failed → running is INVALID (rejected)", () => {
    expect(isValidTransition("failed", "running")).toBe(false)
  })

  // --- invalid backward transition ---
  it("running → created is INVALID (no backward transitions)", () => {
    expect(isValidTransition("running", "created")).toBe(false)
  })

  // --- isValidTransition returns boolean correctly for all combinations ---
  it("returns boolean for every phase combination", () => {
    const phases: SessionLifecyclePhase[] = ["created", "queued", "dispatching", "running", "completed", "failed"]
    for (const from of phases) {
      for (const to of phases) {
        const result = isValidTransition(from, to)
        expect(typeof result).toBe("boolean")
      }
    }
  })

  // --- self-transitions are invalid ---
  it("self-transition (running → running) is invalid", () => {
    expect(isValidTransition("running", "running")).toBe(false)
  })

  it("self-transition (completed → completed) is invalid", () => {
    expect(isValidTransition("completed", "completed")).toBe(false)
  })
})

describe("HarnessLifecycleManager queue integration", () => {
  it("hydrates persisted compaction checkpoint state from continuity", () => {
    taskState.clear()
    recordSessionContinuity({
      sessionID: "checkpoint-child",
      toolProfile: {
        permissionRules: [],
        compatibleTools: ["read"],
      },
      promptParams: {
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        temperature: 0,
        guidanceText: "resume safely",
        tools: ["read"],
      },
      metadata: {
        parentSessionID: "parent-1",
        rootSessionID: "root-1",
        delegation: {
          rootID: "root-1",
          depth: 1,
          budgetUsed: 1,
          agent: "builder",
          category: "implementation",
          model: "gpt-5.4",
          queueKey: "gpt-5.4:builder:implementation",
        },
        title: "builder: restore compaction checkpoint",
        description: "restore compaction checkpoint",
        category: "implementation",
        constraints: [],
        runInBackground: false,
        status: "running",
        createdAt: 1,
        updatedAt: 1,
        compactionCheckpoint: {
          agent: "builder",
          model: "gpt-5.4",
          tools: ["read"],
          delegationMeta: {
            rootID: "root-1",
            depth: 1,
            budgetUsed: 1,
            agent: "builder",
            category: "implementation",
            model: "gpt-5.4",
            queueKey: "gpt-5.4:builder:implementation",
          },
          warnings: ["restore warning"],
          sessionStats: {
            total: 4,
            byTool: { read: 4 },
            loop: { signature: "read:/tmp/demo", count: 2 },
          },
          capturedAt: 123,
        },
      },
    })

    const manager = createHarnessLifecycleManager({
      client: {} as never,
      pollTimeoutMs: 50,
    })

    manager.hydrateFromContinuity()

    expect(taskState.getDelegationMeta("checkpoint-child")).toEqual({
      rootID: "root-1",
      depth: 1,
      budgetUsed: 1,
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      queueKey: "gpt-5.4:builder:implementation",
    })
    expect(taskState.getStats("checkpoint-child")).toMatchObject({
      total: 4,
      byTool: { read: 4 },
      warnings: ["restore warning"],
      loop: { signature: "read:/tmp/demo", count: 2 },
    })
  })

  it("tracks a waiting session in the task queue until its lane is acquired", async () => {
    process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = "1"

    const firstPrompt = createDeferred<{ parts: Array<{ type: string; text: string }> }>()
    let createCount = 0

    const client = {
      session: {
        create: async () => {
          createCount += 1
          return { id: `child-${createCount}` }
        },
        prompt: async ({ path }: { path: { id: string } }) => {
          if (path.id === "child-1") {
            return firstPrompt.promise
          }

          return {
            parts: [
              {
                type: "text",
                text: `done:${path.id}`,
              },
            ],
          }
        },
      },
    } as never

    const manager = createHarnessLifecycleManager({
      client,
      pollTimeoutMs: 50,
    })

    const route = {
      category: "implementation" as const,
      effectiveAgent: "builder" as const,
      presetKey: "builder",
      effectiveModel: "gpt-5.4",
      temperature: 0,
      fallbackUsed: false,
      rationale: "matched builder route",
      modelSource: "explicit" as const,
      agentSource: "explicit" as const,
      temperatureSource: "agent" as const,
      warnings: [],
    }

    const queueKey = buildDelegationQueueKey({
      model: route.effectiveModel,
      agent: "builder",
      category: route.category,
    })

    const firstLaunch = manager.launchDelegatedSession({
      parentSessionID: "parent-1",
      rootID: "root-1",
      childDepth: 1,
      description: "first",
      runInBackground: false,
      agent: "builder",
      route,
      permissionRules: [],
      compatibleTools: [],
      promptText: "first prompt",
      execution: buildExecution(),
    })

    await flushAsyncWork()

    const secondLaunch = manager.launchDelegatedSession({
      parentSessionID: "parent-1",
      rootID: "root-1",
      childDepth: 1,
      description: "second",
      runInBackground: false,
      agent: "builder",
      route,
      permissionRules: [],
      compatibleTools: [],
      promptText: "second prompt",
      execution: buildExecution(),
    })

    await flushAsyncWork()

    const internalQueue = (manager as unknown as {
      queue: { queueSize: (key: string) => number; peek: (key: string) => unknown }
    }).queue
    expect(internalQueue.queueSize(queueKey)).toBe(1)
    expect(internalQueue.peek(queueKey)).toMatchObject({
      id: "child-2",
      priority: "high",
    })

    const queuedLifecycle = getSessionContinuity("child-2")?.metadata.lifecycle
    expect(queuedLifecycle?.phase).toBe("queued")
    expect(getSessionContinuity("child-2")?.metadata.delegationPacket).toMatchObject({
      spec: "second",
      parentChain: ["root-1", "parent-1", "child-2"],
      status: "pending",
    })

    firstPrompt.resolve({
      parts: [
        {
          type: "text",
          text: "done:child-1",
        },
      ],
    })

    await expect(firstLaunch).resolves.toBe("done:child-1")
    await expect(secondLaunch).resolves.toBe("done:child-2")

    expect(internalQueue.queueSize(queueKey)).toBe(0)
    expect(internalQueue.peek(queueKey)).toBeUndefined()
    expect(getSessionContinuity("child-2")?.metadata.lifecycle?.phase).toBe("completed")
    expect(getSessionContinuity("child-2")?.metadata.delegationPacket?.status).toBe("completed")
  })

  it("commits a provided spawn reservation on successful launch", async () => {
    taskState.clear()

    const client = {
      session: {
        create: vi.fn(async () => ({ id: "child-success" })),
        prompt: vi.fn(async () => ({
          parts: [
            {
              type: "text",
              text: "done:child-success",
            },
          ],
        })),
      },
    } as never

    const manager = createHarnessLifecycleManager({
      client,
      pollTimeoutMs: 50,
    })

    const reservation = reserveSubagentSpawn("parent-success", "root-success", taskState)
    const route = {
      category: "implementation" as const,
      effectiveAgent: "builder" as const,
      presetKey: "builder",
      effectiveModel: "gpt-5.4",
      temperature: 0,
      fallbackUsed: false,
      rationale: "matched builder route",
      modelSource: "explicit" as const,
      agentSource: "explicit" as const,
      temperatureSource: "agent" as const,
      warnings: [],
    }

    await expect(
      manager.launchDelegatedSession({
        parentSessionID: "parent-success",
        rootID: "root-success",
        childDepth: 1,
        description: "success path",
        runInBackground: false,
        agent: "builder",
        route,
        permissionRules: [],
        compatibleTools: [],
        promptText: "ship it",
        execution: buildExecution(),
        spawnReservation: reservation,
      }),
    ).resolves.toBe("done:child-success")

    expect(taskState.getRootBudget("root-success")?.reserved ?? 0).toBe(0)
    expect(taskState.getRootBudget("root-success")?.descendants.has("child-success")).toBe(true)
  })

  it("rolls back a provided spawn reservation when launch fails before session creation", async () => {
    taskState.clear()

    const client = {
      session: {
        create: vi.fn(async () => {
          throw new Error("create failed")
        }),
      },
    } as never

    const manager = createHarnessLifecycleManager({
      client,
      pollTimeoutMs: 50,
    })

    const reservation = reserveSubagentSpawn("parent-failure", "root-failure", taskState)
    const route = {
      category: "implementation" as const,
      effectiveAgent: "builder" as const,
      presetKey: "builder",
      effectiveModel: "gpt-5.4",
      temperature: 0,
      fallbackUsed: false,
      rationale: "matched builder route",
      modelSource: "explicit" as const,
      agentSource: "explicit" as const,
      temperatureSource: "agent" as const,
      warnings: [],
    }

    await expect(
      manager.launchDelegatedSession({
        parentSessionID: "parent-failure",
        rootID: "root-failure",
        childDepth: 1,
        description: "failure path",
        runInBackground: false,
        agent: "builder",
        route,
        permissionRules: [],
        compatibleTools: [],
        promptText: "ship it",
        execution: buildExecution(),
        spawnReservation: reservation,
      }),
    ).rejects.toThrow("create failed")

    expect(taskState.getRootBudget("root-failure")?.reserved ?? 0).toBe(0)
    expect(taskState.getRootBudget("root-failure")?.descendants.size ?? 0).toBe(0)
  })
})
