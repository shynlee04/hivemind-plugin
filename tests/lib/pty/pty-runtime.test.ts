import { describe, expect, it, vi } from "vitest"

vi.mock("bun-pty", () => ({
  spawn: vi.fn(),
}))

describe("createPtyManagerIfSupported", () => {
  it("returns null when PTY support is unavailable", async () => {
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")
    vi.spyOn(PtyManager.prototype, "isSupported").mockReturnValue(false)

    const { createPtyManagerIfSupported } = await import("../../../src/lib/pty/pty-runtime.js")

    await expect(createPtyManagerIfSupported()).resolves.toBeNull()
  })
})
