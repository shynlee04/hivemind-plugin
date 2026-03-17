import type { SupervisorInstanceRegistryRecord } from '../schema-kernel/index.js'
import {
  createSupervisorInstanceRegistry,
  registerSupervisorInstance,
} from './instance-registry.js'

export interface SupervisorHealthSummary {
  overallStatus: 'healthy' | 'degraded' | 'blocked'
  healthyInstances: number
  degradedInstances: number
  blockedInstances: number
}

export interface CreateSupervisorStatusReportInput {
  instanceId: string
  startedAt: string
  lastHeartbeatAt: string
  status: 'healthy' | 'degraded' | 'blocked'
  runtimeAuthority: 'managed-sdk' | 'attached-sdk' | 'none'
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

export interface SupervisorStatusReport {
  registry: SupervisorInstanceRegistryRecord
  health: SupervisorHealthSummary
}

/**
 * Summarize supervisor instance health for status/reporting seams.
 *
 * @param registry Validated supervisor registry.
 * @returns Aggregate health summary.
 */
export function summarizeSupervisorHealth(
  registry: SupervisorInstanceRegistryRecord,
): SupervisorHealthSummary {
  const summary = registry.instances.reduce((accumulator, instance) => {
    if (instance.status === 'healthy') {
      accumulator.healthyInstances += 1
    } else if (instance.status === 'degraded') {
      accumulator.degradedInstances += 1
    } else {
      accumulator.blockedInstances += 1
    }

    return accumulator
  }, {
    healthyInstances: 0,
    degradedInstances: 0,
    blockedInstances: 0,
  })

  const overallStatus = summary.blockedInstances > 0
    ? 'blocked'
    : summary.degradedInstances > 0
      ? 'degraded'
      : 'healthy'

  return {
    overallStatus,
    ...summary,
  }
}

export function createSupervisorStatusReport(
  input: CreateSupervisorStatusReportInput,
): SupervisorStatusReport {
  const registry = registerSupervisorInstance(createSupervisorInstanceRegistry(), input)

  return {
    registry,
    health: summarizeSupervisorHealth(registry),
  }
}
