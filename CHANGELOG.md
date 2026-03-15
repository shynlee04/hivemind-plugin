# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.9.5] - 2026-03-16

### Breaking Changes
- **Hard cutover to SDK-native architecture** — No compatibility shims
- Removed `src/core/session/` (5 files) — SDK hooks replace session middleware
- Removed `src/shared/event-bus.ts` — SDK hook system replaces custom pub/sub
- Removed `src/hooks/session-lifecycle.ts`, `src/hooks/messages-transform.ts` — Replaced by stable hook bridges
- Removed `src/schemas/` — Zod schemas now live in tool definition files
- Renamed `emitGovernanceToast()` → `showGovernanceToast(category, message)`

### Added
- **Stable SDK hooks**: `chat.message` (Part injection), `permission.ask` (auto-allow HiveMind tools), `tool.execute.before` (trajectory pre-flight)
- **SDK client integrations**: `soft-governance.ts` → `client.tui.showToast()` (throttled), `logging.ts` → `client.app.log()` (fire-and-forget)
- **`getEffectivePaths(root)`** — Canonical path authority replacing ad-hoc path construction
- **Runtime tools in `agentToolCatalog`** — `hivemind_runtime_status` and `hivemind_runtime_command` now registered
- **7 new governance guard scripts**: `check-no-event-bus`, `check-no-core-session`, `check-tool-schema`, `check-hooks-readonly`, `check-plugin-assembly`, `check-agents-presence`, `check-asset-refs`
- **Test infrastructure**: `tests/helpers/` (mock-sdk, mock-paths, mock-tools)
- **3 new test suites**: tool-contract (8), tool-helpers-dedup (16), plugin-assembly-smoke (4)
- **5 documentation files**: SDK architecture overview, 2 ADRs, migration guide, test architecture
- **58 total tests pass** across 20 clean test files

### Changed
- **Type decomposition**: `TrajectoryRecord` (22→4 groups), `StartWorkDecision` (26→4), `PromptPacketState` (25→4), `SlashCommandBundle` (17→3), `CommandExecutionInput` (25→4), `RuntimeAttachmentSettings` (17→3)
- **Plugin entry is assembly-only** — All tool definitions extracted to `src/tools/`
- **`lint:boundary` expanded** from 4 guards to 11
- **Surface registry deduplicated** — Runtime admin tools now sourced from `agentToolCatalog`
- All sector `AGENTS.md` charters present and validated
- `intelligence/doc/` flagged as `[ROUTER-ONLY]`

### Fixed
- 5 pre-existing test failures fixed: agent-boundary (stale YAML assertions), soft-governance (API rename), runtime-tools (surface registry drift), local-charter (section model change), runtime hook names

### Added
- `experimental.chat.messages.transform` hook with stop-checklist injection and continuity context enrichment (`<anchor-context>`, `<focus>`)
- Session boundary manager (`src/lib/session-boundary.ts`) with lifecycle warning integration and checklist-boundary recommendation
- Non-disruptive SDK session rollover after compaction (`client.session.create`) with non-fatal fallback behavior
- Task manifest persistence for `todo.updated` events into `.hivemind/state/tasks.json`
- Optional `auto_commit` governance flow for file-changing tools (`write`, `edit`, `bash`) with new auto-commit helpers

### Fixed
- `export_cycle` now synchronizes flat `brain.hierarchy` projection after tree mutations, eliminating hierarchy/tree desync after subagent exports
- `declare_intent` no longer overwrites per-session files with legacy active template content; legacy `active.md` is updated separately for backward compatibility
- Stale auto-archive path now resets `hierarchy.json`, preventing orphaned tree carryover into newly created sessions
- `soft-governance` now wires `trackSectionUpdate`, activating section repetition detection that was previously dead code
- Persistence migration now backfills `metrics.write_without_read_count` (and related governance defaults) for older installs
- Compaction hook now consumes and clears `next_compaction_report` after injection to avoid stale repeated report injection
- Tool gate drift warnings now use projected turn state and persist drift score updates, removing one-turn lag and unsaved in-memory drift mutation

### Changed
- First-run setup guidance now includes project/framework snapshot hints and a deep reconnaissance protocol before implementation
- `declare_intent` now requires completed CLI initialization (`.hivemind/config.json`) instead of silently bootstrapping default state
- Runtime log directory is now aligned with `.hivemind/logs` for initialized projects
- `initializePlanningDirectory` now creates `.hivemind/logs` explicitly

