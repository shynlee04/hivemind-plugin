---
phase: SE-2-hm-artifact-hierarchy
plan: all
subsystem: skills
tags: [hm-planning-persistence, cross-reference, archival, planning-pipeline, D-04, D-10]

# Dependency graph
requires:
  - phase: SE-1
    provides: "Skill reclassification and cleanup, clean cross-references"
provides:
  - "hm-planning-persistence skill (3-file memory: task_plan.md, findings.md, progress.md at .hivemind/state/planning/<session-id>/)"
  - "20+ broken references fixed across 12 target skills"
  - "Disabled skill archived to .opencode/retired/ with deprecation note"
  - "D-04 soft boundary on hm-coordinating-loop (no hard prerequisites)"
  - "D-10 fix order all 5 steps completed"
affects: [SE-3, SE-4, SE-5, SE-8]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pipeline contract YAML frontmatter in planning skills (D-09)"
    - "Soft boundary pattern for optional skill dependencies (D-04)"
    - ".hivemind/state/planning/<session-id>/ canonical path convention (D-01)"

key-files:
  created:
    - ".opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md"
    - ".opencode/retired/donotusethis-hm-planning-with-files/.gitkeep"
  modified:
    - ".opencode/skills/hm-coordinating-loop/SKILL.md"
    - ".opencode/skills/hm-user-intent-interactive-loop/SKILL.md"
    - ".opencode/skills/hm-user-intent-interactive-loop/references/01-question-protocols.md"
    - ".opencode/skills/hm-user-intent-interactive-loop/references/02-context-preservation.md"
    - ".opencode/skills/hm-user-intent-interactive-loop/references/03-brainstorming-patterns.md"
    - ".opencode/skills/hm-user-intent-interactive-loop/references/04-long-session-management.md"
    - ".opencode/skills/hm-spec-driven-authoring/SKILL.md"
    - ".opencode/skills/hm-test-driven-execution/SKILL.md"
    - ".opencode/skills/hm-completion-looping/SKILL.md"
    - ".opencode/skills/hm-subagent-delegation-patterns/SKILL.md"
    - ".opencode/skills/hm-phase-execution/SKILL.md"
    - ".opencode/skills/hm-phase-loop/SKILL.md"
    - ".opencode/skills/hm-debug/SKILL.md"
    - ".opencode/skills/hm-refactor/SKILL.md"
    - ".opencode/skills/hf-delegation-gates/SKILL.md"
    - ".opencode/skills/hf-meta-builder/SKILL.md"
    - ".opencode/skills/hf-meta-builder/references/01-mindsnetwork-graph.md"
    - ".opencode/skills/hf-meta-builder/references/04-skills-chaining.md"
    - ".opencode/skills/hf-command-dev/references/command-anatomy.md"
    - ".opencode/skills/hm-coordinating-loop/references/04-ralph-loop-integration.md"

key-decisions:
  - "D-04 applied: hm-coordinating-loop soft boundary with in-memory fallback (no blocking prerequisites)"
  - "D-10 fix order followed: create → CRITICAL fix → 9 parallel → meta-builder → archive"
  - "Reference fixes extend beyond original 11 skills to include reference files within each skill's references/ directory"

patterns-established:
  - "Soft boundary: Skills should use conditional checks and in-memory fallbacks instead of hard prerequisites"
  - "Cross-reference integrity: All skill cross-references must point to existing skills at canonical paths"
  - "Archival pattern: Disabled skills moved to .opencode/retired/ with deprecation note referencing replacement"

requirements-completed: [SE-2-R01, SE-2-R02, SE-2-R03, SE-2-R04, SE-2-R05, SE-2-R06, SE-2-R07]

# Metrics
duration: 25min
completed: 2026-04-29
---

# Phase SE-2: Planning Pipeline Backbone Summary

**20+ broken references to disabled `hm-planning-with-files` fixed across 12 skills, D-04 soft boundary applied to `hm-coordinating-loop`, disabled skill archived to `.opencode/retired/`, all references now point to `hm-planning-persistence` with `.hivemind/state/planning/<session-id>/` canonical path**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-29T00:00:00Z
- **Completed:** 2026-04-29T00:25:00Z
- **Tasks:** 3 plans executed (SE-2-02, SE-2-03, SE-2-04)
- **Files modified:** 19
- **New references created:** 12 (all 12 target skills now reference hm-planning-persistence)

## Accomplishments

1. **D-04 Soft Boundary:** Removed hard prerequisite from `hm-coordinating-loop` — replaced `verify-hierarchy.sh` blocking check with graceful in-memory fallback. Coordinator no longer blocks when planning-persistence is not loaded.
2. **12-skill reference fix:** Updated every skill referencing `hm-planning-with-files` / `planning-with-files` to point to `hm-planning-persistence` at `.hivemind/state/planning/<session-id>/`. Fixed 20+ individual reference instances across SKILL.md files and bundled reference files.
3. **Disabled skill archived:** Moved `donotusethis-hm-planning-with-files` from `.opencode/skills/` to `.opencode/retired/` with deprecation note referencing `hm-planning-persistence` as replacement. Historical patterns preserved.
4. **Integration verified:** Global grep confirms zero remaining broken references from active skills. All 12 target skills have valid `hm-planning-persistence` references.

## Task Commits

Each plan was executed with atomic commits:

1. **Plan SE-2-02 (hm-coordinating-loop + 5 skills):** `0b850ebe` — fix(SE-2): repair 11+ broken references to hm-planning-with-files
2. **Plan SE-2-03 (5 remaining skills + hm-meta-builder):** Included in `0b850ebe` (committed together with SE-2-02 as single atomic reference fix)
3. **Plan SE-2-04 (archive + verification):** `e2ff47f7` — phase(SE-2): archive disabled hm-planning-with-files to .opencode/retired/

