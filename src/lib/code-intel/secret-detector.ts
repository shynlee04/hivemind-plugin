export type SecretFinding = {
  kind: string
  line: number
  match: string
}

const SECRET_PATTERNS: Array<{ kind: string; regex: RegExp }> = [
  { kind: "aws-access-key", regex: /AKIA[0-9A-Z]{16}/g },
  { kind: "github-token", regex: /ghp_[A-Za-z0-9]{30,}/g },
  { kind: "generic-api-key", regex: /(?:api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi },
]

function redactSecret(match: string): string {
  if (match.length <= 10) {
    return "[REDACTED]"
  }

  return `${match.slice(0, 4)}...${match.slice(-4)}`
}

export function detectSecrets(input: string, filePath?: string): SecretFinding[] {
  void filePath
  const findings: SecretFinding[] = []
  const lines = input.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const lineText = lines[index]
    for (const pattern of SECRET_PATTERNS) {
      const matches = lineText.match(pattern.regex)
      if (!matches) {
        continue
      }

      for (const match of matches) {
        findings.push({
          kind: pattern.kind,
          line: index + 1,
          match: redactSecret(match),
        })
      }
    }
  }

  return findings
}
