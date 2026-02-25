type SecretType =
  | "aws_access_key"
  | "generic_api_key"
  | "github_token"
  | "jwt"
  | "private_key"
  | "slack_token"

type SecretSeverity = "high" | "medium" | "low"

export interface SecretMatch {
  type: string
  line: number
  column: number
  pattern: string
  severity: "high" | "medium" | "low"
}

// Legacy compat — old consumers may still import this
export type SecretFinding = {
  kind: string
  line: number
  match: string
}

type SecretPattern = {
  type: SecretType
  regex: RegExp
  severity: SecretSeverity
}

const SECRET_PATTERNS: SecretPattern[] = [
  { type: "aws_access_key", regex: /AKIA[0-9A-Z]{16}/g, severity: "high" },
  {
    type: "private_key",
    regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: "high",
  },
  { type: "jwt", regex: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, severity: "medium" },
  { type: "github_token", regex: /gh[ps]_[A-Za-z0-9_]{36,}/g, severity: "medium" },
  { type: "slack_token", regex: /xox[bprs]-[A-Za-z0-9-]+/g, severity: "medium" },
  {
    type: "generic_api_key",
    regex: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/gi,
    severity: "low",
  },
]

function buildLineStartIndices(content: string): number[] {
  const lineStarts = [0]

  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      lineStarts.push(index + 1)
    }
  }

  return lineStarts
}

function toLineAndColumn(lineStarts: number[], index: number): { line: number; column: number } {
  let low = 0
  let high = lineStarts.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (lineStarts[mid] <= index) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const lineIndex = Math.max(0, low - 1)
  return {
    line: lineIndex + 1,
    column: index - lineStarts[lineIndex] + 1,
  }
}

function redactSecret(match: string): string {
  if (match.length <= 10) {
    return "[REDACTED]"
  }

  return `${match.slice(0, 4)}...${match.slice(-4)}`
}

export function detectSecrets(content: string, _filePath?: string): SecretMatch[] {
  const findings: SecretMatch[] = []
  const lineStarts = buildLineStartIndices(content)

  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0
    let match = pattern.regex.exec(content)

    while (match) {
      const { line, column } = toLineAndColumn(lineStarts, match.index)
      findings.push({
        type: pattern.type,
        line,
        column,
        pattern: pattern.regex.source,
        severity: pattern.severity,
      })

      if (match[0].length === 0) {
        pattern.regex.lastIndex += 1
      }

      match = pattern.regex.exec(content)
    }
  }

  findings.sort((left, right) => {
    if (left.line !== right.line) {
      return left.line - right.line
    }

    if (left.column !== right.column) {
      return left.column - right.column
    }

    return left.type.localeCompare(right.type)
  })

  return findings
}

export function hasSecrets(content: string): boolean {
  return detectSecrets(content).length > 0
}

export function getSecretTypes(content: string): string[] {
  return [...new Set(detectSecrets(content).map((finding) => finding.type))]
}

/**
 * Legacy-compatible detectSecrets that returns SecretFinding[].
 * Used by older test files that expect { kind, line, match } shape.
 */
export function detectSecretsLegacy(input: string, _filePath?: string): SecretFinding[] {
  const findings: SecretFinding[] = []
  const lines = input.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const lineText = lines[index]
    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0
      const matches = lineText.match(pattern.regex)
      if (!matches) {
        continue
      }

      for (const m of matches) {
        findings.push({
          kind: pattern.type,
          line: index + 1,
          match: redactSecret(m),
        })
      }
    }
  }

  return findings
}
