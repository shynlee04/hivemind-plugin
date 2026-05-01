/**
 * Sidecar Next.js configuration — Phase 42 foundation stub.
 *
 * This file is deliberately minimal. SIDECAR-01 dashboard tabs and
 * SIDECAR-02 OpenCode SDK bridge wiring will extend this configuration
 * (e.g. `serverActions`, custom rewrites for the SDK proxy) in
 * follow-up phases.
 *
 * Per Phase 42 PLAN.md, Next.js itself is **not installed** by the
 * foundation PR — this config exists so the directory layout is
 * complete and the typed configuration shape is locked in.
 */

import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  // The sidecar must never bundle harness write paths. The actual
  // SIDECAR-03 enforcement lives at ../src/sidecar/readonly-state.ts
  // and is consumed by sidecar code via the harness package.
}

export default config
