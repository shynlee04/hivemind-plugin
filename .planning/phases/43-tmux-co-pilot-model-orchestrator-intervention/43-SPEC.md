# Phase 43: Tmux Co-Pilot Model — Orchestrator Intervention — Specification

**Created:** 2026-06-01
**Ambiguity score:** 0.11 (gate: ≤ 0.20)
**Requirements:** 6 locked
**Source authority:** 43-RESEARCH.md (HIGH confidence, has_research: true)

## Goal

Build the **co-pilot model** on top of the Phase 42 fork foundation: enable orchestrator agents to **intervene** in running subagent tmux panes via `send-keys`, **plan** a delegation-aware pane grid, and **query** pane state — through a Hivemind-side `tmux-copilot` tool wired to the forked `@hivemind/opencode-tmux` plugin.

## Background

Phase 42 delivered the passive monitoring layer: a forked `opencode-tmux` renamed `@hivemind/opencode-tmux`, a Hivemind `src/features/tmux/` module with availability detection and event observers, auto-init OpenCode server mode on Tmux detect, and silent fallback when Tmux is unavailable. Pane titles display `[agentType] delegationID — sessionTitle`; pane spawning is driven by `EventSessionCreated` enrichment.

**What exists today (Phase 42 deliverables):**
- Fork `TmuxMultiplexer` in `opencode-tmux/src/tmux.ts` — uses `tmux send-keys` only for `C-c` in `closePane()` (line 180) and `tmux split-window` for horizontal splits (line 117)
- Fork `SessionManager` (295 LOC) — full session→pane lifecycle (spawn, track, idle/busy, auto-close, respawn, cleanup) at `opencode-tmux/src/session-manager.ts`
- Hivemind `src/features/tmux/integration.ts` — factory following `createPtyManagerIfSupported()` pattern; `checkAvailable()`, `isAvailable()`, port persistence
- Hivemind `src/features/tmux/observers.ts` — `createTmuxEventObserver()` that enriches events with `hivemindMeta` (agent type, delegation ID)
- `src/plugin.ts:569-582` — wires the `onSessionCreated` observer callback as a placeholder (`void _enriched` at line 579) for future Phase 43 wiring
- Pane title format `[agentType] delegationID — sessionTitle` per Phase 42 REQ-02
- `copilot: boolean` config flag in `opencode-tmux.json` per Phase 42 REQ-01

**What does NOT exist yet (Phase 43 delivers):**
- `sendKeys()` method on `TmuxMultiplexer` — arbitrary text input to a running pane
- `listPanes()` method on `TmuxMultiplexer` — query current pane state (`pane_id`, `pane_title`, `pane_active`, dimensions)
- `PaneGridPlanner` — depth-aware layout calculator emitting `tmux split-window` sequences from delegation tree shape
- Hivemind `src/tools/tmux-copilot.ts` — agent-callable tool with Zod-validated `send-keys`, `list-panes`, `get-pane`, `plan-grid` actions
- Wiring of `onSessionCreated` placeholder in `src/plugin.ts:579` → forward enriched events to fork's `SessionManager` for co-pilot-aware pane spawning

**Phase boundaries set by user (3-phase roadmap, established in 42-SPEC.md):**
- **Phase 42 (✅ complete):** Fork + basic Tmux integration + server mode auto-init
- **Phase 43 (this phase):** Co-pilot model — orchestrator intervention via send-keys, pane grid planning
- **Phase 44 (deferred):** Visual dependency graph + session-tracker replay/restore on restart

## Requirements

1. **`sendKeys()` method on `TmuxMultiplexer`** — Send arbitrary text input to a running tmux pane via `tmux send-keys -t <paneId> <text>`, with literal mode (`-l` flag) to prevent shell interpretation of special characters, and an automatic `Enter` keystroke for non-literal text submission.
   - Current: `closePane()` in `opencode-tmux/src/tmux.ts:180` uses `send-keys` only for `C-c` (SIGINT). No generic text injection API exists.
   - Target: `TmuxMultiplexer.sendKeys(paneId: string, text: string, literal?: boolean): Promise<boolean>` is exported from the fork. Returns `true` on success, `false` on tmux failure or closed pane.
   - Acceptance: `await tmux.sendKeys("%5", "stop and report status", true)` returns `true`; running `tmux list-panes` shows the text was injected into pane `%5`; the target subagent's `opencode attach` TUI receives the input as keystrokes.

