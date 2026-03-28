/**
 * Config Records — User preferences and operation configuration
 *
 * @module schema-kernel/config-records
 */

import { z } from 'zod'

/** User communication expertise level */
export const UserExpertLevel = z.enum(['beginner', 'intermediate', 'advanced', 'expert'])

/** Governance strictness level */
export const GovernanceLevel = z.enum([
  'permissive',    // Minimal gates, fast iteration
  'standard',      // Normal TDD + verification gates
  'strict',        // Extra verification, mandatory review
  'paranoid',      // Halt-investigate-propose on any anomaly
])

/** Agent operation mode */
export const OperationMode = z.enum([
  'iterative-interactive',  // Default — consult user each turn
  'research-first',         // Spawn sub-agent for fresh context each turn
  'yolo',                   // High autonomy, enforce all hierarchy
])

/** User communication and governance preferences */
export const UserPreferences = z.object({
  communication_language: z.string().default('en'),
  document_language: z.string().default('en'),
  expert_level: UserExpertLevel.default('intermediate'),
  governance_level: GovernanceLevel.default('standard'),
  operation_mode: OperationMode.default('iterative-interactive'),
})

// Derived types
export type UserExpertLevel = z.infer<typeof UserExpertLevel>
export type GovernanceLevel = z.infer<typeof GovernanceLevel>
export type OperationMode = z.infer<typeof OperationMode>
export type UserPreferences = z.infer<typeof UserPreferences>
