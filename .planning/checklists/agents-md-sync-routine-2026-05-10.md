---
type: checklist
created: 2026-05-10
status: active
source: AGENTS.md ecosystem audit and quality improvement session
total_agreements: 7
chain_depth: 4 levels
evidence_level: L5 — documentation governance only; does not prove runtime readiness
---

# AGENTS.md Sync Routine — 2026-05-10

> **Chain Principle:** AGENTS.md files are NOT standalone. They form an interconnected 4-level chain from root → sector → domain → leaf. Every link must be kept truth-synced when files are added, removed, moved, renamed, or when architecture changes.

---

## 1. Trigger Conditions — When to Sync

| Trigger | What Changed | Affected AGENTS.md Level |
|----------|-------------|--------------------------|
| New `src/` directory created | File tree changes | Parent sector + new leaf AGENTS.md |
| `src/` file moved / renamed | Module path changes | All AGENTS.md files referencing that path |
| Architecture doc updated | Design patterns, surface ownership, lineage rules | Root + all sector AGENTS.md files |
| `src/` file deleted | Module removed | Parent sector AGENTS.md |
| New agent / skill / command | `.opencode/` primitives change | Root AGENTS.md counts + `.opencode/AGENTS.md` |
| Package.json dependencies change | Stack reference changes | Root AGENTS.md + stack-* skills |
| Planning phase completes | Governance baseline shifts | Root AGENTS.md + affected sector |

**Non-negotiable:** After any `src/` file add/remove/rename, sync MUST happen within the same commit cycle.

---

## 2. Chain Structure — 4-Level Hierarchy

```
Level 1: Root              /AGENTS.md ............................. (1 file)
│
├─ Level 2: Sector         src/AGENTS.md .......................... (Hard Harness)
│                          .opencode/AGENTS.md .................... (Soft Meta-Concepts)
│                          .hivemind/AGENTS.md .................... (Internal State)
│                          .planning/AGENTS.md .................... (Governance)
│                          .hivefiver-meta-builder/AGENTS.md ...... (Meta-Authoring)
│                          tests/AGENTS.md ........................ (Verification)
│
├─ Level 3: Domain         src/tools/AGENTS.md .................... (7 files)
│                          src/hooks/AGENTS.md
│                          src/features/AGENTS.md
│                          src/config/AGENTS.md
│                          src/routing/AGENTS.md
│                          src/shared/AGENTS.md
│                          src/schema-kernel/AGENTS.md
│                          src/coordination/AGENTS.md
│                          src/task-management/AGENTS.md
│
└─ Level 4: Leaf           src/tools/delegation/AGENTS.md ......... (27+ files)
                           src/tools/session/AGENTS.md
                           src/tools/prompt/AGENTS.md
                           src/tools/hivemind/AGENTS.md
                           src/tools/config/AGENTS.md
                           src/hooks/transforms/AGENTS.md
                           src/hooks/observers/AGENTS.md
                           src/hooks/guards/AGENTS.md
                           src/hooks/lifecycle/AGENTS.md
                           src/hooks/composition/AGENTS.md
                           src/features/bootstrap/AGENTS.md
                           src/features/background-command/AGENTS.md
                           src/features/doc-intelligence/AGENTS.md
                           src/features/prompt-packet/AGENTS.md
                           src/features/runtime-pressure/AGENTS.md
                           src/features/sdk-supervisor/AGENTS.md
                           src/features/agent-work-contracts/AGENTS.md
                           src/routing/session-entry/AGENTS.md
                           src/routing/command-engine/AGENTS.md
                           src/routing/behavioral-profile/AGENTS.md
                           src/config/workflow/AGENTS.md
                           src/coordination/delegation/AGENTS.md
                           src/coordination/completion/AGENTS.md
                           src/coordination/concurrency/AGENTS.md
                           src/coordination/sdk-delegation/AGENTS.md
                           src/coordination/command-delegation/AGENTS.md
                           src/coordination/spawner/AGENTS.md
                           src/task-management/continuity/AGENTS.md
                           src/task-management/journal/AGENTS.md
                           src/task-management/lifecycle/AGENTS.md
                           src/task-management/recovery/AGENTS.md
                           src/task-management/trajectory/AGENTS.md
```

**Total: 48 AGENTS.md files (1 root + 5 sector + 2 top-level-only + 9 domain + 31 leaf)**

---

## 3. Sync Protocol — Per-Trigger Checklist

### Protocol A: New `src/` Directory Created

```
[ ] Create AGENTS.md in new directory (follow 6-section pattern)
[ ] Add "Parent sector" and "Architecture" header line
[ ] Ensure L5 evidence disclaimer present
[ ] Reference .planning/codebase/ARCHITECTURE.md and STRUCTURE.md
[ ] Update parent AGENTS.md: add reference to new child
[ ] Run verification: grep -rn "src/lib/" src/<new-dir>/AGENTS.md → 0 matches
[ ] Commit atomically with message: "docs: add AGENTS.md for src/<new-dir>/"
```

