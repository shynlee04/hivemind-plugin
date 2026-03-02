---
name: gx-recover
description: "Diagnose and recover from context degradation, broken chains, or dirty state. Runs the recover-loop workflow."
agent: hiveminder
subtask: true
---

<enforcement>
GX-Pack entry guard (auto-executed — profile with fix_broken intent):
!`bash .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh . "fix_broken"`

Auto-purge check (auto-executed — snapshot if needed):
!`bash .opencode/skills/gx-context-engine/scripts/gx-auto-purge.sh . check`

If auto-purge returns `status: "auto_purge"` — run snapshot immediately:
!`bash .opencode/skills/gx-context-engine/scripts/gx-auto-purge.sh . snapshot`
</enforcement>

<objective>
Diagnose the current context state, identify degradation sources, apply targeted fixes, and verify recovery. Follow the gx-recover-loop workflow.
</objective>

<context>
User input: $ARGUMENTS

GX-Pack module state:
@.hivemind/hive-modules/gx-pack/STATE.md

Current enforcement state:
@.hivemind/state/enforcement.json

Auto-purge check result from enforcement block above.
</context>

<process>
Step 1: Load the `gx-context-engine` skill.

Step 2: Assess current state from enforcement block outputs.
  - If auto-purge triggered → snapshot was taken, proceed with recovery.
  - If healthy → inform user that no recovery is needed.

Step 3: Follow gx-recover-loop.yaml workflow:
  a. **Scan** — investigate `.opencode/` and `.hivemind/` for broken chains.
     Delegate to hivexplorer if deep investigation needed.
  b. **Diagnose** — run `gx-mid-guard.sh` to get full health report.
     Identify: drift sources, blocked TODOs, expired profiles, scope violations.
  c. **Fix** — apply targeted repairs:
     - Expired profile → rebuild with `gx-entry-guard.sh`
     - Orphan TODOs → clean up via hiveops_todo
     - Stale hierarchy → update via hierarchy_manage
     - Dirty context → spawn retrieval agent
  d. **Verify** — re-run `gx-mid-guard.sh` to confirm recovery.
     All scores must be below warning threshold.
  e. **Export** — if session is ending, run handoff purification.

Step 4: Report recovery results.
</process>

<output_contract>
Return structured recovery report:
```json
{
  "status": "recovered | partial | failed",
  "issues_found": 3,
  "issues_fixed": 3,
  "drift_before": 85,
  "drift_after": 20,
  "actions_taken": ["rebuilt profile", "cleared stale TODOs", "spawned retrieval"],
  "residual_risk": "none | description"
}
```
</output_contract>

<guided_interaction>
Always announce:
1. **What**: "I'm running the recovery loop to diagnose and fix context degradation."
2. **Why**: "Context degrades over time — turns pile up, TODOs get blocked, profiles expire. Recovery restores healthy state."
3. **Next**: "After recovery, I'll verify the fix and report results. You can then continue with /gx-steer."
</guided_interaction>
