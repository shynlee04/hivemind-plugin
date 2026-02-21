import { describe, it } from "node:test"
import assert from "node:assert/strict"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

type TreeSitterLoader = {
  init: (language: string) => Promise<unknown>
}

type CreateTreeSitterLoader = (options?: {
  loadLanguage?: (language: string) => Promise<unknown>
}) => TreeSitterLoader

type Signature = {
  name: string
  kind: string
  path: string
  line: number
}

type ExtractSignatures = (input: {
  path: string
  language: string
  content: string
}) => Promise<Signature[]>

describe("Code-Intel Phase 2 Slice 1 RED - export contracts", () => {
  it("exports tree-sitter loader and signature extractor from src/lib/code-intel/index.ts", async () => {
    const codeIntel = await import(codeIntelModuleHref)

    assert.equal(typeof codeIntel.createTreeSitterLoader, "function")
    assert.equal(typeof codeIntel.extractSignatures, "function")
  })
})

describe("Code-Intel Phase 2 Slice 1 RED - loader init contracts", () => {
  it("keeps loader init idempotent for repeated language initialization", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const createTreeSitterLoader = codeIntel.createTreeSitterLoader as CreateTreeSitterLoader | undefined

    assert.equal(typeof createTreeSitterLoader, "function")
    if (!createTreeSitterLoader) {
      throw new Error("Expected createTreeSitterLoader export")
    }

    const loads: string[] = []
    const loader = createTreeSitterLoader({
      loadLanguage: async (language: string) => {
        loads.push(language)
        return { language }
      },
    })

    const first = await loader.init("typescript")
    const second = await loader.init("typescript")

    assert.equal(second, first)
    assert.deepEqual(loads, ["typescript"])
  })

  it("returns a structured failure envelope when language init fails", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const createTreeSitterLoader = codeIntel.createTreeSitterLoader as CreateTreeSitterLoader | undefined

    assert.equal(typeof createTreeSitterLoader, "function")
    if (!createTreeSitterLoader) {
      throw new Error("Expected createTreeSitterLoader export")
    }

    const loader = createTreeSitterLoader({
      loadLanguage: async () => {
        throw new Error("native module unavailable")
      },
    })

    await assert.rejects(
      loader.init("typescript"),
      (error: unknown) => {
        if (!error || typeof error !== "object") return false
        const envelope = error as {
          code?: unknown
          message?: unknown
          language?: unknown
          cause?: unknown
        }

        return (
          envelope.code === "TREE_SITTER_INIT_FAILED" &&
          envelope.language === "typescript" &&
          typeof envelope.message === "string" &&
          envelope.cause instanceof Error
        )
      },
    )
  })
})

describe("Code-Intel Phase 2 Slice 1 RED - extractor contracts", () => {
  it("returns empty signatures for unsupported language without throwing", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const extractSignatures = codeIntel.extractSignatures as ExtractSignatures | undefined

    assert.equal(typeof extractSignatures, "function")
    if (!extractSignatures) {
      throw new Error("Expected extractSignatures export")
    }

    const signatures = await extractSignatures({
      path: "src/unsupported.bf",
      language: "brainfuck",
      content: "+[----->+++<]>",
    })

    assert.deepEqual(signatures, [])
  })

  it("orders extracted signatures deterministically by path then line then name", async () => {
    const codeIntel = await import(codeIntelModuleHref)
    const extractSignatures = codeIntel.extractSignatures as ExtractSignatures | undefined

    assert.equal(typeof extractSignatures, "function")
    if (!extractSignatures) {
      throw new Error("Expected extractSignatures export")
    }

    const signatures = await extractSignatures({
      path: "src/sample.ts",
      language: "typescript",
      content: [
        "export function zebra() { return 1 }",
        "export function alpha() { return 2 }",
        "export class Bee {}",
      ].join("\n"),
    })

    assert.deepEqual(
      signatures.map((entry) => `${entry.path}:${entry.line}:${entry.name}`),
      ["src/sample.ts:1:zebra", "src/sample.ts:2:alpha", "src/sample.ts:3:Bee"],
    )
  })
})
