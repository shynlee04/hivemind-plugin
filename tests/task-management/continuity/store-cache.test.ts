import { describe, it, expect, beforeEach } from "vitest"
import { getStoreCache, setStoreCache, resetStoreCache } from "../../../src/task-management/continuity/store-cache.js"

describe("store-cache", () => {
  beforeEach(() => {
    resetStoreCache()
  })

  it("should return undefined when no cache is set", () => {
    expect(getStoreCache()).toBeUndefined()
  })

  it("should store and retrieve cached value", () => {
    const mockCache = { version: 1, sessions: {} } as any
    setStoreCache(mockCache)
    expect(getStoreCache()).toBe(mockCache)
  })

  it("should clear cache after reset", () => {
    setStoreCache({ version: 1, sessions: {} } as any)
    resetStoreCache()
    expect(getStoreCache()).toBeUndefined()
  })

  it("should allow setting new cache after reset", () => {
    resetStoreCache()
    const mockCache = { version: 2, sessions: {} } as any
    setStoreCache(mockCache)
    expect(getStoreCache()).toBe(mockCache)
  })
})
