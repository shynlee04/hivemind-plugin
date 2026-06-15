/**
 * @module init-steps
 *
 * Orchestrator for the `hivemind init` interactive wizard.
 * Imports and sequences step functions from per-step files.
 * Re-exports all public types and functions for backward compatibility.
 *
 * @example
 * ```ts
 * const config: Partial<HivemindConfigs> = {}
 * await stepRecoveryCheck(configsPath, prompts)
 * const presetName = await stepProfileSelection(prompts)
 * await stepLanguageAndCommunication(prompts, config)
 * // ... config is now populated
 * ```
 */

export { stepRecoveryCheck } from "./recovery-step.js"
export { stepProfileSelection } from "./profile-step.js"
export { stepLanguageAndCommunication, LANGUAGE_OPTIONS } from "./language-step.js"
export { stepExpertiseAndBehavior, EXPERTISE_OPTIONS } from "./mode-step.js"
export { stepWorkflowToggles } from "./scope-step.js"
export { stepGovernanceAndSafety } from "./delegation-step.js"
export { stepAdvanced } from "./features-step.js"
export { stepDiffPreview } from "./preview-step.js"
export { stepAtomicWrite } from "./write-step.js"
