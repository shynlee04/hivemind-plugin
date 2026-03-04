/**
 * HiveOps Quality Gate — Framework-Level Custom Tool
 *
 * Spec-driven quality validation that goes beyond mechanical linting:
 * - Cross-domain acceptance criteria checking
 * - Evidence collection and grading
 * - Gate pass/fail with structured verdicts
 * - Integration with hiveops_todo for gate-task linkage
 *
 * Namespace: hiveops_* (framework layer)
 * Covers R4: Quality & Validation
 *
 * @example Agent calls: hiveops_gate({ action: "check", gate: "G1", domain: "R1" })
 * @example Agent calls: hiveops_gate({ action: "pass", gate: "G3", evidence: "npm test output: 0 failures" })
 * @example Agent calls: hiveops_gate({ action: "status" })
 */

import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

interface GateRecord {
  gate: string
  domain: string
  plan_id?: string
  node_id?: string
  status: "pending" | "passed" | "failed" | "blocked"
  evidence: string[]
  checkedBy: string
  timestamp: number
  criteria: string[]
  failureReasons: string[]
}

interface GateState {
  gates: GateRecord[]
  version: number
  lastCheck: number
}

/** Quality gate definitions — what each gate requires */
const GATE_DEFINITIONS: Record<string, { name: string; criteria: string[] }> = {
  G0: {
    name: "Entry Integrity",
    criteria: [
      "Scope is valid (framework assets only for hivefiver, src/ for hivemaker)",
      "Required context is present (STATE.md readable, skills loaded)",
      "Target contract identified (which asset type are we working on)",
    ],
  },
  G1: {
    name: "Specification Integrity",
    criteria: [
      "Requirements are unambiguous (no 'maybe' or 'could')",
      "Acceptance conditions are declared (testable pass/fail)",
      "Edge cases are identified",
    ],
  },
  G2: {
    name: "Orchestration Integrity",
    criteria: [
      "Dependencies are explicit (no implicit ordering)",
      "Parallelization criteria satisfied (zero file overlap)",
      "Delegation packets include objective + scope + constraints",
    ],
  },
  G3: {
    name: "Evidence Integrity",
    criteria: [
      "Output matches declared schema",
      "Claims are backed by verification evidence (command output, diffs)",
      "No hallucinated success claims",
      "Confidence reflects evidence quality",
    ],
  },
  G4: {
    name: "Export Integrity",
    criteria: [
      "Handoff payload is complete (state, gates, blockers, next step)",
      "Next step is deterministic (not vague)",
      "Residual risk is declared",
    ],
  },
}

const STATE_DIR = ".hivemind/state"
const GATE_FILE = "gates.json"

function loadGateState(dir: string): GateState {
  const path = join(dir, STATE_DIR, GATE_FILE)
  if (!existsSync(path)) return { gates: [], version: 0, lastCheck: 0 }
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return { gates: [], version: 0, lastCheck: 0 }
  }
}

function saveGateState(dir: string, state: GateState): void {
  const stateDir = join(dir, STATE_DIR)
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
  state.version++
  state.lastCheck = Date.now()
  writeFileSync(join(stateDir, GATE_FILE), JSON.stringify(state, null, 2))
}

