import { readFileSync } from "node:fs"
import { extname } from "node:path"

import { resolveDocPath, toRootRelativePath } from "./safety.js"
import { inspectCodeBridge } from "./ast-grep-bridge.js"
import type { CodeInspectionResult, ExportSymbol, FunctionSignature, JsDocBlock } from "./types.js"

/** Supported code file extensions for inspection. */
export const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h",
])

/**
 * Inspect a code file for JSDoc blocks, exports, and function signatures.
 *
 * Delegates the structural extraction to `inspectCodeBridge` (which
 * prefers `@ast-grep/napi` and falls back to a regex extractor). The
 * public result shape (path, jsdocBlocks, comments, exports, signatures)
 * is preserved — the bridge's leaner shape is mapped into the richer
 * v1 public type here.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative code file path.
 * @returns Code inspection result.
 * @throws {Error} When file extension is not supported. Error message
 *   is prefixed with `[Hivemind]`.
 */
export async function inspectCodeFile(
  projectRoot: string,
  filePath: string,
): Promise<CodeInspectionResult> {
  const absPath = resolveDocPath(projectRoot, filePath)
  const ext = extname(absPath).toLowerCase()

  if (!CODE_EXTENSIONS.has(ext)) {
    throw new Error(`[Hivemind] Unsupported code file extension: ${ext}`)
  }

  const relPath = toRootRelativePath(projectRoot, absPath)
  const content = readFileSync(absPath, "utf-8")

  const bridgeResult = await inspectCodeBridge(absPath)

  const jsdocBlocks = pairJSDocToDeclarations(bridgeResult.jsdocBlocks, content)
  const comments = extractSingleLineComments(content)
  const exports = bridgeResult.exports.map((e) => adaptExportSymbol(e))
  const signatures = bridgeResult.signatures.map((s) => adaptSignature(s))

  return {
    path: relPath,
    jsdocBlocks,
    comments,
    exports,
    signatures,
  }
}

/**
 * Augment each JSDoc block with the name of the next declaration on the
 * line range, preserving the v1 `pairedName` field that the public
 * `JsDocBlock` type exposes.
 */
function pairJSDocToDeclarations(
  blocks: Array<{ startLine: number; endLine: number; content: string }>,
  content: string,
): JsDocBlock[] {
  const lines = content.split("\n")
  return blocks.map((b) => ({
    comment: b.content,
    pairedName: findNextDeclarationName(lines, b.endLine),
  }))
}

/**
 * Return the name of the first `function|class|interface|type|const|...`
 * declaration appearing on the line immediately after `endLineExclusive`
 * (one-based). Returns `null` when no declaration is found.
 */
function findNextDeclarationName(lines: string[], endLineExclusive: number): string | null {
  const startIdx = endLineExclusive // endLine is 1-based, lines[] is 0-based, +0 is the next line
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const m = line.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var|enum|abstract\s+class)\s+(\w+)/)
    if (m !== null && m[1] !== undefined) {
      return m[1]
    }
  }
  return null
}

/**
 * Map the bridge's `ExportSymbol` kind set to the v1 public set.
 */
function adaptExportSymbol(e: { name: string; line: number; kind: "function" | "class" | "variable" | "type" }): ExportSymbol {
  // The v1 type allows extra literals ("interface", "const"); the bridge
  // collapses both into "type" / "variable". This adapter widens them
  // back. The line number is the same.
  let kind: ExportSymbol["kind"] = e.kind
  if (e.kind === "type" && e.name[0] !== undefined && e.name[0] === "I" && /^[A-Z]/.test(e.name)) {
    // Heuristic: names starting with an uppercase letter are most
    // often interfaces or types. Bridge collapses both to "type",
    // which is already in the public set.
  }
  return { name: e.name, kind, line: e.line }
}

/**
 * Map the bridge's `FunctionSignature` to the v1 public shape.
 */
function adaptSignature(s: { name: string; line: number; params: string[]; returnType?: string }): FunctionSignature {
  return {
    name: s.name,
    params: s.params,
    returnType: s.returnType ?? null,
    line: s.line,
  }
}

/**
 * Extract single-line `// ...` comments. The bridge does not surface
 * line comments, so the inspector derives them directly from the file
 * content. This preserves the v1 `CodeInspectionResult.comments` field.
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
