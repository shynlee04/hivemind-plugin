import { existsSync } from "node:fs"
import { createStateManager } from "./persistence.js"
import { loadAnchors, saveAnchors, addAnchor } from "./anchors.js"
import { loadMems, saveMems, addMem, getShelfSummary } from "./mems.js"
import {
  loadTree,
  toAsciiTree,
  getTreeStats,
  treeExists,
} from "./hierarchy-tree.js"
import { detectChainBreaks } from "./chain-analysis.js"
import { calculateDriftScore } from "../schemas/brain-state.js"
import {
  scanProjectContext,
  buildBrownfieldRecommendations,
  type ProjectScanSummary,
} from "./project-scan.js"
import { getEffectivePaths } from "./paths.js"

export type ScanAction = "status" | "analyze" | "recommend" | "orchestrate"

export interface OrchestrationOptions {
  json?: boolean
}

export interface OrchestrationResult {
  success: boolean
  action: "orchestrate"
  jsonOutput: boolean
  output: string
}

function formatCsv(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)"
}

function toJson(action: ScanAction, data: Record<string, unknown>): string {
  return JSON.stringify({
    success: true,
    action,
    data,
    timestamp: new Date().toISOString(),
  }, null, 2)
}

function projectScanJsonData(summary: ProjectScanSummary): Record<string, unknown> {
  return {
    project: {
      name: summary.project.name,
      topLevelDirs: summary.project.topLevelDirs,
      sourceDirs: summary.project.sourceDirs,
      configFiles: summary.project.configFiles,
    },
    framework: {
      mode: summary.framework.mode,
      hasGsd: summary.framework.hasGsd,
      hasSpecKit: summary.framework.hasSpecKit,
      hasBmad: summary.framework.hasBmad,
      activePhase: summary.framework.activePhase,
      activeSpecPath: summary.framework.activeSpecPath,
      gsdPhaseGoal: summary.framework.gsdPhaseGoal,
    },
    stack: {
      hints: summary.stack.hints,
    },
    artifacts: {
      staleSignals: summary.artifacts.staleSignals,
      notableFiles: summary.artifacts.notableFiles,
    },
  }
}

function renderAnalyzeText(summary: ProjectScanSummary): string {
  const lines: string[] = []
  lines.push("=== BROWNFIELD ANALYZE ===")
  lines.push(`Project: ${summary.project.name}`)
  lines.push(`Framework mode: ${summary.framework.mode}`)
  lines.push(`BMAD detected: ${summary.framework.hasBmad ? "yes" : "no"}`)
  lines.push(`Stack hints: ${formatCsv(summary.stack.hints)}`)
  lines.push(`Source dirs: ${formatCsv(summary.project.sourceDirs)}`)
  lines.push(`Config files: ${formatCsv(summary.project.configFiles)}`)
  lines.push(`Notable artifacts: ${formatCsv(summary.artifacts.notableFiles)}`)

  if (summary.framework.gsdPhaseGoal) {
    lines.push(`GSD phase goal: ${summary.framework.gsdPhaseGoal}`)
  }

  if (summary.artifacts.staleSignals.length > 0) {
    lines.push("Stale/context-poisoning signals:")
    for (const signal of summary.artifacts.staleSignals) {
      lines.push(`  - ${signal}`)
    }
  }

  lines.push("=== END BROWNFIELD ANALYZE ===")
  return lines.join("\n")
}

function renderRecommendText(summary: ProjectScanSummary, recommendations: string[]): string {
  const lines: string[] = []
  lines.push("=== BROWNFIELD RECOMMENDATION ===")

  if (summary.framework.mode === "both") {
    lines.push("Framework conflict: both .planning and .spec-kit are present.")
  }

  lines.push("Recommended sequence:")
  for (const [index, recommendation] of recommendations.entries()) {
    lines.push(`  ${index + 1}. ${recommendation}`)
  }

  lines.push("")
  lines.push("Lifecycle commands:")
  lines.push("  - declare_intent({ mode: \"exploration\", focus: \"Brownfield stabilization\" })")
  lines.push("  - map_context({ level: \"tactic\", content: \"Purify stale artifacts and framework conflicts\" })")
  lines.push("  - map_context({ level: \"action\", content: \"Execute safe cleanup + validation checkpoints\" })")
  lines.push("")
  lines.push("Checkpoint command:")
  lines.push("  - scan_hierarchy({ include_drift: true })")
  lines.push("=== END BROWNFIELD RECOMMENDATION ===")
  return lines.join("\n")
}

