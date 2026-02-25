import { readFile, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"

import MagicString from "magic-string"

import { countTokens } from "./token-counter.js"
import { extractSignatures, type Signature } from "./signature-extractor.js"
import type { TreeSitterInstance } from "./tree-sitter-loader.js"
import { extensionToLanguage } from "./tree-sitter-loader.js"

export interface SkeletonMap {
  path: string
  imports: string[]
  exports: string[]
  signatures: Array<{
    type: string
    name: string
    signature: string
    startIndex: number
    endIndex: number
    docstring?: string
  }>
  compressedView: string
  originalTokens: number
  skeletonTokens: number
}

export interface PatchResult {
  success: boolean
  bytesChanged: number
  backup: string
  error?: string
}

export interface ByteRange {
  startIndex: number
  endIndex: number
  text: string
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values))
}

function buildCompressedView(path: string, imports: string[], exports: string[], signatures: Signature[]): string {
  const lines: string[] = []
  lines.push(`// ${path}`)

  if (imports.length > 0) {
    lines.push(`// imports: ${imports.join(", ")}`)
  }

  if (exports.length > 0) {
    lines.push(`// exports: ${exports.join(", ")}`)
  }

  for (const sig of signatures) {
    if (sig.type === "import") continue
    if (sig.docstring) {
      const firstLine = sig.docstring.split("\n")[0]?.trim()
      if (firstLine) lines.push(firstLine)
    }
    lines.push(sig.signature)
  }

  return lines.join("\n")
}

export class ASTSurgeon {
  constructor(
    private projectRoot: string,
    private treeSitter: TreeSitterInstance,
  ) {}

  private async readWithSignatures(filePath: string): Promise<{
    content: string
    signatures: Signature[]
  } | null> {
    const absolutePath = join(this.projectRoot, filePath)

    let content: string
    try {
      content = await readFile(absolutePath, "utf-8")
    } catch {
      return null
    }

    const extension = extname(filePath)
    const language = extensionToLanguage(extension) ?? extension.replace(/^\./, "")
    const astRoot = this.treeSitter.parse(content, language)
    const signatures = await extractSignatures({
      path: filePath,
      language,
      content,
      astRoot,
    })

    return { content, signatures }
  }

  async extractSkeleton(filePath: string): Promise<SkeletonMap | null> {
    const result = await this.readWithSignatures(filePath)
    if (!result) return null

    const imports = dedupe(result.signatures.filter((sig) => sig.type === "import").map((sig) => sig.name))
    const exports = dedupe(result.signatures.filter((sig) => sig.exported && sig.type !== "import").map((sig) => sig.name))
    const compressedView = buildCompressedView(filePath, imports, exports, result.signatures)

    return {
      path: filePath,
      imports,
      exports,
      signatures: result.signatures.map((sig) => ({
        type: sig.type,
        name: sig.name,
        signature: sig.signature,
        startIndex: sig.startIndex,
        endIndex: sig.endIndex,
        docstring: sig.docstring,
      })),
      compressedView,
      originalTokens: countTokens(result.content),
      skeletonTokens: countTokens(compressedView),
    }
  }

  async getSymbolRange(filePath: string, symbolName: string): Promise<ByteRange | null> {
    const result = await this.readWithSignatures(filePath)
    if (!result) return null

    const symbol = result.signatures.find((sig) => sig.name === symbolName)
    if (!symbol) return null

    return {
      startIndex: symbol.startIndex,
      endIndex: symbol.endIndex,
      text: result.content.slice(symbol.startIndex, symbol.endIndex),
    }
  }

  async patchSymbol(filePath: string, symbolName: string, newCode: string): Promise<PatchResult> {
    const absolutePath = join(this.projectRoot, filePath)
    const result = await this.readWithSignatures(filePath)

    if (!result) {
      return {
        success: false,
        bytesChanged: 0,
        backup: "",
        error: `Unable to read file: ${filePath}`,
      }
    }

    const backup = result.content
    const symbol = result.signatures.find((sig) => sig.name === symbolName)
    if (!symbol) {
      return {
        success: false,
        bytesChanged: 0,
        backup,
        error: `Symbol not found: ${symbolName}`,
      }
    }

    try {
      const editor = new MagicString(result.content)
      editor.overwrite(symbol.startIndex, symbol.endIndex, newCode)
      const patched = editor.toString()
      await writeFile(absolutePath, patched, "utf-8")

      return {
        success: true,
        bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(result.content)),
        backup,
      }
    } catch (cause) {
      return {
        success: false,
        bytesChanged: 0,
        backup,
        error: cause instanceof Error ? cause.message : String(cause),
      }
    }
  }
}
