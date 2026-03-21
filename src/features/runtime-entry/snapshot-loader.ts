/**
 * @file snapshot-loader.ts
 * Snapshot loader for runtime bindings - combines settings with runtime state.
 */

import { createBootstrapProfile } from '../../shared/bootstrap-profile.js'
import { detectEntryKernelState } from '../../shared/entry-kernel-state.js'
import { inspectTrajectoryLedger, loadTrajectoryLedger } from '../../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../../core/workflow-management/index.js'
import { CONTROL_PLANE_PROFILE_FIELDS } from '../../control-plane/control-plane-intake.js'
import { loadRuntimeAttachmentSettings, runtimeAttachmentSettingsExist } from './attachment.persistence.js'
import type { RuntimeBindingsSnapshot } from './attachment.types.js'

/**
 * Load a complete runtime bindings snapshot.
 * Combines persisted settings with current runtime state including
 * trajectory, workflow, and health information.
 * @param projectRoot - The project root directory
 * @returns A fully populated RuntimeBindingsSnapshot
 */
export async function loadRuntimeBindingsSnapshot(projectRoot: string): Promise<RuntimeBindingsSnapshot> {
  const settings = await loadRuntimeAttachmentSettings(projectRoot)
  const hasRuntimeAttachment = await runtimeAttachmentSettingsExist(projectRoot)
  const entryKernelState = await detectEntryKernelState(projectRoot)

  const bootstrapProfile = createBootstrapProfile({
    preferredUserName: settings.preferredUserName,
    language: settings.language,
    artifactLanguage: settings.artifactLanguage,
    expertLevel: settings.expertLevel,
    governanceMode: settings.governanceMode,
    automationLevel: settings.automationLevel,
    outputStyle: settings.outputStyle,
  })
  const ledger = await loadTrajectoryLedger(projectRoot)
  const inspection = inspectTrajectoryLedger(projectRoot)
  const activeTrajectory = ledger.trajectories.find((item) => item.id === ledger.activeTrajectoryId)
    ?? ledger.trajectories.find((item) => item.id === ledger.lastClosedTrajectoryId)
    ?? ledger.trajectories.at(-1)
  const workflowId = activeTrajectory?.workflowIds.at(-1)
  const taskIds = activeTrajectory?.taskIds ?? []
  const workflowAuthority = inspectWorkflowAuthority(projectRoot, {
    workflowId,
    taskIds,
    sessionScope: 'main',
    purposeClass: activeTrajectory?.purposeClass ?? settings.defaultPurposeClass,
    lineage: activeTrajectory?.lineage ?? settings.defaultLineage,
  })
  const checkpointId = activeTrajectory?.checkpointIds.at(-1)
  const profileComplete = hasRuntimeAttachment && entryKernelState.profileValidated
  const missingProfileFields = profileComplete ? [] : [...CONTROL_PLANE_PROFILE_FIELDS]
  const interactiveBootstrapRequired = !profileComplete

  return {
    ...settings,
    entryState: entryKernelState.state,
    qaState: entryKernelState.qaState,
    releaseState: entryKernelState.releaseState,
    hasRuntimeAttachment,
    hasHivemind: inspection.exists || workflowAuthority.exists,
    hivemindHealthy: inspection.healthy && workflowAuthority.healthy,
    hasWorkflow: !!workflowId,
    profileComplete,
    missingProfileFields,
    interactiveBootstrapRequired,
    bootstrapProfile,
    trajectoryId: activeTrajectory?.id,
    workflowId,
    taskIds,
    subtaskIds: activeTrajectory?.subtaskIds ?? [],
    checkpointId,
  }
}
