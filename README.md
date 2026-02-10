# HiveMind Context Governance

A lightweight context-aware governance layer for OpenCode that prevents drift and manages session state across lifecycles.

## What is HiveMind?

HiveMind provides **soft governance** for AI-assisted development — it tracks context, warns about drift, and maintains session state without hard-blocking your workflow.

### Key Features

- **3-Level Hierarchy**: Trajectory → Tactic → Action
- **3 Governance Modes**: Strict, Assisted, Permissive
- **4 Lifecycle Tools**: declare_intent, map_context, compact_session, self_rate
- **Session Archiving**: Automatic compaction and history tracking
- **Drift Detection**: Warnings when context goes stale
- **Sentiment Detection**: Automatic detection of negative signals and confusion
- **Complexity Nudges**: Gentle warnings when sessions get complex (3+ files or 5+ turns)
- **Self-Rating**: Agent self-assessment for drift tracking (1-10 scale)

## Quick Start

### 1. Install

```bash
# Option A: Clone into your project
git clone https://github.com/shynlee04/hivemind-plugin.git .hivemind
cd .hivemind && npm install

# Option B: Install as npm dependency
npm install hivemind-context-governance
```

### 2. Initialize

```bash
# Initialize HiveMind in your project
npx hivemind init

# Or with options
npx hivemind init --mode strict --lang en
```

This creates `.opencode/planning/` with:
- `index.md` — Project trajectory and history
- `active.md` — Current session state
- `brain.json` — Machine-readable state
- `config.json` — Governance settings

### 3. Register Plugin

Add to your `opencode.json`:

```json
{
  "plugins": ["<path-to-hivemind-plugin>"]
}
```

> Replace `<path-to-hivemind-plugin>` with the actual path — e.g. `.hivemind`, `./node_modules/hivemind-context-governance`, or any relative path from your project root.

### 4. Use the Tools

Within OpenCode, use the 4 lifecycle tools:

```typescript
// Start a session
declare_intent({
  mode: "plan_driven",
  focus: "Implement user authentication"
})

// Update context
map_context({
  level: "tactic",
  content: "Set up JWT middleware",
  status: "active"
})

// Rate your performance (self-assessment)
self_rate({
  score: 8,
  reason: "Making good progress on auth flow",
  turn_context: "Currently testing JWT validation"
})

// Archive and reset
compact_session({
  summary: "Auth system foundation complete"
})
```

## Governance Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **strict** | Session starts LOCKED. Must call `declare_intent` before writes. | High-compliance projects |
| **assisted** | Session starts OPEN. Warnings logged but not blocking. | Balanced guidance |
| **permissive** | Session always OPEN. Silent tracking only. | Maximum autonomy |

## CLI Commands

```bash
hivemind init [options]     # Initialize project
hivemind status             # Show current state
hivemind compact            # Manual compaction info
hivemind dashboard          # Launch dashboard (coming soon)
hivemind help               # Show help

Options:
  --mode <strict|assisted|permissive>  Governance mode
  --lang <en|vi>                       Language
```

## Project Structure

```
.opencode/planning/
├── index.md          # Project trajectory
├── active.md         # Current session
├── brain.json        # Machine state
├── config.json       # Settings
└── archive/          # Session history
    └── session_2026-02-10_xxx.md
```

## Sentiment Detection

HiveMind automatically detects negative signals in user messages and agent responses:

**Detected Patterns:**
- **Negative keywords**: stop, wrong, no, bad, incorrect, confused, mistake, error
- **Agent failure phrases**: "I apologize", "you are right", "I was wrong", "my mistake"
- **Cancellation patterns**: cancel, abort, start over, scratch that, never mind
- **Confusion indicators**: "I'm confused", "doesn't make sense", "unclear"

**Trigger Threshold:**
- 2 negative signals within 5 turns triggers a drift warning
- Warning logged to TUI: `[ContextRefresh] Drift detected. Consider compact_session.`
- Warning added to `active.md` for visibility

## Complexity Nudges

When sessions get complex, HiveMind provides gentle nudges:

**Thresholds (configurable):**
- 3+ unique files touched, OR
- 5+ turns since last `declare_intent`

**Behavior:**
- One nudge per session (deduplicated)
- Resets when new intent is declared
- Logs: `[Nudge] Complexity rising (X files, Y turns). Consider declare_intent.`

