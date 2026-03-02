---
name: gx-profile
description: "Inspect or rebuild the runtime profile. Shows current agent capabilities, constraints, and delegation boundaries."
agent: hiveminder
subtask: true
---

<enforcement>
Current profile (auto-executed — reads existing or builds new):
!`bash .opencode/skills/gx-context-engine/scripts/gx-entry-guard.sh .`
</enforcement>

<objective>
Inspect the current runtime profile or force a rebuild. Display agent capabilities, delegation boundaries, constraints, and profile validity.
</objective>

<context>
User input: $ARGUMENTS

Runtime profile (if exists):
@.hivemind/state/runtime-profile.json

Enforcement state:
@.hivemind/state/enforcement.json
</context>

<process>
Step 1: Load the `gx-context-engine` skill.

Step 2: Read the entry guard output from enforcement block.
  - If profile exists and valid → display current profile.
  - If profile expired → rebuild was triggered, display new profile.
  - If no profile → first time, display freshly built profile.

Step 3: If $ARGUMENTS contains "rebuild" or "force":
  - Delete existing runtime-profile.json.
  - Re-run entry guard to build fresh profile.
  - Display comparison: old vs new.

Step 4: Display profile in human-readable format:
  - **Profile ID**: gx-profile-<hash>
  - **Intent**: <intent>
  - **Role Envelope**:
    - Primary: <agent> (L<level>)
    - Secondary: <agent> (L<level>)
    - Monitor: <agent> (L<level>)
  - **Capabilities**:
    - Tools: [list]
    - Paths: [list]
    - Depth limit: <n>
    - Can delegate to: [list]
  - **Constraints**: [list]
  - **TTL**: <remaining>s / <total>s
  - **Policy**: <version>

Step 5: If profile has warnings (expired TTL, missing enforcement state), recommend actions.
</process>

<output_contract>
Return profile summary:
```json
{
  "profile_id": "<id>",
  "status": "valid | expired | rebuilt",
  "intent": "<intent>",
  "ttl_remaining": 3200,
  "role_envelope": {"primary": "...", "secondary": "...", "monitor": "..."},
  "capabilities_summary": "10 tools, 3 path patterns, depth 3",
  "constraints_count": 3
}
```
</output_contract>

<guided_interaction>
Always announce:
1. **What**: "I'm inspecting the current runtime profile to show agent capabilities and boundaries."
2. **Why**: "The profile controls what agents can do — which tools, which paths, who they can delegate to."
3. **Next**: "If the profile looks wrong or expired, I'll rebuild it. Otherwise, you can proceed with /gx-steer."
</guided_interaction>
