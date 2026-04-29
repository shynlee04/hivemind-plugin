---
phase: SE-2-hm-artifact-hierarchy
plan: 03
type: execute
wave: 2
depends_on: [SE-2-01]
files_modified:
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-execution/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-loop/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-debug/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-refactor/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hf-delegation-gates/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md"
  - ".opencode/skills/hm-phase-execution/SKILL.md"
  - ".opencode/skills/hm-phase-loop/SKILL.md"
  - ".opencode/skills/hm-debug/SKILL.md"
  - ".opencode/skills/hm-refactor/SKILL.md"
  - ".opencode/skills/hf-delegation-gates/SKILL.md"
  - ".opencode/skills/hm-meta-builder/SKILL.md"
autonomous: true
requirements: [SE-2-R04, SE-2-R05]
must_haves:
  truths:
    - "hm-phase-execution references hm-planning-persistence with .hivemind/state/planning/ path"
    - "hm-phase-loop has cross-reference to hm-planning-persistence"
    - "hm-debug references hm-planning-persistence"
    - "hm-refactor references hm-planning-persistence"
    - "hm-meta-builder routing table updated with hm-planning-persistence"
    - "All 6 skills have zero remaining references to hm-planning-with-files"
  artifacts:
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md"
      provides: "Fixed routing table with hm-planning-persistence entry"
      contains: "hm-planning-persistence"
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-execution/SKILL.md"
      provides: "Fixed references to hm-planning-persistence"
      contains: "hm-planning-persistence"
  key_links:
    - from: "hm-meta-builder routing table"
      to: "hm-planning-persistence"
      via: "routing entry for multi-step planning"
      pattern: "hm-planning-persistence"
</must_haves>
---

<objective>
Fix the remaining 5 skill references (hm-phase-execution, hm-phase-loop, hm-debug, hm-refactor, hf-delegation-gates) and update the hm-meta-builder routing table. These run in parallel with Plan 02 (Wave 2) since they modify different files.

Purpose: Complete the 11-reference fix cycle. hm-meta-builder routing table is done last per D-10 fix order (step 4 of 5). All references must point to hm-planning-persistence at `.hivemind/state/planning/`.
Output: 6 skills with corrected references in both lab and .opencode/ directories.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-CONTEXT.md

<interfaces>
<!-- Reference locations to fix (from grep results) -->

hm-phase-execution (1 reference):
- Line 189: `| hm-planning-with-files | Owns task_plan.md tracking. This skill reads and updates phase plans. |`
  → Fix: `| hm-planning-persistence | Owns task_plan.md tracking in .hivemind/state/planning/<session-id>/. This skill reads and updates phase plans. |`

hm-debug (1 reference):
- Line 169: `| hm-planning-with-files | Tracks task plans. This skill tracks debug session state. |`
  → Fix: `| hm-planning-persistence | Tracks task plans in .hivemind/state/planning/<session-id>/. This skill tracks debug session state. |`

hm-refactor (1 reference):
- Line 151: `| hm-planning-with-files | Owns task planning. This skill adds refactor steps to task_plan.md. |`
  → Fix: `| hm-planning-persistence | Owns task planning in .hivemind/state/planning/<session-id>/. This skill adds refactor steps to task_plan.md. |`

hf-delegation-gates (1 soft reference):
- Line 129: `Task scope written in a scope document (conventionally task_plan.md if the planning-with-files skill is loaded, or any documented scope file)`
  → Fix: `Task scope written in a scope document (conventionally .hivemind/state/planning/<session-id>/task_plan.md if hm-planning-persistence is loaded, or any documented scope file)`
  Note: This already had a graceful fallback ("or any documented scope file") — update the reference only.

hm-phase-loop (0 direct references to hm-planning-with-files):
- No grep matches. However, per SE-2-CONTEXT.md, this skill references `.planning/` paths (GSD convention) that should be updated to `.hivemind/state/planning/` per D-01.
  → Add cross-reference to hm-planning-persistence in cross-references section
  → Update `.planning/phases/` references to note `.hivemind/state/planning/<session-id>/` as canonical

