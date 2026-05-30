import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { executeCommandEngineToolAction } from "../../src/tools/hivemind/hivemind-command-engine.js"

describe("hivemind-command-engine tool", () => {
  let projectRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "command-engine-tool-"))
    mkdirSync(join(projectRoot, ".opencode", "commands"), { recursive: true })
    writeFileSync(join(projectRoot, ".opencode", "commands", "route-me.md"), "---\ndescription: Route me\n---\nBody")
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
  })

  it("returns route previews rather than command execution", async () => {
    const result = await executeCommandEngineToolAction(projectRoot, { action: "route_preview", commandName: "route-me" })

    expect(result).toEqual(expect.objectContaining({ executable: false }))
    expect(JSON.stringify(result)).not.toContain("spawn")
  })
})
