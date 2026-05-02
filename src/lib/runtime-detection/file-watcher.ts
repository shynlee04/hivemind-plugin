import { readFile, watch } from "node:fs"
import { join } from "node:path"

export type PackageSnapshot = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

function emptySnapshot(): PackageSnapshot {
  return { dependencies: {}, devDependencies: {}, peerDependencies: {} }
}

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

function emitCurrent(filePath: string, callback: (snapshot: PackageSnapshot) => void): void {
  readFile(filePath, "utf8", (err, content) => {
    if (err) {
      callback(emptySnapshot())
      return
    }
    callback(parseSnapshot(content))
  })
}

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
