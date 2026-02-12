/**
 * Hook barrel exports — HiveMind governance hooks
 * 
 */

export { createSessionLifecycleHook } from "./session-lifecycle.js"
export { createSoftGovernanceHook } from "./soft-governance.js"
export { createToolGateHook } from "./tool-gate.js"
export { createCompactionHook } from "./compaction.js"
export { createEventHandler } from "./event-handler.js"

export {
  initSdkContext,
  getClient,
  getShell,
  getServerUrl,
  getProject,
  withClient,
  resetSdkContext,
  isSdkAvailable,
} from "./sdk-context.js"