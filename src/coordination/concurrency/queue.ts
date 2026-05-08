import type { TaskStateManager } from "../../shared/state.js"
import { MAX_DESCENDANTS_PER_ROOT } from "../../shared/types.js"

// ---------------------------------------------------------------------------
// Internal lane type for DelegationConcurrencyQueue
// ---------------------------------------------------------------------------

type Lane = {
  active: number
  limit: number
  pending: Array<(release: () => void) => void>
  queued: {
    high: QueuedTask[]
    normal: QueuedTask[]
  }
}

/** Resolver wrapper stored in a lane while an acquire waits for release. */
type PendingAcquire = (release: () => void) => void

export type QueuePriority = "high" | "normal"

export type QueuedTask = {
  id: string
  key: string
  createdAt: number
  priority?: QueuePriority
}

export function buildDelegationQueueKey(args: {
  provider?: string
  model?: string
  agent?: string
  category?: string
}): string {
  const provider = args.provider?.trim().toLowerCase()
  const model = args.model?.trim().toLowerCase()
  if (provider && model) {
    return `provider:${provider}:model:${model}`
  }

  if (model) {
    return `model:${model}`
  }

  const agent = args.agent?.trim().toLowerCase()
  const category = args.category?.trim().toLowerCase()
  if (agent && category) {
    return `agent:${agent}:category:${category}`
  }

  if (agent) {
    return `agent:${agent}`
  }

  if (category) {
    return `category:${category}`
  }

  return "default"
}

export const DEFAULT_CONCURRENCY_LIMIT = 3

export class DelegationConcurrencyQueue {
  private readonly lanes = new Map<string, Lane>()

  constructor(private readonly defaultLimit = DEFAULT_CONCURRENCY_LIMIT) {}

  async acquire(
    key: string,
    limit = this.defaultLimit,
    timeoutMs?: number,
  ): Promise<() => void> {
    const lane = this.getLane(key, limit)

    if (lane.active < lane.limit) {
      lane.active += 1
      return this.makeRelease(key, lane)
    }

    if (timeoutMs !== undefined && timeoutMs > 0) {
      return new Promise<() => void>((resolve, reject) => {
        const pendingAcquire: PendingAcquire = (release: () => void) => {
          clearTimeout(timer)
          resolve(release)
        }

        const timer = setTimeout(() => {
          const idx = lane.pending.indexOf(pendingAcquire)
          if (idx >= 0) {
            lane.pending.splice(idx, 1)
          }
          this.cleanupLane(key, lane)
          reject(
            new Error(
              `[Harness] Concurrency acquire timed out for key "${key}" after ${timeoutMs}ms.`,
            ),
          )
        }, timeoutMs)

        lane.pending.push(pendingAcquire)
      })
    }

    return new Promise((resolve) => {
      lane.pending.push(resolve)
    })
  }

  enqueue(task: QueuedTask): void {
    const lane = this.getLane(task.key, this.defaultLimit)
    const priority = this.normalizePriority(task.priority)
    lane.queued[priority].push({
      ...task,
      priority,
    })
  }

  dequeue(key: string, taskID?: string): QueuedTask | undefined {
    const lane = this.lanes.get(key)
    if (!lane) {
      return undefined
    }

    const next = taskID
      ? this.removeQueuedTaskByID(lane, taskID)
      : this.shiftQueuedTask(lane)

    this.cleanupLane(key, lane)
    return next
  }

  peek(key: string): QueuedTask | undefined {
    const lane = this.lanes.get(key)
    if (!lane) {
      return undefined
    }

    return lane.queued.high[0] ?? lane.queued.normal[0]
  }

  queueSize(key: string): number {
    const lane = this.lanes.get(key)
    if (!lane) {
      return 0
    }

    return lane.queued.high.length + lane.queued.normal.length
  }

  snapshot(key: string): { active: number; pending: number; limit: number } {
    const lane = this.lanes.get(key)
    return {
      active: lane?.active ?? 0,
      pending: lane?.pending.length ?? 0,
      limit: lane?.limit ?? this.defaultLimit,
    }
  }

