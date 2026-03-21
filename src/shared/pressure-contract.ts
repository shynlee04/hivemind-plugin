export type RuntimePressureId =
  | 'steady-state'
  | 'fresh-bootstrap'
  | 'control-plane-repair'
  | 'workflow-readiness'
  | 'trajectory-continuation'
  | 'active-trajectory-conflict'
  | 'delegated-handoff'
  | 'task-mutation'
  | 'trajectory-control'
  | 'handoff-validation'

export type RuntimeFailureBehavior =
  | 'continue'
  | 'warn'
  | 'gate'
  | 'repair'
  | 'refuse'
  | 'fallback'

export type RuntimeSafetyLevel = 'steady' | 'advisory' | 'gated' | 'blocking'

export type RuntimeSafetyAction =
  | 'allow'
  | 'warn-user'
  | 'route-command'
  | 'repair-first'
  | 'checkpoint'
  | 'preserve-trajectory'
  | 'preserve-workflow'
  | 'validate-evidence'
  | 'refuse-conflict'

export interface RuntimeSafetyExpectation {
  level: RuntimeSafetyLevel
  actions: RuntimeSafetyAction[]
  closeout: 'open' | 'ready' | 'blocked'
}

export interface RuntimeEvidenceCaptureSpec {
  requiredArtifacts: string[]
  optionalArtifacts: string[]
  captureFrom: string[]
  stateOwners: string[]
}

/**
 * Metadata portion of RuntimePressureContract - identity and description.
 */
export interface RuntimePressureMetadata {
  id: RuntimePressureId
  title: string
  summary: string
}

/**
 * Failure handling portion of RuntimePressureContract.
 */
export interface RuntimePressureFailure {
  failureBehavior: RuntimeFailureBehavior
}

/**
 * Composed RuntimePressureContract using intersection types.
 * Preserves backward compatibility: contract.safety.level and contract.evidence.requiredArtifacts
 * continue to work because safety and evidence are kept as named property wrappers.
 */
export type RuntimePressureContract =
  & RuntimePressureMetadata
  & RuntimePressureFailure
  & { safety: RuntimeSafetyExpectation }
  & { evidence: RuntimeEvidenceCaptureSpec }

const PRESSURE_PRIORITY: RuntimePressureId[] = [
  'active-trajectory-conflict',
  'fresh-bootstrap',
  'control-plane-repair',
  'workflow-readiness',
  'delegated-handoff',
  'trajectory-continuation',
  'handoff-validation',
  'task-mutation',
  'trajectory-control',
  'steady-state',
]

