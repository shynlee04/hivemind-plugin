import { buildHarnessCli, runCli, type CliIO } from "../../src/cli/index.js"

function mkIO(): { io: CliIO; stdout: string[]; stderr: string[] } {
  const stdout: string[] = []
  const stderr: string[] = []
  return {
    stdout,
    stderr,
    io: {
      stdout: (chunk) => stdout.push(chunk),
      stderr: (chunk) => stderr.push(chunk),
    },
  }
}

describe("cli/index — PH40-01 entrypoint integration", () => {
  describe("buildHarnessCli", () => {
    it("registers a built-in help command (with --help / -h aliases)", () => {
      const router = buildHarnessCli()
      const names = router.commands().map((c) => c.name)
      expect(names).toContain("help")
      expect(names).toEqual(["help", "init", "doctor", "recover", "version"])
      const help = router.commands().find((c) => c.name === "help")
      expect(help?.aliases).toEqual(expect.arrayContaining(["--help", "-h"]))
    })

    it("appends extra commands after the built-ins, registration order preserved", () => {
      const router = buildHarnessCli([
        { name: "ping", summary: "ping", handler: async () => ({ exitCode: 0 }) },
      ])
      const names = router.commands().map((c) => c.name)
      expect(names).toEqual(["help", "init", "doctor", "recover", "version", "ping"])
    })

    it("rejects an extra command whose name collides with a built-in", () => {
      expect(() =>
        buildHarnessCli([
          {
            name: "help",
            summary: "duplicate",
            handler: async () => ({ exitCode: 0 }),
          },
        ]),
      ).toThrow("[Harness]")
    })
  })

  describe("runCli", () => {
    it("runs `help` and writes the listing to stdout with exit 0", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["help"], io)
      expect(exit).toBe(0)
      const out = stdout.join("")
      expect(out).toContain("help")
      expect(out).toContain("init")
      expect(out).toContain("doctor")
      expect(out).toContain("recover")
      expect(out).toContain("version")
      expect(out).toContain("Available commands:")
      expect(stderr.join("")).toBe("")
    })

    it("writes a [Harness] error to stderr and exits 64 for unknown commands", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["does-not-exist"], io)
      expect(exit).toBe(64)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Harness]")
      expect(stderr.join("")).toContain("does-not-exist")
    })

    it("writes a [Harness] usage error to stderr and exits 64 when no command is given", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli([], io)
      expect(exit).toBe(64)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Harness]")
    })

    it("dispatches to the --help alias the same as the help command", async () => {
      const { io, stdout } = mkIO()
      const exit = await runCli(["--help"], io)
      expect(exit).toBe(0)
      expect(stdout.join("")).toContain("Available commands:")
    })

    it("routes doctor --help through the default built-in registry", async () => {
      // Full npm test is executed as BOOT-02 phase verification; keep this focused on default registration reachability.
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["doctor", "--help"], io)
      expect(exit).toBe(0)
      expect(stdout.join("")).toContain("Usage: hivemind doctor")
      expect(stderr.join("")).toBe("")
    })
  })
})
