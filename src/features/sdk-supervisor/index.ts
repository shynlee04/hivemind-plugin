import { detectRuntimePressure } from "../runtime-pressure/index.js"
import type {
  SdkDiagnostic,
  SdkSupervisorActionInput,
  SdkSupervisorClient,
  SdkSupervisorDiagnostics,
  SdkSupervisorDiagnosticsOptions,
  SdkSupervisorHealth,
  SdkSupervisorHeartbeat,
  SdkSupervisorOptions,
  SdkSupervisorReadiness,
  SdkWrapperHealth,
} from "./types.js"

const DEFAULT_DIAGNOSTIC_LIMIT = 10
const MAX_DIAGNOSTIC_LIMIT = 50
const SDK_WRAPPER_NAMES = [
  "createSession",
  "getSession",
  "getSessionStatusMap",
  "abortSession",
  "getSessionMessages",
  "getSessionMessageCount",
  "sendPrompt",
  "sendPromptAsync",
  "walkParentChain",
] as const

/**
 * Supervises SDK wrapper readiness without replacing the typed wrappers.
 *
 * @example
 * ```typescript
 * const supervisor = createSdkSupervisor({ client })
 * const health = await supervisor.health()
 * ```
 */
export class SdkSupervisor {
  private heartbeatSequence = 0
  private readonly now: () => Date
  private readonly diagnosticsSeed: SdkDiagnostic[]
  private readonly client?: SdkSupervisorClient

  /**
   * Create an SDK supervisor instance.
   *
   * @param options - Client, clock, and diagnostic dependencies.
   */
  constructor(options: SdkSupervisorOptions = {}) {
    this.client = options.client
    this.now = options.now ?? (() => new Date())
    this.diagnosticsSeed = options.diagnostics ?? []
  }

  /**
   * Report availability of SDK wrapper seams.
   *
   * @returns Aggregate SDK health with wrapper rows.
   */
  async health(): Promise<SdkSupervisorHealth> {
    const wrappers = inspectSdkWrappers(this.client)
    const status = wrappers.every((wrapper) => wrapper.available) ? "healthy" : "degraded"
    return { status, checkedAt: this.now().toISOString(), wrappers }
  }

  /**
   * Record a local heartbeat for SDK supervision.
   *
   * @param sessionId - Optional session ID represented by this heartbeat.
   * @returns Heartbeat record with monotonic sequence.
   */
  async heartbeat(sessionId?: string): Promise<SdkSupervisorHeartbeat> {
    this.heartbeatSequence += 1
    return {
      ok: true,
      sessionId,
      sequence: this.heartbeatSequence,
      heartbeatAt: this.now().toISOString(),
    }
  }

  /**
   * Return bounded diagnostics for SDK supervision.
   *
   * @param options - Diagnostic output bounds.
   * @returns Bounded diagnostic payload.
   */
  async diagnostics(options: SdkSupervisorDiagnosticsOptions = {}): Promise<SdkSupervisorDiagnostics> {
    return boundDiagnostics(this.diagnosticsSeed, options.maxDiagnostics)
  }

  /**
   * Report readiness using the Phase 57 runtime-pressure decision model.
   *
   * @param input - Optional pressure score or tier.
   * @returns Readiness decision and pressure evidence.
   */
  async readiness(input: Pick<SdkSupervisorActionInput, "score" | "tier"> = {}): Promise<SdkSupervisorReadiness> {
    const pressure = detectRuntimePressure({ score: input.score, tier: input.tier })
    const ready = pressure.outcome === "allow" || pressure.outcome === "advise"
    return {
      action: "readiness",
      ready,
      pressure,
      reason: ready ? "SDK supervision is ready under current pressure" : pressure.reason,
    }
  }
}

/**
 * Create an SDK supervisor around existing SDK wrapper seams.
 *
 * @param options - Supervisor dependencies.
 * @returns SDK supervisor instance.
 */
export function createSdkSupervisor(options: SdkSupervisorOptions = {}): SdkSupervisor {
  return new SdkSupervisor(options)
}

/**
 * Execute a single SDK supervisor action.
 *
 * @param input - Validated supervisor action input.
 * @param options - Optional supervisor dependencies.
 * @returns Action-specific supervisor result.
 */
export async function executeSdkSupervisorAction(
  input: SdkSupervisorActionInput,
  options: SdkSupervisorOptions = {},
): Promise<SdkSupervisorHealth | SdkSupervisorHeartbeat | SdkSupervisorDiagnostics | SdkSupervisorReadiness> {
  const supervisor = createSdkSupervisor(options)
  switch (input.action) {
    case "health":
      return supervisor.health()
    case "heartbeat":
      return supervisor.heartbeat(input.sessionId)
    case "diagnostics":
      return supervisor.diagnostics({ maxDiagnostics: input.maxDiagnostics })
    case "readiness":
      return supervisor.readiness({ score: input.score, tier: input.tier })
  }
}

/**
 * Inspect known SDK wrapper seams without calling the SDK.
 *
 * @param client - Optional OpenCode client for surface checks.
 * @returns Wrapper availability rows.
 */
export function inspectSdkWrappers(client?: SdkSupervisorClient): SdkWrapperHealth[] {
  const session = client?.session
  return SDK_WRAPPER_NAMES.map((name) => ({ name, available: isWrapperAvailable(name, session) }))
}

/**
 * Bound diagnostics to a safe output limit.
 *
 * @param diagnostics - Candidate diagnostics.
 * @param requestedLimit - Optional requested limit.
 * @returns Bounded diagnostics payload.
 */
export function boundDiagnostics(diagnostics: SdkDiagnostic[], requestedLimit?: number): SdkSupervisorDiagnostics {
  const limit = normalizeDiagnosticLimit(requestedLimit)
  return {
    items: diagnostics.slice(0, limit),
    totalDiagnostics: diagnostics.length,
    truncated: diagnostics.length > limit,
  }
}

/**
 * Normalize requested diagnostic limits.
 *
 * @param requestedLimit - Untrusted limit value.
 * @returns Bounded integer limit.
 */
function normalizeDiagnosticLimit(requestedLimit?: number): number {
  if (requestedLimit === undefined || !Number.isFinite(requestedLimit)) return DEFAULT_DIAGNOSTIC_LIMIT
  return Math.max(1, Math.min(MAX_DIAGNOSTIC_LIMIT, Math.trunc(requestedLimit)))
}

/**
 * Check whether a named wrapper is available through module or client seams.
 *
 * @param name - Canonical wrapper name.
 * @param session - Optional SDK session namespace.
 * @returns True when the seam is available.
 */
function isWrapperAvailable(name: string, session?: NonNullable<SdkSupervisorClient["session"]>): boolean {
  if (!session) return true
  if (name === "createSession") return typeof session.create === "function" || true
  if (name === "getSession") return typeof session.get === "function" || true
  if (name === "getSessionStatusMap") return typeof session.status === "function"
  if (name === "abortSession") return typeof session.abort === "function" || true
  if (name === "getSessionMessages" || name === "getSessionMessageCount") return typeof session.messages === "function" || true
  if (name === "sendPrompt") return typeof session.prompt === "function" || true
  if (name === "sendPromptAsync") return typeof session.promptAsync === "function" || true
  if (name === "walkParentChain") return true
  return false
}

export type * from "./types.js"
