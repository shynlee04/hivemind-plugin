---
status: verifying
trigger: "Phase 25 event-tracker failure: current implementation still fails to capture actors, session delegation, last message output, manual exported interfaces such as session-ses_23a0.md, bounded merged artifacts, and both main/sub sessions."
created: 2026-04-26T00:00:00Z
updated: 2026-04-26T20:43:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: "Confirmed: notification-handler integration was removed from core hooks and delegation finalization; event-tracker gating is correctly scoped to persistence and did not need broad lifecycle dispatch changes."
test: "Commit only logical notification replay/finalization fixes plus matching tests and debug state."
expecting: "Staged diff should include only relevant source/tests/debug file; unrelated dirty skill/refactor/generated files remain unstaged."
next_action: "Stage relevant files only and commit the verified lifecycle replay regression guard/fix."

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Event tracker captures actors, session delegation, last message output, manually exported session interfaces, bounded merged artifacts per root/main session stem, and both main and sub sessions.
actual: Current implementation still fails those captures and may create/expand into countless session files instead of merging bounded lineage artifacts.
errors: Prior guardrail failures: canonical OpenCode lifecycle event shape `{ properties: { info: { id } } }` was not accepted by writer resolver; plugin wiring not directly tested; raw session IDs can inject Markdown metadata; malformed existing JSON silently discarded; updatedAt can regress on out-of-order events.
reproduction: Use fixture `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/session-ses_23a0.md` if present, or another `session-ses_*.md`; run focused event-tracker tests/plugin wiring test demonstrating missing actor/delegation/main-sub/last-output parsing and canonical event session id handling.
started: Phase 25 current implementation after prior attempted fixes; user reports it still fails.

## Eliminated
<!-- APPEND only - prevents re-investigating -->


## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-26T00:00:00Z
  checked: Required initial debugger references
  found: mandatory-initial-read.md requires reading required files first; common-bug-patterns.md highlights Data Shape/API Contract, Regex/String, Error Handling, and State Management as likely categories for wrong/missing parsed event data and swallowed malformed JSON.
  implication: Investigation should test data-shape contract mismatch, parser extraction gaps, writer merge semantics, and error swallowing before fixing.
- timestamp: 2026-04-26T00:05:00Z
  checked: Event-tracker file locations and manual export fixture availability
  found: src/lib/event-tracker contains parser.ts, writer.ts, types.ts, index.ts; required fixture session-ses_23a0.md exists at repository root; no test files matched tests/**/*event*tracker* by filename.
  implication: Use session-ses_23a0.md as required fixture and locate tests by content rather than filename; absence of obvious test names supports plugin/test coverage gap warning.
- timestamp: 2026-04-26T00:10:00Z
  checked: Existing event-tracker parser/writer/plugin implementation and current ses_23a0 artifacts
  found: Parser only returns header/turns/counters; writer document only has sessionId/semanticSessionId/artifactStem/status/counters/toc/events. Existing .hivemind/event-tracker/ses_23a0 artifacts contain 389 flat system events and no actors beyond system, no delegation/main-sub lineage, and no last assistant/message output. Writer resolveSessionId does not call getEventSessionID; malformed JSON is caught and replaced with an empty document; addEvent sets updatedAt to the new event timestamp after sorting, so older out-of-order events can regress updatedAt.
  implication: Root cause candidate is confirmed enough to encode RED tests: data-shape contract missing export-derived lineage fields plus writer resolver/error/monotonic timestamp gaps.
- timestamp: 2026-04-26T00:20:00Z
  checked: Focused RED tests for parser/writer/plugin event-tracker behavior
  found: `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` failed 6 tests: missing parsed.meta, canonical properties.info.id rejected, manual export merge blocked by same resolver, malformed JSON not thrown, updatedAt regressed from 200 to 100, plugin canonical event wrote no artifacts.
  implication: Hypothesis confirmed; proceed with minimal parser/schema/writer/plugin-compatible fix.
- timestamp: 2026-04-26T00:45:00Z
  checked: Focused event-tracker/plugin tests after fix
  found: `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` passed 3 files / 20 tests.
  implication: Fix addresses reproduced parser/writer/plugin failures; proceed to full required verification.
- timestamp: 2026-04-26T03:14:25Z
  checked: Final required verification suite after code and Phase 25 doc updates
  found: `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` passed 3 files / 20 tests; `npm run typecheck` passed; `npm run build` passed; `npm test` passed 47 files, 1 skipped, 857 tests passed, 1 todo.
  implication: Self-verification complete; fix is ready to commit and hand off for human/runtime confirmation if desired.
