/**
 * Core hook factory.
 *
 * Produces the `event`, `experimental.chat.system.transform`, and `shell.env`
 * hooks that route SDK events to the lifecycle manager.
 *
 * Stripped in 14-01: injection-engine, governance-engine removed.
 * Stripped in Phase 35/19: messages-transform removed (dead code). Notification-handler re-activated in Phase 16.2.
 *
 * BOOT-09 note: The OpenCode plugin SDK hook name is `experimental.chat.system.transform`
 * (NOT `system.transform`). Both are returned for backward compatibility with tests,
 * but only `experimental.chat.system.transform` is dispatched by the OpenCode runtime.
 */
import { asString, getNestedValue, isObject } from "../../shared/helpers.js"
import { getEventSessionID } from "../../shared/session-api.js"
import { classifyHookEffect } from "../composition/cqrs-boundary.js"
import { buildGovernanceBlock } from "../guards/governance-block.js"
import type { HookDependencies } from "../types.js"

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

type EventInput = { event?: unknown }
type SystemInput = { sessionID?: string }
type SystemOutput = { system?: unknown }
type ShellEnvOutput = { env?: unknown }

export interface CoreHooks {
  event: (input: EventInput) => Promise<void>
  "system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "experimental.chat.system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "shell.env": (input: Record<string, unknown>, output: ShellEnvOutput) => Promise<void>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates the core hooks using the provided dependency bundle.
 *
 * @param deps - Dependency bundle containing the lifecycle manager
 * @returns Object with `event`, `messages.transform`, and `shell.env` handlers
 */
export function createCoreHooks(deps: HookDependencies): CoreHooks {
  const { lifecycleManager } = deps
  const eventObservers = deps.eventObservers ?? []

  /**
   * Shared system prompt transformation handler.
   *
   * Used by both `system.transform` (backward compat / test facing) and
   * `experimental.chat.system.transform` (the actual OpenCode SDK hook name).
   *
   * Reads fresh Hivemind config from disk on every invocation so that
   * language/governance changes are picked up without a plugin restart.
   */
  async function handleSystemTransform(
    deps: HookDependencies,
    input: SystemInput,
    output: SystemOutput,
  ): Promise<void> {
    const sessionID = asString(getNestedValue(input, ["sessionID"]))
    if (!sessionID) return

    // Ensure output.system is an array for all injection blocks
    output.system = Array.isArray(output.system) ? output.system : []

    // BOOT-09: Read fresh config from disk — picks up language changes without restart.
    // Falls back to cached hivemindConfig if getFreshHivemindConfig is not wired.
    const config = deps.getFreshHivemindConfig?.() ?? deps.hivemindConfig

    // BOOT-09: Language Governance block (position 0 — BEFORE governance block)
    // Per D-05: language block injected at output.system[0] before governance block.
    // Per D-06: governance block format is LOCKED — do NOT modify buildGovernanceBlock().
    // Per D-07: strong framing with header, CRITICAL:, MUST imperative, override.
    if (deps.isMainSession?.(sessionID) && config) {
      const convLang = config.conversation_language
      const docLang = config.documents_and_artifacts_language
      const docPaths = config.document_paths?.join(", ") ?? ".hivemind/planning/"

      if (convLang) {
        const lines = [
          "--- Language Governance ---",
          `CRITICAL: You MUST respond in ${convLang}.`,
          `Even if the user writes in another language, you MUST override and respond in ${convLang}.`,
          "",
          `When writing .md files under configured document paths (e.g., ${docPaths}), you MUST write in ${docLang}.`,
        ]
        ;(output.system as string[]).unshift(lines.join("\n"))
      }
    }

    // CA-03: Governance block — always active, non-negotiable (D-07)
    // Injected BEFORE intake and behavioral blocks so it frames all other context.
    if (config) {
      const profile = deps.getBehavioralProfile?.(sessionID)
      const governanceBlock = buildGovernanceBlock(config, profile ?? undefined)
      ;(output.system as string[]).push(governanceBlock)
    }

    // Intake context injection
    if (deps.getIntake) {
      const intake = deps.getIntake(sessionID)
      if (intake) {
        const contextLines = [
          "Session intake context:",
          `- purpose: ${intake.purpose.purpose} (confidence: ${intake.purpose.confidence})`,
          `- language: ${intake.language.language}`,
          `- routing_target: ${intake.routingTarget}`,
        ]

        if (intake.profile.communicationStyle) {
          contextLines.push(`- communication_style: ${intake.profile.communicationStyle}`)
        }
        if (intake.warnings.length > 0) {
          contextLines.push(`- warnings: ${intake.warnings.join("; ")}`)
        }

        ;(output.system as string[]).push(contextLines.join("\n"))
      }
    }

    // Behavioral profile injection (CA-02: D-04, D-09, D-14)
    if (deps.getBehavioralProfile) {
      const profile = deps.getBehavioralProfile(sessionID)
      if (profile) {
        const bp = profile.behavioralProfile
        const lang = profile.language
        const rt = profile.merged

        const behavioralLines = [
          "Behavioral profile context:",
          `- behavioral.guardrailLevel: ${bp.guardrailLevel}`,
          `- behavioral.delegationMode: ${bp.delegationMode}`,
          `- behavioral.toolAccessPattern: ${bp.toolAccessPattern}`,
          `- behavioral.skillFilter: ${bp.skillFilter}`,
          `- language.conversation: ${lang.conversation}`,
          `- language.documents: ${lang.documents}`,
          `- runtime.communicationStyle: ${rt.communicationStyle}`,
          `- runtime.decisionSpeed: ${rt.decisionSpeed}`,
          `- runtime.expertise: ${rt.expertise}`,
          `- discuss.mode: ${profile.discussMode}`,
        ]

        ;(output.system as string[]).push(behavioralLines.join("\n"))
      }
    }
  }

  return {
    event: async ({ event }: EventInput): Promise<void> => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      lifecycleManager.handleEvent({ event, eventType, sessionID })
      await lifecycleManager.replayPendingNotificationsForEvent?.(sessionID, eventType)

      for (const observer of eventObservers) {
        await observer({ event })
      }
    },

    "system.transform": async (
      input: SystemInput,
      output: SystemOutput,
    ): Promise<void> => {
      return handleSystemTransform(deps, input, output)
    },

    "experimental.chat.system.transform": async (
      input: SystemInput,
      output: SystemOutput,
    ): Promise<void> => {
      return handleSystemTransform(deps, input, output)
    },

    "shell.env": async (
      _input: Record<string, unknown>,
      output: ShellEnvOutput,
    ): Promise<void> => {
      classifyHookEffect("shell.env")
      output.env = {
        ...(isObject(output.env) ? output.env : {}),
        CI: "true",
        GIT_TERMINAL_PROMPT: "0",
        NO_COLOR: "1",
        TERM: "dumb",
      }
    },
  }
}
