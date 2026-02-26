// OpenCode Server API Types

export interface ServerHealth {
  healthy: boolean;
  version: string;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
}

export interface Session {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

export interface SessionMessage {
  role: string;
  content: string;
  createdAt?: string;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Server-Sent Events types (for future SSE support)
// Note: OpenCode server does not currently expose /event SSE endpoint
// These types are defined for potential future implementation
export interface ServerEvent {
  type: "session.status" | "message.part.updated" | "todo.updated" | "file.changed" | "agent.activated";
  timestamp: string;
  payload: Record<string, unknown>;
}

// Dashboard state for SSE connection
export interface SseConnectionState {
  connected: boolean;
  lastEventTime: string | null;
  reconnectAttempts: number;
}

// Todo item from server
export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "complete" | "blocked";
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
}
