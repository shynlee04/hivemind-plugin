import {
  createRouter,
  parseArgs,
  type CliCommand,
  type CliRouterResult,
} from "../../src/cli/router.js"

function makeCmd(overrides: Partial<CliCommand> & { name: string }): CliCommand {
  return {
    name: overrides.name,
    summary: overrides.summary ?? `summary for ${overrides.name}`,
    handler: overrides.handler ?? (async () => ({ exitCode: 0 })),
    aliases: overrides.aliases,
  }
}

describe("cli/router — PH40-02 command discovery + routing", () => {
  describe("parseArgs", () => {
    it("parses 'cmd --flag value pos' into command + flags + positionals", () => {
      const out = parseArgs(["delegate-status", "--id", "del-1", "extra"])
      expect(out.command).toBe("delegate-status")
      expect(out.flags).toEqual({ id: "del-1" })
      expect(out.positionals).toEqual(["extra"])
    })

    it("treats a bare --flag (no value) as boolean true", () => {
      const out = parseArgs(["help", "--verbose"])
      expect(out.command).toBe("help")
      expect(out.flags).toEqual({ verbose: true })
    })

    it("treats --flag=value as a single argument", () => {
      const out = parseArgs(["help", "--name=foo"])
      expect(out.flags).toEqual({ name: "foo" })
    })

    it("returns empty command when argv is empty", () => {
      const out = parseArgs([])
      expect(out.command).toBe("")
      expect(out.flags).toEqual({})
      expect(out.positionals).toEqual([])
    })

    it("collects multiple positionals after the command", () => {
      const out = parseArgs(["run", "a", "b", "c"])
      expect(out.command).toBe("run")
      expect(out.positionals).toEqual(["a", "b", "c"])
    })
  })

  describe("createRouter — registry + dispatch", () => {
    it("dispatches to the registered command by name", async () => {
      const handler = vi.fn(async () => ({ exitCode: 0 }))
      const router = createRouter({
        commands: [makeCmd({ name: "ping", handler })],
      })

      const result = await router.run(["ping"])

      expect(handler).toHaveBeenCalledTimes(1)
      expect(result.exitCode).toBe(0)
    })

    it("dispatches via an alias", async () => {
      const handler = vi.fn(async () => ({ exitCode: 0 }))
      const router = createRouter({
        commands: [makeCmd({ name: "delegate-status", handler, aliases: ["ds", "ds-list"] })],
      })

      await router.run(["ds", "--id", "del-1"])

      expect(handler).toHaveBeenCalledTimes(1)
      const ctx = handler.mock.calls[0]?.[0] as { flags: Record<string, unknown> }
      expect(ctx.flags).toEqual({ id: "del-1" })
    })

    it("returns a [Harness] error for an unknown command (exit 64 = EX_USAGE)", async () => {
      const router = createRouter({
        commands: [makeCmd({ name: "ping" })],
      })

      const result = await router.run(["does-not-exist"])

      expect(result.exitCode).toBe(64)
      expect(result.error).toContain("[Harness]")
      expect(result.error).toContain("does-not-exist")
    })

    it("returns a usage-style result when argv is empty (no command provided)", async () => {
      const router = createRouter({
        commands: [makeCmd({ name: "ping" })],
      })

      const result = await router.run([])

      expect(result.exitCode).toBe(64)
      expect(result.error).toContain("[Harness]")
    })

    it("rejects duplicate command names with [Harness] error at construction", () => {
      expect(() =>
        createRouter({
          commands: [makeCmd({ name: "ping" }), makeCmd({ name: "ping" })],
        }),
      ).toThrow("[Harness]")
    })

    it("rejects an alias that collides with another command name", () => {
      expect(() =>
        createRouter({
          commands: [
            makeCmd({ name: "ping" }),
            makeCmd({ name: "pong", aliases: ["ping"] }),
          ],
        }),
      ).toThrow("[Harness]")
    })

    it("propagates the handler-returned exit code", async () => {
      const router = createRouter({
        commands: [
          makeCmd({
            name: "fail",
            handler: async (): Promise<CliRouterResult> => ({ exitCode: 7, error: "boom" }),
          }),
        ],
      })

      const result = await router.run(["fail"])

      expect(result.exitCode).toBe(7)
      expect(result.error).toBe("boom")
    })

    it("captures handler exceptions and returns exit 70 (EX_SOFTWARE) with [Harness] prefix", async () => {
      const router = createRouter({
        commands: [
          makeCmd({
            name: "throw",
            handler: async () => {
              throw new Error("kaboom")
            },
          }),
        ],
      })

      const result = await router.run(["throw"])

      expect(result.exitCode).toBe(70)
      expect(result.error).toContain("[Harness]")
      expect(result.error).toContain("kaboom")
    })

    it("exposes a stable list of commands in registration order", () => {
      const router = createRouter({
        commands: [
          makeCmd({ name: "alpha" }),
          makeCmd({ name: "beta", aliases: ["b"] }),
        ],
      })

      const names = router.commands().map((c) => c.name)
      expect(names).toEqual(["alpha", "beta"])
    })
  })
})
