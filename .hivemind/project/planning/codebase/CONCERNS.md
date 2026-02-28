# Codebase Concerns & Tech Debt

> Generated: 2026-02-28 | Source: src/ (157 files, 35,613 lines)
> Severity Scale: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)

## Summary

| Severity | Count |
|----------|-------|
| P0 — Critical | 3 |
| P1 — High | 6 |
| P2 — Medium | 8 |
| P3 — Low | 5 |
| **Total** | **22** |

**Key metrics:**
- Dead/near-dead files: 11 (1,407 lines)
- Files >300 lines: 44
- Silent `catch {}` blocks (no error binding): 114
- Swallowed `.catch(() =>` promises: 11
- `as any` type casts: 4
- `@ts-ignore`/`@ts-expect-error`: 1
- Lib files with NO test: 29/56 (52%)
- Tool files with NO test: 6/14 (43%)

---

## P0 — Critical

### P0-1: Duplicate Context Injection — Pre-Stop Checklist in TWO Hooks

- **Location**: `src/hooks/session-lifecycle.ts:68` AND `src/hooks/messages-transform.ts:79`
- **Evidence**: Both hooks inject `<system-reminder>CHECKLIST BEFORE STOPPING` blocks independently. `session-lifecycle.ts` injects via `output.system.push(reminder)` (SYSTEM channel). `messages-transform.ts` injects via `appendSyntheticPart()` (USER channel synthetic part). Both fire every turn.
- **Impact**: Doubles token cost for the checklist (~500+ tokens/turn wasted). Confuses the LLM with contradictory or redundant instructions from two channels. This is the #1 contributor to the RANK-1 bloated context problem (~11,360 tokens/turn).
- **Recommendation**: Remove checklist from `session-lifecycle.ts`. Canonical location is `messages-transform.ts` (it has richer logic: entity checks, session boundary, pending tasks). The system hook should NOT duplicate what the message hook already handles.

### P0-2: Duplicate First-Turn Confirmation Injection

- **Location**: `src/hooks/session-lifecycle.ts:182` AND `src/hooks/messages-transform.ts:356-358`
- **Evidence**: `generateFirstTurnConfirmationBlock()` is called in BOTH hooks when `state.first_turn_confirmation.required` is true. `session-lifecycle.ts` adds it to system prompt lines. `messages-transform.ts` adds it as a synthetic prepend part.
- **Impact**: The LLM receives the first-turn confirmation contract TWICE on the first turn — once in SYSTEM, once in USER. This wastes ~200 tokens and can cause the LLM to respond to the contract twice.
- **Recommendation**: Remove from `session-lifecycle.ts`. The `messages-transform.ts` injection is the canonical path (it also handles the confirmation detection logic at lines 362-378 and 484-501).

### P0-3: Triple Entity Checklist Evaluation Per Turn

- **Location**: `src/hooks/session-lifecycle.ts:56`, `src/hooks/messages-transform.ts:575`, `src/hooks/soft-governance.ts:392`
- **Evidence**: `evaluateEntityChecklist()` is called in THREE separate hooks, each doing redundant disk I/O (reads brain.json, config, mems.json, anchors.json). All three fire per turn.
- **Impact**: 3x file reads for the same checklist data per turn. Each evaluation reads 5+ files from disk. Combined with the `packCognitiveState()` call that also reads these same files, this means 20+ redundant disk reads per turn.
- **Recommendation**: Evaluate once (in `messages-transform.ts` which has the richest context), cache the result in brain state via `queueStateMutation`, and have other hooks read the cached result.

---

## P1 — High

### P1-1: Massive Synchronous I/O in Hot Path (`packCognitiveState`)

- **Location**: `src/lib/cognitive-packer.ts:258-562`
- **Evidence**: `packCognitiveState()` is a synchronous function that calls `readFileSync` / `existsSync` **19 times** across 6 JSON files (trajectory.json, plans.json, tasks.json, mems.json, anchors.json, compressed-codemap.json). It is called every turn from `messages-transform.ts:536`.
- **Impact**: Blocks the Node.js event loop for the duration of 6+ file reads + JSON parses on every single turn. With large graph files (tasks.json can be 50KB+), this introduces perceptible latency.
- **Recommendation**: Convert to async (`async function packCognitiveState`) with `readFile` from `fs/promises`. The caller in `messages-transform.ts` is already in an async context.

