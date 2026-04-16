# Phase 14: delegate-task truth-reset — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Aggressively clean up the delegate-task regression corridor (phases 09-13), remove all trash artifacts, delete broken code from the failed phases, and rebuild delegate-task so it actually works — both sync dispatch with result return AND async durability.

This is a **hard reset + rebuild** phase. The Phase 02 verified baseline is the foundation. Everything from 09-13 gets deleted and rebuilt from scratch.

**In scope:**
1. Delete all trash diagnostic/report/debug artifacts
2. Archive stale phase directories (09, 09.1, 09.2, 09.3, 12, 13) to .archive/
3. Delete ALL source code and tests produced by phases 09-13
4. Rebuild delegate-task to work correctly (sync + async)
5. Write fresh tests aligned with real runtime behavior

**Out of scope:**
- Phase 11 (clean architecture restructuring)
- Phase 03 (schema definition)
- Phase 04 (migration gate)
- Config system / governance / injection engine (those were 09-13 products, deleted)

</domain>

<decisions>
## Implementation Decisions

### Trash Removal
- **D-01:** NUKE all trash — delete `.planning/debug/` directory entirely, delete all diagnostic reports (`delegation-mechanism-diagnostic-report-2026-04-16.md`, `delegation-study-report-2026-04-15.md`, `DELEGATION-AUDIT-REPORT-2026-04-15.md`), delete stale session dump files (`session-ses_*.md` at project root). They served forensic purpose; truth is now in STATE.md and Phase 12 reconciliation note.

### delegate-task Tool Fate
- **D-02:** delegate-task MUST WORK — not be deleted, not be stubbed, not be disabled. The AGENTS.md line banning it gets removed once it works.
- **D-03:** Target behavior: full sync dispatch with result return AND async durability. Sync mode must successfully dispatch child session, detect completion, return result. Async mode must survive parent process exit and deliver results on recovery.
- **D-04:** Async durability architecture is NOT pre-decided — the researcher/planner must study the options (in-process background vs out-of-process tmux/pty vs other) and recommend based on what's achievable with the current OpenCode SDK. Reference oh-my-openagent, opencode-background-agents, opencode-pty patterns.

### Regression Code Triage
- **D-05:** DELETE ALL CODE from phases 09-13. Start from the Phase 02 verified baseline. This means removing any module that was created or substantially modified during phases 09, 09.1, 09.2, 09.3, 12, 13. The Phase 02 baseline was verified 18/18 truths and is the trusted foundation.
- **D-06:** After deletion, the codebase should be back to approximately the Phase 02 state: plugin.ts, core lib modules (types, helpers, state, concurrency, continuity, session-api, runtime, completion-detector, notification-handler, lifecycle-manager, agent-registry), plus the working tools (prompt-skim, prompt-analyze, session-patch) and hooks.

### Test Suite Reset
- **D-07:** DELETE ALL TESTS from phases 09-13. Write fresh tests from scratch based on what actually works after code deletion. Do not salvage mock-heavy tests that tested phantom behavior.
- **D-08:** New tests must be runtime-truthful: they test real behavior patterns, not mock implementations. If a behavior can't be tested without heavy mocking, document why and defer to live verification.

### Phase Artifact Archival
- **D-09:** Move phase directories (09, 09.1, 09.2, 09.3, 12, 13) to `.archive/phases/` — do NOT delete them. They contain forensic history that may be useful. But they must NOT be in `.planning/phases/` where they confuse agents about what's active.

### AGENTS.md Update
- **D-10:** Remove the "delegate-task is broken" line from AGENTS.md once the tool works. Update AGENTS.md to reflect the post-cleanup codebase structure.

### agent's Discretion
- Exact async durability implementation approach (researcher decides)
- Test file organization and naming conventions
- Whether to keep or remove the `src/lib/tasking/` directory structure (if it was from 09-13)
- How to handle `runtime-policy.ts` (created during recent adapter work — evaluate if it belongs in Phase 02 baseline)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Verified Baseline (Trusted)
- `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — 18/18 verified truths, the foundation to return to
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — Phase 02 decisions (locked)
- `.planning/codebase/STRUCTURE.md` — Pre-regression directory layout
- `.planning/codebase/CONCERNS.md` — Known issues from Phase 01 scan (still valid)

### Reconciliation (Reference Only)
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-reconciliation-note-2026-04-14.md` — Authoritative bridge between forensic findings and future planning
- `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-REVIEW.md` — Phase 12 review (caveated)

