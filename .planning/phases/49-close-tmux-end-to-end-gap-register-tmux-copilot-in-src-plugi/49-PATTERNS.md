# Phase 49: Tmux E2E Completion — Pattern Map

**Mapped:** 2026-06-01
**Phase:** 49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi
**Files analyzed (new/modified targets):** 6
**Analogs found:** 6 / 6 (100%)

> **Evidence note (L5 docs-only).** This file documents existing code patterns that the planner can copy from. Runtime readiness claims for Phase 49 deliverables remain blocked until L1–L3 evidence is produced by the implementing agents (TypeScript compile, vitest, BATS run, CI job execution).

---

## 1. File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/plugin.ts` (import + tool registration) | composition root | request-response | `src/plugin.ts:645-665` (`tool: { ...registerXTools() }` spread) | exact |
| `src/plugin.ts` (observer wiring → runtime bridge) | composition root | event-driven | `src/plugin.ts:594-595` (current noop wiring) + `src/features/tmux/fork-bridge.ts:136` (getForkSessionManager) | exact |
| `src/features/tmux/observers.ts` (signature unchanged; call site changes) | observer factory | event-driven | `src/features/tmux/observers.ts:55-93` (`createTmuxEventObserver` factory) | exact (self-reference — no change to factory body) |
| `.github/workflows/ci.yml` (BATS step) | CI config | batch | `.github/workflows/ci.yml:14-45` (`build-and-test` job) | exact |
| `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/VERIFICATION.md` | governance artifact | docs | `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md:1-120` | exact |
| `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` | governance artifact | docs | `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/43-UAT.md:1-60` | exact |
| `.planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md` | governance artifact | docs | `.planning/phases/45-vendor-sync-script-2026-06-01/45-02-SUMMARY.md:1-127` | exact |

---

## 2. Tool Registration Pattern (analog for REQ-01, D-01)

### Where the existing tools are imported

**Source:** `src/plugin.ts:53-75` — every tool factory is imported at the top of the composition root. The convention is one import per line, alphabetical-ish by directory, using `.js` extension (TypeScript `NodeNext` module resolution).

```ts
// src/plugin.ts:53-75 — representative lines
import { createPromptSkimTool } from "./tools/prompt/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session/session-patch/index.js"
import { createExecuteSlashCommandTool } from "./tools/session/execute-slash-command.js"
import { createDelegateTaskTool } from "./tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "./tools/delegation/delegation-status.js"
import { createRunBackgroundCommandTool } from "./tools/hivemind/run-background-command.js"
import { createConfigurePrimitiveTool } from "./tools/config/configure-primitive.js"
// ... 14 more lines, all using "./tools/<domain>/<name>.js" path
```

**Adapter for P49:** add a new import immediately before the `loadRuntimePolicy` block (line 76). The single new line is:

```ts
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"
```

(`tmux-copilot.ts` is unique in this codebase — it exports a pre-built `tmuxCopilotTool` const, not a factory. The existing `registerXTools` functions call factory functions, so the new tool does **not** fit cleanly into any of the four `registerXTools` functions.)

### Where the existing tools are registered (the `tool: {}` spread)

**Source:** `src/plugin.ts:645-665` — the `tool:` field in the returned plugin object is a `Record<string, ReturnType<typeof tool>>` assembled by spreading the four domain registrar functions.

```ts
// src/plugin.ts:645-665
    tool: {
      ...registerDelegationTools({
        delegationManager,
        hivemindConfig,
        ptyManager,
        client,
        monitor,
        projectDirectory,
      }),
      ...registerSessionTools({
        client,
        sessionTracker,
        projectDirectory,
      }),
      ...registerHivemindTools({
        projectDirectory,
      }),
      ...registerConfigTools({
        projectDirectory,
      }),
    },
```

### How domain registrars are structured

**Source:** `src/plugin.ts:128-198` — each registrar returns a literal `Record<string, ReturnType<typeof tool>>` mapping a tool name to a factory call.

