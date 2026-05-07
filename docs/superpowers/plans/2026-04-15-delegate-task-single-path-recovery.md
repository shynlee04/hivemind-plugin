# Delegate-Task Single-Path Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `delegate-task` to one truthful background child-session path that persists accurate lifecycle/result state and remains safely readable by the parent session.

**Architecture:** Treat `delegate-task` as a specialized background companion to foreground `task`, not as a generic multi-mode dispatcher. Force `delegate-task` onto one OpenCode builtin-subsession async launch path, collapse persisted child truth to `queued → running → completed|failed`, promote `running` only from real assistant/tool evidence, fail dead children after 2 minutes, and make parent-facing retrieval come from continuity-backed result capture rather than inference.

**Tech Stack:** TypeScript, Vitest, OpenCode session API wrappers, harness continuity store, lifecycle observer/notification hooks.

---

## File Structure / Responsibilities

| File | Responsibility in this slice |
| --- | --- |
| `src/tools/delegate-task.ts` | Enforce the product contract at the tool boundary: async background child session, safe agent fallback, truthful immediate return payload. |
| `src/lib/execution-mode.ts` | Stop `delegate-task` from drifting across tmux/process heuristics; provide one explicit builtin-subsession rationale for this tool. |
| `src/lib/specialist-router.ts` | Normalize alias/invalid agent requests to `general` and preserve fallback warnings/metadata. |
| `src/lib/lifecycle-dispatcher.ts` | Seed parent/child continuity, create the child record, and route async `delegate-task` launches only through the builtin-subsession runner. |
| `src/lib/types.ts` | Define the persisted child-state/result fields that parent sessions and recovery readers consume. |
| `src/lib/task-status.ts` | Canonical child-status transitions for the continuity-backed delegate-task lifecycle. |
| `src/lib/lifecycle-state.ts` | Map persisted status to lifecycle phase and delegation-packet status without inventing activity that never happened. |
| `src/lib/lifecycle-patching.ts` | Patch continuity/lifecycle/packet state consistently for `queued`, `running`, `completed`, and `failed`. |
| `src/lib/runtime.ts` | Prevent raw transport/session status events from falsely proving meaningful work. |
| `src/lib/lifecycle-events.ts` | Record real tool activity, preserve terminal failure truth, and avoid failed→running resurrection. |
| `src/lib/lifecycle-background-observer.ts` | Own start-gate promotion, 2-minute no-evidence failure, completion/failure capture, and parent notifications. |
| `src/lib/result-capture.ts` | Extract assistant text/tool summaries/artifacts/commits for continuity-backed retrieval. |
| `src/lib/continuity.ts` | Persist result/failure lifecycle patches to disk. |
| `src/lib/continuity-normalizers.ts` | Read legacy continuity data safely while normalizing it into the new single-path child-truth model. |
| `src/lib/session-recovery.ts` | Surface unresolved background children and completed result previews from continuity on resume. |
| `src/hooks/create-core-hooks.ts` | Replay continuity-backed pending notifications/result summaries to the parent session. |
| `tests/tools/delegate-task.test.ts` | Tool-level contract tests for routing, fallback, and immediate async return metadata. |
| `tests/lib/execution-mode.test.ts` | Execution-mode truth tests for the single builtin-subsession delegate-task lane. |
| `tests/lib/lifecycle-background-observer.test.ts` | Evidence gate, dead-start timeout, completion, and result persistence tests. |
| `tests/lib/lifecycle-events.test.ts` | Tool-activity and terminal-state truthfulness tests. |
| `tests/lib/lifecycle-state.test.ts` | Status↔phase mapping regression coverage. |
| `tests/lib/result-capture.test.ts` | Result/artifact/commit extraction coverage for parent retrieval. |
| `tests/lib/session-recovery.test.ts` | Recovery-time visibility of unresolved/completed delegated children. |
| `tests/hooks/create-core-hooks.test.ts` | Parent replay/resume contract coverage for persisted delegate-task results. |

## Implementation Guardrails

- Keep scope to the approved recovery slice only.
- Do **not** redesign `task`; it must remain foreground/blocking.
- Do **not** delete tmux/process infrastructure globally; only make it unreachable from the `delegate-task` slice.
- Do **not** rely on raw `session.updated`, `busy`, `idle`, or similar transport signals as proof that the child actually started meaningful work.
- Persist the truth to disk first; notifications and parent retrieval must read from persisted continuity, not from transient in-memory assumptions.

### Task 1: Lock `delegate-task` to one async builtin-subsession path

**Files:**
- Modify: `src/tools/delegate-task.ts`
- Modify: `src/lib/execution-mode.ts`
- Modify: `src/lib/specialist-router.ts`
- Modify: `src/lib/lifecycle-dispatcher.ts`
- Test: `tests/tools/delegate-task.test.ts`
- Test: `tests/lib/execution-mode.test.ts`

