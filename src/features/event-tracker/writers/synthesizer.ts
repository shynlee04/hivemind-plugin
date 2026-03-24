/**
 * Synthesizer — per-session synthesis markdown generation.
 *
 * Produces structured synthesis artifacts summarizing turn structure,
 * delegation chains, key findings, and compaction events.
 *
 * @module event-tracker/writers/synthesizer
 */

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

import type {
  SynthesisInput,
  SynthesisTurnSummary,
  SynthesisDelegationEntry,
  SynthesisEventEntry,
} from '../types.js'
import { getSessionSynthesisPath } from '../paths.js'

// ---------------------------------------------------------------------------
// Section Renderers
// ---------------------------------------------------------------------------

/**
 * Renders the identity header block for a session synthesis.
 * @param input - Synthesis input with session metadata.
 * @returns Markdown identity section.
 */
export function renderSynthesisHeader(input: SynthesisInput): string {
  return `# Session Synthesis: ${input.sessionId}

## Identity

- **Lineage**: ${input.lineage}
- **Purpose**: ${input.purposeClass}
- **Agent**: ${input.agent}
- **Status**: ${input.status}
- **Created**: ${input.created}
- **Updated**: ${input.updated}`
}

/**
 * Renders the turn summary table.
 * @param turns - Array of turn summaries.
 * @returns Markdown table or empty-state message.
 */
export function renderTurnSummaryTable(turns: SynthesisTurnSummary[]): string {
  if (turns.length === 0) {
    return '## Turn Summary\n\nNo turns recorded.'
  }

  const header = '| # | Agent | Model | Duration | Delegations | Preview |'
  const separator = '|---|-------|-------|----------|-------------|---------|'
  const rows = turns.map((t) => {
    const duration = t.duration !== null ? String(t.duration) : 'N/A'
    const preview = t.userMessagePreview || '—'
    return `| ${t.turnNumber} | ${t.agent} | ${t.model} | ${duration} | ${t.delegationCount} | ${preview} |`
  })

  return `## Turn Summary\n\n${header}\n${separator}\n${rows.join('\n')}`
}

/**
 * Renders the delegation chain section.
 * @param delegations - Array of delegation entries.
 * @returns Markdown delegation list or empty-state message.
 */
export function renderDelegationChain(delegations: SynthesisDelegationEntry[]): string {
  if (delegations.length === 0) {
    return '## Delegation Chain\n\nNo delegations.'
  }

  const lines = delegations.map((d) =>
    `- **${d.delegatedTo}** — ${d.description} (subagent: ${d.subagentType}) [${d.status}]`
  )

  return `## Delegation Chain\n\n${lines.join('\n')}`
}

/**
 * Renders the key findings section from high-importance events.
 * @param events - Array of event entries.
 * @returns Markdown findings list or empty-state message.
 */
export function renderKeyFindings(events: SynthesisEventEntry[]): string {
  if (events.length === 0) {
    return '## Key Findings\n\nNo high-importance events.'
  }

  const lines = events.map((e) =>
    `- Turn ${e.turnNumber}: ${e.type} — ${e.summary}`
  )

  return `## Key Findings\n\n${lines.join('\n')}`
}

/**
 * Renders the compaction events section.
 * @param count - Number of compaction events.
 * @returns Markdown compaction section.
 */
function renderCompactionSection(count: number): string {
  return `## Compaction Events\n\n- ${count} compaction(s) recorded`
}

// ---------------------------------------------------------------------------
// Full Synthesis Composer
// ---------------------------------------------------------------------------

/**
 * Composes a complete session synthesis markdown document from all sections.
 * @param input - Full synthesis input.
 * @returns Complete synthesis markdown string.
 */
export function renderSynthesis(input: SynthesisInput): string {
  const header = renderSynthesisHeader(input)
  const turnTable = renderTurnSummaryTable(input.turns)
  const delegationChain = renderDelegationChain(input.delegations)
  const keyFindings = renderKeyFindings(input.highImportanceEvents)
  const compaction = renderCompactionSection(input.compactionCount)

  return [header, turnTable, delegationChain, keyFindings, compaction].join('\n\n')
}

// ---------------------------------------------------------------------------
// I/O Function
// ---------------------------------------------------------------------------

/**
 * Writes a session synthesis markdown artifact to disk.
 * Creates session directory if missing.
 * @param projectRoot - Absolute project root path.
 * @param input - Synthesis input with session data.
 */
export async function generateSessionSynthesis(
  projectRoot: string,
  input: SynthesisInput
): Promise<void> {
  const synthPath = getSessionSynthesisPath(projectRoot, input.sessionId)
  const dir = path.dirname(synthPath)
  await mkdir(dir, { recursive: true })
  const content = renderSynthesis(input)
  await writeFile(synthPath, content, 'utf8')
}