## Architecture

```
┌─────────────────────────────────────────┐
│           OpenCode Agent                │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      HiveMind Plugin (3 hooks)          │
│  ├─ tool.execute.before (governance)    │
│  ├─ experimental.chat.system.transform  │
│  └─ experimental.session.compacting     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      4 Lifecycle Tools                  │
│  ├─ declare_intent                      │
│  ├─ map_context                         │
│  ├─ compact_session                     │
│  └─ self_rate                           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      State Management                   │
│  ├─ brain.json (runtime state)          │
│  ├─ active.md (session focus)           │
│  └─ index.md (project trajectory)       │
└─────────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build

# Watch mode
npm run dev
```

## Test Coverage

| Component | Assertions | Status |
|-----------|-----------|--------|
| Schema (BrainState, Hierarchy) | 35 | ✅ Pass |
| Init + Planning FS | 29 | ✅ Pass |
| Tool Gate (governance) | 12 | ✅ Pass |
| Self-Rate Tool | 28 | ✅ Pass |
| Integration Tests | 27 | ✅ Pass |
| **Total** | **131** | ✅ **All Pass** |

## Requirements

- Node.js 18+
- OpenCode with plugin support
- `@opencode-ai/plugin` (peer dependency — provided by OpenCode)

## Peer Dependencies

This plugin requires `@opencode-ai/plugin` as a peer dependency. It is provided by your OpenCode installation and does not need to be installed separately.

### TypeScript Compilation

If you encounter type errors related to `@opencode-ai/plugin`:

```bash
# Check if the SDK is available
npm ls @opencode-ai/plugin

# If missing, the plugin will still work at runtime
# Type checking is only needed during development
```

**Note**: The `@opencode-ai/plugin` package is a peer dependency that is provided by the OpenCode runtime environment. During development, you may see TypeScript warnings about missing types, but the plugin will function correctly when loaded by OpenCode.

To suppress type warnings during development:

```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

## Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Lightweight** | 4 tools, 3 hooks — minimal surface area |
| **User-driven** | No agent hierarchy — you control the workflow |
| **Soft enforcement** | Warns and logs, never hard-blocks |
| **Session brain** | Every session is archived and traceable |
| **Drift-aware** | Automatic detection via sentiment + complexity |
| **Self-assessment** | Built-in 1-10 scale rating for agent self-awareness |

## What's New in v1.2.0

### Bug Fixes (8 total)
- **Init guard** — No longer fails when logger creates directory before init
- **Self-rate threshold** — Score 7 correctly shows drift hint
- **Sentiment false positives** — Word-boundary regex prevents "no problems found" triggering "no"
- **Removed process.cwd() exports** — Tools no longer capture import-time directory
- **Package metadata** — Correct repository URLs and peer dependencies

## What's New in v1.1.0

### Self-Rate Tool
Agents can now self-assess their performance using the `self_rate` tool:
- Score from 1-10 (10 = excellent)
- Optional reason and context fields
- Automatic feedback based on score (warnings for low scores)
- Ratings stored in brain state for drift tracking

### Sentiment Detection
Automatic detection of negative signals in conversations:
- Negative keywords: "stop", "wrong", "bad", "incorrect", "confused"
- Agent failure phrases: "I apologize", "you are right", "I was wrong"
- Cancellation patterns: "cancel", "abort", "start over"
- Triggers context refresh recommendation after 2 signals in 5 turns

### Complexity Nudges
Gentle warnings when sessions get complex:
- Threshold: 3+ files touched OR 5+ turns since last `declare_intent`
- One nudge per session (resets on new intent declaration)
- Logs to TUI: `[Nudge] Complexity rising (X files, Y turns). Consider declare_intent.`

### Auto-Health Score
Automatic tracking of tool success rates:
- Calculated from successful vs total tool calls
- Displayed in TUI status line
- Helps agents self-assess without manual rating

## Documentation

- [AGENTS.md](./AGENTS.md) — Complete guide for agents using the tools
- [src/tools/](./src/tools/) — Tool implementations
- [src/hooks/](./src/hooks/) — Hook implementations
- [src/schemas/](./src/schemas/) — Type definitions

## License

MIT
