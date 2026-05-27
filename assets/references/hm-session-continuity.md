# Reference — Session Continuity & Trajectory

This reference details the session continuity, persistence, and trajectory tracking specifications in Hivemind.

## State Isolation (Q6 Root)

Unlike traditional orchestration engines that pollute the codebase workspace, all Hivemind state, execution journals, and session tracking logs reside strictly under the `.hivemind/` directory.

```
.hivemind/
├── session-tracker/            # Dynamic session logs & state
│   ├── project-continuity.json # Master lineage trace
│   └── ses_<id>/               # Individual session data
│       ├── session-continuity.json
│       ├── hierarchy-manifest.json
│       └── <session-id>.md     # Session audit trail
└── state/
    └── delegations.json        # Active multi-agent delegation status
```

## Session Hierarchy & Parent-Child Chaining

Hivemind tracks multi-level agent dispatches programmatically.
- **Root Sessions**: Created when a front-facing agent is invoked by a user.
- **Child Sessions**: Spatially and contextually nested sessions created when L0/L1 orchestrators delegate to L2 specialists.
- **Parent Session Stacking**: Using the `task_id` or `parentSessionId` parameter, child dispatches can attach directly to any existing complete or active session. Context is dynamically inherited from the parent to avoid redundant prompt packets.

## Execution Journaling & Compaction

To safeguard the context window during long-haul execution, Hivemind monitors token pressure.
1. **Event Capture**: Write-side tools log precise operations to `.hivemind/session-tracker/ses_<id>/session-continuity.json`.
2. **Trajectory Ledger**: Tracks tools used, files edited, and shell commands executed.
3. **Reactive Compaction**: When token budget limits are approached, the harness triggers compaction, collapsing verbose intermediate tool interactions into a high-level summary. The state remains valid and resumable.
