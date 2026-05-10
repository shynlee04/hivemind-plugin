// ---------------------------------------------------------------------------
// Unit Tests — Injection Builder (Phase 03)
// RED phase: all tests must FAIL before implementation exists
// @see PATTERNS.md §7.2
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest"
import {
  buildSteeringContent,
  estimateTokens,
} from "../../../src/features/steering-engine/injection-builder.js"
import type {
  SteeringDecision,
  SteeringContext,
} from "../../../src/features/steering-engine/types.js"

// ---------------------------------------------------------------------------
// Helper: create a minimal SteeringContext with defaults
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<SteeringContext> = {}): SteeringContext {
  return {
    active_skills: [],
    delegation_chain: [],
    turn_number: 0,
    turns_since_last_injection: 0,
    was_compacted: false,
    task_boundary_shift: false,
    remaining_token_budget: 1000,
    max_token_budget: 600,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helper: create a SteeringDecision for a given surface and template
// ---------------------------------------------------------------------------

function makeDecision(
  surface: SteeringDecision["surface"],
  content: string,
): SteeringDecision {
  return {
    shouldInject: true,
    surface,
    content,
    reason: "test",
  }
}

// ===========================================================================
// §1 Template Variable Resolution
// ===========================================================================

describe("Template Variable Resolution", () => {
  it("replaces a single variable ({{role}})", () => {
    const ctx = makeContext({ hierarchy: "subagent" })
    const decision = makeDecision(
      "messages.transform",
      "You are a {{role}} agent.",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("You are a subagent agent.")
  })

  it("replaces multiple variables in the same template", () => {
    const ctx = makeContext({
      hierarchy: "subagent",
      depth: "L2",
      lineage: "hm",
    })
    const decision = makeDecision(
      "messages.transform",
      "{{role}} at {{depth}} in {{lineage}}.",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("subagent at L2 in hm.")
  })

  it("replaces all alias pairs ({{workflow}} / {{workflow_phase}})", () => {
    const ctx = makeContext({ workflow_phase: "execute" })
    const decision = makeDecision(
      "session.compacting",
      "Phase: {{workflow}}, Alias: {{workflow_phase}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Phase: execute, Alias: execute")
  })

  it("replaces alias ({{turn_number}}) mapped to context.turn_number", () => {
    const ctx = makeContext({ turn_number: 42 })
    const decision = makeDecision(
      "messages.transform",
      "Turn: {{turn_number}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Turn: 42")
  })

  it("replaces alias ({{turnCount}}) mapped to context.turn_number", () => {
    const ctx = makeContext({ turn_number: 99 })
    const decision = makeDecision(
      "messages.transform",
      "Turn: {{turnCount}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Turn: 99")
  })

  it("replaces {{taskBoundary}} and {{task_boundary}}", () => {
    const ctx = makeContext({ task_boundary: "strict research-only" })
    const decision = makeDecision(
      "messages.transform",
      "Boundary: {{taskBoundary}}, Alias: {{task_boundary}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe(
      "Boundary: strict research-only, Alias: strict research-only",
    )
  })

  it("replaces {{toolBudget}} and {{max_token_budget}}", () => {
    const ctx = makeContext({ max_token_budget: 500 })
    const decision = makeDecision(
      "messages.transform",
      "Budget: {{toolBudget}} / {{max_token_budget}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Budget: 500 / 500")
  })

  it("replaces {{phase}} as alias for workflow_phase", () => {
    const ctx = makeContext({ workflow_phase: "plan" })
    const decision = makeDecision(
      "session.compacting",
      "Currently in {{phase}} phase.",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Currently in plan phase.")
  })

  it("replaces {{parent_agent}}, {{active_skills}}, {{delegation_chain}}", () => {
    const ctx = makeContext({
      parent_agent: "hm-l1-coordinator",
      active_skills: ["hm-test-driven-execution", "hm-cross-cutting-change"],
      delegation_chain: ["hm-l0-orchestrator", "hm-l1-coordinator"],
    })
    const decision = makeDecision(
      "session.compacting",
      "Parent: {{parent_agent}}, Skills: {{active_skills}}, Chain: {{delegation_chain}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe(
      "Parent: hm-l1-coordinator, Skills: hm-test-driven-execution, hm-cross-cutting-change, Chain: hm-l0-orchestrator, hm-l1-coordinator",
    )
  })

  it("replaces numeric context fields ({{remaining_token_budget}}, {{turns_since_last_injection}})", () => {
    const ctx = makeContext({
      remaining_token_budget: 350,
      turns_since_last_injection: 7,
    })
    const decision = makeDecision(
      "messages.transform",
      "Remaining: {{remaining_token_budget}}, Since: {{turns_since_last_injection}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Remaining: 350, Since: 7")
  })

  it("replaces {{was_compacted}} boolean", () => {
    const ctx = makeContext({ was_compacted: true })
    const decision = makeDecision(
      "session.compacting",
      "Compacted: {{was_compacted}}",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Compacted: true")
  })
})

// ===========================================================================
// §2 Undefined/Missing Context Fields
// ===========================================================================

describe("Undefined and Missing Context Fields", () => {
  it("replaces undefined context field with empty string", () => {
    const ctx = makeContext() // hierarchy is undefined
    const decision = makeDecision(
      "messages.transform",
      "Role is: {{role}}.",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Role is: .")
  })

  it("replaces null-ish field (depth undefined) with empty string", () => {
    const ctx = makeContext({ depth: undefined })
    const decision = makeDecision(
      "messages.transform",
      "Depth: [{{depth}}]",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("Depth: []")
  })

  it("unknown variable names are left unchanged", () => {
    const ctx = makeContext()
    const decision = makeDecision(
      "messages.transform",
      "Hello {{nonexistent}} world.",
    )
    const result = buildSteeringContent(decision, ctx)
    // Per constraint: unknown variables remain unchanged
    expect(result).toBe("Hello {{nonexistent}} world.")
  })

  it("returns empty string when decision.content is undefined", () => {
    const ctx = makeContext()
    const decision: SteeringDecision = {
      shouldInject: true,
      surface: "messages.transform",
      content: undefined,
      reason: "no template",
    }
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("")
  })
})

// ===========================================================================
// §3 Token Estimation
// ===========================================================================

describe("Token Estimation (estimateTokens)", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0)
  })

  it("returns chars / 4 rounded up for small strings", () => {
    // 5 chars → ceil(5/4) = 2
    expect(estimateTokens("hello")).toBe(2)
    // 4 chars → ceil(4/4) = 1
    expect(estimateTokens("test")).toBe(1)
    // 1 char → ceil(1/4) = 1
    expect(estimateTokens("a")).toBe(1)
  })

  it("returns correct estimation for longer strings", () => {
    // 100 chars → ceil(100/4) = 25
    const text = "x".repeat(100)
    expect(estimateTokens(text)).toBe(25)
  })

  it("Math.ceil rounds up properly", () => {
    // 9 chars → ceil(9/4) = 3
    expect(estimateTokens("123456789")).toBe(3)
    // 10 chars → ceil(10/4) = 3
    expect(estimateTokens("1234567890")).toBe(3)
  })
})

// ===========================================================================
// §4 Token Budget Enforcement
// ===========================================================================

describe("Token Budget Enforcement", () => {
  it("passes content through unchanged when within budget", () => {
    // 180 tokens ≈ 720 chars → under 200 budget
    const content = "x".repeat(700)
    const ctx = makeContext()
    const decision = makeDecision("messages.transform", content)
    const result = buildSteeringContent(decision, ctx)
    // Tokens: ceil(700/4) = 175 ≤ 200, so unchanged
    expect(result).toBe(content)
  })

  it("truncates content when estimated tokens exceed surface budget", () => {
    // 250 tokens ≈ 1000 chars → over 200 budget
    const content = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".repeat(40) // 1040 chars
    const ctx = makeContext()
    const decision = makeDecision("messages.transform", content)
    const result = buildSteeringContent(decision, ctx)
    // Budget is 200 tokens → max 800 chars
    // Result should be truncated to ≤ 800 chars
    expect(result.length).toBeLessThanOrEqual(800)
    // Should be a prefix of the original
    expect(content.startsWith(result)).toBe(true)
  })

  it("truncation preserves content from the start", () => {
    // The truncation should take the beginning of the content
    const prefix = "IMPORTANT: ".repeat(5) // 55 chars
    const suffix = "x".repeat(900) // 900 chars
    const content = prefix + suffix
    const ctx = makeContext()
    const decision = makeDecision("messages.transform", content)
    const result = buildSteeringContent(decision, ctx)
    expect(result.startsWith(prefix.trim().substring(0, 10))).toBe(true)
  })
})

// ===========================================================================
// §5 Per-Surface Budget Enforcement
// ===========================================================================

describe("Per-Surface Token Budget Enforcement", () => {
  it("messages.transform: enforces 200 token budget", () => {
    // 800 chars = 200 tokens → exact
    const content = "x".repeat(800)
    const ctx = makeContext()
    const decision = makeDecision("messages.transform", content)
    const result = buildSteeringContent(decision, ctx)
    // ceil(800/4) = 200 ≤ 200, passes
    expect(result).toBe(content)
  })

  it("messages.transform: truncates at 200 token budget", () => {
    // 900 chars = 225 tokens → over 200
    const content = "x".repeat(900)
    const ctx = makeContext()
    const decision = makeDecision("messages.transform", content)
    const result = buildSteeringContent(decision, ctx)
    // Should truncate to 800 chars (200 tokens)
    expect(result.length).toBeLessThanOrEqual(800)
    expect(estimateTokens(result)).toBeLessThanOrEqual(200)
  })

  it("session.compacting: enforces 800 token budget", () => {
    // 3200 chars = 800 tokens → exact
    const content = "y".repeat(3200)
    const ctx = makeContext()
    const decision = makeDecision("session.compacting", content)
    const result = buildSteeringContent(decision, ctx)
    // ceil(3200/4) = 800 ≤ 800, passes
    expect(result).toBe(content)
  })

  it("session.compacting: truncates at 800 token budget", () => {
    // 3300 chars = 825 tokens → over 800
    const content = "y".repeat(3300)
    const ctx = makeContext()
    const decision = makeDecision("session.compacting", content)
    const result = buildSteeringContent(decision, ctx)
    expect(result.length).toBeLessThanOrEqual(3200)
    expect(estimateTokens(result)).toBeLessThanOrEqual(800)
  })

  it("system.transform: enforces 50 token budget", () => {
    // 200 chars = 50 tokens → exact
    const content = "z".repeat(200)
    const ctx = makeContext()
    const decision = makeDecision("system.transform", content)
    const result = buildSteeringContent(decision, ctx)
    // ceil(200/4) = 50 ≤ 50, passes
    expect(result).toBe(content)
  })

  it("system.transform: truncates at 50 token budget", () => {
    // 250 chars = 63 tokens → over 50
    const content = "z".repeat(250)
    const ctx = makeContext()
    const decision = makeDecision("system.transform", content)
    const result = buildSteeringContent(decision, ctx)
    expect(result.length).toBeLessThanOrEqual(200)
    expect(estimateTokens(result)).toBeLessThanOrEqual(50)
  })
})

// ===========================================================================
// §6 Integration: buildSteeringContent returns rendered string
// ===========================================================================

describe("buildSteeringContent Integration", () => {
  it("resolves all variables before applying token budget", () => {
    // Template has variables that expand to short values
    const ctx = makeContext({
      hierarchy: "subagent",
      depth: "L2",
      lineage: "hm",
    })
    const decision = makeDecision(
      "system.transform",
      "[role:{{role}}|depth:{{depth}}|lineage:{{lineage}}]",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("[role:subagent|depth:L2|lineage:hm]")
  })

  it("handles realistic system.transform template", () => {
    const ctx = makeContext({
      hierarchy: "front-facing",
      depth: "L0",
      lineage: "hm",
    })
    const decision = makeDecision(
      "system.transform",
      "[role: {{hierarchy}}-{{depth}} | lineage: {{lineage}}]",
    )
    const result = buildSteeringContent(decision, ctx)
    expect(result).toBe("[role: front-facing-L0 | lineage: hm]")
  })

  it("handles realistic messages.transform template with all variables", () => {
    const ctx = makeContext({
      hierarchy: "subagent",
      depth: "L2",
      lineage: "hm",
      workflow_phase: "execute",
      parent_agent: "hm-l1-coordinator",
      task_boundary: "implement injection-builder module",
      max_token_budget: 600,
      turn_number: 15,
      turns_since_last_injection: 4,
      active_skills: ["hm-test-driven-execution"],
      delegation_chain: ["hm-l0-orchestrator", "hm-l1-coordinator"],
    })
    const template = [
      "<system_reminder>",
      "Role: {{role}} ({{hierarchy}} at {{depth}})",
      "Lineage: {{lineage}}",
      "Phase: {{workflow}}",
      "Parent: {{parent_agent}}",
      "Task: {{task_boundary}}",
      "Turn: {{turn_number}} (last injection: {{turns_since_last_injection}} turns ago)",
      "Skills: {{active_skills}}",
      "Chain: {{delegation_chain}}",
      "Budget: {{toolBudget}}/{{max_token_budget}}",
      "</system_reminder>",
    ].join("\n")
    const decision = makeDecision("messages.transform", template)
    const result = buildSteeringContent(decision, ctx)
    expect(result).toContain("Role: subagent (subagent at L2)")
    expect(result).toContain("Lineage: hm")
    expect(result).toContain("Phase: execute")
    expect(result).toContain("Parent: hm-l1-coordinator")
    expect(result).toContain("Task: implement injection-builder module")
    expect(result).toContain("Turn: 15")
    expect(result).toContain("Skills: hm-test-driven-execution")
    expect(result).toContain("Budget: 600/600")
    expect(result).not.toContain("{{")
  })

  it("handles realistic session.compacting template", () => {
    const ctx = makeContext({
      hierarchy: "subagent",
      depth: "L2",
      lineage: "hm",
      workflow_phase: "execute",
      active_skills: ["hm-test-driven-execution", "hm-cross-cutting-change"],
      parent_agent: "hm-l1-coordinator",
      delegation_chain: ["hm-l0-orchestrator", "hm-l1-coordinator"],
      task_boundary: "steering engine injection builder",
      was_compacted: true,
      turn_number: 27,
    })
    const template = [
      "=== SESSION COMPACTION RECOVERY ===",
      "Role: {{hierarchy}} | Depth: {{depth}} | Lineage: {{lineage}}",
      "Phase: {{phase}}",
      "Task: {{task_boundary}}",
      "Parent: {{parent_agent}}",
      "Skills: {{active_skills}}",
      "Chain: {{delegation_chain}}",
      "Compacted: {{was_compacted}} | Turn: {{turn_number}}",
    ].join("\n")
    const decision = makeDecision("session.compacting", template)
    const result = buildSteeringContent(decision, ctx)
    expect(result).toContain("Role: subagent")
    expect(result).toContain("Phase: execute")
    expect(result).toContain("Compacted: true")
    expect(result).not.toContain("{{")
  })
})
