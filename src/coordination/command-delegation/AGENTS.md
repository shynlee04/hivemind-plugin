# Command Delegation Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/command-delegation/` owns the CommandDelegationHandler (`handler.ts`, ~418 LOC) — the command-based child session execution path. It dispatches commands through PTY sessions (via `PtyManager`) or headless `node:child_process` processes, polls for output/exit, enforces output truncation (`MAX_HEADLESS_OUTPUT_CHARS`), and reports terminal states (completed/error/timeout) with `DelegationTerminalKind` metadata. Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:153-158`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- CommandDelegationHandler may spawn child processes via `node:child_process` (headless fallback when Bun is absent). Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- May delegate PTY commands through `PtyManager` with Bun-optional graceful fallback. Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- May poll for process output, detect exit codes, and signal terminal states with `terminalKind` and `terminationSignal` metadata.

## 3. Forbidden mutations / explicit no-go boundaries

- Command delegation SHALL NOT persist delegation state; that belongs to `delegation-persistence.ts`.
- Command delegation SHALL NOT assume Bun runtime is available; `bun-pty` is optional and falls back to headless mode.
- Command delegation SHALL NOT register tools or observe lifecycle events directly.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/manager.ts` | Dispatches command-mode delegations through CommandDelegationHandler | DelegationManager owns dispatch routing |
| `src/features/background-command/pty/pty-manager.ts` | Provides PTY session execution | PtyManager owns process lifecycle |
| `src/task-management/continuity/` | Receives terminal delegation records for persistence | Continuity owns durable state |
| Tests | Validate headless fallback, PTY execution, output truncation | Must test both Bun-present and Bun-absent paths |

## 5. Naming and placement conventions

- `handler.ts` — CommandDelegationHandler class with PTY/headless dispatch, polling, and terminal signaling.
- Internal type `HeadlessCommandState` tracks process + output + truncation. Callback interface `CommandDelegationCallbacks`.
- Tests mirror under `tests/lib/coordination/command-delegation/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/command-delegation/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Must verify both PTY and headless execution paths and graceful fallback behavior.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
