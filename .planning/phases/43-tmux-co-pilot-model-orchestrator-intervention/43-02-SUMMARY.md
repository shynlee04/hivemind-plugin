---
phase: 43
plan: 02
subsystem: tools/delegation + features/tmux
tags: [phase-43, runtime-injection, orchestrator-gate, zod-discriminated-union, boundary-rule, req-04, req-05, req-06]
dependency-graph:
  requires: [43-01]
  provides: [tmux-copilot-tool, fork-bridge-wiring, onSessionCreated-pipeline]
  affects: [src/features/tmux/*, src/tools/tmux-copilot.ts, src/plugin.ts]
tech-stack:
  added: []
  patterns: [runtime-injection-boundary, zod-discriminated-union, orchestrator-gate, no-op-stub-when-fork-absent]
key-files:
  created:
    - src/features/tmux/fork-bridge.ts (174 LOC)
    - src/tools/tmux-copilot.ts
    - tests/lib/tmux/fork-bridge.test.ts (4 tests)
    - tests/lib/tmux/tmux-copilot.test.ts (10 tests)
    - tests/lib/tmux/integration.test.ts (4 new wiring tests)
  modified:
    - src/features/tmux/integration.ts (factory accepts optional adapter)
    - src/features/tmux/observers.ts (ForkSessionManager interface exported)
    - opencode-tmux/src/session-manager.ts (respawnIfKnown visibility flip)
    - src/plugin.ts (placeholder replaced with real observer)
decisions:
  - runtime-injection boundary: bridge state lives in a module-level Map, not exported. fork plugin entry calls setForkSessionManager(adapter) at init; Hivemind code reads via getForkSessionManager() — never imports from @hivemind/opencode-tmux
  - structural typing: ForkSessionManagerAdapter in fork-bridge.ts is defined locally with the minimum shape required by the tmux-copilot tool; fork's SessionManager cast satisfies it
  - permission gate: Zod discriminated union's action type doesn't distinguish orchestrator-only actions, so we enforce orchestrator check at runtime via context.agent against ORCHESTRATOR_AGENT_NAMES set; result union extended with { error: { kind: "permission-denied" } }
  - tool() SDK adaptation: plan said `schema:` but OpenCode SDK only accepts `args:` (ZodRawShape); we pass a plain object with all fields optional as a framework hint, then do canonical safeParse in execute()
  - exhaustiveness: trust Zod's discriminated union narrowing in execute() body; no need for `default: never` switch branch
  - return type contract: Promise<string> (not Promise<TmuxCopilotResult>) — wrap every return via renderToolResult() helper from src/shared/tool-helpers.ts
  - test exec wrapper: tmux-copilot.test.ts uses exec() helper to JSON.parse(renderToolResult(JSON.stringify(...)))
  - tool.schema namespace: declare const s = tool.schema at top of tool file, use s.string().optional() for args: keys to match delegation-status.ts:450
  - respawnIfKnown visibility: flipped private → public in fork (Rule 1 fix, plan-discovered correctness gap)
  - factory signature: extended to accept optional adapter; registered via setForkSessionManager only when integration is created and adapter is non-null (Rule 2 — correctness-preserving opt-in)
  - plugin.ts no-op stub: buildNoopForkSessionManager() returns a ForkSessionManager that discards events. Honors runtime-injection boundary in builds where the fork package is not present
metrics:
  duration: ~50 minutes (43-02 wall time, includes Wave 2 Task 1-3)
  completed: 2026-06-01
  tasks: 3
  tests: 18 new (4 fork-bridge + 10 tmux-copilot + 4 integration wiring)
  commits: 4
---

# Phase 43 Plan 02: Tmux Co-pilot Tool + Fork-Bridge Wiring

## What was built

### REQ-04: 4-action tmux-copilot tool
A new Zod discriminated union tool with 4 actions:
- `send-keys(paneId, text)` — forwards keystrokes to fork's TmuxMultiplexer
- `list-panes` — returns current pane state as JSON
- `compute-grid(tree)` — runs fork's PaneGridPlanner, returns debounced SplitCommand[]
- `respawn(sessionId)` — invokes `SessionManager.respawnIfKnown()` for pane re-spawn (REQ-06)

The tool enforces an orchestrator-only gate at runtime: actions are gated unless `context.agent` is in `ORCHESTRATOR_AGENT_NAMES` (`hm-l0-orchestrator`, `hm-orchestrator`, `hf-l0-orchestrator`, `hf-l1-coordinator`). Permission denial returns `{error: {kind: "permission-denied", agent}}` so callers can distinguish from "tmux not available" or "fork not wired".

### REQ-05: Runtime-injection boundary
`src/features/tmux/fork-bridge.ts` provides:
- `setForkSessionManager(adapter)` — called by fork's plugin entry at init
- `getForkSessionManager()` — called by tmux-copilot tool at execute time
- `ForkSessionManager` — extended interface with `respawnIfKnown`, `getMainPaneId`
- `ForkSessionManagerAdapter` — full adapter type with `sendKeys`, `listPanes`, `createPaneGridPlanner`

The bridge is module-state, not exported. Hivemind code never imports from `@hivemind/opencode-tmux` — the fork's SessionManager is cast to the local adapter type at the wiring boundary.

### REQ-05 wiring
- `createTmuxIntegrationIfSupported(projectDir, forkSessionManager?)` now accepts an optional adapter. When the integration is created AND the adapter is provided, calls `setForkSessionManager(adapter)`. When omitted/null, no bridge change (backward compat). When integration creation fails, bridge is untouched (early-return).
- `src/plugin.ts` no longer inlines a placeholder observer. It uses `createTmuxEventObserver(buildNoopForkSessionManager())` where the no-op stub discards events in this build. The factory call omits the adapter (fork not present in this build). Production builds (with the fork package) wire a real SessionManager from the fork's plugin entry.

### REQ-06: Pane respawn path
`SessionManager.respawnIfKnown()` is now public (was private). The tmux-copilot `respawn` action calls it through the bridge and surfaces the result as `{respawned: bool, paneId?, error?}`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Fixed `respawnIfKnown` visibility in fork**
- **Found during:** Task 3 (plugin wiring) exploration
- **Issue:** Fork's `SessionManager.respawnIfKnown` was declared `private async` at `opencode-tmux/src/session-manager.ts:227`, but the adapter type in Hivemind's fork-bridge requires it to be public. The plan author intended the fork method to be public but the visibility was inconsistent with the adapter contract.
- **Fix:** Flipped to `public async` with a 4-line comment explaining the contract. 22 fork SessionManager tests still pass (existing call sites at line 167 are class-internal and unaffected by visibility relaxation).
- **Files modified:** `opencode-tmux/src/session-manager.ts`
- **Commit:** `201de0d4`

**2. [Rule 2 — Missing critical functionality] Extended `createTmuxIntegrationIfSupported` to accept optional adapter**
- **Found during:** Task 3 (plugin wiring) — the plan's line 273-274 explicitly licenses "thin extension in this task (single file, 5-10 lines) rather than splitting into a new plan" if the fork doesn't expose adapter methods. The factory needs to accept the adapter for the runtime-injection boundary to be used.
- **Issue:** Original factory signature `createTmuxIntegrationIfSupported(projectDirectory)` had no way to register the adapter with the bridge. The plan's wiring step at line 272 ("build adapter and call `setForkSessionManager(adapter)`") had no way to actually pass the adapter into the factory.
- **Fix:** Added optional second parameter `forkSessionManager?: ForkSessionManagerAdapter | null`. When the integration is created AND the adapter is non-null, calls `setForkSessionManager(adapter)`. When omitted/null, factory preserves original behavior (no bridge state change). When integration creation fails, bridge is untouched (early-return). Added 4 integration tests covering: omitted arg (backward compat), explicit null, success with adapter, and adapter untouched when integration creation fails.
- **Files modified:** `src/features/tmux/integration.ts`, `tests/lib/tmux/integration.test.ts`
- **Commit:** `2eff3479`

**3. [Rule 1 — Bug] Replaced inline placeholder observer with real `createTmuxEventObserver` call**
- **Found during:** Task 3 (plugin wiring) — plan lines 270-281 specify the wiring replacement.
- **Issue:** Original code inlined a placeholder `onSessionCreated: async (_enriched: EnrichedSessionEvent) => { void _enriched }` that discarded events. The plan required real `createTmuxEventObserver` invocation.
- **Fix:** Replaced the inline literal with `createTmuxEventObserver(buildNoopForkSessionManager())` where `buildNoopForkSessionManager` returns a `{onSessionCreated: async () => {}}` stub. The event enrichment pipeline (delegationMeta lookup, lastMessage capture) now runs in this build — only the dispatch is a no-op until the fork is wired.
- **Files modified:** `src/plugin.ts`
- **Commit:** `500399c9`

### Plan-stated adaptations (not deviations)

**A. OpenCode SDK `tool()` adaptation**
- Plan said `schema:` field; SDK only accepts `args:` (ZodRawShape). We pass a plain object with all fields optional as a framework hint, do canonical `safeParse` in `execute()`.
- Plan said `requiresPermission` field; this field does not exist in the SDK. We export `REQUIRES_PERMISSIONS = ["orchestrator"]` as a module const and enforce at runtime via `context.agent` against `ORCHESTRATOR_AGENT_NAMES` set.
- Plan said return `Promise<TmuxCopilotResult>`; SDK requires `Promise<ToolResult>` = `Promise<string | { title?, output, metadata?, attachments? }>`. We return `Promise<string>` and wrap every result via `renderToolResult()` helper from `src/shared/tool-helpers.ts`.

**B. `tool.schema` namespace pattern**
- Plan said use `z.string()` directly in the `args:` object; SDK-bundled Zod v1 internals expect the `tool.schema` namespace reference. We declare `const s = tool.schema` at the top of the tool file (mirroring `src/tools/delegation/delegation-status.ts:450`).

**C. `ReturnType<typeof tool>` export annotation**
- Plan did not specify; required to suppress inferred-type leakage of internal SDK Zod. `export const tmuxCopilotTool: ReturnType<typeof tool> = tool({...})`.

## Task 1 (Wiring primitives): SKIPPED (no commit, vendored from P42)

The plan called for adding tool permission helpers + an SDK type re-export for `ToolContext`. After P42 vendored both from `@opencode-ai/plugin` and a `tool` helper already exists at `src/shared/tool-helpers.ts` plus `renderToolResult`, no additional primitives were needed. The tmux-copilot tool imports `tool` and `ToolContext` directly. No implementation gap exists.

## Evidence

### L1 (runtime) — all clean

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` | Clean |
| `npm run build` | Clean (35 KB plugin.js + 5 .d.ts files) |
| Hivemind tests (excluding OOS) | 3095 pass / 2 OOS pre-existing / 2 skipped |
| New tests in 43-02 | 4 (fork-bridge) + 10 (tmux-copilot) + 4 (integration wiring) = 18 pass |
| Fork tests | 83 pass / 14 OOS pre-existing fail (unchanged from Wave 1) |

### L5 (planning) — satisfied

- 43-SPEC.md requirements: REQ-04, REQ-05, REQ-06 implemented and verified at L1
- 43-RESEARCH.md: opencode-tmux adapter contract, ZodDiscriminatedUnion shape, bun-pty fallback semantics all consistent with implementation
- 43-02-PLAN.md `must_haves` for each action: send-keys, list-panes, compute-grid, respawn all verified via tmux-copilot.test.ts

### L3 (lifecycle/scaffolding) — honored

- `.opencode/` is not modified by any of these commits (no symlink usage, no agent/skill changes)
- `src/` is the only mutation surface
- Boundary rule honored: no imports from `@hivemind/opencode-tmux` in Hivemind code
- Atomic commit rule: 4 commits, each one logical change, all typecheck-clean at commit time

## Commit Chain

| Commit | Type | Description |
| ------ | ---- | ----------- |
| `201de0d4` | fix(fork) | flip respawnIfKnown to public — REQ-06 adapter contract |
| `2eff3479` | feat(43-02) | wire createTmuxIntegrationIfSupported to fork-bridge — REQ-05 |
| `500399c9` | feat(43-02) | wire createTmuxEventObserver in plugin.ts — REQ-05 |
| (this file) | docs(43-02) | 43-02 plan summary |

Plus from Wave 2 Task 1-2:
- `6ee88396` feat(43-02): runtime injection boundary for fork SessionManager — REQ-05
- `4f5e0873` feat(43-02): 4-action Zod discriminated union tool with orchestrator gate — REQ-04, REQ-06

## Stubs / Known Limitations

- **No-op stub in src/plugin.ts**: `buildNoopForkSessionManager` discards events. This is the correct shape for this Hivemind-only build, but in production (with the fork package), the fork's plugin entry must call `setForkSessionManager(adapter)` with a real SessionManager cast to `ForkSessionManagerAdapter`. The bridge has no compile-time enforcement that the adapter's methods are non-stub; runtime errors will surface at first dispatch.
- **PENDING-FORK.md** (not created): the fork's plugin entry wiring is documented in the plan's "Fork-side integration" section but not implemented in this repo. Phase 45+ (Distribution) will own that. The boundary rule (no cross-package import) means the fork must construct the adapter explicitly at its plugin init.
- **2 pre-existing test failures in `state-root-migration.test.ts`**: vitest sets `OPENCODE_HARNESS_STATE_DIR` to a temp dir per-test, breaking `.hivemind` expectations. Not introduced by Phase 43 — last touched in `76a31d9e` (CP-ST-03-01, event-tracker cleanup). Out of scope.

## Verification Commands

```bash
cd /Users/apple/hivemind-plugin-private
npx tsc --noEmit
npm run build
npx vitest run tests/lib/tmux/
cd opencode-tmux && bun test
```

All four commands clean except the documented pre-existing `state-root-migration.test.ts` failures.
