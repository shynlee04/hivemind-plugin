---
phase: SE-1-skill-reclassification-cleanup
title: "SE-1: Skill Reclassification & Cleanup"
status: PLANNED
depends_on: []
key_files:
  - ".opencode/skills/"
  - ".opencode/agents/"
  - ".opencode/commands/"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/"
  - ".hivefiver-meta-builder/agents-lab/active/refactoring/"
  - ".hivefiver-meta-builder/commands-lab/active/refactoring/"
  - "AGENTS.md"
---

# SE-1: Skill Reclassification & Cleanup — PLAN

## Objective

Rename 10 skill directories (6 `hivefiver-*` → `hf-*` + 4 `hm-*` → `hf-*`), remove 1 obsolete skill, fix all cross-references across SKILL.md, agent .md, and command .md files, add `gate-*` permissions to coordinator/conductor agents, and update AGENTS.md counts.

**Purpose:** Align skill names with the lineage model from HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md v2.0 — `hf-*` for hivefiver-exclusive meta-builder skills, `hm-*` for product+runtime skills that ship with the harness.

**Output:** All skill directories renamed, all references updated, no broken links.

## Two-Location Reality

Skills exist in TWO independent directory trees (not symlinks in this worktree):

| Location | Purpose |
|----------|---------|
| `.opencode/skills/` | Runtime — OpenCode reads from here |
| `.hivefiver-meta-builder/skills-lab/active/refactoring/` | Authoring lab — source of truth for edits |

Agents and commands also exist in two trees:
- `.opencode/agents/` + `.hivefiver-meta-builder/agents-lab/active/refactoring/`
- `.opencode/commands/` + `.hivefiver-meta-builder/commands-lab/active/refactoring/`

**ALL rename and reference-fix operations must be applied to BOTH locations.**

## Renames Reference Table

| # | Current Directory Name | New Directory Name | Category |
|---|----------------------|-------------------|----------|
| 1 | hivefiver-agents-and-subagents-dev | hf-agents-and-subagents-dev | hivefiver→hf |
| 2 | hivefiver-command-dev | hf-command-dev | hivefiver→hf |
| 3 | hivefiver-context-absorb | hf-context-absorb | hivefiver→hf |
| 4 | hivefiver-custom-tools-dev | hf-custom-tools-dev | hivefiver→hf |
| 5 | hivefiver-delegation-gates | hf-delegation-gates | hivefiver→hf |
| 6 | hivefiver-use-authoring-skills | hf-use-authoring-skills | hivefiver→hf |
| 7 | hm-agent-composition | hf-agent-composition | hm→hf |
| 8 | hm-agents-md-sync | hf-agents-md-sync | hm→hf |
| 9 | hm-command-parser | hf-command-parser | hm→hf |
| 10 | hm-skill-synthesis | hf-skill-synthesis | hm→hf |
| 11 | hm-opencode-project-inspection | *(REMOVE)* | removal |

## NOT in Scope

- `donotusethis-hm-planning-with-files` — stays, replaced in SE-2
- `opencode-config-workflow` — stays, replaced in SE-6
- `hm-omo-reference` — stays (OMO project reference, different from OpenCode platform reference)
- All `gate-*` skills — stay as-is (neither hm nor hf, internal)
- `hm-meta-builder` — stays (internal routing hub)
- `hm-opencode-non-interactive-shell` — stays (internal reference)
- `hm-opencode-platform-reference` — stays (internal reference)
- `hm-opencode-project-audit` — stays (no rename)
- Agent filenames (hivefiver-orchestrator.md etc.) — NOT renamed in SE-1

---

## Wave Structure

| Wave | Tasks | Description |
|------|-------|-------------|
| 1 | A, B, C | Directory renames + SKILL.md name field updates (all in one atomic pass) |
| 2 | D, E, F | Cross-reference fixes in SKILL.md files, agent files, command files |
| 3 | G, H | Gate permissions + AGENTS.md update + verification |

