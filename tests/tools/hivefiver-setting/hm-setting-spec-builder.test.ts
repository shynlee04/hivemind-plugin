import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  HmSettingDashboardProof,
  HmSettingDashboardSpec,
  HmSettingDashboardSpecElement,
} from '../../../src/tools/hivefiver-setting/types.js'
import { buildHmSettingDashboardSpec } from '../../../src/tools/hivefiver-setting/spec-builder.js'

/**
 * Canonical mock proof used across all spec-builder tests.
 * Mirrors the fixture shape from hm-setting-render.test.ts.
 */
function createMockProof(): HmSettingDashboardProof {
  return {
    mode: 'settings',
    pane40: {
      title: '40 pane · runtime/session mirror',
      sessionId: 'ses_dashboard',
      runtimeAuthority: 'attached-sdk',
      attachmentMode: 'local-worktree',
      workflowId: 'wf_dashboard',
      trajectoryId: 'trj_dashboard',
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
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Test 1: root element is Stack with vertical direction
// ---------------------------------------------------------------------------
test('spec has root element of type Stack with vertical direction', () => {
  const proof = createMockProof()
  const spec: HmSettingDashboardSpec = buildHmSettingDashboardSpec(proof)

  const rootEl: HmSettingDashboardSpecElement = spec.elements[spec.root]
  assert.equal(rootEl.type, 'Stack')
  assert.equal(rootEl.props.direction, 'vertical')
})

// ---------------------------------------------------------------------------
// Test 2: header element is Heading with level h1
// ---------------------------------------------------------------------------
test('spec has header element of type Heading with level h1', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const rootEl = spec.elements[spec.root]
  const headerId = rootEl.children?.find(
    (id) => spec.elements[id]?.type === 'Heading',
  )
  assert.ok(headerId, 'root must have a Heading child')
  const header = spec.elements[headerId]
  assert.equal(header.type, 'Heading')
  assert.equal(header.props.level, 'h1')
  assert.ok(typeof header.props.text === 'string' && header.props.text.length > 0)
})

// ---------------------------------------------------------------------------
// Test 3: body element is Stack with horizontal direction
// ---------------------------------------------------------------------------
test('spec has body element of type Stack with horizontal direction', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const rootEl = spec.elements[spec.root]
  const bodyId = rootEl.children?.find(
    (id) => spec.elements[id]?.type === 'Stack' && spec.elements[id]?.props.direction === 'horizontal',
  )
  assert.ok(bodyId, 'root must have a horizontal Stack child (body)')
  const body = spec.elements[bodyId]
  assert.equal(body.type, 'Stack')
  assert.equal(body.props.direction, 'horizontal')
})

// ---------------------------------------------------------------------------
// Test 4: left card holds session data (pane40 fields)
// ---------------------------------------------------------------------------
test('spec has left card with session data from pane40', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  // Find the body horizontal stack
  const rootEl = spec.elements[spec.root]
  const bodyId = rootEl.children?.find(
    (id) => spec.elements[id]?.type === 'Stack' && spec.elements[id]?.props.direction === 'horizontal',
  )
  assert.ok(bodyId)
  const body = spec.elements[bodyId]

  // The body must have two children (left card, right card)
  assert.ok(body.children && body.children.length >= 2, 'body must have at least 2 children')

  const leftCardId = body.children[0]
  const leftCard = spec.elements[leftCardId]
  assert.equal(leftCard.type, 'Card')

  // Left card must contain a Text element referencing pane40.sessionId
  const allLeftDescendants = leftCard.children ?? []
  const textElements = allLeftDescendants
    .map((id) => spec.elements[id])
    .filter((el): el is HmSettingDashboardSpecElement => !!el && el.type === 'Text')

  const sessionText = textElements.find(
    (el) => typeof el.props.text === 'string' && el.props.text.includes('ses_dashboard'),
  )
  assert.ok(sessionText, 'left card must contain Text referencing sessionId ses_dashboard')
})

// ---------------------------------------------------------------------------
// Test 5: right card holds settings data (pane60 fields)
// ---------------------------------------------------------------------------
test('spec has right card with settings data from pane60', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const rootEl = spec.elements[spec.root]
  const bodyId = rootEl.children?.find(
    (id) => spec.elements[id]?.type === 'Stack' && spec.elements[id]?.props.direction === 'horizontal',
  )
  assert.ok(bodyId)
  const body = spec.elements[bodyId]

  const rightCardId = body.children![1]
  const rightCard = spec.elements[rightCardId]
  assert.equal(rightCard.type, 'Card')

  // Right card must contain Text referencing currentSettings
  const allRightDescendants = rightCard.children ?? []
  const textElements = allRightDescendants
    .map((id) => spec.elements[id])
    .filter((el) => el && el.type === 'Text')

  const settingsText = textElements.find(
    (el) => typeof el.props.text === 'string' && el.props.text.includes('Taylor'),
  )
  assert.ok(settingsText, 'right card must contain Text referencing preferredUserName Taylor')
})

