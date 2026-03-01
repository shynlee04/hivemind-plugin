---
name: hivefiver-coordination
description: "Use when hivefiver needs quality gates, routing constraints, delegation steering, or completion verification. Triggers on: before any asset write, after stage completion, during audit/doctor, when self-delegating, before claiming completion."
---

# Hivefiver Coordination Quality Pack

Enforce quality gates, routing constraints, and delegation steering.

## Quality Gate Definitions

| Gate | Entry Criteria | Exit Criteria |
|------|---------------|----------------|
| Gate 0 | Scope valid, context present | Target contract identified |
| Gate 1 | Requirements unambiguous | Acceptance conditions declared |
| Gate 2 | Dependency ordering explicit | Parallelization criteria satisfied |
| Gate 3 | Output matches schema | Evidence backed by verification |
| Gate 4 | Handoff payload complete | Residual risk declared |

## Routing Conditions

### Proceed When

- Current gate passed
- Required evidence collected
- Next step deterministic

### Block When

- Gate 0 fails → scope invalid or context missing
- Gate 1 fails → requirements ambiguous
- Gate 2 fails → dependencies unresolved
- Evidence missing → cannot prove claim

## Constraint Enforcement

Check before any asset modification:

1. **Scope boundaries**: edits must stay in `.opencode/**` or `.hivemind/**`
2. **Permission checks**: verify allowed paths in agent profile
3. **Parity sync**: `.opencode/` and root must match after write
4. **Anti-pattern detection**: scan for G-01 through G-10 violations

Execute quality-check.sh:

```bash
./scripts/quality-check.sh <stage> /Users/apple/hivemind-plugin
```

## Self-Delegation Packet Template

```yaml
delegation_packet:
  objective: "single measurable outcome"
  in_scope_paths:
    - ".opencode/skills/hivefiver-mode/**"
    - ".opencode/skills/hivefiver-coordination/**"
  out_of_scope_paths:
    - "src/**"
    - "tests/**"
  constraints:
    - "preserve loaded skills"
    - "no recursive delegation"
    - "pass quality gate before claim"
  required_outputs:
    - "findings"
    - "file references with line numbers"
    - "verification evidence"
  return_schema:
    - "status"
    - "risk"
    - "next_actions"
```

## Session Permission Constraints

When creating delegated sessions via `opencode run` or `session.create()`, inject permission constraints:

```typescript
// Stage-specific permission template
const stagePermissions = {
  start:     [{ permission: "edit", action: "deny", pattern: ".opencode/**" }],
  intake:    [{ permission: "edit", action: "deny", pattern: ".opencode/**" }],
  spec:      [{ permission: "edit", action: "allow", pattern: "docs/**" }],
  architect: [{ permission: "edit", action: "allow", pattern: ".opencode/**" }],
  build:     [{ permission: "edit", action: "allow", pattern: ".opencode/**" }],
  audit:     [{ permission: "edit", action: "deny", pattern: "*" }],
  doctor:    [{ permission: "edit", action: "allow", pattern: ".opencode/**" }],
  // Universal constraints
  _always:   [
    { permission: "edit", action: "deny", pattern: "src/**" },
    { permission: "edit", action: "deny", pattern: "tests/**" },
    { permission: "task", action: "allow", pattern: "hivefiver" },
    { permission: "task", action: "deny", pattern: "*" }
  ]
}
```

## Completion Check Protocol

Before claiming stage complete:

1. Run quality-check.sh for current stage
2. Verify all required files exist
3. Validate frontmatter/contracts
4. Collect evidence: command outputs, diffs, test results
5. Emit handoff payload with next stage

## ⛔ MANDATORY Runtime Enforcement Protocol

**NON-NEGOTIABLE.** These calls MUST happen at the specified lifecycle points. Failure to invoke them is a G-06 violation (missing exit criteria). The forensic audit of session `ses_356f` proved that without mandatory invocation, agents skip all enforcement 100% of the time.

### Pre-Turn (BEFORE any work begins)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .
```

This checks: pipeline state, asset inventory, quality baseline, loaded skills. If it returns warnings or failures, address them BEFORE proceeding.

### Mid-Work Checkpoint (after significant progress)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh checkpoint .
```

This captures: quality snapshot + state checkpoint. Run after every 2-3 asset modifications or every major decision.

### Post-Turn (AFTER work is complete, BEFORE claiming done)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```

This runs: quality check, pipeline status, state checkpoint. Results MUST be included in the completion claim.

### Export (BEFORE closing a pipeline or handing off)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh export .
```

This produces: a handoff artifact at `.hivemind/hive-modules/hivefiver-v2/handoffs/export-*.json` containing quality, pipeline, and inventory snapshots.

### Journey Mapping (at session start to determine required tool execution order)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh journey . <intent>
```

Where `<intent>` is one of: `build_new`, `fix_broken`, `audit_health`. Returns the ordered list of scripts that MUST execute for that journey type. Note: WORKDIR (`.`) always comes as the second argument.

### Tool Chain Validation (verify a script is registered)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh chain-check . <script_name>
```

### Full Toolmap (dump the complete tool-chain registry)

```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh toolmap .
```

### Enforcement Sequence for Every Command

Every hivefiver command MUST follow this sequence:
1. `<enforcement>` block runs `runtime-gate.sh pre-turn` (auto-executed on command invocation)
2. Stage-specific gates and checks run (gate-check.sh, quality-check.sh, etc.)
3. Work is performed per `<process>` block
4. `runtime-gate.sh checkpoint` runs after significant modifications
5. `runtime-gate.sh post-turn` runs at end of `<process>` block
6. For pipeline-closing stages: `runtime-gate.sh export` runs before claiming completion

**Any completion claim without runtime-gate evidence is automatically invalid.**

## Anti-Pattern Detection

Blocked patterns (from governance-rules.md):

| ID | Anti-Pattern |
|----|-------------|
| G-01 | Wildcard delegation (`tasks: { "*": allow }`) |
| G-02 | Unrestricted bash (`bash: { "*": allow }`) |
| G-03 | Orphan alias (`kind: alias` without router action) |
| G-04 | Version downgrade |
| G-05 | Selector collision |
| G-06 | Missing exit criteria |
| G-07 | Skill avalanche (5+ skills loaded) |
| G-08 | Contract-free command |
| G-09 | Parity drift |
| G-10 | Silent unknown action |

## Steering Logic

When drift detected:

1. Compare current output to expected contract
2. Identify deviation point
3. Revert or adjust to align
4. Re-run quality check
5. Emit correction evidence

## References

Load from `references/`:
- governance-rules.md — Source of truth, parity, blocked patterns
- asset-contracts.md — Contract schemas for each asset type
- delegation-templates.md — Self-delegation packet templates
- completion-criteria.md — Per-stage completion checklists
