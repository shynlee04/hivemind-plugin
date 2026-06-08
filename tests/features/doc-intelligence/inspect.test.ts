import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { inspectCodeFile } from "../../../src/features/doc-intelligence/index.js"

describe("inspect", () => {
  it("extracts JSDoc blocks, exports, and signatures from TypeScript", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "sample.ts"), `
/**
 * Greets the user.
 */
export function greet(name: string): string {
  return "Hello " + name
}

export const VERSION = "1.0"

export interface Config {
  debug: boolean
}
`, "utf-8")

    const result = inspectCodeFile(dir, "sample.ts")
    expect(result.jsdocBlocks.length).toBeGreaterThan(0)
    expect(result.exports.length).toBeGreaterThan(0)
    expect(result.signatures.length).toBeGreaterThan(0)
    expect(result.path).toBe("sample.ts")

    rmSync(dir, { recursive: true, force: true })
  })

  it("throws for unsupported extensions", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "file.txt"), "content", "utf-8")

    expect(() => inspectCodeFile(dir, "file.txt")).toThrow(/unsupported/i)

    rmSync(dir, { recursive: true, force: true })
  })
})
