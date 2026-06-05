#!/usr/bin/env node
/**
 * S5c — Real-runtime smoke test for tmux panel-spawn
 *
 * This test uses the REAL OpenCode SDK (no mocks) to:
 *   1. Start a real OpenCode server (via createOpencodeServer)
 *   2. Create a real SDK client
 *   3. Create a real child session via client.session.create()
 *   4. Drive the SessionManagerAdapter.onSessionCreated directly with the
 *      EXACT shape the S5b fix produces (mirroring spawnTmuxPanelForChild)
 *   5. Assert a real tmux pane was spawned (via listPanes)
 *   6. Assert the .hivemind/state/tmux-sessions/<sid>.json record exists
 *
 * NO MOCKS. If the panel-spawn chain is broken in real runtime, this test
 * fails. If it passes, the failure must be in the coordinator path BEFORE
 * spawnTmuxPanelForChild is called.
 *
 * Run: node tests/smoke/s5c-panel-spawn-real-runtime.mjs
 *
 * Exit codes:
 *   0  PASS — pane spawned, persistence record written
 *   1  FAIL — no pane or no record
 *   2  ENV  — environment missing opencode binary or tmux server
 *   3  INFRA — server failed to start, or integration factory returned null
 */
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawn, execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const PROJECT_ROOT = resolve(__dirname, "../..")
const DIST = join(PROJECT_ROOT, "dist")
const SDK_PATH = join(PROJECT_ROOT, "node_modules/@opencode-ai/sdk/dist/index.js")

// --- CLI args ---
const args = process.argv.slice(2)
const SKIP_SERVER = args.includes("--skip-server") // useful when harness already has a server
const EXTERNAL_URL = process.env.OPENCODE_TEST_URL || null
const DRY_RUN = args.includes("--dry-run")
const VERBOSE = args.includes("--verbose") || process.env.S5C_VERBOSE === "1"

const log = (...a) => console.log("[S5C-SMOKE]", ...a)
const logv = (...a) => VERBOSE && console.log("[S5C-SMOKE:v]", ...a)
const logErr = (...a) => console.error("[S5C-SMOKE:ERROR]", ...a)

// --- Preflight: tools available? ---
function preflight() {
  let ok = true
  try {
    execSync("which tmux", { stdio: "ignore" })
  } catch {
    logErr("tmux binary not found on PATH")
    ok = false
  }
  try {
    execSync("which opencode", { stdio: "ignore" })
  } catch {
    logErr("opencode binary not found on PATH")
    ok = false
  }
  if (!existsSync(join(DIST, "features/tmux/integration.js"))) {
    logErr(`dist/features/tmux/integration.js missing — run 'npm run build' first`)
    ok = false
  }
  if (!existsSync(SDK_PATH)) {
    logErr(`@opencode-ai/sdk not installed at ${SDK_PATH}`)
    ok = false
  }
  return ok
}

// --- Count tmux panes in the current session ---
function listTmuxPanes() {
  try {
    const out = execSync("tmux list-panes -F '#{pane_id} #{pane_title}'", { encoding: "utf-8" })
    return out
      .trim()
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => {
        const [paneId, ...titleParts] = l.split(" ")
        return { paneId, title: titleParts.join(" ") }
      })
  } catch (err) {
    logErr("listTmuxPanes failed:", err.message)
    return []
  }
}

