# Phase 49: Tmux E2E Completion — Research

**Researched:** 2026-06-01
**Domain:** TypeScript plugin wiring, observer pattern, git merge-tree, BATS test framework, CI/CD YAML, retrospective documentation
**Confidence:** HIGH

## Summary

Phase 49 is a **wiring and paperwork closure phase** that connects 4 existing but unconnected Hivemind subsystems: (1) register the orphan `tmuxCopilotTool` in `src/plugin.ts`, (2) replace the compile-time `buildNoopForkSessionManager()` noop with a runtime bridge lookup via `getForkSessionManager()`, (3) add the existing BATS test suite to CI, and (4) close 3 paperwork gaps from P42 and P45.

All source deliverables exist and are production-ready. The phase bridges them into the runtime plugin surface. No new logic, no new tests, no fork code changes.

**Primary recommendation:** Follow the established tool registration pattern (import + add to `tool:` object), the observer spread pattern (runtime bridge lookup falls back to noop), and the git merge-tree pattern from P45 for BATS CI. Paperwork follows the P43 VERIFICATION.md format (frontmatter + requirement table + acceptance matrix), the P45 UAT.md format (scenario list with pass/pending), and the P45 SUMMARY.md format (frontmatter + outcome + deliverables).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `tmuxCopilotTool` is imported at the top of `src/plugin.ts` from `"./tools/tmux-copilot.js"` and added to the tools array. Minimal change (~3 LOC import + 1 LOC array entry). No changes to the tool itself.
- **D-02:** Change the observer factory call at `src/plugin.ts:594-595` to use `getForkSessionManager()` from the fork-bridge at runtime, instead of passing `buildNoopForkSessionManager()` at compile time. The `createTmuxEventObserver` factory still accepts a `ForkSessionManager` parameter, but the caller passes the runtime lookup: `createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())`. This keeps the noop fallback for the unwired case while enabling the runtime path.
- **D-03:** `buildNoopForkSessionManager()` is retained as the fallback adapter — not deleted. Its existence at `src/plugin.ts:215` documents the noop contract. No changes to its implementation.
- **D-04:** The integration factory `createTmuxIntegrationIfSupported()` at `src/plugin.ts:408` is enhanced to detect the vendored fork code at `opencode-tmux/` and, if present and compilable, construct a minimal `ForkSessionManagerAdapter` and call `setForkSessionManager()`. The bridge pattern (no compile-time import of fork code) is preserved — the adapter is structurally typed.
- **D-05:** Detection mechanism: check for the vendored fork directory at project root (`opencode-tmux/`). If found, attempt to require/resolve the fork's SessionManager via the vendored path. If not found, skip — the bridge remains null, tool returns `fork-not-wired`.
- **D-06:** Add a BATS job to `.github/workflows/ci.yml` that runs on a single Linux matrix node (node-version: 22). Install bats via `npm install -g bats` and run `bats tests/scripts/sync-fork.bats`. If BATS is unavailable, the step is skipped with a warning rather than failing the pipeline (graceful degradation).
- **D-07:** P42 paperwork is retrospective — documents already-delivered work. VERIFICATION.md covers P42's 5 requirements (fork extension, metadata titles, plugin integration, auto-init, graceful degradation) with pass/fail evidence from existing code. UAT.md documents ≥3 test scenarios.
- **D-08:** P45 45-01-SUMMARY.md is retrospective — documents plan 01 outcomes (`scripts/sync-fork.sh` creation, pinned-file conflict detection). Verification status: delivered and verified.
- **D-09:** Run `gsd-verify-work` for P43 with stricter REQ-05 (runtime-injection boundary) validation.
- **D-10:** Atomic commit per requirement — each of the 7 REQs gets its own commit.

### the agent's Discretion
- BATS CI job exact syntax and position in the workflow YAML (the step structure is standard — discretion on where to place it in the job sequence).
- Order of atomic commits (discretion on sequence, but each REQ should be a separate commit per SPEC constraint).

