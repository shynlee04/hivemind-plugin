import {
  supervisorInstanceRegistrySchema,
  type SupervisorInstanceRegistryRecord,
} from '../schema-kernel/index.js'

export interface RegisterSupervisorInstanceInput {
  instanceId: string
  status: 'healthy' | 'degraded' | 'blocked'
  runtimeAuthority: 'managed-sdk' | 'attached-sdk' | 'none'
  runtimeInstanceId?: string
  serverBaseUrl?: string
  startedAt: string
  lastHeartbeatAt: string
}

/**
 * Create the additive Phase 1 supervisor registry baseline.
 *
 * @returns Empty validated supervisor registry.
 */
export function createSupervisorInstanceRegistry(): SupervisorInstanceRegistryRecord {
  return supervisorInstanceRegistrySchema.parse({
    version: 'v1',
    instances: [],
  })
}

/**
 * Register or refresh a same-local-env supervisor instance.
 *
 * @param registry Current validated registry snapshot.
 * @param input Instance details to upsert.
 * @returns Updated validated registry snapshot.
 */
export function registerSupervisorInstance(
  registry: SupervisorInstanceRegistryRecord,
  input: RegisterSupervisorInstanceInput,
): SupervisorInstanceRegistryRecord {
  const nextInstances = registry.instances.filter((instance) => instance.instanceId !== input.instanceId)
  nextInstances.push({
    ...input,
    transport: 'same-local-env',
  })

  return supervisorInstanceRegistrySchema.parse({
    version: 'v1',
    instances: nextInstances,
  })
}
