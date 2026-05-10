---
phase: CP-PTY-01-background-shell-control-plane-mvp
status: in_progress
created: 2026-05-08
updated: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred for E2E
depends_on:
  - BOOT-07-end-to-end-proof
  - CP-PTY-00-shell-pty-control-plane-spike
allowed_surfaces_when_authorized:
  - src/tools/run-background-command.ts
  - src/lib/command-delegation.ts
  - src/lib/delegation-manager.ts
  - src/lib/pty/**
  - src/lib/config-subscriber.ts
  - src/hooks/**
  - tests/**
  - .opencode/agents/**
---

# CP-PTY-01 Background Shell Control-Plane MVP

## Status

**READY** — BOOT-07 E2E proof complete, CP-PTY-00 spike complete. This phase hardens, wires, and verifies the existing background shell/PTY control-plane implementation.

## Intended Goal

Harden background shell/PTY command execution as a permission-gated, bounded-output, lifecycle-aware control-plane capability integrated with delegation status and recovery truth. This is NOT a greenfield implementation — the code exists. This phase closes wiring gaps, adds missing test coverage, and produces a formal verification artifact.

## Current State Assessment

### What Already Exists

| Component | File | Status |
|-----------|------|--------|
| `run-background-command` tool | `src/tools/run-background-command.ts` (221 LOC) | IMPLEMENTED — run/output/input/list/terminate actions, Zod validation, shell-string rejection, delegation ownership checks |
| PTY manager | `src/lib/pty/pty-manager.ts` (145 LOC) | IMPLEMENTED — spawn, read, write, terminate, listSessions, exit capture |
| PTY buffer | `src/lib/pty/pty-buffer.ts` (67 LOC) | IMPLEMENTED — bounded append, incremental readSince, truncation tracking |
| PTY runtime detection | `src/lib/pty/pty-runtime.ts` (21 LOC) | IMPLEMENTED — lazy bun-pty import, isSupported() check, null fallback |
| PTY types | `src/lib/pty/pty-types.ts` (110 LOC) | IMPLEMENTED — PtySpawnRequest, PtySessionRecord, PtyReadResult, PtySpawnResult |
| Command delegation handler | `src/lib/command-delegation.ts` (418 LOC) | IMPLEMENTED — PTY dispatch, headless fallback, exit polling, recovery, cleanup |
| Plugin wiring | `src/plugin.ts` line 131 | IMPLEMENTED — `createRunBackgroundCommandTool({ delegationManager, ptyManager })` |
| Config schema | `src/schema-kernel/hivemind-configs.schema.ts` line 189 | IMPLEMENTED — `background_delegation: z.boolean().default(false)` |

### What Is Missing (Gaps This Phase Closes)

| Gap | Impact | Task |
|-----|--------|------|
| No agent includes `run-background-command` in permissions | Tool is registered but unreachable by any agent | T01 |
| `background_delegation` config is a dead toggle — no runtime consumer | Config exists but doesn't gate tool availability | T02 |
| pty-runtime: only 1 test (null fallback), no happy-path test | Cannot verify PTY manager creation when supported | T03 |
| No abort signal propagation tests for run-background-command | Abort behavior unverified | T04 |
| No headless child process data/error/close event flow tests | Headless fallback lifecycle unverified | T05 |
| pty-manager: no write test, no listSessions test | Write and list operations unverified | T06 |
| pty-manager: no terminate-on-already-terminated/missing session test | Edge case behavior unverified | T07 |
| pty-buffer: no empty output test, no out-of-bounds offset test | Edge case behavior unverified | T08 |
| No formal verification artifact | No traceability from acceptance criteria to code+tests | T09 |

## High-Level Acceptance Criteria

1. **Permission-gated command start path** — `run-background-command` is listed in agent permission blocks for agents that need background command capability.
2. **Config consumer wired** — `background_delegation` config gates tool availability at runtime.
3. **Bounded output buffer/read API** — pty-buffer handles empty output, out-of-bounds offset, and truncation correctly (tested).
4. **Explicit PTY versus headless fallback semantics** — pty-runtime happy-path and null-fallback both tested.
5. **Lifecycle mapping to delegation/status records** — command-delegation handler maps PTY/headless lifecycle to delegation records (tested via existing tests + new headless flow tests).
6. **Cleanup on terminate, timeout, abort, and parent deletion** — terminate on missing session, abort signal propagation tested.
7. **Restart truth** — PTY/headless command sessions marked non-resumable after runtime restart (tested in command-delegation recovery path).
8. **Tests for start/read/write/list/terminate, permission denial, unsupported input, and cleanup** — comprehensive test coverage across all PTY and tool layers.

## Wave Plan

### Wave 1: Wire Agent Permissions + Config Consumer

No dependencies. Can execute in parallel.

#### CPPTY01-T01: Add `run-background-command` to agent tool permissions

**Description:** Add `run-background-command: allow` to the permission blocks of agents that need background command capability. Based on codebase analysis:

- **hm-l0-orchestrator** — front-facing orchestrator, already has `delegate-task: allow`, needs background command for long-running tasks
- **hm-l1-coordinator** — delegation coordinator, already has `delegate-task: allow`, needs background command for wave dispatch
- **hm-l2-conductor** — delegation routing specialist, already has `delegate-task: allow`, needs background command for command dispatch
- **hm-l2-executor** — implementation specialist, currently has `delegate-task: ask` but needs background command for build/test/compile tasks
- **hm-l2-debugger** — debug specialist, currently has `delegate-task: ask` but needs background command for running debug scripts

**Output files:**
- `.opencode/agents/hm-l0-orchestrator.md` — add `run-background-command: allow`
- `.opencode/agents/hm-l1-coordinator.md` — add `run-background-command: allow`
- `.opencode/agents/hm-l2-conductor.md` — add `run-background-command: allow`
- `.opencode/agents/hm-l2-executor.md` — add `run-background-command: allow`
- `.opencode/agents/hm-l2-debugger.md` — add `run-background-command: allow`

**Verification method:**
- `grep -r "run-background-command" .opencode/agents/` returns matches in all 5 files
- Each file's permission block includes `run-background-command: allow`

**Acceptance criteria mapping:** AC-1 (permission-gated command start path)

---

#### CPPTY01-T02: Wire `background_delegation` config as runtime consumer

**Description:** The `background_delegation` config toggle in `hivemind-configs.schema.ts` defaults to `false` but has no runtime consumer. Wire it into the `run-background-command` tool so that when `background_delegation` is `false`, the tool returns an actionable error for the `run` action (other actions like `output`, `input`, `list`, `terminate` should still work for existing sessions).

**Approach:**
1. Pass `hivemindConfig` to `createRunBackgroundCommandTool()` in `src/plugin.ts`
2. In `run-background-command.ts`, check `hivemindConfig.delegation_systems.background_delegation` before dispatching `run` action
3. Return actionable error: `"[Harness] Background delegation is disabled. Enable background_delegation in .hivemind/configs.json to use run-background-command."`
4. Add test for config-gated behavior

**Output files:**
- `src/tools/run-background-command.ts` — add config check for `run` action
- `src/plugin.ts` — pass `hivemindConfig` to tool factory
- `tests/tools/run-background-command.test.ts` — add config-gating tests

**Verification method:**
- `npm run typecheck` passes
- `npx vitest run tests/tools/run-background-command.test.ts` passes
- New test: "returns actionable error when background_delegation config is false"
- New test: "allows run when background_delegation config is true"

**Acceptance criteria mapping:** AC-2 (config consumer wired)

---

### Wave 2: Close Test Gaps

Depends on Wave 1 (T02 adds config parameter that affects test setup).

#### CPPTY01-T03: Add pty-runtime happy-path test

**Description:** The existing `pty-runtime.test.ts` only tests the null fallback (PTY unsupported). Add a test for the happy path where PTY IS supported — `createPtyManagerIfSupported()` should return a `PtyManager` instance.

**Approach:**
1. Mock `bun-pty` `spawn` as a function
2. Mock `PtyManager.prototype.isSupported` to return `true`
3. Assert `createPtyManagerIfSupported()` resolves to a non-null `PtyManager`

**Output files:**
- `tests/lib/pty/pty-runtime.test.ts` — add happy-path test

**Verification method:**
- `npx vitest run tests/lib/pty/pty-runtime.test.ts` passes (2 tests: null fallback + happy path)

**Acceptance criteria mapping:** AC-4 (explicit PTY versus headless fallback semantics)

---

#### CPPTY01-T04: Add abort signal propagation tests for run-background-command

**Description:** The `run-background-command` tool receives an `AbortSignal` via the tool context but doesn't currently propagate it to the delegation manager. Add tests that verify:
1. When the tool context has an aborted signal, the `run` action still dispatches (abort is best-effort, not blocking)
2. The abort signal is available in the context for future propagation

**Approach:**
1. Create a mock context with `abort: AbortController.signal` that is already aborted
2. Verify `run` action still dispatches (current behavior: abort doesn't block)
3. Document that abort propagation to delegation manager is a future enhancement (CP-PTY-03)

**Output files:**
- `tests/tools/run-background-command.test.ts` — add abort signal tests

**Verification method:**
- `npx vitest run tests/tools/run-background-command.test.ts` passes
- New test: "run action dispatches even when abort signal is already aborted"

**Acceptance criteria mapping:** AC-6 (cleanup on abort)

---

#### CPPTY01-T05: Add headless child process data/error/close event flow tests

**Description:** The `command-delegation.ts` handler has headless fallback logic that spawns `node:child_process` and listens for `data`, `error`, and `exit` events. These event flows are not directly tested. Add tests that verify:
1. Headless process stdout/stderr data is captured in the delegation result
2. Headless process error event finalizes the delegation with error status
3. Headless process exit event finalizes the delegation with exit code
4. Headless output truncation when exceeding `MAX_HEADLESS_OUTPUT_CHARS`

**Approach:**
1. Create a test file `tests/lib/command-delegation.test.ts`
2. Mock `node:child_process.spawn` to return a controllable `ChildProcessWithoutNullStreams`
3. Test data/error/exit event flows
4. Test output truncation boundary

**Output files:**
- `tests/lib/command-delegation.test.ts` — new test file for headless event flows

**Verification method:**
- `npx vitest run tests/lib/command-delegation.test.ts` passes
- Tests cover: data capture, error finalization, exit finalization, output truncation

**Acceptance criteria mapping:** AC-5 (lifecycle mapping to delegation/status records)

---

#### CPPTY01-T06: Add pty-manager write and listSessions tests

**Description:** The existing `pty-manager.test.ts` tests spawn, read, terminate, and exit capture. Missing: `write()` and `listSessions()` tests.

**Approach:**
1. Add test: `write()` calls `process.write()` with the input string
2. Add test: `listSessions()` returns all active sessions with correct metadata
3. Add test: `listSessions()` returns empty array when no sessions exist

**Output files:**
- `tests/lib/pty/pty-manager.test.ts` — add write and listSessions tests

**Verification method:**
- `npx vitest run tests/lib/pty/pty-manager.test.ts` passes (existing 5 + new 3 = 8 tests)

**Acceptance criteria mapping:** AC-8 (tests for write/list)

---

#### CPPTY01-T07: Add terminate on already-terminated/missing session tests

**Description:** The `PtyManager.terminate()` method silently returns when the session doesn't exist (line 106-109). Verify this behavior and test the edge case where a session is terminated twice.

**Approach:**
1. Add test: `terminate()` on a non-existent session ID does not throw
2. Add test: `terminate()` called twice on the same session — second call is a no-op
3. Add test: `read()` on a terminated session throws `[Harness] Unknown PTY session`

**Output files:**
- `tests/lib/pty/pty-manager.test.ts` — add terminate edge case tests

**Verification method:**
- `npx vitest run tests/lib/pty/pty-manager.test.ts` passes (existing + new = 11 tests)

**Acceptance criteria mapping:** AC-6 (cleanup on terminate)

---

#### CPPTY01-T08: Add empty output and out-of-bounds offset tests for pty-buffer

**Description:** The existing `pty-buffer.test.ts` tests incremental reads and truncation. Missing: empty output and out-of-bounds offset edge cases.

**Approach:**
1. Add test: `readSince()` on an empty buffer returns `{ content: "", nextOffset: 0, truncated: false }`
2. Add test: `readSince()` with offset beyond `nextOffset` returns empty content with correct `nextOffset`
3. Add test: `readSince()` with negative offset clamps to 0
4. Add test: `snapshot()` on empty buffer returns empty content

**Output files:**
- `tests/lib/pty/pty-buffer.test.ts` — add edge case tests

**Verification method:**
- `npx vitest run tests/lib/pty/pty-buffer.test.ts` passes (existing 2 + new 4 = 6 tests)

**Acceptance criteria mapping:** AC-3 (bounded output buffer/read API)

---

### Wave 3: Formal Verification Artifact

Depends on Wave 1 and Wave 2 (all implementation and tests must be complete).

#### CPPTY01-T09: Create VERIFICATION.md mapping all acceptance criteria to code+tests

**Description:** Create a formal verification artifact that maps each acceptance criterion to the specific code files, test files, and test names that prove it. This is the L2-L3 evidence artifact required by the phase.

**Structure:**
1. Acceptance criteria table with code/test mappings
2. Test execution evidence (command + output)
3. Typecheck evidence
4. Coverage summary for PTY-related files
5. Known limitations and future work

**Output files:**
- `.planning/phases/CP-PTY-01-background-shell-control-plane-mvp/VERIFICATION.md`

**Verification method:**
- File exists and contains all 8 acceptance criteria mapped to code+tests
- All referenced tests pass
- Typecheck passes

**Acceptance criteria mapping:** All AC-1 through AC-8

---

## Task Dependency Graph

```
Wave 1 (parallel):
  T01 (agent permissions) ─────────────────────┐
  T02 (config consumer) ───────────────────────┤
                                                │
Wave 2 (depends on T02 for config parameter):   │
  T03 (pty-runtime happy-path) ────────────────┤
  T04 (abort signal tests) ────────────────────┤
  T05 (headless event flow tests) ─────────────┤
  T06 (pty-manager write/list tests) ──────────┤
  T07 (terminate edge case tests) ─────────────┤
  T08 (pty-buffer edge case tests) ────────────┤
                                                │
Wave 3 (depends on all Wave 1+2):               │
  T09 (VERIFICATION.md) ◄──────────────────────┘
```

## Evidence Requirements

| Level | Description | This Phase |
|-------|-------------|------------|
| L1 | Live runtime proof (E2E with OpenCode) | Preferred but not required for MVP |
| L2 | Permission-gated command lifecycle tests | Required — T03-T08 provide this |
| L3 | Integration tests with mocked SDK | Required — T05 provides headless flow tests |
| L4 | Unit tests with mocked dependencies | Required — T03, T04, T06, T07, T08 provide this |
| L5 | Documentation only | Insufficient for this phase |

## Verification Commands

```bash
# Typecheck
npm run typecheck

# Run all PTY-related tests
npx vitest run tests/lib/pty/ tests/tools/run-background-command.test.ts tests/lib/command-delegation.test.ts

# Run specific test files
npx vitest run tests/lib/pty/pty-runtime.test.ts
npx vitest run tests/lib/pty/pty-manager.test.ts
npx vitest run tests/lib/pty/pty-buffer.test.ts
npx vitest run tests/tools/run-background-command.test.ts
npx vitest run tests/lib/command-delegation.test.ts

# Full test suite
npm test

# Verify agent permissions
grep -r "run-background-command" .opencode/agents/
```

## Known Limitations

1. **Abort signal propagation** — The tool receives an `AbortSignal` but does not currently propagate it to the delegation manager. This is documented as a future enhancement for CP-PTY-03.
2. **PTY requires Bun** — The `bun-pty` package only works in Bun runtime. On Node.js, the system falls back to headless `node:child_process`. This is by design, not a gap.
3. **No E2E test** — This phase focuses on L2-L3 evidence (permission-gated lifecycle tests). An L1 E2E test with live OpenCode runtime is preferred but not required for MVP.
4. **Config gating is opt-in** — The `background_delegation` config defaults to `false`. Agents must explicitly enable it in `.hivemind/configs.json` to use `run-background-command`.

## Future Work (Out of Scope)

- CP-PTY-02: SDK session delegation integration
- CP-PTY-03: Agent/subagent background task coordination (abort propagation, wave dispatch)
- CP-PTY-04: Cross-cutting shell integration (session/journal/hooks/permissions)
- SC-PTY-01: Read-only terminal projection (sidecar)