export async function handleStatus(directory: string, includeDrift: boolean, jsonOutput: boolean): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  if (!state) {
    return "ERROR: No active session. Call declare_intent to start."
  }

  const lines: string[] = []
  lines.push(`📊 Session: ${state.session.governance_status} | Mode: ${state.session.mode}`)
  lines.push(`   ID: ${state.session.id}`)
  lines.push("")

  if (treeExists(directory)) {
    const tree = await loadTree(directory)
    const stats = getTreeStats(tree)
    lines.push(`Hierarchy Tree (${stats.totalNodes} nodes, depth ${stats.depth}):`)
    lines.push(toAsciiTree(tree))
    if (stats.completedNodes > 0) {
      lines.push(`  Completed: ${stats.completedNodes} | Active: ${stats.activeNodes} | Pending: ${stats.pendingNodes}`)
    }
  } else {
    lines.push("Hierarchy:")
    lines.push(`  Trajectory: ${state.hierarchy.trajectory || "(not set)"}`)
    lines.push(`  Tactic: ${state.hierarchy.tactic || "(not set)"}`)
    lines.push(`  Action: ${state.hierarchy.action || "(not set)"}`)
  }
  lines.push("")

  lines.push("Metrics:")
  lines.push(`  Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`)
  lines.push(`  Files: ${state.metrics.files_touched.length} | Context updates: ${state.metrics.context_updates}`)

  const anchorsState = await loadAnchors(directory)
  if (anchorsState.anchors.length > 0) {
    lines.push("")
    lines.push(`Anchors (${anchorsState.anchors.length}):`)
    for (const a of anchorsState.anchors.slice(0, 5)) {
      lines.push(`  [${a.key}]: ${a.value.slice(0, 60)}`)
    }
    if (anchorsState.anchors.length > 5) {
      lines.push(`  ... and ${anchorsState.anchors.length - 5} more`)
    }
  }

  const memsState = await loadMems(directory)
  if (memsState.mems.length > 0) {
    const summary = getShelfSummary(memsState)
    const shelfInfo = Object.entries(summary).map(([k, v]) => `${k}(${v})`).join(", ")
    lines.push("")
    lines.push(`Memories: ${memsState.mems.length} [${shelfInfo}]`)
  }

  if (includeDrift) {
    const chainBreaks = detectChainBreaks(state)
    const driftScore = calculateDriftScore(state)

    lines.push("")
    lines.push("=== DRIFT REPORT ===")
    lines.push("")

    const healthEmoji = driftScore >= 70 ? "✅" : driftScore >= 40 ? "⚠️" : "❌"
    lines.push(`${healthEmoji} Drift Score: ${driftScore}/100`)
    lines.push("")

    lines.push("## Chain Integrity")
    if (chainBreaks.length === 0) {
      lines.push("✅ Hierarchy chain is intact.")
    } else {
      chainBreaks.forEach((b) => lines.push(`❌ ${b.message}`))
    }
    lines.push("")

    if (anchorsState.anchors.length > 0) {
      lines.push("## Anchor Compliance")
      lines.push("Verify your work respects these immutable constraints:")
      anchorsState.anchors.forEach((a) => lines.push(`  ☐ [${a.key}]: ${a.value}`))
      lines.push("")
    }

    lines.push("## Recommendation")
    if (driftScore >= 70 && chainBreaks.length === 0) {
      lines.push("✅ On track. Continue working.")
    } else if (driftScore >= 40) {
      lines.push("⚠ Some drift detected. Consider using map_context to update your focus.")
    } else {
      lines.push("❌ Significant drift. Use map_context to re-focus, or compact_session to reset.")
    }
    lines.push("=== END DRIFT REPORT ===")
  }

  if (!includeDrift) {
    lines.push("")
    lines.push("→ Use scan_hierarchy with include_drift=true for alignment analysis, or think_back for a full context refresh.")
  }

  if (jsonOutput) {
    const data: Record<string, unknown> = {
      session: { id: state.session.id, mode: state.session.mode, status: state.session.governance_status },
      hierarchy: { trajectory: state.hierarchy.trajectory, tactic: state.hierarchy.tactic, action: state.hierarchy.action },
      metrics: {
        turns: state.metrics.turn_count,
        drift_score: state.metrics.drift_score,
        files: state.metrics.files_touched.length,
        context_updates: state.metrics.context_updates,
      },
      anchors: anchorsState.anchors.map((a) => ({ key: a.key, value: a.value })),
    }
    if (includeDrift) {
      const chainBreaks = detectChainBreaks(state)
      data.drift = {
        score: calculateDriftScore(state),
        chain_intact: chainBreaks.length === 0,
        breaks: chainBreaks.map((b) => b.message),
      }
    }
    return JSON.stringify(data, null, 2)
  }

  return lines.join("\n")
}

export async function handleAnalyze(directory: string, jsonOutput: boolean): Promise<string> {
  const summary = await scanProjectContext(directory)

  if (jsonOutput) {
    return toJson("analyze", projectScanJsonData(summary))
  }

  return renderAnalyzeText(summary)
}

