/**
 * HiveOps TODO State Machine — Framework-Level Custom Tool
 *
 * Stateful TODO management with:
 * - Graph hierarchy linkage (trajectory → tactic → action → task)
 * - Upstream/downstream dependency tracking
 * - Auto-export to .hivemind/state/todo.json
 * - Schematic sync with hierarchy.json
 * - 40-subtask cap (GX-Pack R2: prevents unbounded task growth)
 * - HARD STOP enforcement (last item must be HARD STOP gate)
 *
 * Namespace: hiveops_* (framework tooling, NOT product hivemind_* tools)
 * Covers R2: TODO Workflow State Machine
 *
 * @example Agent calls: hiveops_todo({ action: "add", content: "Fix auth bug", priority: "high" })
 * @example Agent calls: hiveops_todo({ action: "complete", id: "task-1" })
 * @example Agent calls: hiveops_todo({ action: "list" })
 */

import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

interface TodoItem {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled"
  priority: "high" | "medium" | "low"
  created: number
  updated: number
  /** Link to hierarchy node */
  hierarchy_node_id?: string
  /** Upstream dependency IDs */
  depends_on: string[]
  /** Downstream dependents */
  blocks: string[]
  /** Parent domain (R1-R8) */
  domain?: string
  /** Evidence for completion */
  evidence?: string
}

interface TodoState {
  items: TodoItem[]
  version: number
  lastSync: number
  activeItem: string | null
}

const STATE_DIR = ".hivemind/state"
const TODO_FILE = "todo.json"

/** GX-Pack R2: Maximum number of non-completed/non-cancelled items */
const MAX_ACTIVE_ITEMS = 40

function loadTodoState(dir: string): TodoState {
  const path = join(dir, STATE_DIR, TODO_FILE)
  if (!existsSync(path)) {
    return { items: [], version: 0, lastSync: 0, activeItem: null }
  }
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return { items: [], version: 0, lastSync: 0, activeItem: null }
  }
}

function saveTodoState(dir: string, state: TodoState): void {
  const stateDir = join(dir, STATE_DIR)
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
  state.version++
  state.lastSync = Date.now()
  writeFileSync(join(stateDir, TODO_FILE), JSON.stringify(state, null, 2))
}

