/**
 * Schema Kernel - Phase 1 Contract Authority
 * 
 * This is the active re-export layer for Phase 1 record contracts.
 * All contracts are authoritative and actively used by consumers.
 * 
 * @see src/schema-kernel/AGENTS.md for sector boundary rules
 */

export * from '../archive/schema-kernel/shared.js'
export * from '../archive/schema-kernel/lifecycle-records.js'
export * from '../archive/schema-kernel/orchestration-records.js'
export * from '../archive/schema-kernel/evidence-records.js'

// Active re-export layer markers
export const SCHEMA_KERNEL_ACTIVE = true
export const SCHEMA_KERNEL_CANONICAL_PATH = 'src/schema-kernel/'