### Documentation
- `README.md` fully rewritten: coherent install-to-runtime flow, upgrade guidance, troubleshooting, and expanded Vietnamese section focused on practical onboarding
- `README.md` refreshed for Phase B: hook count/tool catalog accuracy, merged tool names, and new governance capabilities

## [2.8.0] - 2026-02-19

### Added
- Vietnamese-first launch framing in `README.md` with 10 demo-ready use cases for product launch narratives
- Public branch hardening policy in `scripts/guard-public-branch.sh` for internal/dev-only paths
- HiveFiver auto-realignment next-step policy (menu options + permission-gated execution for mutating actions)

### Changed
- Release package boundary tightened for npm/npx distribution:
  - hidden from public package payload: `docs`, `templates`, `prompts`, `references`
  - retained public operational pack: `commands`, `skills`, `agents`, `workflows`
- Version bump to `2.8.0`

### Verified
- Full typecheck, test suite, and clean rebuild validated for release readiness

## [2.6.0] - 2026-02-12

### Added
- **Ink-based TUI dashboard** (`hivemind dashboard`) replacing the old REST dashboard backend
- **Live governance panels** in TUI: session, hierarchy, metrics, escalation alerts, and traceability
- **Bilingual dashboard mode (EN/VI)** with runtime toggle (`l`) and manual refresh (`r`)
- **Traceability in TUI**: current timestamp, active session timeline, and current git hash
- **Semantic validation in `ecosystem-check`**: hierarchy chain integrity + stamp validation
- **Trace metadata in `ecosystem-check --json`**: `trace.time` and `trace.git_hash`
- **New test suites**: dashboard TUI (9 assertions), ecosystem-check CLI (8 assertions)

### Changed
- `hivemind init` CLI wiring now accepts `--automation <manual|guided|assisted|full|retard>`
- `hivemind status` now shows automation level
- `hivemind dashboard` now launches the TUI with `--lang` and `--refresh` options
- `README.md` coverage and command docs updated to current state

### Removed
- Obsolete cleanup artifacts: `.npmignore`, `tasks/`, and `docs/archive/historical-plans/`

## [2.5.0] - 2026-02-12

### Added
- **Evidence Gate System** — Escalating prompt pressure with 4 tiers (INFO → WARN → CRITICAL → DEGRADED) that intensify over unresolved turns
- **Evidence-based argument-back** — Every detection signal now includes data-backed evidence strings and counter-arguments against common agent excuses
- **"I am retard" mode** — New `automationLevel` CLI option with 5 levels (manual/guided/assisted/full/retard); retard mode forces strict governance, skeptical output, code review, max handholding
- **Write-without-read tracking (FileGuard)** — `soft-governance.ts` tracks blind file writes; detection engine generates `write_without_read` signal with evidence
- **`AutomationLevel` config type** — Persisted in `config.json`, read by hooks every turn (Rule 6)
- **`compileEscalatedSignals()`** — New entry point for evidence-based prompt injection, wraps `compileSignals()` with tiers + evidence + counter-excuses
- **`computeEscalationTier()`** — Pure function: turns × threshold → tier classification
- **44 new test assertions** — Evidence gate system tests: escalation, evidence quality, retard mode init, format compatibility (688 total)

### Changed
- **Session lifecycle hook** — Now uses `compileEscalatedSignals()` instead of `compileSignals()` for richer prompt injection
- **Prompt format** — Escalated signals show `[TIER] message`, `EVIDENCE: data`, `↳ counter-argument` (backward compatible with non-escalated signals)
- **Retard mode auto-config** — Forces strict governance, beginner expert level, skeptical output, code review required, be_skeptical=true
- **Archived 9 historical plan documents** to `docs/archive/`

## [2.3.0] - 2026-02-12

### Added
- **Entry chain edge case tests** — JSONC config handling, re-init guard, config persistence verification (14 new assertions)
- **Config persistence verification** — `loadConfig` deep-merges constraints with defaults, partial updates preserve existing values
- **Re-init guard** — `hivemind init` no longer overwrites existing config (preserves governance_mode, language)