```ts
// src/plugin.ts:168-180 — representative (registerHivemindTools)
export function registerHivemindTools(deps: HivemindToolDeps): Record<string, ReturnType<typeof tool>> {
  return {
    "hivemind-doc": createHivemindDocTool(deps.projectDirectory),
    "hivemind-trajectory": createHivemindTrajectoryTool(deps.projectDirectory),
    "hivemind-pressure": createHivemindPressureTool(deps.projectDirectory),
    "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
    "hivemind-command-engine": createHivemindCommandEngineTool(deps.projectDirectory),
    "hivemind-session-view": createHivemindSessionViewTool(deps.projectDirectory),
    "hivemind-agent-work-create": createHivemindAgentWorkCreateTool(deps.projectDirectory),
    "hivemind-agent-work-export": createHivemindAgentWorkExportTool(deps.projectDirectory),
    "session-delegation-query": createSessionDelegationQueryTool(deps.projectDirectory),
  }
}
```

### Two valid placement options for `tmuxCopilotTool`

Because `tmuxCopilotTool` is a pre-built const (not a factory), it does not fit the `registerXTools` factory pattern. P49 should follow one of two established shapes:

| Option | Where to register | Code shape | Risk |
|--------|------------------|-----------|------|
| **A. Inline in `tool: {}` spread** | `src/plugin.ts:665` (one new line inside the `tool: {}` block) | `...{ "tmux-copilot": tmuxCopilotTool },` (or just `tmuxCopilotTool` if its `description`/`args`/`execute` are exposed by the const as the full tool record) | Lowest churn — only 1 line of new code. But mixes the const shape with the factory-recording pattern. |
| **B. New `registerTmuxTools` registrar** | Add a new `registerTmuxTools(deps: TmuxToolDeps)` near line 198 mirroring the four existing registrars, then spread it in `tool: {}` | Aligns with the existing 4-domain convention; cleaner separation | More LOC (new interface + new function + new spread). Heavyweight for one tool. |

**Recommended (per D-01 and minimal-change principle):** Option A — inline one new line in the `tool: {}` spread. This matches the SPEC constraint that the change is "~3 LOC import + 1 LOC array entry."

### Concrete copy-from excerpt

```ts
// src/plugin.ts:644-666 (current — to be augmented)
    tool: {
      ...registerDelegationTools({ /* ... */ }),
      ...registerSessionTools({ /* ... */ }),
      ...registerHivemindTools({ /* ... */ }),
      ...registerConfigTools({ /* ... */ }),
      // P49 (REQ-01): inline-register the pre-built tmux-copilot tool. Not a factory,
      // so it does not fit registerXTools; added here for orchestrator-tier discovery.
      "tmux-copilot": tmuxCopilotTool,
    },
```

> **Constraint:** the SPEC verification command is `grep -c "tmuxCopilot" src/plugin.ts` ≥ 2 — this is satisfied by the import line + the registration key. The planner must include this grep in the plan's verification loop.

---

## 3. SessionManager / Observer Wiring Pattern (analog for REQ-02, D-02, D-03)

### Current noop wiring (to be replaced)

**Source:** `src/plugin.ts:594-595` — inside the `eventObservers` array passed to `createCoreHooks`:

```ts
// src/plugin.ts:585-597
  return {
    config: async () => {},
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact, async ({ event }: { event?: unknown }) => {
        if (event && typeof event === "object") {
          const lmc = sessionTracker.getLastMessageCapture()
          lmc?.handleEvent(event as Record<string, unknown>)
        }
      }, ...(tmuxIntegration
        ? [createTmuxEventObserver(buildNoopForkSessionManager())]
        : [])],
    }),
```

The `buildNoopForkSessionManager()` call here is the compile-time-constructed noop. P49 D-02 replaces it with a runtime bridge lookup.

