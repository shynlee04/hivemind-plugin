# Research Summary: HiveMind Runtime Refactor and Deterministic Execution Migration

**Domain:** OpenCode governance plugin, harness, and terminal operations dashboard
**Researched:** 2026-03-18
**Overall confidence:** HIGH

## Executive Summary

The current codebase is not failing because it lacks concepts; it is failing because the concepts are hard to find. Runtime entry, harness flow, workflow state, trajectory state, plugin interception, and TUI rendering all exist, but they are spread across technical layers that force a maintainer to reconstruct one feature from many folders. The local audit shows the problem clearly: harness logic spans `src/cli/harness.ts`, `src/control-plane/control-plane-handler.ts`, command execution, and runtime snapshot assembly in `src/shared/runtime-attachment.ts`; the TUI exists in `src/tui`, builds into `dist/tui`, but is not wired into package exports, scripts, or the CLI.

External research points to a better shape. Angular, OpenAI, Anthropic, Microsoft, and Spring Modulith all converge on the same practical rule: optimize the top-level tree for discoverability, then enforce internal boundaries mechanically. In other words, keep stable runtime surfaces like `tools`, `hooks`, and `plugin`, but move behavior ownership into feature or capability modules. That is why `oh-my-openagent` feels easier to navigate: its tree answers "what capability am I changing?" before it answers "which abstract layer is this?"

The strongest recommendation is a hybrid modular monolith: keep OpenCode-facing surfaces (`tools`, `hooks`, `plugin`, `commands`) because they match the real runtime contract, but introduce a `features/` layer that owns runtime-entry, session-entry, workflow, trajectory, handoff, doc intelligence, and runtime observability. If you want the TUI first, do not start with a richer dashboard. Start by extracting and wiring the TUI as a real app boundary over the server and shared contracts, because OpenTUI is Bun-exclusive today while the shipped package is Node-based. The first TUI phase should make it real, not just prettier.

## Key Findings

**Stack:** Keep the package on `Node + TypeScript + @opencode-ai/sdk + @opencode-ai/plugin`, but run the OpenTUI dashboard as an isolated Bun app with shared contracts.

**Architecture:** Use a hybrid structure: top-level `features/` for capability ownership, plus `tools/`, `hooks/`, and `plugin/` as thin OpenCode adapter surfaces.

**Critical pitfall:** Do not keep `src/tui` inside the Node package as an orphan OpenTUI spike; official OpenTUI docs say Bun-only, and the current TUI test already fails under Node/`tsx` with `.scm` asset loading.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **TUI Runtime Foundation** - make the dashboard real before making it rich
   - Addresses: server-wired dashboard shell, live event subscription, runtime status view, approved command bridge
   - Avoids: orphan TUI code, Bun/Node confusion, mock-driven dashboard behavior

2. **Runtime Entry Consolidation** - make bootstrap, doctor, settings, and harness one feature
   - Addresses: `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`, runtime attachment, readiness artifacts
   - Avoids: harness logic split across CLI, commands, control-plane, and shared glue

3. **Session, Workflow, and Trajectory Feature Modules** - move ownership to feature boundaries
   - Addresses: start-work routing, workflow lifecycle, trajectory ledger, handoff, continuity
   - Avoids: layer-first sprawl and trajectory/workflow cross-mutation

4. **Runtime Observability and Tool/Command Gateway** - expose one authoritative read model
   - Addresses: runtime status, receipts, event normalization, TUI/CLI shared truth
   - Avoids: fragmented runtime truth across plugin, CLI, TUI, and generated files

5. **Harness Hardening and Live Proof** - prove the system through real OpenCode boundaries
   - Addresses: live harness verification, policy packs, replay/audit, advanced dashboard panels
   - Avoids: overclaiming determinism from local tests or static docs

**Phase ordering rationale:**
- You asked for TUI first, but the safe TUI-first move is infrastructure first: extract the dashboard into a real app/runtime boundary, wire it to the OpenCode server, and share typed read models.
- Runtime-entry consolidation comes next because the dashboard should call one backend seam, not four partial ones.
- Workflow and trajectory refactors follow because they are the biggest source of concept scattering in the current tree.
- Observability comes after feature ownership so the dashboard and CLI can consume one clean model.
- Live proof lands after the seams exist, otherwise the proof suite only certifies today's sprawl.

**Research flags for phases:**
- Phase 1: Decide exact TUI packaging (`apps/opentui` vs workspace package) and Bun execution model.
- Phase 3: Untangle `trajectory` from workflow mutation without breaking current behavior.
- Phase 5: Define what counts as live harness evidence versus local verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official OpenCode and OpenTUI docs plus local build/test evidence agree strongly. |
| Features | HIGH | The feature set is grounded in the actual repo gaps, not generic AI platform speculation. |
| Architecture | HIGH | Official guidance and local audit both support a feature-owned modular monolith. |
| Pitfalls | HIGH | The highest-risk issues are directly visible in code and confirmed by current tooling behavior. |

## Gaps to Address

- Exact workspace strategy for a Bun-powered OpenTUI app inside a Node-shipped repo
- Exact contract shape shared between backend runtime status and dashboard panels
- Exact live-proof harness flow for server, plugin, tool, and event verification
