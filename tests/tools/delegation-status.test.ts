import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Delegation } from "../../src/shared/types.js"
import { persistDelegations } from "../../src/task-management/continuity/delegation-persistence.js"
import { createDelegationStatusTool } from "../../src/tools/delegation/delegation-status.js"

const mockCtx = {
  sessionID: "ses_parent_session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  const id = overrides.id ?? "ses_child_001"
  return {
    id,
    parentSessionId: "ses_parent_session",
    childSessionId: id,
    agent: "builder",
    status: "running",
    createdAt: Date.now(),
    safetyCeilingMs: 180_000,
    lastMessageCount: 0,
    stablePollCount: 0,
    executionMode: "headless",
    surface: "command-process",
    recoveryGuarantee: "non-resumable-after-restart",
    workingDirectory: process.cwd(),
    queueKey: "agent:builder",
    explicitCancellation: false,
    ...overrides,
  }
}

type ManagerStub = {
  getStatus: ReturnType<typeof vi.fn>
  getAllDelegations: ReturnType<typeof vi.fn>
  canSessionAccessDelegation: ReturnType<typeof vi.fn>
}

function createManagerStub(delegations: Delegation[] = []): ManagerStub {
  const byId = new Map(delegations.map(d => [d.id, d]))
  return {
    getStatus: vi.fn((id: string) => byId.get(id)),
    getAllDelegations: vi.fn(() => delegations),
    canSessionAccessDelegation: vi.fn((callerSessionId: string | undefined, delegation: Delegation | undefined) => (
      Boolean(callerSessionId && delegation && delegation.parentSessionId === callerSessionId)
    )),
  }
}

