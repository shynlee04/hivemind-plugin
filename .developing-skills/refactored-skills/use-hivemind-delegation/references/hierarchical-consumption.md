# Hierarchical Consumption

Wave outputs feed forward — never skip to implementation without consuming investigation and research synthesis.

## Core Rules

| Rule | Detail |
|------|--------|
| Wave feeding | Each wave's output feeds the next wave's decision. Investigation → research → implementation → verification. |
| No skipping | Never skip to implementation without consuming investigation + research synthesis first. Discipline violation otherwise. |
| Carry-forward | ≤5 findings, blocked routes, recommended next action, output paths between waves. |
| Orchestrator reads | Summary fields and output path only. If detail needed, delegate another agent to read the output. |

## Wave Sequencing

`Wave 1 (investigation) → synthesis → Wave 2 (research/planning) → synthesis → Wave 3 (implementation) → synthesis → Wave 4 (verification)`

Skip a wave only if the previous wave's synthesis explicitly confirms no gaps remain.

## Between-Wave Escalation

If a wave's synthesis reveals a fundamental blocker:
1. **Do NOT dispatch the next wave** — pause and report to orchestrator
2. Orchestrator decides: re-plan decomposition, add a bridging wave, or escalate to user
3. Document the blocker in the handoff packet's `blocked_routes` field

## When to Merge Waves vs Keep Separate

| Scenario | Action |
|----------|--------|
| Waves cover independent domains | Keep separate — parallel dispatch |
| Wave 2 depends on Wave 1's specific findings | Sequential — merge only after synthesis |
| Both waves ask the same agent type | Merge into one wave with combined scope |
| Wave 2 would duplicate Wave 1's file reads | Keep separate but share `output_paths` for context |
