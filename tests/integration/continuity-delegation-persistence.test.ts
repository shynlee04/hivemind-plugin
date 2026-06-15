import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, it, expect } from "vitest"

describe("integration — delegation persistence", () => {
  let stateDir: string

  beforeAll(() => {
    stateDir = mkdtempSync(join(tmpdir(), "continuity-delegation-persistence-"))
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterAll(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(stateDir, { recursive: true, force: true })
  })
  it("imports delegation-persistence functions", async () => {
    const mod = await import("../../src/task-management/continuity/delegation-persistence.js")
    expect(typeof mod.persistDelegations).toBe("function")
    expect(typeof mod.readPersistedDelegations).toBe("function")
  })

  it("persistDelegations is callable with empty array", async () => {
    const mod = await import("../../src/task-management/continuity/delegation-persistence.js")
    // persistDelegations may be sync or async - handle both
    const result = mod.persistDelegations([])
    if (result instanceof Promise) {
      await expect(result).resolves.toBeUndefined()
    } else {
      expect(result).toBeUndefined()
    }
  })

  it("readPersistedDelegations returns array", async () => {
    const mod = await import("../../src/task-management/continuity/delegation-persistence.js")
    const result = await mod.readPersistedDelegations()
    expect(Array.isArray(result)).toBe(true)
  })

  it("store-cache exports getStoreCache/setStoreCache/resetStoreCache API", async () => {
    const mod = await import("../../src/task-management/continuity/store-cache.js")
    mod.resetStoreCache()
    expect(typeof mod.getStoreCache).toBe("function")
    expect(typeof mod.setStoreCache).toBe("function")
    expect(typeof mod.resetStoreCache).toBe("function")
  })

  it("getStoreCache returns undefined after reset", async () => {
    const mod = await import("../../src/task-management/continuity/store-cache.js")
    mod.resetStoreCache()
    expect(mod.getStoreCache()).toBeUndefined()
  })
})
