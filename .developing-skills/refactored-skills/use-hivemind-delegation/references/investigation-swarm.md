# Investigation Swarm Delegation

When the orchestrator needs broad codebase coverage fast, it launches an **investigation swarm** — parallel `hivexplorer` agents, each with a bounded slice.

## Swarm Dispatch Rules

1. **One concern per agent.** Each hivexplorer gets one module, one pipeline, or one question. Never hand an agent "look at everything."
2. **Parallel within a wave.** All swarm agents in a wave run concurrently. No dependencies between them.
3. **Bounded slices.** Each agent returns: findings with `file:line` references, evidence, and output paths. Nothing else.
4. **Orchestrator reads ONLY the compressed synthesis** (≤5 items per agent), not full scan output.

## Swarm Packet Shape

Each swarm packet must include:
- `slice_id` — unique identifier for this investigation slice
- `scope` — the bounded question (e.g., "map all exports in src/tools/trajectory/")
- `constraints` — always includes `read-only` for hivexplorer
- `output_path` — where the agent writes detailed findings
- `return_format` — compressed summary ≤5 items

## Orchestrator Discipline

After dispatching a swarm, the orchestrator must **wait**. If the orchestrator catches itself doing multi-file reads while agents are running, STOP immediately. The orchestrator that investigates alongside its swarm is the orchestrator that loses the thread.

## Swarm Synthesis

When all agents return:
1. Read each agent's compressed summary (≤5 items)
2. Merge into a unified finding set
3. Identify cross-slice patterns (shared root causes, dependency chains)
4. Feed synthesis into the next wave or into implementation delegation

## Wave-to-Wave Handoff Packet Format

When moving from one swarm wave to the next, emit a handoff packet:

```json
{
  "wave_id": "wave-1-investigation",
  "synthesis": ["finding 1", "finding 2", "...max 5"],
  "blocked_routes": [],
  "gaps_identified": ["unresolved question requiring next wave"],
  "recommended_next_action": "dispatch wave 2 with focus on X",
  "output_paths": [".hivemind/activity/codescan/wave-1/"]
}
```

## Wave Synthesis Checkpoint Template

After each wave completes, run this checkpoint:
1. **Coverage check:** Did all agents return? Any timeouts?
2. **Contradiction scan:** Do any findings contradict each other?
3. **Gap identification:** What questions remain unanswered?
4. **Escalation decision:** Is the gap resolvable in the next wave, or must we escalate?
5. **Merge vs split decision:** Can the next wave merge findings, or must it split into new slices?
