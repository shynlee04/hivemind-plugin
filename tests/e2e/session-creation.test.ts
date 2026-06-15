// Evidence label: runtime-truthful (L1)
// Phase AUDIT-04.02.4 REQ-05: 3 runtime scenarios for session creation
// T-14: Scenario 1 - ECONNREFUSED proof (no server on 4096)
// T-15: Scenario 2 - sidecar degraded (probeHealth returns 'sidecar')
// T-16: Scenario 3 - real OpenCode server (probeHealth returns 'opencode-server' + V2 create succeeds)
// T-20: Evidence files date-stamped

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { execSync } from "node:child_process"
import { spawnMockSidecar, spawnOpenCodeServer, type E2EServer } from "./setup.js"

const HAS_OPENCODE = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("node:child_process") as typeof import("node:child_process")
    execSync("opencode --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
})()

describe("REQ-05: 3 runtime scenarios for session creation", () => {
  describe("Scenario 1: No server (ECONNREFUSED)", () => {
    it("[T-14a] localhost:4097 (old sidecar range) is no longer bound — ECONNREFUSED", async () => {
      // Port 4097 was in OLD sidecar pool 4096..4105. After bump to 4106..4115,
      // 4097 should be FREE (ECONNREFUSED) when nothing else is bound there.
      const result = await fetch("http://localhost:4097/global/health").catch((err: Error) => {
        return { error: err }
      })
      expect("error" in result).toBe(true)
      const errMsg = (result as { error: Error }).error?.message ?? ""
      expect(errMsg.toLowerCase()).toMatch(/fetch failed|econnrefused/)
    }, 10_000)

    it("[T-14b] localhost:4096 does NOT respond with sidecar shape ({status,uptime})", async () => {
      // T-02: sidecar should no longer be on 4096. If something else is there
      // (e.g., OpenCode TUI), it must NOT return the sidecar response shape.
      const response = await fetch("http://localhost:4096/global/health").catch(
        () => null,
      )
      if (!response) {
        // ECONNREFUSED — sidecar definitely not there
        return
      }
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
      // If we got a 2xx with status="ok" and uptime is a number, that's the sidecar shape
      if (response.ok) {
        expect(body).not.toMatchObject({ status: "ok" })
      }
      // Either ECONNREFUSED, or 404/4xx/5xx, or a body that doesn't look like sidecar
    }, 10_000)

    it("[T-14c] probeHealth() returns 'unreachable' for a definitively closed port", async () => {
      // Use a port we know is unused (high random ephemeral port)
      const { probeHealth } = await import("../../src/shared/session-api.js")
      const result = await probeHealth("http://localhost:1")
      expect(result).toBe("unreachable")
    }, 10_000)
  })

  describe("Scenario 2: Sidecar degraded (probeHealth returns 'sidecar')", () => {
    let sidecar: E2EServer | null = null

    beforeAll(async () => {
      sidecar = await spawnMockSidecar(4106)
    }, 30_000)

    afterAll(async () => {
      if (sidecar) await sidecar.kill()
    })

    it("[T-15] probeHealth() returns 'sidecar' when baseUrl serves sidecar shape", async () => {
      const { probeHealth } = await import("../../src/shared/session-api.js")
      const result = await probeHealth(sidecar!.baseUrl)
      expect(result).toBe("sidecar")
    }, 10_000)
  })

  describe("Scenario 3: Real OpenCode server (V2 client works)", () => {
    let server: E2EServer | null = null

    beforeAll(async () => {
      if (!HAS_OPENCODE) {
        throw new Error("opencode binary not found in PATH")
      }
      server = await spawnOpenCodeServer(0) // port 14096
    }, 30_000)

    afterAll(async () => {
      if (server) await server.kill()
    })

    it("[T-16a] probeHealth() returns 'opencode-server' when baseUrl serves real server", async () => {
      const { probeHealth } = await import("../../src/shared/session-api.js")
      const result = await probeHealth(server!.baseUrl)
      expect(result).toBe("opencode-server")
    }, 10_000)

    it.skipIf(!HAS_OPENCODE)("[T-16b] V2 client creates a session against real server", async () => {
      const { createOpencodeClient } = await import("@opencode-ai/sdk/v2")
      const client = createOpencodeClient({ baseUrl: server!.baseUrl })
      const session = await client.session.create({ title: "e2e-test-session" })
      expect(session.data?.id).toBeTruthy()
      if (session.data?.id) {
        await client.session.abort({ sessionID: session.data.id }).catch(() => undefined)
      }
    }, 30_000)
  })
})

// Defense-in-depth: scrub any leaked test sessions from production DB.
// Should not happen with isolated HOME in setup.ts, but this is a safety net
// in case the env override fails or the spawned server falls back to prod.
afterAll(() => {
  try {
    const home = process.env.HOME || "/Users/apple"
    const dbPath = `${home}/.local/share/opencode/opencode.db`
    execSync(`sqlite3 "${dbPath}" "DELETE FROM session WHERE title='e2e-test-session';"`, {
      stdio: "ignore",
    })
  } catch {
    // Best-effort cleanup. sqlite3 may not be installed or DB may not exist.
  }
})
