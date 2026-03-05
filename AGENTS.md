# AGENTS.md

This file provides guidance to ALL agents working in this repository.

**Last Updated**: 2026-03-04
**Version**: 3.1-guardrails
**Maintained By**: hivefiver meta-builder
**Symlinked To**: `.hivemind/AGENTS.md`, `.opencode/AGENTS.md`, `src/AGENTS.md`

---

## ⚠️ CONTAMINATION WARNING

This project has forensically proven context poisoning across 7+ agent sessions. Before doing ANY work, read:

→ **[CONTAMINATION-GUARDRAILS.md](./CONTAMINATION-GUARDRAILS.md)** — Toxic artifact registry, anti-patterns, safe protocols

### Non-Negotiable Runtime Conditions
1. **MUST** load agent-specific skills before acting
2. **MUST NOT** consume any `.md`, `.json`, `.yaml` artifacts unless passed via explicit delegation handoff with valid investigation from the prior agent's turn
3. **MUST NOT** read `.hivemind/state/brain.json` for routing or decisions
4. **MUST NOT** glob `**/*.md` — use targeted file reads only
5. **MUST** run `npx tsc --noEmit` after any code changes
6. If you violate any of the above: **STOP** immediately and capture the workflow state

---

## Current Objective: Meta-Builder Healer Refactor

Refactor the **`hivefiver`** module into a reliable "healer" for the project lineage team — a meta-builder orchestrator that can diagnose, refactor, debug, validate, and evolve the framework **without poisoning runtime context**.

### What hivefiver Is
- Meta-builder: engineers the tools that engineers use
- Framework doctor: diagnoses and repairs broken framework chains
- Quality gatekeeper: no asset ships without contract compliance

### What hivefiver Is NOT
- Product-only implementor (Pivoting to surgical refactor operation, allowing and shifting orientation to restructure and refactor the whole project)
- General assistant (redirects non-framework requests)

### Scope Boundaries

| Module | Status | Constraint |
|--------|--------|-----------|
| `hivefiver` | **IN SCOPE** — pivoting to surgical refactor operation | Allowing and shifting orientation to restructure and refactor the whole project (`.opencode/**`, `.hivemind/**`, `docs/**`, `src/**`, `tests/**`) |
| `hiveminder` | **OUT OF SCOPE** for implementation; **IN SCOPE** for compatibility | Agent profiles and subagents are shared — refactors must keep future compatibility |

### Core Problem Being Solved
Two independent auto-injection systems fire on EVERY LLM turn, injecting contradictory context from overlapping state files. This causes role-drift, hallucination, and context poisoning. See CONTAMINATION-GUARDRAILS.md §4.

---

## Build/Test Commands

```bash
npm test                                    # Run all tests (203 pass, 11 fail as of 2026-03-04)
npx tsx --test tests/filename.test.ts       # Run specific test
npx tsc --noEmit                           # Type check (currently PASSING)
npm run guard:public                       # Run BEFORE any master push
```

---

## Branch Policy

| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

---

## Agent Registry

| Name | Type | Role | Scope Constraints | Location |
|------|------|------|-------------------|----------|
| **hiveminder** | Primary | Supreme orchestrator | No direct code edits; orchestrates via delegation. OUT OF SCOPE for now | `agents/hiveminder.md` |
| **hivefiver** | Meta-Builder | Framework asset builder + surgical refactor | **PIVOTED**: Surgical refactor operation across whole project (`.opencode/**`, `.hivemind/**`, `src/**`, `tests/**`, `docs/**`) | `agents/hivefiver.md` |
| **hivemaker** | Executor | Implementation specialist | `src/**`, `tests/**`, `docs/**` only; NO framework assets | `agents/hivemaker.md` |
| **hivehealer** | Remediation | Debugging, hardening | `src/**`, `tests/**`, `docs/**` only; NO framework assets | `agents/hivehealer.md` |
| **hiveplanner** | Planner | Phase planning, research synthesis | `docs/plans/` only; research + synthesis focus | `agents/hiveplanner.md` |
| **hiveq** | Verifier | Quality gates, PASS/FAIL verdicts | Read-only on code; verification reports only | `agents/hiveq.md` |
| **hivexplorer** | Investigator | Codebase research, evidence collection | Read-only; NO file modifications | `agents/hivexplorer.md` |
| **hiverd** | Research | External research, ecosystem analysis | External knowledge only; NO internal code edits | `agents/hiverd.md` |
| **hitea** | Testing | AI-driven testing infrastructure | `tests/**` only | `agents/hitea.md` |

### Delegation Hierarchy
```
User
└── hiveminder (Primary — currently inactive)
    └── hivefiver (Meta-Builder — ACTIVE)
        ├── hivemaker (Implementation)
        ├── hiveplanner (Planning)
        ├── hivexplorer (Investigation — terminal, read-only)
        ├── hiverd (External research — terminal)
        ├── hivehealer (Remediation)
        ├── hiveq (Quality gates)
        └── hitea (Testing)
```

---

## Architecture Essentials

### Layer Architecture
| Layer | Location | Role | Constraint |
|-------|----------|------|------------|
| **Tools** | `src/tools/` | Write-Only | CQRS: tools own mutations |
| **Libraries** | `src/lib/` | Subconscious Engine (pure TS) | No side effects |
| **Hooks** | `src/hooks/` | Read-Auto (inject context) | No mutations; read-only |
| **Schemas** | `src/schemas/` | DNA (Zod validation) | Source of truth for types |

