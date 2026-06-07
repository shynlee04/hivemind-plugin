/**
 * RED test: assert src/plugin.ts wires all 4 sidecar route factories
 * into the createSidecarServer call.
 *
 * Why this test exists (Bug evidence, 2026-06-07):
 *   The Hivemind plugin composition root at src/plugin.ts:165 calls
 *   createSidecarServer({registry, ssePool, projectDirectory}) WITHOUT
 *   a `routes` argument. The factory then constructs
 *   `new SidecarRouter([], registry)` — an empty route table. Every
 *   request falls through to the 404 catch-all in SidecarRouter.handle().
 *   This is why the browser UAT sees 404 on /api/state/sessions, etc.
 *
 *   The 6 route files in src/sidecar/server/routes/ (state, tools,
 *   catalog, events, sessions, types) are well-defined orphan code —
 *   their `createXxxRoutes(registry)` factories are exported but never
 *   invoked from src/. The canonical wiring pattern is already in the
 *   test helper `createServer` at src/sidecar/server/handler.ts:269-298.
 *
 *   This test is a code-level invariant guard: it reads src/plugin.ts
 *   as text and asserts the 4 factories are imported and the routes
 *   array is passed to createSidecarServer. If anyone deletes the
 *   wiring, this test catches it.
 *
 * @see /Users/apple/hivemind-plugin-private/.hivemind/planning/gui-loader-synthesis-2026-06-07/00-landscape.md
 */

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PLUGIN_TS_PATH = join(__dirname, "..", "..", "src", "plugin.ts")

describe("src/plugin.ts sidecar route wiring", () => {
  const src = readFileSync(PLUGIN_TS_PATH, "utf8")

  it("imports createStateRoutes from the state route module", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*createStateRoutes[^}]*\}\s*from\s*["'][^"']*routes\/state/,
    )
  })

  it("imports createToolsRoutes from the tools route module", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*createToolsRoutes[^}]*\}\s*from\s*["'][^"']*routes\/tools/,
    )
  })

  it("imports createCatalogRoutes from the catalog route module", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*createCatalogRoutes[^}]*\}\s*from\s*["'][^"']*routes\/catalog/,
    )
  })

  it("imports createEventsRoute from the events route module", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*createEventsRoute[^}]*\}\s*from\s*["'][^"']*routes\/events/,
    )
  })

  it("passes a routes argument to createSidecarServer", () => {
    // The call site must include a `routes:` property (not the empty object).
    expect(src).toMatch(/createSidecarServer\s*\(\s*\{[\s\S]*?routes:\s*\w+/)
  })
})
