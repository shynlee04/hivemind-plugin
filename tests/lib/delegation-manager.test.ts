import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { DelegationManager } from "../../src/lib/delegation-manager.js"
import type { Delegation } from "../../src/lib/types.js"

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
  timeoutTimers: Map<string, NodeJS.Timeout>
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ id: "child-ses-123" }),
      prompt: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockResolvedValue({ data: {} }),
      messages: vi.fn().mockResolvedValue([
        { role: "user", parts: [{ type: "text", text: "task" }] },
        { role: "assistant", parts: [{ type: "text", text: "Task completed successfully" }] },
      ]),
      abort: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      agents: vi.fn().mockResolvedValue([]),
    },
  }
}

function getInternals(manager: DelegationManager): ManagerInternals {
  return manager as unknown as ManagerInternals
}

function getDelegationsFile(stateDir: string): string {
  return join(stateDir, "delegations.json")
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

  it("rejects invalid agent", async () => {
    const manager = new DelegationManager(createMockClient() as never)

    await expect(manager.delegateSync({
      parentSessionId: "parent-1",
      agent: "not-real",
      prompt: "do work",
    })).rejects.toThrow("[Harness] Invalid agent: not-real")
  })

  it("creates a child session on valid delegation with the expected parent linkage", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-create" })

    const manager = new DelegationManager(client as never)
    const syncResult = manager.delegateSync({
      parentSessionId: "parent-create",
      agent: "builder",
      prompt: "do work",
      title: "Delegation title",
    })

    await vi.waitFor(() => {
      expect(client.session.create).toHaveBeenCalledWith({
        body: {
          title: "Delegation title",
          parentID: "parent-create",
        },
      })
    })

    manager.handleSessionIdle("child-create")
    await expect(syncResult).resolves.toMatchObject({ status: "completed" })
  })

  it("tracks delegation state in maps and schedules a timeout timer", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-track" })

    const manager = new DelegationManager(client as never)
    const { delegationId } = await manager.delegateAsync({
      parentSessionId: "parent-track",
      agent: "builder",
      prompt: "track me",
      timeoutMs: 5000,
    })

    const internals = getInternals(manager)
    const delegation = internals.delegations.get(delegationId)
    expect(delegation).toMatchObject({
      parentSessionId: "parent-track",
      childSessionId: "child-track",
      agent: "builder",
      status: "running",
      timeoutMs: 5000,
    })
    expect(internals.delegationsBySession.get("child-track")).toBe(delegationId)
    expect(internals.timeoutTimers.has(delegationId)).toBe(true)
  })

  it("handleSessionIdle completes delegation and extracts assistant text", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-idle" })
    client.session.messages.mockResolvedValue([
      { role: "user", parts: [{ type: "text", text: "task" }] },
      { role: "assistant", parts: [{ type: "text", text: "result" }] },
      { info: { role: "assistant" }, parts: [{ type: "text", text: "with detail" }] },
    ])

    const manager = new DelegationManager(client as never)
    const syncResult = manager.delegateSync({
      parentSessionId: "parent-idle",
      agent: "builder",
      prompt: "finish",
    })

    await vi.waitFor(() => {
      expect(getInternals(manager).delegationsBySession.has("child-idle")).toBe(true)
    })

    manager.handleSessionIdle("child-idle")

    await expect(syncResult).resolves.toEqual({
      status: "completed",
      result: "result\nwith detail",
      delegationId: getInternals(manager).delegationsBySession.get("child-idle") ?? expect.any(String),
    })

    const delegation = Array.from(getInternals(manager).delegations.values()).find((entry) => entry.childSessionId === "child-idle")
    expect(delegation?.status).toBe("completed")
    expect(delegation?.result).toBe("result\nwith detail")
  })

  it("handleSessionIdle ignores non-delegation sessions", () => {
    const manager = new DelegationManager(createMockClient() as never)
    const before = getInternals(manager).delegations.size

    expect(() => manager.handleSessionIdle("unknown-session")).not.toThrow()
    expect(getInternals(manager).delegations.size).toBe(before)
  })

  it("handleSessionDeleted cleans up a running delegation", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-deleted" })

    const manager = new DelegationManager(client as never)
    const syncResult = manager.delegateSync({
      parentSessionId: "parent-deleted",
      agent: "builder",
      prompt: "delete me",
    })

    await vi.waitFor(() => {
      expect(getInternals(manager).delegationsBySession.get("child-deleted")).toBeDefined()
    })

    const delegationId = getInternals(manager).delegationsBySession.get("child-deleted")!
    manager.handleSessionDeleted("child-deleted")

    await expect(syncResult).rejects.toThrow("[Harness] Delegated session deleted before completion")
    expect(getInternals(manager).delegationsBySession.has("child-deleted")).toBe(false)
    expect(getInternals(manager).timeoutTimers.has(delegationId)).toBe(false)
    expect(getInternals(manager).delegations.get(delegationId)?.status).toBe("error")
  })

  it("timeout marks delegation as timeout and aborts the child session", async () => {
    vi.useFakeTimers()
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-timeout" })

    const manager = new DelegationManager(client as never)
    const syncResult = manager.delegateSync({
      parentSessionId: "parent-timeout",
      agent: "builder",
      prompt: "wait forever",
      timeoutMs: 25,
    })

    await vi.waitFor(() => {
      expect(getInternals(manager).delegationsBySession.get("child-timeout")).toBeDefined()
    })

    const delegationId = getInternals(manager).delegationsBySession.get("child-timeout")!
    const rejection = expect(syncResult).rejects.toThrow("[Harness] Delegation timed out after 25ms")
    await vi.advanceTimersByTimeAsync(30)
    await rejection

    expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "child-timeout" } })
    expect(getInternals(manager).delegations.get(delegationId)?.status).toBe("timeout")
    expect(getInternals(manager).delegationsBySession.has("child-timeout")).toBe(false)
  })

  it("async delegation returns a delegation ID immediately and persists state to disk", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "child-async" })

    const manager = new DelegationManager(client as never)
    const result = await manager.delegateAsync({
      parentSessionId: "parent-async",
      agent: "builder",
      prompt: "background work",
    })

    const filePath = getDelegationsFile(stateDir)
    expect(result.delegationId).toBeTypeOf("string")
    expect(existsSync(filePath)).toBe(true)

    const persisted = JSON.parse(readFileSync(filePath, "utf-8")) as Delegation[]
    expect(persisted).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: result.delegationId,
        parentSessionId: "parent-async",
        childSessionId: "child-async",
        status: "running",
      }),
    ]))
  })

  it("recoverPending restores running delegations and finalizes idle ones", async () => {
    const now = Date.now()
    writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
      {
        id: "delegation-running",
        parentSessionId: "parent-running",
        childSessionId: "child-running",
        agent: "builder",
        status: "running",
        createdAt: now,
        timeoutMs: 60_000,
      },
      {
        id: "delegation-idle",
        parentSessionId: "parent-idle",
        childSessionId: "child-idle-recover",
        agent: "critic",
        status: "running",
        createdAt: now,
        timeoutMs: 60_000,
      },
    ], null, 2))

    const client = createMockClient()
    client.session.status.mockResolvedValue({
      data: {
        "child-running": { type: "busy" },
        "child-idle-recover": { type: "idle" },
      },
    })
    client.session.messages.mockResolvedValue([
      { role: "assistant", parts: [{ type: "text", text: "recovered result" }] },
    ])

    const manager = new DelegationManager(client as never)
    await manager.recoverPending()

    const internals = getInternals(manager)
    expect(internals.delegationsBySession.get("child-running")).toBe("delegation-running")
    expect(internals.timeoutTimers.has("delegation-running")).toBe(true)
    expect(internals.delegations.get("delegation-idle")?.status).toBe("completed")
    expect(internals.delegations.get("delegation-idle")?.result).toBe("recovered result")
  })
})