// ---------------------------------------------------------------------------
// Test 6: health badge variant mapping
// ---------------------------------------------------------------------------
test('health badge variant maps correctly: ready→default, degraded→outline, error→destructive', () => {
  // ready → default
  const readyProof = createMockProof()
  readyProof.pane40.healthSummary = 'ready'
  const readySpec = buildHmSettingDashboardSpec(readyProof)
  const readyBadge = findBadgeElement(readySpec, 'ready')
  assert.ok(readyBadge, 'must find a Badge with text containing "ready"')
  assert.equal(readyBadge.props.variant, 'default')

  // degraded → outline
  const degradedProof = createMockProof()
  degradedProof.pane40.healthSummary = 'degraded'
  const degradedSpec = buildHmSettingDashboardSpec(degradedProof)
  const degradedBadge = findBadgeElement(degradedSpec, 'degraded')
  assert.ok(degradedBadge, 'must find a Badge with text containing "degraded"')
  assert.equal(degradedBadge.props.variant, 'outline')

  // error → destructive
  const errorProof = createMockProof()
  errorProof.pane40.healthSummary = 'error'
  const errorSpec = buildHmSettingDashboardSpec(errorProof)
  const errorBadge = findBadgeElement(errorSpec, 'error')
  assert.ok(errorBadge, 'must find a Badge with text containing "error"')
  assert.equal(errorBadge.props.variant, 'destructive')
})

// ---------------------------------------------------------------------------
// Test 7: state seeds hasChanges and hasGuidance booleans
// ---------------------------------------------------------------------------
test('state seeds hasChanges and hasGuidance booleans', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  assert.ok(spec.state, 'spec must have a state object')
  assert.equal(typeof spec.state!['hasChanges'], 'boolean')
  assert.equal(typeof spec.state!['hasGuidance'], 'boolean')
  assert.equal(spec.state!['hasChanges'], true)   // changedFields has entries
  assert.equal(spec.state!['hasGuidance'], true)   // guidance has entries
})

// ---------------------------------------------------------------------------
// Test 8: all element types are from the registered set
// ---------------------------------------------------------------------------
test('all element types are from registered set: Stack, Heading, Card, Text, Badge', () => {
  const proof = createMockProof()
  const spec = buildHmSettingDashboardSpec(proof)

  const allowed = new Set(['Stack', 'Heading', 'Card', 'Text', 'Badge'])
  for (const [id, el] of Object.entries(spec.elements)) {
    assert.ok(
      allowed.has(el.type),
      `element "${id}" has disallowed type "${el.type}" — allowed: ${[...allowed].join(', ')}`,
    )
  }
})

// ---------------------------------------------------------------------------
// Test 9: empty recentEvents produces 'No recent events' text
// ---------------------------------------------------------------------------
test('empty recentEvents produces No recent events text', () => {
  const proof = createMockProof()
  proof.pane40.recentEvents = []
  const spec = buildHmSettingDashboardSpec(proof)

  const allTexts = Object.values(spec.elements)
    .filter((el) => el.type === 'Text')
    .map((el) => el.props.text as string)

  const noEvents = allTexts.find((t) => t.includes('No recent events'))
  assert.ok(noEvents, 'must contain "No recent events" text when recentEvents is empty')
})

// ---------------------------------------------------------------------------
// Test 10: empty changedFields produces hasChanges=false in state
// ---------------------------------------------------------------------------
test('empty changedFields produces hasChanges=false in state', () => {
  const proof = createMockProof()
  proof.pane60.changedFields = []
  const spec = buildHmSettingDashboardSpec(proof)

  assert.ok(spec.state, 'spec must have a state object')
  assert.equal(spec.state!['hasChanges'], false)
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findBadgeElement(
  spec: HmSettingDashboardSpec,
  textContains: string,
): HmSettingDashboardSpecElement | undefined {
  return Object.values(spec.elements).find(
    (el) =>
      el.type === 'Badge' &&
      typeof el.props.text === 'string' &&
      el.props.text.toLowerCase().includes(textContains.toLowerCase()),
  )
}
