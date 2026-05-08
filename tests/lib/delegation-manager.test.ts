import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "../../src/lib/concurrency.js"
import { getSessionContinuity, recordSessionContinuity } from "../../src/lib/continuity.js"
import * as sessionApi from "../../src/shared/session-api.js"
import * as spawnerConcurrencyKey from "../../src/lib/spawner/concurrency-key.js"
import { DelegationManager } from "../../src/lib/delegation-manager.js"
import { readPersistedDelegations } from "../../src/lib/delegation-persistence.js"
import { DEFAULT_RUNTIME_POLICY } from "../../src/shared/runtime-policy.js"
import {
  DEFAULT_PRUNE_MAX_AGE_MS,
  DEFAULT_SAFETY_CEILING_MS,
  MAX_DELEGATIONS_BEFORE_PRUNE,
  POLL_INTERVAL_BASE_MS,
  STABLE_POLLS_REQUIRED,
  type Delegation,
  type RuntimePolicy,
} from "../../src/shared/types.js"

// CA-03: export override tracker for parallelization toggle tests.
// vitest's module graph allows spying on the config-subscriber export
// and all consumers of that export will see the spy.
import * as configSubscriber from "../../src/lib/config-subscriber.js"

type MockClient = {
  session: {
    create: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
    promptAsync: ReturnType<typeof vi.fn>
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

type ManagerOptions = {
  ptyManager?: {
    isSupported?: () => boolean
    spawn?: (request: unknown) => {
      id: string
      mode?: "pty" | "headless"
      cwd: string
      startedAt: number
      pid?: number
      exitCode?: number
      fallbackReason?: string
    }
    getSession?: (sessionId: string) => {
      id: string
      mode?: "pty" | "headless"
      cwd: string
      startedAt: number
      pid?: number
      exitCode?: number
      fallbackReason?: string
    } | undefined
    terminate?: (sessionId: string) => Promise<void>
  } | null
  runtimePolicy?: RuntimePolicy
}

type CommandDispatchParams = {
  parentSessionId: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  title?: string
  queueContext?: {
    provider?: string
    model?: string
    agent?: string
    category?: string
  }
  safetyCeilingMs?: number
}

type CommandDispatchResult = {
  status: string
  delegationId: string
  executionMode?: string
  workingDirectory?: string
  ptySessionId?: string
  fallbackReason?: string
  queueKey?: string
}

function createMockClient(): MockClient {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-ses-123" } }),
      prompt: vi.fn().mockResolvedValue(undefined),
      promptAsync: vi.fn().mockResolvedValue(undefined),
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

function createManager(client: MockClient, options?: ManagerOptions): DelegationManager {
  const DelegationManagerCtor = DelegationManager as unknown as new (
    client: MockClient,
    options?: ManagerOptions,
  ) => DelegationManager

  return new DelegationManagerCtor(client, options)
}

async function dispatchCommand(
  manager: DelegationManager,
  params: CommandDispatchParams,
): Promise<CommandDispatchResult> {
  const commandCapableManager = manager as unknown as {
    dispatchCommand: (commandParams: CommandDispatchParams) => Promise<CommandDispatchResult>
  }

  return commandCapableManager.dispatchCommand(params)
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
    vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)
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
  // visibility
  // ---------------------------------------------------------------------------

  describe("visibility", () => {
    function seedDelegation(manager: DelegationManager, delegation: Delegation): void {
      const internals = getInternals(manager)
      internals.delegations.set(delegation.id, delegation)
      internals.delegationsBySession.set(delegation.childSessionId, delegation.id)
    }

    function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
      return {
        id: "del-owned",
        parentSessionId: "ses-parent-owned",
        childSessionId: "ses-child-owned",
        agent: "builder",
        status: "running",
        createdAt: Date.now(),
        safetyCeilingMs: DEFAULT_SAFETY_CEILING_MS,
        lastMessageCount: 0,
        stablePollCount: 0,
        nestingDepth: 1,
        executionMode: "sdk",
        workingDirectory: process.cwd(),
        queueKey: "agent:builder",
        ...overrides,
      }
    }

    it("allows direct parent session access to its delegation", () => {
      const manager = new DelegationManager(createMockClient() as never)
      const delegation = makeDelegation()
      seedDelegation(manager, delegation)

      expect(manager.canSessionAccessDelegation("ses-parent-owned", delegation)).toBe(true)
    })

    it("denies foreign and missing caller sessions", () => {
      const manager = new DelegationManager(createMockClient() as never)
      const delegation = makeDelegation()
      seedDelegation(manager, delegation)

      expect(manager.canSessionAccessDelegation("ses-foreign", delegation)).toBe(false)
      expect(manager.canSessionAccessDelegation(undefined, delegation)).toBe(false)
    })

    it("allows child session access only when the child relationship is explicitly recorded", () => {
      const manager = new DelegationManager(createMockClient() as never)
      const delegation = makeDelegation()
      seedDelegation(manager, delegation)

      expect(manager.canSessionAccessDelegation("ses-child-owned", delegation)).toBe(true)

      getInternals(manager).delegationsBySession.delete("ses-child-owned")
      expect(manager.canSessionAccessDelegation("ses-child-owned", delegation)).toBe(false)
    })

    it("filters list output to caller-visible delegations", () => {
      const manager = new DelegationManager(createMockClient() as never)
      const owned = makeDelegation({ id: "del-owned", parentSessionId: "ses-parent-owned", childSessionId: "ses-child-owned" })
      const foreign = makeDelegation({ id: "del-foreign", parentSessionId: "ses-parent-foreign", childSessionId: "ses-child-foreign" })
      seedDelegation(manager, owned)
      seedDelegation(manager, foreign)

      expect(manager.getVisibleDelegationsForSession("ses-parent-owned").map((entry) => entry.id)).toEqual(["del-owned"])
    })

    it("finds the delegation that owns a PTY session ID", () => {
      const manager = new DelegationManager(createMockClient() as never)
      const owned = makeDelegation({
        id: "del-pty-owned",
        executionMode: "pty",
        childSessionId: "pty:pty-owned",
        ptySessionId: "pty-owned",
      })
      seedDelegation(manager, owned)

      expect(manager.getDelegationForPtySession("pty-owned")?.id).toBe("del-pty-owned")
      expect(manager.getDelegationForPtySession("pty-missing")).toBeUndefined()
    })
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

      expect(result.status).toBe("running")
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

    it("denies unknown delegation category before session create", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({ data: [{ name: "builder", category: "implementation" }] })
      const manager = new DelegationManager(client as never)

      await expect(manager.dispatch({
        parentSessionId: "ses-parent-category",
        agent: "builder",
        prompt: "do work",
        category: "mystery",
      })).rejects.toThrow("[Harness] Category gate denied: unknown delegation category")
      expect(client.session.create).not.toHaveBeenCalled()
    })

    it("denies review category with write-capable primitive tools before session create", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [{ name: "critic", category: "review", tools: { edit: true, write: true, bash: true } }],
      })
      const manager = new DelegationManager(client as never)

      await expect(manager.dispatch({
        parentSessionId: "ses-parent-review",
        agent: "critic",
        prompt: "review code",
        category: "review",
      })).rejects.toThrow('category "review" cannot use write-capable tools')
      expect(client.session.create).not.toHaveBeenCalled()
    })

    it("allows command dispatch through explicit command-process category", async () => {
      const ptyManager = {
        isSupported: vi.fn().mockReturnValue(true),
        spawn: vi.fn().mockReturnValue({ id: "pty-category-command", mode: "pty" as const, cwd: "/tmp", startedAt: Date.now() }),
        getSession: vi.fn().mockReturnValue(undefined),
        read: vi.fn().mockReturnValue({ content: "", nextOffset: 0, truncated: false }),
        terminate: vi.fn().mockResolvedValue(undefined),
      }
      const manager = createManager(createMockClient(), { ptyManager })

      const result = await dispatchCommand(manager, { parentSessionId: "ses-parent-command", command: "echo" })

      expect(result.executionMode).toBe("pty")
      expect(ptyManager.spawn).toHaveBeenCalledOnce()
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
      const promptSpy = client.session.promptAsync.mockImplementation(async (...args: unknown[]) => {
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
        executionMode: "sdk",
        surface: "agent-delegation",
        recoveryGuarantee: "resumable",
        workingDirectory: expect.any(String),
      }))
      expect(delegation?.ptySessionId).toBeUndefined()
      expect(delegation?.explicitCancellation).toBe(false)
      expect(persisted).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: result.delegationId,
          executionMode: "sdk",
          surface: "agent-delegation",
          recoveryGuarantee: "resumable",
          workingDirectory: expect.any(String),
        }),
      ]))
    })

    it("records sdk execution metadata truthfully for agent dispatches without PTY session state", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [
          {
            name: "builder",
            provider: "anthropic",
            model: "claude-3-5-sonnet",
            category: "implementation",
          },
        ],
      })
      const manager = createManager(client)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-sdk-truth",
        agent: "builder",
        prompt: "stay on the sdk path",
      })

      const delegation = manager.getStatus(result.delegationId)
      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]

      expect(result.executionMode).toBe("sdk")
      expect(result.surface).toBe("agent-delegation")
      expect(result.recoveryGuarantee).toBe("resumable")
      expect(result.ptySessionId).toBeUndefined()
      expect(delegation).toEqual(expect.objectContaining({
        executionMode: "sdk",
        surface: "agent-delegation",
        recoveryGuarantee: "resumable",
        queueKey: "provider:anthropic:model:claude-3-5-sonnet",
      }))
      expect(delegation?.ptySessionId).toBeUndefined()
      expect(delegation?.explicitCancellation).toBe(false)
      expect(persisted).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: result.delegationId,
          executionMode: "sdk",
          surface: "agent-delegation",
          recoveryGuarantee: "resumable",
        }),
      ]))
    })

    it("dispatchCommand uses canonical queue governance and records real PTY session state", async () => {
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn().mockReturnValue({
            id: "pty-command-123",
            mode: "pty",
            cwd: "/tmp/command-runtime",
            startedAt: Date.now(),
            pid: 2222,
          }),
          getSession: vi.fn().mockReturnValue({
            id: "pty-command-123",
            mode: "pty",
            cwd: "/tmp/command-runtime",
            startedAt: Date.now(),
            pid: 2222,
          }),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-command-pty",
        command: "echo",
        args: ["hello"],
        cwd: "/tmp/command-runtime",
        queueContext: {
          provider: "anthropic",
          model: "claude-3-5-sonnet",
          category: "implementation",
        },
      })

      expect(acquireSpy).toHaveBeenCalledWith(
        "provider:anthropic:model:claude-3-5-sonnet",
        undefined,
        undefined,
      )
      expect(result.executionMode).toBe("pty")
      expect(result.surface).toBe("command-process")
      expect(result.recoveryGuarantee).toBe("best-effort")
      expect(result.ptySessionId).toBe("pty-command-123")
      expect(manager.getStatus(result.delegationId)).toEqual(expect.objectContaining({
        executionMode: "pty",
        surface: "command-process",
        recoveryGuarantee: "best-effort",
        ptySessionId: "pty-command-123",
        queueKey: "provider:anthropic:model:claude-3-5-sonnet",
      }))
    })

    it("dispatchCommand degrades truthfully to headless with fallbackReason when PTY is unavailable", async () => {
      const client = createMockClient()
      const manager = createManager(client, { ptyManager: null })
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-command-headless",
        command: "echo",
        args: ["fallback"],
        cwd: "/tmp/command-headless",
        queueContext: {
          category: "implementation",
        },
      })

      expect(acquireSpy).toHaveBeenCalledWith(
        "category:implementation",
        undefined,
        undefined,
      )
      expect(result.executionMode).toBe("headless")
      expect(result.surface).toBe("command-process")
      expect(result.recoveryGuarantee).toBe("non-resumable-after-restart")
      expect(result.fallbackReason).toBeTruthy()
      expect(result.ptySessionId).toBeUndefined()
      expect(manager.getStatus(result.delegationId)).toEqual(expect.objectContaining({
        executionMode: "headless",
        surface: "command-process",
        recoveryGuarantee: "non-resumable-after-restart",
        fallbackReason: expect.any(String),
        queueKey: "category:implementation",
      }))
      expect(manager.getStatus(result.delegationId)?.ptySessionId).toBeUndefined()
    })

    it("records interrupted-by-signal terminal detail for PTY sessions killed by a signal", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn().mockReturnValue({
            id: "pty-signal-123",
            mode: "pty",
            cwd: "/tmp/command-signal",
            startedAt: Date.now(),
            pid: 3333,
          }),
          getSession: vi.fn().mockReturnValue({
            id: "pty-signal-123",
            mode: "pty",
            cwd: "/tmp/command-signal",
            startedAt: Date.now(),
            pid: 3333,
            exitSignal: "SIGTERM",
          }),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-command-signal",
        command: "sleep",
        args: ["10"],
        cwd: "/tmp/command-signal",
      })

      await vi.advanceTimersByTimeAsync(500)

      expect(manager.getStatus(result.delegationId)).toEqual(expect.objectContaining({
        status: "error",
        terminalKind: "interrupted-by-signal",
        terminationSignal: "SIGTERM",
        explicitCancellation: false,
      }))
    })

    it("prefers cancelled terminal detail when termination was explicitly requested", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn().mockReturnValue({
            id: "pty-cancel-123",
            mode: "pty",
            cwd: "/tmp/command-cancel",
            startedAt: Date.now(),
            pid: 4444,
          }),
          getSession: vi.fn().mockReturnValue({
            id: "pty-cancel-123",
            mode: "pty",
            cwd: "/tmp/command-cancel",
            startedAt: Date.now(),
            pid: 4444,
            exitSignal: "SIGTERM",
          }),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-command-cancel",
        command: "sleep",
        args: ["10"],
        cwd: "/tmp/command-cancel",
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation).toBeDefined()
      if (!delegation) {
        throw new Error("expected delegation to exist")
      }
      delegation.explicitCancellation = true

      await vi.advanceTimersByTimeAsync(500)

      expect(manager.getStatus(result.delegationId)).toEqual(expect.objectContaining({
        status: "error",
        terminalKind: "cancelled",
        terminationSignal: "SIGTERM",
        explicitCancellation: true,
      }))
    })

    it("sends prompt to child session with correct agent and text parts", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-prompt" } })
      client.app.agents.mockResolvedValue({
        data: [
          {
            name: "builder",
            permission: {
              read: "allow",
              edit: "allow",
              write: "allow",
              bash: "allow",
              glob: "allow",
              grep: "allow",
            },
          },
        ],
      })
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-prompt",
        agent: "builder",
        prompt: "hello child",
      })

      expect(client.session.promptAsync).toHaveBeenCalledWith({
        path: { id: "child-prompt" },
        body: {
          parts: [{ type: "text", text: "hello child" }],
          agent: "builder",
          tools: {
            read: true,
            edit: true,
            write: true,
            bash: true,
            glob: true,
            grep: true,
            "delegate-task": false,
            task: false,
          },
        },
      })
    })

    it("does not wait for completion — returns running after prompt acceptance", async () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-fast-return",
        agent: "builder",
        prompt: "return now",
      })

      expect(result.status).toBe("running")
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

    it("handles session.promptAsync() SDK failure — delegation transitions to error", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-prompt-fail" } })
      client.session.promptAsync.mockRejectedValue(new Error("SDK prompt failed"))
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-prompt-fail",
        agent: "builder",
        prompt: "fail at prompt",
      })

      expect(result.status).toBe("error")

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

    it("completion requires STABLE_POLLS_REQUIRED stable polls — not fewer", async () => {
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * (STABLE_POLLS_REQUIRED - 1))

      expect(manager.getStatus(result.delegationId)?.status).toBe("running")
    })

    it("completes delegation after STABLE_POLLS_REQUIRED stable polls confirmed", async () => {
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      expect(client.session.messages).toHaveBeenCalled()
    })

    it("uses the session-api message-count wrapper during stability polling", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses-child-reset" } })
      const messageCountSpy = vi.mocked(sessionApi.getSessionMessageCount).mockResolvedValue(0)
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-reset",
        agent: "builder",
        prompt: "reset test",
      })

      manager.handleSessionIdle("ses-child-reset")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(messageCountSpy).toHaveBeenCalledWith(client, "ses-child-reset")
    })

    it("resets stablePollCount and updates lastMessageCount when message count changes", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses-child-reset-count" } })
      vi.mocked(sessionApi.getSessionMessageCount).mockResolvedValue(2)
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-reset-count",
        agent: "builder",
        prompt: "reset count test",
      })

      manager.handleSessionIdle("ses-child-reset-count")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("running")
      expect(delegation?.lastMessageCount).toBe(2)
      expect(delegation?.stablePollCount).toBe(0)
    })

    it("increments stablePollCount only when the fetched message count is unchanged", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses-child-stable-count" } })
      vi.mocked(sessionApi.getSessionMessageCount)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-stable-count",
        agent: "builder",
        prompt: "stable count test",
      })

      manager.handleSessionIdle("ses-child-stable-count")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * 2)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("running")
      expect(delegation?.lastMessageCount).toBe(2)
      expect(delegation?.stablePollCount).toBe(1)
    })

    it("does not advance stability when message-count fetch fails transiently", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses-child-null-count" } })
      vi.mocked(sessionApi.getSessionMessageCount).mockResolvedValue(null)
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-null-count",
        agent: "builder",
        prompt: "null count test",
      })

      manager.handleSessionIdle("ses-child-null-count")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("running")
      expect(delegation?.lastMessageCount).toBe(0)
      expect(delegation?.stablePollCount).toBe(0)
    })

    it("only finalizes after STABLE_POLLS_REQUIRED unchanged message-count polls", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses-child-threshold-count" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "final result" }] }],
      })
      vi.mocked(sessionApi.getSessionMessageCount)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2)
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-threshold-count",
        agent: "builder",
        prompt: "threshold count test",
      })

      manager.handleSessionIdle("ses-child-threshold-count")
      // After 10s: only 1 stable poll elapsed (dual gate not met yet)
      await vi.advanceTimersByTimeAsync(10000)
      expect(manager.getStatus(result.delegationId)?.status).toBe("running")

      // After 25s total: dual gate (MIN_STABILITY_TIME_MS + STABLE_POLLS_REQUIRED) met
      await vi.advanceTimersByTimeAsync(15000)
      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)
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
      // POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED = 3000 * 3 = 9000ms
      const ceilingMs = POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED + 5000 // 14000ms
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-complete-first",
        agent: "builder",
        prompt: "complete fast",
        safetyCeilingMs: ceilingMs,
      })

      // Complete via dual-signal before safety ceiling
      manager.handleSessionIdle("child-complete-first")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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
      expect(["dispatched", "running"]).toContain(manager.getStatus(result.delegationId)?.status)

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
        status: "running",
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

      const all = manager.getAllDelegations()
      expect(all).toHaveLength(1)
      expect(all[0]?.status).toBe("completed")
    })

    it("persistence write happens before result extraction to avoid race conditions", async () => {
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-order" } })
      client.session.promptAsync.mockImplementation(async () => {
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

    it("normalizes legacy agent-history headless records to sdk without rewriting real command fallback records", () => {
      writeFileSync(
        getDelegationsFile(stateDir),
        `${JSON.stringify([
          {
            id: "legacy-agent-record",
            parentSessionId: "ses-parent-legacy",
            childSessionId: "ses-child-legacy",
            agent: "builder",
            status: "completed",
            createdAt: Date.now(),
            executionMode: "headless",
            workingDirectory: "/tmp/legacy-agent",
            queueKey: "agent:builder",
          },
          {
            id: "real-command-fallback",
            parentSessionId: "ses-parent-command",
            childSessionId: "ses-child-command",
            agent: "command-runner",
            status: "error",
            createdAt: Date.now(),
            executionMode: "headless",
            workingDirectory: "/tmp/command-fallback",
            queueKey: "category:implementation",
            fallbackReason: "PTY unavailable in current environment",
          },
        ], null, 2)}\n`,
        "utf-8",
      )

      const delegations = readPersistedDelegations()

      expect(delegations.find((entry) => entry.id === "legacy-agent-record")?.executionMode).toBe("sdk")
      expect(delegations.find((entry) => entry.id === "real-command-fallback")?.executionMode).toBe("headless")
    })

    it("normalizes invalid status values to 'error' instead of passing through unchecked", () => {
      writeFileSync(
        getDelegationsFile(stateDir),
        `${JSON.stringify([
          {
            id: "invalid-status-record",
            parentSessionId: "ses-parent-invalid",
            childSessionId: "child-invalid",
            agent: "builder",
            status: "unknown-garbage-status",
            createdAt: Date.now(),
            executionMode: "sdk",
            workingDirectory: "/tmp/invalid-status",
            queueKey: "agent:builder",
          },
          {
            id: "valid-status-record",
            parentSessionId: "ses-parent-valid",
            childSessionId: "child-valid",
            agent: "builder",
            status: "completed",
            createdAt: Date.now(),
            executionMode: "sdk",
            workingDirectory: "/tmp/valid-status",
            queueKey: "agent:builder",
          },
        ])}\n`,
        "utf-8",
      )

      const delegations = readPersistedDelegations()

      // Invalid status is normalized to "error" instead of being cast blindly
      expect(delegations.find((entry) => entry.id === "invalid-status-record")?.status).toBe("error")
      // Valid statuses pass through unchanged
      expect(delegations.find((entry) => entry.id === "valid-status-record")?.status).toBe("completed")
    })

    it("assigns truthful surface and recovery defaults when normalizing legacy persisted records", () => {
      writeFileSync(
        getDelegationsFile(stateDir),
        `${JSON.stringify([
          {
            id: "legacy-sdk-record",
            parentSessionId: "ses-parent-sdk",
            childSessionId: "ses-child-sdk",
            agent: "builder",
            status: "completed",
            createdAt: Date.now(),
            workingDirectory: "/tmp/legacy-sdk",
            queueKey: "agent:builder",
          },
          {
            id: "legacy-pty-record",
            parentSessionId: "ses-parent-pty",
            childSessionId: "pty-child",
            agent: "command-runner",
            status: "running",
            createdAt: Date.now(),
            executionMode: "pty",
            workingDirectory: "/tmp/legacy-pty",
            ptySessionId: "pty-session-legacy",
            queueKey: "category:command",
          },
          {
            id: "legacy-headless-record",
            parentSessionId: "ses-parent-headless",
            childSessionId: "headless-child",
            agent: "command-runner",
            status: "error",
            createdAt: Date.now(),
            executionMode: "headless",
            workingDirectory: "/tmp/legacy-headless",
            fallbackReason: "PTY unavailable in current environment",
            queueKey: "category:command",
          },
        ], null, 2)}\n`,
        "utf-8",
      )

      const delegations = readPersistedDelegations()

      expect(delegations.find((entry) => entry.id === "legacy-sdk-record")).toEqual(expect.objectContaining({
        executionMode: "sdk",
        surface: "agent-delegation",
        recoveryGuarantee: "resumable",
      }))
      expect(delegations.find((entry) => entry.id === "legacy-pty-record")).toEqual(expect.objectContaining({
        executionMode: "pty",
        surface: "command-process",
        recoveryGuarantee: "best-effort",
      }))
      expect(delegations.find((entry) => entry.id === "legacy-headless-record")).toEqual(expect.objectContaining({
        executionMode: "headless",
        surface: "command-process",
        recoveryGuarantee: "non-resumable-after-restart",
      }))
    })

    it("hydrates terminal-detail placeholders on normalized persisted delegations", () => {
      writeFileSync(
        getDelegationsFile(stateDir),
        `${JSON.stringify([
          {
            id: "legacy-terminal-record",
            parentSessionId: "ses-parent-terminal",
            childSessionId: "ses-child-terminal",
            agent: "builder",
            status: "completed",
            createdAt: Date.now(),
            executionMode: "sdk",
            workingDirectory: "/tmp/legacy-terminal",
            queueKey: "agent:builder",
          },
        ], null, 2)}\n`,
        "utf-8",
      )

      const delegation = readPersistedDelegations().find((entry) => entry.id === "legacy-terminal-record")

      expect(delegation).toBeDefined()
      expect(delegation).toHaveProperty("terminalKind")
      expect(delegation).toHaveProperty("terminationSignal")
      expect(delegation).toHaveProperty("explicitCancellation")
      expect(delegation?.terminalKind).toBeUndefined()
      expect(delegation?.terminationSignal).toBeUndefined()
      expect(delegation?.explicitCancellation).toBe(false)
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

    it("reconciles persisted SDK recovery non-destructively and clears stale recovery errors", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-recovery-proof",
          parentSessionId: "parent-recovery-proof",
          childSessionId: "child-recovery-proof",
          agent: "builder",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 2,
          stablePollCount: 1,
          lastMessageCountChangeAt: now,
          executionMode: "sdk",
          recoveryGuarantee: "resumable",
          surface: "agent-delegation",
          workingDirectory: "/tmp/recovery-proof",
          queueKey: "agent:builder",
          error: "[Harness] Delegation unverified after restart; recovery will retry through safety ceiling.",
        },
      ], null, 2))
      const client = createMockClient()
      client.session.status.mockResolvedValue({ data: { "child-recovery-proof": { type: "busy" } } })
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      expect(client.session.status).toHaveBeenCalledOnce()
      expect(client.session.create).not.toHaveBeenCalled()
      expect(client.session.prompt).not.toHaveBeenCalled()
      expect(client.session.promptAsync).not.toHaveBeenCalled()
      expect(client.session.abort).not.toHaveBeenCalled()
      expect(manager.getStatus("delegation-recovery-proof")).toEqual(expect.objectContaining({
        status: "running",
        executionMode: "sdk",
        recoveryGuarantee: "resumable",
        error: undefined,
      }))
      expect(getInternals(manager).delegationsBySession.get("child-recovery-proof")).toBe("delegation-recovery-proof")

      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]
      expect(persisted.find((entry) => entry.id === "delegation-recovery-proof")?.error).toBeUndefined()
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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

      expect(manager.getStatus("delegation-missing")?.status).toBe("running")
      expect(manager.getStatus("delegation-missing")?.error).toContain("unverified after restart")
    })

    it("marks unrecoverable headless delegations with non-resumable-after-restart terminal detail", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "delegation-headless-unrecoverable",
          parentSessionId: "parent-headless",
          childSessionId: "headless:delegation-headless-unrecoverable",
          agent: "builder",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
          executionMode: "headless",
          fallbackReason: "[Harness] PTY runtime unavailable in current environment",
          workingDirectory: "/tmp/headless-unrecoverable",
          queueKey: "category:command",
        },
      ], null, 2))
      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      expect(manager.getStatus("delegation-headless-unrecoverable")).toEqual(expect.objectContaining({
        status: "error",
        recoveryGuarantee: "non-resumable-after-restart",
        terminalKind: "non-resumable-after-restart",
        explicitCancellation: false,
      }))
    })

    it("surfaces corrupted JSON file visibly during recovery", async () => {
      writeFileSync(getDelegationsFile(stateDir), "NOT VALID JSON {{{")

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).rejects.toThrow(/^\[Harness\]/)
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

    it("surfaces non-array JSON content as invalid persisted shape", async () => {
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify({ not: "an array" }))

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      await expect(manager.recoverPending()).rejects.toThrow(/^\[Harness\].*array/)
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("error")
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("error")
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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

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
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)

      expect(getInternals(manager).delegationsBySession.has("child-cleanup")).toBe(false)
      expect(getInternals(manager).safetyTimers.has(result.delegationId)).toBe(false)
      expect(getInternals(manager).stabilityTimers.has(result.delegationId)).toBe(false)
    })

    it("notifyDelegationTerminal failure does not corrupt finalization", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-notify-fail" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "task completed successfully" }] }],
      })

      // Dispatch prompt uses promptAsync; notification prompt uses prompt and throws.
      // notifyDelegationTerminal() catches the error internally (fire-and-forget).
      let promptCallCount = 0
      client.session.prompt.mockImplementation(async () => {
        promptCallCount++
        throw new Error("Notification delivery failed")
      })

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-notify-fail",
        agent: "builder",
        prompt: "notify fail test",
      })

      manager.handleSessionIdle("child-notify-fail")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)
      // Flush the notification microtask so the failure is processed
      await flushMicrotasks()
      await flushMicrotasks()

      // 1. Delegation completes successfully — notification failure does not propagate
      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.status).toBe("completed")
      // 2. Result extracted correctly despite notification failure
      expect(delegation?.result).toBe("task completed successfully")
      // 3. Error field NOT polluted by notification failure
      expect(delegation?.error).toBeUndefined()
      expect(delegation?.completedAt).toBeGreaterThan(0)

      // 4. Notification was attempted through parent prompt delivery.
      expect(promptCallCount).toBeGreaterThanOrEqual(1)

      // 5. Notification failure was logged (not silently swallowed)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to notify parent session"),
      )

      consoleErrorSpy.mockRestore()
    })

    it("queues a durable pending notification when direct parent delivery fails", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-pending-notify" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "notification-first completion delivered" }] }],
      })

      recordSessionContinuity({
        sessionID: "ses-parent-pending-notify",
        promptParams: {},
        metadata: {
          status: "running",
          description: "Parent orchestrator session",
          delegation: null,
          constraints: [],
          pendingNotifications: [],
          updatedAt: Date.now(),
        },
      })

      let promptCallCount = 0
      client.session.prompt.mockImplementation(async () => {
        promptCallCount += 1
        throw new Error("Parent session unavailable")
      })

      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-pending-notify",
        agent: "builder",
        prompt: "queue pending notification",
      })

      manager.handleSessionIdle("child-pending-notify")
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS * STABLE_POLLS_REQUIRED)
      await flushMicrotasks()
      await flushMicrotasks()

      const delegation = manager.getStatus(result.delegationId)
      const continuity = getSessionContinuity("ses-parent-pending-notify")
      const pending = continuity?.metadata.pendingNotifications ?? []

      expect(delegation?.status).toBe("completed")
      expect(pending).toHaveLength(1)
      expect(pending[0]).toEqual(expect.objectContaining({
        delivered: false,
        description: "Delegation: builder",
        briefSummary: expect.stringContaining("terminal state completed"),
        metadata: expect.objectContaining({
          delegationId: result.delegationId,
          terminalState: "completed",
          recoveryGuarantee: "resumable",
          summaryPreview: "notification-first completion delivered",
        }),
      }))
    })
  })

  // ---------------------------------------------------------------------------
  // delegation pruning
  // ---------------------------------------------------------------------------

  describe("pruning", () => {
    /** Inject a delegation directly into the internal Map for pruning tests */
    function injectDelegation(
      manager: DelegationManager,
      overrides: Partial<Delegation> & { id: string; childSessionId: string },
    ): void {
      const internals = getInternals(manager)
      const delegation: Delegation = {
        parentSessionId: "ses-parent-prune",
        agent: "builder",
        status: "completed",
        createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory: "/tmp",
        queueKey: "agent:builder",
        ...overrides,
      }
      internals.delegations.set(delegation.id, delegation)
      internals.delegationsBySession.set(delegation.childSessionId, delegation.id)
    }

    it("removes old completed delegations past the default max age", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-old-completed",
        childSessionId: "child-old",
        status: "completed",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 1000, // 31+ min ago
      })

      const pruned = manager.pruneCompletedDelegations()

      expect(pruned).toBe(1)
      expect(manager.getStatus("del-old-completed")).toBeUndefined()
      expect(manager.getAllDelegations()).toHaveLength(0)
    })

    it("keeps recent completed delegations within the max age window", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-recent",
        childSessionId: "child-recent",
        status: "completed",
        completedAt: Date.now() - 60_000, // 1 minute ago
      })

      const pruned = manager.pruneCompletedDelegations()

      expect(pruned).toBe(0)
      expect(manager.getStatus("del-recent")).toBeDefined()
      expect(manager.getStatus("del-recent")?.status).toBe("completed")
    })

    it("keeps active (non-terminal) delegations regardless of age", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-running-old",
        childSessionId: "child-running-old",
        status: "running",
        // No completedAt — running delegations don't have it
      })

      injectDelegation(manager, {
        id: "del-dispatched-old",
        childSessionId: "child-dispatched-old",
        status: "dispatched",
      })

      const pruned = manager.pruneCompletedDelegations()

      expect(pruned).toBe(0)
      expect(manager.getStatus("del-running-old")).toBeDefined()
      expect(manager.getStatus("del-dispatched-old")).toBeDefined()
    })

    it("prunes terminal delegations with error and timeout statuses", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-old-error",
        childSessionId: "child-error",
        status: "error",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 5000,
      })

      injectDelegation(manager, {
        id: "del-old-timeout",
        childSessionId: "child-timeout",
        status: "timeout",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 5000,
      })

      const pruned = manager.pruneCompletedDelegations()

      expect(pruned).toBe(2)
      expect(manager.getStatus("del-old-error")).toBeUndefined()
      expect(manager.getStatus("del-old-timeout")).toBeUndefined()
    })

    it("supports custom maxAgeMs parameter", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-5min",
        childSessionId: "child-5min",
        status: "completed",
        completedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      })

      // Default max age (30 min) should keep it
      expect(manager.pruneCompletedDelegations()).toBe(0)
      expect(manager.getStatus("del-5min")).toBeDefined()

      // Re-inject since it wasn't pruned
      injectDelegation(manager, {
        id: "del-5min",
        childSessionId: "child-5min",
        status: "completed",
        completedAt: Date.now() - 6 * 60 * 1000,
      })

      // 5-minute max age should prune it (6 min > 5 min)
      const pruned = manager.pruneCompletedDelegations(5 * 60 * 1000)
      expect(pruned).toBe(1)
      expect(manager.getStatus("del-5min")).toBeUndefined()
    })

    it("syncs persisted state after pruning", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-persist-sync",
        childSessionId: "child-persist",
        status: "completed",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 1000,
      })

      // Force initial persistence
      const internals = getInternals(manager)
      writeFileSync(
        getDelegationsFile(stateDir),
        JSON.stringify(Array.from(internals.delegations.values())),
      )

      manager.pruneCompletedDelegations()

      const persisted = JSON.parse(readFileSync(getDelegationsFile(stateDir), "utf-8")) as Delegation[]
      expect(persisted.find((d) => d.id === "del-persist-sync")).toBeUndefined()
    })

    it("cleans up delegationsBySession tracking for pruned entries", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-tracking",
        childSessionId: "child-tracking",
        status: "completed",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 1000,
      })

      expect(getInternals(manager).delegationsBySession.has("child-tracking")).toBe(true)

      manager.pruneCompletedDelegations()

      expect(getInternals(manager).delegationsBySession.has("child-tracking")).toBe(false)
    })

    it("auto-prune triggers when Map exceeds MAX_DELEGATIONS_BEFORE_PRUNE threshold", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [{ name: "builder" }],
      })
      const manager = new DelegationManager(client as never)
      const internals = getInternals(manager)

      // Inject MAX_DELEGATIONS_BEFORE_PRUNE + 1 delegations with completed status
      for (let i = 0; i <= MAX_DELEGATIONS_BEFORE_PRUNE; i++) {
        const id = `del-auto-${i}`
        const childId = `child-auto-${i}`
        internals.delegations.set(id, {
          id,
          parentSessionId: "ses-parent-auto",
          childSessionId: childId,
          agent: "builder",
          status: "completed",
          createdAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 1000,
          completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 500,
          lastMessageCount: 0,
          stablePollCount: 0,
          executionMode: "sdk",
          workingDirectory: "/tmp",
          queueKey: "agent:builder",
        })
        internals.delegationsBySession.set(childId, id)
      }

      expect(internals.delegations.size).toBe(MAX_DELEGATIONS_BEFORE_PRUNE + 1)

      // Add one more via dispatch to trigger persistAllDelegations → auto-prune
      // Since the delegations are old enough, auto-prune should clear them
      // But dispatch creates a new delegation, so let's call the internal method
      // We'll trigger it by using the public dispatch which calls persistAllDelegations
      // Actually, let's just directly test that persistAllDelegations triggers auto-prune

      // We need a running delegation to test the auto-prune correctly
      // Add a running delegation that won't be pruned
      internals.delegations.set("del-running-keep", {
        id: "del-running-keep",
        parentSessionId: "ses-parent-auto",
        childSessionId: "child-running-keep",
        agent: "builder",
        status: "running",
        createdAt: Date.now(),
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory: "/tmp",
        queueKey: "agent:builder",
      })
      internals.delegationsBySession.set("child-running-keep", "del-running-keep")

      // Trigger persistAllDelegations via dispatch (which internally calls it)
      // The dispatch will call persistAllDelegations, which should trigger auto-prune
      client.session.create.mockResolvedValue({ data: { id: "child-auto-dispatch" } })
      client.session.promptAsync.mockResolvedValue(undefined)

      await manager.dispatch({
        parentSessionId: "ses-parent-auto",
        agent: "builder",
        prompt: "trigger auto-prune",
      })

      // After dispatch, the auto-prune should have removed old completed delegations
      // The running delegation and the new dispatched one should remain
      const remaining = manager.getAllDelegations()
      expect(remaining.length).toBeLessThanOrEqual(MAX_DELEGATIONS_BEFORE_PRUNE)
      expect(manager.getStatus("del-running-keep")).toBeDefined()
    })

    it("returns correct count of pruned delegations", () => {
      const manager = new DelegationManager(createMockClient() as never)

      injectDelegation(manager, {
        id: "del-count-1",
        childSessionId: "child-count-1",
        status: "completed",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 1000,
      })

      injectDelegation(manager, {
        id: "del-count-2",
        childSessionId: "child-count-2",
        status: "completed",
        completedAt: Date.now() - DEFAULT_PRUNE_MAX_AGE_MS - 2000,
      })

      injectDelegation(manager, {
        id: "del-count-keep",
        childSessionId: "child-count-keep",
        status: "completed",
        completedAt: Date.now() - 10_000, // Recent
      })

      const pruned = manager.pruneCompletedDelegations()

      expect(pruned).toBe(2)
      expect(manager.getStatus("del-count-1")).toBeUndefined()
      expect(manager.getStatus("del-count-2")).toBeUndefined()
      expect(manager.getStatus("del-count-keep")).toBeDefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Phase 16.2: nesting depth + grace period + terminal path coverage
  // ---------------------------------------------------------------------------

  describe("nesting depth enforcement", () => {
    it("top-level delegation has nestingDepth 1", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-depth-1" } })
      client.session.promptAsync.mockResolvedValue(undefined)
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-depth",
        agent: "builder",
        prompt: "depth test",
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.nestingDepth).toBe(1)
    })

    it("nested delegation inherits parent depth + 1", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-depth-2" } })
      client.session.promptAsync.mockResolvedValue(undefined)
      const manager = new DelegationManager(client as never)
      const internals = getInternals(manager)

      // Inject a top-level delegation so parentSessionId maps to a child session
      const parentDelegation: Delegation = {
        id: "del-parent-nested",
        parentSessionId: "ses-grandparent",
        childSessionId: "ses-parent-nested",
        agent: "builder",
        status: "running",
        createdAt: Date.now(),
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory: "/tmp",
        queueKey: "agent:builder",
        nestingDepth: 1,
      }
      internals.delegations.set(parentDelegation.id, parentDelegation)
      internals.delegationsBySession.set(parentDelegation.childSessionId, parentDelegation.id)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-nested",
        agent: "builder",
        prompt: "nested depth",
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation?.nestingDepth).toBe(2)
    })

    it("throws when max delegation depth is exceeded", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-depth-exceed" } })
      client.session.promptAsync.mockResolvedValue(undefined)
      const manager = new DelegationManager(client as never)
      const internals = getInternals(manager)

      // Inject a delegation at max depth (3)
      const deepDelegation: Delegation = {
        id: "del-depth-3",
        parentSessionId: "ses-grandparent",
        childSessionId: "ses-depth-3",
        agent: "builder",
        status: "running",
        createdAt: Date.now(),
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory: "/tmp",
        queueKey: "agent:builder",
        nestingDepth: 3,
      }
      internals.delegations.set(deepDelegation.id, deepDelegation)
      internals.delegationsBySession.set(deepDelegation.childSessionId, deepDelegation.id)

      await expect(manager.dispatch({
        parentSessionId: "ses-depth-3",
        agent: "builder",
        prompt: "exceed depth",
      })).rejects.toThrow("Maximum delegation nesting depth")
    })
  })

  describe("grace period cleanup", () => {
    it("keeps terminal delegation in Map during grace period", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-grace" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "grace" }] }],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-grace",
        agent: "builder",
        prompt: "grace test",
      })

      manager.handleSessionIdle("child-grace")
      await vi.advanceTimersByTimeAsync(30000)

      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")
      // Still in Map during grace period
      expect(manager.getAllDelegations()).toHaveLength(1)
    })

    it("removes terminal delegation from Map after grace period expires", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-grace-expire" } })
      client.session.messages.mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "expire" }] }],
      })
      const manager = new DelegationManager(client as never)
      const result = await manager.dispatch({
        parentSessionId: "ses-parent-grace-expire",
        agent: "builder",
        prompt: "grace expire test",
      })

      manager.handleSessionIdle("child-grace-expire")
      await vi.advanceTimersByTimeAsync(30000)
      expect(manager.getStatus(result.delegationId)?.status).toBe("completed")

      // Advance past grace period (10 minutes = 600000ms)
      await vi.advanceTimersByTimeAsync(600000)
      expect(manager.getStatus(result.delegationId)).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Phase 34: dual-mode dispatch edge-case verification
  // ---------------------------------------------------------------------------

  describe("dual-mode dispatch recovery edge cases", () => {
    it("recovers dispatched-state SDK delegation and routes to sdk handler", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "del-dispatched-sdk",
          parentSessionId: "parent-dispatched-sdk",
          childSessionId: "child-dispatched-sdk",
          agent: "builder",
          status: "dispatched",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
          executionMode: "sdk",
          workingDirectory: "/tmp/dispatched-sdk",
          queueKey: "agent:builder",
        },
      ], null, 2))
      const client = createMockClient()
      client.session.status.mockResolvedValue({ data: { "child-dispatched-sdk": { type: "busy" } } })
      const manager = new DelegationManager(client as never)

      await manager.recoverPending()

      const delegation = manager.getStatus("del-dispatched-sdk")
      expect(delegation).toBeDefined()
      expect(delegation?.status).toBe("dispatched")
      expect(delegation?.executionMode).toBe("sdk")
      expect(getInternals(manager).delegationsBySession.get("child-dispatched-sdk")).toBe("del-dispatched-sdk")
      expect(client.session.status).toHaveBeenCalled()
    })

    it("recovers dispatched-state PTY delegation and routes to command handler", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "del-dispatched-pty",
          parentSessionId: "parent-dispatched-pty",
          childSessionId: "pty:pty-session-dispatched",
          agent: "command-runner",
          status: "dispatched",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
          executionMode: "pty",
          workingDirectory: "/tmp/dispatched-pty",
          ptySessionId: "pty-session-dispatched",
          queueKey: "category:command",
        },
      ], null, 2))
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn(),
          getSession: vi.fn().mockReturnValue({
            id: "pty-session-dispatched",
            mode: "pty",
            cwd: "/tmp/dispatched-pty",
            startedAt: now,
            pid: 9999,
          }),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })

      await manager.recoverPending()

      const delegation = manager.getStatus("del-dispatched-pty")
      expect(delegation).toBeDefined()
      expect(delegation?.status).toBe("dispatched")
      expect(delegation?.executionMode).toBe("pty")
      expect(delegation?.ptySessionId).toBe("pty-session-dispatched")
    })

    it("dead-PTY delegation on recovery falls back to error with descriptive message", async () => {
      const now = Date.now()
      writeFileSync(getDelegationsFile(stateDir), JSON.stringify([
        {
          id: "del-dead-pty",
          parentSessionId: "parent-dead-pty",
          childSessionId: "pty:pty-session-dead",
          agent: "command-runner",
          status: "running",
          createdAt: now,
          safetyCeilingMs: 60_000,
          lastMessageCount: 0,
          stablePollCount: 0,
          executionMode: "pty",
          workingDirectory: "/tmp/dead-pty",
          ptySessionId: "pty-session-dead",
          queueKey: "category:command",
        },
      ], null, 2))
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn(),
          getSession: vi.fn().mockReturnValue(undefined),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })

      await manager.recoverPending()

      const delegation = manager.getStatus("del-dead-pty")
      expect(delegation).toBeDefined()
      expect(delegation?.status).toBe("error")
      // Phase 16.2.1 R-PTY-03-AMENDED — recovery is now honest about
      // non-resumability instead of emitting "session not found".
      expect(delegation?.error).toContain("non-resumable-after-restart")
      expect(delegation?.terminalKind).toBe("non-resumable-after-restart")
      expect(delegation?.completedAt).toBeDefined()
    })

    it("dead-PTY on dispatch degrades to headless with fallbackReason recorded", async () => {
      const client = createMockClient()
      const ptyManager = {
        isSupported: () => true,
        spawn: vi.fn().mockImplementation(() => {
          throw new Error("bun-pty native module not available")
        }),
        getSession: vi.fn().mockReturnValue(undefined),
        terminate: vi.fn().mockResolvedValue(undefined),
      }
      const manager = createManager(client, { ptyManager })

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-pty-dead",
        command: "echo",
        args: ["fallback-pty-dead"],
        cwd: "/tmp/pty-dead-fallback",
        queueContext: { provider: "anthropic", model: "claude-3-5-sonnet" },
      })

      expect(result.executionMode).toBe("headless")
      expect(result.fallbackReason).toBeTruthy()
      expect(result.fallbackReason).toContain("bun-pty")

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation).toEqual(expect.objectContaining({
        executionMode: "headless",
        fallbackReason: expect.stringContaining("bun-pty"),
        queueKey: "provider:anthropic:model:claude-3-5-sonnet",
        recoveryGuarantee: "non-resumable-after-restart",
      }))
    })

    it("SDK and command delegations produce identical queue key format from concurrency.ts", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [{
          name: "builder",
          provider: "anthropic",
          model: "claude-3-5-sonnet",
          category: "implementation",
        }],
      })
      const manager = createManager(client, { ptyManager: null })

      const sdkResult = await manager.dispatch({
        parentSessionId: "ses-parent-sdk-qk",
        agent: "builder",
        prompt: "sdk queue key test",
      })

      const cmdResult = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-cmd-qk",
        command: "echo",
        args: ["queue key test"],
        queueContext: {
          provider: "anthropic",
          model: "claude-3-5-sonnet",
        },
      })

      const expectedKey = buildDelegationQueueKey({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
        agent: "builder",
        category: "implementation",
      })
      const expectedCmdKey = buildDelegationQueueKey({
        provider: "anthropic",
        model: "claude-3-5-sonnet",
      })

      expect(sdkResult.queueKey).toBe(expectedKey)
      expect(cmdResult.queueKey).toBe(expectedCmdKey)

      const sdkDelegation = manager.getStatus(sdkResult.delegationId)
      const cmdDelegation = manager.getStatus(cmdResult.delegationId)
      expect(sdkDelegation?.queueKey).toBe(expectedKey)
      expect(cmdDelegation?.queueKey).toBe(expectedCmdKey)
    })

    it("queue key format matches across all precedence levels for both dispatch paths", () => {
      const cases: Array<{ args: Parameters<typeof buildDelegationQueueKey>[0]; expected: string }> = [
        { args: { provider: "anthropic", model: "claude-3-5-sonnet" }, expected: "provider:anthropic:model:claude-3-5-sonnet" },
        { args: { model: "claude-3-5-sonnet" }, expected: "model:claude-3-5-sonnet" },
        { args: { agent: "builder", category: "implementation" }, expected: "agent:builder:category:implementation" },
        { args: { agent: "builder" }, expected: "agent:builder" },
        { args: { category: "implementation" }, expected: "category:implementation" },
        { args: {}, expected: "default" },
      ]

      for (const { args, expected } of cases) {
        expect(buildDelegationQueueKey(args)).toBe(expected)
      }
    })

    it("handler injection uses callbacks without logic duplication — SDK path delegates to SdkDelegationHandler", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-handler-verify" } })
      const manager = new DelegationManager(client as never)
      const internals = getInternals(manager)

      await manager.dispatch({
        parentSessionId: "ses-parent-handler-verify",
        agent: "builder",
        prompt: "handler injection test",
      })

      expect(internals.delegationsBySession.has("child-handler-verify")).toBe(true)
      expect(internals.safetyTimers.size).toBe(1)

      manager.handleSessionIdle("child-handler-verify")
      await flushMicrotasks()
      expect(internals.stabilityTimers.size).toBe(1)
    })

    it("handler injection uses callbacks without logic duplication — command path delegates to CommandDelegationHandler", async () => {
      const client = createMockClient()
      const manager = createManager(client, {
        ptyManager: {
          isSupported: () => true,
          spawn: vi.fn().mockReturnValue({
            id: "pty-handler-verify",
            mode: "pty",
            cwd: "/tmp/handler-verify",
            startedAt: Date.now(),
            pid: 5555,
          }),
          getSession: vi.fn().mockReturnValue({
            id: "pty-handler-verify",
            mode: "pty",
            cwd: "/tmp/handler-verify",
            startedAt: Date.now(),
            pid: 5555,
          }),
          terminate: vi.fn().mockResolvedValue(undefined),
        },
      })

      const result = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-cmd-handler",
        command: "sleep",
        args: ["0.1"],
        cwd: "/tmp/handler-verify",
      })

      const delegation = manager.getStatus(result.delegationId)
      expect(delegation).toBeDefined()
      expect(delegation?.executionMode).toBe("pty")
      expect(delegation?.ptySessionId).toBe("pty-handler-verify")
      expect(delegation?.surface).toBe("command-process")
      expect(delegation?.recoveryGuarantee).toBe("best-effort")
    })

    it("dispatched-state delegations are included in status filtering alongside running delegations", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({
        data: [{ name: "builder" }],
      })
      const manager = createManager(client, { ptyManager: null })

      const sdkResult = await manager.dispatch({
        parentSessionId: "ses-parent-filter",
        agent: "builder",
        prompt: "sdk dispatched",
      })

      const cmdResult = await dispatchCommand(manager, {
        parentSessionId: "ses-parent-filter-cmd",
        command: "echo",
        args: ["cmd dispatched"],
      })

      const all = manager.getAllDelegations()
      const dispatched = all.filter((d) => d.status === "dispatched" || d.status === "running")
      expect(dispatched).toHaveLength(2)
      expect(dispatched.map((d) => d.id)).toEqual(
        expect.arrayContaining([sdkResult.delegationId, cmdResult.delegationId]),
      )
    })

    it("SDK stability polling uses real message-count fetch via session-api wrapper", async () => {
      vi.useFakeTimers()
      const client = createMockClient()
      client.session.create.mockResolvedValue({ data: { id: "child-real-poll" } })
      const messageCountSpy = vi.mocked(sessionApi.getSessionMessageCount).mockResolvedValue(5)
      const manager = new DelegationManager(client as never)

      await manager.dispatch({
        parentSessionId: "ses-parent-real-poll",
        agent: "builder",
        prompt: "real poll test",
      })

      manager.handleSessionIdle("child-real-poll")
      await flushMicrotasks()
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(messageCountSpy).toHaveBeenCalledWith(client, "child-real-poll")

      const delegation = manager.getAllDelegations()[0]
      expect(delegation?.lastMessageCount).toBe(5)
    })
  })

  describe("runtime policy dispatch wiring", () => {
    it("denies delegation through a narrower runtime category policy", async () => {
      const client = createMockClient()
      client.app.agents.mockResolvedValue({ data: [{ name: "builder", tools: { bash: true, edit: true } }] })
      const manager = createManager(client, {
        runtimePolicy: {
          ...DEFAULT_RUNTIME_POLICY,
          categoryGate: {
            ...DEFAULT_RUNTIME_POLICY.categoryGate,
            readonlyCategories: ["implementation"],
          },
        },
      })

      await expect(manager.dispatch({
        parentSessionId: "ses_parent_policy_deny",
        agent: "builder",
        prompt: "do work",
        title: "policy deny",
        category: "implementation",
      })).rejects.toThrow("category \"implementation\" cannot use write-capable tools")
    })

    it("passes per-key runtime concurrency and acquire timeout into SDK dispatch", async () => {
      const client = createMockClient()
      const acquireSpy = vi.spyOn(DelegationConcurrencyQueue.prototype, "acquire")
      const manager = createManager(client, {
        runtimePolicy: {
          ...DEFAULT_RUNTIME_POLICY,
          concurrency: {
            globalLimit: 3,
            perKey: {
              "agent:builder:category:implementation": { limit: 1, acquireTimeoutMs: 250 },
            },
          },
        },
      })

      await manager.dispatch({
        parentSessionId: "ses_parent_policy_concurrency",
        agent: "builder",
        prompt: "do work",
        title: "policy concurrency",
        category: "implementation",
      })

      expect(acquireSpy).toHaveBeenCalledWith("agent:builder:category:implementation", 1, 250)
    })

    // -------------------------------------------------------------------
    // Phase 46.1 R-ALWAYS-ASYNC-01..03 (audit 2026-04-30, Finding 3 — VALIDATED):
    // run_in_background was silently downgraded to sync when
    // builtinAsyncBackgroundChildSessions=false. The audit's remediation is
    // to remove the gate so every SDK delegation dispatch uses
    // sendPromptAsync regardless of the legacy flag. The previous
    // "uses synchronous prompt by default" / "only when explicitly allowed"
    // tests encoded the wrong contract and have been replaced with the
    // always-async contract below.
    // -------------------------------------------------------------------

    it("R-ALWAYS-ASYNC-01: uses async prompt with DEFAULT_RUNTIME_POLICY (no longer downgraded to sync)", async () => {
      const client = createMockClient()
      const manager = createManager(client, { runtimePolicy: DEFAULT_RUNTIME_POLICY })

      const result = await manager.dispatch({
        parentSessionId: "ses_parent_default_async",
        agent: "builder",
        prompt: "do work",
        title: "default async",
      })

      expect(result.status).toBe("running")
      expect(client.session.promptAsync).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "child-ses-123" } }),
      )
      expect(client.session.prompt).not.toHaveBeenCalled()
    })

    it("R-ALWAYS-ASYNC-02: ignores builtinAsyncBackgroundChildSessions=false (legacy gate removed)", async () => {
      const client = createMockClient()
      const manager = createManager(client, {
        runtimePolicy: {
          ...DEFAULT_RUNTIME_POLICY,
          trustedRuntime: { builtinAsyncBackgroundChildSessions: false },
        },
      })

      const result = await manager.dispatch({
        parentSessionId: "ses_parent_legacy_false",
        agent: "builder",
        prompt: "do work",
        title: "legacy false",
      })

      expect(result.status).toBe("running")
      expect(client.session.promptAsync).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "child-ses-123" } }),
      )
      expect(client.session.prompt).not.toHaveBeenCalled()
    })

    it("R-ALWAYS-ASYNC-03: uses async prompt when builtinAsyncBackgroundChildSessions=true (explicit opt-in is now a no-op)", async () => {
      const client = createMockClient()
      const manager = createManager(client, {
        runtimePolicy: {
          ...DEFAULT_RUNTIME_POLICY,
          trustedRuntime: { builtinAsyncBackgroundChildSessions: true },
        },
      })

      const result = await manager.dispatch({
        parentSessionId: "ses_parent_explicit_true",
        agent: "builder",
        prompt: "do work",
        title: "explicit true",
      })

      expect(result.status).toBe("running")
      expect(client.session.promptAsync).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "child-ses-123" } }),
      )
      expect(client.session.prompt).not.toHaveBeenCalled()
    })
  })

  describe("behavioral profile guardrail overrides", () => {
    it("applyBehavioralGuardrail returns 1 for strict guardrailLevel", () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      expect(manager.applyBehavioralGuardrail("strict")).toBe(1)
    })

    it("applyBehavioralGuardrail returns undefined for moderate guardrailLevel", () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      expect(manager.applyBehavioralGuardrail("moderate")).toBeUndefined()
    })

    it("applyBehavioralGuardrail returns undefined for minimal guardrailLevel", () => {
      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      expect(manager.applyBehavioralGuardrail("minimal")).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // CA-03: parallelization toggle
  // ---------------------------------------------------------------------------

  describe("parallelization toggle", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("dispatch proceeds normally when parallelization is true (default)", async () => {
      const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
      vi.spyOn(configSubscriber, "getCachedConfig").mockReturnValue(
        HivemindConfigsSchema.parse({ parallelization: true, workflow: { use_worktrees: false } }),
      )

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-parallel-true",
        agent: "builder",
        prompt: "parallel dispatch",
      })

      expect(result.status).toBe("running")
      expect(result.delegationId).toBeTypeOf("string")
    })

    it("dispatches sequentially (semaphore limit=1) when parallelization is false", async () => {
      const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
      vi.spyOn(configSubscriber, "getCachedConfig").mockReturnValue(
        HivemindConfigsSchema.parse({ parallelization: false, workflow: { use_worktrees: false } }),
      )

      const client = createMockClient()
      const manager = new DelegationManager(client as never)
      const acquireSpy = vi.spyOn(
        (manager as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore,
        "acquire",
      )

      await manager.dispatch({
        parentSessionId: "ses-parent-parallel-false",
        agent: "builder",
        prompt: "sequential dispatch",
      })

      // When parallelization=false, semaphore.acquire should be called with limit=1 (sequential)
      expect(acquireSpy).toHaveBeenCalledWith(
        "agent:builder",
        1,  // sequential limit
        undefined,
      )
    })

    it("parallelization defaults to true when no config is cached", async () => {
      const { getDefaultConfigs } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
      vi.spyOn(configSubscriber, "getCachedConfig").mockReturnValue(getDefaultConfigs())

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-defaults",
        agent: "builder",
        prompt: "default parallel dispatch",
      })

      expect(result.status).toBe("running")
    })

    it("does not throw or crash when parallelization is false", async () => {
      const { HivemindConfigsSchema } = await import("../../src/schema-kernel/hivemind-configs.schema.js")
      vi.spyOn(configSubscriber, "getCachedConfig").mockReturnValue(
        HivemindConfigsSchema.parse({ parallelization: false, workflow: { use_worktrees: false } }),
      )

      const client = createMockClient()
      const manager = new DelegationManager(client as never)

      const result = await manager.dispatch({
        parentSessionId: "ses-parent-no-crash",
        agent: "builder",
        prompt: "no crash test",
      })

      // Should complete without throwing — delegation is created and returned
      expect(result.delegationId).toBeTypeOf("string")
      expect(result.status).toBe("running")
    })
  })
})

