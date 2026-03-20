import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { bootstrapTrajectoryLedger, loadTrajectoryLedger } from '../src/core/index.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../src/commands/slash-command/index.js'
import { ContractStore } from '../src/features/agent-work-contract/engine/contract-store.js'
import {
  HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
} from '../src/features/agent-work-contract/tools/index.js'
import type { RuntimeBindingsSnapshot } from '../src/features/runtime-entry/attachment.js'
import { saveRuntimeAttachmentSettings } from '../src/features/runtime-entry/attachment.js'
import type { StartWorkDecision } from '../src/features/session-entry/start-work-types.js'
import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import { getRuntimePressureContract } from '../src/shared/pressure-contract.js'
import { markEntryKernelReady } from '../src/shared/entry-kernel-state.js'
import {
  createHivemindContextPacket,
  renderHivemindContext,
} from '../src/plugin/context-renderer.js'
import { createTurnSnapshotLoader } from '../src/plugin/runtime-snapshot.js'

function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: {
        showToast: async () => undefined,
      },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
  } as never
}

function createContract(overrides: Record<string, unknown> = {}) {
  return {
    contractId: 'contract-123',
    sessionId: 'ses_123',
    delegationExportSessionId: 'delegation-789',
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:10:00.000Z',
    userIntent: {
      raw: 'Preserve contract context during compaction',
      confidence: 0.98,
      purposeClass: 'project-driven' as const,
      requiresPlan: true,
      requiresGovernance: true,
    },
    responseMode: 'broad-search-execute' as const,
    workflow: {
      phase: 'implementation',
      tasks: [
        {
          id: 'task-1',
          title: 'Keep one hook registration',
          status: 'active' as const,
        },
        {
          id: 'task-2',
          title: 'Verify runtime wiring',
          status: 'pending' as const,
        },
      ],
    },
    chainActions: {
      onTaskComplete: 'next-task' as const,
      onWorkflowEnd: 'archive' as const,
      onDelegation: 'handoff-packet' as const,
      onCompaction80: 'launch-context-agent' as const,
    },
    briefing: {
      summary: 'Continue plugin wiring safely.',
      workflowState: 'implementation',
      followUp: ['extend inline compaction hook'],
    },
    anchors: [
      {
        timestamp: '2026-03-20T10:01:00.000Z',
        kind: 'planning-shift' as const,
        description: 'Verified single compaction registration.',
      },
    ],
    ...overrides,
  }
}

function createSnapshot(overrides: Partial<RuntimeBindingsSnapshot> = {}): RuntimeBindingsSnapshot {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_123',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
    governanceMode: 'assisted',
    automationLevel: 'guarded',
    language: 'en',
    artifactLanguage: 'en',
    outputStyle: 'concise',
    expertLevel: 'advanced',
    branchFocus: 'runtime-context-detox',
    guardrails: ['workflow-first'],
    facilitators: ['hm-init'],
    mcpReadiness: ['context7'],
    hivebrainDigest: ['runtime-authority'],
    verificationContract: 'prove-with-tests',
    returnContract: 'brief',
    entryState: 'ready',
    qaState: 'passed',
    releaseState: 'released',
    hasRuntimeAttachment: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    profileComplete: true,
    missingProfileFields: [],
    interactiveBootstrapRequired: false,
    bootstrapProfile: {
      preferredUserName: 'Taylor',
      chatLanguage: 'en',
      artifactLanguage: 'en',
      expertiseLevel: 'advanced',
      governanceMode: 'assisted',
      automationLevel: 'guarded',
      outputStyle: 'concise',
    },
    trajectoryId: 'traj_123',
    workflowId: 'wf_123',
    taskIds: ['task-1', 'task-2'],
    subtaskIds: [],
    checkpointId: 'cp_123',
    ...overrides,
  }
}

function createDecision(overrides: Partial<StartWorkDecision> = {}): StartWorkDecision {
  return {
    sessionId: 'ses_123',
    sessionScope: 'main',
    sessionState: 'fresh',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    confidence: 0.9,
    reasons: ['planning-keyword'],
    readiness: [],
    traversalOutcome: 'route',
    commandAgent: 'planner',
    continuityAlerts: [],
    workflowAuthority: undefined,
    trajectoryAssessment: undefined,
    routeDisposition: 'create',
    nextTransition: 'command:hm-plan',
    requiredControlPlaneId: undefined,
    recommendedControlPlaneId: undefined,
    requiredCommandId: undefined,
    recommendedCommandId: 'hm-plan',
    programmaticInitiationRequired: false,
    autoRoute: true,
    riskLevel: 'none',
    opencodeKnowledge: [],
    pressureSignals: ['steady-state'],
    pressureContract: getRuntimePressureContract('steady-state'),
    ...overrides,
  }
}

