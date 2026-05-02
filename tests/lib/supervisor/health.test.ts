import { describe, it, expect } from "vitest"
import {
  getHealthStatus,
  getDiagnostics,
  type HealthStatus,
} from "../../../src/lib/supervisor/health.js"

describe("supervisor health", () => {
  it("reports healthy when all checks pass", () => {
    const status = getHealthStatus({
      configPath: ".opencode",
      pluginLoaded: true,
      sessionCount: 3,
    })
    expect(status.healthy).toBe(true)
    expect(status.checks.configPresent).toBe(true)
    expect(status.checks.pluginLoaded).toBe(true)
    expect(status.checks.sessionStoreWritable).toBe(true)
    expect(status.warnings).toHaveLength(0)
  })

  it("flags non-finite sessionCount as not writable", () => {
    const status = getHealthStatus({
      configPath: ".opencode",
      pluginLoaded: true,
      sessionCount: NaN,
    })
    expect(status.checks.sessionStoreWritable).toBe(false)
  })

  it("flags Infinity sessionCount as not writable", () => {
    const status = getHealthStatus({
      configPath: ".opencode",
      pluginLoaded: true,
      sessionCount: Infinity,
    })
    expect(status.checks.sessionStoreWritable).toBe(false)
  })

  it("reports unhealthy when config is missing", () => {
    const status = getHealthStatus({
      configPath: ".nonexistent",
      pluginLoaded: true,
      sessionCount: 0,
    })
    expect(status.healthy).toBe(false)
    expect(status.checks.configPresent).toBe(false)
    expect(status.warnings.length).toBeGreaterThan(0)
  })

  it("reports degraded when plugin not loaded", () => {
    const status = getHealthStatus({
      configPath: ".opencode",
      pluginLoaded: false,
      sessionCount: 1,
    })
    expect(status.healthy).toBe(false)
    expect(status.checks.pluginLoaded).toBe(false)
  })

  it("diagnostics include counts", () => {
    const diag = getDiagnostics({
      sessionCount: 5,
      delegationCount: 2,
      commandCount: 4,
    })
    expect(diag.sessions).toBe(5)
    expect(diag.delegations).toBe(2)
    expect(diag.commands).toBe(4)
    expect(diag.timestamp).toBeGreaterThan(0)
  })
})
