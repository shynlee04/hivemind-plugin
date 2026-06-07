import * as prompts from "@clack/prompts"

export interface TuiPromptOptions {
  type: "text" | "select"
  message: string
  initialValue?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
}

/**
 * Creates an interactive prompt on the TUI.
 * Robust fallback checks are implemented to prevent hanging in non-TTY environments.
 */
export async function createTuiPrompt(options: TuiPromptOptions): Promise<string | null> {
  // If not TTY, return initialValue or null to prevent hanging
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return options.initialValue ?? null
  }
  
  if (options.type === "text") {
    const value = await prompts.text({
      message: options.message,
      placeholder: options.hint,
      initialValue: options.initialValue,
    })
    if (prompts.isCancel(value)) return null
    return String(value)
  }
  
  if (options.type === "select") {
    const value = await prompts.select({
      message: options.message,
      options: options.options || [],
    })
    if (prompts.isCancel(value)) return null
    return String(value)
  }
  
  return null
}

/**
 * Supported language definitions for the init wizard.
 * Maps language codes to human-readable labels with native names.
 */
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", hint: "Default" },
  { value: "vi", label: "Tiếng Việt", hint: "Vietnamese" },
  { value: "zh", label: "中文", hint: "Chinese" },
  { value: "fr", label: "Français", hint: "French" },
  { value: "ja", label: "日本語", hint: "Japanese" },
  { value: "ko", label: "한국어", hint: "Korean" },
  { value: "de", label: "Deutsch", hint: "German" },
  { value: "es", label: "Español", hint: "Spanish" },
  { value: "th", label: "ไทย", hint: "Thai" },
  { value: "id", label: "Bahasa Indonesia", hint: "Indonesian" },
] as const

/**
 * Create a language select prompt configuration.
 * Reused by the init wizard for both conversation-language and
 * documents-language selection steps.
 *
 * @param message - The prompt message.
 * @param initialValue - Default language code.
 * @returns A prompts.select configuration object.
 */
export function createLanguageSelect(
  message: string,
  initialValue = "en",
): Parameters<typeof prompts.select>[0] {
  return {
    message,
    initialValue,
    options: LANGUAGE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: `${opt.label}  (${opt.value})`,
      hint: opt.hint,
    })),
  }
}

/**
 * Mode option definitions for the init wizard.
 */
const MODE_OPTIONS = [
  { value: "expert-advisor", label: "expert-advisor", hint: "guided, structured default" },
  { value: "hivemind-powered", label: "hivemind-powered", hint: "full multi-agent orchestration" },
  { value: "free-style", label: "free-style", hint: "minimal guardrails, maximum freedom" },
] as const

/**
 * Create a mode select prompt configuration.
 *
 * @param message - The prompt message.
 * @param initialValue - Default mode.
 * @returns A prompts.select configuration object.
 */
export function createModeSelect(
  message: string,
  initialValue = "expert-advisor",
): Parameters<typeof prompts.select>[0] {
  return {
    message,
    initialValue,
    options: MODE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      hint: opt.hint,
    })),
  }
}
