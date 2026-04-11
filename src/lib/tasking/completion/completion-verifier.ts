/**
 * Two-poll stability completion verifier for delegated sessions (D-12).
 *
 * Requires 2 consecutive idle polls before declaring true completion.
 * Integrates with start-gate (D-10) to ensure work actually started.
 */

import { getSessionMessages } from "../../session-api.js"
import type { OpenCodeClient } from "../../session-api.js"
import { verifyStartGate } from "./start-gate.js"
import type { StartGateEvidence, CompletionCheckResult, CompletionStatus } from "./types.js"

export class CompletionVerifier {
  private consecutiveIdlePolls = 0
  private lastMessageCount = -1
  private startGatePassed = false
  private startGateEvidence: StartGateEvidence | null = null

  /**
   * Check completion status for a session.
   *
   * @param client - OpenCode client for SDK calls
   * @param sessionID - Session to check
   * @param isIdle - Whether the session is currently idle (from CompletionDetector)
   * @returns Completion status with evidence and poll counts
   */
  async check(
    client: OpenCodeClient,
    sessionID: string,
    isIdle: boolean,
  ): Promise<CompletionCheckResult> {
    // Get current message count to detect activity
    const messages = await getSessionMessages(client, sessionID)
    const currentMessageCount = messages.length

    // If message count changed, session has new activity → reset idle counter
    if (this.lastMessageCount !== -1 && currentMessageCount !== this.lastMessageCount) {
      this.consecutiveIdlePolls = 0
      // Re-evaluate start gate with new evidence
      this.startGateEvidence = await verifyStartGate(client, sessionID)
      this.startGatePassed = this.startGateEvidence.passed
    } else if (this.startGateEvidence === null) {
      // First check — evaluate start gate
      this.startGateEvidence = await verifyStartGate(client, sessionID)
      this.startGatePassed = this.startGateEvidence.passed
    }

    this.lastMessageCount = currentMessageCount

    // If idle and start gate passed, increment idle counter
    if (isIdle && this.startGatePassed) {
      this.consecutiveIdlePolls++
    } else if (!isIdle) {
      // Not idle → reset counter (active work happening)
      this.consecutiveIdlePolls = 0
    }

    // Determine status
    const status = this.determineStatus(isIdle)

    return {
      status,
      evidence: this.startGateEvidence,
      consecutiveIdlePolls: this.consecutiveIdlePolls,
      idleDurationMs: 0, // Caller tracks wall-clock duration
    }
  }

  /** Reset all internal state for reuse or testing. */
  reset(): void {
    this.consecutiveIdlePolls = 0
    this.lastMessageCount = -1
    this.startGatePassed = false
    this.startGateEvidence = null
  }

  private determineStatus(isIdle: boolean): CompletionStatus {
    if (!this.startGateEvidence) {
      return "pending"
    }

    // Start gate not passed
    if (!this.startGatePassed) {
      // Has some assistant activity but not enough for start gate
      if (this.startGateEvidence.assistantMessages > 0) {
        return "active"
      }
      return "pending"
    }

    // Start gate passed — check idle state
    if (this.consecutiveIdlePolls >= 2) {
      return "completed"
    }

    if (isIdle) {
      return "idle"
    }

    return "active"
  }
}
