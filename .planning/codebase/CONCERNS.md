# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

### File Size Violations (>300 LOC)

**`src/plugin/context-renderer.ts` (560 lines):**
- Files: `src/plugin/context-renderer.ts`
- Impact: Violates AGENTS.md "Code LOC less than 300" principle. God function risk - multiple render functions for different workflow styles (TDD, BMAD, Research, Default) in a single file
- Fix approach: Decompose into separate render modules per workflow style or extract to `context/renderers/` directory with pattern-based routing

**`src/features/session-entry/intake.ts` (407 lines):**
- Files: `src/features/session-entry/intake.ts`
- Impact: Violates 300 LOC limit. High complexity in session entry logic with multiple responsibilities (profile handling, questionnaire routing, readiness gates, attachment detection)
- Fix approach: Split into focused modules: `profile-loader.ts`, `questionnaire-router.ts`, `readiness-gates.ts`, `attachment-detector.ts`

**`src/features/runtime-entry/attachment.ts` (398 lines):**
- Files: `src/features/runtime-entry/attachment.ts`
- Impact: Violates 300 LOC limit. Attachment handling logic is tightly coupled with snapshot validation and runtime binding resolution
- Fix approach: Extract attachment validation to separate module, decouple from runtime binding logic

**`src/features/runtime-entry/init.ts` (371 lines):**
- Files: `src/features/runtime-entry/init.ts`
- Impact: Violates 300 LOC limit. Bootstrap and initialization logic mixed with harness setup and recovery flow
- Fix approach: Separate harness setup (`harness.ts`) from bootstrap logic (`bootstrap-flow.ts`)

**`src/shared/intake-record.ts` (332 lines):**
- Files: `src/shared/intake-record.ts`
- Impact: Violates 300 LOC limit. Large record type with multiple variant structures (StartWorkDecision, IntakeReadiness, ProfileState) in single file
- Fix approach: Extract each record type to dedicated schema file under `src/schema-kernel/` or `shared/records/`

**`src/core/trajectory/trajectory-store.ts` (328 lines):**
- Files: `src/core/trajectory/trajectory-store.ts`
- Impact: Violates 300 LOC limit. Trajectory state management, checkpointing, and persistence mixed in single module
- Fix approach: Split into `trajectory-state.ts`, `trajectory-checkpoints.ts`, `trajectory-persistence.ts`

**`src/features/agent-work-contract/engine/contract-store.ts` (319 lines):**
- Files: `src/features/agent-work-contract/engine/contract-store.ts`
- Impact: Violates 300 LOC limit. Contract CRUD operations, conflict detection, and archiving in one file
- Fix approach: Separate contract operations from store implementation, extract archiving to dedicated module

**`src/features/agent-work-contract/tools/create-contract-tool.ts` (314 lines):**
- Files: `src/features/agent-work-contract/tools/create-contract-tool.ts`
- Impact: Violates 300 LOC limit. Tool definition, execution logic, and test fixtures combined
- Fix approach: Extract test fixtures to separate `fixtures/` directory, keep tool definition focused

**`src/plugin/opencode-plugin.ts` (309 lines):**
- Files: `src/plugin/opencode-plugin.ts`
- Impact: Borderline violation. Assembly layer mixing hook registration, tool registration, start-work routing, and NL-first dispatch
- Fix approach: Extract hook registration to `plugin/hooks-registry.ts`, extract tool registration to `plugin/tools-registry.ts`

### Type Monoliths (Interface Decomposition Violation)

**`RuntimePressureContract` Interface:**
- Files: `src/shared/pressure-contract.ts` (lines 47-54)
- Impact: Interface has nested complex structures (RuntimeSafetyExpectation with actions[], RuntimeEvidenceCaptureSpec with 4 array fields). Total effective field count exceeds 10-field core limit when considering nested structures
- Fix approach: Decompose into focused interfaces: `RuntimeSafetySpec`, `RuntimeEvidenceSpec`, `RuntimeBehaviorSpec`. Use composition via intersection for full contract

**`HivemindHandoffToolArgs` Interface:**
- Files: `src/tools/handoff/types.ts` (lines 13-24)
- Impact: 25 fields in single interface. Violates "No type exceeds 10 fields at core level" principle
- Fix approach: Group related fields into sub-interfaces: `HandoffIdentification`, `HandoffContent`, `HandoffConstraints`, compose via intersection

