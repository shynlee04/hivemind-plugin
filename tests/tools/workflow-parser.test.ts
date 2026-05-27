import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { parseWorkflowFile, validateWorkflow } from "../../src/tools/session/workflow-parser.js"

describe("workflow-parser", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "workflow-parser-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("parses valid YAML workflow file", async () => {
    const yamlContent = `
name: deploy-flow
triggers:
  - deploy
steps:
  - id: step-1
    action: npm run build
  - id: step-2
    action: npm run test
`
    const filePath = join(tempDir, "workflow.yaml")
    writeFileSync(filePath, yamlContent)

    const workflow = await parseWorkflowFile(filePath)
    expect(workflow).not.toBeNull()
    expect(workflow!.name).toBe("deploy-flow")
    expect(workflow!.steps).toHaveLength(2)
    expect(workflow!.steps[0]).toEqual({ id: "step-1", action: "npm run build" })
    expect(workflow!.triggers).toEqual(["deploy"])
  })

  it("returns null for non-existent file", async () => {
    const workflow = await parseWorkflowFile(join(tempDir, "non-existent.yaml"))
    expect(workflow).toBeNull()
  })

  it("validates workflow structure correctly", () => {
    const validWorkflow = {
      name: "test-flow",
      steps: [
        { id: "s1", action: "do-something" },
      ],
    }

    const result = validateWorkflow(validWorkflow)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("detects validation errors for invalid structure", () => {
    const invalidWorkflow = {
      name: "",
      steps: [
        { id: "", action: "do-something" },
        { id: "s2", action: "" },
      ],
    }

    const result = validateWorkflow(invalidWorkflow as any)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("name: required, must be a non-empty string")
    expect(result.errors).toContain("steps[0].id: required, must be a non-empty string")
    expect(result.errors).toContain("steps[1].action: required, must be a non-empty string")
  })
})
