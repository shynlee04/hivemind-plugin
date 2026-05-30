import { describe, expect, it, vi } from "vitest"

const createSession = vi.fn()

vi.mock("../../../src/shared/session-api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../src/shared/session-api.js")>()
  return {
    ...actual,
    createSession,
  }
})

describe("spawnDelegatedSession", () => {
  it("creates a parent-linked child session without unsupported session.create permission fields", async () => {
    createSession.mockResolvedValueOnce({ id: "ses_child_1" })
    const { spawnDelegatedSession } = await import("../../../src/coordination/spawner/session-creator.js")

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
    })
    expect(result).toEqual({
      childSession: { id: "ses_child_1" },
      childSessionId: "ses_child_1",
      allowedTools: request.permissionProfile.tools,
    })
  })
})