**`HivemindContextPacket` Interface:**
- Files: `src/plugin/context-renderer.ts` (lines 5-44)
- Impact: 44 fields in single interface including conditionally included sections (TDD-specific, BMAD-specific, Research-specific)
- Fix approach: Extract workflow-specific fields to separate interfaces, use union types for conditional sections

### Incomplete Features

**`intelligence/doc/` Public Read-Only Expansion:**
- Files: `src/intelligence/doc/`
- Impact: "public read-only expansion is in progress and broader restoration remains future work" (per AGENTS.md). Multi-format, write-capable doc-intel stack is not restored
- Blocking: Advanced document operations beyond markdown-first reads (cross-document indexing, integrity, xref)
- Fix approach: Document expansion plan in `docs/roadmap/`, prioritize multi-format support after read foundation stabilizes

**`sdk-supervisor/` Underutilized Client API:**
- Files: `src/sdk-supervisor/`
- Impact: AGENTS.md notes `client.session.*`, `client.app.agents()`, `client.tool.ids()` as "underutilized". Runtime agent validation and tool validation not implemented
- Blocking: Cannot enforce shipped framework surfaces against runtime state
- Fix approach: Implement runtime agent validation using `client.app.agents()`, implement tool validation using `client.tool.ids()` in readiness gates

## Architectural Risks

### Mixed Concerns in Assembly Layer

**`opencode-plugin.ts` Business Logic Encroachment:**
- Files: `src/plugin/opencode-plugin.ts` (lines 66-77)
- Impact: `resolveCompactionAgentWorkPacket()` and `createStartWorkInput()` functions contain business logic (contract sorting, packet resolution) in assembly layer. Violates "Plugin assembles. No inline tools. No business logic" rule
- Risk: Assembly layer becomes maintenance bottleneck, difficult to test in isolation
- Fix approach: Move packet resolution logic to `features/agent-work-contract/packet-resolver.ts`, keep assembly focused on hook registration and tool export

### CQRS Boundary Violation Risk

**Hooks with Durable Writes:**
- Files: Not yet detected, but AGENTS.md warns "No 'hooks that also write.' No 'plugin entry with business logic.'"
- Risk: Future hook implementations might inadvertently persist state, violating read-side principle
- Mitigation: Enforce read-only assertions in hook tests, document hook contract in `src/hooks/*/AGENTS.md`

### Dual-Plane SDK Architecture Confusion

**Control Plane vs Execution Plane Separation:**
- Files: `src/cli/`, `src/control-plane/`, `src/sdk-supervisor/` vs `src/plugin/`, `src/hooks/`, `src/tools/`
- Risk: Confusing or mixing `@opencode-ai/sdk` (Control Plane) and `@opencode-ai/plugin` (Execution Plane) APIs causes infinite server recursion
- Mitigation: Document clear separation in each sector's AGENTS.md, verify imports are correct plane, add lint rules preventing wrong-plane imports

## Missing Validations

### Limited Error Handling Coverage

**Sparse Error Throws:**
- Files: Across entire `src/`
- Impact: Only 27 `throw new Error` statements detected in codebase of ~18,955 lines (0.14% coverage). Many operations may fail silently or return undefined
- Risk: Unhandled rejections, silent failures, unclear error messages for end users
- Fix approach: Add validation at tool entry points, use Zod's `.safeParse()` for recoverable errors, implement centralized error handler using `client.app.log()`

**Minimal Try/Catch Blocks:**
- Files: Across entire `src/`
- Impact: Only 56 try/catch blocks detected. Network operations, file I/O, and async operations lack error handling
- Risk: Crash on uncaught exceptions, no graceful degradation
- Fix approach: Wrap all I/O operations in try/catch, log errors with context using `client.app.log()`, provide fallback values

### Empty Returns Without Clear Semantics

**Ambiguous Null Returns:**
- Files: `src/sdk-supervisor/runtime-status.ts` (lines 92, 108, 124), `src/core/trajectory/trajectory-assessment.ts` (line 25), `src/core/workflow-management/workflow-authority.ts` (lines 40, 46), `src/intelligence/doc/formats/md.ts` (lines 84, 103)
- Impact: Functions return `null` without clear failure vs. empty result semantics. Callers cannot distinguish between "not found" and "error occurred"
- Risk: Silent propagation of undefined, difficult debugging
- Fix approach: Use Result types (e.g., `{ success: boolean; data: T | null }`), throw explicit errors, or use optional return types with clear documentation

