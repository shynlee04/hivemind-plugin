import type { ValidationResult } from "../../shared/types.js"

/**
 * Validates command contract fields only (structural fields).
 * SDK-driven fields (agent, subtask, model, tools) are NOT validated here
 * as they inherit from runtime context.
 */
export function validateCommandContract(args: Record<string, unknown>): ValidationResult {
  const errors: string[] = []
  
  if (!args) {
    return {
      valid: false,
      errors: ["Arguments object is missing or null"],
    }
  }

  // Structural fields (required)
  if (!args.command || typeof args.command !== "string" || args.command.trim().length === 0) {
    errors.push("command: required, must be a non-empty string")
  }
  
  if (!args.description || typeof args.description !== "string" || args.description.trim().length === 0) {
    errors.push("description: required, must be a non-empty string")
  }
  
  if (!args.triggers || !Array.isArray(args.triggers) || args.triggers.length === 0) {
    errors.push("triggers: required, must be a non-empty array")
  } else {
    for (let i = 0; i < args.triggers.length; i++) {
      if (typeof args.triggers[i] !== "string" || args.triggers[i].trim().length === 0) {
        errors.push(`triggers[${i}]: must be a non-empty string`)
      }
    }
  }
  
  // SDK-driven fields (optional, NOT validated here)
  // agent, subtask, model, tools → inherit from context, skip validation
  
  // namespace field (optional, no validation yet)
  // Will be validated in Wave 2 when routing logic exists
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
