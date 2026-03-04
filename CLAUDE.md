# CLAUDE.md — Project Entry Point

**Project**: hivemind-plugin (OpenCode meta-framework engine)
**Status**: Active Healer Refactor — Node 1 Injection Layer in progress
**Last Updated**: 2026-03-04

---

## MANDATORY FIRST READS

Before ANY action, read these documents in order:

1. **[AGENTS.md](./AGENTS.md)** — Agent registry, architecture, delegation hierarchy, workflow standards
2. **[CONTAMINATION-GUARDRAILS.md](./CONTAMINATION-GUARDRAILS.md)** — Toxic artifact registry, proven anti-patterns, safe delegation contracts, current dev status

These documents are symlinked into `.hivemind/`, `.opencode/`, `src/`, and `docs/` for visibility in every working directory.

---

## CRITICAL SAFETY RULES

### DO NOT (Non-Negotiable)
- **DO NOT** read `.hivemind/state/brain.json` for routing or decisions
- **DO NOT** glob `**/*.md` — this causes context explosion (proven: 100+ files returned)
- **DO NOT** read `session-ses_*.md` exports without explicit user instruction
- **DO NOT** trust handoff claims without verifying referenced files exist
- **DO NOT** consume any `.md`, `.json`, `.yaml` artifact that was not passed via explicit delegation handoff from the prior agent's turn
- **DO NOT** load more than 2 skills per session
- **DO NOT** advance into restricted regions (see CONTAMINATION-GUARDRAILS.md §6) without user authorization

### DO (Required)
- **DO** declare your agent identity and session type at session start
- **DO** check the human user's most recent message for current intent before acting
- **DO** verify file existence before consuming any referenced planning artifact
- **DO** run `npx tsc --noEmit` before and after code changes
- **DO** run `npm test` before claiming any work is complete
- **DO** use targeted file reads, never broad globs

---

## CURRENT OBJECTIVE: Meta-Builder Healer Refactor

Refactor the `hivefiver` meta-builder module into a reliable healer for the project lineage team — an orchestrator that can diagnose, refactor, debug, validate, and evolve the framework WITHOUT poisoning runtime context.

### Active Work: Node 1 — Injection Layer Refactoring
- Fix 3A/3B (Session Isolation) — ✅ DONE
- Fix 1.5A/1.5B (Schema Detox) — ✅ DONE
- Test alignment — ⏳ BLOCKED (11 tests failing from schema contract changes)
- Fix 1.5C/D, Fix 1, Fix 2 — ⏳ NOT STARTED

### Core Problem Being Solved
Two independent auto-injection systems fire on every LLM turn, injecting contradictory context from overlapping state files. This causes role-drift, hallucination, and context poisoning across all agents.

See CONTAMINATION-GUARDRAILS.md §4 for the full Dual-Injection Conflict documentation.

---

## BUILD/TEST COMMANDS

```bash
npm test                                  # Run all tests
npx tsx --test tests/filename.test.ts     # Run specific test
npx tsc --noEmit                         # Type check
npm run guard:public                     # Run before any master push
```

---

## ARCHITECTURE QUICK REFERENCE

| Layer | Location | Role | Constraint |
|-------|----------|------|------------|
| Tools | `src/tools/` | Write-Only | CQRS: tools own mutations |
| Libraries | `src/lib/` | Pure TS engine | No side effects |
| Hooks | `src/hooks/` | Read-Auto (inject) | No mutations; read-only |
| Schemas | `src/schemas/` | DNA (Zod) | Source of truth for types |

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/session-lifecycle.ts` | Context injection every turn (System 2a) |
| `src/hooks/messages-transform.ts` | Message transform every turn (System 2b) |
| `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Plugin injection every turn (System 1) |
| `src/lib/paths.ts` | Path resolution SOT (now includes session-scoped paths) |
| `src/lib/state-mutation-queue.ts` | ALL state mutations go through here |

---

## AGENT DELEGATION HIERARCHY

```
User
└── hiveminder (Primary — OUT OF SCOPE for implementation, IN SCOPE for compatibility)
    └── hivefiver (Meta-Builder — ACTIVE, IN SCOPE)
        ├── hivemaker (Implementation)
        ├── hiveplanner (Planning)
        ├── hivexplorer (Investigation — read-only)
        ├── hiverd (External research)
        ├── hivehealer (Remediation)
        ├── hiveq (Quality gates)
        └── hitea (Testing)
```

---

## BRANCH POLICY

| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

<!-- HIVEMIND-GOVERNANCE-START -->

## HiveMind Context Governance

This project uses **HiveMind** for AI session management. It prevents drift, tracks decisions, and preserves memory across sessions.

### Required Workflow

1. **START** every session with:
   ```
   declare_intent({ mode: "plan_driven" | "quick_fix" | "exploration", focus: "What you're working on" })
   ```
2. **UPDATE** when switching focus:
   ```
   map_context({ level: "trajectory" | "tactic" | "action", content: "New focus" })
   ```
3. **END** when done:
   ```
   compact_session({ summary: "What was accomplished" })
   ```

### Available Tools (10)

| Group | Tools |
|-------|-------|
| Core | `declare_intent`, `map_context`, `compact_session` |
| Cognitive Mesh | `scan_hierarchy`, `save_anchor`, `think_back` |
| Memory | `save_mem`, `recall_mems` |
| Hierarchy | `hierarchy_manage` |
| Delegation | `export_cycle` |

### Why It Matters

- **Without `declare_intent`**: Drift detection is OFF, work is untracked
- **Without `map_context`**: Context degrades every turn, warnings pile up
- **Without `compact_session`**: Intelligence lost on session end
- **`save_mem` + `recall_mems`**: Persistent memory across sessions — decisions survive

### State Files

- `.hivemind/state/brain.json` — Machine state (do not edit manually)
- `.hivemind/state/hierarchy.json` — Decision tree
- `.hivemind/sessions/` — Session files and archives

<!-- HIVEMIND-GOVERNANCE-END -->
