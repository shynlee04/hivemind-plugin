/**
 * Hivemind Harness Control Plane — OpenCode plugin loader wrapper.
 *
 * Thin re-export that directs OpenCode to the compiled dist/plugin.js entrypoint.
 * OpenCode discovers this file via the `plugin` field in opencode.json.
 *
 * @example
 * ```json
 * {
 *   "plugin": ["./.opencode/plugins/harness-control-plane.ts"]
 * }
 * ```
 */
export { default } from "../../dist/plugin.js"
