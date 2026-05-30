# Reference — Agent Specialists & Routing Boundaries

This reference details the classification, roles, and strict execution boundaries of Hivemind specialist agents.

## Hierarchy & Classification

Hivemind organizes agent capabilities into structured, non-overlapping tiers:

```
┌────────────────────────────────────────────────────────┐
│               L0 & L1: Orchestrators                  │
│       (Focus entirely on routing & coordination)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Delegates via WaiterModel)
┌────────────────────────────────────────────────────────┐
│                L2: Specialist Agents                   │
│        (Perform specific research, code, or reviews)   │
└────────────────────────────────────────────────────────┘
```

### L0/L1: Orchestration Tier
- **Agents**: `hm-orchestrator`, `hm-l0-orchestrator`, `hm-l1-coordinator`
- **Boundaries**: Forbidden from performing direct code modifications or running test/build commands. They analyze task parameters, resolve dependencies, spawn L2 specialists, and evaluate quality gate compliance.

### L2: Specialist Tier
- **Research Specialists**:
  - `hm-project-researcher`: Performs dependency audits and lockfile analysis.
  - `hm-phase-researcher`: Analyzes technical feasibility and codebase reuse patterns.
- **Code & Test Specialists**:
  - `hm-planner`: Generates structured execution Wave plans.
  - `hm-executor`: Implements code and runs unit tests.
  - `hm-code-fixer`: Inspects and corrects syntax/typecheck compiler regressions.
- **Verification Specialists**:
  - `hm-verifier`: Validates acceptance criteria and runs manual/automated test proofs.
  - `hm-code-reviewer`: Reviews code quality, style, and security concerns.
  - `hm-nyquist-auditor`: Validates compliance of the target workspace.

## WaiterModel Coordination Protocols

All dispatches from L0/L1 to L2 are governed by the **WaiterModel**:
1. **Capability Matching**: Orchestrator matches task parameters to the specialist agent's profile.
2. **Task Isolation**: The specialist is provisioned a focused task sub-session with inherited context.
3. **Dual-Signal Verification**: The specialist does not mark itself as "done". Completion requires verification by an independent verifier agent agreeing that evidence of success is present.
