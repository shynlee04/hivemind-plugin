# Feature Landscape: HiveMind Cognitive Mesh

**Domain:** AI Agent Context Governance
**Researched:** 2026-02-12

## Feature Philosophy

> Features are NOT isolated capabilities. Every feature must touch at least 2 of the 5 systems.
> A tool without governance awareness is just a command. A hook without mems persistence is just a log.

## Table Stakes (Systems That Must Work)

Features the cognitive mesh requires. Missing = the mesh breaks.

| Feature | System(s) | Why Required | Complexity |
|---------|-----------|-------------|------------|
| Hierarchy tree (CRUD, stamps, queries) | Core + Auto-Hooks | Without the tree, nothing knows what agent is doing | Built ✅ |
| Detection engine (9 signals, 4 tiers) | Auto-Hooks + Core | Without detection, no governance signals | Built ✅ |
| Brain state persistence | Core | Without brain.json, every session starts blank | Built ✅ |
| System prompt injection | Auto-Hooks + Sessions | The delivery channel for all governance | Built ✅ |
| Tool activation & tracking | Auto-Hooks + Agent Tools | Without tracking, drift is invisible | Built ✅ |
| Mems brain (save/recall/shelves) | Mems Brain | Without mems, nothing persists across sessions | Built ✅ |
| Session lifecycle (declare/map/compact) | Sessions + Core | Without lifecycle, sessions have no structure | Built ✅ |
| Evidence gate (escalation + argue-back) | Auto-Hooks + Core | Without evidence pressure, agents ignore governance | Built ✅ |
| Per-session files & manifest | Sessions | Without per-session files, sessions clash | Built ✅ |
| Bootstrap teaching (ALL governance modes) | Auto-Hooks + Sessions | **BROKEN** — bootstrap only fires in strict mode | **ST12 FAIL** |
| Signal coherence (mode-consistent) | Auto-Hooks | **BROKEN** — permissive mode gets WARN/CRITICAL signals | **ST11 CONDITIONAL** |

## Differentiators (Mesh Intelligence Multipliers)

Features that make HiveMind MORE than the sum of its parts. Each connects multiple systems.

| Feature | System(s) | Value Proposition | Complexity |
|---------|-----------|-------------------|------------|
| **SDK-powered session awareness** | Sessions + Core | `client.session.*` — sessions become real objects, not just files. Fork sessions, read messages, summarize. | Med |
| **Visual governance via TUI** | Auto-Hooks + Sessions | `client.tui.showToast()` — immediate feedback, not waiting for next prompt turn. Agent sees toast AND prompt warning. | Low |
| **Event-driven triggers** | Auto-Hooks + Core | `event` hook with 32 events replaces turn-counting. `session.idle` = real stale detection. `file.edited` = real activity. | Med |
| **Fast codebase extraction** | Agent Tools + Core | `client.find.text/files/symbols` + `$\`repomix\`` — agent can see the whole codebase, focused sections, or precise symbols. | Med |
| **Framework detection (GSD/Spec-kit)** | Core + Auto-Hooks | Detect `.planning/ROADMAP.md` or `.spec-kit/` → adapt governance, align with framework lifecycle. | Med |
| **Orchestration loop control** | Sessions + Mems + Core | Ralph-style prd.json → story selection → completion tracking → loop state persistence across compactions. | High |
| **Context-aware argument-back** | Auto-Hooks + Mems | Dynamic argue-back using actual session context (not static strings). "You've ignored 3 warnings about X." | Med |
| **Silent context injection** | Sessions | `session.prompt({ noReply: true })` — inject governance context without triggering AI response. (plannotator pattern) | Low |
| **Shell environment governance** | Auto-Hooks + Core | `shell.env` hook → inject `HIVEMIND_MODE`, `HIVEMIND_SESSION_ID` into all shell commands. Scripts become governance-aware. | Low |
| **Cross-session memory recall** | Mems Brain + Agent Tools | Just-in-time recall: when agent enters familiar territory, mems surface relevant prior knowledge automatically. | High |
| **Session export & archive** | Sessions + Mems | Auto-export entire session to structured archive + index. Full traceability: every decision maps to a timestamp, session, plan. | Med |
| **Repomix-powered codebase packing** | Agent Tools | Wrap `npx repomix --compress` via BunShell. Agent gets whole-codebase XML with token counting. | Low |

## Anti-Features (Things to NEVER Build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Permission blocking** (`permission.ask → deny`) | Clashes with other plugins. Defeats soft governance. Users hate it. | Escalating warnings + TUI toasts + argue-back |
| **Tool execution stopping** | Same as blocking — collision with other plugins, user frustration | Track, warn, escalate. Never stop. |
| **Hard-coded governance rules** | Becomes rigid, doesn't adapt to user's project/style | Configurable thresholds, 5 automation levels, mode-adaptive |
| **SDK-dependent core logic** | Breaks platform portability. Can't run on Claude Code. | Core in pure lib/. SDK only in hooks/materialization layer |
| **AI-dependent failsafes** | If AI ignores guidance, failsafe fails too | Non-AI mechanisms: filesystem, timestamps, git hashes, detection engine |
| **Single-system features** | Misses the mesh multiplier. Isolated features don't chain. | Every feature touches 2+ systems. Tools save to mems. Hooks update hierarchy. |

## Feature Dependencies

```
Bootstrap fix (ST12) → ALL other features (nothing works if agents aren't taught)
SDK client wiring → TUI toasts, session awareness, fast extraction, events
Event-driven triggers → replaces turn-counting in detection engine
Framework detection → orchestration loop (GSD alignment)
Fast extraction → orchestration (loops need to read codebase)
Mems persistence → cross-session recall, orchestration loop state
```

## MVP Recommendation (Phase 1-2)

Prioritize:
1. **Fix bootstrap + signal coherence** (ST11/ST12) — the mesh is broken without this
2. **Wire SDK client** (`client`, `$`, `serverUrl`) — unlocks all materialization
3. **TUI toasts** — immediate visual governance, lowest effort highest impact
4. **Event subscription** — replace turn-counting with real events

Defer:
- Orchestration loop control — needs framework detection first
- Repomix wrapping — useful but not foundational
- Cross-session auto-recall — complex, needs solid mems first

## Sources

- idumb-v2 diagram (5-system mesh architecture)
- Stress test investigation (6 parallel agents, 13 conditions)
- 8 plugin repos analyzed for SDK patterns
- OpenCode SDK v1.1.53 verified capabilities

---
*Last updated: 2026-02-12 after cognitive mesh reframing*