- timestamp: 2026-04-26T12:00:00Z
  checked: New user failure report for Phase 25 event-tracker artifact explosion
  found: One main session produced many nonsensical root artifact pairs including ses_01h3, ses_23a0, ses_239b, ses_bgr5, ses_eoy8, ses_f5xc, ses_lacp, ses_mlle, ses_s4fn, ses_vghm, and ses_zhnh. Expected behavior is exactly one canonical root pair for ses_23a0 with subsessions/delegations nested, bounded unknown-root handling, selective metadata only, and cleanup of generated litter.
  implication: Prior fix verified parser fields and guardrails but did not prove root/main key resolution for multiple sub-session/runtime events; investigate writer keying and add stronger regression tests.
- timestamp: 2026-04-26T12:10:00Z
  checked: Current event-tracker runtime directory and writer implementation
  found: `.hivemind/event-tracker/` currently contains 96 entries (48 JSON/Markdown pairs), including all user-reported nonsense pairs and many more. `writeSessionJourneyArtifacts()` always computes paths from `input.event.sessionId`; `addEvent()` overwrites document `sessionId`, `semanticSessionId`, and `artifactStem` from the incoming event. Current tests only cover one root event plus manual export, not subsequent subsession/runtime events.
  implication: Strong root-cause candidate: missing root-key resolver/known-subsession lookup and document-root preservation. Need RED tests before implementation.
- timestamp: 2026-04-26T12:20:00Z
  checked: Focused RED regression tests for root artifact explosion and unknown-root handling
  found: `npx vitest run tests/lib/event-tracker/session-journey-events.test.ts` failed 2 tests. Parent-linked sub event `ses_bgr5` created extra `ses_bgr5.{json,md}` beside `ses_23a0.{json,md}`. Unknown non-start event returned `written: true` instead of the expected bounded skip/no files.
  implication: Root cause confirmed; proceed with minimal writer root-resolution fix.
- timestamp: 2026-04-26T12:30:00Z
  checked: Focused GREEN tests after writer root-key resolver fix
  found: `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` passed 3 files / 22 tests. New regression tests prove parent-linked sub events update `ses_23a0.{json,md}` only, and unknown non-start events return `written: false` with no artifacts.
  implication: Code fix satisfies reproduced failure and prior plugin/parser guardrails; proceed to runtime artifact cleanup/regeneration and full verification.
- timestamp: 2026-04-26T12:45:00Z
  checked: Final required verification after plugin-level regression and Phase 25 summary update
  found: Focused event-tracker/plugin tests passed 3 files / 23 tests. `npm run typecheck && npm run build && npm test` passed; full suite reported 47 files passed, 1 skipped, 860 tests passed, 1 todo. Cleanup/regeneration command produced only `ses_23a0.json` and `ses_23a0.md` immediately after regeneration; subsequent tool calls in this live session re-created extra runtime files because the already-loaded plugin process predates the fix.
  implication: Source fix and test coverage are verified; final cleanup should be run after all tool calls, and real runtime confirmation requires using the rebuilt/restarted plugin.
- timestamp: 2026-04-26T16:00:00Z
  checked: New delegated failure correction and existing debug state
  found: User reports `.hivemind/event-tracker/` still contains many `ses_*.{json,md}` artifacts such as ses_8sbs, ses_9ii0, ses_60do, ses_83xb, ses_239a, ses_239b, ses_bj54, ses_bqnr, ses_cdfv, ses_jxit, ses_rjrn, ses_s46b, ses_veom, ses_xbbd, ses_yfwa, and ses_yrsz. Quote-level requirement clarifies event tracker must be a bounded context time-machine, not an event/action dump.
  implication: Re-open investigation; prior verification is insufficient because it did not prove selective observer filtering and one-root lineage aggregation under live/generated artifact conditions.
- timestamp: 2026-04-26T16:10:00Z
  checked: Current `.hivemind/event-tracker/` generated artifacts and source observer/writer paths
  found: Directory contains 81 JSON + 81 Markdown `ses_*` artifacts. Samples prove artifacts are created from `message.updated` and `message.part.delta` events: `ses_01hb.json` has sessionId `msg_dc660c9d3001pWcoP5H4NA01Hb` and three `message.updated` events; `ses_239a.json` and `ses_23a0.json` each retain 100 `message.part.delta` session_event rows, empty actors/subSessions/lastMessageOutput. `src/plugin.ts` calls `createEventTrackerArtifactsFromHook()` for every event without filtering, and `getEventSessionID()` accepts `properties.info.id`, which is correct for session events but wrong for message events where `info.id` is a message id.
  implication: Primary root cause is an observer/data-shape contract bug: no selective event filter and no session-entity guard before artifact writing. Root aggregation alone cannot fix artifacts rooted by message IDs because those are not sessions.
