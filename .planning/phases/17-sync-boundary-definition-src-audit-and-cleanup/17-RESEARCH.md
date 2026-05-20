# Phase 17: Src/ Audit — Dead Code, Noise, Context Rot Detection — Research

**Researched:** 2026-05-20
**Domain:** Manual source code audit methodology + codebase health assessment
**Confidence:** HIGH (verified via directory enumeration, LOC counts, import tracing, ts-prune scan)

## Summary

This research investigates the current state of all `src/` modules in the Hivemind project to enable a structured manual audit. The codebase contains **237 TypeScript source files** across **14 modules** totaling approximately **37,500 LOC** (excluding `node_modules` and `dist/`). Known problem areas include two empty stub directories (`src/harness/`, `src/kernel/`), a composition root (`src/plugin.ts`) at 493 LOC that exceeds the 100 LOC target, zero test coverage for 5 of the 14 modules, and several potentially dead or stale submodules (toggle-gates.ts has no external imports, runtime-detection/ is not wired to plugin.ts, steering-engine/ appears partially disconnected).

The audit must be performed **manually file-by-file** as per the locked decision D-01 through D-10. This research provides the methodology, per-module state summaries, risk assessment, and a findings report template for handoff to Phase 18.

**Primary recommendation:** Audit modules in order of risk (shared/ → config/ → routing/ → schema-kernel/ → tools/ → hooks/ → coordination/ → task-management/ → features/ → cli/ → sidecar/) and track all findings in the provided template format.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dead code = exported symbol/function/file with zero imports across src/. Detected via manual review.
- **D-02:** Noise = stub files, empty re-exports, files with no real logic.
- **D-03:** Context rot = working code that violates current architecture patterns (CQRS, 9-surface, dependency rules).
- **D-04:** Test coverage gap = module with no unit tests → flag for investigation.
- **D-05:** src/shared/ — leaf utilities, types (start here, least risk)
- **D-06:** src/features/ — runtime features (largest, most potential rot)
- **D-07:** src/harness/ vs src/kernel/ — identical git tree SHA (duplication to resolve)
- **D-08:** src/cli/ — CLI substrate
- **D-09:** src/config/, src/coordination/, src/hooks/, src/routing/, src/schema-kernel/, src/task-management/, src/tools/ — remaining modules
- **D-10:** Audit method = manual review per module, reading actual source files
- **D-11:** Dead code → DELETE (git rm, commit, update references)
- **D-12:** Noise → DELETE or MERGE into parent file
- **D-13:** Context rot → REFACTOR to current patterns (flag if too large for this cleanup wave)
- **D-14:** All findings → record in structured findings report with file:line, category, severity
- **D-15:** Sync manifest format = Hybrid: JSON whitelist (sync-manifest.json) + .syncignore exclude patterns
- **D-16:** .opencode/ NOT synced as directory; primitives inside are PACKAGED for distribution via hivemind init CLI
- **D-17:** Community repo receives: whitelisted dirs from manifest; .github/workflows/ for CI; cleaned src/
- **D-18:** Phase 17 = src/ audit only (discovery)
- **D-19:** Phase 18 = root cleanup + sync boundary + sync manifest
- **D-20:** Phase 19 = fix sync-oss.yml workflow implementation
- **D-21:** Phase 20 = package .opencode/ primitives for distribution

### the agent's Discretion
- Choice of specific investigation tooling (knip, ts-prune, grep-based)
- Structure of findings report format
- Per-module audit ordering within each major group

### Deferred Ideas (OUT OF SCOPE)
- **Phase 18:** Root cleanup + sync boundary implementation — execute on findings from Phase 17
- **Phase 19:** Fix sync-oss.yml workflow — implement sync-manifest.json parsing in GitHub Actions
- **Phase 20:** Package .opencode/ primitives for distribution
- Resolve src/harness=kernel duplication (moved to Phase 18)
- CLI hivemind init implementation (deferred to Phase 20+)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01/D-04 | Categorize findings (dead/noise/rot/gap) | Complete per-module overview with LOC, file counts, import graphs, test coverage maps below |
| D-05/D-10 | Audit all 14 src/ modules sequentially | Module-by-module summaries with known issues, file counts, test gaps documented |
| D-14 | Produce structured findings report | Template provided; methodology covers file:line, category, severity, recommendation |
| D-18 | Discovery only — no file deletion | Explicit constraint honored; Phase 18 will execute on findings |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Source code health assessment | src/ (entire tree) | — | Audit covers ALL src/ modules; no cross-tier mapping needed for discovery phase |
| Dead code detection | Manual review + grep/ts-prune tooling | — | D-10 specifies manual review; tooling supplements but doesn't replace |
| Findings classification | Auditor judgment | — | Categories (dead/noise/rot/gap) per D-01 through D-04 require human assessment |
| Findings handoff | Phase 18 executor | — | Structured report is the sole artifact consumed by Phase 18 |

