# Changelog

All notable changes to the `hivemind` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 62 — Child Session Capture Resilience)

Decouples Hivemind child session capture from OpenCode SDK v1.17.x unreliable lifecycle events. Replaces event reliance with a 6-layer defense stack:

- **L1: Before-hook creation** — child `.json` written at delegation time via `tool.execute.before` (not only after delegation completes)
- **L2: Proactive polling** — `pollForChildSessions()` discovers children and writes them to disk immediately
- **L3: After-hook metadata enrichment** — richer `PostToolUse` metadata for child session state
- **L4: Gate 4 fallback** — `pendingRegistry.getByParent()` resolves parent route when Gates 1-3 fail
- **L5: Final poll** — one-shot `finalPollForChildSessions()` post-execution catch
- **L6: Force backfill** — `forceBackfillAllChildren()` enumerates children from disk at delegation cycle end and re-reads SDK messages

#### Requirements Covered
- **REQ-62-01** — Child `.json` created in `tool.execute.before` ✅
- **REQ-62-02** — `handleTask()` fallback when `task_id` absent (creates `.json` with `cancelled` status) ✅
- **REQ-62-03** — `pollForChildSessions()` with immediate write on discovery ✅
- **REQ-62-04** — Gate 4 in `resolveChildLifecycleRoute()` (`pendingRegistry.getByParent()`) ✅
- **REQ-62-05** — `forceBackfillAllChildren()` at delegation cycle end ✅

#### Evidence
- 1040/1040 session-tracker tests pass (12 + 7 + 6 new tests across 3 test files)
- TypeScript strict, no `as any`, no `@ts-ignore`
- Module sizes (under user-relaxed 700 LOC ceiling — see Rationale below):
  - `src/features/session-tracker/capture/tool-capture.ts` — 541 LOC
  - `src/features/session-tracker/capture/tool-before-helper.ts` — 297 LOC
  - `src/features/session-tracker/capture/child-backfiller.ts` — 264 LOC
  - `src/features/session-tracker/tool-delegation.ts` — 446 LOC
- 6 atomic commits across 3 waves: `02a993c32`, `3ada0c325`, `7d7f42773`, `241fa2706`, `65e85c28a`, `c81c06174`
- Quality gate triad: Lifecycle Integration ✅ → Spec Compliance ✅ → Evidence Truth ✅

### Added (Phase 63 — Child Session Context Injection)

Injects recent child session data into the main agent's system prompt via the `experimental.chat.system.transform` hook, so the main agent can SEE cancelled/aborted child sessions and decide to use `stackOnSessionId` to resume them. Compensates for OpenCode SDK 1.17.x lifecycle event delivery gaps without modifying OpenCode itself.

- **`getChildSessions()` helper** (`src/shared/session-api.ts`): returns `ChildSessionInfo[]` with id, agent, status, last activity
- **`hasChildrenAPI()` feature-detect** — guards against SDK versions without children API
- **Injection block** in `handleSystemTransform()` — after behavioral profile, before final prompt
- **Module-level cooldown cache** (5s TTL) — prevents excessive SDK calls per LLM turn
- **`stackOnSessionId` usage instructions** included in injected block

#### Observable Truths Covered
- **T-01** `getChildSessions()` helper exported ✅
- **T-02** Main sessions with children get formatted table ✅
- **T-03** Table includes ID, Agent, Status, Last Activity ✅
- **T-04** `stackOnSessionId` usage instructions included ✅
- **T-05** Non-main sessions get no injection ✅
- **T-06** Zero children → no injection ✅
- **T-07** 5-second TTL cache (Map + timestamp) ✅
- **T-08** Errors caught silently, no crash ✅
- **T-09** Last 10 children, most-recent-first ✅
- **T-10** No new files, only modifications ✅

#### Evidence
- 231/231 hooks tests pass (10 new cases for injection)
- TypeScript strict, no `as any`
- Module sizes (under user-relaxed 700 LOC ceiling):
  - `src/shared/session-api.ts` — 535 LOC
  - `src/hooks/lifecycle/core-hooks.ts` — 375 LOC
- 2 atomic commits: `c81abc78f`, `736c3b9be`
- Quality gate triad: Lifecycle Integration ✅ → Spec Compliance ✅ → Evidence Truth ✅

### Module Size Cap Relaxation (ship rationale)

The default `src/AGENTS.md` module size cap is 500 LOC. For this shipment, the user authorized a relaxation to 700 LOC for the following files:

- `src/features/session-tracker/capture/tool-capture.ts` (541)
- `src/shared/session-api.ts` (535)

Both files exceed 500 LOC but are under 700. The remaining modified files (tool-before-helper.ts 297, child-backfiller.ts 264, tool-delegation.ts 446, core-hooks.ts 375) are under the default 500 cap. This is a **one-time, per-shipment relaxation** — not a permanent config change. Future refactor phases should target the 500 LOC default. Rationale: the additions are defensive layers (6-layer capture stack + context injection) where splitting would harm cohesion.

### Fixed (Phase 27.3 — Intent Lock Death Spiral Fix)

Surgical fix cho 4 catastrophic bugs (F-6 transition bug, F-1 allowlist quá hẹp, F-2 không escape hatch, G-1/G-4 guidance sai) gây death-spiral lockout trong intent-lock gate. Session bị kẹt vĩnh viễn ở UNLOCKED state.

