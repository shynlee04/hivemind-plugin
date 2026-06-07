import { buildHivemindCli, runCli, type CliIO } from "../../src/cli/index.js"

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
  describe("buildHivemindCli", () => {
    it("registers 5 commands: help/init/doctor/recover/version (all except init are deprecation shims)", () => {
      const router = buildHivemindCli()
      const names = router.commands().map((c) => c.name)
      expect(names).toEqual(["help", "init", "doctor", "recover", "version"])
      // help has --help / -h aliases for backward compatibility
      const help = router.commands().find((c) => c.name === "help")
      expect(help?.aliases).toEqual(["--help", "-h"])
      // All non-init commands have deprecation summaries
      for (const name of ["help", "doctor", "recover", "version"]) {
        const cmd = router.commands().find((c) => c.name === name)
        expect(cmd?.summary).toContain("deprecated")
      }
    })

    it("appends extra commands after the built-ins, registration order preserved", () => {
      const router = buildHivemindCli([
        { name: "ping", summary: "ping", handler: async () => ({ exitCode: 0 }) },
      ])
      const names = router.commands().map((c) => c.name)
      expect(names).toEqual(["help", "init", "doctor", "recover", "version", "ping"])
    })

    it("rejects an extra command whose name collides with a built-in", () => {
      expect(() =>
        buildHivemindCli([
          {
            name: "help",
            summary: "duplicate",
            handler: async () => ({ exitCode: 0 }),
          },
        ]),
      ).toThrow("[Hivemind]")
    })
  })

  describe("runCli", () => {
    it("runs `help` and writes a deprecation message to stderr with exit 0", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["help"], io)
      expect(exit).toBe(0)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("/hm-help")
    })

    it("writes a [Hivemind] error to stderr and exits 64 for unknown commands", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["does-not-exist"], io)
      expect(exit).toBe(64)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("does-not-exist")
    })

    it("writes a [Hivemind] usage error to stderr and exits 64 when no command is given", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli([], io)
      expect(exit).toBe(64)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Hivemind]")
    })

    it("dispatches --help to the help deprecation shim", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["--help"], io)
      expect(exit).toBe(0)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("/hm-help")
    })

    it("routes doctor through its deprecation shim", async () => {
      const { io, stdout, stderr } = mkIO()
      const exit = await runCli(["doctor"], io)
      expect(exit).toBe(0)
      expect(stdout.join("")).toBe("")
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("/hm-doctor")
    })

    it("routes recover through its deprecation shim", async () => {
      const { io, stderr } = mkIO()
      const exit = await runCli(["recover"], io)
      expect(exit).toBe(0)
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("/hm-recover")
    })

    it("routes version through its deprecation shim", async () => {
      const { io, stderr } = mkIO()
      const exit = await runCli(["version"], io)
      expect(exit).toBe(0)
      expect(stderr.join("")).toContain("[Hivemind]")
      expect(stderr.join("")).toContain("/hm-about")
    })
  })
})
