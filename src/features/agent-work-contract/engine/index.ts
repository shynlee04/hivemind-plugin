/**
 * Agent-Work Contract Engine Layer
 *
 * Barrel export for engine components.
 * Provides business logic layer for Agent-Work Contract feature.
 *
 * @module agent-work-contract/engine
 */

// Contract Store - Persistence with atomic operations
export { ContractStore } from './contract-store.js'

// Intent Classifier - Regex-based purpose classification
export { classifyIntent } from './intent-classifier.js'

// Response Mode Resolver - Deterministic mapping
export { resolveResponseMode } from './response-mode-resolver.js'

// Anchor Recorder - Decision tracking
export { recordAnchor } from './anchor-recorder.js'

// Chain Executor - Action dispatch
export { ChainExecutor } from './chain-executor.js'
export type { ChainActionHandler } from './chain-executor.js'