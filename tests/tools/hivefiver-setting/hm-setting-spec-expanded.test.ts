/**
 * @file hm-setting-spec-expanded.test.ts
 * TDD RED tests for spec-builder expansion with Select, Tabs, Input, Button.
 *
 * These tests verify that buildHmSettingDashboardSpec produces interactive
 * elements using the newly registered components (Select, Tabs, Input, Button).
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  HmSettingDashboardProof,
  HmSettingDashboardSpec,
  HmSettingDashboardSpecElement,
} from '../../../src/tools/hivefiver-setting/types.js'
import { buildHmSettingDashboardSpec } from '../../../src/tools/hivefiver-setting/spec-builder.js'

/**
 * Mock proof with all fields needed for expanded spec.
 * Includes supportedLanguages for the language selector.
 */
function createMockProof(): HmSettingDashboardProof {
  return {
    mode: 'settings',
    supportedLanguages: ['en', 'vi', 'zh', 'ko', 'ja'],
    pane40: {
      title: '40 pane · runtime/session mirror',
      sessionId: 'ses_expanded',
      runtimeAuthority: 'attached-sdk',
      attachmentMode: 'local-worktree',
      workflowId: 'wf_expanded',
      trajectoryId: 'trj_expanded',
      gateSummary: 'ready',
      healthSummary: 'healthy',
      recentEvents: ['workflow-ready', 'runtime attached'],
    },
    pane60: {
      title: '60 pane · Hivefiver settings',
      group: 'all',
      changedFields: ['chatLanguage'],
      impactSummary: ['updated:chatLanguage'],
      nextAction: 'refresh-session-guidance',
      guidance: ['question-gate satisfied'],
      currentSettings: {
        preferredUserName: 'Taylor',
        chatLanguage: 'vi',
        artifactLanguage: 'en',
        expertiseLevel: 'intermediate',
        governanceMode: 'standard',
        automationLevel: 'iterative-interactive',
        outputStyle: 'balanced',
      },
    },
  }
}

/** Find a single element of a given type in spec */
function findElementByType(
  spec: HmSettingDashboardSpec,
  type: string,
): HmSettingDashboardSpecElement | undefined {
  return Object.values(spec.elements).find((el) => el.type === type)
}

/** Find all elements of a given type in spec */
function findElementsByType(
  spec: HmSettingDashboardSpec,
  type: string,
): HmSettingDashboardSpecElement[] {
  return Object.values(spec.elements).filter((el) => el.type === type)
}

/** Collect all element IDs in spec */
function allElementIds(spec: HmSettingDashboardSpec): string[] {
  return Object.keys(spec.elements)
}

// ---------------------------------------------------------------------------
// Test 1: Spec contains a Select element for language with options
// ---------------------------------------------------------------------------
test('spec contains a Select element for language with options from supportedLanguages', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const selects = findElementsByType(spec, 'Select')
  const langSelect = selects.find(
    (el) => el.props.name === 'chatLanguage' || el.props.name === 'language',
  )
  assert.ok(langSelect, 'spec must contain a Select for language')
})

// ---------------------------------------------------------------------------
// Test 2: Select has correct options matching supportedLanguages
// ---------------------------------------------------------------------------
test('language Select has options matching proof.supportedLanguages', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const selects = findElementsByType(spec, 'Select')
  const langSelect = selects.find(
    (el) => el.props.name === 'chatLanguage' || el.props.name === 'language',
  )
  assert.ok(langSelect)

  const options = langSelect!.props.options as string[]
  assert.ok(Array.isArray(options), 'Select options must be an array')
  assert.deepEqual(options, ['en', 'vi', 'zh', 'ko', 'ja'])
})

// ---------------------------------------------------------------------------
// Test 3: Select uses correct required props (label, name, options)
// ---------------------------------------------------------------------------
test('language Select uses correct required props: label, name, options as string[]', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const selects = findElementsByType(spec, 'Select')
  const langSelect = selects.find(
    (el) => el.props.name === 'chatLanguage' || el.props.name === 'language',
  )
  assert.ok(langSelect)

  // Required props per ground truth
  assert.equal(typeof langSelect!.props.label, 'string')
  assert.ok(langSelect!.props.label.length > 0, 'label must be non-empty')
  assert.equal(typeof langSelect!.props.name, 'string')
  assert.ok((langSelect!.props.name as string).length > 0, 'name must be non-empty')
  assert.ok(Array.isArray(langSelect!.props.options), 'options must be an array')
  for (const opt of langSelect!.props.options as string[]) {
    assert.equal(typeof opt, 'string', 'each option must be a string')
  }
})

// ---------------------------------------------------------------------------
// Test 4: Spec contains a Tabs element with settings groups
// ---------------------------------------------------------------------------
test('spec contains a Tabs element with settings group tabs (identity, expertise, governance)', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const tabs = findElementByType(spec, 'Tabs')
  assert.ok(tabs, 'spec must contain a Tabs element')

  const tabItems = tabs!.props.tabs as Array<{ label: string; value: string }>
  assert.ok(Array.isArray(tabItems), 'Tabs must have tabs array')

  const tabValues = tabItems.map((t) => t.value)
  assert.ok(tabValues.includes('identity'), 'tabs must include identity group')
  assert.ok(tabValues.includes('expertise'), 'tabs must include expertise group')
  assert.ok(tabValues.includes('governance'), 'tabs must include governance group')
})

