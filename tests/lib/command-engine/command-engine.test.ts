import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  analyzeCommandContract,
  discoverCommandBundles,
  renderCommandContext,
  routeCommandPreview,
  transformCommandMessages,
} from "../../../src/routing/command-engine/index.js"

describe("command engine", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "command-engine-"))
    mkdirSync(join(projectRoot, ".opencode", "commands"), { recursive: true })
    writeFileSync(join(projectRoot, ".opencode", "commands", "phase59.md"), [
      "---",
      "description: Phase 59 command",
      "agent: hm-l2-general",
      "---",
      "Run phase 59 command with $ARGUMENTS.",
    ].join("\n"))
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("discovers command bundles without replacing primitive discovery", async () => {
    const discovery = await discoverCommandBundles({ projectRoot })

    expect(discovery.commands).toEqual([
      expect.objectContaining({ name: "phase59", source: "opencode-command" }),
    ])
    expect(discovery.warnings).toEqual([])
  })

  it("analyzes command contracts and reports failure states", async () => {
    const discovery = await discoverCommandBundles({ projectRoot })
    const contract = analyzeCommandContract(discovery.commands[0])

    expect(contract.valid).toBe(true)
    expect(contract.failureStates).toEqual(expect.arrayContaining(["missing_command", "pressure_blocked", "context_overflow"]))
  })

  it("renders bounded command context", () => {
    const rendered = renderCommandContext({
      commandName: "phase59",
      context: { long: "x".repeat(200) },
      maxCharacters: 80,
    })

    expect(rendered.truncated).toBe(true)
    expect(rendered.rendered.length).toBeLessThanOrEqual(80)
  })

  it("applies narrow command-specific message transforms only", () => {
    const transformed = transformCommandMessages({
      commandName: "phase59",
      arguments: "--dry-run",
      messages: [{ role: "user", content: "hello" }],
    })

    expect(transformed.messages).toEqual([
      { role: "user", content: "hello" },
      { role: "user", content: "/phase59 --dry-run" },
    ])
    expect(transformed.exclusions).toContain("broad-system-transform")
  })

  it("returns route previews only and never executes commands", async () => {
    const preview = await routeCommandPreview({ projectRoot, commandName: "phase59", tier: 0 })

    expect(preview.executable).toBe(false)
    expect(preview.route.action).toBe("preview_only")
    expect(preview.pressure.outcome).toBe("allow")
  })
})