  private getLane(key: string, limit: number): Lane {
    let lane = this.lanes.get(key)
    if (!lane) {
      lane = {
        active: 0,
        limit,
        pending: [],
        queued: {
          high: [],
          normal: [],
        },
      }
      this.lanes.set(key, lane)
    }
    return lane
  }

  private normalizePriority(priority?: QueuePriority): QueuePriority {
    return priority === "high" ? "high" : "normal"
  }

  private shiftQueuedTask(lane: Lane): QueuedTask | undefined {
    return lane.queued.high.shift() ?? lane.queued.normal.shift()
  }

  private removeQueuedTaskByID(lane: Lane, taskID: string): QueuedTask | undefined {
    const highIndex = lane.queued.high.findIndex((task) => task.id === taskID)
    if (highIndex >= 0) {
      return lane.queued.high.splice(highIndex, 1)[0]
    }

    const normalIndex = lane.queued.normal.findIndex((task) => task.id === taskID)
    if (normalIndex >= 0) {
      return lane.queued.normal.splice(normalIndex, 1)[0]
    }

    return undefined
  }

  private cleanupLane(key: string, lane: Lane): void {
    if (
      lane.active === 0 &&
      lane.pending.length === 0 &&
      lane.queued.high.length === 0 &&
      lane.queued.normal.length === 0
    ) {
      this.lanes.delete(key)
    }
  }

  private makeRelease(key: string, lane: Lane): () => void {
    let released = false

    return () => {
      if (released) {
        return
      }
      released = true

      const next = lane.pending.shift()
      if (next) {
        next(this.makeRelease(key, lane))
        return
      }

      lane.active = Math.max(0, lane.active - 1)

      this.cleanupLane(key, lane)
    }
  }
}

// ---------------------------------------------------------------------------
// SpawnReservation — budget-aware reservation for subagent spawning
// ---------------------------------------------------------------------------

/**
 * A single reservation against the descendant budget of a root session.
 *
 * Lifecycle:
 *  - Created by {@link reserveSubagentSpawn}.
 *  - {@link release} — the spawn succeeded; the reservation is consumed.
 *  - {@link rollback} — the spawn was abandoned; restores the reserved slot.
 *
 * Both methods are idempotent; calling either after the other is a no-op.
 */
export interface SpawnReservation {
  /** Session ID of the direct parent that initiated the spawn. */
  readonly parentID: string
  /** Root session ID whose descendant budget was reserved against. */
  readonly rootID: string
  /** Unix timestamp (ms) recorded at reservation creation. */
  readonly reservedAt: number
  /**
   * Marks the reservation as consumed (spawn succeeded).
   * The budget slot remains occupied — it is not rolled back.
   * Idempotent: subsequent calls are silently ignored.
   */
  release(): void
  /**
   * Cancels the reservation and returns the budget slot.
   * Use when the spawn was abandoned before the session started.
   * Idempotent: subsequent calls are silently ignored.
   */
  rollback(): void
}

/**
 * Attempt to reserve one descendant slot in the root session budget.
 *
 * Throws a `[Harness]`-prefixed error if the budget is exhausted.
 *
 * @param parentSessionID - The session ID of the calling (parent) agent.
 * @param rootID          - The root session whose budget is being charged.
 * @param taskState       - The shared {@link TaskStateManager} instance.
 * @param maxDescendants  - Override for the per-root limit (default: {@link MAX_DESCENDANTS_PER_ROOT}).
 */
export function reserveSubagentSpawn(
  parentSessionID: string,
  rootID: string,
  taskState: TaskStateManager,
  maxDescendants: number = MAX_DESCENDANTS_PER_ROOT,
): SpawnReservation {
  // Throws if over budget — propagate immediately so caller can handle it.
  taskState.reserveDescendant(rootID, maxDescendants)

  // Once either release() or rollback() has been called the reservation is
  // settled. All subsequent calls on either method are ignored.
  let settled = false

  return {
    parentID: parentSessionID,
    rootID,
    reservedAt: Date.now(),

    release(): void {
      if (settled) return
      settled = true
      // The slot is intentionally kept as "reserved" in the budget because the
      // caller is expected to follow up with taskState.commitDescendant() once
      // the new session ID is known. release() simply prevents rollback().
    },

    rollback(): void {
      if (settled) return
      settled = true
      taskState.rollbackReservation(rootID)
    },
  }
}
