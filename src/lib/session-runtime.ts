/**
 * Session Runtime — Bootstrap, profile, and state management.
 *
 * Consolidated from: session-runtime.ts + session-profile.ts
 * Date: 2026-03-12
 *
 * @module session-runtime
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"

import type { HiveMindConfig } from "../schemas/config.js"
import {
  createBrainState,
  generateSessionId,
  type BrainState,
  type SessionMode,
} from "../schemas/brain-state.js"
import {
  createSessionProfile,
  SessionProfileSchema,
  type SessionProfile,
  type SessionProfileSeed,
} from "../schemas/session-profile.js"
import type { StateManager } from "./persistence.js"
import { getEffectivePaths, getSessionPaths } from "./paths.js"
import { createTree, saveTree, treeExists } from "./hierarchy-tree.js"
import { ensureSessionKernelState } from "./session-kernel.js"

// ─── Session Profile (absorbed from session-profile.ts) ──────────────────────

export interface EnsureSessionProfileOptions {
  force?: boolean
}

async function readSessionProfile(path: string): Promise<unknown> {
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Ensure a compatibility session-profile exists under the canonical runtime
 * session-profile directory instead of mixing profile shims into
 * `sessions/active/`.
 *
 * @param projectRoot - Project root containing `.hivemind/`.
 * @param seed - Runtime/bootstrap seed values for the compatibility profile.
 * @param options - Optional force rewrite toggle.
 * @returns The normalized profile payload that now exists on disk.
 */
export async function ensureSessionProfile(
  projectRoot: string,
  seed: SessionProfileSeed,
  options: EnsureSessionProfileOptions = {},
): Promise<SessionProfile> {
  const sessionPaths = getSessionPaths(projectRoot, seed.sessionId)
  await mkdir(sessionPaths.profileDir, { recursive: true })

  const existing = SessionProfileSchema.safeParse(await readSessionProfile(sessionPaths.profile))
  const profile = createSessionProfile({
    sessionId: seed.sessionId,
    brainSessionId: seed.brainSessionId ?? (existing.success ? existing.data.brain_session_id : null),
    agent: seed.agent ?? (existing.success ? existing.data.agent : "unresolved"),
    lineageScope: seed.lineageScope ?? (existing.success ? existing.data.lineage_scope : "unknown"),
    sessionKind: seed.sessionKind ?? (existing.success ? existing.data.session_kind : "unresolved"),
    createdAt: existing.success ? existing.data.created_at : seed.createdAt,
    updatedAt: seed.updatedAt,
    version: seed.version ?? (existing.success ? existing.data.version : undefined),
  })

  if (
    options.force ||
    !existing.success ||
    JSON.stringify(existing.data) !== JSON.stringify(profile)
  ) {
    await writeFile(sessionPaths.profile, `${JSON.stringify(profile, null, 2)}\n`, "utf-8")
  }

  return profile
}

// ─── Session Runtime Bootstrap ───────────────────────────────────────────────

export interface SessionRuntimeBootstrapOptions {
  force?: boolean
  runtimeSessionId?: string | null
  brainSessionId?: string | null
  role?: string | null
  lineageScope?: BrainState["session"]["lineage_scope"]
  sessionKind?: BrainState["session"]["kind"]
  mode?: SessionMode
}

export interface SessionRuntimeBootstrapResult {
  state: BrainState
  profile: SessionProfile
  runtimeSessionId: string
  profilePath: string
  kernelSessionId: string
  hiveneuronPath: string
  hivebrainPath: string
  sessionMapPath: string
  kernelSessionPath: string
  createdState: boolean
  rewroteState: boolean
  rewroteHierarchy: boolean
}

function hasCanonicalRuntimeStateShape(state: BrainState | null): state is BrainState {
  if (!state || typeof state !== "object") {
    return false
  }
  const session = (state as BrainState).session
  const hierarchy = (state as BrainState).hierarchy
  return typeof session === "object" && session !== null && typeof hierarchy === "object" && hierarchy !== null
}

