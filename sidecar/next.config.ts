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
 * @see {@link ../src/sidecar/server/} for the plugin-side server routes.
 */

import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Reconstruct __dirname in an ESM-safe way (Next.js 16 may load
// this file as ESM at build time).
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    root: __dirname,
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

export default config
