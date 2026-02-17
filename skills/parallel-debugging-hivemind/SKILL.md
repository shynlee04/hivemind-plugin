# Skill: parallel-debugging-hivemind

## Overview

This skill provides the **parallel debugging methodology** for HiveMind v3.0. It instructs agents on how to run multiple debugging hypotheses simultaneously using headless swarm agents.

## Core Principle

```
WHEN ONE HYPOTHESIS IS UNCERTAIN, TEST MULTIPLE IN PARALLEL
```

This skill DOES NOT execute code. It instructs the Agent on HOW to orchestrate parallel debugging using HiveMind swarm capabilities.

## When to Use

Activate this skill when:
- Multiple plausible root causes exist
- Single-threaded debugging is too slow
- You need to test different environmental configurations
- The bug is non-deterministic or timing-dependent

## The Parallel Debugging Workflow

### Phase 1: Enumerate Hypotheses

**Step 1.1: List All Possible Causes**
```
Based on evidence gathered:
1. Hypothesis A: [cause] - because [evidence]
2. Hypothesis B: [cause] - because [evidence]
3. Hypothesis C: [cause] - because [evidence]
```

**Step 1.2: Prioritize**
- Rank by likelihood
- Rank by ease of testing
- Identify which can run in parallel

### Phase 2: Prepare Swarm Agents

**Step 2.1: Create Swarm Configuration**
```typescript
// Each swarm agent gets:
// - Unique focus (one hypothesis)
// - systematic-debugging-hivemind skill injected
// - Limited scope (test just this hypothesis)

const swarmConfig = {
  agents: [
    { id: "debug-A", focus: "Test hypothesis A: [specific cause]" },
    { id: "debug-B", focus: "Test hypothesis B: [specific cause]" },
    { id: "debug-C", focus: "Test hypothesis C: [specific cause]" }
  ],
  coordination: "parallel"
}
```

**Step 2.2: Prepare Each Agent**
Each swarm agent should:
- Receive the systematic-debugging-hivemind skill
- Have clear success/failure criteria
- Report back via hivemind_cycle

### Phase 3: Execute Parallel Testing

**Step 3.1: Spawn Headless Researchers**
```typescript
// Use session-swarm.ts to spawn
import { spawnHeadlessResearcher } from "src/lib/session-swarm"

await spawnHeadlessResearcher({
  taskId: "debug-A",
  focus: "Verify hypothesis A",
  context: {
    hypothesis: "...",
    testMethod: "...",
    successCriteria: "..."
  }
})
```

**Step 3.2: Monitor Progress**
```typescript
// Check swarm status
hivemind_inspect({ action: "scan" })
```

**Step 3.3: Collect Results**
```typescript
// Each agent calls export_cycle when done
hivemind_cycle({ action: "export" })
```

### Phase 4: Synthesize Results

**Step 4.1: Analyze All Findings**
- Which hypotheses were confirmed?
- Which were disproven?
- Any unexpected findings?

**Step 4.2: Determine Winner**
- Choose the confirmed hypothesis
- If none confirmed → return to Phase 1 with new information

**Step 4.3: Implement Fix**
- Apply fix for confirmed root cause
- Verify with test suite

## HiveMind-Specific Parallel Patterns

### Pattern 1: Environment Variation Testing

Run same test across different environments:

```typescript
const envSwarm = [
  { id: "env-node18", env: { node: "18" }, focus: "Test with Node 18" },
  { id: "env-node20", env: { node: "20" }, focus: "Test with Node 20" },
  { id: "env-node22", env: { node: "22" }, focus: "Test with Node 22" }
]
```

### Pattern 2: Dependency Version Testing

Test with different dependency versions:

```typescript
const depSwarm = [
  { id: "dep-v1", focus: "Test with dependency v1" },
  { id: "dep-v2", focus: "Test with dependency v2" }
]
```

### Pattern 3: State Variation Testing

Test from different session states:

```typescript
const stateSwarm = [
  { id: "state-clean", setup: "clean state", focus: "Test from clean state" },
  { id: "state-loaded", setup: "loaded state", focus: "Test from loaded state" },
  { id: "state-compacted", setup: "compacted state", focus: "Test from compacted state" }
]
```

### Pattern 4: Race Condition Detection

Run multiple agents trying to trigger the same bug:

```typescript
const raceSwarm = [
  { id: "race-1", focus: "Attempt to trigger race condition - try 1" },
  { id: "race-2", focus: "Attempt to trigger race condition - try 2" },
  { id: "race-3", focus: "Attempt to trigger race condition - try 3" }
]
```

## Coordination Mechanisms

### Method 1: Broadcast Channel
```typescript
// All agents share findings via graph/mems.json
hivemind_memory({ action: "save", shelf: "debug-results", content: "..." })
```

### Method 2: Aggregation Agent
```typescript
// One agent collects all results
// Analyzes and synthesizes findings
```

### Method 3: First-Winner Stops Others
```typescript
// If any agent confirms hypothesis first
// Other agents stop and report status
```

## Pre-Flight Checklist (BEFORE Output)

- [ ] Did I enumerate at least 2-3 hypotheses?
- [ ] Did I assign each hypothesis to a separate agent?
- [ ] Did I define clear success/failure criteria?
- [ ] Did I set up communication mechanism between agents?
- [ ] Did I prepare aggregation/synthesis step?

## Constraints

- **MAX 5 parallel agents** (to prevent resource exhaustion)
- **Each agent must report back** via `hivemind_cycle({ action: "export" })`
- **If no hypothesis confirmed after 3 cycles**, STOP and question the architecture

## Related Skills

- `systematic-debugging-hivemind`: For single-hypothesis testing
- `debug-orchestration`: For orchestrating complex debug sessions
- `hivemind-governance`: For session management during parallel debugging

## File References

- **Swarm spawning**: `src/lib/session-swarm.ts`
- **Memory sharing**: `graph/mems.json`
- **State coordination**: `.hivemind/state/`