---

## Wave 1: Directory Renames

### Task A: Rename 6 hivefiver-* → hf-* skill directories

**Files (both locations):**

```
.opencode/skills/hivefiver-agents-and-subagents-dev/ → hf-agents-and-subagents-dev/
.opencode/skills/hivefiver-command-dev/ → hf-command-dev/
.opencode/skills/hivefiver-context-absorb/ → hf-context-absorb/
.opencode/skills/hivefiver-custom-tools-dev/ → hf-custom-tools-dev/
.opencode/skills/hivefiver-delegation-gates/ → hf-delegation-gates/
.opencode/skills/hivefiver-use-authoring-skills/ → hf-use-authoring-skills/

.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-agents-and-subagents-dev/ → hf-agents-and-subagents-dev/
.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-command-dev/ → hf-command-dev/
.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-context-absorb/ → hf-context-absorb/
.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-custom-tools-dev/ → hf-custom-tools-dev/
.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-delegation-gates/ → hf-delegation-gates/
.hivefiver-meta-builder/skills-lab/active/refactoring/hivefiver-use-authoring-skills/ → hf-use-authoring-skills/
```

**Action:**

1. For each of the 6 renames, in BOTH locations:
   ```bash
   mv .opencode/skills/{OLD_NAME} .opencode/skills/{NEW_NAME}
   mv .hivefiver-meta-builder/skills-lab/active/refactoring/{OLD_NAME} .hivefiver-meta-builder/skills-lab/active/refactoring/{NEW_NAME}
   ```

2. In each renamed directory, update SKILL.md YAML frontmatter:
   - Change `name: hivefiver-X` → `name: hf-X`
   - Update `description:` if it contains old name
   - Update any `references` paths containing old directory name (e.g., `.opencode/skills/hivefiver-delegation-gates/references/` → `.opencode/skills/hf-delegation-gates/references/`)

3. In `hivefiver-use-authoring-skills` → `hf-use-authoring-skills`: the SKILL.md has TWO `name:` fields (line 2 frontmatter + line 197 body). Update BOTH.

4. In `hivefiver-agents-and-subagents-dev` → `hf-agents-and-subagents-dev`: the SKILL.md has TWO `name:` fields (line 2 + line 87). Update BOTH.

5. In `hivefiver-delegation-gates` → `hf-delegation-gates`: update the `references/` paths in SKILL.md context section AND update `references/rich-resource-rationale.md` title line.

**Verify:**
```bash
# Confirm new directories exist
for d in hf-agents-and-subagents-dev hf-command-dev hf-context-absorb hf-custom-tools-dev hf-delegation-gates hf-use-authoring-skills; do
  test -d ".opencode/skills/$d" && echo "OK: .opencode/skills/$d" || echo "MISSING: .opencode/skills/$d"
  test -d ".hivefiver-meta-builder/skills-lab/active/refactoring/$d" && echo "OK: lab/$d" || echo "MISSING: lab/$d"
done

# Confirm old directories gone
for d in hivefiver-agents-and-subagents-dev hivefiver-command-dev hivefiver-context-absorb hivefiver-custom-tools-dev hivefiver-delegation-gates hivefiver-use-authoring-skills; do
  test -d ".opencode/skills/$d" && echo "STILL EXISTS: .opencode/skills/$d" || true
done

# Confirm SKILL.md name fields updated
for d in hf-agents-and-subagents-dev hf-command-dev hf-context-absorb hf-custom-tools-dev hf-delegation-gates hf-use-authoring-skills; do
  grep -c "^name: hf-" ".opencode/skills/$d/SKILL.md" | grep -q "^[1-9]" && echo "OK name: $d" || echo "BAD name: $d"
done
```

**Done:** All 6 directories renamed in both locations. All SKILL.md `name:` fields updated. No old directories remain.

---

### Task B: Rename 4 hm→hf skill directories

**Files (both locations):**

