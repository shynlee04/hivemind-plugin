import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"

import { inspectCodeBridge, type CodeInspectionResult } from "../../../src/features/doc-intelligence/ast-grep-bridge.js"

const SAMPLE_TS = `
/**
 * Greets the user by name.
 *
 * @param name - The user's name.
 * @returns A greeting string.
 */
export function greet(name: string): string {
  return "Hello " + name
}

/**
 * Configuration object.
 */
export interface Config {
  debug: boolean
}

export const VERSION = "1.0"

export class Engine {
  start() {}
}
`

describe("ast-grep-bridge", () => {
  let dir: string
  let samplePath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ast-grep-test-"))
    samplePath = join(dir, "sample.ts")
    writeFileSync(samplePath, SAMPLE_TS, "utf-8")
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it("returns JSDoc blocks from a TypeScript file", async () => {
    const result = await inspectCodeBridge(samplePath)
    expect(result.jsdocBlocks).toBeDefined()
    expect(Array.isArray(result.jsdocBlocks)).toBe(true)
    expect(result.jsdocBlocks.length).toBeGreaterThan(0)

    const greet = result.jsdocBlocks.find((b) => b.content.includes("Greets the user"))
    expect(greet).toBeDefined()
    expect(greet?.startLine).toBeGreaterThan(0)
    expect(greet?.endLine).toBeGreaterThanOrEqual(greet?.startLine ?? 0)
  })

  it("returns the exports list from a TypeScript file", async () => {
    const result = await inspectCodeBridge(samplePath)
    expect(result.exports).toBeDefined()
    expect(Array.isArray(result.exports)).toBe(true)
    expect(result.exports.length).toBeGreaterThan(0)

    const names = result.exports.map((e) => e.name)
    expect(names).toContain("greet")
    expect(names).toContain("Config")
    expect(names).toContain("VERSION")
    expect(names).toContain("Engine")

    const greet = result.exports.find((e) => e.name === "greet")
    expect(greet?.kind).toBe("function")
    expect(greet?.line).toBeGreaterThan(0)

    const config = result.exports.find((e) => e.name === "Config")
    expect(config?.kind).toBe("type")
  })

  it("returns function signatures from a TypeScript file", async () => {
    const result = await inspectCodeBridge(samplePath)
    expect(result.signatures).toBeDefined()
    expect(Array.isArray(result.signatures)).toBe(true)
    expect(result.signatures.length).toBeGreaterThan(0)

    const greet = result.signatures.find((s) => s.name === "greet")
    expect(greet).toBeDefined()
    expect(greet?.params).toContain("name: string")
    expect(greet?.returnType).toBe("string")
    expect(greet?.line).toBeGreaterThan(0)
  })

  it("falls back to regex when @ast-grep/napi is not installed", async () => {
    // The bridge must not statically require @ast-grep/napi. When the
    // package is not available (which is the case in this test environment
    // since it is an optionalDependency), the bridge must return the same
    // shape via the regex fallback path.
    const result = await inspectCodeBridge(samplePath)
    // The bridge must always return a complete result, never throw.
    expect(result).toBeDefined()
    expect(result.jsdocBlocks).toBeDefined()
    expect(result.exports).toBeDefined()
    expect(result.signatures).toBeDefined()
  })

  it("result shape is IDENTICAL regardless of which engine produced it (no engine field exposed)", async () => {
    // Run twice and confirm the shape is deterministic and the public
    // type does not leak any engine selection to the caller.
    const a = await inspectCodeBridge(samplePath)
    const b = await inspectCodeBridge(samplePath)

    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()
    expect(aKeys).toEqual(bKeys)
    expect(aKeys).not.toContain("engine")
    expect(aKeys).toEqual(["exports", "jsdocBlocks", "signatures"])
  })

  it("matches the public CodeInspectionResult type contract", async () => {
    const result: CodeInspectionResult = await inspectCodeBridge(samplePath)
    // Type-level assertions executed at compile time; runtime sanity checks:
    for (const block of result.jsdocBlocks) {
      expect(typeof block.startLine).toBe("number")
      expect(typeof block.endLine).toBe("number")
      expect(typeof block.content).toBe("string")
    }
    for (const exp of result.exports) {
      expect(typeof exp.name).toBe("string")
      expect(typeof exp.line).toBe("number")
      expect(["function", "class", "variable", "type"]).toContain(exp.kind)
    }
    for (const sig of result.signatures) {
      expect(typeof sig.name).toBe("string")
      expect(typeof sig.line).toBe("number")
      expect(Array.isArray(sig.params)).toBe(true)
    }
  })
})

describe("ast-grep-bridge module isolation", () => {
  it("does NOT statically import @ast-grep/napi (source-level check)", () => {
    // Read the source file and assert that there is no static import
    // statement targeting @ast-grep/napi. Only dynamic `import("@ast-grep/napi")`
    // expressions are allowed.
    const src = readFileSync(
      join(process.cwd(), "src/features/doc-intelligence/ast-grep-bridge.ts"),
      "utf-8",
    )
    // Look for static imports: `import ... from "@ast-grep/napi"`
    expect(src).not.toMatch(/^\s*import\s+[^;]*from\s+["']@ast-grep\/napi["']/m)
    // Look for `require("@ast-grep/napi")` (CommonJS static load)
    expect(src).not.toMatch(/require\(\s*["']@ast-grep\/napi["']\s*\)/)
  })
})
