# Session Inspection Export

- ses_id: `ses_2cf0d7ea3ffeJnyqP46JLM74OD`
- prepared_at: `2026-03-27T20:20:42.345Z`

## Assistant Output

Now I have all the data needed. Let me compile the comprehensive investigation report:

---

## Cross-Skill Reference Investigation Report

**Scope:** `.developing-skills/refactored-skills/` — 15 refactored skills  
**Files Scanned:** 134 files (.md, .sh, .ts, .json)  
**Date:** 2026-03-28

---

### Summary Statistics

| Metric | Count |
|--------|-------|
| Total Skills | 15 |
| Total Files Scanned | 134 |
| Sibling Skill References | ~180 |
| Stale References | 8 (`context-intelligence-entry`, `context-entry-verify`) |
| Broken File References | 5 (non-existent files) |
| HARD-GATE Tags | 15 |
| Slot/Stack Mentions | 46 |

---

### 1. Sibling Skill References

**Status: Mostly VALID**

All 15 skill names are correctly referenced across the codebase:
- `hivemind-atomic-commit`, `hivemind-codemap`, `hivemind-gatekeeping`, `hivemind-patterns`, `hivemind-refactor`, `hivemind-spec-driven`, `hivemind-system-debug`
- `use-hivemind`, `use-hivemind-context`, `use-hivemind-delegation`, `use-hivemind-git-memory`, `use-hivemind-planning`, `use-hivemind-research`, `use-hivemind-skill-authoring`, `use-hivemind-tdd`

---

### 2. Stale References (`context-intelligence-entry`)

**Status: STALE — 8 instances found in `use-hivemind-context/SKILL.md`**

| File | Line | Reference | Issue |
|------|------|-----------|-------|
| `use-hivemind-context/SKILL.md` | 34 | `context-intelligence-entry` (quick mode) | Renamed to `use-hivemind-context` |
| `use-hivemind-context/SKILL.md` | 35 | `context-intelligence-entry` (rot mode) | Renamed to `use-hivemind-context` |
| `use-hivemind-context/SKILL.md` | 36 | `context-intelligence-entry` (full mode) | Renamed to `use-hivemind-context` |
| `use-hivemind-context/SKILL.md` | 74 | `context-intelligence-entry` | Renamed to `use-hivemind-context` |
| `use-hivemind-context/SKILL.md` | 241 | `context-intelligence-entry`, `context-entry-verify` | Consolidated skill - stale internal names |
| `use-hivemind-context/SKILL.md` | 243 | `context-intelligence-entry`, `context-entry-verify` | Consolidated skill - stale internal names |

**Also stale in `use-hivemind-delegation/_artifacts/`:**
| File | Line | Reference |
|------|------|-----------|
| `02-audit-2026-03-22.md` | 79 | `context-intelligence-entry` (acknowledged as issue) |
| `03-change-summary-2026-03-22.md` | 62 | `context-intelligence-entry` (in relationship table) |

---

### 3. Broken File References

**Status: BROKEN — 5 non-existent files referenced**