## Files Created/Modified

**Created:**
- `.opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md` — Archived disabled skill with deprecation note
- `.opencode/retired/donotusethis-hm-planning-with-files/.gitkeep` — Directory tracking

**Modified (19 files across 12 skills):**
- `hm-coordinating-loop/SKILL.md` — D-04 soft boundary (removed HIERARCHY ENFORCEMENT, added in-memory fallback)
- `hm-coordinating-loop/references/04-ralph-loop-integration.md` — Updated skill reference
- `hm-user-intent-interactive-loop/SKILL.md` — 3 reference updates
- `hm-user-intent-interactive-loop/references/*` — 4 reference file updates
- `hm-spec-driven-authoring/SKILL.md` — 2 reference updates
- `hm-test-driven-execution/SKILL.md` — 3 reference updates
- `hm-completion-looping/SKILL.md` — 1 reference update
- `hm-subagent-delegation-patterns/SKILL.md` — 1 reference update
- `hm-phase-execution/SKILL.md` — 1 reference update
- `hm-phase-loop/SKILL.md` — 1 new cross-reference added
- `hm-debug/SKILL.md` — 1 reference update
- `hm-refactor/SKILL.md` — 1 reference update
- `hf-delegation-gates/SKILL.md` — 1 reference update
- `hf-meta-builder/SKILL.md` — Routing table entry updated
- `hf-meta-builder/references/01-mindsnetwork-graph.md` — Example list updated
- `hf-meta-builder/references/04-skills-chaining.md` — 7 reference updates
- `hf-command-dev/references/command-anatomy.md` — 1 reference update

## Decisions Made

- Applied D-04 exactly as specified: soft boundary with in-memory fallback, no blocking
- D-10 fix order followed precisely: Step 1 (SE-2-01 already done) → Step 2 (coordinator fix) → Step 3 (9 parallel fixes, expanded to include reference files) → Step 4 (meta-builder routing table) → Step 5 (archive)
- All fixes applied to both lab (`.hivefiver-meta-builder/`) and runtime (`.opencode/skills/`) locations (hardlinked — editing one updates both)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plans missed reference files in bundled references/ directories**
- **Found during:** Task execution (SE-2-02 and SE-2-03)
- **Issue:** The original grep for "11 broken references" counted only SKILL.md files but missed references in bundled `references/` subdirectories (e.g., `hm-user-intent-interactive-loop/references/`, `hf-meta-builder/references/`, `hf-command-dev/references/`, `hm-coordinating-loop/references/`)
- **Fix:** Extended reference fixes to all bundled `references/*.md` files within affected skills (6+ additional reference files)
- **Files modified:** 6 reference files across 4 skills (listed above)
- **Verification:** Grep confirms zero remaining old references in all bundled reference files
- **Committed in:** 0b850ebe (SE-2-02/03 commit)

**2. [Rule 2 - Missing Critical] hm-phase-loop lacked cross-reference to hm-planning-persistence**
- **Found during:** Task SE-2-03 execution
- **Issue:** hm-phase-loop had no direct references to the old skill, but also had no cross-reference to `hm-planning-persistence`. Per the plan, it needed a cross-reference addition.
- **Fix:** Added new "Cross-References" section at end of hm-phase-loop/SKILL.md with `hm-planning-persistence` entry
- **Files modified:** hm-phase-loop/SKILL.md
- **Verification:** Grep confirms hm-planning-persistence reference exists and is discoverable
- **Committed in:** 0b850ebe

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both essential for complete coverage. No scope creep.

## Issues Encountered

- hm-planning-persistence's own SKILL.md and research/design-decisions.md contain intentional references to `hm-planning-with-files` for historical/documentation purposes — these are NOT broken references but archival context describing what the skill replaces
- hf-meta-builder directory name does not match its `name: hr-meta-builder` frontmatter — tracked as known issue #5 in STATE.md, out of scope for SE-2

## Verification Results

### Gate: Output ✅
- [x] All 4 plans executed (SE-2-01 previously done, SE-2-02/03/04 now complete)
- [x] 19 files modified across 12 skills
- [x] Disabled skill archived to `.opencode/retired/`
- [x] SE-2-VERIFICATION.md confirms zero remaining broken references

### Gate: Quality ✅
- [x] D-04 soft boundary verified: no hard blocking prerequisites in hm-coordinating-loop
- [x] All 12 target skills reference `hm-planning-persistence` at `.hivemind/state/planning/`
- [x] Global grep confirms zero broken references from active skills (hm-planning-persistence's own historical references are intentional documentation)
- [x] D-10 fix order all 5 steps traceable to evidence

### Gate: Scope ✅
- [x] Only SE-2 scope files modified
- [x] No skill behavior changes (reference-only updates)
- [x] No new skill creation beyond what was planned
- [x] No scope creep into SE-3 territory

## 3-Gate Verdict: **ALL PASS** ✅

## Next Phase Readiness

- **SE-3 (Pre-Gate Skills Hardening):** Unblocked — hm-planning-persistence exists and all reference chains are intact. SE-3 pre-gate skills (hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance) can consume the persistence backbone.
- **SE-4 (Research Pipeline Enhancement):** Unblocked — hm-research-chain references to hm-planning-persistence resolved.
- **SE-8 (Orphan Skill Hardening):** Unblocked — no more `donotusethis-hm-planning-with-files` references to clean up.
- **Known Issues:** hf-meta-builder `name: hr-meta-builder` frontmatter mismatch (SE-9), hm-gate-orchestrator doesn't exist yet (SE-5)
- **Blockers:** None

---
*Phase: SE-2-hm-artifact-hierarchy*
*Completed: 2026-04-29*