const PRESSURE_CONTRACT_LIBRARY: Record<RuntimePressureId, RuntimePressureContract> = {
  'steady-state': {
    id: 'steady-state',
    title: 'Steady-State Work',
    summary: 'Normal attached work with no active blocking pressure signals.',
    failureBehavior: 'continue',
    safety: {
      level: 'steady',
      actions: ['allow', 'checkpoint'],
      closeout: 'open',
    },
    evidence: {
      requiredArtifacts: ['route-decision'],
      optionalArtifacts: ['trajectory-event', 'tool-result'],
      captureFrom: ['entry-routing', 'plugin-surface', 'tool-call'],
      stateOwners: ['workflow', 'trajectory'],
    },
  },
  'fresh-bootstrap': {
    id: 'fresh-bootstrap',
    title: 'Fresh Bootstrap',
    summary: 'A new or reset workspace is missing the .hivemind control plane and cannot continue safely.',
    failureBehavior: 'gate',
    safety: {
      level: 'blocking',
      actions: ['route-command', 'repair-first', 'checkpoint'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['readiness-gate', 'checkpoint', 'planning-projection'],
      optionalArtifacts: ['trajectory-event'],
      captureFrom: ['start-work', 'hm-init', 'recovery-spine'],
      stateOwners: ['workflow', 'trajectory', 'governance'],
    },
  },
  'control-plane-repair': {
    id: 'control-plane-repair',
    title: 'Control Plane Repair',
    summary: 'Existing runtime state is unhealthy and must be repaired before operational work resumes.',
    failureBehavior: 'repair',
    safety: {
      level: 'blocking',
      actions: ['repair-first', 'route-command', 'checkpoint', 'preserve-workflow'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['readiness-gate', 'repair-actions', 'checkpoint', 'planning-projection'],
      optionalArtifacts: ['trajectory-event', 'recovery-log'],
      captureFrom: ['start-work', 'hm-doctor', 'recovery-engine'],
      stateOwners: ['workflow', 'trajectory', 'recovery'],
    },
  },
  'workflow-readiness': {
    id: 'workflow-readiness',
    title: 'Workflow Readiness Gate',
    summary: 'High-control work is being requested before workflow authority and guardrails are ready.',
    failureBehavior: 'warn',
    safety: {
      level: 'gated',
      actions: ['warn-user', 'route-command', 'checkpoint', 'preserve-workflow'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['readiness-gate', 'checkpoint', 'planning-projection'],
      optionalArtifacts: ['trajectory-event'],
      captureFrom: ['start-work', 'hm-harness', 'workflow-authority'],
      stateOwners: ['workflow', 'trajectory', 'governance'],
    },
  },
  'trajectory-continuation': {
    id: 'trajectory-continuation',
    title: 'Trajectory Continuation',
    summary: 'The session should attach to or resume an existing trajectory instead of creating disconnected truth.',
    failureBehavior: 'continue',
    safety: {
      level: 'advisory',
      actions: ['checkpoint', 'preserve-trajectory'],
      closeout: 'ready',
    },
    evidence: {
      requiredArtifacts: ['route-decision', 'trajectory-reference'],
      optionalArtifacts: ['checkpoint', 'trajectory-event'],
      captureFrom: ['trajectory-assessment', 'start-work', 'trajectory-tool'],
      stateOwners: ['trajectory'],
    },
  },
  'active-trajectory-conflict': {
    id: 'active-trajectory-conflict',
    title: 'Active Trajectory Conflict',
    summary: 'Incoming work conflicts with the currently active trajectory and must not be silently rebound.',
    failureBehavior: 'refuse',
    safety: {
      level: 'blocking',
      actions: ['refuse-conflict', 'preserve-trajectory', 'preserve-workflow'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['route-decision', 'conflict-reason'],
      optionalArtifacts: ['trajectory-event'],
      captureFrom: ['trajectory-assessment', 'start-work'],
      stateOwners: ['trajectory', 'workflow'],
    },
  },
  'delegated-handoff': {
    id: 'delegated-handoff',
    title: 'Delegated Handoff',
    summary: 'A delegated or sub-session path must stay bounded to explicit handoff, task, and return contracts.',
    failureBehavior: 'gate',
    safety: {
      level: 'gated',
      actions: ['warn-user', 'checkpoint', 'validate-evidence', 'preserve-workflow'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['handoff-record', 'route-decision'],
      optionalArtifacts: ['checkpoint', 'trajectory-event'],
      captureFrom: ['start-work', 'handoff-tool', 'delegation-store'],
      stateOwners: ['delegation', 'trajectory', 'workflow'],
    },
  },
  'task-mutation': {
    id: 'task-mutation',
    title: 'Task Mutation',
    summary: 'Task and subtask mutations must map back to workflow authority and carry explicit evidence.',
    failureBehavior: 'continue',
    safety: {
      level: 'advisory',
      actions: ['checkpoint', 'preserve-workflow', 'validate-evidence'],
      closeout: 'ready',
    },
    evidence: {
      requiredArtifacts: ['tool-result', 'task-ledger'],
      optionalArtifacts: ['trajectory-event', 'checkpoint'],
      captureFrom: ['task-tool', 'workflow-authority'],
      stateOwners: ['workflow'],
    },
  },
  'trajectory-control': {
    id: 'trajectory-control',
    title: 'Trajectory Control',
    summary: 'Trajectory traversal, checkpointing, and closeout must preserve cross-session truth and resumability.',
    failureBehavior: 'continue',
    safety: {
      level: 'advisory',
      actions: ['checkpoint', 'preserve-trajectory', 'preserve-workflow'],
      closeout: 'ready',
    },
    evidence: {
      requiredArtifacts: ['trajectory-event', 'checkpoint'],
      optionalArtifacts: ['planning-projection', 'tool-result'],
      captureFrom: ['trajectory-tool', 'trajectory-store', 'recovery-engine'],
      stateOwners: ['trajectory'],
    },
  },
  'handoff-validation': {
    id: 'handoff-validation',
    title: 'Handoff Validation',
    summary: 'Delegated work cannot close without required evidence and explicit return discipline.',
    failureBehavior: 'gate',
    safety: {
      level: 'gated',
      actions: ['validate-evidence', 'checkpoint', 'preserve-workflow'],
      closeout: 'blocked',
    },
    evidence: {
      requiredArtifacts: ['handoff-record', 'validation-result'],
      optionalArtifacts: ['trajectory-event', 'tool-result'],
      captureFrom: ['handoff-tool', 'delegation-store'],
      stateOwners: ['delegation', 'workflow'],
    },
  },
}

function cloneContract(contract: RuntimePressureContract): RuntimePressureContract {
  return {
    ...contract,
    safety: {
      ...contract.safety,
      actions: [...contract.safety.actions],
    },
    evidence: {
      requiredArtifacts: [...contract.evidence.requiredArtifacts],
      optionalArtifacts: [...contract.evidence.optionalArtifacts],
      captureFrom: [...contract.evidence.captureFrom],
      stateOwners: [...contract.evidence.stateOwners],
    },
  }
}

export function getRuntimePressureContract(id: RuntimePressureId): RuntimePressureContract {
  return cloneContract(PRESSURE_CONTRACT_LIBRARY[id])
}

export function pickRuntimePressureContract(ids: RuntimePressureId[]): RuntimePressureContract {
  const selected = PRESSURE_PRIORITY.find((candidate) => ids.includes(candidate)) ?? 'steady-state'
  return getRuntimePressureContract(selected)
}

export function listRuntimePressureContracts(): RuntimePressureContract[] {
  return PRESSURE_PRIORITY.map((id) => getRuntimePressureContract(id))
}
