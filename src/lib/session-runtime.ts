import { mkdir } from "node:fs/promises"

import type { HiveMindConfig } from "../schemas/config.js"
import {
  createBrainState,
  generateSessionId,
  type BrainState,
  type SessionMode,
} from "../schemas/brain-state.js"
import type { SessionProfile } from "../schemas/session-profile.js"
import type { StateManager } from "./persistence.js"
import { getEffectivePaths, getSessionPaths } from "./paths.js"
import { createTree, saveTree, treeExists } from "./hierarchy-tree.js"
import { ensureSessionProfile } from "./session-profile.js"

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
 * @returns Bootstrap result describing the canonical state/profile that now exist on disk.
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

  return {
    state,
    profile,
    runtimeSessionId,
    profilePath: sessionPaths.profile,
    createdState,
    rewroteState,
    rewroteHierarchy,
  }
}
