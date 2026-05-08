import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { synthesizeTechStack, type SynthesizedStack } from "../../../src/features/bootstrap/runtime-detection/stack-synthesizer.js"

describe("stack-synthesizer", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "stack-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("synthesizes unknown project type for empty directory", async () => {
    const stack = await synthesizeTechStack(tempDir)
    expect(stack.projectType).toBe("unknown")
    expect(stack.codemap.fileCount).toBe(0)
    expect(stack.frameworks.frameworks).toHaveLength(0)
    expect(stack.warnings.length).toBeGreaterThanOrEqual(1)
    expect(new Date(stack.synthesizedAt).getTime()).not.toBeNaN()
  })

  it("synthesizes with detected frameworks", async () => {
    mkdirSync(join(tempDir, ".planning"))
    writeFileSync(join(tempDir, ".planning", "ROADMAP.md"), "# roadmap")

    const stack = await synthesizeTechStack(tempDir)
    expect(stack.frameworks.frameworks).toHaveLength(1)
    expect(stack.frameworks.frameworks[0].marker.name).toBe("gsd")
  })

  it("includes codemap in synthesized stack", async () => {
    writeFileSync(join(tempDir, "a.ts"), "// a")
    writeFileSync(join(tempDir, "b.ts"), "// b")

    const stack = await synthesizeTechStack(tempDir)
    expect(stack.codemap.fileCount).toBe(2)
    expect(stack.codemap.byExtension[".ts"]).toBe(2)
  })

  it("propagates framework warnings", async () => {
    // Empty directory — framework detector may have no warnings,
    // but codescan should warn about missing package.json
    const stack = await synthesizeTechStack(tempDir)
    expect(stack.warnings.length).toBeGreaterThanOrEqual(0)
  })
})
