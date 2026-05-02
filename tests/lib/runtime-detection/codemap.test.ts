import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildCodemap, emptyCodemap, type Codemap } from "../../../src/lib/runtime-detection/codemap.js"

describe("codemap", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "codemap-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("emptyCodemap returns zeroed structure", () => {
    const map = emptyCodemap(tempDir)
    expect(map.projectRoot).toBe(tempDir)
    expect(map.fileCount).toBe(0)
    expect(map.byExtension).toEqual({})
    expect(map.maxDepth).toBe(0)
    expect(map.truncated).toBe(false)
  })

  it("buildCodemap counts files by extension", async () => {
    writeFileSync(join(tempDir, "a.ts"), "// a")
    writeFileSync(join(tempDir, "b.ts"), "// b")
    writeFileSync(join(tempDir, "c.js"), "// c")

    const map = await buildCodemap(tempDir)
    expect(map.fileCount).toBe(3)
    expect(map.byExtension[".ts"]).toBe(2)
    expect(map.byExtension[".js"]).toBe(1)
  })

  it("buildCodemap tracks max depth", async () => {
    mkdirSync(join(tempDir, "src"))
    mkdirSync(join(tempDir, "src", "lib"))
    writeFileSync(join(tempDir, "root.txt"), "root")
    writeFileSync(join(tempDir, "src", "a.ts"), "a")
    writeFileSync(join(tempDir, "src", "lib", "b.ts"), "b")

    const map = await buildCodemap(tempDir)
    expect(map.maxDepth).toBe(3)
  })

  it("buildCodemap truncates when fileCount exceeds limit", async () => {
    for (let i = 0; i < 12; i++) {
      writeFileSync(join(tempDir, `f${i}.txt`), `${i}`)
    }

    const map = await buildCodemap(tempDir, { maxFiles: 10 })
    expect(map.fileCount).toBe(10)
    expect(map.truncated).toBe(true)
  })

  it("buildCodemap ignores node_modules", async () => {
    mkdirSync(join(tempDir, "node_modules"), { recursive: true })
    writeFileSync(join(tempDir, "node_modules", "dep.js"), "dep")
    writeFileSync(join(tempDir, "app.ts"), "app")

    const map = await buildCodemap(tempDir)
    expect(map.fileCount).toBe(1)
    expect(map.byExtension[".ts"]).toBe(1)
  })

  it("buildCodemap ignores dot directories", async () => {
    mkdirSync(join(tempDir, ".git"), { recursive: true })
    writeFileSync(join(tempDir, ".git", "config"), "git")
    writeFileSync(join(tempDir, "readme.md"), "readme")

    const map = await buildCodemap(tempDir)
    expect(map.fileCount).toBe(1)
    expect(map.byExtension[".md"]).toBe(1)
  })

  it("buildCodemap handles empty directory", async () => {
    const map = await buildCodemap(tempDir)
    expect(map.fileCount).toBe(0)
    expect(map.maxDepth).toBe(0)
    expect(map.truncated).toBe(false)
  })
})
