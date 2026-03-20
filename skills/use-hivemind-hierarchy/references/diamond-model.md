# Diamond Model

## Role Separation Rules

### Orchestrator (hiveminder, hivefiver)
**Can:** Delegate, plan, coordinate, monitor
**Cannot:** Implement, execute code, write files

### Executor
**Can:** Implement, execute code, write files, run tests
**Cannot:** Delegate, plan for others, approve gates

### Verifier
**Can:** Validate, verify, check, report findings
**Cannot:** Implement, delegate, approve own work

### Researcher
**Can:** Investigate, analyze, report, recommend
**Cannot:** Implement, delegate, approve

## Boundary Violations
- Orchestrator implementing code → IMMEDIATE HALT
- Executor delegating work → IMMEDIATE HALT
- Verifier approving own verification → BLOCK
- Any role grant self-permissions → BLOCK

## Single-Agent Platforms
On platforms where one agent wears multiple hats, role switching happens sequentially:
1. Hat-switch is explicit and logged
2. Only one role active at a time
3. No concurrent role execution
