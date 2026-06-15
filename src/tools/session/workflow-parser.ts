import * as fs from "node:fs"
import * as yaml from "yaml"
import type { ValidationResult } from "../../shared/types.js"

export interface WorkflowStep {
  id: string
  action: string
  condition?: string
  timeout?: number
}

export interface Workflow {
  name: string
  steps: WorkflowStep[]
  triggers?: string[]
}

/**
 * Parses YAML workflow file.
 * WARNING: Workflow execution deferred to later phase (P24.3.3.2).
 */
export async function parseWorkflowFile(filePath: string): Promise<Workflow | null> {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8")
    const data = yaml.parse(content)
    
    if (!data || typeof data !== "object") {
      return null
    }

    return {
      name: typeof data.name === "string" ? data.name : "",
      steps: Array.isArray(data.steps) ? data.steps : [],
      triggers: Array.isArray(data.triggers) ? data.triggers : [],
    }
  } catch (err) {
    return null
  }
}

/**
 * Validates workflow structure.
 */
export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: string[] = []
  
  if (!workflow) {
    return {
      valid: false,
      errors: ["Workflow is missing or null"],
    }
  }

  if (!workflow.name || typeof workflow.name !== "string" || workflow.name.trim().length === 0) {
    errors.push("name: required, must be a non-empty string")
  }
  
  if (!workflow.steps || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    errors.push("steps: required, must be a non-empty array")
  } else {
    workflow.steps.forEach((step, index) => {
      if (!step || typeof step !== "object") {
        errors.push(`steps[${index}]: must be a valid step object`)
        return
      }
      if (!step.id || typeof step.id !== "string" || step.id.trim().length === 0) {
        errors.push(`steps[${index}].id: required, must be a non-empty string`)
      }
      if (!step.action || typeof step.action !== "string" || step.action.trim().length === 0) {
        errors.push(`steps[${index}].action: required, must be a non-empty string`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
