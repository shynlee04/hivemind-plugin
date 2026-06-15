import type * as ClackPrompts from "@clack/prompts"

import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

/**
 * Configure advanced settings (tool access, skill filter, document paths).
 * Sets `behavioral.tool_access_pattern`, `behavioral.skill_filter`,
 * and `behavioral.decision_speed`.
 */
export async function stepAdvanced(
  prompts: PromptModule,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  prompts.log.step("Advanced Settings")

  const showAdvanced = await prompts.confirm({
    message: "Configure advanced settings? (tool access, skill filter, decision speed)",
    initialValue: false,
  })

  if (prompts.isCancel(showAdvanced) || !showAdvanced) {
    return
  }

  const toolAccess = await prompts.select({
    message: "Tool access pattern — which tools are surfaced to agents",
    initialValue: config.behavioral?.tool_access_pattern ?? "full",
    options: [
      { value: "restricted", label: "restricted", hint: "essential tools only, reduced surface" },
      { value: "standard", label: "standard", hint: "normal set for most workflows" },
      { value: "full", label: "full", hint: "everything exposed, no restrictions (default)" },
    ],
  })

  if (!prompts.isCancel(toolAccess)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.tool_access_pattern = toolAccess as "restricted" | "standard" | "full"
  }

  const skillFilter = await prompts.select({
    message: "Skill filter — which skills are loaded into context",
    initialValue: config.behavioral?.skill_filter ?? "full",
    options: [
      { value: "curated", label: "curated", hint: "essential skills only, minimal context" },
      { value: "domain", label: "domain", hint: "project-relevant skills" },
      { value: "full", label: "full", hint: "all available skills, maximal context (default)" },
    ],
  })

  if (!prompts.isCancel(skillFilter)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.skill_filter = skillFilter as "curated" | "domain" | "full"
  }

  const decisionSpeed = await prompts.select({
    message: "Decision speed — how quickly the agent makes decisions",
    initialValue: config.behavioral?.decision_speed ?? "fast",
    options: [
      { value: "fast", label: "fast", hint: "quick execution, minimal deliberation (default)" },
      { value: "deliberate", label: "deliberate", hint: "thorough analysis before action" },
    ],
  })

  if (!prompts.isCancel(decisionSpeed)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral.decision_speed = decisionSpeed as "fast" | "deliberate"
  }
}
