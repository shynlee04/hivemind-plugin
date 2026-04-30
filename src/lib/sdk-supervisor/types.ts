import type { PressureDecision } from "../runtime-pressure/types.js"

/** SDK wrapper availability row exposed by supervisor health checks. */
export type SdkWrapperHealth = {
  /** Canonical wrapper seam name from `session-api.ts`. */
  name: string
  /** Whether the wrapper seam is available to the supervisor. */
  available: boolean
}

/** Diagnostic severity level for bounded supervisor reports. */
export type SdkDiagnosticLevel = "info" | "warning" | "error"

/** Single bounded diagnostic emitted by SDK supervision. */
export type SdkDiagnostic = {
  /** Stable diagnostic code. */
  code: string
  /** Severity for routing and display. */
  level: SdkDiagnosticLevel
  /** Human-readable diagnostic message. */
  message: string
}

/** Result returned by the SDK supervisor health action. */
export type SdkSupervisorHealth = {
  /** Aggregate supervisor status. */
  status: "healthy" | "degraded"
  /** ISO timestamp for the check. */
  checkedAt: string
  /** Wrapper seam availability report. */
  wrappers: SdkWrapperHealth[]
}

/** Result returned by the SDK supervisor heartbeat action. */
export type SdkSupervisorHeartbeat = {
  /** True when the heartbeat was recorded. */
  ok: true
  /** Optional session ID associated with the heartbeat. */
  sessionId?: string
  /** Monotonic sequence number local to this supervisor instance. */
  sequence: number
  /** ISO timestamp for the heartbeat. */
  heartbeatAt: string
}

/** Options controlling bounded diagnostics output. */
export type SdkSupervisorDiagnosticsOptions = {
  /** Maximum diagnostics to include in the response. */
  maxDiagnostics?: number
}

/** Result returned by the SDK supervisor diagnostics action. */
export type SdkSupervisorDiagnostics = {
  /** Included bounded diagnostic rows. */
  items: SdkDiagnostic[]
  /** Total diagnostics observed before bounding. */
  totalDiagnostics: number
  /** True when diagnostics were truncated to the requested limit. */
  truncated: boolean
}

/** Result returned by the SDK supervisor readiness action. */
export type SdkSupervisorReadiness = {
  /** Tool action label for downstream routing. */
  action: "readiness"
  /** True when SDK supervision is ready to allow guarded operations. */
  ready: boolean
  /** Pressure decision used to gate readiness. */
  pressure: PressureDecision
  /** Human-readable readiness reason. */
  reason: string
}

/** Input accepted by supervisor action dispatch. */
export type SdkSupervisorActionInput = {
  /** Supervisor action to run. */
  action: "health" | "heartbeat" | "diagnostics" | "readiness"
  /** Optional session ID for heartbeat. */
  sessionId?: string
  /** Maximum diagnostics to return. */
  maxDiagnostics?: number
  /** Runtime pressure score. */
  score?: number
  /** Runtime pressure tier. */
  tier?: number
}

/** Minimal OpenCode client shape observed by supervisor health checks. */
export type SdkSupervisorClient = {
  /** Optional session namespace from the OpenCode SDK client. */
  session?: {
    create?: unknown
    get?: unknown
    status?: unknown
    abort?: unknown
    messages?: unknown
    prompt?: unknown
    promptAsync?: unknown
  }
}

/** Dependencies accepted by the SDK supervisor factory. */
export type SdkSupervisorOptions = {
  /** Optional OpenCode SDK client used for availability inspection only. */
  client?: SdkSupervisorClient
  /** Clock seam for deterministic tests. */
  now?: () => Date
  /** Diagnostics seed for bounded reporting. */
  diagnostics?: SdkDiagnostic[]
}
