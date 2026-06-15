import type * as ClackPrompts from "@clack/prompts"

import type { HivemindConfigs, SupportedLanguage } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

export const LANGUAGE_OPTIONS = [
  { value: "en" as const, label: "English", hint: "Default" },
  { value: "vi" as const, label: "Tiếng Việt", hint: "Vietnamese" },
  { value: "zh" as const, label: "中文", hint: "Chinese" },
  { value: "fr" as const, label: "Français", hint: "French" },
  { value: "ja" as const, label: "日本語", hint: "Japanese" },
  { value: "ko" as const, label: "한국어", hint: "Korean" },
  { value: "de" as const, label: "Deutsch", hint: "German" },
  { value: "es" as const, label: "Español", hint: "Spanish" },
  { value: "th" as const, label: "ไทย", hint: "Thai" },
  { value: "id" as const, label: "Bahasa Indonesia", hint: "Indonesian" },
]

/**
 * Configure language and communication settings.
 * Sets `conversation_language`, `documents_and_artifacts_language`,
 * and `behavioral.communication_style`.
 */
export async function stepLanguageAndCommunication(
  prompts: PromptModule,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  prompts.log.step("Language & Communication")

  const conversationLanguage = await prompts.select({
    message: "Conversation language — language the AI uses to talk to you",
    initialValue: config.conversation_language ?? "en",
    options: LANGUAGE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: `${opt.label} (${opt.value})`,
      hint: opt.hint,
    })),
  })

  if (!prompts.isCancel(conversationLanguage)) {
    config.conversation_language = conversationLanguage as SupportedLanguage
  }

  const artifactLanguage = await prompts.select({
    message: "Documents language — language for written artifacts and summaries",
    initialValue: config.documents_and_artifacts_language ?? config.conversation_language ?? "en",
    options: LANGUAGE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: `${opt.label} (${opt.value})`,
      hint: opt.hint,
    })),
  })

  if (!prompts.isCancel(artifactLanguage)) {
    config.documents_and_artifacts_language = artifactLanguage as SupportedLanguage
  }

  const communicationStyle = await prompts.select({
    message: "Communication style — how verbose should agent responses be?",
    initialValue: config.behavioral?.communication_style ?? "mixed",
    options: [
      { value: "concise", label: "concise", hint: "short, direct answers" },
      { value: "detailed", label: "detailed", hint: "full explanations with context" },
      { value: "mixed", label: "mixed", hint: "context-dependent verbosity (default)" },
    ],
  })

  if (!prompts.isCancel(communicationStyle)) {
    config.behavioral = config.behavioral ?? {}
    config.behavioral!.communication_style = communicationStyle as "concise" | "detailed" | "mixed"
  }
}
