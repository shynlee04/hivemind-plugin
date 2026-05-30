import type { ContinuityStoreFile } from "../../shared/types.js"

/**
 * Module-level cache for the continuity store files, keyed by file path.
 * Extracted from continuity/index.ts for explicit test reset support.
 * @internal Used exclusively by continuity/index.ts for in-memory caching.
 */
const storeCache = new Map<string, ContinuityStoreFile>()

/**
 * Returns the current cached continuity store for the given path, or `undefined`.
 */
export function getStoreCache(filePath?: string): ContinuityStoreFile | undefined {
  return storeCache.get(filePath || "default")
}

/**
 * Stores a continuity store value in the module-level cache for the given path.
 * If called with one argument (e.g. setStoreCache(cache)), uses 'default' key.
 *
 * @param filePathOrCache - The path to the continuity file, or the cache itself.
 * @param cache - The continuity store file to cache (when path is provided).
 */
export function setStoreCache(filePathOrCache: string | ContinuityStoreFile, cache?: ContinuityStoreFile): void {
  if (typeof filePathOrCache === "string") {
    if (!cache) {
      throw new Error("[Harness] Cache object is required when filePath is specified")
    }
    storeCache.set(filePathOrCache, cache)
  } else {
    storeCache.set("default", filePathOrCache)
  }
}

/**
 * Returns all currently cached continuity stores.
 */
export function getAllStoreCaches(): Map<string, ContinuityStoreFile> {
  return storeCache
}

/**
 * Resets the cache, simulating a cold-start condition.
 * Used in tests to clear module-level cache between test runs.
 */
export function resetStoreCache(): void {
  storeCache.clear()
}