### Fixed
- **JSONC config handling** — `opencode.jsonc` files now parsed correctly (was crashing on trailing commas/comments)
- **Master plan file tree accuracy** — docs now match actual output of `hivemind init`
- **Frozen config (L8)** — All 3 hooks now re-read config from disk each invocation via `loadConfig(directory)` instead of using stale closure values
- **Tool gate duplication (L9)** — Removed 130-line duplicated `createToolGateHookInternal` body; now delegates to `createToolGateHook().internal`
- **Dead sentiment_signals field (L10)** — Removed deprecated `SentimentSignal` type and `sentiment_signals: []` from BrainState schema
- **README accuracy (L1)** — Updated from "11 tools, 386 assertions" to "14 tools, 621 assertions"
- **CLI --help (L5)** — `--help` and `-h` flags now show help instead of running init

### Changed
- Hook factories accept `_initConfig` parameter (unused — config read from disk per Rule 6)
- `bin/hivemind-tools.cjs` and `skills/` added to package.json `files` array for npm shipping
- Removed stale `tasks/prd-production-ready.md` and orphan `session-ses_3b3a.md`

### Removed
- `SentimentSignal` interface and `sentiment_signals` field from BrainState
- Duplicated `createToolGateHookInternal` function body (kept as thin wrapper for backward compat)
- `src/lib/sentiment.ts` export from barrel (file retained for git history)

## [2.2.0] - 2026-02-12

### Added
- **export_cycle tool** (14th tool) — Captures subagent results into hierarchy tree + mems brain
- **Auto-capture hook** — `tool.execute.after` auto-captures all Task tool returns into `brain.cycle_log[]`
- **Pending failure acknowledgment** — `pending_failure_ack` flag set when subagent reports failure; system prompt warns until agent acknowledges
- **Skill system** (5 skills) — Behavioral governance through skills: `hivemind-governance` (bootstrap), `session-lifecycle`, `evidence-discipline`, `context-integrity`, `delegation-intelligence`
- **Tool activation engine** (7 priorities) — Suggests next tool based on session state (LOCKED → declare_intent, high drift → map_context, etc.)
- **Enhanced CLI** — `bin/hivemind-tools.cjs` expanded to 23 commands (source-audit, list-tools, list-hooks, verify-package, etc.)
- 36 new test assertions for cycle intelligence
- Entry chain E2E tests (56 assertions)

## [2.1.0] - 2026-02-11

### Added
- **Hierarchy tree engine** — Navigable tree with timestamp-based stamps, DFS traversal, cursor tracking
- **Detection engine** — Tool classification (read/write/query/governance), counter logic, keyword scanning, signal compilation
- **Per-session files** — Each session archived with `.json` export + `.md` export
- **Session manifest** — `manifest.json` registry of all sessions
- **Configurable thresholds** — `detection_thresholds` in config for turn count, failures, section repetition
- **Migration path** — `hierarchy_migrate` tool converts flat hierarchy to tree format
- **hierarchy_prune tool** — Removes completed branches, moves cursor to root
- **Compact purification** — `compact_session` generates next-compaction report for context preservation
- 2 new tools: `hierarchy_prune`, `hierarchy_migrate` (13 total)
- 158 new test assertions (hierarchy tree 55, detection 45, compact purification 34, entry chain 24)

### Changed
- Session lifecycle hook now compiles detection signals into `<hivemind>` prompt injection
- Soft governance hook now runs full detection engine (tool classification, keyword scanning, failure tracking)
- Tree-aware chain analysis — detects timestamp gaps between nodes
- `max_active_md_lines` wired into detection thresholds

## [2.0.0] - 2026-02-11

### Breaking Changes
- System prompt injection restructured — uses `<hivemind>` tag instead of `<hivemind-governance>` and `<agent-configuration>`
- Commit suggestion removed from system prompt (was user concern, not agent concern)
- Mems count removed from system prompt (not actionable)

### Added
- **Priority-sectioned system prompt** — drops lowest priority sections when budget exceeded instead of malformed truncation
- **Anchor age indicators** — anchors in system prompt show `(Xh ago)` / `(Xd ago)`
- **Input validation** — all string args validated for non-empty content
- **Helper footers** — every tool output suggests the logical next action
- **Upsert for anchors** — updating an existing key shows the delta (was/now)
- **Memory deduplication** — save_mem rejects duplicate content on same shelf
- **Session awareness** — save_anchor/save_mem warn when no active session
- **Overwrite warning** — declare_intent warns when replacing an existing trajectory
- **Output budget** — think_back capped at 2000 chars, anchors at 5, plan at 10 lines

