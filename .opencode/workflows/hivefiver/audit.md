---
name: hivefiver-audit
description: "System-wide health check: validate contracts, detect anti-patterns, verify integrity"
version: "1.0.0"
contract_version: "1.0"
---

# Audit Stage Workflow

> Read-only system-wide health check. Validates all framework assets.

## Entry Criteria

- [ ] Working directory contains `.opencode/` directory
- [ ] Assets exist to audit (agents, commands, skills, or workflows)
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh audit "$(pwd)"
  # Expected: {"allowed": true, "reason": "read-only operation"}
  ```

### Upstream Transitions (Which Journeys Arrive Here)

| Journey | Arrives From | Condition |
|---------|-------------|-----------|
| build_new / extend | build → audit | Build completed, all contracts valid |
| audit_health | start → audit | Intent = audit_health |
| improve | start → audit | Intent = improve (then triage→intake) |
| doctor verification | doctor → audit | Doctor fixes applied, verify health |

## Steps

### Step 1: Scan Asset Inventory
**Action:** Get complete asset inventory:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh inventory scan
```

**Verification:** Inventory lists all assets in `.opencode/`.

### Step 2: Run Full Quality Check
**Action:** Execute comprehensive quality validation:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh audit "$(pwd)"
```

**Verification:** Command completes and returns JSON report.

### Step 3: Validate Asset Contracts
**Action:** Verify all asset contracts:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh verify asset-contracts
```

**Verification:** Contract validation results captured.

### Step 4: Check Parity Status
**Action:** Verify parity between `.opencode/` and root:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh parity check
```

**Verification:** Parity status recorded (synced/drifted).

### Step 5: Detect Anti-Patterns
**Action:** Scan for blocked anti-patterns (G-01 through G-10):

| ID | Anti-Pattern | Detection Method |
|----|-------------|------------------|
| G-01 | Wildcard delegation | `grep -r 'tasks:.*"\*"' .opencode/` |
| G-02 | Unrestricted bash | `grep -r 'bash:.*"\*"' .opencode/` |
| G-03 | Orphan alias | Verify alias has router action |
| G-04 | Version downgrade | Compare version fields |
| G-05 | Selector collision | Check workflow precedence |
| G-06 | Missing exit criteria | `grep -L "Exit Criteria" workflows/*.md` |
| G-07 | Skill avalanche | Count skills loaded per operation |
| G-08 | Contract-free command | Check for contract_version field |
| G-09 | Parity drift | Compare .opencode/ to root |
| G-10 | Silent unknown action | Check router fallback |

**Verification:** Anti-pattern scan results documented.

### Step 6: Generate Audit Report
**Action:** Compile findings into structured report:

```json
{
  "timestamp": "<ISO 8601>",
  "scope": ["agents", "commands", "skills", "workflows"],
  "summary": {
    "total_assets": <N>,
    "passed": <N>,
    "warnings": <N>,
    "failures": <N>
  },
  "anti_patterns": [<detected patterns>],
  "contract_issues": [<validation failures>],
  "parity_status": "<synced|drifted>",
  "recommendations": [<ordered by priority>]
}
```

**Verification:** Report generated with all sections populated.

### Step 7: Present Audit Results
**Action:** Display audit report to user with:
- Summary counts
- Critical issues (must fix)
- Warnings (should fix)
- Recommendations (optional improvements)

**Verification:** User acknowledges audit results.

### Step 8: Update Pipeline State
**Action:** Record audit completion:
```bash
# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage audit

# Mark audit as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed audit

# Set target with summary
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "audit complete: <N> issues found"

# Set gate result based on findings
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate "<passed|failed>"
```

**Verification:** State update commands return success.

## Exit Criteria

- [ ] All assets scanned
- [ ] Quality check executed
- [ ] Anti-pattern scan completed
- [ ] Contract validation performed
- [ ] Parity status verified
- [ ] Audit report generated
- [ ] User acknowledged results

## Error Routing

| Error | Recovery |
|-------|----------|
| No assets found | Report empty inventory, suggest `/hivefiver-start` |
| Quality check fails | Report specific errors for doctor stage |
| Parity drift detected | Flag for sync, recommend `/hivefiver-doctor` |
| Anti-patterns found | List patterns, route to doctor for fixes |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| No issues found | `/hivefiver-start` (new task) or pipeline END |
| Critical issues found | `/hivefiver-doctor` |
| Warnings only | `/hivefiver-doctor --warnings` |
| Improve journey: triage approved | `/hivefiver-intake` (user selects findings to fix) |
| User wants improvements | `/hivefiver-intake` (scope improvements) |

### Improve Journey: Triage Gate

When journey = `improve` (audit_then_build), after presenting audit results:

1. Present findings grouped by severity
2. Ask user which findings to address (audit_triage gate)
3. User selects → pipeline advances to intake with selected findings as requirements
4. State update: `add-completed audit`, `set-stage intake`

## Output Format

Every audit stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-audit.md`

```json
{
  "stage": "audit",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "summary": {
    "total_assets": 0,
    "passed": 0,
    "warnings": 0,
    "failures": 0
  },
  "findings": [
    {
      "id": "F-001",
      "severity": "critical | high | medium | low",
      "category": "anti_pattern | contract | parity | stale | chain",
      "asset": "...",
      "description": "...",
      "fix_suggestion": "..."
    }
  ],
  "anti_patterns": ["G-01", "G-09"],
  "parity_status": "synced | drifted",
  "contract_validation": {
    "total_checked": 0,
    "passed": 0,
    "failed": 0,
    "failures": []
  },
  "triage": {
    "selected_for_fix": [],
    "deferred": [],
    "accepted_risk": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "audit",
    "completed_stages": ["start", "audit"],
    "pipeline_target": "audit complete: <summary>"
  },
  "next_command": "/hivefiver-doctor | /hivefiver-intake | END",
  "gate_result": "passed | failed"
}
```
