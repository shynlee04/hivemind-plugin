/**
 * Canonical compaction bounds shared between Zod schema validation and runtime enforcement.
 *
 * These constants are the single source of truth for agent-work-contract field limits.
 * The Zod schema in `src/schema-kernel/agent-work-contract.schema.ts` imports these values
 * for `.max()` validation, and `operations.ts` imports them for runtime bounding.
 *
 * @module bounds
 */

/** Maximum character length for contract briefing field. */
export const BRIEFING_LIMIT = 1_200

/** Maximum character length for contract summary field. */
export const SUMMARY_LIMIT = 1_200

/** Maximum character length for reinjection payload field. */
export const REINJECTION_LIMIT = 2_400

/** Maximum array length for anchors and sourceRefs arrays. */
export const ANCHOR_LIMIT = 20
