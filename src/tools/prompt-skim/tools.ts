/**
 * Prompt-skim tool: fast scan of prompt content for word/line/token counts,
 * URL extraction, path verification, and complexity scoring.
 * @module tools/prompt-skim/tools
 */
import { tool } from "@opencode-ai/plugin/tool"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success } from "../../shared/tool-response.js"
import { PromptSkimResultSchema } from "../../schema-kernel/prompt-enhance.schema.js"
import type { PromptSkimResult } from "./types.js"

/**
 * Create the prompt-skim tool instance.
 * @param _projectRoot - Reserved for future path resolution (unused)
 * @returns Configured OpenCode tool for prompt content skimming
 */
export function createPromptSkimTool(_projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths, calculate complexity score",
    args: {
      content: s.string().describe("The prompt content to skim"),
      workspaceRoot: s.string().describe("Absolute path to workspace root for path verification"),
    },
    async execute(
      args: { content: string; workspaceRoot: string },
      _context: { sessionID?: string },
    ): Promise<string> {
      const lines = args.content.split("\n")
      const wordCount = args.content.split(/\s+/).filter(Boolean).length
      const tokenEstimate = Math.ceil(wordCount * 1.3)

      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g
      const urls = args.content.match(urlRegex) ?? []

      const pathRegex = /(?:^|\s)(\.\/[\w./-]+|[\w./-]+\.\w+)/gm
      const rawPaths = args.content.match(pathRegex) ?? []
      const paths = rawPaths.map((p) => p.trim()).filter(Boolean)
      const verifiedPaths = paths.map((p) => ({
        path: p,
        exists: existsSync(join(args.workspaceRoot, p)),
      }))

      const absoluteWords =
        args.content.match(/\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN)\b/gi) ?? []

      let complexity = 1
      if (wordCount > 200) complexity += 1
      if (wordCount > 500) complexity += 1
      if (wordCount > 1000) complexity += 1
      if (urls.length > 3) complexity += 1
      if (urls.length > 5) complexity += 1
      if (absoluteWords.length > 3) complexity += 1
      if (lines.length > 50) complexity += 1
      if (verifiedPaths.filter((p) => !p.exists).length > 2) complexity += 1
      if (args.content.includes("```")) complexity += 1
      complexity = Math.min(10, complexity)

      const floodingRisk =
        complexity >= 7 ? "high" : complexity >= 4 ? "medium" : "low"
      const verdict = complexity <= 3 ? "simple" : complexity <= 6 ? "complex" : "unclear"
      const recommendedLanes =
        complexity <= 3
          ? ["analyzer", "repackager"]
          : complexity <= 6
            ? ["analyzer", "context-mapper", "repackager"]
            : [
                "analyzer",
                "context-mapper",
                "risk-assessor",
                "context-purifier",
                "repackager",
              ]

      const result: PromptSkimResult = {
        word_count: wordCount,
        line_count: lines.length,
        token_estimate: tokenEstimate,
        url_count: urls.length,
        urls,
        path_count: paths.length,
        paths: verifiedPaths,
        absolute_claim_count: absoluteWords.length,
        complexity_score: complexity,
        flooding_risk: floodingRisk,
        recommended_lanes: recommendedLanes,
        verdict,
      }

      PromptSkimResultSchema.parse(result)
      return renderToolResult(success("Prompt skim complete", result))
    },
  })
}
