import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { ExecutionKnotSchema } from "../src/schemas/execution-knot.js"

describe("ExecutionKnotSchema", () => {
  it("accepts valid knot with bounded parallelism", () => {
    const result = ExecutionKnotSchema.safeParse({
      knot_id: "knot-001",
      objective: "Implement sync profile router",
      in_scope_paths: ["src/cli/sync-assets.ts", "tests/sync-assets.test.ts"],
      out_of_scope_paths: ["src/dashboard-v2/**"],
      required_skill_bundles: ["routing-core", "verification-core"],
      disclosure_level: "L2",
      token_budget: 3200,
      gate_commands: ["npx tsc --noEmit", "npm test"],
      required_evidence: ["typecheck-output", "test-output"],
      acceptance_criteria: ["profile routing is deterministic", "legacy excluded by default"],
      failure_policy: {
        on_token_budget_breach: "downgrade",
        on_gate_failure: "retry",
        max_retries: 2,
      },
      max_parallel: 2,
    })

    assert.equal(result.success, true)
  })

  it("rejects unsafe abort policy for parallel knot", () => {
    const result = ExecutionKnotSchema.safeParse({
      knot_id: "knot-002",
      objective: "Unsafe sample",
      in_scope_paths: ["src/**"],
      out_of_scope_paths: [],
      required_skill_bundles: ["planning-core"],
      disclosure_level: "L2",
      token_budget: 1000,
      gate_commands: [],
      required_evidence: ["evidence"],
      acceptance_criteria: ["criterion"],
      failure_policy: {
        on_token_budget_breach: "abort",
        on_gate_failure: "abort",
        max_retries: 0,
      },
      max_parallel: 2,
    })

    assert.equal(result.success, false)
  })

  it("rejects max_parallel above 3", () => {
    const result = ExecutionKnotSchema.safeParse({
      knot_id: "knot-003",
      objective: "Parallel overflow",
      in_scope_paths: ["src/**"],
      out_of_scope_paths: [],
      required_skill_bundles: ["planning-core"],
      disclosure_level: "L1",
      token_budget: 1000,
      gate_commands: [],
      required_evidence: ["evidence"],
      acceptance_criteria: ["criterion"],
      failure_policy: {
        on_token_budget_breach: "escalate",
        on_gate_failure: "retry",
        max_retries: 1,
      },
      max_parallel: 4,
    })

    assert.equal(result.success, false)
  })
})
