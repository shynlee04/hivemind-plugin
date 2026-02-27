import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { DelegationPacketSchema } from "../src/schemas/delegation-packet.js"

describe("DelegationPacketSchema", () => {
  it("accepts valid delegation packet", () => {
    const parsed = DelegationPacketSchema.parse({
      intent_id: "550e8400-e29b-41d4-a716-446655440000",
      source_command: "hivemind-delegate",
      target_agent: "hivemaker",
      target_workflow: "workflows/feature-sprint.yaml",
      skills_to_load: ["delegation-intelligence", "evidence-discipline"],
      scope: {
        include_paths: ["src/**", "tests/**"],
        exclude_paths: ["src/dashboard-v2/**"],
        max_files: 12,
      },
      constraints: ["no recursive delegation", "respect CQRS boundaries"],
      success_metrics: ["all acceptance criteria pass", "no type errors"],
      acceptance_criteria: ["npx tsc --noEmit passes", "targeted tests pass"],
      required_evidence: [
        { kind: "command_output", description: "Typecheck output", required: true },
        { kind: "file_diff", description: "Changed files", required: true },
      ],
      failure_policy: {
        on_partial: "retry",
        on_failure: "escalate",
        max_retries: 2,
      },
    })

    assert.equal(parsed.target_agent, "hivemaker")
    assert.equal(parsed.required_evidence.length, 2)
  })

  it("rejects retry policy with zero max_retries", () => {
    const result = DelegationPacketSchema.safeParse({
      intent_id: "550e8400-e29b-41d4-a716-446655440000",
      source_command: "hivemind-delegate",
      target_agent: "hivehealer",
      target_workflow: "workflows/bug-remediation.yaml",
      skills_to_load: [],
      scope: {
        include_paths: ["src/**"],
      },
      constraints: [],
      success_metrics: ["bug resolved"],
      acceptance_criteria: ["regression test added"],
      required_evidence: [{ kind: "command_output", description: "test output" }],
      failure_policy: {
        on_partial: "retry",
        on_failure: "abort",
        max_retries: 0,
      },
    })

    assert.equal(result.success, false)
  })
})
