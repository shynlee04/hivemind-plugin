import { readFile } from "node:fs/promises"
import { join, extname } from "node:path"
import { createHash } from "node:crypto"

import type { CodeMap, CodeMapEntry } from "./codemap-io.js"
import type { TreeSitterInstance } from "./tree-sitter-loader.js"
import { countTokens } from "./token-counter.js"
import { extractSignatures, extractImportsRegex, extractExportsRegex } from "./signature-extractor.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface Signature {
  type: "function" | "class" | "interface" | "type" | "variable" | "import"
  name: string
  signature: string
  lineStart: number
  lineEnd: number
  docstring?: string
  parameters?: Parameter[]
  returnType?: string
  exported: boolean
}

export interface Parameter {
  name: string
  type?: string
  optional: boolean
  default?: string
}

export interface CompressedFileInfo {
  path: string
  hash: string
  extension: string
  tokenCount: number
  originalTokenCount: number
  signatures: Signature[]
  imports: string[]
  exports: string[]
}

export interface CompressedCodemap {
  version: string
  createdAt: string
  projectRoot: string
  totalTokens: number
  originalTotalTokens: number
  compressionRatio: number
  files: CompressedFileInfo[]
}

// ─── Factory ────────────────────────────────────────────────────────────

export function createEmptyCompressedCodemap(projectRoot: string): CompressedCodemap {
  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    projectRoot,
    totalTokens: 0,
    originalTotalTokens: 0,
    compressionRatio: 1,
    files: [],
  }
}

export function computeCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 1
  return Number(((1 - compressed / original) * 100).toFixed(1))
}

// ─── Compression Options ────────────────────────────────────────────────

export interface CompressOptions {
  /** Project root directory (absolute path) */
  projectRoot: string
  /** TreeSitterInstance for AST-based extraction (optional, falls back to regex) */
  treeSitter?: TreeSitterInstance | null
  /** Maximum file size to process in bytes (default: 512KB) */
  maxFileSize?: number
  /** Skip files with secrets from compressed output (default: true) */
  skipSecrets?: boolean
  /** Include import statements in signatures (default: true) */
  includeImports?: boolean
}

// ─── Compression Pipeline ───────────────────────────────────────────────

/**
 * Compress a full CodeMap into a CompressedCodemap.
 *
 * For each file in the CodeMap:
 * 1. Read file content from disk
 * 2. Extract signatures (AST-based if tree-sitter available, regex fallback)
 * 3. Extract import paths and export names
 * 4. Count compressed tokens (signatures only)
 * 5. Compute compression ratio
 *
 * Files that can't be read or are too large are skipped.
 */
export async function compressCodemap(
  codemap: CodeMap,
  options: CompressOptions,
): Promise<CompressedCodemap> {
  const {
    projectRoot,
    treeSitter = null,
    maxFileSize = 512 * 1024,
    skipSecrets = true,
    includeImports = true,
  } = options

  const result = createEmptyCompressedCodemap(projectRoot)
  let totalOriginalTokens = 0
  let totalCompressedTokens = 0

  for (const entry of codemap.files) {
    // Skip files with secrets if configured
    if (skipSecrets && entry.hasSecrets) continue

    // Skip files that are too large
    if (entry.size > maxFileSize) continue

    const compressed = await compressFile(entry, projectRoot, treeSitter, includeImports)
    if (compressed) {
      result.files.push(compressed)
      totalOriginalTokens += compressed.originalTokenCount
      totalCompressedTokens += compressed.tokenCount
    }
  }

  result.originalTotalTokens = totalOriginalTokens
  result.totalTokens = totalCompressedTokens
  result.compressionRatio = computeCompressionRatio(totalOriginalTokens, totalCompressedTokens)

  return result
}

/**
 * Compress a single file: read content, extract signatures, compute tokens.
 * Returns null if the file can't be read.
 */
