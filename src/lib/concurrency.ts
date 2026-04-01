type Lane = {
  active: number
  limit: number
  pending: Array<(release: () => void) => void>
}

export function buildDelegationQueueKey(args: {
  model?: string
  agent?: string
  category?: string
}): string {
  const model = args.model?.trim().toLowerCase()
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

export class DelegationConcurrencyQueue {
  private readonly lanes = new Map<string, Lane>()

  constructor(private readonly defaultLimit = 1) {}

  async acquire(key: string, limit = this.defaultLimit): Promise<() => void> {
    const lane = this.getLane(key, limit)

    if (lane.active < lane.limit) {
      lane.active += 1
      return this.makeRelease(key, lane)
    }

    return new Promise((resolve) => {
      lane.pending.push(resolve)
    })
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
      }
      this.lanes.set(key, lane)
    }
    return lane
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

      if (lane.active === 0 && lane.pending.length === 0) {
        this.lanes.delete(key)
      }
    }
  }
}
