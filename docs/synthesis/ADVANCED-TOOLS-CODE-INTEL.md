Step 0: Update the Signature Interface
Before pasting the new files, you must add the startIndex and endIndex properties to the Signature interface in src/lib/code-intel/compressed-codemap.ts (around line 12):

TypeScript
export interface Signature {
  type: "function" | "class" | "interface" | "type" | "variable" | "import"
  name: string
  signature: string
  lineStart: number
  lineEnd: number
  startIndex: number // NEW: Exact starting string index for magic-string patching
  endIndex: number   // NEW: Exact ending string index for magic-string patching
  docstring?: string
  parameters?: Parameter[]
  returnType?: string
  exported: boolean
}
1. src/lib/code-intel/tree-sitter-loader.ts
The Fix: Added startIndex and endIndex to the TreeSitterNode interface and mapped them from the WASM node in adaptNode(). This ensures byte-perfect coordinates survive the WASM boundary.

TypeScript
import { join, dirname } from "node:path"
import { readFile } from "node:fs/promises"

// ─── Types ──────────────────────────────────────────────────────────────

export interface TreeSitterInstance {
  parse(content: string, language: string): TreeSitterNode | null
  getLanguages(): string[]
  isLanguageSupported(extension: string): boolean
  dispose(): void
}

export interface TreeSitterNode {
  type: string
  text: string
  startIndex: number // <-- FIX: Capture exact starting offset
  endIndex: number   // <-- FIX: Capture exact ending offset
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
  isNamed: boolean
  childForFieldName(fieldName: string): TreeSitterNode | null
  childrenForFieldName(fieldName: string): TreeSitterNode[]
}

export type TreeSitterInitFailure = {
  code: "TREE_SITTER_INIT_FAILED"
  message: string
  language?: string
  cause: unknown
}

// ─── Extension → Language mapping ───────────────────────────────────────

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript", ".tsx": "tsx",
  ".js": "javascript", ".jsx": "javascript",
  ".mjs": "javascript", ".cjs": "javascript",
  ".json": "json", ".py": "python",
  ".go": "go", ".rs": "rust",
}

const LANGUAGE_TO_PACKAGE: Record<string, string> = {
  typescript: "tree-sitter-typescript",
  tsx: "tree-sitter-typescript",
  javascript: "tree-sitter-javascript",
  json: "tree-sitter-json",
  python: "tree-sitter-python",
  go: "tree-sitter-go",
  rust: "tree-sitter-rust",
}

const LANGUAGE_WASM_SUBPATH: Record<string, string> = {
  typescript: "tree-sitter-typescript.wasm",
  tsx: "tree-sitter-tsx.wasm",
  javascript: "tree-sitter-javascript.wasm",
  json: "tree-sitter-json.wasm",
  python: "tree-sitter-python.wasm",
  go: "tree-sitter-go.wasm",
  rust: "tree-sitter-rust.wasm",
}

// ─── Helpers ────────────────────────────────────────────────────────────