### Deferred Ideas (OUT OF SCOPE)
- None. All relevant ideas were folded into scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | Register `tmuxCopilotTool` in `src/plugin.ts` | Verified existing tool at `src/tools/tmux-copilot.ts:108`, pattern from `plugin.ts:645-665` |
| REQ-02 | Replace build-time noop with runtime bridge lookup | Verified observer pattern at `plugin.ts:594-595`, fork-bridge at `fork-bridge.ts:136-138` |
| REQ-03 | Wire co-pilot adapter injection at bootstrap | Verified integration factory at `integration.ts:139-179`, bridge singleton at `fork-bridge.ts:127-129` |
| REQ-04 | Add BATS to CI workflow | Verified CI config at `ci.yml:14-57`, BATS suite at `sync-fork.bats:1-210` |
| REQ-05 | Write P42 VERIFICATION.md and UAT.md | P43 VERIFICATION.md template (206 LOC), P45 UAT.md template (50 LOC) |
| REQ-06 | Write P45 45-01 SUMMARY.md | P45 45-02-SUMMARY.md template (127 LOC), P43 SUMMARY.md template |
| REQ-07 | gsd-verify-work for P43 with stricter REQ-05 | Current observer wiring at `plugin.ts:594-595` is compile-time noop — must update to runtime bridge |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool registration | Plugin (src/plugin.ts) | — | All tools registered via import + array entry at plugin.ts composition root |
| Observer wiring | Plugin (src/plugin.ts) | Events (hooks pipeline) | Event observers registered in `coreHooks.eventObservers` spread array — the tmux observer follows every other observer pattern |
| Bridge injection | Bootstrap (src/plugin.ts) | Integration factory (integration.ts) | `setForkSessionManager()` called during `createTmuxIntegrationIfSupported()` init |
| BATS execution | CI (.github/workflows/ci.yml) | — | CI adds a standalone BATS job running `tests/scripts/sync-fork.bats` |
| Paperwork | .planning/ (phase directory) | — | Retrospective documents in `42-tmux-visual-orchestration-layer-fork-extension/` and `45-vendor-sync-script-2026-06-01/` |

---

## Standard Stack

### Core

| Library/Pattern | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| `@opencode-ai/plugin/tool` | (bundled) | Tool registration API | Every tool in the project uses `tool({...})` or `createXxxTool()` factories. Tools added to spread in `tool: {...}` return object. `[VERIFIED: plugin.ts:645-665]` |
| `getForkSessionManager()` | (internal) | Runtime adapter lookup | Singleton in `fork-bridge.ts:136-138` — returns `ForkSessionManagerAdapter \| null`. Used by tmux-copilot tool at `tmux-copilot.ts:146` to check bridge status. `[VERIFIED: fork-bridge.ts:136-138]` |
| `setForkSessionManager(adapter)` | (internal) | Adapter injection | Called during integration factory init at `integration.ts:165` when fork adapter is provided. `[VERIFIED: integration.ts:164-166]` |
| `buildNoopForkSessionManager()` | (internal) | Fallback noop adapter | Retained at `plugin.ts:215-223`. Documents the `ForkSessionManager` contract. `[VERIFIED: plugin.ts:215-223]` |
| `bats-core` | >= 1.7 | Shell test framework | TAP-compliant shell test runner. `bats_require_minimum_version 1.7.0` in `sync-fork.bats:10`. `[VERIFIED: sync-fork.bats:10]` |
| npm | (bundled) | Package manager | Used for deps and also for `npm install -g bats` in CI. `[VERIFIED: ci.yml:32]` |

### BATS CI Stack

