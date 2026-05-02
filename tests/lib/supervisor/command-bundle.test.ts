import { describe, it, expect } from "vitest"
import {
  sortCommandBundles,
  routeCommand,
  validateCommandContract,
  type CommandBundle,
  type CommandRouteResult,
} from "../../../src/lib/supervisor/command-bundle.js"

describe("command-bundle", () => {
  const bundles: CommandBundle[] = [
    { name: "help", description: "Show help", handler: "helpHandler", args: [] },
    { name: "run", description: "Run task", handler: "runHandler", args: ["taskId"] },
  ]

  it("sorts command bundles by name", () => {
    const found = sortCommandBundles(bundles)
    expect(found).toHaveLength(2)
    expect(found[0].name).toBe("help")
  })

  it("routes valid command to handler", () => {
    const result = routeCommand("help", bundles)
    expect(result.found).toBe(true)
    expect(result.handler).toBe("helpHandler")
    expect(result.errors).toHaveLength(0)
  })

  it("fails to route unknown command", () => {
    const result = routeCommand("unknown", bundles)
    expect(result.found).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("validates correct argument count", () => {
    const result = validateCommandContract("run", ["task-1"], bundles)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("flags missing arguments", () => {
    const result = validateCommandContract("run", [], bundles)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