2. **`listPanes()` method on `TmuxMultiplexer`** — Query the current tmux pane state for the session, returning structured `{ paneId, title, active, size }` records parsed from `tmux list-panes -F` output.
   - Current: No pane state query method exists. The fork tracks sessions in `SessionManager.sessions` Map but only in-process; no external observability of tmux state.
   - Target: `TmuxMultiplexer.listPanes(): Promise<Array<{ paneId: string; title: string; active: boolean; size: string }>>` returns all panes with their titles, active flag, and `WxH` dimensions.
   - Acceptance: After spawning 3 subagent panes, `await tmux.listPanes()` returns 3 records, each with a non-empty `title` matching the `[agentType] delegationID — sessionTitle` format set in Phase 42 REQ-02, and `pane_active` correctly reflects which pane is currently focused.

3. **`PaneGridPlanner` computes delegation-aware layout** — Pure function that takes a `GridNode` tree (root + nested children with `sessionId`, `agent`, `depth`) and emits an ordered sequence of `tmux split-window` commands arranged so the **root orchestrator occupies the main pane**, **level-1 direct children split horizontally below the root**, and **level-2+ descendants split vertically from their parent pane**. Debounced (500ms batch window) so rapid subagent spawns do not thrash the visible layout.
   - Current: `tmux split-window -h` (horizontal only) is used uniformly at `opencode-tmux/src/tmux.ts:117` regardless of delegation depth. Layout is flat — no hierarchy awareness.
   - Target: `PaneGridPlanner.computeSplitSequence(tree: GridNode): SplitCommand[]` returns a list of `{ direction, parentPaneId, childPaneId }` triples that, when executed sequentially via `tmux split-window`, reproduce the delegation hierarchy visually.
   - Acceptance: Given a tree `{ root: { sessionId: "ses_root", depth: 0, children: [ { sessionId: "ses_a", depth: 1, children: [...] }, { sessionId: "ses_b", depth: 1, children: [] } ] } }`, the planner emits: (a) split main horizontally for `ses_a`, (b) split `ses_a` vertically for its children, (c) split main horizontally again for `ses_b`. After execution, `tmux list-panes` shows `ses_a` and `ses_b` as siblings of `ses_root`, with `ses_a`'s children stacked above `ses_a` (or below, per layout config).

4. **Hivemind `tmux-copilot` tool with Zod-validated actions** — New tool at `src/tools/tmux-copilot.ts` registered in `src/plugin.ts` tool list. Exposes four discriminated-union actions (`send-keys`, `list-panes`, `get-pane`, `plan-grid`) to orchestrator agents. Tool resolves target session → paneId via `SessionManager.sessions` Map before any tmux CLI call.
   - Current: No agent-callable tool exists for tmux interaction. Agents can only observe via Phase 42's pane title metadata.
   - Target: `src/tools/tmux-copilot.ts` exports `TmuxCopilotInputSchema` (Zod discriminated union) and `createTmuxCopilotTool()` factory. Tool is registered in `src/plugin.ts` AGENT_TOOLS and visible to orchestrator-tier agents.
   - Acceptance: An orchestrator agent calls `delegate-task` with `action: "send-keys", sessionId: "ses_abc", text: "report status"`; tool resolves `ses_abc` → paneId via `SessionManager.sessions`, invokes `TmuxMultiplexer.sendKeys()`, returns `{ sent: true, paneId: "%5" }`. Invalid `sessionId` (not tracked) returns `{ sent: false, error: "unknown session" }` without touching tmux.

5. **Wire `onSessionCreated` placeholder to forward enriched events to fork's `SessionManager`** — Replace `void _enriched // intentional: enriched event for future use` at `src/plugin.ts:579` with actual call into the fork's `SessionManager.onSessionCreated(enriched)`, passing the Hivemind-enriched event (with `agent`, `delegationId`, `parentID` metadata) so the fork can use it for co-pilot-aware pane spawning.
   - Current: `src/plugin.ts:569-582` registers `createTmuxEventObserver({ onSessionCreated: async (_enriched) => { void _enriched } })` — a no-op placeholder with a comment promising future wiring.
   - Target: The callback resolves `SessionManager` from the fork's plugin instance, calls `sessionManager.onSessionCreated(enriched)` with the enriched event, and the fork's `parentID` guard (relaxed in Phase 42 for co-pilot mode) accepts the enriched payload.
   - Acceptance: After Phase 43, a `delegate-task` call from a non-child session (co-pilot mode) triggers a pane spawn; the new `onSessionCreated` callback fires with an enriched event containing `agent: "gsd-phase-researcher"` and `delegationId: "del_xyz"`; the fork's `SessionManager` spawns a pane with title `[gsd-phase-researcher] del_xyz — ...` and persists `agent` + `delegationId` in `SessionManager.sessions` for later `sendKeys()` lookup.