**Root Cause:** `submitCheckpointEvidence()` chỉ persist evidence, không bao giờ gọi state machine transition. UNLOCKED allowlist chặn chính công cụ để thoát UNLOCKED. Không có escape hatch. Guidance sai — hướng dẫn dùng công cụ bị chặn.

**Core Fixes:**

- **REQ-1 (F-6 — Transition Bug):** `hm-intent-checkpoint submit` với checkpoint `"intent_locked"`/`"c1_3"` ở UNLOCKED → gọi `lockIntentCodeChange()` → state chuyển LOCKED_CODE_CHANGE. History entry ghi lại `from: UNLOCKED, to: LOCKED_CODE_CHANGE`. Evidence vẫn được persist.
- **REQ-2 (F-1 — Allowlist):** Thêm `hm-intent-checkpoint`, `hivemind-trajectory:create`, `hivemind-agent-work-create` vào UNLOCKED allowlist. Agent có thể submit evidence, tạo trajectory, tạo contract — tất cả đều cần để thoát UNLOCKED. Tool bị chặn trước đó (write/edit/task) vẫn bị chặn.
- **REQ-3 (F-2 — Escape Hatch):** Hai escape hatch: (A) question-based override — user authorize override qua `question` tool; (B) `--bypass-gate` flag trên `execute-slash-command` — single-command bypass. In-memory Set keyed by sessionID, mất khi restart.
- **REQ-4 (G-1/G-4 — Guidance):** `GATE_GUIDANCE_MAP[UNLOCKED]` hướng dẫn gọi `hm-intent-checkpoint submit` với checkpoint `"intent_locked"`, không còn hướng dẫn sai `"hm-spec-phase"`. Thêm "question tool override" cho escape path.

**Commits (7 atomic):**
- `becc91720` — REQ-1: wire submit → lockIntentCodeChange
- `522ce493f` — REQ-2: add 3 tools to UNLOCKED allowlist
- `46fcf91a5` — REQ-3: escape hatch + `--bypass-gate` flag
- `74834f840` — REQ-4: update UNLOCKED guidance
- `b109c106f` — REVIEW.md (1 BLOCKER, 3 WARNING, 2 INFO → all fixed)
- `a6fea5f1c` — VERIFICATION.md (gaps → remediation)
- `a35730fc2` — Gap fix: override_gate handler + guidance + REQ-3 tests

**Files Modified (5 source files):**
- `src/tools/hivemind/hm-intent-checkpoint.ts` — transition logic + override_gate handler
- `src/features/intent-lock/tool-resolver.ts` — 3 tools in UNLOCKED allowlist
- `src/hooks/guards/intent-lock-gate.ts` — escape hatch + guidance update
- `tests/features/intent-lock/intent-lock-guidance.test.ts` — UNLOCKED assertion update
- `tests/hooks/intent-lock-gate.test.ts` — REQ-3 escape hatch tests

**Quality Gate Triad:** Lifecycle Integration ✅ → Spec Compliance ✅ → Evidence Truth ✅

**Acceptance Criteria:** 12/13 PASS (1 pre-existing E2E failure — không do P27.3). Typecheck clean. P27.1 regression tests pass.

### Added (Phase 27.1 — Intent Lock Gate)

- **`workflow.intent_lock` config** (`.hivemind/configs.json`): new nested object with `enabled: boolean` (default `false`). When enabled, root sessions are gated through a 4-step progression: IntentLock artifact → TRAJECTORY_INIT + landscape.json → ROADMAP/STATE sync → phase manifest. Child sessions are NEVER gated.
- **Dual-layer state store** at `.hivemind/intent-lock/{sessionId}.json` (mirrored in-memory Map cache).
- **`tool.execute.before` hook** (`src/hooks/guards/intent-lock-gate.ts`): new step 1.7 in the existing guard chain. Throws `IntentLockBlockedError` (D-23 hard block) on violation. Read-only tools (`read`/`glob`/`grep`) bypass the gate.
- **6 bash moderate-blocklist regex patterns** (root sessions only): `>`, `>>`, `sed -i`, `tee`, `rm -rf`, `mv`, `chmod`.
- **Resume inheritance**: new root session inherits `LOCKED_CODE_CHANGE` state from the most recent main session via continuity-snapshot lookup. TUI toast notification on inheritance (configurable).
- **4 verify-step functions**: `verifyStep1IntentLock`, `verifyStep2TrajectoryLandscape`, `verifyStep3RoadmapState`, `verifyStep4PhaseCreation`. Each returns a `StepVerification` and persists the new state on success.
- **Permission matrix + bash blocklist** in `src/features/intent-lock/tool-resolver.ts`. 7 states (UNLOCKED → ... → COMPLETED) each with their allowed tool set.

### Out of Scope (deferred)

- SPEC.md / CONTEXT.md generation in EXECUTING state (handled by `/hm-spec-phase` and `/hm-discuss-phase` specialists)
- Cross-cluster routing changes (P27 owns)
- Multi-language block messages (English only for v1)
- Granular config (purposes, step overrides, parallel, resume) — all hardcoded defaults
- Child session gating (explicitly NOT gated by design)

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
