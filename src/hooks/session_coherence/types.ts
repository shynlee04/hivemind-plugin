/**
 * Session Coherence type surface for hooks.
 * Re-exported from lib to keep a single source of truth.
 */

export type {
  LastSessionContext,
  PriorTask,
  PriorMem,
  PriorAnchor,
  PromptTransformationResult,
  FirstTurnConfig,
  MainSessionStartInput,
  MainSessionStartOutput,
} from "../../lib/session_coherence.js"

export { DEFAULT_FIRST_TURN_CONFIG } from "../../lib/session_coherence.js"