### Critical Patterns

1. **State Mutation Queue**: ALL state changes MUST go through `src/lib/state-mutation-queue.ts`. Direct file writes to `.hivemind/` are forbidden.

2. **Path Resolution**: ALWAYS use `getEffectivePaths()` from `src/lib/paths.ts`. Never hardcode `.hivemind/` paths. New: `getSessionPaths()` for per-session state.

3. **CQRS Enforcement**: Hooks are READ-ONLY (context injection). Tools own WRITE operations. Violations break session integrity.

4. **Session Isolation**: New sessions get their own directory under `.hivemind/sessions/active/<session-id>/` with a clean-slate `profile.json` (agent: "unresolved" until `hivemind_declare` fires).

### Dual-Injection Systems (DANGER ZONE)

| System | File | Fires | What It Does |
|--------|------|-------|-------------|
| System 1 | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Every turn | Reads 6 state files, prepends to messages |
| System 2a | `src/hooks/session-lifecycle.ts` | Every turn | Reads 5 state files, appends to system |
| System 2b | `src/hooks/messages-transform.ts` | Every turn | Prepends anchors + appends checklist |

**These are the primary sources of context poisoning.** Do NOT edit them without completing Node 1 Fixes 3C-D and Fix 1 first.

---

## Development Status (Node 1: Injection Layer Refactoring)

### Completed
| Step | What | Evidence |
|------|------|---------|
| Fix 3A | `src/lib/paths.ts` — SessionPaths + getSessionPaths() | `npx tsc --noEmit` PASS |
| Fix 3B | `src/hooks/event-handler.ts` — session.created bootstrap | profile.json with agent:"unresolved" |
| Fix 1.5A | `src/schemas/brain-state.ts` — schema detox | Orphans pruned, cycle_log lobotomized |
| Fix 1.5B | `src/lib/detection.ts` — GovernanceCounters normalized | 4-field contract active: {drift, compaction, out_of_order, evidence_pressure} |

### Blocked
| Step | What | Blocker |
|------|------|---------|
| Test alignment | 11 tests fail from schema contract changes | Needs user authorization to update test expectations |

### Not Started (Requires Authorization)
| Step | What | Prerequisite |
|------|------|-------------|
| Fix 1.5C | Lineage ID validation in hierarchy schema | Test alignment |
| Fix 1.5D | soft-governance.ts dead counter cleanup | Test alignment |
| Fix 3C-D | Clean-slate session state init + hook migration | Fix 1.5C/D |
| Fix 1 | Dual-injection decoupling (agent guards) | Fix 3C-D |
| Fix 2 | Relational staleness rewrite | Fix 1 |

---

## Workflow Standards

### TODO Discipline (All Agents)
1. **Turn Start**: Read current TODO list
2. **First Item**: Entry point for current turn
3. **Last Item**: MUST be `HARD STOP — [verification condition]`
4. **After Execution**: Update TODO list immediately
5. **HARD STOP Rule**: Stop and report; do NOT continue past it

### No-Guess Mandate
1. **DO NOT** reason from training data about unfamiliar technology
2. **MUST** use MCP tools first: Tavily, Context7, DeepWiki, Repomix
3. **If ALL MCP tools fail**: State explicitly and STOP
4. All technical claims must cite MCP source

### Safe Delegation Contract
See CONTAMINATION-GUARDRAILS.md §3 for the complete delegation safety protocol.

---

## Restricted Regions (DO NOT ENTER Without Authorization)

See CONTAMINATION-GUARDRAILS.md §6 for the complete list with rationales.

Key restrictions:
- `.opencode/plugins/hiveops-governance/hooks/` — System 1 injection, needs Fix 1 first
- `src/hooks/session-lifecycle.ts` — System 2a injection, needs Fix 1 first
- `src/hooks/messages-transform.ts` — System 2b injection, needs Fix 1 first
- `.hivemind/state/` — Global singleton state, needs Fix 3C-D first
- `.hivemind/plans/` — Unvalidated planning artifacts from multiple agents

---

## Planning Documents

| Document | Purpose | Status | Trust Level |
|----------|---------|--------|-------------|
| `docs/plans/NODE-1-INJECTION-LAYER-REFACTOR-2026-03-04.md` | Node 1 blueprint v2.1 | Active | HIGH (approved with amendments) |
| `docs/plans/SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md` | Architecture spec | Reference | MEDIUM (needs validation) |
| `docs/plans/ENTITY-RELATIONAL-MAP-2026-03-03.md` | Entity relationships | Reference | MEDIUM (needs validation) |
| `docs/plans/EXPLORE1-ARCH-STRUCTURE-2026-03-03.md` | Architecture exploration | Reference | MEDIUM (needs validation) |
| `CONTAMINATION-GUARDRAILS.md` | Forensic contamination defense | Active | HIGH (evidence-based) |

---

## Related Files

- `CLAUDE.md` — Project entry point for Claude/OpenCode sessions
- `CONTAMINATION-GUARDRAILS.md` — Forensic contamination defense guide
- `AGENT_RULES.md` — Constitutional architecture document (reference only)

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