- [ ] Add failing tests in `tests/tools/delegate-task.test.ts` proving that `delegate-task` async launches always return `execution.family === "built-in"` and `execution.submode === "builtin-subsession"`, even when tmux is available, and that invalid/alias agent requests (`build`, `plan`, `explore`, unknown strings) safely degrade to `general` with `fallbackUsed: true` plus warnings.
- [ ] Add/update failing tests in `tests/lib/execution-mode.test.ts` proving the delegate-task background lane does **not** pick `tmux-pane` or `builtin-process` anymore.
- [ ] Run: `npx vitest run tests/tools/delegate-task.test.ts tests/lib/execution-mode.test.ts`
- [ ] Update `src/tools/delegate-task.ts` so `async_dispatch: true` builds one explicit builtin-subsession execution contract instead of trusting generic background heuristics. The immediate JSON response must still return the child session handle, parent/root IDs, route metadata, lifecycle snapshot, and `session://` output link.
- [ ] Update `src/lib/execution-mode.ts` so delegate-task’s background rationale is truthful and singular: builtin OpenCode child session only. Do not leave code paths that can silently drift back to tmux/process for this tool.
- [ ] Update `src/lib/specialist-router.ts` so alias/invalid agent names route to `general`, preserve warning text, and keep the launch alive instead of throwing.
- [ ] Update `src/lib/lifecycle-dispatcher.ts` so async `delegate-task` launches call only the builtin-subsession runner. Leave tmux/process runners intact for other mechanisms, but unreachable from this delegate-task slice.
- [ ] Re-run: `npx vitest run tests/tools/delegate-task.test.ts tests/lib/execution-mode.test.ts`

### Task 2: Simplify persisted continuity to one child-truth model

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/task-status.ts`
- Modify: `src/lib/lifecycle-state.ts`
- Modify: `src/lib/lifecycle-patching.ts`
- Modify: `src/lib/runtime.ts`
- Modify: `src/lib/continuity.ts`
- Modify: `src/lib/continuity-normalizers.ts`
- Modify: `src/lib/lifecycle-dispatcher.ts`
- Test: `tests/lib/lifecycle-state.test.ts`
- Test: `tests/lib/lifecycle-events.test.ts`
- Test: `tests/lib/session-recovery.test.ts`

- [ ] Add failing tests proving newly created delegate-task children persist a truthful state progression of `queued`, `running`, `completed`, or `failed`, and that recovered parent state can tell whether a child is unresolved without inferring from stale transport status.
- [ ] Run: `npx vitest run tests/lib/lifecycle-state.test.ts tests/lib/lifecycle-events.test.ts tests/lib/session-recovery.test.ts`
- [ ] Update `src/lib/types.ts` and `src/lib/task-status.ts` so the continuity-backed delegate-task status model exposes terminal `failed` truth instead of conflating it with generic `error`, while preserving any non-slice statuses only where they are still needed outside this contract.
- [ ] Update `src/lib/lifecycle-state.ts` and `src/lib/lifecycle-patching.ts` so lifecycle phase, delegation-packet status, and continuity status stay aligned: `queued` before evidence, `running` after evidence, `completed` on persisted result, `failed` on explicit failure or dead-start timeout.
- [ ] Update `src/lib/runtime.ts` so raw status signals never prove `running` for delegate-task children by themselves; status-only transport can at most inform bookkeeping, not meaningful-work truth.
- [ ] Update `src/lib/lifecycle-dispatcher.ts` child record creation so the continuity entry is fully inspectable from the moment the child is created: parent/root IDs, route metadata, execution metadata, `lifecycle.launchedAt`, `lastObservedAt`, `lastToolActivityAt`, and failure/result slots.
- [ ] Update `src/lib/continuity-normalizers.ts` to read legacy persisted records (`pending`, `error`, older route metadata shapes) and normalize them into the single-path delegate-task truth model on load, so existing `session-continuity.json` files do not crash hydration.
- [ ] Re-run: `npx vitest run tests/lib/lifecycle-state.test.ts tests/lib/lifecycle-events.test.ts tests/lib/session-recovery.test.ts`

### Task 3: Enforce evidence-driven running and 2-minute idle failure

**Files:**
- Modify: `src/lib/lifecycle-background-observer.ts`
- Modify: `src/lib/lifecycle-events.ts`
- Modify: `src/lib/runtime.ts`
- Test: `tests/lib/lifecycle-background-observer.test.ts`
- Test: `tests/lib/lifecycle-events.test.ts`

- [ ] Add failing tests proving a child stays `queued` until real evidence appears, promotes to `running` exactly once, and transitions to `failed` after 120_000 ms if there is still no assistant evidence and no tool activity.
- [ ] Extend failing tests so a failed child cannot be resurrected to `running` by later `session.updated`/`session.status` noise.
- [ ] Run: `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/lifecycle-events.test.ts`
- [ ] Update `src/lib/lifecycle-background-observer.ts` so the start gate is based only on real assistant evidence and/or recorded tool activity. Session transport status (`busy`, `running`, `idle`) must never be enough by itself.
- [ ] Keep `DEAD_START_TIMEOUT_MS` at 120_000 and make the timeout path terminal: patch continuity to `failed`, persist the failure reason, release queue state, and notify the parent using the persisted record.
- [ ] Update `src/lib/lifecycle-events.ts` and `src/lib/runtime.ts` so `noteObservedActivity()` remains the authoritative source for `lastToolActivityAt`, while status events preserve terminal failure truth instead of overwriting it.
- [ ] Re-run: `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/lifecycle-events.test.ts`

### Task 4: Guarantee result persistence and parent retrieval from continuity

**Files:**
- Modify: `src/lib/result-capture.ts`
- Modify: `src/lib/lifecycle-background-observer.ts`
- Modify: `src/lib/notification-handler.ts`
- Modify: `src/lib/session-recovery.ts`
- Modify: `src/hooks/create-core-hooks.ts`
- Modify: `src/lib/continuity.ts`
- Test: `tests/lib/result-capture.test.ts`
- Test: `tests/lib/lifecycle-background-observer.test.ts`
- Test: `tests/lib/session-recovery.test.ts`
- Test: `tests/hooks/create-core-hooks.test.ts`

- [ ] Add failing tests proving completion persists `resultCapture` before parent notification, deleted/failed children attempt partial capture, and resumed parent sessions can read result preview/artifacts/commits directly from continuity.
- [ ] Run: `npx vitest run tests/lib/result-capture.test.ts tests/lib/lifecycle-background-observer.test.ts tests/lib/session-recovery.test.ts tests/hooks/create-core-hooks.test.ts`
- [ ] Update `src/lib/result-capture.ts` so assistant text, tool-call summary, artifact paths, and commit SHAs are consistently captured for delegate-task completion and partial-failure cases.
- [ ] Update `src/lib/lifecycle-background-observer.ts` so every terminal path writes `resultCapture` and `lastError` to continuity before it emits parent notification/replay events. This includes completion, deleted child, retry exhaustion, and dead-start timeout.
- [ ] Update `src/lib/notification-handler.ts` so notifications derive previews from `metadata.resultCapture`, not from live session scraping.
- [ ] Update `src/lib/session-recovery.ts` and `src/hooks/create-core-hooks.ts` so a resumed parent session can see unresolved delegate-task children and continuity-backed completed results without reopening the child session first. The parent contract should expose the `session://child-id` link plus any persisted result preview.
- [ ] Re-run: `npx vitest run tests/lib/result-capture.test.ts tests/lib/lifecycle-background-observer.test.ts tests/lib/session-recovery.test.ts tests/hooks/create-core-hooks.test.ts`