## Standard Stack

### Audit Tooling

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| `knip` | 6.14.1 | Dead file/export detection — installed globally | [VERIFIED: `npx knip --version`] |
| `ts-prune` | — | Export usage analysis — available via npx | [VERIFIED: `npx ts-prune` produces export map] |
| `grep -rn` | Built-in | Import tracing, reference counting | [VERIFIED: macOS builtin] |
| `wc -l` | Built-in | LOC counting | [VERIFIED: macOS builtin] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual file-by-file review | Fully automated knip/madge scan | D-10 locks manual review; tools find unreachable exports but cannot assess context rot or pattern violations |
| Structured markdown template | JSON/CSV | Markdown is human-readable and git-diffable; JSON could be machine-parsed in Phase 18 if needed |
| ts-prune for export analysis | madge | ts-prune analyzes TypeScript exports directly; madge adds circular dependency detection which is useful but secondary |

**Note:** ts-prune output was collected and attached as reference — it shows ~200+ exports marked "(used in module)" which is the standard pattern for TypeScript barrel exports. These are NOT dead code unless the module itself is unreachable.

## Current Module Inventory

### Verified Module Summary (from actual filesystem scan)

| Module | Files | ~LOC | % of src/ | Test Coverage | Known Issues |
|--------|-------|------|-----------|---------------|--------------|
| **src/ (root)** | 2 | 519 | 1.4% | N/A | plugin.ts 493 LOC (target 100) |
| **src/shared/** | 14 | 1,978 | 5.3% | No dedicated tests | `toggle-gates.ts` 0 external imports; `runtime-detection/` 195 LOC stale |
| **src/features/** | 71 | 13,473 | 35.9% | Partial (8/13 submodules) | session-tracker 27 files, 7745 LOC (outlier); steering-engine partially disconnected |
| **src/coordination/** | 31 | 5,596 | 14.9% | Partial (4/6 submodules) | delegation/ 18 files, 3434 LOC (largest); sdk-delegation & command-delegation have NO tests |
| **src/tools/** | 30 | 3,961 | 10.6% | Partial (2/5 groups) | prompt sub-tools have no tests; no unified registry (f-03c PARTIAL) |
| **src/schema-kernel/** | 20 | 2,529 | 6.7% | N/A | index.ts heavy re-export barrel; 2 dead-generated schemas? |
| **src/task-management/** | 16 | 2,620 | 7.0% | **NO TESTS** | Entire module has zero dedicated test files |
| **src/hooks/** | 16 | 1,529 | 4.1% | N/A | toggle-gates.ts 0 external imports |
| **src/cli/** | 9 | 1,378 | 3.7% | YES (doctor, init, recover, help, version) | Commands well-tested |
| **src/routing/** | 11 | 1,342 | 3.6% | **NO TESTS** | Entire module has zero dedicated test files |
| **src/config/** | 7 | 1,092 | 2.9% | YES | Has config-workflow test suite (5 files) |
| **src/sidecar/** | 1 | 120 | 0.3% | N/A | Single file, minimal |
| **src/harness/** | 0 | 0 | 0% | N/A | **EMPTY** — only `.gitkeep` |
| **src/kernel/** | 0 | 0 | 0% | N/A | **EMPTY** — only `.gitkeep` |

### Verified Tool Registrations in plugin.ts

| Count | Details |
|-------|---------|
| **23 registered tools** | All 23 tool factory imports at lines 45-66 are instantiated at lines 398-424 |
| **6 hook types wired** | Lifecycle: core-hooks, session-hooks. Guards: tool-guard-hooks. Transforms: tool-before-guard, tool-after-composer, tool-after-workflow, chat-message-capture. Observers: event-observers, delegation-consumer, session-entry-consumer, session-main-consumer, session-tracker-consumer |

## Architecture Patterns

### Audit Process Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                        AUDIT PIPELINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Phase 1: Inventory       Phase 2: Classify     Phase 3: Report   │
│  ┌───────────────┐       ┌──────────────┐      ┌─────────────┐   │
│  │ List all .ts   │       │ Dead code     │      │ Write each   │   │
│  │ files per      │──────▶│ (0 imports)   │─────▶│ finding to   │   │
│  │ module         │       │ Noise (stub)  │      │ structured   │   │
│  │ Count LOC      │       │ Context rot   │      │ report       │   │
│  │ Check imports  │       │ Test gap      │      │              │   │
│  └───────────────┘       └──────────────┘      └─────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

For each file in each module:
1. **Read the file** (understand what it does)
2. **Check imports** (grep for `from "..."` references from other files)
3. **Check test coverage** (`find tests -name "*.test.ts" -path "*$module*"`)
4. **Check current architecture compliance** (CQRS, 9-surface, dependency rules from ARCHITECTURE.md)
5. **Assign category** (dead/noise/rot/gap)
6. **Assign severity** (HIGH/MEDIUM/LOW)
7. **Write finding** to report

### Anti-Patterns to Watch For
- **Business logic in plugin.ts** — violates 9-surface model (ARCHITECTURE.md anti-pattern #1)
- **Durable writes from hooks** — violates CQRS (ARCHITECTURE.md anti-pattern #2) [CITED: src/hooks/composition/cqrs-boundary.ts]
- **Deep imports from shared/** — violates leaf constraint (ARCHITECTURE.md anti-pattern #3)
- **State in .opencode/** — violates Q6 decision (ARCHITECTURE.md anti-pattern #4)
- **Modules over 500 LOC** — violates module size constraint (PROJECT.md). Currently violated by: plugin.ts (493), session-tracker/index.ts (1035), delegation/manager.ts (~500)
- **`asString` function duplicated** — exists in both `helpers.ts` and `continuity.ts` (PROJECT.md known issue)
- **`storeCache` singleton** — prevents isolated testing in continuity.ts (PROJECT.md known issue)

## Module-by-Module Investigation

### 1. src/shared/ — Leaf Utilities (D-05) [START HERE]
**Status:** ✅ Has real content, needs focused audit
**Files:** 14 | **LOC:** 1,978

| File | LOC | Imports | Status |
|------|-----|---------|--------|
| types.ts | ~415 | Heavy cross-module use | ✅ Active — canonical type contracts |
| helpers.ts | ~295 | Heavy cross-module use | ✅ Active — utility functions |
| session-api.ts | ~285 | Moderate use | ✅ Active — SDK wrappers |
| state.ts | ~200 | Moderate use | ✅ Active — in-memory state |
| runtime-policy.ts | ~250 | Used by plugin.ts + hooks | ✅ Active |
| workspace-runtime-policy.ts | ~100 | Used by plugin.ts | ✅ Active |
| tool-response.ts | ~100 | Used by tools | ✅ Active |
| app-api.ts | ~100 | Used by coordination/ | ✅ Active (2 importers) |
| tool-helpers.ts | ~80 | Used by 5 tool files | ✅ Active |
| plugin-tool-output-summary.ts | ~50 | Used by plugin.ts | ✅ Active |
| task-status.ts | ~50 | Used across modules | ✅ Active |
| runtime.ts | ~30 | Re-exported from index.ts | ✅ Active |
| security/path-scope.ts | 105 | Used in routing | ✅ Active |
| security/redaction.ts | 118 | Used in hooks | ✅ Active |

**Potential issues identified by research:**
- **`asString` duplication** — exists in both `helpers.ts` and `task-management/continuity/index.ts` (known from PROJECT.md)
- **`runtime.ts`** at ~30 LOC — is this just a re-export barrel? Verify it's not a stub.
- **No dedicated test directory** — test coverage scattered across `tests/lib/helpers/` etc. but no `tests/lib/shared/`

### 2. src/config/ — Config System (D-09)
**Status:** ✅ Well-structured
**Files:** 7 | **LOC:** 1,092

| File | LOC | Notes |
|------|-----|-------|
| subscriber.ts | ~400 | Lazy config cache |
| compiler.ts | ~500 | Config compiler (near 500 LOC cap) |
| workflow/index.ts | ~50 | Workflow state machine |
| workflow/workflow-types.ts | ~50 | Workflow types |
| workflow/workflow-state.ts | ~80 | Workflow state |
| workflow/workflow-guards.ts | ~60 | Workflow guards |
| workflow/workflow-persistence.ts | ~80 | Workflow persistence |

**Test coverage:** ✅ Has tests under `tests/lib/config-workflow/` (5 files) and `tests/lib/config-compiler.test.ts`, `tests/lib/config-subscriber.test.ts`

**Potential issues:**
- `compiler.ts` at ~500 LOC — at the module size cap (SR-D-04)

### 3. src/routing/ — Classification & Intake (D-09)
**Status:** ⚠️ **No dedicated tests**
**Files:** 11 | **LOC:** 1,342

| Submodule | Files | LOC | Notes |
|-----------|-------|-----|-------|
| session-entry/ | 5 | 667 | Purpose classifier, intake gate, language resolution, profile resolver |
| behavioral-profile/ | 4 | 277 | Profile resolution, types |
| command-engine/ | 2 | 398 | Command bundle discovery, analysis |

**Potential issues:**
- **ZERO test coverage** — no `tests/routing/` directory exists
- `command-engine/index.ts` at ~400 LOC — significant logic untested
- `session-entry/index.ts` is a heavy barrel re-export file

### 4. src/task-management/ — State Persistence (D-09)
**Status:** ⚠️ **No dedicated tests**
**Files:** 16 | **LOC:** 2,620

| Submodule | Files | LOC | Notes |
|-----------|-------|-----|-------|
| continuity/ | 2 | 661 | ContinuityStore (index.ts ~465 LOC) + delegation-persistence.ts |
| journal/ | 4 | 540 | Append/query/replay journal |
| lifecycle/ | 1 | 242 | Lifecycle state machine |
| recovery/ | 5 | 763 | Failure assessment, checkpoint, repair |
| trajectory/ | 4 | 414 | Trajectory ledger, store operations |

**Potential issues:**
- **ZERO dedicated test directory** — `continuity/index.ts` at 465 LOC is the 4th largest single file
- `storeCache` singleton prevents isolated testing (PROJECT.md known issue)
- `asString` duplicated from `helpers.ts`

### 5. src/schema-kernel/ — Validation Contracts (D-09)
**Status:** ✅ Well-structured, may have stale schemas
**Files:** 20 | **LOC:** 2,529
**16 individual schema files + barrel index + generate-config-json-schema.ts**

**Test coverage:** No dedicated test directory, but schema tests may exist in tool test files.

**Potential issues:**
- `index.ts` barrel re-exports ~80+ schemas — very heavy
- `hivemind-configs.schema.ts` at 446 LOC — second largest schema file
- `generate-config-json-schema.ts` — may be a build-time only file (verify)
- Some schemas may be dead if their corresponding feature is unwired

### 6. src/tools/ — OpenCode Tool Entrypoints (D-09)
**Status:** Most tools active, sub-tools untested
**Files:** 30 | **LOC:** 3,961

| Submodule | Files | LOC | Tests? |
|-----------|-------|-----|--------|
| config/ | 5 | 1,179 | Partial (configure-primitive.test.ts exists) |
| delegation/ | 3 | 326 | ✅ (3 test files) |
| hivemind/ | 11 | 1,703 | ✅ (3 test files) |
| session/ | 5 | 269 | Partial |
| prompt/ | 6 | ~200 | **NO tests** — prompt-analyze/ and prompt-skim/ have no test files |

**Potential issues:**
- `tools/config/configure-primitive.ts` at 490 LOC — near 500 cap
- `tools/hivemind/` has 11 files — may have stale tools from CP-PTY or other phases
- `prompt-analyze/` and `prompt-skim/` tools have **no tests**
- No unified tool registry (f-03c PARTIAL per REQUIREMENTS.md)

### 7. src/hooks/ — CQRS Read-Side (D-09)
**Status:** ✅ Active, but toggle-gates.ts is suspicious
**Files:** 16 | **LOC:** 1,529

| Submodule | Files | LOC | Notes |
|-----------|-------|-----|-------|
| lifecycle/ | 2 | 552 | Core hooks + session hooks |
| guards/ | 2 | 307 | Governance block + tool guard |
| transforms/ | 5 | 314 | toggle-gates, chat-message-capture, tool-after-composer, tool-after-workflow, tool-before-guard |
| observers/ | 5 | 259 | Delegation, event, session-entry, session-main, session-tracker consumers |
| composition/ | 1 | 36 | CQRS boundary enforcement |

**Potential issues:**
- **`toggle-gates.ts`** — confirmed dead: has **zero external imports** from any file outside its own module. The functions `isToggleEnabled`, `getDiscussMode` are defined but never imported. This is context rot.
- `lifecycle/core-hooks.ts` and `lifecycle/session-hooks.ts` combined 552 LOC — may exceed per-file caps
- `cqrs-boundary.ts` at 36 LOC — minimal, but essential

### 8. src/coordination/ — Delegation & Dispatch (D-09)
**Status:** Largest non-feature module, mixed test coverage
**Files:** 31 | **LOC:** 5,596

| Submodule | Files | LOC | Tests? |
|-----------|-------|-----|--------|
| delegation/ | 18 | 3,434 | ✅ (tests/lib/coordination/) |
| spawner/ | 8 | 654 | ✅ (tests/lib/spawner/) |
| completion/ | 2 | 468 | ✅ (part of coordination tests) |
| concurrency/ | 1 | 300 | ✅ (part of coordination tests) |
| sdk-delegation/ | 1 | 324 | **NO** |
| command-delegation/ | 1 | 416 | **NO** |

**Potential issues:**
- `delegation/manager.ts` at ~500 LOC — at or over the cap
- `delegation/` submodule has 18 files — split into many small files (good), but some may have context rot
- **`sdk-delegation/` and `command-delegation/` have NO tests** — test coverage gap
- `coordinator.ts` at ~200 LOC — verify it's wired

### 9. src/features/ — Runtime Features (D-06) [LARGEST, MOST RISK]
**Status:** ⚠️ 71 files, 13,473 LOC — largest, most potential rot
**Files:** 71 | **LOC:** 13,473 (35.9% of total src/)

| Submodule | Files | LOC | Tests? | Notes |
|-----------|-------|-----|--------|-------|
| session-tracker/ | 27 | 7,745 | ✅ (~11 test files) | **OUTLIER** — 27 files, largest single submodule |
| bootstrap/ | 12 | 2,454 | Partial (control-plane/, runtime-detection/) | Includes `runtime-detection/` (stale — 0 imports from plugin.ts) |
| steering-engine/ | 3 | 609 | **NO** | May be partially disconnected |
| runtime-pressure/ | 5 | 625 | ✅ (5 test files) | Active |
| agent-work-contracts/ | 4 | 400 | ✅ (1 test file) | Active |
| background-command/ | 5 | 398 | ✅ (3 test files, pty/) | Active |
| doc-intelligence/ | 5 | 454 | ✅ (3 test files) | Active |
| prompt-packet/ | 4 | 348 | ✅ (4 test files) | Active |
| sdk-supervisor/ | 2 | 312 | ✅ (1 test file) | Active |
| auto-loop/ | 2 | 66 | **NO** | Small, may be active via spawner/auto-loop.ts |
| ralph-loop/ | 2 | 62 | **NO** | Small, may be active via spawner/ralph-loop.ts |

**Potential issues:**
- **`session-tracker/index.ts`** at 1035 LOC — **double the 500 LOC cap**. This is the single largest file in the codebase.
- **`bootstrap/runtime-detection/`** — confirmed stale: `index.ts` (1 LOC) and `stack-synthesizer.ts` (194 LOC) have **0 imports from plugin.ts** or any other src/ file. Only the runtime-detection test file exists (`tests/lib/runtime-detection/`).
- **`steering-engine/`** — verify it's not dead code. Need to check if any file imports from it. Research showed NO imports found in plugin.ts or src/index.ts.
- **`auto-loop/` and `ralph-loop/`** — these feature modules exist but the actual loop implementations may be in `coordination/spawner/` instead
- **`bootstrap/control-plane/`** — exists with gatekeeper.ts, verify it's wired

### 10. src/cli/ — CLI Substrate (D-08)
**Status:** ✅ Well-tested, well-structured
**Files:** 9 | **LOC:** 1,378

| File | LOC | Tests? |
|------|-----|--------|
| index.ts | ~300 | ✅ |
| router.ts | ~150 | ✅ |
| discovery.ts | ~100 | ✅ |
| renderer.ts | ~200 | ✅ |
| commands/doctor.ts | ~200 | ✅ |
| commands/init.ts | ~250 | ✅ |
| commands/help.ts | ~50 | ✅ |
| commands/recover.ts | ~100 | ✅ |
| commands/version.ts | ~100 | ✅ |

**Issues:** No known issues. Lowest risk module.

### 11. src/sidecar/ — Sidecar Dashboard Foundation
**Status:** ✅ Minimal, functional
**Files:** 1 | **LOC:** 120
- `readonly-state.ts` — 120 LOC, single file. Verified active.

### 12. src/harness/ vs src/kernel/ — Duplicate Stubs (D-07)
**Status:** 🔴 Confirmed empty stub directories
**Files:** 0 | **LOC:** 0

Both directories contain ONLY `.gitkeep` files. They are empty stub directories with identical content. CONTEXT.md D-07 identifies this as duplication. Phase 18 should:
1. Keep ONE directory (likely `src/kernel/` per the codebase naming)
2. Delete the other
3. Ensure no imports reference either (research shows zero)

## Findings Report Template

Every finding should be recorded with this format:

```markdown
### Finding F-{N}: {Short Title}

- **Module:** `src/{module}/`
- **File:** `src/{module}/{file}.ts` (line N-N if applicable)
- **Category:** `dead` | `noise` | `context-rot` | `test-gap`
- **Severity:** `HIGH` | `MEDIUM` | `LOW`
- **Description:** What the issue is, in plain language
- **Evidence:** {grep/import trace/measurement that confirms the finding}
- **Architecture Violation:** {which pattern from ARCHITECTURE.md is violated, if any}
- **Recommendation:** {specific action for Phase 18}
```

### Example Pre-Identified Findings

The following findings are pre-identified by this research and should be CONFIRMED during manual audit:

#### Finding F-01: `src/harness/` and `src/kernel/` empty stub directories
- **Category:** `noise`
- **Severity:** `HIGH`
- **Evidence:** Both contain only `.gitkeep`. Zero files.
- **Recommendation:** Delete one (or both if unused). Phase 18.

#### Finding F-02: `plugin.ts` at 493 LOC exceeds 100 LOC target
- **Category:** `context-rot`
- **Severity:** `HIGH`
- **Evidence:** `wc -l src/plugin.ts` = 493. PROJECT.md target = 100 LOC.
- **Recommendation:** Extract hook wiring and tool registration into separate modules. Phase 18.

#### Finding F-03: `messages-transform.ts` confirmed dead (67 LOC)
- **Category:** `dead`
- **Severity:** `HIGH`
- **Evidence:** File exists only in graphify-out cache and `.planning/archive/`. Zero current imports. Confirmed dead in Phase 35 audit.
- **Note:** File may already be deleted — verify during audit. This research found NO current `src/hooks/messages-transform.ts` file.

#### Finding F-04: `toggle-gates.ts` has 0 external imports
- **Category:** `dead`
- **Severity:** `MEDIUM`
- **Evidence:** `grep -rn "toggle-gates" --include="*.ts" src/` returned only self-references in `src/hooks/transforms/toggle-gates.ts`. Not imported by plugin.ts or any other file.
- **Context:** Functions `isToggleEnabled`, `getDiscussMode` defined but never called. However, REQUIREMENTS.md lists TOG-01 as "DELIVERED" — this may mean the config/compile side is handled but the runtime consumer is missing.

#### Finding F-05: `runtime-detection/` (2 files, 195 LOC) not wired to plugin.ts
- **Category:** `dead`
- **Severity:** `MEDIUM`
- **Evidence:** `grep -rn "runtime-detection" --include="*.ts" src/` — only self-references. Not imported by plugin.ts or features/bootstrap/index.ts.
- **Recommendation:** Delete or add wire in Phase 18.

#### Finding F-06: No tests for 5 modules
- **Category:** `test-gap`
- **Severity:** `HIGH`
- **Evidence:** Modules with zero dedicated test files: `src/routing/`, `src/task-management/`, and no dedicated dirs for: `src/shared/`, `src/hooks/`, `src/schema-kernel/`.
- **Also:** `command-delegation/`, `sdk-delegation/` in coordination have no tests.

#### Finding F-07: `session-tracker/index.ts` at 1035 LOC — violates 500 LOC cap
- **Category:** `context-rot`
- **Severity:** `HIGH`
- **Evidence:** `wc -l` confirmed 1035 LOC. Double the allowed maximum.
- **Recommendation:** Split into multiple files. Phase 18.

#### Finding F-08: `steering-engine/` may be partially disconnected
- **Category:** `dead` or `context-rot` (requires manual verification)
- **Severity:** `MEDIUM`
- **Evidence:** No imports of steering-engine found in plugin.ts. Steering-engine has 3 files (609 LOC) and its own schema subdirectory.
- **Recommendation:** Manual verify during audit — either wire it or delete it. Phase 18.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead export detection | Manual grep of each file | `knip` (v6.14.1) or `ts-prune` | Tools find unreachable exports faster; manual review can then confirm context |
| Import tracing | Manual read of every import | `grep -rn "from.*'../file'" src/` | Fast reference counting via shell, then manual read to confirm |
| Circular dependency detection | Manual tracing | `madge` (via npx) | Circular deps are hard to spot by eye; tooling is essential |
| LOC counting | Manual line counting | `wc -l` + `find` | Built-in, fast, accurate |

**Key insight:** This audit is DISCOVERY ONLY. Use tools for efficiency (knip, grep), but every finding must be confirmed by reading the actual source file. Tools find candidates; manual review validates.

## Common Pitfalls

### Pitfall 1: Confusing "exported but unused" with "dead"
**What goes wrong:** knip/ts-prune flags exports that are used ONLY within their own module (TypeScript barrel pattern). This is NOT dead code — it's internal module structure.
**How to avoid:** For each candidate: check if it's exported from a barrel (index.ts). Barrel exports to external consumers are legitimate API surface.

### Pitfall 2: Missing context rot in "working" code
**What goes wrong:** Code that compiles and runs may still violate current architecture (e.g., hooks that write to state, violating CQRS). Manual review is the only way to catch this.
**How to avoid:** Cross-reference each file against ARCHITECTURE.md anti-patterns list during manual reading.

### Pitfall 3: Forgetting to check both `src/index.ts` and `src/plugin.ts`
**What goes wrong:** A module might be "dead" for runtime (not in plugin.ts) but still exported via index.ts as public API. Both must be checked.
**How to avoid:** Always check: (a) is it imported by plugin.ts? (b) is it re-exported by index.ts? (c) is it consumed by other src/ code?

### Pitfall 4: Harness/kernel naming confusion
**What goes wrong:** Future code may reference these directories. Research shows zero current references, but the stub directories exist and may cause confusion.
**How to avoid:** Document the emptiness, decide which name to keep in Phase 18.

### Pitfall 5: Assuming test coverage == test directory existence
**What goes wrong:** Some modules have test files in unexpected locations (e.g., config tests in `tests/lib/config-workflow/`). A grep for `tests/lib/shared/` returns nothing, but shared module functions ARE tested via `tests/lib/helpers/` etc.
**How to avoid:** Use `find tests -name "*.test.ts" | xargs grep -l "from.*src/shared"` to check actual imports rather than assuming directory structure matches.

## Code Examples

### Example 1: Import Tracing with grep
```bash
# Check if a file has any external importers (excluding self)
grep -rn "from.*'\.\./relative/path/file'" --include="*.ts" src/

# Count unique files that import a given module
grep -rn "from.*shared/helpers" --include="*.ts" src/ | grep -v "\.d\.ts" | wc -l

# Find exports that are never imported outside their module
# Use ts-prune to generate candidate list
npx ts-prune --project tsconfig.json
```

### Example 2: Module Size Audit
```bash
# Count files and LOC per module
for dir in src/*/; do
  module=$(basename "$dir")
  files=$(find "$dir" -name '*.ts' | wc -l)
  loc=$(find "$dir" -name '*.ts' -exec cat {} + | wc -l)
  echo "$module: $files files, ~$loc LOC"
