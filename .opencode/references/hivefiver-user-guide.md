# HiveFiver User Guide

## Table of Contents

1. Workflow Diagrams
2. Stage Coordination Diagram
3. Command Reference
4. Configuration Reference
5. Usage Examples
6. Troubleshooting
7. Recovery Quick Reference
8. Framework File Structure

## Workflow Diagrams

Legend:
- `->` normal transition
- `[gate]` required promotion gate
- `(optional)` conditional transition

build_new
```text
start -> discovery [promotion] -> intake -> spec -> architect -> build -> audit
```

extend
```text
start -> discovery [promotion] -> intake -> spec -> architect -> build -> audit
```

fix_broken
```text
start -> doctor -> audit
```

audit_health
```text
start -> audit -> doctor (optional)
```

improve
```text
start -> audit [triage] -> intake -> spec -> architect -> build -> audit
```

learn
```text
start -> discovery -> END
```

custom
```text
start -> discovery [reclassify] -> router -> (build_new | extend | fix_broken | audit_health | improve | learn)
```

## Stage Coordination Diagram

```text
User/Command
   |
   v
runtime-gate.sh pre-turn
   |
   v
stage workflow execution
   |
   +--> gate-check.sh (stage entry)
   +--> quality-check.sh (stage exit)
   +--> state-update.sh (state mutation)
   |
   v
runtime-gate.sh checkpoint
   |
   v
runtime-gate.sh post-turn
   |
   v
runtime-gate.sh export (handoff/close)
```

## Command Reference

| Command | Purpose | Primary Workflow | Typical Next |
|---------|---------|------------------|--------------|
| `/hivefiver` | Router entrypoint; resolve action and dispatch | `router.md` | stage-specific command |
| `/hivefiver-start` | Initialize pipeline and classify intent | `start.md` | discovery/doctor/audit |
| `/hivefiver-discovery` | Guided requirement discovery and reclassification | `discovery.md` | intake/doctor/audit |
| `/hivefiver-intake` | Structured requirement intake | `intake.md` | spec |
| `/hivefiver-spec` | Produce unambiguous specification | `spec.md` | architect |
| `/hivefiver-architect` | Design contracts/topology/dependencies | `architect.md` | build |
| `/hivefiver-build` | Create or modify framework assets | `build.md` | audit |
| `/hivefiver-audit` | Health/contract/parity audit | `audit.md` | doctor/intake/end |
| `/hivefiver-doctor` | Diagnose and repair broken chains | `doctor.md` | audit/continue |
| `/hivefiver-continue` | Deterministic continuation handoff | `continue.md` | new session resume |

## Configuration Reference

Pipeline state is persisted via `.hivemind/hive-modules/hivefiver-v2/STATE.md` and runtime scripts.

| Field | Type | Meaning |
|------|------|---------|
| `pipeline_active` | boolean | Whether pipeline is active |
| `current_stage` | string | Active stage (`start`, `discovery`, etc.) |
| `completed_stages` | string list | Stages finished in current pipeline |
| `pipeline_target` | string | Human-readable objective |
| `last_gate_result` | string | Latest gate verdict |
| `pipeline_error` | string | Current blocking error if present |
| `last_checkpoint` | string | Last checkpoint marker/path |
| `error_recovery` | string | Selected recovery strategy |

## Usage Examples

build_new
```text
1) /hivefiver-start "build me a new agent"
2) /hivefiver-discovery
3) /hivefiver-intake
4) /hivefiver-spec
5) /hivefiver-architect
6) /hivefiver-build
7) /hivefiver-audit
```

extend
```text
1) /hivefiver-start "extend existing command"
2) /hivefiver-discovery
3) /hivefiver-intake
4) /hivefiver-spec
5) /hivefiver-architect
6) /hivefiver-build
7) /hivefiver-audit
```

fix_broken
```text
1) /hivefiver-start "framework is broken"
2) /hivefiver-doctor
3) /hivefiver-audit
```

audit_health
```text
1) /hivefiver-start "audit framework health"
2) /hivefiver-audit
3) /hivefiver-doctor (only if critical findings)
```

improve
```text
1) /hivefiver-start "improve framework"
2) /hivefiver-audit
3) triage findings
4) /hivefiver-intake
5) /hivefiver-spec
6) /hivefiver-architect
7) /hivefiver-build
8) /hivefiver-audit
```

learn
```text
1) /hivefiver-start "how do I use hivefiver"
2) /hivefiver-discovery --guided
3) END or reclassify
```

custom
```text
1) /hivefiver-start "I need something unusual"
2) /hivefiver-discovery
3) router reclassifies -> chosen journey pipeline
```

## Troubleshooting

| Problem | Likely Cause | Resolution |
|---------|--------------|------------|
| Command does not route correctly | Low-confidence intent or unknown action | Run `/hivefiver-start` with explicit intent keywords |
| Stage blocked by gate | Entry criteria unmet | Run `gate-check.sh <stage> .`, resolve listed blocker, retry |
| Output contract mismatch | Workflow/template drift | Compare `stage-output-<stage>.md` with workflow Output Format JSON |
| Parity drift detected | `.opencode/` and root mirror diverged | Sync target files and run parity check again |
| Continue handoff incomplete | Missing runtime export/checkpoint | Run `runtime-gate.sh checkpoint/post-turn/export` in order |

## Recovery Quick Reference

| Situation | Fastest Safe Command | Expected Outcome |
|-----------|----------------------|------------------|
| Broken chain after build | `/hivefiver-doctor` | Diagnoses and repairs contracts/links |
| Unsure what to do next | `/hivefiver` | Router recommends and dispatches next stage |
| Need fresh session | `/hivefiver-continue` | Emits handoff and continuation command |
| Re-run health baseline | `/hivefiver-audit` | Current findings + severity + next action |
| Intent wrong at start | `/hivefiver-start` | Reclassifies and resets route |

## Framework File Structure

```text
.opencode/
  commands/
    hivefiver.md
    hivefiver-start.md
    hivefiver-discovery.md
    hivefiver-intake.md
    hivefiver-spec.md
    hivefiver-architect.md
    hivefiver-build.md
    hivefiver-audit.md
    hivefiver-doctor.md
    hivefiver-continue.md
  workflows/
    hivefiver/
      router.md
      start.md
      discovery.md
      intake.md
      spec.md
      architect.md
      build.md
      audit.md
      doctor.md
      continue.md
  templates/
    hivefiver/
      stage-output-start.md
      stage-output-discovery.md
      stage-output-intake.md
      stage-output-spec.md
      stage-output-architect.md
      stage-output-build.md
      stage-output-audit.md
      stage-output-doctor.md
      stage-output-router.md
      stage-output-continue.md
      transition-contract.md
  skills/
    hivefiver-mode/
    hivefiver-coordination/

.hivemind/
  hive-modules/
    hivefiver-v2/
      STATE.md
      handoffs/
```
