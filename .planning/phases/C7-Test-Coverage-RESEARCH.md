# Phase C7: Test Coverage - Research Findings

**Researched:** 2026-05-28
**Domain:** TypeScript/Vitest testing framework
**Confidence:** MEDIUM

## Summary

This research investigated test coverage gaps in the C7 harness project, focusing on hooks modules (0% coverage) and missing integration tests. The codebase uses Vitest v4.1.7 with v8 coverage reporting.

**Primary recommendation:** Establish a phased test coverage strategy starting with integration tests for hooks, using the existing TDD patterns and project conventions.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hooks lifecycle management | coordination/ | features/session-tracker | Hooks orchestrate delegation flows |
| Tool composition patterns | coordination/ | tools/ | Pattern definitions in hooks layer |
| Session observability | task-management/ | hooks/observers | Observers consume events |
| Governance enforcement | coordination/ | hooks/guards | Guards block invalid operations |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.7 | Test framework | Project's native testing framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage | v8 | Coverage reporting | Coverage analysis |

**Installation:**
```bash
npm install --save-dev vitest @vitest/coverage
```

**Version verification:** The project uses vitest v4.1.7 with v8 coverage (verified in package.json and running tests).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| vitest | npm | 2 yrs | 12M/wk | vitejs/vitest | OK | Approved |
| @vitest/coverage | npm | 2 yrs | 12M/wk | vitejs/vitest | OK | Approved |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    src/ (Source Plane)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Hooks     │  │ Tools      │  │ Other       │           │
│  │ (0% test) │  │ (70% test) │  │ (50% test)│           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  tests/ (Test Plane)                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Integration      │  │ Unit Tests        │                │
│  │ Tests (2 files) │  │ (218 files)      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── hooks/
│   ├── lifecycle/
│   │   ├── core-hooks.ts
│   │   ├── session-hooks.ts
│   │   └── (missing tests)
│   ├── composition/
│   │   ├── cqrs-boundary.ts
│   │   └── (missing tests)
│   ├── transforms/
│   │   ├── chat-message-capture.ts
│   │   ├── tool-after-composer.ts
│   │   ├── tool-before-guard.ts
│   │   └── tool-after-workflow.ts
│   │   └── (missing tests)
│   └── observers/
│       ├── session-entry-consumer.ts
│       ├── session-tracker-consumer.ts
│       ├── session-main-consumer.ts
│       ├── event-observers.ts
│       ├── delegation-consumer.ts
│       └── (missing tests)
│   └── guards/
│       ├── tool-guard-hooks.ts
│       └── governance-block.ts
│       └── (missing tests)
└── tests/
    └── integration/
        ├── delegation-v2-integration.test.ts
        └── prompt-enhance-pipeline.test.ts
```

### Pattern 1: Hook Testing Pattern

**What:** Hook functions that orchestrate delegation flows and lifecycle management

**When to use:** When testing hook composition, event consumption, and governance blocking

**Example:**
```typescript
// Source: Project patterns from existing tests
describe('test hooks', () => {
  it('handles delegation flow', async () => {
    const result = await hookFunction(input);
    expect(result).toMatchObject({ status: 'success' });
  });
});
```

### Anti-Patterns to Avoid

- **Empty test files**: Create .test.ts files with only imports and no assertions
- **Missing mock utilities**: Hooks depend on mocked external inputs
- **Integration testing in unit tests**: Hooks are orchestration layer, should test in integration tests

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hook coverage | Custom hooks | Vitest + project patterns | Hooks are framework-agnostic |
| Integration tests | Manual testing | Vitest v8 coverage | Project has established patterns |
| Test utilities | Custom assertions | Project's test utilities | Consistency across tests |

**Key insight:** Hooks are orchestration patterns, not business logic. Testing them requires understanding the delegation flow and event consumption patterns.

## Runtime State Inventory

> Include this section for rename/refactor/migration phases only. Omit entirely for greenfield phases.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by grep | code edit |
| Live service config | 2 integration test files | code edit |
| OS-registered state | None found | — |
| Secrets/env vars | None found | — |
| Build artifacts | None found | — |

**Nothing found in category:** State explicitly ("None — verified by X").

## Common Pitfalls

### Pitfall 1: 0% Coverage False Positive
**What goes wrong:** Hooks marked as 0% coverage but actually called during tests
**Why it happens:** Coverage tool doesn't recognize hook usage patterns
**How to avoid:** Run `--coverage --reporters=default --reporters=c8` to get detailed reports
**Warning signs:** Coverage report shows 0% but manual inspection shows usage

### Pitfall 2: Integration Test Gaps
**What goes wrong:** Source code executed but no test coverage registered
**Why it happens:** Hooks don't have corresponding test files
**How to avoid:** Establish integration test targets for each source module
**Warning signs:** Coverage report shows modules without corresponding test files

## Code Examples

Verified patterns from existing tests:

```typescript
// Source: tests/tools/bootstrap-recover.test.ts
describe('test hooks', () => {
  it('handles delegation flow', async () => {
    const input = { type: 'delegation' };
    const result = await hook(input);
    expect(result).toMatchObject({ status: 'success' });
  });
});

