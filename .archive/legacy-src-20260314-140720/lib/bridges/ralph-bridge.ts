import type { RalphPrdJson, RalphUserStory } from "../../schemas/graph-nodes.js"
import { loadTasks } from "../manifest.js"
import { loadGraphTasks } from "../graph/reader.js"

export interface RalphTaskGraphSnapshot {
  source: "state.tasks" | "graph.tasks" | "empty"
  warnings: string[]
  prd: RalphPrdJson
}

type ManifestTaskRecord = Record<string, unknown>

function extractGraphTaskReference(task: ManifestTaskRecord): string | null {
  if (typeof task.graph_task_id === "string" && task.graph_task_id.trim().length > 0) {
    return task.graph_task_id.trim()
  }

  const related = task.related_entities
  if (typeof related === "object" && related !== null) {
    const relatedRecord = related as Record<string, unknown>
    if (typeof relatedRecord.graph_task_id === "string" && relatedRecord.graph_task_id.trim().length > 0) {
      return relatedRecord.graph_task_id.trim()
    }
  }

  return null
}

function reconcileStateTasksAgainstGraph(
  tasks: ManifestTaskRecord[],
  validGraphTaskIds: Set<string>,
): { kept: ManifestTaskRecord[]; referenced: number; dropped: number } {
  const kept: ManifestTaskRecord[] = []
  let referenced = 0
  let dropped = 0

  for (const task of tasks) {
    const reference = extractGraphTaskReference(task)
    if (!reference) {
      kept.push(task)
      continue
    }

    referenced += 1
    if (validGraphTaskIds.has(reference)) {
      kept.push(task)
      continue
    }

    dropped += 1
  }

  return { kept, referenced, dropped }
}

function toRalphStatus(value: string | undefined): RalphUserStory["status"] {
  if (value === "completed" || value === "complete") return "completed"
  if (value === "in_progress" || value === "active") return "in_progress"
  if (value === "blocked" || value === "invalidated") return "blocked"
  return "pending"
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim())
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  return []
}

function toAcceptanceCriteria(
  description: string,
  fallback: unknown,
): string[] {
  const fromField = toStringArray(fallback)
  if (fromField.length > 0) {
    return fromField
  }

  const extracted = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ] ") || line.startsWith("- ") || line.startsWith("* "))
    .map((line) => line.replace(/^- \[ \]\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0)

  return extracted
}

export async function buildRalphTaskGraphSnapshot(
  projectRoot: string,
  options: {
    name?: string
    description?: string
  } = {},
): Promise<RalphTaskGraphSnapshot> {
  const warnings: string[] = []
  const name = options.name?.trim() || "HiveFiver Task Export"
  const description = options.description?.trim() || "Generated from .hivemind task manifests."

  const stateTasks = await loadTasks(projectRoot)
  const graphTasks = await loadGraphTasks(projectRoot)
  const validGraphTaskIds = new Set(graphTasks.tasks.map((task) => task.id))
  if (stateTasks && stateTasks.tasks.length > 0) {
    const manifestTaskRecords = stateTasks.tasks as ManifestTaskRecord[]
    const reconciliation = reconcileStateTasksAgainstGraph(manifestTaskRecords, validGraphTaskIds)

    if (reconciliation.dropped > 0) {
      warnings.push(
        `state/tasks.json reconciliation dropped ${reconciliation.dropped} stale task(s) with unresolved graph_task_id`,
      )
    }

    if (reconciliation.referenced > 0 && reconciliation.kept.length === 0 && graphTasks.tasks.length > 0) {
      warnings.push("state/tasks.json only contained stale graph_task_id references; using graph/tasks.json fallback")
    } else if (reconciliation.kept.length > 0) {
      const userStories: RalphUserStory[] = reconciliation.kept.map((rawTask, index) => {
        const task = rawTask as ManifestTaskRecord & { id?: string; text?: string; status?: string }
        const node = task as Record<string, unknown>
        const textValue = typeof task.text === "string" ? task.text : ""
        const titleRaw = textValue.trim().length > 0
          ? textValue.trim()
          : `Task ${index + 1}`
        const dependencies = toStringArray(
          node.dependencies ?? node.depends_on ?? node.dependsOn,
        )
        const acceptanceCriteria = toAcceptanceCriteria(
          titleRaw,
          node.acceptanceCriteria ?? node.acceptance_criteria,
        )

        return {
          id: (typeof task.id === "string" && task.id.length > 0) ? task.id : `story-${index + 1}`,
          title: titleRaw.split("\n")[0] || `Task ${index + 1}`,
          description: titleRaw,
          status: toRalphStatus(typeof task.status === "string" ? task.status : undefined),
          dependencies,
          acceptanceCriteria,
          relatedEntities:
            typeof node.related_entities === "object" && node.related_entities !== null
              ? {
                  session_id:
                    typeof (node.related_entities as Record<string, unknown>).session_id === "string"
                      ? (node.related_entities as Record<string, unknown>).session_id as string
                      : undefined,
                  plan_id:
                    typeof (node.related_entities as Record<string, unknown>).plan_id === "string"
                      ? (node.related_entities as Record<string, unknown>).plan_id as string
                      : undefined,
                  phase_id:
                    typeof (node.related_entities as Record<string, unknown>).phase_id === "string"
                      ? (node.related_entities as Record<string, unknown>).phase_id as string
                      : undefined,
                  graph_task_id:
                    typeof (node.related_entities as Record<string, unknown>).graph_task_id === "string"
                      ? (node.related_entities as Record<string, unknown>).graph_task_id as string
                      : undefined,
                  story_id:
                    typeof (node.related_entities as Record<string, unknown>).story_id === "string"
                      ? (node.related_entities as Record<string, unknown>).story_id as string
                      : undefined,
                  workflow_id:
                    typeof (node.related_entities as Record<string, unknown>).workflow_id === "string"
                      ? (node.related_entities as Record<string, unknown>).workflow_id as string
                      : undefined,
                  requirement_node_id:
                    typeof (node.related_entities as Record<string, unknown>).requirement_node_id === "string"
                      ? (node.related_entities as Record<string, unknown>).requirement_node_id as string
                      : undefined,
                  mcp_provider_id:
                    typeof (node.related_entities as Record<string, unknown>).mcp_provider_id === "string"
                      ? (node.related_entities as Record<string, unknown>).mcp_provider_id as string
                      : undefined,
                  export_id:
                    typeof (node.related_entities as Record<string, unknown>).export_id === "string"
                      ? (node.related_entities as Record<string, unknown>).export_id as string
                      : undefined,
                }
              : undefined,
        }
      })

      return {
        source: "state.tasks",
        warnings,
        prd: {
          name,
          description,
          userStories,
        },
      }
    }
  }

  if (graphTasks.tasks.length > 0) {
    warnings.push("state/tasks.json not found or empty; using graph/tasks.json fallback")
    const userStories: RalphUserStory[] = graphTasks.tasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: `Phase ${task.parent_phase_id}: ${task.title}`,
      status: toRalphStatus(task.status),
      dependencies: index > 0 ? [graphTasks.tasks[index - 1]?.id].filter(Boolean) as string[] : [],
      acceptanceCriteria: [],
      relatedEntities: {
        graph_task_id: task.id,
      },
    }))

    return {
      source: "graph.tasks",
      warnings,
      prd: {
        name,
        description,
        userStories,
      },
    }
  }

  warnings.push("no tasks found in state/tasks.json or graph/tasks.json")
  return {
    source: "empty",
    warnings,
    prd: {
      name,
      description,
      userStories: [],
    },
  }
}
