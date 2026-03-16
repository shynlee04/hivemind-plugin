import type { KernelLineage, SessionScope } from '../context/prompt-packet/prompt-packet-types.js'
import type {
  EntryKernelQaState,
  EntryKernelReleaseState,
  EntryKernelStateKind,
} from './entry-kernel-state.js'
import {
  createRuntimeInvocationLifecycle,
  type RuntimeInvocationLifecycle,
} from './lifecycle-spine.js'

export type RuntimeInvokerClass = 'user' | 'main-agent' | 'sub-agent'

export interface RuntimeInvocationV1 {
  version: 'v1'
  invocationId: string
  lifecycle: RuntimeInvocationLifecycle
  invokerClass: RuntimeInvokerClass
  sessionId: string
  parentSessionId?: string
  sessionScope: SessionScope
  agentId?: string
  agentMode?: 'all' | 'primary' | 'sub'
  lineage?: KernelLineage
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
  gateState: string
  sotRefs: string[]
  artifactRefs: string[]
  delegationId?: string
  requestReason: string
}

function createInvocationId(sessionId: string): string {
  return `inv_${sessionId}_${Date.now()}`
}

export function resolveRuntimeInvokerClass(input: {
  sessionScope: SessionScope
  activeAgent?: string
}): RuntimeInvokerClass {
  if (input.sessionScope === 'sub-session') {
    return 'sub-agent'
  }

  if (input.activeAgent) {
    return 'main-agent'
  }

  return 'user'
}

export function createRuntimeInvocation(input: {
  sessionId: string
  parentSessionId?: string
  sessionScope: SessionScope
  activeAgent?: string
  agentMode?: 'all' | 'primary' | 'sub'
  lineage?: KernelLineage
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
  gateState: string
  sotRefs?: string[]
  artifactRefs?: string[]
  delegationId?: string
  requestReason: string
}): RuntimeInvocationV1 {
  return {
    version: 'v1',
    invocationId: createInvocationId(input.sessionId),
    lifecycle: createRuntimeInvocationLifecycle({
      entryState: input.entryState,
      qaState: input.qaState,
      releaseState: input.releaseState,
    }),
    invokerClass: resolveRuntimeInvokerClass(input),
    sessionId: input.sessionId,
    parentSessionId: input.parentSessionId,
    sessionScope: input.sessionScope,
    agentId: input.activeAgent,
    agentMode: input.sessionScope === 'sub-session' ? 'sub' : input.activeAgent ? 'primary' : undefined,
    lineage: input.lineage,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: input.taskIds ?? [],
    subtaskIds: input.subtaskIds ?? [],
    entryState: input.entryState,
    qaState: input.qaState,
    releaseState: input.releaseState,
    gateState: input.gateState,
    sotRefs: input.sotRefs ?? [],
    artifactRefs: input.artifactRefs ?? [],
    delegationId: input.delegationId,
    requestReason: input.requestReason,
  }
}
