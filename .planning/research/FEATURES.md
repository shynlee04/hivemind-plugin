# Feature Landscape

**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Domain:** OpenCode-native AI coding governance plugin/CLI with runtime orchestration, deterministic agent execution, and terminal UI
**Mode:** ecosystem
**Researched:** 2026-03-17

## Framing

This is a brownfield stabilization milestone, not a blank-sheet product ideation exercise. The right question is not "what can AI coding tools do?" but "what must an OpenCode-native governance/runtime layer do credibly in 2026 without inventing a second platform?"

The ecosystem evidence is clear: OpenCode already provides the server, SDK, plugin hooks, agents, permissions, tools, and TUI surfaces. That means HiveMind's feature set should concentrate on becoming a thin, deterministic, policy-heavy control layer over those official surfaces. Features that bypass the OpenCode server/client/plugin contract are not differentiators here; they are architecture drift.

## Table Stakes

Features users should expect from a credible governance/runtime plugin in 2026. Missing these makes the product feel architecturally wrong, not merely incomplete.

| Feature | Why Expected | Complexity | Dependencies | Confidence | Notes |
|---------|--------------|------------|--------------|------------|-------|
| SDK-backed runtime control plane | OpenCode officially exposes programmatic session, command, shell, config, project, and event APIs through `@opencode-ai/sdk` and the server. A governance layer that still depends on detached local abstractions instead of those APIs will not feel native. | High | OpenCode server/client instance management, session lifecycle refactor, SSE/event subscription, control-plane cleanup | HIGH | This is the foundation feature for the migration; everything else depends on it. |
| Deterministic agent execution guardrails | OpenCode agents already support explicit mode, model, temperature, steps, tool access, and permissions. Users expect governance to make those controls reliable and repeatable instead of leaving execution shape to prompt drift. | High | Agent registry cleanup, permission policy, tool invocation discipline, structured outputs/receipts, deterministic defaults | HIGH | This should cover routing, maximum step budgets, tool allowlists, and reproducible runtime metadata. |
| Permission-aware mutation governance | Permissions are now a first-class OpenCode contract and the old boolean `tools` config is deprecated as of `v1.1.1`. A governance plugin must govern `edit`, `bash`, `task`, `webfetch`, and external-directory access, not bolt on ad hoc safety later. | Medium | `permission.ask`, tool hooks, policy presets, command pattern rules, dangerous-command deny rules | HIGH | For this milestone, safe mutation policy is table stakes, not an enterprise add-on. |
| Bootstrap, doctor, and recovery coherence | Brownfield users need a reliable way to reach a known-good runtime state before any sophisticated orchestration matters. Existing HiveMind flows already include `hm-init`, `hm-doctor`, and `hm-harness`; they now need convergence with the authoritative runtime contract. | Medium | Existing control-plane commands, runtime status tool, startup validation, recovery checkpoints | HIGH | Preserve and harden the current capability; do not replace it with a rewrite. |
| Session continuity, recovery, and compaction survivability | OpenCode has built-in sessions, child sessions, summarization/compaction, undo/redo, and event streams. A governance plugin is expected to preserve task continuity through compaction and restart rather than losing execution state between agent turns. | High | Session APIs, event subscriptions, checkpoint schema, compaction hook handling, receipt persistence | MEDIUM | Official session/compaction primitives are real; the exact HiveMind receipt model is product-specific and still needs validation. |
| TUI-visible operational feedback | OpenCode exposes TUI control surfaces such as prompt append, command execute, and toast notifications. Users expect a terminal-native governance tool to surface status, approvals, and recovery hints where they already work, not in hidden logs only. | Medium | TUI hooks/client methods, runtime status summaries, prompt/toast UX, command integration | HIGH | The stabilization milestone needs a minimal but real TUI operational layer, even if the richer OpenTUI console ships later. |
| Read-only runtime and documentation inspection | Governance without observability slows debugging and erodes trust. OpenCode ships read/search/list/LSP primitives, and HiveMind already has a markdown-first read-only doc surface; preserving that inspectability is part of credibility. | Medium | Existing `hivemind_doc`, search/read tooling, optional LSP enrichment, runtime status read models | MEDIUM | Keep this read-mostly during migration; expanding into speculative intelligence can wait. |

## Differentiators

These are worth building after the foundations above are stable. They strengthen HiveMind's position, but they should not lead the migration milestone.

| Feature | Value Proposition | Complexity | Dependencies | Confidence | Notes |
|---------|-------------------|------------|--------------|------------|-------|
| Live official-boundary certification harness | Proves runtime claims against the real OpenCode server/client/plugin boundary instead of only local mocks. This turns "deterministic" from marketing into evidence. | High | SDK-backed control plane, probe suite, isolated test fixtures, repeatable verification workflows | HIGH | This is the strongest post-foundation differentiator because the project's brand is governance and evidence. |
| OpenTUI operations console | Gives operators a native session tree, runtime state, recovery actions, approval queue, and deterministic execution receipts in one terminal surface. | High | Stable backend contracts, TUI bindings, session/event read models, permission state wiring | MEDIUM | Valuable, but only once backend truth is authoritative. A partial TUI shell without stable backend truth will regress again. |
| Deterministic replay and audit timeline | Lets users inspect what happened, why an agent chose a path, what tools ran, and whether the run is replayable. This is a real governance advantage over generic agent wrappers. | High | Receipts, event capture, tool metadata normalization, timestamped checkpoints | MEDIUM | Strong fit for HiveMind, but the exact replay UX and retention format are still product decisions. |
| Governance policy packs for project modes | Prebuilt policy profiles such as brownfield-safe, audit-only, migration, and recovery can reduce setup time while staying native to OpenCode permissions and agent config. | Medium | Permission presets, agent presets, config projection, documentation | MEDIUM | Good leverage once the core policy model is stable. |
| Safe parallel/worktree orchestration | The ecosystem already shows demand for devcontainers, worktrees, background agents, and workspace orchestration. HiveMind can differentiate by making parallel work deterministic and inspectable instead of just faster. | High | Deterministic receipts, worktree/session mapping, concurrency safety, recovery/reconciliation logic | MEDIUM | Build after single-session determinism is trustworthy. |
| Context hygiene and runtime pruning | Community plugins already target dynamic context pruning and type/context injection. HiveMind can differentiate by pruning stale runtime context and preserving only decision-critical state. | Medium | Receipt model, compaction strategy, doc/runtime metadata classification | MEDIUM | Useful, but not before the core runtime contract is clean. |