### The noop factory (kept as fallback per D-03)

**Source:** `src/plugin.ts:215-223`:

```ts
function buildNoopForkSessionManager(): ForkSessionManager {
  return {
    onSessionCreated: async (_enriched) => {
      // No-op in Hivemind-only builds. The enriched event still flows through
      // the observer's metadata lookup pipeline (delegationMeta, lastMessage
      // capture, etc.) — only the dispatch is a no-op.
    },
  };
}
```

D-03: **retain** this factory as the fallback. Do not delete.

### The bridge API (the new look-up site)

**Source:** `src/features/tmux/fork-bridge.ts:127-138`:

```ts
// src/features/tmux/fork-bridge.ts:127-138
/**
 * Replace the current adapter. Passing `null` clears the bridge (used
 * during plugin shutdown and HMR-style hot reloads). The new adapter
 * fully replaces any prior reference — partial mutation is not supported.
 *
 * Thread-safety: not thread-safe. Single-threaded JS event loop is
 * sufficient for the plugin's synchronous bootstrap path.
 */
export function setForkSessionManager(a: ForkSessionManagerAdapter | null): void {
  adapter = a
}

/**
 * Get the current adapter, or `null` if the bridge has not been wired.
 * The tool treats `null` as a graceful "fork-not-wired" condition rather
 * than an error.
 */
export function getForkSessionManager(): ForkSessionManagerAdapter | null {
  return adapter
}
```

The new wiring at L594-595 should be:

```ts
...(tmuxIntegration
  ? [createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())]
  : [])
```

Note: `getForkSessionManager` is **module-private** to `src/features/tmux/fork-bridge.ts` — the new wiring requires importing it at the top of `src/plugin.ts` (add to the existing import block at line 50–51):

```ts
import { createTmuxEventObserver } from "./features/tmux/observers.js"
import type { ForkSessionManager } from "./features/tmux/observers.js"
import { getForkSessionManager, setForkSessionManager } from "./features/tmux/fork-bridge.js"   // <-- new (D-04 will use setForkSessionManager)
```

### The observer factory (signature unchanged; only call site changes)

**Source:** `src/features/tmux/observers.ts:55-93`:

```ts
// src/features/tmux/observers.ts:55-93
export function createTmuxEventObserver(
  forkSessionManager: ForkSessionManager,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }: { event?: unknown }): Promise<void> => {
    // Guard: no event or wrong type
    if (!event || typeof event !== "object") return;

    const evt = event as Record<string, unknown>;
    if (evt.type !== "session.created") return;

    const props = evt.properties as Record<string, unknown> | undefined;
    const info = props?.info as Record<string, unknown> | undefined;
    if (!info?.id) return;

    const sessionId = String(info.id);
    const meta = getDelegationMeta(sessionId);

    const enriched: EnrichedSessionEvent = {
      type: "session.created",
      properties: {
        info: {
          id: sessionId,
          parentID: info.parentID as string | undefined,
          title: String(info.title ?? "Subagent"),
          directory: String(info.directory ?? ""),
        },
      },
      hivemindMeta: meta
        ? {
            agent: meta.agent,
            delegationId: sessionId,
            depth: meta.depth,
          }
        : undefined,
    };

    await forkSessionManager.onSessionCreated(enriched);
  };
}
```

The factory body is unchanged. Only the **argument** at the call site changes — from `buildNoopForkSessionManager()` to `getForkSessionManager() ?? buildNoopForkSessionManager()`.

---

## 4. CI Job Pattern (analog for REQ-04, D-06)

### Existing CI job structure

**Source:** `.github/workflows/ci.yml:14-45` — the `build-and-test` job. P49 BATS step is added here on a single matrix node (node-version: 22, per D-06).

```yaml
# .github/workflows/ci.yml:14-45
jobs:
  build-and-test:
    name: Build & Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Coverage report
        if: matrix.node-version == 22
        run: npm run test:coverage
```

