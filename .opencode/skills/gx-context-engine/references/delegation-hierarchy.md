# Delegation Hierarchy — L2/L3/Monitor Boundaries

> **SOT:** `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md` § Delegation Hierarchy

## Level Structure

```
USER (L0)
  └── hiveminder (L1/L2 — Orchestrator + Strategic Architect)
       ├── Owns: TODO graph, hierarchy, context, delegation routing
       ├── Can delegate to: ALL L3 agents
       ├── NEVER touches: src/ directly
       │
       ├── hivemaker (L3 — Execution Specialist, RESTRICTED)
       │   ├── Can: investigate, review, research within scope
       │   ├── Cannot: autonomous critical-path execution without approval
       │   ├── Must: receive delegation packet with profile_id
       │   └── Must: return structured evidence bundle
       │
       ├── hivehealer (L3 — Recovery Specialist)
       │   ├── Can: diagnose and fix broken chains
       │   └── Cannot: delegate further
       │
       └── hiveq (L3 — Monitor Gatekeeper)
           ├── Validates: TDD compliance, spec coverage, edge cases
           ├── Has: VETO power on stage promotion
           └── NEVER: modifies code — verification only
```

## Proof Mechanism

Every delegation produces an audit trail entry in `.hivemind/state/delegation-audit.jsonl`:

```jsonl
{"ts":1709337601,"from":"hiveminder","to":"hivemaker","depth":1,"profile":"gx-profile-a1b2c3d4","status":"approved","objective":"Investigate schema inconsistencies"}
{"ts":1709337700,"from":"hivemaker","to":"src/lib/graph-io.ts","depth":1,"profile":"gx-profile-a1b2c3d4","status":"BLOCKED","reason":"L3 cannot edit critical-path files"}
```

## Plugin Enforcement

The `hiveops-governance` plugin enforces delegation topology at runtime:

1. `tool.execute.before` intercepts Task tool calls
2. Reads `DELEGATION_TOPOLOGY` from `types.ts`
3. Validates: source agent → target agent in `canDelegateTo[]`
4. Validates: current depth < `maxDepth`
5. Blocks with error if validation fails
6. Records successful delegation in enforcement state

## Intent → Role Mapping

| Intent | Primary (L2) | Secondary (L3) | Monitor |
|--------|-------------|----------------|---------|
| build_new | hiveminder | hivemaker | hiveq |
| fix_broken | hiveminder | hivehealer | hiveq |
| audit_health | hiveq | hivexplorer | hiveminder |
| extend | hiveminder | hivemaker | hiveq |
| improve | hiveminder | hivemaker | hiveq |

## Delegation Packet Contract

Every delegated task MUST include:

```yaml
delegation_packet:
  objective: "single measurable outcome"
  profile_id: "gx-profile-<hash>"
  in_scope_paths: [".opencode/**"]
  out_of_scope_paths: ["src/**", "tests/**"]
  constraints: ["L3 restriction", "no recursive delegation"]
  required_outputs: ["findings", "evidence"]
  return_schema: ["status", "risk", "next_actions"]
```