### P1-2: Synchronous I/O in `session_coherence.ts`

- **Location**: `src/lib/session_coherence.ts:72,163,180,211,225,234,252,270`
- **Evidence**: 9 `readFileSync` calls in functions that load archived sessions, brain state, hierarchy, tasks, mems, and anchors. Called on first turn from `messages-transform.ts:342-345`.
- **Impact**: Blocks event loop during first-turn context assembly. Reads the same files that `packCognitiveState` also reads.
- **Recommendation**: Convert to async. Merge overlapping reads with cognitive-packer to avoid duplicate I/O.

### P1-3: Duplicate `detectOffTrackIntent` Functions

- **Location**: `src/hooks/messages-transform.ts:169-185` AND `src/hooks/soft-governance.ts:199-218`
- **Evidence**: Two separate `detectOffTrackIntent` functions with identical keyword lists (`"park this"`, `"off-track"`, `"off track"`, `"later"`, `"after this"`, `"different slice"`, `"out of scope"`, `"todo pending"`). Different signatures: messages-transform takes `text: string`, soft-governance takes `toolName: string, output: {...}`.
- **Impact**: Keyword list drift risk — if one is updated, the other may not be. Semantic duplication makes the codebase harder to maintain.
- **Recommendation**: Extract shared keyword matching to a utility in `src/lib/` (e.g., `off-track-detector.ts`). Both hooks import and use it with their own input extraction.

### P1-4: `lib/index.ts` Barrel Exports Dead Modules

- **Location**: `src/lib/index.ts:35-37`
- **Evidence**: The barrel file exports `event-consumers.js`, `session-intent-classifier.js`, and `planning-materializer.js` — all three are confirmed dead code with 0 importers outside the barrel itself. The barrel has 36 re-exports total.
- **Impact**: Increases bundle size. Creates false sense that these modules are part of the API surface. Tree-shaking may or may not eliminate them depending on build config.
- **Recommendation**: Remove the 3 dead exports from the barrel. Consider whether the barrel pattern is even needed (all consumers import directly from individual modules, not from the barrel).

### P1-5: 114 Silent Catch Blocks (`catch {}`)

- **Location**: Distributed across 60+ files. Heaviest concentrations:
  - `src/lib/persistence.ts` — 14 catch blocks
  - `src/hooks/messages-transform.ts` — 5 silent catches
  - `src/lib/migrate.ts` — 5 silent catches
  - `src/lib/session-swarm.ts` — 5 silent catches
  - `src/lib/code-intel/tree-sitter-loader.ts` — 6 silent catches
  - `src/cli/sync-assets.ts` — 5 silent catches
- **Evidence**: 114 `} catch {` blocks with no error variable binding. Additionally, 11 `.catch(() =>` promise swallowers (e.g., `src/lib/graph/shared.ts:123`, `src/lib/persistence.ts:372`).
- **Impact**: Errors are silently swallowed. When something breaks, there is NO diagnostic trail. The "P3: never break flow" philosophy has been applied too broadly — even in non-critical paths like migration and session archival where logging the error would be valuable.
- **Recommendation**: Audit all 114 catch blocks. For each: (1) If truly non-fatal, add a comment explaining WHY. (2) If in a non-hot path, add `await log.warn(...)`. (3) Never swallow errors in persistence/migration code — those failures cascade.

### P1-6: 29 of 56 Lib Files Have NO Test Coverage (52%)

