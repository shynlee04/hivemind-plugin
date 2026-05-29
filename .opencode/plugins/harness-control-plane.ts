/**
 * Thin wrapper re-exporting the built harness plugin.
 *
 * OpenCode auto-loads .opencode/plugins/*.ts files at startup.
 * This file bridges the compiled dist/plugin.js into the plugin directory.
 */
export { HarnessControlPlane as default, HarnessControlPlane } from "../../dist/plugin.js"