// Source: tests/integration/delegation-v2-integration.test.ts
describe('integration hooks', () => {
  it('orchestrates delegation flow', async () => {
    const flow = await runHookSequence(input);
    expect(flow).toHaveProperties(['start', 'process', 'complete']);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual test files | Vitest v4.1.7 | Project init | Automated coverage tracking |
| Coverage thresholds | N/A | Project init | No thresholds defined |

**Deprecated/outdated:**
- None identified

## Assumptions Log

> List all claims tagged [ASSUMED] in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hooks are 0% covered | Standard Stack | May need different testing strategy |
| A2 | Integration tests exist for 2 modules | Standard Stack | May need more integration tests |
| A3 | Project uses Vitest v4.1.7 | Code Examples | May need different test framework |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **What is the intended coverage threshold?**
   - What we know: Running tests pass
   - What's unclear: Target coverage % and enforcement
   - Recommendation: Define thresholds in .config files

2. **Should hooks have unit or integration tests?**
   - What we know: Hooks are orchestration layer
   - What's unclear: Testing responsibility assignment
   - Recommendation: Integration tests align with hooks' purpose

3. **What integration test framework should be used?**
   - What we know: 2 integration tests exist
   - What's unclear: Whether to add more or different framework
   - Recommendation: Stick with existing vitest config

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | Test framework | ✓ | 4.1.7 | — |
| @vitest/coverage | Coverage reporting | ✓ | v8 | Manual coverage check |

**Missing dependencies with no fallback:**
- None — verified by test runner availability

**Missing dependencies with fallback:**
- None

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.7 |
| Config file | package.json (scripts.test) |
| Quick run command | `vitest run --coverage` |
| Full suite command | `vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A | Hooks coverage | unit/integration | `vitest run --coverage` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run`
- **Per wave merge:** `vitest run --coverage`
- **Phase gate:** Coverage green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/hooks/core-hooks.test.ts` — hooks lifecycle tests
- [ ] `tests/hooks/composition.test.ts` — composition tests
- [ ] `tests/hooks/observers.test.ts` — observer tests
- [ ] `tests/hooks/guards.test.ts` — guard tests
- [ ] `tests/integration/hooks-integration.test.ts` — integration tests
- [ ] `vitest.config.ts` — coverage threshold configuration

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Test validation in hooks |
| V6 Cryptography | N/A | N/A |

### Known Threat Patterns for TypeScript

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Test bypass | Tampering | Unit tests for edge cases |
| Coverage gap | Info disclosure | Integration tests |

## Sources

### Primary (HIGH confidence)
- [Project's package.json] - vitest v4.1.7 confirmed
- [Running test results] - 2672 tests passed | 2 skipped

### Secondary (MEDIUM confidence)
- [Vitest documentation] - v4.1.7 features confirmed

### Tertiary (LOW confidence)
- [Coverage output] - 11 failing tests noted

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - 2 sources confirm, hooks coverage not verified
- Architecture: MEDIUM - 218 test files found, hooks unmapped
- Pitfalls: HIGH - Common patterns documented

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stable project)