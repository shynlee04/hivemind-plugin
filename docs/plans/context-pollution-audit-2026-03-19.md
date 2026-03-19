# Context Pollution Audit Report

**Date:** 2026-03-19
**Status:** AUDIT COMPLETE
**Purpose:** Identify skill conflicts, overlaps, and pollution sources before implementing Context-Intelligence Skill Pack

---

## Executive Summary

**Critical Finding:** Significant skill duplication and potential trigger conflicts across platform directories. The planned `context-intelligence-entry` skill will conflict with existing `context-integrity` skill.

### Pollution Severity: HIGH

| Issue | Count | Severity |
|-------|-------|----------|
| Exact duplicates across platforms | 14+ | HIGH |
| Deprecated skills still accessible | 7 | MEDIUM |
| GSD skill triplication | 40+ | LOW (legitimate) |
| Platform-specific duplicates | 3 | MEDIUM |
| Trigger overlap conflicts | 3 | HIGH |

---

## Section 1: Skill Inventory by Platform

### 1.1 Root `skills/` Directory (8 skills)

| Skill | Status | Notes |
|-------|--------|-------|
| `hivemind-skill-writer` | ACTIVE | Duplicated in `.opencode/skills/` |
| `spec-distillation` | ACTIVE | Duplicated in `.codex/skills/` |
| `research-methodology` | ACTIVE | Duplicated in `.codex/skills/` |
| `ralph-tasking` | ACTIVE | Duplicated in `.codex/skills/` |
| `platform-adapter` | ACTIVE | Duplicated in `.codex/skills/` |
| `harness-architecture` | ACTIVE | No duplicate |
| `agent-role-boundary` | ACTIVE | Duplicated in `.codex/skills/` |
| `_deprecated_hive/` | DEPRECATED | 7 skills moved here but still accessible |

### 1.2 `.opencode/skills/` Directory (1 skill)

| Skill | Status | Notes |
|-------|--------|-------|
| `hivemind-skill-writer` | ACTIVE | Duplicate of `skills/hivemind-skill-writer` |

### 1.3 `.codex/skills/` Directory (50+ skills)

| Category | Count | Status |
|----------|-------|--------|
| GSD skills (gsd-*) | 40+ | ACTIVE - Duplicate of `.github/skills/` |
| Hive duplicates | 7 | ACTIVE - Duplicate of deprecated hive skills |
| Root duplicates | 6 | ACTIVE - Duplicate of `skills/` |

**Hive Duplicates (from deprecated):**
- `wrong-start-resolver` → duplicates `_deprecated_hive/wrong-start-resolver`
- `verification-methodology` → duplicates `_deprecated_hive/verification-methodology`
- `meta-builder-governance` → duplicates `_deprecated_hive/meta-builder-governance`
- `evidence-discipline` → duplicates `_deprecated_hive/evidence-discipline`
- `entry-resolution` → duplicates `_deprecated_hive/entry-resolution`
- `delegation-framework` → duplicates `_deprecated_hive/delegation-framework`
- `context-integrity` → duplicates `_deprecated_hive/context-integrity`

**Root Duplicates:**
- `spec-distillation` → duplicates `skills/spec-distillation`
- `research-methodology` → duplicates `skills/research-methodology`
- `ralph-tasking` → duplicates `skills/ralph-tasking`
- `platform-adapter` → duplicates `skills/platform-adapter`
- `agent-role-boundary` → duplicates `skills/agent-role-boundary`

### 1.4 `.qwen/skills/` Directory (7 skills)

| Skill | Status | Notes |
|-------|--------|-------|
| `writing-skills` | ACTIVE | Duplicated in `.roo/skills/` |
| `skill-judge` | ACTIVE | Duplicated in `.roo/skills/` |
| `self-improving-agent` | ACTIVE | Duplicated in `.roo/skills/` |
| `planning-with-files` | ACTIVE | No duplicate |
| `code-review-excellence` | ACTIVE | No duplicate |
| `component-refactoring` | ACTIVE | No duplicate |
| `architecture-patterns` | ACTIVE | No duplicate |

### 1.5 `.roo/skills/` Directory (3 skills)

| Skill | Status | Notes |
|-------|--------|-------|
| `writing-skills` | ACTIVE | Duplicate of `.qwen/skills/writing-skills` |
| `skill-judge` | ACTIVE | Duplicate of `.qwen/skills/skill-judge` |
| `self-improving-agent` | ACTIVE | Duplicate of `.qwen/skills/self-improving-agent` |

### 1.6 `.github/skills/` Directory (38 skills)

| Category | Count | Status |
|----------|-------|--------|
| GSD skills (gsd-*) | 38 | PRIMARY SOURCE - Legitimate GSD framework |

**Note:** `.github/skills/` appears to be the PRIMARY source for GSD skills. `.codex/skills/` contains duplicates.