function toInitFailure(message: string, cause: unknown, language?: string): TreeSitterInitFailure {
  return { code: "TREE_SITTER_INIT_FAILED", message, language, cause }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Convert a web-tree-sitter Node into our simplified TreeSitterNode interface.
 * Captures EXACT string offsets for AST Surgeon patching.
 */
function adaptNode(node: any): TreeSitterNode {
  return {
    type: node.type,
    text: node.text,
    startIndex: node.startIndex, // FIXED
    endIndex: node.endIndex,     // FIXED
    startPosition: { row: node.startPosition.row, column: node.startPosition.column },
    endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    isNamed: node.isNamed,
    get children(): TreeSitterNode[] {
      return (node.children as any[]).map(adaptNode)
    },
    childForFieldName(fieldName: string): TreeSitterNode | null {
      const child = node.childForFieldName(fieldName)
      return child ? adaptNode(child) : null
    },
    childrenForFieldName(fieldName: string): TreeSitterNode[] {
      return (node.childrenForFieldName(fieldName) as any[]).map(adaptNode)
    },
  }
}

async function resolveLanguageWasm(language: string): Promise<string | null> {
  const packageName = LANGUAGE_TO_PACKAGE[language]
  const wasmSubpath = LANGUAGE_WASM_SUBPATH[language]
  if (!packageName || !wasmSubpath) return null

  try {
    const packageJsonPath = await findPackageRoot(packageName)
    if (packageJsonPath) return join(dirname(packageJsonPath), wasmSubpath)
  } catch { /* Fall through */ }

  try {
    const treeSitterPkg = await findPackageRoot("web-tree-sitter")
    if (treeSitterPkg) {
      const nodeModules = dirname(dirname(treeSitterPkg))
      return join(nodeModules, packageName, wasmSubpath)
    }
  } catch { /* Fall through */ }

  return null
}

async function findPackageRoot(packageName: string): Promise<string | null> {
  try {
    const { createRequire } = await import("node:module")
    const require = createRequire(import.meta.url)
    return require.resolve(`${packageName}/package.json`)
  } catch {
    return null
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Factory (recommended API) ──────────────────────────────────────────

let parserInitialized = false

export interface TreeSitterFactory {
  getInstance(): Promise<TreeSitterInstance>
  preloadLanguage(language: string): Promise<boolean>
  preloadLanguageForExtension(extension: string): Promise<boolean>
  extensionToLanguage(extension: string): string | null
  dispose(): void
}

export function createTreeSitterFactory(): TreeSitterFactory {
  let instancePromise: Promise<TreeSitterInstance> | null = null
  let loadLanguageFn: ((lang: string) => Promise<any>) | null = null

  async function createInternalInstance(): Promise<TreeSitterInstance> {
    let Parser: any
    try {
      const mod = await import("web-tree-sitter")
      Parser = mod.default ?? mod
    } catch (cause) {
      throw toInitFailure("Failed to import web-tree-sitter module", cause)
    }

    if (!parserInitialized) {
      try {
        await Parser.init()
        parserInitialized = true
      } catch (cause) {
        throw toInitFailure("Failed to initialize tree-sitter WASM runtime", cause)
      }
    }

    const languageCache = new Map<string, any>()
    const failedLanguages = new Set<string>()

    let parser: any
    try {
      parser = new Parser()
    } catch (cause) {
      throw toInitFailure("Failed to create tree-sitter Parser instance", cause)
    }

    loadLanguageFn = async (language: string) => {
      if (languageCache.has(language)) return languageCache.get(language)
      if (failedLanguages.has(language)) return null

      const wasmPath = await resolveLanguageWasm(language)
      if (!wasmPath) {
        failedLanguages.add(language)
        return null
      }

      try {
        const wasmBytes = await readFile(wasmPath)
        const lang = await Parser.Language.load(wasmBytes)
        languageCache.set(language, lang)
        return lang
      } catch {
        failedLanguages.add(language)
        return null
      }
    }

    return {
      parse(content: string, language: string): TreeSitterNode | null {
        const lang = languageCache.get(language)
        if (!lang) return null

        try {
          parser.setLanguage(lang)
          const tree = parser.parse(content)
          if (!tree) return null
          const rootNode = tree.rootNode
          const adapted = adaptNode(rootNode)
          tree.delete()
          return adapted
        } catch {
          return null
        }
      },
      getLanguages(): string[] { return Array.from(languageCache.keys()) },
      isLanguageSupported(extension: string): boolean {
        const ext = extension.startsWith(".") ? extension : `.${extension}`
        return ext in EXTENSION_TO_LANGUAGE
      },
      dispose(): void {
        try { parser?.delete() } catch { /* Ignore */ }
        languageCache.clear()
        failedLanguages.clear()
        loadLanguageFn = null
      },
    }
  }

  return {
    async getInstance(): Promise<TreeSitterInstance> {
      if (!instancePromise) instancePromise = createInternalInstance()
      return instancePromise
    },
    async preloadLanguage(language: string): Promise<boolean> {
      await this.getInstance()
      if (!loadLanguageFn) return false
      const result = await loadLanguageFn(language)
      return result !== null
    },
    async preloadLanguageForExtension(extension: string): Promise<boolean> {
      const ext = extension.startsWith(".") ? extension : `.${extension}`
      const language = EXTENSION_TO_LANGUAGE[ext]
      if (!language) return false
      return this.preloadLanguage(language)
    },
    extensionToLanguage(extension: string): string | null {
      const ext = extension.startsWith(".") ? extension : `.${extension}`
      return EXTENSION_TO_LANGUAGE[ext] ?? null
    },
    dispose(): void {
      if (instancePromise) {
        instancePromise.then((inst) => inst.dispose()).catch(() => {})
        instancePromise = null
      }
      loadLanguageFn = null
    },
  }
}

export function extensionToLanguage(extension: string): string | null {
  const ext = extension.startsWith(".") ? extension : `.${extension}`
  return EXTENSION_TO_LANGUAGE[ext] ?? null
}

export function getSupportedExtensions(): string[] {
  return Object.keys(EXTENSION_TO_LANGUAGE)
}
2. src/lib/code-intel/signature-extractor.ts
The Fix: Every build* and walk* method now injects startIndex and endIndex. We also added accurate index calculations for the regex fallback to ensure safe degradation.

TypeScript
import type { TreeSitterNode } from "./tree-sitter-loader.js"
import type { Signature, Parameter } from "./compressed-codemap.js"

export type { Signature, Parameter }

export interface ExtractSignaturesInput {
  path: string
  language: string
  content: string
  astRoot?: TreeSitterNode | null
}

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "javascript",
  mjs: "javascript", cjs: "javascript", py: "python", rs: "rust",
}

const SUPPORTED_LANGUAGES = new Set(["typescript", "tsx", "javascript", "python", "go", "rust"])

function normalizeLanguage(lang: string): string | null {
  const lower = lang.toLowerCase()
  const resolved = LANGUAGE_ALIASES[lower] ?? lower
  return SUPPORTED_LANGUAGES.has(resolved) ? resolved : null
}

export async function extractSignatures(input: ExtractSignaturesInput): Promise<Signature[]> {
  const language = normalizeLanguage(input.language)
  if (!language) return []

  if (input.astRoot) {
    const sigs = extractFromAST(input.astRoot, input.content, language)
    sigs.sort((a, b) => a.startIndex - b.startIndex)
    return sigs
  }

  const sigs = extractFromRegex(input.content)
  sigs.sort((a, b) => a.startIndex - b.startIndex)
  return sigs
}

function extractFromAST(rootNode: TreeSitterNode, content: string, language: string): Signature[] {
  const signatures: Signature[] = []
  const lines = content.split(/\r?\n/)

  if (language === "typescript" || language === "tsx" || language === "javascript") {
    walkTSChildren(rootNode, signatures, lines, false)
  } else if (language === "python") {
    walkPythonChildren(rootNode, signatures, lines)
  } else if (language === "go") {
    walkGoChildren(rootNode, signatures, lines)
  } else if (language === "rust") {
    walkRustChildren(rootNode, signatures, lines)
  }

  return signatures
}

// ─── TypeScript / JavaScript ────────────────────────────────────────────

function walkTSChildren(node: TreeSitterNode, sigs: Signature[], lines: string[], exported: boolean): void {
  for (const child of node.children) {
    if (!child.isNamed) continue
    switch (child.type) {
      case "export_statement":
        walkTSChildren(child, sigs, lines, true)
        break
      case "function_declaration":
      case "generator_function_declaration": {
        const sig = buildTSFunction(child, lines, exported)
        if (sig) sigs.push(sig)
        break
      }
      case "class_declaration": {
        const sig = buildTSClass(child, lines, exported)
        if (sig) sigs.push(sig)
        break
      }
      case "interface_declaration": {
        const sig = buildTSInterface(child, lines, exported)
        if (sig) sigs.push(sig)
        break
      }
      case "type_alias_declaration": {
        const sig = buildTSTypeAlias(child, lines, exported)
        if (sig) sigs.push(sig)
        break
      }
      case "lexical_declaration":
      case "variable_declaration": {
        sigs.push(...buildTSLexicalDecl(child, lines, exported))
        break
      }
      case "import_statement": {
        const sig = buildTSImport(child)
        if (sig) sigs.push(sig)
        break
      }
      case "enum_declaration": {
        const sig = buildTSEnum(child, lines, exported)
        if (sig) sigs.push(sig)
        break
      }
      case "program":
      case "module":
        walkTSChildren(child, sigs, lines, false)
        break
    }
  }
}

function buildTSFunction(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  const params = parseTSParams(node.childForFieldName("parameters"))
  const returnType = extractReturnType(node)
  const paramStr = params.map(formatParam).join(", ")

  return {
    type: "function",
    name: nameNode.text,
    signature: `function ${nameNode.text}(${paramStr})${returnType ? `: ${returnType}` : ""}`,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, // <-- MAP OFFSET
    endIndex: node.endIndex,     // <-- MAP OFFSET
    docstring: extractJSDocAbove(node, lines),
    parameters: params.length > 0 ? params : undefined,
    returnType: returnType ?? undefined,
    exported,
  }
}

function buildTSClass(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null
  let sig = `class ${nameNode.text}`
  for (const c of node.children) {
    if (c.type === "extends_clause" || c.type === "implements_clause") sig += ` ${c.text}`
  }
  return {
    type: "class", name: nameNode.text, signature: sig,
    lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, endIndex: node.endIndex,
    docstring: extractJSDocAbove(node, lines), exported,
  }
}

function buildTSInterface(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null
  let sig = `interface ${nameNode.text}`
  const typeParams = node.childForFieldName("type_parameters")
  if (typeParams) sig += typeParams.text
  for (const c of node.children) {
    if (c.type === "extends_type_clause") sig += ` ${c.text}`
  }
  return {
    type: "interface", name: nameNode.text, signature: sig,
    lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, endIndex: node.endIndex,
    docstring: extractJSDocAbove(node, lines), exported,
  }
}

function buildTSTypeAlias(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null
  const valueNode = node.childForFieldName("value")
  let sig = `type ${nameNode.text}`
  const typeParams = node.childForFieldName("type_parameters")
  if (typeParams) sig += typeParams.text
  if (valueNode && valueNode.text.length < 120) sig += ` = ${valueNode.text}`

  return {
    type: "type", name: nameNode.text, signature: sig,
    lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, endIndex: node.endIndex,
    docstring: extractJSDocAbove(node, lines), exported,
  }
}

function buildTSEnum(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null
  return {
    type: "variable", name: nameNode.text, signature: `enum ${nameNode.text}`,
    lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, endIndex: node.endIndex,
    docstring: extractJSDocAbove(node, lines), exported,
  }
}

function buildTSLexicalDecl(node: TreeSitterNode, lines: string[], exported: boolean): Signature[] {
  const results: Signature[] = []
  for (const child of node.children) {
    if (child.type !== "variable_declarator") continue
    const nameNode = child.childForFieldName("name")
    const valueNode = child.childForFieldName("value")
    if (!nameNode) continue

    const name = nameNode.text
    if (valueNode && (valueNode.type === "arrow_function" || valueNode.type === "function_expression" || valueNode.type === "function")) {
      const params = parseTSParams(valueNode.childForFieldName("parameters"))
      const returnType = extractReturnType(valueNode) ?? extractReturnType(child)
      const paramStr = params.map(formatParam).join(", ")
      results.push({
        type: "function", name,
        signature: `const ${name} = (${paramStr})${returnType ? `: ${returnType}` : ""} => ...`,
        lineStart: node.startPosition.row + 1, lineEnd: (valueNode.endPosition.row ?? node.endPosition.row) + 1,
        startIndex: node.startIndex, endIndex: valueNode.endIndex ?? node.endIndex,
        docstring: extractJSDocAbove(node, lines), parameters: params.length > 0 ? params : undefined,
        returnType: returnType ?? undefined, exported,
      })
    } else if (exported) {
      const typeNode = child.childForFieldName("type")
      let sig = `const ${name}`
      if (typeNode) sig += `: ${cleanTypeColon(typeNode.text)}`
      results.push({
        type: "variable", name, signature: sig,
        lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
        startIndex: node.startIndex, endIndex: node.endIndex,
        docstring: extractJSDocAbove(node, lines), exported,
      })
    }
  }
  return results
}

function buildTSImport(node: TreeSitterNode): Signature | null {
  const sourceNode = node.childForFieldName("source")
  if (!sourceNode) return null
  const source = sourceNode.text.replace(/['"]/g, "")
  return {
    type: "import", name: source, signature: node.text.length < 200 ? node.text : `import ... from "${source}"`,
    lineStart: node.startPosition.row + 1, lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex, endIndex: node.endIndex, exported: false,
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────
function parseTSParams(paramsNode: TreeSitterNode | null): Parameter[] {
  if (!paramsNode) return []
  const params: Parameter[] = []
  for (const child of paramsNode.children) {
    if (!child.isNamed) continue
    if (child.type === "required_parameter" || child.type === "optional_parameter") {
      const patternNode = child.childForFieldName("pattern") ?? child.childForFieldName("name")
      if (!patternNode || patternNode.text === "this") continue
      const typeNode = child.childForFieldName("type")
      const defaultNode = child.childForFieldName("value")
      params.push({
        name: patternNode.text,
        type: typeNode ? cleanTypeColon(typeNode.text) : undefined,
        optional: child.type === "optional_parameter" || defaultNode !== null,
        default: defaultNode?.text ?? undefined,
      })
    } else if (child.type === "rest_parameter") {
      const nameNode = child.childForFieldName("name") ?? child.childForFieldName("pattern")
      const typeNode = child.childForFieldName("type")
      params.push({
        name: `...${nameNode?.text ?? "args"}`, type: typeNode ? cleanTypeColon(typeNode.text) : undefined, optional: true,
      })
    }
  }
  return params
}

function cleanTypeColon(text: string): string { return text.replace(/^:\s*/, "").trim() }
function formatParam(p: Parameter): string {
  let str = p.name
  if (p.optional && !p.name.startsWith("...")) str += "?"
  if (p.type) str += `: ${p.type}`
  if (p.default) str += ` = ${p.default}`
  return str
}
function extractReturnType(node: TreeSitterNode): string | null {
  const retNode = node.childForFieldName("return_type")
  if (!retNode) return null
  let text = retNode.text
  if (text.startsWith(":")) text = text.substring(1).trimStart()
  return text || null
}

function extractJSDocAbove(node: TreeSitterNode, lines: string[]): string | undefined {
  const lineIndex = node.startPosition.row
  if (lineIndex <= 0) return undefined
  const prevLine = (lines[lineIndex - 1] ?? "").trimEnd()
  if (!prevLine.endsWith("*/")) return undefined
  let start = lineIndex - 1
  while (start > 0) {
    const line = (lines[start] ?? "").trimStart()
    if (line.startsWith("/**") || line.startsWith("/*")) break
    start--
  }
  const commentLines = lines.slice(start, lineIndex)
  const docstring = commentLines.join("\n")
  return docstring.trimStart().startsWith("/**") ? docstring.trim() : undefined
}

// ─── Other Languages ────────────────────────────────────────────────────
function walkPythonChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue
    if (child.type === "function_definition") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue
      const paramsNode = child.childForFieldName("parameters")
      const retNode = child.childForFieldName("return_type")
      sigs.push({
        type: "function", name: nameNode.text,
        signature: `def ${nameNode.text}(${paramsNode?.text ?? ""})${retNode ? ` -> ${retNode.text}` : ""}`,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractPyDocstring(child), exported: !nameNode.text.startsWith("_"),
      })
    } else if (child.type === "class_definition") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue
      const superNode = child.childForFieldName("superclasses")
      sigs.push({
        type: "class", name: nameNode.text,
        signature: `class ${nameNode.text}${superNode ? `(${superNode.text})` : ""}`,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractPyDocstring(child), exported: !nameNode.text.startsWith("_"),
      })
    } else if (child.type === "decorated_definition") {
      walkPythonChildren(child, sigs, lines)
    }
  }
}

function extractPyDocstring(node: TreeSitterNode): string | undefined {
  const body = node.childForFieldName("body")
  if (!body) return undefined
  const first = body.children.find((c: TreeSitterNode) => c.isNamed)
  if (first?.type === "expression_statement") {
    const expr = first.children.find((c: TreeSitterNode) => c.isNamed)
    if (expr?.type === "string") return expr.text
  }
  return undefined
}

function walkGoChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue
    if (child.type === "function_declaration" || child.type === "method_declaration") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue
      const paramsNode = child.childForFieldName("parameters")
      const resultNode = child.childForFieldName("result")
      const receiver = child.childForFieldName("receiver")
      let sig = child.type === "method_declaration" ? `func (${receiver?.text}) ` : "func "
      sig += `${nameNode.text}(${paramsNode?.text ?? ""})${resultNode ? ` ${resultNode.text}` : ""}`
      
      sigs.push({
        type: "function", name: nameNode.text, signature: sig,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines), exported: nameNode.text[0] === nameNode.text[0].toUpperCase(),
      })
    } else if (child.type === "type_declaration") {
      const spec = child.children.find((c: TreeSitterNode) => c.type === "type_spec")
      if (!spec) continue
      const nameNode = spec.childForFieldName("name")
      const typeNode = spec.childForFieldName("type")
      if (!nameNode) continue
      const isStruct = typeNode?.type === "struct_type"
      const isIface = typeNode?.type === "interface_type"

      sigs.push({
        type: isStruct ? "class" : isIface ? "interface" : "type", name: nameNode.text,
        signature: `type ${nameNode.text} ${isStruct ? "struct" : isIface ? "interface" : (typeNode?.text ?? "")}`,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines), exported: nameNode.text[0] === nameNode.text[0].toUpperCase(),
      })
    }
  }
}

function walkRustChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue
    const isPub = child.children.some((c: TreeSitterNode) => c.type === "visibility_modifier")
    const nameNode = child.childForFieldName("name")
    
    if (child.type === "function_item" && nameNode) {
      const paramsNode = child.childForFieldName("parameters")
      const retNode = child.childForFieldName("return_type")
      sigs.push({
        type: "function", name: nameNode.text,
        signature: `${isPub ? "pub " : ""}fn ${nameNode.text}(${paramsNode?.text ?? ""})${retNode ? ` ${retNode.text}` : ""}`,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines), exported: isPub,
      })
    } else if ((child.type === "struct_item" || child.type === "trait_item" || child.type === "enum_item") && nameNode) {
      const kind = child.type.split("_")[0]
      sigs.push({
        type: kind === "struct" ? "class" : kind === "trait" ? "interface" : "type", name: nameNode.text,
        signature: `${isPub ? "pub " : ""}${kind} ${nameNode.text}`,
        lineStart: child.startPosition.row + 1, lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex, endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines), exported: isPub,
      })
    } else if (child.type === "impl_item") {
      walkRustChildren(child, sigs, lines)
    }
  }
}

// ─── Regex fallback (Calculates precise string indices) ───────────────────

function extractFromRegex(content: string): Signature[] {
  const signatures: Signature[] = []
  const lines = content.split(/\r?\n/)
  
  // Pre-calculate line start offsets to map lines to exact string indices
  const lineStartIndices = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineStartIndices.push(i + 1)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const lineNum = i + 1

    if (line.trim() === "" || line.trim().startsWith("//")) continue

    const isExported = /(?:^|\s)export\s/.test(line)

    const captureMatch = (type: Signature["type"], name: string, sigString: string) => {
      const lineEnd = findBlockEnd(lines, i)
      const startIndex = lineStartIndices[i] + (line.length - line.trimStart().length)
      const endIndex = lineStartIndices[lineEnd] ? lineStartIndices[lineEnd] - 1 : content.length

      signatures.push({
        type, name, signature: sigString,
        lineStart: lineNum, lineEnd,
        startIndex, // CAPTURED
        endIndex,   // CAPTURED
        exported: isExported,
      })
    }

    const fnMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/)
    if (fnMatch && fnMatch[1]) {
      captureMatch("function", fnMatch[1], line.trim().replace(/\{.*$/, "").trim())
      continue
    }

    const classMatch = line.match(/^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)
    if (classMatch && classMatch[1]) {
      captureMatch("class", classMatch[1], line.trim().replace(/\{.*$/, "").trim())
      continue
    }

    const ifMatch = line.match(/^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/)
    if (ifMatch && ifMatch[1]) {
      captureMatch("interface", ifMatch[1], line.trim().replace(/\{.*$/, "").trim())
      continue
    }

    const typeMatch = line.match(/^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*=/)
    if (typeMatch && typeMatch[1]) {
      captureMatch("type", typeMatch[1], line.trim())
      continue
    }

    const arrowMatch = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]*)?\s*=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::\s*[^=]*)?\s*=>/)
    if (arrowMatch && arrowMatch[1]) {
      captureMatch("function", arrowMatch[1], `const ${arrowMatch[1]} = (...) => ...`)
      continue
    }
  }

  return signatures
}

