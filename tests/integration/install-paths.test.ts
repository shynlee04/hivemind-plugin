/**
 * Install-path invariant tests.
 *
 * Codifies the two supported install paths so a regression to the bridge
 * file or the package.json plugin subpath is caught by `npm test`.
 *
 * Public seams under test (per tests/AGENTS.md §Public-Interface Discipline):
 *   - The `HivemindControlPlane` Plugin object exported from src/plugin.ts
 *     (the composition root) — the same surface OpenCode loads.
 *   - The `dist/plugin.js` artifact (the npm-distribution surface).
 *   - The package.json `exports["./plugin"]` subpath declaration.
 *
 * Evidence label: `runtime-truthful` (real imports of real modules).
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, it, expect } from "vitest"

const PROJECT_ROOT = process.cwd()
const BRIDGE_PATH = resolve(PROJECT_ROOT, ".opencode/plugins/harness-control-plane.ts")
const DIST_PLUGIN_PATH = resolve(PROJECT_ROOT, "dist/plugin.js")
const PKG_JSON_PATH = resolve(PROJECT_ROOT, "package.json")

describe("install paths", () => {
  describe("contributor path (local clone, no build)", () => {
    it("bridge file exists at the OpenCode plugin auto-load path", () => {
      expect(existsSync(BRIDGE_PATH)).toBe(true)
    })

    it("bridge imports from src/plugin.ts (Bun-native TS), not dist/plugin.js", async () => {
      const bridgeSource = readFileSync(BRIDGE_PATH, "utf-8")
      // Imports the source — Bun can run this without a build step.
      expect(bridgeSource).toMatch(/from\s+["']\.\.\/\.\.\/src\/plugin\.ts["']/)
      // Must NOT require a pre-built dist/ (the pre-fix regression).
      expect(bridgeSource).not.toMatch(/from\s+["']\.\.\/\.\.\/dist\/plugin\.js["']/)
    })

    it("src/plugin.ts exports HivemindControlPlane", async () => {
      const mod = await import("../../src/plugin.ts")
      expect(typeof mod.HivemindControlPlane).toBe("function")
    })
  })

  describe("consumer path (npm install hivemind-3.0)", () => {
    it("dist/plugin.js exists after build (npm-distribution artifact)", () => {
      expect(existsSync(DIST_PLUGIN_PATH)).toBe(true)
    })

    it("dist/plugin.js exports HivemindControlPlane as a function", async () => {
      const mod = await import("../../dist/plugin.js")
      expect(typeof mod.HivemindControlPlane).toBe("function")
    })

    it("package.json declares the ./plugin subpath export", () => {
      const pkg = JSON.parse(readFileSync(PKG_JSON_PATH, "utf-8")) as {
        name: string
        exports: Record<string, { import: string }>
      }
      expect(pkg.name).toBe("hivemind-3.0")
      expect(pkg.exports["./plugin"]).toBeDefined()
      expect(pkg.exports["./plugin"].import).toMatch(/\/dist\/plugin\.js$/)
    })
  })
})
