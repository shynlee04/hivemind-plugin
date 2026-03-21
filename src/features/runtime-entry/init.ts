/**
 * Runtime Entry Initialization Module
 *
 * This module has been decomposed into smaller, focused modules:
 * - init.types.ts - Type definitions (InitOptions, InitProjectResult)
 * - init.helpers.ts - Helper functions (buildInitReport, createRuntimeId)
 * - init-project.ts - Project initialization entry point (initProject)
 * - init.handler.ts - Main handler (runInitHandler) - kept coupled due to deep dependencies
 *
 * @see init.types.ts for type definitions
 * @see init.helpers.ts for helper functions
 * @see init-project.ts for the initProject entry point
 * @see init.handler.ts for runInitHandler
 */

import type { LoadedCommandAsset } from './instruction-loader.js'

// Re-export all public APIs for backward compatibility
export { type InitOptions, type InitProjectResult } from './init.types.js'
export { buildInitReport, createRuntimeId } from './init.helpers.js'
export { initProject } from './init-project.js'
export { runInitHandler } from './init.handler.js'

// Type re-export for consumers that depend on this type
export type { LoadedCommandAsset }
