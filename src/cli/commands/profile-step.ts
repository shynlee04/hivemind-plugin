import type * as ClackPrompts from "@clack/prompts"

import { listPresets } from "../../features/bootstrap/preset-loader.js"

type PromptModule = typeof ClackPrompts

/**
 * Present preset profiles and let user select one (or skip for manual config).
 *
 * @param prompts - Loaded clack prompts module.
 * @returns The selected preset name, or `null` if user chose manual config.
 */
export async function stepProfileSelection(
  prompts: PromptModule,
): Promise<string | null> {
  const presets = listPresets()

  if (presets.length === 0) {
    return null
  }

  const options = [
    { value: "__manual__", label: "Manual configuration", hint: "configure each setting step by step" },
    ...presets.map((p) => ({
      value: p.name,
      label: p.label,
      hint: p.description || `preset: ${p.name}`,
    })),
  ]

  const selected = await prompts.select({
    message: "Start with a preset profile? Choose 'Manual' to configure each setting.",
    initialValue: "default",
    options,
  })

  if (prompts.isCancel(selected) || selected === "__manual__") {
    return null
  }

  return selected as string
}
