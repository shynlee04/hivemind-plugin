import { describe, expect, it, vi } from "vitest"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createDoctorCommand } from "../../../src/cli/commands/doctor.js"
import { bootstrapInit } from "../../../src/tools/config/bootstrap-init.js"

const TIMEOUT_30S = 30_000

async function createHealthyProject(): Promise<string> {
  const projectRoot = mkdtempSync(join(tmpdir(), "hivemind-doctor-"))
  await bootstrapInit({ projectRoot, scope: "project", nonInteractive: true })
  return projectRoot
}

describe("doctor command", () => {
  it("reports PASS rows and ALL CHECKS PASS on a healthy project", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({
        resolveProjectRoot: () => projectRoot,
        resolveSdk: () => "/sdk/path",
        runHealthCommand: () => ({ exitCode: 0 }),
        countSourceModules: () => 42,
      })

      const result = await command.handler({ flags: {}, positionals: [], argv: ["doctor"] })
      expect(result.exitCode).toBe(0)
      expect(result.output).toContain("Hivemind Health Check")
      expect(result.output).toContain("PASS")
      expect(result.output).toContain("Verdict: ALL CHECKS PASS")
      expect(result.output).toContain("typecheck")
      expect(result.output).toContain("tests")
      expect(result.output).toContain("modules")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("fails when typecheck or test health commands fail", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({
        resolveProjectRoot: () => projectRoot,
        resolveSdk: () => "/sdk/path",
        runHealthCommand: (script) => ({ exitCode: script === "test" ? 1 : 0, output: `${script} output` }),
        countSourceModules: () => 42,
      })

      const result = await command.handler({ flags: {}, positionals: [], argv: ["doctor"] })

      expect(result.exitCode).toBe(1)
      expect(result.output).toContain("tests")
      expect(result.output).toContain("FAIL")
      expect(result.output).toContain("test output")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("uses the default ESM-safe SDK resolver when no resolver override is provided", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({ resolveProjectRoot: () => projectRoot })
      const result = await command.handler({ flags: { check: "sdk" }, positionals: [], argv: ["doctor", "--check=sdk"] })
      expect(result.exitCode).toBe(0)
      expect(result.output).toContain("sdk")
      expect(result.output).toContain("PASS")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("supports explicit global-scope doctor checks while keeping local structure/config rooted in project", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({
        resolveProjectRoot: () => projectRoot,
        resolveSdk: () => "/sdk/path",
      })
      const result = await command.handler({ flags: { scope: "global", check: "structure" }, positionals: [], argv: ["doctor", "--scope=global", "--check=structure"] })
      expect(result.exitCode).toBe(0)
      expect(result.output).toContain("Primitive scope: global")
      expect(result.output).toContain(projectRoot)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("passes when primitive targets are real files", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({
        resolveProjectRoot: () => projectRoot,
        resolveSdk: () => "/sdk/path",
        runHealthCommand: () => ({ exitCode: 0 }),
        countSourceModules: () => 42,
      })

      const result = await command.handler({ flags: { check: "primitives" }, positionals: [], argv: ["doctor", "--check=primitives"] })

      expect(result.exitCode).toBe(0)
      expect(result.output).toContain("PASS")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("returns exit code 1 when structure check fails", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      rmSync(join(projectRoot, ".hivemind", "state", ".gitkeep"))
      const command = createDoctorCommand({
        resolveProjectRoot: () => projectRoot,
        resolveSdk: () => "/sdk/path",
        runHealthCommand: () => ({ exitCode: 0 }),
        countSourceModules: () => 42,
      })
      const result = await command.handler({ flags: {}, positionals: [], argv: ["doctor"] })
      expect(result.exitCode).toBe(1)
      expect(result.output).toContain("structure")
      expect(result.output).toContain("FAIL")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("returns exit code 64 for invalid --check values", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      const command = createDoctorCommand({ resolveProjectRoot: () => projectRoot, resolveSdk: () => "/sdk/path" })
      const result = await command.handler({ flags: { check: "bogus" }, positionals: [], argv: ["doctor", "--check=bogus"] })
      expect(result.exitCode).toBe(64)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("remains read-only and never calls write APIs", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    const writeSpy = vi.spyOn(process.stdout, "write")
    try {
      const command = createDoctorCommand({ resolveProjectRoot: () => projectRoot, resolveSdk: () => "/sdk/path" })
      await command.handler({ flags: { check: "config" }, positionals: [], argv: ["doctor", "--check=config"] })
      expect(writeSpy).not.toHaveBeenCalled()
    } finally {
      writeSpy.mockRestore()
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("fails config check when configs.json contains schema-invalid runtime values", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      writeFileSync(
        join(projectRoot, ".hivemind", "configs.json"),
        '{"$schema":"./configs.schema.json","mode":"totally-invalid"}\n',
        "utf8",
      )
      const command = createDoctorCommand({ resolveProjectRoot: () => projectRoot, resolveSdk: () => "/sdk/path" })
      const result = await command.handler({ flags: { check: "config" }, positionals: [], argv: ["doctor", "--check=config"] })
      expect(result.exitCode).toBe(1)
      expect(result.output).toContain("FAIL")
      expect(result.output).toContain("Invalid option")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })

  it("fails config check when configs.schema.json drifts from the canonical generated contract", { timeout: TIMEOUT_30S }, async () => {
    const projectRoot = await createHealthyProject()
    try {
      writeFileSync(join(projectRoot, ".hivemind", "configs.schema.json"), '{"type":"object","properties":{}}\n', "utf8")
      const command = createDoctorCommand({ resolveProjectRoot: () => projectRoot, resolveSdk: () => "/sdk/path" })
      const result = await command.handler({ flags: { check: "config" }, positionals: [], argv: ["doctor", "--check=config"] })
      expect(result.exitCode).toBe(1)
      expect(result.output).toContain("FAIL")
      expect(result.output).toContain("canonical generated runtime contract")
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
