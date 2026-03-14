import type { PluginInput } from "@opencode-ai/plugin";
import type { OpencodeClient, Project } from "@opencode-ai/sdk";
import { createLogger, noopLogger } from "../lib/logging.js";
import { getEffectivePaths } from "../lib/paths.js";
import {
  _setSdkRefs,
  _resetSdkRefs,
} from "../lib/sdk-access.js";

// Re-export pure accessors from lib so existing hook consumers don't break
export {
  getClient,
  getShell,
  getServerUrl,
  isSdkAvailable,
} from "../lib/sdk-access.js";

// --- Hook-local State ---
// Project is hook-only (no lib file needs it), so it stays here.
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
  _setSdkRefs(input.client, input.$, input.serverUrl);
  _project = input.project;
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
  // Import getClient at call-time to avoid circular reference issues
  const { getClient } = await import("../lib/sdk-access.js");
  const client = getClient() as OpencodeClient | null;
  
  if (!client) {
    return fallback ?? undefined;
  }

  try {
    return await fn(client);
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
  _resetSdkRefs();
  _project = null;
}