async function bootstrapReadyRuntime(projectRoot: string): Promise<void> {
  await saveRuntimeAttachmentSettings(projectRoot, {
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_test',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
  })
  await bootstrapTrajectoryLedger(projectRoot, {
    trajectoryId: 'traj_123',
    workflowId: 'wf_123',
    sessionId: 'ses_123',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    taskIds: ['task-1'],
  })
  await markEntryKernelReady(projectRoot)
}

test('createTurnSnapshotLoader caches one snapshot per turn and resets explicitly', async () => {
  let calls = 0
  const snapshot = createSnapshot()
  const loader = createTurnSnapshotLoader('/tmp/hivemind', async () => {
    calls += 1
    return snapshot
  })

  const first = await loader.getSnapshot()
  const second = await loader.getSnapshot()

  assert.equal(calls, 1)
  assert.equal(first, snapshot)
  assert.equal(second, snapshot)

  loader.resetTurnSnapshot()

  const third = await loader.getSnapshot()
  assert.equal(calls, 2)
  assert.equal(third, snapshot)
})

test('renderHivemindContext emits the authoritative packet in stable field order', () => {
  const packet = renderHivemindContext({
    session_id: 'ses_123',
    lineage: 'hivefiver',
    trajectory: 'traj_123',
    workflow: 'wf_123',
    task_ids: ['task-1', 'task-2'],
    entry_state: 'ready',
    purpose: 'planning',
    risk: 'none',
    route_command: 'hm-plan',
    governance_mode: 'assisted',
    language: 'en',
  })

  assert.equal(
    packet,
    [
      '<hivemind context_version="v1">',
      'session_id="ses_123"',
      'lineage="hivefiver"',
      'trajectory="traj_123"',
      'workflow="wf_123"',
      'task_ids=["task-1","task-2"]',
      'entry_state="ready"',
      'purpose="planning"',
      'risk="none"',
      'route_command="hm-plan"',
      'governance_mode="assisted"',
      'language="en"',
      '</hivemind>',
    ].join('\n'),
  )
})

test('createHivemindContextPacket maps snapshot and routing decision into the unified fields', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot({ entryState: 'repair-required', governanceMode: 'strict', language: 'fr' }),
    startWork: createDecision({ purposeClass: 'implementation', riskLevel: 'gated', requiredCommandId: 'hm-implement' }),
  })

  assert.deepEqual(packet, {
    session_id: 'ses_123',
    lineage: 'hivefiver',
    trajectory: 'traj_123',
    workflow: 'wf_123',
    task_ids: ['task-1', 'task-2'],
    entry_state: 'repair-required',
    purpose: 'implementation',
    risk: 'gated',
    route_command: 'hm-implement',
    governance_mode: 'strict',
    language: 'fr',
  })
})

