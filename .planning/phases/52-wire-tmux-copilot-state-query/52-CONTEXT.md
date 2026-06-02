# Phase 52: Wire tmux-copilot + State Query API - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Keep the public contract of `src/tools/tmux-copilot.ts` **identical** (4 actions: send-keys, capture-pane, list-panes, kill-session; `TmuxCopilotResult` union widened in P49 pass-2 fix at L100-112). Swap only the factory: from `buildNoopForkSessionManager()` to `buildInTreeSessionManager()`. Add a new `src/tools/tmux-state-query.ts` read-only tool (no mutation) that exposes session metadata for the observability layer. Expand `src/features/tmux/observers.ts` (93 LOC) with 2 new event subscriptions: `session-state-changed` and `pane-captured`. This phase delivers **2 new tools, 1 expanded observer, 1 factory swap**. Tests: 3 BATS scenarios (1/action); 5+ vitest cases for the new query tool; manual smoke test for the action dispatch. **L1 evidence**: BATS 3/3, vitest 5+ pass, tsc exit 0, manual `tmux-copilot` invoke in a real session produces expected output.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/tools/tmux-copilot.ts` — existing tmux orchestration tool (235 LOC, 4 actions)
- `src/features/tmux/observers.ts` — event observer module (93 LOC, ForkSessionManager interface)
- `src/features/tmux/types.ts` — shared types including SessionManagerAdapter, setSessionManagerAdapter/getSessionManagerAdapter
- `src/features/tmux/session-manager.ts` — SessionManager implementing ForkSessionManager
- `src/features/tmux/integration.ts` — TmuxIntegration factory, createTmuxIntegrationIfSupported
- `src/plugin.ts` — composition root that registers all tools and hooks

### Established Patterns
- Tool pattern: `tool({ description, args, execute })` with Zod discriminated unions
- Event observer pattern: async function `(input: { event?: unknown }) => Promise<void>`
- Module-level adapter bridge: `setSessionManagerAdapter`/`getSessionManagerAdapter` in types.ts
- Permission gates: orchestrator-tier agent validation in execute()
- Result rendering via `renderToolResult` from shared/tool-helpers.js

### Integration Points
- plugin.ts lines 605-607: tmux event observer registration (tmuxIntegration conditional)
- plugin.ts lines 222-231: buildNoopForkSessionManager() factory
- plugin.ts line 51: import of ForkSessionManager type from observers.ts

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
