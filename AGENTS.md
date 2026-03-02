# AGENTS.md

This file provides guidance to agents when working with code in this repository.

**Last Updated**: 2026-03-02  
**Version**: 3.0-clean  
**Maintained By**: `update-agents` skill (auto-triggered on relevant commits)

---

## Quick Reference

### Build/Test Commands
```bash
npm test                                    # Run all tests
npx tsx --test tests/filename.test.ts       # Run specific test
npx tsc --noEmit                           # Type check
```

### Branch Policy (Critical)
| Branch | Purpose |
|--------|---------|
| `dev-v3` | Development, planning, internal docs |
| `master` | Public release only (NO secrets, NO .opencode, NO planning docs) |

```bash
npm run guard:public  # Run BEFORE any master push
```

### Critical File Paths
| File | Purpose |
|------|---------|
| `src/hooks/session-lifecycle.ts` | Context injection every turn |
| `src/lib/hierarchy-tree.ts` | Trajectory → Tactic → Action tree |
| `src/lib/paths.ts` | Single source of truth for `.hivemind/` paths |
| `src/lib/state-mutation-queue.ts` | ALL state mutations must go through here |

---

## Agent Registry

| Name | Type | Role | Constraints | Location |
|------|------|------|-------------|----------|
| **hiveminder** | Primary | Supreme orchestrator, strategic architect | No direct code edits; orchestrates via delegation | [`agents/hiveminder.md`](agents/hiveminder.md) |
| **hivefiver** | Meta-Builder | Framework asset builder (agents, commands, skills) | NO `src/**` or `tests/**` - framework only | [`agents/hivefiver.md`](agents/hivefiver.md) |
| **hivemaker** | Executor | Implementation specialist | `src/**`, `tests/**`, `docs/**` only; NO framework assets | [`agents/hivemaker.md`](agents/hivemaker.md) |
| **hivehealer** | Remediation | Debugging, hardening, quality recovery | `src/**`, `tests/**`, `docs/**` only; NO framework assets | [`agents/hivehealer.md`](agents/hivehealer.md) |
| **hiveplanner** | Planner | Phase planning, execution knots, research synthesis | NO `src/**` edits; plans to `docs/plans/` only | [`agents/hiveplanner.md`](agents/hiveplanner.md) |
| **hiveq** | Verifier | Quality gates, compliance, PASS/FAIL verdicts | Read-only on code; verification reports only | [`agents/hiveq.md`](agents/hiveq.md) |
| **hivexplorer** | Investigator | Codebase research, evidence collection | Read-only; NO file modifications | [`agents/hivexplorer.md`](agents/hivexplorer.md) |
| **hiverd** | Research | External research, ecosystem analysis | External knowledge only; NO internal code edits | [`agents/hiverd.md`](agents/hiverd.md) |
| **hitea** | Testing | AI-driven testing infrastructure | `tests/**` only; property-based, mutation, chaos testing | [`agents/hitea.md`](agents/hitea.md) |

### Delegation Hierarchy
```
User
└── hiveminder (Primary/Front-facing)
    ├── hivefiver (Framework construction)
    ├── hiveplanner (Planning & research synthesis)
    ├── hivemaker (Implementation)
    ├── hivehealer (Remediation)
    ├── hiveq (Verification)
    ├── hivexplorer (Investigation - terminal)
    └── hiverd (External research - terminal)
```

---

## Architecture Essentials

### Layer Architecture
| Layer | Location | Role | Constraint |
|-------|----------|------|------------|
| **Tools** | `src/tools/` | Write-Only (~300 lines strategic limit) | CQRS: tools own mutations |
| **Libraries** | `src/lib/` | Subconscious Engine (pure TS) | No side effects |
| **Hooks** | `src/hooks/` | Read-Auto (inject context) | No mutations; read-only |
| **Schemas** | `src/schemas/` | DNA (Zod validation) | Source of truth for types |

### Critical Patterns (Non-Obvious)

1. **State Mutation Queue**: ALL state changes MUST go through [`src/lib/state-mutation-queue.ts`](src/lib/state-mutation-queue.ts) - direct file writes to `.hivemind/` are forbidden.

2. **Path Resolution**: ALWAYS use `getEffectivePaths()` from [`src/lib/paths.ts`](src/lib/paths.ts) - never hardcode `.hivemind/` paths.

3. **CQRS Enforcement**: 
   - Hooks are READ-ONLY (context injection)
   - Tools own WRITE operations
   - Violations break session integrity

4. **Lineage Continuity**: All work must trace: `project -> milestone -> phase -> plan -> task -> verification`

---

## Workflow Standards

### TODO Discipline (All Agents)
1. **Turn Start**: Read current TODO list
2. **First Item**: Entry point for current turn
3. **Last Item**: MUST be `HARD STOP — [verification condition]`
4. **After Execution**: Update TODO list immediately
5. **HARD STOP Rule**: Stop and report; do NOT continue past it

### No-Guess Mandate
When encountering unfamiliar technology:
1. **DO NOT** reason from training data
2. **DO NOT** guess syntax or behavior
3. **MUST** use MCP tools first: Tavily, Context7, DeepWiki, Repomix
4. **If ALL MCP tools fail**: State explicitly and STOP
5. **Evidence requirement**: All technical claims must cite MCP source

### Post-Commit Update Protocol
**TRIGGER**: Any commit changing:
- `agents/*.md` files
- `src/` implementation files
- Planning documents in `docs/plans/`

**ACTION**: Run `update-agents` skill to:
1. Validate agent documentation against implementation
2. Update "Last Updated" timestamps
3. Check for broken references
4. Sync agent registry with actual agent files

---

## Planning Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [`docs/refactored-plan.md`](docs/refactored-plan.md) | Master plan (6 phases) | Active |
| [`docs/plans/PRD-V2-HIVEMIND-ENGINE-2026-02-18.md`](docs/plans/PRD-V2-HIVEMIND-ENGINE-2026-02-18.md) | Current PRD | Active |
| [`AGENT_RULES.md`](AGENT_RULES.md) | Full architectural philosophy | Reference |

---

## Related Files

- [`.kilocode/rules-code/AGENTS.md`](.kilocode/rules-code/AGENTS.md) - Mode-specific coding rules
- [`AGENTS-temp-disabled.md`](AGENTS-temp-disabled.md) - Old polluted version (DO NOT USE)
- [`AGENT_RULES.md`](AGENT_RULES.md) - Constitutional architecture document