### 1.7 `_deprecated_hive/` Directory (7 skills)

| Skill | Status | Issue |
|-------|--------|-------|
| `wrong-start-resolver` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `verification-methodology` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `meta-builder-governance` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `evidence-discipline` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `entry-resolution` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `delegation-framework` | DEPRECATED | Still duplicated in `.codex/skills/` |
| `context-integrity` | DEPRECATED | Still duplicated in `.codex/skills/` |

---

## Section 2: Trigger Conflict Analysis

### 2.1 Context-Integrity Skill Trigger

**Current trigger:** "Use when context may be stale, after compaction, after session gaps, or when drift signals appear."

**Planned context-intelligence-entry trigger:** "Use at session start, after compaction, when detecting drift, or when delegation scope is unclear."

**CONFLICT:** Both skills trigger on:
- After compaction
- Drift detection
- Session gaps

### 2.2 Spec-Distillation Skill Trigger

**Current trigger:** "Distill noisy, contradictory, or incomplete requirements into structured specs."

**Potential conflict with context-intelligence-entry:**
- Both handle "noisy" inputs
- Both deal with ambiguity
- Potential overlap in entry resolution

### 2.3 Agent-Role-Boundary Skill Trigger

**Current trigger:** "Enforces Diamond role separation... Use when defining agent profiles, when delegation recursion risks appear, when an agent acts outside its role."

**Potential conflict with context-intelligence-entry:**
- Both deal with delegation boundaries
- Both handle scope clarity
- Overlap in role/authority detection

---

## Section 3: Pollution Source Classification

### 3.1 LEGITIMATE (Keep As-Is)

| Skill | Location | Reason |
|-------|----------|--------|
| All GSD skills (gsd-*) | `.github/skills/` | Primary source of legitimate GSD framework |
| `harness-architecture` | `skills/` | Unique technical reference |
| `planning-with-files` | `.qwen/skills/` | Unique utility |
| `code-review-excellence` | `.qwen/skills/` | Unique utility |
| `component-refactoring` | `.qwen/skills/` | Unique utility |
| `architecture-patterns` | `.qwen/skills/` | Unique utility |

### 3.2 OVERLAPPING (Consolidate)

| Skill | Locations | Recommendation |
|-------|-----------|----------------|
| `context-integrity` | `_deprecated_hive/`, `.codex/skills/` | Consolidate into new `context-intelligence-entry` |
| `entry-resolution` | `_deprecated_hive/`, `.codex/skills/` | Consolidate into new `context-intelligence-entry` |
| `delegation-framework` | `_deprecated_hive/`, `.codex/skills/` | Consolidate into new `context-intelligence-entry` |
| `spec-distillation` | `skills/`, `.codex/skills/` | Keep root, remove duplicate |
| `research-methodology` | `skills/`, `.codex/skills/` | Keep root, remove duplicate |
| `agent-role-boundary` | `skills/`, `.codex/skills/` | Keep root, remove duplicate |
| `hivemind-skill-writer` | `skills/`, `.opencode/skills/` | Keep root, remove duplicate |

### 3.3 CONFLICTING (Resolve)

| Conflict | Skills Involved | Issue |
|----------|-----------------|-------|
| Context rot detection | `context-integrity` vs planned `context-intelligence-entry` | Same triggers |
| Entry resolution | `entry-resolution` vs planned `context-intelligence-entry` | Overlapping concerns |
| Delegation boundaries | `delegation-framework`, `agent-role-boundary` vs planned branching skills | Overlapping scope |

### 3.4 DEPRECATED (Should Be Invisible)

| Skill | Current Status | Issue |
|-------|---------------|-------|
| All `_deprecated_hive/` skills | Duplicated in `.codex/skills/` | Deprecation ineffective - still accessible in `.codex/` |

### 3.5 ISOLATED (Platform-Specific)

| Skill | Locations | Recommendation |
|-------|-----------|----------------|
| `writing-skills` | `.qwen/`, `.roo/` | Keep `.qwen/` as primary, remove `.roo/` duplicate |
| `skill-judge` | `.qwen/`, `.roo/` | Keep `.qwen/` as primary, remove `.roo/` duplicate |
| `self-improving-agent` | `.qwen/`, `.roo/` | Keep `.qwen/` as primary, remove `.roo/` duplicate |

---

## Section 4: Framework Hierarchy

### 4.1 GSD Framework (Legitimate)

**Authority:** `.github/skills/gsd-*` is PRIMARY
**Duplicate:** `.codex/skills/gsd-*` should be removed or symlinked

### 4.2 HiveMind Framework (In Transition)

**Status:** Skills being consolidated
**Deprecated:** `_deprecated_hive/` should be inaccessible
**Issue:** `.codex/skills/` still loads deprecated content

