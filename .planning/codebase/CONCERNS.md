# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**[Type Monoliths - Interface Decomposition Needed]:**
- Issue: 6 types with 17-25 fields violate Interface Decomposition principle (AGENTS.md mandate: no type exceeds 10 fields at core level)
- Files:
  - `src/core/trajectory/trajectory-types.ts` - `TrajectoryRecord` has 20+ fields composed via intersection
  - `src/shared/intake-record.types.ts` - `IntakeRecord` composed of 4 interfaces totaling many fields
  - `src/shared/pressure-contract.ts` - `RuntimePressureContract` nested structures
- Impact: Type maintenance difficulty, increased coupling, harder to extend safely
- Fix approach: Decompose per AGENTS.md principle - `TrajectoryCore & TrajectoryBindings & TrajectoryEvidence & TrajectoryPlanning`

**[Backward Compatibility Modules - Scheduled Removal]:**
- Issue: `src/shared/intake-record.ts` exists solely for backward compatibility, marked "will be removed in future version"
- Files: `src/shared/intake-record.ts`
- Impact: Dead weight, confuses developers about canonical location
- Fix approach: Complete migration to decomposed sub-modules, then remove barrel

**[Archived Schema-Kernel - Unused But Present]:**
- Issue: `src/archive/schema-kernel/` contains archived schema contracts that are no longer active
- Files: `src/archive/schema-kernel/` (entire directory)
- Impact: Potential confusion about authoritative schema location, maintenance burden
- Fix approach: Either restore as active Phase 1 contract authority or delete entirely

**[Archived Skills - Clutter]:**
- Issue: `skills/_archived/` contains 15+ archived skill directories with dated suffixes
- Files: `skills/_archived/research-methodology-archived-*/`, `skills/_archived/ralph-tasking-archived-*/`, etc.
- Impact: Developer confusion about active vs archived skills, repository bloat
- Fix approach: Delete archived skills or move to a separate archived-repos reference

**[Deprecated Hive Skills Still Present]:**
- Issue: `skills/_deprecated_hive/` contains 6 deprecated skill directories
- Files: `skills/_deprecated_hive/context-integrity/`, `skills/_deprecated_hive/delegation-framework/`, etc.
- Impact: Conflicts with active `use-hivemind-*` skills in root `skills/`
- Fix approach: Delete deprecated hive skills entirely

---

## Known Bugs

**[Silent Null Returns in Event Handlers]:**
- Symptoms: `hooks/event-handler.ts` returns `'event:unknown'` on line 15 - events may be silently swallowed
- Files: `src/hooks/event-handler.ts`
- Trigger: Any event type not explicitly matched in switch statement
- Workaround: Unknown

**[Contract Store Returns Null Without Throws]:**
- Symptoms: `contract-store.crud.ts` returns `null` instead of throwing on missing/deleted contracts
- Files: `src/features/agent-work-contract/engine/contract-store.crud.ts` (line 64)
- Trigger: Deleting a contract that doesn't exist
- Workaround: Check for null returns explicitly

**[Runtime Entry Command Handler Returns Null Silently]:**
- Symptoms: `command.ts` returns `null` for multiple command types without logging
- Files: `src/features/runtime-entry/command.ts` (lines 124, 128, 136, 143)
- Trigger: Various inspection/command operations that fail to find data
- Workaround: Unknown - silent failures could cause debugging difficulty

---

## Security Considerations

**[Heavy Use of `unknown` Type Casting]:**
- Risk: 124+ uses of `unknown` type with `as` casting throughout codebase
- Files: Multiple files in `src/plugin/`, `src/shared/`, `src/features/agent-work-contract/`
- Current mitigation: Some use `JSON.parse()` followed by type guards, but many use direct `as` casts
- Recommendations: 
  - Audit all `unknown` → `as` casts for potential type confusion attacks
  - Replace unsafe casts with proper `zod` schema validation
  - Add runtime validation layer for externally-sourced data

**[Record<string, unknown> Pattern Proliferation]:**
- Risk: 100+ uses of `Record<string, unknown>` for runtime data
- Files: `src/shared/contracts/runtime-status.ts`, `src/plugin/context-renderer.types.ts`, etc.
- Current mitigation: Zod schemas exist for some but not all
- Recommendations: Ensure all runtime evidence/results are validated before use

---

## Performance Bottlenecks

**[Large Synchronous JSON Parsing on Critical Path]:**
- Problem: `contract-store.crud.ts` uses synchronous `JSON.parse()` on potentially large contract files (lines 56, 95)
- Files: `src/features/agent-work-contract/engine/contract-store.crud.ts`
- Cause: Blocking file I/O during contract CRUD operations
- Improvement path: Use async file operations, consider streaming for large files

**[Pressure Contract Library Deep Clone]:**
- Problem: `cloneContract()` performs deep clone of nested objects on every contract retrieval (line 260-273)
- Files: `src/shared/pressure-contract.ts`
- Cause: Creating defensive copies of `actions`, `requiredArtifacts`, `optionalArtifacts` arrays
- Improvement path: Return frozen/readonly contracts, use spread only where mutation is needed

