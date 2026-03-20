/**
 * Intent Classification Schema Definitions
 *
 * Schemas for user intent classification and signal processing.
 * Used to classify user requests and determine appropriate response modes.
 *
 * @module agent-work-contract/schema/intent
 */

import { z } from 'zod'

import {
  PurposeClassSchema,
  ResponseModeSchema,
} from './contract.js'

/**
 * Intent signal schema capturing raw input and classification metadata.
 * Represents the processed intent from user input.
 */
export const IntentSignalSchema = z.object({
  raw: z.string().min(1).describe('The raw user input text'),
  confidence: z.number().min(0).max(1).describe('Classification confidence score 0-1'),
  purposeClass: PurposeClassSchema.describe('Classified purpose category'),
  requiresPlan: z.boolean().describe('Whether planning is required'),
  requiresGovernance: z.boolean().describe('Whether governance oversight is required'),
})

/**
 * Intent classification result schema.
 * Complete classification output with reasoning and response mode suggestion.
 */
export const IntentClassificationSchema = z.object({
  intent: IntentSignalSchema.describe('The classified intent signal'),
  reasoning: z.array(z.string().min(1)).describe('Reasoning steps for classification'),
  suggestedResponseMode: ResponseModeSchema.describe('Recommended response mode for this intent'),
})

// Type exports using Zod inference
export type IntentSignal = z.infer<typeof IntentSignalSchema>
export type IntentClassification = z.infer<typeof IntentClassificationSchema>