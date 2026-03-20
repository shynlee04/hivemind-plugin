import assert from 'node:assert/strict'
import test from 'node:test'

import { renderTurnHierarchy, type TurnHierarchyContext } from '../../../src/plugin/context-renderer.js'

test('TurnHierarchy - renderTurnHierarchy - renders all turn_types correctly', (t) => {
  const turnTypes: TurnHierarchyContext['turn_type'][] = ['root', 'delegation', 'handoff', 'checkpoint', 'correction']

  for (const turnType of turnTypes) {
    const context: TurnHierarchyContext = {
      turn_type: turnType,
      turn_depth: 1,
      sibling_count: 0,
      trajectory_path: [],
    }

    const rendered = renderTurnHierarchy(context)
    // JSON.stringify quotes string values, so turn_type value should be quoted
    assert.match(rendered, new RegExp(`turn_type="${turnType}"`), `Should render turn_type="${turnType}"`)
  }
})

test('TurnHierarchy - renderTurnHierarchy - renders turn_depth correctly', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'root',
    turn_depth: 5,
    sibling_count: 2,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  // Numbers converted to String() are not quoted in JSON - but since we're using
  // JSON.stringify on the String() result, they appear as plain numbers
  assert.match(rendered, /turn_depth="5"/)
})

test('TurnHierarchy - renderTurnHierarchy - serializes trajectory_path as JSON array', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'delegation',
    turn_depth: 2,
    sibling_count: 1,
    trajectory_path: ['traj_xyz', 'wf_main', 'tsh_001', 'sub_002'],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /trajectory_path=\["traj_xyz","wf_main","tsh_001","sub_002"\]/)
})

test('TurnHierarchy - renderTurnHierarchy - renders with parent_turn_id when provided', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'handoff',
    turn_depth: 3,
    sibling_count: 0,
    parent_turn_id: 'msg_parent_123',
    trajectory_path: ['traj_abc'],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /parent_turn_id="msg_parent_123"/)
})

test('TurnHierarchy - renderTurnHierarchy - omits parent_turn_id when not provided', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'root',
    turn_depth: 0,
    sibling_count: 0,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  assert.doesNotMatch(rendered, /parent_turn_id=/)
})

test('TurnHierarchy - renderTurnHierarchy - renders pending_parent=none when not provided', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'root',
    turn_depth: 1,
    sibling_count: 0,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /pending_parent=none/)
})

test('TurnHierarchy - renderTurnHierarchy - renders pending_parent when provided', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'delegation',
    turn_depth: 2,
    sibling_count: 1,
    pending_parent: 'msg_pending_456',
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /pending_parent="msg_pending_456"/)
})

test('TurnHierarchy - renderTurnHierarchy - renders sibling_count correctly', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'checkpoint',
    turn_depth: 4,
    sibling_count: 7,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /sibling_count="7"/)
})

test('TurnHierarchy - renderTurnHierarchy - renders full example with all fields', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'delegation',
    turn_depth: 2,
    parent_turn_id: 'msg_parent_123',
    sibling_count: 1,
    pending_parent: 'msg_pending_789',
    trajectory_path: ['traj_xyz', 'wf_main', 'tsh_001', 'sub_002'],
  }

  const rendered = renderTurnHierarchy(context)
  const expected = [
    '<hivemind-turn-hierarchy>',
    'turn_depth="2"',
    'turn_type="delegation"',
    'parent_turn_id="msg_parent_123"',
    'sibling_count="1"',
    'trajectory_path=["traj_xyz","wf_main","tsh_001","sub_002"]',
    'pending_parent="msg_pending_789"',
    '</hivemind-turn-hierarchy>',
  ].join('\n')

  assert.equal(rendered, expected)
})

test('TurnHierarchy - renderTurnHierarchy - renders minimal context with defaults', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'root',
    turn_depth: 0,
    sibling_count: 0,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  const expected = [
    '<hivemind-turn-hierarchy>',
    'turn_depth="0"',
    'turn_type="root"',
    'sibling_count="0"',
    'trajectory_path=[]',
    'pending_parent=none',
    '</hivemind-turn-hierarchy>',
  ].join('\n')

  assert.equal(rendered, expected)
})

test('TurnHierarchy - renderTurnHierarchy - handles empty trajectory_path', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'root',
    turn_depth: 1,
    sibling_count: 0,
    trajectory_path: [],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /trajectory_path=\[\]/)
})

test('TurnHierarchy - renderTurnHierarchy - handles single-item trajectory_path', () => {
  const context: TurnHierarchyContext = {
    turn_type: 'handoff',
    turn_depth: 1,
    sibling_count: 0,
    trajectory_path: ['traj_single'],
  }

  const rendered = renderTurnHierarchy(context)
  assert.match(rendered, /trajectory_path=\["traj_single"\]/)
})
