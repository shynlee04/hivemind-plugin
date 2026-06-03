/**
 * State cache with TTL-based expiry and SHA-256 ETag support.
 *
 * Provides a lightweight in-memory cache for sidecar state snapshots,
 * session data, and delegations. Each entry stores the cached value,
 * a computed ETag for HTTP conditional requests, and an expiry timestamp.
 *
 * @module sidecar/server/cache
 */

import { createHash } from "node:crypto"

/** A single cache entry with ETag and TTL metadata. */
export interface CacheEntry<T> {
  data: T
  etag: string
  expiresAt: number
}

/** Cache category used to select the default TTL. */
export type CacheCategory = "snapshot" | "session" | "delegations" | "docs"

/**
 * In-memory state cache with per-category TTLs and SHA-256 ETag.
 *
 * All operations are synchronous and benefit from Node's single-threaded
 * event loop (no concurrent access races on the internal Map).
 *
 * @typeParam T - The type of data stored in each entry.
 *
 * @example
 * ```ts
 * const cache = new SidecarStateCache()
 * const etag = cache.set("sess-1", { id: "sess-1" }, "session")
 * const entry = cache.get<{ id: string }>("sess-1", "session")
 * cache.invalidate("all")
 * ```
 */
export class SidecarStateCache {
  readonly #entries = new Map<string, CacheEntry<unknown>>()
  readonly #defaultTtls: Record<CacheCategory, number> = {
    snapshot: 5000,
    session: 2000,
    delegations: 2000,
    docs: 2000,
  }

  /**
   * Retrieve a cached entry if it has not expired.
   *
   * Expired entries are evicted before returning `undefined`.
   *
   * @param key      - Cache key (typically a URL path or session ID).
   * @param category - Category for TTL selection (unused on read).
   * @returns The cached data, or `undefined` if missing/expired.
   */
  get<T>(key: string, _category?: CacheCategory): T | undefined {
    const entry = this.#entries.get(key)
    if (!entry) return undefined
    if (Date.now() >= entry.expiresAt) {
      this.#entries.delete(key)
      return undefined
    }
    return entry.data as T
  }

  /**
   * Store a value in the cache.
   *
   * Computes a SHA-256 ETag from `JSON.stringify(data)`.
   *
   * @param key      - Cache key.
   * @param data     - Value to cache.
   * @param category - Category used to select the default TTL.
   * @returns The computed ETag (strong, quoted per HTTP spec).
   * @throws `[Harness]` on serialisation failure.
   */
  set<T>(key: string, data: T, category: CacheCategory = "session"): string {
    const etag = this.#computeEtag(data)
    const ttl = this.#defaultTtls[category]
    this.#entries.set(key, {
      data,
      etag,
      expiresAt: Date.now() + ttl,
    })
    return etag
  }

  /**
   * Invalidate all entries matching a category or all entries.
   *
   * When `category` is `"all"` the entire cache is cleared.
   *
   * @param category - Category to evict, or `"all"` for full clear.
   */
  invalidate(category: CacheCategory | "all"): void {
    if (category === "all") {
      this.#entries.clear()
      return
    }
    // Per-category invalidation: we don't store category per entry,
    // so "all" is the primary invalidation path. Per-category clears
    // all entries as a conservative fallback.
    this.#entries.clear()
  }

  /**
   * Compute a strong SHA-256 ETag for the given data.
   *
   * @param data - Serializable value.
   * @returns Hex-encoded SHA-256 digest, quoted as a strong ETag.
   * @throws `[Harness]` if the value cannot be serialised.
   */
  #computeEtag(data: unknown): string {
    const json = JSON.stringify(data)
    const hash = createHash("sha256").update(json).digest("hex")
    return `"${hash}"`
  }
}
