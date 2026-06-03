import { describe, it, expect } from "vitest"

describe("loading", () => {
  describe("export", () => {
    it("should export default loading function", async () => {
      const mod = await import("../src/app/loading")
      expect(mod.default).toBeDefined()
      expect(typeof mod.default).toBe("function")
    })
  })
})
