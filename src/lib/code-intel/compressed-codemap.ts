import type { CodeMapEntry as _CodeMapEntry } from "./codemap-io.js"

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
