#!/usr/bin/env node
/**
 * HiveMind CLI — One-command initialization and management.
 *
 * Usage:
 *   npx hivemind-context-governance          — Interactive setup wizard
 *   npx hivemind-context-governance init      — Same as above (or flags for non-interactive)
 *   npx hivemind-context-governance status    — Show current brain state
 *   npx hivemind-context-governance settings  — Show current configuration
 *   npx hivemind-context-governance dashboard — Launch live TUI dashboard
 *
 * CRITICAL: NO console.log in library code. CLI is the ONLY
 * place where console output is allowed (it IS the user interface).
 */

import { argv } from "node:process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { initProject } from "./cli/init.js"
import { runHarnessCommand } from "./cli/harness.js"
import { resolveCliInvocation } from "./cli/command-routing.js"
import { updateProjectSettings } from "./cli/settings.js"
import { syncOpencodeAssets } from "./cli/sync-assets.js"
import type { AssetSyncProfile } from "./cli/sync-assets.js"
import { runScanCommand } from "./cli/scan.js"
import { normalizeAutomationLabel } from "./schemas/config.js"
import { createStateManager, loadConfig } from "./lib/persistence.js"
import { listArchives } from "./lib/planning-fs.js"
import { getEffectivePaths } from "./lib/paths.js"
import { migrateToGraph, isGraphMigrationNeeded } from "./lib/graph-migrate.js"
import { runDoctorRecovery } from "./lib/doctor-recovery.js"
import { runHiveFiverIntakeBridge } from "./cli/hivefiver-intake.js"

