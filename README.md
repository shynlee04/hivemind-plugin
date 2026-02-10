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

## Installation

One command. That's it.

```bash
npx hivemind-context-governance
```

This does everything:
1. Creates `.hivemind/` with session state files
2. Registers HiveMind in your `opencode.json` automatically
3. Next time you open OpenCode, HiveMind is active

> **No cloning. No manual JSON editing. No `npm install`.** OpenCode auto-installs npm plugins at runtime.

### Options

```bash
npx hivemind-context-governance --mode strict --lang en
```

| Option | Values | Default |
|--------|--------|---------|
| `--mode` | `strict`, `assisted`, `permissive` | `assisted` |
| `--lang` | `en`, `vi` | `en` |

### Other CLI Commands

```bash
npx hivemind-context-governance status     # Show current state
npx hivemind-context-governance compact    # Manual compaction info
npx hivemind-context-governance help       # Show help
```

## Using the Tools

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

## Project Structure

After initialization:

```
.hivemind/
├── 10-commandments.md   # Tool design reference
├── sessions/
│   ├── index.md         # Project trajectory
│   ├── active.md        # Current session
│   └── archive/          # Session history
│       └── session_2026-02-10_xxx.md
├── brain.json          # Machine state
├── config.json         # Settings
├── plans/              # Plan storage
└── logs/               # Plugin logs
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
│  ├─ chat.message (sentiment detection)  │
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
| Init + Planning FS | 30 | ✅ Pass |
| Tool Gate (governance) | 12 | ✅ Pass |
| Self-Rate Tool | 28 | ✅ Pass |
| Integration Tests | 27 | ✅ Pass |
| **Total** | **132** | ✅ **All Pass** |

## Requirements

- Node.js 18+
- OpenCode with plugin support

## Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Lightweight** | 4 tools, 3 hooks — minimal surface area |
| **User-driven** | No agent hierarchy — you control the workflow |
| **Soft enforcement** | Warns and logs, never hard-blocks |
| **Session brain** | Every session is archived and traceable |
| **Drift-aware** | Automatic detection via sentiment + complexity |
| **Self-assessment** | Built-in 1-10 scale rating for agent self-awareness |

## Documentation

- [AGENTS.md](./AGENTS.md) — Complete guide for agents using the tools
- [CHANGELOG.md](./CHANGELOG.md) — Release history

## License

MIT
