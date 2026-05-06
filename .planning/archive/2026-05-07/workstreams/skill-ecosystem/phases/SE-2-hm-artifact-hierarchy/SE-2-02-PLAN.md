---
phase: SE-2-hm-artifact-hierarchy
plan: 02
type: execute
wave: 2
depends_on: [SE-2-01]
files_modified:
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-user-intent-interactive-loop/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-spec-driven-authoring/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-test-driven-execution/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-completion-looping/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-subagent-delegation-patterns/SKILL.md"
  - ".opencode/skills/hm-coordinating-loop/SKILL.md"
  - ".opencode/skills/hm-user-intent-interactive-loop/SKILL.md"
  - ".opencode/skills/hm-spec-driven-authoring/SKILL.md"
  - ".opencode/skills/hm-test-driven-execution/SKILL.md"
  - ".opencode/skills/hm-completion-looping/SKILL.md"
  - ".opencode/skills/hm-subagent-delegation-patterns/SKILL.md"
autonomous: true
requirements: [SE-2-R03, SE-2-R04]
must_haves:
  truths:
    - "hm-coordinating-loop no longer references hm-planning-with-files or verify-hierarchy.sh"
    - "hm-coordinating-loop uses graceful fallback to in-memory state when persistence not loaded"
    - "All 6 skills reference hm-planning-persistence with correct .hivemind/state/planning/ path"
    - "No skill references the disabled hm-planning-with-files after fixes"
  artifacts:
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md"
      provides: "Fixed coordinator with D-04 soft boundary (no hard prerequisite)"
      contains: "hm-planning-persistence"
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-user-intent-interactive-loop/SKILL.md"
      provides: "Fixed references to hm-planning-persistence"
      contains: "hm-planning-persistence"
  key_links:
    - from: "hm-coordinating-loop SKILL.md"
      to: "hm-planning-persistence"
      via: "cross-reference table and load instructions"
      pattern: "hm-planning-persistence"
    - from: "All fixed skills"
      to: ".hivemind/state/planning/"
      via: "updated path references"
      pattern: "\\.hivemind/state/planning"
---

<objective>
Fix the CRITICAL hm-coordinating-loop (D-04 soft boundary) and update 5 additional hm-* skills to reference `hm-planning-persistence` instead of the disabled `hm-planning-with-files`. Per D-10, hm-coordinating-loop is the priority fix because its HIERARCHY ENFORCEMENT script causes hard failures.

Purpose: Unblock all coordination workflows by removing the hard prerequisite on `planning-with-files`. All references must point to the new canonical persistence skill at `.hivemind/state/planning/`.
Output: 6 skills with corrected references in both lab and .opencode/ directories. hm-coordinating-loop no longer blocks when hm-planning-persistence is not loaded.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-CONTEXT.md
@.opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md
@.hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md

<interfaces>
<!-- Exact reference locations to fix (from grep results) -->

hm-coordinating-loop references (5 instances — ALL MUST BE FIXED):
- Line 23: `bash scripts/verify-hierarchy.sh coordinating-loop` — checks for `planning-with-files`
- Line 31: `planning-with-files` must be loaded (LAYER 2)
- Line 56: Load prerequisite skills: `planning-with-files` then `dispatching-parallel-agents`
- Line 410: `planning-with-files` — Maintains task_plan.md, findings.md, progress.md
- Line 420: `planning-with-files` — planning-with-files owns task-level persistent memory

hm-user-intent-interactive-loop references (3 instances):
- Line 156: File-based planning | `planning-with-files`
- Line 230: Use `planning-with-files` for multi-session work
- Line 396: `planning-with-files` | Use for multi-session planning

hm-spec-driven-authoring references (2 instances):
- Line 50: `hm-planning-with-files` | Persists multi-session plan/progress state
- Line 156: Boundaries with `hm-planning-with-files`

hm-test-driven-execution references (3 instances):
- Line 43: persist through `hm-planning-with-files`
- Line 50: `hm-planning-with-files` | Owns durable task/progress files
- Line 182: Boundaries with `hm-planning-with-files`

hm-completion-looping references (1 instance):
- Line 149: `hm-planning-with-files` | Owns task_plan.md tracking

hm-subagent-delegation-patterns references (1 instance):
- Line 191: `hm-planning-with-files` | Owns task_plan.md/findings.md/progress.md

Replacement pattern for ALL instances:
- `planning-with-files` → `hm-planning-persistence`
- `hm-planning-with-files` → `hm-planning-persistence`
- Add `.hivemind/state/planning/<session-id>/` path where it clarifies WHERE persistence happens
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Fix hm-coordinating-loop — D-04 Soft Boundary (CRITICAL per D-10)</name>
  <files>
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md
    .opencode/skills/hm-coordinating-loop/SKILL.md
  </files>
  <action>
