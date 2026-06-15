import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * P58.9 REQ-58.9-04 / AC-58.9-04-04: regression guard for the P20 no-new-deps
 * invariant. Compares the current `package.json` against a checked-in
 * baseline snapshot at `tests/fixtures/package-deps-baseline.json`.
 *
 * If a contributor adds a new dependency, the snapshot diff fails.
 * Updating the snapshot is a deliberate atomic commit with the marker
 * `// UPDATE-SNAPSHOT-P58.9: <reason>` in the commit body.
 *
 * Allowed deltas: a pinned version may drift (e.g., `^1.2.3` -> `^1.2.4`)
 * because npm/yarn can rewrite the caret range on install. The test
 * compares the SET of dependency names, not their versions, so version
 * drift does NOT fail this test. Adding a new dependency name DOES.
 */

interface DepSnapshot {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  peerDependencies: Record<string, string>
  optionalDependencies: Record<string, string>
}

function readDeps(packageJsonPath: string): DepSnapshot {
  const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>
  return {
    dependencies: (pkg.dependencies as Record<string, string> | undefined) ?? {},
    devDependencies: (pkg.devDependencies as Record<string, string> | undefined) ?? {},
    peerDependencies: (pkg.peerDependencies as Record<string, string> | undefined) ?? {},
    optionalDependencies: (pkg.optionalDependencies as Record<string, string> | undefined) ?? {},
  }
}

function diffSetNames(baseline: Record<string, string>, current: Record<string, string>): { added: string[]; removed: string[] } {
  const baseNames = new Set(Object.keys(baseline))
  const currNames = new Set(Object.keys(current))
  const added = [...currNames].filter((n) => !baseNames.has(n))
  const removed = [...baseNames].filter((n) => !currNames.has(n))
  return { added, removed }
}

describe("P20 no-new-deps invariant (REQ-58.9-04 AC-04)", () => {
  const baselinePath = join(process.cwd(), "tests/fixtures/package-deps-baseline.json")
  const currentPath = join(process.cwd(), "package.json")

  it("baseline snapshot file exists and is parseable", () => {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"))
    expect(baseline).toHaveProperty("dependencies")
    expect(baseline).toHaveProperty("devDependencies")
  })

  it("no new dependencies in package.json (deps set is a subset of baseline)", () => {
    const baseline = readDeps(baselinePath)
    const current = readDeps(currentPath)
    const diff = diffSetNames(baseline.dependencies, current.dependencies)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
  })

  it("no new devDependencies in package.json", () => {
    const baseline = readDeps(baselinePath)
    const current = readDeps(currentPath)
    const diff = diffSetNames(baseline.devDependencies, current.devDependencies)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
  })

  it("no new peerDependencies in package.json", () => {
    const baseline = readDeps(baselinePath)
    const current = readDeps(currentPath)
    const diff = diffSetNames(baseline.peerDependencies, current.peerDependencies)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
  })

  it("no new optionalDependencies in package.json", () => {
    const baseline = readDeps(baselinePath)
    const current = readDeps(currentPath)
    const diff = diffSetNames(baseline.optionalDependencies, current.optionalDependencies)
    expect(diff.added).toEqual([])
    expect(diff.removed).toEqual([])
  })
})
