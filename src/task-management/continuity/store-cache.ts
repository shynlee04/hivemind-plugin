import type { ContinuityStoreFile } from "../../shared/types.js"

/**
 * Module-level cache for the continuity store file.
 * Extracted from continuity/index.ts for explicit test reset support.
 * @internal Used exclusively by continuity/index.ts for in-memory caching.
 */
let storeCache: ContinuityStoreFile | undefined

/**
 * Returns the current cached continuity store, or `undefined` if no cache has
 * been set (cold start).
 */
export function getStoreCache(): ContinuityStoreFile | undefined {
  return storeCache
}

/**
 * Stores a continuity store value in the module-level cache.
 *
 * @param cache - The continuity store file to cache.
 */
export function setStoreCache(cache: ContinuityStoreFile): void {
  storeCache = cache
}

/**
 * Resets the cache to `undefined`, simulating a cold-start condition.
 * Used in tests to clear module-level cache between test runs without
 * requiring `vi.resetModules()`.
 */
export function resetStoreCache(): void {
  storeCache = undefined
}
