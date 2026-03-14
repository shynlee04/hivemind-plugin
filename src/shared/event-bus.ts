/**
 * Simple event bus for cross-module communication
 * Decouples modules that need to react to events
 */

type EventHandler = (event: unknown) => void | Promise<void>

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()

  on(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) || []
    handlers.push(handler)
    this.handlers.set(event, handlers)
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }
  }

  async emit(event: string, data: unknown): Promise<void> {
    const handlers = this.handlers.get(event) || []
    for (const handler of handlers) {
      await handler(data)
    }
  }

  once(event: string, handler: EventHandler): void {
    const wrappedHandler = async (data: unknown) => {
      this.off(event, wrappedHandler)
      await handler(data)
    }
    this.on(event, wrappedHandler)
  }
}

// Global event bus instance
export const eventBus = new EventBus()
