/**
 * hivemind_hm_init tool — project initialization shell.
 *
 * Placeholder implementation: detects project state and returns a structured
 * plan of proposed changes without writing to .opencode/. Actual bootstrap
 * logic is a future phase.
 */

import { tool } from '@opencode-ai/plugin/tool'

import { success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HmInitToolArgs, HmInitResult } from './types.js'

const s = tool.schema

export function createHivemindHmInitTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Initialize HiveMind for the current project. ' +
      'Detects project state (greenfield/brownfield) and proposes bootstrap actions. ' +
      'Does NOT write without user authorization via context.ask().',
    args: {
      mode: s.enum(['greenfield', 'brownfield', 'auto']).default('auto')
        .describe('Project detection mode'),
      force: s.boolean().default(false)
        .describe('Force re-initialization even if .hivemind/ exists'),
    },
    async execute(args: HmInitToolArgs, _context) {
      const { existsSync } = await import('node:fs')
      const { join } = await import('node:path')

      const hivemindDir = join(projectRoot, '.hivemind')
      const hasHivemind = existsSync(hivemindDir)

      // Resolve effective mode
      let effectiveMode = args.mode
      if (effectiveMode === 'auto') {
        effectiveMode = hasHivemind ? 'brownfield' : 'greenfield'
      }

      const result: HmInitResult = {
        mode: effectiveMode,
        detectedState: hasHivemind ? 'existing-hivemind' : 'fresh-project',
        proposedChanges: [],
        authorizationRequired: true,
      }

      if (effectiveMode === 'greenfield') {
        result.proposedChanges = [
          { action: 'create', target: '.hivemind/', description: 'Create HiveMind runtime directory' },
          { action: 'create', target: '.hivemind/session.json', description: 'Initialize session state' },
          { action: 'create', target: '.hivemind/trajectory/', description: 'Create trajectory directory' },
          { action: 'create', target: '.hivemind/workflow/', description: 'Create workflow directory' },
          { action: 'create', target: '.hivemind/activity/', description: 'Create activity directory' },
        ]
      } else {
        result.proposedChanges = [
          { action: 'scan', target: '.hivemind/', description: 'Scan existing HiveMind state for integrity' },
          { action: 'validate', target: '.hivemind/session.json', description: 'Validate session state schema' },
          { action: 'clean', target: '.hivemind/activity/', description: 'Clean stale activity records' },
        ]
        if (args.force) {
          result.proposedChanges.push({
            action: 'reset',
            target: '.hivemind/',
            description: 'Force reset: remove and recreate .hivemind/ (destructive)',
          })
        }
      }

      return render(success(
        `hm-init: ${effectiveMode} mode — ${result.proposedChanges.length} actions proposed (placeholder, no writes)`,
        result,
      ))
    },
  })
}
