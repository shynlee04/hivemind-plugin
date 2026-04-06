// @ts-nocheck — plugin types expect Zod v3 shapes; we have Zod v4 installed
import { z } from "zod";
import { safeTool } from "./safe-tool.ts";

type FindingType = "absolute_claim" | "vagueness" | "missing_scope" | "contradiction";
type Severity = "critical" | "important" | "minor";

type Finding = {
  line: number;
  text: string;
  type: FindingType;
  severity: Severity;
  suggestion: string;
};

const absolutePattern = /\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN|DO NOT)\b/gi;
const vaguePattern = /\b(some|various|etc\.?|somehow|maybe|perhaps|things|stuff)\b/gi;
const missingScopePattern = /\b(build|create|fix|update|change|improve)\s+(this|that|it|everything|all)\b/i;
const contradictionPairs: Array<[RegExp, RegExp]> = [
  [/\b(use|enable|include|add)\b/i, /\b(do not use|disable|exclude|remove)\b/i],
  [/\b(always|must)\b/i, /\b(never|must not|do not)\b/i],
];

export const promptAnalyze = safeTool({
  description: "Analyze prompt content for contradictions, vagueness, missing scope, and clarity signals",
  args: {
    content: z.string().describe("Prompt text to analyze"),
  },
  execute: async ({ content }) => {
    const lines = content.split("\n");
    const findings: Finding[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      if (!trimmed) {
        return;
      }

      if (absolutePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "absolute_claim",
          severity: "minor",
          suggestion: "Keep hard requirements only where they are truly non-negotiable.",
        });
      }

      absolutePattern.lastIndex = 0;

      if (vaguePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "vagueness",
          severity: "important",
          suggestion: "Replace vague wording with explicit files, outcomes, or constraints.",
        });
      }

      vaguePattern.lastIndex = 0;

      if (missingScopePattern.test(trimmed)) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "missing_scope",
          severity: "critical",
          suggestion: "Name the exact file, component, command, or workflow being changed.",
        });
      }

      const hasContradiction = contradictionPairs.some(([left, right]) => left.test(trimmed) && right.test(trimmed));

      if (hasContradiction) {
        findings.push({
          line: lineNumber,
          text: trimmed,
          type: "contradiction",
          severity: "important",
          suggestion: "Split conflicting requirements or choose one instruction path before execution.",
        });
      }
    });

    const nonEmptyLineCount = lines.filter((line) => line.trim().length > 0).length;
    const uniqueIssueLines = new Set(findings.map((finding) => finding.line)).size;
    const clarityScore = Math.max(0, Math.round(100 - (uniqueIssueLines / Math.max(1, nonEmptyLineCount)) * 100));

    return {
      findings,
      finding_count: findings.length,
      by_severity: {
        critical: findings.filter((finding) => finding.severity === "critical").length,
        important: findings.filter((finding) => finding.severity === "important").length,
        minor: findings.filter((finding) => finding.severity === "minor").length,
      },
      clarity_score: clarityScore,
    };
  },
});