**Empty Array/Object Returns:**
- Files: Multiple locations (grep found 40+ instances)
- Impact: Functions return `[]` or `{}` without indicating whether this is expected empty or error fallback
- Risk: Ambiguous state, masking issues
- Fix approach: Document expected empty returns in JSDoc, use explicit Option types, avoid silent failures

## Security Concerns

### Console Logging in Production

**Mixed Console and SDK Logging:**
- Files: `src/tui/index.ts`, `src/features/agent-work-contract/engine/chain-executor.ts`, `src/cli.ts`, `src/shared/logging.ts`
- Impact: Mix of `console.log`, `console.error`, `console.warn` alongside `client.app.log()`. Console logs bypass OpenCode server-side logging, missing from production telemetry
- Risk: Incomplete audit trails, lost structured logs, no correlation IDs
- Fix approach: Replace all console logging with `client.app.log()` for structured logging, keep console only for CLI entrypoint with clear exit paths

### Environment Variable Exposure

**Runtime Environment Access:**
- Files: `src/features/runtime-entry/harness.ts` (line 151), `src/plugin/opencode-plugin.ts` (lines 143-147), `src/shared/logging.ts` (line 36)
- Impact: Direct `process.env` access for `OPENCODE_SERVER_URL`, `HIVEMIND_DEBUG`, and various `HIVEMIND_*` runtime flags. No centralized validation or documentation of required environment variables
- Risk: Undocumented configuration requirements, unclear startup failures
- Fix approach: Centralize env var access in `shared/env.ts`, document in README.md, add validation at startup

### Handoff Packet Validation Gaps

**JSON Parsing Without Schema Validation:**
- Files: `src/features/agent-work-contract/engine/contract-store.ts` (line 147), `src/delegation/delegation-store.ts`
- Impact: Handoff packets parsed with `CompactionPreservationPacketSchema.parse()` but tool arguments passed as JSON strings (`requiredEvidence`, `evidence`) without Zod validation at tool boundary
- Risk: Malformed handoff packets, injection attacks, schema mismatches
- Fix approach: Add Zod validation for all JSON string arguments in handoff tool, use `tool.schema.string().transform(JSON.parse)` with `.safeParse()` wrapper

## Performance Considerations

### Array Iteration Patterns

**Frequent Map/Filter/Reduce Operations:**
- Files: Across `src/` (102 iterations found)
- Impact: High iteration count suggests potential O(n²) complexity or lack of memoization in hot paths
- Risk: Performance degradation on large datasets, unnecessary re-computation
- Fix approach: Profile hot paths (tool execution, context rendering, state queries), add caching where appropriate, consider using Set for lookups

### Large Context Packet Rendering

**Packet Assembly Overhead:**
- Files: `src/plugin/context-renderer.ts`
- Impact: `renderHivemindContext()` and compaction render functions iterate over all 44 packet fields on every turn, constructing large strings via JSON.stringify
- Risk: Token budget consumption, slower tool execution response times
- Fix approach: Implement lazy rendering for conditional fields, cache rendered packets, use template literals instead of repeated JSON.stringify calls

### Synchronous File I/O in Hot Paths

**Potential Blocking Reads:**
- Files: `src/features/agent-work-contract/engine/contract-store.ts`, `src/intelligence/doc/read-ops.ts`
- Impact: Synchronous file reads/writes in contract store and document operations could block event loop
- Risk: UI freezes, delayed tool execution
- Fix approach: Use async file operations consistently, implement file system caching, batch operations where possible

## Test Coverage Gaps

### Limited Active Test Coverage

**Sparse Test Files in Source:**
- Files: Only 11 active test files in `src/` (vs 3,136 total lines in source)
- Impact: Low test-to-code ratio. Critical paths like context rendering, runtime attachment, delegation handling may have unverified behavior
- Risk: Regressions in untested code, false confidence in refactoring
- Fix approach: Add unit tests for context rendering, add integration tests for handoff flow, add contract store tests covering edge cases

### Legacy Test Bloat