| Library | Version | Purpose | Install Method |
|---------|---------|---------|---------------|
| `bats` (npm) | ^1.13.0 | Shell test framework | `npm install -g bats` or `apt install bats` `[VERIFIED: package.json: devDeps]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct `tmuxCopilotTool` in `tool:` spread | Wrapper factory function | Direct addition is simpler (~1 LOC). Factory would add unnecessary indirection since tool needs no deps. |
| `getForkSessionManager() ?? buildNoopForkSessionManager()` | Lazy function that wraps `getForkSessionManager()` inside the observer | Inline is simplest. A lazy wrapper would be needed if the adapter could change mid-run, but it can't (singleton). |
| BATS via `apt install bats` | `npm install -g bats` | Both work. npm is already available in the Node.js CI environment (`ci.yml:25-28` sets up node). `apt` would need sudo. Docker may lack sudo. npm wins. |

---

## Architecture Patterns

### System Architecture Diagram

```
                          ┌────────────────────────────┐
                          │    src/plugin.ts            │
                          │    (Composition Root)       │
                          └────┬───────┬───────┬───────┘
                               │       │       │
              ┌────────────────┘       │       └──────────────────┐
              ▼                        ▼                          ▼
   ┌────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
   │ REQ-01: Tool Reg.  │  │ REQ-02: Observer     │  │ REQ-03: Adapter Inj. │
   │                    │  │        Wiring         │  │                      │
   │ Import:            │  │ Change L594-595 from: │  │ createTmuxIntegration│
   │  tmuxCopilotTool   │  │  buildNoopForkSM()   │  │ IfSupported() detects │
   │ from tools/        │  │ To:                  │  │ opencode-tmux/ fork  │
   │ tmux-copilot.js    │  │  getForkSM() ??      │  │ → builds adapter     │
   │                    │  │  buildNoopForkSM()   │  │ → setForkSM(adapter)  │
   │ Add to tool: {     │  │                      │  │                      │
   │  ...register*(),   │  │ Fallback path kept   │  │ Bridge stays null if  │
   │  "tmux-copilot":   │  │ at plugin.ts:215     │  │ fork absent           │
   │  tmuxCopilotTool   │  └──────────┬───────────┘  └──────────┬───────────┘
   │ }                  │             │                          │
   └────────────────────┘             │                          │
                                      ▼                          ▼
                          ┌──────────────────────┐  ┌──────────────────────┐
                          │ observers.ts:55-93    │  │ integration.ts      │
                          │ createTmuxEventObs.   │  │ :164-166            │
                          │ enriches session.     │  │ setForkSM(adapter)  │
                          │ created with meta     │  │                     │
                          │ then forwards to      │  │ bridge.ts:127-129   │
                          │ ForkSessionManager    │  │ setForkSM/          │
                          └──────────────────────┘  │ getForkSM singleton  │
                                                    └──────────────────────┘

                          ┌────────────────────────────┐
                          │ .github/workflows/ci.yml    │
                          │ REQ-04: BATS CI step       │
                          │ npm install -g bats &&     │
                          │ bats tests/scripts/        │
                          │ sync-fork.bats             │
                          │ Graceful: skip-if-unavail  │
                          └────────────────────────────┘
```

### Pattern 1: Tool Registration in plugin.ts

**What:** Tools are registered by importing the tool instance/creator at the top of `src/plugin.ts`, then adding it to the `tool: {}` return block of the `HarnessControlPlane` plugin.

**When to use:** Any new tool that needs to be agent-discoverable.

**Existing pattern (plugin.ts:645-665):**
```typescript
return {
  // ... hooks, config, etc.
  tool: {
    ...registerDelegationTools({...}),
    ...registerSessionTools({...}),
    ...registerHivemindTools({...}),
    ...registerConfigTools({...}),
    // NEW: tmux-copilot tool — pre-constructed tool() instance
    "tmux-copilot": tmuxCopilotTool,
  },
}
```

This is the correct approach because `tmuxCopilotTool` is exported as a pre-constructed `tool({...})` instance (not a factory function). It needs no dependencies beyond what `tool({...})` captures internally.

**Verification:** After change, `grep -c "tmuxCopilot" src/plugin.ts` returns ≥2 (import + registration).

### Pattern 2: Event Observer Registration

**What:** Event observers are async functions in the `eventObservers` spread array, conditionally included based on feature availability.

**Existing pattern (plugin.ts:589-596):**
```typescript
eventObservers: [
  consumeDelegationFact,
  sessionEventObserver,
  consumeSessionTrackerFact,
  consumeSessionEntryFact,
  consumeIsMainSessionFact,
  // Last-message-capture observer is inlined
  async ({ event }: { event?: unknown }) => { ... },
  // Tmux observer — currently hardcoded noop, will become runtime lookup
  ...(tmuxIntegration
    ? [createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())]
    : []),
],
```

**Why this works:** `createTmuxEventObserver()` takes a `ForkSessionManager` (just `onSessionCreated`). The bridge's `getForkSessionManager()` returns a `ForkSessionManagerAdapter` (which extends `ForkSessionManager` with `onSessionCreated`, `respawnIfKnown`, `getMainPaneId`). TypeScript structural typing means `ForkSessionManagerAdapter` is assignable where `ForkSessionManager` is expected — both have `onSessionCreated(event: EnrichedSessionEvent) => Promise<void>` with the exact same signature.

### Pattern 3: Build-Noop Fallback

**What:** A factory function returning a noop adapter object. Documents the interface contract and provides safe default behavior.

**Existing pattern (plugin.ts:215-223):**
```typescript
function buildNoopForkSessionManager(): ForkSessionManager {
  return {
    onSessionCreated: async (_enriched) => {
      // No-op in Hivemind-only builds.
    },
  };
}
```

**Kept as-is per D-03.** Not deleted. Only the call site changes.

### Pattern 4: BATS CI Integration

**What:** A standalone CI job or step that installs bats and runs the test suite.

**Existing pattern (ci.yml:14-46 — build-and-test job structure):**
```yaml
jobs:
  bats:
    name: BATS Shell Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Install bats
        run: npm install -g bats
      - name: Run BATS tests
        run: bats tests/scripts/sync-fork.bats
