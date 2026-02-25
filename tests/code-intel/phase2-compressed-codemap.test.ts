import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const codeIntelModuleHref = new URL("../../src/lib/code-intel/index.ts", import.meta.url).href

// ─── Type aliases for dynamic imports ────────────────────────────────────

type CompressedCodemap = {
  version: string
  createdAt: string
  projectRoot: string
  totalTokens: number
  originalTotalTokens: number
  compressionRatio: number
  files: CompressedFileInfo[]
}

type CompressedFileInfo = {
  path: string
  hash: string
  extension: string
  tokenCount: number
  originalTokenCount: number
  signatures: Array<{ name: string; type: string; signature: string; exported: boolean }>
  imports: string[]
  exports: string[]
}

type CodeMap = {
  files: Array<{
    filePath: string
    language: string
    hash: string
    size: number
    lineCount: number
    tokenCount: number
    hasSecrets: boolean
    secretTypes: string[]
    lastModified: string
  }>
  totalFiles: number
  totalTokens: number
  totalSize: number
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe("Phase 2 — compressed-codemap: factory + ratio", () => {
  it("exports createEmptyCompressedCodemap and computeCompressionRatio", async () => {
    const mod = await import(codeIntelModuleHref)
    assert.equal(typeof mod.createEmptyCompressedCodemap, "function")
    assert.equal(typeof mod.computeCompressionRatio, "function")
  })

  it("createEmptyCompressedCodemap returns valid structure", async () => {
    const mod = await import(codeIntelModuleHref)
    const create = mod.createEmptyCompressedCodemap as (root: string) => CompressedCodemap

    const result = create("/test/project")
    assert.equal(result.version, "1.0.0")
    assert.equal(result.projectRoot, "/test/project")
    assert.equal(result.totalTokens, 0)
    assert.equal(result.originalTotalTokens, 0)
    assert.equal(result.compressionRatio, 1)
    assert.ok(Array.isArray(result.files))
    assert.equal(result.files.length, 0)
    assert.ok(result.createdAt.length > 0)
  })

  it("computeCompressionRatio returns correct percentages", async () => {
    const mod = await import(codeIntelModuleHref)
    const ratio = mod.computeCompressionRatio as (original: number, compressed: number) => number

    // 100 original, 30 compressed = 70% compression
    assert.equal(ratio(100, 30), 70)

    // 0 original = 1 (avoid div by zero)
    assert.equal(ratio(0, 0), 1)

    // 1000 original, 250 compressed = 75% compression
    assert.equal(ratio(1000, 250), 75)

    // No compression (same size) = 0%
    assert.equal(ratio(100, 100), 0)
  })
})

describe("Phase 2 — compressed-codemap: compressSingleFile", () => {
  it("exports compressSingleFile from barrel", async () => {
    const mod = await import(codeIntelModuleHref)
    assert.equal(typeof mod.compressSingleFile, "function")
  })

  it("compresses a TypeScript file and extracts signatures + imports", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
      treeSitter?: null,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-compress-single-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })
      const tsContent = [
        'import { join } from "node:path"',
        "",
        "export interface Config {",
        "  name: string",
        "  debug: boolean",
        "}",
        "",
        "export function loadConfig(path: string): Config {",
        "  return { name: path, debug: false }",
        "}",
        "",
        "export class ConfigLoader {",
        "  private path: string",
        "  constructor(p: string) { this.path = p }",
        "  load(): Config { return loadConfig(this.path) }",
        "}",
      ].join("\n")

      await writeFile(join(projectRoot, "src", "config.ts"), tsContent, "utf-8")

      const result = await compressSingleFile("src/config.ts", projectRoot, "typescript", null)

      assert.ok(result !== null, "compressSingleFile should return non-null for a valid file")
      assert.equal(result.path, "src/config.ts")
      assert.equal(result.extension, ".ts")
      assert.ok(result.hash.length === 64, "hash should be SHA-256 (64 hex chars)")
      assert.ok(result.originalTokenCount > 0, "original token count should be > 0")
      assert.ok(result.tokenCount > 0, "compressed token count should be > 0")
      assert.ok(result.tokenCount <= result.originalTokenCount, "compressed should be <= original")

      // Should have found signatures via regex fallback
      assert.ok(result.signatures.length > 0, "should extract at least one signature")

      // Should have found imports
      assert.ok(result.imports.length > 0, "should extract imports")
      assert.ok(result.imports.some((imp: string) => imp.includes("node:path")), "should find node:path import")

      // Should have found exports
      assert.ok(result.exports.length > 0, "should extract exports")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it("returns null for non-existent file", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressSingleFile = mod.compressSingleFile as (
      filePath: string,
      projectRoot: string,
      language: string,
    ) => Promise<CompressedFileInfo | null>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-compress-null-"))
    try {
      const result = await compressSingleFile("nonexistent.ts", projectRoot, "typescript")
      assert.equal(result, null)
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

describe("Phase 2 — compressed-codemap: renderCompressedCodemap", () => {
  it("renders a CompressedCodemap to human-readable string", async () => {
    const mod = await import(codeIntelModuleHref)
    const render = mod.renderCompressedCodemap as (codemap: CompressedCodemap) => string

    const codemap: CompressedCodemap = {
      version: "1.0.0",
      createdAt: "2026-02-25T00:00:00.000Z",
      projectRoot: "/test/project",
      totalTokens: 50,
      originalTotalTokens: 200,
      compressionRatio: 75,
      files: [
        {
          path: "src/main.ts",
          hash: "abc123",
          extension: ".ts",
          tokenCount: 30,
          originalTokenCount: 120,
          signatures: [
            {
              name: "main",
              type: "function",
              signature: "function main(): void",
              exported: true,
            },
          ],
          imports: ["node:path", "node:fs"],
          exports: ["main"],
        },
      ],
    }

    const output = render(codemap)
    assert.ok(output.includes("# Codebase: /test/project"), "should include project root header")
    assert.ok(output.includes("75% compressed"), "should include compression ratio")
    assert.ok(output.includes("## src/main.ts"), "should include file heading")
    assert.ok(output.includes("node:path"), "should include imports")
    assert.ok(output.includes("function main(): void"), "should include signature")
  })
})

describe("Phase 2 — compressed-codemap: full pipeline compressCodemap", () => {
  it("compresses a multi-file CodeMap and achieves compression", async () => {
    const mod = await import(codeIntelModuleHref)
    const compressCodemap = mod.compressCodemap as (
      codemap: CodeMap,
      options: { projectRoot: string },
    ) => Promise<CompressedCodemap>

    const projectRoot = await mkdtemp(join(tmpdir(), "hm-compress-full-"))

    try {
      await mkdir(join(projectRoot, "src"), { recursive: true })

      // Create a file with enough content to show compression
      const tsContent = [
        'import { readFile } from "node:fs/promises"',
        'import { join } from "node:path"',
        "",
        "/**",
        " * Load configuration from disk",
        " */",
        "export async function loadConfig(configPath: string): Promise<Record<string, unknown>> {",
        "  const fullPath = join(process.cwd(), configPath)",
        '  const raw = await readFile(fullPath, "utf-8")',
        "  const parsed = JSON.parse(raw) as Record<string, unknown>",
        "  if (!parsed) throw new Error('Invalid config')",
        "  return parsed",
        "}",
        "",
        "export interface AppConfig {",
        "  name: string",
        "  version: string",
        "  debug: boolean",
        "  port: number",
        "  host: string",
        "}",
        "",
        "export class ConfigManager {",
        "  private cache: Map<string, unknown> = new Map()",
        "  constructor(private basePath: string) {}",
        "  async get(key: string): Promise<unknown> {",
        "    if (this.cache.has(key)) return this.cache.get(key)",
        '    const val = await loadConfig(join(this.basePath, key + ".json"))',
        "    this.cache.set(key, val)",
        "    return val",
        "  }",
        "  clear(): void { this.cache.clear() }",
        "}",
      ].join("\n")

      await writeFile(join(projectRoot, "src", "config.ts"), tsContent, "utf-8")

      // Build a matching CodeMap manually
      const { createHash } = await import("node:crypto")
      const hash = createHash("sha256").update(tsContent).digest("hex")
      const tokenCount = Math.ceil(tsContent.length / 4) // rough approximation

      const codemap: CodeMap = {
        files: [
          {
            filePath: "src/config.ts",
            language: "typescript",
            hash,
            size: Buffer.byteLength(tsContent),
            lineCount: tsContent.split("\n").length,
            tokenCount,
            hasSecrets: false,
            secretTypes: [],
            lastModified: new Date().toISOString(),
          },
        ],
        totalFiles: 1,
        totalTokens: tokenCount,
        totalSize: Buffer.byteLength(tsContent),
      }

      const result = await compressCodemap(codemap, { projectRoot })

      assert.ok(result.files.length > 0, "should have compressed at least one file")
      assert.ok(result.totalTokens > 0, "compressed total tokens should be > 0")
      assert.ok(result.originalTotalTokens > 0, "original total tokens should be > 0")
      assert.ok(result.compressionRatio > 0, "compression ratio should be > 0 (some compression achieved)")
      assert.equal(result.version, "1.0.0")
      assert.equal(result.projectRoot, projectRoot)

      // Verify file-level data
      const fileInfo = result.files[0]
      assert.ok(fileInfo, "should have file info")
      assert.equal(fileInfo.path, "src/config.ts")
      assert.ok(fileInfo.signatures.length > 0, "should have extracted signatures")
      assert.ok(fileInfo.imports.length > 0, "should have extracted imports")
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
