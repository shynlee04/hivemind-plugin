---
name: gx-steer
description: "Route GX-Pack operations: classify intent, build runtime profile, route to correct workflow. The main entry point for governed execution."
agent: hiveminder
subtask: true
---

<enforcement>
GX-Pack entry guard (auto-executed — builds runtime profile):
!`bash .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh . "$ARGUMENTS"`

Mid-session health check (auto-executed):
!`bash .opencode/skills/gx-context-engine/scripts/gx-mid-guard.sh .`

If the entry guard returns `status: "cached"` — profile is valid, proceed.
If the mid-guard shows `drift_score > 70` — warn user before proceeding.
If the mid-guard shows `drift_score > 90` — recommend /gx-recover first.
</enforcement>

<objective>
Classify user intent, build or validate the runtime profile, and route to the correct GX-Pack workflow for governed execution.
</objective>

<context>
User input: $ARGUMENTS

GX-Pack module state:
@.hivemind/hive-modules/gx-pack/STATE.md

Runtime profile (if exists):
@.hivemind/state/runtime-profile.json
</context>

<process>
Step 1: Load the `gx-context-engine` skill.

Step 2: Read the entry guard output from enforcement block.
  - If profile was created → note the intent and profile_id.
  - If profile was cached → note the TTL remaining.
  - If entry guard failed → stop and diagnose.

Step 3: Read the mid-guard output from enforcement block.
  - If healthy → proceed.
  - If warning → inform user, offer to compact or continue.
  - If auto_purge → run auto-purge snapshot and recommend /gx-recover.

Step 4: Classify the user's intent from $ARGUMENTS.
  - build_new → route to build workflow (future: gx-build-loop)
  - fix_broken → route to workflow: gx-recover-loop.yaml
  - audit_health → route to workflow: gx-semantic-pipeline.yaml
  - extend → route to build workflow
  - improve → route to workflow: gx-semantic-pipeline.yaml

Step 5: Present the routing decision to the user:
  - Intent classified as: [intent]
  - Profile: [profile_id]
  - Workflow: [workflow_name]
  - Role envelope: [primary → secondary → monitor]
  - Constraints: [list]

Step 6: Execute the routed workflow or offer next command.
</process>

<output_contract>
Return structured JSON:
```json
{
  "intent": "<classified_intent>",
  "profile_id": "<gx-profile-hash>",
  "workflow": "<workflow_name>",
  "role_envelope": {"primary": "...", "secondary": "...", "monitor": "..."},
  "next_command": "/gx-recover | /gx-validate | /gx-profile",
  "drift_score": 0
}
```
</output_contract>

<guided_interaction>
Always announce:
1. **What**: "I'm classifying your intent and building a runtime profile for governed execution."
2. **Why**: "The profile determines which agents can participate, what scope they have, and what constraints apply."
3. **Next**: "Based on your intent, I'll route to the appropriate workflow: recover, validate, or steer."
</guided_interaction>
