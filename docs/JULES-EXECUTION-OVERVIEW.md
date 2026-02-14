# HiveMind v3 Remediation — Jules Execution Overview

**Repository:** https://github.com/shynlee04/hivemind-plugin  
**Branch:** `dev-v3`  
**Created:** 2026-02-14  
**Status:** READY FOR EXECUTION

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Repository** | https://github.com/shynlee04/hivemind-plugin |
| **Branch** | `dev-v3` |
| **Plan Document** | `docs/plans/2026-02-14-COMPREHENSIVE-MASTER-PLAN-v2.md` |

---

## Issues (Execution Order)

| # | Issue | Priority | Time | Depends On |
|---|-------|----------|------|------------|
| 22 | [PHASE-0] Foundation Validation | CRITICAL | 20 min | - |
| 23 | [PHASE-1] Entry Gate + Bug Triage | CRITICAL | 6 hrs | Phase 0 |
| 24 | [PHASE-2] Auto-Organization | HIGH | 5 hrs | Phase 1 |
| 25 | [PHASE-3] Toast Rewrite | CRITICAL | 4 hrs | Phase 1, 2 |
| 26 | [PHASE-4] Prompt Transformation | MEDIUM | 3 hrs | Phase 1 |
| 27 | [PHASE-5] CLI/Slash Alignment | MEDIUM | 2 hrs | Phase 0 |
| 28 | [PHASE-6] Brownfield Auto-Scan | HIGH | 4 hrs | Phase 1 |
| 29 | [PHASE-7] First-Turn Context | HIGH | 4 hrs | Phase 1, 2 |
| 31 | [PHASE-8] Delegation + TODO | HIGH | 8 hrs | Phase 1, 2, 7 |
| 32 | [PHASE-9] Signal System | CRITICAL | 6 hrs | Phase 1, 3 |
| 33 | [PHASE-10] Integration Testing | CRITICAL | 6 hrs | ALL |

**Total Estimated Time:** 48 hours

---

## The Core Problem

> **"The framework trusts agents/users to 'do the right thing' instead of enforcing validation and auto-correction at every boundary."**

This creates a "garbage in, garbage out" system where manual mistakes compound into chaos.

---

## Six Core Principles

1. **Control smallest unit** → Sub-tasks must be tracked, time-stamped, committed
2. **Never govern <100%** → No advisory-only mechanisms; forced actions only
3. **Every turn enforcement** → Delegation + TODO + context at ALL turns
4. **Smart automation** → Parse and validate, don't trust
5. **Easy + impactful first** → Start with prompt transformation
6. **Entry point bulletproof** → Framework can't work without validation

---

## Execution Dependencies

```
PHASE 0 ────────────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        │
PHASE 1 ─────────────────────────────────────────────────────┤
    │                                                        │
    ├─────────────────────┬─────────────────────┐            │
    │                     │                     │            │
    ▼                     ▼                     ▼            │
PHASE 2            PHASE 4               PHASE 5            │
    │                     │                     │            │
    ├─────────────────────┤                     │            │
    │                     │                     │            │
    ▼                     ▼                     ▼            │
PHASE 3            PHASE 6               PHASE 7            │
    │                     │                     │            │
    ▼                     │                     ▼            │
PHASE 9 ◄──────────────────┴─────────────────────┤            │
    │                                              │            │
    ▼                                              ▼            │
PHASE 8 ◄─────────────────────────────────────────┘            │
    │                                                           │
    ▼                                                           │
PHASE 10 ◄──────────────────────────────────────────────────────┘
```

**Critical Path:** 0 → 1 → 2 → 3 → 9 → 8 → 10  
**Parallel Track:** 1 → (4, 5, 6, 7) → 8

---

## Key Files to Know

### Entry Points
- `src/index.ts` — Plugin registration
- `src/cli.ts` — CLI entry

### Core Logic
- `src/lib/persistence.ts` — State management
- `src/lib/hierarchy-tree.ts` — Tree operations
- `src/lib/detection.ts` — **Line 259: JARGON TO FIX**

### Hooks (Where validation lives)
- `src/hooks/session-lifecycle.ts` — Startup validation, first-turn context
- `src/hooks/soft-governance.ts` — Toast generation (**REPLACE**)
- `src/hooks/tool-gate.ts` — Tool execution gate

### Tools
- `src/tools/declare-intent.ts` — Session initialization
- `src/tools/export-cycle.ts` — **BUG: doesn't sync hierarchy**
- `src/tools/compact-session.ts` — Needs better description

### Commands (Need `name:` field)
- `.opencode/commands/hivemind-scan.md`
- `.opencode/commands/hivemind-status.md`
- `.opencode/commands/hivemind-compact.md`

---

## 8 Critical Bugs (Phase 1)

| # | Bug | File |
|---|-----|------|
| 1 | export_cycle doesn't sync hierarchy | `src/tools/export-cycle.ts` |
| 2 | declare_intent overwrites templates | `src/tools/declare-intent.ts` |
| 3 | Auto-archive doesn't reset hierarchy | `src/lib/planning-fs.ts` |
| 4 | trackSectionUpdate() never called | `src/hooks/soft-governance.ts` |
| 5 | Missing write_without_read_count | `src/lib/persistence.ts` |
| 6 | next_compaction_report not cleared | `src/hooks/compaction.ts` |
| 7 | Drift score before turn increment | `src/hooks/tool-gate.ts` |
| 8 | Drift score not persisted | `src/hooks/tool-gate.ts` |

---

## Files to Create (13)

1. `src/hooks/entry-gate.ts`
2. `src/lib/signals.ts`
3. `src/lib/signal-compiler.ts`
4. `src/lib/signal-executor.ts`
5. `src/lib/signal-catalog.ts`
6. `src/lib/index-generator.ts`
7. `src/lib/manifest.ts`
8. `src/schemas/task.ts`
9. `src/lib/tasks.ts`
10. `tests/mesh-integration.test.ts`
11. `tests/compaction-stress.test.ts`
12. `tests/subagent-delegation.test.ts`
13. `tests/task-enforcement.test.ts`

## Files to Delete (1)

1. `src/lib/toast-throttle.ts` — Replaced by signals

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test assertions | ~700 | 850+ |
| Entry validation | 0% | 100% |
| Toast clarity | 3/10 | 9/10 |
| Slash commands | 0% | 100% |
| First-turn context | 20% | 95%+ |
| Subagent preservation | 30% | 95%+ |

---

## Build & Test Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build

# Lint (SDK boundary)
npm run lint:boundary

# Run single test file
npx tsx --test tests/path/to/test.ts
```

---

## Code Style

- **Indentation:** 2 spaces
- **Semicolons:** Avoid (mostly)
- **Quotes:** Double quotes `"string"`
- **Imports:** Local imports MUST use `.js` extension
- **Naming:** `camelCase` variables, `PascalCase` types, `kebab-case` files

---

## Verification After Each Phase

```bash
npm test && npm run typecheck && npm run build
```

All must pass before moving to next phase.

---

## Questions?

Refer to the full plan document:
- `docs/plans/2026-02-14-COMPREHENSIVE-MASTER-PLAN-v2.md`

---

*Document Version: 1.0.0*  
*Last Updated: 2026-02-14*
