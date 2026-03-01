---
name: hivefiver-spec
description: "Transform gathered requirements into unambiguous specification with acceptance criteria"
version: "1.0.0"
contract_version: "1.0"
---

# Spec Stage Workflow

> Converts requirements into a formal specification with measurable acceptance criteria.

## Entry Criteria

- [ ] Intake stage completed (verified via state-update.sh)
- [ ] Requirements locked in STATE.md
- [ ] Target asset type(s) identified
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh spec "$(pwd)"
  # Expected: {"allowed": true, "reason": "intake completed"}
  ```

### Upstream Transitions (Which Journeys Arrive Here)

| Journey | Arrives From | Via Gate |
|---------|-------------|---------|
| build_new | intake → spec | intake gate (requirements complete, ambiguity resolved) |
| extend | intake → spec | intake gate |
| improve | intake → spec | audit_triage + intake gate |

## Steps

### Step 1: Verify Previous Stage
**Action:** Verify intake stage is completed:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read | grep -q '"intake"'
```

**Verification:** Command exits 0 (intake found in completed stages).

### Step 2: Load Requirements
**Action:** Load requirements gathered during intake:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh state load
```

**Verification:** All requirement fields accessible and parsed correctly.

### Step 3: Create Specification Document
**Action:** Compose formal specification including:

| Section | Content |
|---------|---------|
| **Name** | Asset identifier (kebab-case) |
| **Purpose** | Single-sentence description |
| **Scope** | In-scope and out-of-scope paths |
| **Behavior** | Detailed behavioral description |
| **Inputs** | Expected inputs and formats |
| **Outputs** | Expected outputs and schemas |
| **Constraints** | Operational limits |

**Verification:** Specification covers all gathered requirements without gaps.

### Step 4: Define Acceptance Criteria
**Action:** Create measurable acceptance criteria using Given-When-Then:
```
Given [initial context]
When [action performed]
Then [expected outcome]
```

Example for a skill:
```
Given user requests "create a skill"
When skill is generated
Then SKILL.md exists with valid frontmatter
And references/ directory contains required docs
```

**Verification:** Each criterion is testable and unambiguous.

### Step 5: Map Verification Conditions
**Action:** Specify verification method for each criterion:
| Criterion | Verification Method |
|-----------|---------------------|
| File exists | `test -f <path>` |
| Frontmatter valid | `grep -c "^---$" <file>` |
| Contract passes | `bash scripts/quality-check.sh` |
| Behavior correct | Manual test or automated suite |

**Verification:** Every acceptance criterion has corresponding verification method.

### Step 6: Create Ambiguity Map
**Action:** Document remaining ambiguities:
- Ambiguity description
- Chosen resolution
- Risk level (low/medium/high)
- Mitigation strategy

**Verification:** All ambiguities have documented resolutions.

### Step 7: Present Specification for Approval
**Action:** Display complete specification to user for review.

**Verification:** User explicitly approves specification (not just acknowledges).

### Step 8: Update Pipeline State
**Action:** Update pipeline state:
```bash
# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage spec

# Mark spec as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed spec

# Set target with spec name
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "spec approved: <asset name>"

# Set gate result
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate passed
```

**Verification:** State update commands return success.

### Step 9: Run Quality Check
**Action:** Verify stage completion:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh spec "$(pwd)"
```

**Verification:** Output shows no blocking errors.

## Exit Criteria

- [ ] Specification document complete
- [ ] Acceptance criteria defined (Given-When-Then)
- [ ] Verification conditions mapped
- [ ] Ambiguity map complete
- [ ] User approval obtained
- [ ] Spec stage marked complete

## Error Routing

| Error | Recovery |
|-------|----------|
| Intake not completed | Route back to `/hivefiver-intake` |
| Spec rejected | Return to intake with specific feedback |
| Missing verification | Define verification before proceeding |
| Ambiguity unresolved | Escalate with concrete options |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Spec approved | `/hivefiver-architect` |
| Spec needs revision | `/hivefiver-intake --revise` |
| Restart from requirements | `/hivefiver-intake --reset` |

## Output Format

Every spec stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-spec.md`

```json
{
  "stage": "spec",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "specification": {
    "name": "...",
    "purpose": "...",
    "scope": { "in_scope": [], "out_of_scope": [] },
    "behavior": "...",
    "inputs": { "format": "...", "fields": [] },
    "outputs": { "format": "...", "schema": {} },
    "constraints": []
  },
  "acceptance_criteria": [
    { "id": "AC-1", "given": "...", "when": "...", "then": "...", "verification": "..." }
  ],
  "ambiguity_map": [
    { "description": "...", "resolution": "...", "risk": "low | medium | high" }
  ],
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "spec",
    "completed_stages": ["start", "discovery", "intake", "spec"],
    "pipeline_target": "spec approved: <spec name>"
  },
  "next_command": "/hivefiver-architect",
  "gate_result": "passed | failed"
}
```
