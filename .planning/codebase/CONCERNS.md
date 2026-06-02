# Codebase Concerns

> Generated: 2026-06-02
> Source: hm-codebase-mapper (concerns focus)
> Context: Hivemind runtime composition engine — 262 source files, 258 test files

---

## Table of Contents

1. [MODULE SIZE VIOLATIONS](#1-module-size-violations)
2. [TEST COVERAGE GAPS](#2-test-coverage-gaps)
3. [OPEN BUGS & FIX COMMENT MARKERS](#3-open-bugs--fix-comment-markers)
4. [TYPE SAFETY CONCERNS](#4-type-safety-concerns)
5. [ARCHITECTURAL VIOLATIONS](#5-architectural-violations)
6. [SECURITY CONCERNS](#6-security-concerns)
7. [ERROR HANDLING & RESILIENCE](#7-error-handling--resilience)
8. [DEPENDENCY & BUILD CONCERNS](#8-dependency--build-concerns)
9. [MAINTENANCE & TECHNICAL DEBT](#9-maintenance--technical-debt)
10. [PERFORMANCE BOTTLENECKS](#10-performance-bottlenecks)
11. [CQRS & SURFACE BOUNDARY CONCERNS](#11-cqrs--surface-boundary-concerns)
12. [CONFIGURATION & SCHEMA CONCERNS](#12-configuration--schema-concerns)
13. [CLI & BIN MAINTENANCE](#13-cli--bin-maintenance)
14. [RISK REGISTER](#14-risk-register)

---

## 1. MODULE SIZE VIOLATIONS

**Governance rule:** Max module size = 500 LOC. The following source files violate this limit:

| File | LOC | Over By |
|------|-----|---------|
| `src/tools/delegation/delegation-status.ts` | 780 | +280 |
| `src/plugin.ts` | 756 | +256 |
| `src/features/session-tracker/persistence/child-writer.ts` | 681 | +181 |
| `src/tools/session/execute-slash-command.ts` | 668 | +168 |
| `src/features/session-tracker/index.ts` | 636 | +136 |
| `src/coordination/delegation/coordinator.ts` | 561 | +61 |
| `src/features/tmux/tmux-multiplexer.ts` | 553 | +53 |
| `src/coordination/delegation/manager-runtime.ts` | 510 | +10 |
| `src/features/session-tracker/capture/tool-capture.ts` | 502 | +2 |

**Impact:**
- `delegation-status.ts` (780 LOC) is the largest module — a single tool file that handles status polling, list queries, find-stackable, and control actions. Should be decomposed into separate reader modules.
- `plugin.ts` (756 LOC) is the composition root — densely wires 80+ imports. This is the highest-risk file in the entire codebase. Any import chain breakage here cascades to the entire system.
- `child-writer.ts` (681 LOC) handles session-tracker child persistence. Complex write logic with dual-write pattern. Refactoring into reader/writer halves or dedicated orphan/backfill modules would reduce risk.

**Recommendation:** Decompose delegation-status.ts into `delegation-status-reader.ts` (status queries), `delegation-status-list.ts` (list/filter), `delegation-status-stack.ts` (find-stackable). Trim plugin.ts by extracting hook registration into dedicated `hook-registry.ts`.

---

## 2. TEST COVERAGE GAPS

### 2.1 No Test Coverage — High-Risk Areas

| Module | Risk Level | LOC | Notes |
|--------|-----------|-----|-------|
| `src/plugin.ts` | **CRITICAL** | 756 | Composition root — no direct tests |
| `src/hooks/lifecycle/core-hooks.ts` | **HIGH** | ~200 | Core lifecycle wiring — untested |
| `src/hooks/lifecycle/session-hooks.ts` | **HIGH** | 423 | Session lifecycle hooks — untested |
| `src/hooks/guards/tool-guard-hooks.ts` | **HIGH** | ~200 | Tool execution guards — untested |
| `src/hooks/composition/cqrs-boundary.ts` | **HIGH** | ~100 | CQRS boundary enforcement — untested |
| `src/coordination/delegation/manager.ts` | **HIGH** | 409 | DelegationManager class — untested |
| `src/coordination/delegation/state-machine.ts` | **HIGH** | 445 | State machine for delegation — untested |
| `src/coordination/delegation/manager-runtime.ts` | **HIGH** | 510 | Runtime manager — untested |
| `src/coordination/completion/detector.ts` | **HIGH** | ~150 | Completion detection — untested |
| `src/routing/session-entry/intake-gate.ts` | **HIGH** | ~200 | Session entry intake — untested |
| `src/routing/behavioral-profile/profiles.ts` | **MEDIUM** | ~100 | Profile definitions — untested |
| `src/config/compiler.ts` | **MEDIUM** | 410 | Config compilation — untested |
| `src/config/subscriber.ts` | **MEDIUM** | ~200 | Config subscriber — untested |

### 2.2 Schema-Kernel — Zero Test Coverage (15 files, 2,469 LOC)

Every file under `src/schema-kernel/` lacks dedicated tests:
- `hivemind-configs.schema.ts` (464 LOC) — largest schema file
- `agent-work-contract.schema.ts` (155 LOC)
- `agent-frontmatter.schema.ts` (168 LOC)
- `session-tracker.schema.ts` (141 LOC)
- `prompt-enhance.schema.ts` (169 LOC)
- 10 additional smaller schema files

**Risk:** Schema validation logic is the first line of defense for tool inputs. Without tests, schema changes can silently accept invalid data or reject valid data.

### 2.3 Feature Modules Without Test Directories

The following features have **no dedicated test directory**:

| Feature | Source Files | Risk |
|---------|-------------|------|
| `features/auto-loop/` | 2 files | MEDIUM |
| `features/background-command/` | 6 files | MEDIUM |
| `features/bootstrap/` | 8+ files | HIGH |
| `features/governance/` | 1 file | MEDIUM |
| `features/governance-engine/` | 4 files | HIGH |
| `features/prompt-packet/` | 2 files | LOW |
| `features/ralph-loop/` | 2 files | MEDIUM |
| `features/doc-intelligence/` | 3 files | MEDIUM |
| `features/tmux/` | 6 files | HIGH |
| `features/sdk-supervisor/` | 1 file | LOW |

### 2.4 Coordination Modules — Sparse Coverage

- `coordination/delegation/` — only `manager.ts` has a legacy test stub (`delegation-manager.test.ts` at 2,976 LOC — bloated, likely includes integration tests)
- `coordination/command-delegation/handler.ts` — NO tests
- `coordination/spawner/auto-loop.ts` — NO dedicated tests (auto-loop.test.ts exists in lib but may be incomplete)
- `coordination/sdk-delegation/handler.ts` — NO tests

### 2.5 Cli Module — Near Zero Coverage

- `cli/index.ts`, `cli/router.ts`, `cli/renderer.ts`, `cli/discovery.ts` — NO tests
- `cli/ui/prompts.ts` — NO tests
- `cli/commands/help.ts`, `init.ts`, `recover.ts`, `doctor.ts`, `version.ts` — NO tests

**Risk:** CLI is the user-facing surface. Untested CLI commands will produce confusing or broken UX errors.

### 2.6 Shared Utilities — Gap Files

- `shared/tool-helpers.ts` — NO tests
- `shared/errors/commands.ts` — NO tests

---

## 3. OPEN BUGS & FIX COMMENT MARKERS

### 3.1 BUG-5: Parent-Child Hierarchy Race Condition

**Location:** `src/features/session-tracker/tool-delegation.ts:283`
**File:** `src/features/session-tracker/persistence/session-index-writer.ts:222`

```
// BUG-5 FIX: Parent not yet in on-disk hierarchy (race between in-memory
// registration and filesystem flush)
```

**Severity:** MEDIUM-HIGH. A race condition exists where an L1 parent session may not yet be registered in the on-disk hierarchy when a child session attempts to write. The code appears to have a workaround, but the underlying race persists.

### 3.2 BUG-3: Child Session Response Capture Gap

**Location:** `src/features/session-tracker/tool-delegation.ts:343,359`

```
// BUG-3 FIX: Extract the child agent's final assistant response and append it
// BUG-3 FIX: Also append as a turn so lastMessage is set and the turn
```

**Severity:** MEDIUM. Child agent responses may not be properly captured in the turn history. The fix appends the response as a synthetic turn, which works but creates non-standard message structures that other parts of the system may not handle correctly.

### 3.3 Test File: Debug Log Left In

**Location:** `tests/tools/delegation-status.test.ts:160`
```
console.log("[DEBUG TEST RESULT]", result)
```

**Severity:** LOW. Stale debug logging in committed test file creates noise.

### 3.4 Test File: Documented Known Bug

**Location:** `tests/lib/notification-handler.test.ts:19`
```
*- Removes `appendPrompt` (BUG — pollutes user input)
```

**Severity:** MEDIUM. `appendPrompt` call removed due to input pollution bug. This means certain notifications may not be displayed.

---

## 4. TYPE SAFETY CONCERNS

### 4.1 `as unknown` Cast Patterns (27 occurrences)

The codebase uses `as unknown` type casts extensively, primarily when:
- Deserializing JSON from disk (`JSON.parse(...) as unknown`)
- Bridging SDK types that don't match exactly
- Working with `readdir` directory entries

**Risk:** These casts bypass TypeScript's type safety entirely. A schema change in the serialized data will not be caught at compile time.

**High-risk locations:**
- `src/task-management/continuity/index.ts:275` — `JSON.parse(raw) as unknown` — continuity data deserialization
- `src/task-management/trajectory/ledger.ts:48` — `JSON.parse(...) as unknown` — trajectory data deserialization
- `src/config/workflow/workflow-persistence.ts:113` — workflow state deserialization
- `src/shared/workspace-runtime-policy.ts:32` — policy deserialization
- `src/shared/session-api.ts:173` — SDK response parsing
- `src/features/session-tracker/persistence/hierarchy-index.ts:99` — fs directory entry casting

### 4.2 `as Record<string, unknown>` Usage (8+ locations)

Pattern where input objects are force-cast to generic record types, losing all structural type information. Found in:
- `src/features/session-tracker/tool-delegation.ts`
- `src/features/session-tracker/child-recorder.ts`
- `src/features/session-tracker/capture/tool-capture.ts`
- `src/features/session-tracker/capture/child-backfiller.ts`
- `src/tools/session/execute-slash-command.ts`
- `src/tools/hivemind/hivemind-session-view.ts`

### 4.3 Unused/unknown Parameters in catch blocks

126 `catch` blocks across the codebase, many using generic `catch (err)` without proper error type narrowing. Several patterns observed:
- Generic `catch (err)` without type guard — **93 occurrences**
- `catch (caughtError: unknown)` — better pattern, **20 occurrences**
- `catch (error)` — generic **5 occurrences**
- `catch (e)` — least descriptive **5 occurrences**

---

## 5. ARCHITECTURAL VIOLATIONS

### 5.1 Plugin.ts Import Hub (80 imports)

`plugin.ts` imports from 16 different modules across 6 top-level directories. This creates an implicit dependency hub pattern:
- 30+ coordination imports
- 12+ tool registrations
- 10+ hook registrations
- 10+ feature imports
- 8+ shared utility imports
- 5+ routing imports

**Risk:** The plugin.ts file is a single point of failure. Any import error, circular dependency, or module resolution failure will prevent the entire plugin from loading.

### 5.2 Module Size Governance Violation

The 500-LOC maximum module size rule is violated by 9 modules (see Section 1). The largest module (delegation-status.ts at 780 LOC) is 56% over the limit.

### 5.3 No Explicit Circular Dependency Detection

No `madge` or similar circular dependency checking tool is configured in the build pipeline. With 80 imports flowing through plugin.ts, circular dependencies can sneak in undetected.

---

## 6. SECURITY CONCERNS

### 6.1 Path Traversal Protection — Single Point of Validation

**Location:** `src/shared/security/path-scope.ts`

Only one module handles path traversal security. Any code path that bypasses `path-scope.ts` can write to arbitrary filesystem locations.

### 6.2 Untrusted Input in Tool Parameters

The following tools accept user-controlled input that flows into filesystem operations:
- `configure-primitive.ts` — accepts file path, content, spec data
- `bootstrap-init.ts` / `bootstrap-recover.ts` — accept scope and config
- `execute-slash-command.ts` — passes arguments to shell commands

These are validated through Zod schemas and the path-scope module, but the defense chain relies on correct wiring, which is not tested for every tool.

### 6.3 Governance Session — Injection Surface

**Location:** `src/features/governance-engine/create-governance-session.ts:117`
```
// any injection vectors in git commit messages or session titles.
```
The code acknowledges potential injection vectors but relies on manual review rather than automated sanitization.

### 6.4 Redaction Module — Limited Coverage

**Location:** `src/shared/security/redaction.ts`

The redaction module exists but its coverage of sensitive data patterns is unknown. API keys, tokens, and secrets could leak in tool responses if the redaction patterns are incomplete.

### 6.5 No Security Audit Pipeline

No automated security scanning (SAST, dependency scanning) is configured in the build pipeline.

---

## 7. ERROR HANDLING & RESILIENCE

### 7.1 Dual-Write Pattern — Silent Failures

**Locations:** `continuity/index.ts`, `delegation-persistence.ts`

The dual-write pattern (continuity + session-tracker) uses `console.warn` for failures rather than propagating errors:
```
console.warn(`[Harness] patchSessionContinuity dual-write error for ${sessionID}: ...`)
console.warn(`[Harness] patchSessionContinuity dual-write: skipping session-tracker write for ${sessionID}: ...`)
```

**Risk:** Silent dual-write failures mean session state can become inconsistent between the two persistence layers without the caller knowing.

### 7.2 Catch Block Proliferation

The codebase has 126 catch blocks, indicating a defensive error-handling culture. While this prevents crashes, the high count suggests:
- Many operations can fail in unexpected ways
- Error recovery strategies are inconsistent
- Some catch blocks may be swallowing legitimate errors

### 7.3 Retry Handler Exists But Usage Is Sparse

**Location:** `src/coordination/delegation/retry-handler.ts`

A dedicated retry handler exists but many files (especially persistence writers) implement their own error handling rather than using the centralized retry mechanism.

### 7.4 PTY Graceful Fallback — Untested

The PTY module gracefully falls back to `node:child_process` when `bun-pty` is unavailable. This fallback path has no dedicated tests, so breakage in the fallback scenario would go undetected.

---

## 8. DEPENDENCY & BUILD CONCERNS

### 8.1 Optional Dependencies — Runtime Risk

7 optional dependencies are listed but may not be installed:
- `@json-render/core`, `@json-render/ink`, `@json-render/next`, `@json-render/react`, `@json-render/react-pdf` — sidecar/Dashboard GUI
- `bun-pty` — PTY support (Bun-only, graceful fallback to Node)
- `react` — sidecar rendering engine

**Risk:** The sidecar GUI is entirely non-functional if these optional dependencies fail to install. This is a degraded-user-experience concern rather than a crash risk.

### 8.2 No Lockfile in CI

No lockfile is checked into the repository. Different installs can produce different dependency trees, leading to "works on my machine" issues.

_(Correction: package-lock.json exists — verified. But no CI pipeline is visible to enforce lockfile consistency.)_

### 8.3 Peer Dependency Version Constraint

`@opencode-ai/plugin: ^1.15.10` as a peer dependency means host applications must provide this exact range. Version mismatches will cause runtime failures that may be hard to diagnose.

### 8.4 Build Script Complexity

The build command chains four operations:
```
npm run clean && node scripts/sync-assets.js && tsc && node dist/schema-kernel/generate-config-json-schema.js
```

**Risk:** Build failures in `sync-assets.js` will prevent TypeScript compilation, mixing asset generation with compilation concerns.

---

## 9. MAINTENANCE & TECHNICAL DEBT

### 9.1 Asset Sync — Dual Maintenance Surface

**File:** `scripts/sync-assets.js`

Assets are authored in `assets/` and synced to `.opencode/` via `scripts/sync-assets.js`. This creates a source-of-truth mirror pattern that requires discipline:
- Direct edits to `.opencode/` can be overwritten by the sync script
- User-modified files are backed up (`.backup`), but the backup accumulation is not cleaned up

### 9.2 Session Tracker Module — Largest Feature (35 files)

The session-tracker feature has 35 source files making it the largest single module. Its internal structure includes:
- 6 capture/handler files (event handling chain)
- 5 persistence files (dual-write system)
- 3 recovery files (orphan cleanup, session recovery)
- Auxiliary files (classification, bootstrap, router, etc.)

**Risk:** The session-tracker has grown organically. The handler chain (events → handlers → persistence) is complex and hard to reason about.

### 9.3 Unconventional Test Directory Layout

Tests are split between `tests/lib/`, `tests/tools/`, and partially under `tests/features/`. This differs from the source structure (mirroring `src/`), making it harder to find tests for a given source module.

### 9.4 Legacy Test File Stubs

Some test files appear to be legacy stubs or migrated tests:
- `tests/lib/delegation-manager.test.ts` at 2,976 LOC — likely includes integration tests in a unit test file
- `tests/hooks/create-core-hooks.test.ts` at 1,116 LOC — may duplicate test coverage from `tests/lib/`

### 9.5 Stale Console.log References in JSDoc

Multiple JSDoc `@example` blocks contain `console.log()` calls that would not be compiled out in production. Examples in:
- `schema-kernel/hivemind-configs.schema.ts`
- `schema-kernel/generate-config-json-schema.ts`
- `features/doc-intelligence/parser.ts`
- `features/bootstrap/primitive-registry.ts`
- `features/bootstrap/control-plane/gatekeeper.ts`
- `config/subscriber.ts`
- `tools/config/bootstrap-init.ts`
- `tools/config/bootstrap-recover.ts`

### 9.6 Unversioned Agent/Skill Count Tracking

- 75 agents, 34 non-GSD skills, 19 commands are tracked in AGENTS.md
- Counts are manually maintained and can drift from actual files on disk
- No automated audit verifies these counts match reality

---

## 10. PERFORMANCE BOTTLENECKS

### 10.1 Synchronous JSON Parsing on Read Path

**Locations:**
- `continuity/index.ts:275` — `JSON.parse(readFileSync(...))` — blocking on every continuity read
- `trajectory/ledger.ts:48` — synchronous JSON parse
- `workspace-runtime-policy.ts:32` — synchronous JSON parse
- `workflow/workflow-persistence.ts:113` — synchronous JSON parse

**Impact:** Synchronous file I/O on the read path can block the event loop, especially under load (multiple concurrent session queries).

### 10.2 Serialized I/O in Session Tracker

Session tracker persistence uses sequential async writes with `await` chaining. Concurrent initialization of multiple sessions must wait for each other's I/O to complete.

### 10.3 No Caching Layer for Continuity Reads

**Location:** `src/task-management/continuity/index.ts`

Every continuity read goes through `readFileSync` on a JSON file. The in-memory `Map` cache does not persist across restarts (separation of concerns design), but there is no read-through cache for frequently accessed sessions.

### 10.4 Large Module Load Times

Modules exceeding 500 LOC (particularly `delegation-status.ts` at 780 LOC and `plugin.ts` at 756 LOC) take longer to parse and JIT-compile, increasing cold-start time.

---

## 11. CQRS & SURFACE BOUNDARY CONCERNS

### 11.1 CQRS Boundary Module — Untested

**File:** `src/hooks/composition/cqrs-boundary.ts`

The CQRS boundary enforcement module exists but has no tests. It is impossible to verify that the boundary rules are actually being enforced.

### 11.2 Mix of Read and Write in Same Modules

Several modules mix read and write operations in the same class/file:
- `continuity/index.ts` — both reads (`getSessionContinuity`) and writes (`recordSessionContinuity`, `patchSessionContinuity`)
- `child-writer.ts` — primarily writes, but also reads existing state
- `delegation-persistence.ts` — dual read/write in same file

### 11.3 Observer-Transform Overlap in Hooks

The hooks system has both observers (`.on()` handlers) and transforms (`.transform()` handlers). The separation is documented but the actual responsibilities overlap in some places (e.g., `session-tracker-consumer.ts` acts as both observer and implicit state writer).

---

## 12. CONFIGURATION & SCHEMA CONCERNS

### 12.1 Schema-Kernel Is Untested (15 Files, 2,469 LOC)

(Detailed in Section 2.2) — the entire schema validation layer lacks test coverage.

### 12.2 Config Precedence — Stringly-Typed

**File:** `src/schema-kernel/config-precedence.schema.ts`

Config precedence levels are validated as "any non-empty string." This means invalid precedence values are not caught at schema level, only at usage time.

### 12.3 Config Compiler — 410 LOC Untested

**File:** `src/config/compiler.ts`

Config compilation from multiple sources (files, environment, defaults) is a critical path with no direct tests.

---

## 13. CLI & BIN MAINTENANCE

### 13.1 CLI Commands — No Test Coverage

All 5 CLI commands (`help`, `init`, `recover`, `doctor`, `version`) have zero test coverage. CLI bugs will manifest as user-facing failures.

### 13.2 CLI Router — No Tests

**File:** `src/cli/router.ts`

The CLI routing logic that directs command parsing to the appropriate handler is untested.

### 13.3 Bin Files — 4 Executables

4 bin entry points exist. Their startup behavior (argument parsing, error handling, version checks) is not tested.

---

## 14. RISK REGISTER

| Risk ID | Description | Severity | Likelihood | Impact | Mitigation |
|---------|-------------|----------|------------|--------|------------|
| R-01 | plugin.ts composition root failure | CRITICAL | LOW | Total plugin failure — no system loads | Add integration test; extract hook registry |
| R-02 | Session continuity dual-write silent data loss | HIGH | MEDIUM | Partial session state loss | Promote console.warn to structured error propagation |
| R-03 | BUG-5 hierarchy race condition | HIGH | MEDIUM | Orphan child sessions | Add filesystem flush wait; integration test |
| R-04 | BUG-3 child response capture gap | MEDIUM | MEDIUM | Incomplete child session journals | Standardize synthetic turn format |
| R-05 | Schema-kernel untested validation | HIGH | MEDIUM | Silent data corruption on schema changes | Add schema validation unit tests |
| R-06 | `as unknown` casts bypass type safety | MEDIUM | HIGH | Runtime crashes from shape mismatches | Add Zod runtime validation at deserialization points |
| R-07 | Sidecar GUI silently broken (optional deps) | LOW | MEDIUM | GUI non-functional for some users | Document optional dependency requirements clearly |
| R-08 | Error swallowing in 126 catch blocks | MEDIUM | HIGH | Hard-to-diagnose production failures | Audit catch blocks; implement error aggregation |
| R-09 | No circular dependency detection | MEDIUM | MEDIUM | Import cycles causing runtime errors | Add madge/DPAT to CI pipeline |
| R-10 | CLI untested (5 commands) | MEDIUM | HIGH | User-facing CLI failures | Add CLI integration tests |
| R-11 | PTY graceful fallback untested | MEDIUM | LOW | Broken Node.js fallback path | Test fallback on Node.js runtime |
| R-12 | Redaction module coverage unknown | MEDIUM | MEDIUM | Sensitive data leakage | Audit redaction patterns; add coverage tests |
| R-13 | Session-tracker organic growth (35 files) | MEDIUM | HIGH | Hard to maintain, refactor risk high | Decompose into bounded sub-modules |
| R-14 | Module size violations (9 files) | LOW | HIGH | Maintainability degradation | Decompose largest modules |
| R-15 | Stale JSDoc console.log references | LOW | HIGH | Confusing code examples | Clean up JSDoc examples |
| R-16 | Agent/skill count drift from AGENTS.md | LOW | HIGH | Documentation inaccuracy | Add automated count verification |

---

## Scoring Summary

| Category | Score (1-5, 5=worst) | Trend |
|----------|----------------------|-------|
| Module Size Governance | 4 (9 violations) | ↑ Worsening |
| Test Coverage | 4 (large untested areas) | → Stable |
| Type Safety | 3 (heavy `as unknown` usage) | → Stable |
| Error Handling | 3 (126 catch blocks) | → Stable |
| Security | 2 (basic protections exist) | → Stable |
| Performance | 2 (sync I/O concerns) | → Stable |
| Documentation Hygiene | 3 (stale examples, drift) | → Stable |
| Build/CI | 2 (no CI visible) | → Stable |

**Overall Health:** MODERATE — functional but with significant areas of technical debt and risk that need structured remediation.

---

## Immediate Action Items

1. **HIGH** — Add integration test for `plugin.ts` to verify all 80 imports resolve correctly
2. **HIGH** — Decompose `delegation-status.ts` (780 LOC) into separate reader modules
3. **HIGH** — Address BUG-5 race condition with proper filesystem flush synchronization  
4. **HIGH** — Add schema-kernel unit tests (15 files, 2,469 LOC uncovered)
5. **MEDIUM** — Audit all `as unknown` casts and replace with Zod runtime validation
6. **MEDIUM** — Add circular dependency detection to build pipeline
7. **MEDIUM** — Standardize catch block error handling patterns
8. **MEDIUM** — Add CLI command integration tests
9. **LOW** — Clean up stale JSDoc console.log references
10. **LOW** — Add automated agent/skill count verification to sync-assets script
