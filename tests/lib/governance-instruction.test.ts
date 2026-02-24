import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildGovernanceInstruction,
  compileDefaultGovernance,
  getBuiltinRules,
  getGovernanceMarker,
  GOVERNANCE_MARKER,
  HIVE_MASTER_GOVERNANCE_INSTRUCTION,
} from "../../src/lib/governance-instruction.js";
import type {
  ConstitutionalRule,
  EntityChecklist,
  EntityChecklistItem,
} from "../../src/schemas/governance-constitution.js";

const CHECKLIST_KEYS: EntityChecklistItem["key"][] = [
  "hivemind_config",
  "planning_sot",
  "hierarchy_chain",
  "anchors_presence",
  "mems_presence",
  "active_action",
  "state_validation_ready",
];

function makeChecklist(statuses: Partial<Record<EntityChecklistItem["key"], EntityChecklistItem["status"]>>): EntityChecklist {
  const items: EntityChecklistItem[] = CHECKLIST_KEYS.map((key) => ({
    key,
    required: true,
    status: statuses[key] ?? "pass",
    message: `${key} message`,
    evidence_ref: `/tmp/${key}.json`,
  }));

  return {
    id: randomUUID(),
    session_id: randomUUID(),
    turn_id: "turn-1",
    items,
    passed: !items.some((item) => item.required && item.status === "fail"),
    generated_at: new Date().toISOString(),
  };
}

function makeRule(
  key: string,
  priority: ConstitutionalRule["priority"],
  content = "content",
): ConstitutionalRule {
  return {
    id: randomUUID(),
    key,
    priority,
    scope: "turn",
    applies_to_roles: ["any"],
    content,
    rationale: `${key} rationale`,
    source: "builtin",
    enabled: true,
    created_at: "2026-02-24T00:00:00.000Z",
    updated_at: "2026-02-24T00:00:00.000Z",
  };
}

describe("governance instruction compiler", () => {
  it("getBuiltinRules returns exactly 9 rules", () => {
    const rules = getBuiltinRules();
    assert.equal(rules.length, 9);
  });

  it("builtin rules have valid priority and scope values", () => {
    const rules = getBuiltinRules();
    const validPriorities = new Set(["critical", "high", "medium", "low"]);
    const validScopes = new Set(["global", "session", "turn", "hook", "tool"]);

    for (const rule of rules) {
      assert.equal(validPriorities.has(rule.priority), true);
      assert.equal(validScopes.has(rule.scope), true);
    }
  });

  it("builtin rule keys match expected regex", () => {
    const rules = getBuiltinRules();

    for (const rule of rules) {
      assert.match(rule.key, /^[a-z0-9._-]+$/);
    }
  });

  it("buildGovernanceInstruction sorts rules by priority then key", () => {
    const rules: ConstitutionalRule[] = [
      makeRule("zeta-medium", "medium"),
      makeRule("beta-critical", "critical"),
      makeRule("alpha-high", "high"),
      makeRule("alpha-critical", "critical"),
      makeRule("omega-low", "low"),
    ];

    const compiled = buildGovernanceInstruction(rules);
    const alphaCriticalAt = compiled.indexOf("### 1. ALPHA CRITICAL");
    const betaCriticalAt = compiled.indexOf("### 2. BETA CRITICAL");
    const alphaHighAt = compiled.indexOf("### 3. ALPHA HIGH");
    const zetaMediumAt = compiled.indexOf("### 4. ZETA MEDIUM");
    const omegaLowAt = compiled.indexOf("### 5. OMEGA LOW");

    assert.ok(alphaCriticalAt >= 0);
    assert.ok(betaCriticalAt > alphaCriticalAt);
    assert.ok(alphaHighAt > betaCriticalAt);
    assert.ok(zetaMediumAt > alphaHighAt);
    assert.ok(omegaLowAt > zetaMediumAt);
  });

  it("buildGovernanceInstruction appends checklist alert when checklist has failures", () => {
    const checklist = makeChecklist({ mems_presence: "fail" });
    const compiled = buildGovernanceInstruction(getBuiltinRules(), checklist);

    assert.match(compiled, /### CHECKLIST ALERT/);
    assert.match(compiled, /\[CHECKLIST\]/);
  });

  it("buildGovernanceInstruction omits checklist alert when checklist is absent", () => {
    const compiled = buildGovernanceInstruction(getBuiltinRules());
    assert.equal(compiled.includes("### CHECKLIST ALERT"), false);
  });

  it("buildGovernanceInstruction omits checklist alert when checklist has no failures", () => {
    const checklist = makeChecklist({ anchors_presence: "warn" });
    const compiled = buildGovernanceInstruction(getBuiltinRules(), checklist);
    assert.equal(compiled.includes("### CHECKLIST ALERT"), false);
  });

  it("compileDefaultGovernance returns non-empty string containing governance marker", () => {
    const compiled = compileDefaultGovernance();
    assert.ok(compiled.length > 0);
    assert.ok(compiled.includes(GOVERNANCE_MARKER));
  });

  it("HIVE_MASTER_GOVERNANCE_INSTRUCTION remains exported with expected sections", () => {
    assert.ok(HIVE_MASTER_GOVERNANCE_INSTRUCTION.includes("### 1. ROLE & BOUNDARY DISCIPLINE"));
    assert.ok(HIVE_MASTER_GOVERNANCE_INSTRUCTION.includes("### 9. STOP CONDITIONS → IMMEDIATE HALT"));
  });

  it("GOVERNANCE_MARKER remains exported with expected value", () => {
    assert.equal(GOVERNANCE_MARKER, "[🛡️ HIVE-MASTER governance active] ⚠️ SUPERSEDES ALL");
  });

  it("getGovernanceMarker returns the same marker value", () => {
    assert.equal(getGovernanceMarker(), GOVERNANCE_MARKER);
  });
});
