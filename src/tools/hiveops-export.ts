/**
 * HiveOps session export tool.
 *
 * This is the canonical `src` owner for the legacy `hiveops_export` behavior.
 * The `.opencode/tool/hiveops_export.ts` file remains only as a compatibility wrapper.
 *
 * @example Agent calls: hiveops_export({ action: "handoff", summary: "Completed R1", next_agent: "hivemaker" })
 * @example Agent calls: hiveops_export({ action: "checkpoint", label: "R1 complete" })
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { join } from "node:path"

import { readManifest } from "../lib/manifest.js"
import { getHiveOpsPaths } from "../lib/hiveops-paths.js"
import { ensureHivemindIngressClassification } from "../lib/hivemind-ingress-policy.js"
import { readCanonicalTaskAuthority, renderCanonicalTaskSnapshot } from "../lib/task-authority.js"

interface HandoffPayload {
  id: string
  timestamp: number
  fromAgent: string
  toAgent: string
  planId?: string
  nodeId?: string
  summary: string
  completedGates: string[]
  blockers: string[]
  nextActions: string[]
  artifacts: string[]
  decisions: string[]
  residualRisk: string
}

interface Checkpoint {
  label: string
  timestamp: number
  agent: string
  planId?: string
  nodeId?: string
  todoSnapshot: string
  gateSnapshot: string
  stateHash: string
}

/**
 * Ensure a directory exists before writing artifacts into it.
 *
 * @param dir - Directory path to create when absent.
 * @returns Resolves when the directory exists.
 */
async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

/**
 * Load a JSON file through the manifest layer when it exists.
 *
 * @param path - Absolute file path to load.
 * @returns Parsed JSON payload or `null` when the file does not exist.
 */
async function loadJson<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null
  return readManifest<T | null>(path, null)
}

