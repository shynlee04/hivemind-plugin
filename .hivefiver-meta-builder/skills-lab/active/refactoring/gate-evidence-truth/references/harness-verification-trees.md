# Harness Verification Trees

Module-specific verification protocols for Hivemind harness components. Each tree defines the exact flow that must be verified for a module type.

> **Project path adapter:** The paths below reference the canonical Hivemind harness project structure. In the harness project, delegation modules live at `src/lib/delegation-manager.ts`, `src/tools/delegate-task.ts`, and `src/tools/delegation-status.ts`. In your project, these paths will differ. Apply the verification flow and evidence rules to whatever module performs the equivalent function. See `project-adapter-guide.md` for path mapping instructions.

## Delegation Modules

**In the harness project:** `src/lib/delegation-manager.ts`, `src/tools/delegate-task.ts`, `src/tools/delegation-status.ts`
**In your project:** Locate the module(s) that dispatch work to subagents, poll for results, and manage completion.

### Verification Flow
```
dispatch → poll → complete → cleanup
```

### Required Evidence per Step
| Step | Must Verify | Minimum Evidence |
|------|------------|------------------|
| Dispatch | Delegation dispatch returns a delegation ID | L3 (integration test hitting real dispatch) |
| Poll | Status tool returns correct state transitions | L3 |
| Complete | Dual-signal completion detected (tool result + status) | L3 |
| Cleanup | Delegation record persisted and retrievable | L4 |

### Mock Detection
- Any mock of session API methods (`createSession`, `sendMessage`) in delegation tests → classify as L4
- Any mock of delegation persistence I/O → classify as L4
- True L3 requires actual session dispatch (even if the "session" is a test fixture)

### Regression Vectors
- Delegation manager changes require re-verifying delegate-task tool and delegation-status tool
- Continuity/store changes affect delegation persistence — verify delegation record I/O
- Type definition changes affect all delegation modules — verify type compatibility

## Continuity Modules

**In the harness project:** `src/lib/continuity.ts`, `src/lib/state.ts`
**In your project:** Locate the module(s) responsible for durable state persistence and in-memory state management.

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
- In-memory Maps tested with real Map operations (L4 sufficient for in-memory)

### Regression Vectors
- Type definition changes affect all continuity operations — verify type guards
- Helper utility changes affect deep-clone behavior — verify read isolation

## Hook Modules

**In the harness project:** `src/hooks/` directory
**In your project:** Locate the module(s) that register event handlers and observe the event stream.

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
- Any mock of the platform event system → classify as L4
- True L3 requires actual event emission and handler invocation
- Hook factory functions can be tested at L4 (pure function tests)

### Regression Vectors
- Plugin composition root changes affect hook registration — verify hook wiring
- Type definition changes affect event type definitions — verify type compatibility

## Concurrency Modules

**In the harness project:** `src/lib/concurrency.ts`
**In your project:** Locate the module(s) that implement keyed semaphores, FIFO queues, or concurrency control.

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
- Concurrency module is typically a leaf module — few inbound dependencies
- Changes affect delegation queuing validation — verify delegation under contention

## Completion Detection Modules

**In the harness project:** `src/lib/completion-detector.ts`
**In your project:** Locate the module(s) that detect when work has finished (idle detection, stability checks, completion signal emission).

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
- Runtime/event mapping changes affect event→status mapping — verify detector uses correct mapping
- Type definition changes affect lifecycle phase definitions — verify detector uses correct phases
- Session API changes affect tool call observation — verify detector receives real events

## Cross-Module Integration Tree

For changes spanning multiple module types, verify the integration surface:

```
delegate-task tool → delegation manager → concurrency check → session dispatch →
completion detection → continuity persistence → delegation-status tool
```

Cross-module integration requires L2 minimum (continuity record from real execution covering the full chain).

## Path Adaptation Notes

When applying these verification trees outside the harness project:

1. **Identify functional equivalents:** Find which modules in your project perform the same roles (delegation, continuity, hooks, concurrency, completion detection).
2. **Map paths:** Create a project-specific mapping from the harness paths above to your project's structure. See `project-adapter-guide.md` for the template.
3. **Apply same evidence rules:** The L1-L5 hierarchy and mock detection rules are path-independent — they apply identically regardless of where modules live.
4. **Adapt regression vectors:** Dependency relationships in your project may differ. Use your project's import graph or module dependency analyzer to identify regression vectors.