function generateId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export default tool({
  description:
    "Manage stateful TODO items with hierarchy linkage, dependency tracking, and auto-persistence. " +
    "Use this instead of todowrite for structured task management with graph sync.",
  args: {
    action: tool.schema
      .enum(["add", "complete", "start", "block", "cancel", "list", "deps", "export"])
      .describe("Action: add/complete/start/block/cancel a task, list all, show deps, or export"),
    content: tool.schema.string().optional().describe("Task description (required for add)"),
    id: tool.schema.string().optional().describe("Task ID (required for complete/start/block/cancel)"),
    priority: tool.schema.enum(["high", "medium", "low"]).optional().describe("Priority level"),
    domain: tool.schema.string().optional().describe("Domain tag (R1-R8)"),
    depends_on: tool.schema.string().optional().describe("Comma-separated dependency task IDs"),
    evidence: tool.schema.string().optional().describe("Evidence for completion"),
    hierarchy_node: tool.schema.string().optional().describe("Linked hierarchy.json node ID"),
  },
  async execute(args, context) {
    const dir = context.directory || "."
    const state = loadTodoState(dir)

    switch (args.action) {
      case "add": {
        if (!args.content) return "ERROR: content is required for add action"

        // GX-Pack R2: Enforce 40-subtask cap on active (non-completed/non-cancelled) items
        const activeItems = state.items.filter(
          (i) => i.status !== "completed" && i.status !== "cancelled"
        )
        if (activeItems.length >= MAX_ACTIVE_ITEMS) {
          return (
            `BLOCKED: Active task limit reached (${activeItems.length}/${MAX_ACTIVE_ITEMS}). ` +
            `Complete or cancel existing tasks before adding new ones. ` +
            `Active: ${activeItems.filter((i) => i.status === "in_progress").length} in_progress, ` +
            `${activeItems.filter((i) => i.status === "pending").length} pending, ` +
            `${activeItems.filter((i) => i.status === "blocked").length} blocked.`
          )
        }

        const item: TodoItem = {
          id: generateId(),
          content: args.content,
          status: "pending",
          priority: (args.priority as TodoItem["priority"]) || "medium",
          created: Date.now(),
          updated: Date.now(),
          depends_on: args.depends_on ? args.depends_on.split(",").map((s) => s.trim()) : [],
          blocks: [],
          domain: args.domain,
          hierarchy_node_id: args.hierarchy_node,
        }

        // Wire up reverse dependencies
        for (const depId of item.depends_on) {
          const dep = state.items.find((i) => i.id === depId)
          if (dep) dep.blocks.push(item.id)
        }

        state.items.push(item)
        saveTodoState(dir, state)
        let msg = `Added: ${item.id} — "${item.content}" [${item.priority}]${item.domain ? ` (${item.domain})` : ""}`

        // GX-Pack R2: HARD STOP enforcement — warn if no HARD STOP exists
        const hasHardStop = state.items.some((i) => i.content.startsWith("HARD STOP"))
        if (!hasHardStop && activeItems.length >= 3) {
          msg += "\n⚠️ WARNING: No HARD STOP item exists. Add one as the last TODO item."
        }

        return msg
      }

      case "start": {
        if (!args.id) return "ERROR: id is required for start action"
        const item = state.items.find((i) => i.id === args.id)
        if (!item) return `ERROR: Task ${args.id} not found`

        // Check if dependencies are met
        const unmetDeps = item.depends_on.filter((depId) => {
          const dep = state.items.find((i) => i.id === depId)
          return dep && dep.status !== "completed"
        })
        if (unmetDeps.length > 0) {
          return `BLOCKED: Task ${args.id} has unmet dependencies: [${unmetDeps.join(", ")}]`
        }

        // Only one task in_progress at a time
        const current = state.items.find((i) => i.status === "in_progress")
        if (current && current.id !== args.id) {
          return `BLOCKED: Task ${current.id} is already in_progress. Complete it first.`
        }

        item.status = "in_progress"
        item.updated = Date.now()
        state.activeItem = item.id
        saveTodoState(dir, state)
        return `Started: ${item.id} — "${item.content}"`
      }

      case "complete": {
        if (!args.id) return "ERROR: id is required for complete action"
        const item = state.items.find((i) => i.id === args.id)
        if (!item) return `ERROR: Task ${args.id} not found`
        item.status = "completed"
        item.updated = Date.now()
        if (args.evidence) item.evidence = args.evidence
        if (state.activeItem === item.id) state.activeItem = null
        saveTodoState(dir, state)

        // Report unblocked downstream tasks
        const unblocked = item.blocks.filter((blockId) => {
          const blocked = state.items.find((i) => i.id === blockId)
          if (!blocked) return false
          return blocked.depends_on.every((depId) => {
            const dep = state.items.find((i) => i.id === depId)
            return dep && dep.status === "completed"
          })
        })

        let msg = `Completed: ${item.id} — "${item.content}"`
        if (unblocked.length > 0) msg += `\nUnblocked: [${unblocked.join(", ")}]`
        return msg
      }

      case "block": {
        if (!args.id) return "ERROR: id is required for block action"
        const item = state.items.find((i) => i.id === args.id)
        if (!item) return `ERROR: Task ${args.id} not found`
        item.status = "blocked"
        item.updated = Date.now()
        if (state.activeItem === item.id) state.activeItem = null
        saveTodoState(dir, state)
        return `Blocked: ${item.id} — "${item.content}"`
      }

      case "cancel": {
        if (!args.id) return "ERROR: id is required for cancel action"
        const item = state.items.find((i) => i.id === args.id)
        if (!item) return `ERROR: Task ${args.id} not found`
        item.status = "cancelled"
        item.updated = Date.now()
        if (state.activeItem === item.id) state.activeItem = null
        saveTodoState(dir, state)
        return `Cancelled: ${item.id}`
      }

      case "list": {
        if (state.items.length === 0) return "No TODO items."
        const lines = state.items
          .filter((i) => i.status !== "cancelled")
          .map((i) => {
            const status = { pending: " ", in_progress: "▶", completed: "✓", blocked: "✗", cancelled: "~" }[i.status]
            const deps = i.depends_on.length > 0 ? ` [deps: ${i.depends_on.join(",")}]` : ""
            const domain = i.domain ? ` (${i.domain})` : ""
            return `[${status}] ${i.id} [${i.priority}]${domain} — ${i.content}${deps}`
          })

        const pending = state.items.filter((i) => i.status === "pending").length
        const active = state.items.filter((i) => i.status === "in_progress").length
        const done = state.items.filter((i) => i.status === "completed").length
        const blocked = state.items.filter((i) => i.status === "blocked").length

        return [
          `TODO State (v${state.version}): ${pending} pending, ${active} active, ${done} done, ${blocked} blocked`,
          `Capacity: ${pending + active + blocked}/${MAX_ACTIVE_ITEMS} active slots used`,
          "---",
          ...lines,
          // GX-Pack R2: HARD STOP awareness
          ...(state.items.some((i) => i.content.startsWith("HARD STOP"))
            ? [`---`, `⛔ HARD STOP: ${state.items.find((i) => i.content.startsWith("HARD STOP"))?.content}`]
            : [`---`, `⚠️ No HARD STOP item — add one as the last TODO item`]),
        ].join("\n")
      }

      case "deps": {
        if (!args.id) {
          // Show full dependency graph
          const roots = state.items.filter((i) => i.depends_on.length === 0 && i.status !== "cancelled")
          if (roots.length === 0) return "No root tasks (all have dependencies)."
          const lines = roots.map((r) => {
            const downstream = r.blocks.map((b) => state.items.find((i) => i.id === b)?.content || b)
            return `${r.id}: "${r.content}" → [${downstream.join(", ")}]`
          })
          return `Dependency roots:\n${lines.join("\n")}`
        }
        const item = state.items.find((i) => i.id === args.id)
        if (!item) return `ERROR: Task ${args.id} not found`
        const upstream = item.depends_on.map((d) => state.items.find((i) => i.id === d)?.content || d)
        const downstream = item.blocks.map((b) => state.items.find((i) => i.id === b)?.content || b)
        return [
          `Task: ${item.id} — "${item.content}"`,
          `Upstream: [${upstream.join(", ") || "none"}]`,
          `Downstream: [${downstream.join(", ") || "none"}]`,
        ].join("\n")
      }

      case "export": {
        // Export TODO state as structured summary for handoff
        const summary = {
          total: state.items.length,
          pending: state.items.filter((i) => i.status === "pending").length,
          in_progress: state.items.filter((i) => i.status === "in_progress").length,
          completed: state.items.filter((i) => i.status === "completed").length,
          blocked: state.items.filter((i) => i.status === "blocked").length,
          active: state.activeItem,
          items: state.items.filter((i) => i.status !== "cancelled"),
        }
        return JSON.stringify(summary, null, 2)
      }

      default:
        return `ERROR: Unknown action: ${args.action}`
    }
  },
})
