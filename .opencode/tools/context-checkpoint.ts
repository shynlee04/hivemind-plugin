import { tool } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

interface Checkpoint {
  id: string
  sessionID: string
  timestamp: number
  summary: string
  activeFiles: string[]
  pendingTasks: string[]
  decisions: string[]
  errors: string[]
}

interface CheckpointStore {
  version: 1
  updatedAt: number
  sessions: Record<string, Checkpoint>
}

const CHECKPOINT_STORE_VERSION = 1 as const

function getEnvPath(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function getContextWorktree(context: { worktree?: unknown }): string | undefined {
  return typeof context.worktree === "string" && context.worktree.trim().length > 0
    ? context.worktree.trim()
    : undefined
}

function resolveCheckpointFile(context: { worktree?: unknown }): string {
  const explicitStateDir = getEnvPath("OPENCODE_HARNESS_STATE_DIR")
  if (explicitStateDir) {
    return resolve(explicitStateDir, "checkpoints.json")
  }

  return resolve(
    getContextWorktree(context) ?? process.cwd(),
    ".opencode",
    "state",
    "opencode-harness",
    "checkpoints.json"
  )
}

function emptyStore(): CheckpointStore {
  return {
    version: CHECKPOINT_STORE_VERSION,
    updatedAt: Date.now(),
    sessions: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
}

function normalizeCheckpoint(sessionID: string, value: unknown): Checkpoint | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = asString(value.id)
  const timestamp = typeof value.timestamp === "number" && Number.isFinite(value.timestamp)
    ? value.timestamp
    : undefined
  const summary = asString(value.summary)

  if (!id || !timestamp || !summary) {
    return undefined
  }

  return {
    id,
    sessionID,
    timestamp,
    summary,
    activeFiles: normalizeStringList(value.activeFiles),
    pendingTasks: normalizeStringList(value.pendingTasks),
    decisions: normalizeStringList(value.decisions),
    errors: normalizeStringList(value.errors),
  }
}

function loadStore(context: { worktree?: unknown }): CheckpointStore {
  const checkpointFile = resolveCheckpointFile(context)
  if (!existsSync(checkpointFile)) {
    return emptyStore()
  }

  try {
    const raw = readFileSync(checkpointFile, "utf8")
    if (!raw.trim()) {
      return emptyStore()
    }

    const parsed = JSON.parse(raw) as Partial<CheckpointStore>
    const sessions = isRecord(parsed.sessions) ? parsed.sessions : {}
    const normalizedSessions: Record<string, Checkpoint> = {}

    for (const [sessionID, value] of Object.entries(sessions)) {
      const checkpoint = normalizeCheckpoint(sessionID, value)
      if (checkpoint) {
        normalizedSessions[sessionID] = checkpoint
      }
    }

    return {
      version: CHECKPOINT_STORE_VERSION,
      updatedAt:
        typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : Date.now(),
      sessions: normalizedSessions,
    }
  } catch {
    return emptyStore()
  }
}

function persistStore(context: { worktree?: unknown }, store: CheckpointStore): void {
  const checkpointFile = resolveCheckpointFile(context)
  store.updatedAt = Date.now()
  mkdirSync(dirname(checkpointFile), { recursive: true })
  writeFileSync(checkpointFile, `${JSON.stringify(store, null, 2)}\n`, "utf8")
}

export const save = tool({
  description:
    "Save a context checkpoint before compaction or session transition. Preserves critical working state.",
  args: {
    summary: tool.schema.string().describe("Current task summary - what you're working on"),
    activeFiles: tool.schema
      .string()
      .describe("Comma-separated list of files being actively modified"),
    pendingTasks: tool.schema
      .string()
      .describe("Comma-separated list of remaining tasks"),
    decisions: tool.schema
      .string()
      .optional()
      .describe("Comma-separated key decisions made"),
    errors: tool.schema
      .string()
      .optional()
      .describe("Comma-separated errors encountered"),
  },
  async execute(args, context) {
    const sid = context.sessionID
    const checkpointId = `ckpt-${sid}-${Date.now()}`
    const store = loadStore(context)

    const checkpoint: Checkpoint = {
      id: checkpointId,
      sessionID: sid,
      timestamp: Date.now(),
      summary: args.summary,
      activeFiles: args.activeFiles
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      pendingTasks: args.pendingTasks
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      decisions: args.decisions
        ? args.decisions
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [],
      errors: args.errors
        ? args.errors
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
    }

    store.sessions[sid] = checkpoint
    persistStore(context, store)

    return [
      `CHECKPOINT SAVED — ID: ${checkpointId}`,
      `Session: ${sid}`,
      `Time: ${new Date(checkpoint.timestamp).toISOString()}`,
      `Storage: ${resolveCheckpointFile(context)}`,
      ``,
      `Summary: ${checkpoint.summary}`,
      `Active files (${checkpoint.activeFiles.length}): ${checkpoint.activeFiles.join(", ") || "none"}`,
      `Pending tasks (${checkpoint.pendingTasks.length}): ${checkpoint.pendingTasks.join(", ") || "none"}`,
      `Decisions (${checkpoint.decisions.length}): ${checkpoint.decisions.join(", ") || "none"}`,
      `Errors (${checkpoint.errors.length}): ${checkpoint.errors.join(", ") || "none"}`,
    ].join("\n")
  },
})

export const restore = tool({
  description:
    "Restore a previously saved context checkpoint. Use after compaction or session recovery.",
  args: {
    sessionID: tool.schema
      .string()
      .optional()
      .describe("Specific session to restore. Defaults to current session."),
  },
  async execute(args, context) {
    const sid = args.sessionID ?? context.sessionID
    const store = loadStore(context)
    const checkpoint = store.sessions[sid]

    if (!checkpoint) {
      const availableSessions = Object.keys(store.sessions)
      const available = availableSessions.length
        ? `Available sessions: ${availableSessions.join(", ")}`
        : "No checkpoints exist yet."
      return `NO CHECKPOINT FOUND for session ${sid}. ${available}`
    }

    const age = Math.round((Date.now() - checkpoint.timestamp) / 1000)

    return [
      `CHECKPOINT RESTORED — Session: ${sid}`,
      `Checkpoint ID: ${checkpoint.id}`,
      `Saved ${age}s ago (${new Date(checkpoint.timestamp).toISOString()})`,
      `Storage: ${resolveCheckpointFile(context)}`,
      ``,
      `## Summary`,
      checkpoint.summary,
      ``,
      `## Active Files`,
      checkpoint.activeFiles.length
        ? checkpoint.activeFiles.map((f) => `  - ${f}`).join("\n")
        : "  (none)",
      ``,
      `## Pending Tasks`,
      checkpoint.pendingTasks.length
        ? checkpoint.pendingTasks.map((t) => `  - [ ] ${t}`).join("\n")
        : "  (none)",
      ``,
      `## Key Decisions`,
      checkpoint.decisions.length
        ? checkpoint.decisions.map((d) => `  - ${d}`).join("\n")
        : "  (none)",
      ``,
      `## Errors`,
      checkpoint.errors.length
        ? checkpoint.errors.map((e) => `  - ${e}`).join("\n")
        : "  (none)",
    ].join("\n")
  },
})
