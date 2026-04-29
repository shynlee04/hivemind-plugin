---
phase: SE-2-hm-artifact-hierarchy
plan: 04
type: execute
wave: 3
depends_on: [SE-2-01, SE-2-02, SE-2-03]
files_modified:
  - ".opencode/retired/donotusethis-hm-planning-with-files/"
  - ".opencode/skills/donotusethis-hm-planning-with-files/"
autonomous: true
requirements: [SE-2-R06, SE-2-R07]
must_haves:
  truths:
    - "donotusethis-hm-planning-with-files is moved to .opencode/retired/"
    - "Deprecation note references hm-planning-persistence as replacement"
    - "Global grep confirms zero remaining references to hm-planning-with-files across ALL skills"
    - "hm-planning-persistence symlink exists at .opencode/skills/hm-planning-persistence/"
  artifacts:
    - path: ".opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md"
      provides: "Archived disabled skill with deprecation note"
      contains: "Replaced by hm-planning-persistence"
    - path: ".opencode/retired/donotusethis-hm-planning-with-files/.gitkeep"
      provides: "Directory tracking"
  key_links:
    - from: "Archived skill deprecation note"
      to: "hm-planning-persistence"
      via: "text: Replaced by hm-planning-persistence (.hivemind/state/planning/)"
      pattern: "Replaced by hm-planning-persistence"
</must_haves>
---

<objective>
Archive the disabled `donotusethis-hm-planning-with-files` skill and perform integration verification across all 11 fixed skills. This is the final cleanup step per D-10 fix order step 5.

Purpose: Remove the disabled skill from active directories, preserve it for historical reference in `.opencode/retired/`, and verify that ALL 11 broken references have been successfully fixed across the entire skill ecosystem.
Output: Archived skill with deprecation note. Verification report confirming zero dead references.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-CONTEXT.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Archive Disabled Skill (D-10 fix order step 5)</name>
  <files>
    .opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md
    .opencode/retired/donotusethis-hm-planning-with-files/.gitkeep
  </files>
  <action>
Archive the disabled `donotusethis-hm-planning-with-files` skill per D-10 fix order step 5.

**Steps:**

1. **Create `.opencode/retired/` directory** if it does not exist:
   ```bash
   mkdir -p .opencode/retired
   ```

2. **Move the disabled skill** from `.opencode/skills/donotusethis-hm-planning-with-files/` to `.opencode/retired/donotusethis-hm-planning-with-files/`:
   ```bash
   mv .opencode/skills/donotusethis-hm-planning-with-files .opencode/retired/donotusethis-hm-planning-with-files
   ```

3. **Add deprecation note** to `SKILL-DISABLED.md` (append at top, before existing frontmatter):
   ```markdown
   > **ARCHIVED: 2026-04-28 — Phase SE-2**
   > 
   > This skill has been permanently retired. It is preserved here for historical reference only.
   > 
   > **Replaced by:** `hm-planning-persistence` — persists planning state to `.hivemind/state/planning/<session-id>/` per Q6 architecture decision (D-01).
   > 
   > **Reason for archival:** This skill was disabled (donotusethis- prefix) due to hierarchy enforcement issues. Its patterns were extracted and improved in `hm-planning-persistence` with language-agnostic design, pipeline contracts (D-09), and proper lineage (hm-* = shipped product).
   ```

4. **Add `.gitkeep` file** to the retired directory:
   ```bash
   touch .opencode/retired/donotusethis-hm-planning-with-files/.gitkeep
   ```

5. **Verify the move** — the old path must be empty:
   ```bash
   test ! -d .opencode/skills/donotusethis-hm-planning-with-files
   ```
  </action>
  <verify>
    <automated>
# Verify old location is empty/removed
test ! -d .opencode/skills/donotusethis-hm-planning-with-files || { echo "FAIL: Old skill directory still exists in .opencode/skills/"; exit 1; }

# Verify archived location exists
test -d .opencode/retired/donotusethis-hm-planning-with-files || { echo "FAIL: Archived directory missing"; exit 1; }

# Verify SKILL-DISABLED.md exists in archive
test -f .opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md || { echo "FAIL: Archived SKILL-DISABLED.md missing"; exit 1; }

# Verify deprecation note
grep -q "Replaced by.*hm-planning-persistence" .opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md || { echo "FAIL: Missing deprecation note referencing hm-planning-persistence"; exit 1; }
grep -q "ARCHIVED.*SE-2" .opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md || { echo "FAIL: Missing archival date/phase stamp"; exit 1; }

