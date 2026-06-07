/**
 * Delegation trajectory and contract creation.
 *
 * Extracted from tool-delegation.ts to satisfy the ≤500 LOC gate (GA-4).
 * Handles dynamic imports for trajectory and work-contract modules.
 *
 * @module session-tracker/delegation-trajectory
 */

import type { OpenCodeClient } from "../../shared/session-api.js"

/**
 * Creates a trajectory entry and agent-work-contract for a new delegation.
 *
 * Uses dynamic imports for the trajectory and contract modules since they
 * are optional dependencies that may not be available in all environments.
 *
 * @param client - OpenCode client for structured logging.
 * @param projectRoot - The project root path.
 * @param childSessionID - The child session being delegated.
 * @param parentSessionID - The parent session that initiated delegation.
 * @param subagentType - The type of subagent being delegated to.
 * @param description - The task description for the delegation.
 * @param rootMain - The root main session directory.
 * @param tool - The tool that triggered the delegation (task or delegate-task).
 */
export async function createDelegationTrajectoryAndContract(
  client: OpenCodeClient,
  projectRoot: string,
  childSessionID: string,
  parentSessionID: string,
  subagentType: string,
  description: string,
  rootMain: string,
  tool: string,
): Promise<void> {
  const trajectoryId = `traj-${childSessionID}`
  const contractId = `awc-${childSessionID}`

  // --- Trajectory (REQ-25.1-01) ---
  try {
    const { attachTrajectoryEvidence, eventTrajectory } = await import(
      "../../task-management/trajectory/index.js"
    )
    attachTrajectoryEvidence({
      projectRoot,
      trajectoryId,
      rootSessionId: rootMain,
      sessionId: childSessionID,
      parentTrajectoryId: `traj-${parentSessionID}`,
      evidenceRef: `session-tracker:delegation:${tool}:${childSessionID}`,
    })
    eventTrajectory({
      projectRoot,
      trajectoryId,
      eventType: "delegation_dispatch",
      summary: `${tool} delegation to ${subagentType}: ${description.slice(0, 200)}`,
      evidenceRef: `session-tracker:child-json:${childSessionID}`,
    })
  } catch (err) {
    void client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Hivemind] Trajectory creation failed for delegation ${childSessionID}`,
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }

  // --- Contract (REQ-25.1-02) ---
  try {
    const { createAgentWorkContract } = await import(
      "../../features/agent-work-contracts/index.js"
    )
    createAgentWorkContract({
      projectRoot,
      id: contractId,
      owner: {
        agent: subagentType,
        sessionId: childSessionID,
        parentSessionId: parentSessionID,
      },
      scope: {
        taskBoundary: description.slice(0, 500) || "Delegated task",
        allowedSurfaces: [],
        dependencies: [],
        nonGoals: [],
      },
      evidence: {
        requiredProof: [],
        minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
        verificationCommands: [],
        blockedStateRules: [],
      },
      compaction: {
        briefing: description.slice(0, 200) || "",
        summary: "",
        anchors: [],
        reinjectionPayload: "",
        sourceRefs: [],
      },
      trajectoryId,
    })
  } catch (err) {
    void client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: `[Hivemind] Contract creation failed for delegation ${childSessionID}`,
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }
}