function printHelp(): void {
  const help = `
HiveMind Context Governance — CLI

Usage:
  npx hivemind-context-governance [command] [options]
  hm-init [options]
  hm-doctor [options]
  hm-settings [options]
  hm-harness [options]

Commands:
  (default)     Interactive setup wizard (or initialize with flags)
  init          Same as default — initialize project
  migrate       Migrate legacy flat files to graph structure (explicit, one-time)
  scan          Brownfield scan wrapper (analyze/recommend/orchestrate/status)
  sync-assets   Sync packaged OpenCode assets into .opencode/ (existing users)
  doctor        Diagnose/repair .hivemind lineage integrity
  hivefiver-intake Compatibility bridge for legacy /hivefiver startup scripts
  status        Show current session and governance state
  settings      Show or update current configuration
  harness       Inspect OpenCode server readiness and write meta-module artifacts
  compact       Archive current session and reset (OpenCode only)
  dashboard     Launch live TUI dashboard
  purge         Remove .hivemind/ entirely and unregister plugin
  help          Show this help message

Options:
  --force                  Force re-initialization (removes existing .hivemind/)
  --lang <en|vi>           Language (default: en)
  --mode <permissive|assisted|strict>  Governance mode (default: assisted)
  --automation <manual|guided|assisted|full|coach>  Automation level (default: assisted)
  --expert <beginner|intermediate|advanced|expert>  Expert level (default: intermediate)
  --style <explanatory|outline|skeptical|architecture|minimal>  Output style (default: explanatory)
  --code-review            Require code review before accepting
  --tdd                    Enforce test-driven development
  --sync-mode <prompt|none|core|balanced|full>  Init sync behavior (default: prompt)
  --target <project|global|both>  Asset sync target (default: project)
  --profile <beginner|intermediate|advanced|expert|coach>  Init/settings profile preset
  --overwrite              Overwrite existing files during asset sync
  --backup-on-overwrite    Backup replaced files as .bak.<timestamp>
  --include-legacy         Include legacy compatibility command surfaces
  --prune                  Remove mirrored files not present in selected profile
  --strict-parity          Fail when scoped profile parity mismatches remain
  --emit-inventory         Emit per-group inventory in sync output
  --skip-agent-permission-schema  Skip strict agent permission schema validation
  --allow-invalid-critical-assets Continue sync even when critical assets are invalid
  --doctor-mode <report|repair>  Doctor mode (default: report)
  --dry-run                Compute doctor actions without writing repair changes
  --hard-reset             Doctor repair with forensic snapshot + canonical manifest rebuild
  --server-url <url>       Harness server URL (default: OPENCODE_SERVER_URL or http://127.0.0.1:4096)
  --timeout-ms <ms>        Harness server health timeout in milliseconds
  --refresh <seconds>      Dashboard refresh interval (default: 2)
  --action <status|analyze|recommend|orchestrate>  Scan action (default: analyze, for scan command)
  --text <value>           Input text for hivefiver-intake bridge actions
  --json                   Return machine-readable JSON (for scan command)
  --include-drift          Include drift report (status action)

Command-specific notes:
  sync-assets --profile <core|balanced|full|legacy-compat>
  settings    Re-run with any config flags to update live settings
  harness     Writes dated files under .hivemind/meta-module/

Examples:
  npx hivemind-context-governance              # Interactive wizard
  npx hivemind-context-governance --mode strict # Non-interactive with flags
  npx hivemind-context-governance status
  npx hivemind-context-governance settings
  npx hivemind-context-governance scan --action analyze --json
  npx hivemind-context-governance dashboard
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
│ Auto:    ${normalizeAutomationLabel(config.automation_level).padEnd(30)}│
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

async function showSettings(directory: string): Promise<void> {
  const p = getEffectivePaths(directory)
  const configPath = p.config

  if (!existsSync(configPath)) {
    // eslint-disable-next-line no-console
    console.log("No HiveMind configuration found.")
    // eslint-disable-next-line no-console
    console.log("Run 'npx hivemind-context-governance' to initialize.")
    return
  }

  const config = await loadConfig(directory)

  const settings = `
┌─ HiveMind Settings ─────────────────────────────┐
│                                                  │
│ Governance Mode:    ${config.governance_mode.padEnd(28)}│
│ Language:           ${config.language.padEnd(28)}│
│ Automation Level:   ${normalizeAutomationLabel(config.automation_level).padEnd(28)}│
│                                                  │
├─ Agent Behavior ─────────────────────────────────┤
│ Expert Level:       ${config.agent_behavior.expert_level.padEnd(28)}│
│ Output Style:       ${config.agent_behavior.output_style.padEnd(28)}│
│ Response Language:  ${config.agent_behavior.language.padEnd(28)}│
│                                                  │
├─ Constraints ────────────────────────────────────┤
│ Code Review:        ${(config.agent_behavior.constraints.require_code_review ? "Yes" : "No").padEnd(28)}│
│ TDD Enforced:       ${(config.agent_behavior.constraints.enforce_tdd ? "Yes" : "No").padEnd(28)}│
│ Max Tokens:         ${String(config.agent_behavior.constraints.max_response_tokens).padEnd(28)}│
│                                                  │
├─ Thresholds ─────────────────────────────────────┤
│ Drift Warning:      ${(config.max_turns_before_warning + " turns").padEnd(28)}│
│ Long Session:       ${(config.auto_compact_on_turns + " turns (warning)").padEnd(28)}│
│ Max Session Lines:  ${(config.max_active_md_lines + " lines").padEnd(28)}│
│ Stale Session:      ${(config.stale_session_days + " days").padEnd(28)}│
│ Commit Suggestion:  ${(config.commit_suggestion_threshold + " files").padEnd(28)}│
│                                                  │
└──────────────────────────────────────────────────┘

  Config file: ${configPath}
  To change settings, edit config.json or re-run 'npx hivemind init'.
`
  // eslint-disable-next-line no-console
  console.log(settings)
}

/**
 * Detect whether any flags were passed (besides the command itself).
 * If no flags → use interactive wizard. If flags → use direct init.
 */
function hasInitFlags(flags: Record<string, string>): boolean {
  const initFlagNames = [
    "lang",
    "mode",
    "automation",
    "expert",
    "style",
    "code-review",
    "tdd",
    "profile",
    "target",
    "sync-mode",
    "overwrite",
  ]
  return initFlagNames.some((name) => name in flags)
}

function hasSettingsFlags(flags: Record<string, string>): boolean {
  const settingsFlagNames = [
    "lang",
    "mode",
    "automation",
    "expert",
    "style",
    "code-review",
    "tdd",
    "profile",
  ]
  return settingsFlagNames.some((name) => name in flags)
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

  const { command, remainingArgs } = resolveCliInvocation(argv[1], positionalArgs)
  const directory = process.cwd()
  const forceFlag = "force" in flags

  switch (command) {
    case "init": {
      // If no flags provided (besides --force) → launch interactive wizard
      if (!hasInitFlags(flags) && !forceFlag) {
        try {
          const { runInteractiveInit } = await import("./cli/interactive-init.js")
          const options = await runInteractiveInit()
          if (options) {
            await initProject(directory, options)
          }
        } catch (err: unknown) {
          // Fallback to non-interactive if clack can't load (e.g., non-TTY)
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes("Cannot find module") || msg.includes("Cannot find package")) {
            // eslint-disable-next-line no-console
            console.log("Interactive mode unavailable. Using defaults.")
            await initProject(directory, {})
          } else {
            throw err
          }
        }
      } else {
        // Flags provided → direct init (non-interactive)
        await initProject(directory, {
          language: (flags["lang"] as "en" | "vi") ?? undefined,
          governanceMode:
            (flags["mode"] as "permissive" | "assisted" | "strict") ?? undefined,
          automationLevel: flags["automation"] ?? undefined,
          expertLevel: (flags["expert"] as "beginner" | "intermediate" | "advanced" | "expert") ?? undefined,
          outputStyle: (flags["style"] as "explanatory" | "outline" | "skeptical" | "architecture" | "minimal") ?? undefined,
          requireCodeReview: "code-review" in flags,
          enforceTdd: "tdd" in flags,
          syncTarget: (flags["target"] as "project" | "global" | "both") ?? undefined,
          syncMode: (flags["sync-mode"] as "prompt" | "none" | "core" | "balanced" | "full") ?? undefined,
          overwriteAssets: "overwrite" in flags,
          backupAssetsOnOverwrite: "backup-on-overwrite" in flags,
          profile: flags["profile"] as any,
          force: forceFlag,
        })
      }
      break
    }

    case "sync-assets": {
      const result = await syncOpencodeAssets(directory, {
        target: (flags["target"] as "project" | "global" | "both") ?? "project",
        profile: (flags["profile"] as AssetSyncProfile) ?? "core",
        overwrite: "overwrite" in flags,
        backupOnOverwrite: "backup-on-overwrite" in flags,
        includeLegacy: "include-legacy" in flags,
        prune: "prune" in flags,
        strictParity: "strict-parity" in flags,
        emitInventory: "emit-inventory" in flags,
        validateAgentPermissionSchema: !("skip-agent-permission-schema" in flags),
        failOnInvalidCriticalAssets: !("allow-invalid-critical-assets" in flags),
        silent: false,
        onLog: (line) => console.log(line),
      })
      console.log(
        `\n✓ Asset sync complete. Profile: ${result.profile}. Copied: ${result.totalCopied}, Skipped: ${result.totalSkipped}, Invalid: ${result.totalInvalid}, Schema invalid: ${result.totalSchemaInvalid}, Pruned: ${result.totalPruned}, Parity mismatches: ${result.totalParityMismatches}`
      )
      if ("emit-inventory" in flags && result.inventory) {
        console.log(JSON.stringify(result.inventory, null, 2))
      }
      break
    }

    case "doctor": {
      const result = await runDoctorRecovery(directory, {
        mode: (flags["doctor-mode"] as "report" | "repair") ?? "report",
        dryRun: "dry-run" in flags,
        hardReset: "hard-reset" in flags,
      })
      console.log(`Doctor mode: ${result.mode}`)
      console.log(`Generated: ${result.generatedAt}`)
      console.log(`Broken: ${result.broken ? "yes" : "no"}`)
      console.log(`Selected session: ${result.selectedSessionId ?? "(none)"}`)
      console.log(`Issues: ${result.issues.length}`)
      for (const issue of result.issues) {
        console.log(`  - [${issue.severity}] ${issue.code}: ${issue.message}`)
      }
      if (result.actions.length > 0) {
        console.log("Actions:")
        for (const action of result.actions) {
          console.log(`  - ${action}`)
        }
      }
      if (result.forensicsDir) {
        console.log(`Forensics snapshot: ${result.forensicsDir}`)
      }
      console.log(`Report: ${result.reportPath}`)
      if (result.lineageRepairPath) {
        console.log(`Repair artifact: ${result.lineageRepairPath}`)
      }
      if (result.kernelSessionId) {
        console.log(`Kernel session: ${result.kernelSessionId}`)
      }
      if (result.metaArtifacts) {
        console.log(`Health artifact: ${result.metaArtifacts.healthStatus}`)
        console.log(`Diagnosis artifact: ${result.metaArtifacts.diagnosisTracking}`)
        console.log(`Meta-state artifact: ${result.metaArtifacts.metaState}`)
      }
      break
    }

    case "migrate": {
      // US-005: Explicit migrate command (replaces implicit hook-based migration)
      console.log("Running HiveMind graph migration...")
      
      // Check if migration is needed
      if (!isGraphMigrationNeeded(directory)) {
        console.log("✓ Graph structure already exists. No migration needed.")
        break
      }
      
      const migrateResult = await migrateToGraph(directory)
      
      if (migrateResult.success) {
        console.log("✓ Migration complete:")
        console.log(`  - Trajectory: ${migrateResult.migrated.trajectory ? 'OK' : 'SKIPPED'}`)
        console.log(`  - Plans: ${migrateResult.migrated.plans ? 'OK' : 'SKIPPED'}`)
        console.log(`  - Tasks: ${migrateResult.migrated.tasks} migrated`)
        console.log(`  - Mems: ${migrateResult.migrated.mems} migrated`)
        console.log(`  - Backup: ${migrateResult.backupPath}`)
      } else {
        console.error("✗ Migration failed:")
        for (const err of migrateResult.errors) {
          console.error(`  - ${err}`)
        }
        process.exit(1)
      }
      break
    }

    case "scan": {
      const output = await runScanCommand(directory, {
        action: (flags["action"] as "status" | "analyze" | "recommend" | "orchestrate") ?? "analyze",
        json: "json" in flags,
        includeDrift: "include-drift" in flags,
      })
      console.log(output)
      break
    }

    case "hivefiver-intake": {
      const action = flags["action"] as "classify-intent" | "guided-discovery" | "route-stage" | undefined
      if (!action) {
        throw new Error("hivefiver-intake requires --action <classify-intent|guided-discovery|route-stage>")
      }
      const text = flags["text"] ?? remainingArgs.join(" ")
      const output = runHiveFiverIntakeBridge({ action, text })
      console.log(JSON.stringify(output, null, 2))
      break
    }

    case "status":
      await showStatus(directory)
      break

    case "settings":
      if (hasSettingsFlags(flags)) {
        const result = await updateProjectSettings(directory, {
          language: (flags["lang"] as "en" | "vi") ?? undefined,
          governanceMode:
            (flags["mode"] as "permissive" | "assisted" | "strict") ?? undefined,
          automationLevel: flags["automation"] ?? undefined,
          expertLevel:
            (flags["expert"] as "beginner" | "intermediate" | "advanced" | "expert") ?? undefined,
          outputStyle:
            (flags["style"] as "explanatory" | "outline" | "skeptical" | "architecture" | "minimal") ?? undefined,
          requireCodeReview: "code-review" in flags ? true : undefined,
          enforceTdd: "tdd" in flags ? true : undefined,
          profile: flags["profile"] as any,
        })
        console.log("Settings updated.")
        if (result.profileApplied) {
          console.log(`Profile: ${result.profileApplied}`)
        }
        console.log(`Updated fields: ${result.updatedFields.length > 0 ? result.updatedFields.join(", ") : "(none)"}`)
      }
      await showSettings(directory)
      break

    case "harness": {
      const result = await runHarnessCommand(directory, {
        serverUrl: flags["server-url"] ?? undefined,
        timeoutMs: flags["timeout-ms"] ? Number.parseInt(flags["timeout-ms"], 10) : undefined,
      })
      console.log(`Harness server: ${result.serverUrl}`)
      console.log(`Healthy: ${result.healthy ? "yes" : "no"}`)
      console.log(`Status code: ${result.statusCode ?? "unreachable"}`)
      console.log(`Version: ${result.version ?? "unknown"}`)
      console.log(`Kernel sessions: ${result.sessionCount}`)
      console.log("Recommended commands:")
      for (const line of result.recommendedCommands) {
        console.log(`  - ${line}`)
      }
      console.log(`Health artifact: ${result.metaArtifacts.healthStatus}`)
      console.log(`Diagnosis artifact: ${result.metaArtifacts.diagnosisTracking}`)
      console.log(`Meta-state artifact: ${result.metaArtifacts.metaState}`)
      break
    }

    case "compact":
      // eslint-disable-next-line no-console
      console.log("Manual compaction: use compact_session tool within OpenCode.")
      break

    case "dashboard": {
      // Spawn dashboard as detached Bun process to avoid EBUSY file-locking
      // OpenTUI requires Bun runtime; Node.js CLI cannot host it directly
      const { spawn } = await import("node:child_process");

      // Resolve dashboard entry point (compiled JS in dist/)
      const dashboardPath = join(__dirname, "dashboard", "bin.js");

      const refreshMs = flags["refresh"]
        ? Math.round(Math.max(0.5, parseFloat(flags["refresh"])) * 1000)
        : 2000;

      const dashboardArgs = [
        "run",
        dashboardPath,
        "--projectRoot", directory,
        "--language", (flags["lang"] as "en" | "vi") ?? "en",
        "--refreshMs", String(refreshMs),
      ];

      try {
        const proc = spawn("bun", dashboardArgs, {
          detached: true,
          stdio: "ignore",
          cwd: process.cwd(),
        });

        proc.unref();
        // eslint-disable-next-line no-console
        console.log("Dashboard launched in detached Bun process.");
        // eslint-disable-next-line no-console
        console.log(`  Project: ${directory}`);
        // eslint-disable-next-line no-console
        console.log(`  Refresh: ${refreshMs}ms`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("bun") || msg.includes("ENOENT")) {
          // eslint-disable-next-line no-console
          console.error(
            "Dashboard requires Bun runtime.\n" +
            "Install Bun with:\n\n" +
            "  curl -fsSL https://bun.sh/install | bash\n\n" +
            "Then run: bun --version"
          );
        } else if (msg.includes("Cannot find module") || msg.includes("ENOENT")) {
          // eslint-disable-next-line no-console
          console.error(
            "Dashboard entry point not found. Ensure the plugin is built:\n\n" +
            "  npm run build"
          );
        } else {
          // eslint-disable-next-line no-console
          console.error("Failed to spawn dashboard:", msg);
        }
        process.exit(1);
      }
      break
    }

    case "help":
      printHelp()
      break

    case "purge": {
      const hivemindDir = getEffectivePaths(directory).root
      if (!existsSync(hivemindDir)) {
        console.log("❌ No .hivemind/ directory found. Nothing to purge.")
        break
      }
      const { rm } = await import("node:fs/promises")
      await rm(hivemindDir, { recursive: true, force: true })
      console.log("✅ Removed .hivemind/ directory")
      // Try to remove from opencode.json
      try {
        const ocPath = join(directory, "opencode.json")
        if (existsSync(ocPath)) {
          const { readFile, writeFile } = await import("node:fs/promises")
          const raw = await readFile(ocPath, "utf-8")
          const config = JSON.parse(raw)
          if (Array.isArray(config.plugin)) {
            config.plugin = config.plugin.filter((p: string) => p !== "hivemind-context-governance")
            await writeFile(ocPath, JSON.stringify(config, null, 2))
            console.log("✅ Removed plugin from opencode.json")
          }
        }
      } catch {
        // Best effort
      }
      console.log("\n🧹 HiveMind purged. Run `npx hivemind-context-governance` to re-initialize.")
      break
    }

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
