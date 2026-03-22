# Master Active - HIVEMIND SKILLS PACKAGING

**Created:** 2026-03-21  
**Updated:** 2026-03-21  
**Status:** PIVOT - Independent skills packaging

## Strategic Pivot

**Previous:** Pollution detection and isolation  
**Current:** Independent skill packaging - each skill as a standalone unit with methods, scripts, assets, and deterministic references

### Core Objective
Make each Hivemind skill an independent package that:
1. Does not enforce on particular tools
2. Has its own methods, scripts, and templates
3. Works without depending on other polluted skills
4. Can be audited, refactored, or removed independently

### Truthful Baseline
- `skills/` directory contains 22 skill packages
- Each skill should be independently auditable
- External skills (`skill-creator`, `skill-review`) provide patterns
- Source truth lives in `src/` - skills are output artifacts

### Strategic Approach

1. **STEAL THE PATTERNS** - Use external `skill-creator` for skill structure
2. **ISOLATE FALSE CLAIMS** - Remove enforcement claims from SKILL.md files
3. **GIVE EACH SKILL OWN METHODS** - Scripts, templates, references
4. **SHUT THEM UP** - Remove noise, keep deterministic behavior

## High-Level Tasks

| Phase | Focus | Skills | Status |
|-------|-------|--------|--------|
| 1 | Remove false enforcement | `use-hivemind`, `context-intelligence-entry`, `agent-role-boundary`, `use-hivemind-delegation` | COMPLETED |
| 2 | Make independent | `use-hivemind-skill-writer`, `context-entry-verify`, `git-atomic-memory`, `use-hivemind-context-verify` | COMPLETED |
| 3 | Reference external | `hivemind-skill-writer`, `hivemind-skill-write`, `hivemind-skill-doctor` | COMPLETED |
| 4 | Monitor | `spec-distillation`, `research-methodology` | CLEAN |

## Pattern Reference

### Pattern: Independent Skill Structure
```
skill-name/
├── SKILL.md              # Minimal entry - no false claims
├── references/           # Quick deterministic refs
│   ├── patterns.md
│   └── workflows.md
├── scripts/              # Own scripts (no enforcement)
│   └── *.cjs
└── templates/            # Reusable templates
    └── *.md
```

### Pattern: External Skill Reference
Instead of reinventing, reference external skills:
- `skill-creator` for creating skills
- `skill-review` for auditing skills
- `orchestrator` for delegation
- `evidence-discipline` for verification

## Delegation Strategy

For each skill audit/refactor:
1. Load `skill-creator` and `skill-review` externally
2. Delegate to isolated subagent
3. Each subagent audits one skill independently
4. Synthesize findings without mixing contexts

## Non-Negotiable Rules

1. **No enforcement claims** - If skill claims to block/enforce, verify code exists
2. **Independent scripts** - Each skill's scripts must be self-contained
3. **Deterministic references** - Templates and patterns must be repeatable
4. **External over internal** - Prefer external skills to rebuilding

## Decision Points

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skill claims enforcement but has no code | REMOVE claim | False signals are worse than silence |
| Skill depends on polluted skill | ISOLATE | Prevent transitive pollution |
| External skill exists for the purpose | USE EXTERNAL | Don't reinvent |
| Skill has no scripts/templates | ADD minimal | Skills must be packages, not docs |

## Exit Gates

1. `npm run build` passes
2. `npx tsc --noEmit` passes
3. Each skill has minimal SKILL.md without false claims
4. Skills needing scripts have deterministic own scripts
5. External patterns referenced instead of reimplemented
