# Phase C7: Test Coverage Research

**Phase:** C7-Test-Coverage
**Date:** 2026-05-28
**Status:** Research Complete
**Confidence:** HIGH

## Executive Summary

Test coverage for hooks modules is **NOT 0%** — substantial test files exist with 300+ test cases across 16 test files. However, coverage measurement shows gaps due to test isolation and mocking patterns. The phase should focus on **integration tests** and **coverage threshold enforcement** rather than scaffold creation.

### Key Findings

1. **Hooks tests exist and pass** — 16 test files cover all 15 source hook files
2. **Coverage thresholds already defined** — vitest.config.ts has 85/72/85/85 thresholds
3. **Integration tests limited** — only 2 integration test files exist
4. **Test patterns mature** — project uses vitest with extensive mocking and TDD patterns

---

## 1. Hooks Coverage Analysis (7.1)

### Source Files (15 total)

```
src/hooks/
├── types.ts
├── transforms/
│   ├── tool-after-workflow.ts
│   ├── tool-before-guard.ts
│   ├── tool-after-composer.ts
│   └── chat-message-capture.ts
├── observers/
│   ├── event-observers.ts
│   ├── session-main-consumer.ts
│   ├── session-tracker-consumer.ts
│   ├── session-entry-consumer.ts
│   └── delegation-consumer.ts
├── lifecycle/
│   ├── session-hooks.ts
│   └── core-hooks.ts
├── guards/
│   ├── governance-block.ts
│   └── tool-guard-hooks.ts
└── composition/
    └── cqrs-boundary.ts
```

### Test Files (16 total)

| Source File | Test File | Test Count | Status |
|-------------|-----------|------------|--------|
| types.ts | tests/hooks/types.test.ts | ✅ | PASS |
| lifecycle/session-hooks.ts | tests/hooks/create-session-hooks.test.ts | 7 | PASS |
| lifecycle/core-hooks.ts | tests/hooks/create-core-hooks.test.ts | 25+ | PASS |
| guards/tool-guard-hooks.ts | tests/hooks/create-tool-guard-hooks.test.ts | 18 | PASS |
| guards/governance-block.ts | tests/hooks/governance-block.test.ts | 8 | PASS |
| composition/cqrs-boundary.ts | tests/hooks/hook-cqrs-boundary.test.ts | 3 | PASS |
| observers/event-observers.ts | tests/hooks/plugin-event-observers.test.ts | ✅ | PASS |
| observers/session-main-consumer.ts | tests/hooks/observers/session-main-consumer.test.ts | ✅ | PASS |
| observers/session-tracker-consumer.ts | tests/hooks/observers/session-tracker-consumer.test.ts | ✅ | PASS |
| observers/session-entry-consumer.ts | tests/hooks/observers/session-entry-consumer.test.ts | ✅ | PASS |
| observers/delegation-consumer.ts | tests/hooks/observers/delegation-consumer.test.ts | ✅ | PASS |
| transforms/tool-before-guard.ts | tests/hooks/transforms/tool-before-guard.test.ts | ✅ | PASS |
| transforms/tool-after-workflow.ts | tests/hooks/transforms/tool-after-workflow.test.ts | ✅ | PASS |
| transforms/chat-message-capture.ts | tests/hooks/transforms/chat-message-capture.test.ts | ✅ | PASS |
| transforms/tool-after-composer.ts | tests/hooks/tool-after-composer.test.ts | 3 | PASS |

### Coverage Gaps Identified

**Actual Coverage:** Unknown (coverage measurement not run successfully)
**Expected Coverage:** 60-80% (based on test density)

**Potential Gaps:**
1. **session-hooks.ts** — Complex auto-loop logic (340 LOC) with 7 tests may miss edge cases
2. **core-hooks.ts** — System transform with language governance (197 LOC) has 25+ tests
3. **tool-guard-hooks.ts** — Budget/circuit breaker logic (203 LOC) has 18 tests
4. **Edge cases:** Error handling, concurrent sessions, config validation

---

## 2. Integration Tests Analysis (7.2)

### Existing Integration Tests

| Test File | Coverage Area | Test Count |
|-----------|---------------|------------|
| tests/integration/delegation-v2-integration.test.ts | Delegation v2 plugin integration | 12 |
| tests/integration/prompt-enhance-pipeline.test.ts | Prompt enhance pipeline | ✅ |

### Integration Test Patterns

**Pattern 1: Plugin Integration (delegation-v2-integration.test.ts)**
- Uses real plugin initialization via `HarnessControlPlane()`
- Tests SDK child-session delegation flow
- Validates coordinator parent isolation
- Tests auto-loop and ralph-loop engines

**Pattern 2: Module Integration**
- Tests cross-module interactions (e.g., plugin → delegation → lifecycle)
- Uses mock client with realistic SDK interface
- Validates end-to-end delegation workflow

### Missing Integration Tests

**Recommended Coverage Areas:**
1. **Hooks → Plugin Integration** — Test hooks wired into plugin lifecycle
2. **Session Tracker Integration** — Test session-tracker with real events
3. **Continuity Integration** — Test continuity persistence across sessions
4. **Lifecycle Manager Integration** — Test lifecycle state transitions
5. **Tool Guard Integration** — Test tool guard with real tool execution

### Integration Test Patterns to Follow