export function createHiveOpsExportTool(fallbackDirectory: string): ToolDefinition {
  return tool({
    description:
      "Export session state as structured handoff for downstream agents. " +
      "Pipeline: export → purify → schema → SOT registration. " +
      "Creates searchable, retraceable session artifacts.",
    args: {
      action: tool.schema
        .enum(["handoff", "checkpoint", "list", "read"])
        .describe("Action: create handoff, save checkpoint, list handoffs, or read a specific one"),
      summary: tool.schema.string().optional().describe("Session summary for handoff"),
      next_agent: tool.schema.string().optional().describe("Target agent for handoff"),
      next_actions: tool.schema.string().optional().describe("Comma-separated next actions"),
      blockers: tool.schema.string().optional().describe("Comma-separated blockers"),
      decisions: tool.schema.string().optional().describe("Comma-separated key decisions made"),
      artifacts: tool.schema.string().optional().describe("Comma-separated artifact paths created/modified"),
      plan_id: tool.schema.string().optional().describe("Plan lineage ID (e.g. META01, PROJ01-SUB01)"),
      node_id: tool.schema.string().optional().describe("Optional node ID under plan lineage"),
      risk: tool.schema.string().optional().describe("Residual risk statement"),
      label: tool.schema.string().optional().describe("Checkpoint label"),
      id: tool.schema.string().optional().describe("Handoff ID to read"),
    },
    async execute(args, context) {
      const projectRoot = context.directory || fallbackDirectory || "."
      const agent = context.agent || "unknown"
      const paths = getHiveOpsPaths(projectRoot)

      switch (args.action) {
        case "handoff": {
          if (!args.summary) return "ERROR: summary is required for handoff"
          if (!args.next_agent) return "ERROR: next_agent is required for handoff"

          const nextActions = args.next_actions
            ? args.next_actions.split(",").map((item) => item.trim()).filter(Boolean)
            : []
          if (nextActions.length === 0) {
            return "ERROR: next_actions is required for handoff (comma-separated deterministic actions)"
          }

          const blockers = args.blockers
            ? args.blockers.split(",").map((item) => item.trim()).filter(Boolean)
            : []
          const decisions = args.decisions
            ? args.decisions.split(",").map((item) => item.trim()).filter(Boolean)
            : []
          const artifacts = args.artifacts
            ? args.artifacts.split(",").map((item) => item.trim()).filter(Boolean)
            : []

          await ensureDir(paths.handoffDir)

          ensureHivemindIngressClassification(
            projectRoot,
            paths.gatesFile,
            ["authority"],
            "hiveops_export handoff gate read",
          )
          const gateState = await loadJson<{ gates?: Array<{ gate: string; domain: string; status: string }> }>(paths.gatesFile)
          const passedGates = gateState?.gates
            ?.filter((gate) => gate.status === "passed")
            ?.map((gate) => `${gate.gate}:${gate.domain}`) || []

          const id = `handoff-${Date.now().toString(36)}`
          const payload: HandoffPayload = {
            id,
            timestamp: Date.now(),
            fromAgent: agent,
            toAgent: args.next_agent,
            planId: args.plan_id,
            nodeId: args.node_id,
            summary: args.summary,
            completedGates: passedGates,
            blockers,
            nextActions,
            artifacts,
            decisions,
            residualRisk: args.risk || "None declared",
          }

          const handoffJsonPath = join(paths.handoffDir, `${id}.json`)
          const handoffMarkdownPath = join(paths.handoffDir, `${id}.md`)
          ensureHivemindIngressClassification(
            projectRoot,
            handoffJsonPath,
            ["evidence"],
            "hiveops_export handoff json write",
          )
          ensureHivemindIngressClassification(
            projectRoot,
            handoffMarkdownPath,
            ["evidence"],
            "hiveops_export handoff markdown write",
          )

          writeFileSync(handoffJsonPath, JSON.stringify(payload, null, 2))

          const markdown = [
            `# Handoff: ${id}`,
            "",
            `**From:** ${payload.fromAgent}`,
            `**To:** ${payload.toAgent}`,
            `**Plan:** ${payload.planId || "none"}`,
            `**Node:** ${payload.nodeId || "none"}`,
            `**Date:** ${new Date(payload.timestamp).toISOString()}`,
            "",
            "## Summary",
            payload.summary,
            "",
            "## Completed Gates",
            ...payload.completedGates.map((gate) => `- ${gate}`),
            "",
            "## Next Actions",
            ...payload.nextActions.map((action, index) => `${index + 1}. ${action}`),
            "",
            "## Blockers",
            payload.blockers.length > 0 ? payload.blockers.map((blocker) => `- ${blocker}`).join("\n") : "None",
            "",
            "## Key Decisions",
            payload.decisions.length > 0 ? payload.decisions.map((decision) => `- ${decision}`).join("\n") : "None recorded",
            "",
            "## Artifacts Modified",
            payload.artifacts.length > 0 ? payload.artifacts.map((artifact) => `- \`${artifact}\``).join("\n") : "None",
            "",
            "## Residual Risk",
            payload.residualRisk,
          ].join("\n")

          writeFileSync(handoffMarkdownPath, markdown)

          return [
            `Handoff created: ${id}`,
            `From: ${payload.fromAgent} → To: ${payload.toAgent}`,
            `Plan: ${payload.planId || "none"}${payload.nodeId ? ` | Node: ${payload.nodeId}` : ""}`,
            `Gates: ${payload.completedGates.length} passed`,
            `Next: ${payload.nextActions.join("; ") || "none specified"}`,
            `Files: .hivemind/handoffs/${id}.json + ${id}.md`,
          ].join("\n")
        }

        case "checkpoint": {
          if (!args.label) return "ERROR: label is required for checkpoint"

          await ensureDir(paths.checkpointDir)

          ensureHivemindIngressClassification(
            projectRoot,
            paths.gatesFile,
            ["authority"],
            "hiveops_export checkpoint gate read",
          )
          const gateState = await loadJson<{ gates?: Array<{ gate: string; status: string }> }>(paths.gatesFile)
          const taskAuthority = await readCanonicalTaskAuthority(projectRoot, context.sessionID || "unknown")

          const checkpoint: Checkpoint = {
            label: args.label,
            timestamp: Date.now(),
            agent,
            planId: args.plan_id,
            nodeId: args.node_id,
            todoSnapshot: JSON.stringify(renderCanonicalTaskSnapshot(taskAuthority.manifest)),
            gateSnapshot: JSON.stringify(gateState?.gates?.map((gate) => `${gate.gate}:${gate.status}`) || []),
            stateHash: Date.now().toString(36),
          }

          const fileName = `cp-${Date.now().toString(36)}.json`
          const checkpointPath = join(paths.checkpointDir, fileName)
          ensureHivemindIngressClassification(
            projectRoot,
            checkpointPath,
            ["evidence"],
            "hiveops_export checkpoint write",
          )
          writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2))

          return `Checkpoint saved: "${args.label}"${args.plan_id ? ` [plan:${args.plan_id}]` : ""}${args.node_id ? ` [node:${args.node_id}]` : ""} → .hivemind/checkpoints/${fileName}`
        }

        case "list": {
          if (!existsSync(paths.handoffDir)) return "No handoffs yet."

          const files = readdirSync(paths.handoffDir)
            .filter((file) => file.endsWith(".json"))
            .sort()
            .reverse()
            .slice(0, 10)

          if (files.length === 0) return "No handoffs yet."

          const lines = files.map((file) => {
            const handoffPath = join(paths.handoffDir, file)
            ensureHivemindIngressClassification(
              projectRoot,
              handoffPath,
              ["evidence"],
              "hiveops_export handoff list read",
            )
            const data = readFileSync(handoffPath, "utf-8")
            const parsed = JSON.parse(data) as HandoffPayload
            const plan = parsed.planId ? ` plan:${parsed.planId}` : ""
            const node = parsed.nodeId ? ` node:${parsed.nodeId}` : ""
            return `  ${parsed.id}: ${parsed.fromAgent} → ${parsed.toAgent}${plan}${node} (${new Date(parsed.timestamp).toISOString().slice(0, 10)})`
          })

          return [`Recent handoffs (${files.length}):`, ...lines].join("\n")
        }

        case "read": {
          if (!args.id) return "ERROR: id is required for read"

          const markdownPath = join(paths.handoffDir, `${args.id}.md`)
          if (existsSync(markdownPath)) {
            ensureHivemindIngressClassification(
              projectRoot,
              markdownPath,
              ["evidence"],
              "hiveops_export handoff markdown read",
            )
            return readFileSync(markdownPath, "utf-8")
          }

          const jsonPath = join(paths.handoffDir, `${args.id}.json`)
          if (existsSync(jsonPath)) {
            ensureHivemindIngressClassification(
              projectRoot,
              jsonPath,
              ["evidence"],
              "hiveops_export handoff json read",
            )
            return readFileSync(jsonPath, "utf-8")
          }

          return `ERROR: Handoff ${args.id} not found in .hivemind/handoffs/`
        }

        default:
          return `ERROR: Unknown action: ${args.action}`
      }
    },
  })
}
