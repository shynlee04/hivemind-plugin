/**
 * RED tests for Wave 3 — API-first port discovery.
 *
 * These tests assert the contract of the NEW Next.js route handler at
 * `src/app/api/plugin-port/route.ts`, which exposes the canonical plugin
 * port (written by `src/sidecar/server/factory.ts:136-140`) to the
 * browser via a same-origin HTTP GET.
 *
 * Expected RED state at commit time: route file does not exist → 3 tests
 * fail with "Cannot find module" import error. The implementation is the
 * GREEN step (next commit) which adds the route file.
 *
 * Companion to:
 *   - src/sidecar/server/factory.ts (writes port file)
 *   - sidecar/src/lib/plugin-client.ts (will call this API in GREEN step)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"

// Mock node:fs/promises BEFORE the route import so the route's readFile
// is the mocked vi.fn() at module load time.
//
// Vitest 4 (ESM-strict) requires both `default` and named exports on mocks
// of built-in node modules. We provide `readFile` as a named export (for
// `import { readFile } from "node:fs/promises"`) AND as a `default`
// property (to satisfy vitest's default-export check). The default object
// is never used by our route, but its presence prevents the module-load
// error.
vi.mock("node:fs/promises", () => {
  const readFile = vi.fn()
  return {
    default: { readFile },
    readFile,
  }
})

// Mock node:fs (sync) for the existsSync walk-up in resolveHivemindRoot.
vi.mock("node:fs", () => {
  const existsSync = vi.fn()
  return {
    default: { existsSync },
    existsSync,
  }
})

// Route file does not exist yet (RED state). Import will fail at module
// load time, surfacing 3 failing tests in the report.
import { GET } from "../../src/app/api/plugin-port/route"

describe("GET /api/plugin-port", () => {
  beforeEach(() => {
    // Reset both call history and pending mock implementations to ensure
    // each test configures its own readFile behavior cleanly.
    vi.resetAllMocks()
    // Pin the Hivemind project root for deterministic path resolution.
    // This bypasses the walk-up logic (which is exercised in its own
    // dedicated test below) and prevents tests from accidentally reading
    // the real .hivemind/ on the developer's machine.
    process.env.HIVEMIND_DIR = "/test/hivemind/root"
  })

  afterEach(() => {
    delete process.env.HIVEMIND_DIR
  })

  it("returns 200 with {port: 4099} when port file contains valid JSON", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ port: 4099 }),
    )

    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ port: 4099 })
  })

  it("returns 404 when port file is missing (ENOENT)", async () => {
    const err = Object.assign(
      new Error("ENOENT: no such file or directory, open 'port.json'"),
      { code: "ENOENT" as const },
    )
    vi.mocked(readFile).mockRejectedValueOnce(err)

    const response = await GET()

    expect(response.status).toBe(404)
  })

  it("returns 500 when port file contains invalid JSON structure (port is not a number)", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ port: "not-a-number" }),
    )

    const response = await GET()

    expect(response.status).toBe(500)
  })

  it("returns 500 when .hivemind/ cannot be located (no env var, walk-up returns null)", async () => {
    // Force the walk-up branch by deleting the env var. existsSync is
    // mocked to return false for all paths, so the walk reaches the
    // filesystem root without finding .hivemind/.
    delete process.env.HIVEMIND_DIR
    vi.mocked(existsSync).mockReturnValue(false)

    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual(
      expect.objectContaining({ error: "hivemind_root_not_found" }),
    )
  })
})
