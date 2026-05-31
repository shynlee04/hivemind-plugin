# Phase 42: Tmux Visual Orchestration Layer — Fork Extension — Specification

**Created:** 2026-05-31
**Ambiguity score:** 0.11 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Fork `opencode-tmux`, rename to `@hivemind/opencode-tmux`, and integrate it into Hivemind as an optional visual orchestration layer: `session.created` events auto-spawn Tmux panes showing live subagent output, with Hivemind metadata in pane titles, auto-initiated OpenCode server mode, and silent fallback when Tmux is unavailable.

## Background

The `opencode-tmux` plugin (FloSchl8/opencode-tmux, 594 LOC source, 1,780 LOC total) solves the hard part of listening for OpenCode `session.created` events and spawning Tmux panes via `opencode attach <serverUrl> --session <id>`. A fork exists at `shynlee04/opencode-tmux` and a full codebase audit has been completed (`.planning/notes/tmux-fork-audit-2026-05-31.md`).

**What exists today in Hivemind:**
- Session-tracker — durable session records for potential restart recovery
- `run-background-command` tool with PTY manager (Bun-pty)
- `readonly-state.ts` — SIDECAR-03 foundation (pre-built, unwired)
- `delegate-task` / `task` delegation system creates child sessions

**What does NOT exist yet (Phase 42 delivers):**
- Fork modified with Hivemind-specific features (co-pilot mode, metadata titles)
- Hivemind bootstrap hook to auto-initiate OpenCode server mode (`--port`)
- Hooks/tools in `src/` to connect opencode-tmux plugin to Hivemind delegation
- Graceful fallback when Tmux is unavailable

**Phase boundaries set by user (3-phase roadmap):**
- **Phase 42 (this phase):** Fork extension + basic Tmux integration + server mode auto-init
- **Phase 43:** Co-pilot model — orchestrator intervention via send-keys, pane grid planning
- **Phase 44:** Visual dependency graph + session-tracker replay/restore on restart

## Requirements

1. **Fork extension with Hivemind-specific config**: Fork `opencode-tmux`, rename to `@hivemind/opencode-tmux`, add `copilot: boolean` and `agentLabelFormat: string` config keys to `opencode-tmux.json`, relax the `parentID` guard in `session-manager.ts` to support co-pilot sessions.
   - Current: `opencode-tmux` has flat config (layout, mainPaneSize, autoClose) and only monitors child sessions (parentID check)
   - Target: Fork exists as `@hivemind/opencode-tmux` with `copilot` config flag and Hivemind metadata injection
   - Acceptance: Config file accepts `copilot: true/false` — when `copilot: true`, panes are spawned for non-child sessions tagged with role metadata; pane titles include agent type and delegation ID

2. **Hivemind metadata in pane titles**: Pane titles display agent type (e.g., `[researcher]`, `[planner]`) and Hivemind delegation ID (not just first 30 chars of session title).
   - Current: `opencode-tmux` titles pane by first 30 chars of session title only
   - Target: Pane titles follow format `[agentType] delegationID — sessionTitle`
   - Acceptance: After a `delegate-task` call with a known agent type, the spawned pane shows e.g. `[gsd-phase-researcher] ses_abc — Research phase 42`

3. **Hivemind plugin integration (hooks/tools in src/)**: Create Hivemind-side integration in `src/features/tmux/` — a thin connection layer that detects the forked plugin, wires `session.created` events to Tmux pane spawning, and exposes pane lifecycle status.
   - Current: No `src/features/tmux/` module exists; opencode-tmux operates independently as a third-party plugin
   - Target: `src/features/tmux/` module with a factory that checks Tmux availability via `which tmux`, checks for the forked plugin, and provides a tool to query pane status
   - Acceptance: `TmuxIntegration.checkAvailable()` returns `{ available: true, version: "3.4" }` when tmux is installed; module imports without error; tool registered in plugin.ts

4. **Auto-initiate OpenCode server mode at bootstrap**: When Hivemind detects Tmux is available and the tmux integration is enabled, it must automatically start OpenCode with an internal `--port` flag (stable port), making the server URL available to the Tmux plugin, with zero manual steps required from the user.
   - Current: OpenCode starts in client mode by default; no auto-port mechanism
   - Target: Hivemind bootstrap hook detects Tmux → auto-starts OpenCode with `--port <stablePort>` → passes server URL to tmux plugin
   - Acceptance: When Tmux is available, `opencode attach` connects successfully without user manual port configuration; server URL is discoverable by the tmux plugin

