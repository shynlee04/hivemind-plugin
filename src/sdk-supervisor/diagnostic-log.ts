/**
 * Diagnostic Log — Writes diagnostic summaries to .hivemind/error-log/
 * after each agent completes its flow (assistant message sent).
 *
 * @deprecated Use session journal handlers (text-complete-handler, compaction-handler) instead.
 * This module will be removed in Plan #11 after verification window.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getHivemindPath } from '../shared/paths.js'

export interface DiagnosticLogEntry {
  sessionId: string
  timestamp: string
  assistantText: string
  purpose?: string
  sessionState?: string
  trajectory?: string
  workflow?: string
  agent?: string
  // Injection payload from messages.transform
  injection?: {
    purposeClass: string
    sessionState: string
    agent: string
    variant: string
    sessionRole: string
    skillBundle: { name: string; description: string }[]
    skillFocusBlock: string
    turnHierarchyBlock: string
    contextBlock: string
    routeHintBlock?: string
  }
}

function renderDiagnosticEntry(entry: DiagnosticLogEntry): string {
  const lines: string[] = [
    '---',
    `session_id: ${entry.sessionId}`,
    `timestamp: ${entry.timestamp}`,
    `purpose: ${entry.purpose ?? 'unknown'}`,
    `session_state: ${entry.sessionState ?? 'unknown'}`,
    `trajectory: ${entry.trajectory ?? 'none'}`,
    `workflow: ${entry.workflow ?? 'none'}`,
    `agent: ${entry.agent ?? 'unknown'}`,
    `---`,
    '',
  ]

  // Injection payload section
  if (entry.injection) {
    lines.push('## Injection Payload (from messages.transform)')
    lines.push('')
    lines.push(`- purpose_class: ${entry.injection.purposeClass}`)
    lines.push(`- session_state: ${entry.injection.sessionState}`)
    lines.push(`- agent: ${entry.injection.agent}`)
    lines.push(`- variant: ${entry.injection.variant}`)
    lines.push(`- session_role: ${entry.injection.sessionRole}`)
    lines.push('')
    lines.push('### Skill Bundle')
    for (const skill of entry.injection.skillBundle) {
      lines.push(`- ${skill.name}: ${skill.description}`)
    }
    lines.push('')
    lines.push('### Skill Focus Block')
    lines.push(entry.injection.skillFocusBlock || '(none)')
    lines.push('')
    lines.push('### Turn Hierarchy Block')
    lines.push(entry.injection.turnHierarchyBlock || '(none)')
    lines.push('')
    lines.push('### Context Block')
    lines.push(entry.injection.contextBlock || '(none)')
    if (entry.injection.routeHintBlock) {
      lines.push('')
      lines.push('### Route Hint Block')
      lines.push(entry.injection.routeHintBlock)
    }
    lines.push('')
  }

  lines.push('## Assistant Output')
  lines.push('')
  lines.push(entry.assistantText.slice(0, 5000))
  lines.push('')

  return lines.join('\n')
}

/**
 * Write a diagnostic log entry to .hivemind/error-log/
 * Each entry is named by session and timestamp for easy inspection.
 */
export async function writeDiagnosticLog(
  projectRoot: string,
  entry: DiagnosticLogEntry,
): Promise<string> {
  const errorLogDir = path.join(getHivemindPath(projectRoot), 'error-log')
  await fs.mkdir(errorLogDir, { recursive: true })

  const filename = `${entry.sessionId}-${Date.now()}.md`
  const filePath = path.join(errorLogDir, filename)

  await fs.writeFile(filePath, renderDiagnosticEntry(entry))
  return filePath
}
