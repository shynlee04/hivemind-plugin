/**
 * HiveMind Interactive Init — Guided setup wizard using @clack/prompts.
 *
 * When `npx hivemind init` is run without flags, this wizard guides users
 * through governance mode, language, automation level, expert level, and
 * output style — making the configuration discoverable and coherent.
 */

import * as p from "@clack/prompts"
import type { InitOptions } from "./init.js"
import type {
  GovernanceMode,
  Language,
  AutomationLevel,
  ExpertLevel,
  OutputStyle,
} from "../schemas/config.js"

/**
 * Run the interactive init wizard.
 * Returns InitOptions populated from user choices.
 * Returns null if user cancels.
 */
export async function runInteractiveInit(): Promise<InitOptions | null> {
  p.intro("🐝 HiveMind Context Governance — Setup Wizard")

  const governanceMode = await p.select({
    message: "Governance mode — how strict should session enforcement be?",
    options: [
      {
        value: "assisted" as GovernanceMode,
        label: "Assisted (recommended)",
        hint: "Session starts OPEN. Warns on drift but never blocks.",
      },
      {
        value: "strict" as GovernanceMode,
        label: "Strict",
        hint: "Session starts LOCKED. Must declare_intent before writing.",
      },
      {
        value: "permissive" as GovernanceMode,
        label: "Permissive",
        hint: "Always OPEN. Silent tracking only, zero pressure.",
      },
    ],
  })

  if (p.isCancel(governanceMode)) {
    p.cancel("Setup cancelled.")
    return null
  }

  const language = await p.select({
    message: "Language for agent responses?",
    options: [
      { value: "en" as Language, label: "English" },
      { value: "vi" as Language, label: "Tiếng Việt" },
    ],
  })

  if (p.isCancel(language)) {
    p.cancel("Setup cancelled.")
    return null
  }

  const automationLevel = await p.select({
    message: "Automation level — how much should HiveMind intervene?",
    options: [
      {
        value: "manual" as AutomationLevel,
        label: "Manual",
        hint: "Minimal automation. You drive everything.",
      },
      {
        value: "guided" as AutomationLevel,
        label: "Guided",
        hint: "Gentle nudges when drift detected.",
      },
      {
        value: "assisted" as AutomationLevel,
        label: "Assisted (recommended)",
        hint: "Active guidance with evidence-based warnings.",
      },
      {
        value: "full" as AutomationLevel,
        label: "Full",
        hint: "Maximum governance. System argues back with evidence when claims lack proof.",
      },
      {
        value: "retard" as AutomationLevel,
        label: '"I am retard — lead me"',
        hint: "Forces strict mode, skeptical review, code review required. Maximum handholding.",
      },
    ],
  })

  if (p.isCancel(automationLevel)) {
    p.cancel("Setup cancelled.")
    return null
  }

  // Skip expert/style for retard mode (auto-set)
  let expertLevel: ExpertLevel = "intermediate"
  let outputStyle: OutputStyle = "explanatory"
  let requireCodeReview = false
  let enforceTdd = false

  if (automationLevel !== "retard") {
    const expert = await p.select({
      message: "Your expertise level — affects response depth and assumptions?",
      options: [
        {
          value: "beginner" as ExpertLevel,
          label: "Beginner",
          hint: "Explain everything, assume little prior knowledge.",
        },
        {
          value: "intermediate" as ExpertLevel,
          label: "Intermediate (recommended)",
          hint: "Standard technical depth, balanced explanations.",
        },
        {
          value: "advanced" as ExpertLevel,
          label: "Advanced",
          hint: "Skip basics, focus on implementation details.",
        },
        {
          value: "expert" as ExpertLevel,
          label: "Expert",
          hint: "Minimal explanation, code-first, challenge my assumptions.",
        },
      ],
    })

    if (p.isCancel(expert)) {
      p.cancel("Setup cancelled.")
      return null
    }
    expertLevel = expert

    const style = await p.select({
      message: "Output style — how should the agent format responses?",
      options: [
        {
          value: "explanatory" as OutputStyle,
          label: "Explanatory (recommended)",
          hint: "Detailed explanations with reasoning.",
        },
        {
          value: "outline" as OutputStyle,
          label: "Outline",
          hint: "Bullet points and structured summaries.",
        },
        {
          value: "skeptical" as OutputStyle,
          label: "Skeptical",
          hint: "Critical review, challenge assumptions.",
        },
        {
          value: "architecture" as OutputStyle,
          label: "Architecture",
          hint: "Focus on design patterns and structure.",
        },
        {
          value: "minimal" as OutputStyle,
          label: "Minimal",
          hint: "Brief, code-only responses.",
        },
      ],
    })

    if (p.isCancel(style)) {
      p.cancel("Setup cancelled.")
      return null
    }
    outputStyle = style

    const extras = await p.multiselect({
      message: "Additional constraints (optional, press Enter to skip):",
      options: [
        {
          value: "code-review" as string,
          label: "Require code review",
          hint: "Agent must review code before accepting.",
        },
        {
          value: "tdd" as string,
          label: "Enforce TDD",
          hint: "Write failing test first, then implementation.",
        },
      ],
      required: false,
    })

    if (!p.isCancel(extras)) {
      requireCodeReview = extras.includes("code-review")
      enforceTdd = extras.includes("tdd")
    }
  }

  // Summary
  p.note(
    [
      `Governance:  ${automationLevel === "retard" ? "strict (forced)" : governanceMode}`,
      `Language:    ${language === "en" ? "English" : "Tiếng Việt"}`,
      `Automation:  ${automationLevel}${automationLevel === "retard" ? ' ("I am retard — lead me")' : ""}`,
      `Expert:      ${automationLevel === "retard" ? "beginner (forced)" : expertLevel}`,
      `Style:       ${automationLevel === "retard" ? "skeptical (forced)" : outputStyle}`,
      requireCodeReview || automationLevel === "retard" ? `✓ Code review required` : "",
      enforceTdd ? `✓ TDD enforced` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Configuration Summary"
  )

  const shouldProceed = await p.confirm({
    message: "Proceed with this configuration?",
  })

  if (p.isCancel(shouldProceed) || !shouldProceed) {
    p.cancel("Setup cancelled.")
    return null
  }

  p.outro("Initializing HiveMind...")

  return {
    governanceMode: automationLevel === "retard" ? "strict" : governanceMode,
    language,
    automationLevel,
    expertLevel: automationLevel === "retard" ? "beginner" : expertLevel,
    outputStyle: automationLevel === "retard" ? "skeptical" : outputStyle,
    requireCodeReview: requireCodeReview || automationLevel === "retard",
    enforceTdd,
  }
}
