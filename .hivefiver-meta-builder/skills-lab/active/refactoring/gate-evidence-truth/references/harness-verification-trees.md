# Harness Verification Trees

Module-specific verification protocols for Hivemind harness components. Each tree defines the exact flow that must be verified for a module type.

## Delegation Modules

**Target files:** `src/lib/delegation-manager.ts`, `src/tools/delegate-task.ts`, `src/tools/delegation-status.ts`

### Verification Flow
```
dispatch → poll → complete → cleanup
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Dispatch | DelegationManager.dispatch() returns delegation ID | L3 (integration test hitting real dispatch) |
| Poll | delegation-status tool returns correct state transitions | L3 |
| Complete | Dual-signal completion detected (tool result + status) | L3 |
| Cleanup | Delegation record persisted and retrievable | L4 |

### Mock Detection
- Any mock of `session-api.ts` methods (`createSession`, `sendMessage`) in delegation tests → classify as L4
- Any mock of `delegation-persistence.ts` I/O → classify as L4
- True L3 requires actual session dispatch (even if the "session" is a test fixture)

### Regression Vectors
- `delegation-manager.ts` changes require re-verifying `delegate-task.ts` and `delegation-status.ts`
- `continuity.ts` changes affect delegation persistence — verify delegation record I/O
- `types.ts` changes affect all delegation modules — verify type compatibility

## Continuity Modules

**Target files:** `src/lib/continuity.ts`, `src/lib/state.ts`

### Verification Flow
```
write → read → patch → delete
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Write | JSON file created with correct structure | L3 (real file I/O) |
| Read | Deep-clone returned, mutations don't affect store | L3 |
| Patch | Partial updates applied atomically | L3 |
| Delete | File removed, in-memory state cleared | L4 |

### Mock Detection
- Any mock of `fs.readFileSync`/`fs.writeFileSync` → classify as L4
- True L3 requires actual file I/O in temp directory
- `state.ts` in-memory Maps tested with real Map operations (L4 sufficient for in-memory)

### Regression Vectors
- `types.ts` changes affect all continuity operations — verify type guards
- `helpers.ts` changes affect deep-clone behavior — verify read isolation

## Hook Modules

**Target files:** `src/hooks/` directory

### Verification Flow
```
subscribe → handle → observe
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Subscribe | Hook registered for correct event type | L4 (registration is config) |
| Handle | Handler invoked on event emission | L3 (real event dispatch) |
| Observe | Side effects of handler executed correctly | L3 |

### Mock Detection
- Any mock of the OpenCode event system → classify as L4
- True L3 requires actual event emission and handler invocation
- Hook factory functions can be tested at L4 (pure function tests)

### Regression Vectors
- `plugin.ts` changes affect hook registration — verify hook wiring
- `types.ts` changes affect event type definitions — verify type compatibility

## Concurrency Modules

**Target files:** `src/lib/concurrency.ts`

### Verification Flow
```
acquire → contention → release → cleanup
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Acquire | Semaphore grants lock when slots available | L4 (pure logic) |
| Contention | Queued requests resolve in FIFO order | L4 |
| Release | Slot freed, next queued request unblocked | L4 |
| Cleanup | All pending resolved on semaphore destroy | L3 (async coordination) |

### Mock Detection
- Semaphore is pure in-memory — L4 is sufficient for single-thread tests
- L3 required for concurrent acquisition tests (multiple async paths)
- Any `FakeTime` or timer mock in concurrency tests → verify test still exercises real async behavior

### Regression Vectors
- `concurrency.ts` is leaf module — few inbound dependencies
- Changes affect `delegation-manager.ts` queue-key validation — verify delegation under contention

## Completion Detection Modules

**Target files:** `src/lib/completion-detector.ts`

### Verification Flow
```
idle → stability → resolve
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Idle | No recent tool calls detected | L4 (state check) |
| Stability | Idle state persists for threshold duration | L3 (requires timing) |
| Resolve | Completion signal emitted with correct metadata | L3 |

### Mock Detection
- Timer mocks for stability threshold → classify as L4 unless real timers also tested
- True L3 requires actual time-based stability detection
- Session lifecycle state machine transitions must use real state, not mocked

### Regression Vectors
- `runtime.ts` changes affect event→status mapping — verify detector uses correct mapping
- `types.ts` changes affect lifecycle phase definitions — verify detector uses correct phases
- `session-api.ts` changes affect tool call observation — verify detector receives real events

## Cross-Module Integration Tree

For changes spanning multiple module types, verify the integration surface:

```
delegate-task tool → DelegationManager → concurrency check → session dispatch →
completion detection → continuity persistence → delegation-status tool
```

Cross-module integration requires L2 minimum (continuity record from real execution covering the full chain).