Fix the CRITICAL hm-coordinating-loop per D-04 (soft boundary). Apply ALL changes to BOTH locations (lab source-of-truth + .opencode runtime).

**Changes to apply:**

1. **Replace HIERARCHY ENFORCEMENT section (lines 16-35):**
   Replace the entire `## HIERARCHY ENFORCEMENT — Run This FIRST` section with a soft boundary that does NOT block:
   ```
   ## Planning Context — Check Available
   
   This skill coordinates multi-agent workflows. Before beginning:
   
   1. **Check for planning state:**
      - If `hm-planning-persistence` is loaded: Read `.hivemind/state/planning/<session-id>/task_plan.md` for task inventory.
      - If `hm-planning-persistence` is not loaded: Build task inventory in-memory. Write to `.coordination/<session>/task_plan.md` for durability.
      - **DO NOT BLOCK** — proceed with whatever planning context is available.
   
   2. **Register this skill as loaded:**
      ```bash
      bash scripts/register-skill.sh coordinating-loop
      ```
      (Non-blocking — continues on failure)
   
   3. **State availability:**
      - Preferred: `hm-planning-persistence` provides structured task_plan.md, findings.md, progress.md
      - Fallback: In-memory task tracking with `.coordination/<session>/` directory
   ```

2. **Update "When This Skill Loads" (line 56):**
   Change: `Load prerequisite skills: planning-with-files then dispatching-parallel-agents.`
   To: `Check for available planning state: hm-planning-persistence (preferred) or in-memory fallback.`

3. **Update Cross-References (lines 404-421):**
   - Line 410: Change `| planning-with-files | Maintains task_plan.md...` to `| hm-planning-persistence | Maintains task_plan.md, findings.md, progress.md in .hivemind/state/planning/ |`
   - Line 420: Change `| planning-with-files | planning-with-files owns task-level persistent memory...` to `| hm-planning-persistence | hm-planning-persistence owns task-level persistent memory in .hivemind/state/planning/<session-id>/. This skill reads/writes those files as part of coordination but doesn't own them. |`

4. **Remove ALL hard blocking language:**
   - Remove "must be loaded" language
   - Remove "STOP." blocking directive
   - Remove `verify-hierarchy.sh` invocation
   - Replace with conditional checks that never block

**CRITICAL CONSTRAINT per D-04:** The skill MUST NOT block or exit when hm-planning-persistence is not loaded. Graceful fallback to in-memory state. Old behavior (hard prerequisite, verify-hierarchy.sh exits 1) is the exact thing being fixed.

**Apply changes to BOTH locations:**
1. Edit `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md` (source of truth)
2. Apply identical changes to `.opencode/skills/hm-coordinating-loop/SKILL.md` (runtime location)
  </action>
  <verify>
    <automated>
# Verify NO remaining references to old skill in coordinator
! grep -n "planning-with-files" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md || { echo "FAIL: Still references planning-with-files"; exit 1; }

# Verify new reference exists
grep -q "hm-planning-persistence" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md || { echo "FAIL: No reference to hm-planning-persistence"; exit 1; }

# Verify D-04: No hard blocking prerequisite
! grep -q "must be loaded" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md || { echo "FAIL: Hard prerequisite language still present"; exit 1; }
! grep -q "If hierarchy check fails.*STOP" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md || { echo "FAIL: Blocking STOP directive still present"; exit 1; }

# Verify graceful fallback exists
grep -q "in-memory" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md || { echo "FAIL: No in-memory fallback described"; exit 1; }

echo "COORDINATOR FIX VERIFIED"
    </automated>
  </verify>
  <done>
hm-coordinating-loop no longer references `hm-planning-with-files` or `verify-hierarchy.sh`. All references updated to `hm-planning-persistence`. D-04 satisfied: graceful fallback to in-memory state. No blocking prerequisites. Applied to BOTH lab and .opencode locations.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Fix 5 Skill References — hm-user-intent-interactive-loop, hm-spec-driven-authoring, hm-test-driven-execution, hm-completion-looping, hm-subagent-delegation-patterns</name>
  <files>
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-user-intent-interactive-loop/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-spec-driven-authoring/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-test-driven-execution/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-completion-looping/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-subagent-delegation-patterns/SKILL.md
    .opencode/skills/hm-user-intent-interactive-loop/SKILL.md
    .opencode/skills/hm-spec-driven-authoring/SKILL.md
    .opencode/skills/hm-test-driven-execution/SKILL.md
    .opencode/skills/hm-completion-looping/SKILL.md
    .opencode/skills/hm-subagent-delegation-patterns/SKILL.md
  </files>
  <action>
Fix ALL references to `hm-planning-with-files` / `planning-with-files` in these 5 skills. Apply to BOTH lab AND .opencode/ locations. Only update reference text — do NOT change skill behavior.

