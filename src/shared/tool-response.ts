/**
 * Standard tool response format
 * Ensures consistent output from all HiveMind tools
 */

export interface ToolResponse<T = unknown> {
  status: 'success' | 'error' | 'pending'
  message: string
  data?: T
  metadata?: Record<string, unknown>
}

// Factory functions
export function success<T>(message: string, data?: T, metadata?: Record<string, unknown>): ToolResponse<T> {
  return { status: 'success', message, data, metadata }
}

export function error<T>(message: string, data?: T, metadata?: Record<string, unknown>): ToolResponse<T> {
  return { status: 'error', message, data, metadata }
}

export function pending<T>(message: string, data?: T, metadata?: Record<string, unknown>): ToolResponse<T> {
  return { status: 'pending', message, data, metadata }
}

// Type guards
export function isSuccess<T>(response: ToolResponse<T>): boolean {
  return response.status === 'success'
}

export function isError<T>(response: ToolResponse<T>): boolean {
  return response.status === 'error'
}
