import assert from 'node:assert/strict'
import test from 'node:test'

import type { RuntimeBindingsSnapshot } from '../../../src/features/runtime-entry/attachment.types.js'
import type { RuntimeStatusSnapshot } from '../../../src/sdk-supervisor/runtime-status.js'
import type {
  HmSettingDashboardProof,
  HmSettingDashboardSpec,
} from '../../../src/tools/hivefiver-setting/types.js'

import { buildHmSettingDashboardProof } from '../../../src/tools/hivefiver-setting/dashboard.js'
import { SUPPORTED_LANGUAGE_VALUES } from '../../../src/tools/hivefiver-setting/i18n/index.js'

// ---------------------------------------------------------------------------
// Minimal mock factories
// ---------------------------------------------------------------------------

function createMockSnapshot(): RuntimeBindingsSnapshot {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hiveminder',
    defaultPurposeClass: 'discovery',
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'ri_test',
    serverBaseUrl: undefined,
    preferredUserName: 'Alice',
    governanceMode: 'standard',
    automationLevel: 'guided',
    language: 'vi',
    artifactLanguage: 'en',
    outputStyle: 'concise',
    expertLevel: 'intermediate',
    branchFocus: 'main',
    guardrails: [],
    facilitators: [],
    mcpReadiness: [],
    hivebrainDigest: [],
    entryState: 'ready',
    qaState: 'not-required',
    releaseState: 'released',
    hasRuntimeAttachment: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: false,
    profileComplete: true,
    missingProfileFields: [],
    interactiveBootstrapRequired: false,
    bootstrapProfile: {
      preferredUserName: 'Alice',
      chatLanguage: 'vi',
      artifactLanguage: 'en',
      expertiseLevel: 'intermediate',
      governanceMode: 'standard',
      automationLevel: 'guided',
      outputStyle: 'concise',
    },
    taskIds: [],
    subtaskIds: [],
  }
}

function createMockStatusSnapshot(): RuntimeStatusSnapshot {
  // Minimal mock satisfying only the fields accessed by buildHmSettingDashboardProof:
  //   - recentEvents (array of { summary: string })
  //   - workflowSummary?.gateState
  //   - supervisor.health.overallStatus
  return {
    recentEvents: [
      { eventKind: 'runtime', source: 'test', recordedAt: new Date().toISOString(), summary: 'test-event' },
    ],
    workflowSummary: null,
    supervisor: {
      health: { overallStatus: 'healthy', healthyInstances: 1, degradedInstances: 0, blockedInstances: 0 },
    },
  } as unknown as RuntimeStatusSnapshot
}

function createMockProof(): HmSettingDashboardProof {
  return buildHmSettingDashboardProof({
    mode: 'settings',
    group: 'all',
    sessionId: 'ses_wiring_test',
    snapshot: createMockSnapshot(),
    statusSnapshot: createMockStatusSnapshot(),
    changedFields: ['chatLanguage'],
    impactSummary: ['updated:chatLanguage'],
    nextAction: 'refresh-session-guidance',
    guidance: ['question-gate satisfied'],
    currentSettings: {
      preferredUserName: 'Alice',
      chatLanguage: 'vi',
      artifactLanguage: 'en',
      expertiseLevel: 'intermediate',
      governanceMode: 'standard',
      automationLevel: 'guided',
      outputStyle: 'concise',
    },
  })
}

// ---------------------------------------------------------------------------
// Test 1: buildHmSettingDashboardProof populates supportedLanguages
// ---------------------------------------------------------------------------
test('buildHmSettingDashboardProof populates supportedLanguages from SUPPORTED_LANGUAGE_VALUES', () => {
  const proof = createMockProof()

  assert.ok(proof.supportedLanguages, 'supportedLanguages must be populated (not undefined)')
  assert.ok(Array.isArray(proof.supportedLanguages), 'supportedLanguages must be an array')
  assert.ok(proof.supportedLanguages.length > 0, 'supportedLanguages must not be empty')

  // Must match exactly the SUPPORTED_LANGUAGE_VALUES constant
  assert.deepEqual(
    proof.supportedLanguages,
    SUPPORTED_LANGUAGE_VALUES,
    'supportedLanguages must match SUPPORTED_LANGUAGE_VALUES',
  )
})

// ---------------------------------------------------------------------------
// Test 2: spec from enriched proof has state property with seeds
// ---------------------------------------------------------------------------
test('spec from enriched proof has state property with seeds', () => {
  const proof = createMockProof()
  const spec: HmSettingDashboardSpec | undefined = proof.dashboardSpec

  assert.ok(spec, 'dashboardSpec must be populated on the proof')
  assert.ok(spec.state, 'spec must have a state object')

  // Verify core state seeds exist
  assert.equal(typeof spec.state!['hasChanges'], 'boolean')
  assert.equal(typeof spec.state!['hasGuidance'], 'boolean')
  assert.equal(typeof spec.state!['selectedLanguage'], 'string')
  assert.equal(typeof spec.state!['activeTab'], 'string')
  assert.ok(spec.state!['inputValues'], 'spec.state must have inputValues')
})

// ---------------------------------------------------------------------------
// Test 3: spec state.selectedLanguage matches proof currentSettings language
// ---------------------------------------------------------------------------
test('spec state.selectedLanguage matches proof currentSettings chatLanguage', () => {
  const proof = createMockProof()
  const spec = proof.dashboardSpec!

  assert.equal(
    spec.state!['selectedLanguage'],
    'vi',
    'selectedLanguage must match the proof currentSettings.chatLanguage ("vi")',
  )
})

// ---------------------------------------------------------------------------
// Test 4: proof.supportedLanguages is not undefined (explicit non-null check)
// ---------------------------------------------------------------------------
test('proof.supportedLanguages is a defined array with expected language codes', () => {
  const proof = createMockProof()

  assert.ok(proof.supportedLanguages !== undefined, 'supportedLanguages must not be undefined')
  assert.ok(proof.supportedLanguages!.includes('en'), 'supportedLanguages must include "en"')
  assert.ok(proof.supportedLanguages!.includes('vi'), 'supportedLanguages must include "vi"')
  assert.ok(proof.supportedLanguages!.includes('zh'), 'supportedLanguages must include "zh"')
  assert.ok(proof.supportedLanguages!.includes('ko'), 'supportedLanguages must include "ko"')
  assert.ok(proof.supportedLanguages!.includes('ja'), 'supportedLanguages must include "ja"')
})
