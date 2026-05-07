import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import { createVersionCommand, versionCmd } from "../../../src/cli/commands/version.js"
import { createRouter } from "../../../src/cli/router.js"

describe("version command", () => {
  it("returns the package.json version", async () => {
    const expectedVersion = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { version: string }
    const result = await versionCmd.handler({ flags: {}, positionals: [], argv: ["version"] })
    expect(result.output).toBe(expectedVersion.version)
  })

  it("routes through the --version alias", async () => {
    const router = createRouter({ commands: [createVersionCommand()] })
    const result = await router.run(["--version"])
    expect(result.exitCode).toBe(0)
    expect(result.output).toBeTruthy()
  })
})
