import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

// ─── Type aliases ────────────────────────────────────────────────────────

type UpdateResult = {
  filePath: string
  changeType: "created" | "modified" | "deleted"
  tokenDelta: number
  signatureDelta: number
  timestamp: string
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

type IncrementalUpdaterType = {
  buildEntry: (relativePath: string) => Promise<unknown>
  updateFile: (codemap: CodeMap, filePath: string) => Promise<UpdateResult>
  removeFile: (codemap: CodeMap, filePath: string) => Promise<UpdateResult>
  getStaleFiles: (codemap: CodeMap) => Promise<string[]>
  onUpdate: (callback: (result: UpdateResult) => void) => () => void
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 2 — IncrementalUpdater: export contract", () => {
  it("exports IncrementalUpdater class from barrel", async () => {
    const mod = await import(codeIntelModuleHref)
    assert.equal(typeof mod.IncrementalUpdater, "function")
  })

  it("constructs with a projectRoot", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType
    const updater = new IncrementalUpdater("/tmp/test")
    assert.ok(updater, "should construct without error")
    assert.equal(typeof updater.updateFile, "function")
    assert.equal(typeof updater.removeFile, "function")
    assert.equal(typeof updater.getStaleFiles, "function")
    assert.equal(typeof updater.onUpdate, "function")
    assert.equal(typeof updater.buildEntry, "function")
  })
})

describe("Phase 2 — IncrementalUpdater: updateFile creates new entry", () => {
  it("adds a new file to codemap and reports created + positive tokenDelta", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-updater-create-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "hello.ts"), "export const hello = 'world'\n", "utf-8")

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)
      const result = await updater.updateFile(codemap, "src/hello.ts")

      assert.equal(result.filePath, "src/hello.ts")
      assert.equal(result.changeType, "created")
      assert.ok(result.tokenDelta > 0, "tokenDelta should be positive for new file")
      assert.ok(result.timestamp.length > 0, "timestamp should be set")

      // Codemap stats should be updated
      assert.equal(codemap.totalFiles, 1)
      assert.ok(codemap.totalTokens > 0)
      assert.ok(codemap.totalSize > 0)
      assert.equal(codemap.files.length, 1)
      assert.equal(codemap.files[0].filePath, "src/hello.ts")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — IncrementalUpdater: updateFile detects modification", () => {
  it("updates existing entry and reports modified + tokenDelta", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-updater-modify-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "data.ts"), "export const x = 1\n", "utf-8")

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)

      // First: create
      await updater.updateFile(codemap, "src/data.ts")
      const tokensBefore = codemap.totalTokens

      // Modify the file on disk
      await writeFile(
        join(projectRoot, "src", "data.ts"),
        "export const x = 1\nexport const y = 2\nexport const z = 3\n",
        "utf-8",
      )

      // Second: modify
      const result = await updater.updateFile(codemap, "src/data.ts")

      assert.equal(result.changeType, "modified")
      assert.equal(result.filePath, "src/data.ts")
      assert.ok(result.tokenDelta > 0, "tokenDelta should be positive since content grew")
      assert.ok(codemap.totalTokens > tokensBefore, "total tokens should increase")
      assert.equal(codemap.totalFiles, 1, "should still be 1 file")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — IncrementalUpdater: removeFile", () => {
  it("removes file from codemap and reports negative tokenDelta", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-updater-remove-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "temp.ts"), "export const temp = true\n", "utf-8")

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)
      await updater.updateFile(codemap, "src/temp.ts")

      assert.equal(codemap.totalFiles, 1)
      const tokensBefore = codemap.totalTokens

      const result = await updater.removeFile(codemap, "src/temp.ts")

      assert.equal(result.changeType, "deleted")
      assert.equal(result.filePath, "src/temp.ts")
      assert.ok(result.tokenDelta < 0, "tokenDelta should be negative for removal")
      assert.equal(codemap.totalFiles, 0)
      assert.equal(codemap.totalTokens, 0)
      assert.ok(tokensBefore > 0, "should have had tokens before removal")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — IncrementalUpdater: getStaleFiles", () => {
  it("identifies files whose content changed on disk since last scan", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-updater-stale-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "a.ts"), "export const a = 1\n", "utf-8")
      await writeFile(join(projectRoot, "src", "b.ts"), "export const b = 2\n", "utf-8")

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)
      await updater.updateFile(codemap, "src/a.ts")
      await updater.updateFile(codemap, "src/b.ts")

      // No changes yet — nothing stale
      const staleNone = await updater.getStaleFiles(codemap)
      assert.equal(staleNone.length, 0, "no files should be stale initially")

      // Modify one file on disk
      await writeFile(join(projectRoot, "src", "a.ts"), "export const a = 999\n", "utf-8")

      const staleAfter = await updater.getStaleFiles(codemap)
      assert.equal(staleAfter.length, 1, "exactly one file should be stale")
      assert.equal(staleAfter[0], "src/a.ts")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — IncrementalUpdater: onUpdate listener", () => {
  it("notifies listeners when files are updated", async () => {
    const mod = await import(codeIntelModuleHref)
    const IncrementalUpdater = mod.IncrementalUpdater as new (root: string) => IncrementalUpdaterType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-updater-listen-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "notify.ts"), "export const n = 1\n", "utf-8")

      const codemap: CodeMap = {
        files: [],
        totalFiles: 0,
        totalTokens: 0,
        totalSize: 0,
      }

      const updater = new IncrementalUpdater(projectRoot)
      const received: UpdateResult[] = []

      const unsubscribe = updater.onUpdate((result) => {
        received.push(result)
      })

      await updater.updateFile(codemap, "src/notify.ts")

      assert.equal(received.length, 1, "listener should receive one update")
      assert.equal(received[0].filePath, "src/notify.ts")
      assert.equal(received[0].changeType, "created")

      // Unsubscribe and verify no more events
      unsubscribe()
      await writeFile(join(projectRoot, "src", "notify.ts"), "export const n = 2\n", "utf-8")
      await updater.updateFile(codemap, "src/notify.ts")

      assert.equal(received.length, 1, "listener should not receive events after unsubscribe")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
