import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createPackageJsonWatcher, type PackageSnapshot } from "../../../src/lib/runtime-detection/file-watcher.js"

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

describe("file-watcher", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "watcher-test-"))
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { a: "1.0.0" } }),
    )
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("emits snapshot on initial read", async () => {
    const snapshots: PackageSnapshot[] = []

    const watcher = createPackageJsonWatcher(tempDir, (snap: PackageSnapshot) => {
      snapshots.push(snap)
    })

    await delay(50)
    expect(snapshots.length).toBeGreaterThanOrEqual(1)
    expect(snapshots[0].dependencies).toEqual({ a: "1.0.0" })

    watcher.stop()
  })

  it("emits updated snapshot when package.json changes", async () => {
    const snapshots: PackageSnapshot[] = []

    const watcher = createPackageJsonWatcher(tempDir, (snap: PackageSnapshot) => {
      snapshots.push(snap)
    })

    await delay(50)
    const initialCount = snapshots.length

    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { a: "2.0.0", b: "1.0.0" } }),
    )

    await delay(150)
    expect(snapshots.length).toBeGreaterThan(initialCount)
    expect(snapshots[snapshots.length - 1].dependencies).toEqual({ a: "2.0.0", b: "1.0.0" })

    watcher.stop()
  })

  it("stop prevents further callbacks", async () => {
    const snapshots: PackageSnapshot[] = []

    const watcher = createPackageJsonWatcher(tempDir, (snap: PackageSnapshot) => {
      snapshots.push(snap)
    })

    await delay(50)
    watcher.stop()
    const countAfterStop = snapshots.length

    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { c: "3.0.0" } }),
    )

    await delay(150)
    expect(snapshots.length).toBe(countAfterStop)
  })

  it("returns empty snapshot when package.json is missing", async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "watcher-empty-"))
    const snapshots: PackageSnapshot[] = []

    const watcher = createPackageJsonWatcher(emptyDir, (snap: PackageSnapshot) => {
      snapshots.push(snap)
    })

    await delay(50)
    expect(snapshots.length).toBeGreaterThanOrEqual(1)
    expect(snapshots[0].dependencies).toEqual({})
    expect(snapshots[0].devDependencies).toEqual({})
    expect(snapshots[0].peerDependencies).toEqual({})

    watcher.stop()
    rmSync(emptyDir, { recursive: true, force: true })
  })
})
