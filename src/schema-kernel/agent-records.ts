/**
 * Agent Records — Agent template and bundle definitions
 *
 * @module schema-kernel/agent-records
 */

import { z } from 'zod'

/** A single skill entry with name and description */
export const SkillEntry = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

/** Agent template for creation and configuration */
export const AgentTemplate = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  mode: z.enum(['primary', 'subagent', 'all']).default('all'),
  model: z.string().optional(),
  permission: z.record(z.string(), z.unknown()).optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
})

/** Agent skill bundle — max 3 skills per agent */
export const AgentBundle = z.object({
  agent_id: z.string().min(1),
  skills: z.array(SkillEntry).max(3),
})

/** Trajectory purpose classification */
export const PurposeClass = z.enum([
  'tdd',
  'research',
  'planning',
  'implementation',
  'course-correction',
  'gatekeeping',
])

/** Task type classification */
export const TaskClassification = z.enum([
  'research',
  'implementation',
  'debug',
  'refactor',
  'codebase-scan',
  'tdd',
  'spec-driven',
  'investigation',
])

/** Phase tier classification */
export const PhaseClassification = z.enum([
  'project-initiation',  // Tier 1: greenfield/brownfield, core docs
  'planning-execution',  // Tier 2: phase and atomic planning
])

// Derived types
export type SkillEntry = z.infer<typeof SkillEntry>
export type AgentTemplate = z.infer<typeof AgentTemplate>
export type AgentBundle = z.infer<typeof AgentBundle>
export type PurposeClass = z.infer<typeof PurposeClass>
export type TaskClassification = z.infer<typeof TaskClassification>
export type PhaseClassification = z.infer<typeof PhaseClassification>
