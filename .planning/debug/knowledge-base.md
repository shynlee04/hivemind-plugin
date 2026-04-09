# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## delegation-chain-post-fix-investigation — 0% success rate after attempt-fix-1 due to missing observability signals
- **Date:** 2026-04-09
- **Error patterns:** false-success, ok:true no real work, no-signal, background timeout, stream cutoff, task_started missing, dispatch failure silent
- **Root cause:** Three interlocking bugs: (1) No "started" observability signal after sendPrompt — parent blind between spawn and completion, (2) sendPrompt .catch() absorbs dispatch failure without notifying parent — parent waits for tasks that never started, (3) WATCH_TIMEOUT_MS = 180000 (3 min) too aggressive for research/analysis tasks
- **Fix:** Added "started" to TaskNotification type; wrapped sendPrompt in .then()/.catch() with parent notifications; increased WATCH_TIMEOUT_MS to 1800000 (30 min)
- **Files changed:** src/lib/notification-handler.ts, src/lib/lifecycle-process-runner.ts, src/plugin.ts
---

## delegation-chain-root-cause-fix — background delegation completion never detected due to event propagation failure
- **Date:** 2026-04-09
- **Error patterns:** background timeout, 0% success rate, stream cutoff, session ends before child completes, completion never detected, lifecycle state not updated
- **Root cause:** CompletionDetector.watch() in observeBackgroundCompletion() blocked on terminal events (session.idle, session.error, session.deleted) that were never propagated from child sessions to parent's completion detector. Parent session terminated after dispatching child, leaving background observer waiting for events that never arrive.
- **Fix:** Replaced event-based CompletionDetector.watch() with direct SDK polling using client.session.status(). Observer polls status map every 15s, checks child session status directly, updates lifecycle state when idle/busy/retry/deleted detected. Added getSessionStatusMap() helper to session-api.ts.
- **Files changed:** src/lib/lifecycle-background-observer.ts, src/lib/session-api.ts, tests/lib/lifecycle-background-observer.test.ts
---
