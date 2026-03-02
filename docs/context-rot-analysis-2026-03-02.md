# Context Rot Analysis: AGENTS-temp-disabled.md

**Analysis Date**: 2026-03-02  
**Analyst**: hivemaker  
**Purpose**: Identify salvageable content vs. context rot in AGENTS-temp-disabled.md to inform clean AGENTS.md creation

---

## Executive Summary

The `AGENTS-temp-disabled.md` file (22,164 bytes) contains a mix of valid architectural patterns and significant context rot. The rot primarily manifests as outdated phase completion markers, stale status tables, and obsolete file references from February 2026 planning cycles.

**Verdict**: ~60% of content is context rot; 40% contains salvageable architectural patterns.

---

## SALVAGEABLE Content

### 1. Architecture Patterns (High Value)

| Pattern | Location in Old File | Status |
|---------|---------------------|--------|
| Layer Architecture (Tools/Lib/Hooks/Schemas) | Line 77-83 | ✅ Salvaged to AGENTS.md |
| Branch Policy (dev-v3 vs master) | Line 66-73 | ✅ Salvaged to AGENTS.md |
| CQRS Principles | Line 154-156 | ✅ Salvaged to AGENTS.md |
| File size limits (~300 lines) | Line 153 | ✅ Salvaged to AGENTS.md |

### 2. Tool Registry (Valid)

The HiveMind tool descriptions (lines 113-122) remain accurate:
- `declare_intent`, `map_context`, `compact_session`
- `scan_hierarchy`, `save_anchor`, `think_back`
- `save_mem`, `recall_mems`
- `hierarchy_manage`, `export_cycle`

### 3. Build/Test Commands (Valid)

Lines 59-62, 95-98 contain valid commands:
```bash
npm test
npx tsc --noEmit
npx tsx --test tests/filename.test.ts
```

### 4. Style Conventions (Valid)

Lines 100-106 define valid conventions:
- 2-space indent
- Double quotes
- `.js` extension for local imports
- `getEffectivePaths()` usage

### 5. TODO Discipline Protocol (Valid)

Lines 27-51 describe valid TODO discipline that was preserved.

### 6. No-Guess Mandate (Valid)

Lines 40-52 MCP tool usage rules remain current and were preserved.

---

## CONTEXT ROT (To Be Discarded)

### 1. Phase Completion Statuses (Critical Rot)

**Lines 139-149, 398-426**: All phases marked ✅ COMPLETE from 2026-02-19

```markdown
## Phase 2 FK Remediation (2026-02-19)
### Changes Made: ...
### Exit Gate Status: ✅ TypeScript: 0 session_id errors

## Phase 3 Completion Status (2026-02-19)
- ✅ TypeScript: `npx tsc --noEmit` pass (0 errors)
- ✅ Tests: `npm test` pass (0 failures)

## Phase 4 Completion Status (2026-02-19)
## Phase 5 Completion Status (2026-02-19)
## Phase 6 Completion Status (2026-02-19)
```

**Why This Is Rot**:
- Historical completion markers from February 2026
- No longer relevant to current work
- Create false sense of "everything done"
- Pollute search results and context

**Decision**: ❌ NOT salvaged. Current status belongs in planning docs, not agent guidance.

### 2. Framework Upgrade Status Table (Stale)

**Lines 139-149**: Phase status table

```markdown
| Phase | Domains | Status | Next Action |
|-------|---------|--------|-------------|
| 0 | SPEC | ✅ COMPLETE | Validated plan written |
| 1 | D7 (Context Injection) | 🔴 NOT STARTED | Phase 1 entry — RANK 1 blocker |
```

**Why This Is Rot**:
- Status from 2026-03-02 planning
- Will become stale immediately
- Planning docs should track this, not agent guidance

**Decision**: ❌ NOT salvaged. Belongs in planning documents.

### 3. Source File Registry (Partially Rot)

**Lines 188-330**: Extensive file listings

**Issues**:
- "Last Updated: 2026-02-18" — stale
- "Total Files: 97" — will drift
- Individual file status markers ([NEW], [UPDATED]) — obsolete

**Decision**: ❌ NOT salvaged. File listings belong in:
- Architecture Decision Records (ADRs)
- Code documentation
- Automated tooling (not manual lists)

### 4. Planning Document References (Duplicative)

**Lines 124-137**: PRD and planning doc listings

These are valid documents but listing them in AGENTS.md creates:
- Duplication with `docs/` directory
- Stale lists (when docs added/removed)
- Maintenance burden