- **Location**: See [Test Coverage Gaps](#test-coverage-gaps) section below.
- **Evidence**: Critical untested modules include:
  - `src/lib/cognitive-packer.ts` (622 lines) — the context compiler, core to every turn
  - `src/lib/session_coherence.ts` (604 lines) — first-turn context assembly
  - `src/lib/compaction-engine.ts` (440 lines) — session compaction logic
  - `src/lib/session-engine.ts` (640 lines) — core session orchestration
  - `src/lib/session-governance.ts` (317+ lines) — governance signal builder
- **Impact**: Any refactoring of these files has no safety net. The context injection pipeline (cognitive-packer + session_coherence + session-governance) is the most critical path and has ZERO unit tests.
- **Recommendation**: Prioritize test coverage for the context injection pipeline before any refactoring. At minimum: `cognitive-packer.ts`, `session_coherence.ts`, `compaction-engine.ts`.

---

## P2 — Medium

### P2-1: 11 Dead/Near-Dead Files (1,407 Lines)

- **Location**: See [Dead Code Inventory](#dead-code-inventory) below.
- **Evidence**: 3 files are fully dead (0 importers anywhere): `event-consumers.ts`, `planning-materializer.ts`, `session-intent-classifier.ts`. 8 more are only imported from the barrel (`lib/index.ts`) or from 1-2 files but never called in any execution path.
- **Impact**: 1,407 lines of dead weight. Increases cognitive load for developers, increases build times marginally, and creates false API surface.
- **Recommendation**: Delete the 3 fully dead files. Audit the 8 near-dead files to confirm they have active callers via the barrel.

### P2-2: `messages-transform.ts` is a God Object (679 lines, 13 imports)

- **Location**: `src/hooks/messages-transform.ts`
- **Evidence**: 679 lines, 13 internal imports, 7 distinct phases of processing. It handles: first-turn injection, recent message capture, memory governance classification, off-track intent detection, auto-realignment, cognitive packer injection, anchor context injection, pre-stop checklist assembly, entity checklist evaluation, pending task counting, session boundary checks, and session persistence checks.
- **Impact**: Single point of failure for the entire message pipeline. Any change risks breaking multiple unrelated features. Extremely difficult to unit test in isolation.
- **Recommendation**: Extract into phase-specific modules: `src/hooks/message-phases/first-turn.ts`, `src/hooks/message-phases/context-injection.ts`, `src/hooks/message-phases/checklist.ts`. The main hook becomes a thin orchestrator.

### P2-3: `hierarchy-tree.ts` is Oversized (1,070 lines)

- **Location**: `src/lib/hierarchy-tree.ts`
- **Evidence**: 1,070 lines — the largest file in the codebase. Contains tree CRUD, traversal, serialization, counting, and validation all in one file.
- **Impact**: Difficult to navigate and maintain. High change risk.
- **Recommendation**: Split into `hierarchy-crud.ts`, `hierarchy-traversal.ts`, `hierarchy-serialization.ts`.

### P2-4: `detection.ts` Does Too Many Things (883 lines)

- **Location**: `src/lib/detection.ts`
- **Evidence**: 883 lines. Framework detection, dependency scanning, language detection, and diagnostic generation all in one file.
- **Impact**: High coupling. Changes to framework detection may affect language detection.
- **Recommendation**: Split by concern: `detect-framework.ts`, `detect-language.ts`, `detect-dependencies.ts`.

### P2-5: High Fan-In on `persistence.ts` and `paths.ts`

- **Location**: `src/lib/persistence.ts` (376 lines), `src/lib/paths.ts` (530 lines)
- **Evidence**: `createStateManager` from `persistence.ts` is imported by at least 5 hooks and multiple tools. `getEffectivePaths` from `paths.ts` is imported by 20+ files. These are the two most-imported modules.
- **Impact**: Any breaking change to these modules cascades across the entire codebase. `paths.ts` at 530 lines also contains path construction, validation, and migration logic that should be separate.
- **Recommendation**: `paths.ts` should be split: pure path definitions (immutable) vs. path validation/migration (mutable). `persistence.ts` API should be stabilized and frozen.

### P2-6: Hardcoded Budget Constants Scattered Across Files

- **Location**:
  - `src/hooks/session-lifecycle.ts:124` — `BUDGET_CHARS = isBootstrapActive ? 4500 : 2500`
  - `src/hooks/messages-transform.ts:74` — `MAX_CHECKLIST_CHARS = 1000`
  - `src/hooks/compaction.ts:35` — `INJECTION_BUDGET_CHARS = 12000`
  - `src/hooks/session_coherence/main_session_start.ts:45` — `MAX_TRANSFORMED_PROMPT_CHARS = 2500`
  - `src/lib/cognitive-packer.ts:526` — `ANTI_PATTERNS_BUDGET = 500`
  - `src/lib/budget.ts:*` — `DEFAULT_CONTEXT_BUDGET`, `DEFAULT_MAX_RESPONSE_TOKENS`
  - `src/lib/gatekeeper.ts:44` — `maxDriftScore = 40, maxTurns = 400`
  - `src/lib/state-mutation-queue.ts:116` — `MAX_QUEUE_SIZE = 100`
  - `src/lib/file-lock.ts:44` — `stale = 10000, update = 5000`
  - `src/lib/code-intel/selective-injector.ts:39-42` — `SMALL_FILE_THRESHOLD = 500`, `MIN_PER_FILE_BUDGET = 200`
- **Evidence**: At least 15 budget/threshold constants are hardcoded across 10+ files. Some overlap (e.g., `budget.ts` defines `DEFAULT_CONTEXT_BUDGET` but `session-lifecycle.ts` uses its own `BUDGET_CHARS`).
- **Impact**: Tuning context injection requires editing 5+ files. No single place to see all budget parameters.
- **Recommendation**: Consolidate all budget constants into `src/lib/budget.ts` or `src/schemas/config.ts`. Make them configurable via hivemind config where appropriate.

### P2-7: `brain-state.ts` Schema is Oversized (651 lines)

- **Location**: `src/schemas/brain-state.ts`
- **Evidence**: 651 lines for a single Zod schema definition. Contains the schema, defaults, migration helpers, type exports, and utility functions all in one file.
- **Impact**: Hard to find specific fields. Schema changes require navigating a 651-line file.
- **Recommendation**: Split into `brain-state-schema.ts` (pure schema), `brain-state-defaults.ts` (default values), `brain-state-types.ts` (type exports).

### P2-8: `graph-nodes.ts` Schema is Oversized (518 lines)

- **Location**: `src/schemas/graph-nodes.ts`
- **Evidence**: 518 lines defining all graph node types (Trajectory, Plan, Phase, Task, Mem, Anchor, etc.) with FK constraints and validation.
- **Impact**: High change risk — any schema change touches this massive file.
- **Recommendation**: Split into per-entity files: `schema-trajectory.ts`, `schema-task.ts`, `schema-mem.ts`, etc.

---

## P3 — Low

### P3-1: 4 `as any` Type Casts

- **Location**:
  - `src/lib/code-intel/tree-sitter-loader.ts:104,111`
  - `src/lib/ideation-engine.ts:66,95`
- **Evidence**: `(node.children as any[])` and `(spec as any).requirements`.
- **Impact**: Minor type safety gaps. Tree-sitter casts are acceptable (external API). Ideation-engine casts suggest the spec type is too narrow.
- **Recommendation**: Fix `ideation-engine.ts` casts by widening the spec type. Tree-sitter casts can remain with a comment.

### P3-2: 1 `@ts-ignore` Directive

- **Location**: `src/dashboard-v2/src/api.ts:212`
- **Evidence**: `// @ts-ignore - EventSource might not be in standard types but could be polyfilled`
- **Impact**: Minor. Dashboard code, not in the hot path.
- **Recommendation**: Add proper type declaration for EventSource or use `@ts-expect-error` with a more specific message.

### P3-3: Inconsistent Error Handling Patterns

- **Location**: Various. Some files use `catch (error: unknown)` (proper), some use `catch (err)` (implicit any), some use `catch {}` (silent).
- **Evidence**: Three distinct patterns across the codebase with no consistent standard.
- **Impact**: Inconsistency makes it harder to audit error handling.
- **Recommendation**: Standardize on `catch (error: unknown)` with explicit type narrowing. Add ESLint rule `no-implicit-any-catch`.

### P3-4: Promise Fire-and-Forget in Logging

- **Location**: `src/lib/cognitive-packer.ts:282,301`
- **Evidence**: `getLogger(paths.logsDir).then(log => log.debug(...))` — fire-and-forget promise. If logging fails, the error is unhandled.
- **Impact**: Minor. Logging failures are non-critical.
- **Recommendation**: Add `.catch(() => {})` to these fire-and-forget logging calls, or restructure to use pre-resolved logger.

### P3-5: Dashboard-v2 Code Quality

- **Location**: `src/dashboard-v2/` (18+ files)
- **Evidence**: `snapshot.ts` (789 lines), `i18n.ts` (530 lines) — both oversized. Multiple silent catch blocks. `@ts-ignore` usage.
- **Impact**: Low — dashboard is a separate concern, not in the plugin hot path.
- **Recommendation**: Defer. Dashboard refactoring is low priority relative to core plugin concerns.

---

## Dead Code Inventory

| File | Lines | Importers (excl. barrel) | Status |
|------|-------|--------------------------|--------|
| `src/lib/event-consumers.ts` | 69 | 0 (barrel only) | DEAD — only imports `event-bus.ts`, all 4 handler bodies are TODO stubs |
| `src/lib/planning-materializer.ts` | 262 | 0 (barrel only) | DEAD — Wave alpha artifact, never wired |
| `src/lib/session-intent-classifier.ts` | 144 | 0 (barrel only) | DEAD — Wave alpha artifact, never wired |
| `src/lib/watcher.ts` | 217 | 2 (`index.ts`, `code-intel/watch-integration.ts`) | NEAR-DEAD — only used by code-intel subsystem |
| `src/lib/event-bus.ts` | 133 | 6 files | ALIVE — used by sot-governance, watcher, tools, event-consumers |
| `src/lib/context-purifier.ts` | 100 | 2 (`session-lifecycle.ts`, `hivemind-context.ts`) | ALIVE — small footprint, active |
| `src/lib/budget.ts` | 39 | 3 (`schemas/config.ts`, `session_coherence.ts`, `session-coherence-types.ts`) | ALIVE — small, stable constants |
| `src/lib/gatekeeper.ts` | 147 | 1 (`hooks/tool-gate.ts`) | LOW USE — only one consumer |
| `src/lib/sdk-access.ts` | 64 | 2 (`auto-commit.ts`, `compaction-engine.ts`) | LOW USE — SDK accessor |
| `src/lib/project-snapshot.ts` | 168 | 1 (`session-governance.ts`) | LOW USE — only one consumer |
| `src/lib/session-coherence-types.ts` | 64 | 2 (`session_coherence.ts`, `session_coherence/types.ts`) | ALIVE — type definitions |

**Total dead lines: 475** (event-consumers + planning-materializer + session-intent-classifier)
**Total near-dead lines: 932** (remaining files with 0-2 importers)

---

## Oversized File Inventory

| File | Lines | Responsibilities | Recommendation |
|------|-------|-------------------|----------------|
| `src/lib/hierarchy-tree.ts` | 1,070 | Tree CRUD, traversal, counting, serialization, validation | Split into 3 modules |
| `src/lib/detection.ts` | 883 | Framework detection, language detection, dependency scanning, diagnostics | Split by concern |
| `src/cli/init.ts` | 881 | CLI init with multiple subcommands | Split by subcommand |
| `src/lib/graph-migrate.ts` | 853 | Graph migration across multiple schema versions | Acceptable — migration files grow |
| `src/lib/code-intel/signature-extractor.ts` | 821 | AST signature extraction for multiple languages | Acceptable — language-specific logic |
| `src/dashboard-v2/src/snapshot.ts` | 789 | Dashboard state snapshot | Dashboard concern — defer |
| `src/lib/hivefiver-integration.ts` | 742 | HiveFiver workflow detection and auto-realignment | Review for extraction |
| `src/cli/sync-assets.ts` | 723 | Asset synchronization with smart merge | Review for extraction |
| `src/hooks/soft-governance.ts` | 691 | Tool execution tracking, drift detection, off-track detection | Split: counter + detector |
| `src/hooks/messages-transform.ts` | 679 | 7-phase message transformation pipeline | Split into phase modules |
| `src/lib/state-mutation-queue.ts` | 670 | CQRS mutation queue with flushing | Review — may be over-engineered |
| `src/schemas/brain-state.ts` | 651 | Brain state schema + defaults + types + utilities | Split schema from utilities |
| `src/lib/session-engine.ts` | 640 | Core session orchestration | Review responsibilities |
| `src/lib/cognitive-packer.ts` | 622 | Context compiler — XML packing with budget management | Split: packer + checklist + reader |
| `src/lib/session_coherence.ts` | 604 | First-turn context retrieval and prompt building | Split: retrieval + transformation |
| `src/lib/paths.ts` | 530 | Path definitions + validation + migration | Split: definitions (frozen) + logic |
| `src/schemas/graph-nodes.ts` | 518 | All graph node Zod schemas | Split per entity type |
| `src/lib/fs/session-io.ts` | 514 | Session file I/O operations | Review for simplification |
| `src/lib/manifest.ts` | 494 | Manifest file management | Review responsibilities |

**Total files >300 lines: 44** (including `total` line from wc -l)

---

## Duplication Map

| Pattern | Location 1 | Location 2 | Resolution |
|---------|------------|------------|------------|
| Pre-stop checklist injection | `src/hooks/session-lifecycle.ts:68` | `src/hooks/messages-transform.ts:79-89,669-672` | Remove from session-lifecycle.ts |
| First-turn confirmation block | `src/hooks/session-lifecycle.ts:182` | `src/hooks/messages-transform.ts:355-359` | Remove from session-lifecycle.ts |
| `detectOffTrackIntent()` function | `src/hooks/messages-transform.ts:169-185` | `src/hooks/soft-governance.ts:199-218` | Extract to shared `src/lib/off-track-detector.ts` |
| `evaluateEntityChecklist()` call | `src/hooks/session-lifecycle.ts:56` | `src/hooks/messages-transform.ts:575` + `src/hooks/soft-governance.ts:392` | Evaluate once, cache in state |
| Off-track keyword list | `src/hooks/messages-transform.ts:173-182` | `src/hooks/soft-governance.ts:207-215` | Single source of truth in shared module |
| Brain state file reads | `src/lib/cognitive-packer.ts` (6+ reads) | `src/lib/session_coherence.ts` (9 reads) | Shared read-once cache |

---

## Test Coverage Gaps

### Lib Files (29/56 untested — 52%)

| Source File | Has Test? | Critical Functions Untested |
|-------------|-----------|----------------------------|
| `src/lib/cognitive-packer.ts` | NO | `packCognitiveState`, `buildEmptyStateXml`, `evaluateEntityChecklistDigest` |
| `src/lib/session_coherence.ts` | NO | `loadLastSessionContext`, `buildTransformedPrompt`, `detectFirstTurn` |
| `src/lib/compaction-engine.ts` | NO | `compactSession`, `buildCompactionPrompt` |
| `src/lib/session-engine.ts` | NO | `handleDeclareIntent`, `handleMapContext`, `handleCompactSession` |
| `src/lib/session-governance.ts` | NO | `buildGovernanceSignals` |
| `src/lib/anchors.ts` | NO | `loadAnchors`, `saveAnchor` |
| `src/lib/chain-analysis.ts` | NO | `analyzeChain` |
| `src/lib/commit-advisor.ts` | NO | `generateCommitMessage` |
| `src/lib/context-purifier.ts` | NO | `dedupeContextLines`, `purifyContextFragments` |
| `src/lib/doctor-recovery.ts` | NO | `doctorRecovery` |
| `src/lib/event-bus.ts` | NO | `eventBus`, `createEvent` |
| `src/lib/event-consumers.ts` | NO | All (dead code) |
| `src/lib/file-lock.ts` | NO | `FileLock.acquire`, `FileLock.release` |
| `src/lib/gatekeeper.ts` | NO | `validateSessionState` |
| `src/lib/graph-io.ts` | NO | `loadGraphTasks`, `loadTrajectory` |
| `src/lib/inspect-engine.ts` | NO | `inspectState` |
| `src/lib/long-session.ts` | NO | Long session detection |
| `src/lib/onboarding.ts` | NO | `detectBrownfield`, `handleStaleSession` |
| `src/lib/planning-materializer.ts` | NO | All (dead code) |
| `src/lib/project-snapshot.ts` | NO | `collectProjectSnapshot` |
| `src/lib/sdk-access.ts` | NO | `getShell`, `getClient` |
| `src/lib/session-coherence-types.ts` | NO | Type definitions (low risk) |
| `src/lib/session-intent-classifier.ts` | NO | All (dead code) |
| `src/lib/session-memory-classifier.ts` | NO | `classifySessionMemoryArtifact` |
| `src/lib/session-split.ts` | NO | `splitSession` |
| `src/lib/session-swarm.ts` | NO | `loadSwarmState`, `archiveSwarmSession` |
| `src/lib/sot-governance.ts` | NO | `loadPendingChanges`, `loadVerificationLedger` |
| `src/lib/tool-activation.ts` | NO | Tool activation logic |
| `src/lib/tool-response.ts` | NO | `toSuccessOutput`, `toErrorOutput` |
| `src/lib/watcher.ts` | NO | `FileSystemWatcher` |

### Hook Files (3/10 untested)

| Source File | Has Test? | Critical Functions Untested |
|-------------|-----------|----------------------------|
| `src/hooks/swarm-executor.ts` | NO | Swarm execution hooks |
| `src/hooks/session_coherence/main_session_start.ts` | NO | Session start coherence logic |
| `src/hooks/session_coherence/types.ts` | NO | Type re-exports (low risk) |

### Tool Files (6/14 untested — 43%)

| Source File | Has Test? | Critical Functions Untested |
|-------------|-----------|----------------------------|
| `src/tools/hivemind-anchor.ts` | NO | Anchor save/list/get |
| `src/tools/hivemind-ideate.ts` | NO | Q.U.A.N.T. matrix evaluation |
| `src/tools/hivemind-inspect.ts` | NO | State inspection |
| `src/tools/hivemind-mesh-pull.ts` | NO | Blast radius analysis |
| `src/tools/hivemind-precision-patch.ts` | NO | Symbol-level patching |
| `src/tools/hivemind-read-skeleton.ts` | NO | AST skeleton extraction |

---

## Performance Risks

### Synchronous File I/O in Every-Turn Path

| File | Sync Calls | Called From | Frequency |
|------|-----------|-------------|-----------|
| `src/lib/cognitive-packer.ts` | 19 (`readFileSync`, `existsSync`) | `messages-transform.ts:536` | Every turn |
| `src/lib/session_coherence.ts` | 9 (`readFileSync`) | `messages-transform.ts:342` | First turn |
| `src/hooks/messages-transform.ts` | 2 (`existsSync`, `readdirSync`) | Hook pipeline | Every turn |
| `src/lib/session-swarm.ts` | 3 (`readFileSync`, `readdirSync`) | Various | Per swarm op |

**Total blocking I/O per turn: ~21 sync calls minimum** (cognitive-packer + messages-transform).

### Redundant File Reads Per Turn

The same JSON files are read multiple times per turn by different hooks/libs:

| File Read | Read By |
|-----------|---------|
| `brain.json` | `persistence.ts` (via stateManager.load) x3 hooks + `cognitive-packer.ts` |
| `hierarchy.json` | `hierarchy-tree.ts` (via loadTree) + `session_coherence.ts` |
| `anchors.json` | `cognitive-packer.ts` + `session_coherence.ts` |
| `mems.json` | `cognitive-packer.ts` + `session_coherence.ts` + `entity-checklist.ts` |
| `trajectory.json` | `cognitive-packer.ts` + `messages-transform.ts` (via loadTrajectory) |
| `tasks.json` | `cognitive-packer.ts` + `messages-transform.ts` (via loadGraphTasks) |

**Estimated redundant reads per turn: 8-12 file reads that could be cached.**

---

## Security Considerations

### File Permission Handling

- **Location**: `src/lib/persistence.ts`
- **Risk**: File operations use default permissions. No explicit `mode` set on `writeFile` calls.
- **Current Mitigation**: Files are written to `.hivemind/` which is gitignored.
- **Recommendation**: Low risk — brain.json contains session metadata, not secrets.

### No Hardcoded Paths Found

- **Evidence**: `grep` for `/Users/`, `/home/`, `/tmp/` returned 0 matches in source files.
- **Status**: Clean. All paths use `getEffectivePaths()`.

---

## Configuration Debt

### Scattered Magic Numbers

15+ budget/threshold constants are hardcoded across 10+ files (see P2-6 above). Key examples:
- Turn thresholds: `turn_count <= 2` (bootstrap), `maxTurns = 400` (gatekeeper)
- Character budgets: 1000, 2500, 4500, 5000, 12000 across different files
- Queue sizes: `MAX_QUEUE_SIZE = 100`
- Timing: `stale = 10000`, `update = 5000`, `debounceMs = 300`

---

## Metrics Summary

| Metric | Count |
|--------|-------|
| Total source files | 157 |
| Total source lines | 35,613 |
| Dead exports (0 importers) | 3 files (475 lines) |
| Near-dead files (1-2 importers) | 8 files (932 lines) |
| Files >300 lines | 44 |
| Files >600 lines | 15 |
| Files >800 lines | 5 |
| `as any` casts | 4 |
| `@ts-ignore` / `@ts-expect-error` | 1 |
| Silent `catch {}` blocks | 114 |
| Swallowed `.catch(() =>` | 11 |
| Hardcoded budget constants | 15+ |
| Lib files without tests | 29/56 (52%) |
| Tool files without tests | 6/14 (43%) |
| Duplicate function implementations | 2 (`detectOffTrackIntent`, checklist injection) |
| Triple-evaluated functions per turn | 1 (`evaluateEntityChecklist`) |
| Sync file reads per turn (hot path) | ~21 |
| Redundant file reads per turn | 8-12 |

---

*Concerns audit: 2026-02-28*
