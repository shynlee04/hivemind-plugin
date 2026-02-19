/**
 * Session Coherence Types — TypeScript interfaces for first-turn prompt transformation
 *
 * Defines the shape of context data retrieved from prior sessions and
 * the transformed prompt structure.
 */

// Note: BrainState and TrajectoryNode imported by consumers as needed

/**
 * Last session context - data retrieved from previous session
 * to be injected on first turn of new session.
 */
export interface LastSessionContext {
  /** Previous session ID */
  sessionId: string
  /** Previous session trajectory */
  trajectory: string | null
  /** Active tasks from previous session */
  activeTasks: PriorTask[]
  /** Pending TODO items */
  pendingTodos: string[]
  /** Recent mems relevant to current work */
  relevantMems: PriorMem[]
  /** Anchors from previous session */
  anchors: PriorAnchor[]
  /** Session mode from previous session */
  mode: string | null
  /** Last compact summary */
  lastCompactSummary: string | null
}

/**
 * Task from prior session
 */
export interface PriorTask {
  id: string
  content: string
  status: string
  stamp: string
}

/**
 * Memory from prior session
 */
export interface PriorMem {
  id: string
  content: string
  shelf: string
  createdAt: string
}

/**
 * Anchor from prior session
 */
export interface PriorAnchor {
  key: string
  value: string
  timestamp: string
}

/**
 * Result of prompt transformation
 */
export interface PromptTransformationResult {
  /** The transformed prompt text */
  prompt: string
  /** Whether this is first turn */
  isFirstTurn: boolean
  /** Session ID used */
  sessionId: string
}

/**
 * Configuration for first-turn context retrieval
 */
export interface FirstTurnConfig {
  /** Max tasks to include */
  maxTasks: number
  /** Max mems to include */
  maxMems: number
  /** Max todos to include */
  maxTodos: number
  /** Include anchors */
  includeAnchors: boolean
  /** Budget for prompt (chars) */
  budget: number
}

import { DEFAULT_CONTEXT_BUDGET } from "../../lib/budget.js"

/**
 * Default configuration
 */
export const DEFAULT_FIRST_TURN_CONFIG: FirstTurnConfig = {
  maxTasks: 5,
  maxMems: 3,
  maxTodos: 10,
  includeAnchors: true,
  budget: DEFAULT_CONTEXT_BUDGET,
}

/**
 * Input for hook - empty as hook doesn't receive special input
 */
export interface MainSessionStartInput {}

/**
 * Output for hook - messages array modified in place
 */
export interface MainSessionStartOutput {
  messages: unknown[]
}
