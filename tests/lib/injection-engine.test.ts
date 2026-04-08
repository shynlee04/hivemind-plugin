import { describe, expect, it } from "vitest"
import { evaluateInjections } from "../../src/lib/injection-engine.js"
import type { DelegationRouteResolution } from "../../src/lib/types.js"

function buildDelegation() {
  return {
    rootID: "root-1",
    depth: 2,
    budgetUsed: 1,
    agent: "builder" as const,
    category: "implementation" as const,
    model: "gpt-5.4",
    queueKey: "gpt-5.4:builder:implementation",
  }
}

function buildRoute(overrides: Partial<DelegationRouteResolution> = {}): DelegationRouteResolution {
  return {
    effectiveAgent: "builder",
    presetKey: "builder",
    temperature: 0.15,
    fallbackUsed: false,
    rationale: "matched builder route",
    guidanceText: "Implement directly and keep the patch focused.",
    modelSource: "category",
    agentSource: "category",
    temperatureSource: "category",
    warnings: [],
    ...overrides,
  }
}

describe("evaluateInjections", () => {
  it("returns matching injections from live runtime context", () => {
    const result = evaluateInjections({
      sessionID: "sess-1",
      phase: "session-start",
      agent: "builder",
      category: "implementation",
      delegation: {
        rootID: "root-1",
        depth: 2,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      route: buildRoute(),
      recovery: {
        sessionID: "sess-1",
        assessment: {
          level: "medium",
          stale: true,
          suspicious: false,
          lastActivityAt: 1,
          stalenessMs: 1000,
          activeDelegations: 1,
          warnings: ["recovered warning"],
          recommendedAction: "review",
          reasons: ["Session state is stale and should be reviewed before resuming."],
        },
        warningSnapshot: ["recovered warning"],
        pendingDelegation: "running",
        lastActivityAt: 1,
        resumeSummary: "Review before resuming.",
      },
    })

    expect(result.injections.rules).toEqual([
      "Honor the routed builder specialist guidance for this session.",
      "Preserve delegated scope and report back through the parent lineage before expanding work.",
      "Review recovered session state before resuming autonomous work.",
    ])
    expect(result.injections.commands).toEqual(["record-handoff-context", "review-recovery-state"])
    expect(result.injections.skills).toEqual(["builder-specialist-lane", "delegation-hygiene", "session-recovery-review"])
    expect(result.injections.tools).toEqual(["task", "read"])
    expect(result.auditLog.filter((entry) => entry.decision === "applied")).toHaveLength(3)
  })

  it.each([
    {
      effectiveAgent: "researcher" as const,
      expectedRule: "Honor the routed researcher specialist guidance for this session.",
      expectedSkill: "researcher-specialist-lane",
    },
    {
      effectiveAgent: "critic" as const,
      expectedRule: "Honor the routed critic specialist guidance for this session.",
      expectedSkill: "critic-specialist-lane",
    },
  ])(
    "renders specialist-route guidance from the resolved $effectiveAgent route",
    ({ effectiveAgent, expectedRule, expectedSkill }) => {
      const result = evaluateInjections({
        sessionID: `sess-${effectiveAgent}`,
        phase: "session-start",
        agent: effectiveAgent,
        category: effectiveAgent === "researcher" ? "research" : "review",
        delegation: buildDelegation(),
        route: buildRoute({
          effectiveAgent,
          presetKey: effectiveAgent,
          rationale: `matched ${effectiveAgent} route`,
        }),
      })

      expect(result.injections.rules).toContain(expectedRule)
      expect(result.injections.rules).not.toContain(
        "Honor the routed builder specialist guidance for this session.",
      )
      expect(result.injections.skills).toContain(expectedSkill)
      expect(result.injections.skills).not.toContain("builder-specialist-lane")
      expect(result.auditLog).toContainEqual(
        expect.objectContaining({
          injectionID: "specialist-route-guidance",
          decision: "applied",
          reason: `Route matched the ${effectiveAgent} specialist lane.`,
        }),
      )
    },
  )

  it("returns no injections when the runtime context does not match any policy", () => {
    const result = evaluateInjections({
      sessionID: "sess-2",
      phase: "compaction",
      agent: "builder",
      category: "implementation",
      delegation: {
        rootID: "root-2",
        depth: 0,
        budgetUsed: 0,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      route: buildRoute({ fallbackUsed: true, warnings: ["Specialist routing used the generalist fallback."] }),
      recovery: {
        sessionID: "sess-2",
        assessment: {
          level: "low",
          stale: false,
          suspicious: false,
          lastActivityAt: 1,
          stalenessMs: 0,
          activeDelegations: 0,
          warnings: [],
          recommendedAction: "resume",
          reasons: [],
        },
        warningSnapshot: [],
        pendingDelegation: null,
        lastActivityAt: 1,
        resumeSummary: "Resume safely.",
      },
    })

    expect(result.injections).toEqual({ rules: [], commands: [], skills: [], tools: [] })
    expect(result.auditLog).toEqual([
      expect.objectContaining({ injectionID: "specialist-route-guidance", decision: "skipped" }),
      expect.objectContaining({ injectionID: "delegation-lineage-guardrail", decision: "skipped" }),
      expect.objectContaining({ injectionID: "recovery-review-guardrail", decision: "skipped" }),
    ])
  })

  it("skips governance-blocked candidates and records why they were blocked", () => {
    const result = evaluateInjections({
      sessionID: "sess-3",
      phase: "session-start",
      agent: "builder",
      category: "implementation",
      delegation: {
        rootID: "root-3",
        depth: 3,
        budgetUsed: 2,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      governance: {
        blockedInjections: ["delegation-lineage-guardrail"],
        reasonByInjectionID: {
          "delegation-lineage-guardrail": "Governance temporarily blocked delegated prompt expansion.",
        },
      },
    })

    expect(result.injections.rules).toEqual([])
    expect(result.injections.commands).toEqual([])
    expect(result.injections.skills).toEqual([])
    expect(result.injections.tools).toEqual([])
    expect(result.auditLog).toContainEqual(
      expect.objectContaining({
        injectionID: "delegation-lineage-guardrail",
        decision: "skipped",
        reason: "Governance temporarily blocked delegated prompt expansion.",
      }),
    )
  })
})
