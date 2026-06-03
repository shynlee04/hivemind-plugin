import { describe, it, expect } from "vitest"

describe("dashboard-shell", () => {
  describe("panel definitions", () => {
    it("should have 4 panels defined in constants", async () => {
      const { PANELS } = await import("../src/lib/constants")
      expect(PANELS.length).toBe(4)
      const ids = PANELS.map((p) => p.id)
      expect(ids).toContain("sessions")
      expect(ids).toContain("delegation")
      expect(ids).toContain("mems")
      expect(ids).toContain("control")
    })

    it("should have unique panel IDs", async () => {
      const { PANELS } = await import("../src/lib/constants")
      const ids = PANELS.map((p) => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("should have labels and descriptions for all panels", async () => {
      const { PANELS } = await import("../src/lib/constants")
      for (const panel of PANELS) {
        expect(panel.label).toBeTruthy()
        expect(panel.description).toBeTruthy()
      }
    })
  })

  describe("DashboardShell export", () => {
    it("should export DashboardShell component", async () => {
      const mod = await import("../src/components/dashboard-shell")
      expect(mod.DashboardShell).toBeDefined()
      expect(typeof mod.DashboardShell).toBe("function")
    })
  })
})
