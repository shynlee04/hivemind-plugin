import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

// ─── Type aliases ────────────────────────────────────────────────────────

type WatchStatus = {
  isWatching: boolean
  projectRoot: string
  filesWatched: number
  lastUpdate: string | null
  pendingChanges: number
  updatesProcessed: number
  errors: number
}

type WatchIntegration = {
  start(): void
  stop(): void
  rescanAll(): Promise<string[]>
  getStatus(): WatchStatus
}

type CodeMap = {
  files: Array<{
    filePath: string
    language: string
    hash: string
    size: number
    lineCount: number
    tokenCount: number
    hasSecrets: boolean
    secretTypes: string[]
    lastModified: string
  }>
  totalFiles: number
  totalTokens: number
  totalSize: number
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 2 — watch-integration: export contract", () => {
  it("exports startWatchIntegration from barrel", async () => {
    const mod = await import(codeIntelModuleHref)
    assert.equal(typeof mod.startWatchIntegration, "function")
  })
})

describe("Phase 2 — watch-integration: getStatus initial state", () => {
  it("returns correct initial status before start()", async () => {
    const mod = await import(codeIntelModuleHref)
    const startWatchIntegration = mod.startWatchIntegration as (
      projectRoot: string,
      codemap: CodeMap,
      options?: Record<string, unknown>,
    ) => WatchIntegration

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-watch-status-"))

    try {
      const codemap: CodeMap = {
        files: [
          {
            filePath: "src/test.ts",
            language: "typescript",
            hash: "abc123",
            size: 100,
            lineCount: 5,
            tokenCount: 20,
            hasSecrets: false,
            secretTypes: [],
            lastModified: new Date().toISOString(),
          },
        ],
        totalFiles: 1,
        totalTokens: 20,
        totalSize: 100,
      }

      const watch = startWatchIntegration(projectRoot, codemap, { emitEvents: false })
      const status = watch.getStatus()

      assert.equal(status.isWatching, false, "should not be watching before start()")
      assert.equal(status.projectRoot, projectRoot)
      assert.equal(status.filesWatched, 1, "filesWatched should match codemap.totalFiles")
      assert.equal(status.lastUpdate, null, "no updates yet")
      assert.equal(status.pendingChanges, 0)
      assert.equal(status.updatesProcessed, 0)
      assert.equal(status.errors, 0)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — watch-integration: start/stop lifecycle", () => {
  it("start() sets isWatching=true, stop() sets isWatching=false", async () => {
    const mod = await import(codeIntelModuleHref)
    const startWatchIntegration = mod.startWatchIntegration as (
      projectRoot: string,
      codemap: CodeMap,
      options?: Record<string, unknown>,
    ) => WatchIntegration

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-watch-lifecycle-"))

    try {
      await mkdir(projectRoot, { recursive: true })

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const watch = startWatchIntegration(projectRoot, codemap, { emitEvents: false })

      assert.equal(watch.getStatus().isWatching, false, "initially not watching")

      watch.start()
      assert.equal(watch.getStatus().isWatching, true, "watching after start()")

      // start() is idempotent
      watch.start()
      assert.equal(watch.getStatus().isWatching, true, "still watching after second start()")

      watch.stop()
      assert.equal(watch.getStatus().isWatching, false, "not watching after stop()")

      // stop() is idempotent
      watch.stop()
      assert.equal(watch.getStatus().isWatching, false, "still not watching after second stop()")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — watch-integration: rescanAll", () => {
  it("detects and resyncs stale files", async () => {
    const mod = await import(codeIntelModuleHref)
    const startWatchIntegration = mod.startWatchIntegration as (
      projectRoot: string,
      codemap: CodeMap,
      options?: Record<string, unknown>,
    ) => WatchIntegration
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => {
      updateFile: (codemap: CodeMap, filePath: string) => Promise<unknown>
    }

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-watch-rescan-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "rescan.ts"), "export const r = 1\n", "utf-8")

      // Build a codemap with this file
      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)
      await updater.updateFile(codemap, "src/rescan.ts")

      assert.equal(codemap.totalFiles, 1)

      // Now modify file on disk (making codemap stale)
      await writeFile(join(projectRoot, "src", "rescan.ts"), "export const r = 999\nexport const s = 2\n", "utf-8")

      const watch = startWatchIntegration(projectRoot, codemap, { emitEvents: false })
      const staleFiles = await watch.rescanAll()

      assert.equal(staleFiles.length, 1, "should detect one stale file")
      assert.equal(staleFiles[0], "src/rescan.ts")

      // After rescan, status should show updates processed
      const status = watch.getStatus()
      assert.ok(status.updatesProcessed >= 1, "should have processed at least 1 update")
      assert.ok(status.lastUpdate !== null, "lastUpdate should be set after rescan")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — watch-integration: WatchIntegration interface shape", () => {
  it("returns an object with start, stop, rescanAll, getStatus methods", async () => {
    const mod = await import(codeIntelModuleHref)
    const startWatchIntegration = mod.startWatchIntegration as (
      projectRoot: string,
      codemap: CodeMap,
    ) => WatchIntegration

    const codemap: CodeMap = {
      files: [],
      totalFiles: 0,
      totalTokens: 0,
      totalSize: 0,
    }

    const watch = startWatchIntegration("/tmp/fake", codemap)

    assert.equal(typeof watch.start, "function")
    assert.equal(typeof watch.stop, "function")
    assert.equal(typeof watch.rescanAll, "function")
    assert.equal(typeof watch.getStatus, "function")
  })
})