```
.opencode/skills/hm-agent-composition/ → hf-agent-composition/
.opencode/skills/hm-agents-md-sync/ → hf-agents-md-sync/
.opencode/skills/hm-command-parser/ → hf-command-parser/
.opencode/skills/hm-skill-synthesis/ → hf-skill-synthesis/

.hivefiver-meta-builder/skills-lab/active/refactoring/hm-agent-composition/ → hf-agent-composition/
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-agents-md-sync/ → hf-agents-md-sync/
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-command-parser/ → hf-command-parser/
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-skill-synthesis/ → hf-skill-synthesis/
```

**Action:**

1. For each of the 4 renames, in BOTH locations:
   ```bash
   mv .opencode/skills/{OLD_NAME} .opencode/skills/{NEW_NAME}
   mv .hivefiver-meta-builder/skills-lab/active/refactoring/{OLD_NAME} .hivefiver-meta-builder/skills-lab/active/refactoring/{NEW_NAME}
   ```

2. In each renamed directory, update SKILL.md YAML frontmatter:
   - Change `name: hm-X` → `name: hf-X`
   - Update any internal references to old directory paths

3. In `hm-command-parser` → `hf-command-parser`: update `references/rich-resource-rationale.md` title line (contains `hm-command-parser`).

4. In `hm-agents-md-sync` → `hf-agents-md-sync`: update `references/rich-resource-rationale.md` title line (contains `hm-agents-md-sync`).

**Verify:**
```bash
# Confirm new directories exist
for d in hf-agent-composition hf-agents-md-sync hf-command-parser hf-skill-synthesis; do
  test -d ".opencode/skills/$d" && echo "OK: .opencode/skills/$d" || echo "MISSING: .opencode/skills/$d"
  test -d ".hivefiver-meta-builder/skills-lab/active/refactoring/$d" && echo "OK: lab/$d" || echo "MISSING: lab/$d"
done

# Confirm old directories gone
for d in hm-agent-composition hm-agents-md-sync hm-command-parser hm-skill-synthesis; do
  test -d ".opencode/skills/$d" && echo "STILL EXISTS: .opencode/skills/$d" || true
done

# Confirm SKILL.md name fields updated
for d in hf-agent-composition hf-agents-md-sync hf-command-parser hf-skill-synthesis; do
  grep -c "^name: hf-" ".opencode/skills/$d/SKILL.md" | grep -q "^[1-9]" && echo "OK name: $d" || echo "BAD name: $d"
done
```

**Done:** All 4 directories renamed in both locations. All SKILL.md `name:` fields updated. No old directories remain.

---

### Task C: Remove hm-opencode-project-inspection

**Files (both locations):**

```
.opencode/skills/hm-opencode-project-inspection/
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-opencode-project-inspection/
```

**Action:**

1. Remove directories in both locations:
   ```bash
   rm -rf .opencode/skills/hm-opencode-project-inspection
   rm -rf .hivefiver-meta-builder/skills-lab/active/refactoring/hm-opencode-project-inspection
   ```

2. No SKILL.md update needed — the skill is being removed entirely.

**Verify:**
```bash
test -d ".opencode/skills/hm-opencode-project-inspection" && echo "STILL EXISTS" || echo "REMOVED OK"
test -d ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-opencode-project-inspection" && echo "STILL EXISTS" || echo "REMOVED OK"
```

**Done:** `hm-opencode-project-inspection` fully removed from both locations.

---

## Wave 2: Cross-Reference Fixes

> **Prerequisite:** Wave 1 complete — all directories renamed, SKILL.md `name:` fields updated.

### Task D: Fix cross-references in SKILL.md files

**Files:** All SKILL.md files in `.opencode/skills/` and `.hivefiver-meta-builder/skills-lab/active/refactoring/` that reference renamed skills.

**Known references to fix:**

| File | Old Reference | New Reference |
|------|--------------|---------------|
| `hm-subagent-delegation-patterns/SKILL.md` | `hivefiver-agents-and-subagents-dev` | `hf-agents-and-subagents-dev` |

