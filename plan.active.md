# Plan Active - HIVEMIND SKILLS PACKAGING

**Created:** 2026-03-21  
**Updated:** 2026-03-21  
**Status:** PIVOT - Independent skills packaging

## PIVOT: From Pollution to Independence

**Previous Focus:** Pollution detection and isolation  
**New Focus:** Making skills independent packages with deterministic methods, scripts, assets, and templates

### Key Principles
1. Each skill must be INDEPENDENT - no enforcement on particular tools
2. Each skill must have: methods, scripts, assets, quick deterministic references
3. Skills should work without depending on other polluted skills
4. Stop caring about "entry is fine" - focus on making skills shut up and work

## Skills Inventory

| Skill | Status | Action |
|-------|--------|--------|
| `use-hivemind-detox-refactor` | EXTERNAL | Reference pattern only |
| `use-hivemind` | ISOLATE | Remove false claims, keep minimal |
| `context-intelligence-entry` | ISOLATE | Remove false enforcement |
| `use-hivemind-skill-writer` | REFACTOR | Make independent |
| `use-hivemind-hierarchy` | REFACTOR | Make independent |
| `use-hivemind-git-memory` | REFACTOR | Make independent |
| `use-hivemind-delegation` | ISOLATE | Remove false claims |
| `use-hivemind-context-verify` | REFACTOR | Make independent |
| `use-hivemind-context-integrity` | ISOLATE | Remove false claims |
| `spec-distillation` | MONITOR | Already clean |
| `research-methodology` | MONITOR | Already clean |
| `ralph-tasking` | MONITOR | Already clean |
| `platform-adapter` | MONITOR | Already clean |
| `opencode-delegation` | REFACTOR | Make independent |
| `hivemind-skill-writer` | ISOLATE | High risk - remove |
| `hivemind-skill-write` | ISOLATE | High risk - remove |
| `hivemind-skill-doctor` | ISOLATE | High risk - remove |
| `hivemind-delegation-write` | ISOLATE | High risk - remove |
| `harness-architecture` | ISOLATE | High risk - remove |
| `git-atomic-memory` | REFACTOR | Make independent |
| `context-entry-verify` | REFACTOR | Make independent |
| `agent-role-boundary` | ISOLATE | Documentation only |

## Independent Skill Pattern

Each skill should follow this structure:

```
skill-name/
├── SKILL.md           # Entry point (minimal, deterministic)
├── references/        # Quick deterministic references
│   ├── patterns.md
│   └── examples.md
├── scripts/          # Deterministic scripts (no enforcement)
│   └── *.cjs
├── templates/         # Reusable templates
│   └── *.md
└── assets/           # Quick assets if needed
    └── *
```

## Refactoring Tasks

### Phase 1: Remove False Enforcement (COMPLETED: 4/4)
Skills that claim enforcement but have no code:
- [x] `use-hivemind` - Already fixed - ROUTER only, no enforcement
- [x] `context-intelligence-entry` - Already fixed - ADVISORY OUTPUT ONLY
- [x] `agent-role-boundary` - Fixed - Changed "Enforces" to "Describes"
- [x] `use-hivemind-delegation` - Fixed - Changed "Block" to "Recommend"

### Phase 2: Make Independent (COMPLETED: 4/4)
Skills that need their own methods/scripts:
- [x] `use-hivemind-skill-writer` - Redirects to external skill-creator/skill-review
- [x] `use-hivemind-context-verify` - Has scripts/gates, removed false block claims
- [x] `git-atomic-memory` - Removed dependency on polluted context-intelligence-entry
- [x] `context-entry-verify` - Has scripts/gates, removed false block claims

### Phase 3: External Skills (COMPLETED: 3/4)
These should reference external skills rather than reimplementing:
- [x] `hivemind-skill-writer` → Redirected to external `skill-creator`
- [x] `hivemind-skill-write` → Redirected to external `skill-creator`
- [x] `hivemind-skill-doctor` → Redirected to external `skill-review`
- [x] `spec-distillation` → Already clean, use as-is

## Exit Criteria

1. [x] All skills have minimal SKILL.md (no false claims) - Phase 1 complete
2. [x] Skills that need scripts have their own deterministic scripts - Phase 2 complete
3. [x] Skills reference external patterns instead of reinventing - Phase 3 complete
4. [x] No skill enforces on particular tools or frameworks - Claims removed
5. [x] Build passes: `npm run build`
6. [x] Typecheck passes: `npx tsc --noEmit`

## Status: ALL PHASES COMPLETE

## Next Actions (Pending)

1. **Reconcile control files** - progress.active.md Phase 3 count updated (was 3/4, now 4/4)
2. **Verify all skills** - Run full test suite to confirm no regressions
3. **Document lessons learned** - Capture what was changed and why
4. **Consider next wave** - Additional skills may need refactoring if issues surface
