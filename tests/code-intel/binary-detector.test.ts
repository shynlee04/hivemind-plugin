import { describe, it } from "node:test"
import assert from "node:assert/strict"

const binaryDetectorModuleHref = new URL("../../src/lib/code-intel/binary-detector.ts", import.meta.url).href

describe("Wave 4 Slice 2 RED - binary detector primitive", () => {
  it("exports isBinaryPathSafe", async () => {
    const module = await import(binaryDetectorModuleHref)
    assert.equal(typeof module.isBinaryPathSafe, "function")
  })

  it("returns false for known binary paths and true for source text paths", async () => {
    const module = await import(binaryDetectorModuleHref)
    const isBinaryPathSafe = module.isBinaryPathSafe as ((filePath: string) => boolean) | undefined

    assert.equal(typeof isBinaryPathSafe, "function")
    if (!isBinaryPathSafe) {
      throw new Error("Expected isBinaryPathSafe export")
    }

    assert.equal(isBinaryPathSafe("assets/logo.png"), false)
    assert.equal(isBinaryPathSafe("assets/font.woff2"), false)
    assert.equal(isBinaryPathSafe("src/index.ts"), true)
    assert.equal(isBinaryPathSafe("README.md"), true)
  })
})
