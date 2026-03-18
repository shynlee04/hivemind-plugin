# Feature Landscape

**Domain:** OpenCode governance plugin, runtime harness, and terminal operations dashboard
**Researched:** 2026-03-18

## Table Stakes

Features users should expect. Missing them makes the product feel unstable rather than incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Server-wired TUI shell | The dashboard must connect to the OpenCode server and render live state, not just compile. | High | Current `Dashboard.tsx` still uses mock wiki data and a hardcoded base URL. |
| Unified runtime status snapshot | CLI, tools, and dashboard need one consistent view of runtime attachment, readiness, and workflow state. | High | This is the contract the dashboard should consume first. |
| Runtime-entry feature (`init`/`doctor`/`settings`/`harness`) | Operators need one discoverable place for bootstrap and repair. | Medium | Today the behavior is split across CLI, control-plane, slash-command execution, and shared runtime helpers. |
| Session-entry and routing feature | Every governed run needs a clear start-work decision path. | Medium | Current logic exists, but it is hidden behind hook-layer organization. |
| Separate workflow and trajectory features | Maintainers need to know where workflow ends and trajectory begins. | High | Current coupling makes both harder to reason about. |
| Approved command/tool bridge for UI actions | The TUI must trigger real backend actions through supported commands/tools. | Medium | No local-only dashboard authority. |
| Live event adapter | Operators expect recent events, status changes, and receipts in the dashboard. | Medium | Should be normalized before it reaches UI components. |
| Harness proof lane | A governance product needs evidence, not only local green tests. | High | Required to prove server/plugin/tool behavior together. |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Replay and audit timeline | Turns governance into something inspectable after the fact. | High | Strong fit once receipts are unified. |
| Policy packs | Makes brownfield-safe, audit-only, and recovery modes easy to adopt. | Medium | Useful after feature ownership is cleaned up. |
| Parallel/worktree orchestration | Gives the harness more leverage once single-session determinism is proven. | High | Defer until core state ownership is stable. |
| Richer TUI panels | Branch planner, hierarchy, pipeline, and command views become genuinely useful once wired to backend truth. | Medium | Build after the shell and contracts are real. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Second dashboard track (`dashboard-v2` plus `tui`) | Two dashboard implementations create permanent ambiguity. | Pick one dashboard path and archive the other. |
| Prompt-only harness control | It feels faster, but it is not maintainable or auditable. | Put critical behavior behind feature APIs, tools, and runtime receipts. |
| OpenTUI inside the root Node runtime | Official docs and local test evidence both say this is the wrong default today. | Isolate the dashboard as a Bun-powered app package. |
| More top-level folders by file type | The current problem is already concept scattering. | Consolidate ownership into feature modules. |
| Rich dashboard visuals before backend contracts | Pretty UI on unstable state just hides the real issue. | Wire server, contracts, and actions first; enrich panels later. |

## Feature Dependencies

```text
Server-wired TUI shell
  -> Unified runtime status snapshot
  -> Approved command/tool bridge
  -> Live event adapter

Unified runtime status snapshot
  -> Replay and audit timeline
  -> Richer TUI panels

Runtime-entry feature
  -> Harness proof lane
  -> Approved command/tool bridge

Separate workflow and trajectory features
  -> Replay and audit timeline
  -> Parallel/worktree orchestration
```

## MVP Recommendation

Prioritize:
1. Server-wired TUI shell
2. Unified runtime status snapshot
3. Runtime-entry feature consolidation
4. Session-entry, workflow, and trajectory feature ownership
5. Harness proof lane

Defer: replay timeline, policy packs, advanced orchestration, and richer TUI panels until the TUI shell and backend seams are stable.

## Sources

- Local audit of `src/cli/harness.ts`, `src/control-plane/control-plane-handler.ts`, `src/shared/runtime-attachment.ts`, `src/tui/**`, and `package.json` - HIGH
- OpenTUI docs - https://opentui.com/docs/getting-started - HIGH
- Anthropic harness guidance - https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents - HIGH
- OpenAI harness engineering - https://openai.com/index/harness-engineering/ - HIGH
