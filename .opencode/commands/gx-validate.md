---
name: gx-validate
description: "Run semantic validation on the command→workflow→skill chain. Checks intent alignment, not just file existence."
agent: hiveminder
subtask: true
---

<enforcement>
GX-Pack entry guard (auto-executed — profile with audit_health intent):
!`bash .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh . "audit_health"`

Semantic validation (auto-executed):
!`bash .opencode/skills/gx-context-engine/scripts/gx-semantic-validate.sh . build`
</enforcement>

<objective>
Validate the semantic integrity of the GX-Pack command→workflow→skill→script chain. Check that declared intents match actual routing, references resolve, and scripts produce expected outputs.
</objective>

<context>
User input: $ARGUMENTS

GX-Pack module state:
@.hivemind/hive-modules/gx-pack/STATE.md

Semantic validation rules:
@.opencode/skills/gx-context-engine/references/semantic-validation-rules.md
</context>

<process>
Step 1: Load the `gx-context-engine` skill.

Step 2: Follow gx-semantic-pipeline.yaml workflow:
  a. **Load** — enumerate all GX-Pack commands, workflows, skills, scripts.
  b. **Check chains** — for each command:
     - Does it reference a valid workflow?
     - Does the workflow load a valid skill?
     - Does the skill contain the scripts the workflow calls?
     - Are all scripts executable with JSON output?
  c. **Check intent alignment** — for each active session:
     - Does the declared intent match actual operations?
     - Are delegations within profile scope?
     - Are file edits within profile paths?
  d. **Report** — produce findings with severity rankings.
  e. **Remediate** — if requested, fix broken links (Phase 2+ only).

Step 3: Present validation results.
</process>

<output_contract>
Return validation report:
```json
{
  "valid": true,
  "chains_checked": 4,
  "mismatches": [],
  "chain_integrity": {
    "commands_checked": 4,
    "workflows_checked": 3,
    "skills_checked": 1,
    "scripts_checked": 10,
    "links_valid": 17,
    "links_broken": 0
  },
  "severity_summary": {"critical": 0, "high": 0, "medium": 0, "low": 0}
}
```
</output_contract>

<guided_interaction>
Always announce:
1. **What**: "I'm running semantic validation on the GX-Pack chain to check intent alignment."
2. **Why**: "Mechanical checks only verify files exist. Semantic checks verify the chain actually works end-to-end."
3. **Next**: "I'll report any mismatches by severity. Critical issues block promotion; low issues are informational."
</guided_interaction>