# Verify .gitkeep exists
test -f .opencode/retired/donotusethis-hm-planning-with-files/.gitkeep || { echo "FAIL: .gitkeep missing"; exit 1; }

echo "ARCHIVE VERIFIED"
    </automated>
  </verify>
  <done>
Disabled skill moved from `.opencode/skills/` to `.opencode/retired/`. Deprecation note added referencing `hm-planning-persistence` as replacement. Historical patterns preserved for reference. Old location confirmed empty.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Integration Verification — Global Reference Integrity Check</name>
  <files>
    .planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-VERIFICATION.md
  </files>
  <action>
Run comprehensive integration verification across the entire skill ecosystem to confirm ALL 11 broken references are fixed and the new hm-planning-persistence skill is properly discoverable.

**Verification checklist to execute:**

1. **Global grep — Zero remaining old references:**
   ```bash
   grep -r "planning-with-files\|hm-planning-with-files" .opencode/skills/ \
     --include="*.md" --exclude-dir=retired 2>/dev/null
   ```
   Must return EMPTY (no matches). Only exception: references in `.opencode/retired/` are acceptable.

2. **Global grep — hm-planning-persistence references exist where expected:**
   ```bash
   for skill in hm-coordinating-loop hm-user-intent-interactive-loop hm-spec-driven-authoring \
     hm-test-driven-execution hm-completion-looping hm-subagent-delegation-patterns \
     hm-phase-execution hm-phase-loop hm-debug hm-refactor hm-meta-builder hf-delegation-gates; do
     if grep -q "hm-planning-persistence" .opencode/skills/$skill/SKILL.md 2>/dev/null; then
       echo "OK: $skill references hm-planning-persistence"
     else
       echo "MISSING: $skill has no reference to hm-planning-persistence"
     fi
   done
   ```
   All 12 skills (11 original + hf-delegation-gates) must show "OK".

3. **hm-planning-persistence discoverability:**
   - Verify symlink exists: `test -L .opencode/skills/hm-planning-persistence || test -d .opencode/skills/hm-planning-persistence`
   - Verify SKILL.md frontmatter is valid: `head -20 .opencode/skills/hm-planning-persistence/SKILL.md | grep -q "^name: hm-planning-persistence"`
   - Verify pipeline contract: `grep -q "^pipeline:" .opencode/skills/hm-planning-persistence/SKILL.md`

4. **D-04 soft boundary verification:**
   ```bash
   grep -c "must be loaded" .opencode/skills/hm-coordinating-loop/SKILL.md
   ```
   Must return 0 (no hard prerequisites remain).

5. **Cross-reference consistency:**
   - Spot-check 3 random skills: verify lab copy matches .opencode/ copy
   ```bash
   diff .hivefiver-meta-builder/skills-lab/active/refactoring/hm-coordinating-loop/SKILL.md \
        .opencode/skills/hm-coordinating-loop/SKILL.md
   ```

6. **Write verification report** to `.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-VERIFICATION.md`:
   - Date: 2026-04-28
   - Phase: SE-2
   - Summary: All 11 references fixed + 1 bonus (hf-delegation-gates) = 12 total
   - Old references remaining: 0 (confirmed by global grep)
   - D-04 status: hm-coordinating-loop soft boundary verified (no blocking prerequisites)
   - D-10 fix order: All 5 steps completed (create → CRITICAL fix → 9 parallel → meta-builder → archive)
   - Archived: donotusethis-hm-planning-with-files → .opencode/retired/
   - New skill: hm-planning-persistence created at both locations with pipeline contract

7. **Run final checklist from CONTEXT.md D-10 fix order:**
   - [x] Step 1: hm-planning-persistence created
   - [x] Step 2: hm-coordinating-loop fixed (CRITICAL — D-04 soft boundary)
   - [x] Step 3: 9 degraded skills fixed (expand to 12 including phase-loop + hf-delegation-gates)
   - [x] Step 4: hm-meta-builder routing table updated
   - [x] Step 5: donotusethis-hm-planning-with-files archived
  </action>
  <verify>
    <automated>
echo "=== SE-2 INTEGRATION VERIFICATION ==="

# Check 1: Zero old references in active skills
OLD_REFS=$(grep -r "planning-with-files\|hm-planning-with-files" .opencode/skills/ --include="*.md" --exclude-dir=retired 2>/dev/null | grep -v "^$")
if [ -n "$OLD_REFS" ]; then
  echo "FAIL: Old references still found:"
  echo "$OLD_REFS"
  exit 1
