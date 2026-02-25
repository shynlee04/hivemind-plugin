import type { TreeSitterNode } from "./tree-sitter-loader.js"
import type { Signature, Parameter } from "./compressed-codemap.js"

// Re-export for convenience
export type { Signature, Parameter }

// ─── Types ──────────────────────────────────────────────────────────────

export interface ExtractSignaturesInput {
  /** Relative file path */
  path: string
  /** Language name (e.g. "typescript") or extension alias (e.g. "ts") */
  language: string
  /** File content (source code) */
  content: string
  /** Pre-parsed AST root node from tree-sitter. Falls back to regex if absent. */
  astRoot?: TreeSitterNode | null
}

// ─── Language normalisation ─────────────────────────────────────────────

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript", tsx: "tsx",
  js: "javascript", jsx: "javascript",
  mjs: "javascript", cjs: "javascript",
  py: "python", rs: "rust",
}

const SUPPORTED_LANGUAGES = new Set([
  "typescript", "tsx", "javascript",
  "python", "go", "rust",
])

function normalizeLanguage(lang: string): string | null {
  const lower = lang.toLowerCase()
  const resolved = LANGUAGE_ALIASES[lower] ?? lower
  return SUPPORTED_LANGUAGES.has(resolved) ? resolved : null
}

// ─── Main entry point ───────────────────────────────────────────────────

/**
 * Extract function/class/type signatures from source code.
 *
 * When `input.astRoot` is provided (from tree-sitter), uses AST-based
 * extraction for accurate parameters, return types, docstrings.
 * Otherwise falls back to regex (functions + classes only).
 */
export async function extractSignatures(input: ExtractSignaturesInput): Promise<Signature[]> {
  const language = normalizeLanguage(input.language)
  if (!language) return []

  if (input.astRoot) {
    return extractFromAST(input.astRoot, input.content, language)
  }

  return extractFromRegex(input.content)
}

// ─── AST-based extraction ───────────────────────────────────────────────

function extractFromAST(
  rootNode: TreeSitterNode,
  content: string,
  language: string,
): Signature[] {
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

  signatures.sort((a, b) => a.startIndex - b.startIndex)
  return signatures
}

// ─── TypeScript / JavaScript ────────────────────────────────────────────

function walkTSChildren(
  node: TreeSitterNode,
  sigs: Signature[],
  lines: string[],
  exported: boolean,
): void {
  for (const child of node.children) {
    if (!child.isNamed) continue

    switch (child.type) {
      case "export_statement": {
        // Recurse into export wrapper with exported=true
        walkTSChildren(child, sigs, lines, true)
        break
      }

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
        const varSigs = buildTSLexicalDecl(child, lines, exported)
        sigs.push(...varSigs)
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
      case "module": {
        walkTSChildren(child, sigs, lines, false)
        break
      }

      default:
        break
    }
  }
}

function buildTSFunction(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  const name = nameNode.text
  const params = parseTSParams(node.childForFieldName("parameters"))
  const returnType = extractReturnType(node)
  const docstring = extractJSDocAbove(node, lines)
  const paramStr = params.map(formatParam).join(", ")

  return {
    type: "function",
    name,
    signature: `function ${name}(${paramStr})${returnType ? `: ${returnType}` : ""}`,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    docstring,
    parameters: params.length > 0 ? params : undefined,
    returnType: returnType ?? undefined,
    exported,
  }
}

function buildTSClass(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  const name = nameNode.text
  const docstring = extractJSDocAbove(node, lines)

  let sig = `class ${name}`
  for (const c of node.children) {
    if (c.type === "extends_clause" || c.type === "implements_clause") {
      sig += ` ${c.text}`
    }
  }

  return {
    type: "class",
    name,
    signature: sig,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    docstring,
    exported,
  }
}

function buildTSInterface(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  const name = nameNode.text
  const docstring = extractJSDocAbove(node, lines)
  let sig = `interface ${name}`

  const typeParams = node.childForFieldName("type_parameters")
  if (typeParams) sig += typeParams.text

  for (const c of node.children) {
    if (c.type === "extends_type_clause") sig += ` ${c.text}`
  }

  return {
    type: "interface",
    name,
    signature: sig,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    docstring,
    exported,
  }
}

