import { readFileSync } from "node:fs"
import { extname } from "node:path"

/**
 * Type of the optional `@ast-grep/napi` module. Captured via `typeof import(...)`
 * to keep `verbatimModuleSyntax` happy while remaining a pure type annotation
 * (no static import is emitted).
 */
type AstGrepModule = typeof import("@ast-grep/napi")

/** Cached Promise for the optional `@ast-grep/napi` dynamic import. */
let astGrepCache: Promise<AstGrepModule | null> | null = null

/**
 * Lazily load `@ast-grep/napi`. Returns `null` when the package is not
 * installed (optionalDependency on unsupported platforms) or the native
 * binary fails to load. The Promise is cached so the dynamic import
 * is performed at most once per process.
 *
 * @returns The module namespace, or `null` when unavailable.
 */
export async function getAstGrep(): Promise<AstGrepModule | null> {
  if (astGrepCache === null) {
    astGrepCache = import("@ast-grep/napi")
      .then((m) => m)
      .catch(() => null)
  }
  return astGrepCache
}

/** A single JSDoc block extracted from the source. */
export type JsDocBlock = {
  /** One-based start line of the JSDoc block (the `/**` opener). */
  startLine: number
  /** One-based end line of the JSDoc block (the `*\/` closer). */
  endLine: number
  /** Verbatim comment text including delimiters. */
  content: string
}

/** A single exported symbol. */
export type ExportSymbol = {
  name: string
  /** One-based line number where the export keyword appears. */
  line: number
  kind: "function" | "class" | "variable" | "type"
}

/** A single function or method signature. */
export type FunctionSignature = {
  name: string
  /** One-based line number of the declaration. */
  line: number
  /** Parameter source text segments (e.g. `["name: string"]`). */
  params: string[]
  /** Return type source text when present. */
  returnType?: string
}

/**
 * Unified code inspection result. The shape is identical regardless of
 * which engine (ast-grep or regex fallback) produced it — callers must
 * not be able to tell which engine ran.
 */
export type CodeInspectionResult = {
  jsdocBlocks: JsDocBlock[]
  exports: ExportSymbol[]
  signatures: FunctionSignature[]
}

/** Extensions the bridge knows how to inspect. */
const SUPPORTED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
])

/**
 * Inspect a code file for JSDoc blocks, exports, and function signatures.
 *
 * @param filePath - Absolute path to the code file.
 * @returns Code inspection result. Shape is engine-agnostic; if
 *   `@ast-grep/napi` is not available the regex fallback path produces
 *   the identical structure.
 * @throws {Error} When the file has an unsupported extension. Error
 *   message is prefixed with `[Hivemind]`.
 */
export async function inspectCodeBridge(filePath: string): Promise<CodeInspectionResult> {
  const ext = extname(filePath).toLowerCase()
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`[Hivemind] Unsupported code file extension: ${ext}`)
  }

  const lib = await getAstGrep()
  if (lib !== null) {
    try {
      return inspectWithAstGrep(filePath, lib)
    } catch {
      // AST engine failed (e.g. native binary unloadable post-import);
      // degrade to regex so the caller still gets a result. The shape
      // is identical.
      return inspectWithRegex(filePath)
    }
  }
  return inspectWithRegex(filePath)
}

/**
 * AST-based extraction using `@ast-grep/napi`. Used when the optional
 * dependency is installed and the file is parseable. The result shape
 * MUST match the regex fallback exactly.
 */
