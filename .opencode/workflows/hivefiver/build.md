---
name: hivefiver-build
description: "Create framework assets according to approved architecture and contracts"
version: "1.0.0"
contract_version: "1.0"
---

# Build Stage Workflow

> Creates/modifies framework assets according to the approved architecture.

## Entry Criteria

- [ ] Architect stage completed (verified via state-update.sh)
- [ ] Architecture approved in STATE.md
- [ ] Contracts defined for all target assets
- [ ] Build order established
- [ ] Gate check passes:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh build "$(pwd)"
  # Expected: {"allowed": true, "reason": "architect completed"}
  ```

## Steps

### Step 1: Verify Previous Stage
**Action:** Verify architect stage is completed:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read | grep -q '"architect"'
```

**Verification:** Command exits 0 (architect found in completed stages).

### Step 2: Load Architecture Plan
**Action:** Load approved architecture from state:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh state load
```

**Verification:** Architecture fields accessible (topology, contracts, build_order).

### Step 3: Scan Current Inventory
**Action:** Get current asset inventory:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh inventory scan
```

**Verification:** Inventory shows existing assets that may be modified.

### Step 4: Execute Build Order (Per Asset)
**Action:** For each asset in build order:

#### 4a. Schema-Guard Snapshot (If Modifying)
```bash
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh snapshot "<asset_path>"
```

#### 4b. Create/Modify Asset
Create or modify the asset file according to its contract:
- **Agent:** `.opencode/agents/<name>.md` with frontmatter + body sections
- **Command:** `.opencode/commands/<name>.md` with frontmatter + behavior
- **Skill:** `.opencode/skills/<name>/SKILL.md` + `references/`
- **Workflow:** `.opencode/workflows/<name>.md` with entry/exit criteria

#### 4c. Schema-Guard Verify
```bash
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh verify "<asset_path>"
```

#### 4d. Schema-Guard Commit (If Valid)
```bash
bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh commit "<asset_path>"
```

**Verification Per Asset:**
- File created/modified successfully
- Frontmatter parses without error
- Schema-guard verify returns 0

### Step 5: Verify Asset Contracts
**Action:** Validate all created/modified assets:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh verify asset-contracts
```

**Verification:** All contracts pass validation.

### Step 6: Parity Sync
**Action:** Sync `.opencode/` to root directories:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-tools.sh parity check
```

Verify parity:
```bash
# For each modified asset, verify root copy matches
diff .opencode/agents/<name>.md agents/<name>.md
diff .opencode/commands/<name>.md commands/<name>.md
```

**Verification:** All diffs return empty (no differences).

### Step 7: Run Quality Check
**Action:** Full quality validation:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh build "$(pwd)"
```

**Verification:** Output shows:
- `"passed": true` or acceptable warnings
- No G-06 errors (missing exit criteria)
- No anti-patterns detected

### Step 8: Update Pipeline State
**Action:** Update pipeline state:
```bash
# Set current stage
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage build

# Mark build as completed
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed build

# Set target with asset list
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-target "built: <asset names>"

# Set gate result
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-gate passed
```

**Verification:** State update commands return success.

## Exit Criteria

- [ ] All assets created/modified per architecture
- [ ] Frontmatter valid on all assets
- [ ] Asset contracts validated
- [ ] Parity sync verified (.opencode/ → root)
- [ ] Quality check passed
- [ ] Build stage marked complete

## Error Routing

| Error | Recovery |
|-------|----------|
| Architect not completed | Route back to `/hivefiver-architect` |
| Schema-guard fails | Fix frontmatter syntax, retry |
| Contract validation fails | Review contract definition, fix asset |
| Parity drift | Re-run parity sync, verify diffs |
| Quality check fails | Review specific errors, fix and re-run |

## Offer Next

| Condition | Next Command |
|-----------|-------------|
| Build complete, all checks pass | `/hivefiver-audit` |
| Build needs revision | `/hivefiver-build --revise` |
| Architecture needs update | `/hivefiver-architect --revise` |

## Output Format

Every build stage completion MUST emit this JSON structure:

Template reference: `.opencode/templates/hivefiver/stage-output-build.md`

```json
{
  "stage": "build",
  "status": "completed",
  "timestamp": "<ISO-8601>",
  "assets_created": [
    {
      "type": "...",
      "name": "...",
      "path": "...",
      "lines": 0,
      "contract_valid": true,
      "schema_guard": "committed | pending | failed"
    }
  ],
  "assets_modified": [
    {
      "type": "...",
      "name": "...",
      "path": "...",
      "diff_lines": 0,
      "contract_valid": true,
      "schema_guard": "committed | pending | failed"
    }
  ],
  "validations": {
    "frontmatter_valid": true,
    "contracts_passed": true,
    "parity_synced": true,
    "quality_check": "passed | failed",
    "schema_guard": "committed | pending | failed",
    "anti_patterns_detected": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "build",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect", "build"],
    "pipeline_target": "built: <asset names>"
  },
  "next_command": "/hivefiver-audit",
  "gate_result": "passed | failed"
}
```