### BATS step shape (to be appended after Coverage report, conditional on node 22)

The P49 BATS suite is at `tests/scripts/sync-fork.bats` (210 LOC, 3 scenarios per P45-02-SUMMARY). bats ^1.13.0 is already in `package.json` devDependencies.

```yaml
      # P49 (REQ-04, D-06): BATS suite for scripts/sync-fork.sh.
      # Installed via apt (Ubuntu-only, runs only on the Node 22 matrix node).
      # Graceful: if bats install fails, the step is skipped (continue-on-error: true)
      # with a warning, so the pipeline does not block on missing system pkg.
      - name: Install bats (Linux only)
        if: matrix.node-version == 22
        run: |
          if command -v bats >/dev/null 2>&1; then
            echo "bats already installed: $(bats --version)"
          else
            sudo apt-get update -qq
            sudo apt-get install -y -qq bats
          fi
        continue-on-error: true

      - name: Run BATS suite
        if: matrix.node-version == 22
        run: |
          if command -v bats >/dev/null 2>&1; then
            bats tests/scripts/sync-fork.bats
          else
            echo "::warning::bats not available; skipping sync-fork BATS suite"
          fi
```

### Constraints to flag for the planner

- **Linux only** (D-06). BATS install is `apt-get install bats` (Ubuntu). The CI runs on `ubuntu-latest` so this is safe.
- **Single matrix node** (`matrix.node-version == 22`). Do not run on Node 20 — would double the runtime with no extra signal.
- **Graceful degradation** — `continue-on-error: true` on the install step + `if command -v bats` guard on the run step. The acceptance criterion in SPEC.md L62-63 says "if BATS is unavailable, the step is skipped with a warning rather than failing the pipeline."
- **No new test infrastructure** (SPEC constraint L103). bats ^1.13.0 is already a devDependency from P45; do not introduce a new test runner.

### Alternative (npm-based install) — only if apt path is rejected

If the project's CI hardening rules forbid `apt-get install`, the alternative is to use the npm-distributed bats binary (already a devDep):

```yaml
      - name: Run BATS suite (npm-distributed)
        if: matrix.node-version == 22
        run: npx bats tests/scripts/sync-fork.bats
```

This works because `bats` ^1.13.0 was added to `package.json` devDependencies in P45 (per `45-02-SUMMARY.md:62`).

---

## 5. Paperwork Templates (analogs for REQ-05, REQ-06, D-07, D-08)

### VERIFICATION.md template — P43

**Source:** `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md:1-56` (excerpt, full file is 206 LOC).

**Frontmatter (lines 1-12):**

```yaml
---
phase: 43-tmux-co-pilot-model-orchestrator-intervention
verified: 2026-06-01T18:55:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
overrides: []
gaps: []
deferred: []
re_verification: false
human_verification: []
---
```

**Section shape (line 14+):** Title → Goal Achievement → Observable Truths (table of REQ vs evidence) → Required Artifacts (table) → Key Link Verification (wiring diagram table) → Data-Flow Trace (level 4 table) → Behavioral Spot-Checks (L1 evidence — re-run commands) → Probe Execution → Requirements Coverage.

**P42 VERIFICATION.md (REQ-05) should mirror this exactly**, with the 5 P42 requirements mapped to the same evidence structure (file:line, test path, commit hash). The P42 requirements are listed in SPEC.md (P49 SPEC) as: fork extension, metadata titles, plugin integration, auto-init, graceful degradation.

### UAT.md template — P43

**Source:** `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/43-UAT.md:1-60`.

**Frontmatter (lines 1-9):**

```yaml
---
status: complete
phase: 43-tmux-co-pilot-model-orchestrator-intervention
source:
  - 43-01-SUMMARY.md
  - 43-02-SUMMARY.md
started: 2026-06-01T11:49:55Z
updated: 2026-06-01T11:57:30Z
---
```

