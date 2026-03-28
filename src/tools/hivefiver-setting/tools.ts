/**
 * hivemind_hm_setting tool — configuration management shell.
 *
 * Reads current config group values and returns proposed changes.
 * Does NOT write to .opencode/ without user authorization via context.ask().
 */

import { tool } from '@opencode-ai/plugin/tool'

import { success, error as toolError } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import {
  CONFIG_GROUPS,
  getConfigGroup,
  validateConfigUpdate,
} from '../../shared/config-groups.js'
import type { ConfigGroupName } from '../../shared/config-groups.js'
import type { HmSettingResult } from './types.js'

const s = tool.schema

/** Config group names accepted by the tool (union of legacy + new groups) */
const CONFIG_GROUP_NAMES = Object.keys(CONFIG_GROUPS) as ConfigGroupName[]

export function createHivemindHmSettingTool(_projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Read and propose changes to HiveMind configuration groups. ' +
      'Covers language, expertise, governance, and operation-mode. ' +
      'Does NOT write without user authorization via context.ask().',
    args: {
      group: s.enum([
        'language',
        'expertise',
        'governance',
        'operation-mode',
        'all',
      ] as const).default('all')
        .describe('Configuration group to manage'),
      key: s.string().optional()
        .describe('Specific key within group'),
      value: s.string().optional()
        .describe('New value for the key'),
    },
    async execute(args, _context) {
      // --- Show all groups ---
      if (args.group === 'all') {
        const allGroups: Record<string, Record<string, unknown>> = {}
        for (const name of CONFIG_GROUP_NAMES) {
          const groupResult = getConfigGroup(name)
          if (groupResult.status === 'success') {
            allGroups[name] = groupResult.values ?? {}
          }
        }

        const result: HmSettingResult = {
          group: args.group,
          currentConfig: allGroups,
          proposedChange: null,
          authorizationRequired: false,
          written: false,
        }
        return render(success('hm-setting [all]: showing all config groups', result))
      }

      // --- Validate group name ---
      const group = args.group as ConfigGroupName
      if (!CONFIG_GROUPS[group]) {
        return render(toolError(`Unknown config group: "${args.group}"`))
      }

      // --- Show current group values ---
      if (!args.key || !args.value) {
        const groupResult = getConfigGroup(group)
        if (groupResult.status === 'error') {
          return render(toolError(groupResult.error!))
        }

        const result: HmSettingResult = {
          group: args.group,
          currentConfig: groupResult.values ?? {},
          proposedChange: null,
          authorizationRequired: false,
          written: false,
        }
        return render(success(`hm-setting [${group}]: showing current config`, result))
      }

      // --- Validate and propose change ---
      const validation = validateConfigUpdate(group, args.key, args.value)
      if (validation.status === 'error') {
        return render(toolError(`hm-setting [${group}]: ${validation.error}`))
      }

      const groupResult = getConfigGroup(group)
      const currentValue = groupResult.values?.[args.key]

      const result: HmSettingResult = {
        group: args.group,
        currentConfig: groupResult.values ?? {},
        proposedChange: {
          group: args.group,
          key: args.key,
          currentValue,
          value: args.value,
        },
        authorizationRequired: true,
        written: false,
      }

      return render(success(
        `hm-setting [${group}]: proposed change "${args.key}" = "${args.value}" (requires authorization)`,
        result,
      ))
    },
  })
}