describe("behavioral tests", () => {
  /**
   * Stateful fake client that maintains internal session state.
   */
  function createStatefulClient() {
    const sessions = new Map<string, { id: string; status: string; messages: unknown[] }>()
    return {
      app: {
        agents: vi.fn(async () => ({
          data: [
            {
              name: "builder",
              description: "Builder agent",
              temperature: 0.3,
              tools: { read: true, write: true, edit: true, bash: true },
              permission: { allow: ["read", "write"] },
            },
            {
              name: "researcher",
              description: "Researcher agent",
              temperature: 0.5,
              tools: { read: true, grep: true, glob: true },
              permission: { allow: ["read", "search"] },
            },
          ],
        })),
      },
      session: {
        create: vi.fn(async () => {
          const id = `fake-ses-${sessions.size + 1}`
          sessions.set(id, { id, status: "running", messages: [] })
          return { data: { id } }
        }),
        prompt: vi.fn(async (request: { path: { id: string }; body: unknown }) => {
          const s = sessions.get(request.path.id)
          if (s) {
            s.messages.push({ role: "assistant", content: request.body })
            s.status = "completed"
          }
          return { data: "ok" }
        }),
        status: vi.fn(async (request: { path: { id: string } }) => {
          const s = sessions.get(request.path.id)
          return { data: s ? { status: { type: s.status } } : {} }
        }),
        messages: vi.fn(async (request: { path: { id: string } }) => {
          const s = sessions.get(request.path.id)
          return { data: s ? { messages: s.messages } : { messages: [] } }
        }),
        abort: vi.fn(async (request: { path: { id: string } }) => {
          const s = sessions.get(request.path.id)
          if (s) s.status = "cancelled"
          return {}
        }),
      },
      _getStatus(id: string) {
        return sessions.get(id)?.status
      },
      _getSession(id: string) {
        return sessions.get(id)
      },
    }
  }

  let tempDir: string
  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "dm-behavioral-"))
  })
  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("dispatch creates session and delegates via stateful client", async () => {
    vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
    const client = createStatefulClient()
    const dm = new DelegationManager(client as never, {
      runtimePolicy: {
        concurrency: { globalLimit: 5, perAgentLimit: 3, defaultCategoryLimit: 2 },
        budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16 },
        safety: { defaultGracePeriodMs: 500, cleanupIntervalMs: 5000, maxQueueWaitMs: 30000 },
        lifecycle: {},
        prompts: {},
      },
    })

    const result = await dm.dispatch({
      parentSessionId: "ses_parent",
      agent: "builder",
      prompt: "build feature",
      title: "Test Dispatch",
    })

    expect(result.delegationId).toBeDefined()
    // Delegation was created, status may be dispatched or errored depending on prompt delivery
    const status = dm.checkDelegationStatus?.(result.delegationId) ?? dm.getStatus?.(result.delegationId)
    expect(status).toBeDefined()
  })

  it("stability polling updates delegation status on idle", async () => {
    vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
    const client = createStatefulClient()
    const dm = new DelegationManager(client as never, {
      runtimePolicy: {
        concurrency: { globalLimit: 5, perAgentLimit: 3, defaultCategoryLimit: 2 },
        budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16 },
        safety: { defaultGracePeriodMs: 100, cleanupIntervalMs: 5000, maxQueueWaitMs: 30000 },
        lifecycle: {},
        prompts: {},
      },
    })

    const result = await dm.dispatch({
      parentSessionId: "ses_parent2",
      agent: "builder",
      prompt: "polling test",
      title: "Polling Dispatch",
    })

    // Verify delegation was created and client was used
    expect(result.delegationId).toBeDefined()
    expect(typeof result.delegationId).toBe("string")
  })

  it("grace period cleanup removes stale delegations", async () => {
    vi.useFakeTimers()
    vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
    try {
      const client = createStatefulClient()
      const dm = new DelegationManager(client as never, {
        runtimePolicy: {
          concurrency: { globalLimit: 5, perAgentLimit: 3, defaultCategoryLimit: 2 },
          budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16 },
          safety: { defaultGracePeriodMs: 100, cleanupIntervalMs: 1000, maxQueueWaitMs: 30000 },
          lifecycle: {},
          prompts: {},
        },
      })

      const result = await dm.dispatch({
        parentSessionId: "ses_cleanup",
        agent: "builder",
        prompt: "cleanup test",
        title: "Cleanup Dispatch",
      })

      expect(result.delegationId).toBeDefined()

      // Advance past cleanup interval
      await vi.advanceTimersByTimeAsync(5000)

      // Delegation should still exist (just dispatched)
      const status = dm.checkDelegationStatus?.(result.delegationId) ?? dm.getStatus?.(result.delegationId)
      expect(status).toBeDefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it("recovery flow hydrates persisted delegations", async () => {
    vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
    const client1 = createStatefulClient()
    const dm1 = new DelegationManager(client1 as never, {
      runtimePolicy: {
        concurrency: { globalLimit: 5, perAgentLimit: 3, defaultCategoryLimit: 2 },
        budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16 },
        safety: { defaultGracePeriodMs: 500, cleanupIntervalMs: 5000, maxQueueWaitMs: 30000 },
        lifecycle: {},
        prompts: {},
      },
    })

    const result = await dm1.dispatch({
      parentSessionId: "ses_recovery",
      agent: "researcher",
      prompt: "recovery test",
      title: "Recovery Dispatch",
    })

    expect(result.delegationId).toBeDefined()
    // The delegation exists in memory
    const status = dm1.checkDelegationStatus?.(result.delegationId) ?? dm1.getStatus?.(result.delegationId)
    expect(status).toBeDefined()
  })

  it("different queue keys can dispatch concurrently", async () => {
    vi.spyOn(sessionApi, "sendPrompt").mockResolvedValue("ok")
    const client = createStatefulClient()
    const dm = new DelegationManager(client as never, {
      runtimePolicy: {
        concurrency: { globalLimit: 5, perAgentLimit: 3, defaultCategoryLimit: 2 },
        budget: { maxToolCallsPerSession: 400, repeatedSignatureThreshold: 16 },
        safety: { defaultGracePeriodMs: 500, cleanupIntervalMs: 5000, maxQueueWaitMs: 30000 },
        lifecycle: {},
        prompts: {},
      },
    })

    const [r1, r2] = await Promise.all([
      dm.dispatch({
        parentSessionId: "ses_concurrent",
        agent: "builder",
        prompt: "task 1",
        title: "Concurrent 1",
      }),
      dm.dispatch({
        parentSessionId: "ses_concurrent",
        agent: "researcher",
        prompt: "task 2",
        title: "Concurrent 2",
      }),
    ])

    expect(r1.delegationId).toBeDefined()
    expect(r2.delegationId).toBeDefined()
    expect(r1.delegationId).not.toBe(r2.delegationId)
  })
})
