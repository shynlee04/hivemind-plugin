import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    messages: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn(),
      prompt: vi.fn(),
      status: vi.fn(),
      messages: vi.fn(),
      abort: vi.fn(),
    },
  }
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

  it("delegateSync creates a child session, tracks it, and resolves on session idle", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "ses_child_sync" })
    client.session.prompt.mockResolvedValue(undefined)
    client.session.messages.mockResolvedValue([
      { role: "assistant", parts: [{ type: "text", text: "sync result" }] },
    ])

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    const promise = manager.delegateSync({
      parentSessionId: "ses_parent_sync",
      agent: "builder",
      prompt: "do work",
    })

    await vi.waitFor(() => {
      expect(client.session.create).toHaveBeenCalledWith({
        body: { title: "Delegation: builder", parentID: "ses_parent_sync" },
      })
    })

    const delegation = Array.from((manager as any).delegations.values())[0]
    expect(delegation.childSessionId).toBe("ses_child_sync")
    expect(delegation.status).toBe("running")

    manager.handleSessionIdle("ses_child_sync")

    await expect(promise).resolves.toEqual({
      status: "completed",
      result: "sync result",
      delegationId: delegation.id,
    })
  })

  it("delegateSync rejects on timeout and aborts the child session", async () => {
    vi.useFakeTimers()

    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "ses_child_timeout" })
    client.session.prompt.mockResolvedValue(undefined)
    client.session.abort.mockResolvedValue(undefined)

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    const promise = manager.delegateSync({
      parentSessionId: "ses_parent_timeout",
      agent: "builder",
      prompt: "do work",
      timeoutMs: 25,
    })

    const rejection = expect(promise).rejects.toThrow("[Harness] Delegation timed out after 25ms")

    await vi.advanceTimersByTimeAsync(30)

    await rejection
    expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "ses_child_timeout" } })
  })

  it("handleSessionDeleted marks running delegations as error and clears tracking", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "ses_child_deleted" })
    client.session.prompt.mockResolvedValue(undefined)

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    const promise = manager.delegateSync({
      parentSessionId: "ses_parent_deleted",
      agent: "builder",
      prompt: "do work",
    })

    await vi.waitFor(() => {
      expect(client.session.create).toHaveBeenCalled()
    })

    const delegation = Array.from((manager as any).delegations.values())[0]
    manager.handleSessionDeleted("ses_child_deleted")

    await expect(promise).rejects.toThrow("[Harness] Delegated session deleted before completion")
    expect((manager as any).delegationsBySession.has("ses_child_deleted")).toBe(false)
    expect((manager as any).delegations.get(delegation.id)?.status).toBe("error")
  })

  it("rejects agents outside VALID_AGENTS", async () => {
    const client = createMockClient()
    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    await expect(manager.delegateSync({
      parentSessionId: "ses_parent_invalid",
      agent: "not-real",
      prompt: "do work",
    })).rejects.toThrow("[Harness] Invalid agent: not-real")

    expect(client.session.create).not.toHaveBeenCalled()
  })

  it("tracks multiple concurrent delegations independently", async () => {
    const client = createMockClient()
    client.session.create
      .mockResolvedValueOnce({ id: "ses_child_one" })
      .mockResolvedValueOnce({ id: "ses_child_two" })
    client.session.prompt.mockResolvedValue(undefined)
    client.session.messages
      .mockResolvedValueOnce([{ role: "assistant", parts: [{ type: "text", text: "first" }] }])
      .mockResolvedValueOnce([{ role: "assistant", parts: [{ type: "text", text: "second" }] }])

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    const first = manager.delegateSync({ parentSessionId: "ses_parent_one", agent: "builder", prompt: "one" })
    const second = manager.delegateSync({ parentSessionId: "ses_parent_two", agent: "critic", prompt: "two" })

    await vi.waitFor(() => {
      expect((manager as any).delegations.size).toBe(2)
    })

    manager.handleSessionIdle("ses_child_one")
    manager.handleSessionIdle("ses_child_two")

    await expect(first).resolves.toMatchObject({ status: "completed", result: "first" })
    await expect(second).resolves.toMatchObject({ status: "completed", result: "second" })
  })

  it("delegateAsync persists state before prompting and returns the delegation ID immediately", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "ses_child_async" })
    client.session.prompt.mockImplementation(async () => {
      expect(existsSync(getDelegationsFile(stateDir))).toBe(true)
      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf8")) as Array<{ childSessionId: string }>
      expect(persisted[0]?.childSessionId).toBe("ses_child_async")
    })

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    await expect(manager.delegateAsync({
      parentSessionId: "ses_parent_async",
      agent: "builder",
      prompt: "background work",
    })).resolves.toHaveProperty("delegationId")
  })

  it("recoverPending re-registers running delegations, finalizes idle sessions, and marks missing sessions as error", async () => {
    const now = Date.now()
    const persisted = [
      {
        id: "delegation-running",
        parentSessionId: "ses_parent_running",
        childSessionId: "ses_child_running",
        agent: "builder",
        status: "running",
        createdAt: now,
        timeoutMs: 60000,
      },
      {
        id: "delegation-idle",
        parentSessionId: "ses_parent_idle",
        childSessionId: "ses_child_idle",
        agent: "critic",
        status: "running",
        createdAt: now,
        timeoutMs: 60000,
      },
      {
        id: "delegation-missing",
        parentSessionId: "ses_parent_missing",
        childSessionId: "ses_child_missing",
        agent: "builder",
        status: "running",
        createdAt: now,
        timeoutMs: 60000,
      },
    ]
    writeFileSync(getDelegationsFile(stateDir), JSON.stringify(persisted, null, 2), "utf8")

    const client = createMockClient()
    client.session.status.mockResolvedValue({
      data: {
        ses_child_running: { type: "busy" },
        ses_child_idle: { type: "idle" },
      },
    })
    client.session.messages.mockResolvedValue([
      { role: "assistant", parts: [{ type: "text", text: "recovered result" }] },
    ])
    client.session.prompt.mockResolvedValue(undefined)

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    await manager.recoverPending()

    expect((manager as any).delegationsBySession.get("ses_child_running")).toBe("delegation-running")
    expect((manager as any).delegations.get("delegation-idle")?.status).toBe("completed")
    expect((manager as any).delegations.get("delegation-idle")?.result).toBe("recovered result")
    expect((manager as any).delegations.get("delegation-missing")?.status).toBe("error")
  })

  it("async completion notifies the parent session with noReply true", async () => {
    const client = createMockClient()
    client.session.create.mockResolvedValue({ id: "ses_child_notify" })
    client.session.prompt.mockResolvedValue(undefined)
    client.session.messages.mockResolvedValue([
      { role: "assistant", parts: [{ type: "text", text: "done" }] },
    ])

    const { DelegationManager } = await import("../../src/lib/delegation-manager.js")
    const manager = new DelegationManager(client as never)

    await manager.delegateAsync({
      parentSessionId: "ses_parent_notify",
      agent: "builder",
      prompt: "background work",
    })

    manager.handleSessionIdle("ses_child_notify")
    await vi.waitFor(() => {
      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "ses_parent_notify" },
        body: {
          parts: [{ type: "text", text: "[Delegation Complete] builder: completed" }],
          noReply: true,
        },
      })
    })
  })
})