**Action:**

1. Scan ALL SKILL.md files in both locations for any remaining references to old names:
   ```bash
   cd .opencode/skills && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-agent-composition\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis\|hm-opencode-project-inspection" */SKILL.md */references/*.md 2>/dev/null
   ```

2. For each match found, replace the old skill name with the new name. Use text replacement — the skill names are unique tokens.

3. Repeat the scan in `.hivefiver-meta-builder/skills-lab/active/refactoring/`.

4. Scan for `hivefiver-*` pattern in ALL SKILL.md `description:` fields — these should now use `hf-*`.

**Verify:**
```bash
# Zero remaining references to old names in skill files
cd .opencode/skills && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills" */SKILL.md */references/*.md 2>/dev/null | wc -l
# Expected: 0

cd .opencode/skills && grep -rn "hm-agent-composition\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis" */SKILL.md */references/*.md 2>/dev/null | grep -v "^hm-opencode" | wc -l
# Expected: 0

cd .opencode/skills && grep -rn "hm-opencode-project-inspection" */SKILL.md */references/*.md 2>/dev/null | wc -l
# Expected: 0
```

**Done:** Zero references to old skill names remain in any SKILL.md or references/*.md file.

---

### Task E: Fix cross-references in agent .md files + add gate permissions

**Files (both locations):**

Agent files in `.opencode/agents/` AND `.hivefiver-meta-builder/agents-lab/active/refactoring/`.

**Agent files with references to fix:**

| Agent File | References to Fix |
|-----------|-------------------|
| `coordinator.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills`, `hm-skill-synthesis` → `hf-skill-synthesis`, `hivefiver-agents-and-subagents-dev` → `hf-agents-and-subagents-dev`, `hivefiver-command-dev` → `hf-command-dev`, `hivefiver-custom-tools-dev` → `hf-custom-tools-dev` + ADD `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` to skill permissions |
| `conductor.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` + ADD `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` to skill permissions |
| `hivefiver.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills`, `hm-skill-synthesis` → `hf-skill-synthesis`, `hivefiver-agents-and-subagents-dev` → `hf-agents-and-subagents-dev`, `hivefiver-command-dev` → `hf-command-dev`, `hivefiver-custom-tools-dev` → `hf-custom-tools-dev` |
| `hivefiver-orchestrator.md` | All 6 `hivefiver-*` skill permission entries + routing table references + `hm-skill-synthesis` → `hf-skill-synthesis` |
| `hivefiver-agent-builder.md` | `hivefiver-agents-and-subagents-dev` → `hf-agents-and-subagents-dev` (permission + path refs + instruction text), `hivefiver-command-dev` → `hf-command-dev` |
| `hivefiver-command-builder.md` | `hivefiver-command-dev` → `hf-command-dev` (permission + path refs + instruction text) |
| `hivefiver-skill-author.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` (permission + path refs + instruction text) |
| `hivefiver-tool-builder.md` | `hivefiver-custom-tools-dev` → `hf-custom-tools-dev` (permission + path refs + instruction text) |
| `hf-prompter.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills`, `hm-command-parser` → `hf-command-parser` |
| `phase-guardian.md` | `hivefiver-delegation-gates` → `hf-delegation-gates`, `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` |
| `intent-loop.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` (permission + instruction text) |
| `spec-verifier.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` |
| `meta-synthesis-agent.md` | `hivefiver-use-authoring-skills` → `hf-use-authoring-skills` |

**Action:**

1. For each agent file listed above, apply find-and-replace in BOTH locations:
   - `hivefiver-agents-and-subagents-dev` → `hf-agents-and-subagents-dev`
   - `hivefiver-command-dev` → `hf-command-dev`
   - `hivefiver-context-absorb` → `hf-context-absorb`
   - `hivefiver-custom-tools-dev` → `hf-custom-tools-dev`
   - `hivefiver-delegation-gates` → `hf-delegation-gates`
   - `hivefiver-use-authoring-skills` → `hf-use-authoring-skills`
   - `hm-agent-composition` → `hf-agent-composition` (if any agent refs found)
   - `hm-agents-md-sync` → `hf-agents-md-sync` (if any agent refs found)
   - `hm-command-parser` → `hf-command-parser`
   - `hm-skill-synthesis` → `hf-skill-synthesis`

2. **Add gate permissions to coordinator.md** — in the `skill:` permission block, add these 3 entries (in both locations):
   ```yaml
   "gate-evidence-truth": allow
   "gate-lifecycle-integration": allow
   "gate-spec-compliance": allow
   ```

3. **Add gate permissions to conductor.md** — in the `skill:` permission block, add the same 3 entries (in both locations).

**Verify:**
```bash
# Zero old skill name references in agent files
cd .opencode/agents && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills" *.md 2>/dev/null | wc -l
# Expected: 0

cd .opencode/agents && grep -rn "hm-agent-composition\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis" *.md 2>/dev/null | wc -l
# Expected: 0

cd .opencode/agents && grep -rn "hm-opencode-project-inspection" *.md 2>/dev/null | wc -l
# Expected: 0

# Gate permissions added to coordinator
grep -c "gate-evidence-truth.*allow" .opencode/agents/coordinator.md
# Expected: >= 1
grep -c "gate-spec-compliance.*allow" .opencode/agents/coordinator.md
# Expected: >= 1
grep -c "gate-lifecycle-integration.*allow" .opencode/agents/coordinator.md
# Expected: >= 1

# Gate permissions added to conductor
grep -c "gate-evidence-truth.*allow" .opencode/agents/conductor.md
# Expected: >= 1
grep -c "gate-spec-compliance.*allow" .opencode/agents/conductor.md
# Expected: >= 1
grep -c "gate-lifecycle-integration.*allow" .opencode/agents/conductor.md
# Expected: >= 1

# Same verification in lab
cd .hivefiver-meta-builder/agents-lab/active/refactoring && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills" *.md 2>/dev/null | wc -l
# Expected: 0
```

**Done:** All agent files reference new skill names. Gate permissions added to coordinator and conductor. Zero stale references in both locations.

---

### Task F: Fix cross-references in command .md files

**Files (both locations):**

Command files in `.opencode/commands/` AND `.hivefiver-meta-builder/commands-lab/active/refactoring/`.

**Command files with references to fix:**

| Command File | References to Fix |
|-------------|-------------------|
| `sync-agents-md.md` | `hm-agents-md-sync` → `hf-agents-md-sync` |
| `hf-absorb.md` | `hivefiver-context-absorb` → `hf-context-absorb` |
| `hf-configure.md` | `hivefiver-orchestrator` agent reference stays (agent not renamed) — but check for any `hivefiver-*` skill references |
| `hf-create.md` | Check for `hivefiver-*` skill references |
| `hf-audit.md` | Check for `hivefiver-*` skill references |
| `hf-stack.md` | Check for `hivefiver-*` skill references |
| `hf-prompt-enhance.md` | Check for `hivefiver-*` skill references |
| `harness-audit.md` | Check for `hivefiver-*` skill references |

**Action:**

1. Scan ALL command .md files in both locations for references to old skill names:
   ```bash
   cd .opencode/commands && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis" *.md 2>/dev/null
   ```

2. For each match, replace the old skill name with the new name.

3. **DO NOT rename agent references** — `hivefiver-orchestrator`, `hivefiver-agent-builder`, etc. are agent names (not skill names) and are NOT being renamed in SE-1.

4. Repeat for `.hivefiver-meta-builder/commands-lab/active/refactoring/`.

**Verify:**
```bash
# Zero old skill name references in command files
cd .opencode/commands && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis" *.md 2>/dev/null | wc -l
# Expected: 0

# Same for lab
cd .hivefiver-meta-builder/commands-lab/active/refactoring && grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-agents-md-sync\|hm-command-parser\|hm-skill-synthesis" *.md 2>/dev/null | wc -l
# Expected: 0
```

**Done:** All command files reference new skill names. Agent name references left intact.

---

## Wave 3: Final Updates & Verification

### Task G: Update AGENTS.md counts and references

**File:** `AGENTS.md` (project root)

**Action:**

1. Update the skill count in AGENTS.md:
   - Current: "22 skills in `.opencode/skills/`: 5 core (...) + 17 extended (...)"
   - After SE-1: 21 skills (removed hm-opencode-project-inspection)
   - Update the skill list to reflect new names (hivefiver-* → hf-*, hm-agent-composition → hf-agent-composition, etc.)

2. In the skill list section, rename all 6 `hivefiver-*` entries to `hf-*` and all 4 `hm→hf` entries.

3. Remove `hm-opencode-project-inspection` from any lists if present.

4. Verify agent count is still correct (59 agents, no agents renamed in SE-1).

**Verify:**
```bash
# AGENTS.md has no old skill name references
grep -c "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-opencode-project-inspection" AGENTS.md
# Expected: 0

# AGENTS.md mentions hf- skills
grep -c "hf-agents-and-subagents-dev\|hf-command-dev\|hf-context-absorb\|hf-custom-tools-dev\|hf-delegation-gates\|hf-use-authoring-skills\|hf-agent-composition\|hf-agents-md-sync\|hf-command-parser\|hf-skill-synthesis" AGENTS.md
# Expected: >= 10
```

**Done:** AGENTS.md reflects new skill names and correct count.

---

### Task H: Full Verification Pass

**Action:**

Run a comprehensive verification across the entire project to confirm zero stale references:

```bash
echo "=== VERIFYING .opencode/skills/ ==="
echo "Old hivefiver-* dirs:"
ls -d .opencode/skills/hivefiver-* 2>/dev/null || echo "  (none - OK)"

echo "Old hm→hf dirs (should not exist):"
for d in hm-agent-composition hm-agents-md-sync hm-command-parser hm-skill-synthesis; do
  test -d ".opencode/skills/$d" && echo "  STILL EXISTS: $d"
done
echo "Removed dir:"
test -d ".opencode/skills/hm-opencode-project-inspection" && echo "  STILL EXISTS" || echo "  (removed - OK)"

echo ""
echo "=== VERIFYING SKILL COUNT ==="
ls -d .opencode/skills/*/ | grep -v ".gitkeep" | wc -l

