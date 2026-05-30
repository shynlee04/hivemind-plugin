# Wave 1 Revamp — Task Inventory
## Session: wave1-revamp | Wave: 1 (Phase 0 + Phase 1)

**Mode: SEQUENTIAL** (dependency chain — C1→C2→C3→C4→C5→1.1→1.2→1.3→1.4)
**Execution: Task-by-task with verification gates between each**

---

## TASKS

### Critical Fixes (Phase 0)

- [ ] TASK-W1-C1: Fix validate-gate.sh synthesize action — skill-synthesis/scripts/validate-gate.sh missing `synthesize` action
  | files: .opencode/skills/skill-synthesis/scripts/validate-gate.sh | domain: critical-bug
  | skill: use-authoring-skills

- [ ] TASK-W1-C2: Write 4 depth reference files — meta-builder/references/depth-*.md are empty stubs
  | files: .opencode/skills/meta-builder/references/depth-*.md (4 files) | domain: critical-bug
  | skill: use-authoring-skills

- [ ] TASK-W1-C3: Generate tech-stack.md for OMO reference
  | files: .opencode/skills/oh-my-openagent-reference/references/tech-stack.md | domain: critical-bug
  | skill: use-authoring-skills

- [ ] TASK-W1-C4: Regenerate project-structure.md for OMO reference (currently 4 lines)
  | files: .opencode/skills/oh-my-openagent-reference/references/project-structure.md | domain: critical-bug
  | skill: use-authoring-skills

- [ ] TASK-W1-C5: Determine canonical skill location — .claude/skills/ vs .opencode/skills/
  | files: (decision document only) | domain: critical-bug
  | skill: planning-with-files

### Phase 1: Canonical Resolution (no content changes)

- [ ] TASK-W1-1.1: Confirm .claude/skills/ as canonical location
  | files: (decision document) | domain: structural

- [ ] TASK-W1-1.2: Merge unique content from .opencode/ versions into .claude/ canonical
  | files: 5 duplicate skill pairs | domain: structural
  | skill: use-authoring-skills

- [ ] TASK-W1-1.3: Delete .opencode/ duplicates after merge
  | files: 5 skill directories in .opencode/skills/ | domain: structural

- [ ] TASK-W1-1.4: Move eval-harness from .agents/skills/ to .claude/skills/
  | files: .agents/skills/eval-harness/ → .claude/skills/eval-driven-development/ | domain: structural

---

## DEPENDENCY ORDER

```
C1 → C2 → C3 → C4 → C5 → 1.1 → 1.2 → 1.3 → 1.4
```

All Phase 0 tasks must complete before Phase 1 starts.

## VERIFICATION

After all tasks: run `grep -r "claude/skills" .opencode/skills/ --include="*.md" | wc -l` → should be 0
After canonical delete: `ls .opencode/skills/` → should not contain coordinating-loop, phase-loop, planning-with-files, user-intent-interactive-loop, session-context-manager

---

_Generated: 2026-04-10_
_Author: hivefiver orchestrator (wave1-revamp)_