/**
 * HiveOps Session Export — Framework-Level Custom Tool
 *
 * Session export pipeline: export → purify → schema → SOT
 * - Export session content into structured handoff format
 * - Purify: strip noise, extract decisions/evidence/actions
 * - Schema: validate handoff against contract
 * - SOT: register as searchable artifact
 *
 * Namespace: hiveops_* (framework layer)
 * Covers R6: Session Schema & Export
 *
 * @example Agent calls: hiveops_export({ action: "handoff", summary: "Completed R1", next_agent: "hivemaker" })
 * @example Agent calls: hiveops_export({ action: "checkpoint", label: "R1 complete" })
 */

import { tool } from "@opencode-ai/plugin"
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

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

const STATE_DIR = ".hivemind/state"
const HANDOFF_DIR = ".hivemind/handoffs"
const CHECKPOINT_DIR = ".hivemind/checkpoints"

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function loadJson(path: string): any {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return null
  }
}

export default tool({
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
    const dir = context.directory || "."
    const agent = context.agent || "unknown"

    switch (args.action) {
      case "handoff": {
        if (!args.summary) return "ERROR: summary is required for handoff"
        if (!args.next_agent) return "ERROR: next_agent is required for handoff"

        const nextActions = args.next_actions
          ? args.next_actions.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        if (nextActions.length === 0) {
          return "ERROR: next_actions is required for handoff (comma-separated deterministic actions)"
        }

        const blockers = args.blockers
          ? args.blockers.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        const decisions = args.decisions
          ? args.decisions.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        const artifacts = args.artifacts
          ? args.artifacts.split(",").map((s) => s.trim()).filter(Boolean)
          : []

        const handoffDir = join(dir, HANDOFF_DIR)
        ensureDir(handoffDir)

        // Load current gate state for inclusion
        const gateState = loadJson(join(dir, STATE_DIR, "gates.json"))
        const passedGates = gateState?.gates
          ?.filter((g: any) => g.status === "passed")
          ?.map((g: any) => `${g.gate}:${g.domain}`) || []

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

        // Write JSON handoff
        writeFileSync(join(handoffDir, `${id}.json`), JSON.stringify(payload, null, 2))

        // Write human-readable markdown version
        const md = [
          `# Handoff: ${id}`,
          "",
          `**From:** ${payload.fromAgent}`,
          `**To:** ${payload.toAgent}`,
          `**Plan:** ${payload.planId || "none"}`,
          `**Node:** ${payload.nodeId || "none"}`,
          `**Date:** ${new Date(payload.timestamp).toISOString()}`,
          "",
          `## Summary`,
          payload.summary,
          "",
          `## Completed Gates`,
          ...payload.completedGates.map((g) => `- ${g}`),
          "",
          `## Next Actions`,
          ...payload.nextActions.map((a, i) => `${i + 1}. ${a}`),
          "",
          `## Blockers`,
          payload.blockers.length > 0 ? payload.blockers.map((b) => `- ${b}`).join("\n") : "None",
          "",
          `## Key Decisions`,
          payload.decisions.length > 0 ? payload.decisions.map((d) => `- ${d}`).join("\n") : "None recorded",
          "",
          `## Artifacts Modified`,
          payload.artifacts.length > 0 ? payload.artifacts.map((a) => `- \`${a}\``).join("\n") : "None",
          "",
          `## Residual Risk`,
          payload.residualRisk,
        ].join("\n")

        writeFileSync(join(handoffDir, `${id}.md`), md)

        return [
          `Handoff created: ${id}`,
          `From: ${payload.fromAgent} → To: ${payload.toAgent}`,
          `Plan: ${payload.planId || "none"}${payload.nodeId ? ` | Node: ${payload.nodeId}` : ""}`,
          `Gates: ${payload.completedGates.length} passed`,
          `Next: ${payload.nextActions.join("; ") || "none specified"}`,
          `Files: ${HANDOFF_DIR}/${id}.json + ${id}.md`,
        ].join("\n")
      }

      case "checkpoint": {
        if (!args.label) return "ERROR: label is required for checkpoint"

        const cpDir = join(dir, CHECKPOINT_DIR)
        ensureDir(cpDir)

        // Snapshot current TODO and gate state
        const todoState = loadJson(join(dir, STATE_DIR, "todo.json"))
        const gateState = loadJson(join(dir, STATE_DIR, "gates.json"))

        const cp: Checkpoint = {
          label: args.label,
          timestamp: Date.now(),
          agent,
          planId: args.plan_id,
          nodeId: args.node_id,
          todoSnapshot: JSON.stringify(todoState?.items?.map((i: any) => `${i.status}: ${i.content}`) || []),
          gateSnapshot: JSON.stringify(gateState?.gates?.map((g: any) => `${g.gate}:${g.status}`) || []),
          stateHash: `${Date.now().toString(36)}`,
        }

        const cpFile = `cp-${Date.now().toString(36)}.json`
        writeFileSync(join(cpDir, cpFile), JSON.stringify(cp, null, 2))

        return `Checkpoint saved: "${args.label}"${args.plan_id ? ` [plan:${args.plan_id}]` : ""}${args.node_id ? ` [node:${args.node_id}]` : ""} → ${CHECKPOINT_DIR}/${cpFile}`
      }

      case "list": {
        const handoffDir = join(dir, HANDOFF_DIR)
        if (!existsSync(handoffDir)) return "No handoffs yet."
        const files = require("node:fs")
          .readdirSync(handoffDir)
          .filter((f: string) => f.endsWith(".json"))
          .sort()
          .reverse()
          .slice(0, 10)

        if (files.length === 0) return "No handoffs yet."

        const lines = files.map((f: string) => {
          const data = loadJson(join(handoffDir, f))
          if (!data) return `  ${f}: [unreadable]`
          const plan = data.planId ? ` plan:${data.planId}` : ""
          const node = data.nodeId ? ` node:${data.nodeId}` : ""
          return `  ${data.id}: ${data.fromAgent} → ${data.toAgent}${plan}${node} (${new Date(data.timestamp).toISOString().slice(0, 10)})`
        })

        return [`Recent handoffs (${files.length}):`, ...lines].join("\n")
      }

      case "read": {
        if (!args.id) return "ERROR: id is required for read"
        const handoffDir = join(dir, HANDOFF_DIR)
        const mdPath = join(handoffDir, `${args.id}.md`)
        if (existsSync(mdPath)) return readFileSync(mdPath, "utf-8")
        const jsonPath = join(handoffDir, `${args.id}.json`)
        if (existsSync(jsonPath)) return readFileSync(jsonPath, "utf-8")
        return `ERROR: Handoff ${args.id} not found in ${HANDOFF_DIR}/`
      }

      default:
        return `ERROR: Unknown action: ${args.action}`
    }
  },
})