5. **Graceful degradation (silent fallback)**: When Tmux is not available (no `tmux` binary, Windows, container, server headless), Hivemind delegation continues normally — no Tmux panes are created, no errors are raised, no warnings spammed to the user.
   - Current: No fallback mechanism exists — opencode-tmux either works or fails
   - Target: Hivemind checks Tmux availability at bootstrap; if unavailable, the tmux integration module reports `{ available: false }` silently, and all delegation proceeds without Tmux involvement
   - Acceptance: On a system without Tmux, Hivemind starts, delegation works, no error messages or panics occur, and `TmuxIntegration.isAvailable()` returns `false`

## Boundaries

**In scope:**
- Fork of `opencode-tmux` → `@hivemind/opencode-tmux` with Hivemind config extension
- Hivemind metadata in pane titles (agent type + delegation ID)
- `src/features/tmux/` module — availability detection, integration factory
- Bootstrap hook for auto-init OpenCode server mode (detect tmux → `--port`)
- Graceful silent fallback when tmux unavailable

**Out of scope:**
- Orchestrator intervention via send-keys — Phase 43
- Pane grid planning / layout calculation — Phase 43
- Visual dependency graph of delegation hierarchy — Phase 44
- Session-tracker replay/restore on Hivemind restart — Phase 44
- Rewriting opencode-tmux Bun-specific APIs to Node.js — the fork remains Bun-native; Hivemind integrates via hooks/tools in `src/`
- General-purpose sidecar UI dashboard — deferred (SC-PTY-01)
- Making the fork a monorepo asset inside Hivemind — it stays in its own repo (`shynlee04/opencode-tmux`)

## Constraints

- **Runtime:** `opencode-tmux` fork uses Bun (TypeScript/Bun runtime). Hivemind detects and activates when Bun is available. No Bun-specific API rewrite — the fork stays Bun-native.
- **Tmux dependency:** Tmux is an enhancement layer, NOT a hard dependency. Silent fallback when unavailable.
- **OpenCode server mode:** Auto-init with `--port <stablePort>` required. User does zero manual steps.
- **Config:** New config keys (`copilot`, `agentLabelFormat`) go into `opencode-tmux.json` config file (flat, project-level).
- **Port stability:** The `--port` chosen for server mode must be stable across Hivemind sessions within the same project (so tmux panes re-attach correctly after restarts).

## Acceptance Criteria

- [ ] `session.created` event triggers `opencode attach` in a new Tmux pane with correct server URL and session ID
- [ ] Pane title displays agent type + delegation ID format (not just 30-char session title)
- [ ] Config flag `copilot: true/false` in `opencode-tmux.json` changes behavior: `true` spawns panes for non-child sessions
- [ ] OpenCode server mode auto-initiates on bootstrap when Tmux is detected (no manual `--port` required)
- [ ] When Tmux is unavailable, delegation runs normally — no Tmux panes, no errors, `TmuxIntegration.isAvailable()` returns `false`

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | ✓ | 5 specific deliverables, 3-phase roadmap defined |
| Boundary Clarity | 0.95 | 0.70 | ✓ | Explicit in/out-of-scope with phase assignments |
| Constraint Clarity | 0.82 | 0.65 | ✓ | Bun/Node hybrid, silent fallback, auto-server-mode |
| Acceptance Criteria | 0.85 | 0.70 | ✓ | 5 pass/fail criteria |
| **Ambiguity** | **0.11** | ≤0.20 | ✓ | Gate passed |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|-----------------|
| 1 | Researcher | What deliverables for Phase 42? | 3-phase roadmap: 42 (fork+basic), 43 (co-pilot), 44 (graph+restore) |
| 1 | Researcher | Which seed capabilities are must-have? | 5 must-haves: monitoring, persistence, rename, metadata titles, auto-server-mode |
| 1 | Researcher | OpenCode server mode constraint? | Auto-init on Tmux detect — zero manual steps |
| 2 | Researcher | Fork runtime — Bun or Node? | Hybrid — fork stays Bun, Hivemind detects/activates when Bun available |
| 2 | Simplifier | Fallback when Tmux unavailable? | Silent fallback — no error, no panes, delegation continues |
| 2 | Researcher | Acceptance criteria shape? | 5 pass/fail criteria: pane spawn, metadata titles, config flag, auto-server-mode, graceful degradation |

---

*Phase: 42-tmux-visual-orchestration-layer-fork-extension*
*Spec created: 2026-05-31*
*Next step: `/gsd-discuss-phase 42` — implementation decisions (how to build what's specified above)*