### Reference Implementations (For Research)
- `.opencode/skills/oh-my-openagent-reference/SKILL.md` — Packed oh-my-openagent source (BackgroundManager, dual-signal completion)
- `.planning/STATE.md` — Current state with forensic reset context
- `.planning/PROJECT.md` — Project constraints and evidence standards

### Diagnostic (TO BE DELETED — do not use for planning)
- `.planning/delegation-mechanism-diagnostic-report-2026-04-16.md` — TRASH, deleting in this phase
- `.planning/DELEGATION-AUDIT-REPORT-2026-04-15.md` — TRASH, deleting in this phase
- `.planning/delegation-study-report-2026-04-15.md` — TRASH, deleting in this phase
- `.planning/debug/` — ALL TRASH, deleting in this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 02 Baseline (KEEP — Verified)
- `src/plugin.ts` — Composition root (needs trimming back to Phase 02 state)
- `src/lib/types.ts` — Shared types (leaf module)
- `src/lib/helpers.ts` — Pure utilities (recently fixed: SDK error unwrapping for both `errors[]` and `error[]`)
- `src/lib/state.ts` — In-memory Maps
- `src/lib/concurrency.ts` — Keyed semaphore (FIFO)
- `src/lib/continuity.ts` — Durable JSON persistence (~635 LOC, violates 500 limit)
- `src/lib/session-api.ts` — SDK wrappers (recently fixed: session.status() surfacing, parseAs removal)
- `src/lib/runtime.ts` — Event→status mapping
- `src/lib/completion-detector.ts` — Two-signal completion detection
- `src/lib/notification-handler.ts` — Async completion notification
- `src/lib/lifecycle-manager.ts` — Session lifecycle (~734 LOC, violates 500 limit)

### 09-13 Regression Code (DELETE)
- `src/lib/governance-engine.ts` — Dead/broken
- `src/lib/injection-engine.ts` — Dead/broken
- `src/lib/delegation-packet.ts` — Dead/broken
- `src/lib/delegation-export.ts` — Dead/broken
- `src/lib/lifecycle-tmux-runner.ts` — Dead/broken
- `src/lib/lifecycle-patching.ts` — Dead/broken
- `src/lib/lifecycle-queue.ts` — Dead/broken
- `src/lib/lifecycle-runner-shared.ts` — Dead/broken
- `src/lib/lifecycle-dispatcher.ts` — Dead/broken
- `src/lib/lifecycle-process-runner.ts` — Dead/broken
- `src/lib/lifecycle-state.ts` — Dead/broken
- `src/lib/lifecycle-events.ts` — Dead/broken
- `src/lib/compaction-checkpoint.ts` — Dead/broken
- `src/lib/background-manager.ts` — Dead/broken
- `src/lib/categories.ts` — Dead/broken
- `src/lib/execution-mode.ts` — Dead/broken
- `src/lib/pending-notifications.ts` — Dead/broken
- `src/lib/session-recovery.ts` — Dead/broken
- `src/lib/specialist-router.ts` — Dead/broken
- `src/lib/result-capture.ts` — Recent adapter work, evaluate
- `src/lib/runtime-policy.ts` — Recent adapter work, evaluate
- `src/lib/continuity-clone.ts` — Recent adapter work, evaluate
- `src/lib/continuity-normalizers.ts` — Recent adapter work, evaluate
- `src/lib/lifecycle-background-observer.ts` — Recent adapter work, evaluate
- `src/lib/tasking/` — Entire directory from 09-13, evaluate contents

### Recent Adapter Work (EVALUATE)
These files were modified during the real-SDK adapter cycles but sit on top of 09-13 foundations. They may contain useful fixes mixed with broken dependencies:
- `src/lib/result-capture.ts` — SDK tool-part shape fix
- `src/lib/runtime-policy.ts` — Trusted runtime policy guard
- `src/lib/continuity-clone.ts` — Clone with new tool-call fields
- `src/lib/continuity-normalizers.ts` — Normalizers for new fields
- `src/lib/lifecycle-background-observer.ts` — Start evidence truth fix

</code_context>

<specifics>
## Specific Ideas

- "Make it FUCKING WORK" — the user's core demand. No more mock-verified claims, no more phantom behavior. The tool must actually dispatch sessions, detect completion, and return results.
- The user explicitly banned autonomous live testing unless manually authorized. All code changes must be verifiable via unit tests and typecheck; live smoke tests only when the user runs them.
- The diagnostic report the user flagged (`.planning/delegation-mechanism-diagnostic-report-2026-04-16.md`) is specifically called out as "the reason why everything failed" — it poisoned agent context with incorrect analysis.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash*
*Context gathered: 2026-04-16*