### Protocol B: File Moved / Renamed

```
[ ] Update all AGENTS.md files that reference old path
[ ] grep -rn "old-path" src/**/AGENTS.md — find all stale references
[ ] Replace old path with new path
[ ] Verify no broken module names remain
[ ] Verify: grep -rn "old-path" src/**/AGENTS.md → 0 matches
```

### Protocol C: Architecture Document Updated

```
[ ] Identify which architecture doc changed (ARCHITECTURE.md, STRUCTURE.md, etc.)
[ ] Review the "Must-Have References" table in root AGENTS.md
[ ] Update section references in affected sector AGENTS.md files
[ ] Update classification headers in leaf AGENTS.md files
[ ] Verify: grep -rl "planning/codebase/ARCHITECTURE" src/**/AGENTS.md | wc -l → 42
```

### Protocol D: Agent / Skill / Command Changed in `.opencode/`

```
[ ] Update agent/skill/command counts in root AGENTS.md
[ ] Update agent name list in root AGENTS.md
[ ] Update `.opencode/AGENTS.md` if lineages change
[ ] Re-run skill/agent count verification
```

### Protocol E: Portion of `src/` Directory Removed

```
[ ] Delete corresponding AGENTS.md file
[ ] Update parent AGENTS.md: remove reference to deleted child
[ ] grep -rn "removed-directory" src/**/AGENTS.md → 0 matches
[ ] Register directory with .gitkeep if parent directory still exists
```

---

## 4. Regression Prevention — Verification Commands

Run these after ANY AGENTS.md change:

```bash
# 1. No stale src/lib/ references (except line 5 of root AGENTS.md)
grep -rn "src/lib/" AGENTS.md src/**/AGENTS.md .hivemind/AGENTS.md tests/AGENTS.md | grep -v "src/lib/ has been removed"

# 2. No worktree absolute paths
grep -rn "worktrees" AGENTS.md

# 3. No old hivefiver-* naming
grep -rn "hivefiver-orchestrator\|hivefiver-skill-author\|hivefiver-agent-builder" .hivefiver-meta-builder/AGENTS.md

# 4. All src/ AGENTS.md files have L5 disclaimer
grep -rl "L5 documentation guidance" src/**/AGENTS.md | wc -l
# → must equal total src/ AGENTS.md count

# 5. All src/ AGENTS.md files reference architecture docs
grep -rl "planning/codebase/ARCHITECTURE\|planning/architecture/" src/**/AGENTS.md | wc -l
# → must equal total src/ AGENTS.md count

# 6. All src/ AGENTS.md files have 6 sections
for f in $(find src -name "AGENTS.md"); do
  count=$(grep -c "^## " "$f")
  if [ "$count" -lt 6 ]; then echo "MISSING sections: $f ($count)"; fi
done

# 7. AGENTS.md file inventory matches actual directories
find src -type d -exec test -f {}/AGENTS.md \; | wc -l
find src -type d -not -name "node_modules" -not -path "*/.git/*" | wc -l
# → should differ only by directories with .gitkeep but no module code
```

---

## 5. Chain Integrity Rules

| Rule | Enforcement |
|------|-------------|
| **Parent must know children** | Every domain AGENTS.md lists its leaf children in section 4 (Actors table) or section 1 |
| **Child must know parent** | Every leaf AGENTS.md has `**Parent sector:**` reference in classification header |
| **Leaf must know architecture** | Every AGENTS.md references at least one `.planning/codebase/` or `.planning/architecture/` document |
| **No phantom references** | No AGENTS.md references a file or directory that does not exist |
| **No orphan AGENTS.md** | Every AGENTS.md corresponds to an existing directory with actual source files |
| **Atomic commits** | AGENTS.md changes accompany the source changes that triggered them in the same commit |
| **L5 evidence only** | No AGENTS.md claims runtime readiness — all are L5 documentation guidance |

---

## 6. Misconception Guard — `.opencode/` Boundary

The single most common regression is treating `.opencode/` as development assets. Every AGENTS.md must preserve:

| Correct | WRONG |
|---------|-------|
| `.opencode/` = Soft Meta-Concepts, OpenCode primitives only | `.opencode/` = development implementation |
| `.opencode/` CONFIGURES runtime behavior | `.opencode/` CONTAINS runtime behavior |
| `.opencode/` stores agents, skills, commands, rules | `.opencode/` stores business logic, state, compiled code |
| `.hivemind/` = canonical state root (Q6) | `.opencode/state/` = current state root |

**Grep guard:** `grep -rn "\.opencode/.*state" src/**/AGENTS.md .hivemind/AGENTS.md` should only return `.opencode/state/` with "legacy" or "migration-only" qualifier.

---

## 7. Escalation

If the sync routine itself fails to catch a drift:
1. Note the gap in this document
2. Add a new check to the Regression Prevention section
3. Commit the checklist update
4. The routine self-improves with each cycle
