import { randomUUID } from "node:crypto"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { createStateManager } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import { readManifest, writeManifest } from "../lib/manifest.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"
import { flushMutations, flushTaskManifestMutations } from "../lib/state-mutation-queue.js"
import { createEvent, eventBus } from "../lib/event-bus.js"
import type { SessionMemoryCategory, SessionMemoryNode } from "../schemas/graph-nodes.js"
import type { SessionMemoryState } from "../schemas/graph-state.js"
import { SessionMemoryStateSchema } from "../schemas/graph-state.js"

const DEFAULT_SESSION_MEMORY_STATE: SessionMemoryState = {
  version: "1.0.0",
  session_memory: [],
}

type SessionMemoryAction = "scratch" | "debug_log" | "research_cache" | "retro" | "todo_pending"

const ACTION_CATEGORY: Record<Exclude<SessionMemoryAction, "todo_pending">, SessionMemoryCategory> = {
  scratch: "planning",
  debug_log: "debug",
  research_cache: "research_synthesis",
  retro: "test_validation_gatekeeping",
}

async function loadSessionMemoryState(directory: string): Promise<SessionMemoryState> {
  const path = `${getEffectivePaths(directory).graphDir}/session-memory.json`
  const raw = await readManifest<unknown>(path, DEFAULT_SESSION_MEMORY_STATE)
  const parsed = SessionMemoryStateSchema.safeParse(raw)
  return parsed.success ? parsed.data : DEFAULT_SESSION_MEMORY_STATE
}

async function saveSessionMemoryState(directory: string, state: SessionMemoryState): Promise<void> {
  const path = `${getEffectivePaths(directory).graphDir}/session-memory.json`
  await writeManifest(path, state)
}

export function createHivemindSessionMemoryTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Session memory controls. Actions: scratch, debug_log, research_cache, retro, todo_pending. " +
      "Use this for temporary lifecycle memory classification and TODO-Pending routing.",
    args: {
      action: tool.schema.enum(["scratch", "debug_log", "research_cache", "retro", "todo_pending"]),
      content: tool.schema
        .string()
        .optional()
        .describe("Memory content. Optional for todo_pending list mode."),
      source: tool.schema
        .string()
        .optional()
        .describe("Optional source label for traceability."),
      resolve_id: tool.schema
        .string()
        .optional()
        .describe("Optional TODO-Pending ID to mark resolved."),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      await flushMutations(stateManager)
      await flushTaskManifestMutations()

      const state = await stateManager.load()
      if (!state) {
        return toErrorOutput("No active state found. Start a session before writing session memory.")
      }

      if (args.action === "todo_pending") {
        return handleTodoPending(directory, stateManager, {
          content: args.content,
          source: args.source,
          resolveId: args.resolve_id,
        })
      }

      return handleMemoryAction(directory, stateManager, {
        action: args.action,
        content: args.content,
        source: args.source,
      })
    },
  })
}

async function handleMemoryAction(
  directory: string,
  stateManager: ReturnType<typeof createStateManager>,
  params: {
    action: Exclude<SessionMemoryAction, "todo_pending">
    content?: string
    source?: string
  }
): Promise<string> {
  const state = await stateManager.load()
  if (!state) {
    return toErrorOutput("No active state found.")
  }

  const content = params.content?.trim()
  if (!content) {
    return toErrorOutput("content is required")
  }

  const category = ACTION_CATEGORY[params.action]
  const nowIso = new Date().toISOString()
  const node: SessionMemoryNode = {
    id: randomUUID(),
    session_id: state.session.id,
    category,
    source: params.source?.trim() || `tool:${params.action}`,
    content,
    condensed: content.slice(0, 240),
    temporary: true,
    classification_confidence: 0.9,
    created_at: nowIso,
    purged_at: null,
    transferred_to_governance: false,
  }

  const memoryState = await loadSessionMemoryState(directory)
  const updated: SessionMemoryState = {
    ...memoryState,
    session_memory: [...memoryState.session_memory, node],
  }
  await saveSessionMemoryState(directory, updated)

  const classifiedCounts = {
    ...state.memory_governance.classified_counts,
    [category]: state.memory_governance.classified_counts[category] + 1,
  }
  await stateManager.save({
    ...state,
    memory_governance: {
      ...state.memory_governance,
      classified_counts: classifiedCounts,
      last_classified_at: Date.now(),
    },
  })
  eventBus.emitEvent(
    createEvent(
      "memory:classified",
      {
        category,
        confidence: node.classification_confidence,
        sessionId: node.session_id,
      },
      "session-memory-classifier"
    )
  )

  return toSuccessOutput("Session memory recorded", node.id, {
    action: params.action,
    category,
    source: node.source,
    sessionId: node.session_id,
  })
}

async function handleTodoPending(
  _directory: string,
  stateManager: ReturnType<typeof createStateManager>,
  params: {
    content?: string
    source?: string
    resolveId?: string
  }
): Promise<string> {
  const state = await stateManager.load()
  if (!state) {
    return toErrorOutput("No active state found.")
  }

  const resolveId = params.resolveId?.trim()
  if (resolveId) {
    const updatedQueue = state.offtrack_todo_pending.map((item) =>
      item.id === resolveId ? { ...item, status: "resolved" as const } : item
    )
    await stateManager.save({
      ...state,
      offtrack_todo_pending: updatedQueue,
    })

    return toSuccessOutput("TODO-Pending item resolved", resolveId, {
      pendingCount: updatedQueue.filter((item) => item.status === "pending").length,
    })
  }

  const content = params.content?.trim()
  if (!content) {
    const pendingItems = state.offtrack_todo_pending.filter((item) => item.status === "pending")
    return toSuccessOutput("TODO-Pending queue", state.session.id, {
      total: pendingItems.length,
      items: pendingItems,
    })
  }

  const duplicate = state.offtrack_todo_pending.some(
    (item) => item.status === "pending" && item.content.trim().toLowerCase() === content.toLowerCase()
  )
  if (duplicate) {
    return toSuccessOutput("TODO-Pending unchanged (duplicate)", state.session.id, {
      total: state.offtrack_todo_pending.filter((item) => item.status === "pending").length,
    })
  }

  const nextItem = {
    id: randomUUID(),
    content,
    created_at: Date.now(),
    source: params.source?.trim() || "hivemind_session_memory",
    status: "pending" as const,
  }
  const updatedQueue = [...state.offtrack_todo_pending, nextItem]
  await stateManager.save({
    ...state,
    offtrack_todo_pending: updatedQueue,
  })

  return toSuccessOutput("TODO-Pending item queued", nextItem.id, {
    pendingCount: updatedQueue.filter((item) => item.status === "pending").length,
  })
}
