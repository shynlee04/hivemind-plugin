/**
 * Session-patch tool: patch sections in session file with automatic backup.
 * @module tools/session-patch/tools
 */
import { tool } from "@opencode-ai/plugin/tool"
import { existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from "node:fs"
import { dirname, join, resolve, relative, basename } from "node:path"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
import { SessionPatchRecordSchema } from "../../schema-kernel/prompt-enhance.schema.js"
import type { SessionPatchRecord } from "./types.js"

/**
 * Create the session-patch tool instance.
 * @param _projectRoot - Reserved for future path resolution (unused)
 * @returns Configured OpenCode tool for session file section patching
 */
export function createSessionPatchTool(
  projectRoot: string,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Patch specific sections in session file with backup",
    args: {
      sessionFilePath: s
        .string()
        .describe("Absolute path to session-context-prompt.md"),
      section: s
        .string()
        .describe("Section heading to patch (e.g., '## Identified Risks')"),
      newContent: s
        .string()
        .describe("New content for the section (without the heading)"),
    },
    async execute(
      args: { sessionFilePath: string; section: string; newContent: string },
      _context: { sessionID?: string },
    ): Promise<string> {
      const pathResult = resolveAllowedSessionPath(projectRoot, args.sessionFilePath)
      if (!pathResult.allowed) {
        return renderToolResult(error(pathResult.reason))
      }
      const sessionFilePath = pathResult.path

      if (!existsSync(sessionFilePath)) {
        return renderToolResult(error("Session file not found"))
      }

      const backupDir = join(dirname(sessionFilePath), ".patches")
      mkdirSync(backupDir, { recursive: true })
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupPath = join(backupDir, `backup-${timestamp}.md`)

      const original = readFileSync(sessionFilePath, "utf-8")
      writeFileSync(backupPath, original)

      const escapedSection = args.section.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      )
      const headingRegex = new RegExp(
        `(?:^|\\n)(${escapedSection})[\\s\\S]*?(?=\\n## |$)`,
      )
      const match = original.match(headingRegex)

      if (!match) {
        return renderToolResult(
          error(`Section '${args.section}' not found`),
        )
      }

      const updated = original.replace(
        headingRegex,
        `${args.section}\n${args.newContent}\n`,
      )
      writeFileSync(sessionFilePath, updated)

      const patchCountMatch = updated.match(/^patch_count:\s*(\d+)/m)
      const currentCount = patchCountMatch
        ? parseInt(patchCountMatch[1], 10)
        : 0
      const withUpdatedCount = updated.replace(
        /^patch_count:\s*\d+/m,
        `patch_count: ${currentCount + 1}`,
      )
      writeFileSync(sessionFilePath, withUpdatedCount)

      const record: SessionPatchRecord = {
        section: args.section,
        old_value: match[1].replace(args.section, "").trim(),
        new_value: args.newContent,
        backup_path: backupPath,
        timestamp: new Date().toISOString(),
        status: "ok",
      }

      SessionPatchRecordSchema.parse(record)
      return renderToolResult(
        success("Section patched", record, {
          backup_path: backupPath,
          old_length: original.length,
          new_length: withUpdatedCount.length,
          patch_count: currentCount + 1,
        }),
      )
    },
  })
}

type SessionPathResult =
  | { allowed: true; path: string }
  | { allowed: false; reason: string }

/**
 * Resolve and validate session-patch targets against the active project root.
 *
 * @param projectRoot - OpenCode project root supplied by the plugin.
 * @param sessionFilePath - Caller-provided session artifact path.
 * @returns An allowed absolute path or a rejection reason.
 */
function resolveAllowedSessionPath(projectRoot: string, sessionFilePath: string): SessionPathResult {
  const absoluteProjectRoot = realpathSync(resolve(projectRoot))
  const absoluteTarget = resolve(sessionFilePath)
  const fileName = basename(absoluteTarget)
  if (!/^session(?:-context-prompt)?(?:-[a-zA-Z0-9_-]+)?\.md$/.test(fileName)) {
    return { allowed: false, reason: "Session patch target must be a session*.md artifact." }
  }
  if (!existsSync(absoluteTarget)) {
    return { allowed: true, path: absoluteTarget }
  }

  const realTarget = realpathSync(absoluteTarget)
  const rel = relative(absoluteProjectRoot, realTarget)
  if (rel.startsWith("..") || rel === "" || rel.includes("..")) {
    return { allowed: false, reason: "Session patch target must stay inside the active project root." }
  }

  return { allowed: true, path: realTarget }
}