describe("delegation-status tool", () => {
  let previousStateDir: string | undefined
  let tempProjectRoot: string
  let stateDir: string

  beforeEach(() => {
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    tempProjectRoot = mkdtempSync(join(tmpdir(), "delegation-status-project-"))
    stateDir = join(tempProjectRoot, ".hivemind", "state")
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir

    const parentSessionDir = join(tempProjectRoot, ".hivemind", "session-tracker", "ses_parent_session")
    mkdirSync(parentSessionDir, { recursive: true })
    writeFileSync(join(parentSessionDir, "ses_parent_session.md"), "# Mock Parent Session\n", "utf-8")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(tempProjectRoot, { recursive: true, force: true })
  })

  // ---------------------------------------------------------------------------
  // Single delegation lookup
  // ---------------------------------------------------------------------------

  it("returns delegation status when given valid delegationId", async () => {
    const delegation = makeDelegation({ id: "ses_child_001", status: "running" })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "ses_child_001" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getStatus).toHaveBeenCalledWith("ses_child_001")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("running")
    expect(data.delegationId).toBe("ses_child_001")
  })

  it("returns error when delegationId not found", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "nonexistent" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("not found")
  })

  it("denies missing caller session IDs before lookup", async () => {
    const manager = createManagerStub([makeDelegation()])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "ses_child_001" } as never, { ...mockCtx, sessionID: undefined })
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("[Harness] Missing caller session ID for delegation-status")
    expect(manager.getStatus).not.toHaveBeenCalled()
  })

  it("returns auditable access denied for foreign delegation lookup", async () => {
    const manager = createManagerStub([makeDelegation({ parentSessionId: "ses_foreign_parent" })])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "ses_child_001" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("caller session is not in the recorded owner lineage")
  })

  it("falls back to persisted terminal delegation when memory has been cleaned up", async () => {
    persistDelegations([
      makeDelegation({
        id: "ses_persisted",
        status: "completed",
        result: "persisted result",
        completedAt: Date.now(),
      }),
    ])
    await new Promise((resolve) => setTimeout(resolve, 500))
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "ses_persisted" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    console.log("[DEBUG TEST RESULT]", result)
    expect(result.kind).toBe("success")
    expect(data.delegationId).toBe("ses_persisted")
    expect(data.status).toBe("completed")
    expect(data.result).toBe("persisted result")
  })

  it("returns result text when delegation is completed", async () => {
    const delegation = makeDelegation({
      id: "del-done",
      status: "completed",
      result: "The task was completed successfully.",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-done" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("completed")
    expect(data.result).toBe("The task was completed successfully.")
  })

  it("redacts public result, error, and fallbackReason text fields", async () => {
    const delegation = makeDelegation({
      id: "del-redact-output",
      status: "completed",
      result: "OPENAI_API_KEY=sk-test-123",
      error: "Authorization: Bearer abc.def.ghi",
      fallbackReason: "PASSWORD=hunter2",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-redact-output" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(data.result).toBe("OPENAI_API_KEY=[REDACTED:API_KEY]")
    expect(data.error).toBe("Authorization: Bearer [REDACTED:TOKEN]")
    expect(data.fallbackReason).toBe("PASSWORD=[REDACTED:PASSWORD]")
    expect(data.workingDirectory).toBe(process.cwd())
    expect(raw).not.toContain("sk-test-123")
    expect(raw).not.toContain("abc.def.ghi")
    expect(raw).not.toContain("hunter2")
  })

  it("returns error message when delegation has error status", async () => {
    const delegation = makeDelegation({
      id: "del-err",
      status: "error",
      error: "Child session crashed",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-err" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("error")
    expect(data.error).toBe("Child session crashed")
  })

  it("uses terminal detail in the single-delegation message when a specific terminal kind is available", async () => {
    const delegation = makeDelegation({
      id: "del-signal",
      status: "error",
      terminalKind: "interrupted-by-signal",
      terminationSignal: "SIGTERM",
      error: "[Harness] Command interrupted by signal SIGTERM",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-signal" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(result.message).toContain("interrupted-by-signal")
    expect(data.terminalKind).toBe("interrupted-by-signal")
    expect(data.terminationSignal).toBe("SIGTERM")
    expect(data.explicitCancellation).toBe(false)
  })

  it("returns timeout error for timed-out delegations", async () => {
    const delegation = makeDelegation({
      id: "del-timeout",
      status: "timeout",
      error: "[Harness] Delegation safety ceiling reached",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-timeout" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("timeout")
    expect(data.error).toContain("safety ceiling")
  })

  it("includes createdAt and completedAt timestamps in response", async () => {
    const now = Date.now()
    const delegation = makeDelegation({
      id: "del-ts",
      status: "completed",
      result: "done",
      createdAt: now - 5000,
      completedAt: now,
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-ts" } as never, mockCtx)
    const result = parseResult(raw)

    const data = result.data as Record<string, unknown>
    expect(data.createdAt).toBe(now - 5000)
    expect(data.completedAt).toBe(now)
  })

  it("includes execution metadata fields in single-delegation responses", async () => {
    const delegation = makeDelegation({
      id: "del-runtime",
      executionMode: "pty",
      surface: "command-process",
      recoveryGuarantee: "best-effort",
      workingDirectory: "/tmp/runtime-child",
      ptySessionId: "pty-123",
      fallbackReason: "pty unsupported",
      queueKey: "provider:anthropic:model:claude-3-5-sonnet",
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-runtime" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(data.executionMode).toBe("pty")
    expect(data.surface).toBe("command-process")
    expect(data.recoveryGuarantee).toBe("best-effort")
    expect(data.workingDirectory).toBe("/tmp/runtime-child")
    expect(data.ptySessionId).toBe("pty-123")
    expect(data.fallbackReason).toBe("pty unsupported")
    expect(data.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
    expect(data.explicitCancellation).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // List all delegations
  // ---------------------------------------------------------------------------

  it("lists all delegations when no delegationId provided", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
      makeDelegation({ id: "del-002", status: "dispatched" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getAllDelegations).toHaveBeenCalled()
    const data = result.data as Delegation[]
    expect(data).toHaveLength(2)
  })

  it("lists only caller-visible delegations", async () => {
    const delegations = [
      makeDelegation({ id: "ses_owned", parentSessionId: "ses_parent_session" }),
      makeDelegation({ id: "ses_foreign", parentSessionId: "ses_foreign_session" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)

    expect((result.data as Array<{ delegationId?: string }>).map((entry) => entry.delegationId)).toEqual(["ses_owned"])
  })

  it("handles empty delegation list", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(result.message).toContain("0 delegation")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(0)
  })

  it("redacts result/error/fallbackReason for every delegation in the list-all branch", async () => {
    // Regression for Devin Review finding on PR #73: the list-all branch previously
    // returned raw Delegation[] without applying renderDelegation()'s redaction,
    // leaking secrets in result / error / fallbackReason for any delegation the
    // caller could see.
    const delegations = [
      makeDelegation({
        id: "ses_leak_1",
        status: "completed",
        result: "OPENAI_API_KEY=sk-leak-list-1",
        error: "Authorization: Bearer leak.list.1",
        fallbackReason: "PASSWORD=leakpw1",
        completedAt: Date.now(),
      }),
      makeDelegation({
        id: "ses_leak_2",
        status: "completed",
        result: "GITHUB_TOKEN=ghp-leak-list-2",
        completedAt: Date.now(),
      }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Array<Record<string, unknown>>

    expect(data).toHaveLength(2)
    expect(data[0]?.result).toBe("OPENAI_API_KEY=[REDACTED:API_KEY]")
    expect(data[0]?.error).toBe("Authorization: Bearer [REDACTED:TOKEN]")
    expect(data[0]?.fallbackReason).toBe("PASSWORD=[REDACTED:PASSWORD]")
    expect(data[1]?.result).toBe("GITHUB_TOKEN=[REDACTED:TOKEN]")
    // Raw response must contain none of the secret literals.
    expect(raw).not.toContain("sk-leak-list-1")
    expect(raw).not.toContain("leak.list.1")
    expect(raw).not.toContain("leakpw1")
    expect(raw).not.toContain("ghp-leak-list-2")
    // delegationId is the public field, id should not appear (renderDelegation rename)
    expect(data[0]?.delegationId).toBe("ses_leak_1")
    expect(data[1]?.delegationId).toBe("ses_leak_2")
  })

  it("filters by status when status parameter provided", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
      makeDelegation({ id: "del-002", status: "completed", result: "done" }),
      makeDelegation({ id: "del-003", status: "running" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: "running" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(2)
    expect(data.every(d => d.status === "running")).toBe(true)
  })

  it("merges active memory records with persisted terminal records for list filters", async () => {
    const active = makeDelegation({ id: "ses_active", status: "running" })
    const persistedTerminal = makeDelegation({
      id: "ses_persisted_terminal",
      status: "completed",
      result: "done from disk",
      completedAt: Date.now(),
    })
    persistDelegations([active, persistedTerminal])
    await new Promise((resolve) => setTimeout(resolve, 500))
    const manager = createManagerStub([active])
    const tool = createDelegationStatusTool(manager as never)

    const allRaw = await tool.execute({} as never, mockCtx)
    const allResult = parseResult(allRaw)

    expect((allResult.data as Array<{ delegationId?: string }>).map((d) => d.delegationId)).toEqual(
      expect.arrayContaining(["ses_active", "ses_persisted_terminal"]),
    )

    const filteredRaw = await tool.execute({ status: "completed" } as never, mockCtx)
    const filteredResult = parseResult(filteredRaw)
    const filtered = filteredResult.data as Array<{ delegationId?: string }>
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.delegationId).toBe("ses_persisted_terminal")
  })

  it("returns empty list when filter matches no delegations", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: "completed" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(0)
  })

  it("includes execution metadata fields in list responses", async () => {
    const delegations = [
      makeDelegation({
        id: "del-list-runtime",
        executionMode: "headless",
        surface: "command-process",
        recoveryGuarantee: "non-resumable-after-restart",
        workingDirectory: "/tmp/list-child",
        fallbackReason: "pty unavailable",
        queueKey: "provider:anthropic:model:gpt-5-mini",
        terminalKind: "non-resumable-after-restart",
      }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Array<Record<string, unknown>>

    expect(data[0]?.executionMode).toBe("headless")
    expect(data[0]?.surface).toBe("command-process")
    expect(data[0]?.recoveryGuarantee).toBe("non-resumable-after-restart")
    expect(data[0]?.workingDirectory).toBe("/tmp/list-child")
    expect(data[0]?.fallbackReason).toBe("pty unavailable")
    expect(data[0]?.queueKey).toBe("provider:anthropic:model:gpt-5-mini")
    expect(data[0]?.terminalKind).toBe("non-resumable-after-restart")
    expect(data[0]?.terminationSignal).toBeUndefined()
    expect(data[0]?.explicitCancellation).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Schema validation
  // ---------------------------------------------------------------------------

  it("validates delegationId format — rejects empty string", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const result = parseResult(await tool.execute({ delegationId: "" } as never, mockCtx))

    expect(result.kind).toBe("error")
  })

  it("accepts both delegationId and status filter together", async () => {
    // When both are provided, delegationId takes precedence (single lookup)
    const delegation = makeDelegation({ id: "del-both", status: "running" })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-both", status: "completed" } as never, mockCtx)
    const result = parseResult(raw)

    // delegationId lookup takes priority — returns the delegation regardless of status filter
    expect(result.kind).toBe("success")
    expect(manager.getStatus).toHaveBeenCalledWith("del-both")
  })
})

describe("contract-based tests", () => {
  let previousStateDir: string | undefined
  let tempProjectRoot: string
  let stateDir: string

  beforeEach(() => {
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    tempProjectRoot = mkdtempSync(join(tmpdir(), "delegation-status-contract-"))
    stateDir = join(tempProjectRoot, ".hivemind", "state")
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterEach(() => {
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
    rmSync(tempProjectRoot, { recursive: true, force: true })
  })

  it("returns delegation status for known ID", async () => {
    const delegation = makeDelegation({ id: "del_known", status: "running", agent: "builder" })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del_known" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getStatus).toHaveBeenCalledWith("del_known")
  })

  it("returns error for unknown delegation ID", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "unknown-id" } as never, mockCtx)
    const result = parseResult(raw)

    // Should return an error or not-found indication
    expect(result.kind).toBe("error")
  })

  it("lists all delegations when no delegationId provided", async () => {
    const delegations = [
      makeDelegation({ id: "del_1", agent: "builder", status: "completed" }),
      makeDelegation({ id: "del_2", agent: "researcher", status: "running" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: undefined } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getAllDelegations).toHaveBeenCalled()
  })

  it("filters delegations by status", async () => {
    const delegations = [
      makeDelegation({ id: "del_a", status: "running" }),
      makeDelegation({ id: "del_b", status: "completed" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: "running" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
  })
})