function inspectWithAstGrep(filePath: string, lib: AstGrepModule): CodeInspectionResult {
  const content = readFileSync(filePath, "utf-8")
  const root = lib.parse(lib.Lang.TypeScript, content).root()

  // Resolve kind numbers for the types we care about. tree-sitter
  // requires a numeric matcher for `findAll`.
  const K = resolveKindNumbers(lib)

  const jsdocBlocks: JsDocBlock[] = []
  for (const node of root.findAll(K.comment)) {
    const text = node.text()
    if (!text.startsWith("/**")) continue
    const range = node.range()
    jsdocBlocks.push({
      startLine: range.start.line + 1,
      endLine: range.end.line + 1,
      content: text,
    })
  }

  const exports: ExportSymbol[] = []
  const signatures: FunctionSignature[] = []
  const variableDeclaratorKind = kindToNumber(lib, "variable_declarator")
  for (const node of root.findAll(K.exportStatement)) {
    const decl = node.field("declaration")
    if (decl === null) continue
    const declKind = decl.kind()
    // lexical_declaration and variable_declaration have a `name` field
    // on a nested `variable_declarator` child, not on the declaration
    // itself. function/class/interface/type/enum declarations have a
    // direct `name` field.
    let name: string | null = null
    let nameNode = decl.field("name")
    if (nameNode !== null) {
      name = nameNode.text()
    } else {
      // Walk children looking for a variable_declarator.
      for (const child of decl.findAll(variableDeclaratorKind)) {
        const inner = child.field("name")
        if (inner !== null) {
          name = inner.text()
          break
        }
      }
    }
    if (name === null) continue
    const line = decl.range().start.line + 1
    const kind = classifyDeclaration(declKind)
    if (kind !== null) {
      exports.push({ name, line, kind })
    }
    if (kind === "function") {
      signatures.push(extractFunctionSignature(decl))
    }
  }

  // Also pick up function declarations that are not exported (private
  // helpers, internal functions). Class methods are intentionally not
  // surfaced here — the class itself is the public surface.
  for (const node of root.findAll(K.functionDeclaration)) {
    signatures.push(extractFunctionSignature(node))
  }

  return { jsdocBlocks, exports, signatures }
}

/**
 * Resolved kind numbers for the tree-sitter-typescript v0.23.2 grammar
 * that ships with `@ast-grep/napi@0.43.0`. Looked up once per AST
 * extraction call to avoid a per-node dispatch overhead.
 */
type ResolvedKinds = {
  comment: number
  exportStatement: number
  functionDeclaration: number
}

/**
 * Resolve the kind numbers used by `findAll`. Wraps `lib.kind(...)` in
 * a runtime check so the return type is a plain `number` (the ast-grep
 * type union `Kinds<M>` is `NamedKinds | LowPriorityKey` which leaks
 * the string branch; we coerce here rather than cast).
 */
function resolveKindNumbers(lib: AstGrepModule): ResolvedKinds {
  return {
    comment: kindToNumber(lib, "comment"),
    exportStatement: kindToNumber(lib, "export_statement"),
    functionDeclaration: kindToNumber(lib, "function_declaration"),
  }
}

function kindToNumber(lib: AstGrepModule, name: string): number {
  const v = lib.kind(lib.Lang.TypeScript, name)
  if (typeof v === "number") return v
  // ast-grep returns the kind id as a number for known kinds. The
  // string-fallback branch is only hit if tree-sitter has not loaded
  // a grammar; in that case the AST path is unusable and the bridge
  // falls back to regex.
  throw new Error(`[Hivemind] ast-grep did not return a numeric kind for ${name}`)
}

/**
 * Map a tree-sitter kind value to the bridge's `ExportSymbol.kind`
 * literal, or `null` when the kind is not a top-level export surface.
 *
 * @param kind - Either a numeric kind id (the common case at runtime)
 *   or the kind name string (when the value came from a matcher lookup
 *   that did not narrow to a number).
 */
function classifyDeclaration(kind: number | string): ExportSymbol["kind"] | null {
  // Number branches — these are stable per the tree-sitter-typescript
  // v0.23.2 grammar that ships with @ast-grep/napi@0.43.0. They are
  // produced by `decl.kind()` at runtime, and verified in the
  // resolveKindNumbers smoke tests.
  if (kind === 224 || kind === 226) return "function"               // function_declaration, generator_function_declaration
  if (kind === 221 || kind === 282) return "class"                  // class_declaration, abstract_class_declaration
  if (kind === 288 || kind === 293 || kind === 290) return "type"   // interface_declaration, type_alias_declaration, enum_declaration
  if (kind === 184 || kind === 183) return "variable"               // lexical_declaration, variable_declaration
  // String fallback — only used when the ast-grep `kind` function
  // returned the kind name (the named-node branch of `Kinds<M>`).
  if (kind === "function_declaration" || kind === "generator_function_declaration") return "function"
  if (kind === "class_declaration" || kind === "abstract_class_declaration") return "class"
  if (kind === "interface_declaration" || kind === "type_alias_declaration" || kind === "enum_declaration") return "type"
  if (kind === "lexical_declaration" || kind === "variable_declaration") return "variable"
  return null
}