### 4.3 Platform-Specific Skills

**Authority:** Each platform directory should have PRIMARY skills only
**Duplicates:** Should be removed or symlinked

---

## Section 5: Recommendations

### 5.1 Immediate Actions (BLOCKERS)

1. **Remove `.codex/skills/` duplicates of deprecated hive skills**
   - These skills were deprecated but `.codex/skills/` still has them
   - This is the ROOT CAUSE of context pollution

2. **Remove `.codex/skills/` duplicates of root skills**
   - `spec-distillation`, `research-methodology`, `ralph-tasking`, `platform-adapter`, `agent-role-boundary`
   - Keep `skills/` as primary, remove `.codex/` duplicates

3. **Remove `.roo/skills/` duplicates of `.qwen/skills/`**
   - `writing-skills`, `skill-judge`, `self-improving-agent`
   - Keep `.qwen/` as primary

4. **Remove `.opencode/skills/hivemind-skill-writer` duplicate**
   - Keep `skills/hivemind-skill-writer` as primary

### 5.2 Before Implementing Context-Intelligence-Entry

1. **Consolidate context-related skills:**
   - Merge `context-integrity`, `entry-resolution`, `delegation-framework` concepts into new `context-intelligence-entry`
   - Remove `.codex/skills/` duplicates

2. **Refine trigger descriptions:**
   - Ensure new skill has unique, non-overlapping triggers
   - Consider making it the MUST-LOAD entry point that coordinates other skills

### 5.3 Long-Term Strategy

1. **Single source of truth per skill**
   - Each skill should exist in ONE location
   - Platform directories should symlink or reference, not copy

2. **Deprecated skills should be inaccessible**
   - Move to truly hidden location OR
   - Remove from platform scanning paths

3. **Symlinks for platform compatibility**
   - If skill needed in multiple platforms, use symlinks
   - Single source of truth, multiple access points

---

## Section 6: Impact on Context-Intelligence-Entry

### 6.1 Conflict with Existing `context-integrity`

The planned `context-intelligence-entry` will conflict with:
- `skills/_deprecated_hive/context-integrity` (deprecated but still in `_deprecated_hive`)
- `.codex/skills/context-integrity` (active duplicate of deprecated)

**Resolution:** 
- Remove `.codex/skills/context-integrity`
- Ensure `_deprecated_hive/` is not scanned by platforms
- New `context-intelligence-entry` supersedes `context-integrity`

### 6.2 Overlap with Entry Resolution

The `entry-resolution` skill concepts should be absorbed into `context-intelligence-entry`:
- Entry state detection (NEW, RESUMED, DEGRADED, DELEGATED, INTERRUPTED)
- Ambiguous intent resolution

**Resolution:**
- Remove `.codex/skills/entry-resolution`
- Concepts merged into new skill

### 6.3 Overlap with Delegation Framework

The `delegation-framework` skill concepts should be absorbed into branching skills:
- Delegation scope rules
- Chain of command
- Anti-patterns (scope bleed, creep, abandonment)

**Resolution:**
- Remove `.codex/skills/delegation-framework`
- Concepts merged into new `delegation-boundary` branching skill

---

## Section 7: Next Steps

### Priority Order

1. **Remove pollution sources** (immediate blocker)
   - Delete `.codex/skills/*.md` duplicates
   - Delete `.roo/skills/*.md` duplicates
   - Delete `.opencode/skills/hivemind-skill-writer.md`

2. **Verify deprecation is effective**
   - Confirm `_deprecated_hive/` is not scanned
   - Test skill loading doesn't pick up deprecated skills

3. **Implement Context-Intelligence-Entry**
   - Core skill with refined triggers
   - Absorb concepts from deprecated skills
   - Add branching skills

4. **Document hierarchy**
   - Clear authority for each skill
   - Platform-specific access patterns

---

## Appendix: File Counts

| Directory | Total Skills | Unique | Duplicates |
|-----------|-------------|--------|------------|
| `skills/` | 8 | 7 | 1 (hivemind-skill-writer) |
| `skills/_deprecated_hive/` | 7 | 0 | 7 (all duplicated in .codex) |
| `.opencode/skills/` | 1 | 0 | 1 (duplicate of skills/) |
| `.codex/skills/` | 50+ | 0 | 50+ (all duplicates) |
| `.qwen/skills/` | 7 | 4 | 3 (duplicated in .roo) |
| `.roo/skills/` | 3 | 0 | 3 (all duplicates of .qwen) |
| `.github/skills/` | 38 | 38 | 0 (primary source) |

**Total unique skills:** ~52
**Total duplicate files:** ~65+
**Duplication rate:** ~55%

---

**Audit Status:** COMPLETE
**Next Action:** User decision on consolidation strategy before implementation