## Anti-Features

Features to explicitly not build in this migration milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Parallel execution/session/workflow engine that bypasses OpenCode | OpenCode already provides the authoritative server, SDK, session, tool, and plugin boundary. Building a shadow runtime would worsen drift and undermine the point of the refactor. | Refactor HiveMind onto official OpenCode server/client/plugin flows and keep internal models additive only. |
| Broad legacy surface restoration | Re-expanding archived commands, dead CLIs, or removed public surfaces before runtime truth converges creates more product confusion than value. | Preserve only proven bootstrap/recovery/doc features and reintroduce anything else only after live proof. |
| Speculative new intelligence features | RAG, autonomous research agents, write-heavy doc intelligence, and other ambitious AI features will distract from determinism and control-plane correctness. | Keep doc intelligence read-only and use the milestone to stabilize runtime control. |
| "Full platform" hosted dashboard or SaaS layer | The current problem is local runtime correctness, not cloud product breadth. Adding hosted auth, syncing, billing, or browser-first surfaces would explode scope. | Finish the local OpenTUI/backend contract first; postpone remote or hosted surfaces. |
| PTY-heavy or interactive-shell magic as a core dependency | Non-interactive shell behavior remains the safe default for OpenCode-native execution. Making interactive background processes central this early would increase flake and portability risk. | Keep core flows non-interactive; treat PTY/background support as optional later expansion. |
| Provider/auth expansion work unrelated to determinism | OpenCode already supports a wide provider ecosystem. Adding more provider/auth work does not solve HiveMind's core migration risk. | Consume existing provider/config surfaces and spend effort on runtime governance instead. |

## Feature Dependencies

```text
SDK-backed runtime control plane
  -> Deterministic agent execution guardrails
  -> Permission-aware mutation governance
  -> Bootstrap/doctor/recovery coherence
  -> TUI-visible operational feedback

Deterministic agent execution guardrails
  -> Session continuity and recovery receipts
  -> Live official-boundary certification harness
  -> Deterministic replay and audit timeline
  -> Safe parallel/worktree orchestration

Stable backend truth
  -> OpenTUI operations console
  -> Governance policy packs
  -> Context hygiene and runtime pruning
```

## MVP Recommendation

Prioritize:
1. SDK-backed runtime control plane
2. Deterministic agent execution guardrails
3. Permission-aware mutation governance
4. Bootstrap/doctor/recovery coherence
5. Minimal TUI-visible operational feedback

Why this order:
- The migration fails if HiveMind still sits on partially detached runtime abstractions.
- Determinism without permissions is unsafe, and permissions without a real control plane are brittle.
- Recovery must stay first-class because this is a brownfield product with existing users and existing state.
- A minimal TUI layer should land in the milestone only after backend truth exists; otherwise the frontend becomes another drift surface.

Defer:
- OpenTUI operations console: defer until the backend/runtime contract is stable enough to drive a trustworthy UI.
- Replay/audit timeline: defer until receipts and official-boundary probes exist.
- Safe parallel/worktree orchestration: defer until single-session determinism is proven.
- New intelligence features: defer until runtime credibility is no longer in doubt.

## Sources

### Official OpenCode sources

- OpenCode SDK docs, accessed 2026-03-17, published 2026-03-15 via current search index: `https://opencode.ai/docs/sdk/` — HIGH
- OpenCode Plugins docs, accessed 2026-03-17, published 2026-03-15 via current search index: `https://opencode.ai/docs/plugins/` — HIGH
- OpenCode Permissions docs, accessed 2026-03-17: `https://opencode.ai/docs/permissions/` — HIGH
- OpenCode Server docs, accessed 2026-03-17: `https://opencode.ai/docs/server/` — HIGH
- OpenCode Agents docs, accessed 2026-03-17: `https://opencode.ai/docs/agents/` — HIGH
- OpenCode TUI docs, accessed 2026-03-17: `https://opencode.ai/docs/tui/` — HIGH
- OpenCode Ecosystem docs, accessed 2026-03-17: `https://opencode.ai/docs/ecosystem/` — MEDIUM for market direction, HIGH for existence of listed projects/plugins

### Project-context sources

- `.planning/PROJECT.md` — HIGH for current brownfield scope and active gaps
- `docs/reference/opencode-runtime-determinism-2026-03-15.md` — HIGH for current internal determinism posture
- `docs/synthesis/opencode-sdk.md` — MEDIUM as repo-local synthesis of official docs
- `docs/synthesis/opencode-tui.md` — MEDIUM as repo-local synthesis of official docs

## Confidence Notes

- **HIGH confidence:** what OpenCode officially exposes today and what a native governance layer therefore must align to.
- **MEDIUM confidence:** which post-foundation differentiators will matter most for adoption; these are ecosystem-shaped and strategically strong, but still product choices.
- **LOW confidence:** none used for the primary recommendations because the key calls here could be grounded in official docs plus current project context.
