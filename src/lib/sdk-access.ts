/**
 * SDK Access — Pure accessor functions for SDK references.
 *
 * Lives in lib/ so other lib files can import without CQRS violation.
 * State initialization happens in hooks/sdk-context.ts which calls _setSdkRefs.
 */
type BunShell = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
type SdkClientRef = unknown;

let _client: SdkClientRef | null = null;
let _shell: BunShell | null = null;
let _serverUrl: URL | null = null;

/**
 * Get the SDK client instance.
 * Hooks and tools should call this at execution time, not at import time.
 */
export function getClient(): SdkClientRef | null {
  return _client;
}

/**
 * Get the BunShell instance.
 */
export function getShell(): BunShell | null {
  return _shell;
}

/**
 * Get the Server URL.
 */
export function getServerUrl(): URL | null {
  return _serverUrl;
}

/**
 * Check if the SDK client is available.
 */
export function isSdkAvailable(): boolean {
  return _client !== null;
}

/**
 * Set SDK references — called by hooks/sdk-context.ts during init.
 * NOT for direct use by tools or lib consumers.
 */
export function _setSdkRefs(
  client: SdkClientRef | null,
  shell: BunShell | null,
  serverUrl: URL | null
) {
  _client = client;
  _shell = shell;
  _serverUrl = serverUrl;
}

/**
 * Reset SDK references — called by hooks/sdk-context.ts during reset.
 */
export function _resetSdkRefs() {
  _client = null;
  _shell = null;
  _serverUrl = null;
}