### Fixed
- **System prompt malformed XML** — truncation was closing `</agent-configuration>` inside `<hivemind-governance>` producing invalid XML
- **Hook inconsistency** — write tool lists now identical between before/after hooks (exact Set.has matching)
- **Fuzzy tool matching** — replaced dangerous `startsWith`/`includes` with exact `Set.has()`
- **Double save** — soft-governance hook consolidated to single disk write
- **Array mutation** — list-shelves sort no longer mutates shared state
- **scan_hierarchy JSON** — now returns structured text like all other tools
- **self_rate threshold** — score 6-7 now shows positive feedback instead of drift warning

### Changed
- System prompt budget increased from 1000 to 2500 chars
- Package.json: removed src/ from files, added exports field, tightened peerDependencies
- Error messages standardized with `ERROR:` prefix and guidance
- scan_hierarchy description differentiated from think_back
- save_anchor description removes "API keys" (security risk)
- README rewritten to document all 11 tools and 4 hooks

## [1.6.0] - 2026-02-11

### Fixed
- **SHOWSTOPPER**: Tool registration changed from array to named Record — tools were being registered as "0", "1", "2" instead of "declare_intent", "map_context", etc. Agents could not call any tool by name.
- **CRITICAL**: `hivemind init` crash on npm install — `docs/` directory now included in `package.json#files`
- **CRITICAL**: System transform hook now accepts `model` parameter matching SDK contract
- **CRITICAL**: Legacy `.opencode` path in self-rate tool changed to `.hivemind/logs`
- **HIGH**: Double-counting turn increments — `incrementTurnCount` removed from `tool.execute.before` hook (kept only in `tool.execute.after`)
- **MEDIUM**: All 11 tools now accept `ToolContext` parameter matching SDK `execute(args, context)` signature

### Changed
- Removed unused `zod` dependency from `package.json#dependencies` (SDK re-exports via `tool.schema.*`)
- Stale `.opencode/planning/` doc comment in `src/cli/init.ts` updated to `.hivemind/`

## [1.5.0] - 2026-02-11

### Added
- **Mems Brain** — Persistent, shelf-organized memory system for cross-session knowledge
- 3 new tools: `save_mem`, `list_shelves`, `recall_mems`
- Auto-mem on compaction: saves session summary to "sessions" shelf
- System prompt injection: mem count indicator
- Compaction context: injects recent mems for context preservation
- 40 new test assertions (Round 4)

## [1.4.0] - 2026-02-11

### Changed
- **BREAKING**: Migrated from `.opencode/planning/` to `.hivemind/` directory structure
- Plugin now creates `.hivemind/sessions/` for session state
- Added `.hivemind/10-commandments.md` (tool design reference)
- `.hivemind/plans/` for plan storage (not `.plan/plans/`)

### Added
- 10 Commandments document for tool design principles
- `.hivemind/` directory structure with sessions, brain, plans, logs subdirectories
- Git hooks setup script (scripts/setup-git-hooks.sh)
- Pre-commit hook for enforcing atomic commits and session awareness

### Fixed
- Path references throughout codebase, tests, documentation

### Migration Guide
Existing projects using `.opencode/planning/` can manually move files:
1. Create `.hivemind/` directory structure
2. Move `.opencode/planning/` contents to `.hivemind/`
3. Update `opencode.json` plugin registration if needed

## [1.3.0] - 2026-02-11

### Added
- **One-command install** — `npx hivemind-context-governance` sets up everything in one step
- **Auto-registration** — Plugin automatically registers itself in `opencode.json` during init (creates file if needed)
- Dual bin entries: both `npx hivemind-context-governance` and `npx hivemind` work
- `#!/usr/bin/env node` shebang for cross-platform npx compatibility
- `example-opencode.json` for SDK publishing checklist

### Changed
- CLI default command changed from `help` to `init` — bare `npx` invocation runs setup
- Dashboard import changed to lazy `await import()` — prevents crash when dashboard deps unavailable
- Moved sentiment detection from `experimental.chat.system.transform` to `chat.message` hook (SDK compatibility)
- Removed explicit hook type annotations — let TypeScript infer from SDK
- Removed manual "add to opencode.json" instructions — it's automatic now
- peerDependencies `@opencode-ai/plugin` changed from `^0.x` to `*` (any version)