echo ""
echo "=== VERIFYING NO STALE REFERENCES IN .opencode/ ==="
grep -rn "hivefiver-agents-and-subagents-dev\|hivefiver-command-dev\|hivefiver-context-absorb\|hivefiver-custom-tools-dev\|hivefiver-delegation-gates\|hivefiver-use-authoring-skills\|hm-opencode-project-inspection" .opencode/skills/ .opencode/agents/ .opencode/commands/ 2>/dev/null || echo "  (none - OK)"

echo ""
echo "=== VERIFYING NEW hf-* SKILLS EXIST ==="
for d in hf-agents-and-subagents-dev hf-command-dev hf-context-absorb hf-custom-tools-dev hf-delegation-gates hf-use-authoring-skills hf-agent-composition hf-agents-md-sync hf-command-parser hf-skill-synthesis; do
  test -d ".opencode/skills/$d" && echo "  OK: $d" || echo "  MISSING: $d"
done

echo ""
echo "=== VERIFYING GATE PERMISSIONS ==="
echo "Coordinator:"
grep "gate-" .opencode/agents/coordinator.md || echo "  (none found)"
echo "Conductor:"
grep "gate-" .opencode/agents/conductor.md || echo "  (none found)"
```

**Expected results:**
- Zero old `hivefiver-*` directories in `.opencode/skills/`
- Zero old `hm→hf` directories in `.opencode/skills/`
- `hm-opencode-project-inspection` directory gone
- Total skill count: 35 directories (36 original - 1 removed)
- Zero stale references in any `.opencode/` files
- All 10 new `hf-*` directories exist
- Gate permissions present in coordinator.md and conductor.md

**Done:** Full verification passed. No broken references. Phase SE-1 complete.

---

## Rollback Plan

If something breaks after Wave 1 (renames):

```bash
# Reverse all renames in .opencode/skills/
mv .opencode/skills/hf-agents-and-subagents-dev .opencode/skills/hivefiver-agents-and-subagents-dev
mv .opencode/skills/hf-command-dev .opencode/skills/hivefiver-command-dev
mv .opencode/skills/hf-context-absorb .opencode/skills/hivefiver-context-absorb
mv .opencode/skills/hf-custom-tools-dev .opencode/skills/hivefiver-custom-tools-dev
mv .opencode/skills/hf-delegation-gates .opencode/skills/hivefiver-delegation-gates
mv .opencode/skills/hf-use-authoring-skills .opencode/skills/hivefiver-use-authoring-skills
mv .opencode/skills/hf-agent-composition .opencode/skills/hm-agent-composition
mv .opencode/skills/hf-agents-md-sync .opencode/skills/hm-agents-md-sync
mv .opencode/skills/hf-command-parser .opencode/skills/hm-command-parser
mv .opencode/skills/hf-skill-synthesis .opencode/skills/hm-skill-synthesis