function findBlockEnd(lines: string[], startIndex: number): number {
  let depth = 0
  let foundOpen = false
  for (let i = startIndex; i < lines.length; i++) {
    for (const ch of lines[i] ?? "") {
      if (ch === "{") { depth++; foundOpen = true }
      else if (ch === "}") {
        depth--
        if (foundOpen && depth === 0) return i + 1
      }
    }
  }
  return startIndex + 1
}

export function extractImportsRegex(content: string): string[] {
  const imports: string[] = []
  const re = /(?:import|from)\s+['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m[1] && !imports.includes(m[1])) imports.push(m[1])
  }
  return imports
}

export function extractExportsRegex(content: string): string[] {
  const exports: string[] = []
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const namedMatch = line.match(/^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/)
    if (namedMatch?.[1]) {
      if (!exports.includes(namedMatch[1])) exports.push(namedMatch[1])
      continue
    }
    const bracketMatch = line.match(/^\s*export\s+\{([^}]+)\}/)
    if (bracketMatch?.[1]) {
      const names = bracketMatch[1].split(",").map((n) => n.trim().match(/\S+\s+as\s+(\S+)/)?.[1] ?? n.trim())
      for (const name of names) {
        if (name && !exports.includes(name)) exports.push(name)
      }
    }
  }
  return exports
}
4. src/lib/code-intel/incremental-updater.ts
Fix: Solves the "Faking It" bug by actively receiving the CompressedCodemap and forcing an AST signature re-extraction (compressSingleFile) the exact moment a file is updated.