6. **Graceful error handling for `send-keys` to closed/missing panes** — When the orchestrator calls `send-keys` for a session whose tmux pane was auto-closed (idle timeout) or never existed, the tool returns a structured error response without crashing, and the fork's `SessionManager` attempts pane respawn before reporting failure.
   - Current: `tmux send-keys` to a non-existent pane ID returns a tmux CLI error string; the fork has no graceful handling — the error propagates uncaught.
   - Target: `TmuxMultiplexer.sendKeys()` returns `false` (not throw) on tmux error. The co-pilot tool maps `false` → `{ sent: false, error: "pane closed or not found", sessionId }`. When the session is tracked in `SessionManager.sessions` but the pane was auto-closed, the tool invokes `SessionManager.respawn(sessionId)` first, then retries `sendKeys()` once.
   - Acceptance: A `send-keys` call to a session whose pane was idle-closed returns `{ sent: false, error: "pane closed or not found", respawnAttempted: true }` — the respawn is logged but the `send-keys` itself reports failure to the orchestrator agent (no silent retry storms).

## Boundaries

**In scope:**
- `sendKeys()` and `listPanes()` methods on `TmuxMultiplexer` in the fork
- `PaneGridPlanner.computeSplitSequence()` pure function in fork (`opencode-tmux/src/grid-planner.ts`)
- Hivemind `src/tools/tmux-copilot.ts` tool with 4 actions
- Wiring `onSessionCreated` placeholder in `src/plugin.ts:579` to fork's `SessionManager`
- Graceful error handling for closed-pane send-keys (REQ-06)
- Debounced grid recomputation (500ms batch window)
- Zod input validation on all co-pilot tool actions
- Unit tests in `tests/lib/tmux/` (sendKeys, listPanes, grid-planner) and `tests/tools/tmux-copilot.test.ts`

**Out of scope:**
- Visual dependency graph of delegation hierarchy — Phase 44
- Session-tracker replay/restore on Hivemind restart — Phase 44
- General-purpose sidecar UI dashboard — deferred (SC-PTY-01)
- Rewriting the fork to pure Node.js — the fork remains Bun-native per Phase 42 constraint
- Inter-plugin direct method calls between Hivemind and the fork — Phase 43 uses tmux CLI as the integration boundary; if OpenCode plugin API later allows inter-plugin method calls, this is a Phase 44+ optimization
- Changing pane title format from Phase 42's `[agentType] delegationID — sessionTitle` — keep as-is
- Removing the `copilot: boolean` config flag from `opencode-tmux.json` — keep as-is from Phase 42
- Auto-port retry on conflict — Phase 42 mitigation is sufficient; Phase 43 assumes stable port
- Renaming `@hivemind/opencode-tmux` fork — keep fork name from Phase 42

## Constraints

