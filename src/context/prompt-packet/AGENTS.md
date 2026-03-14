# src/context/prompt-packet/ — Runtime Packet Compiler

## Responsibilities
- Render the minimum main-session or sub-session packet required for trajectory/workflow/task-aware execution.
- Carry trajectory, workflow, task, delegation, and verification context without replaying full runtime history.

## Owned Failures
- Missing trajectory/task bindings in packets
- Sub-session packets that accidentally inherit main-session authority
- Prompt packets that omit return/evidence expectations

## Mutation Boundary
- Pure compilation only; no durable writes.
- Must not invent workflow or task ownership that the runtime has not already resolved.

## Contracts
- Inbound: normalized prompt packet state
- Outbound: main or delegated runtime packet strings
