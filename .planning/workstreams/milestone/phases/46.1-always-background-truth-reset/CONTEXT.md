---
phase: 46.1-always-background-truth-reset
priority: P1
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 3
amends: 46
depends_on: [46-delegation-dispatch-completion-recovery-truth]
blocks: [16-background-delegation-revamp-pty-integration-rebuild-backgro, 52-end-user-harness-workflow-acceptance]
gsd_agents: [gsd-executor, gsd-code-reviewer, gsd-verifier]
requirements: [REM-HIGH-05, REM-HIGH-06, REM-HIGH-07]
---

# Phase 46.1: Always-Background Truth Reset

## Goal

Make `run_in_background: true` always mean async dispatch. Remove the `builtinAsyncBackgroundChildSessions` policy gate that silently downgrades to blocking dispatch. Update the tool description to match reality. Document or wire a fallback for the disabled native `task` tool.

## Validation Source

Generated from `AUDIT-VALIDATION-2026-04-30.md` Finding 3 (VALIDATED). Evidence on disk:

- `src/lib/delegation-manager.ts:61` defaults the policy flag to `true` (so most installs are unaffected).
- `src/lib/delegation-manager.ts:208–211` explicitly conditions the dispatch on the flag — if a workspace policy resolves it to `false`, `sendPrompt` is used instead of `sendPromptAsync` with no warning.
- `src/tools/delegate-task.ts:35` advertises "Always-background WaiterModel" — false advertising under the current implementation.
- `delegation-manager.ts:90–95` sets `task: false`, `delegate-task: false` for delegated sessions, removing OpenCode's native `task` tool with no fallback path.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| REM-HIGH-05 | When `run_in_background: true`, `delegation-manager` MUST call `sendPromptAsync`. If the runtime cannot support async, throw `[Harness] Async background execution not supported by current runtime. Use run_in_background: false for synchronous execution.` Do NOT silently downgrade. | 46-AUDIT-AMENDMENT-2026-04-30.md §REM-HIGH-05 |
| REM-HIGH-06 | Document the disabled native `task` tool and its failure mode in AGENTS.md, OR wire an opt-in `fallback-to-native-task` parameter. Pick one. | 46-AUDIT-AMENDMENT-2026-04-30.md §REM-HIGH-06 |
| REM-HIGH-07 | Update `delegate-task` tool description so the wording matches actual behavior: either truly always-background (post-REM-HIGH-05) or qualified accurately. | 46-AUDIT-AMENDMENT-2026-04-30.md §REM-HIGH-07 |

## Scope

- `src/lib/delegation-manager.ts:208–211` (gate removal)
- `src/lib/delegation-manager.ts:61` (policy flag may stay as informational, but remove from dispatch path)
- `src/tools/delegate-task.ts:35, 46–52` (description)
- `AGENTS.md` (documentation for REM-HIGH-06 Option B)
- `tests/lib/delegation-manager.test.ts`
- `tests/tools/delegate-task.test.ts`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| REM-HIGH-05 | gsd-executor | hm-test-driven-execution |
| REM-HIGH-06 | gsd-doc-writer | gsd-docs-update |
| REM-HIGH-07 | gsd-executor | hm-refactor |
| All | gsd-code-reviewer | hm-code-review |

## Key Files

- `src/lib/delegation-manager.ts` (~656 LOC; 3,193 LOC test coverage)
- `src/tools/delegate-task.ts`
- `AGENTS.md`

## Tech Compliance

- TypeScript strict mode
- `[Harness]` prefix on all thrown errors
- No new policy flags
- RED-first TDD

## Constraints

- Backward compatibility: callers passing `run_in_background: false` MUST continue to call `sendPrompt` (unchanged).
- The error message for missing async runtime MUST be a `[Harness]`-prefixed `Error`, surfaced as a tool-call error, not a silent log.
- Delegate-task tool description changes are user-visible — coordinate with the tool catalog.
