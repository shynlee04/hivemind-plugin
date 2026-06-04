---
phase: SR-05
plan: 02
type: auto
wave: 2
depends_on:
  - SR-05-01
files_modified:
  - src/features/governance-engine/evaluator.ts
  - src/schema-kernel/hivemind-configs.schema.ts
  - .hivemind/configs.json
autonomous: true
requirements:
  - REQ-02
---

<objective>
Extend the governance evaluator to support depth-based rule matching and populate `.hivemind/configs.json.governance.rules` with 5 concrete governance rules that enforce tool access at runtime.

Purpose: Transform the currently-empty governance rules into actionable runtime enforcement that blocks/warns/escalates based on tool name and delegation depth.
Output: Extended evaluator with depth matching + populated governance rules in configs.json + comprehensive tests.
</objective>

<context>
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-SPEC.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-CONTEXT.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-RESEARCH.md
@.planning/phases/SR-05-config-governance-cluster-unification-2026-06-04/SR-05-01-PLAN.md
</context>

<tasks>
  <task id="01" type="auto">
    <name>Extend GovernanceRuleSchema with depth condition</name>
    <files>
      <modified>src/schema-kernel/hivemind-configs.schema.ts</modified>
    </files>
    <read_first>
      - src/schema-kernel/hivemind-configs.schema.ts (lines 266-277 — current GovernanceRuleSchema)
      - SR-05-RESEARCH.md Example 3 (depth condition pattern)
    </read_first>
    <action>
Extend `GovernanceRuleSchema` at `src/schema-kernel/hivemind-configs.schema.ts` to support depth-based matching:

1. Add `DepthConditionSchema` as `z.object()`:
   - `min`: `z.number().optional()` — minimum delegation depth (inclusive)
   - `max`: `z.number().optional()` — maximum delegation depth (inclusive)

2. Extend `GovernanceRuleSchema.condition` to include:
   - `depth`: `DepthConditionSchema.optional()`

3. The condition object already uses `.catchall(z.unknown())` so this is additive — existing rules without `depth` field continue to work.

4. Export `DepthConditionSchema` for use in tests.
    </action>
    <verify>
      - `grep -c "DepthConditionSchema" src/schema-kernel/hivemind-configs.schema.ts` returns >= 1
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
GovernanceRuleSchema extended with optional depth condition. Backward compatible — existing rules without depth field continue to parse.
    </done>
    <acceptance_criteria>
      - `src/schema-kernel/hivemind-configs.schema.ts` contains `DepthConditionSchema` definition with `min` and `max` optional number fields
      - `GovernanceRuleSchema.condition` includes optional `depth` field
      - `npx tsc --noEmit` exits 0
      - Existing governance rules (without depth) still parse correctly
    </acceptance_criteria>
  </task>

  <task id="02" type="auto">
    <name>Extend evaluateGovernance() with depth-based matching</name>
    <files>
      <modified>src/features/governance-engine/evaluator.ts</modified>
    </files>
    <read_first>
      - src/features/governance-engine/evaluator.ts (full file — current evaluator logic at lines 21-106)
      - src/shared/state.ts (getDelegationMeta() function — depth tracking)
      - SR-05-RESEARCH.md Example 3 (depth matching logic)
      - SR-05-CONTEXT.md Decision 3 (dual-source depth tracking: SDK parentID + getDelegationMeta)
    </read_first>
    <action>
Extend `evaluateGovernance()` at `src/features/governance-engine/evaluator.ts` to support depth-based rule matching:

1. Add depth resolution logic (before the rule matching loop):
   ```typescript
   // Dual-source depth tracking (CONTEXT.md Decision 3)
   let currentDepth = 0
   const delegation = getDelegationMeta(sessionID)
   if (delegation?.depth !== undefined) {
     currentDepth = delegation.depth
   }
   // Note: SDK parentID chain integration deferred to runtime validation
   ```

2. In the rule matching loop, add depth condition check:
   ```typescript
   if (rule.condition.depth) {
     criteriaChecked++
     const minDepth = rule.condition.depth.min ?? 0
     const maxDepth = rule.condition.depth.max ?? Infinity
     if (currentDepth >= minDepth && currentDepth <= maxDepth) {
       depthMatched = true
     }
   }
   ```

3. Update the matching logic: a rule matches when ALL specified conditions match (toolNames AND/OR sessionIDs AND/OR depth). If no conditions specified, rule matches everything (existing behavior).

4. Preserve the existing function signature: `evaluateGovernance(toolName: string, sessionID: string, rules: GovernanceRule[]): GovernanceEvaluation`.

