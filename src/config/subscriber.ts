/**
 * Config Subscriber — lazy-load + cache + fallback for Hivemind configs.
 *
 * Provides a thin cache wrapper around `readConfigs()` from the schema kernel.
 * First call reads from disk; subsequent calls return the cached value until
 * `invalidateConfigCache()` is called.
 *
 * Design principles:
 * - **Lazy-load:** config is not read until first access.
 * - **Cache-per-project:** cache is keyed by `projectRoot` to support multi-project scenarios.
 * - **Fallback:** missing or invalid config files return defaults (never crashes).
 * - **Invalidation:** `invalidateConfigCache()` forces re-read on next `getConfig()`.
 *
 * @module config-subscriber
 * @see src/schema-kernel/hivemind-configs.schema.ts for schema definition
 */

import { readConfigs, getDefaultConfigs } from "../schema-kernel/hivemind-configs.schema.js"
import type { HivemindConfigs } from "../schema-kernel/hivemind-configs.schema.js"

/** Cached configs map, keyed by projectRoot. */
const configCache = new Map<string, HivemindConfigs>()

/** Latest project root that was requested. */
let lastProjectRoot: string | null = null

/**
 * Reads configs from disk with caching. First call reads from disk,
 * subsequent calls return cached value unless `invalidateConfigCache()` is called.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns The parsed Hivemind config, or defaults if missing/invalid.
 *
 * @example
 * ```typescript
 * const config = getConfig("/path/to/project")
 * console.log(config.mode) // "expert-advisor"
 * console.log(config.workflow.research) // true
 * ```
 */
export function getConfig(projectRoot: string): HivemindConfigs {
  if (configCache.has(projectRoot)) {
    return configCache.get(projectRoot)!
  }
  const config = readConfigs(projectRoot)
  configCache.set(projectRoot, config)
  lastProjectRoot = projectRoot
  return config
}

/**
 * Returns the cached config without disk read. Returns defaults if no cache.
 *
 * @param projectRoot - Optional project root path.
 * @returns The cached config, or defaults if the cache is cold.
 *
 * @example
 * ```typescript
 * // After getConfig() has been called at least once:
 * const cached = getCachedConfig()
 * console.log(cached.conversation_language) // "en"
 * ```
 */
export function getCachedConfig(projectRoot?: string): HivemindConfigs {
  if (projectRoot && configCache.has(projectRoot)) {
    return configCache.get(projectRoot)!
  }
  if (lastProjectRoot && configCache.has(lastProjectRoot)) {
    return configCache.get(lastProjectRoot)!
  }
  return getDefaultConfigs()
}

/**
 * Reads configs directly from disk, bypassing the in-memory cache.
 *
 * Used by hooks that need the current config snapshot (e.g., system prompt
 * injection on every request) rather than the startup-cached value.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns The parsed Hivemind config from the current disk state.
 *
 * @example
 * ```typescript
 * // Always reads from disk — picks up config changes without restart.
 * const fresh = getFreshConfig("/path/to/project")
 * ```
 */
export function getFreshConfig(projectRoot: string): HivemindConfigs {
  return readConfigs(projectRoot)
}

/**
 * Invalidates the in-memory config cache. Next `getConfig()` reads from disk.
 *
 * @param projectRoot - Optional project root to invalidate specifically.
 *
 * @example
 * ```typescript
 * invalidateConfigCache()
 * const fresh = getConfig("/path/to/project") // reads from disk
 * ```
 */
export function invalidateConfigCache(projectRoot?: string): void {
  if (projectRoot) {
    configCache.delete(projectRoot)
    if (lastProjectRoot === projectRoot) {
      lastProjectRoot = configCache.size > 0 ? Array.from(configCache.keys())[configCache.size - 1] : null
    }
  } else {
    configCache.clear()
    lastProjectRoot = null
  }
}
