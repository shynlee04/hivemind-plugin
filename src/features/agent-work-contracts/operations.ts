import { randomUUID } from "node:crypto"

import { attachTrajectoryEvidence } from "../../task-management/trajectory/index.js"
import { detectRuntimePressure } from "../runtime-pressure/index.js"
import { ANCHOR_LIMIT, BRIEFING_LIMIT, REINJECTION_LIMIT, SUMMARY_LIMIT } from "./bounds.js"
import { getAgentWorkContract, readAgentWorkContracts, upsertAgentWorkContract } from "./store.js"
import type {
  AgentWorkCompaction,
  AgentWorkContract,
  AgentWorkCreateResult,
  AgentWorkExportResult,
  CreateAgentWorkContractInput,
  ExportAgentWorkContractInput,
} from "./types.js"

/**
 * Create a pressure-aware durable agent work contract.
 *
 * @param input - Contract fields and pressure context.
 * @returns Created contract or pressure-blocked result.
 */
export function createAgentWorkContract(input: CreateAgentWorkContractInput): AgentWorkCreateResult {
  const pressureDecision = detectRuntimePressure({
    score: input.pressureScore,
    tier: input.pressureTier,
    toolName: "hivemind-agent-work-create",
  })

  if (pressureDecision.outcome === "block") {
    return { status: "pressure-blocked", pressureDecision, reason: pressureDecision.reason }
  }
  if (pressureDecision.outcome === "require_approval" && input.pressureApproved !== true) {
    return { status: "pressure-blocked", pressureDecision, reason: "gated pressure requires explicit approval before contract store writes" }
  }

  const now = Date.now()
  const id = input.id ?? `awc_${randomUUID()}`
  const trajectoryEvidenceRef = input.trajectoryId ? `agent-work-contract:${id}` : undefined
  const contract: AgentWorkContract = {
    id,
    status: "created",
    owner: input.owner,
    scope: input.scope,
    evidence: input.evidence,
    compaction: boundCompaction(input.compaction),
    trajectoryId: input.trajectoryId,
    trajectoryEvidenceRef,
    createdAt: now,
    updatedAt: now,
  }

  const persisted = upsertAgentWorkContract(input.projectRoot, contract)
  if (input.trajectoryId && trajectoryEvidenceRef) {
    attachTrajectoryEvidence({
      projectRoot: input.projectRoot,
      trajectoryId: input.trajectoryId,
      sessionId: input.owner.sessionId,
      evidenceRef: trajectoryEvidenceRef,
    })
  }

  return { status: "created", contract: persisted, pressureDecision }
}

/**
 * Export a contract as a bounded handoff artifact.
 *
 * @param input - Contract export request.
 * @returns JSON or Markdown handoff payload.
 * @throws {Error} When the requested contract does not exist.
 */
export function exportAgentWorkContract(input: ExportAgentWorkContractInput): AgentWorkExportResult {
  const contract = getAgentWorkContract(input.projectRoot, input.contractId)
  if (!contract) throw new Error(`[Harness] agent work contract not found: ${input.contractId}`)

  if (input.format === "markdown") {
    return { contractId: contract.id, format: "markdown", payload: renderMarkdownContract(contract) }
  }

  return { contractId: contract.id, format: "json", payload: { contract } }
}

/**
 * Bound compaction payload fields before durable persistence.
 *
 * @param compaction - Unbounded compaction payload.
 * @returns Bounded compaction payload.
 */
function boundCompaction(compaction: AgentWorkCompaction): AgentWorkCompaction {
  return {
    briefing: boundText(compaction.briefing, BRIEFING_LIMIT),
    summary: boundText(compaction.summary, SUMMARY_LIMIT),
    anchors: compaction.anchors.slice(0, ANCHOR_LIMIT).map((anchor: string) => boundText(anchor, 160)),
    reinjectionPayload: boundText(compaction.reinjectionPayload, REINJECTION_LIMIT),
    sourceRefs: compaction.sourceRefs.slice(0, ANCHOR_LIMIT).map((sourceRef: string) => boundText(sourceRef, 240)),
  }
}

/**
 * Bound a text field with a visible truncation marker.
 *
 * @param value - Text to bound.
 * @param limit - Maximum length.
 * @returns Bounded text.
 */
function boundText(value: string, limit: number): string {
  if (value.length <= limit) return value
  return value.slice(0, Math.max(0, limit - 1)).trimEnd()
}

/**
 * Render a contract as Markdown for handoff.
 *
 * @param contract - Contract to render.
 * @returns Markdown handoff string.
 */
function renderMarkdownContract(contract: AgentWorkContract): string {
  return [
    `# Agent Work Contract: ${contract.id}`,
    "",
    `**Status:** ${contract.status}`,
    `**Owner:** ${contract.owner.agent}`,
    `**Task Boundary:** ${contract.scope.taskBoundary}`,
    "",
    "## Allowed Surfaces",
    renderList(contract.scope.allowedSurfaces),
    "",
    "## Dependencies",
    renderList(contract.scope.dependencies),
    "",
    "## Non-Goals",
    renderList(contract.scope.nonGoals),
    "",
    "## Evidence Contract",
    `- Minimum evidence level: ${contract.evidence.minimumEvidenceLevel}`,
    `- Required proof: ${contract.evidence.requiredProof.join(", ") || "None"}`,
    `- Verification commands: ${contract.evidence.verificationCommands.join("; ") || "None"}`,
    `- Blocked-state rules: ${contract.evidence.blockedStateRules.join("; ") || "None"}`,
    "",
    "## Compaction Preservation",
    `**Briefing:** ${contract.compaction.briefing}`,
    `**Summary:** ${contract.compaction.summary}`,
    `**Anchors:** ${contract.compaction.anchors.join(", ") || "None"}`,
    `**Reinjection Payload:** ${contract.compaction.reinjectionPayload}`,
    `**Source References:** ${contract.compaction.sourceRefs.join(", ") || "None"}`,
    "",
  ].join("\n")
}

/**
 * Render a Markdown list with an explicit empty state.
 *
 * @param values - Values to render.
 * @returns Markdown list.
 */
function renderList(values: string[]): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- None"
}

/**
 * Find all contracts matching a given trajectory ID.
 *
 * @param projectRoot - Trusted project root.
 * @param trajectoryId - Trajectory ID to match.
 * @returns Deep-cloned contracts with the given trajectoryId.
 */
export function findContractsByTrajectory(projectRoot: string, trajectoryId: string): AgentWorkContract[] {
  const store = readAgentWorkContracts(projectRoot)
  return Object.values(store.contracts).filter((contract) => contract.trajectoryId === trajectoryId)
}
