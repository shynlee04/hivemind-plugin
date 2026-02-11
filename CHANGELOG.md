# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.2.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/shynlee04/hivemind-plugin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/shynlee04/hivemind-plugin/releases/tag/v1.0.0
