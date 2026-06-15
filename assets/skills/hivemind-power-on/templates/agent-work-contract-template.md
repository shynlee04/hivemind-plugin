# Agent Work Contract Template

A contract that defines the bounded work scope for a delegation. The
receiving agent reads this to understand what is in/out of scope.

```yaml
# Agent Work Contract
# Created by: <source agent>
# For: <target agent>
# Date: <YYYY-MM-DD>

id: <stable-id>  # e.g., "awc-2026-06-08-debug-sidecar"
owner_agent: <source agent>
owner_session_id: <session-id>
owner_parent_session_id: <parent session-id or null>
task_boundary: |
  <one-paragraph description of bounded task>
allowed_surfaces:
  - <files/folders the agent MAY touch>
dependencies:
  - <required upstream phase/artifact/task>
non_goals:
  - <explicit work outside this contract>
required_proof:
  - <evidence expected before completion>
minimum_evidence_level: <L1|L2|L3|L4|L5>
verification_commands:
  - <command to run for evidence>
blocked_state_rules:
  - <when to return blocked handoff>
briefing: |
  <bounded context briefing for the agent>
summary: |
  <one-line summary of expected output>
```

## Filling checklist

- [ ] `id` is stable (use a date + slug)
- [ ] `owner_agent` matches the L0 orchestrator name
- [ ] `task_boundary` is one paragraph, no jargon
- [ ] `allowed_surfaces` is non-empty (list concrete paths)
- [ ] `non_goals` is non-empty for high-stakes dispatches
- [ ] `minimum_evidence_level` is L1 (runtime-truthful) for any acceptance claim
- [ ] `verification_commands` is runnable on the current machine

## Usage

Save the contract as `.hivemind/delegations/<delegation-id>/work-contract.yaml`.
The receiving agent reads it on first tool call.