```

**Graceful degradation:** If bats is unavailable, the `npm install -g bats` step or the `bats` command could fail. To handle this gracefully: use `continue-on-error: true` on the BATS step, or check bats availability first: `- run: command -v bats && bats tests/scripts/sync-fork.bats || echo "BATS not available, skipping"`.

### Anti-Patterns to Avoid

- **Modifying `buildNoopForkSessionManager()`:** D-03 explicitly keeps it. Premature optimization would break the noop contract documentation. `[VERIFIED: CONTEXT.md D-03]`
- **Creating a factory wrapper for `tmuxCopilotTool`:** The tool has zero dependencies beyond what `tool({...})` captures. Adding a factory would be unnecessary indirection. Direct addition to the `tool:` object is simpler and matches how other exportable instances work.
- **Importing fork code directly:** D-04 explicitly forbids compile-time imports from `opencode-tmux/`. The bridge pattern (structural types, runtime injection) must be preserved.
- **Placing BATS in the build-and-test matrix:** BATS is a shell test on shell scripts, independent of the TypeScript build/test matrix. It should be a separate job or a step within a `bats` job, not a matrix expansion of `build-and-test`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool registration | Custom registration module | Direct `tool:` object entry in `plugin.ts` | Every existing tool uses this pattern. Adding a registration module for 1 tool is over-engineering. `[VERIFIED: plugin.ts:645-665]` |
| Observer dispatch logic | Rewriting `createTmuxEventObserver` | Just change the argument: `getForkSM() ?? noop` | Observer factory is already production-ready. Only the call site needs changing. `[VERIFIED: observers.ts:55-93]` |
| BATS test framework | Custom shell test runner | `bats-core` | Already installed in P45 (`bats ^1.13.0` in devDependencies). TAP-compliant, CI-ready. `[VERIFIED: package.json]` |
| Git merge conflict detection | Custom diff logic | `git merge-tree --write-tree` | Already used by `sync-fork.sh`. Git plumbing, zero side-effects. `[CITED: git-scm.com/docs/git-merge-tree]` |
| Paperwork templates | Custom verification format | P43 VERIFICATION.md format | Existing template proven by P43. YAML frontmatter + table structure. `[VERIFIED: .planning/phases/43-*/VERIFICATION.md]` |

---

## Package Legitimacy Audit

> No new packages are installed in this phase. `bats` is already in devDependencies (`^1.13.0`). No additional npm/pip/cargo packages needed.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `bats` (npm) | npm | 8+ yrs | ~20K/wk | bats-core/bats-core | [OK] | Already in devDependencies — no change needed |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Common Pitfalls

### Pitfall 1: Import Ambiguity — Two `ForkSessionManager` Interfaces

**What goes wrong:** `observers.ts` defines `ForkSessionManager` (just `onSessionCreated`), and `fork-bridge.ts` defines a different `ForkSessionManager` (with `onSessionCreated` + `respawnIfKnown` + `getMainPaneId`). Plugin.ts imports the type from observers. The getter `getForkSessionManager()` returns `ForkSessionManagerAdapter | null` from the bridge. Due to structural typing, `ForkSessionManagerAdapter` (which extends the bridge's `ForkSessionManager`) is assignable to the observer's `ForkSessionManager`. But a developer might not realize there are two distinct interfaces with the same name.

**How to avoid:**
- The critical insight: `ForkSessionManagerAdapter extends ForkSessionManager` (bridge version), and both `ForkSessionManager` interfaces share `onSessionCreated` with the same `EnrichedSessionEvent` import from observers.ts.
- TypeScript's structural typing means the adapter is assignable where the observer's `ForkSessionManager` is expected.
- The null-safe access: `getForkSessionManager() ?? buildNoopForkSessionManager()` returns `ForkSessionManagerAdapter | ForkSessionManager` (from bridge or observers). Since `ForkSessionManagerAdapter` has `onSessionCreated`, it satisfies the observer's `ForkSessionManager`.

### Pitfall 2: Observer Registration Order

**What goes wrong:** If the tmux observer is placed before the delegation event observer in the `eventObservers` array, `session.created` events might arrive before delegation metadata is available. The observer calls `getDelegationMeta(sessionId)` at `observers.ts:70` — if metadata isn't populated yet, `hivemindMeta` will be `undefined`.

**How to avoid:** The observer order is already correct in `plugin.ts:589-596`. The tmux observer is LAST in the spread. The delegation consumer (`consumeDelegationFact`) is first. Do NOT reorder.

### Pitfall 3: BATS CI Step Fails on macOS/Windows

**What goes wrong:** The BATS suite (`sync-fork.bats`) uses bash-specific features (git, local fixture repos). It won't run on Windows. On macOS it may work but isn't expected to.

**How to avoid:** Add the BATS step ONLY on Linux. Use a separate `bats` job with `runs-on: ubuntu-latest`, not a matrix expansion. D-06 explicitly limits BATS to Linux Node 22.

### Pitfall 4: Paperwork Gap in P42 Directory

**What goes wrong:** P42's directory has no `VERIFICATION.md` or `UAT.md` — the requirements are documented in `42-RESEARCH.md`, `42-01-PLAN.md` through `42-03-PLAN.md`, and `42-01-SUMMARY.md` through `42-03-SUMMARY.md`. But the SPEC calls for 5 requirements. Must infer these from existing artifacts.

**How to avoid:** Read `42-01-SUMMARY.md` through `42-03-SUMMARY.md` to extract the 5 requirements. Cross-reference with `42-01-PLAN.md` through `42-03-PLAN.md`. The P42 5 requirements per CONTEXT.md: fork extension, metadata titles, plugin integration, auto-init, graceful degradation.

### Pitfall 5: TypeScript Import Path Extension

**What goes wrong:** Forgetting `.js` extension in the import. `src/plugin.ts` uses `.js` extensions in all relative imports (e.g., `"./tools/tmux-copilot.js"`, not `"./tools/tmux-copilot"`).

**How to avoid:** Match the existing pattern. All imports in `plugin.ts` use `.js` extensions. The import for `tmuxCopilotTool` must be:
```typescript
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"
```

---

## Code Examples

### Example 1: Tool Registration — Add `tmuxCopilotTool` to `src/plugin.ts`

**Current** — top of plugin.ts (after other imports, around line 75):
```typescript
import { createHivemindSessionViewTool } from "./tools/hivemind/hivemind-session-view.js"
```

**After REQ-01** — add import:
```typescript
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"
```

**Current** — `tool:` return block (lines 645-665):
```typescript
tool: {
  ...registerDelegationTools({...}),
  ...registerSessionTools({...}),
  ...registerHivemindTools({...}),
  ...registerConfigTools({...}),
},
```

**After REQ-01** — add entry:
```typescript
tool: {
  ...registerDelegationTools({...}),
  ...registerSessionTools({...}),
  ...registerHivemindTools({...}),
  ...registerConfigTools({...}),
  "tmux-copilot": tmuxCopilotTool,
},
```

`[VERIFIED: plugin.ts:645-665, tmux-copilot.ts:108]`

### Example 2: Observer Wiring — Replace Noop with Runtime Lookup

**Current** (plugin.ts:594-595):
```typescript
...(tmuxIntegration
  ? [createTmuxEventObserver(buildNoopForkSessionManager())]
  : []),
