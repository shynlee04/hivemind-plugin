/**
 * Sidecar Next.js 16 configuration — standalone output, port 3099.
 *
 * The sidecar runs as a separate process from the plugin HTTP server,
 * communicating exclusively via localhost HTTP through plugin-client.
 *
 * @see {@link ../src/sidecar/server/} for the plugin-side server routes.
 */

import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,

  /** Standalone output for production deployment without Vercel. */
  output: "standalone",

  /** Bind to localhost:3099, distinct from the plugin server's random port. */
  server: {
    host: "127.0.0.1",
    port: parseInt(process.env.PORT || "3099", 10),
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
