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
import { resolveLanguageSelectorCopy, SUPPORTED_LANGUAGE_VALUES } from './i18n/index.js'
import { buildHmSettingDashboardProof } from './dashboard.js'
import { renderHmSettingTui } from './render.js'
import type {
  HmSettingLanguageFieldDescriptor,
  HmSettingResult,
} from './types.js'
import { loadRuntimeBindingsSnapshot } from '../../features/runtime-entry/snapshot-loader.js'
import { buildRuntimeStatusSnapshot } from '../../sdk-supervisor/runtime-status.js'
import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import { resolveControlPlaneIntakeGate } from '../../features/session-entry/intake.gates.js'

const s = tool.schema

/** Config group names accepted by the tool (union of legacy + new groups) */
const CONFIG_GROUP_NAMES = Object.keys(CONFIG_GROUPS) as ConfigGroupName[]

function createLanguageSelector(
  currentConfig: Record<string, unknown>,
  locale?: string,
): Pick<HmSettingResult, 'localizedMessage' | 'languageSelector'> {
  const { locale: resolvedLocale, copy } = resolveLanguageSelectorCopy(locale)
  const fieldKeys: HmSettingLanguageFieldDescriptor['key'][] = [
    'communication_language',
    'document_language',
  ]
  const fields: HmSettingLanguageFieldDescriptor[] = fieldKeys.map((key) => ({
    key,
    label: copy.fields[key].label,
    description: copy.fields[key].description,
    currentValue: typeof currentConfig[key] === 'string' ? currentConfig[key] : null,
    options: SUPPORTED_LANGUAGE_VALUES.map((value) => ({
      value,
      label: copy.options[value]?.label ?? value,
      nativeLabel: copy.options[value]?.nativeLabel ?? value,
    })),
  }))

  return {
    localizedMessage: copy.localizedMessage,
    languageSelector: {
      locale: resolvedLocale,
      title: copy.title,
      description: copy.description,
      fields,
    },
  }
}

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
      locale: s.string().optional()
        .describe('Optional locale for localized configuration copy'),
      renderMode: s.enum(['json', 'tui'] as const).default('json')
        .describe('Presentation mode for the result payload'),
      dashboard: s.boolean().optional().default(false)
        .describe('When true, returns the 40/60 dashboard layout with runtime mirror (pane40) and settings/guidance UI (pane60)'),
    },
    async execute(args, _context) {
      const renderResponse = (message: string, result: HmSettingResult) => {
        const response = success(message, result)
        return args.renderMode === 'tui' ? renderHmSettingTui(response) : render(response)
      }

      // --- Dashboard mode: return 40/60 layout with runtime mirror + settings guidance ---
      if (args.dashboard) {
        const projectRoot = _context.directory
        const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
        const statusSnapshot = await buildRuntimeStatusSnapshot({
          projectRoot,
          sessionId: _context.sessionID,
          agentId: _context.agent,
          snapshot,
        })
        const primitive = findControlPlanePrimitive('hm-settings')
        const intakeResolution = primitive
          ? resolveControlPlaneIntakeGate(primitive, {
              projectRoot,
              sessionId: _context.sessionID,
              sessionScope: 'main',
              activeAgent: _context.agent,
            }, snapshot)
          : { gate: null }
        const isQuestionGate = !!intakeResolution.gate
        const dashboard = buildHmSettingDashboardProof({
          mode: isQuestionGate ? 'question-gate' : 'settings',
          group: args.group,
          sessionId: _context.sessionID,
          snapshot,
          statusSnapshot,
          changedFields: [],
          impactSummary: [],
          nextAction: isQuestionGate ? 'answer-intake-gate' : 'none',
          guidance: isQuestionGate && intakeResolution.gate
            ? [
                ...intakeResolution.gate.missingGroups.map((g: string) => `group:${g}`),
                ...intakeResolution.gate.missingFields.map((f: string) => `field:${f}`),
              ]
            : ['dashboard-view'],
          currentSettings: {
            preferredUserName: snapshot.preferredUserName ?? null,
            chatLanguage: snapshot.language,
            artifactLanguage: snapshot.artifactLanguage,
            expertiseLevel: snapshot.expertLevel,
            governanceMode: snapshot.governanceMode,
            automationLevel: snapshot.automationLevel,
            outputStyle: snapshot.outputStyle,
          },
        })
        return render(success('hm-setting [dashboard]: 40/60 dashboard layout', { dashboard }))
      }

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
        return renderResponse('hm-setting [all]: showing all config groups', result)
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
          ...(group === 'language' ? createLanguageSelector(groupResult.values ?? {}, args.locale) : {}),
        }
        return renderResponse(`hm-setting [${group}]: showing current config`, result)
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
        ...(group === 'language' ? createLanguageSelector(groupResult.values ?? {}, args.locale) : {}),
      }

      return renderResponse(
        `hm-setting [${group}]: proposed change "${args.key}" = "${args.value}" (requires authorization)`,
        result,
      )
    },
  })
}
