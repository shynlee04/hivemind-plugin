/**
 * Static mode → behavioral profile lookup table.
 *
 * @module behavioral-profile/profiles
 * @description Maps each HivemindMode to a pre-defined BehavioralProfile.
 * Pure data — no computation, no I/O. One lookup per mode.
 *
 * @see D-01, D-02 in CA-02-CONTEXT.md
 */

import type { HivemindMode } from "../../schema-kernel/hivemind-configs.schema.js"
import type { BehavioralProfile } from "./types.js"

/**
 * Static lookup table mapping each HivemindMode to its BehavioralProfile.
 *
 * @example
 * ```typescript
 * const profile = BehavioralProfiles["expert-advisor"]
 * // { guardrailLevel: "moderate", delegationMode: "waiter", ... }
 * ```
 *
 * @see D-01 Static lookup table design decision
 * @see D-02 Default values per mode
 */
export const BehavioralProfiles: Record<HivemindMode, BehavioralProfile> = {
  "expert-advisor": {
    guardrailLevel: "moderate",
    delegationMode: "waiter",
    toolAccessPattern: "full",
    skillFilter: "all",
  },
  "hivemind-powered": {
    guardrailLevel: "strict",
    delegationMode: "waiter",
    toolAccessPattern: "restricted",
    skillFilter: "curated",
  },
  "free-style": {
    guardrailLevel: "minimal",
    delegationMode: "disabled",
    toolAccessPattern: "full",
    skillFilter: "all",
  },
}
