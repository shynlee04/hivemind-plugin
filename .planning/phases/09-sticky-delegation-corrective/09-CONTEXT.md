# Phase 09: Sticky Delegation Corrective - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 09 fixes multi-layered architectural mismatches in the delegation system identified by Phase 08 root-cause analysis: completion detection false positives, parent notification durability, sync mode reliability, execution-mode clarity, and tmux integration parity with oh-my-openagent.

This phase does NOT redesign all delegation behavior or build the broader live-steering platform.

</domain>

<decisions>
## Implementation Decisions

### Message-count stability gate
- **D-01:** Integrate CompletionDetector into observeBackgroundCompletion(). After idle detection: get message count AND tool call count via client.session.messages(), feed to CompletionDetector via feedMessageCount(). Wait for stability timeout before marking complete.
- **D-02:** Stability check must track BOTH message count AND tool call count — both together constitute the evidence that a session actually processed work, not just that it was created and sat idle.

### Poll interval reduction
- **D-03:** Reduce DEFAULT_POLL_INTERVAL_MS from 15000 (15s) to 3000 (3s) to match oh-my-openagent responsiveness. This is a direct reduction, not configurable in this phase.

### Parent notification replay on resume
- **D-04:** Wire formatPendingNotificationsForSession() into createCoreHooks handleEvent(). When lifecycle phase transitions to 'created' or 'resumed', check pendingNotifications, format them, and inject via TUI toast.
- **D-05:** This is the integration point — not hydrateFromContinuity, which is a data-loading seam not a notification-injection seam.

### Sync mode output handling
- **D-06:** Keep sync mode (run_in_background=false) for dependent tasks that need control and synchronous results. It is NOT being replaced by background-only.
- **D-07:** Fix sync mode output crash by wrapping large responses in a structured JSON envelope { output: base64(assistant_text) }. This guarantees valid JSON regardless of response size.

### Parameter rename
- **D-08:** Rename run_in_background to async_dispatch in delegate-task tool schema. This clearly distinguishes from the background tool (OS subprocess management) and accurately describes the behavior (async child session dispatch).
- **D-09:** Update all tests and references to run_in_background → async_dispatch.

### User dispatch mode config
- **D-10:** Add runtime config fields to delegate-task schema: defaultDispatchMode (async/sync), tmuxAvailability (auto/enabled/disabled), pollInterval override (3s/5s/15s). Runtime reads these at launch time.

### Tmux full integration
- **D-11:** Full TmuxSessionManager integration — spawn delegated sessions in tmux panes when tmux is available. Pane process exit IS the completion signal (binary unambiguous, not a poll).
- **D-12:** Provides visual observability (user watches agents work in real-time) and a reliable fallback completion signal independent of session status polling.
- **D-13:** Integration approach: agent decides exact wiring based on existing background-manager patterns.

### Execution-mode routing (from Phase 08 context)
- **D-14:** builtin-process path (OS child process) uses process exit as completion signal — this already works correctly.
- **D-15:** builtin-subsession path (OpenCode child session) is the one that needs the stability gate fix. Both paths remain, with the subsession path now hardened.

### Notification delivery (from Phase 08 context)
- **D-16:** notifyParentSession → persistPendingNotification → formatPendingNotificationsForSession chain is now fully wired via handleEvent replay.
- **D-17:** Notification delivery is best-effort but now durable through persistence + replay rather than silently dropped on parent offline.

</decisions>

<specifics>
## Specific Ideas

- "The foreground is for dependent tasks that need control — background is for independent parallel tasks. Sync mode is NOT being removed."
- "Message-count stability must count BOTH messages AND tool calls — both together prove the session did actual work."
- "Tmux integration gives us a binary completion signal — process exit is unambiguous, no polling needed."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Root cause analysis
- `.planning/debug/delegation-root-cause-with-reference-2026-04-10.md` — canonical root cause for Phase 09: message-count stability, poll interval, parent notification durability, sync mode crash, naming collision, tmux integration

### Phase 08 closure context
- `.planning/phases/08-repair-durable-parent-observability-for-delegated-sessions/08-CONTEXT.md` — parent-visible truth anchored in continuity-backed lifecycle; Phase 08 bundled corrective closure
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — continuity as canonical store, delegation exports remain derived artifacts

### Current implementation baseline
- `src/lib/lifecycle-background-observer.ts` — observeBackgroundCompletion() where stability gate will be added
- `src/lib/completion-detector.ts` — CompletionDetector with feedMessageCount() and stability timer (existing, to be integrated)
- `src/lib/pending-notifications.ts` — formatPendingNotificationsForSession() (exists, needs wiring)
- `src/hooks/create-core-hooks.ts` — handleEvent() integration point for notification replay
- `src/tools/delegate-task.ts` — async_dispatch parameter rename target + new config fields
- `src/lib/lifecycle-process-runner.ts` — sync mode output path that needs JSON envelope fix

### Project state
- `.planning/ROADMAP.md` — Phase 09 entry with 5 planned items and root cause table
- `.planning/STATE.md` — current project state, Phase 09 ready for planning

</canonical_refs>

 benefi
## Existing Code Insights

### Reusable Assets
- `CompletionDetector` class in `src/lib/completion-detector.ts` — already has `feedMessageCount()` and stability timer; needs to be wired into observer
- `formatPendingNotificationsForSession()` in `src/lib/pending-notifications.ts` — exists, needs integration via handleEvent
- `detectTmuxAvailability()` in `src/tools/delegate-task.ts` — tmux detection already exists; full integration needs pane spawning

### Established Patterns
- Continuity is canonical source; observer notifications are inputs to reconciliation, not independent truth
- Plugin stays thin; runtime logic in src/lib/* modules
- CompletionDetector.messageCounts Map tracks stability per sessionID

### Integration Points
- observeBackgroundCompletion() → CompletionDetector.feedMessageCount() for stability
- handleEvent() → formatPendingNotificationsForSession() → TUI toast for replay
- delegate-task schema → async_dispatch rename + new config fields

</code_context>

<deferred>
## Deferred Ideas

- No tmux integration deferred — full integration is part of Phase 09
- No delegation redesign beyond the corrective corridor

</deferred>

---

*Phase: 09-sticky-delegation-corrective*
*Context gathered: 2026-04-10*