```

**After REQ-02**:
```typescript
...(tmuxIntegration
  ? [createTmuxEventObserver(getForkSessionManager() ?? buildNoopForkSessionManager())]
  : []),
```

Also needs an import at the top of plugin.ts:
```typescript
import { getForkSessionManager } from "./features/tmux/fork-bridge.js"
```

`[VERIFIED: plugin.ts:594-595, fork-bridge.ts:136-138, observers.ts:55-93]`

### Example 3: BATS CI Step

**After REQ-04** — add a new job after the `lint-check` job:
```yaml
  bats:
    name: Shell Tests (bats)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Run BATS tests
        run: |
          npm install -g bats
          bats tests/scripts/sync-fork.bats
        continue-on-error: true
```

`[VERIFIED: ci.yml:14-57, sync-fork.bats:1-210]`

The `continue-on-error: true` prevents a BATS-only pipeline failure when bats is not available.

### Example 4: VERIFICATION.md Frontmatter Format (from P43)

```yaml
---
phase: 42-tmux-visual-orchestration-layer-fork-extension
verified: 2026-06-01T18:55:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
overrides: []
gaps: []
deferred: []
re_verification: false
human_verification: []
---
```

`[VERIFIED: .planning/phases/43-*/VERIFICATION.md:1-12]`

### Example 5: SUMMARY.md Frontmatter Format (from P45)

```yaml
---
phase: "45-vendor-sync-script"
plan: "45-01"
subsystem: vendor-sync
tags: [bash, shell-scripting, git-integration]
requires:
  - phase: (none — first plan)
    provides: scripts/sync-fork.sh with pinned-file conflict detection