function buildTSTypeAlias(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  const name = nameNode.text
  const docstring = extractJSDocAbove(node, lines)

  const valueNode = node.childForFieldName("value")
  let sig = `type ${name}`
  const typeParams = node.childForFieldName("type_parameters")
  if (typeParams) sig += typeParams.text
  if (valueNode && valueNode.text.length < 120) {
    sig += ` = ${valueNode.text}`
  }

  return {
    type: "type",
    name,
    signature: sig,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    docstring,
    exported,
  }
}

function buildTSEnum(node: TreeSitterNode, lines: string[], exported: boolean): Signature | null {
  const nameNode = node.childForFieldName("name")
  if (!nameNode) return null

  return {
    type: "variable",
    name: nameNode.text,
    signature: `enum ${nameNode.text}`,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    docstring: extractJSDocAbove(node, lines),
    exported,
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
      const docstring = extractJSDocAbove(node, lines)
      const paramStr = params.map(formatParam).join(", ")

      results.push({
        type: "function",
        name,
        signature: `const ${name} = (${paramStr})${returnType ? `: ${returnType}` : ""} => ...`,
        lineStart: node.startPosition.row + 1,
        lineEnd: (valueNode.endPosition.row ?? node.endPosition.row) + 1,
        startIndex: node.startIndex,
        endIndex: valueNode.endIndex ?? node.endIndex,
        docstring,
        parameters: params.length > 0 ? params : undefined,
        returnType: returnType ?? undefined,
        exported,
      })
    } else if (exported) {
      // Only include non-function variables if they are exported
      const typeNode = child.childForFieldName("type")
      let sig = `const ${name}`
      if (typeNode) sig += `: ${cleanTypeColon(typeNode.text)}`

      results.push({
        type: "variable",
        name,
        signature: sig,
        lineStart: node.startPosition.row + 1,
        lineEnd: node.endPosition.row + 1,
        startIndex: node.startIndex,
        endIndex: node.endIndex,
        docstring: extractJSDocAbove(node, lines),
        exported,
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
    type: "import",
    name: source,
    signature: node.text.length < 200 ? node.text : `import ... from "${source}"`,
    lineStart: node.startPosition.row + 1,
    lineEnd: node.endPosition.row + 1,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    exported: false,
  }
}

function parseTSParams(paramsNode: TreeSitterNode | null): Parameter[] {
  if (!paramsNode) return []
  const params: Parameter[] = []

  for (const child of paramsNode.children) {
    if (!child.isNamed) continue

    if (child.type === "required_parameter" || child.type === "optional_parameter") {
      const patternNode = child.childForFieldName("pattern") ?? child.childForFieldName("name")
      if (!patternNode) continue
      if (patternNode.text === "this") continue

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
        name: `...${nameNode?.text ?? "args"}`,
        type: typeNode ? cleanTypeColon(typeNode.text) : undefined,
        optional: true,
      })
    }
  }

  return params
}

// ─── Python ─────────────────────────────────────────────────────────────

function walkPythonChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue

    if (child.type === "function_definition") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      const paramsNode = child.childForFieldName("parameters")
      const retNode = child.childForFieldName("return_type")

      sigs.push({
        type: "function",
        name: nameNode.text,
        signature: `def ${nameNode.text}(${paramsNode?.text ?? ""})${retNode ? ` -> ${retNode.text}` : ""}`,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractPyDocstring(child),
        exported: !nameNode.text.startsWith("_"),
      })
    } else if (child.type === "class_definition") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      const superNode = child.childForFieldName("superclasses")
      let sig = `class ${nameNode.text}`
      if (superNode) sig += `(${superNode.text})`

      sigs.push({
        type: "class",
        name: nameNode.text,
        signature: sig,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractPyDocstring(child),
        exported: !nameNode.text.startsWith("_"),
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

// ─── Go ─────────────────────────────────────────────────────────────────

function walkGoChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue

    if (child.type === "function_declaration") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      const paramsNode = child.childForFieldName("parameters")
      const resultNode = child.childForFieldName("result")
      let sig = `func ${nameNode.text}(${paramsNode?.text ?? ""})`
      if (resultNode) sig += ` ${resultNode.text}`

      sigs.push({
        type: "function",
        name: nameNode.text,
        signature: sig,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: nameNode.text[0] === nameNode.text[0].toUpperCase(),
      })
    } else if (child.type === "method_declaration") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      const receiver = child.childForFieldName("receiver")
      const paramsNode = child.childForFieldName("parameters")
      const resultNode = child.childForFieldName("result")
      let sig = "func "
      if (receiver) sig += `(${receiver.text}) `
      sig += `${nameNode.text}(${paramsNode?.text ?? ""})`
      if (resultNode) sig += ` ${resultNode.text}`

      sigs.push({
        type: "function",
        name: nameNode.text,
        signature: sig,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: nameNode.text[0] === nameNode.text[0].toUpperCase(),
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
        type: isStruct ? "class" : isIface ? "interface" : "type",
        name: nameNode.text,
        signature: `type ${nameNode.text} ${isStruct ? "struct" : isIface ? "interface" : (typeNode?.text ?? "")}`,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: nameNode.text[0] === nameNode.text[0].toUpperCase(),
      })
    }
  }
}

// ─── Rust ───────────────────────────────────────────────────────────────

function walkRustChildren(node: TreeSitterNode, sigs: Signature[], lines: string[]): void {
  for (const child of node.children) {
    if (!child.isNamed) continue

    const isPub = child.children.some((c: TreeSitterNode) => c.type === "visibility_modifier")

    if (child.type === "function_item") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      const paramsNode = child.childForFieldName("parameters")
      const retNode = child.childForFieldName("return_type")
      let sig = `fn ${nameNode.text}(${paramsNode?.text ?? ""})`
      if (retNode) sig += ` ${retNode.text}`
      if (isPub) sig = `pub ${sig}`

      sigs.push({
        type: "function",
        name: nameNode.text,
        signature: sig,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: isPub,
      })
    } else if (child.type === "struct_item") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      sigs.push({
        type: "class",
        name: nameNode.text,
        signature: `${isPub ? "pub " : ""}struct ${nameNode.text}`,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: isPub,
      })
    } else if (child.type === "trait_item") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      sigs.push({
        type: "interface",
        name: nameNode.text,
        signature: `${isPub ? "pub " : ""}trait ${nameNode.text}`,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: isPub,
      })
    } else if (child.type === "enum_item") {
      const nameNode = child.childForFieldName("name")
      if (!nameNode) continue

      sigs.push({
        type: "type",
        name: nameNode.text,
        signature: `${isPub ? "pub " : ""}enum ${nameNode.text}`,
        lineStart: child.startPosition.row + 1,
        lineEnd: child.endPosition.row + 1,
        startIndex: child.startIndex,
        endIndex: child.endIndex,
        docstring: extractJSDocAbove(child, lines),
        exported: isPub,
      })
    } else if (child.type === "impl_item") {
      walkRustChildren(child, sigs, lines)
    }
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────

function cleanTypeColon(text: string): string {
  return text.replace(/^:\s*/, "").trim()
}

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
  if (docstring.trimStart().startsWith("/**")) return docstring.trim()

  return undefined
}

// ─── Regex fallback ─────────────────────────────────────────────────────