**[Large Test Files May Indicate Over-Testing of Single Modules]:**
- Problem: `compaction-preservation.test.ts` (618 lines), `contract-store.test.ts` (446 lines), `chain-executor.test.ts` (380 lines)
- Files: `src/features/agent-work-contract/hooks/`, `src/features/agent-work-contract/engine/`
- Cause: Single module has excessive test coverage vs. others
- Improvement path: Redistribute test effort across modules, add integration tests

---

## Fragile Areas

**[Evidence Reporter Type Assertion]:**
- Files: `src/plugin/evidence-reporter.ts`
- Why fragile: `result.evidence as Record<string, unknown>` on line 99 - unsafe cast with no validation
- Safe modification: Add `zod` schema validation for evidence before casting
- Test coverage: None detected for evidence validation

**[Delegation Store Multiple Null Returns]:**
- Files: `src/delegation/delegation-store.ts` (lines 57, 63, 122)
- Why fragile: Multiple methods return `null` without throwing - caller must check every time
- Safe modification: Consider throwing `NotFoundError` instead of returning null
- Test coverage: Basic CRUD tests exist but null-handling paths unclear

**[Control Plane Registry Multiple Null Returns]:**
- Files: `src/control-plane/control-plane-registry.ts` (lines 69, 89, 109, 121, 248)
- Why fragile: 5 separate `return null` points - error handling is inconsistent
- Safe modification: Standardize error handling - either throw or return `Result<T>` type
- Test coverage: Tests exist but null paths not fully exercised

**[Workflow Continuity Sanitization Regex]:**
- Files: `src/features/runtime-entry/workflow-continuity.ts` (line 44)
- Why fragile: `value.replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 160) || 'session:unknown'` - complex one-liner
- Safe modification: Extract to named function with clear intent
- Test coverage: Not verified

---

## Scaling Limits

**[Trajectory Ledger File-Based Storage]:**
- Current capacity: Single `.hivemind/state/trajectory-ledger.json` file
- Limit: File grows unbounded with session history
- Scaling path: Implement ledger rotation or switch to append-only log structure

**[Delegation Store In-Memory with File Persistence]:**
- Current capacity: Full delegation packet store held in memory
- Limit: Memory grows with delegation count
- Scaling path: Implement lazy loading or pagination for delegation packets

---

## Dependencies at Risk

**[@opencode-ai/sdk and @opencode-ai/plugin - Critical Coupling]:**
- Risk: Single source for both SDK and plugin - no alternatives
- Impact: Any breaking change in SDK requires immediate plugin update
- Migration plan: Maintain strict interface boundaries per AGENTS.md

**[ink + React for TUI - Heavy Weight]:**
- Risk: TUI implementation requires full React runtime
- Impact: Increases bundle size significantly
- Migration plan: Consider lighter alternatives (e.g., ` Blessed`, `Yoga`) if TUI is optional

**[web-tree-sitter - Native Dependency Complexity]:**
- Risk: Native binding for tree-sitter parsing
- Impact: Platform-specific builds required, potential installation failures
- Migration plan: Keep but ensure proper platform detection and fallback

---

## Missing Critical Features

**[No Schema Migration System for trajectory-ledger.json]:**
- Problem: Schema version exists (`version: 'v1'`) but no migration path documented
- Blocks: Schema evolution when adding new trajectory fields
- Priority: High

**[No Formal Error Type Hierarchy]:**
- Problem: Errors are strings, null returns, or generic `Error` objects inconsistently
- Blocks: Proper error handling, debugging, and error tracking
- Priority: Medium

**[No Circuit Breaker for External Dependencies]:**
- Problem: No protection against cascading failures from OpenCode SDK issues
- Blocks: Graceful degradation when SDK is unavailable
- Priority: Medium

---

## Test Coverage Gaps

**[Null Return Paths Not Tested]:**
- What's not tested: All 44 files with `return null`, `return []`, `return {}` patterns
- Files: `src/hooks/event-handler.ts`, `src/sdk-supervisor/runtime-status.ts`, `src/delegation/delegation-store.ts`, etc.
- Risk: Silent failures in error conditions go undetected
- Priority: High

**[Pressure Contract Resolution Untested]:**
- What's not tested: `getRuntimePressureContract()` and `pickRuntimePressureContract()` behavior under edge cases
- Files: `src/shared/pressure-contract.ts`
- Risk: Incorrect pressure contract selection in critical paths
- Priority: Medium

**[Integration Tests Missing for Control Plane ↔ Runtime Boundary]:**
- What's not tested: Full flow from CLI through control-plane to runtime attachment
- Files: `src/control-plane/`, `src/features/runtime-entry/`
- Risk: Boundary issues between control-plane (SDK) and runtime (plugin) planes
- Priority: High

---

*Concerns audit: 2026-03-21*
