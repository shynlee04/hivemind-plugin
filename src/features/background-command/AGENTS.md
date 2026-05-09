# Background Command Feature Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/background-command/` owns PTY and headless command execution support. The `pty/` subdirectory manages pseudo-terminal sessions with Bun-optional behavior (gracefully falls back to `node:child_process` when `bun-pty` is absent). This feature provides the execution substrate for `run-background-command.ts` tool. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Background-command may spawn and manage child processes and PTY sessions.
- Background-command may maintain in-memory session state for active processes.
- Background-command may emit process lifecycle events consumed by coordination modules.

## 3. Forbidden mutations / explicit no-go boundaries

- Background-command SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Background-command SHALL NOT assume Bun runtime is available; must handle graceful fallback.
- Background-command SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/run-background-command.ts` | Dispatches command execution | Tools own CQRS mutation; feature owns process lifecycle |
| `src/coordination/` | Receives process lifecycle events | Owns orchestration; feature owns execution |
| Tests | Validate PTY and headless execution paths | Must test both Bun-present and Bun-absent paths |

## 5. Naming and placement conventions

- PTY modules live in `src/features/background-command/pty/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tests mirror under `tests/features/background-command/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Must verify Bun-optional fallback behavior.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
