---
name: hivefiver-continue
description: "Spawn a fresh HiveFiver session that auto-continues from current pipeline state"
version: "1.0.0"
contract_version: "1.0"
---

# Continue Stage Workflow

> Creates deterministic session handoff. No context lost — STATE.md is the cross-session bus.

## Entry Criteria

- [ ] Pipeline is active (pipeline_active = true in STATE.md)
- [ ] Current stage exists in pipeline state
- [ ] Runtime gate pre-turn passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .
  ```

## Steps

### Step 1: Read Pipeline State
**Action:** Load current pipeline position:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .
```

**Verification:** Pipeline active, current stage known, completed stages listed.

### Step 2: Guard Check
**Action:** Verify pipeline is active.

| State | Action |
|-------|--------|
| `pipeline_active = true` | Proceed to handoff |
| `pipeline_active = false` | Report "No active pipeline", offer `/hivefiver-start` |
| `pipeline_error` set | Report error, offer `/hivefiver-doctor` |

**Verification:** Guard passed or user informed with recovery path.

### Step 3: Compose Handoff Prompt
**Action:** Generate continuation prompt:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh .
```

The prompt contains:
1. Skills to load (hivefiver-mode, hivefiver-coordination)
2. Current stage from STATE.md
3. Completed stages
4. Pipeline target
5. Phase-specific continuation instructions
6. Prior handoff context (if any)
7. Scope boundaries
8. Quality gate requirements

**Verification:** Handoff prompt is non-empty, contains all 8 fields.

### Step 4: Present or Execute
**Action:** Based on arguments:

| Argument | Action |
|----------|--------|
| `--exec` | Execute continuation immediately |
| `--prompt` | Show composed prompt for review |
| `--json` | Output machine-parseable JSON |
| (empty) | Show opencode run command for user to copy |

**Verification:** Command presented or executed.

### Step 5: Write Handoff Record
**Action:** Confirm handoff written:
```bash
ls -la .hivemind/hive-modules/hivefiver-v2/handoffs/
```

**Verification:** Handoff file exists with timestamp.

### Step 6: Post-Turn Enforcement
**Action:**
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```

**Verification:** Post-turn evidence captured.

## Exit Criteria

- [ ] Pipeline state verified as active
- [ ] Handoff prompt composed with all 8 context fields
- [ ] Handoff record written to handoffs/ directory
- [ ] User presented with command (or session spawned)
- [ ] Post-turn enforcement ran

## Error Routing

| Error | Recovery |
|-------|----------|
| Pipeline inactive | Report, offer `/hivefiver-start` |
| Pipeline error | Report error, offer `/hivefiver-doctor` |
| Handoff file write fails | Report disk error, show prompt in terminal |
| Session spawn fails | Show command for manual execution |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Handoff ready, user reviews | User runs generated command |
| --exec flag | Session auto-spawned |
| Pipeline inactive | `/hivefiver-start` |
| Pipeline error | `/hivefiver-doctor` |

## Output Format

Template reference: `.opencode/templates/hivefiver/stage-output-continue.md`

```json
{
  "stage": "continue",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "pipeline_state": {
    "active": true,
    "current_stage": "<stage>",
    "completed_stages": ["start", "intake", "..."],
    "target": "...",
    "error": null
  },
  "continuation_command": "opencode run ...",
  "handoff_file": ".hivemind/hive-modules/hivefiver-v2/handoffs/handoff-YYYYMMDD-HHMMSS.json",
  "handoff_content": {
    "skills_to_load": ["hivefiver-mode", "hivefiver-coordination"],
    "current_stage": "<stage>",
    "completed_stages": ["start", "intake", "..."],
    "pipeline_target": "...",
    "prior_handoff": null,
    "scope_boundaries": [".opencode/", ".hivemind/"],
    "quality_gate": "runtime-gate.sh pre-turn must pass before any action"
  },
  "new_session_will_do": "Resume at <stage>, working on <target>",
  "gate_result": "passed | failed"
}
```
