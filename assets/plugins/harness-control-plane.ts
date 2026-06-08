/**
 * Thin wrapper re-exporting the harness plugin source.
 *
 * OpenCode auto-loads .opencode/plugins/*.ts files at startup via Bun, which
 * runs TypeScript natively. Importing directly from src/plugin.ts eliminates
 * the build-step requirement for the local-install path: a fresh clone can
 * run `opencode` after `npm install` (which runs the postinstall asset sync)
 * without needing to first run `npm run build`.
 *
 * For the npm-distribution path, users install the published `hivemind-3.0`
 * package and reference it via `"plugin": ["hivemind-3.0"]` in their
 * opencode.json — that path loads `dist/plugin.js` from the published
 * package, not this bridge.
 */
export { HivemindControlPlane as default, HivemindControlPlane } from "../../src/plugin.ts"
