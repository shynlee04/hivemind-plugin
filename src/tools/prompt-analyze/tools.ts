/**
 * Prompt-analyze tool: line-by-line analysis for contradictions, vagueness,
 * missing scope, and absolute claims.
 * @module tools/prompt-analyze/tools
 */
import { tool } from "@opencode-ai/plugin/tool"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success } from "../../shared/tool-response.js"
import { PromptAnalysisResultSchema } from "../../schema-kernel/prompt-enhance.schema.js"
import type { PromptAnalysisFinding, PromptAnalysisResult } from "./types.js"

const ABSOLUTE_RE = /\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN|DO NOT)\b/i
const VAGUE_RE = /\b(some|various|etc\.?|somehow|maybe|perhaps|things|stuff)\b/i
const MISSING_SCOPE_RE =
  /\b(build|create|fix|update|change|improve)\s+(this|that|it|everything|all)\b/i

const CONTRADICTION_PAIRS: Array<[RegExp, RegExp]> = [
  [/\b(use|enable|include|add)\b/i, /\b(do not use|disable|exclude|remove)\b/i],
  [/\b(always|must)\b/i, /\b(never|must not|do not)\b/i],
]

/**
 * Create the prompt-analyze tool instance.
 * @param _projectRoot - Reserved for future path resolution (unused)
 * @returns Configured OpenCode tool for prompt content analysis
 */
export function createPromptAnalyzeTool(
  _projectRoot: string,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Analyze prompt content for contradictions, vagueness, missing scope, and clarity signals",
    args: {
      content: s.string().describe("Prompt text to analyze"),
    },
    async execute(
      args: { content: string },
      _context: { sessionID?: string },
    ): Promise<string> {
      const lines = args.content.split("\n")
      const findings: PromptAnalysisFinding[] = []

      lines.forEach((line, index) => {
        const lineNumber = index + 1
        const trimmed = line.trim()
        if (!trimmed) return

        if (ABSOLUTE_RE.test(trimmed)) {
          findings.push({
            line: lineNumber,
            text: trimmed,
            description: `Contains absolute claim: "${trimmed.slice(0, 60)}"`,
            type: "absolute_claim",
            severity: "minor",
            suggestion:
              "Keep hard requirements only where they are truly non-negotiable.",
          })
        }

        if (VAGUE_RE.test(trimmed)) {
          findings.push({
            line: lineNumber,
            text: trimmed,
            description: `Contains vague wording: "${trimmed.slice(0, 60)}"`,
            type: "vagueness",
            severity: "important",
            suggestion:
              "Replace vague wording with explicit files, outcomes, or constraints.",
          })
        }

        if (MISSING_SCOPE_RE.test(trimmed)) {
          findings.push({
            line: lineNumber,
            text: trimmed,
            description: `Missing scope: "${trimmed.slice(0, 60)}"`,
            type: "missing_scope",
            severity: "critical",
            suggestion:
              "Name the exact file, component, command, or workflow being changed.",
          })
        }

        const hasContradiction = CONTRADICTION_PAIRS.some(
          ([left, right]) => left.test(trimmed) && right.test(trimmed),
        )
        if (hasContradiction) {
          findings.push({
            line: lineNumber,
            text: trimmed,
            description: `Contradictory requirements: "${trimmed.slice(0, 60)}"`,
            type: "contradiction",
            severity: "important",
            suggestion:
              "Split conflicting requirements or choose one instruction path before execution.",
          })
        }
      })

      // Cross-line contradictions: compare all non-empty line pairs
      const trimmedLines = lines.map((l) => l.trim()).filter(Boolean)
      for (let i = 0; i < trimmedLines.length; i++) {
        for (let j = i + 1; j < trimmedLines.length; j++) {
          const hasCrossContradiction = CONTRADICTION_PAIRS.some(
            ([left, right]) =>
              left.test(trimmedLines[i]) && right.test(trimmedLines[j]),
          )
          if (hasCrossContradiction) {
            const alreadyFlagged = findings.some(
              (f) =>
                f.type === "contradiction" &&
                (f.line === i + 1 || f.line === j + 1),
            )
            if (!alreadyFlagged) {
              findings.push({
                line: i + 1,
                text: trimmedLines[i],
                description: `Contradicts line ${j + 1}: "${trimmedLines[j].slice(0, 60)}"`,
                type: "contradiction",
                severity: "important",
                suggestion:
                  "Split conflicting requirements or choose one instruction path before execution.",
              })
            }
          }
        }
      }

      const nonEmptyLines = lines.filter((l) => l.trim().length > 0).length
      const uniqueIssueLines = new Set(findings.map((f) => f.line)).size
      const clarityScore = Math.max(
        0,
        Math.round(100 - (uniqueIssueLines / Math.max(1, nonEmptyLines)) * 100),
      )

      const bySeverity = {
        critical: findings.filter((f) => f.severity === "critical").length,
        important: findings.filter((f) => f.severity === "important").length,
        minor: findings.filter((f) => f.severity === "minor").length,
      }

      const result: PromptAnalysisResult = {
        findings,
        finding_count: findings.length,
        by_severity: bySeverity,
        clarity_score: clarityScore,
      }

      PromptAnalysisResultSchema.parse(result)
      return renderToolResult(success("Analysis complete", result))
    },
  })
}