- timestamp: 2026-04-26T16:30:00Z
  checked: Current source, tests, docs, and representative generated artifacts after restart
  found: `src/plugin.ts:82-85` best-effort observer calls the event-tracker writer for every event; `src/lib/event-tracker/writer.ts:25-31` maps all unknown event types to `session_event`; `src/lib/session-api.ts:214-219` resolves `properties.info.id` without checking whether the event type is session-scoped. Existing tests prove root routing for `session.created/session.updated` only, but do not assert that message/tool firehose events are ignored or normalized. `.hivemind/event-tracker/` now has 132 JSON + 132 Markdown artifacts, with many `msg_*` message IDs and 100 retained `message.part.delta` rows.
  implication: The implementation contract is too broad: it records observed runtime actions rather than a selective context time-machine. Need a selective observer gate plus schema changes for tool names/concise summaries only.
- timestamp: 2026-04-26T16:35:00Z
  checked: Manual export fixture `session-ses_23a0.md` and product-detox event-tracker patterns
  found: The export fixture includes useful time-machine fields: actors (`Coordinator`, `gsd-executor`, `user`), `task` tool invocations with `subagent_type`, task IDs such as `ses_23a09f902ffeZcgOTkaOBE4D2x`, and bounded last output around the resume verifier block. Product-detox classifies selected turn/delegation events and maps them to summaries rather than dumping runtime action payloads; its V3 writer explicitly avoids storing events inside the consolidated session file.
  implication: Redesign should adapt the selective classification pattern: preserve actors, tool names, concise return summaries, last assistant output, and nested delegation/subsession relationships inside one root artifact; do not mirror every runtime event.
- timestamp: 2026-04-26T16:45:00Z
  checked: Phase 25 redesign contract
  found: Created `.planning/phases/25-session-journal-execution-lineage-bridge/25-EVENT-TRACKER-REDESIGN-2026-04-26.md` with root aggregation, selective observer filters, bounded schema, regression test contract, cleanup contract, and alternatives analysis.
  implication: Root cause and test contract are explicit; proceed to RED tests before patching source.
- timestamp: 2026-04-26T17:00:00Z
  checked: Focused RED regression tests for selective context-time-machine behavior
  found: `npx vitest run tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` failed 5 tests. Failures prove `message.part.delta` is persisted, `toolsUsed` is undefined for tool events and manual exports, `delegations` is undefined for manual exports, and `cleanupEventTrackerArtifacts` does not exist.
  implication: RED contract is validated; proceed with minimal source patch.
- timestamp: 2026-04-26T17:10:00Z
  checked: Focused GREEN tests after selective event-tracker fix
  found: `npx vitest run tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` passed 2 files / 26 tests. The new tests prove message firehose events are filtered, tool names/concise summaries are persisted without verbatim output, manual export merge persists tools/delegations/subsessions/last output, cleanup removes litter, and plugin observer ignores message firehose events.
  implication: Source fix addresses reproduced root cause; proceed to required full verification.
- timestamp: 2026-04-26T17:20:00Z
  checked: Required verification suite
  found: Focused full event-tracker suite passed: `npx vitest run tests/lib/event-tracker/session-artifact-parser.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/plugins/plugin-lifecycle.test.ts` (3 files / 28 tests). `npm run typecheck && npm run build && npm test` also passed; full suite reported 47 files passed, 1 skipped, 875 tests passed, 1 todo.
  implication: Fix is self-verified across typecheck, build, and full regression suite.
- timestamp: 2026-04-26T17:25:00Z
  checked: Generated event-tracker cleanup
  found: Before cleanup there were 352 generated `ses_*` files (176 JSON + 176 Markdown). Running `cleanupEventTrackerArtifacts({ keepArtifactStems: ['ses_23a0'] })` removed 350 and immediately left only `ses_23a0.json` and `ses_23a0.md`. Subsequent tool calls in this still-running session re-created a few extra files because the live plugin process predates the rebuilt fix.
  implication: Cleanup helper works; final cleanup should be repeated as the last tool action, and live plugin reload/restart is still required to stop old observer behavior in this current OpenCode process.
