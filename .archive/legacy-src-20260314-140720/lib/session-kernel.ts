import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"

import type { LineageScope } from "../schemas/brain-state.js"
import type { HiveMindConfig } from "../schemas/config.js"
import {
  type HiveNeuronState,
  type KernelArtifactIndex,
  type KernelIntegrityState,
  type KernelLineage,
  type KernelSessionMap,
  type KernelSessionState,
  type KernelVerificationIndex,
  HiveNeuronSchema,
  KernelArtifactIndexSchema,
  KernelBootHealthSchema,
  KernelIntegrityGradeSchema,
  KernelIntegrityStateSchema,
  KernelSessionMapSchema,
  KernelSessionStateSchema,
  KernelVerificationIndexSchema,
  KERNEL_STATE_VERSION,
} from "../schemas/session-kernel.js"
import { getEffectivePaths, type KernelPaths } from "./paths.js"

const DEFAULT_COMPLETION_RULE = {
  mode: "last-open-todo",
  description: "Close the session when the last open TODO item is complete unless stricter workflow gates exist.",
} as const

export interface EnsureSessionKernelOptions {
  /**
   * Canonical runtime session id from `brain.json`.
   */
  brainSessionId: string
  /**
   * Native OpenCode session id when available.
   */
  opencodeSessionId?: string | null
  /**
   * Legacy compatibility session id when a migration/import path supplies one.
   */
  legacySessionId?: string | null
  /**
   * Existing lineage scope from the runtime brain state.
   */
  lineageScope?: LineageScope
  /**
   * Agent role captured during bootstrap.
   */
  role?: string | null
  /**
   * Main/sub/unresolved runtime kind.
   */
  sessionKind?: string | null
  /**
   * Optional workflow reference for the active session projection.
   */
  workflowId?: string | null
  /**
   * Optional TODO chain reference for the active session projection.
   */
  todoChainId?: string | null
  /**
   * Intent summary used in the kernel session projection.
   */
  intentSummary?: string | null
  /**
   * Force rewrites for deterministic recovery/bootstrap flows.
   */
  force?: boolean
}

export interface EnsureSessionKernelResult {
  lineage: KernelLineage
  canonicalSessionId: string
  hiveneuronPath: string
  hivebrainPath: string
  sessionMapPath: string
  sessionPath: string
}

export interface SyncKernelSteeringResult {
  profilePath: string
  governancePath: string
  guardrailsPath: string
  integrityPath: string
  artifactIndexPath: string
  verificationIndexPath: string
}

export interface KernelMetaModulePayload {
  healthStatusLines: string[]
  diagnosisTrackingLines: string[]
  metaStateLines: string[]
}

interface KernelConfigProjection {
  profile: Record<string, unknown>
  governance: Record<string, unknown>
  guardrails: Record<string, unknown>
}

function toIsoTimestamp(date = new Date()): string {
  return date.toISOString()
}

function toDateStamp(date = new Date()): string {
  return date.toISOString().split("T")[0]
}

function toKernelSessionId(brainSessionId: string): string {
  return brainSessionId.startsWith("SES-") ? brainSessionId : `SES-${brainSessionId}`
}

function toKernelLineage(lineageScope?: LineageScope, role?: string | null): KernelLineage {
  if (lineageScope === "project") return "hiveminder"
  if (lineageScope === "meta-framework") return "hivefiver"

  const normalizedRole = role?.trim().toLowerCase() ?? ""
  if (normalizedRole.startsWith("hiveminder") || normalizedRole.startsWith("hivemaker")) {
    return "hiveminder"
  }
  return "hivefiver"
}

function toKernelRef(paths: ReturnType<typeof getEffectivePaths>, absolutePath: string, description: string, id?: string | null) {
  const relPath = relative(paths.root, absolutePath).replaceAll("\\", "/")
  return {
    path: `./${relPath}`,
    id: id ?? null,
    description,
  }
}

