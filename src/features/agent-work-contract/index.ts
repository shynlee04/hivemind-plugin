/**
 * Agent-Work Contract Feature Barrel Export
 *
 * Public interface for the Agent-Work Contract feature.
 * Exports all schemas, types, and future engine/hook/tool implementations.
 *
 * @module agent-work-contract
 */

// Schema exports - Zod schemas and their inferred types
export * from './schema/index.js'

// Type exports - TypeScript interfaces for operations
export * from './types.js'

// Stable feature root exports only. Feature-local tool factories stay on
// sub-barrels until they are promoted through runtime authority sync.
export * from './hooks/index.js'
