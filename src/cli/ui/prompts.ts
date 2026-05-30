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
