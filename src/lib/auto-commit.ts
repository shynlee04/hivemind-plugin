import { getShell } from "../hooks/sdk-context.js"

type BunShell = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>

export interface AutoCommitContext {
  tool: string
  directory: string
  sessionID?: string
  files?: string[]
  shell?: BunShell | null
}

export interface AutoCommitResult {
  success: boolean
  message: string
}

const AUTO_COMMIT_TOOLS = new Set(["write", "edit", "bash"])

export function shouldAutoCommit(tool: string): boolean {
  return AUTO_COMMIT_TOOLS.has(tool)
}

function normalizeToolName(tool: string): string {
  const normalized = tool.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-")
  return normalized || "tool"
}

export function generateCommitMessage(ctx: AutoCommitContext): string {
  const toolName = normalizeToolName(ctx.tool)
  const fileCount = ctx.files?.length ?? 0
  const fileSegment = fileCount > 0
    ? `${fileCount} file change${fileCount === 1 ? "" : "s"}`
    : "changes"

  return `chore(auto-commit): persist ${fileSegment} after ${toolName}`
}

function collectMetadataPaths(value: unknown, paths: string[]): void {
  if (!value) return

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed) paths.push(trimmed)
    return
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectMetadataPaths(entry, paths)
    }
    return
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const directPath = record.path ?? record.file ?? record.filePath ?? record.name
    if (typeof directPath === "string") {
      collectMetadataPaths(directPath, paths)
    }

    for (const entry of Object.values(record)) {
      collectMetadataPaths(entry, paths)
    }
  }
}

export function extractModifiedFiles(metadata: unknown, fallbackPaths: string[] = []): string[] {
  const paths: string[] = []
  collectMetadataPaths(metadata, paths)

  for (const fallback of fallbackPaths) {
    if (typeof fallback === "string") {
      paths.push(fallback)
    }
  }

  const normalized = paths
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !entry.startsWith("[via "))

  return [...new Set(normalized)]
}

export async function executeAutoCommit(ctx: AutoCommitContext): Promise<AutoCommitResult> {
  const shell = ctx.shell ?? getShell()
  if (!shell) {
    return { success: false, message: "Auto-commit skipped: shell unavailable" }
  }

  const files = ctx.files ?? []
  const commitMessage = generateCommitMessage({ ...ctx, files })

  try {
    await shell`git -C ${ctx.directory} add -A`
    await shell`git -C ${ctx.directory} commit -m ${commitMessage}`
    return { success: true, message: commitMessage }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Auto-commit failed: ${detail}` }
  }
}
