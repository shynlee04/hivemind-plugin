# Phase 51: synthesize-core-tmux-classes-in-tree - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

## Phase Boundary

Replace the runtime-injection surface of `src/features/tmux/fork-bridge.ts` (156 LOC) with three concrete in-tree classes — `TmuxMultiplexer`, `SessionManager`, `PaneGridPlanner` — synthesized from the opencode-tmux fork reference patterns (preserved in P50's backup tarball). Deliverables: 3 new files at `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` (~770 LOC combined, function-level `// ORIGIN:` annotations), a rewritten `integration.ts` factory-of-real-classes (~200 LOC), and removal of `fork-bridge.ts` plus its test. Net codebase reduction ~100 LOC. Coverage floor: 6 new BATS scenarios (2 per class cluster) + 15+ new vitest in `tests/lib/tmux/`. L1 evidence required: BATS 6/6, vitest 15+ (no regressions in the 363-LOC `integration.test.ts` or 12-test `tmux-copilot.test.ts`), and `tsc --noEmit` exit 0.

## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `51-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `51-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Three concrete in-tree classes (TmuxMultiplexer, SessionManager, PaneGridPlanner) synthesized from opencode-tmux fork patterns
- Function-level `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>` annotations on every public class method and exported function
- Structural types (PaneTreeNode, SplitDirection, PaneGridPlanner) carried forward with the same shape
- Rewrite of `src/features/tmux/integration.ts` to a factory-of-real-classes (graceful-fallback preserved, no runtime injection)
- Removal of `src/features/tmux/fork-bridge.ts` and its test
- 6 new BATS scenarios (2 per class cluster) and 15+ new vitest in `tests/lib/tmux/`
- Existing `integration.test.ts` (363 LOC) and `tmux-copilot.test.ts` (12 tests) must continue to pass without modification
- L1 evidence: BATS 6/6, vitest 15+, `tsc --noEmit` exit 0

**Out of scope (from SPEC.md):**
- Adding new OpenCode plugin surfaces or hooks (already covered by P49)
- Sidecar dashboard work (separate roadmap track)
- Generic shell PTY behavior (separate CP-PTY track)
- Re-introducing the opencode-tmux fork or any external runtime dependency
- Modifying the `tmux-copilot` tool surface or its tests

## Implementation Decisions

> **Auto-mode audit trail** — `--auto` selected all gray areas; each decision below was auto-picked per `workflows/discuss-phase/modes/auto.md`.
>
> `[--auto] Selected all gray areas: type co-location strategy, forkSessionManager parameter fate, error/exception boundaries, ORIGIN annotation granularity, class instantiation order, BATS socket naming, BATS execution mode.`

### Type co-location strategy (SPEC REQ-51-03 OR clause)
- **D-01:** Create a shared `src/features/tmux/types.ts` exporting the three structural types (`PaneTreeNode`, `SplitDirection`, `PaneGridPlanner` interface). The three new class files import from it.
  - `[auto] Type co-location — Q: "Given SPEC REQ-51-03's OR clause, where should structural types live?" → Selected: "Shared src/features/tmux/types.ts" (recommended default).`
  - Rationale: matches the `fork-bridge.ts` precedent of co-locating structural types at the top of the file (here promoted to a dedicated file because there are now three classes rather than one); keeps types grep-discoverable; avoids polluting each class file with the same 30 lines of type declarations.

### `forkSessionManager` parameter fate in `createTmuxIntegrationIfSupported`
- **D-02:** Remove the `forkSessionManager` parameter from `createTmuxIntegrationIfSupported` entirely. With the fork removed in P50 (commit `5b49030f`), there is no producer, no consumer, and no future need.
  - `[auto] forkSessionManager fate — Q: "After P50 removed the fork, what happens to the forkSessionManager parameter currently called at integration.ts L200?" → Selected: "Remove parameter entirely" (recommended default).`
  - Rationale: cleanest outcome. No deprecation shim — there is no external API to break (this is internal factory wiring). The module-private `forkSessionManager` singleton and its `setForkSessionManager` / `getForkSessionManager` / `hasForkSessionManager` accessors in `fork-bridge.ts` go away with the file.

### Error / exception boundaries in concrete classes
- **D-03:** All public methods on the three concrete classes throw a `[Harness]TmuxError`-prefixed error on protocol failures (tmux binary missing, socket unreachable, send-keys non-zero exit). No `Result<T, E>` discriminated unions.
  - `[auto] Error boundaries — Q: "How should concrete class methods report tmux protocol failures?" → Selected: "Throw [Harness]-prefixed Error" (recommended default).`
  - Rationale: matches the existing `fork-bridge.ts` throw convention at L93-95; satisfies `AGENTS.md` rule "`[Harness]` prefix on all thrown errors"; avoids introducing a new return-type vocabulary that the `tmux-copilot` tool (and its 12 tests) does not expect. Callers that need a `Result`-style API can wrap the throw site themselves.

### ORIGIN annotation granularity (SPEC REQ-51-02)
- **D-04:** Annotate every exported function and every public class method with `// ORIGIN: opencode-tmux/src/<filename>.ts:<line>`. Do not annotate private helpers.
  - `[auto] ORIGIN granularity — Q: "How deep should the function-level ORIGIN annotations go?" → Selected: "Exported functions + public methods only" (recommended default).`
  - Rationale: SPEC REQ-51-02 says "function-level", which is satisfied by exported + public surface. Annotating private helpers would clutter the diff with low-signal lines (most helpers are 1–3 LOC and obviously derived from the same source region as their caller).

### Class instantiation order in the factory
- **D-05:** Instantiate in dependency order — `PaneGridPlanner` first (leaf, no dependencies), then `SessionManager` (consumes the grid planner for pane-layout decisions), then `TmuxMultiplexer` (consumes both session manager and grid planner). Wire them via constructor injection in the factory.
  - `[auto] Instantiation order — Q: "In what order should the factory construct the three classes?" → Selected: "Dependency order: PaneGridPlanner → SessionManager → TmuxMultiplexer" (recommended default).`
  - Rationale: proper dependency-injection ordering eliminates circular-dependency risk. The current `fork-bridge.ts` singleton pattern is the thing we are explicitly moving away from; constructor injection in dependency order is the cleanest replacement.

### BATS socket naming strategy
- **D-06:** Use PID-based socket names — `tmux -L hivemind-test-$$` where `$$` expands to the BATS test process PID. Tear down in each scenario's `teardown()` with `tmux -L hivemind-test-$$ kill-server`.
  - `[auto] BATS socket naming — Q: "What strategy for naming the tmux test socket in BATS scenarios?" → Selected: "PID-based (\$\$) with per-scenario teardown" (recommended default).`
  - Rationale: deterministic per run, no external dependencies (`uuidgen` is not POSIX; `md5` of `$RANDOM` is non-unique across rapid runs), and PID-based teardown is naturally idempotent — a stale `kill-server` against a non-existent socket is a no-op rather than a flaky failure.

### BATS execution mode
- **D-07:** Run BATS scenarios sequentially (the default). Do not add `bats --jobs N` parallelism in this phase.
  - `[auto] BATS execution mode — Q: "Should BATS scenarios run in parallel or sequentially?" → Selected: "Sequential" (recommended default).`
  - Rationale: the 6 new scenarios all touch the same per-PID tmux socket; parallel execution would either require per-scenario PIDs (defeating the `$$` simplicity) or risk socket collisions. Performance is not a constraint at 6 scenarios; if it becomes one, revisit in a later phase after the scenarios are isolated.

### the agent's Discretion

The implementer has flexibility for the following details (no SPEC constraint, no user preference captured):
- Exact naming of private helper methods (must follow kebab-case per `codebase/CONVENTIONS.md`; specific verb choices are flexible)
- Specific BATS assertion phrasing (e.g., `[ "$status" -eq 0 ]` vs `assert_success` helper) — pick what reads cleanest per scenario
- JSDoc depth on private helpers (public APIs require full JSDoc per `AGENTS.md`; private helpers can be one-line)
- Test file placement within `tests/lib/tmux/` (mirror `src/features/tmux/` structure per project convention, but sub-organization is flexible)
- The exact `TmuxError` class hierarchy — flat `Error` subclass with `[Harness]Tmux*` message prefix is sufficient unless a downstream caller benefits from typed discrimination (no such caller exists today)

### Folded Todos

- **`fork-opencode-tmux-audit.md`** (priority: high, source: hm-explore session, date 2026-05-31, match score: 0.6, threshold 0.4 → auto-folded)
  - **Original problem (5 audit tasks):** (1) fork `opencode-tmux` and create under Hivemind org, (2) read and understand the codebase, (3) document Hivemind-specific modifications, (4) identify integration points with session-tracker, (5) define fallback strategy for no-Tmux environment.
  - **How it fits Phase 51 scope:** All five acceptance criteria are now satisfied by upstream phases — P49 closed the wiring and integration-point questions; P50 (commit `5b49030f`) created and then deliberately removed the fork, completed the audit, and preserved the fallback strategy as the D-04 graceful-fallback contract. P51 consumes the audit's pattern catalog (preserved in `/tmp/opencode-tmux-backup-1780370747.tar.gz`) as the direct source material for synthesizing the three in-tree classes. After P51 ships, this todo can be promoted to `done/`.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-SPEC.md` — Locked spec: 7 requirements (REQ-51-01..07), ambiguity gate PASSED at 0.172 ≤ 0.20
- `.planning/phases/50-cleanup-opencode-tmux-fork/50-CONTEXT.md` — Prior-phase decisions: D-04 graceful-fallback, audit-informed fork removal, preservation pattern
- `.planning/phases/50-cleanup-opencode-tmux-fork/50-SPEC.md` — Prior-phase scope and what P51 must NOT undo
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CONTEXT.md` — Wiring closure: tmux-copilot tool registered in `src/plugin.ts` (the 4-adapter method surface that P51 must preserve)

### Roadmap and Requirements
- `.planning/ROADMAP.md` — Phase 51 entry (1 plan, depends on P50, references REQ-04/05/07)
- `.planning/PROJECT.md` — Project identity: Hivemind Runtime Composition Engine
- `.planning/REQUIREMENTS.md` — Requirement registry (path-categorized features, REQ-04/05/07 trace)
- `.planning/STATE.md` — Progress snapshot (18/55 phases complete, 100/126 plans, current focus P51)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — System architecture: Tools / Hooks / Task-Mgmt / Coordination → Features → Shared layers; 9-surface CQRS model
- `.planning/codebase/STRUCTURE.md` — File placement conventions, naming, folder registration
- `.planning/codebase/STACK.md` — Tech stack: TypeScript strict + verbatimModuleSyntax, Node.js >= 20, npm, OpenCode Plugin SDK v1.15.10
- `.planning/codebase/INTEGRATIONS.md` — External integrations: no DB, file-based state (`.hivemind/state/`, `.hivemind/journal/`, `.hivemind/lineage/`, `.hivemind/artifacts/`, `.planning/`), OpenCode SDK + MCP + AI SDK
- `.planning/codebase/CONVENTIONS.md` — Code conventions: `[Harness]` prefix on thrown errors, deep-clone-on-read in continuity store, dual-layer state, max 500 LOC per module
- `.planning/codebase/CONCERNS.md` — Module-level concerns
- `.planning/codebase/TESTING.md` — Test infrastructure: vitest + BATS conventions

### Source Code to Remove / Modify / Reuse
- `src/features/tmux/fork-bridge.ts` (156 LOC) — **TO BE REMOVED.** Structural types (`PaneTreeNode`, `SplitDirection`, `PaneGridPlanner`), `ForkSessionManagerAdapter` interface (3 fork-specific methods), module-private singleton via `setForkSessionManager` / `getForkSessionManager` / `hasForkSessionManager`. JSDoc L19-22 lists the 4-adapter method surface that `tmux-copilot` depends on.
- `src/features/tmux/integration.ts` (215 LOC) — **TO BE REWRITTEN** to a factory-of-real-classes (~200 LOC). Helpers to preserve: `resolveBinary`, `getTmuxVersion`, `saveTmuxPort`, `loadTmuxPort`. Current `createTmuxIntegrationIfSupported` calls `setForkSessionManager` at L200 — this call is removed per D-02.
- `src/features/tmux/observers.ts` (93 LOC) — **REUSED UNTOUCHED.** Provides `EnrichedSessionEvent` type, `ForkSessionManager` interface (`onSessionCreated`), and `createTmuxEventObserver(forkSessionManager)` factory. P51's new `SessionManager` will satisfy the same `onSessionCreated` contract.
- `src/tools/tmux-copilot.ts` — **MUST REMAIN UNCHANGED.** Depends on 4-adapter method surface: `sendKeys` / `listPanes` / `createPaneGridPlanner` / `respawnIfKnown`.
- `tests/lib/tmux/integration.test.ts` (363 LOC) — **MUST REMAIN UNCHANGED.** Verifies graceful-fallback and factory contract.
- `tests/lib/tmux/tmux-copilot.test.ts` (12 tests) — **MUST REMAIN UNCHANGED.** Verifies the 4-adapter method surface.
- `src/plugin.ts` — Where `AGENT_DEFAULTS`, `AGENT_TOOLS`, `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` are defined; tmux-copilot is registered here per P49.

### Fork Reference (Patterns Source)
- `/tmp/opencode-tmux-backup-1780370747.tar.gz` — P50 backup tarball. Source of patterns to synthesize into the three new in-tree classes. Preserved at P50 commit `5b49030f` (2026-06-02). The implementer MUST extract the relevant file(s) and read the original implementations before writing the synthesized versions — the `// ORIGIN:` annotations (D-04) reference line numbers in this source.

### Project-wide Governance
- `AGENTS.md` (repo root) — Hivemind project rules: Source-vs-Deploy constitution, no symlinks under `.opencode/`, atomic commits mandated, JSDoc mandated on all functions/classes, `[Harness]` prefix on thrown errors, max 500 LOC per module, no `any` types on new code, TypeScript strict + `verbatimModuleSyntax: true`
- `.planning/AGENTS.md` — Planning/Governance sector rules: L5 docs-only guidance, planning artifacts authorize but do not implement, date-stamping convention, forbidden-mutation boundaries for planning docs
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model, Phase 0 mutation gates, target source planes
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract (hm/hf/gate/stack/gsd), L0–L3 hierarchy

## Existing Code Insights

### Reusable Assets
- **`src/features/tmux/observers.ts:createTmuxEventObserver`** (93 LOC) — Drop-in `onSessionCreated` enrichment factory. The new `SessionManager` will satisfy the same `ForkSessionManager` interface (`onSessionCreated`) so the existing observer wiring keeps working without modification.
- **`src/features/tmux/integration.ts:resolveBinary` / `getTmuxVersion` / `saveTmuxPort` / `loadTmuxPort`** (helpers) — Reused verbatim in the rewritten factory. These were the parts of the graceful-fallback path that survived P50 and are the load-bearing pieces of the D-04 contract.
- **`src/features/tmux/fork-bridge.ts` structural types** (`PaneTreeNode`, `SplitDirection`, `PaneGridPlanner` interface) — Carried forward to the new `src/features/tmux/types.ts` per D-01. Shape is preserved exactly so the `tmux-copilot` tool's 12 tests continue to pass.
- **`fork-bridge.ts` JSDoc L19-22** — Documents the 4-adapter method surface (`sendKeys` / `listPanes` / `createPaneGridPlanner` / `respawnIfKnown`) that `tmux-copilot` depends on. This is the contract the three new classes must collectively preserve.

### Established Patterns
- **`[Harness]` prefix on all thrown errors** (`AGENTS.md`) — All three classes' public methods throw with message prefix `[Harness]Tmux*` per D-03.
- **TypeScript strict mode + `verbatimModuleSyntax: true`** (`codebase/CONVENTIONS.md`) — Use `import type` for type-only imports throughout the new files.
- **JSDoc mandated on all functions/classes** (`AGENTS.md`) — Full JSDoc on every public method of the three new classes, with `// ORIGIN:` annotation per D-04.
- **Max 500 LOC per module** (`AGENTS.md` + `codebase/CONVENTIONS.md`) — Each of the three new files targets ~250 LOC (770/3), leaving headroom. The rewritten `integration.ts` targets ~200 LOC.
- **Deep-clone-on-read in continuity store + dual-layer state** (`codebase/CONVENTIONS.md`) — Not directly relevant to the three new classes, but the `SessionManager` may need to mirror the pattern for its in-memory pane state if it caches anything.
- **Graceful-fallback as a first-class contract** (P50 D-04) — The factory in `integration.ts` must preserve the "no tmux binary → return null integration object" behavior. The fallback path is exercised by `integration.test.ts` and is part of why those 363 LOC of tests must remain unchanged.

### Integration Points
- **`tmux-copilot` tool** (`src/tools/tmux-copilot.ts`) — Consumes the 4-adapter method surface; the three new classes must preserve it exactly. The 12 tests in `tmux-copilot.test.ts` are the regression net.
- **`createTmuxIntegrationIfSupported` factory** (`src/features/tmux/integration.ts`, current call sites) — Rewritten to return an object backed by the three concrete classes instead of a `null` + `setForkSessionManager` injection. Callers that previously got `null` (no tmux) should still get `null`; callers that got a real integration should get a real one whose methods map to the three classes.
- **`createTmuxEventObserver(forkSessionManager)`** (`src/features/tmux/observers.ts`) — Will be wired to the new `SessionManager` (which exposes `onSessionCreated` per the same interface). No code change to `observers.ts` required.
- **OpenCode Plugin SDK** (`@opencode-ai/plugin` >= 1.1.0) — No new SDK surface is introduced by P51; existing tool registration in `src/plugin.ts` is untouched.

## Specific Ideas

No specific requirements — open to standard approaches. The user's `junior expertise, mixed style` profile with `fast decisions` and `intensive-phase-discussion` mode was the input; no specific "I want it like X" preferences were expressed for Phase 51 beyond the `--auto` invocation that drove the discussion itself.

## Deferred Ideas

None — discussion stayed within phase scope. The single matched todo (`fork-opencode-tmux-audit.md`, score 0.6) was folded into scope rather than deferred. No other ideas surfaced during the discussion that belong in a later phase.

---

*Phase: 51-synthesize-core-tmux-classes-in-tree*
*Context gathered: 2026-06-02*
