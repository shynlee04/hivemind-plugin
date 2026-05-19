# Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications — Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<spec_lock>
Requirements are locked by SPEC.md at `15-SPEC.md` — 6 requirements, ambiguity score 0.097. This discussion covers implementation decisions only.

**Locked requirements (MUST read before planning):**
- `.planning/phases/15-phase-15-delegate-task-gap-remediation-resume-delivery-rich-/15-SPEC.md`
- `.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-GAPS-ANALYSIS-2026-05-19.md` — source gap analysis
</spec_lock>

<domain>
## Phase Boundary

Surgically remediate 8 gaps (3 critical, 3 medium, 2 minor) in the delegate-task ecosystem to bring spec compliance from ~65% to ~95%+. All changes are modifications to existing files — no new modules, tools, or commands. Focus areas: session resume/chain session ID reuse, pending notification replay, rich notification fields, adjust-prompt/change-agent tools, total tool activity duration tracking.

</domain>

<decisions>
## Implementation Decisions

### Resume strategy (GAP-C1)
- **D-01:** Inject `sendPromptAsync` capability into `DelegationManager` as a dependency, used by `controlDelegation("resume")` and `controlDelegation("chain")` to send new prompts into the existing child session
- **Rationale:** WaiterModel dispatch creates new session by design; resume/chain need a different path that reuses the existing `childSessionId` via `sendPromptAsync`
- **Change scope:** `src/coordination/delegation/manager.ts:158-195` — add `sendPromptAsync` to options; restructure resume/chain to call it instead of abort+dispatch

### Pending notification replay trigger (GAP-C2, GAP-N2)
- **D-02:** Replay pending notifications at BOTH plugin init AND session resume — covers full recovery spectrum
- **Init-time:** `src/plugin.ts` route or post-init phase — check continuity for `pendingNotifications`, replay into TUI
- **Resume-time:** Hook into session resume lifecycle — check for pending notifications that were queued after session ended
- **Change scope:** `src/plugin.ts:100-127` — add pending notification playback; `src/task-management/continuity/index.ts` — ensure `pendingNotifications` are read on session start

### Chain-append approach (GAP-M1)
- **D-03:** Same mechanism as resume — chain appends to completed child session via `sendPromptAsync`, creates new delegation record with `chainedFrom` reference
- **Rationale:** Consistency — resume and chain share the same "append to existing session" pattern
- **Change scope:** `src/coordination/delegation/coordinator.ts:220-237` — modify chain() to use sendPromptAsync path instead of creating sequential new delegations

### Completion tracking approach (GAP-M3)
- **D-04:** Accumulate per-tool-call durations in `CompletionDetector` — track cumulative wall-clock time that tools were active (from tool start to tool end for each call)
- **Additional condition:** completion requires BOTH `lastToolActivity > idleThreshold` AND `totalToolActivityDuration > 60000`
- **Change scope:** `src/coordination/delegation/completion-detector.ts:17,191-204` — add `SemanticCompletionOptions.totalToolActivityDuration` and update dual-signal check

### Adjust-prompt implementation (GAP-M2)
- **D-05:** Direct `sendPromptAsync` to the running child session — no queuing layer needed
- **Schema:** Add `adjust-prompt` and `change-agent` to `DelegationControlSchema` enum; `adjust-prompt` requires `restartPrompt` (the supplementary prompt); `change-agent` requires a new `agent` field
- **Change scope:** `src/tools/delegation/delegation-status.ts:11-16` — extend Zod schema; `src/coordination/delegation/manager.ts` — handle two new control actions

### Notification format design (GAP-C3)
- **D-06:** Add to `NotificationFormatOptions`:
  - `path?: string` — working directory or result file path
  - `fileChanges?: string[]` — list of modified/created files (from completion-detector)
  - `completedAt?: string` — ISO 8601 timestamp of completion
- **Format string:** `<system_reminder>[DT:{id}] {icon} {status} | agent={agent} | {duration} | tools={tools} | path={path} | files={fileCount} | at={timestamp}{summary}</system_reminder>`
- **Change scope:** `src/coordination/delegation/notification-formatter.ts:11-18` — extend interface + update format functions

### Toast cleanup (GAP-N1)
- **D-07:** Remove the redundant toast `Delegation ${type} delivered` from `plugin.ts:164` — the system_reminder block already notifies the user
- **Change scope:** `src/plugin.ts:162-164` — remove `showTuiToast` call

### the agent's Discretion
- Exact field naming in `NotificationFormatOptions` interface
- Logging detail during pending notification replay
- Adjust-prompt error handling when session is no longer running

</decisions>

<specifics>
## Specific Ideas

- Resume/chain should feel seamless — user sends prompt, session continues with full context from prior rounds
- Notification design should be immediately scannable — user can see at a glance: what completed, where files are, when it finished

</specifics>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

### Primary spec
- `15-SPEC.md` — Locked requirements — MUST read before planning
- `.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-GAPS-ANALYSIS-2026-05-19.md` — Source gap analysis with per-gap file references and "yêu cầu fix" sections

### Affected source files
- `src/coordination/delegation/manager.ts:158-195` — controlDelegation resume/chain/restart logic
- `src/coordination/delegation/coordinator.ts:220-237` — chain() dispatching
- `src/coordination/delegation/completion-detector.ts:17,191-204` — idle threshold and dual-signal
- `src/coordination/delegation/notification-formatter.ts:11-18,31-36` — notification format
- `src/tools/delegation/delegation-status.ts:11-16` — DelegationControlSchema
- `src/plugin.ts:100-127,155-166` — deliver callback, notification routing, pending persistence

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `notification-formatter.ts` — format functions already exist; extend `NotificationFormatOptions` interface and update format strings
- `completion-detector.ts` — dual-signal framework already in place; add cumulative duration tracker
- `DelegationControlSchema` — Zod enum pattern already established; add two new actions

### Established Patterns
- **WaiterModel dispatch:** manager.ts creates new sessions via coordinator.dispatch — resume/chain must use a different path (sendPromptAsync to existing session)
- **Dependency injection:** manager.ts already accepts options (coordinator, lifecycle, nativeTask) — add `sendPromptAsync` as new dependency option
- **CQRS:** tools validate input → call coordination → state persisted through continuity — maintain this boundary

### Integration Points
- Plugin.ts wires the deliver callback — add pending notification replay here
- Continuity/persistence stores pendingNotifications — read them back at init and session resume
- DelegationStatus tool uses DelegationControlSchema — extend enum + add handler in manager

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-delegate-task-gap-remediation-resume-delivery-rich-*
*Context gathered: 2026-05-19*