**Decision**: Partially salvaged — kept only current ACTIVE documents in Related Files section.

### 5. Recently Changed Table (Rot)

**Lines 315-329**: "Recently Changed" table

```markdown
| File | Status | Description |
|------|--------|-------------|
| `src/hooks/event-handler.ts` | [UPDATED] | Canonical TODO alias normalization |
```

**Why This Is Rot**:
- "Recent" from February 2026 (now March 2026)
- Will never be updated
- Changelog information belongs in git history

**Decision**: ❌ NOT salvaged.

### 6. Agent Registry (Partially Rot)

**Lines 445-451**: Only includes hiveplanner

**Issue**: Incomplete — missing 8 other agents

**Decision**: ❌ NOT salvaged. Created fresh comprehensive registry.

---

## STRUCTURAL ELEMENTS (Reused)

### Tables
- Agent registry table format ✅ Reused
- Layer architecture table ✅ Reused
- Quick reference tables ✅ Reused

### Headers
- H2 section structure ✅ Reused
- "Critical Patterns" callouts ✅ Reused

### Formatting
- Code blocks with ts/bash ✅ Reused
- Emoji indicators (✅ ❌) ✅ Reused

---

## POLLUTED SECTIONS (Mixed Content)

### Lines 1-54: Header Block

**Content**: Mix of valid mandates and vague directives

**Valid** (Salvaged):
- TODO Discipline rules
- No-Guess Mandate

**Rot** (Discarded):
- "NON-NEGOTIABLE" iterative update mandate (unenforceable)
- Vague skill loading instructions
- Redundant "ALL THE TIME" directives

### Lines 336-378: HiveMind Governance Block

**Content**: Duplicated between HIVEMIND-GOVERNANCE-START/END comments

**Issue**: Appears twice — once in main doc, once in XML comment block

**Decision**: Salvaged once in clean AGENTS.md, removed duplicate.

---

## Lessons for Future Prevention

### What Caused This Rot

1. **Phase Status Tracking in Living Doc**: Completion markers for phases belong in:
   - Planning documents (time-bounded)
   - Git history (immutable)
   - Not in ongoing agent guidance

2. **Date-Based "Recent" Sections**: Any "recently changed" or "updated" markers will rot

3. **Manual File Registries**: Automated listings or no listings

4. **Mixed Concerns**: Agent guidance + planning status + file listings = confusion

### Prevention Strategies

| Strategy | Implementation |
|----------|----------------|
| **Separate Planning from Guidance** | Planning docs track status; AGENTS.md tracks roles |
| **Timestamp Everything** | Every doc has "Last Updated" maintained by skill |
| **Automated Validation** | `update-agents` skill runs after commits |
| **Minimal Living Docs** | AGENTS.md = registry + essentials only |
| **Archive Historical Docs** | Move completed phase docs to `docs/archive/` |

---

## New File Structure

### AGENTS.md (Clean)
- Quick Reference (commands, branch policy, critical paths)
- Agent Registry (table of all agents)
- Architecture Essentials (layer patterns, CQRS)
- Workflow Standards (TODO, No-Guess, Post-Commit)
- Planning Documents (minimal, current only)
- Related Files (links)

### .kilocode/rules-code/AGENTS.md
- Code-specific patterns (CQRS implementation)
- Layer responsibilities
- Coding conventions
- Anti-patterns
- Verification checklist

### .kilocode/skills/update-agents/SKILL.md
- Maintenance automation
- Trigger conditions
- Validation steps
- Context rot detection

---

## Verification

| Check | Status |
|-------|--------|
| All agent files inventoried | ✅ 9 agents documented |
| Valid patterns salvaged | ✅ Architecture, workflows, conventions |
| Context rot identified | ✅ Phase statuses, stale tables, file registries |
| New files created | ✅ AGENTS.md, rules-code/AGENTS.md, update-agents skill |
| Links validated | ✅ All internal links checked |

---

## Conclusion

The `AGENTS-temp-disabled.md` file served its purpose during active development but accumulated significant context rot. The new AGENTS.md system:

1. **Separates concerns**: Guidance vs. planning vs. implementation
2. **Enables maintenance**: `update-agents` skill for automated updates
3. **Prevents future rot**: Timestamp discipline, minimal living docs
4. **Preserves value**: Valid patterns retained, rot discarded

**Recommendation**: Archive `AGENTS-temp-disabled.md` after 30 days (2026-04-02) once team confirms new system works.
