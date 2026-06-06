/**
 * dev-server.test.ts — TDD regression guard for the 3 user-reported sidecar flaws
 * that block `npm run dev` (Next.js 16).
 *
 * Flaws locked in this test (per `.hivemind/planning/sidecar-flaws-fix-2026-06-06/00-landscape.md`):
 *
 * 1. CRITICAL — `src/app/page.tsx` is a Server Component but uses
 *    `next/dynamic({ ssr: false })` directly. In Next.js 16, `ssr: false`
 *    is forbidden in Server Components. Causes `GET / 500 in 3.7s`.
 *    Fix: move the dynamic import into a Client Component wrapper
 *    (`src/app/page-wrapper.tsx`) and render that from `page.tsx`.
 *
 * 2. WARNING — `next.config.ts` uses a top-level `server: { host, port }`
 *    key which is unrecognized in Next.js 16 (moved to CLI args).
 *    Fix: remove the `server` key from config; pass `-H` and `-p` via
 *    the `dev` script in `package.json`.
 *
 * 3. WARNING — `tsconfig.json` is auto-modified by Next.js 16 to add
 *    the Next.js dev-mode type definitions entry to `include`. The
 *    auto-edit is correct and must be preserved in the committed config.
 *
 * 4. OPTIONAL — `turbopack.root` directive silences the multi-lockfile
 *    detection warning when the sidecar lives inside a monorepo.
 *
 * Test evidence level: L2 (test output) + L3 (file inspection).
 * Runtime behavior (L1) is covered by the separate smoke-test step
 * (see SUMMARY.md), not by this vitest run, because `next dev` is
 * process-bound and slow to bring up from inside vitest.
 *
 * @module sidecar/tests/dev-server
 */

import { describe, it, expect, beforeAll } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const SIDECAR_ROOT = resolve(__dirname, "..")

/** Absolute path to a sidecar source file. */
function p(relPath: string): string {
  return resolve(SIDECAR_ROOT, relPath)
}

/** Read a sidecar file as UTF-8 string. */
function read(relPath: string): string {
  return readFileSync(p(relPath), "utf8")
}

describe("sidecar dev-server flaws (Next.js 16)", () => {
  describe("flaw 1: ssr:false in Server Component", () => {
    it("page.tsx exists and is a Server Component (no 'use client' directive)", () => {
      const src = read("src/app/page.tsx")
      // First non-comment line should NOT be "use client"
      // Strip leading JSDoc/comment block(s)
      const stripped = src.replace(/^(\s*\/\*[\s\S]*?\*\/\s*)+/, "")
      const firstLine = stripped.split("\n", 1)[0]?.trim() ?? ""
      expect(firstLine).not.toBe('"use client"')
    })

    it("page.tsx does NOT directly contain 'ssr: false' (must live in client wrapper)", () => {
      const src = read("src/app/page.tsx")
      expect(src).not.toMatch(/ssr:\s*false/)
    })

    it("page.tsx imports and renders the PageWrapper client component", () => {
      const src = read("src/app/page.tsx")
      expect(src).toMatch(/from\s+["']\.\/page-wrapper["']/)
      // The default export should render <PageWrapper />
      expect(src).toMatch(/<PageWrapper\b/)
    })

    it("page-wrapper.tsx exists as the new Client Component boundary", () => {
      const wrapperPath = p("src/app/page-wrapper.tsx")
      expect(existsSync(wrapperPath)).toBe(true)
      const src = read("src/app/page-wrapper.tsx")
      // Must declare "use client" at the top (first non-comment line)
      const stripped = src.replace(/^(\s*\/\*[\s\S]*?\*\/\s*)+/, "")
      const firstLine = stripped.split("\n", 1)[0]?.trim() ?? ""
      expect(firstLine).toBe('"use client"')
      // Must contain the ssr: false directive that was forbidden in page.tsx
      expect(src).toMatch(/ssr:\s*false/)
      // Must import dynamic from next/dynamic
      expect(src).toMatch(/import\s+dynamic\s+from\s+["']next\/dynamic["']/)
      // Must wrap the dynamic import in a named export
      expect(src).toMatch(/export\s+function\s+PageWrapper\b/)
    })
  })

  describe("flaw 2: server key in next.config.ts (Next.js 16 removed it)", () => {
    it("next.config.ts does NOT contain a top-level 'server' key", () => {
      const src = read("next.config.ts")
      // Match 'server:' at the start of a line (object key), not 'serverRuntimeConfig'
      // or other words that contain 'server' as a substring.
      // Negative lookbehind: not preceded by a word char (to exclude 'serverRuntimeConfig')
      // Negative lookahead: not 'RuntimeConfig' after the colon
      const lines = src.split("\n")
      const offending = lines.find((line) =>
        /^\s*server\s*:\s*\{/.test(line) && !/serverRuntimeConfig/.test(line),
      )
      expect(offending, `Found offending 'server' key: ${offending ?? ""}`).toBeUndefined()
    })

    it("package.json dev script passes -H 127.0.0.1 and -p 3099 to next dev", () => {
      const pkg = JSON.parse(read("package.json")) as {
        scripts?: Record<string, string>
      }
      const devScript = pkg.scripts?.dev ?? ""
      expect(devScript).toMatch(/next\s+dev/)
      expect(devScript, "dev script must pin host to 127.0.0.1").toMatch(/-H\s+127\.0\.0\.1/)
      expect(devScript, "dev script must pin port to 3099").toMatch(/-p\s+3099/)
    })
  })

  describe("flaw 3: tsconfig.json auto-modified by Next.js 16", () => {
    let tsconfig: { include?: string[] }

    beforeAll(() => {
      tsconfig = JSON.parse(read("tsconfig.json")) as { include?: string[] }
    })

    it("tsconfig.json 'include' contains '.next/dev/types/**/*.ts'", () => {
      const include = tsconfig.include ?? []
      expect(include).toContain(".next/dev/types/**/*.ts")
    })

    it("tsconfig.json still includes core source globs (no regression)", () => {
      const include = tsconfig.include ?? []
      expect(include).toContain("src/**/*.ts")
      expect(include).toContain("src/**/*.tsx")
    })
  })

  describe("optional: turbopack.root silences multi-lockfile warning", () => {
    it("next.config.ts declares turbopack.root so the sidecar lockfile wins", () => {
      const src = read("next.config.ts")
      // Must declare a turbopack block with a root key
      expect(src).toMatch(/turbopack\s*:\s*\{/)
      expect(src).toMatch(/root\s*:/)
    })
  })
})
