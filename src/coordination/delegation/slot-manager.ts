import { DelegationConcurrencyQueue } from "../concurrency/queue.js"
import type { SlotInfo } from "./types.js"

export interface AcquireOpts {
  acquireTimeoutMs?: number
}

export interface SlotHandle {
  id: string
  sessionId: string
  queueKey: string
  release: () => void
}

export interface SlotManagerOptions {
  acquireTimeoutMs?: number
  maxSlotsPerSession?: number
  perKeyLimit?: number
  queue?: DelegationConcurrencyQueue
  queueLimit?: number
}

/**
 * Enforces per-session and per-key delegation slot limits before dispatch.
 *
 * @example
 * ```typescript
 * const manager = new SlotManager({ maxSlotsPerSession: 10 })
 * const handle = await manager.acquire("parent", "agent:builder")
 * manager.release(handle)
 * ```
 */
export class SlotManager {
  private readonly activeBySession = new Map<string, Map<string, SlotHandle>>()
  private nextSlotId = 0
  private readonly maxSlotsPerSession: number
  private readonly perKeyLimit: number
  private readonly acquireTimeoutMs: number
  private readonly queue: DelegationConcurrencyQueue
  private readonly queueLimit: number

  constructor(options: SlotManagerOptions = {}) {
    this.maxSlotsPerSession = options.maxSlotsPerSession ?? 10
    this.perKeyLimit = options.perKeyLimit ?? 2
    this.acquireTimeoutMs = options.acquireTimeoutMs ?? 5_000
    this.queueLimit = options.queueLimit ?? this.perKeyLimit
    this.queue = options.queue ?? new DelegationConcurrencyQueue(this.queueLimit)
  }

  /** Acquire a tracked slot for the parent session and queue key. */
  async acquire(sessionId: string, queueKey: string, opts?: AcquireOpts): Promise<SlotHandle> {
    const sessionSlots = this.activeBySession.get(sessionId) ?? new Map<string, SlotHandle>()
    if (sessionSlots.size >= this.maxSlotsPerSession) {
      throw new Error(`[Harness] Delegation slot limit reached for session ${sessionId}: ${sessionSlots.size}/${this.maxSlotsPerSession} active.`)
    }
    if (this.countQueueKey(sessionSlots, queueKey) >= this.perKeyLimit) {
      throw new Error(`[Harness] Per-key delegation slot limit reached for session ${sessionId} and queue ${queueKey}: ${this.perKeyLimit}/${this.perKeyLimit} active.`)
    }

    let released = false
    const handle: SlotHandle = { id: `${sessionId}:${++this.nextSlotId}`, sessionId, queueKey, release: () => { /* pending acquire */ } }
    sessionSlots.set(this.handleKey(handle), handle)
    this.activeBySession.set(sessionId, sessionSlots)

    let releaseQueue: () => void
    try {
      releaseQueue = await this.queue.acquire(queueKey, this.queueLimit, opts?.acquireTimeoutMs ?? this.acquireTimeoutMs)
    } catch (error) {
      sessionSlots.delete(this.handleKey(handle))
      if (sessionSlots.size === 0) this.activeBySession.delete(sessionId)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[Harness] Delegation slot acquire timed out for session ${sessionId} and queue ${queueKey}: ${message}`)
    }

    handle.release = () => {
      if (released) return
      released = true
      sessionSlots.delete(this.handleKey(handle))
      releaseQueue()
      if (sessionSlots.size === 0) this.activeBySession.delete(sessionId)
    }
    return handle
  }

  /** Release a previously acquired slot and clean empty tracking maps. */
  release(handle: SlotHandle): void {
    handle.release()
  }

  /** Return an immutable snapshot of current slot usage for a session. */
  getSlotInfo(sessionId: string): SlotInfo {
    const sessionSlots = this.activeBySession.get(sessionId) ?? new Map<string, SlotHandle>()
    const perKeyUsage = new Map<string, number>()
    for (const handle of sessionSlots.values()) {
      perKeyUsage.set(handle.queueKey, (perKeyUsage.get(handle.queueKey) ?? 0) + 1)
    }
    return { acquired: sessionSlots.size, maxSlots: this.maxSlotsPerSession, perKeyUsage }
  }

  private countQueueKey(sessionSlots: Map<string, SlotHandle>, queueKey: string): number {
    return Array.from(sessionSlots.values()).filter((handle) => handle.queueKey === queueKey).length
  }

  private handleKey(handle: SlotHandle): string {
    return handle.id
  }
}
