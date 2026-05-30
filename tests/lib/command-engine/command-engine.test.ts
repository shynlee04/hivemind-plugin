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
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.OPENCODE_GLOBAL_CONFIG_DIR
    projectRoot = mkdtempSync(join(tmpdir(), "command-engine-"))
    process.env.OPENCODE_GLOBAL_CONFIG_DIR = join(projectRoot, "global-config")
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
    if (originalEnv === undefined) {
      delete process.env.OPENCODE_GLOBAL_CONFIG_DIR
    } else {
      process.env.OPENCODE_GLOBAL_CONFIG_DIR = originalEnv
    }
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

  it("scales context limit dynamically based on pressure band", () => {
    const steady = renderCommandContext({
      commandName: "phase59",
      context: { val: "x".repeat(20000) },
      maxCharacters: 18000,
    }, "steady")
    expect(steady.maxCharacters).toBe(16000)

    const advisory = renderCommandContext({
      commandName: "phase59",
      context: { val: "x".repeat(20000) },
      maxCharacters: 10000,
    }, "advisory")
    expect(advisory.maxCharacters).toBe(8000)

    const gated = renderCommandContext({
      commandName: "phase59",
      context: { val: "x".repeat(20000) },
      maxCharacters: 5000,
    }, "gated")
    expect(gated.maxCharacters).toBe(4000)

    const blocking = renderCommandContext({
      commandName: "phase59",
      context: { val: "x".repeat(20000) },
      maxCharacters: 3000,
    }, "blocking")
    expect(blocking.maxCharacters).toBe(2000)
  })
})