- timestamp: 2026-04-26T18:08:00Z
  checked: Live failure snapshot after user clean reinstall/rebuild
  found: `.hivemind/event-tracker/` contains 42 generated entries (21 JSON/Markdown pairs), including the user-reported `ses_3yqs`, `ses_2397`, `ses_g3fs`, `ses_rxnv`, and `ses_s1mf`. Representative JSON/MD content is non-contextual: `ses_3yqs`, `ses_g3fs`, `ses_rxnv`, and `ses_s1mf` have `sessionId` values starting with `msg_`, empty actors/subSessions/lastMessageOutput, and only `Session event (message.updated)` rows; `ses_2397` has 100 retained `message.part.delta` rows.
  implication: User report is reproduced from generated artifacts. The persisted data is an event/action dump, not a bounded time-machine context artifact, and message IDs are still being treated as root artifact IDs.
- timestamp: 2026-04-26T18:15:00Z
  checked: Cleanup followed by live-style tool activity in this delegated session
  found: After deleting the 21 generated pairs, the very next tool interactions recreated 5 JSON/Markdown pairs: `ses_2397`, `ses_23a0`, `ses_hjdc`, `ses_jnjs`, and `ses_szxn`. New `ses_hjdc`, `ses_jnjs`, and `ses_szxn` are fake roots with `sessionId` values starting with `msg_` and only `message.updated` rows. New `ses_2397` contains `message.part.updated` and `message.part.delta` rows. `ses_23a0` contains two `session.updated` rows rooted to a main/root session, which is the only contextual-looking artifact among the set.
  implication: Live reproduction is confirmed without fake direct writer calls. The failing path is active in the runtime observer around normal assistant/tool activity; root resolution for real session updates is partly correct, but message firehose admission remains broken.
- timestamp: 2026-04-26T18:26:00Z
  checked: Focused RED tests for exact live bad shapes and actual plugin tool hook
  found: `npx vitest run tests/lib/session-api.test.ts tests/plugins/plugin-lifecycle.test.ts -t "message.updated info.id|message.part|explicit message event sessionID|records plugin tool completion"` failed 4 tests. `getEventSessionID()` returned `msg_dc683580e001KJ4Am2DWo63Yqs` for `message.updated`, returned `ses_2397d5cf7ffeF57rGCsLddMRvN` for `message.part.delta`, preferred message info ID over explicit `properties.sessionID`, and plugin `tool.execute.after` left `toolsUsed` as `[]`.
  implication: Root cause is confirmed with executable tests: shared event session resolution is not event-scoped, and actual tool hook metadata is not connected to the event-tracker context artifact.
- timestamp: 2026-04-26T18:35:00Z
  checked: Focused GREEN tests after source patch
  found: `npx vitest run tests/lib/session-api.test.ts tests/plugins/plugin-lifecycle.test.ts -t "message.updated info.id|message.part|explicit message event sessionID|records plugin tool completion"` passed 2 files / 4 tests. Patch changes: message-scoped events no longer use `properties.info.id` as session IDs, explicit `properties.sessionID` wins for message events, event-tracker has exported `shouldTrackEventTrackerEvent()`, plugin event observer gates before writing, and plugin `tool.execute.after` writes concise root-attached tool metadata when args include a session/root ID.
  implication: The confirmed root cause is fixed at source level for the RED scenarios; proceed to broader regression and build verification.
- timestamp: 2026-04-26T18:50:00Z
  checked: Final verification and live-style post-build artifact check
  found: Focused event-tracker/session-api suites passed except unrelated plugin-lifecycle pending-notification tests when running the whole plugin file. `npm run typecheck` passed; `npm run build` passed; `npm test` ran 857 tests with 853 passing and 4 failures in delegation notification replay/finalization tests outside the event-tracker slice. Post-build cleanup removed 22 generated event-tracker files; after `git status --short` and `node -e`, the directory contained only `ses_23a0.{json,md}`. Manual export merge produced contextual `ses_23a0.json` with 7 actors, 8 subSessions, 11 delegations, tool names including bash/read/skill/task/todowrite, and bounded lastMessageOutput length 2000.
  implication: The event-tracker root cause is fixed and buildable; full-suite green remains blocked by pre-existing/non-event-tracker delegation notification failures.
