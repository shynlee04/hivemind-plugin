import type { PluginInput } from '@opencode-ai/plugin'

type ClientRef = PluginInput['client']
type ShellRef = PluginInput['$']

export interface AttachedSdkAuthority {
  runtimeAuthority: 'attached-sdk'
  serverBaseUrl: string
}

let clientRef: ClientRef | null = null
let shellRef: ShellRef | null = null
let serverUrlRef: URL | null = null
let projectRef: PluginInput['project'] | null = null

/**
 * Initialize hook-local SDK references from the active OpenCode plugin context.
 *
 * @param input Plugin input containing client, shell, server URL, and project references.
 */
export function initSdkContext(input: Pick<PluginInput, 'client' | '$' | 'serverUrl' | 'project'>): void {
  clientRef = input.client
  shellRef = input.$
  serverUrlRef = input.serverUrl
  projectRef = input.project
}

/**
 * Reset all cached SDK references.
 */
export function resetSdkContext(): void {
  clientRef = null
  shellRef = null
  serverUrlRef = null
  projectRef = null
}

export function getClient(): ClientRef | null {
  return clientRef
}

export function getShell(): ShellRef | null {
  return shellRef
}

export function getServerUrl(): URL | null {
  return serverUrlRef
}

export function getServerBaseUrl(): string | undefined {
  if (!serverUrlRef) {
    return undefined
  }

  return serverUrlRef.origin
}

export function getAttachedSdkAuthority(): AttachedSdkAuthority | null {
  const serverBaseUrl = getServerBaseUrl()
  if (!serverBaseUrl) {
    return null
  }

  return {
    runtimeAuthority: 'attached-sdk',
    serverBaseUrl,
  }
}

export function getProject(): PluginInput['project'] | null {
  return projectRef
}

export function isSdkAvailable(): boolean {
  return !!clientRef && !!shellRef && !!serverUrlRef
}

/**
 * Execute a function with the active SDK client if available.
 *
 * @param fn Async function that requires the SDK client.
 * @param fallback Optional fallback value when the client is unavailable or fails.
 * @returns Function result or fallback.
 */
export async function withClient<T>(
  fn: (client: ClientRef) => Promise<T>,
  fallback?: T,
): Promise<T | undefined> {
  if (!clientRef) {
    return fallback
  }

  try {
    return await fn(clientRef)
  } catch {
    return fallback
  }
}
