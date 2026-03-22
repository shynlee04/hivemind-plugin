# Activity Pathing

## Purpose

All activity artifacts (handoff records, delegation JSON, scan outputs, agent iterations, hierarchy tracking, continuity state) are stored in a single deterministic folder structure under the project's `.hivemind/activity/` directory.

This reference defines the path conventions so that all skills in the pack resolve output locations consistently.

## Folder Structure

```
{project}/.hivemind/activity/
├── handoff/                  # Handoff records between agents/sessions
│   └── {handoff_id}.json     # One file per handoff event
├── delegation/               # Delegation packets and return results
│   ├── {packet_id}.json      # Emitted packet
│   └── {packet_id}-return.json  # Return result from delegated agent
├── hierarchy/                # Decision hierarchy tracking
│   └── decision-tree.json    # Accumulated decision chain
├── sessions/                 # Session continuity state
│   └── continuity.json       # Active session identifiers and turn state
├── codescan/                 # Code scan outputs per pass
│   └── {pass_id}/            # One folder per scan pass
│       ├── plan.json         # Batch plan for this pass
│       ├── {batch_id}.json   # Result for each batch
│       └── synthesis.json    # Final synthesis after all batches
├── agents/                   # Per-agent iteration output folders
│   └── {agent_name}/         # One folder per agent identity
│       └── {pass_id}/        # One folder per delegation pass
│           └── output.json   # Agent's output for this pass
├── longhaul/                 # Long-running task state
│   └── task-state.json       # Checkpoint for multi-turn work
├── pathing/                  # Path registry
│   └── active-paths.json     # Deterministic path map
└── state/                    # Active workflow state snapshots
    └── workflow-state.json   # Current workflow position
```

## Path Resolution

All skills MUST resolve paths from the base convention and then from `pathing/active-paths.json`, not from hardcoded strings:

```
base = {project}/.hivemind/activity/
handoff = {base}/handoff/
delegation = {base}/delegation/
codescan = {base}/codescan/{pass_id}/
agents = {base}/agents/{agent_name}/{pass_id}/
sessions = {base}/sessions/
longhaul = {base}/longhaul/
pathing = {base}/pathing/
state = {base}/state/
```

## Path Registry

`pathing/active-paths.json` is the machine-readable registry:

```json
{
  "_meta": {
    "created_at": "...",
    "updated_at": "..."
  },
  "base": ".hivemind/activity",
  "paths": {
    "handoff": ".hivemind/activity/handoff",
    "delegation": ".hivemind/activity/delegation",
    "hierarchy": ".hivemind/activity/hierarchy",
    "sessions": ".hivemind/activity/sessions",
    "codescan": ".hivemind/activity/codescan",
    "agents": ".hivemind/activity/agents",
    "longhaul": ".hivemind/activity/longhaul",
    "pathing": ".hivemind/activity/pathing",
    "state": ".hivemind/activity/state"
  }
}
```

The base convention defines the required keys. `active-paths.json` resolves those keys for the current workspace and may add workspace-specific path overrides.

## Activity Typing

Persistent records under `.hivemind/activity/` should include:

- `activity_type`: `distill`, `context-probe`, `planning`, `delegation`, `codescan`, `verification`, `debug`, `refactor`, `cleanup-review`, `continuity-anchor`, `handoff`, `documentation`
- `phase_type`: `entry`, `high-level-map`, `pipeline-map`, `journey-map`, `low-level-proof`, `cross-pass-synthesis`, `verification-gate`, `stabilization`

These fields let planning, delegation, scan, and continuity artifacts align without reading full raw output.

## Naming Conventions

| Component | Format | Example |
|-----------|--------|---------|
| `pass_id` | `pass_{timestamp}` or descriptive slug | `pass_1711072800`, `pass_src_tools` |
| `batch_id` | `batch_{n}` | `batch_1`, `batch_2` |
| `packet_id` | `deleg_{timestamp}_{concern}` | `deleg_1711072800_codemap` |
| `handoff_id` | `handoff_{timestamp}` | `handoff_1711072800` |
| `agent_name` | agent identity slug | `explorer`, `general`, `coder` |

All paths are relative to project root. Timestamps use Unix seconds for filenames and ISO 8601 for JSON content.

## Folder Creation

Skills should create folders on demand (mkdir -p or equivalent) rather than expecting them to pre-exist. The structure is a convention, not a prerequisite.

## Carry-Forward

At turn or session boundaries:
1. All pending outputs must be flushed to their deterministic locations.
2. `sessions/continuity.json` must be updated with current turn state.
3. `longhaul/task-state.json` must be updated if a long-haul task is active.
4. Output paths for delegation returns and scan results must be recorded so the next turn can find them.
5. Session records should carry `branch`, `worktree`, and `worktree_role` whenever branch/worktree control matters.
