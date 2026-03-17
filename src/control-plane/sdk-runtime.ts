import { createOpencode, createOpencodeClient, type OpencodeClient, type ServerOptions } from '@opencode-ai/sdk'

import type { RuntimeAuthority } from '../shared/runtime-attachment.js'

export interface RuntimeAuthorityRecord {
  runtimeAuthority: RuntimeAuthority
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

export interface CreateManagedRuntimeInput {
  sessionId: string
  serverOptions?: ServerOptions
  closeAfterCreate?: boolean
  createLifecycle?: typeof createOpencode
}

export interface ManagedRuntimeResult extends RuntimeAuthorityRecord {
  runtimeAuthority: 'managed-sdk'
  runtimeInstanceId: string
  serverBaseUrl: string
}

export interface AttachManagedRuntimeInput {
  baseUrl: string
  directory?: string
  runtimeInstanceId?: string
  createClient?: typeof createOpencodeClient
}

export interface AttachedRuntimeResult extends RuntimeAuthorityRecord {
  runtimeAuthority: 'attached-sdk'
  serverBaseUrl: string
  client: OpencodeClient
}

function buildRuntimeInstanceId(sessionId: string, serverBaseUrl: string): string {
  return `managed-sdk:${sessionId}:${serverBaseUrl}`
}

/**
 * Create a managed OpenCode runtime through the official SDK lifecycle.
 *
 * This Phase 1 helper records authoritative runtime identity fields while
 * keeping lifecycle ownership in the control plane instead of local-only
 * attachment flags.
 *
 * @param input Managed runtime creation settings.
 * @returns Managed runtime authority fields derived from the SDK lifecycle.
 */
export async function createManagedRuntime(
  input: CreateManagedRuntimeInput,
): Promise<ManagedRuntimeResult> {
  const lifecycle = input.createLifecycle ?? createOpencode
  const runtime = await lifecycle(input.serverOptions)
  const serverBaseUrl = runtime.server.url
  const runtimeInstanceId = buildRuntimeInstanceId(input.sessionId, serverBaseUrl)

  if (input.closeAfterCreate ?? true) {
    runtime.server.close()
  }

  return {
    runtimeAuthority: 'managed-sdk',
    runtimeInstanceId,
    serverBaseUrl,
  }
}

/**
 * Attach to an existing OpenCode runtime through the official SDK client.
 *
 * @param input Existing runtime connection settings.
 * @returns Attached runtime authority fields and SDK client.
 */
export function attachManagedRuntime(
  input: AttachManagedRuntimeInput,
): AttachedRuntimeResult {
  const createClient = input.createClient ?? createOpencodeClient
  const client = createClient({
    baseUrl: input.baseUrl,
    directory: input.directory,
  })

  return {
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: input.runtimeInstanceId,
    serverBaseUrl: input.baseUrl,
    client,
  }
}