- **No new npm packages:** All functionality uses existing `execFile` (Node built-in), `@opencode-ai/plugin` (peer dep), `@opencode-ai/sdk` (transitive), and Zod (existing dep). No `package.json` changes required.
- **Fork runtime:** `@hivemind/opencode-tmux` remains Bun-native per Phase 42 constraint. Hivemind integrates via hooks/tools in `src/`, not by importing fork code directly.
- **Bun/Node hybrid:** Tests in Hivemind use Vitest on Node.js; tests in fork use Bun. Cross-runtime test isolation is the test framework's responsibility.
- **tmux is enhancement layer, not hard dependency:** All co-pilot tool actions must check `TmuxIntegration.isAvailable()` first; unavailable tmux → tool returns `{ sent: false, error: "tmux not available" }` (or `panes: []` for list actions). No crashes on missing tmux.
- **Pane ID instability:** Pane IDs change after `select-layout`, `join-pane`, or `split-window` operations. `sendKeys()` and `listPanes()` must query current state (not cache) before operating. Anti-pattern flagged in RESEARCH.md Pitfall 4.
- **send-keys escaping:** Special characters (`'`, `"`, `$`, `\`, backticks) in intervention text must NOT be interpreted by the shell. Use `tmux send-keys -l` literal mode by default; only fall back to non-literal when the orchestrator explicitly requests shell evaluation.
- **Debounced grid planner:** Layout recalculation is debounced 500ms. Do NOT recalculate on every `session.created`/`session.deleted` event — the visible pane flicker is unacceptable (RESEARCH.md Pitfall 3).
- **Test mocking:** tmux and opencode CLI are not available in the current environment (per 43-RESEARCH.md Environment Availability). All tmux CLI calls in tests must be mocked via `execFile` mocking pattern (already established in `tests/lib/tmux/integration.test.ts`).
- **Vitest framework:** Test framework is Vitest with `vitest.config.ts` at project root. No test framework changes.

## Acceptance Criteria

- [ ] `sendKeys(paneId, text, literal=true)` succeeds against a tracked pane; tmux receives the text as literal keystrokes (no shell interpretation of `$`, `'`, `"`)
- [ ] `listPanes()` returns ≥1 record per tracked subagent session, each with a non-empty `title` matching Phase 42's `[agentType] delegationID — sessionTitle` format
- [ ] `PaneGridPlanner.computeSplitSequence(tree)` produces the correct split direction sequence for a 3-level tree (root → 2 children → 2 grandchildren each = 7 nodes total)
- [ ] Co-pilot tool rejects unknown `sessionId` with `{ sent: false, error: "unknown session" }` and does NOT call tmux
- [ ] Co-pilot tool Zod schema rejects malformed input (missing `action`, wrong action type, missing required fields per action) with structured validation error
- [ ] `onSessionCreated` placeholder at `src/plugin.ts:579` is replaced with a real call that resolves `SessionManager` from the fork and forwards the enriched event
- [ ] `sendKeys()` to a closed/missing pane returns `false` and the co-pilot tool returns `{ sent: false, error: "pane closed or not found", respawnAttempted: true|false }` — no uncaught exception
- [ ] Grid planner is debounced — rapid-fire `session.created` events do not trigger more than 1 layout recalculation per 500ms
- [ ] All new tool actions short-circuit gracefully when `TmuxIntegration.isAvailable()` returns `false` (no tmux calls attempted)
- [ ] All new code passes `npm run typecheck` and `npx vitest run tests/lib/tmux/ tests/tools/tmux-copilot.test.ts`

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | ✓ | 6 specific requirements with code-level behavior; Architectural Responsibility Map from RESEARCH.md |
| Boundary Clarity | 0.93 | 0.70 | ✓ | Explicit in/out-of-scope; Phase 42 SPEC.md `Out of scope` section names Phase 43 deliverables verbatim |
| Constraint Clarity | 0.80 | 0.65 | ✓ | No new packages; Bun/Node hybrid preserved; tmux literal mode flag A1, A2 marked [ASSUMED] for runtime validation; inter-plugin communication A3 uses CLI boundary |
| Acceptance Criteria | 0.88 | 0.70 | ✓ | 10 pass/fail criteria; 6 unit testable in <30s; Wave 0 gaps identified for test files |
| **Ambiguity** | **0.11** | ≤0.20 | ✓ | Gate passed |

**Calculation:** `1.0 − (0.35×0.92 + 0.25×0.93 + 0.20×0.80 + 0.20×0.88) = 1.0 − 0.885 = 0.115 ≈ 0.11`

## Interview Log

> `--auto` mode: Socratic interview skipped because initial ambiguity (0.11) is below the 0.20 gate. All decisions below are auto-defaulted from 43-RESEARCH.md + 42-SPEC.md + 42-ASSUMPTIONS.md. The 4 open questions below are surfaced for runtime validation in Wave 0, not user clarification.

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|-----------------|
| auto | Researcher | What are the 6 deliverables for Phase 43? | REQ-01 sendKeys, REQ-02 listPanes, REQ-03 PaneGridPlanner, REQ-04 co-pilot tool, REQ-05 wire onSessionCreated, REQ-06 closed-pane graceful error |
| auto | Researcher | Where does the co-pilot tool live? | `src/tools/tmux-copilot.ts` per RESEARCH.md recommended structure |
| auto | Researcher | Integration boundary: CLI or inter-plugin API? | tmux CLI as boundary (safer; works regardless of plugin runtime); direct method calls deferred |
| auto | Researcher | Send-keys escaping strategy? | Literal mode (`-l`) by default; non-literal explicit opt-in |
| auto | Researcher | Grid planner thrashing mitigation? | 500ms debounce window; only recompute on tree-shape change |
| auto | Researcher | Test framework & mocking? | Vitest; execFile mocking pattern from `tests/lib/tmux/integration.test.ts`; tmux+opencode CLI mocked |
| auto | Researcher | Acceptance criteria shape? | 10 pass/fail criteria; 6 test-mapped in RESEARCH.md (test map carried forward) |
| auto | Researcher | Open question: `tmux send-keys -l` flag verification? | A1 [ASSUMED] — verify in Wave 0 with `tmux send-keys --help` |
| auto | Researcher | Open question: `#{pane_title}` format variable? | A2 [ASSUMED] — verify in Wave 0 with `tmux list-panes -F '#{pane_title}'` |
| auto | Researcher | Open question: Inter-plugin communication? | A3 [ASSUMED CLI-only] — runtime check during Wave 0; if direct API available, optimize in Phase 44+ |
| auto | Researcher | Open question: `opencode attach` stdin behavior? | A4 [ASSUMED] — empirical test in Wave 0; if TUI doesn't process send-keys, fallback to OpenCode SDK `session.prompt()` |

---

*Phase: 43-tmux-co-pilot-model-orchestrator-intervention*
*Spec created: 2026-06-01*
*Source authority: 43-RESEARCH.md (HIGH confidence, valid until 2026-06-30)*
*Next step: `/gsd-discuss-phase 43` — implementation decisions (how to build what's specified above)*
