---
name: hivefiver-doctor
description: "Diagnose and repair broken framework chains, fix anti-patterns, restore health"
version: "1.0.0"
contract_version: "1.0"
---

# Doctor Stage Workflow

> Diagnoses and repairs broken framework chains. Fixes anti-patterns and restores system health.

## Entry Criteria

- [ ] Issues identified (from audit, user report, or pipeline error)
- [ ] Issues prioritized (critical > high > medium > low)
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh doctor "$(pwd)"
  # Expected: {"allowed": true, "reason": "issues identified"}
  ```

### Upstream Transitions (Which Journeys Arrive Here)

| Journey | Arrives From | Condition |
|---------|-------------|-----------|
| fix_broken | start → doctor | Intent = fix_broken |
| audit_health | audit → doctor | Critical findings from audit |
| any (recovery) | error state → doctor | Pipeline error set in STATE.md |

## Steps

### Step 1: Gather Diagnostics
**Action:** Collect diagnostic information:
```bash
# Run quality check for baseline
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh doctor "$(pwd)"

# Check current state
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read

# Verify asset contracts
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh verify asset-contracts

# Check parity
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh parity check
```

**Verification:** Diagnostic output captured for analysis.

### Step 2: Classify Issues
**Action:** Categorize issues by type and priority:

| Category | Examples | Priority |
|----------|----------|----------|
| **Broken Chain** | Missing dependency, orphan reference | Critical |
| **Contract Violation** | Missing frontmatter, invalid schema | Critical |
| **Anti-Pattern** | G-01 through G-10 violations | High |
| **Parity Drift** | .opencode/ != root | Medium |
| **Stale Content** | Outdated references, old versions | Low |

**Verification:** All issues classified with priority.

### Step 3: Create Fix Plan
**Action:** For each issue, determine fix strategy:

| Issue Type | Fix Strategy |
|------------|--------------|
| Missing dependency | Create missing asset or remove reference |
| Invalid frontmatter | Fix YAML syntax, add missing fields |
| Anti-pattern violation | Refactor to compliant pattern |
| Parity drift | Sync .opencode/ to root |
| Stale content | Update or remove outdated content |

**Verification:** Fix plan documented with ordered steps.

### Step 4: Schema-Guard Snapshot (Pre-Fix)
**Action:** Before modifying any files:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh snapshot "<target_file>"
```

**Verification:** Snapshots created for all files to be modified.

### Step 5: Apply Fixes (In Priority Order)
**Action:** Execute fixes from highest to lowest priority:

#### Critical Fixes (Must Complete)
1. Fix broken chains (create missing assets or remove references)
2. Fix contract violations (repair frontmatter, validate schemas)

#### High Priority Fixes
3. Remediate anti-patterns (refactor to compliant patterns)

#### Medium Priority Fixes
4. Sync parity (.opencode/ → root)

#### Low Priority Fixes
5. Update stale content (optional, user confirmation required)

**Verification Per Fix:**
- File modified successfully
- Schema-guard verify passes
- Specific issue resolved

### Step 6: Verify Fixes
**Action:** After each fix batch:
```bash
# Verify schema integrity
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh verify "<fixed_file>"

# Commit if valid
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh commit "<fixed_file>"
```

**Verification:** All fixed files pass verification.

### Step 7: Run Regression Check
**Action:** Full system validation after all fixes:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh doctor "$(pwd)"
```

**Verification:** Output shows issues resolved, no new issues introduced.

### Step 8: Verify Asset Contracts
**Action:** Confirm all contracts valid:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh verify asset-contracts
```

**Verification:** Contract validation passes.

### Step 9: Sync Parity
**Action:** Ensure .opencode/ and root are synced:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh parity check
```

If drifted, sync manually:
```bash
cp .opencode/agents/*.md agents/
cp .opencode/commands/*.md commands/
```

**Verification:** Parity check shows synced.

### Step 10: Update Pipeline State
**Action:** Record doctor completion:
```bash
# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage doctor

# Mark doctor as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed doctor

# Set target with fix summary
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "doctor complete: <N> issues fixed"

# Set gate result
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate passed
```

**Verification:** State update commands return success.

## Exit Criteria

- [ ] All critical issues resolved
- [ ] Quality check passes
- [ ] Contract validation passes
- [ ] Parity verified
- [ ] No anti-patterns remaining
- [ ] Doctor stage marked complete

## Error Routing

| Error | Recovery |
|-------|----------|
| Fix introduces new issue | Revert via schema-guard diff, try alternative fix |
| Cannot fix automatically | Escalate to user with manual fix instructions |
| Circular dependency | Restructure assets, may require architect stage |
| User rejects fix | Document issue, mark as accepted risk |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| All issues fixed | `/hivefiver-audit` (verify health) |
| Some issues remain | `/hivefiver-doctor --continue` |
| New assets needed | `/hivefiver-start` (new build cycle) |
| Architecture needs redesign | `/hivefiver-architect` |

## Output Format

Every doctor stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-doctor.md`

```json
{
  "stage": "doctor",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "diagnostics": {
    "total_issues": 0,
    "critical_found": 0,
    "critical_fixed": 0,
    "high_found": 0,
    "high_fixed": 0,
    "medium_found": 0,
    "medium_fixed": 0,
    "low_found": 0,
    "low_fixed": 0,
    "remaining": 0
  },
  "fixes_applied": [
    {
      "id": "FIX-001",
      "finding_id": "F-001",
      "issue": "...",
      "fix": "...",
      "file": "...",
      "verified": true,
      "schema_guard": "committed | pending | failed"
    }
  ],
  "regressions": {
    "new_issues_introduced": 0,
    "quality_check_passed": true,
    "contract_validation_passed": true,
    "parity_synced": true
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "doctor",
    "completed_stages": ["start", "doctor"],
    "pipeline_target": "doctor complete: <N> issues fixed"
  },
  "next_command": "/hivefiver-audit | /hivefiver-doctor --continue",
  "gate_result": "passed | failed"
}
```