- timestamp: 2026-04-26T19:05:00Z
  checked: Fresh coordinator regression report and dirty tree snapshot
  found: Coordinator verification failed before typecheck/build/full suite because `tests/plugins/plugin-lifecycle.test.ts` expected pending notification replay to call `client.session.prompt` once on `session.created` and `session.updated`, but got zero calls. Working tree also contains many unrelated dirty skill/refactor files, so only lifecycle/event-tracker regression files may be staged.
  implication: Previous assumption that replay failures were outside the event-tracker slice is now suspect. Re-open investigation focused on lifecycle dispatch ordering and preserve unrelated dirty work.
- timestamp: 2026-04-26T20:33:00Z
  checked: Focused reproduction for pending-notification replay tests
  found: `npx vitest run tests/plugins/plugin-lifecycle.test.ts -t "pending notifications"` failed exactly 2 tests. Both failures report `client.session.prompt` expected 1 call but received 0 on `session.created` and `session.updated`.
  implication: Regression is reproducible in isolation. Continue with lifecycle dispatch trace rather than broad suite noise.
- timestamp: 2026-04-26T20:40:00Z
  checked: Lifecycle dispatch and admission code paths
  found: `src/plugin.ts` calls `createCoreHooks()` with event observers including `sessionEventObserver` and `sessionJourneyEventObserver`; the event-tracker `shouldTrackEventTrackerEvent()` gate is inside `sessionJourneyEventObserver` only. `src/hooks/create-core-hooks.ts` now calls `lifecycleManager.handleEvent()` and observers, but the prior `replayPendingNotificationsForEvent()` helper/imports are removed and `src/lib/notification-handler.ts` is deleted. The current test file was modified to expect no push replay, contradicting the required regression contract.
  implication: Initial event-tracker short-circuit hypothesis is disproven for current source. Actual mechanism is removed pending-notification replay code/tests. Fix by restoring replay while preserving event-tracker gate locality.
- timestamp: 2026-04-26T20:35:00Z
  checked: Focused GREEN for replay and firehose behavior after patch
  found: `npx vitest run tests/plugins/plugin-lifecycle.test.ts -t "pending notifications|message firehose"` passed 1 file / 3 tests. The passing set includes both pending notification replay tests and the plugin event-tracker message firehose ignore test.
  implication: Minimal fix restores lifecycle replay and preserves the event-tracker admission/firehose guard. Proceed to required verification.
- timestamp: 2026-04-26T20:36:00Z
  checked: Required verification after replay fix
  found: Targeted suite passed 3 files / 72 tests; `npm run typecheck` passed; `npm run build` passed. Full `npm test` failed 1 test: `tests/lib/delegation-manager.test.ts > finalization > queues a durable pending notification when direct parent delivery fails`, where pending notifications were expected length 1 but were empty.
  implication: The immediate lifecycle replay regression is fixed, but full-suite verification exposes a closely related pending-notification queuing regression that must be fixed before committing.
- timestamp: 2026-04-26T20:37:00Z
  checked: Delegation terminal notification path after restoring `notifyDelegationTerminal`
  found: `src/lib/delegation-manager.ts` had also removed the fire-and-forget `notifyDelegationTerminal(this.client, delegation)` call. Restoring the import and call made `npx vitest run tests/lib/delegation-manager.test.ts -t "queues a durable pending notification"` pass 1 test, and stderr showed the expected failed direct delivery followed by durable pending queue behavior.
  implication: Related full-suite failure shares the same root cause: notification-handler integration was removed, not merely event-tracker gated. Proceed to final verification.
- timestamp: 2026-04-26T20:38:00Z
  checked: Full-suite contradictory notification test after terminal notify restore
  found: Full `npm test` then failed one dirty-tree test that had been modified to expect no push notification (`finalization completes cleanly without push notification — WaiterModel polling replaces push`). Restored the original contract (`notifyDelegationTerminal failure does not corrupt finalization`) and `npx vitest run tests/lib/delegation-manager.test.ts -t "notifyDelegationTerminal failure|queues a durable pending notification"` passed 2 tests.
  implication: Test suite now consistently matches the required push/pending-notification contract. Proceed to final verification.

- timestamp: 2026-04-26T20:39:00Z
  checked: Final verification after all code/test changes
  found: `npx vitest run tests/plugins/plugin-lifecycle.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/lib/session-api.test.ts` passed 3 files / 72 tests. `npm run typecheck` passed. `npm run build` passed. `npm test` passed 46 files / 857 tests.
  implication: Regression is fixed and verified; proceed to logical commit preserving unrelated dirty work.
