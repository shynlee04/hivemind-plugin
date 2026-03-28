/**
 * Default HiveMind Agent Templates
 *
 * FLAT templates — name and description only.
 * The hivefiver agent configures full runtime properties
 * (permissions, tools, skills, mcp, plugins) at initialization.
 *
 * @module schema-kernel/default-agent-templates
 */

import { type AgentTemplate, AgentTemplate as AgentTemplateSchema } from './agent-records.js'

// ─── Individual Agent Templates ──────────────────────────────────────────────

/** Primary orchestrator. Coordinates work, delegates to subagents, never reads deep. */
export const HIVEMINDER: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hiveminder',
  description:
    'Primary orchestrator. Coordinates work, delegates to subagents, never reads deep.',
  mode: 'primary',
})

/** Framework writer and meta-builder. Bootstrap/doctor/initiator module. */
export const HIVEDFIVER: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hivefiver',
  description:
    'Framework writer and meta-builder. Bootstrap/doctor/initiator module.',
  mode: 'all',
})

/** Debug and remediation specialist. Diagnoses broken systems, proposes fixes. */
export const HIVEHEALER: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hivehealer',
  description:
    'Debug and remediation specialist. Diagnoses broken systems, proposes fixes, verifies recovery.',
  mode: 'subagent',
})

/** Verification specialist. Tests claims, validates requirements, runs evidence-based completion checks. */
export const HIVEQ: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hiveq',
  description:
    'Verification specialist. Tests claims, validates requirements, runs evidence-based completion checks.',
  mode: 'subagent',
})

/** External research specialist. Fetches documentation, ecosystem knowledge, and market evidence. */
export const HIVERD: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hiverd',
  description:
    'External research specialist. Fetches documentation, ecosystem knowledge, and market evidence.',
  mode: 'subagent',
})

/** Codebase investigator. Read-only exploration, pattern discovery, structure mapping. */
export const HIVEXPLORER: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hivexplorer',
  description:
    'Codebase investigator. Read-only exploration, pattern discovery, structure mapping.',
  mode: 'subagent',
})

/** Test infrastructure specialist. Creates test harnesses, writes tests, validates test coverage. */
export const HITEA: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hitea',
  description:
    'Test infrastructure specialist. Creates test harnesses, writes tests, validates test coverage.',
  mode: 'subagent',
})

/** System design authority. Architecture decisions, pattern selection, dependency analysis. */
export const ARCHITECT: AgentTemplate = AgentTemplateSchema.parse({
  name: 'architect',
  description:
    'System design authority. Architecture decisions, pattern selection, dependency analysis.',
  mode: 'subagent',
})

/** Implementation specialist. Executes scoped code changes, file creation, modification. */
export const HIVEMAKER: AgentTemplate = AgentTemplateSchema.parse({
  name: 'hivemaker',
  description:
    'Implementation specialist. Executes scoped code changes, file creation, modification.',
  mode: 'subagent',
})

/** Code quality auditor. Challenges assumptions, exposes anti-patterns, demands evidence. */
export const CODE_SKEPTIC: AgentTemplate = AgentTemplateSchema.parse({
  name: 'code-skeptic',
  description:
    'Code quality auditor. Challenges assumptions, exposes anti-patterns, demands evidence for claims.',
  mode: 'subagent',
})

// ─── Aggregate Export ────────────────────────────────────────────────────────

/** All 10 default HiveMind agent templates. */
export const DEFAULT_AGENT_TEMPLATES: readonly AgentTemplate[] = [
  HIVEMINDER,
  HIVEDFIVER,
  HIVEHEALER,
  HIVEQ,
  HIVERD,
  HIVEXPLORER,
  HITEA,
  ARCHITECT,
  HIVEMAKER,
  CODE_SKEPTIC,
]