/**
 * Extract a `FunctionSignature` from a function_declaration-shaped node.
 */
function extractFunctionSignature(node: {
  text(): string
  range(): { start: { line: number } }
  field<F extends string>(n: F): { text(): string } | null
}): FunctionSignature {
  const nameNode = node.field("name")
  const name = nameNode !== null ? nameNode.text() : ""
  const paramsNode = node.field("parameters")
  const returnNode = node.field("return_type")
  const paramsText = paramsNode !== null ? paramsNode.text() : "()"
  return {
    name,
    line: node.range().start.line + 1,
    params: parseParamList(paramsText),
    returnType: returnNode !== null ? stripTypeAnnotation(returnNode.text()) : undefined,
  }
}

/**
 * Strip a leading `: ` from a return type annotation text node. ast-grep
 * returns the type annotation including the leading `: ` token; the bridge
 * exposes the type expression only.
 */
function stripTypeAnnotation(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith(":")) {
    return trimmed.slice(1).trim()
  }
  return trimmed
}

/**
 * Parse a `(a: string, b: number)`-shaped parameter list into an array of
 * raw source text segments. Empty parameter lists yield `[]`.
 */
function parseParamList(text: string): string[] {
  const trimmed = text.trim()
  if (trimmed.length < 2) return []
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return []
  const inner = trimmed.slice(1, -1).trim()
  if (inner.length === 0) return []
  return splitTopLevel(inner, ",").map((p) => p.trim()).filter((p) => p.length > 0)
}

/**
 * Split a string on `sep` while respecting nested parentheses, angle
 * brackets, square brackets, and braces (used to split parameter lists
 * where default values or generic types may contain commas).
 */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let last = 0
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === "(" || ch === "[" || ch === "<" || ch === "{") depth++
    else if (ch === ")" || ch === "]" || ch === ">" || ch === "}") depth--
    else if (ch === sep && depth === 0) {
      out.push(input.slice(last, i))
      last = i + 1
    }
  }
  out.push(input.slice(last))
  return out
}

/**
 * Regex-based extraction. Used as the fallback when `@ast-grep/napi` is
 * not installed, the native binary fails to load, or the AST parse throws
 * on malformed source. The output shape is identical to the AST path —
 * callers must not be able to tell which engine produced the result.
 */
function inspectWithRegex(filePath: string): CodeInspectionResult {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  const jsdocBlocks: JsDocBlock[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    if (!line.match(/^\s*\/\*\*\s*$/)) continue
    const startLine = i + 1
    const collected: string[] = [line]
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j] ?? ""
      collected.push(next)
      if (next.match(/\*\//)) {
        jsdocBlocks.push({ startLine, endLine: j + 1, content: collected.join("\n") })
        i = j
        break
      }
    }
  }

  const exports: ExportSymbol[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const m = line.match(/^export\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var|interface|type|enum)\s+(\w+)/)
    if (m === null) continue
    const keyword = m[1] ?? ""
    const name = m[2] ?? ""
    if (name.length === 0) continue
    let kind: ExportSymbol["kind"]
    if (keyword === "function") kind = "function"
    else if (keyword === "class") kind = "class"
    else if (keyword === "interface" || keyword === "type" || keyword === "enum") kind = "type"
    else kind = "variable"
    exports.push({ name, line: i + 1, kind })
  }

  const signatures: FunctionSignature[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const m = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+?))?(?:\s*\{)?$/)
    if (m === null || m[1] === undefined) continue
    signatures.push({
      name: m[1],
      line: i + 1,
      params: splitTopLevel(m[2] ?? "", ",").map((p) => p.trim()).filter((p) => p.length > 0),
      returnType: m[3] !== undefined ? m[3].trim() : undefined,
    })
  }

  return { jsdocBlocks, exports, signatures }
}
