import { describe, expect, it, vi } from "vitest"

const createSession = vi.fn()

vi.mock("../../../src/lib/session-api.js", () => ({
  createSession,
}))

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
        { permission: "read", action: "allow" },
        { permission: "edit", action: "allow" },
        { permission: "write", action: "allow" },
        { permission: "bash", action: "allow" },
        { permission: "glob", action: "allow" },
        { permission: "grep", action: "allow" },
        { permission: "delegate-task", action: "deny" },
        { permission: "task", action: "deny" },
      ],
    })
    expect(result).toEqual({
      childSession: { id: "ses_child_1" },
      childSessionId: "ses_child_1",
    })
  })
})
