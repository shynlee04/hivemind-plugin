---
sessionID: ses_1e73aad65ffeImqDZtDoU2h0V1
created: 2026-05-11T20:40:45.478Z
updated: 2026-05-11T20:40:45.478Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

CRITICAL RESEARCH TASK: Map the complete downstream decision tree for each Hivemind config field × each value.

The user has revealed that the current spec for BOOT-09 (MVP Config Schema) is WRONG because it treats config fields as "pick one enforcement point" when in reality each field × each value triggers a COMPLETELY DIFFERENT vertical chain of downstream consumers across the entire Hivemind system.

**The config fields to research:**
1. `mode`: expert-advisor | hivemind-powered | free-style
2. `user_expert_level`: clumsy-vibecoder | beginner-friendly | intermediate-high-level | architecture-driven | absolute-expert
3. `conversation_language`: en | vi | zh | fr | ja | ko | de | es | th | id
4. `documents_and_artifacts_language`: en | vi | zh | fr | ja | ko | de | es | th | id

**For EACH field × EACH value, research what SHOULD happen downstream across ALL of these dimensions:**

1. **hm lineage routing** — Does this value affect which hm-* agents are dispatched? Does it affect L0→L1→L2→L3 delegation depth?
2. **hf lineage routing** — Does this value affect meta-builder behavior differently?
3. **Skills loading** — Does this value affect which skills auto-load? (hm-* vs hf-* vs gate-* vs stack-*?)
4. **Commands routing** — Does this value affect which commands are available?
5. **Tool permissions** — Does this value affect which tools the agent can call?
6. **System prompt** — Beyond the simple text injection, how should this value affect the full prompt assembly?
7. **Workflow behavior** — Does this value change how workflows execute (research-first vs direct, etc.)?
8. **Agent behavior** — temperature, autonomy, guardrails, communication style

**The research must be grounded in the actual codebase architecture. Look at:**
- `.opencode/agents/` — hm-l0-orchestrator, hm-l1-coordinator, hm-l2-*, hf-* agents
- `.opencode/skills/` — how skills reference lineage and loading
- `.opencode/commands/` — how commands route to agents
- `src/routing/` — session entry, behavioral profile, command engine
- `src/hooks/` — lifecycle hooks, tool guards, governance block
- `src/coordination/delegation/` — delegation manager, category gates
- `src/features/` — bootstrap, session tracker, background commands
- `src/plugin.ts` — tool registration and hook wiring
- `.planning/architecture/` — governance docs for the intended architecture

**Output a comprehensive decision tree map like:**

```
mode: expert-advisor
  ├─ hm lineage: routes L0→L1→L2 (standard delegation chain)
  ├─ hf lineage: N/A (hm STRICT)
  ├─ Skills: ALL hm-* skills available, gsd-* excluded
  ├─ Commands: ALL available
  ├─ Tools: full access (toolAccessPattern=full)
  ├─ System prompt: "You are operating in expert-advisor mode. Communicate at [expertise]. Use [lang]..."
  ├─ Workflow: research-first, plan-check, verify
  └─ Agent: moderate guardrails, waiter delegation mode

mode: hivemind-powered
  ├─ hm lineage: strict L0→L1→L2→L3 (full hierarchy enforced)
  ├─ ...
  ...

mode: free-style
  ├─ hm lineage: L0→L2/L3 direct (bypass L1 coordinator)
  ├─ ...
  ...
```

For EACH field×value pair that does NOT currently have the correct downstream wiring, note:
- What currently happens (wrong/absent behavior)
- What SHOULD happen
- What code/files need to change


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
  "name": "hm-l2-lineage-router"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-lineage-router
```


### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-hivemind-engine-contracts"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-hivemind-engine-contracts
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_dbJV6UYXYCb9WDhywu0o4601"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_dssGimgb46CMqqItFW057022"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_FFpA8r6OgcVAteOJ5e0d4499"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/AI-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_BFft0Vj4877yuGKW1h6e0452"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/session-entry"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/command-engine"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/types.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing/behavioral-profile/resolve-behavioral-profile.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/guards"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/guards/tool-guard-hooks.ts"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_jnL5gJBfpGUlkyHDylwo7209"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_fEqfFggo3i6Gq8bCV1xl0644"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/category-gates.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/composition"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/types.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/hf-l0-orchestrator.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ASOQBsryBjVQqZWelmmg1555"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_jUxoNjcjOM1en5jGGcS78874"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_ttVrbnJZNgN3KM97ewSy0143"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_WzgcqUgPsgWtV0IId0eJ9054"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_1X7bCzLSmeen9w4paFkx7324"
}
```

