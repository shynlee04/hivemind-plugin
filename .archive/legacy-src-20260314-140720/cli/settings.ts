import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  PROFILE_PRESETS,
  createConfig,
  isCoachAutomation,
  isValidExpertLevel,
  isValidGovernanceMode,
  isValidLanguage,
  isValidOutputStyle,
  normalizeAutomationInput,
  type AutomationLevel,
  type ExpertLevel,
  type GovernanceMode,
  type HiveMindConfig,
  type Language,
  type OutputStyle,
  type ProfilePresetKey,
} from "../schemas/config.js"
import { loadConfig, saveConfig } from "../lib/persistence.js"
import { createStateManager } from "../lib/persistence.js"
import { ensureSessionKernelState, syncKernelSteeringState } from "../lib/session-kernel.js"

export interface SettingsUpdateOptions {
  language?: Language
  governanceMode?: GovernanceMode
  expertLevel?: ExpertLevel
  outputStyle?: OutputStyle
  automationLevel?: AutomationLevel | string
  requireCodeReview?: boolean
  enforceTdd?: boolean
  profile?: ProfilePresetKey
}

export interface SettingsUpdateResult {
  config: HiveMindConfig
  updatedFields: string[]
  profileApplied?: string
}

function mergeWithProfile(
  current: HiveMindConfig,
  profileKey: ProfilePresetKey,
): HiveMindConfig {
  const preset = PROFILE_PRESETS[profileKey]
  return createConfig({
    ...current,
    governance_mode: preset.governance_mode,
    automation_level: preset.automation_level,
    agent_behavior: {
      ...current.agent_behavior,
      language: current.agent_behavior.language,
      expert_level: preset.expert_level,
      output_style: preset.output_style,
      constraints: {
        ...current.agent_behavior.constraints,
        require_code_review: preset.require_code_review,
        enforce_tdd: preset.enforce_tdd,
      },
    },
  })
}

function updateOpencodePermissions(directory: string, profileKey: ProfilePresetKey): void {
  const configPath = join(directory, "opencode.json")
  if (!existsSync(configPath)) return

  const preset = PROFILE_PRESETS[profileKey]
  let config: Record<string, unknown> = {}
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"))
  } catch {
    return
  }

  config.permission = {
    ...(typeof config.permission === "object" && config.permission !== null
      ? config.permission as Record<string, unknown>
      : {}),
    ...preset.permissions,
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8")
}

/**
 * Apply non-destructive settings updates to the current project configuration.
 *
 * @param directory Project root containing `.hivemind`.
 * @param options Requested settings changes.
 * @returns Updated config plus the list of fields that changed.
 */
export async function updateProjectSettings(
  directory: string,
  options: SettingsUpdateOptions,
): Promise<SettingsUpdateResult> {
  const current = await loadConfig(directory)
  let next = createConfig(current)
  const updatedFields: string[] = []

  if (options.profile) {
    next = mergeWithProfile(next, options.profile)
    updatedFields.push("profile")
    updateOpencodePermissions(directory, options.profile)
  }

  if (options.language && isValidLanguage(options.language) && next.language !== options.language) {
    next = createConfig({
      ...next,
      language: options.language,
      agent_behavior: {
        ...next.agent_behavior,
        language: options.language,
      },
    })
    updatedFields.push("language")
  }

  if (
    options.governanceMode &&
    isValidGovernanceMode(options.governanceMode) &&
    next.governance_mode !== options.governanceMode
  ) {
    next = createConfig({
      ...next,
      governance_mode: options.governanceMode,
    })
    updatedFields.push("governance_mode")
  }

  const normalizedAutomation = normalizeAutomationInput(options.automationLevel ?? undefined)
  if (normalizedAutomation && next.automation_level !== normalizedAutomation) {
    next = createConfig({
      ...next,
      automation_level: normalizedAutomation,
      governance_mode: isCoachAutomation(normalizedAutomation)
        ? "strict"
        : next.governance_mode,
    })
    updatedFields.push("automation_level")
  }

  if (
    options.expertLevel &&
    isValidExpertLevel(options.expertLevel) &&
    next.agent_behavior.expert_level !== options.expertLevel
  ) {
    next = createConfig({
      ...next,
      agent_behavior: {
        ...next.agent_behavior,
        expert_level: options.expertLevel,
      },
    })
    updatedFields.push("expert_level")
  }

  if (
    options.outputStyle &&
    isValidOutputStyle(options.outputStyle) &&
    next.agent_behavior.output_style !== options.outputStyle
  ) {
    next = createConfig({
      ...next,
      agent_behavior: {
        ...next.agent_behavior,
        output_style: options.outputStyle,
      },
    })
    updatedFields.push("output_style")
  }

  if (
    typeof options.requireCodeReview === "boolean" &&
    next.agent_behavior.constraints.require_code_review !== options.requireCodeReview
  ) {
    next = createConfig({
      ...next,
      agent_behavior: {
        ...next.agent_behavior,
        constraints: {
          ...next.agent_behavior.constraints,
          require_code_review: options.requireCodeReview,
        },
      },
    })
    updatedFields.push("require_code_review")
  }

  if (
    typeof options.enforceTdd === "boolean" &&
    next.agent_behavior.constraints.enforce_tdd !== options.enforceTdd
  ) {
    next = createConfig({
      ...next,
      agent_behavior: {
        ...next.agent_behavior,
        constraints: {
          ...next.agent_behavior.constraints,
          enforce_tdd: options.enforceTdd,
        },
      },
    })
    updatedFields.push("enforce_tdd")
  }

  if (updatedFields.length === 0) {
    await syncKernelSteeringState(directory, next)
    return { config: next, updatedFields }
  }

  await saveConfig(directory, next)
  const state = await createStateManager(directory).load()
  if (state) {
    await ensureSessionKernelState(directory, next, {
      brainSessionId: state.session.id,
      opencodeSessionId: state.session.opencode_session_id,
      role: state.session.role || "unresolved",
      lineageScope: state.session.lineage_scope,
      sessionKind: state.session.kind,
      intentSummary: "Settings update refresh",
    })
  } else {
    await syncKernelSteeringState(directory, next)
  }

  return {
    config: next,
    updatedFields,
    profileApplied: options.profile,
  }
}
