# src/delegation/ — Delegation Contracts

## Responsibilities
- Define bounded delegation packets that bind source/target sessions, agents, trajectory, workflow, and task scope.
- Carry evidence, return, and memory contracts for delegated sub-sessions.

## Owned Failures
- Delegations without trajectory/workflow/task anchors
- Missing return contract or required evidence contract
- Delegation packets that imply session ownership instead of bounded execution scope

## Mutation Boundary
- May construct and normalize delegation packets.
- Must not directly mutate workflow, task, or trajectory state.

## Contracts
- Inbound: orchestrator/start-work/command runtime handoff requests
- Outbound: bounded packet for prompt packets, sub-session runtime, and return validation
