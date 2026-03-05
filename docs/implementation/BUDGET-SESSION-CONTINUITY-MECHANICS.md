# Budget and Session Continuity Mechanics

## Shared Injection Cap

The per-turn shared injection budget is calculated from `agent_behavior.constraints.max_response_tokens`.

The runtime now uses a single policy:
- Estimate context window chars as `max(8000, floor(max_response_tokens * 4))`
- Compute `15%` of that estimate
- Clamp the result to:
  - minimum `6000`
  - maximum `15360`

This cap is shared by the three injection channels in `src/lib/injection-orchestrator.ts`:
- `core-system`
- `core-message`
- `plugin-message`

The cap is tracked in a turn ledger keyed by `session_id + turn_count`, so the budget is scoped to one turn in one session.

## Why `.hivemind` Size Is Not the Main Blocker

Large `.hivemind` state does not automatically mean prompt bloat. The runtime does not dump `.hivemind` wholesale into the model prompt.

Instead, hooks and packers read persistent state and select only the highest-value fragments for the current turn. The practical blocker has been the per-turn injection cap, not the raw size of files on disk.

## Selective Extraction

Prompt assembly is selective rather than exhaustive:
- trajectory state is read to understand active focus and handoff position
- task state is filtered to active and relevant work
- mems are pruned for contamination, staleness, and low relevance
- anchors are bounded so only a small useful subset is injected

`src/lib/cognitive-packer.ts` is responsible for most of this pruning behavior. It removes false paths and invalidated task paths, drops stale mems, and shrinks lower-value content to fit the active budget.

## Per-Turn, Per-Session, and Cross-Session State

Per-turn:
- the injection ledger in `src/lib/injection-orchestrator.ts`
- shared budget reservations by injection channel

Per-session:
- `.hivemind/sessions/active/<session-id>/profile.json`
- queued state mutations partitioned by `sessionID` in `src/lib/state-mutation-queue.ts`
- session role/kind resolution in `src/lib/session-role.ts`

Cross-session:
- archived session summaries
- graph memory and anchors reused through controlled recall and packing
- compaction handoff reports stored on brain state and consumed on the next session turn

## Continuation Modes

Continue current session:
- same session id
- new turn key
- same persistent session directory

Auto-split into child session:
- handled by `src/lib/session-split.ts`
- creates a new OpenCode session with `parentID` set to the originating session
- carries bounded focus context and recent dialogue

Compaction handoff:
- handled by `src/lib/compaction-engine.ts`
- generates `next_compaction_report`
- next turn can re-inject the report before normal context to restore continuity

## Why Main and Sub Sessions Stay Separate

Main and sub sessions share some runtime code paths, but they are still isolated by identity and role:
- ledgers are keyed by session id, so two sessions with the same turn number do not collide
- mutation queues are partitioned by session id
- role resolution still distinguishes `main` and `sub` behavior
- child sessions preserve lineage through `parentID`, not shared mutable turn state

This means larger budgets improve continuity inside each session without merging main and sub execution contexts.
