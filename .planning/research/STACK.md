# Technology Stack: GSD Architecture Analysis

**Project:** GSD (Get Shit Done) — Reference Architecture
**Researched:** 2026-04-25

## GSD's Technology Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Markdown + YAML Frontmatter | N/A | All state, workflows, agents, commands | Human-readable, version-controllable, runtime-agnostic |
| Node.js CLI (`gsd-tools.cjs`) | CJS | Deterministic state/config operations | Avoids AI-hallucinated bash patterns; validated code |
| Node.js CLI (`gsd-sdk query`) | TypeScript/JS | Modern query interface replacing gsd-tools | JSON output, typed, pipelined |
| Shell Hooks | .js/.sh | Event hooks for AI runtimes | Lifecycle injection (context monitor, commit validation) |

### SDK Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript SDK (`@gsd-build/sdk`) | TS strict | Headless autonomous execution | Programmatic phase running, session management |
| PhaseRunner class | TS | Phase lifecycle state machine | discuss → research → plan → check → execute → verify → advance |
| Context Engine | TS | Context loading/truncation | Prevents context overflow for 200k windows |
| Query Registry | TS | Deterministic state queries | 80+ query handlers for state, config, frontmatter, verification |

### Agent System
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Agent .md files (33 total) | YAML frontmatter + Markdown body | Specialist agent definitions | Runtime-portable, tool-scoped, model-profiled |
| Model Profiles | quality/balanced/budget/inherit | Cost/quality tradeoff per agent | Opus for planning, Sonnet for execution, Haiku for research |
| Tool Scoping | per-agent `tools:` frontmatter | Least-privilege access | Executors get Edit, checkers get Read-only |

### Installation/Distribution
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| npm package (`get-shit-done-cc`) | npm | Distribution | `npx get-shit-done-cc@latest` install flow |
| `bin/install.js` | CJS | Runtime transformation engine | Detects runtime, transforms files, deploys to correct dirs |
| Runtime converters | JS | Adapt to 14+ AI runtimes | Claude, OpenCode, Gemini, Codex, Copilot, Kilo, etc. |

## Key Architecture Decisions (What Hivemind Should Learn)

### 1. Thin Orchestrator Pattern
**GSD approach:** Workflow files are 100-400 line Markdown documents that orchestrate by:
1. Loading context via `gsd-sdk query init.<workflow>`
2. Spawning specialist agents via `Task(subagent_type="gsd-xxx")`
3. Collecting results (agents write to disk)
4. Updating state via `gsd-sdk query state.*`

**Hivemind implication:** Hivemind's plugin.ts should follow the same pattern — lean composition root, heavy delegation.

### 2. Deterministic CLI Layer
**GSD approach:** All mechanical operations (state update, config, frontmatter parsing, commit formatting) go through `gsd-tools.cjs` or `gsd-sdk query`. Agents never do these operations themselves — they call the CLI.

**Hivemind implication:** Hivemind's tools should similarly wrap deterministic operations. The `tool-response.ts` envelope is a step in this direction.

### 3. File-Based State
**GSD approach:** All state in `.planning/` directory:
- `STATE.md` — YAML frontmatter for current position, decisions, blockers
- `config.json` — Three-tier cascade (hardcoded → user defaults → project)
- `ROADMAP.md` — Phase tracking with progress
- Phase directories — `N-CONTEXT.md`, `N-RESEARCH.md`, `N-M-PLAN.md`, `N-M-SUMMARY.md`, `N-VERIFICATION.md`

**Hivemind implication:** Hivemind's `continuity.ts` already implements this pattern (durable JSON + in-memory Maps). GSD's approach is simpler (files only, no in-memory layer).

### 4. Fresh Context Per Agent
**GSD approach:** Every spawned agent gets a clean 200K+ token context window. The orchestrator passes file paths, not content. Agents read files themselves.

**Hivemind implication:** This is the core pattern Hivemind must preserve. The WaiterModel delegation system must ensure each delegated task gets an isolated context.

### 5. Multi-Runtime Transformation
**GSD approach:** Single source of truth in `commands/gsd/*.md` and `agents/*.md`. The installer transforms:
- Claude Code: Direct copy with nested structure
- OpenCode: Flat structure, frontmatter adaptation
- Codex: Skill adapters, TOML configs, sandbox modes
- Copilot: Tool name mapping, instruction injection
- Others: Similar adaptations

**Hivemind implication:** Hivemind is OpenCode-only. No need for transformation engine.

## Where Hivemind Must DIFFER

| GSD Assumption | Why It Doesn't Apply to Hivemind | What Hivemind Should Do Instead |
|----------------|----------------------------------|-------------------------------|
| Task() blocks until completion | Hivemind uses WaiterModel with dual-signal completion | Build async delegation with completion detection |
| All state in Markdown files | Hivemind needs in-memory state for real-time operations | Dual-layer: durable JSON + in-memory Maps |
| Workflows are static .md files | Hivemind's workflows are TypeScript modules | Runtime composition via plugin.ts |
| 14 runtime targets | Hivemind is OpenCode-only | Skip transformation layer entirely |
| gsd-tools.cjs for mechanical ops | Hivemind has native TypeScript tools | Direct function calls, not CLI invocations |
| No concurrency control | Hivemind needs keyed semaphore for parallel delegations | Build concurrency.ts with FIFO queue |
| No lifecycle state machine | Hivemind needs session lifecycle management | Build lifecycle-manager.ts with phases |

## Sources

- DeepWiki: gsd-build/get-shit-done (all pages)
- Repomix packed repo: 620 files, ~1.2M tokens
- Source grep: PhaseRunner class, gsd-sdk query patterns, thin orchestrator references
