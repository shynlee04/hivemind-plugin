import { buildDelegationQueueKey } from "../concurrency/queue.js"

type DelegationConcurrencyKeyArgs = {
  provider?: string
  model?: string
  agent?: string
}

// Runtime adoption of this shared key flow happens in plan 16-04.
export function resolveDelegationConcurrencyKey(args: DelegationConcurrencyKeyArgs): string {
  return buildDelegationQueueKey(args)
}
