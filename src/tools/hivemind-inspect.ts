/**
 * hivemind_inspect — Unified inspection tool for session state and drift analysis.
 *
 * Merged from: scan_hierarchy, think_back, check_drift
 * Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check)
 *
 * Design:
 *   1. Iceberg — minimal args, system handles state reads
 *   2. Context Inference — reads from brain.json, hierarchy.json, anchors.json
 *   3. Signal-to-Noise — structured output with actionable guidance
 *   4. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  scanState,
  deepInspect,
  driftReport,
  type ScanResult,
  type InspectResult,
  type DriftReport,
} from "../lib/inspect-engine.js"

interface JsonOutput {
  success: boolean
  action: string
  data: Record<string, unknown>
  timestamp: string
}

function toJsonOutput(action: string, data: Record<string, unknown>): string {
  return JSON.stringify({
    success: true,
    action,
    data,
    timestamp: new Date().toISOString(),
  } as JsonOutput)
}

export function createHivemindInspectTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Inspect your session state and alignment. " +
      "Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check). " +
      "Use --json for machine-parseable output.",
    args: {
      action: tool.schema
        .enum(["scan", "deep", "drift"])
        .describe("What to do: scan | deep | drift"),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Output as machine-parseable JSON (HC5)"),
    },
    async execute(args, _context) {
      const jsonOutput = args.json ?? false

      switch (args.action) {
        case "scan": {
          const result = await scanState(directory)
          if (jsonOutput) {
            return toJsonOutput("scan", result as unknown as Record<string, unknown>)
          }
          return renderScanText(result)
        }
        case "deep": {
          const result = await deepInspect(directory, "active")
          if (jsonOutput) {
            return toJsonOutput("deep", result as unknown as Record<string, unknown>)
          }
          return renderDeepText(result)
        }
        case "drift": {
          const result = await driftReport(directory)
          if (jsonOutput) {
            return toJsonOutput("drift", result as unknown as Record<string, unknown>)
          }
          return renderDriftText(result)
        }
        default:
          return jsonOutput
            ? toJsonOutput("error", { message: `Unknown action: ${args.action}` })
            : "ERROR: Unknown action. Use scan, deep, or drift."
      }
    },
  })
}

function renderScanText(result: ScanResult): string {
  if (!result.active) {
    return "ERROR: No active session. Call hivemind_session start to begin."
  }

  const lines: string[] = []
  lines.push(`📊 Session: ${result.governanceStatus} | Mode: ${result.mode}`)
  lines.push(`   ID: ${result.sessionId}`)
  lines.push("")

  if (result.treeAscii && result.treeStats) {
    lines.push(`Hierarchy Tree (${result.treeStats.totalNodes} nodes, depth ${result.treeStats.depth}):`)
    lines.push(result.treeAscii)
    if (result.treeStats.completedNodes > 0) {
      lines.push(
        `  Completed: ${result.treeStats.completedNodes} | Active: ${result.treeStats.activeNodes} | Pending: ${result.treeStats.pendingNodes}`,
      )
    }
  } else if (result.hierarchy) {
    lines.push("Hierarchy:")
    lines.push(`  Trajectory: ${result.hierarchy.trajectory || "(not set)"}`)
    lines.push(`  Tactic: ${result.hierarchy.tactic || "(not set)"}`)
    lines.push(`  Action: ${result.hierarchy.action || "(not set)"}`)
  }
  lines.push("")

  if (result.metrics) {
    lines.push("Metrics:")
    lines.push(`  Turns: ${result.metrics.turnCount} | Drift: ${result.metrics.driftScore}/100`)
    lines.push(`  Files: ${result.metrics.filesTouched} | Context updates: ${result.metrics.contextUpdates}`)
  }

  if ((result.anchorsPreview?.length ?? 0) > 0) {
    lines.push("")
    lines.push(`Anchors (${result.anchorCount}):`)
    for (const a of result.anchorsPreview ?? []) {
      lines.push(`  [${a.key}]: ${a.value}`)
    }
    if ((result.anchorCount ?? 0) > (result.anchorsPreview?.length ?? 0)) {
      lines.push(`  ... and ${(result.anchorCount ?? 0) - (result.anchorsPreview?.length ?? 0)} more`)
    }
  }

  if ((result.memCount ?? 0) > 0 && result.memShelfSummary) {
    const shelfInfo = Object.entries(result.memShelfSummary)
      .map(([k, v]) => `${k}(${v})`)
      .join(", ")
    lines.push("")
    lines.push(`Memories: ${result.memCount} [${shelfInfo}]`)
  }

  return lines.join("\n") + "\n→ Use hivemind_inspect drift for alignment analysis, or deep for full context refresh."
}

function renderDeepText(result: InspectResult): string {
  if (!result.active) {
    return "ERROR: No active session. Call hivemind_session start to begin."
  }

  const lines: string[] = []
  lines.push("=== DEEP INSPECT: Context Refresh ===")
  lines.push("")

  lines.push("## Where You Are")
  lines.push(`Mode: ${result.mode}`)

  if (result.treeAscii) {
    lines.push("")
    lines.push("Hierarchy Tree:")
    lines.push(result.treeAscii)

    if ((result.cursorPath?.length ?? 0) > 1) {
      lines.push("")
      lines.push("Cursor path:")
      for (const node of result.cursorPath ?? []) {
        lines.push(`  ${node.level}: ${node.content} (${node.stamp})`)
      }
    }

    if ((result.staleGaps?.length ?? 0) > 0) {
      lines.push("")
      lines.push("⚠ Stale gaps detected:")
      for (const gap of (result.staleGaps ?? []).slice(0, 3)) {
        lines.push(`  ${gap.from} → ${gap.to}: ${gap.gapHours}hr (${gap.relationship})`)
      }
    }
  } else if (result.hierarchy) {
    if (result.hierarchy.trajectory) lines.push(`Trajectory: ${result.hierarchy.trajectory}`)
    if (result.hierarchy.tactic) lines.push(`Tactic: ${result.hierarchy.tactic}`)
    if (result.hierarchy.action) lines.push(`Action: ${result.hierarchy.action}`)
  }
  lines.push("")

  if (result.metrics) {
    lines.push("## Session Health")
    lines.push(`Turns: ${result.metrics.turnCount} | Drift: ${result.metrics.driftScore}/100`)
    lines.push(`Files touched: ${result.metrics.filesTouched}`)
    lines.push(`Context updates: ${result.metrics.contextUpdates}`)
  }
  if ((result.chainBreaks?.length ?? 0) > 0) {
    lines.push("⚠ Chain breaks:")
    for (const msg of result.chainBreaks ?? []) {
      lines.push(`  - ${msg}`)
    }
  }
  lines.push("")

  if ((result.anchors?.length ?? 0) > 0) {
    lines.push("## Immutable Anchors")
    for (const a of (result.anchors ?? []).slice(0, 5)) {
      lines.push(`  [${a.key}]: ${a.value}`)
    }
    if ((result.anchors?.length ?? 0) > 5) {
      lines.push(`  ... and ${(result.anchors?.length ?? 0) - 5} more anchors`)
    }
    lines.push("")
  }

  if ((result.filesTouched?.length ?? 0) > 0) {
    lines.push("## Files Touched")
    for (const f of result.filesTouched ?? []) {
      lines.push(`  - ${f}`)
    }
    lines.push("")
  }

  if (result.planSection) {
    lines.push(...result.planSection.lines)
    if (result.planSection.truncatedCount > 0) {
      lines.push(`  ... (${result.planSection.truncatedCount} more lines)`)
    }
    lines.push("")
  }

  lines.push("=== END DEEP INSPECT ===")
  let text = lines.join("\n") + "\n→ Use hivemind_session update to change focus, or close to archive."
  if (text.length > 2000) {
    text = text.slice(0, 1970) + "\n... (output truncated)"
  }
  return text
}

function renderDriftText(result: DriftReport): string {
  if (!result.active) {
    return "ERROR: No active session. Call hivemind_session start to begin."
  }

  const lines: string[] = []
  lines.push("=== DRIFT REPORT ===")
  lines.push("")

  const driftScore = result.driftScore ?? 0
  const healthEmoji = driftScore >= 70 ? "✅" : driftScore >= 40 ? "⚠️" : "❌"
  lines.push(`${healthEmoji} Drift Score: ${driftScore}/100`)
  lines.push("")

  lines.push("## Trajectory Alignment")
  if (result.hierarchy?.trajectory) {
    lines.push(`Original: ${result.hierarchy.trajectory}`)
    if (result.hierarchy.tactic) lines.push(`Current tactic: ${result.hierarchy.tactic}`)
    if (result.hierarchy.action) lines.push(`Current action: ${result.hierarchy.action}`)
  } else {
    lines.push("⚠ No trajectory set. Use hivemind_session start to set your focus.")
  }
  lines.push("")

  lines.push("## Chain Integrity")
  if (result.chainIntact) {
    lines.push("✅ Hierarchy chain is intact.")
  } else {
    for (const msg of result.chainBreaks ?? []) {
      lines.push(`❌ ${msg}`)
    }
  }
  lines.push("")

  if ((result.anchors?.length ?? 0) > 0) {
    lines.push("## Anchor Compliance")
    lines.push("Verify your work respects these immutable constraints:")
    for (const a of result.anchors ?? []) {
      lines.push(`  ☐ [${a.key}]: ${a.value}`)
    }
    lines.push("")
  }

  lines.push("## Metrics")
  if (result.metrics) {
    lines.push(`Turns: ${result.metrics.turnCount}`)
    lines.push(`Files: ${result.metrics.filesTouched}`)
    lines.push(`Context updates: ${result.metrics.contextUpdates}`)
    if (result.metrics.violationCount > 0) {
      lines.push(`⚠ Violations: ${result.metrics.violationCount}`)
    }
  }
  lines.push("")

  lines.push("## Recommendation")
  if (result.recommendation === "on_track") {
    lines.push("✅ On track. Continue working.")
  } else if (result.recommendation === "some_drift") {
    lines.push("⚠ Some drift detected. Consider using hivemind_session update to refocus.")
  } else {
    lines.push("❌ Significant drift. Use hivemind_session update to re-focus, or close to reset.")
  }
  lines.push("")
  lines.push("=== END DRIFT REPORT ===")
  return lines.join("\n")
}
