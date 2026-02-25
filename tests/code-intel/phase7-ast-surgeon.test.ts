import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type TreeSitterNode = {
  type: string
  text: string
  startIndex: number
  endIndex: number
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
  isNamed: boolean
  childForFieldName: (fieldName: string) => TreeSitterNode | null
  childrenForFieldName: (fieldName: string) => TreeSitterNode[]
}

type TreeSitterInstance = {
  parse: (content: string, language: string) => TreeSitterNode | null
  getLanguages: () => string[]
  isLanguageSupported: (extension: string) => boolean
  dispose: () => void
}

type ASTSurgeonType = {
  extractSkeleton: (filePath: string) => Promise<{
    signatures: Array<{ name: string; startIndex: number; endIndex: number }>
    compressedView: string
    originalTokens: number
    skeletonTokens: number
  } | null>
  patchSymbol: (filePath: string, symbolName: string, newCode: string) => Promise<{
    success: boolean
    bytesChanged: number
    backup: string
    error?: string
  }>
  getSymbolRange: (filePath: string, symbolName: string) => Promise<{
    startIndex: number
    endIndex: number
    text: string
  } | null>
}

const noAstTreeSitter: TreeSitterInstance = {
  parse: () => null,
  getLanguages: () => [],
  isLanguageSupported: () => false,
  dispose: () => {},
}

describe("Phase 7 — ASTSurgeon", () => {
  it("extractSkeleton compresses signatures and metadata", async () => {
    const mod = await import(codeIntelModuleHref)
    const ASTSurgeon = mod.ASTSurgeon as new (projectRoot: string, treeSitter: TreeSitterInstance) => ASTSurgeonType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-ast-skeleton-"))
    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(
        join(projectRoot, "src", "sample.ts"),
        [
          "import { readFileSync } from \"node:fs\"",
          "export function alpha(value: number): number {",
          "  return value + 1",
          "}",
          "export function beta(text: string): string {",
          "  return text.toUpperCase()",
          "}",
        ].join("\n"),
        "utf-8",
      )

      const surgeon = new ASTSurgeon(projectRoot, noAstTreeSitter)
      const skeleton = await surgeon.extractSkeleton("src/sample.ts")

      assert.ok(skeleton)
      assert.ok(skeleton.signatures.length >= 2)
      assert.ok(skeleton.compressedView.includes("function alpha"))
      assert.ok(skeleton.skeletonTokens > 0)
      assert.ok(skeleton.originalTokens >= skeleton.skeletonTokens)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("patchSymbol replaces target symbol without corrupting surrounding code", async () => {
    const mod = await import(codeIntelModuleHref)
    const ASTSurgeon = mod.ASTSurgeon as new (projectRoot: string, treeSitter: TreeSitterInstance) => ASTSurgeonType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-ast-patch-"))
    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      const original = [
        "function alpha() {",
        "  return 1",
        "}",
        "",
        "function beta() {",
        "  return alpha() + 1",
        "}",
      ].join("\n")
      await writeFile(join(projectRoot, "src", "sample.js"), original, "utf-8")

      const surgeon = new ASTSurgeon(projectRoot, noAstTreeSitter)
      const patch = await surgeon.patchSymbol(
        "src/sample.js",
        "alpha",
        [
          "function alpha() {",
          "  return 41",
          "}",
        ].join("\n"),
      )

      assert.equal(patch.success, true)
      assert.ok(patch.bytesChanged >= 0)
      assert.ok(patch.backup.includes("return 1"))

      const after = await readFile(join(projectRoot, "src", "sample.js"), "utf-8")
      assert.ok(after.includes("return 41"))
      assert.ok(after.includes("function beta"))
      assert.doesNotThrow(() => new Function(after))
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("getSymbolRange returns null for missing symbols", async () => {
    const mod = await import(codeIntelModuleHref)
    const ASTSurgeon = mod.ASTSurgeon as new (projectRoot: string, treeSitter: TreeSitterInstance) => ASTSurgeonType

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-ast-range-"))
    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "sample.ts"), "export function alpha(): number { return 1 }\n", "utf-8")

      const surgeon = new ASTSurgeon(projectRoot, noAstTreeSitter)
      const missing = await surgeon.getSymbolRange("src/sample.ts", "doesNotExist")

      assert.equal(missing, null)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
