import { loadConfig } from "../lib/persistence.js"
import { createStateManager } from "../lib/persistence.js"
import {
  ensureSessionKernelState,
  loadKernelSessionMap,
  syncKernelSteeringState,
  writeKernelMetaModuleArtifacts,
} from "../lib/session-kernel.js"

export interface HarnessOptions {
  serverUrl?: string
  timeoutMs?: number
}

export interface HarnessResult {
  serverUrl: string
  healthy: boolean
  statusCode: number | null
  version: string | null
  sessionCount: number
  metaArtifacts: {
    healthStatus: string
    diagnosisTracking: string
    metaState: string
  }
  recommendedCommands: string[]
}

async function fetchHealth(serverUrl: string, timeoutMs: number): Promise<{
  healthy: boolean
  statusCode: number | null
  version: string | null
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(new URL("/global/health", serverUrl), {
      method: "GET",
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as { healthy?: boolean; version?: string }
    return {
      healthy: response.ok && payload.healthy === true,
      statusCode: response.status,
      version: typeof payload.version === "string" ? payload.version : null,
    }
  } catch {
    return {
      healthy: false,
      statusCode: null,
      version: null,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Run the OpenCode harness inspection workflow and persist dated meta-module artifacts.
 *
 * @param directory Project root containing `.hivemind`.
 * @param options Optional server URL and timeout overrides.
 * @returns Harness status, recommended commands, and written meta-module artifact paths.
 */
export async function runHarnessCommand(
  directory: string,
  options: HarnessOptions = {},
): Promise<HarnessResult> {
  const config = await loadConfig(directory)
  await syncKernelSteeringState(directory, config)

  const state = await createStateManager(directory).load()
  if (state) {
    await ensureSessionKernelState(directory, config, {
      brainSessionId: state.session.id,
      opencodeSessionId: state.session.opencode_session_id,
      role: state.session.role || "unresolved",
      lineageScope: state.session.lineage_scope,
      sessionKind: state.session.kind,
      intentSummary: "Harness readiness refresh",
    })
  }

  const serverUrl = options.serverUrl ?? process.env.OPENCODE_SERVER_URL ?? "http://127.0.0.1:4096"
  const timeoutMs = options.timeoutMs ?? 2500
  const health = await fetchHealth(serverUrl, timeoutMs)
  const sessionMap = await loadKernelSessionMap(directory)

  const recommendedCommands = health.healthy
    ? [
        `opencode attach ${serverUrl}`,
        `opencode run --attach ${serverUrl} --continue "Resume the active Hivemind session"`,
      ]
    : [
        "opencode serve --port 4096 --hostname 127.0.0.1",
        `opencode run --attach ${serverUrl} "Bootstrap the Hivemind harness"`,
      ]

  const metaArtifacts = await writeKernelMetaModuleArtifacts(directory, {
    healthStatusLines: [
      "# Health Status",
      "",
      `- Server URL: ${serverUrl}`,
      `- Healthy: ${health.healthy ? "yes" : "no"}`,
      `- Status code: ${health.statusCode ?? "unreachable"}`,
      `- OpenCode version: ${health.version ?? "unknown"}`,
    ],
    diagnosisTrackingLines: [
      "# Diagnosis Tracking",
      "",
      `- Session count in kernel map: ${sessionMap?.sessions.length ?? 0}`,
      `- Active kernel session: ${sessionMap?.active_session_id ?? "(none)"}`,
      `- Active OpenCode session: ${sessionMap?.active_opencode_session_id ?? "(none)"}`,
      `- Recommended next command: ${recommendedCommands[0]}`,
    ],
    metaStateLines: [
      "# Meta State",
      "",
      `- Governance mode: ${config.governance_mode}`,
      `- Automation level: ${config.automation_level}`,
      `- Response language: ${config.agent_behavior.language}`,
      `- Harness mode: ${health.healthy ? "warm" : "cold-start"}`,
    ],
  })

  return {
    serverUrl,
    healthy: health.healthy,
    statusCode: health.statusCode,
    version: health.version,
    sessionCount: sessionMap?.sessions.length ?? 0,
    metaArtifacts,
    recommendedCommands,
  }
}