function extractFromRegex(content: string): Signature[] {
  const signatures: Signature[] = []
  const lines = content.split(/\r?\n/)
  const lineStartOffsets: number[] = [0]

  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") lineStartOffsets.push(i + 1)
  }

  const getLineStartIndex = (lineStart: number): number => {
    return lineStartOffsets[lineStart - 1] ?? content.length
  }

  const getLineEndIndex = (lineEnd: number): number => {
    return lineEnd < lineStartOffsets.length ? lineStartOffsets[lineEnd] - 1 : content.length
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const lineNum = i + 1

    if (line.trim() === "" || line.trim().startsWith("//")) continue

    const isExported = /(?:^|\s)export\s/.test(line)

    // Function declaration
    const fnMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/)
    if (fnMatch && fnMatch[1]) {
      const lineEnd = findBlockEnd(lines, i)
      signatures.push({
        type: "function",
        name: fnMatch[1],
        signature: line.trim().replace(/\{.*$/, "").trim(),
        lineStart: lineNum,
        lineEnd,
        startIndex: getLineStartIndex(lineNum),
        endIndex: getLineEndIndex(lineEnd),
        exported: isExported,
      })
      continue
    }

    // Class declaration
    const classMatch = line.match(/^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)
    if (classMatch && classMatch[1]) {
      const lineEnd = findBlockEnd(lines, i)
      signatures.push({
        type: "class",
        name: classMatch[1],
        signature: line.trim().replace(/\{.*$/, "").trim(),
        lineStart: lineNum,
        lineEnd,
        startIndex: getLineStartIndex(lineNum),
        endIndex: getLineEndIndex(lineEnd),
        exported: isExported,
      })
      continue
    }

    // Interface
    const ifMatch = line.match(/^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/)
    if (ifMatch && ifMatch[1]) {
      const lineEnd = findBlockEnd(lines, i)
      signatures.push({
        type: "interface",
        name: ifMatch[1],
        signature: line.trim().replace(/\{.*$/, "").trim(),
        lineStart: lineNum,
        lineEnd,
        startIndex: getLineStartIndex(lineNum),
        endIndex: getLineEndIndex(lineEnd),
        exported: isExported,
      })
      continue
    }

    // Type alias
    const typeMatch = line.match(/^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*=/)
    if (typeMatch && typeMatch[1]) {
      const lineEnd = findBlockEnd(lines, i)
      signatures.push({
        type: "type",
        name: typeMatch[1],
        signature: line.trim(),
        lineStart: lineNum,
        lineEnd,
        startIndex: getLineStartIndex(lineNum),
        endIndex: getLineEndIndex(lineEnd),
        exported: isExported,
      })
      continue
    }

    // Arrow function const
    const arrowMatch = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]*)?\s*=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::\s*[^=]*)?\s*=>/)
    if (arrowMatch && arrowMatch[1]) {
      const lineEnd = findBlockEnd(lines, i)
      signatures.push({
        type: "function",
        name: arrowMatch[1],
        signature: `const ${arrowMatch[1]} = (...) => ...`,
        lineStart: lineNum,
        lineEnd,
        startIndex: getLineStartIndex(lineNum),
        endIndex: getLineEndIndex(lineEnd),
        exported: isExported,
      })
      continue
    }
  }

  signatures.sort((a, b) => a.startIndex - b.startIndex)
  return signatures
}

function findBlockEnd(lines: string[], startIndex: number): number {
  let depth = 0
  let foundOpen = false

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i] ?? ""
    for (const ch of line) {
      if (ch === "{") { depth++; foundOpen = true }
      else if (ch === "}") {
        depth--
        if (foundOpen && depth === 0) return i + 1
      }
    }
  }

  return startIndex + 1
}

// ─── Utility exports for compressed-codemap ─────────────────────────────

/** Extract import paths from source code using regex (fast, no deps). */
export function extractImportsRegex(content: string): string[] {
  const imports: string[] = []
  const re = /(?:import|from)\s+['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m[1] && !imports.includes(m[1])) imports.push(m[1])
  }
  return imports
}

/** Extract exported symbol names from source code using regex (fast, no deps). */
export function extractExportsRegex(content: string): string[] {
  const exports: string[] = []
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const namedMatch = line.match(
      /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/,
    )
    if (namedMatch?.[1]) {
      if (!exports.includes(namedMatch[1])) exports.push(namedMatch[1])
      continue
    }

    const bracketMatch = line.match(/^\s*export\s+\{([^}]+)\}/)
    if (bracketMatch?.[1]) {
      const names = bracketMatch[1].split(",").map((n) => {
        const asMatch = n.trim().match(/\S+\s+as\s+(\S+)/)
        return asMatch ? asMatch[1] : n.trim()
      })
      for (const name of names) {
        if (name && !exports.includes(name)) exports.push(name)
      }
    }
  }

  return exports
}
