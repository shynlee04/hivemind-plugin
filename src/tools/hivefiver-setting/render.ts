import React from 'react'
import { defineCatalog } from '@json-render/core'
import { createRenderer, standardComponents } from '@json-render/ink'
import { standardActionDefinitions, standardComponentDefinitions } from '@json-render/ink/catalog'
import { schema } from '@json-render/ink/schema'
import { renderToString } from 'ink'

import type { ToolResponse } from '../../shared/tool-response.js'
import type {
  HmSettingDashboardPane40,
  HmSettingDashboardPane60,
  HmSettingDashboardTuiRenderInput,
  HmSettingLanguageFieldDescriptor,
  HmSettingResult,
} from './types.js'

const catalog = defineCatalog(schema, {
  components: standardComponentDefinitions,
  actions: standardActionDefinitions,
})

const InkRenderer = createRenderer(catalog, standardComponents as never)

/**
 * @deprecated Will be replaced by json-render spec constructors.
 * Use json-render `Spec` constructors for the composition instead.
 Pending TDD phase for remove this function.
 */
function formatCurrentConfig(currentConfig: Record<string, unknown>): string {
  const entries = Object.entries(currentConfig)

  if (entries.length === 0) {
    return '- none'
  }

  return entries
    .map(([key, value]) => `- ${key}: ${String(value)}`)
    .join('\n')
}

/**
 * Format a language field descriptor for markdown text.
 *
 * @deprecated Will be replaced by json-render spec constructors in TDD phase.
 *   - Use `jsonRender` spec constructors from define structured rendering.
 *   - Replace this function with `LanguageField` component from the json-render catalog.
 *
 * @param field - Language field descriptor
 * @returns Formatted string
 */
function formatLanguageField(field: HmSettingLanguageFieldDescriptor): string {
  const options = field.options
    .map((option) => `${option.value} (${option.nativeLabel})`)
    .join(', ')

  return [
    `### ${field.label}`,
    field.description,
    `Current: ${field.currentValue ?? 'unset'}`,
    `Options: ${options}`,
  ].join('\n')
}

function formatBody(result: HmSettingResult): string {
  const sections = [
    `## Group\n${result.group}`,
    `## Current config\n${formatCurrentConfig(result.currentConfig)}`,
  ]

  if (result.localizedMessage) {
    sections.push(`## Summary\n${result.localizedMessage}`)
  }

  if (result.proposedChange) {
    sections.push([
      '## Proposed change',
      `- key: ${result.proposedChange.key}`,
      `- current: ${String(result.proposedChange.currentValue)}`,
      `- next: ${result.proposedChange.value}`,
      `- authorization required: ${String(result.authorizationRequired)}`,
    ].join('\n'))
  }

  if (result.languageSelector) {
    sections.push([
      `## ${result.languageSelector.title}`,
      result.languageSelector.description,
      ...result.languageSelector.fields.map(formatLanguageField),
    ].join('\n\n'))
  }

  return sections.join('\n\n')
}

function buildPane40Markdown(pane40: HmSettingDashboardPane40): string {
  return [
    `- sessionId: ${pane40.sessionId}`,
    `- runtimeAuthority: ${pane40.runtimeAuthority}`,
    `- attachmentMode: ${pane40.attachmentMode}`,
    `- workflowId: ${pane40.workflowId ?? 'none'}`,
    `- trajectoryId: ${pane40.trajectoryId ?? 'none'}`,
    `- gateSummary: ${pane40.gateSummary}`,
    `- healthSummary: ${pane40.healthSummary}`,
    `- recentEvents: ${pane40.recentEvents.length > 0 ? pane40.recentEvents.join(', ') : 'none'}`,
  ].join('\n')
}

function buildPane60Markdown(pane60: HmSettingDashboardPane60): string {
  const settingsEntries = Object.entries(pane60.currentSettings)
  return [
    `- group: ${pane60.group}`,
    `- changedFields: ${pane60.changedFields.join(', ') || 'none'}`,
    `- impactSummary: ${pane60.impactSummary.join(', ') || 'none'}`,
    `- nextAction: ${pane60.nextAction}`,
    `- currentSettings: ${settingsEntries.length > 0 ? settingsEntries.map(([key, value]) => `${key}: ${String(value)}`).join(', ') : 'none'}`,
    `- guidance: ${pane60.guidance.length > 0 ? pane60.guidance.join(', ') : 'none'}`,
  ].join('\n')
}

export function renderHmSettingTui(response: ToolResponse<HmSettingResult>): string {
  const spec = {
    root: 'app',
    elements: {
      app: {
        type: 'Box',
        props: {
          flexDirection: 'column',
          padding: 1,
        },
        children: ['title', 'message', 'body'],
      },
      title: {
        type: 'Heading',
        props: {
          text: 'Hivefiver settings',
          level: 'h1',
          color: response.status === 'success' ? 'green' : 'red',
        },
        children: [],
      },
      message: {
        type: 'StatusLine',
        props: {
          text: response.message,
          status: response.status === 'success' ? 'success' : 'error',
        },
        children: [],
      },
      body: {
        type: 'Markdown',
        props: {
          text: response.data ? formatBody(response.data) : 'No hm-setting payload available.',
        },
        children: [],
      },
    },
  }

  return renderToString(React.createElement(InkRenderer, { spec, state: {} })).trimEnd()
}

export function renderHmSettingDashboardTui(dashboard: HmSettingDashboardTuiRenderInput): string {
  const spec = {
    root: 'app',
    elements: {
      app: {
        type: 'Box',
        props: { flexDirection: 'column', padding: 1 },
        children: ['title', 'modeLine', 'content'],
      },
      title: {
        type: 'Heading',
        props: { text: 'Hivefiver settings dashboard proof', level: 'h1' },
        children: [],
      },
      modeLine: {
        type: 'StatusLine',
        props: { text: `hm-settings dashboard mode: ${dashboard.mode}`, status: 'info' as const },
        children: [],
      },
      content: {
        type: 'Box',
        props: { flexDirection: 'row' },
        children: ['pane40', 'pane60'],
      },
      pane40: {
        type: 'Card',
        props: { title: dashboard.pane40.title },
        children: ['pane40Body'],
      },
      pane40Body: {
        type: 'Markdown',
        props: { text: buildPane40Markdown(dashboard.pane40) },
        children: [],
      },
      pane60: {
        type: 'Card',
        props: { title: dashboard.pane60.title },
        children: ['pane60Body'],
      },
      pane60Body: {
        type: 'Markdown',
        props: { text: buildPane60Markdown(dashboard.pane60) },
        children: [],
      },
    },
  }

  return renderToString(React.createElement(InkRenderer, { spec, state: {} })).trimEnd()
}