TypeScript
import { readFile, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join } from "node:path"

import { countTokens } from "./token-counter.js"
import { hasSecrets, getSecretTypes } from "./secret-detector.js"
import { detectLanguage } from "./file-scanner.js"
import type { CodeMap, CodeMapEntry } from "./codemap-io.js"
import { compressSingleFile, computeCompressionRatio, type CompressedCodemap } from "./compressed-codemap.js"
import type { TreeSitterInstance } from "./tree-sitter-loader.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface UpdateResult {
  filePath: string
  changeType: "created" | "modified" | "deleted"
  tokenDelta: number
  signatureDelta: number
  timestamp: string
}

export type UpdateListener = (result: UpdateResult) => void

// ─── Incremental Updater ────────────────────────────────────────────────

export class IncrementalUpdater {
  private projectRoot: string
  private listeners: UpdateListener[] = []
  private treeSitter: TreeSitterInstance | null

  constructor(projectRoot: string, treeSitter: TreeSitterInstance | null = null) {
    this.projectRoot = projectRoot
    this.treeSitter = treeSitter
  }

  /** Build a new CodeMapEntry for a single file (Phase 1) */
  async buildEntry(relativePath: string): Promise<CodeMapEntry | null> {
    const absolutePath = join(this.projectRoot, relativePath)

    let content: string
    try {
      content = await readFile(absolutePath, "utf-8")
    } catch {
      return null
    }

    let fileStat: { size: number, mtime: Date }
    try {
      fileStat = await stat(absolutePath)
    } catch {
      return null
    }

    const hash = createHash("sha256").update(content).digest("hex")
    const lineCount = content.length === 0 ? 0 : content.split("\n").length
    const tokenCount = countTokens(content)
    const fileHasSecrets = hasSecrets(content)
    const fileSecretTypes = fileHasSecrets ? getSecretTypes(content) : []

    return {
      filePath: relativePath,
      language: detectLanguage(relativePath),
      hash,
      size: fileStat.size,
      lineCount,
      tokenCount,
      hasSecrets: fileHasSecrets,
      secretTypes: fileSecretTypes,
      lastModified: fileStat.mtime.toISOString(),
    }
  }

