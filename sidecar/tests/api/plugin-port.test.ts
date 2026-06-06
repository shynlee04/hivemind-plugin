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
import { describe, it, expect, beforeEach, vi } from "vitest"
import { readFile } from "node:fs/promises"

// Mock node:fs/promises BEFORE the route import so the route's readFile
// is the mocked vi.fn() at module load time.
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}))

// Route file does not exist yet (RED state). Import will fail at module
// load time, surfacing 3 failing tests in the report.
import { GET } from "../../src/app/api/plugin-port/route"

describe("GET /api/plugin-port", () => {
  beforeEach(() => {
    // Reset both call history and pending mock implementations to ensure
    // each test configures its own readFile behavior cleanly.
    vi.resetAllMocks()
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
})
