# HiveMind — Cognitive Mesh for AI Agents

## What This Is

A brain that makes AI agents work faster, more efficiently, with bulletproof context drift protection. HiveMind is NOT a feature list — it is an ecosystem of 5 interconnected systems that chain intelligently, automatically, with truly effective tools. The mindset is platform-portable: today it materializes on OpenCode via their plugin SDK, tomorrow it could materialize on Claude Code or any other agentic platform.

## Core Value

We create a hivemind's brain that boosts intelligence and provides users' true expertise of AI agents — work faster, more efficiently, handle with full bulletproof of context drift.

## The Cognitive Mesh (5 Systems)

```
                    ┌─────────────────────┐
                    │   Auto-Hooks &      │       ┌─────────────────────┐
                    │   Governance        │       │  Session Management │
                    │   (Triggers & Rules)│       │  & Auto-Export      │
                    └────────┬────────────┘       │  (Lifecycle)        │
                             │                    └────────┬────────────┘
                             ▼                             ▼
                    ┌─────────────────────────────────────────┐
                    │        System Core (For Agents)         │
                    │   brain state, hierarchy, detection     │
                    └────────┬──────────────────┬─────────────┘
                             │                  │
                             ▼                  ▼
                    ┌─────────────────┐  ┌─────────────────────┐
                    │  Unique Agent   │  │   The 'Mems' Brain  │
                    │  Tools          │  │   (Shared Knowledge  │
                    │  (Hook-Activated│  │    Repository)       │
                    │   Utilities)    │  │                      │
                    └─────────────────┘  └─────────────────────┘
```

**These 5 systems are the product.** The SDK is the materialization layer.

## Requirements

### Validated

- ✓ System Core: 3-level hierarchy (trajectory/tactic/action) with navigable tree engine — existing
- ✓ System Core: Detection engine (9 signal types, 4-tier escalation) — existing
- ✓ System Core: Brain state (brain.json, hierarchy.json, config.json) — existing
- ✓ Auto-Hooks: 4 hooks (tool-gate, soft-governance, session-lifecycle, compaction) — existing
- ✓ Auto-Hooks: Evidence Gate with argue-back (11 counter-excuses) — existing
- ✓ Auto-Hooks: FileGuard (write-without-read tracking) — existing
- ✓ Session Management: Compact session with archive + purification — existing
- ✓ Session Management: Compaction relay chain (budget-capped context) — existing
- ✓ Unique Agent Tools: 14 tools (declare_intent through export_cycle) — existing
- ✓ Unique Agent Tools: CLI with 23+ commands — existing
- ✓ Unique Agent Tools: MiMiHrHrDDMMYYYY timestamp traceability — existing
- ✓ Mems Brain: Persistent cross-session memory (shelves, tags, recall) — existing
- ✓ Mems Brain: Cycle intelligence (export_cycle + auto-capture) — existing
- ✓ 5 behavioral governance skills — existing
- ✓ Ink TUI dashboard — existing
- ✓ 705 test assertions passing — existing

### Active

- [ ] SDK Integration: Wire `client`, `$` (BunShell), `serverUrl` into plugin (currently only `directory` + `worktree` used)
- [ ] SDK Integration: Event-driven hooks via `event` hook (32 event types) replacing/augmenting turn-counting
- [ ] Auto-Hooks: Bootstrap fires in ALL modes (not just strict) — ST12 fix
- [ ] Auto-Hooks: Evidence/team teaching from turn 0 unconditionally — ST12 fix
- [ ] Auto-Hooks: Permissive mode signal suppression — ST11 fix
- [ ] Auto-Hooks: Framework detection (GSD/Spec-kit) as governance context
- [ ] Session Management: Use `client.session.*` for real session lifecycle (create, messages, summarize)
- [ ] Session Management: Auto-export via `session.messages()` instead of file-based hacks
- [ ] Session Management: `client.tui.showToast()` for visual governance feedback
- [ ] Unique Agent Tools: `client.file.*` + `client.find.*` for Fast Read/Extract
- [ ] Unique Agent Tools: BunShell `$` for repomix, rg, fd subprocess spawning
- [ ] Unique Agent Tools: Precision extraction (grep, glob, read) with JSON output
- [ ] Mems Brain: Orchestration state (Ralph loop pattern) persisted in mems
- [ ] Mems Brain: Just-in-time memory recall using `client.find.text()` for semantic search
- [ ] Self-Validation: IGNORED tier, dynamic argue-back, hivemind self-check CLI
- [ ] Stress Test: Automated suite covering all 13 conditions, 10+ compactions, framework detection

