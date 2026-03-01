---
name: hivefiver-start
description: "Bootstrap HiveFiver pipeline: classify user intent and initialize session state"
version: "1.0.0"
contract_version: "1.0"
---

# Start Stage Workflow

> Entry point for all HiveFiver interactions. Classifies intent and routes to appropriate stage.

## Entry Criteria

- [ ] User input received (command or natural language request)
- [ ] Working directory is within project scope (contains `.opencode/` or `.hivemind/`)
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh start "$(pwd)"
  # Expected: {"allowed": true, "reason": "scope valid"}
  ```

## Steps

### Step 1: Read Current State
**Action:** Read current pipeline state using state-update.sh:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read
```
Load STATE.md if it exists to determine current pipeline position.

**Verification:** State content loaded or empty state initialized.

### Step 2: Classify Intent
**Action:** Analyze user language to classify intent into one of:
| Intent | Keywords | Route To |
|--------|----------|----------|
| Build new | "build me an agent", "create a skill", "new command" | intake |
| Fix broken | "it's broken", "fix my framework", "not working" | doctor |
| Audit health | "audit my commands", "check framework", "health check" | audit |
| Extend | "add a capability", "new workflow", "extend" | spec |
| Improve | "clean up", "refactor agents", "optimize" | audit |
| Learn | "how do I use this", "what can you do" | start (guided) |

**Verification:** Intent classification logged with confidence level (high/medium/low).

### Step 3: Present Classification
**Action:** Display classified intent to user for confirmation. If confidence < high, present top 2 options.

**Verification:** User confirms or corrects classification.

### Step 4: Initialize Pipeline State
**Action:** Update pipeline state using state-update.sh:
```bash
# Set pipeline as active
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-active true

# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage start

# Set target description based on intent
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "<classified intent description>"

# Mark start as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed start

# Set gate result
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate passed
```

**Verification:** State update commands return success. Verify with:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read
```

### Step 5: Run Quality Check
**Action:** Verify stage completion:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh start "$(pwd)"
```

**Verification:** Output shows `"wf_status": "pass"` or acceptable warnings only.

## Exit Criteria

- [ ] Intent classified with user confirmation
- [ ] Pipeline activated in STATE.md
- [ ] Current stage set to "start"
- [ ] Gate result recorded
- [ ] Next command recommended

## Error Routing

| Error | Recovery |
|-------|----------|
| Gate check fails | Verify working directory contains `.opencode/` |
| Ambiguous intent | Ask clarifying questions (max 3) |
| STATE.md unreadable | Initialize new state file |
| User rejects classification | Return to Step 2 with additional context |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Build/Extend intent confirmed | `/hivefiver-discovery` |
| Fix broken intent confirmed | `/hivefiver-doctor` |
| Audit/Improve intent confirmed | `/hivefiver-audit` |
| Learn intent confirmed | `/hivefiver-discovery --guided` |
| Custom/Unknown intent | `/hivefiver-discovery` (adaptive classification) |

## Output Format

Every start stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-start.md`

```json
{
  "stage": "start",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "intent": {
    "classified": "build_new | extend | fix_broken | audit_health | improve | learn | custom",
    "confidence": "high | medium | low",
    "method": "keyword | intent_classifier",
    "raw_input": "<user input>"
  },
  "pipeline": {
    "id": "full_build | doctor_fix | audit_only | audit_then_build | guided_onboard | adaptive",
    "sequence": ["start", "discovery", "intake", "spec", "architect", "build"],
    "current_position": 0,
    "next_stage": "discovery | doctor | audit"
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "start",
    "completed_stages": ["start"],
    "pipeline_target": "<target description>"
  },
  "next_command": "/hivefiver-discovery | /hivefiver-doctor | /hivefiver-audit",
  "gate_result": "passed | failed"
}
```
