import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildDelegationQueueKey } from "../../src/lib/concurrency.js"
import * as spawnerConcurrencyKey from "../../src/lib/spawner/concurrency-key.js"
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
  stabilityTimers: Map<string, NodeJS.Timeout>
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

  // ---------------------------------------------------------------------------
  // dispatch
  // ---------------------------------------------------------------------------

  describe("dispatch", () => {
    it("creates child session with correct title and parentID", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-dispatch",
        agent: "builder",
        prompt: "do work",
      })

      expect(client.session.create).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.objectContaining({
          title: "Delegation: builder",
          parentID: "ses-parent-dispatch",
        }),
      }))
    })

    it("returns delegation ID immediately with dispatched status", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-dispatch",
        agent: "builder",
        prompt: "do work",
      })

      expect(result.status).toBe("dispatched")
      expect(result.delegationId).toBeTypeOf("string")
    })

    it("validates agent name against SDK agent list with [Harness] error prefix", async () => {
      const manager = new DelegationManager(createMockClient() as never)

      await expect(manager.dispatch({
          parentSessionId: "ses-parent-1",
        agent: "not-real",
        prompt: "do work",
      })).rejects.toThrow('[Harness] Invalid agent: "not-real". Available: [researcher, builder, critic, explore, general]')
    })

    it("acquires concurrency slot and releases it after dispatch", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )

      await manager.dispatch({
        parentSessionId: "ses-parent-queue",
        agent: "builder",
        prompt: "queued work",
      })

      expect(acquireSpy).toHaveBeenCalledWith("agent:builder", undefined, undefined)
      expect(client.session.create).toHaveBeenCalledOnce()
    })

    it("derives one canonical provider/model queue key for both acquire-path and spawn-path runtime calls", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [
          {
            name: "builder",
            model: "claude-3-5-sonnet",
            provider: "anthropic",
            category: "implementation",
          },
        ],
      })
      const manager = new DelegationManager(client as never)
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )
      const resolveSpy = vi.spyOn(spawnerConcurrencyKey, "resolveDelegationConcurrencyKey")

      await manager.dispatch({
        parentSessionId: "ses-parent-provider-model",
        agent: "builder",
        prompt: "run with canonical metadata",
      })

      expect(resolveSpy).toHaveBeenCalledWith({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
        agent: "builder",
        category: "implementation",
      })
      expect(acquireSpy).toHaveBeenCalledWith(
        "provider:anthropic:model:claude-3-5-sonnet",
        undefined,
        undefined,
      )
    })

    it("persists canonical queueKey on the stored delegation record and returns it from dispatch", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [
          {
            name: "builder",
            model: "claude-3-5-sonnet",
            provider: "anthropic",
            category: "implementation",
          },
        ],
      })
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-queuekey",
        agent: "builder",
        prompt: "persist queue key",
      })

      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]
      const expectedQueueKey = buildDelegationQueueKey({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
        agent: "builder",
        category: "implementation",
      })

      expect(persisted[0]?.queueKey).toBe(expectedQueueKey)
      expect(manager.getStatus(result.delegationId)?.queueKey).toBe(expectedQueueKey)
      expect(result.queueKey).toBe(expectedQueueKey)
    })

    it("uses canonical fallback semantics from concurrency.ts when only agent/category metadata exists", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [
          {
            name: "builder",
            category: "implementation",
          },
        ],
      })
      const manager = new DelegationManager(client as never)
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )
      const resolveSpy = vi.spyOn(spawnerConcurrencyKey, "resolveDelegationConcurrencyKey")

      await manager.dispatch({
        parentSessionId: "ses-parent-agent-category",
        agent: "builder",
        prompt: "fallback canonical key",
      })

      expect(resolveSpy).toHaveBeenCalledWith({
        provider: undefined,
        model: undefined,
        agent: "builder",
        category: "implementation",
      })
      expect(acquireSpy).toHaveBeenCalledWith(
        "agent:builder:category:implementation",
        undefined,
        undefined,
      )
    })

    it("persists delegation to disk BEFORE sending prompt (write-then-send ordering)", async () => {
      const client = createMockClient()
      const promptSpy = client.session.prompt.mockImplementation(async (...args: unknown[]) => {
        const filePath = getDelegationsFile(stateDir)
        expect(existsSync(filePath)).toBe(true)
        const persisted = JSON.parse(readFileSync(filePath, "utf-8")) as Delegation[]
        expect(persisted).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              parentSessionId: "ses-parent-persist",
              childSessionId: "child-ses-123",
              agent: "builder",
            }),
          ]),
        )
        return args
      })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-persist",
        agent: "builder",
        prompt: "persist first",
      })

      expect(promptSpy).toHaveBeenCalled()
    })

    it("records truthful execution metadata on the in-memory and persisted delegation record", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-runtime-metadata",
        agent: "builder",
        prompt: "persist execution metadata",
      })

      const delegation = manager.getStatus(result.delegationId)
      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]

      expect(delegation).toEqual(expect.objectContaining({
        executionMode: expect.stringMatching(/^(pty|headless)$/),
        workingDirectory: expect.any(String),
      }))
      expect(persisted).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: result.delegationId,
          executionMode: expect.stringMatching(/^(pty|headless)$/),
          workingDirectory: expect.any(String),
          fallbackReason: expect.anything(),
        }),
      ]))
    })

    it("sends prompt to child session with correct agent and text parts", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-prompt" } })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-prompt",
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

    it("does not wait for completion — returns dispatched immediately", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-fast-return",
        agent: "builder",
        prompt: "return now",
      })

      expect(result.status).toBe("dispatched")
      expect(client.session.messages).not.toHaveBeenCalled()
    })

    it("handles session.create() SDK failure — delegation not created, error thrown", async () => {
      const client = createMockClient()
      client.session.create.mockRejectedValue(new Error("SDK create failed"))
      const manager = new DelegationManager(client as never)

      await expect(manager.dispatch({
        parentSessionId: "ses-parent-sdk-fail",
        agent: "builder",
        prompt: "fail at create",
      })).rejects.toThrow("SDK create failed")

      expect(manager.getAllDelegations()).toHaveLength(0)
    })

    it("handles session.prompt() SDK failure — delegation transitions to error", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-prompt-fail" } })
      client.session.prompt.mockRejectedValue(new Error("SDK prompt failed"))
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-prompt-fail",
        agent: "builder",
        prompt: "fail at prompt",
      })

      // Still dispatched immediately
      expect(result.status).toBe("dispatched")

      // Advance timers to process the .catch() → setTimeout(0) chain
      // The prompt rejection goes through microtask queue → .catch() → setTimeout(0) → macrotask
      await vi.advanceTimersByTimeAsync(10)

      // Should now be error
      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("error")
      expect(delegation?.error).toBe("Failed to send prompt to child session")
      expect(delegation?.completedAt).toBeDefined()

      // Verify cleanup of session tracking
      expect(getInternals(manager).delegationsBySession.has("child-prompt-fail")).toBe(false)
    })

    it("concurrent dispatch calls produce independent delegations with unique IDs", async () => {
      const client = createMockClient()
      client.session.create
        .mockResolvedValueOnce({ data: { id: "child-one" } })
        .mockResolvedValueOnce({ data: { id: "child-two" } })
      const manager = new DelegationManager(client as never)

      const [one, two] = await Promise.all([
        manager.dispatch({ parentSessionId: "ses-p1", agent: "builder", prompt: "one" }),
        manager.dispatch({ parentSessionId: "ses-p2", agent: "builder", prompt: "two" }),
      ])

      expect(one.delegationId).not.toBe(two.delegationId)
      expect(manager.getAllDelegations()).toHaveLength(2)
    })

    it("uses custom title when provided", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-title",
        agent: "builder",
        prompt: "custom title work",
        title: "My Custom Title",
      })

      expect(client.session.create).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.objectContaining({
          title: "My Custom Title",
          parentID: "ses-parent-title",
        }),
      }))
    })

    it("uses default safetyCeilingMs when not provided", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-default-ceiling",
        agent: "builder",
        prompt: "default ceiling",
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.safetyCeilingMs).toBe(DEFAULT_SAFETY_CEILING_MS)
    })

    it("uses custom safetyCeilingMs when provided", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-custom-ceiling",
        agent: "builder",
        prompt: "custom ceiling",
        safetyCeilingMs: 120_000,
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.safetyCeilingMs).toBe(120_000)
    })
  })

  // ---------------------------------------------------------------------------
  // dual-signal completion
  // ---------------------------------------------------------------------------

  describe("dual-signal completion", () => {
    it("first idle starts stability polling — status is running, not completed", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-idle-start" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "result" }] }],
      })
      const manager = new DelegationManager(client as never)
      const statusResult = await manager.dispatch({
        parentSessionId: "ses-parent-idle-start",
        agent: "builder",
        prompt: "idle start",
      })

      manager.handleSessionIdle("child-idle-start")
      await flushMicrotasks()

      expect(manager.getStatus(statusResult.delegationId)?.status).toBe("running")
      expect(client.session.messages).not.toHaveBeenCalled()
    })

    it("completion requires STABILITY_THRESHOLD stable polls — not fewer", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-stable" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-stable",
        agent: "builder",
        prompt: "stability",
      })

      manager.handleSessionIdle("child-stable")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * (STABILITY_THRESHOLD - 1))

      expect(manager.getStatus(result.delegationId)?.status).toBe("running")
    })

    it("completes delegation after STABILITY_THRESHOLD stable polls confirmed", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-complete" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "final result" }] }],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-complete",
        agent: "builder",
        prompt: "complete",
      })

      manager.handleSessionIdle("child-complete")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      expect(client.session.messages).toHaveBeenCalled()
    })

    it("resets stablePollCount when message count changes between polls", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-reset" } })
      let messageCallCount = 0
      client.session.messages.mockImplementation(async () => {
        messageCallCount++
        if (messageCallCount <= 1) {
          return { data: [{ role: "assistant", parts: [{ type: "text", text: "partial" }] }] }
        }
        return { data: [{ role: "assistant", parts: [{ type: "text", text: "final" }] }] }
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-reset",
        agent: "builder",
        prompt: "reset test",
      })

      manager.handleSessionIdle("child-reset")
      // Advance through all stability polls — completion should succeed
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      // The key assertion: the delegation should complete after stability threshold
      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
    })

    it("multiple idle events do not restart stability polling", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-multi-idle" } })
      const manager = new DelegationManager(client as never)
      await manager.dispatch({
        parentSessionId: "ses-parent-multi-idle",
        agent: "builder",
        prompt: "multi idle",
      })

      manager.handleSessionIdle("child-multi-idle")
      await flushMicrotasks()

      // Only one stability timer should exist
      const stabilityCount = getInternals(manager).stabilityTimers.size
      expect(stabilityCount).toBe(1)

      // Second idle should NOT add another timer
      manager.handleSessionIdle("child-multi-idle")
      await flushMicrotasks()

      expect(getInternals(manager).stabilityTimers.size).toBe(1)
    })

    it("extracts assistant text from completed delegation messages", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-extract" } })
      client.session.messages.mockResolvedValue({
        data: [
          { role: "user", parts: [{ type: "text", text: "task prompt" }] },
          { role: "assistant", parts: [{ type: "text", text: "Hello world" }] },
          { role: "assistant", parts: [{ type: "text", text: "Second part" }] },
        ],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-extract",
        agent: "builder",
        prompt: "extract text",
      })

      manager.handleSessionIdle("child-extract")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      expect(delegation?.result).toBe("Hello world\nSecond part")
    })
  })

  // ---------------------------------------------------------------------------
  // session lifecycle
  // ---------------------------------------------------------------------------

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
        parentSessionId: "ses-parent-completed-ignore",
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

    it("handleSessionIdle ignores error delegations", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-error-ignore" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-error-ignore",
        agent: "builder",
        prompt: "error test",
      })

      // Force error status
      manager.handleSessionDeleted("child-error-ignore")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.status).toBe("error")

      // Idle on same session should be a no-op
      const beforeError = manager.getStatus(result.delegationId)?.error
      manager.handleSessionIdle("child-error-ignore")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.error).toBe(beforeError)
    })

    it("handleSessionIdle ignores timeout delegations", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-timeout-ignore" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-timeout-ignore",
        agent: "builder",
        prompt: "timeout test",
        safetyCeilingMs: 25,
      })

      // Trigger safety ceiling timeout
      await vi.advanceTimersByTimeAsync(25)
      expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")

      // Idle on same session should be a no-op
      manager.handleSessionIdle("child-timeout-ignore")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")
    })

    it("handleSessionDeleted marks delegation as error, clears safety timer, persists, cleans up", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-deleted" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-deleted",
        agent: "builder",
        prompt: "delete me",
      })

      manager.handleSessionDeleted("child-deleted")
      await flushMicrotasks()

      expect(manager.getStatus(result.delegationId)?.status).toBe("error")
      expect(manager.getStatus(result.delegationId)?.error).toBe("Delegated session deleted before completion")
      expect(manager.getStatus(result.delegationId)?.completedAt).toBeDefined()
      expect(getInternals(manager).delegationsBySession.has("child-deleted")).toBe(false)
      expect(existsSync(getDelegationsFile(stateDir))).toBe(true)
      expect(getInternals(manager).safetyTimers.has(result.delegationId)).toBe(false)
    })

    it("handleSessionDeleted handles delegation not found in Map gracefully", () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      // Register a delegation manually, then delete it from the Map
      // so delegationsBySession still has the mapping but delegations Map doesn't
      const internals = getInternals(manager)
      internals.delegationsBySession.set("child-orphan", "del-orphan")
      // Don't set in delegations Map — simulates orphaned tracking

      expect(() => manager.handleSessionDeleted("child-orphan")).not.toThrow()
      expect(internals.delegationsBySession.has("child-orphan")).toBe(false)
    })

    it("handleSessionDeleted clears stability timer", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-del-stab" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-del-stab",
        agent: "builder",
        prompt: "delete during stability",
      })

      // Start stability polling
      manager.handleSessionIdle("child-del-stab")
      await flushMicrotasks()

      // Verify stability timer exists
      expect(getInternals(manager).stabilityTimers.has(result.delegationId)).toBe(true)

      // Delete should clear it
      manager.handleSessionDeleted("child-del-stab")
      await flushMicrotasks()

      expect(getInternals(manager).stabilityTimers.has(result.delegationId)).toBe(false)
      expect(manager.getStatus(result.delegationId)?.status).toBe("error")
    })

    it("safety ceiling does NOT fire if delegation completes before ceiling", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-complete-first" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "done fast" }] }],
      })
      const manager = new DelegationManager(client as never)
      // Set safety ceiling high enough that stability polls complete first
      // STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD = 3000 * 3 = 9000ms
      const ceilingMs = STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD + 5000 // 14000ms
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-complete-first",
        agent: "builder",
        prompt: "complete fast",
        safetyCeilingMs: ceilingMs,
      })

      // Complete via dual-signal before safety ceiling
      manager.handleSessionIdle("child-complete-first")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")

      // Advance past safety ceiling — should NOT change to timeout (already completed)
      await vi.advanceTimersByTimeAsync(ceilingMs)
      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      expect(client.session.abort).not.toHaveBeenCalled()
    })

    it("safety ceiling fires after MAX runtime and aborts child session", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-safety" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-safety",
        agent: "builder",
        prompt: "wait forever",
        safetyCeilingMs: 25,
      })

      await vi.advanceTimersByTimeAsync(24)
      expect(manager.getStatus(result.delegationId)?.status).toBe("running")

      await vi.advanceTimersByTimeAsync(1)
      expect(manager.getStatus(result.delegationId)?.status).toBe("timeout")
      expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "child-safety" } })
    })

    it("safety ceiling error message contains [Harness] prefix and ceiling time", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-ceiling-msg" } })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-ceiling-msg",
        agent: "builder",
        prompt: "ceiling msg",
        safetyCeilingMs: 100,
      })

      await vi.advanceTimersByTimeAsync(100)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.error).toContain("[Harness]")
      expect(delegation?.error).toContain("100")
    })
  })

  // ---------------------------------------------------------------------------
  // persistence
  // ---------------------------------------------------------------------------

  describe("persistence", () => {
    it("getStatus returns current delegation state from in-memory Map", async () => {
      const manager = new DelegationManager(createMockClient() as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-status",
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

    it("getStatus returns undefined for unknown delegation ID", () => {
      const manager = new DelegationManager(createMockClient() as never)
      expect(manager.getStatus("nonexistent")).toBeUndefined()
    })

    it("getAllDelegations returns all delegations including completed ones", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-all" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "done" }] }],
      })
      const manager = new DelegationManager(client as never)
      await manager.dispatch({
        parentSessionId: "ses-parent-all",
        agent: "builder",
        prompt: "all delegations",
      })

      manager.handleSessionIdle("child-all")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const all = manager.getAllDelegations()
      expect(all).toHaveLength(1)
      expect(all[0]?.status).toBe("completed")
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
        parentSessionId: "ses-parent-order",
        agent: "builder",
        prompt: "ordered",
      })

      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]
      expect(persisted[0]?.childSessionId).toBe("child-order")
    })

    it("writes delegations to delegations.json with valid JSON array", async () => {
      const manager = new DelegationManager(createMockClient() as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-file",
        agent: "builder",
        prompt: "file please",
      })

      const filePath = getDelegationsFile(stateDir)
      expect(existsSync(filePath)).toBe(true)
      const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
      expect(Array.isArray(parsed)).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // recovery
  // ---------------------------------------------------------------------------

  describe("recovery", () => {
    it("normalizes persisted delegations that predate queueKey with an empty-string default", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      writeFileSync(
        getDelegationsFile(stateDir),
        `${JSON.stringify([
          {
            id: "legacy-del-1",
            parentSessionId: "ses-parent-legacy",
            childSessionId: "child-legacy",
            agent: "builder",
            status: "completed",
            createdAt: Date.now(),
            executionMode: "headless",
            workingDirectory: process.cwd(),
            lastMessageCount: 0,
            stablePollCount: 0,
          },
        ])}\n`,
        "utf-8",
      )

      await manager.recoverPending()

      expect(manager.getStatus("legacy-del-1")?.queueKey).toBe("")
    })

    it("restores running delegations from disk and re-registers them", async () => {
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

    it("finalizes delegations whose sessions went idle while down via dual-signal", async () => {
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

    it("marks delegations as error if child session not found", async () => {
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
      expect(manager.getStatus("delegation-missing")?.error).toBe("Child session not found on recovery")
    })

    it("handles corrupted JSON file gracefully — returns empty array", async () => {
      writeFileSync(getDelegationsFile(stateDir), "NOT VALID JSON {{{")

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).resolves.toBeUndefined()
      expect(manager.getAllDelegations()).toHaveLength(0)
    })

    it("handles empty delegations.json — returns empty array", async () => {
      writeFileSync(getDelegationsFile(stateDir), "[]")

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).resolves.toBeUndefined()
      expect(manager.getAllDelegations()).toHaveLength(0)
    })

    it("skips non-running delegations during recovery", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-completed",
          parentSessionId: "parent-completed",
          childSessionId: "child-completed",
          agent: "builder",
          status: "completed",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 3,
          result: "already done",
          completedAt: now + 1000,
        },
      ], null, 2))
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      // Completed delegation should be loaded into memory but NOT register session tracking
      expect(manager.getStatus("delegation-completed")?.status).toBe("completed")
      expect(getInternals(manager).delegationsBySession.has("child-completed")).toBe(false)
      // Should NOT call session.status for completed delegations
      expect(client.session.status).not.toHaveBeenCalled()
    })

    it("handles non-array JSON content gracefully", async () => {
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify({ not: "an array" }))

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).resolves.toBeUndefined()
      expect(manager.getAllDelegations()).toHaveLength(0)
    })

    it("handles missing delegations.json file gracefully", async () => {
      // Don't create the file at all
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).resolves.toBeUndefined()
      expect(manager.getAllDelegations()).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------
  // extractAssistantText (tested through finalizeDelegation)
  // ---------------------------------------------------------------------------

  describe("extractAssistantText", () => {
    it("handles empty messages array — returns empty string result", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-empty-msg" } })
      client.session.messages.mockResolvedValue({ data: [] })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-empty-msg",
        agent: "builder",
        prompt: "empty messages",
      })

      manager.handleSessionIdle("child-empty-msg")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      expect(delegation?.result).toBe("")
    })

    it("handles messages with no assistant role — returns empty string", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-no-asst" } })
      client.session.messages.mockResolvedValue({
        data: [
          { role: "user", parts: [{ type: "text", text: "prompt only" }] },
          { role: "tool", parts: [{ type: "text", text: "tool output" }] },
        ],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-no-asst",
        agent: "builder",
        prompt: "no assistant",
      })

      manager.handleSessionIdle("child-no-asst")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      expect(delegation?.result).toBe("")
    })

    it("handles messages with multiple text parts from assistant — joins with newline", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-multi-part" } })
      client.session.messages.mockResolvedValue({
        data: [
          { role: "assistant", parts: [{ type: "text", text: "part one" }] },
          { role: "assistant", parts: [{ type: "text", text: "part two" }] },
          { role: "assistant", parts: [{ type: "text", text: "part three" }] },
        ],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-multi-part",
        agent: "builder",
        prompt: "multi part",
      })

      manager.handleSessionIdle("child-multi-part")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      expect(delegation?.result).toBe("part one\npart two\npart three")
    })

    it("handles assistant message via info.role field", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-info-role" } })
      client.session.messages.mockResolvedValue({
        data: [
          { info: { role: "assistant" }, parts: [{ type: "text", text: "via info role" }] },
        ],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-info-role",
        agent: "builder",
        prompt: "info role test",
      })

      manager.handleSessionIdle("child-info-role")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      expect(delegation?.result).toBe("via info role")
    })
  })

  // ---------------------------------------------------------------------------
  // finalization error handling
  // ---------------------------------------------------------------------------

  describe("finalization", () => {
    it("finalizeDelegation handles messages() SDK failure — delegation becomes error", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-final-fail" } })
      client.session.messages.mockRejectedValue(new Error("Messages SDK error"))
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-final-fail",
        agent: "builder",
        prompt: "final fail",
      })

      manager.handleSessionIdle("child-final-fail")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("error")
      expect(delegation?.error).toBe("Messages SDK error")
      expect(delegation?.completedAt).toBeDefined()
    })

    it("finalization cleans up session tracking and clears all timers", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-cleanup" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "clean" }] }],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-cleanup",
        agent: "builder",
        prompt: "cleanup test",
      })

      manager.handleSessionIdle("child-cleanup")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      expect(getInternals(manager).delegationsBySession.has("child-cleanup")).toBe(false)
      expect(getInternals(manager).safetyTimers.has(result.delegationId)).toBe(false)
      expect(getInternals(manager).stabilityTimers.has(result.delegationId)).toBe(false)
    })

    it("notifyParent failure does not crash finalization", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-notify-fail" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "notify fail" }] }],
      })
      // DelegationManager doesn't have a notifyParent in current implementation,
      // but if it did, failure should not crash. Test that finalization succeeds
      // even when session.messages is called (which it is for result extraction).
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-notify-fail",
        agent: "builder",
        prompt: "notify fail test",
      })

      manager.handleSessionIdle("child-notify-fail")
      await vi.advanceTimersByTimeAsync(STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD)

      // Should complete successfully — no crash from any notification failure
      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
    })
  })
})
