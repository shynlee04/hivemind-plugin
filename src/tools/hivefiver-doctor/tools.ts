/**
 * hivemind_hm_doctor tool — diagnostics shell.
 *
 * Placeholder implementation: runs read-only diagnostics and returns structured
 * findings. When fix=true, proposes changes but does NOT write without
 * user authorization via context.ask(). Actual diagnostic logic is a future phase.
 */

import { tool } from '@opencode-ai/plugin/tool'

import { success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HmDoctorToolArgs, HmDoctorResult, HmDoctorFinding } from './types.js'

const s = tool.schema

export function createHivemindHmDoctorTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Run HiveMind diagnostics to detect configuration drift, broken references, ' +
      'and missing dependencies. Returns structured findings. ' +
      'With fix=true, proposes fixes but requires user authorization before writing.',
    args: {
      scope: s.enum(['all', 'skills', 'agents', 'config', 'paths']).default('all')
        .describe('Diagnostic scope'),
      fix: s.boolean().default(false)
        .describe('Apply fixes (requires user authorization)'),
    },
    async execute(args: HmDoctorToolArgs, _context) {
      const { existsSync } = await import('node:fs')
      const { join } = await import('node:path')

      const findings: HmDoctorFinding[] = []

      // Placeholder diagnostics — read-only checks
      if (args.scope === 'all' || args.scope === 'paths') {
        const hivemindDir = join(projectRoot, '.hivemind')
        if (!existsSync(hivemindDir)) {
          findings.push({
            category: 'paths',
            severity: 'warning',
            message: '.hivemind/ directory does not exist — run hm-init first',
            location: '.hivemind/',
          })
        }
      }

      if (args.scope === 'all' || args.scope === 'config') {
        const opencodeJson = join(projectRoot, 'opencode.json')
        if (!existsSync(opencodeJson)) {
          findings.push({
            category: 'config',
            severity: 'warning',
            message: 'opencode.json not found in project root',
            location: 'opencode.json',
          })
        }
      }

      if (args.scope === 'all' || args.scope === 'skills') {
        const skillsDir = join(projectRoot, '.opencode', 'skills')
        if (!existsSync(skillsDir)) {
          findings.push({
            category: 'skills',
            severity: 'info',
            message: 'No .opencode/skills/ directory — skills may not be installed',
            location: '.opencode/skills/',
          })
        }
      }

      if (args.scope === 'all' || args.scope === 'agents') {
        const agentsDir = join(projectRoot, '.opencode', 'agents')
        if (!existsSync(agentsDir)) {
          findings.push({
            category: 'agents',
            severity: 'info',
            message: 'No .opencode/agents/ directory — agents may not be configured',
            location: '.opencode/agents/',
          })
        }
      }

      const result: HmDoctorResult = {
        scope: args.scope,
        findings,
        proposedFixes: [],
        authorizationRequired: args.fix,
      }

      if (args.fix && findings.length > 0) {
        result.proposedFixes = findings.map(f => ({
          finding: f.message,
          action: 'fix',
          target: f.location ?? 'unknown',
        }))
      }

      const statusMsg = findings.length === 0
        ? 'All checks passed — no issues found'
        : `${findings.length} finding(s) detected`

      return render(success(
        `hm-doctor [${args.scope}]: ${statusMsg} (placeholder, no writes)`,
        result,
      ))
    },
  })
}