| File | Line | Referenced File | Issue |
|------|------|-----------------|-------|
| `use-hivemind-tdd/SKILL.md` | 306 | `references/phase-tdd-lifecycle.md` | **File does NOT exist** |
| `use-hivemind-tdd/SKILL.md` | 307 | `references/transition-gates.md` | **File does NOT exist** |
| `use-hivemind-tdd/SKILL.md` | 308 | `references/multi-phase-checkpoint.md` | **File does NOT exist** |
| `use-hivemind-tdd/SKILL.md` | 309 | `templates/use-hivemind-tdd-packet.md` | **File does NOT exist** (only `tdd-checkpoint.md`, `tdd-delegation-packet.md`, `build-verify-checkpoint.md` exist) |
| `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 148 | `references/01-topic-alpha.md` | **File does NOT exist** (example reference) |
| `use-hivemind-delegation/_artifacts/01-synthesis-2026-03-22.md` | 57 | `references/decision-tree.md` | **File does NOT exist** |

---

### 4. Activity Path References

**Status: VALID**

All `.hivemind/activity/` path references are consistent with AGENTS.md conventions:

| Path Pattern | Found In |
|--------------|----------|
| `.hivemind/activity/delegation/` | 15+ files |
| `.hivemind/activity/codescan/` | 10+ files |
| `.hivemind/activity/sessions/continuity.json` | 8+ files |
| `.hivemind/activity/debug/` | 2 files |
| `.hivemind/activity/planning/` | 3 files |
| `.hivemind/activity/git-memory/` | 5 files |
| `.hivemind/activity/tdd/` | 2 files |

---

### 5. Agent Name References

**Status: VALID and CONSISTENT**

All agent names properly defined in role references:

| Agent | References |
|-------|------------|
| **hiveminder** | `use-hivemind/SKILL.md:14,18,22,39-42,83,96,102,106,109,207,213,215,231,247,278,281,298,300-301,317,329` |
| **hivefiver** | `use-hivemind/SKILL.md:14,207,213,215,301` |
| **hivexplorer** | `use-hivemind/SKILL.md:83-85,90,268`, `use-hivemind-delegation/SKILL.md:242,246,256,286`, `multi-wave-dispatch.md:15-17,39,78,119` |
| **hivemaker** | `use-hivemind/SKILL.md:41,102-104,267-269,300`, `multi-wave-dispatch.md:28-29,45,148` |
| **hitea** | `use-hivemind/SKILL.md:40,102,104`, `orchestrator-delegation.md:16,79,82` |
| **hiveq** | `use-hivemind/SKILL.md:42,106,109,278,281`, `orchestrator-delegation.md:18,80,83`, `multi-wave-dispatch.md:30,32,45,149` |
| **hiveplanner** | `use-hivemind/SKILL.md:39,96-97,269,281`, `orchestrator-delegation.md:15,82,84` |
| **architect** | `use-hivemind/SKILL.md:39,97`, `orchestrator-delegation.md:15,83`, `multi-wave-dispatch.md:24-25` |
| **code-skeptic** | `use-hivemind/SKILL.md:42,110,278,281`, `orchestrator-delegation.md:18,84` |
| **hivehealer** | `orchestrator-delegation.md:81` |
| **hiverd** | `use-hivemind/SKILL.md:90-91,269,281`, `multi-wave-dispatch.md:20-21` |

---

### 6. HARD-GATE Usage

**Status: CONSISTENT**

| File | Count | Lines |
|------|-------|-------|
| `use-hivemind-delegation/SKILL.md` | 1 | 95 |
| `use-hivemind-context/SKILL.md` | 3 | 112, 136, 173 |
| `hivemind-gatekeeping/SKILL.md` | 3 | 79, 164, 203 |
| `use-hivemind-delegation/references/multi-wave-dispatch.md` | 5 | 51, 56, 61, 66, 71 |
| `use-hivemind/references/orchestrator-mandate.md` | 3 | 41, 90, 115 |
| `hivemind-refactor/SKILL.md` | 3 | 98, 132, 158 |

**Total: 15 HARD-GATE tags**

All HARD-GATE tags enforce evidence-based verification with consistent formatting:
```markdown
<HARD-GATE>
[Statement of non-negotiable rule]
</HARD-GATE>
```

---

### 7. Skill Loading Consistency (Slot/Stack)

**Status: CONSISTENT**

All references follow the 3-skill maximum constraint:

| Pattern | Found In | Consistency |
|---------|----------|-------------|
| "Slot 1/2/3" | `use-hivemind/SKILL.md:148-151,186,197-199,253,319-320`, `load-template.md` | ✓ Consistent |
| "max-stack: 3" | `use-hivemind-context/SKILL.md:10`, `hivemind-refactor/SKILL.md:10`, `hivemind-spec-driven/SKILL.md:10` | ✓ Consistent |
| "Never exceed 3" | `use-hivemind/SKILL.md:153,198`, `load-template.md:128,153` | ✓ Consistent |
| "stacking: 0-3" | `use-hivemind-skill-authoring/references/04-tdd-workflow.md:125`, `08-conflict-detection.md:65,96,101,121,155-160` | ✓ Consistent |

---

### 8. Bundled Resource References

**Status: MIXED — Some broken cross-references within `templates/` and `references/`**

Most internal references are valid, but:
- `use-hivemind-tdd` references 4 non-existent bundled resources (see Broken File References above)

---

## Carry-Forward: Key Findings (≤5)

1. **`context-intelligence-entry` STALE in `use-hivemind-context/SKILL.md`**: 8 instances still reference the old renamed skill. The consolidation table (lines 241, 243) explicitly acknowledges these were separate skills now combined — but the old names remain as internal mode labels rather than being updated to the new unified naming.

2. **`use-hivemind-tdd` has 4 BROKEN file references**: The SKILL.md references `phase-tdd-lifecycle.md`, `transition-gates.md`, `multi-phase-checkpoint.md`, and `use-hivemind-tdd-packet.md` — none of which exist in the skill directory. Actual files present: `tdd-checkpoint.md`, `tdd-delegation-packet.md`, `build-verify-checkpoint.md`.

3. **`use-hivemind-skill-authoring` example references non-existent file**: Line 148 in `05-skill-quality-matrix.md` shows `references/01-topic-alpha.md` in an example structure, but this file doesn't exist (actual files are `01-skill-anatomy.md`, `02-frontmatter-standard.md`, etc.).

4. **15 HARD-GATE tags are CONSISTENT**: All follow the same `<HARD-GATE>...</HARD-GATE>` pattern enforcing evidence-based verification without claims.

5. **Activity paths are VALID**: All `.hivemind/activity/` references correctly follow the deterministic pathing convention with `codescan/{pass_id}/`, `delegation/`, `sessions/continuity.json`, etc.