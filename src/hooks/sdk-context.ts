import type { PluginInput } from "@opencode-ai/plugin";
import type { OpencodeClient, Project } from "@opencode-ai/sdk";
import { createLogger, noopLogger } from "../lib/logging.js";
import { getEffectivePaths } from "../lib/paths.js";

type BunShell = PluginInput["$"];

// --- Module State (Singleton) ---
// Stores SDK references without calling any methods on them.
// This avoids the deadlock risk of calling client.* during plugin initialization.
// See: Pitfall 2 in SDK documentation.

let _client: OpencodeClient | null = null;
let _shell: BunShell | null = null;
let _serverUrl: URL | null = null;
let _project: Project | null = null;
let _logger = noopLogger;
let _loggerInitialized = false;

/**
 * Lazily initializes the logger on first use.
 */
async function initializeLogger(): Promise<void> {
  if (_loggerInitialized) {
    return;
  }

  try {
    const projectRoot = process.cwd();
    const paths = getEffectivePaths(projectRoot);
    _logger = await createLogger(paths.logsDir, "sdk-context");
  } catch {
    _logger = noopLogger;
  } finally {
    _loggerInitialized = true;
  }
}

/**
 * Initialize the SDK context with references from the plugin input.
 * This should be called exactly once at the start of the plugin execution.
 * 
 * @param input - The plugin input containing client, shell, serverUrl, and project.
 */
export function initSdkContext(input: Pick<PluginInput, "client" | "$" | "serverUrl" | "project">) {
  _client = input.client;
  _shell = input.$;
  _serverUrl = input.serverUrl;
  _project = input.project;

  // Log only if client is available (avoiding client log calls here, just console for debug if needed, 
  // but strictly speaking we should avoid side effects. The plan says "Log note" but 
  // also "Do NOT call any client.* methods". I'll skip logging to be safe or use console.error for debug)
  // Actually, the plan says: "Log note: 'SDK context initialized' only if client is truthy."
  // But since we can't use client.log yet safely if this is called during init...
  // I will rely on the caller (index.ts) to do the logging as per Task 2.
}

/**
 * Get the SDK client instance.
 * Hooks and tools should call this at execution time, not at import time.
 * 
 * @returns The OpencodeClient instance or null if not initialized.
 */
export function getClient(): OpencodeClient | null {
  return _client;
}

/**
 * Get the BunShell instance.
 * 
 * @returns The BunShell instance or null if not initialized.
 */
export function getShell(): BunShell | null {
  return _shell;
}

/**
 * Get the Server URL.
 * 
 * @returns The Server URL or null if not initialized.
 */
export function getServerUrl(): URL | null {
  return _serverUrl;
}

/**
 * Get the Project instance.
 * 
 * @returns The Project instance or null if not initialized.
 */
export function getProject(): Project | null {
  return _project;
}

/**
 * Execute a function with the SDK client if available, otherwise return a fallback.
 * This provides a graceful degradation path for when the plugin is running in a context
 * where the SDK is not available (e.g. tests or limited environments).
 * 
 * @param fn - The function to execute with the client.
 * @param fallback - The value to return if the client is not available or if execution fails.
 * @returns The result of fn or the fallback value.
 */
export async function withClient<T>(
  fn: (client: OpencodeClient) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  if (!_client) {
    return fallback ?? undefined;
  }

  try {
    return await fn(_client);
  } catch (err: unknown) {
    // Initialize logger if not already done
    await initializeLogger();
    
    const errorMessage = err instanceof Error 
      ? `SDK client error: ${err.message}\n${err.stack}`
      : `SDK client error: ${String(err)}`;
    
    await _logger.error(errorMessage);
    
    return fallback ?? undefined;
  }
}

/**
 * Reset the SDK context to its initial state.
 * Useful for testing and hot-reload scenarios.
 */
export function resetSdkContext() {
  _client = null;
  _shell = null;
  _serverUrl = null;
  _project = null;
}

/**
 * Check if the SDK client is available.
 * 
 * @returns True if the client is initialized, false otherwise.
 */
export function isSdkAvailable(): boolean {
  return _client !== null;
}
