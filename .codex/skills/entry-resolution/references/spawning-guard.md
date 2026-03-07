# Agent Spawning Guard

**MANDATORY LOAD**: Before any delegation or subagent dispatch.

## Pre-Spawn Checklist

**ALL must be YES before spawning:**

1. [ ] **Intent verified** — user's goal is 100% clear (not interpreted, not assumed)
2. [ ] **Lineage confirmed** — correct orchestrator for this domain
3. [ ] **Target agent identified** — specific subagent type, not "any available"
4. [ ] **Scope bounded** — explicit in-scope AND out-of-scope defined
5. [ ] **Acceptance criteria set** — how to verify the subagent's output
6. [ ] **Context budget checked** — will the delegation fit in token limits?
7. [ ] **Intelligence export planned** — how cycle results will be captured

## Execution Model Decision

```
Can subtask N succeed without subtask M's output?
├── YES for ALL pairs
│   ├── No shared state mutation? → PARALLEL allowed
│   └── Shared state mutation? → SEQUENTIAL required
└── NO for ANY pair → SEQUENTIAL required

Default: SEQUENTIAL. Parallel is an optimization you earn.
```

## Delegation Packet (Required Fields)

| Field | Content |
|-------|---------|
| **Objective** | WHAT to accomplish (not how) |
| **Scope** | Boundaries — what IS and IS NOT in scope |
| **Constraints** | Limits: time, tokens, files, architecture |
| **Acceptance Criteria** | How orchestrator verifies success |
| **Output Format** | Expected structure of result |

## After-Spawn Validation

```
Subagent returns
    │
    ├── Contains failure signals? (failed, error, couldn't, unable, blocked)
    │   YES → Record FAILURE, do NOT proceed on stale assumptions
    │
    ├── Result is specific? (not "done" or "completed" without details)
    │   NO  → Request specifics before accepting
    │
    └── Can verify independently?
        Run verification (test/build/grep) → Record accurate outcome
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Fire-and-forget | No result validation | Always verify after return |
| Vague delegation | "Fix the bug" | Use packet schema — all 5 fields |
| Premature parallel | Assuming independence | Default sequential, prove independence |
| Recursive delegation | Subagent delegates to sub-subagent | Executors do NOT recursively delegate |
| Context omission | No state in packet | Include decisions + constraints |