hm-meta-builder (1 reference + routing table update):
- Line 72: `| Multi-step planning needed | planning-with-files |`
  → Fix: `| Multi-step planning needed | hm-planning-persistence |`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Fix 5 Remaining Skill References — hm-phase-execution, hm-phase-loop, hm-debug, hm-refactor, hf-delegation-gates</name>
  <files>
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-execution/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-loop/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-debug/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-refactor/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hf-delegation-gates/SKILL.md
    .opencode/skills/hm-phase-execution/SKILL.md
    .opencode/skills/hm-phase-loop/SKILL.md
    .opencode/skills/hm-debug/SKILL.md
    .opencode/skills/hm-refactor/SKILL.md
    .opencode/skills/hf-delegation-gates/SKILL.md
  </files>
  <action>
Fix ALL references to `hm-planning-with-files` / `planning-with-files` in the remaining 5 skills. Apply to BOTH lab AND .opencode/ locations.

**hm-phase-execution** (1 direct reference):
- Line 189: Replace `hm-planning-with-files` → `hm-planning-persistence`. Add `.hivemind/state/planning/<session-id>/` path clarification.
- Also check for any `.planning/phases/` path references that should be updated per D-01.

**hm-phase-loop** (0 direct references — needs cross-reference ADDITION):
- No grep matches for `planning-with-files`. However, lines 54, 65, 143 reference `.planning/phases/` paths.
- Add cross-reference row in the appropriate table: `| hm-planning-persistence | Owns persistent planning state in .hivemind/state/planning/<session-id>/. This skill reads phase plans from there when available. |`
- Update path references from `.planning/phases/` to note `.hivemind/state/planning/<session-id>/` as canonical, with `.planning/` as mirror.

**hm-debug** (1 reference):
- Line 169: Replace `hm-planning-with-files` → `hm-planning-persistence`. Add `.hivemind/state/planning/<session-id>/` path.

**hm-refactor** (1 reference):
- Line 151: Replace `hm-planning-with-files` → `hm-planning-persistence`. Add `.hivemind/state/planning/<session-id>/` path.

**hf-delegation-gates** (1 soft reference):
- Line 129: Replace `planning-with-files` → `hm-planning-persistence`. Update path to `.hivemind/state/planning/<session-id>/task_plan.md`. Preserve existing fallback language ("or any documented scope file").

**Apply to BOTH locations for EACH skill.** Preserve formatting. Reference-only fixes — no behavior changes.
  </action>
  <verify>
    <automated>
for skill in hm-phase-execution hm-debug hm-refactor hf-delegation-gates; do
  lab=".hivefiver-meta-builder/skills-lab/active/refactoring/$skill/SKILL.md"
  rt=".opencode/skills/$skill/SKILL.md"
  if grep -q "planning-with-files" "$lab" 2>/dev/null; then echo "FAIL: $skill (lab) still references old skill"; exit 1; fi
  grep -q "hm-planning-persistence" "$lab" 2>/dev/null || { echo "FAIL: $skill (lab) missing new reference"; exit 1; }
  if grep -q "planning-with-files" "$rt" 2>/dev/null; then echo "FAIL: $skill (runtime) still references old skill"; exit 1; fi
  grep -q "hm-planning-persistence" "$rt" 2>/dev/null || { echo "FAIL: $skill (runtime) missing new reference"; exit 1; }
done

# Special check for hm-phase-loop (no old refs to remove, but must have new cross-reference)
grep -q "hm-planning-persistence" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-phase-loop/SKILL.md || { echo "FAIL: hm-phase-loop (lab) missing new cross-reference"; exit 1; }
grep -q "hm-planning-persistence" .opencode/skills/hm-phase-loop/SKILL.md || { echo "FAIL: hm-phase-loop (runtime) missing new cross-reference"; exit 1; }

echo "ALL 5 SKILL REFERENCES VERIFIED"
    </automated>
  </verify>
  <done>
