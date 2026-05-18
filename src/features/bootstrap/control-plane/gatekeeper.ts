/**
 * @fileoverview Control Plane Gatekeeper — intercepts and routes user messages
 * through registered gate decisions before they reach the agent. Implements
 * the blocking/non-blocking gate pattern from the control plane architecture.
 *
 * Phase 61 — CP-01, CP-02, CP-03, CP-04
 */

import { buildRegistry, type PrimitiveEntry } from "../primitive-registry.js"
import { GateDecisionType, isBlockingDecision, classifyGateDecision } from "./gate-decision.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A single gate decision definition that can be registered with the gatekeeper.
 */
export interface GateDecision {
  /** Unique identifier for this gate. */
  id: string
  /** Human-readable description of what this gate checks. */
  description: string
  /** Whether this gate blocks on denial. */
  blocking: boolean
  /** Evaluates the gate given a message context. */
  evaluate: (context: GateEvaluationContext) => GateEvaluationResult | Promise<GateEvaluationResult>
}

/**
 * Context provided to gate evaluation functions.
 */
export interface GateEvaluationContext {
  /** The user message content. */
  message: string
  /** The current session ID. */
  sessionId: string
  /** Optional tool name if this is a tool-use evaluation. */
  toolName?: string
  /** Optional tool arguments if this is a tool-use evaluation. */
  toolArgs?: Record<string, unknown>
}

/**
 * Result of a single gate evaluation.
 */
export interface GateEvaluationResult {
  /** The decision type. */
  decision: GateDecisionType
  /** Human-readable reason for the decision. */
  reason: string
}

/**
 * Aggregated result from evaluating all registered gates.
 */
export interface GateResult {
  /** Whether the message is allowed through. */
  allowed: boolean
  /** Individual gate evaluation results. */
  decisions: Array<{
    gateId: string
    decision: GateDecisionType
    reason: string
    blocking: boolean
  }>
  /** Warnings from non-blocking gates. */
  warnings: string[]
  /** The gate that blocked the message, if any. */
  blockingGate?: string
  /** Total evaluation time in milliseconds. */
  evaluationTimeMs: number
}

/**
 * The gatekeeper interface returned by createGatekeeper.
 */
export interface Gatekeeper {
  /** Register a new gate decision. */
  registerGate: (gate: GateDecision) => void
  /** Get all registered gates. */
  getRegisteredGates: () => GateDecision[]
  /** Evaluate all gates against a message context. */
  evaluate: (context: GateEvaluationContext) => Promise<GateResult>
  /** Detect primitives from the project root. */
  detectPrimitives: () => Promise<PrimitiveEntry[]>
}

// ---------------------------------------------------------------------------
// Built-in gate definitions
// ---------------------------------------------------------------------------

/**
 * Gates that block message delivery on denial.
 */
export const BLOCKING_GATES: string[] = [
  "manual-state-writes",
  "permission-gate",
]

/**
 * Gates that allow the message through but may produce warnings.
 */
export const NON_BLOCKING_GATES: string[] = [
  "deprecation-warning",
  "performance-advisory",
  "usage-hint",
]

// ---------------------------------------------------------------------------
// createGatekeeper — factory function
// ---------------------------------------------------------------------------

/**
 * Creates a new gatekeeper instance with built-in gates pre-registered.
 *
 * @param options - Configuration for the gatekeeper.
 * @returns A {@link Gatekeeper} instance.
 *
 * @example
 * ```ts
 * const gatekeeper = createGatekeeper({ projectRoot: "/path/to/project" })
 * gatekeeper.registerGate(myCustomGate)
 * const result = await gatekeeper.evaluate({ message: "hello", sessionId: "s1" })
 * if (!result.allowed) {
 *   console.error("Blocked by:", result.blockingGate)
 * }
 * ```
 */
export function createGatekeeper(options: { projectRoot: string }): Gatekeeper {
  const { projectRoot } = options
  const gates: GateDecision[] = []

  // Register built-in manual-state-writes gate (CP-04)
  gates.push({
    id: "manual-state-writes",
    description: "Blocks direct writes to .hivemind/state/ files (manualStateWritesForbidden per Q6)",
    blocking: true,
    evaluate: (ctx) => {
      return classifyGateDecision({
        rule: "manualStateWritesForbidden",
        context: { toolName: ctx.toolName, toolArgs: ctx.toolArgs },
      })
    },
  })

  return {
    registerGate(gate: GateDecision) {
      // Prevent duplicate registration
      const existing = gates.findIndex((g) => g.id === gate.id)
      if (existing >= 0) {
        gates[existing] = gate
      } else {
        gates.push(gate)
      }
    },

    getRegisteredGates(): GateDecision[] {
      return [...gates]
    },

    async evaluate(context: GateEvaluationContext): Promise<GateResult> {
      const startTime = Date.now()
      const decisions: GateResult["decisions"] = []
      const warnings: string[] = []
      let blocked = false
      let blockingGate: string | undefined

      for (const gate of gates) {
        try {
          const result = await gate.evaluate(context)
          const gateBlocking = gate.blocking && isBlockingDecision(result.decision)

          decisions.push({
            gateId: gate.id,
            decision: result.decision,
            reason: result.reason,
            blocking: gateBlocking,
          })

          if (result.decision === GateDecisionType.WARN) {
            warnings.push(`[${gate.id}] ${result.reason}`)
          }

          if (gateBlocking && !blocked) {
            blocked = true
            blockingGate = gate.id
          }
        } catch (err) {
          // Gate evaluation errors are warnings, not blocks
          warnings.push(
            `[${gate.id}] Evaluation error: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      }

      return {
        allowed: !blocked,
        decisions,
        warnings,
        blockingGate,
        evaluationTimeMs: Date.now() - startTime,
      }
    },

    async detectPrimitives(): Promise<PrimitiveEntry[]> {
      const snapshot = await buildRegistry(projectRoot)
      return Array.from(snapshot.primitives.values())
    },
  }
}
