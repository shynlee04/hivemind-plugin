---
name: transition-contract
description: "Deterministic handoff contract between any two HiveFiver stages."
version: "1.0.0"
stage: cross-stage
consumers:
  - .opencode/workflows/hivefiver/*.md
  - .opencode/skills/hivefiver-coordination/scripts/gate-check.sh
---

# HiveFiver Transition Contract Template

> Consumed by: all stage workflows and quality gate scripts.
> Produced by: source stage output + gate-check + state-update sequence.

## Schema

```json
{
  "transition": {
    "id": "build_new:start->discovery",
    "journey": "build_new",
    "from_stage": "start",
    "to_stage": "discovery",
    "trigger_command": "/hivefiver-discovery",
    "gate": {
      "name": "Gate 0 Entry Integrity",
      "result": "passed",
      "evidence": [
        "bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh start .",
        "bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh checkpoint ."
      ]
    }
  },
  "payload": {
    "source_output_template": "stage-output-start",
    "source_output_fields": [
      "intent.classified",
      "pipeline.id",
      "pipeline.sequence",
      "next_command",
      "gate_result"
    ],
    "target_expects": [
      "intent.classified",
      "pipeline.sequence",
      "state_updates.completed_stages"
    ],
    "compatibility": "exact"
  },
  "state_mutation": {
    "add_completed": "start",
    "set_stage": "discovery",
    "set_gate": "Gate 0",
    "pipeline_active": true,
    "state_file": ".hivemind/hive-modules/hivefiver-v2/STATE.md"
  },
  "recovery": {
    "on_failure": "halt_and_route_doctor",
    "fallback_command": "/hivefiver-doctor",
    "notes": "Do not promote when gate.result != passed"
  }
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transition.id` | string | ✅ | Unique identifier: `<journey>:<from_stage>-><to_stage>` |
| `transition.journey` | enum | ✅ | `build_new \| extend \| fix_broken \| audit_health \| improve \| learn \| custom` |
| `transition.from_stage` | enum | ✅ | `router \| start \| discovery \| intake \| spec \| architect \| build \| audit \| doctor \| continue` |
| `transition.to_stage` | enum | ✅ | Same enum as `from_stage` |
| `transition.trigger_command` | string | ✅ | Exact command that executes target stage |
| `transition.gate.name` | string | ✅ | Gate label used for the handoff decision |
| `transition.gate.result` | enum | ✅ | `passed \| failed` |
| `transition.gate.evidence` | string[] | ✅ | Verification commands or artifacts |
| `payload.source_output_template` | string | ✅ | Source template name (`stage-output-*`) |
| `payload.source_output_fields` | string[] | ✅ | Fields emitted by source stage and required for handoff |
| `payload.target_expects` | string[] | ✅ | Fields target stage reads during entry checks |
| `payload.compatibility` | enum | ✅ | `exact \| subset \| transformed` |
| `state_mutation.add_completed` | string | ✅ | Stage name appended to completed set |
| `state_mutation.set_stage` | string | ✅ | Next active stage |
| `state_mutation.set_gate` | string | ✅ | Gate marker saved in state |
| `state_mutation.pipeline_active` | boolean | ✅ | Pipeline active flag after mutation |
| `state_mutation.state_file` | string | ✅ | State artifact path mutated by transition |
| `recovery.on_failure` | enum | ✅ | `halt \| halt_and_route_doctor \| retry_source` |
| `recovery.fallback_command` | string | conditional | Required if `on_failure` routes another stage |
| `recovery.notes` | string | optional | Human-readable risk/remediation note |

## Supported Journey Transition Map

| Journey | Transition |
|---------|------------|
| build_new | `start->discovery`, `discovery->intake`, `intake->spec`, `spec->architect`, `architect->build`, `build->audit` |
| extend | `start->discovery`, `discovery->intake`, `intake->spec`, `spec->architect`, `architect->build`, `build->audit` |
| fix_broken | `start->doctor`, `doctor->audit` |
| audit_health | `start->audit`, `audit->doctor` (optional) |
| improve | `start->audit`, `audit->intake`, `intake->spec`, `spec->architect`, `architect->build`, `build->audit` |
| learn | `start->discovery` |
| custom | `start->discovery`, `discovery->router` |

Notes:
- Table above lists journey-level transition instances.
- Some transitions repeat across journeys (for example `start->discovery`).
- When validating contracts, evaluate both:
  - journey-level coverage (all listed handoffs exist), and
  - unique edge coverage (distinct `from_stage->to_stage` pairs).

## Validation Checklist

- Transition JSON parses successfully.
- `transition.id` is unique per handoff instance.
- `payload.target_expects` is a subset of the source template fields or a declared transform.
- `state_mutation` updates match `.hivemind/hive-modules/hivefiver-v2/STATE.md` workflow state machine.
- `transition.gate.evidence` contains at least one gate-check command and one runtime-gate command.
