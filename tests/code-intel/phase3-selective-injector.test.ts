import { describe, it } from "node:test"
import assert from "node:assert/strict"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

// ─── Type aliases for dynamic imports ────────────────────────────────────

type Signature = {
  type: "function" | "class" | "interface" | "type" | "variable" | "import"
  name: string
  signature: string
  lineStart: number
  lineEnd: number
  docstring?: string
  parameters?: Array<{ name: string; type?: string; optional: boolean; default?: string }>
  returnType?: string
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

type CompressedCodemap = {
  version: string
  createdAt: string
  projectRoot: string
  totalTokens: number
  originalTotalTokens: number
  compressionRatio: number
  files: CompressedFileInfo[]
}

type SourceSelection = {
  files: Array<{
    path: string
    injectionType: "signature" | "full" | "range"
    tokens: number
    content: string
    lineRange?: { start: number; end: number }
  }>
  totalTokens: number
  budgetRemaining: number
}

// ─── Helper: build test codemap ──────────────────────────────────────────

function makeSignature(overrides: Partial<Signature> = {}): Signature {
  return {
    type: "function",
    name: "testFunc",
    signature: "function testFunc(): void",
    lineStart: 1,
    lineEnd: 5,
    exported: true,
    ...overrides,
  }
}

function makeFile(overrides: Partial<CompressedFileInfo> = {}): CompressedFileInfo {
  return {
    path: "src/test.ts",
    hash: "abc123",
    extension: ".ts",
    tokenCount: 100,
    originalTokenCount: 400,
    signatures: [makeSignature()],
    imports: [],
    exports: ["testFunc"],
    ...overrides,
  }
}

function makeCodemap(files: CompressedFileInfo[] = []): CompressedCodemap {
  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    projectRoot: "/test",
    totalTokens: files.reduce((sum, f) => sum + f.tokenCount, 0),
    originalTotalTokens: files.reduce((sum, f) => sum + f.originalTokenCount, 0),
    compressionRatio: 50,
    files,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 3 — selective-injector", () => {
  it("returns empty selection for no file locks", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    const codemap = makeCodemap([makeFile()])
    const result = mod.selectSourceForInjection(codemap, [], 5000)

    assert.equal(result.files.length, 0)
    assert.equal(result.totalTokens, 0)
    assert.equal(result.budgetRemaining, 5000)
  })

  it("returns empty selection for zero budget", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    const codemap = makeCodemap([makeFile()])
    const result = mod.selectSourceForInjection(codemap, ["src/test.ts"], 0)

    assert.equal(result.files.length, 0)
    assert.equal(result.totalTokens, 0)
  })

  it("selects locked files present in codemap", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    const file1 = makeFile({ path: "src/a.ts", tokenCount: 50 })
    const file2 = makeFile({ path: "src/b.ts", tokenCount: 60 })
    const file3 = makeFile({ path: "src/c.ts", tokenCount: 70 })
    const codemap = makeCodemap([file1, file2, file3])

    // Only lock a.ts and c.ts
    const result = mod.selectSourceForInjection(codemap, ["src/a.ts", "src/c.ts"], 5000)

    assert.equal(result.files.length, 2)
    const paths = result.files.map((f) => f.path)
    assert.ok(paths.includes("src/a.ts"))
    assert.ok(paths.includes("src/c.ts"))
    assert.ok(!paths.includes("src/b.ts"))
  })

  it("respects budget limit — stops when exhausted", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    // Each file has 300 tokens of signatures
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({
        path: `src/file${i}.ts`,
        tokenCount: 300,
        originalTokenCount: 1000,
        signatures: [makeSignature({ name: `func${i}`, signature: `function func${i}(): void` })],
      }),
    )
    const codemap = makeCodemap(files)
    const locks = files.map((f) => f.path)

    // Budget = 500, each file costs ~300 → expect 1-2 files max
    const result = mod.selectSourceForInjection(codemap, locks, 500)

    assert.ok(result.files.length <= 2, `Expected <=2 files, got ${result.files.length}`)
    assert.ok(result.totalTokens <= 500, `Expected <=500 tokens, got ${result.totalTokens}`)
    assert.ok(result.budgetRemaining >= 0)
  })

  it("injects small files as 'full' type", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    // Small file: originalTokenCount < 500
    const smallFile = makeFile({
      path: "src/small.ts",
      tokenCount: 50,
      originalTokenCount: 200,
    })
    const codemap = makeCodemap([smallFile])

    const result = mod.selectSourceForInjection(codemap, ["src/small.ts"], 5000)

    assert.equal(result.files.length, 1)
    assert.equal(result.files[0].injectionType, "full")
  })

  it("injects signature type when file is larger but signatures fit budget", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    const largeFile = makeFile({
      path: "src/large.ts",
      tokenCount: 200,
      originalTokenCount: 2000,
      signatures: [
        makeSignature({ name: "funcA", signature: "export function funcA(): string" }),
        makeSignature({ name: "funcB", signature: "export function funcB(x: number): boolean" }),
      ],
    })
    const codemap = makeCodemap([largeFile])

    const result = mod.selectSourceForInjection(codemap, ["src/large.ts"], 5000)

    assert.equal(result.files.length, 1)
    assert.equal(result.files[0].injectionType, "signature")
  })

  it("ignores locked files not present in codemap", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
    }

    const codemap = makeCodemap([makeFile({ path: "src/exists.ts" })])
    const result = mod.selectSourceForInjection(codemap, ["src/exists.ts", "src/missing.ts"], 5000)

    assert.equal(result.files.length, 1)
    assert.equal(result.files[0].path, "src/exists.ts")
  })

  it("renderSourceSelectionXml produces valid XML structure", async () => {
    const mod = await import(codeIntelModuleHref) as {
      selectSourceForInjection: (codemap: CompressedCodemap, fileLocks: string[], budget: number) => SourceSelection
      renderSourceSelectionXml: (selection: SourceSelection, budget: number) => string
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/auth.ts",
        tokenCount: 100,
        originalTokenCount: 300,
        signatures: [makeSignature({ name: "login", signature: "export function login(user: string): Promise<boolean>" })],
      }),
    ])

    const selection = mod.selectSourceForInjection(codemap, ["src/auth.ts"], 5000)
    const xml = mod.renderSourceSelectionXml(selection, 5000)

    assert.ok(xml.includes("<source_code"), "Missing <source_code> tag")
    assert.ok(xml.includes("budget_used="), "Missing budget_used attribute")
    assert.ok(xml.includes("budget_total="), "Missing budget_total attribute")
    assert.ok(xml.includes("locked_file"), "Missing <locked_file> tag")
    assert.ok(xml.includes("src/auth.ts"), "Missing file path")
    assert.ok(xml.includes("</source_code>"), "Missing closing tag")
  })

  it("renderSourceSelectionXml returns empty string for no files", async () => {
    const mod = await import(codeIntelModuleHref) as {
      renderSourceSelectionXml: (selection: SourceSelection, budget: number) => string
    }

    const empty: SourceSelection = { files: [], totalTokens: 0, budgetRemaining: 5000 }
    const xml = mod.renderSourceSelectionXml(empty, 5000)

    assert.equal(xml, "")
  })
})
