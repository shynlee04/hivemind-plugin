import { describe, it, expect } from "vitest"
import { resolveSeedProfileForAgent } from "../../../src/features/capability-gate/agent-capability-profiles.ts"

describe("build-agent passthrough", () => {
  it("returns BUILD_PASSTHROUGH_PROFILE for the native 'build' agent", () => {
    const profile = resolveSeedProfileForAgent("build")
    expect(profile.id).toBe("build-passthrough")
    expect(profile.passthrough).toBe(true)
    expect(profile.categories).toEqual([])
    expect(profile.tools).toEqual([])
  })

  it("does not classify 'build' as front-facing-orchestration despite substring match on 'orchestrator'", () => {
    const profile = resolveSeedProfileForAgent("build")
    expect(profile.id).not.toBe("front-facing-orchestration")
  })

  it("build-passthrough is case-insensitive", () => {
    expect(resolveSeedProfileForAgent("Build").id).toBe("build-passthrough")
    expect(resolveSeedProfileForAgent("BUILD").id).toBe("build-passthrough")
  })
})
