/**
 * Thin wrapper re-exporting the built harness plugin.
 *
 * OpenCode loads this file via .opencode/plugins/harness-control-plane.ts
 * during development. Production builds reference dist/plugin.js directly.
 */
export { HarnessControlPlane as default, HarnessControlPlane } from "../../dist/plugin.js"
