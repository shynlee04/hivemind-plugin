/**
 * Skill Injection Records — Injection rules and configuration
 *
 * @module schema-kernel/skill-injection-records
 */

import { z } from 'zod'

import type { TaskClassification, PhaseClassification } from './agent-records.js'
import { SkillEntry as SkillEntrySchema, PurposeClass as PurposeClassSchema } from './agent-records.js'

/** Conditional skill injection rule for an agent */
export const SkillInjectionRule = z.object({
  agent_id: z.string().min(1),
  phase: z.enum(['project-initiation', 'planning-execution']).optional() as z.ZodType<PhaseClassification>,
  task_classification: z.enum([
    'research', 'implementation', 'debug', 'refactor',
    'codebase-scan', 'tdd', 'spec-driven', 'investigation',
  ]).optional() as z.ZodType<TaskClassification>,
  mandatory_skills: z.array(SkillEntrySchema).min(1),
  high_likelihood_skills: z.array(SkillEntrySchema).default([]),
})

/** Full skill injection configuration with metadata */
export const SkillInjectionConfig = z.object({
  _meta: z.object({
    version: z.string().default('1.0.0'),
    updated_at: z.string().datetime(),
    updated_by: z.string().default('hivefiver'),
    schema: z.literal('skill-injection-config-v1'),
  }),
  shared_skills: z.array(SkillEntrySchema),
  max_skills: z.number().int().min(1).nullable().default(null),
  agent_bundles: z.record(z.string(), z.array(SkillEntrySchema)),
  purpose_conditional: z.record(PurposeClassSchema, z.array(SkillEntrySchema)),
  subsession_additions: z.array(SkillEntrySchema),
  excluded_skill_ids: z.array(z.string()).default([]),
  default_agent: z.string().default('hiveminder'),
})

/** Result of skill validation against a registry */
export const SkillValidationResult = z.object({
  valid: z.boolean(),
  missing_skills: z.array(z.string()),
  warnings: z.array(z.string()),
})

// Derived types
export type SkillInjectionRule = z.infer<typeof SkillInjectionRule>
export type SkillInjectionConfig = z.infer<typeof SkillInjectionConfig>
export type SkillValidationResult = z.infer<typeof SkillValidationResult>