**Archived Tests Not Maintained:**
- Files: `.archive/legacy-tests/` (30+ test files)
- Impact: Large test archive not part of active test suite, may contain stale tests or outdated patterns
- Risk: Misleading coverage metrics, maintenance burden, confusion about current test expectations
- Fix approach: Migrate valuable tests to `src/` or delete, add comment explaining test archival in `.gitignore` or README

### Missing E2E Tests

**No End-to-End Coverage:**
- Files: None found
- Impact: No integration tests verifying full workflows from CLI to plugin execution across multiple sessions
- Risk: Undiscovered runtime issues, broken handoff flows, session state corruption
- Fix approach: Add E2E tests in `tests/e2e/`, simulate realistic agent workflows, verify state persistence across compactions

## Fragile Areas

### Turn Context Dependency Chain

**Context Packet Resolution Path:**
- Files: `src/plugin/context-renderer.ts`, `src/features/session-entry/intake.ts`, `src/hooks/start-work/`
- Impact: Multiple modules depend on `HivemindContextPacket` structure. Changes to packet fields require updates across 4+ files
- Risk: Cascading changes, field mismatch between renderers and consumers
- Safe modification: Add integration tests for packet field changes, document packet schema versioning, use strict TypeScript mode

### Agent Contract Store Complexity

**Contract Storage and Retrieval:**
- Files: `src/features/agent-work-contract/engine/contract-store.ts`
- Impact: Contract CRUD operations mixed with file system operations, conflict detection, and archiving in 319 lines. High coupling to `.hivemind/` directory structure
- Why fragile: File system operations not mockable in unit tests, race conditions on concurrent writes, unclear contract state after errors
- Safe modification: Extract file system operations to dedicated I/O module, make contract operations mockable via dependency injection, add contract state machine tests

### Runtime Attachment Mode Coupling

**Attachment Detection Logic:**
- Files: `src/features/runtime-entry/attachment.ts`, `src/plugin/opencode-plugin.ts`
- Impact: Attachment mode detection tightly coupled with snapshot validation, runtime binding, and environment injection. Changes propagate through multiple layers
- Why fragile: Complex conditional logic difficult to test, unclear separation of concerns, side effects from mode changes
- Safe modification: Extract attachment mode as independent state object with event emission, use state machine for mode transitions

## Dependencies at Risk

### SDK Hook Name Prefix Instability

**Experimental Prefix Migration:**
- Files: `src/plugin/opencode-plugin.ts`
- Risk: AGENTS.md notes `experimental.chat.system.transform` and similar hook names may change when SDK stabilizes. Current decision is "No adapter layer. Single find-replace in opencode-plugin.ts when SDK drops experimental. prefix"
- Impact: Breaking changes when SDK removes `experimental.` prefix, maintenance burden on tracking hook name changes
- Mitigation: Document hook version compatibility matrix, add tests verifying both current and future hook names, monitor OpenCode SDK changelog

### Dual-Plane Confusion

**Control/Execution Plane Separation:**
- Files: `src/cli/` + `src/control-plane/` vs `src/plugin/` + `src/hooks/` + `src/tools/`
- Risk: Accidental imports from wrong plane cause infinite server recursion
- Mitigation: Add ESLint rules preventing `@opencode-ai/sdk` imports in plugin/hooks/tools directories and vice versa, document dual-plane architecture in onboarding docs

## Scaling Limits

### Session Continuation Memory Growth

**Session Archive Accumulation:**
- Files: `.hivemind/sessions/` directory (runtime-generated)
- Impact: No observed limit or cleanup mechanism for session files. Long-running projects could accumulate thousands of archived sessions
- Limit: Disk space exhaustion, slow startup loading session registry
- Scaling path: Implement session retention policy (e.g., keep last N sessions per project), add cleanup command (`hm-session-cleanup`), compress old sessions

### Trajectory Event Log Bloat

**Unbounded Event History:**
- Files: `src/core/trajectory/trajectory-store.ts` (inferred from event storage)
- Impact: Trajectory events accumulate without compaction or pruning. Long trajectories could have thousands of event entries
- Limit: Performance degradation on traversal, memory pressure on compaction
- Scaling path: Implement event snapshotting (summary rather than full history), add event pruning after N entries, compress archived trajectories

---

*Concerns audit: 2026-03-21*