5. Import `getDelegationMeta` from `src/shared/state.ts`.
    </action>
    <verify>
      - `grep -c "getDelegationMeta" src/features/governance-engine/evaluator.ts` returns >= 1
      - `grep -c "depthMatched" src/features/governance-engine/evaluator.ts` returns >= 1
      - `npx tsc --noEmit` exits 0
    </verify>
    <done>
evaluateGovernance() extended with depth-based matching. Uses dual-source depth tracking (getDelegationMeta primary, SDK parentID deferred). Function signature unchanged.
    </done>
    <acceptance_criteria>
      - `src/features/governance-engine/evaluator.ts` imports `getDelegationMeta` from `src/shared/state.ts`
      - Evaluator resolves `currentDepth` from delegation metadata
      - Rule matching loop checks `rule.condition.depth` against `currentDepth`
      - Depth matching uses `min` (inclusive, default 0) and `max` (inclusive, default Infinity)
      - `evaluateGovernance()` signature unchanged: `(toolName, sessionID, rules) => GovernanceEvaluation`
      - `npx tsc --noEmit` exits 0
    </acceptance_criteria>
  </task>

  <task id="03" type="auto">
    <name>Populate governance.rules with 5 concrete rules</name>
    <files>
      <modified>.hivemind/configs.json</modified>
    </files>
    <read_first>
      - .hivemind/configs.json (current structure — should have governance from SR-05-01)
      - SR-05-CONTEXT.md (Rule 1-5 definitions)
      - SR-05-RESEARCH.md Example 4 (5 default governance rules JSON)
    </read_first>
    <action>
Add 5 governance rules to `.hivemind/configs.json.governance.rules`:

```json
{
  "governance": {
    "rules": [
      {
        "id": "gov-delegate-task-subagent-only",
        "condition": { "toolNames": ["delegate-task"], "depth": { "max": 0 } },
        "action": { "type": "block" },
        "enabled": true
      },
      {
        "id": "gov-write-depth-warn",
        "condition": { "toolNames": ["write", "edit"], "depth": { "min": 2 } },
        "action": { "type": "warn" },
        "enabled": true
      },
      {
        "id": "gov-delegate-task-depth-block",
        "condition": { "toolNames": ["delegate-task"], "depth": { "min": 3 } },
        "action": { "type": "block" },
        "enabled": true
      },
      {
        "id": "gov-create-session-naming-warn",
        "condition": { "toolNames": ["create-governance-session"] },
        "action": { "type": "warn" },
        "enabled": true
      },
      {
        "id": "gov-unsafe-tools-escalate",
        "condition": { "toolNames": ["bash"], "depth": { "min": 1 } },
        "action": { "type": "escalate", "escalation": { "reason": "bash in child session" } },
        "enabled": true
      }
    ],
    "naming_standards": { ... existing from SR-05-01 ... },
    "agent_configs": { ... existing from SR-05-01 ... },
    "command_agent_mappings": { ... existing from SR-05-01 ... }
  }
}
```

Rules per CONTEXT.md:
- Rule 1: delegate-task blocked at root (depth=0) — use native task instead
- Rule 2: write/edit warned at depth >= 2 — caution for deep writes
- Rule 3: delegate-task blocked at depth >= 3 — prevent deep delegation chains
- Rule 4: create-governance-session always warns — naming standards soft enforcement
- Rule 5: bash escalated at depth >= 1 — flag shell in child sessions
    </action>
    <verify>
      - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(c.governance.rules.length)"` outputs `5`
      - `node -e "const c=JSON.parse(require('fs').readFileSync('.hivemind/configs.json','utf8')); console.log(c.governance.rules.map(r=>r.id).join(','))"` outputs all 5 rule IDs
    </verify>
    <done>
5 governance rules populated in configs.json. Rules enforce delegate-task restrictions, write depth warnings, session naming, and bash escalation.
    </done>
    <acceptance_criteria>
      - `.hivemind/configs.json` has `governance.rules` array with exactly 5 entries
      - Rule `gov-delegate-task-subagent-only` has `condition.toolNames: ["delegate-task"]` and `condition.depth.max: 0`
      - Rule `gov-write-depth-warn` has `condition.toolNames: ["write", "edit"]` and `condition.depth.min: 2`
      - Rule `gov-delegate-task-depth-block` has `condition.toolNames: ["delegate-task"]` and `condition.depth.min: 3`
      - Rule `gov-create-session-naming-warn` has `condition.toolNames: ["create-governance-session"]`
      - Rule `gov-unsafe-tools-escalate` has `condition.toolNames: ["bash"]` and `condition.depth.min: 1`
      - All rules have `enabled: true`
    </acceptance_criteria>
  </task>

  <task id="04" type="tdd">
    <name>Depth-based governance evaluator tests</name>
    <files>
      <modified>tests/hooks/governance-evaluator.test.ts</modified>
    </files>
    <read_first>
      - tests/hooks/governance-evaluator.test.ts (existing test patterns — 148 lines)
      - src/features/governance-engine/evaluator.ts (extended evaluator from Task 02)
      - SR-05-CONTEXT.md (Rule definitions for test scenarios)
    </read_first>
    <action>
