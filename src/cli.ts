#!/usr/bin/env node
/**
 * HiveMind CLI — One-command initialization and management.
 *
 * Usage:
 *   npx hivemind-context-governance          — Initialize (default)
 *   npx hivemind-context-governance init      — Same as above
 *   npx hivemind-context-governance status    — Show current brain state
 *
 * CRITICAL: NO console.log in library code. CLI is the ONLY
 * place where console output is allowed (it IS the user interface).
 */

import { argv } from "node:process"
import { initProject } from "./cli/init.js"
import { createStateManager, loadConfig } from "./lib/persistence.js"
import { listArchives } from "./lib/planning-fs.js"

const COMMANDS = ["init", "status", "compact", "dashboard", "help"] as const
type Command = (typeof COMMANDS)[number]

function printHelp(): void {
  const help = `
HiveMind Context Governance — CLI

Usage:
  npx hivemind-context-governance [command] [options]

Commands:
  (default)     Initialize HiveMind in current project
  init          Same as default — initialize project
  status        Show current session and governance state
  compact       Archive current session and reset
  dashboard     Launch dashboard server
  help          Show this help message

Options:
  --lang <en|vi>           Language (default: en)
  --mode <permissive|assisted|strict>  Governance mode (default: assisted)
  --expert <beginner|intermediate|advanced|expert>  Expert level (default: intermediate)
  --style <explanatory|outline|skeptical|architecture|minimal>  Output style (default: explanatory)
  --code-review            Require code review before accepting
  --tdd                    Enforce test-driven development

Examples:
  npx hivemind-context-governance
  npx hivemind-context-governance --mode strict --lang vi
  npx hivemind-context-governance status
`
  // CLI is the user interface — console output is allowed here
  // eslint-disable-next-line no-console
  console.log(help)
}

async function showStatus(directory: string): Promise<void> {
  const stateManager = createStateManager(directory)
  const config = await loadConfig(directory)
  const state = await stateManager.load()

  if (!state) {
    // eslint-disable-next-line no-console
    console.log("No active session. Run 'npx hivemind-context-governance' first.")
    return
  }

  const archives = await listArchives(directory)

  const status = `
┌─ HiveMind Status ────────────────────────┐
│ Session: ${state.session.id.padEnd(30)}│
│ Status:  ${state.session.governance_status.padEnd(30)}│
│ Mode:    ${state.session.mode.padEnd(30)}│
│ Govern:  ${config.governance_mode.padEnd(30)}│
├─ Hierarchy ──────────────────────────────┤
│ Trajectory: ${(state.hierarchy.trajectory || "(none)").padEnd(27)}│
│ Tactic:     ${(state.hierarchy.tactic || "(none)").padEnd(27)}│
│ Action:     ${(state.hierarchy.action || "(none)").padEnd(27)}│
├─ Metrics ────────────────────────────────┤
│ Turns:   ${String(state.metrics.turn_count).padEnd(30)}│
│ Drift:   ${(state.metrics.drift_score + "/100").padEnd(30)}│
│ Files:   ${String(state.metrics.files_touched.length).padEnd(30)}│
│ Updates: ${String(state.metrics.context_updates).padEnd(30)}│
│ Archive: ${(archives.length + " sessions").padEnd(30)}│
└──────────────────────────────────────────┘
`
  // eslint-disable-next-line no-console
  console.log(status)
}

async function main(): Promise<void> {
  const args = argv.slice(2)

  // Parse flags from all args
  const flags: Record<string, string> = {}
  const positionalArgs: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      flags[args[i].slice(2)] = args[i + 1]
      i++
    } else if (args[i].startsWith("--")) {
      flags[args[i].slice(2)] = ""
    } else {
      positionalArgs.push(args[i])
    }
  }

  // Handle --help / -h flag before command dispatch
  if ("help" in flags || "h" in flags) {
    printHelp()
    return
  }

  // Default to "init" when no command given (npx hivemind-context-governance)
  const command = (positionalArgs[0] ?? "init") as Command
  const directory = process.cwd()

  switch (command) {
    case "init":
      await initProject(directory, {
        language: (flags["lang"] as "en" | "vi") ?? undefined,
        governanceMode:
          (flags["mode"] as "permissive" | "assisted" | "strict") ?? undefined,
        expertLevel: (flags["expert"] as "beginner" | "intermediate" | "advanced" | "expert") ?? undefined,
        outputStyle: (flags["style"] as "explanatory" | "outline" | "skeptical" | "architecture" | "minimal") ?? undefined,
        requireCodeReview: "code-review" in flags,
        enforceTdd: "tdd" in flags,
      })
      break

    case "status":
      await showStatus(directory)
      break

    case "compact":
      // eslint-disable-next-line no-console
      console.log("Manual compaction: use compact_session tool within OpenCode.")
      break

    case "dashboard": {
      // Lazy-load dashboard to avoid pulling heavy deps on init/status
      const { createDashboardServer } = await import("./dashboard/server.js")
      const port = flags["port"] ? parseInt(flags["port"], 10) : undefined
      const server = createDashboardServer(directory, { port })
      try {
        await server.start()
        // eslint-disable-next-line no-console
        console.log(`HiveMind Dashboard running at ${server.url}`)
        // eslint-disable-next-line no-console
        console.log(`\nPress Ctrl+C to stop`)

        // Keep running until interrupted
        await new Promise(() => {
          process.on("SIGINT", async () => {
            // eslint-disable-next-line no-console
            console.log("\nShutting down...")
            await server.stop()
            process.exit(0)
          })
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to start dashboard:", err)
        process.exit(1)
      }
      break
    }

    case "help":
      printHelp()
      break

    default:
      // eslint-disable-next-line no-console
      console.log(`Unknown command: ${command}`)
      printHelp()
      break
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Error:", err)
  process.exit(1)
})
