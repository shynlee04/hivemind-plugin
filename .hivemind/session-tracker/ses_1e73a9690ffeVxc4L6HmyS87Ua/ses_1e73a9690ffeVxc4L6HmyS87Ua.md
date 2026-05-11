---
sessionID: ses_1e73a9690ffeVxc4L6HmyS87Ua
created: 2026-05-11T20:40:51.323Z
updated: 2026-05-11T20:40:51.323Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

RESEARCH TASK: Map the FULL downstream consumer chain for EACH config field value.

The project Hivemind has these config fields that should control far more than text injection. Your job is to deeply research each one.

**Field 1: mode**
Values: expert-advisor, hivemind-powered, free-style

For each value, research these downstream consumers:
1. What skills should load? (hm-l2-lineage-router? hm-l2-user-intent-interactive-loop? gate-* skills?)
2. What temperature/profile should the agent use?
3. What delegation depth should be used? (L0→L1→L2 vs L0→L2 direct)
4. What tools should be available/restricted?
5. How should the system prompt change beyond simple text injection?
6. What guardrails apply?

Look at how agents reference each other. Read the hm-l0-orchestrator agent definition. Read hm-l1-coordinator. Read several hm-l2 and hf-* agents. Read the behavioral profile types and profiles.ts. Look at the session entry system, the governance block, the runtime policy.

**Spec for the research output format:**

## mode: expert-advisor

### Intended downstream chain
[Full description of EVERYTHING that should happen when mode=expert-advisor]

### Current implementation status
[What actually happens today]
- Text injection: ✅ "You are operating in expert-advisor mode"
- Enforcement: ❌ [what's missing]
- Skills affected: [what skills should load differently]
- Agents affected: [what agents should route differently]
- Tools affected: [what tools should be restricted]

### Gap analysis
[What code/files need to change]

## mode: hivemind-powered
[Same structure]

## mode: free-style
[Same structure]

**Repeat for ALL 4 config fields. This is a large task but critical.**


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-detective"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-detective
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-deep-research"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-deep-research
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-research-chain"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-research-chain
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-synthesis"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-synthesis
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_WMfAtr5oAN8lPoX5kNLI6920"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_4RGJUw6TlCsTWSRkNuHn5334"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_VTYSgqFptEvuhMKMnIhC2706"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_6fkYrlft3sUcPDKAAU694185"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_hUrDjyRfUBh6pjQkX19e7572"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/hivemind-configs.schema.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/guards/governance-block.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/profiles.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/resolve-behavioral-profile.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/index.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_UcR0DUZ7rs72n2AEhrIk5010"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry/profile-resolver.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry/intake-gate.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/transforms"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/transforms/toggle-gates.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/runtime-policy.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l0-orchestrator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l1-coordinator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/hooks/governance-block.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/hooks/create-core-hooks.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-researcher.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-critic.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/types.ts"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_OTty76LUGiah5tqoUdx57898"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-debugger.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_moIyLYKUfz7qxc0zMmJP4432"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_UtEr4YIAzWAJRds6WO284174"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-brainstormer.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hm-l2-planner.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/hooks/create-core-hooks.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_9A6DXUSm5i4Ovt0Qtxqf1523"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_DdiGiHKW1yYFsd2vmfeM8720"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_dFZiA3lW17b9spts3jZA4821"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_8VnwjdamPZTwYkuwg2lg2118"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_0RvIuDrhQ22rDVIdGV0C1186"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_rh7Tpadjkuy7wwWzfR1Q3524"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_NSQOnvl211TFwFk9DYC04028"
}
```