// ---------------------------------------------------------------------------
// Test 5: Tabs uses correct props format
// ---------------------------------------------------------------------------
test('Tabs uses correct props: tabs as [{label: string, value: string}]', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const tabs = findElementByType(spec, 'Tabs')
  assert.ok(tabs)

  const tabItems = tabs!.props.tabs as Array<{ label: string; value: string }>
  assert.ok(Array.isArray(tabItems))
  for (const tab of tabItems) {
    assert.equal(typeof tab.label, 'string', 'each tab must have string label')
    assert.equal(typeof tab.value, 'string', 'each tab must have string value')
    assert.ok(tab.label.length > 0, 'tab label must be non-empty')
    assert.ok(tab.value.length > 0, 'tab value must be non-empty')
  }
})

// ---------------------------------------------------------------------------
// Test 6: Spec contains Input elements for editable text fields
// ---------------------------------------------------------------------------
test('spec contains Input elements for editable text fields (preferredUserName)', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const inputs = findElementsByType(spec, 'Input')
  const nameInput = inputs.find((el) => el.props.name === 'preferredUserName')
  assert.ok(nameInput, 'spec must contain an Input for preferredUserName')
})

// ---------------------------------------------------------------------------
// Test 7: Input uses correct props (label, name, optional type)
// ---------------------------------------------------------------------------
test('Input uses correct required props: label, name, and optional type', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const inputs = findElementsByType(spec, 'Input')
  assert.ok(inputs.length > 0, 'spec must contain at least one Input')

  const nameInput = inputs.find((el) => el.props.name === 'preferredUserName')
  assert.ok(nameInput)

  // Required props per ground truth
  assert.equal(typeof nameInput!.props.label, 'string')
  assert.ok((nameInput!.props.label as string).length > 0)
  assert.equal(typeof nameInput!.props.name, 'string')
  assert.equal(nameInput!.props.name, 'preferredUserName')

  // Optional: type can be null or one of "number"|"text"|"email"|"password"
  if (nameInput!.props.type !== null && nameInput!.props.type !== undefined) {
    const allowedTypes = ['number', 'text', 'email', 'password']
    assert.ok(
      allowedTypes.includes(nameInput!.props.type as string),
      `Input type must be one of ${allowedTypes.join(',')}`,
    )
  }
})

// ---------------------------------------------------------------------------
// Test 8: Spec contains Button elements for actions (Save, Reset)
// ---------------------------------------------------------------------------
test('spec contains Button elements for actions (Save, Reset)', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const buttons = findElementsByType(spec, 'Button')
  assert.ok(buttons.length >= 2, 'spec must contain at least 2 Buttons (Save, Reset)')

  const labels = buttons.map((b) => b.props.label as string)
  assert.ok(labels.some((l) => /save/i.test(l)), 'must have a Save button')
  assert.ok(labels.some((l) => /reset/i.test(l)), 'must have a Reset button')
})

// ---------------------------------------------------------------------------
// Test 9: Button uses correct props (label, optional variant)
// ---------------------------------------------------------------------------
test('Button uses correct required props: label, and optional variant', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const buttons = findElementsByType(spec, 'Button')
  assert.ok(buttons.length > 0)

  for (const btn of buttons) {
    assert.equal(typeof btn.props.label, 'string', 'Button must have string label')
    assert.ok((btn.props.label as string).length > 0, 'Button label must be non-empty')

    // Optional: variant must be null or one of "secondary"|"primary"|"danger"
    if (btn.props.variant !== null && btn.props.variant !== undefined) {
      const allowedVariants = ['secondary', 'primary', 'danger']
      assert.ok(
        allowedVariants.includes(btn.props.variant as string),
        `Button variant must be one of ${allowedVariants.join(',')}`,
      )
    }
  }
})

// ---------------------------------------------------------------------------
// Test 10: All element IDs are unique
// ---------------------------------------------------------------------------
test('all element IDs in the spec are unique', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const ids = allElementIds(spec)
  const uniqueIds = new Set(ids)
  assert.equal(ids.length, uniqueIds.size, 'all element IDs must be unique')
})

// ---------------------------------------------------------------------------
// Test 11: State includes seeds for interactive components
// ---------------------------------------------------------------------------
test('state includes seeds for interactive components (selectedLanguage, activeTab, inputValues)', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  assert.ok(spec.state, 'spec must have state object')
  assert.ok('selectedLanguage' in spec.state!, 'state must have selectedLanguage seed')
  assert.ok('activeTab' in spec.state!, 'state must have activeTab seed')
  assert.ok('inputValues' in spec.state!, 'state must have inputValues seed')
})

// ---------------------------------------------------------------------------
// Test 12: State seeds have correct initial values from proof
// ---------------------------------------------------------------------------
test('state seeds have correct initial values derived from proof data', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  // selectedLanguage should match currentSettings.chatLanguage
  assert.equal(
    spec.state!['selectedLanguage'],
    proof.pane60.currentSettings['chatLanguage'],
    'selectedLanguage seed must match current chatLanguage',
  )

  // activeTab should default to 'identity' (first tab)
  assert.equal(
    spec.state!['activeTab'],
    'identity',
    'activeTab seed must default to identity',
  )

  // inputValues should contain preferredUserName
  const inputValues = spec.state!['inputValues'] as Record<string, unknown>
  assert.ok(inputValues, 'inputValues must be an object')
  assert.equal(
    inputValues['preferredUserName'],
    proof.pane60.currentSettings['preferredUserName'],
    'inputValues must contain preferredUserName from current settings',
  )
})