export default tool({
  description:
    "Run quality gates with spec-driven criteria, collect evidence, and produce structured pass/fail verdicts. " +
    "Goes beyond mechanical linting — validates cross-domain acceptance criteria.",
  args: {
    action: tool.schema
      .enum(["check", "pass", "fail", "status", "reset", "criteria"])
      .describe("Action: check criteria, pass/fail a gate, show status, reset, or list criteria"),
    gate: tool.schema.string().optional().describe("Gate ID: G0, G1, G2, G3, G4"),
    domain: tool.schema.string().optional().describe("Domain: R1-R8"),
    plan_id: tool.schema.string().optional().describe("Plan lineage ID (e.g. META01, PROJ01-SUB01)"),
    node_id: tool.schema.string().optional().describe("Optional node ID under plan lineage"),
    evidence: tool.schema.string().optional().describe("Evidence supporting pass/fail verdict"),
    reason: tool.schema.string().optional().describe("Reason for failure"),
  },
  async execute(args, context) {
    const dir = context.directory || "."
    const state = loadGateState(dir)
    const agent = context.agent || "unknown"

    switch (args.action) {
      case "criteria": {
        if (args.gate) {
          const def = GATE_DEFINITIONS[args.gate]
          if (!def) return `ERROR: Unknown gate ${args.gate}. Valid: ${Object.keys(GATE_DEFINITIONS).join(", ")}`
          return [`## ${args.gate}: ${def.name}`, ...def.criteria.map((c, i) => `${i + 1}. ${c}`)].join("\n")
        }
        // List all gates
        return Object.entries(GATE_DEFINITIONS)
          .map(([id, def]) => `${id}: ${def.name} (${def.criteria.length} criteria)`)
          .join("\n")
      }

      case "check": {
        if (!args.gate) return "ERROR: gate is required for check action"
        const def = GATE_DEFINITIONS[args.gate]
        if (!def) return `ERROR: Unknown gate ${args.gate}`

        const domain = args.domain || "global"
        const planId = args.plan_id || ""
        const nodeId = args.node_id || ""
        const existing = state.gates.find(
          (g) =>
            g.gate === args.gate &&
            g.domain === domain &&
            (g.plan_id || "") === planId &&
            (g.node_id || "") === nodeId,
        )
        const status = existing?.status || "pending"

        return [
          `## Gate ${args.gate}: ${def.name}`,
          `Status: ${status}`,
          `Domain: ${domain}`,
          `Plan: ${planId || "none"}`,
          `Node: ${nodeId || "none"}`,
          "",
          "Criteria:",
          ...def.criteria.map((c, i) => `  ${i + 1}. ${c}`),
          "",
          existing?.evidence.length
            ? `Evidence collected: ${existing.evidence.length} items`
            : "No evidence collected yet.",
        ].join("\n")
      }

      case "pass": {
        if (!args.gate) return "ERROR: gate is required for pass action"
        if (!args.evidence) return "ERROR: evidence is required to pass a gate (no evidence = no pass)"
        const def = GATE_DEFINITIONS[args.gate]
        if (!def) return `ERROR: Unknown gate ${args.gate}`

        const domain = args.domain || "global"
        const planId = args.plan_id || ""
        const nodeId = args.node_id || ""
        const existing = state.gates.findIndex(
          (g) =>
            g.gate === args.gate &&
            g.domain === domain &&
            (g.plan_id || "") === planId &&
            (g.node_id || "") === nodeId,
        )

        const record: GateRecord = {
          gate: args.gate,
          domain,
          plan_id: planId || undefined,
          node_id: nodeId || undefined,
          status: "passed",
          evidence: [args.evidence],
          checkedBy: agent,
          timestamp: Date.now(),
          criteria: def.criteria,
          failureReasons: [],
        }

        if (existing >= 0) {
          record.evidence = [...state.gates[existing].evidence, args.evidence]
          state.gates[existing] = record
        } else {
          state.gates.push(record)
        }

        saveGateState(dir, state)
        return `PASSED: Gate ${args.gate} (${def.name}) for domain ${domain}${planId ? ` plan ${planId}` : ""}${nodeId ? ` node ${nodeId}` : ""}\nEvidence: ${args.evidence.slice(0, 200)}`
      }

      case "fail": {
        if (!args.gate) return "ERROR: gate is required for fail action"
        if (!args.reason) return "ERROR: reason is required for fail action"
        const def = GATE_DEFINITIONS[args.gate]
        if (!def) return `ERROR: Unknown gate ${args.gate}`

        const domain = args.domain || "global"
        const planId = args.plan_id || ""
        const nodeId = args.node_id || ""
        const existing = state.gates.findIndex(
          (g) =>
            g.gate === args.gate &&
            g.domain === domain &&
            (g.plan_id || "") === planId &&
            (g.node_id || "") === nodeId,
        )

        const record: GateRecord = {
          gate: args.gate,
          domain,
          plan_id: planId || undefined,
          node_id: nodeId || undefined,
          status: "failed",
          evidence: args.evidence ? [args.evidence] : [],
          checkedBy: agent,
          timestamp: Date.now(),
          criteria: def.criteria,
          failureReasons: [args.reason],
        }

        if (existing >= 0) {
          record.failureReasons = [...state.gates[existing].failureReasons, args.reason]
          state.gates[existing] = record
        } else {
          state.gates.push(record)
        }

        saveGateState(dir, state)
        return `FAILED: Gate ${args.gate} (${def.name}) for domain ${domain}${planId ? ` plan ${planId}` : ""}${nodeId ? ` node ${nodeId}` : ""}\nReason: ${args.reason}`
      }

      case "status": {
        if (state.gates.length === 0) return "No gate records. Run hiveops_gate check to begin."
        const lines = state.gates.map((g) => {
          const icon = { pending: "⬜", passed: "✅", failed: "❌", blocked: "🚫" }[g.status]
          const plan = g.plan_id ? ` plan:${g.plan_id}` : ""
          const node = g.node_id ? ` node:${g.node_id}` : ""
          return `${icon} ${g.gate} [${g.domain}]${plan}${node}: ${g.status} (${g.evidence.length} evidence, checked by ${g.checkedBy})`
        })
        const passed = state.gates.filter((g) => g.status === "passed").length
        const failed = state.gates.filter((g) => g.status === "failed").length
        return [`Gate Status (v${state.version}): ${passed} passed, ${failed} failed`, "---", ...lines].join("\n")
      }

      case "reset": {
        const domain = args.domain || "global"
        const planId = args.plan_id || ""
        const nodeId = args.node_id || ""
        if (args.gate) {
          state.gates = state.gates.filter(
            (g) =>
              !(
                g.gate === args.gate &&
                g.domain === domain &&
                (g.plan_id || "") === planId &&
                (g.node_id || "") === nodeId
              ),
          )
          saveGateState(dir, state)
          return `Reset gate ${args.gate} for domain ${domain}${planId ? ` plan ${planId}` : ""}${nodeId ? ` node ${nodeId}` : ""}`
        }
        state.gates = []
        saveGateState(dir, state)
        return "All gates reset."
      }

      default:
        return `ERROR: Unknown action: ${args.action}`
    }
  },
})
