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

/** Cached config value — `null` when cache is cold. */
let cachedConfig: HivemindConfigs | null = null

/** Project root the cached config was loaded from. */
let cachedProjectRoot: string | null = null

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
  if (cachedConfig !== null && cachedProjectRoot === projectRoot) {
    return cachedConfig
  }
  cachedConfig = readConfigs(projectRoot)
  cachedProjectRoot = projectRoot
  return cachedConfig
}

/**
 * Returns the cached config without disk read. Returns defaults if no cache.
 *
 * @returns The cached config, or defaults if the cache is cold.
 *
 * @example
 * ```typescript
 * // After getConfig() has been called at least once:
 * const cached = getCachedConfig()
 * console.log(cached.conversation_language) // "en"
 * ```
 */
export function getCachedConfig(): HivemindConfigs {
  return cachedConfig ?? getDefaultConfigs()
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
 * @example
 * ```typescript
 * invalidateConfigCache()
 * const fresh = getConfig("/path/to/project") // reads from disk
 * ```
 */
export function invalidateConfigCache(): void {
  cachedConfig = null
  cachedProjectRoot = null
}
