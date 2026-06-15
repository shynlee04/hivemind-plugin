import type { z } from "zod"

import type { DelegationResult, DelegationStatus } from "../../coordination/delegation/types.js"
import type { DelegateTaskV2Schema } from "./delegate-task.js"
import type { DelegationControlSchema } from "./delegation-status.js"

/** Input accepted by the delegate-task v2 tool boundary. */
export type DelegateTaskV2Input = z.infer<typeof DelegateTaskV2Schema>

/** Control actions supported by delegation-status v2. */
export type DelegationControlAction = z.infer<typeof DelegationControlSchema>

/** Serializable v2 status payload returned by delegation-status. */
export interface DelegationStatusV2Output {
  delegationId: string
  status: DelegationStatus
  agent: string
  elapsedMs: number | null
  elapsedHuman: string | null
  progressPct: number | null
  childMessageCount?: number | null
  escalationLevel?: string | null
  result?: DelegationResult["result"]
  error?: DelegationResult["error"]
}
