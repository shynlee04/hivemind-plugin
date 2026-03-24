# Parallel Delegation

## Scenario

Three unrelated test failures across three independent modules: `src/tools/runtime/`, `src/hooks/`, and `src/core/`. Each module has its own authority surface with no shared imports.

## Expected Behavior

1. Orchestrator confirms independence: no shared imports, no shared file mutations, no cross-dependency
2. Emits three delegation packets, each with `execution_mode: "parallel"`
3. Each packet has distinct `authority_surfaces` — no overlap
4. After all three return, orchestrator runs integration test suite
5. If one fails and others succeed, orchestrator integrates successes and re-delegates only the failed slice

## Validation

| Check | Pass Condition |
|-------|---------------|
| Independence proof | Each packet's `authority_surfaces` has zero overlap with other packets |
| Parallel mode | All three packets have `execution_mode: "parallel"` |
| Self-contained packets | Each packet includes full context (error messages, file paths, constraints) — child needs no additional search |
| Failure isolation | If one packet returns `status: "partial"`, the other two are not aborted |
| Integration check | After all returns, orchestrator runs a full test suite command |
| Return fields | Each return has: packet_id, status, findings, blocked_routes (empty if complete), artifacts_written |
