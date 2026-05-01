import { discoverCommands, validateCommand } from "../../src/cli/discovery.js"
import type { CliCommand } from "../../src/cli/router.js"

describe("cli/discovery — PH40-02 command discovery system", () => {
  describe("validateCommand", () => {
    it("accepts a well-formed command", () => {
      const cmd: CliCommand = {
        name: "ping",
        summary: "Ping the harness",
        handler: async () => ({ exitCode: 0 }),
      }
      expect(() => validateCommand(cmd)).not.toThrow()
    })

    it("rejects a command with an empty name", () => {
      expect(() =>
        validateCommand({
          name: "",
          summary: "x",
          handler: async () => ({ exitCode: 0 }),
        }),
      ).toThrow("[Harness]")
    })

    it("rejects a command with an empty summary", () => {
      expect(() =>
        validateCommand({
          name: "ping",
          summary: "",
          handler: async () => ({ exitCode: 0 }),
        }),
      ).toThrow("[Harness]")
    })

    it("rejects whitespace-only command names", () => {
      expect(() =>
        validateCommand({
          name: "   ",
          summary: "x",
          handler: async () => ({ exitCode: 0 }),
        }),
      ).toThrow("[Harness]")
    })

    it("rejects command names with whitespace inside", () => {
      expect(() =>
        validateCommand({
          name: "bad name",
          summary: "x",
          handler: async () => ({ exitCode: 0 }),
        }),
      ).toThrow("[Harness]")
    })
  })

  describe("discoverCommands", () => {
    it("returns commands from each provided source in registration order", () => {
      const a: CliCommand = {
        name: "alpha",
        summary: "first",
        handler: async () => ({ exitCode: 0 }),
      }
      const b: CliCommand = {
        name: "beta",
        summary: "second",
        handler: async () => ({ exitCode: 0 }),
      }
      const c: CliCommand = {
        name: "gamma",
        summary: "third",
        handler: async () => ({ exitCode: 0 }),
      }

      const commands = discoverCommands([
        { name: "core", commands: [a] },
        { name: "extras", commands: [b, c] },
      ])

      expect(commands.map((cmd) => cmd.name)).toEqual(["alpha", "beta", "gamma"])
    })

    it("deduplicates by command name and throws [Harness] when a duplicate is supplied", () => {
      const a: CliCommand = {
        name: "ping",
        summary: "A",
        handler: async () => ({ exitCode: 0 }),
      }
      const aDuplicate: CliCommand = {
        name: "ping",
        summary: "B",
        handler: async () => ({ exitCode: 0 }),
      }

      expect(() =>
        discoverCommands([
          { name: "core", commands: [a] },
          { name: "extras", commands: [aDuplicate] },
        ]),
      ).toThrow("[Harness]")
    })

    it("validates every command in every source (rejects malformed entries)", () => {
      expect(() =>
        discoverCommands([
          {
            name: "core",
            commands: [
              {
                name: "",
                summary: "broken",
                handler: async () => ({ exitCode: 0 }),
              },
            ],
          },
        ]),
      ).toThrow("[Harness]")
    })

    it("returns an empty array when no sources are provided", () => {
      expect(discoverCommands([])).toEqual([])
    })
  })
})