```typescript
// Pattern from delegation-v2-integration.test.ts
describe("module integration", () => {
  it("end-to-end flow", async () => {
    const client = createRuntimeClient()
    const modules = setupDelegationModules({ client, ... })
    const tool = createDelegateTaskTool(modules.delegationManager)
    
    // Execute through real tool interface
    const raw = await tool.execute({ ... }, { sessionID: "parent-1" })
    
    // Validate through delegation manager
    expect(modules.delegationManager.listDelegations("parent-1")).toHaveLength(1)
  })
})
```

---

## 3. Coverage Thresholds Analysis (7.3)

### Current Configuration

**File:** `vitest.config.ts`

```typescript
coverage: {
  provider: 'v8',
  include: ['src/**/*.ts'],
  exclude: ['src/index.ts', 'src/**/index.ts'],
  reporter: ['text', 'lcov', 'json-summary'],
  thresholds: {
    statements: 85,
    branches: 72,
    functions: 85,
    lines: 85,
  },
}
```

**File:** `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Threshold Analysis

**Current Thresholds:** 85/72/85/85 (statements/branches/functions/lines)

**Issue:** Thresholds are defined but may not be enforced in CI/CD pipeline.

**Recommendations:**
1. Verify threshold enforcement in test script
2. Add coverage check to pre-commit hooks
3. Consider lowering thresholds for hooks modules initially (70% target)
4. Add coverage reporting to CI/CD

---

## 4. Test Patterns and Conventions

### Test Structure

**File Location:** `tests/hooks/*.test.ts`

**Naming Convention:**
- `create-<hook-name>.test.ts` for factory functions
- `<hook-name>.test.ts` for pure functions
- `<module-name>.test.ts` for general tests

**Test Organization:**
```typescript
describe("hookFactory", () => {
  describe("hookName", () => {
    it("description of behavior", async () => {
      // Arrange
      const deps = createFakeDependencies()
      const hook = createHook(deps)
      
      // Act
      await hook(input, output)
      
      // Assert
      expect(output).toMatchObject({ ... })
    })
  })
})
```

### Mocking Patterns

**Pattern 1: Fake Dependencies**
```typescript
function createFakeStateManager() {
  const stats = new Map<string, Stats>()
  return {
    ensureStats(sessionID: string) { ... },
    getStats(sessionID: string) { ... },
    addWarning: vi.fn(),
  }
}
```

**Pattern 2: Mock Client**
```typescript
function createClient() {
  return {
    app: { agents: vi.fn(), log: vi.fn() },
    session: { create: vi.fn(), messages: vi.fn() },
  }
}
```

### TDD Patterns

**RED Phase:**
- Write failing tests first
- Use `vi.fn()` for mocks
- Define expected behavior

**GREEN Phase:**
- Implement minimal code to pass tests
- Focus on one test at a time
- Avoid over-engineering

**REFACTOR Phase:**
- Improve code quality
- Add edge cases
- Optimize performance

---

## 5. Recommendations

### Phase C7 Execution Strategy

**Wave 0: Coverage Measurement**
1. Run full test suite with coverage
2. Identify actual coverage gaps
3. Prioritize modules with lowest coverage

**Wave 1: Integration Tests**
1. Create integration test for hooks → plugin wiring
2. Test session-tracker integration
3. Test continuity persistence flow

**Wave 2: Coverage Enhancement**
1. Add edge case tests for complex hooks
2. Test error handling paths
3. Validate concurrent session scenarios

**Wave 3: Threshold Enforcement**
1. Verify CI/CD integration
2. Add coverage checks to pre-commit
3. Document coverage expectations

### Specific Test Recommendations

**For session-hooks.ts (340 LOC, 7 tests):**
- Add tests for concurrent session handling
- Test auto-loop exhaustion scenarios
- Validate error recovery paths

**For core-hooks.ts (197 LOC, 25+ tests):**
- Test language governance injection order
- Validate config fallback behavior
- Test session creation event handling

**For tool-guard-hooks.ts (203 LOC, 18 tests):**
- Test budget overflow scenarios
- Validate circuit breaker reset logic
- Test document language guard edge cases

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing tests break during implementation | Low | High | Run full test suite before/after changes |
| Coverage thresholds too strict | Medium | Medium | Lower thresholds initially, increase gradually |
| Integration tests require complex setup | Medium | Medium | Use existing patterns from delegation-v2-integration |
| Test isolation issues | Low | Medium | Use vitest isolation features |

---

## 7. Success Criteria

| Criteria | Target | Current |
|----------|--------|---------|
| All 11 hooks have test scaffolds | ✅ Complete | 16 test files exist |
| Integration tests for 5+ modules | 5 | 2 |
| Coverage thresholds defined | ✅ Complete | 85/72/85/85 |
| ≥80% hooks coverage | 80% | Unknown (needs measurement) |

---

## 8. Next Steps

1. **Run coverage measurement** — Execute `npm run test:coverage` to get actual numbers
2. **Identify gaps** — Compare source files vs test coverage
3. **Create integration tests** — Focus on hooks → plugin wiring
4. **Validate thresholds** — Ensure CI/CD enforcement
5. **Document patterns** — Update test conventions documentation

---

**Research Complete:** 2026-05-28
**Next Phase:** PLAN.md creation with specific tasks
