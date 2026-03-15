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

type PatternQuery = {
  functionName?: string
  typeName?: string
  exportName?: string
  importSource?: string
  signaturePattern?: RegExp
}

type PatternMatch = {
  filePath: string
  signature: Signature
  relevance: number
}

// ─── Helper: build test data ─────────────────────────────────────────────

function makeSig(overrides: Partial<Signature> = {}): Signature {
  return {
    type: "function",
    name: "defaultFunc",
    signature: "function defaultFunc(): void",
    lineStart: 1,
    lineEnd: 5,
    exported: true,
    ...overrides,
  }
}

function makeFile(overrides: Partial<CompressedFileInfo> = {}): CompressedFileInfo {
  return {
    path: "src/test.ts",
    hash: "abc",
    extension: ".ts",
    tokenCount: 100,
    originalTokenCount: 400,
    signatures: [],
    imports: [],
    exports: [],
    ...overrides,
  }
}

function makeCodemap(files: CompressedFileInfo[]): CompressedCodemap {
  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    projectRoot: "/test",
    totalTokens: files.reduce((s, f) => s + f.tokenCount, 0),
    originalTotalTokens: files.reduce((s, f) => s + f.originalTokenCount, 0),
    compressionRatio: 50,
    files,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 3 — pattern-search", () => {
  it("returns empty for empty query", async () => {
    const mod = await import(codeIntelModuleHref) as {
      searchPatterns: (codemap: CompressedCodemap, query: PatternQuery) => PatternMatch[]
    }

    const codemap = makeCodemap([makeFile({ signatures: [makeSig()] })])
    const result = mod.searchPatterns(codemap, {})

    assert.equal(result.length, 0)
  })

  it("finds function by exact name", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findFunction: (codemap: CompressedCodemap, name: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/auth.ts",
        signatures: [
          makeSig({ name: "login", type: "function", signature: "function login(): void" }),
          makeSig({ name: "logout", type: "function", signature: "function logout(): void" }),
        ],
      }),
    ])

    const matches = mod.findFunction(codemap, "login")

    assert.ok(matches.length >= 1)
    assert.equal(matches[0].signature.name, "login")
    assert.equal(matches[0].relevance, 1)
  })

  it("finds function by substring match with lower relevance", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findFunction: (codemap: CompressedCodemap, name: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/utils.ts",
        signatures: [
          makeSig({ name: "handleUserLogin", type: "function", signature: "function handleUserLogin(): void" }),
        ],
      }),
    ])

    const matches = mod.findFunction(codemap, "login")

    assert.ok(matches.length >= 1)
    assert.equal(matches[0].signature.name, "handleUserLogin")
    assert.ok(matches[0].relevance < 1, "Substring match should have lower relevance")
  })

  it("finds types by name", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findType: (codemap: CompressedCodemap, name: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/types.ts",
        signatures: [
          makeSig({ name: "UserConfig", type: "interface", signature: "interface UserConfig { ... }" }),
          makeSig({ name: "AppState", type: "type", signature: "type AppState = { ... }" }),
          makeSig({ name: "UserService", type: "class", signature: "class UserService { ... }" }),
        ],
      }),
    ])

    const matches = mod.findType(codemap, "UserConfig")

    assert.ok(matches.length >= 1)
    assert.equal(matches[0].signature.name, "UserConfig")
    assert.equal(matches[0].signature.type, "interface")
  })

  it("finds exports by name", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findExport: (codemap: CompressedCodemap, name: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/index.ts",
        signatures: [
          makeSig({ name: "publicApi", exported: true }),
          makeSig({ name: "internalHelper", exported: false }),
        ],
      }),
    ])

    const matches = mod.findExport(codemap, "publicApi")

    assert.ok(matches.length >= 1)
    assert.equal(matches[0].signature.name, "publicApi")
    assert.equal(matches[0].signature.exported, true)
  })

  it("does NOT match non-exported symbols for findExport", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findExport: (codemap: CompressedCodemap, name: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/internal.ts",
        signatures: [
          makeSig({ name: "privateFunc", exported: false }),
        ],
      }),
    ])

    const matches = mod.findExport(codemap, "privateFunc")

    assert.equal(matches.length, 0)
  })

  it("finds by regex pattern", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findByPattern: (codemap: CompressedCodemap, pattern: RegExp) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/async.ts",
        signatures: [
          makeSig({ name: "fetchData", signature: "async function fetchData(): Promise<Data>" }),
          makeSig({ name: "syncCalc", signature: "function syncCalc(): number" }),
        ],
      }),
    ])

    const matches = mod.findByPattern(codemap, /Promise</)

    assert.ok(matches.length >= 1)
    assert.equal(matches[0].signature.name, "fetchData")
  })

  it("finds importers of a module", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findImporters: (codemap: CompressedCodemap, source: string) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/a.ts",
        imports: ["./utils.js", "./config.js"],
        signatures: [makeSig({ name: "funcA" })],
      }),
      makeFile({
        path: "src/b.ts",
        imports: ["./config.js"],
        signatures: [makeSig({ name: "funcB" })],
      }),
      makeFile({
        path: "src/c.ts",
        imports: ["./other.js"],
        signatures: [makeSig({ name: "funcC" })],
      }),
    ])

    const matches = mod.findImporters(codemap, "config")

    // Should find files a.ts and b.ts (both import config)
    const filePaths = [...new Set(matches.map((m) => m.filePath))]
    assert.ok(filePaths.includes("src/a.ts"), "Should include src/a.ts")
    assert.ok(filePaths.includes("src/b.ts"), "Should include src/b.ts")
    assert.ok(!filePaths.includes("src/c.ts"), "Should NOT include src/c.ts")
  })

  it("results are sorted by relevance (highest first)", async () => {
    const mod = await import(codeIntelModuleHref) as {
      searchPatterns: (codemap: CompressedCodemap, query: PatternQuery) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/exact.ts",
        signatures: [makeSig({ name: "login", type: "function" })],
      }),
      makeFile({
        path: "src/partial.ts",
        signatures: [makeSig({ name: "handleLogin", type: "function" })],
      }),
    ])

    const matches = mod.searchPatterns(codemap, { functionName: "login" })

    assert.ok(matches.length >= 2)
    assert.ok(matches[0].relevance >= matches[1].relevance, "First match should have highest relevance")
    assert.equal(matches[0].signature.name, "login")
  })

  it("searches across multiple files", async () => {
    const mod = await import(codeIntelModuleHref) as {
      findByPattern: (codemap: CompressedCodemap, pattern: RegExp) => PatternMatch[]
    }

    const codemap = makeCodemap([
      makeFile({
        path: "src/a.ts",
        signatures: [makeSig({ name: "getUser", signature: "function getUser(): Promise<User>" })],
      }),
      makeFile({
        path: "src/b.ts",
        signatures: [makeSig({ name: "getOrder", signature: "function getOrder(): Promise<Order>" })],
      }),
      makeFile({
        path: "src/c.ts",
        signatures: [makeSig({ name: "calcTotal", signature: "function calcTotal(): number" })],
      }),
    ])

    const matches = mod.findByPattern(codemap, /Promise</)

    assert.equal(matches.length, 2)
    const names = matches.map((m) => m.signature.name)
    assert.ok(names.includes("getUser"))
    assert.ok(names.includes("getOrder"))
    assert.ok(!names.includes("calcTotal"))
  })
})