# Same for .hivefiver-meta-builder/skills-lab/active/refactoring/
# (repeat the above with the lab path)

# Git reset to undo all changes
git checkout -- .opencode/ .hivefiver-meta-builder/ AGENTS.md
```

**Safest rollback:** `git checkout -- .opencode/ .hivefiver-meta-builder/ AGENTS.md` before committing any SE-1 changes.

---

## Commit Strategy

After each wave:

```bash
# After Wave 1 (renames)
git add .opencode/skills/ .hivefiver-meta-builder/skills-lab/active/refactoring/
git commit -m "refactor(SE-1): rename 10 skill directories (6 hivefiver→hf + 4 hm→hf), remove hm-opencode-project-inspection"

# After Wave 2 (cross-references)
git add .opencode/ .hivefiver-meta-builder/
git commit -m "fix(SE-1): update all cross-references to renamed skills in agents, commands, and SKILL.md files"

# After Wave 3 (final)
git add AGENTS.md
git commit -m "docs(SE-1): update AGENTS.md skill counts and names for reclassification"
```

---

## Summary

| Wave | Tasks | Risk | Estimated Context |
|------|-------|------|-------------------|
| 1 | A, B, C (renames + removal) | Low — `mv` operations | ~15% |
| 2 | D, E, F (cross-reference fixes) | Medium — many files to touch | ~30% |
| 3 | G, H (AGENTS.md + verification) | Low — count updates + grep | ~10% |
| **Total** | **8 tasks across 3 waves** | | **~55%** |

**Phase SE-1 completion criteria:**
- [ ] 6 `hivefiver-*` directories renamed to `hf-*` (both locations)
- [ ] 4 `hm→hf` directories renamed (both locations)
- [ ] `hm-opencode-project-inspection` removed (both locations)
- [ ] All SKILL.md `name:` fields updated to new names
- [ ] All SKILL.md internal references updated
- [ ] All agent .md skill permissions updated to new names
- [ ] All agent .md instruction text updated to new names
- [ ] All command .md skill references updated to new names
- [ ] `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` added to coordinator.md and conductor.md skill permissions
- [ ] AGENTS.md counts and skill lists updated
- [ ] Zero stale references remain in `.opencode/` or `.hivefiver-meta-builder/`
- [ ] All changes committed in 3 atomic commits

<output>
After completion, create `.planning/workstreams/skill-ecosystem/phases/SE-1-skill-reclassification-cleanup/SE-1-SUMMARY.md`
</output>
