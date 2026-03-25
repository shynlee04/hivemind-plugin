---
name: parallel-debugging-hivemind
description: "Run multiple debugging hypotheses simultaneously using HiveMind headless swarm agents via spawnHeadlessResearcher. Use when multiple plausible root causes exist, single-threaded debugging is too slow, testing different environment configurations, or investigating non-deterministic and timing-dependent bugs."
---

# Parallel Debugging HiveMind

Orchestrates concurrent hypothesis testing by spawning headless swarm agents, each focused on a single root-cause theory. Agents run independently and report back via `hivemind_cycle`, then results are synthesized to identify the confirmed fix.

## Workflow

1. **Enumerate hypotheses** — list 2-5 plausible causes with supporting evidence, rank by likelihood and testability
2. **Configure swarm** — assign each hypothesis to a dedicated agent with `systematic-debugging-hivemind` injected and clear success/failure criteria
3. **Spawn agents** — use `spawnHeadlessResearcher` from `src/lib/session-swarm.ts`
4. **Monitor** — check status with `hivemind_inspect({ action: "scan" })`
5. **Synthesize** — collect results via `hivemind_cycle({ action: "export" })`, pick confirmed hypothesis, implement fix

## Spawning a Swarm Agent

```typescript
import { spawnHeadlessResearcher } from "src/lib/session-swarm"

await spawnHeadlessResearcher({
  taskId: "debug-A",
  focus: "Verify hypothesis A",
  context: { hypothesis: "...", testMethod: "...", successCriteria: "..." }
})
```

## Parallel Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Environment variation | Bug appears in some Node versions | Spawn agents for Node 18, 20, 22 |
| Dependency version | Regression after upgrade | Test with dependency v1 vs v2 |
| State variation | State-dependent failures | Test from clean, loaded, compacted states |
| Race condition | Non-deterministic bugs | Multiple agents attempting to trigger concurrently |

## Coordination

- **Broadcast** — agents share findings via `hivemind_memory({ shelf: "debug-results" })` in `graph/mems.json`
- **First-winner** — first agent to confirm a hypothesis signals others to stop
- **Aggregation** — one agent collects and synthesizes all results

## Constraints

- Maximum 5 parallel agents to prevent resource exhaustion
- Each agent must report back via `hivemind_cycle({ action: "export" })`
- If no hypothesis confirmed after 3 cycles, stop and re-evaluate assumptions

## Checklist

- [ ] At least 2-3 hypotheses enumerated with evidence
- [ ] Each hypothesis assigned to a separate agent
- [ ] Clear success/failure criteria defined per agent
- [ ] Communication mechanism configured (broadcast, first-winner, or aggregation)

## File References

- `src/lib/session-swarm.ts` — swarm spawning
- `graph/mems.json` — shared memory
- `.hivemind/state/` — state coordination
