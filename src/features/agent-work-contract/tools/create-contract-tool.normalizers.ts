/**
 * Normalizer functions for the create-contract tool.
 *
 * @module create-contract-tool/normalizers
 */

import { tool } from '@opencode-ai/plugin/tool'

import {
  AnchorPointSchema,
  BriefingSchema,
  ChainActionsSchema,
  ResponseModeSchema,
  WorkflowFrameSchema,
  type AgentWorkContract,
} from '../schema/index.js'

/**
 * Normalizes the response mode value.
 *
 * @param value - The raw response mode string or undefined
 * @returns The normalized response mode or undefined
 */
export function normalizeResponseMode(value: string | undefined): AgentWorkContract['responseMode'] | undefined {
  return value === undefined ? undefined : ResponseModeSchema.parse(value)
}

/**
 * Normalizes the workflow value.
 *
 * @param value - The raw workflow object or undefined
 * @returns The normalized workflow or undefined
 */
export function normalizeWorkflow(value: unknown): AgentWorkContract['workflow'] | undefined {
  return value === undefined ? undefined : WorkflowFrameSchema.parse(value)
}

/**
 * Normalizes the chain actions value.
 *
 * @param value - The raw chain actions object or undefined
 * @returns The normalized chain actions or undefined
 */
export function normalizeChainActions(value: unknown): AgentWorkContract['chainActions'] | undefined {
  return value === undefined ? undefined : ChainActionsSchema.parse(value)
}

/**
 * Normalizes the briefing value.
 *
 * @param value - The raw briefing object or undefined
 * @returns The normalized briefing or undefined
 */
export function normalizeBriefing(value: unknown): AgentWorkContract['briefing'] | undefined {
  return value === undefined ? undefined : BriefingSchema.parse(value)
}

/**
 * Normalizes the anchors value.
 *
 * @param value - The raw anchors array or undefined
 * @returns The normalized anchors or undefined
 */
export function normalizeAnchors(value: unknown): AgentWorkContract['anchors'] | undefined {
  return value === undefined
    ? undefined
    : tool.schema.array(tool.schema.unknown()).parse(value).map((item) => AnchorPointSchema.parse(item))
}
