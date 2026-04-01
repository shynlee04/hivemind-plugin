import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RuntimeStatusSnapshot } from '../../sdk-supervisor/runtime-status.js'
import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'

import { SUPPORTED_LANGUAGE_VALUES } from './i18n/index.js'
import { renderHmSettingDashboardTui } from './render.js'
import { buildHmSettingDashboardSpec } from './spec-builder.js'
import type { HmSettingDashboardProof, HmSettingGroup } from './types.js'

interface BuildHmSettingDashboardProofInput {
  mode: HmSettingDashboardProof['mode']
  group: HmSettingGroup
  sessionId: string
  snapshot: RuntimeBindingsSnapshot
  statusSnapshot: RuntimeStatusSnapshot
  changedFields: string[]
  impactSummary: string[]
  nextAction: string
  guidance: string[]
  currentSettings: Record<string, unknown>
}

function summarizeRecentEvents(statusSnapshot: RuntimeStatusSnapshot): string[] {
  return statusSnapshot.recentEvents.map((event) => event.summary)
}

export function buildHmSettingDashboardProof(
  input: BuildHmSettingDashboardProofInput,
): HmSettingDashboardProof {
  const dashboard: HmSettingDashboardProof = {
    mode: input.mode,
    pane40: {
      title: '40 pane · runtime/session mirror',
      sessionId: input.sessionId,
      runtimeAuthority: input.snapshot.runtimeAuthority,
      attachmentMode: input.snapshot.attachmentMode,
      workflowId: input.snapshot.workflowId,
      trajectoryId: input.snapshot.trajectoryId,
      gateSummary: input.mode === 'question-gate'
        ? 'intake-required'
        : input.statusSnapshot.workflowSummary?.gateState ?? 'ready',
      healthSummary: input.statusSnapshot.supervisor.health.overallStatus,
      recentEvents: summarizeRecentEvents(input.statusSnapshot),
    },
    pane60: {
      title: '60 pane · Hivefiver settings',
      group: input.group,
      changedFields: input.changedFields,
      impactSummary: input.impactSummary,
      nextAction: input.nextAction,
      guidance: input.guidance,
      currentSettings: input.currentSettings,
    },
  }

  dashboard.dashboardSpec = buildHmSettingDashboardSpec(dashboard)
  dashboard.rendered = renderHmSettingDashboardTui(dashboard)
  dashboard.supportedLanguages = SUPPORTED_LANGUAGE_VALUES

  // Write dashboardSpec to disk so the side-car API can serve it
  const stateDir = join(process.cwd(), '.hivemind', 'activity', 'state')
  mkdirSync(stateDir, { recursive: true })
  writeFileSync(join(stateDir, 'dashboard-spec.json'), JSON.stringify(dashboard.dashboardSpec, null, 2))

  return dashboard
}