### Out of Scope

- Running GSD/Spec-kit commands — HiveMind governs, doesn't orchestrate
- Blocking/denying tool execution — NEVER block, NEVER deny, NEVER clash with other plugins
- Custom LLM model support — model-agnostic by design
- GUI/web dashboard — CLI + Ink TUI + showToast is sufficient for v3
- permission.ask hook — violates core philosophy (will clash with other plugins)

## Context

**The Cognitive Mesh Philosophy:**
- 5 systems are NOT independent features — they are interconnected and chain automatically
- System Core is the hub; all other systems read from and write to it
- Auto-Hooks trigger based on System Core state → which updates Session Management → which feeds Mems Brain → which informs Unique Agent Tools → which update System Core (the loop)
- Removing any one system degrades ALL others — they are a mesh, not modules

**SDK as Materialization Layer:**
- Today: OpenCode plugin SDK (`@opencode-ai/plugin` v0.0.5, `@opencode-ai/sdk` v1.1.53)
- Core `src/lib/` NEVER imports SDK — concepts are platform-portable
- Only `src/hooks/` touches SDK (the boundary layer)
- `client.session.*` materializes Session Management
- `client.tui.showToast()` materializes governance feedback
- `client.file.*` + `client.find.*` materializes Fast Read/Extract
- `event` hook (32 types) materializes event-driven Auto-Hooks
- `$` (BunShell) materializes subprocess tools (repomix, rg, fd)

**Prior Work:**
- 6 completed iterations (v1.0 → v2.6.0)
- 12 archived design docs in `docs/archive/`
- Stress test baseline: 12 PASS, 1 CONDITIONAL PASS (ST11), 1 FAIL (ST12)

**Plugin Ecosystem Research:**
- 9 reference plugins downloaded as repomix XML in `.planning/research/plugin-refs/`
- 5 of 8 real-world plugins actively use SDK client (micode, oh-my-opencode, opencode-pty, plannotator, subtask2)
- Pattern: `ctx.client.session.prompt()` for context injection, `showToast()` for feedback
- ZERO plugins use `permission.ask` — confirms our philosophy

## Constraints

- **Platform**: OpenCode plugin SDK — hooks are async, cannot block execution (by design, we agree with this)
- **SDK Caveat**: Do NOT call `client.*` during plugin init (deadlock risk — oh-my-opencode issue #1301). Only use from hooks/tools.
- **Architecture**: `src/lib/` = platform-portable concepts. `src/hooks/` = SDK boundary. Never mix them.
- **Backward Compat**: brain.json, config.json, hierarchy.json schemas must migrate cleanly from v2.x
- **Test Coverage**: Never drop below 700 assertions — every change must maintain or increase
- **Zero Agent Cooperation**: System works even when agents completely ignore governance

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NEVER block/deny tools | Will clash with other plugins, violates soft governance philosophy | ✓ Core principle |
| 5-system cognitive mesh | NOT a feature list — interconnected systems that chain automatically | ✓ Architecture |
| SDK = materialization, not foundation | Core concepts must be portable to any platform | ✓ Architecture |
| `src/lib/` never imports SDK | Maintains platform portability of all concepts | — Pending enforcement |
| Event-driven over turn-counting | SDK provides 32 real events; turn-counting is a hack | — Pending implementation |
| showToast for governance feedback | Visual feedback without blocking — aligned with soft governance | — Pending implementation |
| session.messages() for auto-export | Real session data instead of file-based reconstruction | — Pending implementation |

---
*Last updated: 2026-02-12 after cognitive mesh philosophy alignment*
