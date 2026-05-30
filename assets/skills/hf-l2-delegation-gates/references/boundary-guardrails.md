# Boundary Guardrails

Use this reference when delegation authorization needs to prove that every boundary is guarded before dispatch.

## Boundary Checklist

| Boundary | PASS requires | BLOCK if |
|----------|---------------|----------|
| Workflow | Intent, skills, specialists, capability, scope are documented | Any gate is missing or inferred from chat only |
| Child | Handoff metadata names source, target, reason, allowed destinations, expected return | Child can act without an owner or return contract |
| Tool | Tool permissions match the bounded task | Mutating tools exceed file/scope authorization |
| Human | Checkpoint has options, response shape, and resume pointer | User is asked a vague yes/no with no continuation plan |

## Handoff Metadata Block

```yaml
source_agent: "<parent>"
target_agent: "<specialist>"
handoff_reason: "<why this boundary exists>"
allowed_destinations: []
expected_return: "<status/artifacts/evidence>"
tool_profile: "<read-only | mutating | restricted>"
human_checkpoint:
  required: true
  response_shape: "approve | reject | modify"
resume_pointer: "<gate or task to continue>"
```

## Tripwire Rule

If a boundary guardrail fails, stop before dispatch. A final review cannot repair unauthorized tool access or an untracked handoff after it has happened.
