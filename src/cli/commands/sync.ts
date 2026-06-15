import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync } from "node:fs"
import type { CliCommand, CliCommandContext, CliRouterResult } from "../router.js"
import { hasHelpFlag } from "../shared.js"

/**
 * Resolve the path to `scripts/sync-assets.js` relative to the package root.
 *
 * Works both when running from the dev repo (bin/hivemind.cjs) and when
 * installed as a dependency (node_modules/hivemind/).
 *
 * @returns Absolute path to the sync script, or null if not found.
 */
function resolveSyncScript(): string | null {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const scriptPath = join(currentDir, "../../../scripts/sync-assets.js")
  return existsSync(scriptPath) ? scriptPath : null
}

/**
 * Create the `sync` CLI command.
 *
 * Mirrors the `scripts/sync-assets.js` behavior but exposes it as a
 * first-class CLI command so that `npm run build` no longer couples
 * asset syncing with TypeScript compilation.
 *
 * @returns The `sync` command implementation.
 */
export function createSyncCommand(): CliCommand {
  return {
    name: "sync",
    summary: "Sync assets/ primitives to .opencode/ runtime locations.",
    aliases: ["s"],
    handler: async (ctx) => handleSync(ctx),
  }
}

/** Canonical sync command export. */
export const syncCmd = createSyncCommand()

async function handleSync(ctx: CliCommandContext): Promise<CliRouterResult> {
  if (hasHelpFlag(ctx.flags)) {
    return { exitCode: 0, output: renderSyncHelp() }
  }

  const scriptPath = resolveSyncScript()
  if (scriptPath === null) {
    return {
      exitCode: 70,
      error: "[Hivemind] sync-assets.js not found — run from the package root or reinstall hivemind.",
    }
  }

  const args = [scriptPath]
  if (ctx.flags["mode"] === "install" || ctx.flags["install"] === true) {
    args.push("--mode=install")
  }

  return new Promise((resolve) => {
    const child = spawn("node", args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd(),
      env: { ...process.env, INIT_CWD: process.cwd() },
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 0,
        output: stdout.trim() || undefined,
        error: stderr.trim() || undefined,
      })
    })

    child.on("error", (err) => {
      resolve({
        exitCode: 70,
        error: `[Hivemind] Failed to run sync-assets.js: ${err.message}`,
      })
    })
  })
}

function renderSyncHelp(): string {
  return [
    "Usage: hivemind sync [--mode=install]",
    "",
    "Mirror shipped primitives from assets/ to .opencode/ runtime locations.",
    "User-modified files are backed up before overwrite.",
    "",
    "Flags:",
    "  --mode=install   Run in install mode (non-destructive, preserves user-modified files)",
    "  --help, -h       Show this help message",
  ].join("\n")
}
