import { describe, expect, it, vi } from "vitest"

describe("resolveParentWorkingDirectory", () => {
  it("prefers the explicit context directory", async () => {
    const { resolveParentWorkingDirectory } = await import("../../../src/lib/spawner/parent-directory.js")

    expect(
      resolveParentWorkingDirectory({
        contextDirectory: "/context",
        worktree: "/worktree",
        parentSessionDirectory: "/parent",
      }),
    ).toBe("/context")
  })

  it("falls back to the worktree before the parent session directory", async () => {
    const { resolveParentWorkingDirectory } = await import("../../../src/lib/spawner/parent-directory.js")

    expect(
      resolveParentWorkingDirectory({
        worktree: "/worktree",
        parentSessionDirectory: "/parent",
      }),
    ).toBe("/worktree")
  })

  it("falls back to the parent session directory before process.cwd()", async () => {
    const { resolveParentWorkingDirectory } = await import("../../../src/lib/spawner/parent-directory.js")

    expect(
      resolveParentWorkingDirectory({
        parentSessionDirectory: "/parent",
      }),
    ).toBe("/parent")
  })

  it("uses process.cwd() as the final fallback", async () => {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/process-cwd")
    const { resolveParentWorkingDirectory } = await import("../../../src/lib/spawner/parent-directory.js")

    expect(resolveParentWorkingDirectory({})).toBe("/process-cwd")

    cwdSpy.mockRestore()
  })
})
