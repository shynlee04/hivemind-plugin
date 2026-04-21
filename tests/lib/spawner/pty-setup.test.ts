import { describe, expect, it, vi } from "vitest"

describe("startDelegationRuntime", () => {
  it("returns PTY execution mode when PTY setup succeeds", async () => {
    const { startDelegationRuntime } = await import("../../../src/lib/spawner/pty-setup.js")

    const ptyManager = {
      spawn: vi.fn().mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp/worktree",
      }),
    }

    const spawnHeadless = vi.fn().mockResolvedValue({ childSessionId: "ses_child_1" })
    const request = {
      command: "opencode",
      args: ["run"],
      cwd: "/tmp/worktree",
      env: { TERM: "xterm-256color" },
    }

    await expect(
      startDelegationRuntime({ ptyManager, request, spawnHeadless }),
    ).resolves.toEqual({
      childSessionId: "pty-session-1",
      executionMode: "pty",
      workingDirectory: "/tmp/worktree",
      ptySessionId: "pty-session-1",
    })

    expect(spawnHeadless).not.toHaveBeenCalled()
  })

  it("falls back to headless mode when PTY setup throws", async () => {
    const { startDelegationRuntime } = await import("../../../src/lib/spawner/pty-setup.js")

    const ptyManager = {
      spawn: vi.fn(() => {
        throw new Error("PTY unavailable")
      }),
    }

    const spawnHeadless = vi.fn().mockResolvedValue({ childSessionId: "ses_child_2" })
    const request = {
      command: "opencode",
      args: ["run"],
      cwd: "/tmp/worktree",
      env: { TERM: "xterm-256color" },
    }

    await expect(
      startDelegationRuntime({ ptyManager, request, spawnHeadless }),
    ).resolves.toEqual({
      childSessionId: "ses_child_2",
      executionMode: "headless",
      workingDirectory: "/tmp/worktree",
      fallbackReason: "PTY unavailable",
    })
  })
})
