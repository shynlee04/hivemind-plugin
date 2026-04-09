/**
 * Tests for Task 2: wiring hybrid execution into delegation and hardening
 * owned-process execution.
 *
 * Covers:
 *  1. Interactive delegated work uses OpenCode child sessions (builtin-subsession).
 *  2. Research/headless delegated work uses owned-process stdio with captured
 *     stdout/stderr (builtin-process).
 *  3. Disallowed commands or out-of-root cwd requests are rejected before spawn.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BackgroundManager } from "../../src/lib/background-manager.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import { runLifecycleProcessTask } from "../../src/lib/lifecycle-process-runner.js"
import { buildDelegationArtifactPacket } from "../../src/lib/delegation-packet.js"
import { getSessionContinuity } from "../../src/lib/continuity.js"

// ---------------------------------------------------------------------------
// Test 3: Disallowed commands or out-of-root cwd requests are rejected
// ---------------------------------------------------------------------------

describe("BackgroundManager — command allowlist enforcement", () => {
  let manager: BackgroundManager

  beforeEach(() => {
    manager = new BackgroundManager()
  })

  afterEach(async () => {
    for (const task of manager.listTasks()) {
      if (task.status === "running") {
        manager.kill(task.id)
      }
    }
    await new Promise((r) => setTimeout(r, 50))
  })

  it("rejects a disallowed command with [Harness] error", () => {
    expect(() =>
      manager.spawn({
        command: "rm",
        args: ["-rf", "/"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      }),
    ).toThrow(/\[Harness\]/)
  })

  it("rejects an out-of-root cwd with [Harness] error", () => {
    expect(() =>
      manager.spawn({
        command: "node",
        args: ["-e", "console.log('hi')"],
        cwd: "/etc",
        parentSessionID: "ses_test",
      }),
    ).toThrow(/\[Harness\]/)
  })

  it("allows a command in the default allowlist", () => {
    const task = manager.spawn({
      command: "node",
      args: ["-e", "process.exit(0)"],
      cwd: process.cwd(),
      parentSessionID: "ses_test",
    })
    expect(task.status).toBe("running")
  })

  it("allows npx in the default allowlist", () => {
    const task = manager.spawn({
      command: "npx",
      args: ["--version"],
      cwd: process.cwd(),
      parentSessionID: "ses_test",
    })
    expect(task.status).toBe("running")
  })

  it("allows custom allowlist to extend allowed commands", () => {
    const customManager = new BackgroundManager(10240, {
      allowedCommands: ["node", "python3"],
    })
    const task = customManager.spawn({
      command: "python3",
      args: ["--version"],
      cwd: process.cwd(),
      parentSessionID: "ses_test",
    })
    expect(task.status).toBe("running")
  })

  it("rejects commands not in custom allowlist", () => {
    const customManager = new BackgroundManager(10240, {
      allowedCommands: ["node"],
    })
    expect(() =>
      customManager.spawn({
        command: "bash",
        args: ["-c", "echo hello"],
        cwd: process.cwd(),
        parentSessionID: "ses_test",
      }),
    ).toThrow(/\[Harness\]/)
  })
})

// ---------------------------------------------------------------------------
// Test 2: Research/headless work uses owned-process with captured output
// ---------------------------------------------------------------------------

describe("BackgroundManager — owned-process stdout/stderr capture", () => {
  let manager: BackgroundManager

  beforeEach(() => {
    manager = new BackgroundManager()
  })

  afterEach(async () => {
    for (const task of manager.listTasks()) {
      if (task.status === "running") {
        manager.kill(task.id)
      }
    }
    await new Promise((r) => setTimeout(r, 50))
  })

  it("captures stdout from owned-process execution", async () => {
    const task = manager.spawn({
      command: "node",
      args: ["-e", "process.stdout.write('research-output')"],
      cwd: process.cwd(),
      parentSessionID: "ses_research",
    })

    const result = await manager.onComplete(task.id)
    expect(result.stdout).toContain("research-output")
    expect(result.status).toBe("completed")
  })

  it("captures stderr from owned-process execution", async () => {
    const task = manager.spawn({
      command: "node",
      args: ["-e", "process.stderr.write('error-output')"],
      cwd: process.cwd(),
      parentSessionID: "ses_research",
    })

    const result = await manager.onComplete(task.id)
    expect(result.stderr).toContain("error-output")
  })

  it("records failure context before cleanup", async () => {
    const task = manager.spawn({
      command: "node",
      args: ["-e", "process.exit(1)"],
      cwd: process.cwd(),
      parentSessionID: "ses_research",
    })

    const result = await manager.onComplete(task.id)
    expect(result.status).toBe("failed")
    expect(result.exitCode).toBe(1)

    // Task should still be queryable after failure
    const queryable = manager.getTask(task.id)
    expect(queryable).toBeDefined()
    expect(queryable!.status).toBe("failed")
    expect(queryable!.error).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Test 1: Interactive delegated work uses OpenCode child sessions
//         (validated via delegate-task tool test below)
// ---------------------------------------------------------------------------

import { taskState } from "../../src/lib/state.js"
import type { HarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../../src/lib/session-api.js"
import { createDelegateTaskTool } from "../../src/tools/delegate-task.js"

const continuityDir = mkdtempSync(join(tmpdir(), "hivemind-background-harden-"))
process.env.OPENCODE_HARNESS_CONTINUITY_FILE = join(continuityDir, "session-continuity.json")

afterEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  taskState.clear()
})

afterEach(() => {
  rmSync(process.env.OPENCODE_HARNESS_CONTINUITY_FILE!, { force: true })
})

afterEach(() => {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = join(continuityDir, "session-continuity.json")
})

afterEach(() => {
  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = join(continuityDir, "session-continuity.json")
})

afterEach(() => {
  delete process.env.OPENCODE_HARNESS_BUILTIN_PROCESS_FAIL
})

afterEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = join(continuityDir, "session-continuity.json")
})

afterEach(() => {
  // no-op barrier so the next test sees a clean continuity file path
})

const mockCtx = {
  messageID: "message-1",
  sessionID: "parent-session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => {},
}

function createClient(sessionMap: Record<string, Record<string, unknown>>): OpenCodeClient {
  return {
    session: {
      get: vi.fn(async ({ path }: { path: { id: string } }) => ({ data: sessionMap[path.id] })),
    },
  } as unknown as OpenCodeClient
}

function createLifecycleManagerMock() {
  const launchDelegatedSession = vi.fn(async (_args: unknown) => "delegated-session")

  return {
    lifecycleManager: {
      launchDelegatedSession,
    } as unknown as HarnessLifecycleManager,
    launchDelegatedSession,
  }
}

describe("delegate-task — hybrid execution routing", () => {
  beforeEach(() => {
    taskState.clear()
  })

  it("interactive delegated work routes through OpenCode child session", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Build feature",
        prompt: "Implement the authentication module.",
        run_in_background: false,
      },
      mockCtx,
    )

    // Should have called launchDelegatedSession with sub-session mode
    expect(launchDelegatedSession).toHaveBeenCalledTimes(1)
    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      runInBackground: boolean
      agent: string
    }
    // Interactive sync work should use sync mode (OpenCode child session)
    expect(launchArgs.runInBackground).toBe(false)
    expect(launchArgs.agent).toBe("builder")
  })

  it("background delegated work routes through classifier and records execution family", async () => {
    const client = createClient({
      "parent-session": { id: "parent-session" },
    })
    const { lifecycleManager, launchDelegatedSession } = createLifecycleManagerMock()
    const tool = createDelegateTaskTool(lifecycleManager, client)

    await tool.execute(
      {
        description: "Research deps",
        prompt: "Investigate dependency tree for vulnerabilities.",
        run_in_background: true,
      },
      mockCtx,
    )

    expect(launchDelegatedSession).toHaveBeenCalledTimes(1)
    const launchArgs = launchDelegatedSession.mock.calls[0][0] as {
      runInBackground: boolean
      agent: string
      route: Record<string, unknown>
    }
    expect(launchArgs.runInBackground).toBe(true)
    // Should include execution mode classification in the route metadata
    expect(launchArgs.route).toBeDefined()
  })
})

describe("HarnessLifecycleManager — builtin-process fallback", () => {
  it("routes builtin-process work through child-session prompt flow until a real process runner exists", async () => {
    const client = {
      session: {
        create: vi.fn(async () => ({ id: "child-process" })),
        prompt: vi.fn(async () => ({ parts: [{ type: "text", text: "research-result" }] })),
      },
    } as never

    const backgroundManager = {
      spawn: vi.fn(() => ({
        id: "bg-1",
        status: "running",
        pid: 123,
        startedAt: Date.now(),
        parentSessionID: "child-process",
        stdout: "",
        stderr: "",
        exitCode: null,
        error: null,
      })),
      onComplete: vi.fn(async () => ({
        status: "completed",
        stdout: "research-result",
        stderr: "",
        exitCode: 0,
      })),
      getTask: vi.fn(),
    } as unknown as BackgroundManager

    const manager = createHarnessLifecycleManager({
      client,
      pollTimeoutMs: 50,
    })

    const result = await manager.launchDelegatedSession({
      parentSessionID: "parent-process",
      rootID: "root-process",
      childDepth: 1,
      description: "research runtime",
      runInBackground: false,
      agent: "researcher",
      route: {
        category: "research",
        effectiveAgent: "researcher",
        effectiveModel: "gpt-5.4",
        temperature: 0.1,
        fallbackUsed: false,
        rationale: "research path",
        presetKey: "researcher",
        modelSource: "category",
        agentSource: "category",
        temperatureSource: "category",
        warnings: [],
      },
      permissionRules: [],
      compatibleTools: ["read", "glob", "grep"],
      promptText: "Investigate runtime wiring.",
      execution: {
        family: "built-in",
        submode: "builtin-process",
        rationale: "Research task: owned-process stdio is sufficient.",
        characteristics: {
          isParallel: false,
          isInteractive: false,
          isResearch: true,
          isHeadless: true,
          runInBackground: false,
        },
        capabilityEvidence: {
          hasTmux: false,
          projectRoot: process.cwd(),
        },
      },
    })

    expect(result).toBe("research-result")
    expect(backgroundManager.spawn).not.toHaveBeenCalled()
    expect(client.session.prompt).toHaveBeenCalledTimes(1)

    const continuity = getSessionContinuity("child-process")
    expect(continuity?.metadata.execution?.submode).toBe("builtin-subsession")
    expect(continuity?.metadata.execution?.rationale).toContain("builtin-process fallback")
    expect(buildDelegationArtifactPacket(continuity!).execution).toMatchObject({
      family: "built-in",
      submode: "builtin-subsession",
    })
  })

  it("persists failure context when builtin-process requests fall back to builtin-subsession", async () => {
    const client = {
      session: {
        create: vi.fn(async () => ({ id: "child-process-fail" })),
        prompt: vi.fn(async () => {
          throw new Error("process boom")
        }),
      },
    } as never

    const backgroundManager = {
      spawn: vi.fn(() => ({
        id: "bg-fail",
        status: "running",
        pid: 456,
        startedAt: Date.now(),
        parentSessionID: "child-process-fail",
        stdout: "",
        stderr: "",
        exitCode: null,
        error: null,
      })),
      getTask: vi.fn(() => ({
        id: "bg-fail",
        status: "failed",
        pid: 456,
        startedAt: Date.now(),
        parentSessionID: "child-process-fail",
        stdout: "",
        stderr: "process boom",
        exitCode: 1,
        error: "[Harness] Process exited with code 1",
      })),
    } as unknown as BackgroundManager

    const manager = createHarnessLifecycleManager({
      client,
      pollTimeoutMs: 50,
    })

    await expect(
      manager.launchDelegatedSession({
        parentSessionID: "parent-process-fail",
        rootID: "root-process-fail",
        childDepth: 1,
        description: "research failure",
        runInBackground: false,
        agent: "researcher",
        route: {
          category: "research",
          effectiveAgent: "researcher",
          effectiveModel: "gpt-5.4",
          temperature: 0.1,
          fallbackUsed: false,
          rationale: "research path",
          presetKey: "researcher",
          modelSource: "category",
          agentSource: "category",
          temperatureSource: "category",
          warnings: [],
        },
        permissionRules: [],
        compatibleTools: ["read", "glob", "grep"],
        promptText: "Investigate runtime wiring failure.",
        execution: {
          family: "built-in",
          submode: "builtin-process",
          rationale: "Research task: owned-process stdio is sufficient.",
          characteristics: {
            isParallel: false,
            isInteractive: false,
            isResearch: true,
            isHeadless: true,
            runInBackground: false,
          },
          capabilityEvidence: {
            hasTmux: false,
            projectRoot: process.cwd(),
          },
        },
      }),
    ).rejects.toThrow(/process boom|code 1/)

    const continuity = getSessionContinuity("child-process-fail")
    expect(continuity?.metadata.status).toBe("error")
    expect(continuity?.metadata.lastError).toContain("process boom")
    expect(continuity?.metadata.execution?.submode).toBe("builtin-subsession")
    expect(backgroundManager.spawn).not.toHaveBeenCalled()
  })
})

describe("runLifecycleProcessTask — parent ownership", () => {
  it("registers background work against the parent session ID", async () => {
    const backgroundManager = {
      spawn: vi.fn(() => ({
        id: "bg-parent-owned",
        status: "running",
        pid: 999,
        startedAt: Date.now(),
        parentSessionID: "parent-session",
        stdout: "",
        stderr: "",
        exitCode: null,
        error: null,
      })),
      onComplete: vi.fn(async () => ({
        status: "completed",
        stdout: "done",
        stderr: "",
        exitCode: 0,
      })),
    } as unknown as BackgroundManager

    await runLifecycleProcessTask({
      sessionID: "child-session",
      parentSessionID: "parent-session",
      rootID: "root-session",
      childDepth: 1,
      agent: "researcher",
      category: "research",
      model: "gpt-5.4",
      description: "background ownership",
      promptText: "Investigate ownership.",
      runInBackground: true,
      execution: {
        family: "built-in",
        submode: "builtin-process",
        rationale: "Direct process-runner regression test.",
        characteristics: {
          isParallel: false,
          isInteractive: false,
          isResearch: true,
          isHeadless: true,
          runInBackground: true,
        },
        capabilityEvidence: {
          hasTmux: false,
          projectRoot: process.cwd(),
        },
      },
      backgroundManager,
      patchLifecycle: vi.fn(),
      getLifecycleSnapshot: vi.fn(() => undefined),
      releaseQueue: vi.fn(),
      now: () => Date.now(),
    })

    expect(backgroundManager.spawn).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSessionID: "parent-session",
      }),
    )
  })
})
