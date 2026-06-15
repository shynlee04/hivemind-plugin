import type * as ClackPrompts from "@clack/prompts"

import type { HivemindConfigs, HivemindMode, UserExpertLevel } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

export const EXPERTISE_OPTIONS = [
  { value: "clumsy-vibecoder" as const, label: "clumsy-vibecoder", hint: "new to coding, needs handholding" },
  { value: "beginner-friendly" as const, label: "beginner-friendly", hint: "some experience" },
  { value: "intermediate-high-level" as const, label: "intermediate-high-level", hint: "comfortable with tech (default)" },
  { value: "architecture-driven" as const, label: "architecture-driven", hint: "wants architecture-level decisions" },
  { value: "absolute-expert" as const, label: "absolute-expert", hint: "expert, minimal explanation" },
]

/**
 * Configure expertise level and behavioral profile.
 * Sets `user_expert_level`, `mode`, `behavioral.guardrail_level`,
 * `behavioral.delegation_mode`, and `behavioral.expertise`.
 */
export async function stepExpertiseAndBehavior(
  prompts: PromptModule,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  prompts.log.step("Expertise & Behavior")

  const expertLevel = await prompts.select({
    message: "Your expertise level — affects how much explanation the agent provides",
    initialValue: config.user_expert_level ?? "intermediate-high-level",
    options: EXPERTISE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      hint: opt.hint,
    })),
  })

  if (!prompts.isCancel(expertLevel)) {
    config.user_expert_level = expertLevel as UserExpertLevel
  }

  const mode = await prompts.select({
    message: "Working mode — controls guardrail intensity and workflow style",
    initialValue: config.mode ?? "expert-advisor",
    options: [
      { value: "expert-advisor", label: "expert-advisor", hint: "guided, structured, TDD-first (default)" },
      { value: "hivemind-powered", label: "hivemind-powered", hint: "full multi-agent orchestration with tracking" },
      { value: "free-style", label: "free-style", hint: "minimal guardrails, maximum freedom" },
    ],
  })

  if (!prompts.isCancel(mode)) {
    config.mode = mode as HivemindMode
  }

  const guardrailLevel = await prompts.select({
    message: "Guardrail level — how strictly the agent follows rules",
    initialValue: config.behavioral?.guardrail_level ?? "moderate",
    options: [
      { value: "strict", label: "strict", hint: "agent must follow all rules exactly" },
      { value: "moderate", label: "moderate", hint: "agent follows rules with some flexibility (default)" },
      { value: "permissive", label: "permissive", hint: "agent has maximum freedom" },
    ],
  })

  if (!prompts.isCancel(guardrailLevel)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.guardrail_level = guardrailLevel as "strict" | "moderate" | "permissive"
  }

  const delegationMode = await prompts.select({
    message: "Delegation mode — how subagents are dispatched",
    initialValue: config.behavioral?.delegation_mode ?? "waiter",
    options: [
      { value: "waiter", label: "waiter", hint: "synchronous, block until done (default)" },
      { value: "direct", label: "direct", hint: "fire-and-forget with result callback" },
      { value: "autonomous", label: "autonomous", hint: "full self-directed delegation" },
    ],
  })

  if (!prompts.isCancel(delegationMode)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.delegation_mode = delegationMode as "waiter" | "direct" | "autonomous"
  }

  const expertise = await prompts.select({
    message: "Agent self-model expertise — how confidently the agent acts",
    initialValue: config.behavioral?.expertise ?? "mid",
    options: [
      { value: "junior", label: "junior", hint: "asks more questions, seeks confirmation" },
      { value: "mid", label: "mid", hint: "balanced approach (default)" },
      { value: "senior", label: "senior", hint: "executes confidently, minimal questions" },
    ],
  })

  if (!prompts.isCancel(expertise)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.expertise = expertise as "junior" | "mid" | "senior"
  }
}
