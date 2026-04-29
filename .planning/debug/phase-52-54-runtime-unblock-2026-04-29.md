---
slug: phase-52-54-runtime-unblock
status: investigating
trigger: Phase 52/53/54 runtime unblock — PTY output gap, journal/lineage gap, recovery proof gap, guidance workflow blocked, Phase 53 NO-SHIP, Phase 54 BLOCKED handoff
created: 2026-04-29
updated: 2026-04-29T00:35:00Z
goal: find_and_fix
tdd_mode: true
---

# Debug Session: phase-52-54-runtime-unblock

## Current Focus

- hypothesis: PTY empty output is caused by a startup race where very early child output can arrive before `PtyManager.spawn()` subscribes to `process.onData`; delayed output works, immediate output can be lost.
- test: Verify RED test for early PTY output loss, move data subscription before metadata access, then verify GREEN focused tests and supporting gates.
- expecting: Unit regression should fail before source change and pass after subscribing to output before reading PTY metadata such as `pid`.
- next_action: Run typecheck/build/focused tests, then continue journal lineage investigation because live export still returns zero records for the current runtime session.

## Symptoms / Blockers

1. E52-02 PTY output gap: `run-background-command` run/list/terminate succeeded, but `output` returned empty content.
2. E52-03 journal/lineage gap: `session-journal-export` live run returned zero sessions/delegations/no lineage for the acceptance run.
3. E52-05 recovery proof gap: no safe operator-approved non-destructive interruption method existed.
4. E52-06 guidance workflow blocked.
5. Phase 53 final verdict currently NO-SHIP; Phase 54 currently BLOCKED handoff.

## Expected Behavior

Phase 52 should produce truthful L1/L2 acceptance evidence for PTY output, journal/lineage export, recovery proof, and guidance workflow. Phase 53 should then produce a release verdict based on fixed evidence. Phase 54 should be unblocked only if Phase 53 allows runway planning.

## Constraints

- Atomic scoped commits required for every meaningful mutation.
- Never use `git add .`; scope every commit to files changed for this workstream.
- Preserve unrelated parallel-team work.
- Do not modify Phase 49 artifacts.
- Treat `accessible-view-terminal` only as contextual terminal/evidence-capture hint unless grounded to a concrete repo/runtime artifact.
- RED-first for code changes. Add/update failing tests before implementation. If a blocker cannot be automated, record manual/runtime evidence honestly.
- Do not claim PASS/release readiness until L1/L2 evidence supports it.

## Key Source/Test Targets

- `src/tools/run-background-command*`
- `src/tools/session-journal-export*`
- `src/lib/delegation-manager.ts`
- `src/lib/delegation-persistence.ts`
- `src/lib/continuity.ts`
- `src/lib/runtime.ts`
- tests for those modules
- Phase 52/53/54 artifacts under `.planning/workstreams/milestone/phases/`

## Evidence

- timestamp: 2026-04-29T00:00:00Z
  type: session-seed
  summary: Debug file created from delegated session seed because requested debug file was absent.
- timestamp: 2026-04-29T00:10:00Z
  checked: Target source/tests and Phase 52/53/54 blocker artifacts.
  found: `run-background-command` output directly proxies `ptyManager.read`; `PtyManager.terminate` disposes subscriptions and deletes the session before final read; Phase 52 transcript shows output polls and persisted PTY result were empty. `session-journal-export` filters continuity and persisted delegations by exact `sessionId`; Phase 52 transcript says the live export supplied parent session returned zero sessions/delegations.
  implication: PTY gap may be output lifecycle/retention, while journal gap may be overly strict export filtering or missing continuity fallback. Need RED tests before source mutation.
- timestamp: 2026-04-29T00:20:00Z
  checked: Focused baseline tests before source mutation.
  found: `npx vitest run tests/lib/pty/pty-manager.test.ts tests/tools/run-background-command.test.ts tests/tools/session-journal-export.test.ts` passed: 3 files, 23 tests.
  implication: Existing tests do not reproduce the Phase 52 blockers; RED tests are required before any implementation changes.
- timestamp: 2026-04-29T00:25:00Z
  checked: Live runtime PTY probes.
  found: Immediate command `printf 'debug-pty-ok\n'; sleep 2` returned empty content both during running and after completion (`summaryPreview: ""`). Delayed command `sleep 1; printf 'delayed-pty-ok\n'; sleep 2` returned `delayed-pty-ok\r\n` and completed with matching summary preview.
  implication: PTY output pipeline works after listener setup; output emitted immediately at process startup can be lost.
- timestamp: 2026-04-29T00:30:00Z
  type: red-green
  red: `npx vitest run tests/lib/pty/pty-manager.test.ts -t "captures PTY output emitted before session metadata is returned"` failed because `manager.read(...).content` was empty instead of `early-output\r\n`.
  fix: `src/lib/pty/pty-manager.ts` now creates the PTY buffer before spawn and subscribes to `process.onData` immediately after spawn, before reading session metadata such as `pid`.
  green: The same focused RED test passed after the fix; `npx vitest run tests/lib/pty/pty-manager.test.ts tests/tools/run-background-command.test.ts` passed 2 files, 18 tests.
  commits: `207dbd9a` RED test, `e8104bbd` source fix.
- timestamp: 2026-04-29T00:35:00Z
  checked: Live `session-journal-export` probe for current parent session `ses_226714ad6ffepwIkRr1lYKgA0o` with `pipelineKeyLabel: phase-52-54-debug`.
  found: Tool returned success but `journalSummary.sessions: 0`, `journalSummary.delegations: 0`, and empty `lineage`.
  implication: Journal/lineage blocker remains open after PTY fix and needs separate RED-first investigation.

## Investigation Log

- 2026-04-29: Session initialized. Awaiting debugger investigation.
- 2026-04-29: Confirmed PTY immediate-output race with live contrasting probes and RED/GREEN unit coverage. Journal lineage export remains unresolved.

## Specialist Review

- PTY E52-02 root cause found: `PtyManager.spawn()` attached `onData` after constructing session metadata, so output emitted during immediate startup/metadata access could be missed. Delayed output proved the PTY buffer/read path itself works.
- Journal E52-03 root cause not yet confirmed: live export still returns zero records for the current runtime session.

## Resolution

- root_cause: PTY immediate-output startup race confirmed; journal/recovery blockers still under investigation.
- fix: PTY listener ordering fixed in `src/lib/pty/pty-manager.ts`.
- verification: RED/GREEN focused PTY tests passed; broader gates pending.
