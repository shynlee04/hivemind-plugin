import { tool } from "@opencode-ai/plugin"

const ROUTES = [
  {
    keywords: ["echo", "say", "repeat", "back", "tell me"],
    command: "test-echo",
    description: "Echo back a message",
  },
  {
    keywords: ["list", "files", "directory", "ls", "show files", "what files"],
    command: "test-list",
    description: "List files in directory",
  },
  {
    keywords: ["git", "status", "changes", "diff", "what changed", "commit"],
    command: "test-status",
    description: "Show git status",
  },
]

export default tool({
  description:
    "Route a natural language request to one of three test commands: test-echo, test-list, or test-status. Returns the matching command name and any extracted arguments. Always call this tool FIRST before deciding which command to run.",
  args: {
    query: tool.schema.string().describe("The user's natural language request"),
  },
  async execute(args) {
    const lower = args.query.toLowerCase()
    let best: { command: string; args: string; confidence: number; reason: string } | null = null
    let bestScore = 0

    for (const route of ROUTES) {
      let score = 0
      const matchedKeywords: string[] = []

      for (const kw of route.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += kw.split(/\s+/).length
          matchedKeywords.push(kw)
        }
      }

      let extractedArgs = ""
      if (matchedKeywords.length > 0) {
        const firstMatch = matchedKeywords[0]
        const idx = lower.indexOf(firstMatch.toLowerCase())
        if (idx >= 0) {
          extractedArgs = args.query.slice(idx + firstMatch.length).trim()
          extractedArgs = extractedArgs.replace(/^[\s:,-]+/, "")
        }
      }

      if (score > bestScore) {
        bestScore = score
        best = {
          command: route.command,
          args: extractedArgs,
          confidence: Math.min(score / 3, 1),
          reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
        }
      }
    }

    if (!best || best.confidence < 0.3) {
      return JSON.stringify({
        success: false,
        error: `No matching command found for: "${args.query}"`,
      })
    }

    const cmdStr = best.args ? `/${best.command} ${best.args}` : `/${best.command}`

    return JSON.stringify({
      success: true,
      command: best.command,
      args: best.args,
      fullCommand: cmdStr,
      confidence: best.confidence,
      reason: best.reason,
    })
  },
})
