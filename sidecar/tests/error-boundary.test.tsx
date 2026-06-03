import { describe, it, expect } from "vitest"

describe("error-boundary", () => {
  describe("export", () => {
    it("should export ErrorBoundary component", async () => {
      const mod = await import("../src/components/error-boundary")
      expect(mod.ErrorBoundary).toBeDefined()
      expect(typeof mod.ErrorBoundary).toBe("function")
    })
  })
})
