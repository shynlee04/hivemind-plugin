/**
 * Hivemind plugin bridge for the **local clone** install path.
 *
 * ## Why this file exists
 *
 * OpenCode auto-loads `.opencode/plugins/*.ts` files at startup via **Bun**,
 * which runs TypeScript natively (no build step required). The OpenCode SDK
 * expects a default export that is a function with the OpenCode `Plugin`
 * signature — see `@opencode-ai/plugin` for the full type.
 *
 * This bridge re-exports `HivemindControlPlane` from `src/plugin.ts` directly
 * so that a fresh clone of this repository can run `opencode` (after
 * `npm install`, which triggers the postinstall asset sync via
 * `node scripts/sync-assets.js --mode=install`) **without first running
 * `npm run build`**. Bun resolves the `../../src/plugin.ts` import at load
 * time and JIT-compiles it.
 *
 * ## Local install path (this bridge)
 *
 * ```bash
 * git clone <repo>
 * cd hivemind-plugin-private
 * npm install   # runs the postinstall asset sync
 * opencode      # Bun loads .opencode/plugins/harness-control-plane.ts directly
 * ```
 *
 * ## npm distribution path (different code path)
 *
 * End users who `npm install hivemind-3.0` get the **published** package,
 * which exposes the compiled `dist/plugin.js` via `package.json#exports["./plugin"]`.
 * Their `opencode.json` references it as `"plugin": "hivemind-3.0"` and
 * OpenCode loads `dist/plugin.js` from `node_modules/hivemind-3.0/` — that
 * code path does NOT go through this bridge. This file only matters for
 * contributors running OpenCode from inside the cloned source tree.
 *
 * ## Source-of-truth note
 *
 * This file lives in `assets/plugins/` (the source) and is mirrored to
 * `.opencode/plugins/` by `scripts/sync-assets.js`. Edit here, never in
 * `.opencode/plugins/` directly — that directory is regenerable.
 */
export { HivemindControlPlane as default, HivemindControlPlane } from "../../src/plugin.ts"