**Section shape:** Title → `## Current Test` (status banner) → `## Tests` (numbered scenarios, each with `### N. <name>`, then `expected:` block, then `result: pass|fail`, then `evidence:` block with file:line + test command output).

**P42 UAT.md (REQ-05) should follow this same shape**, with ≥3 scenarios matching P42's 5 requirements (per SPEC acceptance criterion L67-68). One scenario per requirement, with cold-start smoke test as scenario 1.

### SUMMARY.md template — P45-02

**Source:** `.planning/phases/45-vendor-sync-script-2026-06-01/45-02-SUMMARY.md:1-80`.

**Frontmatter (lines 1-46):**

```yaml
---
phase: "45-vendor-sync-script"
plan: "45-02"
subsystem: testing
tags: [bats, shell-testing, git-integration, ci-pipeline]

# Dependency graph
requires:
  - phase: 45-01
    provides: scripts/sync-fork.sh with pinned-file conflict detection
provides:
  - bats test suite (3 scenarios) for sync-fork.sh
  - Integration test pattern for shell scripts using local git fixtures
affects: [45-run-ci, integration-testing]

# Tech tracking
tech-stack:
  added: [bats ^1.13.0]
  patterns:
    - BATS_TEST_TMPDIR for per-test isolated git repos
    - Subshell-based git ops (no global cd persistence)
    - Local bare repo as upstream fixture (zero network)

key-files:
  created:
    - tests/scripts/sync-fork.bats
    - tests/scripts/.gitkeep
  modified:
    - package.json

key-decisions:
  - "Use session-manager.ts (actually pinned) for Scenario 3, NOT tmux.ts (user's brief typo)"
  - "WORK repo must NOT push its marker commit to the upstream bare — divergence needed for merge-tree detection"
  - "Subshell pattern for script invocation isolates cwd: bash -c \"cd '$WORK' && ...\""
  - "bats only (no bats-assert/bats-support) per user instruction"

patterns-established:
  - "Local git fixture pattern: bare upstream → fork-wt (populator) → test repo (SUT)"
  - "3-way merge detection via git merge-tree --write-tree --name-only --no-messages"

requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-04, REQ-05]

# Metrics
duration: 28min
completed: 2026-06-01
---
```

**Section shape (after frontmatter):** Title with one-line summary → `## Performance` (duration, tasks, files) → `## Accomplishments` (bullet list) → `## Task Commits` (atomic commit list with hashes) → `## Files Created/Modified` (path + LOC + purpose) → `## Decisions Made` (numbered, with rationale) → `## Deviations from Plan` → `## Issues Encountered` → `## Test Details` (table of scenario → expected → actual) → `## Next Phase Readiness`.

**P45 45-01-SUMMARY.md (REQ-06) should mirror this exactly**, documenting plan 01 outcomes (the `scripts/sync-fork.sh` creation and pinned-file conflict detection — these are plan 01 deliverables, plan 02 was the BATS suite).

---

## 6. Shared Patterns (Cross-Cutting)

### Pattern A: Bridge pattern preservation (NON-NEGOTIABLE per SPEC L102)

**Source:** `src/features/tmux/fork-bridge.ts:1-23` and `src/tools/tmux-copilot.ts:18-22`.

The `ForkSessionManagerAdapter` interface is **structurally typed** — Hivemind never imports any TS/JS from `opencode-tmux/`. The fork is a sibling workspace package, not a Hivemind dep. P49 must NOT add any `import` from `opencode-tmux/` (or `@hivemind/opencode-tmux`) anywhere in `src/`. Detection of the vendored fork (D-05) must use a directory-existence check (e.g., `existsSync(join(projectDirectory, "opencode-tmux"))`), not a TypeScript import.

### Pattern B: Graceful degradation when bridge is unwired

**Source:** `src/tools/tmux-copilot.ts:146-149`:

```ts
// src/tools/tmux-copilot.ts:146-149
// 3. Bridge check
const adapter = getForkSessionManager()
if (adapter === null) {
  return renderToolResult({ available: false, reason: "fork-not-wired" })
}
```

P49 REQ-02 acceptance criterion (SPEC L112-113) requires that when `getForkSessionManager()` returns null, the tool still returns `fork-not-wired`. This is the existing test contract — `tests/lib/tmux/tmux-copilot.test.ts` (10 tests per VERIFICATION.md L33) covers this. **No test changes needed**, only the wiring changes at L594-595.

### Pattern C: Atomic commits per REQ (SPEC constraint L105)

Per SPEC, each of the 7 requirements should be a separate commit. The existing commit pattern (per P45-02-SUMMARY.md:69-73) is `feat(<plan>): <title>` for code, `docs(<plan>): <title>` for paperwork. Apply the same convention to P49:

| Commit | Type | Subject |
|--------|------|---------|
| REQ-01 | `feat(49-01)` | `register tmux-copilot tool in src/plugin.ts tool registry` |
| REQ-02 | `feat(49-02)` | `wire tmux observer to runtime getForkSessionManager lookup` |
| REQ-03 | `feat(49-03)` | `auto-detect vendored fork and inject adapter via setForkSessionManager` |
| REQ-04 | `ci(49-04)` | `add BATS suite to CI workflow (node 22, Linux only)` |
| REQ-05 | `docs(49-05)` | `add P42 VERIFICATION.md and UAT.md (retrospective)` |
| REQ-06 | `docs(49-06)` | `add P45 45-01-SUMMARY.md (retrospective)` |
| REQ-07 | `docs(49-07)` | `re-verify P43 with stricter REQ-05 check` |

### Pattern D: TypeScript NodeNext module resolution

**Source:** `src/plugin.ts:53-75` (all imports end in `.js`).

All new imports in `src/plugin.ts` and other modified files must use the `.js` extension on the relative path (the TS source is `.ts` but the emitted module specifier is `.js` under `NodeNext`). The new lines for P49 follow this convention:

```ts
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"          // REQ-01
import { getForkSessionManager, setForkSessionManager } from "./features/tmux/fork-bridge.js"  // REQ-02/03
```

---

## 7. No Analog Found

| Item | Role | Reason | Fallback |
|------|------|--------|----------|
| Vendored-fork detection logic for REQ-03 | integration | `src/features/tmux/integration.ts` does not currently have a "is the vendored fork present at this path" check | The planner must invent a minimal `existsSync(join(projectDir, "opencode-tmux"))` check. Do not add a structural-type adapter construction — out of scope per SPEC L94-98. The exact detection mechanism is left to the implementer. |

---

## 8. Constraints Discovered

1. **`tmuxCopilotTool` is a pre-built const, not a factory.** Existing `registerXTools` functions call factory functions. P49 must NOT wrap it in a fake factory — inline-register it in the `tool: {}` spread (recommended) or add a new `registerTmuxTools` registrar.

2. **`buildNoopForkSessionManager` MUST be retained** (D-03). It documents the noop contract and serves as the fallback when the bridge is unwired. Do not delete the L215-223 block.

3. **`getForkSessionManager` is currently unused in `src/plugin.ts`.** The new wiring at L594-595 is the only call site in `src/plugin.ts`. The planner should confirm via `Grep` that no other call sites exist before changing the import.

4. **BATS is already a devDependency** (per P45-02-SUMMARY.md L62). The CI step does not need to install via npm — it can use the existing `package.json` entry directly, or install via apt (whichever the project prefers). Avoid introducing `bats-assert` or `bats-support` (per P45-02-SUMMARY.md:88-90).

5. **P42 VERIFICATION.md and UAT.md are RETROSPECTIVE** (per D-07). They document work that was already delivered in P42. Evidence must come from existing code/test output, not from new work. The 5 P42 requirements (per P49 SPEC.md L66-68) are: fork extension, metadata titles, plugin integration, auto-init, graceful degradation.

