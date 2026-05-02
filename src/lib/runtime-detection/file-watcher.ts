import { readFile, watch } from "node:fs"
import { join } from "node:path"

/**
 * Snapshot of a project's dependency declarations extracted from `package.json`.
 *
 * @property dependencies - Production dependency name→version map.
 * @property devDependencies - Development dependency name→version map.
 * @property peerDependencies - Peer dependency name→version map.
 */
export type PackageSnapshot = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

/**
 * Create an empty package snapshot with no dependencies.
 *
 * @returns A {@link PackageSnapshot} with empty records for all dependency fields.
 */
function emptySnapshot(): PackageSnapshot {
  return { dependencies: {}, devDependencies: {}, peerDependencies: {} }
}

/**
 * Parse a `package.json` string into a {@link PackageSnapshot}.
 *
 * Extracts only the three standard dependency fields. Non-string values
 * within dependency records are silently skipped.
 *
 * @param content - Raw JSON string from `package.json`.
 * @returns A parsed snapshot, or an empty snapshot on parse failure.
 */
function parseSnapshot(content: string): PackageSnapshot {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    return {
      dependencies: extractStringRecord(parsed.dependencies),
      devDependencies: extractStringRecord(parsed.devDependencies),
      peerDependencies: extractStringRecord(parsed.peerDependencies),
    }
  } catch {
    return emptySnapshot()
  }
}

/**
 * Safely cast an unknown value to a `Record<string, string>`.
 *
 * Filters out non-string values from the input object.
 *
 * @param value - The value to extract from (typically a parsed JSON field).
 * @returns A record mapping string keys to string values.
 */
function extractStringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {}
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string") {
      result[key] = val
    }
  }
  return result
}

/**
 * Read the current `package.json` and emit a snapshot via callback.
 *
 * @param filePath - Absolute path to `package.json`.
 * @param callback - Receives the parsed snapshot (or empty on error).
 */
function emitCurrent(filePath: string, callback: (snapshot: PackageSnapshot) => void): void {
  readFile(filePath, "utf8", (err, content) => {
    if (err) {
      callback(emptySnapshot())
      return
    }
    callback(parseSnapshot(content))
  })
}

/**
 * Create a filesystem watcher for `package.json` changes in a project.
 *
 * Performs an initial read immediately, then watches the project root
 * directory for changes to `package.json` and emits updated snapshots.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param callback - Called with a {@link PackageSnapshot} on every change (and initially).
 * @returns An object with a `stop()` method to close the watcher.
 *
 * @example
 * ```typescript
 * const watcher = createPackageJsonWatcher("/path/to/project", (snapshot) => {
 *   console.log("Dependencies changed:", Object.keys(snapshot.dependencies))
 * })
 * // Later:
 * watcher.stop()
 * ```
 */
export function createPackageJsonWatcher(
  projectRoot: string,
  callback: (snapshot: PackageSnapshot) => void,
): { stop: () => void } {
  const filePath = join(projectRoot, "package.json")

  // Initial read
  emitCurrent(filePath, callback)

  const watcher = watch(projectRoot, { persistent: true }, (_event, filename) => {
    if (filename === "package.json") {
      emitCurrent(filePath, callback)
    }
  })

  return {
    stop() {
      watcher.close()
    },
  }
}