### Task 5: Regression suite and targeted live validation

**Files:**
- Verify only: `tests/tools/delegate-task.test.ts`
- Verify only: `tests/lib/execution-mode.test.ts`
- Verify only: `tests/lib/lifecycle-background-observer.test.ts`
- Verify only: `tests/lib/lifecycle-events.test.ts`
- Verify only: `tests/lib/lifecycle-state.test.ts`
- Verify only: `tests/lib/result-capture.test.ts`
- Verify only: `tests/lib/session-recovery.test.ts`
- Verify only: `tests/hooks/create-core-hooks.test.ts`

- [ ] Run the focused delegate-task regression suite: `npx vitest run tests/tools/delegate-task.test.ts tests/lib/execution-mode.test.ts tests/lib/lifecycle-background-observer.test.ts tests/lib/lifecycle-events.test.ts tests/lib/lifecycle-state.test.ts tests/lib/result-capture.test.ts tests/lib/session-recovery.test.ts tests/hooks/create-core-hooks.test.ts`
- [ ] Run broader guard coverage if the focused suite passes: `npx vitest run tests/lib/delegate-task.test.ts tests/integration/v3-e2e.test.ts`
- [ ] Run static verification: `npm run typecheck`
- [ ] Run build verification: `npm run build`
- [ ] Perform targeted live validation in a fresh harness session:
  1. Dispatch a real async `delegate-task` with a valid agent and confirm the tool returns immediately with `mode: "async"`, `session_id`, route metadata, lifecycle snapshot, and `output_link`.
  2. Inspect the continuity file (`.opencode/state/hivemind/session-continuity.json`, or the overridden path if `OPENCODE_HARNESS_CONTINUITY_FILE` is set) and verify the child record moves through `queued → running → completed` while preserving `lastObservedAt`, `lastToolActivityAt`, and `resultCapture`.
  3. Dispatch a second async `delegate-task` using an invalid agent name and confirm the child still launches, `effectiveAgent` is `general`, `fallbackUsed` is `true`, and the warning is persisted in continuity.
  4. Resume or reopen the parent session and confirm the parent can read the delegated result from continuity-backed notifications/recovery output without having to scrape live child messages first.
  5. Confirm the parent session still treats unresolved background delegate-task children as outstanding work and does not present the run as fully wrapped up while a child remains `queued` or `running`.

## Done Criteria

- `delegate-task` has exactly one background launch path: async builtin-subsession.
- Invalid or alias agent names no longer break launch; they degrade to `general` with persisted fallback metadata.
- Persisted continuity answers the child truth directly instead of forcing the parent to infer from raw status signals.
- No-evidence children fail after 2 minutes and do not remain falsely live.
- Completed and failed children persist continuity-backed `resultCapture` data that the parent session can replay/recover later.
- Foreground `task` remains separate and blocking.