  /** 
   * CRITICAL FIX: Update BOTH the base CodeMap and the AST CompressedCodemap
   * synchronously, preventing the state desync bug.
   */
  async updateFile(
    codemap: CodeMap,
    filePath: string,
    compressedCodemap?: CompressedCodemap | null
  ): Promise<UpdateResult> {
    const existingIndex = codemap.files.findIndex((f) => f.filePath === filePath)
    const oldEntry = existingIndex >= 0 ? codemap.files[existingIndex] : null
    const newEntry = await this.buildEntry(filePath)

    let changeType: UpdateResult["changeType"]
    let tokenDelta = 0
    let signatureDelta = 0 // Track AST signature delta

    if (!newEntry) {
      if (oldEntry) {
        codemap.files.splice(existingIndex, 1)
        tokenDelta = -oldEntry.tokenCount
      }
      changeType = "deleted"
    } else if (!oldEntry) {
      codemap.files.push(newEntry)
      tokenDelta = newEntry.tokenCount
      changeType = "created"
    } else {
      if (oldEntry.hash === newEntry.hash) {
        return { filePath, changeType: "modified", tokenDelta: 0, signatureDelta: 0, timestamp: new Date().toISOString() }
      }
      tokenDelta = newEntry.tokenCount - oldEntry.tokenCount
      codemap.files[existingIndex] = newEntry
      changeType = "modified"
    }

    // Recompute Phase 1 stats
    codemap.totalFiles = codemap.files.length
    codemap.totalTokens = codemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
    codemap.totalSize = codemap.files.reduce((sum, f) => sum + f.size, 0)

    // Phase 2 AST State Sync - If compressedCodemap is active, patch it synchronously
    if (compressedCodemap) {
      const compIndex = compressedCodemap.files.findIndex(f => f.path === filePath)
      const oldCompEntry = compIndex >= 0 ? compressedCodemap.files[compIndex] : null

      if (changeType === "deleted") {
        if (oldCompEntry) {
          signatureDelta = -oldCompEntry.signatures.length
          compressedCodemap.files.splice(compIndex, 1)
        }
      } else if (newEntry) {
        // Re-extract signatures immediately utilizing tree-sitter
        const newCompEntry = await compressSingleFile(
          filePath, 
          this.projectRoot, 
          newEntry.language, 
          this.treeSitter
        )
        
        if (newCompEntry) {
          if (oldCompEntry) {
            signatureDelta = newCompEntry.signatures.length - oldCompEntry.signatures.length
            compressedCodemap.files[compIndex] = newCompEntry
          } else {
            signatureDelta = newCompEntry.signatures.length
            compressedCodemap.files.push(newCompEntry)
          }
        }
      }

      // Recompute Phase 2 stats
      compressedCodemap.totalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
      compressedCodemap.originalTotalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.originalTokenCount, 0)
      if (compressedCodemap.originalTotalTokens > 0) {
        compressedCodemap.compressionRatio = computeCompressionRatio(compressedCodemap.originalTotalTokens, compressedCodemap.totalTokens)
      }
    }

