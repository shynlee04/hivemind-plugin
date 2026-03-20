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

// Engine, hooks, and tools remain task-gated for subsequent work
// export * from './engine/index.js'
// export * from './hooks/index.js'
// export * from './tools/index.js'