### Fixed
- Config key corrected from `"plugins"` (plural) to `"plugin"` (singular) per OpenCode spec
- Removed dead peer deps (`@opentui/react`, `@opentui/core`, `react`)
- Added `@opencode-ai/plugin` to devDependencies (was only in peerDependencies)

## [1.2.1] - 2026-02-11

### Fixed
- **Plugin install broken** — `dist/` was gitignored so clones had no `main` entry. Fixed by including `src/` in npm package and documenting `file://` path for TypeScript-direct loading.
- **@opencode-ai/plugin SDK compatibility** — Updated hook signatures for latest SDK: `experimental.chat.system.transform` now accepts `{ sessionID?: string; model: Model }`, removed deprecated `message` field.
- **Sentiment detection moved** — From `experimental.chat.system.transform` (which lost `message` param) to new `chat.message` hook, where user message content is actually available.
- **Dead peer dependencies** — Removed `@opentui/react`, `@opentui/core`, `react` from peer deps (never used).

### Changed
- **Config key** — README and init output now correctly show `"plugin"` (singular) instead of `"plugins"` (plural) per OpenCode spec.
- **Installation docs** — Rewrote README Quick Start with `file://` path (works now) and npm path (after publish).
- Added `example-opencode.json` for copy-paste setup.
- Added `clean` and `prepublishOnly` scripts.
- Version bump to 1.2.1.

## [1.2.0] - 2026-02-11

### Fixed
- **initProject() guard** — Now checks `brain.json` existence instead of just directory, preventing false "already initialized" when logger creates directory as side-effect (fixed 7 test failures)
- **self_rate score threshold** — Score 7 now correctly shows drift hint (💡) instead of positive feedback (✅) (fixed 1 test failure)
- **Sentiment false positives** — Negative keyword detection now uses word-boundary regex with negative-lookahead for benign phrases ("no issues", "error handling", etc.)

### Changed
- **Removed process.cwd() backward-compat exports** — All 4 tool files no longer export landmine constants that captured directory at import-time instead of runtime
- **Package metadata** — Repository URLs now point to `shynlee04/hivemind-plugin`, `@opencode-ai/plugin` moved from dependency to peerDependency (required, not optional)
- **Tool barrel exports** — Updated to export only factory functions (`createXxxTool`)

## [1.1.0] - 2026-02-10

### Added
- **self_rate tool** - Agents can now rate their own performance (1-10 scale) with optional context
- **Auto-rating system** - Automatic health score tracking based on tool success rates
- **Sentiment detection** - Detects negative signals ("stop", "wrong", "confused") and agent failure phrases
- **Context refresh trigger** - Automatically suggests compaction when drift is detected (2 negative signals within 5 turns)
- **Complexity detection** - Tracks files touched and turn count since last intent declaration
- **Complexity nudges** - Gentle console reminders when complexity thresholds are exceeded
- **GitHub Actions CI** - Automated testing on Node 18 and 20

### Changed
- Updated package.json with proper npm publishing configuration
- Added LICENSE file (MIT)
- Added this CHANGELOG.md

## [1.0.0] - 2026-02-08

### Added
- **3 lifecycle tools**: declare_intent, map_context, compact_session
- **3 governance hooks**: tool.execute.before, chat.system.transform, session.compacting
- **3 governance modes**: strict, assisted, permissive
- **3-level hierarchy**: Trajectory → Tactic → Action
- **State management**: brain.json, active.md, index.md
- **Session archiving**: Automatic compaction and history tracking
- **Configuration system**: HiveMindConfig with agent behavior settings
- **TUI-safe logging**: File-based logging, no console.log
- **Test suite**: 76 assertions across schema, init, and tool-gate tests

### Features
- Soft governance with configurable enforcement levels
- Agent behavior configuration (language, expert level, output style)
- Drift detection and warnings
- Session lifecycle management
- Planning directory structure (.opencode/planning/)

[2.3.0]: https://github.com/shynlee04/hivemind-plugin/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/shynlee04/hivemind-plugin/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/shynlee04/hivemind-plugin/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.6.0...v2.0.0
[1.6.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/shynlee04/hivemind-plugin/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/shynlee04/hivemind-plugin/releases/tag/v1.0.0