    const result: UpdateResult = {
      filePath,
      changeType,
      tokenDelta,
      signatureDelta,
      timestamp: new Date().toISOString(),
    }

    for (const listener of this.listeners) {
      try { listener(result) } catch { /* fail safe */ }
    }

    return result
  }

  async removeFile(
    codemap: CodeMap,
    filePath: string,
    compressedCodemap?: CompressedCodemap | null
  ): Promise<UpdateResult> {
    const existingIndex = codemap.files.findIndex((f) => f.filePath === filePath)
    let tokenDelta = 0
    let signatureDelta = 0

    if (existingIndex >= 0) {
      tokenDelta = -codemap.files[existingIndex].tokenCount
      codemap.files.splice(existingIndex, 1)
      codemap.totalFiles = codemap.files.length
      codemap.totalTokens = codemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
      codemap.totalSize = codemap.files.reduce((sum, f) => sum + f.size, 0)
    }

    if (compressedCodemap) {
      const compIndex = compressedCodemap.files.findIndex(f => f.path === filePath)
      if (compIndex >= 0) {
        signatureDelta = -compressedCodemap.files[compIndex].signatures.length
        compressedCodemap.files.splice(compIndex, 1)
        compressedCodemap.totalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.tokenCount, 0)
        compressedCodemap.originalTotalTokens = compressedCodemap.files.reduce((sum, f) => sum + f.originalTokenCount, 0)
        if (compressedCodemap.originalTotalTokens > 0) {
          compressedCodemap.compressionRatio = computeCompressionRatio(compressedCodemap.originalTotalTokens, compressedCodemap.totalTokens)
        }
      }
    }

    const result: UpdateResult = { filePath, changeType: "deleted", tokenDelta, signatureDelta, timestamp: new Date().toISOString() }
    for (const listener of this.listeners) {
      try { listener(result) } catch { /* ignore */ }
    }

    return result
  }

  async getStaleFiles(codemap: CodeMap): Promise<string[]> {
    const stale: string[] = []
    for (const entry of codemap.files) {
      const absolutePath = join(this.projectRoot, entry.filePath)
      try {
        const content = await readFile(absolutePath, "utf-8")
        const currentHash = createHash("sha256").update(content).digest("hex")
        if (currentHash !== entry.hash) stale.push(entry.filePath)
      } catch {
        stale.push(entry.filePath)
      }
    }
    return stale
  }

  onUpdate(callback: UpdateListener): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) this.listeners.splice(index, 1)
    }
  }
}
Important Next Step
In your src/lib/code-intel/watch-integration.ts (Lines 83 & 94), the updater.updateFile signature changed. You must update it to pass the newly initialized variables:

TypeScript
// Old: 
await updater.updateFile(codemap, relativePath)

// New:
await updater.updateFile(codemap, relativePath, compressedCodemap)
Now that the structural bleeding is stopped and startIndex/endIndex coordinates are captured, we can safely install magic-string, ignore, and remark to build src/lib/code-intel/surgeons/ast-surgeon.ts.

Let me know when you've applied these patches and run the npm install for the 3 packages!