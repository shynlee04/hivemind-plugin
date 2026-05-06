---
phase: AS-0
plan: agent-inventory-classification-audit
type: research-audit
autonomous: true
wave: 1
depends_on: []
requirements: [AS-0-INVENTORY, AS-0-CLASSIFY, AS-0-DEFECTS, AS-0-BODY-CATALOG]
---

# AS-0: Agent Inventory & Classification Audit — Plan

## Objective

Produce a complete inventory and classification matrix of all 59 agents (58 on disk + 1 ghost `explore`). Every agent gets quality-scored on frontmatter completeness, body depth, execution flow presence, and output contract clarity.

## Context

@AS-0-CONTEXT.md @../REQUIREMENTS.md @../ROADMAP.md

### Discovery Findings (from Stage 1 Research)
- 58 agent files confirmed on disk at `.opencode/agents/`
- 1 ghost agent (`explore`) confirmed missing from disk, referenced in AGENTS.md
- `hf-meta-builder` confirmed missing from disk BUT listed as available `subagent_type` — NEW DEFECT
- KI-02 (hf-prompter missing name:) **RESOLVED** — name: field present in current file
- KI-05 (test-router not in AGENTS.md) **RESOLVED** — test-router listed at line 303
- KI-06 (orchestrator 16-line stub) **RESOLVED** — now 69 lines with full XML body
- KI-07 (general thin stub) **RESOLVED** — now 49 lines with full XML body
- KI-01 description needs revision: agent file doesn't exist, not a name mismatch
- No `hr-meta-builder` reference found anywhere (KI-01 claim unverifiable)

## Tasks

### Task 1: Create AGENT-INVENTORY.md (type: auto)
Create comprehensive inventory at `phases/AS-0-agent-inventory-classification-audit/AGENT-INVENTORY.md` with all 10 sections:

1. **Inventory Summary** — Total count, lineage breakdown, quality distribution headlines
2. **Classification Matrix** — 59 rows × 11 columns: File, Name, Lineage, Depth, Temperature, Mode, Body Format, Quality Score, Lines, Body LOC, Defects
3. **GSD Agent Detail** — All 33 gsd-* agents with line count, step count, execution flow complexity
4. **Hivefiver Agent Detail** — All 6 hivefiver-* agents with permission models
5. **Core Agent Detail** — All 18 core agents with classification and frontmatter completeness
6. **hf-* Agent Detail** — 1 hf-* agent (hf-prompter) with current state analysis
7. **Defect Register** — Updated defects (11 current items) with resolved/active status
8. **Quality Distribution** — Counts and examples per tier
9. **Body Format Split** — Counts per format type
10. **Depth Distribution** — L0/L1/L2 breakdown
11. **Recommendations** — Archive, migrate, naming conventions

**Verification:** Count rows in matrix = 59, defect entries ≥ 9, classification consistent across tables.

### Task 2: Update STATE.md (type: auto)
Update `.planning/workstreams/agent-synthesis/STATE.md`:
- Mark AS-0 status as COMPLETE
- Update agent inventory counts
- Update defect counts
- Move AS-1 to IN-PROGRESS

**Verification:** STATE.md shows AS-0 = COMPLETE, AS-1 = IN-PROGRESS.

### Task 3: Update ROADMAP.md (type: auto)
Update `.planning/workstreams/agent-synthesis/ROADMAP.md`:
- Mark AS-0 as COMPLETE in phase status table
- Update known issues list with current defect status

**Verification:** AS-0 row shows COMPLETE status.

## Verification / Success Criteria

- [ ] AGENT-INVENTORY.md created with 11 sections (all required)
- [ ] Classification matrix: 59 rows (58 on-disk + 1 ghost explore)
- [ ] All 33 gsd-* agents cataloged with line counts
- [ ] All 6 hivefiver-* agents cataloged with permission models
- [ ] All 18 core agents cataloged with frontmatter completeness
- [ ] 1 hf-* agent (hf-prompter) cataloged
- [ ] Defect register updated: resolved/active/new defects tracked
- [ ] Body format split verified against actual file contents
- [ ] STATE.md updated: AS-0 COMPLETE, AS-1 IN-PROGRESS
- [ ] ROADMAP.md updated: AS-0 COMPLETE

## Output Spec
- `AGENT-INVENTORY.md` at `phases/AS-0-agent-inventory-classification-audit/`
- Updated `STATE.md` and `ROADMAP.md`