export async function handleRecommend(directory: string, jsonOutput: boolean): Promise<string> {
  const summary = await scanProjectContext(directory)
  const recommendations = buildBrownfieldRecommendations(summary)

  if (jsonOutput) {
    return toJson("recommend", {
      ...projectScanJsonData(summary),
      recommendations,
      lifecycleCommands: [
        "declare_intent({ mode: \"exploration\", focus: \"Brownfield stabilization\" })",
        "map_context({ level: \"tactic\", content: \"Purify stale artifacts and framework conflicts\" })",
        "map_context({ level: \"action\", content: \"Execute safe cleanup + validation checkpoints\" })",
      ],
    })
  }

  return renderRecommendText(summary, recommendations)
}

export async function executeOrchestration(
  directory: string,
  options: OrchestrationOptions = {}
): Promise<OrchestrationResult> {
  const jsonOutput = options.json ?? false
  const configPath = getEffectivePaths(directory).config
  if (!existsSync(configPath)) {
    const output = jsonOutput
      ? JSON.stringify({
        success: false,
        action: "orchestrate",
        error: "hivemind_not_initialized",
        recommendation: "Run npx hivemind-context-governance first.",
      }, null, 2)
      : [
        "ERROR: HiveMind is not initialized for this project.",
        "Run setup first:",
        "  npx hivemind-context-governance",
      ].join("\n")
    return {
      success: false,
      action: "orchestrate",
      jsonOutput,
      output,
    }
  }

  const summary = await scanProjectContext(directory)
  const recommendations = buildBrownfieldRecommendations(summary)

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state?.session.id ?? "unknown"

  let anchorsState = await loadAnchors(directory)
  let anchorsAdded = 0

  const stackValue = formatCsv(summary.stack.hints)
  const frameworkValue = [
    `mode=${summary.framework.mode}`,
    `gsd=${summary.framework.hasGsd}`,
    `spec_kit=${summary.framework.hasSpecKit}`,
    `bmad=${summary.framework.hasBmad}`,
    summary.framework.activePhase ? `phase=${summary.framework.activePhase}` : null,
    summary.framework.gsdPhaseGoal ? `goal=${summary.framework.gsdPhaseGoal}` : null,
  ]
    .filter(Boolean)
    .join("; ")

  const riskValue = summary.artifacts.staleSignals.length > 0
    ? summary.artifacts.staleSignals.join(" | ")
    : "No obvious stale/poisoning signals detected"

  const upsertAnchor = (key: string, value: string) => {
    const existing = anchorsState.anchors.find((anchor) => anchor.key === key)
    if (!existing || existing.value !== value) {
      anchorsState = addAnchor(anchorsState, key, value, sessionId)
      anchorsAdded++
    }
  }

  upsertAnchor("project-stack", stackValue)
  upsertAnchor("framework-context", frameworkValue)
  upsertAnchor("brownfield-risks", riskValue)

  if (anchorsAdded > 0) {
    await saveAnchors(directory, anchorsState)
  }

  let memsState = await loadMems(directory)
  const memContent = [
    `[brownfield-scan] project=${summary.project.name}`,
    `framework=${summary.framework.mode}`,
    `stack=${stackValue}`,
    `stale=${summary.artifacts.staleSignals.length > 0 ? summary.artifacts.staleSignals.join("; ") : "none"}`,
  ].join(" | ")

  const memExists = memsState.mems.some(
    (mem) => mem.shelf === "project-intel" && mem.content === memContent
  )

  let memSaved = false
  if (!memExists) {
    memsState = addMem(
      memsState,
      "project-intel",
      memContent,
      ["brownfield", "scan", "baseline"],
      sessionId
    )
    await saveMems(directory, memsState)
    memSaved = true
  }

  const output = jsonOutput
    ? toJson("orchestrate", {
      ...projectScanJsonData(summary),
      anchorsAdded,
      memSaved,
      sessionLinked: state !== null,
      recommendations,
      nextStep: "Use map_context to align tactic/action before code changes.",
    })
    : [
      "=== BROWNFIELD ORCHESTRATION ===",
      `Anchors updated: ${anchorsAdded}`,
      `Memory saved: ${memSaved ? "yes" : "no (deduplicated)"}`,
      `Session linked: ${state ? "yes" : "no"}`,
      "",
      "Recommendations:",
      ...recommendations.map((recommendation, index) => `  ${index + 1}. ${recommendation}`),
      "",
      "Next command:",
      "  map_context({ level: \"tactic\", content: \"Brownfield cleanup plan execution\" })",
      "=== END BROWNFIELD ORCHESTRATION ===",
    ].join("\n")

  return {
    success: true,
    action: "orchestrate",
    jsonOutput,
    output,
  }
}
