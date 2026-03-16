import type {
  EntryKernelQaState,
  EntryKernelReleaseState,
  EntryKernelStateKind,
} from './entry-kernel-state.js'

export interface EntryKernelLifecycle {
  layer: 'entry-kernel'
  phase: 'session-entry'
  state: EntryKernelStateKind
}

export interface RuntimeInvocationLifecycle {
  layer: 'runtime-invocation'
  phase: 'request'
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
}

export interface TurnOutputLifecycle {
  layer: 'turn-output'
  phase: 'completed'
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
  invocationPhase: RuntimeInvocationLifecycle['phase']
}

export function createEntryKernelLifecycle(
  state: EntryKernelStateKind,
): EntryKernelLifecycle {
  return {
    layer: 'entry-kernel',
    phase: 'session-entry',
    state,
  }
}

export function createRuntimeInvocationLifecycle(input: {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
}): RuntimeInvocationLifecycle {
  return {
    layer: 'runtime-invocation',
    phase: 'request',
    entryState: input.entryState,
    qaState: input.qaState,
    releaseState: input.releaseState,
  }
}

export function createTurnOutputLifecycle(input: {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: EntryKernelReleaseState
  invocationPhase: RuntimeInvocationLifecycle['phase']
}): TurnOutputLifecycle {
  return {
    layer: 'turn-output',
    phase: 'completed',
    entryState: input.entryState,
    qaState: input.qaState,
    releaseState: input.releaseState,
    invocationPhase: input.invocationPhase,
  }
}
