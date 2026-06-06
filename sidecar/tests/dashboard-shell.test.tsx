import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

describe("dashboard-shell", () => {
  describe("panel definitions", () => {
    it("should have 4 panels defined in constants", async () => {
      const { PANELS } = await import("../src/lib/constants")
      expect(PANELS.length).toBe(4)
      const ids = PANELS.map((p) => p.id)
      // Panel IDs must match the directory structure under src/panels/
      // so that the dynamic import(`@panels/${id}`) resolves to a real module.
      expect(ids).toContain("session-explorer")
      expect(ids).toContain("delegation-dashboard")
      expect(ids).toContain("mems-browser")
      expect(ids).toContain("control-panel")
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

  /**
   * Bug #1 regression guard — panel id must match the directory name under
   * src/panels/. dashboard-shell.tsx does `await import(`@panels/${id}`)`
   * (tsconfig.json maps `@panels/*` -> `./src/panels/*`). A mismatch
   * causes ALL dynamic imports to fail, the useEffect to fall into the
   * infinite-loop path, and the UI to hang on "Loading..." forever.
   */
  describe("panel id ↔ directory mapping", () => {
    it("every PANELS.id has a corresponding directory under src/panels/", async () => {
      const { PANELS } = await import("../src/lib/constants")
      const panelsDir = path.resolve(__dirname, "../src/panels")
      for (const panel of PANELS) {
        const dirPath = path.join(panelsDir, panel.id)
        const exists = fs.existsSync(dirPath)
        expect(
          exists,
          `Missing directory for panel id "${panel.id}" at ${dirPath} — ` +
            `dynamic import(\`@panels/${panel.id}\`) would fail.`,
        ).toBe(true)
      }
    })

    it("every PANELS.id has a corresponding src/panels/<id>/index.tsx module", async () => {
      const { PANELS } = await import("../src/lib/constants")
      const panelsDir = path.resolve(__dirname, "../src/panels")
      for (const panel of PANELS) {
        const modulePath = path.join(panelsDir, panel.id, "index.tsx")
        const exists = fs.existsSync(modulePath)
        expect(
          exists,
          `Missing module for panel id "${panel.id}" at ${modulePath} — ` +
            `dynamic import(\`@panels/${panel.id}\`) would fail.`,
        ).toBe(true)
      }
    })

    it("DEFAULT_PANEL is a valid panel id from PANELS", async () => {
      const { PANELS, DEFAULT_PANEL } = await import("../src/lib/constants")
      const validIds = PANELS.map((p) => p.id)
      expect(validIds).toContain(DEFAULT_PANEL)
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
