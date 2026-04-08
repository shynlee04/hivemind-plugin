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
import { BackgroundManager } from "../../src/lib/background-manager.js"

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
