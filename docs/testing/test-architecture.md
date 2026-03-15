# Test Architecture — 2.9.5

## Overview

58 tests across 20 test files verify all layers of the SDK-native architecture.

## Test Infrastructure

| Module | Location | Purpose |
|--------|----------|---------|
| `mock-sdk.ts` | `tests/helpers/` | Mock `PluginInput`, `client`, spy tracking for `showToast`/`appLog` |
| `mock-paths.ts` | `tests/helpers/` | Temporary `.hivemind` project roots with cleanup |
| `mock-tools.ts` | `tests/helpers/` | Tool suite factories bound to test roots, `executeAndParse` |
| `index.ts` | `tests/helpers/` | Barrel export for all helpers |

## Test Categories

### Tool Tests (24 tests)
- **`tool-contract.test.ts`** (8) — Shape compliance, JSON output, schema presence
- **`tool-helpers-dedup.test.ts`** (16) — Shared helper behavior, no duplication in tool files
- **`task-tool.test.ts`** (1) — Full task lifecycle CRUD

### Hook Tests (5 tests)
- **`soft-governance.test.ts`** (3) — Toast emission, throttling, no-client fallback
- **`runtime-hook-hierarchy.test.ts`** (2) — Hook bridge ordering, stage derivation

### Core State Tests (7 tests)
- **`trajectory-ledger.test.ts`** (2) — Ledger bootstrap, active/closed management
- **`trajectory-tool.test.ts`** (1) — Full trajectory lifecycle
- **`workflow-authority.test.ts`** (2) — Bootstrap, repair
- **`workflow-task-lifecycle.test.ts`** (2) — Task rotation, verification flow

### Plugin & Runtime Tests (10 tests)
- **`plugin-assembly-smoke.test.ts`** (4) — Assembly-only, exports, hooks, tools
- **`runtime-tools.test.ts`** (2) — Surface registry, tool execution
- **`control-plane-runtime-tools.test.ts`** (2) — Runtime command/status
- **`runtime-entry-attachment.test.ts`** (2) — Asset sync, plugin re-export

### Framework Tests (6 tests)
- **`agent-boundary-policy.test.ts`** (4) — Agent YAML, scope rules, mirror parity
- **`local-charter-coverage.test.ts`** (1) — Sector AGENTS.md presence
- **`delegation-packet.test.ts`** (1) — Delegation binding structure

### Shared Tests (17 tests)
- **`paths.test.ts`** (2) — `getEffectivePaths` authority, wrapper alignment
- **`sdk-context.test.ts`** (15) — Init/reset/withClient lifecycle
- **`trajectory-governance-projection.test.ts`** (1) — Planning SOT projection

## Running Tests

```bash
# Full gate (recommended)
npx tsc --noEmit && npm run lint:boundary && npx tsx --test tests/*.test.ts

# Single file
npx tsx --test tests/tool-contract.test.ts

# Specific category
npx tsx --test tests/tool-*.test.ts tests/task-*.test.ts
```

## Test Patterns

1. **Mock isolation** — Every test uses `createTestProjectRoot()` for filesystem isolation
2. **Spy tracking** — `mockPluginInput().spies` captures SDK calls for assertion
3. **JSON round-trip** — Tool outputs are `JSON.parse`'d and structurally validated
4. **No test interdependence** — Each test manages its own state and cleanup