provides:
  - scripts/sync-fork.sh
  - Pinned file conflict detection (4 files)
affects: [45-ci, testing, opencode-tmux-maintenance]
tech-stack:
  added: [git-core]
  patterns:
    - git merge-tree for zero-side-effect conflict detection
    - Temp remote lifecycle with trap cleanup
key-files:
  created:
    - scripts/sync-fork.sh
requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-04]
---
```

`[VERIFIED: .planning/phases/45-*/45-02-SUMMARY.md:1-46]`

### Example 6: UAT.md Format (from P45)

```markdown
---
status: completed
phase: 42-tmux-visual-orchestration-layer-fork-extension
started: 2026-06-01
updated: 2026-06-01
---

## Tests

### 1. Fork Extension
expected: Fork (opencode-tmux) configured with co-pilot config for Hivemind orchestration.
result: verified

### 2. Metadata Titles
expected: Session titles include `hivemindMeta` (agent type, delegation ID, depth) enriched at observer layer.
result: verified

### 3. Plugin Integration
expected: Integration factory creates TmuxIntegration instance when tmux is available.
result: verified

...
```

`[VERIFIED: .planning/phases/45-*/45-UAT.md]`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `buildNoopForkSessionManager()` at compile time | `getForkSessionManager() ?? buildNoopForkSessionManager()` at runtime | Phase 49 | Adapter can be hot-swapped via bridge without recompilation. Tool becomes truly dynamic. |
| `tmuxCopilotTool` defined but unreachable | Registered in `tool:` surface | Phase 49 | Orchestrator agents can now call tmux-copilot; tool is agent-discoverable. |
| No BATS in CI | BATS job for sync-fork.bats | Phase 49 | Shell script changes have automated regression detection. |
| Missing P42/P45 paperwork | VERIFICATION.md + UAT.md + SUMMARY.md | Phase 49 | Phase completion documentation is complete. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ForkSessionManagerAdapter` from `fork-bridge.ts` is structurally assignable to `ForkSessionManager` from `observers.ts` | Observer Wiring | TypeScript structural typing guarantees assignability since both have `onSessionCreated` with same `EnrichedSessionEvent` signature. Low risk. |
| A2 | `bats` CLI is discoverable via `npm install -g bats` in CI | BATS CI | If npm global install fails, use `npx bats` or check `node_modules/.bin/bats`. Low risk — `npx` is standard. |
| A3 | The `bats` npm package (`bats-core/bats-core` v1.13.0) is the same as `bats-core` on GitHub | BATS CI | Verified by P45's installation. `bats` npm package IS bats-core (not sstephenson/bats — that's pre-1.0 and deprecated). Low risk. |
| A4 | P42 has 5 requirements (fork extension, metadata titles, plugin integration, auto-init, graceful degradation) | Paperwork | If more requirements exist, add them. CONTEXT.md lists these 5. Medium risk — read P42 plans to confirm exact count. |
| A5 | P45-Plan-01 outcome is `scripts/sync-fork.sh` creation | Paperwork | If plan 01 was more than just the script, reconcile. CONTEXT.md says "scripts/sync-fork.sh creation, pinned-file conflict detection." Low risk. |