Extend `tests/hooks/governance-evaluator.test.ts` with depth-based matching tests:

1. Test: `evaluateGovernance("delegate-task", "ses_child_1", rules)` with depth=0 returns `blocked: true` (Rule 1)
2. Test: `evaluateGovernance("delegate-task", "ses_child_1", rules)` with depth=1 returns `blocked: false` (depth > max)
3. Test: `evaluateGovernance("write", "ses_grandchild_1", rules)` with depth=2 returns `warned: true` (Rule 2)
4. Test: `evaluateGovernance("write", "ses_child_1", rules)` with depth=1 returns `warned: false` (depth < min)
5. Test: `evaluateGovernance("delegate-task", "ses_deep_1", rules)` with depth=3 returns `blocked: true` (Rule 3)
6. Test: `evaluateGovernance("create-governance-session", "ses_any", rules)` returns `warned: true` (Rule 4 — no depth condition)
7. Test: `evaluateGovernance("bash", "ses_child_1", rules)` with depth=1 returns `escalated: true` (Rule 5)
8. Test: `evaluateGovernance("bash", "ses_root", rules)` with depth=0 returns `escalated: false` (depth < min)
9. Test: `evaluateGovernance("read", "ses_any", rules)` returns `blocked: false, warned: false` (no matching rule)
10. Test: `evaluateGovernance("any-tool", "ses_any", [])` returns `blocked: false` (empty rules — no governance)

Mock `getDelegationMeta()` to return controlled depth values for each test.
    </action>
    <verify>
      - `npx vitest run tests/hooks/governance-evaluator.test.ts` exits 0
      - All new depth-based tests pass
      - Existing tests still pass (no regressions)
    </verify>
    <done>
Comprehensive depth-based governance tests. Covers block/warn/escalate at various depths, no-match cases, and empty rules backward compatibility.
    </done>
    <acceptance_criteria>
      - `tests/hooks/governance-evaluator.test.ts` contains at least 10 new test cases for depth-based matching
      - Tests mock `getDelegationMeta()` to return controlled depth values
      - Tests verify block/warn/escalate actions fire correctly based on depth conditions
      - Tests verify no-match cases (wrong tool, wrong depth, empty rules)
      - `npx vitest run tests/hooks/governance-evaluator.test.ts` exits 0
    </acceptance_criteria>
  </task>
</tasks>

<verification>
1. `npx tsc --noEmit` — typecheck clean
2. `npx vitest run tests/hooks/governance-evaluator.test.ts` — all tests pass
3. `npx vitest run tests/hooks/governance-block.test.ts` — existing tests still pass
4. `.hivemind/configs.json` has 5 governance rules
5. `evaluateGovernance("delegate-task", "ses_child", populatedRules)` returns blocked when depth matches
</verification>

<success_criteria>
- GovernanceRuleSchema extended with depth condition (DepthConditionSchema)
- evaluateGovernance() supports depth-based matching with dual-source tracking
- 5 concrete governance rules populated in configs.json
- 10+ depth-based tests pass
- Existing evaluator tests still pass (no regressions)
- Function signature unchanged: (toolName, sessionID, rules) => GovernanceEvaluation
</success_criteria>

<must_haves>
  <truths>
    - "GovernanceRuleSchema.condition includes optional depth field with min/max"
    - "evaluateGovernance() resolves depth from getDelegationMeta(sessionID)"
    - "5 governance rules enforce delegate-task, write/edit, create-session, bash restrictions"
    - "Depth matching uses inclusive min/max bounds"
    - "Empty rules array returns no-block/no-warn (backward compatible)"
  </truths>
  <artifacts>
    - src/schema-kernel/hivemind-configs.schema.ts (modified — DepthConditionSchema)
    - src/features/governance-engine/evaluator.ts (modified — depth matching)
    - .hivemind/configs.json (modified — 5 rules)
    - tests/hooks/governance-evaluator.test.ts (modified — depth tests)
  </artifacts>
</must_haves>
