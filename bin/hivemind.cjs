#!/usr/bin/env node
/**
 * `hivemind-tools` CLI entrypoint (Phase 40 / PH40-01).
 *
 * This shim is intentionally CommonJS so that npm's `bin` resolution
 * works on every supported Node major without depending on
 * `package.json` `type: module` semantics. All real logic lives in the
 * compiled ESM module at `dist/cli/index.js`; this file only exists to
 * forward argv into `runCli()` and propagate its exit code.
 *
 * Failure modes:
 *   - `dist/cli/index.js` missing  → exit 70 (`EX_SOFTWARE`) with a
 *     `[Harness]` message instructing the caller to run `npm run build`.
 *   - Uncaught error inside `runCli`  → exit 70 with the `[Harness]`-
 *     prefixed message.
 */

"use strict"

const path = require("node:path")
const { pathToFileURL } = require("node:url")

const compiledEntry = path.join(__dirname, "..", "dist", "cli", "index.js")

import(pathToFileURL(compiledEntry).href)
  .then(async (mod) => {
    if (typeof mod.runCli !== "function") {
      process.stderr.write(
        "[Harness] CLI entry dist/cli/index.js does not export runCli — run `npm run build`.\n",
      )
      process.exit(70)
    }
    const argv = process.argv.slice(2)
    const exitCode = await mod.runCli(argv)
    process.exit(typeof exitCode === "number" ? exitCode : 0)
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`[Harness] CLI startup failed: ${message}\n`)
    process.exit(70)
  })