fi
echo "PASS: Zero old references in active skills"

# Check 2: hm-planning-persistence is discoverable
test -d .opencode/skills/hm-planning-persistence || { echo "FAIL: hm-planning-persistence not found in .opencode/skills/"; exit 1; }
grep -q "^name: hm-planning-persistence" .opencode/skills/hm-planning-persistence/SKILL.md || { echo "FAIL: hm-planning-persistence SKILL.md missing or invalid"; exit 1; }
grep -q "^pipeline:" .opencode/skills/hm-planning-persistence/SKILL.md || { echo "FAIL: hm-planning-persistence missing pipeline contract (D-09)"; exit 1; }
echo "PASS: hm-planning-persistence discoverable with pipeline contract"

# Check 3: D-04 soft boundary
if grep -q "must be loaded" .opencode/skills/hm-coordinating-loop/SKILL.md 2>/dev/null; then
  echo "FAIL: hm-coordinating-loop still has hard prerequisite"
  exit 1
fi
echo "PASS: D-04 soft boundary verified"

# Check 4: Archive exists
test -d .opencode/retired/donotusethis-hm-planning-with-files || { echo "FAIL: Archived skill directory missing"; exit 1; }
grep -q "Replaced by.*hm-planning-persistence" .opencode/retired/donotusethis-hm-planning-with-files/SKILL-DISABLED.md || { echo "FAIL: Deprecation note missing"; exit 1; }
echo "PASS: Archived skill verified"

# Check 5: All 12 skills reference hm-planning-persistence
SKILLS="hm-coordinating-loop hm-user-intent-interactive-loop hm-spec-driven-authoring hm-test-driven-execution hm-completion-looping hm-subagent-delegation-patterns hm-phase-execution hm-phase-loop hm-debug hm-refactor hm-meta-builder hf-delegation-gates"
FAILURES=0
for skill in $SKILLS; do
  if ! grep -q "hm-planning-persistence" .opencode/skills/$skill/SKILL.md 2>/dev/null; then
    echo "MISSING: $skill has no reference to hm-planning-persistence"
    FAILURES=$((FAILURES + 1))
  fi
done
if [ $FAILURES -gt 0 ]; then
  echo "FAIL: $FAILURES skill(s) missing hm-planning-persistence reference"
  exit 1
fi
echo "PASS: All 12 skills reference hm-planning-persistence"

echo ""
echo "=== ALL INTEGRATION CHECKS PASSED ==="
    </automated>
  </verify>
  <done>
SE-2-VERIFICATION.md written with comprehensive results. Global grep confirms zero old references. All 12 skills reference hm-planning-persistence. D-04 soft boundary confirmed. D-10 fix order all 5 steps verified complete. Archived skill has deprecation note.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Active skills → Retired skills | Archived skill must NOT be loadable by agents |
| Cross-reference integrity | All references must resolve to existing, working skills |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SE2-09 | Spoofing | Archived skill accidentally loaded | mitigate | Moved to .opencode/retired/ outside normal discovery path. Deprecation note warns against use. |
| T-SE2-10 | Denial of Service | Broken cross-reference dead-ends | mitigate | Global grep verified ZERO remaining old references. Verification report documents all 12 confirmed fixes. |
</threat_model>

<verification>
**Final phase-level verification after Plan 04:**
1. Global grep for `planning-with-files` in `.opencode/skills/` (excluding retired/) — must return EMPTY
2. All 12 target skills have `hm-planning-persistence` reference — confirmed
3. hm-planning-persistence is discoverable at `.opencode/skills/hm-planning-persistence/` — confirmed
4. SE-2-VERIFICATION.md written with full results
5. D-10 fix order all 5 steps traceable to evidence
</verification>

<success_criteria>
- [ ] donotusethis-hm-planning-with-files moved to .opencode/retired/
- [ ] Deprecation note references hm-planning-persistence as replacement
- [ ] Global grep confirms ZERO remaining old references in active skills
- [ ] All 12 target skills confirmed referencing hm-planning-persistence
- [ ] D-04 soft boundary verified (no hard prerequisites in coordinator)
- [ ] SE-2-VERIFICATION.md written with complete results
</success_criteria>

<output>
After completion, create `.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-04-SUMMARY.md`
</output>
