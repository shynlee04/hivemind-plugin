# Feature Landscape: GSD Architecture Features

**Domain:** AI-assisted development workflow framework
**Researched:** 2026-04-25

## Table Stakes

Features users expect from a development workflow system. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Phase-based workflow (discuss→plan→execute→verify) | Standard SDLC adapted for AI | High | GSD's core innovation — strict lifecycle with gates |
| Fresh context per agent | Context rot degrades AI output | Medium | Each agent gets clean 200K+ window |
| File-based state persistence | Sessions break; state must survive | Medium | `.planning/` directory with structured Markdown |
| Atomic git commits | Traceability and rollback | Low | One commit per task with standardized messages |
| Plan verification before execution | Bad plans waste time | High | 9-dimension plan checker (max 3 revision loops) |
| Goal-backward verification | Task completion ≠ goal achievement | High | Verifier starts from goal, works backward |
| Session recovery | Context resets happen | Medium | STATE.md + HANDOFF.json + /gsd-resume-work |
| Progress tracking | Users need to know where they are | Low | Statusline hook + STATE.md progress bar |
| Multi-agent specialization | One AI can't do everything well | Medium | 33 specialist agents with scoped tools |
| Configuration system | Different projects need different workflows | Medium | Three-tier cascade: hardcoded → user → project |

## Differentiators

Features that set GSD apart from simpler approaches.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Thin orchestrator pattern | Prevents context rot at the orchestration layer | Medium | Orchestrators are 100-400 line .md files |
| Wave-based parallel execution | Independent plans run simultaneously | High | Dependency analysis → wave grouping → parallel spawn |
| 9-dimension plan verification | Catches bad plans before execution wastes time | High | Requirement coverage, task atomicity, Nyquist compliance, etc. |
| Multi-runtime support (14+) | One system, all AI runtimes | Very High | Transformation engine in bin/install.js |
| Nyquist validation | Test coverage mapping before code is written | Medium | Maps requirements to test cases during research |
| Decimal phase insertion | Urgent work between planned phases | Low | `/gsd-insert-phase` creates 2.1, 2.2, etc. |
| Spec locking (SPEC.md) | Requirements frozen before implementation | Medium | Falsifiable requirements, locked before discuss-phase |
| Backlog with seeds | Forward-looking ideas that surface automatically | Low | Seeds preserve WHY + WHEN, not just what |
| Workstreams | Parallel work on different milestone areas | Medium | Isolated .planning/ state per workstream |
| Headless SDK | Automated/CI project execution | High | TypeScript SDK for programmatic phase running |
| Context window monitoring | Prevents degradation proactively | Low | Statusline hook + gsd-context-monitor.js hook |
| Spike/Sketch workflows | Rapid validation before formal planning | Medium | First-class support for feasibility experiments |
| Learnings extraction | Cross-phase knowledge capture | Low | Extracts decisions, patterns, surprises from phases |
| Knowledge graph (graphify) | Cross-reference codebase capabilities | Medium | .planning/graphs/ with capability indexing |

## Anti-Features

Features to explicitly NOT build in Hivemind.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multi-runtime transformation | Hivemind is OpenCode-only | Skip transformation engine entirely |
| Static .md workflow files | Hivemind workflows are TypeScript | Use runtime composition via plugin.ts |
| gsd-tools.cjs as CLI layer | Hivemind has native TypeScript tools | Direct function calls in tools |
| Task() blocking delegation | WaiterModel is async with dual-signal | Build async completion detection |
| 33+ agent definitions | Hivemind has focused agent set | Keep agent count minimal, maximize tool reuse |
| Markdown state files (STATE.md) | Hivemind needs real-time state | JSON files + in-memory Maps (dual-layer) |
| Plan checker as separate agent | Hivemind verifies inline via hooks | Hook-based verification at tool call boundaries |
| Model profile system | Hivemind inherits OpenCode model config | Use OpenCode's native model selection |

## Feature Dependencies

```
Fresh Context Per Agent → Thin Orchestrator Pattern (orchestrators must not need context)
Thin Orchestrator → File-Based State (agents need shared state outside context)
File-Based State → Session Recovery (recovery reads persisted state)
Phase Lifecycle → Plan Verification (verify is a phase stage)
Plan Verification → Goal-Backward Approach (verification needs goal truth)
Wave-Based Execution → Dependency Analysis (waves derived from plan deps)
Atomic Commits → Wave-Based Execution (commits per task, not per wave)
```

## MVP Recommendation for Hivemind

Prioritize:
1. File-based state persistence (continuity.ts — already exists)
2. Async delegation with completion detection (delegation-manager.ts — WaiterModel)
3. Thin orchestrator plugin layer (plugin.ts — composition root)
4. Session recovery (HANDOFF.json equivalent)

Defer:
- Multi-runtime support: OpenCode-only is correct scope
- Plan verification system: GSD's 9-dimension approach is over-engineered for a harness
- Wave-based execution: Hivemind's concurrency.ts handles parallel delegation differently
- Headless SDK: Not needed for plugin-based system

## Sources

- DeepWiki: Core Concepts, Features, Agent Reference, Workflow Deep Dive
- Repomix grep: Feature requirements (REQ-EXEC-*, REQ-ORCH-*, REQ-CTX-*)
- docs/FEATURES.md: 120K chars of feature documentation
