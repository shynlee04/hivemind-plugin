import { describe, it } from "node:test";
import assert from "node:assert";

import {
  ConstitutionalRuleSchema,
  EntityChecklistSchema,
  EntityChecklistItemSchema,
  GovernanceInstructionSchema,
} from "../../src/schemas/governance-constitution.js";

const NOW = "2026-02-24T07:00:00.000Z";
const RULE_ID = "11111111-1111-4111-8111-111111111111";
const CHECKLIST_ID = "22222222-2222-4222-8222-222222222222";
const SESSION_ID = "33333333-3333-4333-8333-333333333333";
const INSTRUCTION_ID = "44444444-4444-4444-8444-444444444444";

function makeValidRule(overrides: Record<string, unknown> = {}) {
  return {
    id: RULE_ID,
    key: "governance.rule-1",
    priority: "critical",
    scope: "global",
    applies_to_roles: ["builder_agent"],
    content: "Always verify changes before completion.",
    rationale: "Prevents false completion claims.",
    source: "builtin",
    enabled: true,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeValidChecklist(overrides: Record<string, unknown> = {}) {
  return {
    id: CHECKLIST_ID,
    session_id: SESSION_ID,
    turn_id: "turn-61",
    items: [
      {
        key: "hivemind_config",
        required: true,
        status: "pass",
        message: "Config detected and valid.",
        evidence_ref: "opencode.json",
      },
    ],
    passed: true,
    generated_at: NOW,
    ...overrides,
  };
}

describe("governance constitution schemas", () => {
  it("parses a valid ConstitutionalRule", () => {
    const result = ConstitutionalRuleSchema.safeParse(makeValidRule());
    assert.equal(result.success, true);
  });

  it("fails ConstitutionalRule when required fields are missing", () => {
    const result = ConstitutionalRuleSchema.safeParse({
      id: RULE_ID,
      key: "governance.rule-1",
    });
    assert.equal(result.success, false);
  });

  it("parses a valid EntityChecklist", () => {
    const result = EntityChecklistSchema.safeParse(makeValidChecklist());
    assert.equal(result.success, true);
  });

  it("fails EntityChecklist when items array is empty", () => {
    const result = EntityChecklistSchema.safeParse(
      makeValidChecklist({ items: [] })
    );
    assert.equal(result.success, false);
  });

  it("parses a valid GovernanceInstruction", () => {
    const result = GovernanceInstructionSchema.safeParse({
      id: INSTRUCTION_ID,
      version: "1.0.0",
      marker: "gov-v1-marker",
      title: "HiveMind Constitutional Governance",
      rules: [makeValidRule()],
      checklist: makeValidChecklist(),
      checksum: "abcd1234",
      created_at: NOW,
      updated_at: NOW,
    });

    assert.equal(result.success, true);
  });

  it("fails GovernanceInstruction without rules", () => {
    const result = GovernanceInstructionSchema.safeParse({
      id: INSTRUCTION_ID,
      version: "1.0.0",
      marker: "gov-v1-marker",
      title: "HiveMind Constitutional Governance",
      rules: [],
      checksum: "abcd1234",
      created_at: NOW,
      updated_at: NOW,
    });

    assert.equal(result.success, false);
  });

  it("rejects invalid key formats for ConstitutionalRule", () => {
    const uppercase = ConstitutionalRuleSchema.safeParse(
      makeValidRule({ key: "Invalid.Key" })
    );
    const withSpace = ConstitutionalRuleSchema.safeParse(
      makeValidRule({ key: "invalid key" })
    );

    assert.equal(uppercase.success, false);
    assert.equal(withSpace.success, false);
  });

  it("applies defaults for ConstitutionalRule", () => {
    const result = ConstitutionalRuleSchema.parse(
      makeValidRule({ applies_to_roles: undefined, enabled: undefined })
    );

    assert.deepEqual(result.applies_to_roles, ["any"]);
    assert.equal(result.enabled, true);
  });

  it("rejects invalid EntityChecklistItem key enum", () => {
    const result = EntityChecklistItemSchema.safeParse({
      key: "not_a_valid_key",
      required: true,
      status: "pass",
      message: "message",
      evidence_ref: "state:key",
    });

    assert.equal(result.success, false);
  });
});
