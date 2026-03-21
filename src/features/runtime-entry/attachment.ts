/**
 * @file attachment.ts
 * Runtime attachment module - re-exports from decomposed sub-modules.
 *
 * This file maintains backward compatibility by re-exporting all types and functions
 * from the decomposed modules. New code should import directly from sub-modules.
 */

// Types
export type {
  AttachmentCore,
  RuntimeAuthority,
  AttachmentRuntimeAuthority,
  AttachmentProfile,
  AttachmentFeatures,
  RuntimeAttachmentSettings,
  RuntimeBindingsSnapshot,
  RuntimeAttachmentEntryDefaults,
  RuntimeAttachmentEntryAuthority,
  RuntimeAttachmentEntryProfile,
  RuntimeAttachmentEntryBindings,
  RuntimeAttachmentEntryKernel,
  RuntimeAttachmentEntryKernelSource,
} from './attachment.types.js'

// Defaults
export { getRuntimeAttachmentSettingsPath, defaultRuntimeAttachmentSettings } from './attachment.defaults.js'

// Builder
export {
  normalizeRuntimeAuthority,
  normalizeOptionalString,
  mergeStringArray,
  buildRuntimeAttachmentEntryKernel,
} from './attachment.builder.js'

// Persistence
export {
  loadRuntimeAttachmentSettings,
  saveRuntimeAttachmentSettings,
  runtimeAttachmentSettingsExist,
  saveBootstrapRuntimeAttachmentSettings,
} from './attachment.persistence.js'

// Snapshot
export { loadRuntimeBindingsSnapshot } from './snapshot-loader.js'
