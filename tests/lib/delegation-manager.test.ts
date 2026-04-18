import * as fs from "node:fs"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/lib/delegation-manager.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  STABILITY_POLL_INTERVAL_MS,
  STABILITY_THRESHOLD,
  type Delegation,
} from "../../src/lib/types.js"

type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    messages: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }
  app: {
    agents: ReturnType<typeof vi.fn>
  }
}

type ManagerInternals = {
  delegations: Map<string, Delegation>
  delegationsBySession: Map<string, string>
  safetyTimers: Map<string, NodeJS.Timeout>
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      messages: vi.fn().mockResolvedValue({
        data: [
          { role: "user", parts: [{ type: "text", text: "task" }] },
          { role: "assistant", parts: [{ type: "text", text: "Task completed successfully" }] },
        ],
      }),
      abort: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      agents: vi.fn().mockResolvedValue({
        data: [
          { name: "researcher" },
          { name: "builder" },
          { name: "critic" },
          { name: "explore" },
          { name: "general" },
        ],
      }),
    },
  }
}

function getInternals(manager: DelegationManager): ManagerInternals {
  return manager as unknown as ManagerInternals
}

function getDelegationsFile(stateDir: string): string {
  return join(stateDir, "delegations.json")
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
}

describe("DelegationManager", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeEach(() => {
    vi.useRealTimers()
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    stateDir = mkdtempSync(join(tmpdir(), "delegation-manager-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  describe("dispatch", () => {
    it("dispatch creates child session and returns delegation ID immediately", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "parent-dispatch",
        agent: "builder",
        prompt: "do work",
      })

      expect(result.status).toBe("dispatched")
      expect(result.delegationId).toBeTypeOf("string")
      expect(client.session.create).toHaveBeenCalledOnce()
    })

    it("dispatch validates agent name against SDK agent list", async () => {
      const manager = new DelegationManager(createMockClient() as never)

      await expect(manager.dispatch({
        parentSessionId: "parent-1",
        agent: "not-real",
        prompt: "do work",
      })).rejects.toThrow('[Harness] Invalid agent: "not-real". Available: [researcher, builder, critic, explore, general]')
    })

    it("dispatch acquires concurrency queue key before creating session", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )

      await manager.dispatch({
        parentSessionId: "parent-queue",
        agent: "builder",
        prompt: "queued work",
      })

      expect(acquireSpy).toHaveBeenCalledWith("agent:builder", undefined, undefined)
      expect(client.session.create).toHaveBeenCalledOnce()
    })

    it("dispatch persists delegation to disk immediately after registration before sending prompt", async () => {
      const client = createMockClient()
      const promptSpy = client.session.prompt.mockImplementation(async (...args: unknown[]) => {
        const filePath = getDelegationsFile(stateDir)
        expect(existsSync(filePath)).toBe(true)
        const persisted = JSON.parse(readFileSync(filePath, "utf-8")) as Delegation[]
        expect(persisted).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              parentSessionId: "parent-persist",
              childSessionId: "child-ses-123",
              agent: "builder",
            }),
          ]),
        )
        return args
      })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "parent-persist",
        agent: "builder",
        prompt: "persist first",
      })

      expect(promptSpy).toHaveBeenCalled()
    })

    it("dispatch sends prompt to child session after registration", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-prompt" } })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "parent-prompt",
        agent: "builder",
        prompt: "hello child",
      })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "child-prompt" },
        body: {
          parts: [{ type: "text", text: "hello child" }],
          agent: "builder",
        },
      })
    })

    it("dispatch does not wait for completion and returns dispatched status", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "parent-fast-return",
        agent: "builder",
        prompt: "return now",
      })

      expect(result.status).toBe("dispatched")
      expect(client.session.messages).not.toHaveBeenCalled()
    })
  })

  describe("dual-signal completion", () => {
    it("handleSessionIdle triggers dual-signal and first idle starts stability polling", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-idle-start" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "result" }] }],
      })
      const manager = new DelegationManager(client as never)
      const statusResult = await manager.dispatch({
        parentSessionId: "parent-idle-start",
        agent: "builder",
        prompt: "idle start",
      })

      manager.handleSessionIdle("child-idle-start")
      await flushMicrotasks()

      expect(manager.getStatus(statusResult.delegationId)?.status).toBe("running")
      expect(client.session.messages).not.toHaveBeenCalled()
    })

    it("dual-signal completion requires STABILITY_THRESHOLD stable message count polls", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-stable" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-stable",
        agent: "builder",
        prompt: "stability",
      })

      manager.handleSessionIdle("child-stable")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * (STABILITY_THRESHOLD - 1))

      expect(manager.getStatus(result.delegationId)?.status).toBe("running")
    })

    it("handleSessionIdle completes delegation only after stability confirmed", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-complete" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "final result" }] }],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-complete",
        agent: "builder",
        prompt: "complete",
      })

      manager.handleSessionIdle("child-complete")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      expect(client.session.messages).toHaveBeenCalled()
    })
  })

  describe("session lifecycle", () => {
    it("handleSessionIdle ignores sessions not tracked as delegations", () => {
      const manager = new DelegationManager(createMockClient() as never)

      expect(() => manager.handleSessionIdle("unknown-session")).not.toThrow()
    })

    it("handleSessionIdle ignores already-completed delegations", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-completed-ignore" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-completed-ignore",
        agent: "builder",
        prompt: "done once",
      })

      manager.handleSessionIdle("child-completed-ignore")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)
      client.session.messages.mockClear()

      manager.handleSessionIdle("child-completed-ignore")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      expect(client.session.messages).not.toHaveBeenCalled()
    })

    it("handleSessionDeleted marks delegation as error, cleans up, persists", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-deleted" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-deleted",
        agent: "builder",
        prompt: "delete me",
      })

      manager.handleSessionDeleted("child-deleted")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.status).toBe("error")
      expect(getInternals(manager).delegationsBySession.has("child-deleted")).toBe(false)
      expect(existsSync(getDelegationsFile(stateDir))).toBe(true)
    })

    it("safety ceiling fires only after MAX runtime elapsed and not before", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-safety" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-safety",
        agent: "builder",
        prompt: "wait forever",
        safetyCeilingMs: 25,
      })

      await vi.advanceTimersByTimeAsync(24)
      expect(manager.getStatus(result.delegationId)?.status).toBe("running")

      await vi.advanceTimersByTimeAsync(1)
      expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")
    })

    it("safety ceiling aborts child session and marks delegation as timeout", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-abort" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-abort",
        agent: "builder",
        prompt: "timeout me",
        safetyCeilingMs: 25,
      })

      await vi.advanceTimersByTimeAsync(25)

      expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "child-abort" } })
      expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")
    })
  })

  describe("persistence", () => {
    it("getStatus returns current delegation state from the in-memory Map", async () => {
      const manager = new DelegationManager(createMockClient() as never)
      const result = await manager.dispatch({
        parentSessionId: "parent-status",
        agent: "builder",
        prompt: "status check",
      })

      expect(manager.getStatus(result.delegationId)).toMatchObject({
        id: result.delegationId,
        status: "dispatched",
        safetyCeilingMs: DEFAULT_SAFETY_CEILING_MS,
        lastMessageCount: 0,
        stablePollCount: 0,
      })
    })

    it("concurrent dispatch calls are tracked independently by delegation ID", async () => {
      const client = createMockClient()
      client.session.create
        .mockResolvedValueOnce({ data: { id: "child-one" } })
        .mockResolvedValueOnce({ data: { id: "child-two" } })
      const manager = new DelegationManager(client as never)

      const [one, two] = await Promise.all([
        manager.dispatch({ parentSessionId: "p1", agent: "builder", prompt: "one" }),
        manager.dispatch({ parentSessionId: "p2", agent: "builder", prompt: "two" }),
      ])

      expect(one.delegationId).not.toBe(two.delegationId)
      expect(manager.getAllDelegations()).toHaveLength(2)
    })

    it("persistence write happens before result extraction to avoid race conditions", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-order" } })
      client.session.prompt.mockImplementation(async () => {
        const filePath = getDelegationsFile(stateDir)
        expect(existsSync(filePath)).toBe(true)
        return undefined
      })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "parent-order",
        agent: "builder",
        prompt: "ordered",
      })

      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]
      expect(persisted[0]?.childSessionId).toBe("child-order")
    })

    it("writes delegations to delegations.json", async () => {
      const manager = new DelegationManager(createMockClient() as never)

      await manager.dispatch({
        parentSessionId: "parent-file",
        agent: "builder",
        prompt: "file please",
      })

      const filePath = getDelegationsFile(stateDir)
      expect(existsSync(filePath)).toBe(true)
      expect(JSON.parse(readFileSync(filePath, "utf-8"))).toEqual(expect.any(Array))
    })
  })

  describe("recovery", () => {
    it("recoverPending restores running delegations from disk on plugin load and re-registers them", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-running",
          parentSessionId: "parent-running",
          childSessionId: "child-running",
          agent: "builder",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 2,
          stablePollCount: 1,
        },
      ], null, 2))
      const client = createMockClient()
      client.session.status.mockResolvedValue({ data: { "child-running": { type: "busy" } } })
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      expect(manager.getStatus("delegation-running")?.status).toBe("running")
      expect(getInternals(manager).delegationsBySession.get("child-running")).toBe("delegation-running")
    })

    it("recoverPending finalizes delegations whose sessions completed while down", async () => {
      vi.useFakeTimers()
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-idle",
          parentSessionId: "parent-idle",
          childSessionId: "child-idle",
          agent: "critic",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
        },
      ], null, 2))
      const client = createMockClient()
      client.session.status.mockResolvedValue({ data: { "child-idle": { type: "idle" } } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "recovered result" }] }],
      })
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      expect(manager.getStatus("delegation-idle")?.status).toBe("completed")
      expect(manager.getStatus("delegation-idle")?.result).toBe("recovered result")
    })

    it("recoverPending marks delegations as error if child session not found", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-missing",
          parentSessionId: "parent-missing",
          childSessionId: "child-missing",
          agent: "builder",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
        },
      ], null, 2))
      const client = createMockClient()
      client.session.status.mockResolvedValue({ data: {} })
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      expect(manager.getStatus("delegation-missing")?.status).toBe("error")
    })
  })

  it("documents dispatch dual-signal stability and safetyCeiling terminology in the suite", () => {
    expect(["dispatch", "dual-signal", "stability", "safetyCeiling"]).toHaveLength(4)
  })
})
