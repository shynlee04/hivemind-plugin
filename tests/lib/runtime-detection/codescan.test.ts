import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { scanCodebase, type CodeScanResult } from "../../../src/lib/runtime-detection/codescan.js"

describe("codescan", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "codescan-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("returns unknown language and warns when package.json is missing", async () => {
    const result = await scanCodebase(tempDir)
    expect(result.language).toBe("unknown")
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining("package.json")]))
    expect(result.complexity).toBe("low")
  })

  it("detects typescript from devDependencies", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ devDependencies: { typescript: "^5.0.0" } }),
    )

    const result = await scanCodebase(tempDir)
    expect(result.language).toBe("typescript")
    expect(result.complexity).toBe("low")
  })

  it("detects javascript when no typescript present", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { express: "^4.0.0" } }),
    )

    const result = await scanCodebase(tempDir)
    expect(result.language).toBe("javascript")
  })

  it("classifies low complexity for < 5 files", async () => {
    writeFileSync(join(tempDir, "package.json"), JSON.stringify({}))
    writeFileSync(join(tempDir, "a.js"), "a")

    const result = await scanCodebase(tempDir)
    expect(result.complexity).toBe("low")
  })

  it("classifies medium complexity for 5-19 files", async () => {
    writeFileSync(join(tempDir, "package.json"), JSON.stringify({}))
    for (let i = 0; i < 7; i++) {
      writeFileSync(join(tempDir, `f${i}.js`), `${i}`)
    }

    const result = await scanCodebase(tempDir)
    expect(result.complexity).toBe("medium")
  })

  it("classifies high complexity for >= 20 files", async () => {
    writeFileSync(join(tempDir, "package.json"), JSON.stringify({}))
    for (let i = 0; i < 22; i++) {
      writeFileSync(join(tempDir, `f${i}.js`), `${i}`)
    }

    const result = await scanCodebase(tempDir)
    expect(result.complexity).toBe("high")
  })

  it("detects react from dependencies", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { react: "^18.0.0" } }),
    )

    const result = await scanCodebase(tempDir)
    expect(result.frameworks).toContain("react")
  })

  it("detects nextjs from dependencies", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { next: "^14.0.0" } }),
    )

    const result = await scanCodebase(tempDir)
    expect(result.frameworks).toContain("nextjs")
  })
})