async function readJsonFile<T>(
  path: string,
  fallback: T,
  parse: (value: unknown) => T | null,
): Promise<T> {
  try {
    const raw = JSON.parse(await readFile(path, "utf-8")) as unknown
    return parse(raw) ?? fallback
  } catch {
    return fallback
  }
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8")
}

async function writeTextFile(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${value.trimEnd()}\n`, "utf-8")
}

function buildConfigProjection(config: HiveMindConfig, nowIso: string): KernelConfigProjection {
  return {
    profile: {
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
      preferred_name: null,
      chat_language: config.language,
      agent_language: config.agent_behavior.language,
      artifact_language: config.agent_behavior.language,
      expert_level: config.agent_behavior.expert_level,
      output_style: config.agent_behavior.output_style,
    },
    governance: {
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
      governance_mode: config.governance_mode,
      automation_level: config.automation_level,
      auto_commit: config.auto_commit,
      stale_session_days: config.stale_session_days,
      auto_compact_on_turns: config.auto_compact_on_turns,
    },
    guardrails: {
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
      require_code_review: config.agent_behavior.constraints.require_code_review,
      enforce_tdd: config.agent_behavior.constraints.enforce_tdd,
      max_response_tokens: config.agent_behavior.constraints.max_response_tokens,
      completion_rule: DEFAULT_COMPLETION_RULE,
    },
  }
}

function defaultIntegrity(nowIso: string): KernelIntegrityState {
  return {
    version: KERNEL_STATE_VERSION,
    updated_at: nowIso,
    grade: "healthy",
    boot_health: "ready",
    issues: [],
    notes: [],
  }
}

function defaultSessionMap(nowIso: string): KernelSessionMap {
  return {
    version: KERNEL_STATE_VERSION,
    updated_at: nowIso,
    active_session_id: null,
    active_opencode_session_id: null,
    sessions: [],
  }
}

function defaultArtifactIndex(nowIso: string): KernelArtifactIndex {
  return {
    version: KERNEL_STATE_VERSION,
    updated_at: nowIso,
    items: [],
  }
}

function defaultVerificationIndex(nowIso: string): KernelVerificationIndex {
  return {
    version: KERNEL_STATE_VERSION,
    updated_at: nowIso,
    items: [],
  }
}

function defaultSessionState(
  canonicalSessionId: string,
  lineage: KernelLineage,
  brainSessionId: string,
  nowIso: string,
  options: EnsureSessionKernelOptions,
): KernelSessionState {
  return {
    id: canonicalSessionId,
    lineage,
    brain_session_id: brainSessionId,
    opencode_session_id: options.opencodeSessionId ?? null,
    legacy_session_id: options.legacySessionId ?? null,
    role: options.role ?? null,
    session_kind: options.sessionKind ?? null,
    status: "bootstrap",
    workflow_id: options.workflowId ?? null,
    todo_chain_id: options.todoChainId ?? null,
    branch_refs: [],
    intent: {
      summary: options.intentSummary ?? "Kernel bootstrap session",
      source_signals: [],
      confidence: 0.5,
    },
    completion_rule: DEFAULT_COMPLETION_RULE,
    refs: {
      verification: [],
      handoffs: [],
      artifacts: [],
    },
    created_at: nowIso,
    updated_at: nowIso,
  }
}

function buildHiveNeuron(
  paths: ReturnType<typeof getEffectivePaths>,
  lineage: KernelLineage,
  session: KernelSessionState,
  integrity: KernelIntegrityState,
  config: HiveMindConfig,
  nowIso: string,
): HiveNeuronState {
  const settingsDigest = {
    language: config.language,
    governance_mode: config.governance_mode,
    automation_level: config.automation_level ?? null,
    expert_level: config.agent_behavior.expert_level ?? null,
    output_style: config.agent_behavior.output_style ?? null,
  }

  return {
    version: KERNEL_STATE_VERSION,
    updated_at: nowIso,
    boot_health: integrity.boot_health,
    current_lineage: lineage,
    active_session_id: session.id,
    active_opencode_session_id: session.opencode_session_id ?? null,
    active_workflow_id: session.workflow_id ?? null,
    active_todo_chain_id: session.todo_chain_id ?? null,
    branch_status: "idle",
    integrity_grade: integrity.grade,
    critical_gaps: integrity.issues,
    settings_digest: settingsDigest,
    refs: {
      integrity: toKernelRef(paths, paths.kernel.integrity, "Kernel integrity status"),
      session_map: toKernelRef(paths, paths.kernel.sessionMap, "OpenCode to Hivemind session map"),
      artifact_index: toKernelRef(paths, paths.kernel.artifactIndex, "Kernel artifact index"),
      verification_index: toKernelRef(paths, paths.kernel.verificationIndex, "Kernel verification index"),
      profile: toKernelRef(paths, paths.kernel.profileConfig, "Profile steering inputs"),
      governance: toKernelRef(paths, paths.kernel.governanceConfig, "Governance steering inputs"),
      guardrails: toKernelRef(paths, paths.kernel.guardrailsConfig, "Guardrail steering inputs"),
      session: toKernelRef(
        paths,
        join(
          lineage === "hivefiver" ? paths.kernel.hivefiver.sessionsDir : paths.kernel.hiveminder.sessionsDir,
          `${session.id}.json`,
        ),
        "Active kernel session record",
        session.id,
      ),
      workflow: null,
      todo_chain: null,
    },
  }
}

function buildHiveBrain(
  lineage: KernelLineage,
  session: KernelSessionState,
  integrity: KernelIntegrityState,
  paths: ReturnType<typeof getEffectivePaths>,
  nowIso: string,
): string {
  return [
    "---",
    `version: ${KERNEL_STATE_VERSION}`,
    `updated_at: ${nowIso}`,
    `current_lineage: ${lineage}`,
    `active_session_id: ${session.id}`,
    `active_opencode_session_id: ${session.opencode_session_id ?? "null"}`,
    `integrity_grade: ${integrity.grade}`,
    "---",
    "",
    "# HiveBrain",
    "",
    "<overview>",
    `boot_health: ${integrity.boot_health}`,
    `story: OpenCode-native session kernel is active and projecting durable state into .hivemind.`,
    "</overview>",
    "",
    "## Active Session",
    `- Canonical session: ${session.id}`,
    `- Brain session: ${session.brain_session_id}`,
    `- OpenCode session: ${session.opencode_session_id ?? "(pending runtime bind)"}`,
    `- Lineage: ${lineage}`,
    `- Status: ${session.status}`,
    `- Intent: ${session.intent.summary}`,
    "",
    "<refs>",
    `integrity: ./${relative(paths.root, paths.kernel.integrity).replaceAll("\\", "/")}`,
    `session_map: ./${relative(paths.root, paths.kernel.sessionMap).replaceAll("\\", "/")}`,
    `session: ./${relative(paths.root, join(lineage === "hivefiver" ? paths.kernel.hivefiver.sessionsDir : paths.kernel.hiveminder.sessionsDir, `${session.id}.json`)).replaceAll("\\", "/")}`,
    `profile: ./${relative(paths.root, paths.kernel.profileConfig).replaceAll("\\", "/")}`,
    `governance: ./${relative(paths.root, paths.kernel.governanceConfig).replaceAll("\\", "/")}`,
    `guardrails: ./${relative(paths.root, paths.kernel.guardrailsConfig).replaceAll("\\", "/")}`,
    "</refs>",
    "",
    "## Next Sectors",
    `- ${lineage}: own the active session trajectory and emit future workflow/task records under states/lineages/${lineage}/.`,
    `- shared: keep integrity, session-map, artifact-index, and verification-index concise and current.`,
    `- legacy: remain compatibility-only until doctor/import work archives or regenerates them.`,
  ].join("\n")
}

function lineagePaths(kernel: KernelPaths, lineage: KernelLineage) {
  return lineage === "hivefiver" ? kernel.hivefiver : kernel.hiveminder
}

async function ensureKernelDirectories(paths: ReturnType<typeof getEffectivePaths>): Promise<void> {
  const directories = [
    paths.kernel.configDir,
    paths.kernel.statesDir,
    paths.kernel.sharedDir,
    paths.kernel.lineagesDir,
    paths.kernel.hivefiver.root,
    paths.kernel.hivefiver.sessionsDir,
    paths.kernel.hivefiver.workflowsDir,
    paths.kernel.hivefiver.tasksDir,
    paths.kernel.hivefiver.todoChainsDir,
    paths.kernel.hivefiver.handoffsDir,
    paths.kernel.hivefiver.verificationDir,
    paths.kernel.hiveminder.root,
    paths.kernel.hiveminder.sessionsDir,
    paths.kernel.hiveminder.workflowsDir,
    paths.kernel.hiveminder.tasksDir,
    paths.kernel.hiveminder.todoChainsDir,
    paths.kernel.hiveminder.handoffsDir,
    paths.kernel.hiveminder.verificationDir,
    paths.kernel.artifactsDir,
    paths.kernel.artifactsAuditsDir,
    paths.kernel.artifactsHandoffsDir,
    paths.kernel.artifactsPlanningDir,
    paths.kernel.artifactsResearchDir,
    paths.kernel.artifactsSummariesDir,
    paths.kernel.artifactsVerificationDir,
    paths.kernel.artifactsIntelDir,
    paths.kernel.archiveDir,
    paths.kernel.metaModuleDir,
  ]
  await Promise.all(directories.map((dirPath) => mkdir(dirPath, { recursive: true })))
}

/**
 * Sync kernel steering/config files without requiring an active session repair.
 *
 * @param directory Project root containing `.hivemind`.
 * @param config Loaded HiveMind config.
 * @returns Paths to the refreshed steering and shared index files.
 */
export async function syncKernelSteeringState(
  directory: string,
  config: HiveMindConfig,
): Promise<SyncKernelSteeringResult> {
  const paths = getEffectivePaths(directory)
  const nowIso = toIsoTimestamp()
  await ensureKernelDirectories(paths)

  const configProjection = buildConfigProjection(config, nowIso)
  const integrity = await readJsonFile(
    paths.kernel.integrity,
    defaultIntegrity(nowIso),
    (value) => KernelIntegrityStateSchema.safeParse(value).success
      ? KernelIntegrityStateSchema.parse(value)
      : null,
  )
  const artifactIndex = await readJsonFile(
    paths.kernel.artifactIndex,
    defaultArtifactIndex(nowIso),
    (value) => KernelArtifactIndexSchema.safeParse(value).success
      ? KernelArtifactIndexSchema.parse(value)
      : null,
  )
  const verificationIndex = await readJsonFile(
    paths.kernel.verificationIndex,
    defaultVerificationIndex(nowIso),
    (value) => KernelVerificationIndexSchema.safeParse(value).success
      ? KernelVerificationIndexSchema.parse(value)
      : null,
  )

  await Promise.all([
    writeJsonFile(paths.kernel.profileConfig, configProjection.profile),
    writeJsonFile(paths.kernel.governanceConfig, configProjection.governance),
    writeJsonFile(paths.kernel.guardrailsConfig, configProjection.guardrails),
    writeJsonFile(paths.kernel.integrity, {
      ...integrity,
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
    }),
    writeJsonFile(paths.kernel.artifactIndex, {
      ...artifactIndex,
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
    }),
    writeJsonFile(paths.kernel.verificationIndex, {
      ...verificationIndex,
      version: KERNEL_STATE_VERSION,
      updated_at: nowIso,
    }),
  ])

  return {
    profilePath: paths.kernel.profileConfig,
    governancePath: paths.kernel.governanceConfig,
    guardrailsPath: paths.kernel.guardrailsConfig,
    integrityPath: paths.kernel.integrity,
    artifactIndexPath: paths.kernel.artifactIndex,
    verificationIndexPath: paths.kernel.verificationIndex,
  }
}

/**
 * Load the kernel session map when present.
 *
 * @param directory Project root containing `.hivemind`.
 * @returns Parsed kernel session map or `null` if none exists yet.
 */
export async function loadKernelSessionMap(directory: string): Promise<KernelSessionMap | null> {
  const paths = getEffectivePaths(directory)
  return readJsonFile(
    paths.kernel.sessionMap,
    null,
    (value) => KernelSessionMapSchema.safeParse(value).success
      ? KernelSessionMapSchema.parse(value)
      : null,
  )
}

/**
 * Ensure the OpenCode-native session kernel projection exists alongside the
 * legacy runtime state without replacing compatibility surfaces yet.
 *
 * @param directory Project root containing `.hivemind`.
 * @param config Loaded HiveMind config used to materialize steering projections.
 * @param options Runtime/bootstrap values required to correlate OpenCode and HiveMind sessions.
 * @returns Paths and identifiers for the kernel files that now exist on disk.
 */
export async function ensureSessionKernelState(
  directory: string,
  config: HiveMindConfig,
  options: EnsureSessionKernelOptions,
): Promise<EnsureSessionKernelResult> {
  const paths = getEffectivePaths(directory)
  const nowIso = toIsoTimestamp()
  const lineage = toKernelLineage(options.lineageScope, options.role)
  const canonicalSessionId = toKernelSessionId(options.brainSessionId)
  const activeLineagePaths = lineagePaths(paths.kernel, lineage)
  const sessionPath = join(activeLineagePaths.sessionsDir, `${canonicalSessionId}.json`)
  await syncKernelSteeringState(directory, config)

  const integrity = await readJsonFile(
    paths.kernel.integrity,
    defaultIntegrity(nowIso),
    (value) => KernelIntegrityStateSchema.safeParse(value).success
      ? KernelIntegrityStateSchema.parse(value)
      : null,
  )
  const nextIntegrity: KernelIntegrityState = {
    ...integrity,
    updated_at: nowIso,
    boot_health: KernelBootHealthSchema.parse("ready"),
    grade: KernelIntegrityGradeSchema.parse("healthy"),
    issues: integrity.issues,
    notes: Array.from(new Set([
      ...integrity.notes,
      "Legacy state remains compatibility-only until import/quarantine completes.",
    ])),
  }

  const sessionMap = await readJsonFile(
    paths.kernel.sessionMap,
    defaultSessionMap(nowIso),
    (value) => KernelSessionMapSchema.safeParse(value).success
      ? KernelSessionMapSchema.parse(value)
      : null,
  )
  const nextSessions = sessionMap.sessions.filter((entry) => entry.canonical_session_id !== canonicalSessionId)
  nextSessions.push({
    canonical_session_id: canonicalSessionId,
    brain_session_id: options.brainSessionId,
    opencode_session_id: options.opencodeSessionId ?? null,
    legacy_session_id: options.legacySessionId ?? null,
    lineage,
    session_kind: options.sessionKind ?? null,
    status: "bootstrap",
    last_seen_at: nowIso,
  })
  const nextSessionMap: KernelSessionMap = {
    ...sessionMap,
    updated_at: nowIso,
    active_session_id: canonicalSessionId,
    active_opencode_session_id: options.opencodeSessionId ?? null,
    sessions: nextSessions.sort((left, right) => left.canonical_session_id.localeCompare(right.canonical_session_id)),
  }

  const artifactIndex = await readJsonFile(
    paths.kernel.artifactIndex,
    defaultArtifactIndex(nowIso),
    (value) => KernelArtifactIndexSchema.safeParse(value).success
      ? KernelArtifactIndexSchema.parse(value)
      : null,
  )
  const verificationIndex = await readJsonFile(
    paths.kernel.verificationIndex,
    defaultVerificationIndex(nowIso),
    (value) => KernelVerificationIndexSchema.safeParse(value).success
      ? KernelVerificationIndexSchema.parse(value)
      : null,
  )
  const existingSession = await readJsonFile(
    sessionPath,
    defaultSessionState(canonicalSessionId, lineage, options.brainSessionId, nowIso, options),
    (value) => KernelSessionStateSchema.safeParse(value).success
      ? KernelSessionStateSchema.parse(value)
      : null,
  )
  const nextSession: KernelSessionState = {
    ...existingSession,
    lineage,
    brain_session_id: options.brainSessionId,
    opencode_session_id: options.opencodeSessionId ?? existingSession.opencode_session_id ?? null,
    legacy_session_id: options.legacySessionId ?? existingSession.legacy_session_id ?? null,
    role: options.role ?? existingSession.role ?? null,
    session_kind: options.sessionKind ?? existingSession.session_kind ?? null,
    workflow_id: options.workflowId ?? existingSession.workflow_id ?? null,
    todo_chain_id: options.todoChainId ?? existingSession.todo_chain_id ?? null,
    intent: {
      ...existingSession.intent,
      summary: options.intentSummary ?? existingSession.intent.summary,
    },
    updated_at: nowIso,
  }

  await Promise.all([
    writeJsonFile(paths.kernel.integrity, nextIntegrity),
    writeJsonFile(paths.kernel.sessionMap, nextSessionMap),
    writeJsonFile(paths.kernel.artifactIndex, {
      ...artifactIndex,
      updated_at: nowIso,
    }),
    writeJsonFile(paths.kernel.verificationIndex, {
      ...verificationIndex,
      updated_at: nowIso,
    }),
    writeJsonFile(sessionPath, nextSession),
  ])

  const neuron = buildHiveNeuron(paths, lineage, nextSession, nextIntegrity, config, nowIso)
  const parsedNeuron = HiveNeuronSchema.parse(neuron)
  await Promise.all([
    writeJsonFile(paths.kernel.hiveneuron, parsedNeuron),
    writeTextFile(paths.kernel.hivebrain, buildHiveBrain(lineage, nextSession, nextIntegrity, paths, nowIso)),
  ])

  return {
    lineage,
    canonicalSessionId,
    hiveneuronPath: paths.kernel.hiveneuron,
    hivebrainPath: paths.kernel.hivebrain,
    sessionMapPath: paths.kernel.sessionMap,
    sessionPath,
  }
}

/**
 * Resolve the dated meta-module file paths for a given date stamp.
 *
 * @param directory Project root containing `.hivemind`.
 * @param date Optional date to use for dated file names.
 * @returns Stable dated file paths under `.hivemind/meta-module/`.
 */
export function getMetaModulePaths(directory: string, date = new Date()) {
  const paths = getEffectivePaths(directory)
  const stamp = toDateStamp(date)
  return {
    healthStatus: join(paths.kernel.metaModuleDir, `health-status-${stamp}.md`),
    diagnosisTracking: join(paths.kernel.metaModuleDir, `diagnosis-tracking-${stamp}.md`),
    metaState: join(paths.kernel.metaModuleDir, `meta-state-${stamp}.md`),
  }
}

/**
 * Resolve the legacy archive root for a given date stamp.
 *
 * @param directory Project root containing `.hivemind`.
 * @param date Optional date to use for dated archive naming.
 * @returns Dated archive directory path.
 */
export function getLegacyArchivePath(directory: string, date = new Date()): string {
  const paths = getEffectivePaths(directory)
  return join(paths.kernel.archiveDir, `legacy-${toDateStamp(date)}`)
}

/**
 * Write dated meta-module artifacts for doctor/harness/reporting workflows.
 *
 * @param directory Project root containing `.hivemind`.
 * @param payload Content sections to persist under `.hivemind/meta-module/`.
 * @param date Optional date used for file naming.
 * @returns Paths to the dated meta-module artifacts.
 */
export async function writeKernelMetaModuleArtifacts(
  directory: string,
  payload: KernelMetaModulePayload,
  date = new Date(),
) {
  const paths = getMetaModulePaths(directory, date)
  await Promise.all([
    writeTextFile(paths.healthStatus, payload.healthStatusLines.join("\n")),
    writeTextFile(paths.diagnosisTracking, payload.diagnosisTrackingLines.join("\n")),
    writeTextFile(paths.metaState, payload.metaStateLines.join("\n")),
  ])
  return paths
}
