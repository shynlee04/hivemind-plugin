/**
 * Types for the hivemind_hm_init tool.
 * Handles project initialization mode and options.
 */

export type HmInitMode = 'greenfield' | 'brownfield' | 'auto'

export interface HmInitToolArgs {
  /** Project detection mode */
  mode: HmInitMode
  /** Force re-initialization even if .hivemind/ exists */
  force: boolean
}

export interface HmInitProposedChange {
  action: string
  target: string
  description: string
}

export interface HmInitResult {
  mode: HmInitMode
  detectedState: string
  proposedChanges: HmInitProposedChange[]
  authorizationRequired: boolean
}
