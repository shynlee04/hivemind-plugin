// @ts-nocheck — plugin types expect Zod v3 shapes; we have Zod v4 installed
import { z } from "zod";
import { existsSync } from "fs";
import { join } from "path";
import { safeTool } from "./safe-tool.ts";

export const promptSkim = safeTool({
  description: "Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths, calculate complexity score",
  args: {
    content: z.string().describe("The prompt content to skim"),
    workspaceRoot: z.string().describe("Absolute path to workspace root for path verification"),
  },
  execute: async ({ content, workspaceRoot }) => {
    const lines = content.split("\n");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const tokenEstimate = Math.ceil(wordCount * 1.3);

    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = content.match(urlRegex) ?? [];

    const pathRegex = /(?:^|\s)(\.\/[\w./-]+|[\w./-]+\.\w+)/gm;
    const rawPaths = content.match(pathRegex) ?? [];
    const paths = rawPaths.map((p) => p.trim()).filter(Boolean);
    const verifiedPaths = paths.map((p) => ({
      path: p,
      exists: existsSync(join(workspaceRoot, p)),
    }));

    const absoluteWords = content.match(/\b(MUST|NEVER|ALWAYS|REQUIRED|FORBIDDEN)\b/gi) ?? [];

    let complexity = 1;
    if (wordCount > 200) complexity += 1;
    if (wordCount > 500) complexity += 1;
    if (wordCount > 1000) complexity += 1;
    if (urls.length > 3) complexity += 1;
    if (urls.length > 5) complexity += 1;
    if (absoluteWords.length > 3) complexity += 1;
    if (lines.length > 50) complexity += 1;
    if (verifiedPaths.filter((p) => !p.exists).length > 2) complexity += 1;
    if (content.includes("```")) complexity += 1;
    complexity = Math.min(10, complexity);

    const floodingRisk = complexity >= 7 ? "high" : complexity >= 4 ? "medium" : "low";

    return {
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
      recommended_lanes: complexity <= 3
        ? ["analyzer", "repackager"]
        : complexity <= 6
          ? ["analyzer", "context-mapper", "repackager"]
          : ["analyzer", "context-mapper", "risk-assessor", "context-purifier", "repackager"],
    };
  },
});
