// OpenCode Server HTTP Client
import type { ServerHealth, Agent, Session, CommandResult, ServerEvent, TodoItem } from "./types.js";

const BASE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const TIMEOUT_MS = 3000;

async function fetchWithTimeout<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export class OpenCodeApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BASE_URL;
  }

  // Check server health
  async checkHealth(): Promise<ServerHealth | null> {
    try {
      const result = await fetchWithTimeout<ServerHealth>(
        `${this.baseUrl}/global/health`
      );
      return result;
    } catch (error) {
      console.error("Health check failed:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // List all sessions
  async listSessions(): Promise<Session[]> {
    try {
      const result = await fetchWithTimeout<{ sessions: Session[] }>(
        `${this.baseUrl}/session`
      );
      return result.sessions || [];
    } catch (error) {
      console.error("Failed to list sessions:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Get a specific session
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const result = await fetchWithTimeout<Session>(
        `${this.baseUrl}/session/${sessionId}`
      );
      return result;
    } catch (error) {
      console.error("Failed to get session:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Create a new session
  async createSession(title?: string): Promise<Session | null> {
    try {
      const result = await fetchWithTimeout<Session>(`${this.baseUrl}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Dashboard Session" }),
      });
      return result;
    } catch (error) {
      console.error("Failed to create session:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Send a message to a session
  async sendMessage(sessionId: string, message: string): Promise<CommandResult> {
    try {
      const result = await fetchWithTimeout<CommandResult>(
        `${this.baseUrl}/session/${sessionId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        }
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Execute a command in a session
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    try {
      const result = await fetchWithTimeout<CommandResult>(
        `${this.baseUrl}/session/${sessionId}/command`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        }
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Run a shell command in a session
  async runShell(sessionId: string, shellCommand: string): Promise<CommandResult> {
    try {
      const result = await fetchWithTimeout<CommandResult>(
        `${this.baseUrl}/session/${sessionId}/shell`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: shellCommand }),
        }
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // List available agents
  async listAgents(): Promise<Agent[]> {
    try {
      const result = await fetchWithTimeout<{ agents: Agent[] }>(
        `${this.baseUrl}/agent`
      );
      return result.agents || [];
    } catch (error) {
      console.error("Failed to list agents:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Get current project info
  async getProject(): Promise<{ name: string; path: string } | null> {
    try {
      const result = await fetchWithTimeout<{ name: string; path: string }>(
        `${this.baseUrl}/project`
      );
      return result;
    } catch (error) {
      console.error("Failed to get project:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Get session messages
  async getSessionMessages(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const result = await fetchWithTimeout<{ messages: Array<{ role: string; content: string }> }>(
        `${this.baseUrl}/session/${sessionId}/messages`
      );
      return result.messages || [];
    } catch (error) {
      console.error("Failed to get session messages:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // List todos for a session
  async listTodos(sessionId: string): Promise<TodoItem[]> {
    try {
      const result = await fetchWithTimeout<{ todos: TodoItem[] }>(
        `${this.baseUrl}/session/${sessionId}/todos`
      );
      return result.todos || [];
    } catch (error) {
      console.error("Failed to list todos:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Subscribe to Server-Sent Events (if available)
  // Note: This endpoint may not exist on all OpenCode server versions
  subscribeToEvents(
    onEvent: (event: ServerEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    // @ts-ignore - EventSource might not be in standard types but could be polyfilled
    const eventSource = new EventSource(`${this.baseUrl}/event`);
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let cleanup: (() => void) | null = null;

    eventSource.onopen = () => {
      reconnectAttempts = 0;
      console.log("[SSE] Connected to event stream");
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as ServerEvent;
        onEvent(event);
      } catch (parseError) {
        console.error("[SSE] Failed to parse event:", parseError);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection error");
      eventSource.close();
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
        
        reconnectTimeout = setTimeout(() => {
          // Create new subscription and store cleanup function
          cleanup = this.subscribeToEvents(onEvent, onError);
        }, delay);
      } else {
        onError?.(new Error("SSE connection failed after maximum reconnection attempts"));
      }
    };

    // Return cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (cleanup) {
        cleanup();
      }
      eventSource.close();
      console.log("[SSE] Disconnected from event stream");
    };
  }
}

// Default client instance
export const apiClient = new OpenCodeApiClient();
