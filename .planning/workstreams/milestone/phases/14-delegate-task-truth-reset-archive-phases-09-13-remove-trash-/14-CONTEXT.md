# Phase 14: delegate-task truth-reset — Context

**Gathered:** 2026-04-18 (rewritten — original 2026-04-16)
**Status:** Ready for replanning

<domain>
## Phase Boundary

Phase 14 had two halves: **cleanup** and **delegate-task rebuild**. The cleanup half is DONE (plans 14-01, 14-02, 14-03 executed successfully). The rebuild half's original architecture (sync/async modes with fixed 15-min timeouts) was fundamentally wrong and must be redesigned.

This is now a **rebuild-with-corrected-design** phase. The Phase 02 verified baseline is restored. Cleanup is complete. Delegate-task needs to be rebuilt with the WaiterModel execution pattern, dual-signal completion, and hybrid persistence.

**Completed (plans 14-01, 14-02, 14-03):**
1. ✅ Deleted all trash diagnostic/report/debug artifacts
2. ✅ Archived stale phase directories (09, 09.1, 09.2, 09.3, 12, 13) to .archive/
3. ✅ Deleted ALL source code and tests produced by phases 09-13
4. ✅ Codebase restored to Phase 02 baseline (351 tests passing, typecheck clean)
5. ✅ Initial delegate-task code exists (delegation-manager.ts, delegate-task.ts) but was built with wrong architecture

**Now in scope (replanning):**
1. Rebuild delegate-task with WaiterModel execution (always-background, foreground-continues, wait-when-needed)
2. Implement dual-signal completion detection (session.idle + message count stability, NO fixed timeouts)
3. Implement hybrid persistence (oh-my-openagent dual-signal + background-agents disk model)
4. Build dedicated poll/status tool for checking delegation state
5. Write tests aligned with real runtime behavior and the new execution model

**Out of scope:**
- Phase 11 (clean architecture restructuring)
- Phase 03 (schema definition)
- Phase 04 (migration gate)
- PTY execution model
- Replacing OpenCode's builtin `task` tool
- Config system / governance / injection engine (already deleted)

</domain>

<decisions>
## Implementation Decisions

### Cleanup — EXECUTED (plans 14-01, 14-02, 14-03)

- **D-01:** [DONE] NUKE all trash — deleted `.planning/debug/` directory, all diagnostic reports, stale session dump files.
- **D-05:** [DONE] DELETE ALL CODE from phases 09-13. Codebase returned to Phase 02 verified baseline.
- **D-06:** [DONE] After deletion, codebase back to Phase 02 state — plugin.ts, core lib modules, working tools and hooks.
- **D-07:** [DONE] DELETE ALL TESTS from phases 09-13. 351 tests now passing (runtime-truthful).
- **D-09:** [DONE] Moved phase dirs (09, 09.1, 09.2, 09.3, 12, 13) to `.archive/phases/`.

### Delegation Architecture — CORRECTED (Session 2 redesign)

- **D-02:** delegate-task must work with ALWAYS-BACKGROUND execution model (WaiterModel). Tasks ALWAYS run in background. The foreground orchestrator continues working on other tasks and only waits when it needs a specific background task's result. NOT fire-and-forget, NOT blocking sync. The pattern is: dispatch → continue foreground → check/wait when result needed.

- **D-03:** Multiple concurrent delegate-task calls run as separate OpenCode sessions, each tracked independently with unique task IDs. The execution model is: dispatch → continue foreground → check/wait when result needed. This is NOT "sync mode blocks until done" — it's "background dispatch, foreground proceeds, wait on demand."

- **D-04:** Hybrid architecture — oh-my-openagent's dual-signal completion detection (session.idle + message count stability, NO fixed timeouts) combined with opencode-background-agents' disk persistence model. Tasks run until real completion is confirmed, not until an arbitrary timer fires.

- **D-13:** No fixed timeouts — delegations run until completion is confirmed by dual-signal. Fixed timeouts (like the previous 15-min) are explicitly rejected. If the planner recommends a configurable safety limit, it must be a MAXIMUM ceiling, not a deadline.

- **D-14:** A dedicated poll/status tool (separate from delegate-task) for checking delegation status and retrieving results. delegate-task dispatches; a separate tool checks/retrieves.

### Task Tool & SDK — DEFERRED TO PLANNER

- **D-11:** delegate-task's relationship to OpenCode's builtin `task` tool is deferred to the planner. The planner must study the SDK's `parentID` semantics and recommend the right approach (coexistence, wrapping, or replacement).

- **D-12:** Dual-signal completion (session.idle + stability check) is LOCKED as the completion detection mechanism. Safety limits, zombie handling, abort mechanisms, and child session cleanup are at planner's discretion.

### Test Standards — CARRIED FORWARD

- **D-08:** Tests must be runtime-truthful: they test real behavior patterns, not mock implementations. If a behavior can't be tested without heavy mocking, document why and defer to live verification.

### AGENTS.md Update — CARRIED FORWARD