async function compressFile(
  entry: CodeMapEntry,
  projectRoot: string,
  treeSitter: TreeSitterInstance | null,
  includeImports: boolean,
): Promise<CompressedFileInfo | null> {
  const absolutePath = join(projectRoot, entry.filePath)
  const ext = extname(entry.filePath)

  let content: string
  try {
    content = await readFile(absolutePath, "utf-8")
  } catch {
    return null
  }

  // Compute content hash
  const hash = createHash("sha256").update(content).digest("hex")

  // Get language from the entry or detect from extension
  const language = entry.language || ext.replace(/^\./, "")

  // Parse with tree-sitter if available
  let astRoot = null
  if (treeSitter) {
    astRoot = treeSitter.parse(content, language)
  }

  // Extract signatures
  const signatures = await extractSignatures({
    path: entry.filePath,
    language,
    content,
    astRoot,
  })

  // Filter out imports from signatures if not wanted
  const filteredSignatures = includeImports
    ? signatures
    : signatures.filter((s) => s.type !== "import")

  // Extract imports and exports using regex (fast, always available)
  const imports = extractImportsRegex(content)
  const exports = extractExportsRegex(content)

  // Build the compressed text representation for token counting
  const compressedText = buildCompressedText(entry.filePath, filteredSignatures, imports, exports)
  const compressedTokenCount = countTokens(compressedText)

  return {
    path: entry.filePath,
    hash,
    extension: ext,
    tokenCount: compressedTokenCount,
    originalTokenCount: entry.tokenCount,
    signatures: filteredSignatures,
    imports,
    exports,
  }
}

/**
 * Build a compressed text representation of a file.
 * Used to count how many tokens the compressed version takes.
 */
function buildCompressedText(
  filePath: string,
  signatures: Signature[],
  imports: string[],
  exports: string[],
): string {
  const parts: string[] = []

  parts.push(`// ${filePath}`)

  if (imports.length > 0) {
    parts.push(`// imports: ${imports.join(", ")}`)
  }

  if (exports.length > 0) {
    parts.push(`// exports: ${exports.join(", ")}`)
  }

  for (const sig of signatures) {
    if (sig.type === "import") continue // Already captured in imports section

    let line = sig.exported ? "export " : ""
    line += sig.signature

    if (sig.docstring) {
      // Only include the first line of docstring to save tokens
      const firstLine = sig.docstring.split("\n")[0] ?? ""
      parts.push(firstLine)
    }

    parts.push(line)
  }

  return parts.join("\n")
}

// ─── Single-file compression (for incremental updates) ──────────────────

/**
 * Compress a single file by path. Reads from disk, extracts signatures,
 * returns a CompressedFileInfo. Returns null if the file can't be read.
 */
export async function compressSingleFile(
  filePath: string,
  projectRoot: string,
  language: string,
  treeSitter?: TreeSitterInstance | null,
): Promise<CompressedFileInfo | null> {
  const absolutePath = join(projectRoot, filePath)
  const ext = extname(filePath)

  let content: string
  try {
    content = await readFile(absolutePath, "utf-8")
  } catch {
    return null
  }

  const hash = createHash("sha256").update(content).digest("hex")
  const originalTokenCount = countTokens(content)

  let astRoot = null
  if (treeSitter) {
    astRoot = treeSitter.parse(content, language)
  }

  const signatures = await extractSignatures({
    path: filePath,
    language,
    content,
    astRoot,
  })

  const imports = extractImportsRegex(content)
  const exports = extractExportsRegex(content)

  const compressedText = buildCompressedText(filePath, signatures, imports, exports)
  const compressedTokenCount = countTokens(compressedText)

  return {
    path: filePath,
    hash,
    extension: ext,
    tokenCount: compressedTokenCount,
    originalTokenCount,
    signatures,
    imports,
    exports,
  }
}

// ─── Serialization ──────────────────────────────────────────────────────

/**
 * Serialize a CompressedCodemap to a human-readable string representation.
 * This is what gets injected into context windows.
 */
export function renderCompressedCodemap(codemap: CompressedCodemap): string {
  const lines: string[] = []

  lines.push(`# Codebase: ${codemap.projectRoot}`)
  lines.push(`# Files: ${codemap.files.length} | Tokens: ${codemap.totalTokens} (${codemap.compressionRatio}% compressed)`)
  lines.push("")

  for (const file of codemap.files) {
    lines.push(`## ${file.path}`)

    if (file.imports.length > 0) {
      lines.push(`  imports: ${file.imports.join(", ")}`)
    }

    if (file.exports.length > 0) {
      lines.push(`  exports: ${file.exports.join(", ")}`)
    }

    for (const sig of file.signatures) {
      if (sig.type === "import") continue

      const prefix = sig.exported ? "export " : "  "
      lines.push(`${prefix}${sig.signature} [L${sig.lineStart}-${sig.lineEnd}]`)
    }

    lines.push("")
  }

  return lines.join("\n")
}
