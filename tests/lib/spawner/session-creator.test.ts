import { describe, expect, it, vi } from "vitest"

const createSession = vi.fn()

vi.mock("../../../src/lib/session-api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/lib/session-api.js")>()
  return {
    ...actual,
    createSession,
  }
})

describe("spawnDelegatedSession", () => {
  it("creates a parent-linked child session with the write-capable permission profile", async () => {
    createSession.mockResolvedValueOnce({ id: "ses_child_1" })
    const { spawnDelegatedSession } = await import("../../../src/lib/spawner/session-creator.js")

    const client = { session: { create: vi.fn() } }
    const request = {
      parentSessionId: "ses_parent_1",
      agent: "builder",
      title: "Implement canonical queue keys",
      prompt: "do the work",
      workingDirectory: "/tmp/worktree",
      executionMode: "pty" as const,
      safetyCeilingMs: 60_000,
      permissionProfile: {
        mode: "write-capable" as const,
        tools: ["read", "edit", "write", "bash", "glob", "grep"] as const,
      },
    }

    const result = await spawnDelegatedSession({
      client,
      request,
    })

    expect(createSession).toHaveBeenCalledWith(client, {
      parentID: request.parentSessionId,
      title: request.title,
      directory: request.workingDirectory,
      permission: [
        { permission: "read", pattern: "*", action: "allow" },
        { permission: "edit", pattern: "*", action: "allow" },
        { permission: "write", pattern: "*", action: "allow" },
        { permission: "bash", pattern: "*", action: "allow" },
        { permission: "glob", pattern: "*", action: "allow" },
        { permission: "grep", pattern: "*", action: "allow" },
        { permission: "delegate-task", pattern: "*", action: "deny" },
        { permission: "task", pattern: "*", action: "deny" },
      ],
    })
    expect(result).toEqual({
      childSession: { id: "ses_child_1" },
      childSessionId: "ses_child_1",
    })
  })
})
