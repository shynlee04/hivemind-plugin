# Phase 16 Pattern Map

**Phase:** 16 - Background Delegation Revamp + PTY Integration
**Generated:** 2026-04-21

## File Mapping

| Target file | Closest analog | Pattern to reuse |
|-------------|----------------|------------------|
| `src/lib/pty/pty-manager.ts` | `src/lib/delegation-manager.ts` | Session registry maps, cleanup on terminal state, `[Harness]`-prefixed errors, explicit state transitions |
| `src/lib/pty/pty-buffer.ts` | `src/shared/tool-response.ts` + `src/lib/helpers.ts` | Small focused pure helper with deterministic output and bounded memory handling |
| `src/lib/pty/pty-types.ts` | `src/lib/types.ts` | Centralized exported contracts with narrow string unions and explicit metadata fields |
| `src/lib/spawner/session-creator.ts` | `src/lib/session-api.ts` | Typed SDK wrapper functions, `assertValidSessionID`-style guards, `unwrapData()` before returning |
| `src/lib/spawner/concurrency-key.ts` | `src/lib/concurrency.ts` | Dedicated key builder rather than embedding key logic in orchestration code |
| `src/lib/spawner/parent-directory.ts` | `src/tools/delegate-task.ts` context extraction | Prefer deterministic precedence order over dynamic discovery at call sites |
| `src/lib/spawner/pty-setup.ts` | `src/plugin.ts` composition root style | Thin orchestration wrapper that wires lower-level modules and records runtime mode explicitly |
| `src/lib/spawner/spawner-types.ts` | `src/lib/types.ts` | Shared request/result shapes that later orchestration layers import directly |
| `src/lib/delegation-persistence.ts` | persistence section inside `src/lib/delegation-manager.ts` | Extract file I/O and normalization so orchestration logic stays below LOC target |
| `tests/lib/pty/*.test.ts` | `tests/lib/delegation-manager.test.ts` | Mock transport/process boundary only, assert on real state transitions and persisted values |
| `tests/lib/spawner/*.test.ts` | `tests/lib/session-api.test.ts` | Verify exact SDK call shapes and deterministic helper precedence |
| `tests/plugins/plugin-lifecycle.test.ts` | `tests/tools/delegate-task.test.ts` | Build plugin instance, assert public wiring rather than private internals |

## Key Contracts To Preserve

### WaiterModel
- Dispatch returns immediately with a delegation ID.
- Foreground work continues.
- Completion is retrieved through `delegation-status`, not by blocking dispatch.

### Dual-signal completion
- `session.idle` is only one signal.
- Message stability must still confirm completion.
- PTY exit is an input signal, not terminal truth.

### Single lifecycle owner
- `DelegationManager` owns delegation orchestration.
- `HarnessLifecycleManager` may remain only as a thin forwarding facade if hook compatibility requires it.
- No second status source of truth.

### Shared helper extraction
- `extractAssistantText()` belongs in `src/lib/helpers.ts`.
- Hooks and delegation runtime must import the same helper.

## Anti-Patterns To Avoid

- Embedding PTY lifecycle directly in tool wrappers
- Re-implementing a second completion detector inside PTY code
- Falling back to fixed timeouts as completion truth
- Preserving two independent lifecycle managers after integration
- Reintroducing sync/async dispatch modes into `delegate-task`
