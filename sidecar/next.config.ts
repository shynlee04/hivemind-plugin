/**
 * Sidecar Next.js 16 configuration — standalone output for the Hivemind
 * sidecar dashboard.
 *
 * The sidecar runs as a separate process from the plugin HTTP server,
 * communicating exclusively via localhost HTTP through plugin-client.
 *
 * NOTE — Next.js 16 removed the top-level `server: { host, port }` config
 * key. Host and port now live on the CLI in `package.json`:
 *   `"dev": "next dev -H 127.0.0.1 -p 3099"`
 * This file therefore only configures non-network settings plus the
 * `turbopack.root` directive that silences the multi-lockfile detection
 * warning (the sidecar sits inside a monorepo that has its own
 * `package-lock.json`).
 *
 * Implementation note — this file uses CommonJS `require` and
 * `module.exports` rather than ESM `import` / `export default`. The
 * Next.js 16 config loader transpiles to CJS internally, and writing
 * the file in CJS style avoids a "exports is not defined in ES module
 * scope" interop failure at dev-server startup.
 *
 * @see {@link ../src/sidecar/server/} for the plugin-side server routes.
 */

import type { NextConfig } from "next"
import * as path from "node:path"

const sidecarRoot = __dirname

const config: NextConfig = {
  reactStrictMode: true,

  /** Standalone output for production deployment without Vercel. */
  output: "standalone",

  /**
   * Bind turbopack's working directory to the sidecar root so it
   * picks the sidecar's own `package-lock.json` instead of the
   * monorepo root's lockfile. This silences the "We detected
   * multiple lockfiles" warning at `next dev` startup.
   */
  turbopack: {
    root: sidecarRoot,
  },

  /** CORS headers for localhost plugin communication. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "http://127.0.0.1:3099" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ]
  },
}

// CommonJS export — works with Next.js 16's CJS transpilation pipeline
// and avoids the "exports is not defined in ES module scope" interop
// failure when the loader compiles this file.
module.exports = config
