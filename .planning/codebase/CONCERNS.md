# Codebase Concerns

**Last mapped:** 2026-05-28

## Technical Debt

### Known Bug Fixes (Race Conditions)
- `src/features/session-tracker/capture/event-capture.ts:329` — BUGFIX: Fallback to SDK messages when pendingRegistry.lastMessage is empty
- `src/features/session-tracker/tool-delegation.ts:276` — BUG-5 FIX: Ensure the L1 parent (input.sessionID) is registered in hierarchy before child registration
- `src/features/session-tracker/tool-delegation.ts:332` — BUG-3 FIX: Extract child agent's final assistant response and append as turn
- `src/features/session-tracker/tool-delegation.ts:348` — BUG-3 FIX: Also append as a turn so lastMessage is set
- `src/features/session-tracker/persistence/session-index-writer.ts:222` — BUG-5 FIX: Parent not yet in on-disk hierarchy (race between in-memory and on-disk state)

### Type Safety Gaps (`as any` casts)
- `src/tools/delegation/delegation-status.ts:148,169,174,250,266,279,292` — Multiple `as any` casts when parsing delegation manifests and child metadata
- `src/coordination/delegation/coordinator.ts:92,212,216,219` — `as any` casts on message info objects to access `.info.role`, `.info.error`
- `src/shared/session-api.ts:234-235` — eslint-disable + `as any` for SDK response handling

### ESLint Suppressions
- `src/shared/session-api.ts:234` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
- `src/features/session-tracker/initialization.ts:36` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`

---

## Security Concerns

### Console Logging in Production Code
- `src/tools/session/execute-slash-command.ts:486` — `console.error` for dispatch failures
- `src/tools/session/dispatch-command.ts:112` — `console.error` for dispatch failures
- `src/features/session-tracker/persistence/retry-queue.ts:326` — `console.error` in retry logic
- `src/features/session-tracker/persistence/session-index-writer.ts:120,225` — `console.error` and `console.warn` in persistence layer

**Risk:** Console output may leak sensitive information (session IDs, file paths, error details) in production environments.

### No Obvious Exposed Secrets
- No API keys, tokens, or private keys detected in source code
- Secrets appear properly managed via environment variables or config

---

## Performance Issues

### Synchronous File I/O Patterns
- Session index writes appear synchronous in `src/features/session-tracker/persistence/session-index-writer.ts`
- Retry queue at `src/features/session-tracker/persistence/retry-queue.ts` may block on disk failures

### Deep Import Chains
- `src/tools/delegation/delegation-status.ts` reads and parses JSON manifests multiple times (lines 169, 250) with repeated `as any` casts
- No memoization detected for repeated config lookups

---

## Fragile Areas

### Session Tracker Module (High Complexity)
- `src/features/session-tracker/` — Multiple race condition fixes (BUG-3, BUG-5) indicate this area is prone to timing issues
- `src/features/session-tracker/capture/event-capture.ts` — Complex event capture with SDK fallback logic
- `src/features/session-tracker/tool-delegation.ts` — Multi-step delegation with hierarchy registration

### Delegation Coordinator
- `src/coordination/delegation/coordinator.ts` — Message role extraction with multiple fallback paths (`info.role`, `role`, `error.message`)
- Heavy use of `as any` suggests type definitions don't match runtime SDK output

### Bootstrap/Primitive Registry
- `src/features/bootstrap/primitive-registry.ts` — Complex registration with potential for ordering issues
- `src/features/bootstrap/control-plane/gatekeeper.ts` — Gate decision logic with blocking gate detection

---

## Code Quality Issues

### Error Handling Patterns
- Error fields accessed via chain: `(lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error` — suggests inconsistent error shape from SDK
- Fallback-heavy patterns indicate SDK contract mismatches

### Documentation Gaps
- Most `console.log` statements in JSDoc examples only (not production code)
- Schema files have good JSDoc (`src/schema-kernel/`)
- Feature modules lack inline documentation for complex delegation logic

### Module Size
- `src/features/session-tracker/` appears to be the largest feature module — consider decomposition if LOC exceeds 500 per file

---

## Recommendations

1. **High Priority:** Create proper TypeScript interfaces for delegation manifest JSON shapes to eliminate `as any` casts in `delegation-status.ts` and `coordinator.ts`
2. **High Priority:** Replace `console.error`/`console.warn` with structured logging (the project already has a logger pattern — use it consistently)
3. **Medium Priority:** Add integration tests for the session-tracker race condition fixes (BUG-3, BUG-5) to prevent regressions
4. **Medium Priority:** Document the delegation hierarchy registration order requirements in a comment or ADR
5. **Low Priority:** Consider extracting delegation manifest parsing into a shared utility to reduce duplication in `delegation-status.ts`
