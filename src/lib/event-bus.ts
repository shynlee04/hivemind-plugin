/**
 * Lightweight Event Bus for idumb-v2 in-process engine
 *
 * Uses Node.js built-in EventEmitter - NO external dependencies.
 * Designed for internal event routing within OpenCode plugin lifecycle.
 *
 * @module lib/event-bus
 */

import { EventEmitter } from "events";
import type { ArtifactEvent } from "../schemas/events.js";

// ─── Types ──────────────────────────────────────────────────────────────

export type EventListener = (event: ArtifactEvent) => void;
export type Unsubscribe = () => void;

// ─── Event Bus Class ────────────────────────────────────────────────────

/**
 * Lightweight singleton event bus for in-process events.
 * Uses Node.js EventEmitter under the hood.
 */
class InProcessEventBus extends EventEmitter {
  private static instance: InProcessEventBus | null = null;

  /** Maximum listeners per event type */
  private static readonly MAX_LISTENERS = 50;

  private constructor() {
    super();
    this.setMaxListeners(InProcessEventBus.MAX_LISTENERS);
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): InProcessEventBus {
    if (!InProcessEventBus.instance) {
      InProcessEventBus.instance = new InProcessEventBus();
    }
    return InProcessEventBus.instance;
  }

  /**
   * Emit an artifact event
   */
  emitEvent(event: ArtifactEvent): boolean {
    return this.emit(event.type, event);
  }

  /**
   * Subscribe to a specific event type
   * Returns an unsubscribe function
   */
  subscribe(eventType: string, listener: EventListener): Unsubscribe {
    this.on(eventType, listener);
    return () => this.off(eventType, listener);
  }

  /**
   * Subscribe to all events (wildcard)
   * Returns an unsubscribe function
   */
  subscribeAll(listener: EventListener): Unsubscribe {
    const handler = (event: ArtifactEvent) => listener(event);
    
    // Subscribe to all known event types
    const eventTypes = [
      "file:created",
      "file:modified",
      "file:deleted",
      "artifact:spawned",
      "plugin:activated",
      "plugin:deactivating",
    ];
    
    eventTypes.forEach((type) => this.on(type, handler));
    
    return () => {
      eventTypes.forEach((type) => this.off(type, handler));
    };
  }

  /**
   * Get count of active listeners
   */
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listenerCount(eventType);
    }
    // Total listeners across all events
    return this.eventNames().reduce(
      (sum, name) => sum + this.listenerCount(name),
      0
    );
  }

  /**
   * Clear all listeners (for testing/cleanup)
   */
  clearAll(): void {
    this.removeAllListeners();
  }
}

// ─── Exports ────────────────────────────────────────────────────────────

export const eventBus = InProcessEventBus.getInstance();

/**
 * Create a new artifact event with timestamp
 */
export function createEvent(
  type: ArtifactEvent["type"],
  payload: Record<string, unknown>,
  source: string = "system"
): ArtifactEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    payload,
    source,
  };
}