- **D-10:** Remove the "delegate-task is broken" line from AGENTS.md once the tool works. Update AGENTS.md to reflect the corrected architecture.

### Agent's Discretion

- SDK `parentID` semantics and how delegate-task relates to builtin `task` tool (planner researches)
- Safety limits, zombie session handling, abort mechanisms, child session cleanup behavior (planner decides)
- Test file organization and naming conventions
- Exact implementation of dual-signal stability check (planner designs)
- Poll/status tool API shape and naming

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Verified Baseline (Trusted)
- `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — 18/18 verified truths, the foundation
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — Phase 02 decisions (locked)
- `.planning/codebase/STRUCTURE.md` — Directory layout
- `.planning/codebase/CONCERNS.md` — Known issues from Phase 01 scan (still valid)

### Cleanup Execution (Historical — Completed)
- `14-01-SUMMARY.md` — Plan 14-01 execution summary (trash removal + archival)
- `14-02-SUMMARY.md` — Plan 14-02 execution summary (code/test deletion)
- `14-03-SUMMARY.md` — Plan 14-03 execution summary (initial rebuild — architecture now superseded)

### Architecture References (For Research)
- `.opencode/skills/oh-my-openagent-reference/SKILL.md` — Packed oh-my-openagent source (BackgroundManager, dual-signal completion)
- `src/lib/completion-detector.ts` — Existing two-signal completion detection (already in baseline)
- `src/lib/delegation-manager.ts` — Current delegation manager (exists, needs redesign)
- `src/tools/delegate-task.ts` — Current tool wrapper (exists, needs redesign)

### Project Context
- `.planning/STATE.md` — Current state
- `.planning/PROJECT.md` — Project constraints and evidence standards

</canonical_refs>

<code_context>
## Existing Code Insights

### Phase 02 Baseline (ACTIVE — Verified, 351 tests passing)
- `src/plugin.ts` — Composition root
- `src/lib/types.ts` — Shared types (leaf module)
- `src/lib/helpers.ts` — Pure utilities
- `src/lib/state.ts` — In-memory Maps
- `src/lib/concurrency.ts` — Keyed semaphore (FIFO)
- `src/lib/continuity.ts` — Durable JSON persistence (~635 LOC)
- `src/lib/session-api.ts` — SDK wrappers
- `src/lib/runtime.ts` — Event→status mapping
- `src/lib/completion-detector.ts` — Two-signal completion detection (KEY — reuse for delegation)
- `src/lib/notification-handler.ts` — Async completion notification
- `src/lib/lifecycle-manager.ts` — Session lifecycle (~734 LOC)

### Delegate-Task Code (EXISTS but needs redesign)
- `src/lib/delegation-manager.ts` — Current delegation manager. Built during plans 14-01/02/03. Has sync/async modes with fixed timeouts that must be REPLACED with WaiterModel + dual-signal.
- `src/tools/delegate-task.ts` — Current tool wrapper. Must be redesigned for always-background dispatch + dedicated status polling.

### What's Wrong With Current Code
The existing delegation-manager.ts and delegate-task.ts (from executed plans 14-01/02/03) have:
1. **Sync/async mode split** — wrong. Should be always-background (WaiterModel).
2. **Fixed 15-min timeout** — wrong. Should be dual-signal completion with no fixed deadlines.
3. **No dedicated status tool** — wrong. Need a separate poll/status tool.
4. **No hybrid persistence** — wrong. Need oh-my-openagent dual-signal + disk persistence combo.

### Current Test State
- 351 tests passing, typecheck clean
- Tests are runtime-truthful (post-cleanup rewrite)

</code_context>

<specifics>
## Specific Ideas

- **WaiterModel** — always background, foreground continues, wait only when needed. The orchestrator dispatches a task, goes back to its own work, and only blocks when it needs that specific task's result.
- **Dual-signal completion** — no fixed timeouts. Use session.idle + message count stability to detect real completion. This is what oh-my-openagent proved works.
- **Hybrid architecture** — learn from oh-my-openagent (dual-signal completion detection) AND opencode-background-agents (disk persistence for durability across restarts).
- **Dedicated status tool** — delegate-task dispatches; a separate tool polls status and retrieves results. Clean separation of concerns.
- The user explicitly banned autonomous live testing unless manually authorized. All code changes must be verifiable via unit tests and typecheck; live smoke tests only when the user runs them.
- The old plans (14-01, 14-02, 14-03) built working code on wrong architecture. The code exists but the design must be corrected, not thrown away.

</specifics>

<deferred>
## Deferred Items

- SDK `parentID` semantics and delegate-task's relationship to builtin `task` tool — planner must research
- Safety limits (max runtime ceiling), zombie session handling, abort mechanisms — planner decides
- Child session cleanup behavior on parent exit — planner decides
- Poll/status tool API shape — planner designs

</deferred>

---

*Phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-*
*Context gathered: 2026-04-16 | Rewritten: 2026-04-18*
*Status: Ready for replanning*