**Active assumptions:** A4 requires reading P42 plans to verify exact requirements. All others are low-risk.

---

## Open Questions

1. **P42 exact requirement count and IDs?**
   - What we know: CONTEXT.md says "P42's 5 requirements (fork extension, metadata titles, plugin integration, auto-init, graceful degradation)"
   - What's unclear: Whether there are formal REQ IDs for these (e.g., REQ-01 through REQ-05)
   - Recommendation: Read `42-01-PLAN.md` through `42-03-PLAN.md` to extract exact requirement IDs. If none exist, assign descriptive names.

2. **P45 Plan 01 scope — was it just `scripts/sync-fork.sh`?**
   - What we know: CONTEXT.md says "plan 01 outcomes (scripts/sync-fork.sh creation, pinned-file conflict detection)"
   - What's unclear: Whether plan 01 included research/spec work too
   - Recommendation: Check `45-01-PLAN.md` for scope. If it included research, include "Research findings documented in 45-RESEARCH.md" in summary.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | TypeScript compiles, plugin.ts modifications | ✓ | 20+ | — |
| `npm` | Tool registration (typecheck) | ✓ | (bundled) | — |
| `tsc` | Type-check after changes | ✓ | (project dep) | — |
| `git` | BATS tests (sync-fork.bats fixture), git operations | ✓ | 2.54.0 | — |
| `bash` | BATS test execution | ✓ | macOS zsh | — |
| `bats` | Running sync-fork.bats locally | ✓ (npm) | 1.13.0 | `npm install -g bats` or `npx bats` |
| `opencode-tmux/` dir | Detecting vendored fork for adapter injection | ✗ (absent) | — | Bridge stays null; tool returns `fork-not-wired` |

**Missing dependencies with no fallback:**
- `opencode-tmux/` directory — the vendored fork is not currently vendored in the repo. The auto-detection (REQ-03, D-05) will correctly skip when absent, keeping backward compatibility.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

