# Session Inspection Export

- ses_id: `ses_2da0f7e8effejz34kHMb1glSpk`
- prepared_at: `2026-03-25T17:00:32.365Z`

## Assistant Output

Here are the complete file contents:

---

### File 1: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/agent-records.ts`

```typescript
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
```

**65 lines total.** Defines Zod schemas for `SkillEntry`, `AgentTemplate`, `AgentBundle`, `PurposeClass`, `TaskClassification`, and `PhaseClassification` with derived TypeScript types.

---

### File 2: `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/schema-kernel/config-records.ts`

```typescript
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
```

**40 lines total.** Defines Zod schemas for `UserExpertLevel`, `GovernanceLevel`, `OperationMode`, and `UserPreferences` with derived TypeScript types.