test('event hook keeps a single root binding while composing agent-work event evidence through the authoritative handler', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-event-agent-work-'))

  try {
    await bootstrapTrajectoryLedger(directory, {
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      sessionId: 'ses_123',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1', 'task-2'],
    })

    const store = new ContractStore(directory)
    await store.create(createContract())

    const hooks = await HiveMindPlugin(createPluginInput(directory))

    await hooks.event?.({
      event: {
        type: 'session.compacted',
        properties: {
          sessionID: 'ses_123',
        },
      },
    } as never)

    const ledger = await loadTrajectoryLedger(directory)
    const trajectory = ledger.trajectories.find((item) => item.id === 'traj_123')
    const event = trajectory?.events.at(-1)
    const checkpoint = ledger.checkpoints.at(-1)

    assert.equal(event?.summary, 'event:session.compacted')
    assert.deepEqual(event?.evidenceRefs, [
      'task-1',
      'task-2',
      'agent-work-contract:contract-123',
      'agent-work-trigger:onCompaction80',
    ])
    assert.equal(checkpoint?.resumeTarget, 'command:hm-harness')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('event hook skips trajectory writes when event session does not match the active trajectory session', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-event-session-mismatch-'))

  try {
    await bootstrapTrajectoryLedger(directory, {
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      sessionId: 'ses_other',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1', 'task-2'],
    })

    const store = new ContractStore(directory)
    await store.create(createContract())

    const hooks = await HiveMindPlugin(createPluginInput(directory))

    await hooks.event?.({
      event: {
        type: 'session.compacted',
        properties: {
          sessionID: 'ses_123',
        },
      },
    } as never)

    const ledger = await loadTrajectoryLedger(directory)
    const trajectory = ledger.trajectories.find((item) => item.id === 'traj_123')

    assert.deepEqual(trajectory?.events ?? [], [])
    assert.deepEqual(ledger.checkpoints, [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('tool.execute.after records only managed-tool events', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-tool-after-boundary-'))

  try {
    await bootstrapTrajectoryLedger(directory, {
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      sessionId: 'ses_123',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1', 'task-2'],
    })

    const hooks = await HiveMindPlugin(createPluginInput(directory))

    await hooks['tool.execute.after']?.({
      sessionID: 'ses_123',
      tool: 'bash',
    } as never, {} as never)

    await hooks['tool.execute.after']?.({
      sessionID: 'ses_123',
      tool: 'hivemind_task',
    } as never, {} as never)

    const ledger = await loadTrajectoryLedger(directory)
    const trajectory = ledger.trajectories.find((item) => item.id === 'traj_123')
    const summaries = trajectory?.events.map((event) => event.summary) ?? []

    assert.deepEqual(summaries, ['tool:hivemind_task:ses_123'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('tool.execute.before and after ignore feature-local agent-work tools', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-tool-feature-local-'))

  try {
    await bootstrapTrajectoryLedger(directory, {
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      sessionId: 'ses_123',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1', 'task-2'],
    })

    const hooks = await HiveMindPlugin(createPluginInput(directory))

    await hooks['tool.execute.before']?.({
      sessionID: 'ses_123',
      tool: HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
    } as never, {} as never)

    await hooks['tool.execute.after']?.({
      sessionID: 'ses_123',
      tool: HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
    } as never, {} as never)

    const ledger = await loadTrajectoryLedger(directory)
    const trajectory = ledger.trajectories.find((item) => item.id === 'traj_123')

    assert.deepEqual(trajectory?.events ?? [], [])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('promoted create-contract tool persists planning fields and compaction reads the same stored contract', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-promoted-contract-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const createTool = hooks.tool?.hivemind_agent_work_create_contract

    assert.ok(createTool)

    const output = JSON.parse(await createTool.execute({
      action: 'create',
      contractId: 'contract-runtime-123',
      rawIntent: 'implement active session contract runtime promotion',
      workflow: {
        planningPath: '.hivemind/project/planning/active-session-contract-runtime-promotion.md',
        phase: 'implementation',
        tasks: [
          {
            id: 'task-runtime-1',
            title: 'Promote contract tools',
            status: 'active',
          },
        ],
      },
      briefing: {
        summary: 'Promote the active session contract into runtime status.',
        workflowState: 'implementation',
        followUp: ['verify compaction'],
      },
    } as never, {
      sessionID: 'ses_123',
      messageID: 'msg_123',
      agent: 'runtime-agent',
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata() {},
      async ask() {},
    } as never))

    assert.equal(output.status, 'success')

    const persisted = await new ContractStore(directory).get('contract-runtime-123')
    assert.equal(
      persisted?.workflow.planningPath,
      '.hivemind/project/planning/active-session-contract-runtime-promotion.md',
    )

    const compactionOutput = { context: [] as string[] }
    await hooks['experimental.session.compacting']?.({ sessionID: 'ses_123' } as never, compactionOutput as never)

    assert.equal(compactionOutput.context.length, 1)
    assert.match(compactionOutput.context[0] ?? '', /contract_id="contract-runtime-123"/)
    assert.match(compactionOutput.context[0] ?? '', /briefing_summary="Promote the active session contract into runtime status."/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('runtime status reports the latest session contract summary from persisted agent-work state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-status-contract-'))

  try {
    const store = new ContractStore(directory)
    await store.create(createContract({
      contractId: 'contract-older',
      updatedAt: '2026-03-20T10:09:00.000Z',
      workflow: {
        planningPath: '.hivemind/project/planning/older.md',
        phase: 'review',
        tasks: [
          {
            id: 'task-old',
            title: 'Old task',
            status: 'pending' as const,
          },
        ],
      },
    }))
    await store.create(createContract({
      contractId: 'contract-latest',
      updatedAt: '2026-03-20T10:11:00.000Z',
      workflow: {
        planningPath: '.hivemind/project/planning/latest.md',
        phase: 'implementation',
        tasks: [
          {
            id: 'task-live',
            title: 'Live task',
            status: 'active' as const,
          },
          {
            id: 'task-next',
            title: 'Next task',
            status: 'pending' as const,
          },
        ],
      },
      briefing: {
        summary: 'Latest contract summary',
        workflowState: 'implementation',
        followUp: ['ship runtime status'],
      },
    }))

    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const statusTool = hooks.tool?.hivemind_runtime_status

    assert.ok(statusTool)

    const payload = JSON.parse(await statusTool.execute({} as never, {
      sessionID: 'ses_123',
      messageID: 'msg_123',
      agent: 'runtime-agent',
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata() {},
      async ask() {
        throw new Error('runtime status should not ask for permissions')
      },
    } as never))

    assert.equal(payload.latestSessionContract.contractId, 'contract-latest')
    assert.equal(payload.latestSessionContract.planningPath, '.hivemind/project/planning/latest.md')
    assert.equal(payload.latestSessionContract.workflowPhase, 'implementation')
    assert.deepEqual(payload.latestSessionContract.activeTaskIds, ['task-live'])
    assert.deepEqual(payload.latestSessionContract.pendingTaskIds, ['task-next'])
    assert.equal(payload.latestSessionContract.briefingSummary, 'Latest contract summary')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('runtime status surfaces continuity-bearing contract state across session changes without contract tools', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-runtime-command-contract-'))

  try {
    await bootstrapReadyRuntime(directory)
    const planBundle = findSlashCommandBundle('hm-plan')
    const implementBundle = findSlashCommandBundle('hm-implement')

    assert.ok(planBundle)
    assert.ok(implementBundle)

    const planResult = await executeSlashCommandBundle(planBundle, {
      projectRoot: directory,
      sessionId: 'ses_123',
      sessionScope: 'main',
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      lineage: 'hivefiver',
      purposeClass: 'planning',
      activeAgent: 'runtime-agent',
      userMessage: 'Plan the runtime session contract linkage.',
    })

    const implementResult = await executeSlashCommandBundle(implementBundle, {
      projectRoot: directory,
      sessionId: 'ses_456',
      sessionScope: 'main',
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      lineage: 'hivefiver',
      purposeClass: 'implementation',
      activeAgent: 'runtime-agent',
      userMessage: 'Implement from the linked planning artifact.',
    })

    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const statusTool = hooks.tool?.hivemind_runtime_status

    assert.ok(statusTool)

    const payload = JSON.parse(await statusTool.execute({} as never, {
      sessionID: 'ses_456',
      messageID: 'msg_123',
      agent: 'runtime-agent',
      directory,
      worktree: directory,
      abort: new AbortController().signal,
      metadata() {},
      async ask() {
        throw new Error('runtime status should not ask for permissions')
      },
    } as never))

    assert.equal(payload.latestSessionContract.contractId, 'awc-session-ses_123')
    assert.equal(payload.latestSessionContract.workflowPhase, 'implementation')
    assert.equal(payload.latestSessionContract.planningPath, planResult.turnOutputProjection?.markdownPath)
    assert.equal(payload.latestSessionContract.continuityKey, 'workflow:wf_123')
    assert.equal(payload.latestSessionContract.continuityCurrentSessionId, 'ses_456')
    assert.equal(payload.latestSessionContract.continuityPriorSessionId, 'ses_123')
    assert.equal(payload.latestSessionContract.continuityPhase, 'implementation')
    assert.deepEqual(payload.latestSessionContract.continuityTurnOutputRefs, [
      implementResult.turnOutputProjection?.markdownPath,
      implementResult.turnOutputProjection?.yamlPath,
    ])
    assert.ok((payload.latestSessionContract.recentAnchorDescriptions ?? []).length >= 1)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('promoted create-contract tool execution is tracked as a managed tool event', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-tool-promoted-managed-'))

  try {
    await bootstrapTrajectoryLedger(directory, {
      trajectoryId: 'traj_123',
      workflowId: 'wf_123',
      sessionId: 'ses_123',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1', 'task-2'],
    })

    const hooks = await HiveMindPlugin(createPluginInput(directory))

    await hooks['tool.execute.before']?.({
      sessionID: 'ses_123',
      tool: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
    } as never, {} as never)

    await hooks['tool.execute.after']?.({
      sessionID: 'ses_123',
      tool: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
    } as never, {} as never)

    const ledger = await loadTrajectoryLedger(directory)
    const trajectory = ledger.trajectories.find((item) => item.id === 'traj_123')
    const summaries = trajectory?.events.map((event) => event.summary) ?? []

    assert.deepEqual(summaries, [
      `tool:${HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID}:pre:ses_123`,
      `tool:${HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID}:ses_123`,
    ])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
