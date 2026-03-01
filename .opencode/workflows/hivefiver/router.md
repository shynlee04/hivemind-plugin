---
name: hivefiver-router
description: "Root routing workflow: classify user action and dispatch to correct stage command"
version: "1.0.0"
contract_version: "1.0"
---

# Router Workflow

> Dispatches `/hivefiver <action>` to the correct stage command. Single entry point for all HiveFiver interactions.

## Entry Criteria

- [ ] User invoked `/hivefiver` (with or without arguments)
- [ ] Discovery stage may hand off to router for custom journey reclassification
- [ ] Working directory is within project scope
- [ ] Runtime gate pre-turn passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .
  ```

## Steps

### Step 1: Parse Action Keyword
**Action:** Match `$ARGUMENTS` against explicit stage keywords:

| Keyword | Target Command | Stage Type |
|---------|---------------|------------|
| `start` | `/hivefiver-start` | pipeline-init |
| `discovery` | `/hivefiver-discovery` | pre-intake |
| `intake` | `/hivefiver-intake` | requirements |
| `spec` | `/hivefiver-spec` | specification |
| `architect` | `/hivefiver-architect` | design |
| `build` | `/hivefiver-build` | execution |
| `audit` | `/hivefiver-audit` | validation |
| `doctor` | `/hivefiver-doctor` | repair |
| `continue` | `/hivefiver-continue` | session-mgmt |
| `recover` | `/hivefiver-doctor` | error-recovery |

**Verification:** If keyword matched → route directly, skip intent classification.

### Step 2: Classify Free-Form Intent (if no keyword match)
**Action:** Read intent classifier output from enforcement block:
```bash
bash .opencode/skills/hivefiver-mode/scripts/classify-intent.sh "$ARGUMENTS"
```

Map intent → stage:

| Intent | First Stage | Full Pipeline |
|--------|------------|---------------|
| `build_new` | start | start→discovery→intake→spec→architect→build→audit |
| `fix_broken` | doctor | doctor |
| `audit_health` | audit | audit→doctor (if issues) |
| `extend` | spec | spec→architect→build→audit |
| `improve` | audit | audit→build |
| `learn` | start (guided) | start |
| `unknown` | — | Present all options |

**Verification:** Intent classified with confidence level.

### Step 3: Read Pipeline State (if no action given)
**Action:** Read pipeline orchestrator status:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .
```

| Pipeline State | Action |
|---------------|--------|
| active + no error | Recommend next stage from orchestrator |
| active + error | Route to `/hivefiver-doctor` with recovery |
| inactive | Present all 10 options with descriptions |

**Verification:** Pipeline state determines routing decision.

### Step 4: Dispatch
**Action:** Execute the resolved command.

**Verification:** Command invoked with correct arguments.

### Step 5: Post-Turn Enforcement
**Action:** Run runtime gate post-turn:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```

**Verification:** Post-turn output included as evidence.

## Exit Criteria

- [ ] Action resolved to a specific stage command
- [ ] Classification method logged (keyword | intent | pipeline_resume)
- [ ] Target command dispatched
- [ ] Post-turn enforcement ran

## Error Routing

| Error | Recovery |
|-------|----------|
| Unknown action keyword | Run intent classifier as fallback |
| Intent confidence = none | Present all valid actions, recommend `/hivefiver-start` |
| Pipeline error detected | Route to `/hivefiver-doctor`, announce error |
| Gate check fails | Report reason, suggest fixing scope |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Keyword matched | The matched stage command |
| Intent classified (high) | Auto-dispatch to classified stage |
| Intent classified (medium) | Confirm with user, then dispatch |
| No match | `/hivefiver-start` for guided onboarding |

## Output Format

Template reference: `.opencode/templates/hivefiver/stage-output-router.md`

```json
{
  "stage": "router",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "resolved_action": "<stage>",
  "resolved_command": "/hivefiver-<stage>",
  "classification_method": "keyword | intent_classifier | pipeline_resume",
  "confidence": "high | medium | low | none",
  "intent": {
    "classified": "build_new | extend | fix_broken | audit_health | improve | learn | custom | unknown",
    "raw_input": "<user input>",
    "alternatives": []
  },
  "pipeline_state": {
    "active": true,
    "current_stage": "<stage>",
    "completed_stages": [],
    "error": null,
    "next_recommended": "<stage>"
  },
  "user_profile": {
    "language": "en | vi | bilingual",
    "maturity": "L0 | L1 | L2 | L3",
    "guidance": "high | medium | low"
  },
  "dispatch": {
    "target": "/hivefiver-<stage>",
    "method": "keyword_match | intent_match | pipeline_next | user_choice",
    "auto_executed": true
  },
  "gate_result": "passed | failed"
}
```
