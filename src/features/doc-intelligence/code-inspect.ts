import { readFileSync } from "node:fs"
import { extname } from "node:path"

import { resolveDocPath, toRootRelativePath } from "./safety.js"
import type { CodeInspectionResult, ExportSymbol, FunctionSignature, JsDocBlock } from "./types.js"

/** Supported code file extensions for inspection. */
export const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h",
])

/**
 * Inspect a code file for JSDoc blocks, exports, and function signatures.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative code file path.
 * @returns Code inspection result.
 * @throws {Error} When file extension is not supported.
 */
export function inspectCodeFile(
  projectRoot: string,
  filePath: string,
): CodeInspectionResult {
  const absPath = resolveDocPath(projectRoot, filePath)
  const ext = extname(absPath).toLowerCase()

  if (!CODE_EXTENSIONS.has(ext)) {
    throw new Error(`[Harness] Unsupported code file extension: ${ext}`)
  }

  const content = readFileSync(absPath, "utf-8")
  const relPath = toRootRelativePath(projectRoot, absPath)

  const jsdocBlocks = extractJsDocBlocks(content)
  const comments = extractSingleLineComments(content)
  const exports = extractExports(content)
  const signatures = extractSignatures(content)

  return {
    path: relPath,
    jsdocBlocks,
    comments,
    exports,
    signatures,
  }
}

/**
 * Extract JSDoc comment blocks paired with their next declaration.
 */
function extractJsDocBlocks(content: string): JsDocBlock[] {
  const blocks: JsDocBlock[] = []
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g
  let match: RegExpExecArray | null

  while ((match = jsdocRegex.exec(content)) !== null) {
    const comment = match[0]
    const pos = match.index + match[0].length
    const rest = content.slice(pos).trimStart()

    const declMatch = rest.match(/^(?:export\s+)?(?:default\s+)?(?:function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/)
    blocks.push({
      comment,
      pairedName: declMatch ? declMatch[1] : null,
    })
  }

  return blocks
}

/**
 * Extract single-line comments.
 */
function extractSingleLineComments(content: string): string[] {
  const comments: string[] = []
  const lineRegex = /\/\/.*$/gm
  let match: RegExpExecArray | null

  while ((match = lineRegex.exec(content)) !== null) {
    comments.push(match[0].trim())
  }

  return comments
}

/**
 * Extract exported symbols.
 */
function extractExports(content: string): ExportSymbol[] {
  const exports: ExportSymbol[] = []
  const lines = content.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const m = /^export\s+(?:default\s+)?(function|class|interface|type|const|let|var|enum)\s+(\w+)/.exec(line)
    if (m) {
      let kind: ExportSymbol["kind"]
      if (m[1] === "class") kind = "class"
      else if (m[1] === "interface") kind = "interface"
      else if (m[1] === "type") kind = "type"
      else if (m[1] === "const") kind = "const"
      else if (m[1] === "let" || m[1] === "var") kind = "variable"
      else kind = "function"

      exports.push({ name: m[2], kind, line: i + 1 })
      continue
    }

    const namedMatch = /^export\s+\{\s*(\w+)/.exec(line)
    if (namedMatch) {
      exports.push({ name: namedMatch[1], kind: "variable", line: i + 1 })
    }
  }

  return exports
}

/**
 * Extract function/method signatures.
 */
function extractSignatures(content: string): FunctionSignature[] {
  const signatures: FunctionSignature[] = []
  const lines = content.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    const fnMatch = /(?:export\s+)?(?:async\s+)?function\s+(?:(\w+)\s*|\*)?\s*\(([^)]*)\)\s*(?::\s*([^{{]+))?/.exec(line)
    if (fnMatch && fnMatch[1]) {
      signatures.push({
        name: fnMatch[1],
        params: parseParams(fnMatch[2]),
        returnType: fnMatch[3]?.trim() || null,
        line: i + 1,
      })
      continue
    }

    const arrowMatch = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s+)?(?:function\s*)?\(([^)]*)\)\s*(?::\s*([^{{]+))?\s*(?:=>|\{)/.exec(line)
    if (arrowMatch) {
      signatures.push({
        name: arrowMatch[1],
        params: parseParams(arrowMatch[2]),
        returnType: arrowMatch[3]?.trim() || null,
        line: i + 1,
      })
    }
  }

  return signatures
}

/**
 * Parse parameter string into array of parameter names.
 */
function parseParams(paramsStr: string): string[] {
  if (!paramsStr || !paramsStr.trim()) return []
  return paramsStr.split(",").map((p) => {
    const trimmed = p.trim()
    const nameMatch = trimmed.match(/^(\w+)/)
    return nameMatch ? nameMatch[1] : trimmed
  }).filter(Boolean)
}
