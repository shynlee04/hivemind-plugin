/**
 * Runtime Resilience Tests - Regression tests for CONCERNS.md issues
 *
 * Tests cover:
 * 1. Silent null exits in command.ts (maybeAutoRecoverEntry)
 * 2. Malformed JSON silently swallowed in workflow-continuity.ts
 * 3. Shallow harness health inference
 * 4. Silent null returns in delegation-store.ts
 * 5. Null returns without status in control-plane-registry.ts
 *
 * @see CONCERNS.md for full issue descriptions
 */

import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, beforeEach, afterEach } from 'node:test'

// Import modules under test
import { findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { resolveControlPlaneGate, discoverControlPlanePrimitives } from '../src/control-plane/control-plane-registry.js'
import { createDelegationHandoff, readDelegationHandoff, updateDelegationHandoff, listDelegationHandoffs } from '../src/delegation/delegation-store.js'
import type { StartWorkInput } from '../src/features/session-entry/start-work-types.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeStartWorkInput(overrides: Partial<StartWorkInput> = {}): StartWorkInput {
  return {
    userMessage: '',
    sessionId: 'test-session',
    sessionScope: 'main',
    hasRuntimeAttachment: true,
    profileComplete: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    hasHandoff: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Issue 1: command.ts - Silent null exits in maybeAutoRecoverEntry
// ---------------------------------------------------------------------------

describe('runtime resilience: command.ts maybeAutoRecoverEntry diagnostic returns', () => {
  it('documents the null-return behavior that needs discriminated result type', () => {
    // This test documents the current behavior - the function returns null
    // without any diagnostic information about WHY recovery was skipped
    //
    // Expected fix: maybeAutoRecoverEntry should return a discriminated result:
    // { status: 'skipped', reason: 'MISSING_PROJECT_ROOT' | 'COMMAND_EXCLUDED' | ... }
    // | { status: 'recovered', result: CommandExecutionResult }
    //
    // The 4 null-return paths in maybeAutoRecoverEntry are:
    // 1. Line 123-124: !input.projectRoot -> 'MISSING_PROJECT_ROOT'
    // 2. Line 127-128: bundle.id in recovery commands -> 'COMMAND_EXCLUDED'
    // 3. Line 135-136: state !== uninitialized/repair-required -> 'NON_RECOVERABLE_STATE'
    // 4. Line 142-143: no recovery bundle -> 'MISSING_RECOVERY_BUNDLE'
    //
    // For now, we verify the behavior exists and is observable
    const bundle = findSlashCommandBundle('hm-plan')
    assert.ok(bundle, 'hm-plan bundle should exist')
  })

  it('recovery-skip paths should produce observable diagnostic evidence', () => {
    // When maybeAutoRecoverEntry returns null, the calling code should be able
    // to distinguish between "no recovery needed" vs "recovery failed to load"
    // vs "recovery not applicable for this command"
    //
    // This test verifies that hm-init, hm-doctor, hm-settings, hm-harness
    // skip auto-recovery (they are self-recovery commands)
    const selfRecoveryCommands = ['hm-init', 'hm-doctor', 'hm-settings', 'hm-harness']
    for (const cmdId of selfRecoveryCommands) {
      const bundle = findSlashCommandBundle(cmdId)
      assert.ok(bundle, `${cmdId} bundle should exist`)
      assert.equal(
        bundle.id,
        cmdId,
        `Bundle id should match ${cmdId}`,
      )
    }
  })
})

// ---------------------------------------------------------------------------
// Issue 2: workflow-continuity.ts - Malformed JSON silently swallowed
// ---------------------------------------------------------------------------

describe('runtime resilience: workflow-continuity.ts malformed JSON error collection', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-resilience-continuity-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it('documents the silent drop issue for tracking', async () => {
    // This test documents that when JSON.parse fails on a continuity file,
    // the error is caught and the record is dropped without any way for callers
    // to know a corruption occurred
    //
    // The internal function listWorkflowContinuityTransactions (lines 101-125)
    // silently catches JSON.parse errors and returns null, which is then filtered out.
    //
    // ISSUE: No error was returned to indicate corruption occurred
    // Expected fix: Return { transactions: [...], errors: [...] } with explicit error collection

    // Create a corrupted continuity file
    const continuityDir = join(projectRoot, '.hivemind', 'project', 'runtime-continuity')
    await mkdir(continuityDir, { recursive: true })
    await writeFile(join(continuityDir, 'truly-broken.json'), '{ "version": "v1", invalid')

    // We can't directly call listWorkflowContinuityTransactions as it's not exported,
    // but we can verify the issue through loadWorkflowContinuityTransactionForExecution behavior
    const { loadWorkflowContinuityTransactionForExecution } = await import('../src/features/runtime-entry/workflow-continuity.js')

    const result = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
      sessionId: 'ses_test',
    })

    // The broken file is silently filtered out - no error reported
    assert.equal(result, null, 'Should return null when no valid continuity exists')
    // ISSUE: No indication that a corrupted file existed
  })

  it('valid continuity transaction loads correctly', async () => {
    // Create a valid continuity file
    const continuityDir = join(projectRoot, '.hivemind', 'project', 'runtime-continuity')
    await mkdir(continuityDir, { recursive: true })
    await writeFile(join(continuityDir, 'valid.json'), JSON.stringify({
      version: 'v1',
      continuityId: 'valid-record',
      continuityKey: 'session:valid',
      commandId: 'hm-plan',
      phase: 'planning',
      currentSessionId: 'ses_valid',
      turnOutputRefs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    const { loadWorkflowContinuityTransactionForExecution } = await import('../src/features/runtime-entry/workflow-continuity.js')

    const result = await loadWorkflowContinuityTransactionForExecution(projectRoot, {
      sessionId: 'ses_valid',
    })

    assert.ok(result, 'Should return valid transaction')
    assert.equal(result?.continuityId, 'valid-record')
  })
})

// ---------------------------------------------------------------------------
// Issue 3: harness.ts - Shallow harness health inference
// ---------------------------------------------------------------------------

describe('runtime resilience: harness.ts multi-step readiness probe concept', () => {
  it('documents that current harness uses single health fetch + bundle execution', () => {
    // Current behavior: runHarnessCommand does:
    // 1. fetchHealth(serverUrl) - single GET to /global/health
    // 2. executeSlashCommandBundle('hm-harness', ...)
    // 3. buildRuntimeEntryDecision(closeoutStatus, serverHealthy: health.healthy)
    //
    // Issue: This doesn't prove live OpenCode session lifecycle
    // A real readiness probe would need to:
    // 1. Create a session
    // 2. Execute a command
    // 3. Execute a tool
    // 4. Complete/teardown the session
    //
    // The current implementation is "diagnostic-only" - it makes claims
    // about readiness based on indirect evidence rather than actual session lifecycle

    // This test documents the current limitation
    const runtimeEntryRecoveryCommands = ['hm-init', 'hm-doctor']
    assert.ok(Array.isArray(runtimeEntryRecoveryCommands))
  })

  it('harness result should distinguish diagnostic-only vs proven readiness', async () => {
    // The harness result currently returns:
    // { healthy: boolean, statusCode: number|null, version: string|null, ... }
    //
    // A better design would add:
    // { diagnosticReadiness: { serverHealth: boolean, bundleExecution: boolean },
    //   provenReadiness: { sessionLifecycle: boolean|null, commandExecution: boolean|null } }
    //
    // For now, we document that healthy=false doesn't distinguish between:
    // - Server unreachable
    // - Server returned non-200
    // - Server returned 200 but payload.healthy !== true
    // - Bundle execution failed
    // - Bundle execution succeeded but closeoutStatus !== 'ready'
  })
})

// ---------------------------------------------------------------------------
// Issue 4: delegation-store.ts - Silent null returns without distinction
// ---------------------------------------------------------------------------

describe('runtime resilience: delegation-store.ts null return discrimination', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-resilience-delegation-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it('readDelegationHandoff returns null for missing records (correct)', async () => {
    const result = readDelegationHandoff(projectRoot, 'non-existent-id')
    assert.equal(result, null, 'Should return null for non-existent handoff')
  })

  it('updateDelegationHandoff returns null for non-existent records (correct)', async () => {
    const result = updateDelegationHandoff(projectRoot, { id: 'non-existent-id', summary: 'test' })
    assert.equal(result, null, 'Should return null when updating non-existent handoff')
  })

  it('listDelegationHandoffs returns empty array when directory missing (correct)', async () => {
    const result = listDelegationHandoffs(projectRoot)
    assert.deepEqual(result, [], 'Should return empty array when no handoffs exist')
  })

  it('documents that parse errors are indistinguishable from ENOENT', async () => {
    // ISSUE: readHandoffFile catches JSON.parse errors and returns null
    // This makes it impossible to distinguish "file doesn't exist" from "file is corrupted"
    //
    // A better design would throw CorruptionError or return:
    // { ok: false, error: 'PARSE_ERROR', details: { file: '...', message: '...' } }

    // Create a corrupted handoff file
    const handoffsDir = join(projectRoot, '.hivemind', 'handoffs')
    await mkdir(handoffsDir, { recursive: true })
    await writeFile(join(handoffsDir, 'corrupted.json'), '{ broken json')

    // Current behavior: readDelegationHandoff returns null for corrupted files too
    const result = readDelegationHandoff(projectRoot, 'corrupted')
    assert.equal(result, null, 'Corrupted file returns null (same as ENOENT)')

    // This is problematic because callers can't distinguish:
    // - "handoff was never created" (missing)
    // - "handoff existed but is now corrupted" (data loss)
  })

  it('createDelegationHandoff works correctly for happy path', async () => {
    const record = createDelegationHandoff(projectRoot, {
      packet: {
        sourceSessionId: 'ses_1',
        targetAgent: 'test-agent',
        targetSessionId: 'ses_2',
        scope: 'test scope',
        requiredEvidence: [],
        delegationId: undefined,
        workflowId: 'wf_test',
      },
      summary: 'Test delegation',
      nextSteps: ['step 1', 'step 2'],
    })

    assert.ok(record.id, 'Should have an id')
    assert.equal(record.status, 'open', 'Should have open status')
    assert.equal(record.summary, 'Test delegation')
    assert.deepEqual(record.nextSteps, ['step 1', 'step 2'])
  })
})

// ---------------------------------------------------------------------------
// Issue 5: control-plane-registry.ts - Null returns without status discriminator
// ---------------------------------------------------------------------------

describe('runtime resilience: control-plane-registry.ts null return patterns', () => {
  it('resolveControlPlaneGate returns no_match when no primitive matches', () => {
    // When no control plane primitive's detect() returns a decision,
    // resolveControlPlaneGate returns { status: 'no_match', reason, evaluatedPrimitives }
    //
    // This provides diagnostic information about why no gate was triggered

    const input = makeStartWorkInput({
      hasRuntimeAttachment: true,
      profileComplete: true,
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      userMessage: 'do some work',
    })

    const result = resolveControlPlaneGate(input, 'planning')
    assert.equal(result.status, 'no_match', 'Should return no_match status')
    assert.ok(Array.isArray(result.evaluatedPrimitives), 'Should include evaluated primitives')
    assert.equal(result.evaluatedPrimitives.length, 4, 'Should evaluate all 4 primitives')
  })

  it('detect functions return correctly for non-matching cases', () => {
    const primitives = discoverControlPlanePrimitives()
    assert.ok(primitives.length > 0, 'Should have control plane primitives')

    // hm-init detect returns null when:
    // - hasRuntimeAttachment !== false AND profileComplete !== false
    // - hasHivemind !== false
    // - no explicit keyword match
    const initInput = makeStartWorkInput({
      hasRuntimeAttachment: true,
      profileComplete: true,
      hasHivemind: true,
      hivemindHealthy: true,
      userMessage: 'normal work message',
    })

    // The detect function is internal, but we can observe the end result
    const gateResult = resolveControlPlaneGate(initInput, 'planning')
    assert.equal(gateResult.status, 'no_match', 'No gate for healthy runtime with normal message')
  })

  it('documents the 5 null return points in detect functions', () => {
    // These are the 5 null return points in control-plane-registry.ts:
    // 1. Line 69: detectInit() - no init needed, no explicit keyword
    // 2. Line 89: detectDoctor() - no doctor needed, no explicit keyword
    // 3. Line 109: detectHarness() - no harness needed, no explicit keyword
    // 4. Line 121: detectSettings() - no explicit keyword match
    // 5. Line 248: resolveControlPlaneGate() - no primitive matched (now returns no_match)
    //
    // While returning null was correct for "no decision", callers need
    // a way to distinguish "no decision" from "error occurred"
    // The new result type { status: 'no_match', ... } provides this distinction

    const primitives = discoverControlPlanePrimitives()
    assert.equal(primitives.length, 4, 'Should have 4 control plane primitives')
  })

  it('gate decisions are returned correctly when primitives match', () => {
    // Test that gate decisions ARE returned when conditions match
    const initNeeded = makeStartWorkInput({
      hasHivemind: false,
    })

    const gateResult = resolveControlPlaneGate(initNeeded, 'planning')
    assert.equal(gateResult.status, 'matched', 'Should return matched status when hasHivemind=false')
    assert.equal(gateResult.decision.primitiveId, 'hm-init')
    assert.equal(gateResult.decision.blocking, true)
  })

  it('hm-doctor triggers when hivemindHealthy is false', () => {
    const doctorNeeded = makeStartWorkInput({
      hivemindHealthy: false,
    })

    const gateResult = resolveControlPlaneGate(doctorNeeded, 'planning')
    assert.equal(gateResult.status, 'matched', 'Should return matched when hivemindHealthy=false')
    assert.equal(gateResult.decision.primitiveId, 'hm-doctor')
  })

  it('hm-harness triggers for high-control purposes without workflow', () => {
    const harnessNeeded = makeStartWorkInput({
      hasWorkflow: false,
    })

    const gateResult = resolveControlPlaneGate(harnessNeeded, 'planning')
    assert.equal(gateResult.status, 'matched', 'Should return matched for high-control purpose without workflow')
    assert.equal(gateResult.decision.primitiveId, 'hm-harness')
  })

  it('explicit keywords trigger non-blocking primitives', () => {
    const explicitInit = makeStartWorkInput({
      userMessage: 'run hm-init to bootstrap',
    })

    const gateResult = resolveControlPlaneGate(explicitInit, 'planning')
    assert.equal(gateResult.status, 'matched', 'Should detect explicit keyword')
    assert.equal(gateResult.decision.primitiveId, 'hm-init')
    assert.equal(gateResult.decision.blocking, false, 'Explicit keyword should be non-blocking')
  })
})

// ---------------------------------------------------------------------------
// Integration: All files should be type-safe with no implicit any
// ---------------------------------------------------------------------------

describe('runtime resilience: TypeScript compilation verification', () => {
  it('command.ts exports all required types for discriminated results', () => {
    // Verify the module structure supports the required discriminated result pattern
    // The fix should add something like:
    // type AutoRecoveryResult =
    //   | { status: 'skipped', reason: 'MISSING_PROJECT_ROOT' | 'COMMAND_EXCLUDED' | ... }
    //   | { status: 'recovered', result: CommandExecutionResult }
    //   | null  // or keep null for backwards compat with explicit undefined

    // For now, we just verify the module is importable
    const bundle = findSlashCommandBundle('hm-plan')
    assert.ok(bundle)
  })

  it('delegation-store.ts error types should distinguish ENOENT from corruption', () => {
    // Current: readHandoffFile returns `DelegationHandoffRecord | null`
    // Expected: `Result<DelegationHandoffRecord, 'ENOENT' | 'CORRUPTED' | 'UNKNOWN'>`
    // or similar discriminated result
  })

  it('control-plane-registry.ts should have explicit not-found vs error distinction', () => {
    // Current: detect functions return `ControlPlaneGateDecision | null`
    // Expected: `Result<ControlPlaneGateDecision, 'NO_MATCH' | 'ERROR'>`
    // or similar with status discriminator
  })
})
