import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type Signature = {
  type: string
  name: string
  signature: string
  lineStart: number
  lineEnd: number
  startIndex: number
  endIndex: number
  docstring?: string
  exported: boolean
}

type CompressedFileInfo = {
  path: string
  hash: string
  extension: string
  tokenCount: number
  originalTokenCount: number
  signatures: Signature[]
  imports: string[]
  exports: string[]
}

describe("Phase 7 — byte-offset: Signature startIndex/endIndex via regex fallback", () => {
  it("signatures have valid startIndex and endIndex fields", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
      treeSitter?: null,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-byte-offset-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      const content = [
        'import { join } from "node:path"',
        "",
        "export function hello(name: string): string {",
        "  return `Hello ${name}`",
        "}",
        "",
        "export class Greeter {",
        "  greet(): string { return 'hi' }",
        "}",
        "",
        "export interface Config {",
        "  name: string",
        "}",
      ].join("\n")

      await writeFile(join(projectRoot, "src", "test.ts"), content, "utf-8")

      const result = await compressSingleFile("src/test.ts", projectRoot, "typescript", null)
      assert.ok(result !== null, "should return non-null")
      assert.ok(result.signatures.length >= 2, `should have at least 2 signatures, got ${result.signatures.length}`)

      for (const sig of result.signatures) {
        assert.ok(typeof sig.startIndex === "number", `signature ${sig.name} should have numeric startIndex`)
        assert.ok(typeof sig.endIndex === "number", `signature ${sig.name} should have numeric endIndex`)
        assert.ok(sig.startIndex >= 0, `signature ${sig.name} startIndex should be >= 0, got ${sig.startIndex}`)
        assert.ok(sig.endIndex > sig.startIndex, `signature ${sig.name} endIndex (${sig.endIndex}) should be > startIndex (${sig.startIndex})`)
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("signatures are sorted by startIndex", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
      treeSitter?: null,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-byte-sort-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      const content = [
        "export function alpha(): void {}",
        "export function beta(): void {}",
        "export function gamma(): void {}",
      ].join("\n")

      await writeFile(join(projectRoot, "src", "sort.ts"), content, "utf-8")

      const result = await compressSingleFile("src/sort.ts", projectRoot, "typescript", null)
      assert.ok(result !== null)

      for (let i = 1; i < result.signatures.length; i++) {
        assert.ok(
          result.signatures[i].startIndex >= result.signatures[i - 1].startIndex,
          `signatures should be sorted: ${result.signatures[i - 1].name}(${result.signatures[i - 1].startIndex}) before ${result.signatures[i].name}(${result.signatures[i].startIndex})`,
        )
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("byte offsets correspond to actual content positions", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
      treeSitter?: null,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-byte-accurate-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      const content = 'export function greet(name: string): string {\n  return `Hello ${name}`\n}\n'

      await writeFile(join(projectRoot, "src", "greet.ts"), content, "utf-8")

      const result = await compressSingleFile("src/greet.ts", projectRoot, "typescript", null)
      assert.ok(result !== null)
      assert.ok(result.signatures.length >= 1, "should have at least 1 signature")

      const sig = result.signatures.find(s => s.name === "greet")
      assert.ok(sig, "should find 'greet' signature")

      const slice = content.slice(sig.startIndex, sig.endIndex)
      assert.ok(slice.includes("greet"), `content.slice(${sig.startIndex}, ${sig.endIndex}) = "${slice}" should include "greet"`)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 7 — byte-offset: Signature interface contract", () => {
  it("Signature includes startIndex and endIndex in extracted results", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
      treeSitter?: null,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-sig-contract-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      await writeFile(join(projectRoot, "src", "contract.ts"), "export const x = 1\n", "utf-8")

      const result = await compressSingleFile("src/contract.ts", projectRoot, "typescript", null)
      assert.ok(result !== null)

      if (result.signatures.length > 0) {
        const sig = result.signatures[0]
        assert.ok("startIndex" in sig, "Signature should have startIndex property")
        assert.ok("endIndex" in sig, "Signature should have endIndex property")
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
