export interface InjectionBudget {
  system_chars: number
  message_chars: number
  total_chars: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Allocate shared prompt-injection budget for system + message channels.
 * Bootstrap turns bias system channel to establish contract/governance.
 */
export function allocateBudget(
  turnCount: number,
  contextWindowChars = 16000
): InjectionBudget {
  const bootstrapTurn = turnCount <= 2
  const adaptiveTotal = clamp(Math.floor(contextWindowChars * 0.18), 2200, 32000)
  const adaptiveSystem = Math.floor(adaptiveTotal * (bootstrapTurn ? 0.62 : 0.48))
  const adaptiveMessage = adaptiveTotal - adaptiveSystem

  // Compatibility floors preserve previously stable prompt/checklist density.
  const systemChars = Math.max(adaptiveSystem, bootstrapTurn ? 3200 : 2200)
  const messageChars = Math.max(adaptiveMessage, 1000)
  const total = systemChars + messageChars

  return {
    system_chars: systemChars,
    message_chars: messageChars,
    total_chars: total,
  }
}
