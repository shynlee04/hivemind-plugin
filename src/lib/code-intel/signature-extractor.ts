type Signature = {
  name: string
  kind: string
  path: string
  line: number
}

type ExtractSignaturesInput = {
  path: string
  language: string
  content: string
}

const SUPPORTED_LANGUAGES = new Set([
  "ts",
  "tsx",
  "typescript",
  "js",
  "jsx",
  "javascript",
])

function lineComparator(left: Signature, right: Signature): number {
  if (left.path !== right.path) {
    return left.path.localeCompare(right.path)
  }
  if (left.line !== right.line) {
    return left.line - right.line
  }
  return left.name.localeCompare(right.name)
}

export async function extractSignatures(input: ExtractSignaturesInput): Promise<Signature[]> {
  if (!SUPPORTED_LANGUAGES.has(input.language.toLowerCase())) {
    return []
  }

  const signatures: Signature[] = []
  const lines = input.content.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    const functionMatch = line.match(/^\s*(?:export\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/)
    if (functionMatch) {
      signatures.push({
        name: functionMatch[1],
        kind: "function",
        path: input.path,
        line: index + 1,
      })
      continue
    }

    const classMatch = line.match(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/)
    if (classMatch) {
      signatures.push({
        name: classMatch[1],
        kind: "class",
        path: input.path,
        line: index + 1,
      })
    }
  }

  signatures.sort(lineComparator)
  return signatures
}
