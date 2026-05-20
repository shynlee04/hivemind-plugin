# Deep Analysis: routing/, cli/, and config/ Modules

**Analysis Date:** 2026-05-21
**Scope:** All files in `src/routing/`, `src/cli/`, `src/config/` — including subdirectories
**Method:** Full file-by-file read, import graph analysis, runtime integration tracing

---

## 1. Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│                          plugin.ts (composition root)               │
│                                                                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐  │
│  │  CLI (bin/hivemind.cjs)  │  │  Runtime (tool/hook registration) │  │
│  │  ┌─────────────────┐    │  │  ┌──────────────────────────┐    │  │
│  │  │  router.ts       │    │  │  │  config/subscriber.ts   │←───┼──┤
│  │  │  renderer.ts    │    │  │  ├──────────────────────────┤    │  │
│  │  │  discovery.ts   │    │  │  │  routing/session-entry/  │←───┼──┤
│  │  │  commands/*.ts  │    │  │  │  (intake-gate →          │    │  │
│  │  └─────────────────┘    │  │  │   observers/events.ts)   │    │  │
│  │  Tests: 8 files ✓       │  │  ├──────────────────────────┤    │  │
│  └─────────────────────────┘  │  │  routing/behavioral-     │←───┼──┤
│                                │  │  profile/ → session-api │    │  │
│  ┌─────────────────────────┐  │  │   → hooks/deps           │    │  │
│  │  config/compiler.ts     │←─┼──┤  ├──────────────────────────┤    │  │
│  │  config/workflow/*.ts   │←─┼──┤  │  routing/command-engine │←───┼──┤
│  └─────────────────────────┘  │  │  │  → hivemind-command-    │    │  │
│  │  (no tests)                │  │  │    engine.ts (tool)     │    │  │
│  └─────────────────────────┘  │  └──────────────────────────┘    │  │
│                                │                                   │  │
│  ┌─────────────────────────┐  │                                   │  │
│  │  tools/config/          │  │                                   │  │
│  │  configure-primitive.ts │──┼────→ config/compiler.ts           │  │
│  │  validate-restart.ts   │──┼────→ config/workflow/*.ts          │  │
│  │  bootstrap-init.ts     │  │                                   │  │
│  │  bootstrap-recover.ts  │  │                                   │  │
│  └─────────────────────────┘  │                                   │  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. CLI Module — Complete Analysis

### Files (9 files, ~1,420 LOC)

| File | LOC | Type | Purpose | Completeness |
|------|-----|------|---------|-------------|
| `src/cli/index.ts` | 96 | Real | `buildHarnessCli()` + `runCli()` entry | 100% |
| `src/cli/router.ts` | 189 | Real | `parseArgs()` + `createRouter()`, framework-free | 100% |
| `src/cli/renderer.ts` | 122 | Real | `renderError/Json/Table/Help` | 100% |
| `src/cli/discovery.ts` | 77 | Real | `validateCommand`, `discoverCommands` | 100% |
| `src/cli/commands/help.ts` | 34 | Real | Lists registered commands | 100% |
| `src/cli/commands/init.ts` | 314 | Real | Interactive `@clack/prompts` wizard → `bootstrapInit` | 100% |
| `src/cli/commands/doctor.ts` | 338 | Real | 7 health checks (structure, symlinks, config, sdk, typecheck, tests, modules) | 100% |
| `src/cli/commands/recover.ts` | 144 | Real | Symlink repair → `bootstrapRecover` | 100% |
| `src/cli/commands/version.ts` | 64 | Real | Reads `package.json` version | 100% |

### Import Graph

```
bin/hivemind.cjs → dist/cli/index.js
                     ├── router.ts (parseArgs, createRouter)
                     ├── renderer.ts (pure formatting)
                     ├── discovery.ts (validateCommand, discoverCommands)
                     ├── commands/help.ts (→ renderer)
                     ├── commands/init.ts (→ tools/config/bootstrap-init, @clack/prompts)
                     ├── commands/doctor.ts (→ features/bootstrap/structure, schema-kernel)
                     ├── commands/recover.ts (→ tools/config/bootstrap-recover)
                     └── commands/version.ts (→ node:fs/readFileSync)
```

### Integration Status: **WIRED — Complete**

**Evidence:**
- `bin/hivemind.cjs` exists and dynamically imports `dist/cli/index.js` (line 25)
- Package.json `"bin"` field maps `hivemind` → `./bin/hivemind.cjs`
- Package.json `"exports"` has `"./cli"` entry for subpath import
- 8 test files in `tests/cli/` covering all commands and the router/renderer/discovery

### Design Quality: **EXCELLENT**
- Framework-free CLI routing (no commander/yargs) keeps it under 500 LOC
- DI pattern via optional `deps` parameter on every command factory — fully testable
- BSD sysexits exit codes (0/64/70)
- Consistent `[Harness]` error prefix
- `doctor.ts` does proper read-only validation; `init.ts` does interactive wizard; `recover.ts` is idempotent

### Issues Found
- None. This is the most mature module in the analysis.

---

## 3. Routing Module — Complete Analysis

### Files (10 files excluding AGENTS.md, ~1,140 LOC)

#### session-entry/ (4 files, 519 LOC)

| File | LOC | Type | Purpose | Completeness |
|------|-----|------|---------|-------------|
| `index.ts` | 23 | Barrel | Re-exports classifyPurpose, detectLanguage, resolveProfile, resolveIntake | 100% |
| `purpose-classifier.ts` | 195 | Real | 8-class keyword-based classifier with confidence scoring | 100% |
| `language-resolution.ts` | 153 | Real | Unicode range script detection (Latin/CJK/Arabic/Cyrillic/Devanagari/Thai) | 100% |
| `profile-resolver.ts` | 148 | Real | Heuristic profile from messageLength, technicalTerms[], responseTime | 100% |
| `intake-gate.ts` | 148 | Real | Combines all 3 + registry validator → routing target | 100% |

#### behavioral-profile/ (4 files, 277 LOC)

| File | LOC | Type | Purpose | Completeness |
|------|-----|------|---------|-------------|
| `index.ts` | 29 | Barrel | Re-exports types, profiles, resolution | 100% |
| `types.ts` | 100 | Types | GuardrailLevel, DelegationMode, BehavioralProfile, ResolvedBehavioralProfile | 100% |
| `profiles.ts` | 45 | Data | Static lookup: mode → BehavioralProfile | 100% |
| `resolve-behavioral-profile.ts` | 103 | Real | Config-first + runtime fallback merge | 100% (with dead code) |

#### command-engine/ (2 files, 398 LOC)

| File | LOC | Type | Purpose | Completeness |
|------|-----|------|---------|-------------|
| `index.ts` | 223 | Real | 6 actions: discover, analyze_contract, render_context, transform_messages, route_preview, list_commands | 100% |
| `types.ts` | 175 | Types | CommandBundle, ContractAnalysis, RoutePreview, etc. | 100% |

### Import Graph (Runtime)

```
plugin.ts
  ├── routing/behavioral-profile/resolve-behavioral-profile.ts
  │   ├── config/subscriber.ts (getFreshConfig)
  │   └── routing/session-entry/profile-resolver.ts (resolveProfile)
  │
  └── [injected into hook deps as getBehavioralProfile]

hooks/observers/event-observers.ts
  └── routing/session-entry/intake-gate.ts (resolveIntake)
      ├── purpose-classifier.ts (classifyPurpose)
      ├── language-resolution.ts (detectLanguage)
      └── profile-resolver.ts (resolveProfile)

tools/hivemind/hivemind-command-engine.ts
  └── routing/command-engine/index.ts (executeCommandEngineAction)
```

### Downstream Consumers of Routing Types

| File | Imports |
|------|---------|
| `src/plugin.ts:73` | `resolveBehavioralProfile` |
| `src/shared/session-api.ts:4-5` | `ResolvedBehavioralProfile`, `resolveBehavioralProfile` |
| `src/shared/types.ts:379` | `ConfigWorkflowState`, `WORKFLOW_TURNS` |
| `src/hooks/types.ts:6-8` | `IntakeResult`, `ResolvedBehavioralProfile` |
| `src/hooks/observers/event-observers.ts:4` | `resolveIntake` |
| `src/hooks/guards/governance-block.ts:21` | `ResolvedBehavioralProfile` |
| `src/coordination/delegation/manager-runtime.ts:27` | `BehavioralOverrides` |
| `src/index.ts:28` | Command engine exports |

### Integration Status: **WIRED — Functional End-to-End**

**Critical question: Is the routing system functional end-to-end?**
- **YES** for session-entry → hook pipeline: `resolveIntake()` is called in `event-observers.ts:74` on every `session.created` event, cached per-session, accessible via `getIntake()`. This IS wired into the runtime.
- **YES** for behavioral-profile → runtime: `resolveBehavioralProfile()` is imported in `plugin.ts:73`, injected into hook deps at line 323, consumed by `shared/session-api.ts` and guard hooks. This IS wired.
- **YES** for command-engine → tool: `executeCommandEngineAction()` is wrapped by `hivemind-command-engine.ts` tool, registered at `plugin.ts:414`. This IS wired.

**Critical question: Does session-entry intake-gate actually gate anything?**
- **YES, partially.** `resolveIntake()` is called on session creation, but the `registryValidator` parameter is NOT passed (see `event-observers.ts:74` where it's called with just `userMessage`). So the registry validation feature is **not exercised at runtime** — it only runs the classification/language/profile parts, not the primitive existence check.
- The `routingTarget` is computed but NOT used to dispatch to an agent in the current wiring — it's stored in the cache as data. True "gating" (blocking or redirecting sessions based on classification) is not implemented on the consumer side.

### Design Quality: **GOOD with significant concerns**

**Strengths:**
- Clean separation of concerns: 3 sub-modules, each with clear responsibility
- session-entry follows a pipeline pattern (classify → detect language → resolve profile → gate)
- behavioral-profile uses config-first merge strategy
- command-engine has proper read-side design (discover, analyze, preview — no execution)

**Critical Concerns:**
1. **purpose-classifier uses naive substring matching** — `input.includes(keyword)` with hand-tuned weights. No NLP, no lemmatization, no stemming. "tests" matches for TDD, but "testing" would match "test" keyword. The word "check" matches the gatekeeping class (keyword " check" with leading space). This is fragile.
2. **language-resolution only detects dominant script** — Mixed-language input (e.g., "Hello 你好") returns "latin" with ~50% confidence. No multi-language support.
3. **profile-resolver heuristics are thin** — `messageLength < 50 → concise`, technical terms count → expertise. The `computeConfidence` function uses default-sentinel detection (checks if `messageLength !== 100` as a signal). No real behavioral learning.
4. **resolve-behavioral-profile.ts has dead code** — `invalidateBehavioralProfile()` and `clearAllBehavioralProfiles()` are deprecated no-ops (lines 93-102). Should be removed.
5. **No tests exist** — `tests/routing/` directory does NOT exist, despite AGENTS.md documenting test expectations for all 3 sub-modules.

### Completeness Issues

| Issue | File(s) | Impact |
|-------|---------|--------|
| Registry validator never passed at runtime | `event-observers.ts:74` vs `intake-gate.ts:53-80` | Registry validation feature is dead code — always skipped in hooks |
| Routing target computed but not consumed for dispatch | `intake-gate.ts:120`, `event-observers.ts:74` | Purpose classification runs but no action is taken on the result beyond caching |
| No test coverage | All routing files | Classification accuracy, profile resolution, and contract analysis are untested |
| Deprecated no-op methods | `resolve-behavioral-profile.ts:93-102` | Dead code, should be removed |
| decompileAgent returns `name: "unknown"` | `compiler.ts:191` (config, but related) | Bug: always emits `"unknown"` instead of extracting frontmatter name |

---

## 4. Config Module — Complete Analysis

### Files (8 files excluding AGENTS.md, ~1,050 LOC)

| File | LOC | Type | Purpose | Completeness |
|------|-----|------|---------|-------------|
| `src/config/AGENTS.md` | 42 | Docs | Sector guidance | N/A |
| `src/config/compiler.ts` | 410 | Real | compile/decompile/batch/mixed-batch for agent/command/skill | 100% but overstuffed |
| `src/config/subscriber.ts` | 97 | Real | getConfig/getFreshConfig/getCachedConfig with lazy cache | 100% |
| `src/config/workflow/AGENTS.md` | 41 | Docs | Sub-sector guidance | N/A |
| `src/config/workflow/index.ts` | 43 | Barrel | Re-exports all workflow symbols | 100% |
| `src/config/workflow/workflow-types.ts` | 53 | Types | ConfigWorkflowState, WorkflowTurn, etc. | 100% |
| `src/config/workflow/workflow-state.ts` | 185 | Real | 8-turn state machine (create, advance, complete, clone) | 100% |
| `src/config/workflow/workflow-guards.ts` | 122 | Real | Turn precondition validation | 100% |
| `src/config/workflow/workflow-persistence.ts` | 182 | Real | JSON file persistence to `.hivemind/state/config-workflows.json` | 100% |

### Import Graph

```
tools/config/configure-primitive.ts
  ├── config/compiler.ts (compileAgent, compileCommand, compileSkill, batchCompile, mixedBatchCompile)
  └── config/workflow/index.ts (createWorkflowState, advanceTurn, completeCurrentTurn, etc.)

tools/config/validate-restart.ts
  └── config/compiler.ts (decompileAgent, decompileCommand, decompileSkill)

routing/behavioral-profile/resolve-behavioral-profile.ts
  └── config/subscriber.ts (getFreshConfig)

task-management/continuity/index.ts
  └── config/subscriber.ts (getCachedConfig)

coordination/delegation/manager-runtime.ts
  └── config/subscriber.ts (getCachedConfig)

tools/hivemind/run-background-command.ts
  └── config/subscriber.ts (getCachedConfig)
```

### Integration Status: **WIRED — Complete**

**Evidence:**
- `compiler.ts` functions called by `configure-primitive.ts` tool (registered at `plugin.ts:421`)
- `subscriber.ts` functions imported by 5+ modules across the codebase
- Workflow state machine used by `configure-primitive.ts` for turn-based configuration
- Workflow persistence writes to `.hivemind/` per architectural rules

### Design Quality: **GOOD with overstuffed file**

**Strengths:**
- Subscriber has proper lazy-load + cache-per-project + fallback pattern
- Workflow state machine is pure functions (no I/O) — testable by design
- Workflow persistence uses atomic write (tmp + rename), normalization, deep-clone
- Guards are pure functions with clear turn-specific validation
- Compiler has comprehensive batch and mixed-batch with cross-type conflict detection

**Critical Concerns:**
1. **compiler.ts is at 410 LOC** — close to the 500 LOC cap. It contains compile/decompile/batch/mixed-batch/path resolution/command bundle listing. Should be split.
2. **No tests exist** — `tests/config/` directory does NOT exist. The state machine, guards, persistence, and compiler all have non-trivial logic with zero test coverage.
3. **decompileAgent returns `name: "unknown"`** — Unlike `decompileSkill` which extracts the name from frontmatter (line 230: `const name = frontmatterResult.data.name ?? "unknown"`), `decompileAgent` hardcodes `"unknown"`. This is a bug.
4. **Rollback in mixedBatchCompile is incomplete** — If file write fails, the code deletes already-written files (lines 354-362), but `mkdirSync` directory creation for the parent directory is NOT rolled back. Empty directories will remain.
5. **Subscriber uses module-level singletons** — `cachedConfig` and `cachedProjectRoot` are module-level variables (lines 22-26). This works in single-process Node.js but would be problematic in testing or multi-project scenarios. The JSDoc mentions "cache-per-project" but the cache key is last-wins, not actual multi-project.

---

## 5. Completeness Score per Sub-Module

| Module | Files | LOC | Tests | Integration | Quality Score |
|--------|-------|-----|-------|-------------|---------------|
| **CLI** | 9 | ~1,420 | ✅ 8 files | ✅ Wired (bin + package.json exports) | **9/10** |
| **routing/session-entry** | 5 | ~542 | ❌ 0 files | ✅ Wired (hooks/observers) | **6/10** |
| **routing/behavioral-profile** | 4 | ~277 | ❌ 0 files | ✅ Wired (plugin.ts → hooks) | **6/10** |
| **routing/command-engine** | 2 | ~398 | ❌ 0 files | ✅ Wired (tool registration) | **7/10** |
| **config/compiler** | 1 | ~410 | ❌ 0 files | ✅ Wired (configure-primitive tool) | **5/10** |
| **config/subscriber** | 1 | ~97 | ❌ 0 files | ✅ Wired (5+ consumers) | **7/10** |
| **config/workflow** | 5 | ~465 | ❌ 0 files | ✅ Wired (configure-primitive tool) | **6/10** |

---

## 6. Designed-But-Unwired Components

| Component | LOC | Description | Status |
|-----------|-----|-------------|--------|
| `intake-gate.ts` registry validator | ~30 lines (lines 53-80, 123-139) | Validates routing target against primitive registry | **DESIGNED BUT NOT WIRED** — `createRegistryValidator` exists and is well-documented, but `resolveIntake()` is called from `event-observers.ts:74` without a registry validator argument. The registry check ALWAYS skips at runtime. |
| `PURPOSE_TO_ROUTING_TARGET` dispatch action | ~10 lines (intake-gate.ts:24-33) | Maps purpose to target agent | **COMPUTED BUT NOT ACTED UPON** — `routingTarget` is stored in the intake cache but no consumer currently dispatches to the target agent based on this value. |
| `invalidateBehavioralProfile` / `clearAllBehavioralProfiles` | ~10 lines (resolve-behavioral-profile.ts:93-102) | Cache invalidation (now no-ops) | **DEAD CODE** — deprecated and empty, kept for backward compat. Should be removed. |

**Total unwired/dead LOC: ~50 lines** — minimal. Most of the code is actually integrated.

---

## 7. Critical Weaknesses

### 7.1 Zero Test Coverage (HIGH)

**Three modules with NO tests:**
- `tests/routing/` — does not exist
- `tests/config/` — does not exist

**What's untested:**
- Purpose classification accuracy (8 classes, ~80 keywords)
- Language detection accuracy (6 scripts, edge cases like empty input, mixed language)
- Profile resolution heuristics (corner cases, confidence calculations)
- Intake gate routing table correctness
- Behavioral profile resolution and merge strategy
- Command engine contract analysis and route preview
- **ALL of config/compiler.ts** — compile, decompile, batch, mixed-batch, atomic write/rollback
- **ALL of config/workflow/** — state machine transitions, guard conditions, persistence I/O

### 7.2 Fragile Purpose Classification (MEDIUM)

`classifyPurpose()` uses `String.includes()` with hardcoded keywords and weights. This means:
- "testing" matches keyword "test" → potentially misclassifies as TDD
- "check" keyword in gatekeeping class has a leading space: " check" → prevents false positive on "checkout" but also misses "check" at start of input
- No stemming/lemmatization — "exploring" doesn't match "explore"
- No negation handling — "don't need tests" still scores for TDD

### 7.3 decompileAgent Bug (MEDIUM)

`compiler.ts:191` returns `name: "unknown"` for every decompiled agent spec, while `decompileSkill:230` correctly extracts the name from frontmatter. This is an implementation inconsistency that would cause issues for anyone re-compiling a decompiled agent.

### 7.4 Compiler.ts Overstuffing (MEDIUM)

At 410 LOC, `compiler.ts` is near the 500 LOC cap and handles:
- 3 compile functions (agent/command/skill)
- 3 decompile functions (agent/command/skill)  
- 1 batch compile
- 1 mixed batch compile (with conflict detection + atomic write + rollback)
- Path resolution and validation
- Command bundle listing

This should be split into `compiler/index.ts`, `compiler/compile.ts`, `compiler/decompile.ts`, `compiler/batch.ts`.

### 7.5 Registry Validation is Dead Code (LOW)

The `createRegistryValidator` and the `registryValidator` parameter in `resolveIntake()` is a well-designed feature that is never exercised at runtime. The hook calls `resolveIntake(userMessage)` without a validator, so the routing target is never checked against the primitive registry.

---

## 8. Anomalies and Gotchas

| Anomaly | File | Detail |
|---------|------|--------|
| Missing `@clack/prompts` from package.json deps | `src/cli/commands/init.ts:1` | Wait — it IS declared at line 43. **No issue.** |
| `decompileAgent` vs `decompileSkill` inconsistency | `compiler.ts:191,230` | Agent always returns `"unknown"`; skill extracts frontmatter name |
| `resolveProfile` called twice per session | `event-observers.ts:74` → `intake-gate.ts:119` AND `resolve-behavioral-profile.ts:65` | Two separate `resolveProfile()` calls happen on session creation — once in the event observer (via intake-gate) and once in behavioral profile resolution (via plugin deps). Extra computation but not a bug. |
| `compiler.ts` imports `yaml` but also has `js-yaml` dep | `compiler.ts:1` | `yaml` package (2.x) is used for stringify; `js-yaml` (4.x, used by gray-matter) is also a dependency. One could be eliminated. |
| CLI `hivemind.cjs` uses dynamic `import()` | `bin/hivemind.cjs:25` | Correct approach for CJS → ESM boundary. But `dist/cli/index.js` must exist → requires build step first. |

---

## 9. Recommendations

### Priority 1: Add Tests
- `tests/routing/session-entry/` — test `classifyPurpose` accuracy, `detectLanguage` for each script, `resolveIntake` pipeline, `resolveProfile` heuristics
- `tests/routing/behavioral-profile/` — test `resolveBehavioralProfile` merge strategy, `mapLevelToExpertise` mapping
- `tests/routing/command-engine/` — test contract analysis, route preview, message transform
- `tests/config/compiler.test.ts` — test all compile/decompile/batch functions
- `tests/config/workflow/` — test state transitions, guard conditions, persistence

### Priority 2: Fix Bugs
- Fix `decompileAgent` to extract name from frontmatter (match `decompileSkill` behavior)
- Remove or clean up deprecated `invalidateBehavioralProfile` / `clearAllBehavioralProfiles`

### Priority 3: Address Design Concerns
- Split `compiler.ts` into smaller modules
- Wire registry validation into the hook (or remove the feature)
- Consider using the `routingTarget` from intake gate for actual routing/dispatch
- Improve purpose classification with simple NLP (lemmatization, word boundaries via regex)

### Priority 4: Low Urgency
- Consolidate `yaml` and `js-yaml` dependencies
- Add `mkdirSync` rollback in `mixedBatchCompile`
- Consider multi-project support for config subscriber cache

---

## 10. Architecture Fit Summary

| Principle | CLI | Routing | Config |
|-----------|-----|---------|--------|
| **CQRS** | ✅ Write-side (commands mutate state) | ✅ Read-side (classification only) | ⚠️ Mixed — compiler is write-side, subscriber is read-side |
| **Granularity (< 500 LOC)** | ✅ All under 500 | ✅ All under 500 | ⚠️ compiler.ts at 410 (close to cap) |
| **No circular deps** | ✅ | ✅ | ✅ |
| **`[Harness]` prefix** | ✅ Consistent | ✅ Consistent | ✅ Consistent |
| **`import type` for types** | ✅ | ✅ | ✅ |
| **`.js` extensions** | ✅ | ✅ | ✅ |
| **No state in `.opencode/`** | ✅ Writes to `.hivemind/` | ✅ In-memory only | ✅ Writes to `.hivemind/` |
| **Tests exist** | ✅ (8 files) | ❌ (0 files) | ❌ (0 files) |

---

*Analysis: 2026-05-21 | Mapper: mimo-v2.5-pro-precision*