All 5 skills updated in both lab and .opencode/. No remaining old references. hm-phase-loop has new cross-reference to hm-planning-persistence. All paths clarified with `.hivemind/state/planning/<session-id>/`. Reference-only fixes — no behavior changes.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Fix hm-meta-builder Routing Table (per D-10 fix order step 4)</name>
  <files>
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md
    .opencode/skills/hm-meta-builder/SKILL.md
  </files>
  <action>
Update the hm-meta-builder routing table per D-10 fix order step 4. Apply to BOTH lab AND .opencode/ locations.

**Changes to apply:**

1. **Line 72 — Routing table entry:**
   Change: `| Multi-step planning needed | planning-with-files |`
   To: `| Multi-step planning needed | hm-planning-persistence |`

2. **Ensure hm-planning-persistence appears in all relevant routing contexts:**
   - Check if the routing table has a "Persistence" or "State Management" category
   - If such a category exists, add: `| Task state across sessions | hm-planning-persistence |`
   - If no persistence category exists, add it with hm-planning-persistence as the entry

3. **Update any cross-reference sections** that mention `planning-with-files` to reference `hm-planning-persistence` instead (check full file for any additional references).

4. **Verify the routing entry is discoverable:**
   The table row format should match existing conventions in the file (pipe-delimited, skill name in backticks).

**Apply to BOTH locations.** Preserve table formatting and alignment.
  </action>
  <verify>
    <automated>
# Verify routing table fix
! grep -q "planning-with-files" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md || { echo "FAIL: hm-meta-builder (lab) still references old skill"; exit 1; }
grep -q "hm-planning-persistence" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-meta-builder/SKILL.md || { echo "FAIL: hm-meta-builder (lab) missing hm-planning-persistence in routing table"; exit 1; }

! grep -q "planning-with-files" .opencode/skills/hm-meta-builder/SKILL.md || { echo "FAIL: hm-meta-builder (runtime) still references old skill"; exit 1; }
grep -q "hm-planning-persistence" .opencode/skills/hm-meta-builder/SKILL.md || { echo "FAIL: hm-meta-builder (runtime) missing hm-planning-persistence"; exit 1; }

echo "HM-META-BUILDER ROUTING TABLE VERIFIED"
    </automated>
  </verify>
  <done>
hm-meta-builder routing table updated in both lab and .opencode/. `planning-with-files` replaced with `hm-planning-persistence`. Routing entry discoverable. Step 4 of D-10 fix order complete.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Skill routing → Correct skill loading | hm-meta-builder routing table must point to valid, existing skills |
| Cross-reference chains | All 6 skills' reference updates must be consistent |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SE2-07 | Denial of Service | hm-meta-builder routing to non-existent skill | mitigate | Routing table updated to hm-planning-persistence which exists (created in Plan 01). Verified by grep. |
| T-SE2-08 | Information Disclosure | Stale .planning/ paths in hm-phase-loop | mitigate | hm-phase-loop updated to reference .hivemind/state/planning/ as canonical per D-01, with .planning/ as mirror. |
</threat_model>

<verification>
**Phase-level integration checks after Plan 03:**
1. Run `grep -r "planning-with-files" .opencode/skills/hm-phase-execution/` — must return EMPTY
2. Run `grep -r "planning-with-files" .opencode/skills/hm-meta-builder/` — must return EMPTY
3. Verify hm-meta-builder routing table has `hm-planning-persistence` entry
4. Verify hm-phase-loop has `hm-planning-persistence` cross-reference
</verification>

<success_criteria>
- [ ] All 5 skill references fixed (hm-phase-execution, hm-phase-loop, hm-debug, hm-refactor, hf-delegation-gates)
- [ ] hm-meta-builder routing table updated with hm-planning-persistence
- [ ] ZERO remaining references to `hm-planning-with-files` or `planning-with-files` in all 6 skills
- [ ] All fixes applied to BOTH lab and runtime locations
- [ ] No skill behavior changed — reference-only updates
</success_criteria>

<output>
After completion, create `.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-03-SUMMARY.md`
</output>