**hm-user-intent-interactive-loop** (3 refs):
- Line 156: `| File-based planning | \`planning-with-files\` | ...` → `| File-based planning | \`hm-planning-persistence\` (.hivemind/state/planning/) | ...`
- Line 230: `Use \`planning-with-files\` for multi-session work.` → `Use \`hm-planning-persistence\` (.hivemind/state/planning/<session-id>/) for multi-session work.`
- Line 396: `| \`planning-with-files\` | Use for multi-session planning...` → `| \`hm-planning-persistence\` | Use for multi-session planning (.hivemind/state/planning/)...`

**hm-spec-driven-authoring** (2 refs):
- Line 50: `hm-planning-with-files` → `hm-planning-persistence` + add `.hivemind/state/planning/<session-id>/` path
- Line 156: `hm-planning-with-files` → `hm-planning-persistence`

**hm-test-driven-execution** (3 refs):
- Line 43: `hm-planning-with-files` → `hm-planning-persistence` + add `(.hivemind/state/planning/<session-id>/progress.md)` path
- Line 50: `hm-planning-with-files` → `hm-planning-persistence` + add `.hivemind/state/planning/<session-id>/` path
- Line 182: `hm-planning-with-files` → `hm-planning-persistence`

**hm-completion-looping** (1 ref):
- Line 149: `hm-planning-with-files` → `hm-planning-persistence` + add `.hivemind/state/planning/<session-id>/` path

**hm-subagent-delegation-patterns** (1 ref):
- Line 191: `hm-planning-with-files` → `hm-planning-persistence` + add `.hivemind/state/planning/<session-id>/` path

**Apply to BOTH locations for EACH skill.** Preserve formatting, indentation, table alignment. Reference-only fixes.
  </action>
  <verify>
    <automated>
for skill in hm-user-intent-interactive-loop hm-spec-driven-authoring hm-test-driven-execution hm-completion-looping hm-subagent-delegation-patterns; do
  lab=".hivefiver-meta-builder/skills-lab/active/refactoring/$skill/SKILL.md"
  rt=".opencode/skills/$skill/SKILL.md"
  if grep -q "planning-with-files" "$lab" 2>/dev/null; then echo "FAIL: $skill (lab) still references old skill"; exit 1; fi
  grep -q "hm-planning-persistence" "$lab" 2>/dev/null || { echo "FAIL: $skill (lab) missing new reference"; exit 1; }
  if grep -q "planning-with-files" "$rt" 2>/dev/null; then echo "FAIL: $skill (runtime) still references old skill"; exit 1; fi
  grep -q "hm-planning-persistence" "$rt" 2>/dev/null || { echo "FAIL: $skill (runtime) missing new reference"; exit 1; }
done
echo "ALL 5 SKILL REFERENCES VERIFIED"
    </automated>
  </verify>
  <done>
All 5 skills updated in both lab and .opencode/. No remaining old references. All cross-reference tables point to `hm-planning-persistence` with `.hivemind/state/planning/<session-id>/` path. Reference-only fixes — no behavior changes.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Coordinator → Subagent dispatch | Fixed coordinator no longer blocks on missing planning state |
| Skill reference chains | Cross-reference consistency across 6 skills maintained |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SE2-05 | Denial of Service | hm-coordinating-loop hard prerequisite | mitigate | D-04 replaces hard block with graceful fallback. No more HIERARCHY ENFORCEMENT blocking progression. |
| T-SE2-06 | Information Disclosure | Stale cross-references causing wrong skill loading | mitigate | All references updated to hm-planning-persistence with .hivemind/ paths. Verification grep confirms 0 old references remain. |
</threat_model>

<verification>
**Phase-level integration checks after Plan 02:**
1. Run `grep -r "planning-with-files" .opencode/skills/hm-coordinating-loop/` — must return EMPTY
2. Run `grep -r "planning-with-files" .opencode/skills/hm-user-intent-interactive-loop/` — must return EMPTY
3. Verify hm-coordinating-loop contains "in-memory" fallback language per D-04
4. Spot-check 2 skills to confirm both lab and .opencode copies match
</verification>

<success_criteria>
- [ ] hm-coordinating-loop contains NO references to `planning-with-files` or `verify-hierarchy.sh`
- [ ] hm-coordinating-loop has "in-memory" fallback language (D-04 soft boundary)
- [ ] hm-coordinating-loop references `hm-planning-persistence` with `.hivemind/state/planning/` path
- [ ] All 5 additional skills have ZERO old references
- [ ] All fixes applied to BOTH lab and runtime locations
- [ ] No skill behavior changed — reference-only updates
</success_criteria>

<output>
After completion, create `.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-02-SUMMARY.md`
</output>
