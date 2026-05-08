import { describe, expect, it, vi } from "vitest"

vi.mock("bun-pty", () => ({
  spawn: vi.fn(),
}))

describe("createPtyManagerIfSupported", () => {
  it("returns null when PTY support is unavailable", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")
    vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(false)

    const { createPtyManagerIfSupported } = await import("../../../src/features/background-command/pty/pty-runtime.js")

    await expect(createPtyManagerIfSupported()).resolves.toBeNull()
  })

  it("returns a PtyManager when PTY support is available", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")
    vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(true)

    const { createPtyManagerIfSupported } = await import("../../../src/features/background-command/pty/pty-runtime.js")

    const result = await createPtyManagerIfSupported()
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(PtyManager)
  })

  it("returns null when PTY detection throws an exception", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")
    vi.spyOn(PtyManager.prototype, "isSupported").mockImplementation(() => {
      throw new Error("bun-pty not available")
    })

    const { createPtyManagerIfSupported } = await import("../../../src/features/background-command/pty/pty-runtime.js")

    await expect(createPtyManagerIfSupported()).resolves.toBeNull()
  })
})