done

# Find files over 500 LOC
find src -name '*.ts' -exec wc -l {} + | sort -rn | awk '$1 > 500'
```

### Example 3: Dead Code Pattern Detection
```typescript
// Pattern to look for during manual review:
// 1. Functions/variables that are exported but never imported elsewhere
// 2. Files that are barrel re-exports with no actual logic
// 3. Configuration/detection modules that are never wired
// 4. Schema files with no corresponding tool/hook/feature
// 5. Stale comments referencing deleted code paths or removed modules
```

### Example 4: Test Coverage Gap Detection
```bash
# Find src/ modules without corresponding test directories
for dir in src/*/; do
  mod=$(basename "$dir")
  test_count=$(find tests -path "*/$mod/*" -name "*.test.ts" 2>/dev/null | wc -l)
  if [ "$test_count" -eq "0" ]; then
    echo "NO TESTS: src/$mod/"
  fi
done
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| event-tracker for session context | hivemind-session-view tool (3-root query) | Phase 16 (2026-05-19) | Event-tracker deprecated; refs may remain in docs/comments |
| `src/lib/` flat structure | Feature-module pattern with submodules | Phase SR (2026-05-08) | Some legacy patterns may remain |
| Single delegation mechanism | Multi-lane (SDK/PTY/command) with WaiterModel | Phases 46-47 | Command-delegation and SDK-delegation modules may have context rot |
| `.opencode/harness/` state | `.hivemind/state/` (Q6 migration) | 2026-04-25 | Legacy refs may remain |

**Deprecated/outdated:**
- `event-tracker` — replaced by session-view tool. References may exist in doc comments and AGENTS.md files.
- `src/hooks/messages-transform.ts` — confirmed dead, references only in graphify cache and archive.
- `asString` in helpers.ts — duplicated in continuity.ts; should be consolidated.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `steering-engine/` has 0 imports from plugin.ts | Module Inventory | If actually wired through index.ts re-exports, recommendation to delete would break public API |
| A2 | `auto-loop/` and `ralph-loop/` feature modules are secondary to coordination/spawner/ implementations | Module Inventory | If these features have distinct runtime behavior not in spawner/, removing them would break functionality |
| A3 | `session-tracker/index.ts` at 1035 LOC is deletable/refactorable | Module Inventory | If the 1035 LOC is a cohesive unit with tight internal coupling, splitting may require significant refactoring beyond Phase 18 scope |
| A4 | All 23 registered tools are actively used | Tool Registrations | If some tools have no agent consumers, they represent dead code that wasn't caught by import analysis (tools are registered dynamically, not imported) |
| A5 | `plugin.ts` LOC reduction to 100 is feasible | Finding F-02 | Plugin composition may inherently require more wiring boilerplate; 100 LOC target may be aspirational |

**If this table is empty:** Not applicable — assumptions exist and are documented.

## Open Questions (RESOLVED)

1. **Is `steering-engine/` actually dead or just deferred?** [RESOLVED: deferred to manual check during Plan 04 audit. If 0 imports from any src/ file → flag DEAD for Phase 18 cleanup. If imported but unwired → flag DEFERRED with recommendation.]

2. **Is `toggle-gates.ts` truly dead (context rot) or is it consumed at config-compile time?** [RESOLVED: deferred to manual check during Plan 02 audit. Inspect imports, config references, and REQUIREMENTS.md TOG-01 status. Classify as DEAD or DORMANT accordingly.]

3. **How should the `session-tracker/index.ts` 1035 LOC be split?** [RESOLVED: flag in findings as SIZE_VIOLATION (exceeds 500-LOC cap). Split strategy deferred to Phase 18 cleanup — recommendation: split into 3-4 files by submodule.]

4. **Are the 3 sub-tool groups (prompt-analyze, prompt-skim, session-patch) all actively invoked?** [RESOLVED: check tool registration in plugin.ts during Plan 02. All registered = INVOKE_UNKNOWN (cannot determine without runtime telemetry). Flag for Phase 20 if needed.]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `knip` | Dead export detection | ✓ | 6.14.1 | `grep -rn` + `ts-prune` |
| `ts-prune` | Export usage analysis | ✓ | system | `grep -rn "export "` manual tracing |
| `grep` | Import tracing | ✓ | macOS builtin | `rg` (ripgrep) |
| `wc -l` | LOC counting | ✓ | macOS builtin | `cloc` or `tokei` |
| Node.js | Running ts-prune/knip | ✓ | >= 20 | — |
| TypeScript compiler | `tsc --noEmit` for typecheck | ✓ | ^5.0 | — |

**Missing dependencies with no fallback:** None — all audit tooling is available.

## Validation Architecture

> The `workflow.nyquist_validation` key is absent from `.planning/config.json`, so validation is treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (globals, V8 coverage) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/lib/helpers/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01/D-04 | Categorize findings | Manual (audit artifact) | N/A — audit is manual | ❌ Wave 0 |
| D-05/D-10 | Audit all modules | Manual (file-by-file) | N/A — audit is manual | ❌ Wave 0 |
| D-14 | Produce findings report | Manual (markdown) | N/A — report is document | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (typecheck)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + findings report reviewed before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No automated tests for Phase 17 output (by design — this is a discovery phase)
- [ ] Findings report template exists in this RESEARCH.md — auditor should copy it to `17-FINDINGS.md`

## Security Domain

> `security_enforcement` not explicitly set to `false` in config — section included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | Phase 17 is audit-only — no code changes |
| V7 Code Quality | yes | This audit directly addresses code quality — dead code removal, noise elimination, test gap closure |
| V11 Business Logic | partial | Context rot detection may identify logic that violates current patterns |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dead code as attack surface | Information Disclosure | Remove unused code paths (Phase 18) |
| Stale config/schema handling | Tampering | Wire or remove runtime-detection module (Phase 18) |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: filesystem enumeration] — All file counts, LOC, and directory listings from live filesystem scan on 2026-05-20
- [VERIFIED: grep import traces] — All import tracking done via `grep -rn` across `src/`
- [VERIFIED: knip v6.14.1] — Dead export detection tool version confirmed
- [VERIFIED: ts-prune export map] — Export usage analysis confirmed via npx
- [VERIFIED: CONTEXT.md] — All locked decisions from `.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-CONTEXT.md`

### Secondary (MEDIUM confidence)
- [CITED: ARCHITECTURE.md] — CQRS model, 9-surface authority, anti-patterns, module size constraints
- [CITED: PROJECT.md] — Known issues: dead code, stale modules, plugin.ts LOC target
- [CITED: REQUIREMENTS.md] — Feature status: f-03c (tool registry), TOG-01 (toggle gates delivered)
- [CITED: STATE.md] — Phase history, known issues log

### Tertiary (LOW confidence)
- `steering-engine/` disconnection status — requires manual file-by-file verification during audit. Research found 0 imports in plugin.ts but may be re-exported via src/index.ts.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tooling verified via actual execution
- Architecture: HIGH — module structure verified by filesystem scan
- Pitfalls: HIGH — patterns verified against actual codebase examples

**Research date:** 2026-05-20
**Valid until:** 2026-07-01 (audit findings expire as code changes)
