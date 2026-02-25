/**
 * Session Coherence Types — shared by lib and hooks.
 */

import { DEFAULT_CONTEXT_BUDGET } from "./budget.js"

export interface LastSessionContext {
  sessionId: string
  trajectory: string | null
  activeTasks: PriorTask[]
  pendingTodos: string[]
  relevantMems: PriorMem[]
  anchors: PriorAnchor[]
  mode: string | null
  lastCompactSummary: string | null
}

export interface PriorTask {
  id: string
  content: string
  status: string
  stamp: string
}

export interface PriorMem {
  id: string
  content: string
  shelf: string
  createdAt: string
}

export interface PriorAnchor {
  key: string
  value: string
  timestamp: string
}

export interface PromptTransformationResult {
  prompt: string
  isFirstTurn: boolean
  sessionId: string
}

export interface FirstTurnConfig {
  maxTasks: number
  maxMems: number
  maxTodos: number
  includeAnchors: boolean
  budget: number
}

export const DEFAULT_FIRST_TURN_CONFIG: FirstTurnConfig = {
  maxTasks: 5,
  maxMems: 3,
  maxTodos: 10,
  includeAnchors: true,
  budget: DEFAULT_CONTEXT_BUDGET,
}

export interface MainSessionStartInput {}

export interface MainSessionStartOutput {
  messages: unknown[]
}
