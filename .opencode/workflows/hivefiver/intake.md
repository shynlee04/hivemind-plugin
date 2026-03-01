---
name: hivefiver-intake
description: "Gather requirements through structured questions for framework asset creation"
version: "1.0.0"
contract_version: "1.0"
---

# Intake Stage Workflow

> Collects detailed requirements for the target asset(s) through structured questioning.

## Entry Criteria

- [ ] Discovery stage completed — OR — Start stage completed (if discovery bypassed in `improve` journey)
- [ ] Intent classified and recorded
- [ ] Pipeline activated
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh intake "$(pwd)"
  # Expected: {"allowed": true, "reason": "discovery completed"} (full_build)
  # Expected: {"allowed": true, "reason": "audit triage completed"} (improve)
  ```

### Upstream Transitions (Which Journeys Arrive Here)

| Journey | Arrives From | Via Gate |
|---------|-------------|---------|
| build_new | discovery → intake | Promotion gate (0 critical, ≤1 minor) |
| extend | discovery → intake | Promotion gate |
| improve | audit → triage → intake | audit_triage gate (user selects findings) |

## Steps

### Step 1: Verify Previous Stage
**Action:** Verify discovery OR start stage is completed (depends on journey):
```bash
# For build_new/extend: discovery must be completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read | grep -q '"discovery"'
# For improve: audit must be completed (discovery bypassed)
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read | grep -q '"audit"'
```

**Verification:** At least one prerequisite found in completed stages.

### Step 2: Determine Target Asset Type
**Action:** Based on user intent, identify which asset type(s) are needed:
| Asset Type | Location | When Needed |
|------------|----------|-------------|
| Agent | `.opencode/agents/` | Creating new agent profile |
| Command | `.opencode/commands/` | Creating new slash command |
| Skill | `.opencode/skills/` | Creating domain expertise package |
| Workflow | `.opencode/workflows/` | Creating multi-step process |
| Template | `.opencode/templates/` | Creating reusable template |
| Reference | `.opencode/references/` | Creating documentation |

**Verification:** Asset type logged in requirements.

### Step 3: Ask Structured Questions
**Action:** Use AskUserQuestion tool to gather requirements. Questions vary by asset type:

**For Agents:**
- Purpose and responsibilities
- Permission scope (allowed/forbidden paths)
- Delegation targets (which subagents)
- Model preferences
- Verification obligations

**For Commands:**
- Trigger phrase pattern
- Target agent assignment
- Allowed tools
- Expected behavior
- Return schema

**For Skills:**
- Use-case triggers
- Domain knowledge scope
- Reference files needed
- Progressive disclosure level

**For Workflows:**
- Number of stages
- Dependencies between stages
- Verification loops
- Error recovery paths

**Verification:** All questions answered or marked as optional.

### Step 4: Capture Requirements
**Action:** Document all captured requirements in structured format.

**Verification:** Requirements object populated with all captured answers.

### Step 5: Identify Ambiguities
**Action:** Review captured requirements for:
- Vague descriptions (needs clarification)
- Conflicting requirements (needs resolution)
- Missing critical information (needs input)
- Implicit assumptions (needs validation)

**Verification:** Ambiguity list created with risk levels.

### Step 6: Resolve Clarifications
**Action:** For each ambiguity, ask follow-up questions (max 2 per ambiguity).

**Verification:** All ambiguities resolved or explicitly deferred with risk noted.

### Step 7: Update Pipeline State
**Action:** Update pipeline state:
```bash
# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage intake

# Mark intake as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed intake

# Set target with asset type(s)
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "requirements gathered for: <asset types>"

# Set gate result
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate passed
```

**Verification:** State update commands return success.

### Step 8: Run Quality Check
**Action:** Verify stage completion:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh intake "$(pwd)"
```

**Verification:** Output shows no blocking errors.

## Exit Criteria

- [ ] All requirements gathered and documented
- [ ] Ambiguities resolved or risk-accepted
- [ ] Intake stage marked complete in STATE.md
- [ ] Target asset type(s) confirmed

## Error Routing

| Error | Recovery |
|-------|----------|
| Start stage not completed | Route back to `/hivefiver-start` |
| Incomplete answers | Loop back to Step 3 with focused questions |
| Unresolvable ambiguity | Escalate to user with options |
| Requirement conflict | Present trade-offs, get user decision |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Requirements complete | `/hivefiver-spec` |
| Requirements incomplete | `/hivefiver-intake --continue` |
| Need to restart intake | `/hivefiver-intake --reset` |

## Output Format

Every intake stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-intake.md`

```json
{
  "stage": "intake",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "asset_type": "agent | command | skill | workflow | template | reference",
  "requirements": {
    "purpose": "...",
    "scope": { "in_scope": [], "out_of_scope": [] },
    "behavior": "...",
    "inputs": [],
    "outputs": [],
    "constraints": []
  },
  "ambiguities": {
    "resolved": [],
    "deferred": [],
    "risk_accepted": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "intake",
    "completed_stages": ["start", "discovery", "intake"],
    "pipeline_target": "requirements gathered for: <asset type>"
  },
  "next_command": "/hivefiver-spec",
  "gate_result": "passed | failed"
}
```