6. **P45 45-01-SUMMARY.md is RETROSPECTIVE** (per D-08). It documents the `scripts/sync-fork.sh` creation and pinned-file conflict detection — both are plan 01 deliverables. The plan 02 SUMMARY.md already exists and documents the BATS suite (which is a different deliverable).

7. **Bridge pattern is preserved** (SPEC L102, NON-NEGOTIABLE). No TypeScript import of `opencode-tmux/` or `@hivemind/opencode-tmux` is allowed anywhere in `src/`. D-05's detection must be `existsSync`-based, not import-based.

8. **Backward compatibility** (SPEC L104). When the fork package is absent, all behavior must remain unchanged: `tmux-copilot` returns `{available: false, reason: "fork-not-wired"}`, delegation continues normally. The `tests/lib/tmux/` suite (43 tests per VERIFICATION.md L96) is the safety net — it must continue to pass without modification.

9. **Acceptance command:** `grep -c "tmuxCopilot" src/plugin.ts` ≥ 2 (SPEC L48). The import line + the registration key satisfy this. The planner must include this grep in the plan's verification loop.

10. **Acceptance command:** `npm run typecheck` exits 0, `npm test` passes (SPEC L119-120). 2900+ tests must continue to pass — the runtime wiring change at L594-595 must not introduce new failures.

---

## Metadata

**Analog search scope:**
- `src/plugin.ts` (composition root)
- `src/tools/tmux-copilot.ts` (orphan tool)
- `src/features/tmux/observers.ts` (existing wiring)
- `src/features/tmux/fork-bridge.ts` (bridge)
- `src/tools/delegation/*.ts` (tool factory patterns for comparison)
- `.github/workflows/ci.yml` (CI job patterns)
- `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/{VERIFICATION.md, 43-UAT.md}` (paperwork)
- `.planning/phases/45-vendor-sync-script-2026-06-01/45-02-SUMMARY.md` (paperwork)
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/{49-SPEC.md, 49-CONTEXT.md}` (source of truth for in-scope requirements)

**Files scanned:** 9 primary + 4 supporting (paperwork templates)

**Key file:line references discovered:**
- `src/plugin.ts:53-75` — tool import block
- `src/plugin.ts:128-198` — four `registerXTools` registrar functions
- `src/plugin.ts:215-223` — `buildNoopForkSessionManager()` noop factory (keep)
- `src/plugin.ts:594-595` — current observer wiring (REPLACE)
- `src/plugin.ts:645-665` — `tool: { ...registerXTools() }` spread (ADD inline entry)
- `src/tools/tmux-copilot.ts:108` — `tmuxCopilotTool` pre-built const
- `src/tools/tmux-copilot.ts:146-149` — `getForkSessionManager()` graceful check
- `src/features/tmux/observers.ts:55-93` — `createTmuxEventObserver` factory (unchanged)
- `src/features/tmux/fork-bridge.ts:127-138` — `setForkSessionManager` / `getForkSessionManager` (new call site at L594-595)
- `.github/workflows/ci.yml:14-45` — `build-and-test` job (append BATS step)
- `tests/scripts/sync-fork.bats` — 210 LOC, 3 scenarios, existing BATS suite
- `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md:1-56` — VERIFICATION.md template
- `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/43-UAT.md:1-9` — UAT.md template
- `.planning/phases/45-vendor-sync-script-2026-06-01/45-02-SUMMARY.md:1-46` — SUMMARY.md template

**Pattern extraction date:** 2026-06-01

---

*This PATTERNS.md is an L5 planning artifact. The actual `src/plugin.ts`, `.github/workflows/ci.yml`, and `tests/scripts/sync-fork.bats` changes must be implemented by the planner's downstream agents and verified with L1-L3 evidence (npm run typecheck, npm test, bats run, CI dry-run) before Phase 49 completion can be claimed.*