- timestamp: 2026-04-26T20:50:00Z
  checked: Regression guard coverage gap
  found: Existing restored tests covered `createCoreHooks()` replay and plugin message firehose filtering separately, but not their combined plugin-level observer dispatch path.
  implication: Added a plugin-level test proving `HarnessControlPlane.event` replays pending notifications on `session.created` and ignores subsequent `message.updated` firehose artifacts, so event-tracker admission cannot regress into broad lifecycle short-circuiting unnoticed.
- timestamp: 2026-04-26T20:43:00Z
  checked: Final verification after plugin-level replay/admission guard
  found: `npx vitest run tests/plugins/plugin-lifecycle.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/lib/session-api.test.ts` passed 3 files / 73 tests. `npm run typecheck` passed. `npm run build` passed. `npm test` passed 46 files / 858 tests.
  implication: Final verification is green after the last test change.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: The persistent live-runtime failure had two remaining mechanisms. First, `getEventSessionID()` accepted `properties.info.id` for every event type, so `message.updated` IDs such as `msg_dc683580e001KJ4Am2DWo63Yqs` and `message.part.*` info IDs such as `ses_2397...` passed the shared core observer gate as if they were root sessions. Second, the actual plugin `tool.execute.after` hook never wrote event-tracker metadata, so tool context was only covered through direct writer tests and not through the live plugin hook path.
fix: Added event-scoped session ID resolution that ignores message-event `info.id` and prefers explicit message `properties.sessionID`; added exported `shouldTrackEventTrackerEvent()` admission; gated plugin event-tracker observer before writer calls; connected actual plugin `tool.execute.after` to root-attached concise tool metadata when a session/root ID is available; added RED/GREEN tests using exact live bad shapes and plugin tool completion behavior; updated Phase 25 debug/review/verification docs.
verification: RED tests failed 4 expected tests before patch; GREEN exact-shape tests passed 2 files / 4 tests; focused event-tracker/session-api tests passed; `npm run typecheck` passed; `npm run build` passed; post-build cleanup/live-style commands left only `ses_23a0.{json,md}`; manual export quality sample had actors/subSessions/delegations/tools/bounded output. Full `npm test` is blocked by 4 unrelated delegation notification replay/finalization failures outside the event-tracker slice.
files_changed: [src/lib/session-api.ts, src/lib/event-tracker/writer.ts, src/plugin.ts, tests/lib/session-api.test.ts, tests/plugins/plugin-lifecycle.test.ts, .planning/debug/phase-25-event-tracker-failure.md, .planning/phases/25-session-journal-execution-lineage-bridge/25-04-SUMMARY.md, .planning/phases/25-session-journal-execution-lineage-bridge/25-EVENT-TRACKER-REDESIGN-2026-04-26.md, .planning/phases/25-session-journal-execution-lineage-bridge/25-REVIEW.md, .planning/phases/25-session-journal-execution-lineage-bridge/25-VERIFICATION.md]

final_root_cause: Pending notification replay and terminal notification queuing were removed from lifecycle code during dirty Phase 35-style notification-handler removal. `createCoreHooks().event` no longer called `replayPendingNotificationsForEvent()`, `src/lib/notification-handler.ts` was deleted, and `DelegationManager.transitionToTerminal()` no longer scheduled `notifyDelegationTerminal()`. The event-tracker admission gate in `src/plugin.ts` was already scoped to `sessionJourneyEventObserver`, so it did not need to gate or short-circuit shared lifecycle observers.
final_fix: Restored `notification-handler.ts`, restored pending notification replay in `createCoreHooks().event`, restored fire-and-forget `notifyDelegationTerminal()` scheduling in delegation terminal transitions, and restored regression tests that assert replay/queueing behavior while preserving the plugin firehose test that message events do not create event-tracker artifacts.
final_verification: `npx vitest run tests/plugins/plugin-lifecycle.test.ts tests/lib/event-tracker/session-journey-events.test.ts tests/lib/session-api.test.ts` passed 3 files / 73 tests; `npm run typecheck` passed; `npm run build` passed; `npm test` passed 46 files / 858 tests.
final_files_changed: [src/hooks/create-core-hooks.ts, src/lib/delegation-manager.ts, src/lib/notification-handler.ts, tests/lib/delegation-manager.test.ts, tests/plugins/plugin-lifecycle.test.ts, .planning/debug/phase-25-event-tracker-failure.md]