/**
 * Ensure the canonical runtime owns session bootstrap state, hierarchy seed, and
 * the compatibility profile shim from one lib-controlled path.
 *
 * This collapses overlapping ownership that previously lived across
 * `event-handler.ts` and `hivemind-bootstrap.ts`.
 *
 * @param directory - Project root containing the `.hivemind` runtime.
 * @param stateManager - Canonical state manager responsible for `brain.json`.
 * @param config - Loaded HiveMind configuration used when a new brain state is required.
 * @param options - Runtime/bootstrap seed values and optional force rewrite flag.
 * @returns Bootstrap result describing the canonical state, runtime profile, and session-kernel projection that now exist on disk.
 */
export async function ensureSessionRuntimeBootstrap(
  directory: string,
  stateManager: StateManager,
  config: HiveMindConfig,
  options: SessionRuntimeBootstrapOptions = {},
): Promise<SessionRuntimeBootstrapResult> {
  const paths = getEffectivePaths(directory)
  await Promise.all([
    mkdir(paths.stateDir, { recursive: true }),
    mkdir(paths.sessionsDir, { recursive: true }),
    mkdir(paths.activeDir, { recursive: true }),
    mkdir(paths.sessionRuntimeDir, { recursive: true }),
  ])

  const force = options.force === true
  const now = Date.now()
  const existingState = await stateManager.load()

  let state = hasCanonicalRuntimeStateShape(existingState) ? existingState : null
  let createdState = false
  let rewroteState = false

  if (!state || force) {
    const nextBrainSessionId = options.brainSessionId ?? state?.session.id ?? generateSessionId()
    const nextMode = options.mode ?? state?.session.mode ?? "exploration"
    state = createBrainState(nextBrainSessionId, config, nextMode)
    createdState = !existingState
    rewroteState = true
  }

  const runtimeSessionId =
    options.runtimeSessionId
    ?? state.session.opencode_session_id
    ?? state.session.id

  const nextRole = options.role ?? state.session.role ?? ""
  const nextLineageScope = options.lineageScope ?? state.session.lineage_scope
  const nextSessionKind = options.sessionKind ?? state.session.kind

  const shouldWriteState =
    rewroteState
    || state.session.opencode_session_id !== runtimeSessionId
    || state.session.role !== nextRole
    || state.session.lineage_scope !== nextLineageScope
    || state.session.kind !== nextSessionKind
    || state.session.last_activity !== now

  if (shouldWriteState) {
    state = {
      ...state,
      session: {
        ...state.session,
        opencode_session_id: runtimeSessionId,
        role: nextRole,
        lineage_scope: nextLineageScope,
        kind: nextSessionKind,
        last_activity: now,
      },
    }
    await stateManager.save(state)
    rewroteState = true
  }

  let rewroteHierarchy = false
  if (force || !treeExists(directory)) {
    await saveTree(directory, createTree())
    rewroteHierarchy = true
  }

  const sessionPaths = getSessionPaths(directory, runtimeSessionId)
  await mkdir(sessionPaths.profileDir, { recursive: true })
  const profile = await ensureSessionProfile(
    directory,
    {
      sessionId: runtimeSessionId,
      brainSessionId: state.session.id,
      agent: nextRole || "unresolved",
      lineageScope: nextLineageScope,
      sessionKind: nextSessionKind,
      updatedAt: now,
    },
    { force },
  )

  const kernel = await ensureSessionKernelState(directory, config, {
    brainSessionId: state.session.id,
    opencodeSessionId: runtimeSessionId,
    role: nextRole || "unresolved",
    lineageScope: nextLineageScope,
    sessionKind: nextSessionKind,
    intentSummary: "OpenCode-native runtime bootstrap",
    force,
  })

  return {
    state,
    profile,
    runtimeSessionId,
    profilePath: sessionPaths.profile,
    kernelSessionId: kernel.canonicalSessionId,
    hiveneuronPath: kernel.hiveneuronPath,
    hivebrainPath: kernel.hivebrainPath,
    sessionMapPath: kernel.sessionMapPath,
    kernelSessionPath: kernel.sessionPath,
    createdState,
    rewroteState,
    rewroteHierarchy,
  }
}
