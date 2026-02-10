# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