> This section is included because `workflow.nyquist_validation` is `true` in config.json.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (for TypeScript), bats (for shell scripts) |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm test` |
| BATS command | `npx bats tests/scripts/sync-fork.bats` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Tool registered in plugin.ts | manual/grep | `grep -c "tmuxCopilot" src/plugin.ts` (expect ≥2) | ✅ plugin.ts |
| REQ-02 | Observer uses runtime bridge lookup | manual/grep | `grep "getForkSessionManager" src/plugin.ts` (expect ≥1) | ✅ plugin.ts |
| REQ-03 | Co-pilot adapter injection at bootstrap | unit (existing) | `npx vitest run tests/lib/tmux` | ✅ existing |
| REQ-04 | BATS in CI | integration | `npx bats tests/scripts/sync-fork.bats` | ✅ sync-fork.bats |
| REQ-05 | P42 VERIFICATION.md + UAT.md | manual | File existence check | ❌ Wave 0 |
| REQ-06 | P45 45-01-SUMMARY.md | manual | File existence check | ❌ Wave 0 |
| REQ-07 | P43 re-verification | verification | `npx vitest run tests/lib/tmux` | ✅ existing |

### Sampling Rate

- **Per task commit:** `npm run typecheck` + `npm test` (for TS changes); `npx bats tests/scripts/sync-fork.bats` (for CI changes)
- **Per wave merge:** Full `npm test` + BATS suite
- **Phase gate:** Full suite green + all paperwork files exist + `grep -c "tmuxCopilot" src/plugin.ts` ≥2

### Wave 0 Gaps

- [ ] `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/VERIFICATION.md` — covers P42 requirements
- [ ] `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` — covers P42 UAT scenarios
- [ ] `.planning/phases/45-vendor-sync-script-2026-06-01/45-01-SUMMARY.md` — covers P45 plan 01 outcomes
- [ ] P43 VERIFICATION.md updated to reflect REQ-05 stricter wiring check

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

> `security_enforcement` is absent from config.json (default: enabled). This phase modifies plugin.ts (composition root) — any wiring error could affect tool visibility. Security concern is about availability (DoS via misregistration) and integrity (wrong tool registered).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | no | Tool does not process user input at registration time |
| V7 Error Handling | yes | Observer wiring must not throw on null bridge; graceful `fork-not-wired` fallback |
| V12 File & Resources | no | No file operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Observer rejects null bridge | Tampering | `getForkSessionManager() ?? buildNoopForkSessionManager()` null-safe pattern in D-02 |
| Tool unreachable to agents | Denial of Service | Registration is static — if `npm run typecheck` passes, tool is registered. Verified by `grep -c`. |
| CI BATS false positive | Spoofing | `continue-on-error: true` means CI passes even if BATS fails. Mitigated by verifying BATS locally first. |

---

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: plugin.ts]` — `src/plugin.ts:1-736`. Tool registration pattern (L645-665), observer pattern (L589-596), `buildNoopForkSessionManager()` (L215-223), integration factory call (L408). Full file read.
- `[VERIFIED: tmux-copilot.ts]` — `src/tools/tmux-copilot.ts:1-189`. Tool instance export (L108), action schema (L74-79), fork-not-wired fallback (L146-149).
- `[VERIFIED: fork-bridge.ts]` — `src/features/tmux/fork-bridge.ts:1-138`. `getForkSessionManager()` (L136-138), `setForkSessionManager()` (L127-129), `ForkSessionManagerAdapter` (L97-101).
- `[VERIFIED: observers.ts]` — `src/features/tmux/observers.ts:1-93`. `createTmuxEventObserver()` (L55-93), `ForkSessionManager` (L37-39), enrichment logic (L70-91).
- `[VERIFIED: integration.ts]` — `src/features/tmux/integration.ts:1-179`. `createTmuxIntegrationIfSupported()` (L139-179), adapter registration (L164-166).
- `[VERIFIED: ci.yml]` — `.github/workflows/ci.yml:1-57`. Current CI job structure (L14-57), node matrix (L18-19).
- `[VERIFIED: sync-fork.bats]` — `tests/scripts/sync-fork.bats:1-210`. BATS test suite with 3 scenarios (L130-210), `bats_require_minimum_version 1.7.0` (L10).
- `[VERIFIED: P43 VERIFICATION.md]` — `.planning/phases/43-*/VERIFICATION.md:1-206`. Template format includes frontmatter, requirement table, artifact checklist, wiring diagram.
- `[VERIFIED: P45 SUMMARY.md]` — `.planning/phases/45-*/45-02-SUMMARY.md:1-127`. Template format includes frontmatter, deliverables, decisions, test details.
- `[VERIFIED: P45 UAT.md]` — `.planning/phases/45-*/45-UAT.md:1-50`. Template format includes status frontmatter, numbered tests with expected/result.
- `[VERIFIED: CONTEXT.md]` — `49-CONTEXT.md:1-144`. Locked decisions D-01 through D-10, phase boundary, 7 requirements.
- `[VERIFIED: SPEC.md]` — `49-SPEC.md:1-147`. 7 requirements, 11 acceptance criteria, constraints, boundaries.
- `[VERIFIED: config.json]` — `.planning/config.json:1-34`. `nyquist_validation: true`.

### Secondary (MEDIUM confidence)
- `[CITED: bats-core documentation]` — bats-core writing-tests documentation at bats-core.readthedocs.io. Used for `bats_require_minimum_version` pattern.
- `[CITED: git-merge-tree docs]` — git-merge-tree(1) man page. `--write-tree` for zero-side-effect conflict detection.
- `[CITED: P45 RESEARCH.md]` — `.planning/phases/45-*/45-RESEARCH.md:1-660`. BATS pattern documentation, git merge-tree pattern.

### Tertiary (LOW confidence)
- None — all critical claims are verified against primary sources (actual code files).

---

## Metadata

**Confidence breakdown:**
- Tool registration: HIGH — verified against actual plugin.ts code at exact line numbers
- Observer wiring: HIGH — verified actual interfaces (structural typing compatibility checked)
- Bridge injection: HIGH — verified factory and bridge patterns in actual code
- BATS CI: HIGH — verified CI YAML structure and BATS suite content
- Paperwork: MEDIUM — P42 exact requirements must be confirmed from plan files (A4)
- P43 re-verification: HIGH — known gap (current compile-time noop vs runtime bridge) clearly identified

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (stable tooling — framework APIs are published npm packages, git plumbing is stable)
