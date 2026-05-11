---
name: stack-l3-vitest
version: 4.1.0
description: Vitest testing framework API reference, patterns, and harness-specific testing conventions
category: stack
triggers:
  - vitest
  - test
  - describe
  - expect
  - "vi.mock"
  - "vi.fn"
  - coverage
  - unit test
  - integration test
  - mock
  - spy
  - benchmark
  - snapshot
  - fixture
  - beforeEach
  - afterEach
  - beforeAll
  - afterAll
  - vitest.config
  - test.extend
metadata:
  layer: "3"
  role: "reference"
  lineage: "stack"
---

# Stack: Vitest

> Vitest 4.x — Next-generation testing framework powered by Vite.

## Quick Reference

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

## Navigation

| Topic | File | What You'll Find |
|-------|------|-----------------|
| Assertions | `references/api/assertions.md` | `expect()` + all matchers |
| Mocking & Spying | `references/api/mocking.md` | `vi.mock`, `vi.fn`, `vi.spyOn`, timers, globals |
| Lifecycle | `references/api/lifecycle.md` | `describe`, `it`, `test`, hooks, modifiers |
| Configuration | `references/api/configuration.md` | `vitest.config.ts` options |
| Coverage | `references/api/coverage.md` | V8/Istanbul providers, thresholds, reports |
| Testing Patterns | `references/patterns/testing.md` | Harness-specific test structures |
| Mocking Patterns | `references/patterns/mocking.md` | SDK, delegation, continuity mocking |
| TOC | `TOC.md` | Full table of contents |

## Key Facts

- **Runtime:** Node.js >= 18, Vite-powered transform pipeline
- **Globals mode:** Off by default; enable via `globals: true` in config
- **Jest compatibility:** ~95% API compatible; `jest.fn()` → `vi.fn()`
- **Coverage providers:** `v8` (fast, native) or `istanbul` (instrumented)
- **Browser mode:** Stable since 4.0 (Playwright-managed)
- **New in 4.x:** `aroundEach`/`aroundAll` hooks, `test.describe`/`test.suite`, `toMatchScreenshot()`

## Commands

```bash
npx vitest                    # Watch mode
npx vitest run                # Single run (CI)
npx vitest run --coverage     # With coverage
npx vitest run -t "pattern"   # Run matching tests
npx vitest --ui               # Browser UI
npx vitest bench              # Run benchmarks
```

## This Project's Setup

```typescript
// vitest.config.ts — this project uses:
// - vitest globals: true (no imports needed)
// - coverage provider: v8
// - test location: tests/lib/**, tests/tools/**
// - src coverage: src/**/*.ts (excludes index.ts)
```

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Testing OpenCode plugin tools | `stack-opencode` | ToolContext mock setup, ToolResult shape |
| Testing Zod schemas | `stack-zod` | Schema validation edge cases, v4 migration |
| Test-driven development workflow | `hm-test-driven-execution` | RED/GREEN/REFACTOR cycle patterns |
| Next.js component testing | `stack-nextjs` | Server component mocking, route handler testing |

---

*Stack reference for Vitest 4.x. See `TOC.md` for full navigation.*

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 4.1.0) — Vitest releases every 2-4 weeks; the reference may lag.
2. **Verify against official docs:** https://vitest.dev or `npx --yes ctx7 library vitest "migration guide"`.
3. **Check installed version:** `npx vitest --version` for the project's Vitest version.
4. **New 4.x features** (`aroundEach`/`aroundAll`, `test.describe`, `toMatchScreenshot()`) may have evolved since this reference — check the Vitest changelog if behavior differs.

### When Unsure About API Accuracy
1. **Corroborate with source:** `npx vitest --api` for CLI options, or check TypeScript definitions via `node_modules/vitest/dist/index.d.ts`.
2. **Check bundled references** (`references/api/assertions.md`, `references/api/mocking.md`) — extracted from 4.1.0 behavior.
3. **Project-specific setup (lines 74-80) is static:** If the project's `vitest.config.ts` has been modified, the reference may not reflect current configuration.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-vitest reference (v4.1.0) documents [specific API]. Your project uses Vitest [X.Y.Z] — the API may differ."
2. **Offer verification:** Check the Vitest changelog at https://github.com/vitest-dev/vitest/releases.
3. **Do not override:** The user's `vitest.config.ts` and installed version have final authority.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes v3→v4 migration, browser mode configuration, sharding strategy, snapshot management best practices, V8 vs Istanbul coverage tradeoffs, mock hoisting behavior, and `test.extend` fixture patterns.
2. **Search bundled references** (`references/patterns/testing.md`, `references/patterns/mocking.md`) — project-specific patterns may cover common edge cases.
3. **Check GitHub issues:** `vitest-dev/vitest` for known bugs and workarounds.
4. **Escalate to skill maintainer:** File an update request with version, test configuration, and failing scenario.
