import React from 'react'
import { defineCatalog } from '@json-render/core'
import { createRenderer, standardComponents } from '@json-render/ink'
import { standardActionDefinitions, standardComponentDefinitions } from '@json-render/ink/catalog'
import { schema } from '@json-render/ink/schema'
import { renderToString } from 'ink'

import type { ToolResponse } from '../../shared/tool-response.js'
import type {
  HmSettingDashboardProof,
  HmSettingLanguageFieldDescriptor,
  HmSettingResult,
} from './types.js'

const catalog = defineCatalog(schema, {
  components: standardComponentDefinitions,
  actions: standardActionDefinitions,
})

const InkRenderer = createRenderer(catalog, standardComponents as never)

function formatCurrentConfig(currentConfig: Record<string, unknown>): string {
  const entries = Object.entries(currentConfig)

  if (entries.length === 0) {
    return '- none'
  }

  return entries
    .map(([key, value]) => `- ${key}: ${String(value)}`)
    .join('\n')
}

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

function formatDashboardSection(title: string, lines: string[]): string {
  return [
    `## ${title}`,
    ...lines,
  ].join('\n')
}

function formatDashboardBody(dashboard: HmSettingDashboardProof): string {
  const pane40Lines = [
    `- sessionId: ${dashboard.pane40.sessionId}`,
    `- runtimeAuthority: ${dashboard.pane40.runtimeAuthority}`,
    `- attachmentMode: ${dashboard.pane40.attachmentMode}`,
    `- workflowId: ${dashboard.pane40.workflowId ?? 'none'}`,
    `- trajectoryId: ${dashboard.pane40.trajectoryId ?? 'none'}`,
    `- gateSummary: ${dashboard.pane40.gateSummary}`,
    `- healthSummary: ${dashboard.pane40.healthSummary}`,
    '- recentEvents:',
    ...(dashboard.pane40.recentEvents.length > 0
      ? dashboard.pane40.recentEvents.map((event) => `  - ${event}`)
      : ['  - none']),
  ]
  const pane60Lines = [
    `- group: ${dashboard.pane60.group}`,
    `- changedFields: ${dashboard.pane60.changedFields.join(', ') || 'none'}`,
    `- impactSummary: ${dashboard.pane60.impactSummary.join(', ') || 'none'}`,
    `- nextAction: ${dashboard.pane60.nextAction}`,
    '- currentSettings:',
    ...(Object.entries(dashboard.pane60.currentSettings).length > 0
      ? Object.entries(dashboard.pane60.currentSettings).map(([key, value]) => `  - ${key}: ${String(value)}`)
      : ['  - none']),
    '- guidance:',
    ...(dashboard.pane60.guidance.length > 0
      ? dashboard.pane60.guidance.map((entry) => `  - ${entry}`)
      : ['  - none']),
  ]

  return [
    `# Proof mode\n${dashboard.mode}`,
    formatDashboardSection(dashboard.pane40.title, pane40Lines),
    formatDashboardSection(dashboard.pane60.title, pane60Lines),
  ].join('\n\n')
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

export function renderHmSettingDashboardTui(dashboard: HmSettingDashboardProof): string {
  return [
    'Hivefiver settings dashboard proof',
    `hm-settings dashboard mode: ${dashboard.mode}`,
    formatDashboardBody(dashboard),
  ].join('\n\n')
}
