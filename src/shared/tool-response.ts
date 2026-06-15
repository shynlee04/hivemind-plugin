/**
 * Standard tool-response envelope. All prompt-enhance tools return this
 * shape so that the pipeline can uniformly detect success, error, and
 * pending states.
 */
export type ToolResponse<T = unknown> = {
  kind: "success" | "error" | "pending"
  message: string
  data?: T
  metadata?: Record<string, unknown>
}

/**
 * Create a success response.
 * @param message - Human-readable status message
 * @param data - Optional payload data
 * @param metadata - Optional diagnostic metadata
 */
export function success<T>(
  message: string,
  data?: T,
  metadata?: Record<string, unknown>,
): ToolResponse<T> {
  return { kind: "success", message, data, metadata }
}

/**
 * Create an error response.
 * @param message - Human-readable error message
 * @param data - Optional payload data (e.g. partial results)
 * @param metadata - Optional diagnostic metadata
 */
export function error<T>(
  message: string,
  data?: T,
  metadata?: Record<string, unknown>,
): ToolResponse<T> {
  return { kind: "error", message, data, metadata }
}

/**
 * Create a pending response (operation in progress).
 * @param message - Human-readable status message
 * @param data - Optional payload data
 * @param metadata - Optional diagnostic metadata
 */
export function pending<T>(
  message: string,
  data?: T,
  metadata?: Record<string, unknown>,
): ToolResponse<T> {
  return { kind: "pending", message, data, metadata }
}

/**
 * Type guard: true if response is a success.
 */
export function isSuccess(
  response: ToolResponse,
): response is ToolResponse & { kind: "success" } {
  return response.kind === "success"
}

/**
 * Type guard: true if response is an error.
 */
export function isError(
  response: ToolResponse,
): response is ToolResponse & { kind: "error" } {
  return response.kind === "error"
}