// --- Spawn a detached opencode server in a temp project ---
async function startOpencodeServer(projectDir) {
  if (EXTERNAL_URL) {
    log("Using external OpenCode server at", EXTERNAL_URL)
    return { url: EXTERNAL_URL, close: () => {}, pid: -1 }
  }

  // Create opencode.json in the project so port is fixed
  const configPath = join(projectDir, "opencode.json")
  writeFileSync(
    configPath,
    JSON.stringify({ $schema: "https://opencode.ai/config.json", server: { port: 15001 } }, null, 2),
  )

  log("Starting real opencode server in", projectDir, "on port 15001")
  const proc = spawn("opencode", ["serve", "--port", "15001"], {
    cwd: projectDir,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  })

  // Wait for server to be reachable (up to 10s)
  const start = Date.now()
  while (Date.now() - start < 10000) {
    try {
      execSync("curl -fs http://localhost:15001/ > /dev/null 2>&1", { stdio: "ignore" })
      log("opencode server reachable after", Date.now() - start, "ms")
      return {
        url: "http://localhost:15001",
        close: () => {
          try { proc.kill("SIGTERM") } catch {}
        },
        pid: proc.pid,
      }
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  proc.kill("SIGTERM")
  throw new Error("opencode server did not become reachable within 10s")
}

// --- Main ---
async function main() {
  log("S5c real-runtime smoke test starting")
  log("PROJECT_ROOT:", PROJECT_ROOT)
  log("DIST exists:", existsSync(DIST))
  log("SDK_PATH exists:", existsSync(SDK_PATH))

  if (!preflight()) {
    logErr("preflight failed — see errors above")
    process.exit(2)
  }

  // Create an isolated project directory (mirrors tmux_bats_make_project)
  const projectDir = mkdtempSync(join(tmpdir(), "s5c-smoke-"))
  log("projectDir:", projectDir)
  mkdirSync(join(projectDir, ".hivemind", "state"), { recursive: true })
  // Touch the .hivemind state directory so integration factory's port persistence works
  writeFileSync(join(projectDir, ".hivemind", "state", "tmux-port.json"), JSON.stringify({ port: 15001, updatedAt: Date.now() }, null, 2))

  // Step 1: Start the real OpenCode server
  let server
  try {
    server = await startOpencodeServer(projectDir)
  } catch (err) {
    logErr("startOpencodeServer failed:", err.message)
    rmSync(projectDir, { recursive: true, force: true })
    process.exit(3)
  }

  let sdkClient
  let sessionId
  let integration
  try {
    // Step 2: Create a real SDK client
    log("Step 2: create real SDK client")
    const sdk = await import(SDK_PATH)
    sdkClient = sdk.createOpencodeClient({ baseUrl: server.url })
    log("SDK client created, baseUrl:", server.url)

    // Step 3: Create a real child session via the SDK (mirrors
    // sdk-child-session-starter.ts:32)
    log("Step 3: create real child session via client.session.create()")
    const sessionResult = await sdkClient.session.create({
      title: "s5c-smoke-child-gsd-executor",
    })
    const sessionData = sessionResult.data || sessionResult
    sessionId = sessionData.id
    log("Real child session created:", sessionId)
    logv("session shape:", JSON.stringify(sessionData).slice(0, 200))

    if (!sessionId || !sessionId.startsWith("ses_")) {
      throw new Error(`client.session.create() returned invalid id: ${sessionId}`)
    }

    // Step 4: Create the real TmuxIntegration (mirrors plugin.ts:500)
    log("Step 4: create real TmuxIntegration via createTmuxIntegrationIfSupported")
    const integrationMod = await import(join(DIST, "features/tmux/integration.js"))
    const capturedLogs = []
    integration = await integrationMod.createTmuxIntegrationIfSupported(projectDir, {
      log: {
        debug: (msg, data) => capturedLogs.push({ level: "debug", msg, data }),
        info: (msg, data) => capturedLogs.push({ level: "info", msg, data }),
        warn: (msg, data) => capturedLogs.push({ level: "warn", msg, data }),
        error: (msg, data) => capturedLogs.push({ level: "error", msg, data }),
      },
    })

    if (!integration) {
      logErr("createTmuxIntegrationIfSupported returned null — tmux integration unavailable")
      logErr("likely cause: not running inside a tmux session, or tmux binary missing")
      throw new Error("INTEGRATION_NULL")
    }
    log("Integration created: tmux", integration.version, "binaryPath:", integration.binaryPath, "serverUrl:", integration.serverUrl)

    // Step 5: List panes BEFORE
    const panesBefore = listTmuxPanes()
    log("Panes BEFORE:", panesBefore.length)
    for (const p of panesBefore) logv("  ", p.paneId, JSON.stringify(p.title))

    // Step 6: Build the EXACT EnrichedSessionEvent the S5b fix produces
    // (mirrors coordinator.ts:689-710 spawnTmuxPanelForChild)
    const enriched = {
      type: "session.created",
      properties: {
        info: {
          id: sessionId,
          parentID: "s5c-parent",
          title: "hm-delegate-child-gsd-executor",
          directory: projectDir,
        },
      },
      hivemindMeta: {
        agent: "gsd-executor",
        delegationId: sessionId,
        depth: 1,
      },
    }
    log("Step 6: invoke integration.adapter.onSessionCreated(synthesized event)")
    logv("event:", JSON.stringify(enriched))

    // Step 7: Await the adapter call
    await integration.adapter.onSessionCreated(enriched)
    log("onSessionCreated returned")

    // Step 8: Wait briefly for spawn to settle
    await new Promise((r) => setTimeout(r, 1000))

    // Step 9: List panes AFTER
    const panesAfter = listTmuxPanes()
    log("Panes AFTER:", panesAfter.length)
    for (const p of panesAfter) logv("  ", p.paneId, JSON.stringify(p.title))

    // Step 10: List via the multiplexer (production path)
    const muxPanes = await integration.adapter.listPanes()
    log("multiplexer listPanes:", muxPanes.length, "panes")
    for (const p of muxPanes) logv("  ", p.paneId, JSON.stringify(p.title), "isMain=", p.isMain)

    // Step 11: Look for our sessionId in pane titles
    const foundByTitle = muxPanes.find((p) => (p.title || "").includes("gsd-executor"))
    const foundById = muxPanes.find((p) => (p.title || "").includes(sessionId))

    // Step 12: Check the persistence record
    const recordPath = join(projectDir, ".hivemind/state/tmux-sessions", sessionId + ".json")
    const recordExists = existsSync(recordPath)

    // Step 13: Check the integration log for any errors
    const errorLogs = capturedLogs.filter((l) => l.level === "error" || l.level === "warn")
    if (errorLogs.length > 0) {
      log("Integration log entries (warn/error):")
      for (const l of errorLogs) log("  ", l.level, l.msg, JSON.stringify(l.data))
    }
    const debugLogs = capturedLogs.filter((l) => l.level === "debug")
    if (VERBOSE && debugLogs.length > 0) {
      log("Integration log entries (debug, first 10):")
      for (const l of debugLogs.slice(0, 10)) logv("  ", l.level, l.msg, JSON.stringify(l.data))
    }

    // --- VERDICT ---
    log("")
    log("=== VERDICT ===")
    log("Panes grew:", panesAfter.length, ">", panesBefore.length, "→", panesAfter.length > panesBefore.length ? "YES" : "NO")
    log("Pane found by title (gsd-executor):", foundByTitle ? `YES (${foundByTitle.paneId})` : "NO")
    log("Pane found by sessionId in title:", foundById ? `YES (${foundById.paneId})` : "NO")
    log("Persistence record exists:", recordExists ? `YES (${recordPath})` : `NO (${recordPath})`)

    let passed = true
    const failures = []

    if (panesAfter.length <= panesBefore.length) {
      failures.push("pane count did not grow")
      passed = false
    }
    if (!recordExists) {
      failures.push("persistence record missing at " + recordPath)
      passed = false
    }
    if (!foundByTitle && !foundById) {
      // Title might be truncated — allow if pane count grew AND record exists
      // (proves SessionManager.spawnPane ran successfully)
      log("NOTE: pane not found by title — may be due to tmux 40-char title limit")
    }

    if (passed) {
      log("RESULT: PASS — panel-spawn chain works in real runtime")
      log("If S5c UAT still fails, the silent no-op is BEFORE coordinator.spawnTmuxPanelForChild")
      process.exit(0)
    } else {
      log("RESULT: FAIL — panel-spawn chain broken in real runtime")
      for (const f of failures) log("  FAILURE:", f)
      process.exit(1)
    }
  } catch (err) {
    logErr("smoke test threw:", err.message)
    logErr(err.stack)
    process.exit(1)
  } finally {
    // Cleanup
    if (integration?.adapter) {
      try {
        // Best-effort: close any pane we may have created
        const muxPanes = await integration.adapter.listPanes()
        for (const p of muxPanes) {
          if (p.paneId && p.paneId !== "%0" && p.paneId !== "%1") {
            try {
              execSync(`tmux kill-pane -t ${p.paneId}`, { stdio: "ignore" })
            } catch {}
          }
        }
      } catch {}
    }
    if (server && !EXTERNAL_URL) {
      log("Closing opencode server (pid", server.pid, ")")
      server.close()
    }
    try { rmSync(projectDir, { recursive: true, force: true }) } catch {}
    log("cleanup done")
  }
}

main()
