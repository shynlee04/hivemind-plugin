import { loadTrajectoryLedger } from '../../core/index.js'
import {
  activateWorkflowTask,
  inspectWorkflowAuthority,
  listWorkflowTasks,
  type TaskRecord,
} from '../../core/workflow-management/index.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'

import { resolveEntityBindings, resolveRuntimeIds } from './handler-shared.js'
import type { LoadedCommandAsset } from './instruction-loader.js'

type WorkflowHandlerPhase = 'planning' | 'implementation'

interface WorkflowHandlerSummary {
  activeTaskIds: string[]
  pendingTaskIds: string[]
  taskStatuses: Array<{ id: string; status: TaskRecord['status'] }>
}

function summarizeCanonicalTasks(tasks: TaskRecord[]): WorkflowHandlerSummary {
  return {
    activeTaskIds: tasks.filter((task) => task.status === 'in_progress').map((task) => task.id),
    pendingTaskIds: tasks.filter((task) => task.status === 'pending').map((task) => task.id),
    taskStatuses: tasks.map((task) => ({ id: task.id, status: task.status })),
  }
}

function ensureLinkedTaskProjection(projectRoot: string, workflowId: string, input: CommandExecutionInput): TaskRecord[] {
  const [primaryTaskId] = input.taskIds ?? []
  let tasks = listWorkflowTasks(projectRoot, workflowId)

  if (primaryTaskId && !tasks.some((task) => task.id === primaryTaskId)) {
    activateWorkflowTask(projectRoot, {
      workflowId,
      taskId: primaryTaskId,
      title: primaryTaskId,
    })
    tasks = listWorkflowTasks(projectRoot, workflowId)
  }

  return tasks
}

async function runWorkflowCommandHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
  phase: WorkflowHandlerPhase,
): Promise<CommandExecutionResult> {
  const trajectoryLedger = await loadTrajectoryLedger(input.projectRoot)
  const ids = resolveRuntimeIds(input, trajectoryLedger.activeTrajectoryId)
  const authority = inspectWorkflowAuthority(input.projectRoot, {
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    sessionScope: input.sessionScope,
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })

  if (!authority.healthy) {
    return {
      commandId: bundle.id,
      title: bundle.title,
      agent: bundle.agent,
      executionMode: 'handler',
      contract: asset.contract,
      report: {
        status: 'blocked',
        workflow_phase: phase,
        workflow_authority_issues: authority.issues,
        next_command: authority.exists ? 'hm-doctor' : 'hm-init',
        safetyLevel: bundle.pressureContract.safety.level,
        failureBehavior: bundle.pressureContract.failureBehavior,
        expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      },
      entityBindings: {
        ...resolveEntityBindings(input),
        trajectoryId: ids.trajectoryId,
        workflowId: ids.workflowId,
      },
      stateTransitions: ['workflow-command-handler-blocked'],
      artifactRefs: authority.evidenceRefs,
      closeoutStatus: 'blocked',
      verificationContractId: asset.contract.verificationContract,
      pressureContract: bundle.pressureContract,
    }
  }

  const canonicalTasks = ensureLinkedTaskProjection(input.projectRoot, ids.workflowId, input)
  const summary = summarizeCanonicalTasks(canonicalTasks)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: 'ready',
      workflow_phase: phase,
      canonical_task_state: summary.taskStatuses,
      active_task_ids: summary.activeTaskIds,
      pending_task_ids: summary.pendingTaskIds,
      next_command: bundle.id === 'hm-plan' ? 'hm-implement' : undefined,
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: ['workflow-command-handler-executed'],
    artifactRefs: authority.evidenceRefs,
    closeoutStatus: 'ready',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

export function runPlanHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runWorkflowCommandHandler(bundle, asset, input, 'planning')
}

export function runImplementHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runWorkflowCommandHandler(bundle, asset, input, 'implementation')
}
