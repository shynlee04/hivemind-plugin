# Changelog

All notable changes to the `hivemind` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- Removed vendored `opencode-tmux/` fork; in-tree tmux-copilot module (P50-P55 synthesis) replaces it.

### Added
- **Phase 60 (C2-Residuals)**: TDD tests with evidence labels for 4 modules (session-patch, continuity store, handlers, mocks) — closes §4.9
- Phase 0 Governance Baseline (docs/governance)
- Core Architecture (WS-CA) Bootstrap CLI & Config Consumer Runtime Wiring
- Sector Governance Foundation (Option 3 Docs-Only Route)
- HER-0 Ecosystem Re-map & Reality Audit (2026-05-05)
- HER-1 Documentation & Configuration Recovery (2026-05-05)

### Changed
- **WAL marker (§4.1)**: Added lightweight WAL marker to dual-write path for crash safety — ensures atomicity during concurrent writes
- **Continuity delegation path (§4.7)**: Canonicalized overlapping continuity state source delegation path — single authority for state reads
- **Sidecar 7× `as any` elimination (§4.10)**: Replaced all `(registry as any)` casts in sidecar handlers with typed access via `SidecarDependencyRegistry`
- **`@CQRS-BOUNDARY` annotation (§4.11)**: Added explicit CQRS boundary annotation to `session-patch` — documents read/write surface separation

### Fixed
- **SessionRouter consolidation (§4.8)**: Updated test mocks for `sessionRouter` consolidation — eliminates classification/router duplication

### Fixed
- **S5b**: tmux panel now spawns for every SDK-created child session, even when the OpenCode SDK does not fire `session.created`. The `DelegationCoordinator` now synthesizes an `EnrichedSessionEvent` and calls `tmuxIntegration.adapter.onSessionCreated` directly after `childSessionStarter.start()` returns, mirroring the existing `onChildSessionCreated` fallback for session-tracker. `ChildSessionStartResult` now surfaces `title` and `workingDirectory` so the synthesized event carries the right pane description. Idempotency preserved via `SessionManager.sessions` / `spawningSessions` guards. Resolves live UAT blocker documented in `.planning/debug/s5-panel-spawn-root-cause-2026-06-04.md`.
- Corrected agent/skill/tool counts across AGENTS.md and ARCHITECTURE.md
- Fixed 14 broken command agent references in `.opencode/commands/`
- Updated notification-handler status from DEPRECATED to ACTIVE in `src/lib/AGENTS.md`

## [0.1.0] - 2026-04-25

### Added
- **Phase 26**: Quality Synthesis — HMQUAL-01 through HMQUAL-08 quality contract for all `hm-*` skills
- **Phase 16.5**: Agents Builder Configuration — 772 tests passing
- **Phase 16**: PTY integration, delegation lifecycle management (5/6 plans complete)
- **Phase 15**: 26 security and quality audit fixes
- **Phase 14**: WaiterModel delegation — dual-signal completion, hybrid persistence, 407 tests
  - SDK child-session dispatch (resumable)
  - PTY command-process dispatch (best-effort)
  - Headless process dispatch (non-resumable)
  - `DelegationManager` orchestrator with concurrency queue
  - `CompletionDetector` with session.idle + stability timer
- **Phase 12**: False-start repair and reconciliation
- **Phase 08**: Corrective closure — runtime policy override persistence
- **Phase 02**: V3 runtime architecture — 18/18 runtime truths verified
- **Phase 01**: Baseline cleanup

### Core Features
- CQRS Plugin Architecture with WaiterModel delegation
- 16 registered tools (delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart, hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-agent-work-create, hivemind-agent-work-export)
- 7 hook factories for event observation and session lifecycle
- Dual-layer state: durable JSON persistence + in-memory Maps
- Keyed semaphore concurrency (FIFO per model+agent+category)
- Trusted runtime policy with per-session overrides
- Schema kernel with Zod v4 validation
- Event tracker with markdown artifact output to `.hivemind/event-tracker/`
- Session journal with append-only event timeline
- Execution lineage tracking

### Architecture Decisions
- **Q1**: Hybrid + Spec-Driven Automated Runtime Detection
- **Q2**: Artifact-Focused Sidecar (Next.js + @json-render/react)
- **Q3**: Session Journal as Complement + Time-Machine Foundation
- **Q4**: MVP = 5 of 8 memory categories
- **Q5**: Full RICH gate — no threshold lowering
- **Q6**: `.hivemind/` as internal state root, `.opencode/` for primitives only

[Unreleased]: https://github.com/your-org/hivemind/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/hivemind/releases/tag/v0.1.0
