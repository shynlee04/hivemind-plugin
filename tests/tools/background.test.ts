import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { BackgroundManager } from "../../src/lib/background-manager.js"
import { createBackgroundTool } from "../../src/tools/background/index.js"

const sessionOneCtx = {
  messageID: "message-1",
  sessionID: "session-1",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => {},
}

const sessionTwoCtx = {
  ...sessionOneCtx,
  sessionID: "session-2",
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

describe("background tool", () => {
  let manager: BackgroundManager
  let tool: ReturnType<typeof createBackgroundTool>

  beforeEach(() => {
    manager = new BackgroundManager()
    tool = createBackgroundTool(manager, process.cwd())
  })

  afterEach(async () => {
    for (const task of manager.listTasks()) {
      if (task.status === "running") {
        manager.kill(task.id)
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it("spawns a background task scoped to the calling session", async () => {
    const raw = await tool.execute(
      {
        action: "spawn",
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
      },
      sessionOneCtx,
    )

    const result = parseResult(raw)
    const task = result.data as { id: string; parentSessionID: string; status: string }

    expect(task.parentSessionID).toBe("session-1")
    expect(task.status).toBe("running")

    const listRaw = await tool.execute({ action: "list" }, sessionOneCtx)
    const listResult = parseResult(listRaw)
    const tasks = listResult.data as Array<{ id: string }>

    expect(tasks.map((entry) => entry.id)).toContain(task.id)
  })

  it("lists only tasks owned by the calling session", async () => {
    await tool.execute(
      {
        action: "spawn",
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
      },
      sessionOneCtx,
    )
    await tool.execute(
      {
        action: "spawn",
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
      },
      sessionTwoCtx,
    )

    const raw = await tool.execute({ action: "list" }, sessionOneCtx)
    const result = parseResult(raw)
    const tasks = result.data as Array<{ parentSessionID: string }>

    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.parentSessionID).toBe("session-1")
  })

  it("waits for a task to complete and returns terminal output", async () => {
    const spawnRaw = await tool.execute(
      {
        action: "spawn",
        command: "node",
        args: ["-e", "process.stdout.write('done')"],
      },
      sessionOneCtx,
    )
    const spawnResult = parseResult(spawnRaw)
    const task = spawnResult.data as { id: string }

    const waitRaw = await tool.execute(
      { action: "wait", task_id: task.id },
      sessionOneCtx,
    )
    const waitResult = parseResult(waitRaw)
    const finalResult = waitResult.data as { status: string; stdout: string }

    expect(finalResult.status).toBe("completed")
    expect(finalResult.stdout).toContain("done")
  })

  it("rejects access to tasks owned by another session", async () => {
    const spawnRaw = await tool.execute(
      {
        action: "spawn",
        command: "node",
        args: ["-e", "setTimeout(()=>{},60000)"],
      },
      sessionOneCtx,
    )
    const spawnResult = parseResult(spawnRaw)
    const task = spawnResult.data as { id: string }

    await expect(
      tool.execute({ action: "cancel", task_id: task.id }, sessionTwoCtx),
    ).rejects.toThrow("[Harness] Background task not found")
  })
})
