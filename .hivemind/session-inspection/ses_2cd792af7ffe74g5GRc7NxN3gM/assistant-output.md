# Session Inspection Export

- ses_id: `ses_2cd792af7ffe74g5GRc7NxN3gM`
- prepared_at: `2026-03-28T03:48:11.183Z`

## Assistant Output

Now I have all the data. Here is the complete structured findings report.

---

## Codebase Investigation Report

**Scope:** All files under `.developing-skills/refactored-skills/` (75+ files: `*.md`, `*.ts`, `*.json`, `*.sh`)
**Question:** Find stale reference strings and terminology inconsistencies across the refactored-skills directory
**Git commit at investigation time:**

---

### Stale Skill Name References

#### 1. `context-intelligence` (excluding `use-hivemind-context`) — **29 hits across 6 files**

All located in `use-hivemind-skill-authoring/references/` (reference docs) + 2 in delegation artifacts. Zero in SKILL.md bodies. This is a **former skill name** that no longer exists as a directory — it was consolidated into `use-hivemind-context`.

| # | File (relative to `refactored-skills/`) | Line | Context |
|---|---------|------|---------|
| 1 | `use-hivemind-skill-authoring/references/01-skill-anatomy.md` | 220 | `Skill directory | kebab-case | context-intelligence` |
| 2 | `use-hivemind-skill-authoring/references/01-skill-anatomy.md` | 259 | `Does it use context-intelligence?` |
| 3 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 37 | `name: context-intelligence` |
| 4 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 103 | `name: context-intelligence` |
| 5 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 107 | `# context-intelligence` |
| 6 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 144 | `name: context-intelligence` |
| 7 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 175 | `name: context-intelligence` |
| 8 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 179 | `pack: context-intelligence# WRONG - FORBIDDEN` |
| 9 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 226 | `name: context-intelligence# RIGHT - kebab-case` |
| 10 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 237 | `name: context-intelligence# RIGHT - kebab-case` |
| 11 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 248 | `name: context-intelligence# RIGHT - lowercase kebab-case` |
| 12 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 54 | `` `context-intelligence` | context-intelligence | delegation, workflow, recovery `` |
| 13 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 273 | `context-intelligence | All packs | P1 entry, stacking: 1` |
| 14 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 274 | `use-hivemind-skill-authoring | context-intelligence | Companion, stacking: 0` |
| 15 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 296 | `### Integration with context-intelligence` |
| 16 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 195 | `vs context-intelligence | vs delegation-scope | vs workflow-hierarchy` |
| 17 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 197 | `context-intelligence | - | Border | Border` |
| 18 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 224 | `context-intelligence | ✓ | ✓ | ✓ | ✓ | ✓ | ✓` |
| 19 | `use-hivemind-skill-authoring/references/07-iterative-refinement.md` | 158 | `## Integration with context-intelligence` |
| 20 | `use-hivemind-skill-authoring/references/07-iterative-refinement.md` | 160 | `integrate with context-intelligence:` |
| 21 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 15 | `context-intelligence | delegation-scope | Border` |
| 22 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 16 | `context-intelligence | workflow-hierarchy | Border` |
| 23 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 18 | `context-rot-recovery | context-intelligence | Extends` |
| 24 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 93 | `IF brainstorm_signal → load context-intelligence (P1)` |
| 25 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 107 | `context-intelligence (P1) — always loaded` |
| 26 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 176 | `## Integration with context-intelligence` |
| 27 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 178 | `integrate with context-intelligence entry checks:` |
| 28 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 79 | `references context-intelligence-entry` (via context-intelligence-entry mention) |
| 29 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `context-intelligence-entry, and git-continuity-memory` (via context-intelligence-entry mention) |

**File type breakdown:** All 27 pure hits are in `references/*.md` under `use-hivemind-skill-authoring/`. 2 additional are in `_artifacts/` under `use-hivemind-delegation/`. **Zero in SKILL.md bodies.**

---

#### 2. `context-intelligence-entry` — **3 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-context/SKILL.md` | 241 | `consolidates the former context-intelligence-entry … and context-entry-verify` (SKILL.md — historical migration note) |
| 2 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 79 | `Line 34 references context-intelligence-entry (good)` |
| 3 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `context-intelligence-entry, and git-continuity-memory` |

**File type:** 1 SKILL.md (migration note), 2 artifact audit files.

---

#### 3. `context-entry-verify` — **1 hit**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-context/SKILL.md` | 241 | `consolidates the former … context-entry-verify into unified use-hivemind-context` |

**File type:** 1 SKILL.md (migration note — not a stale reference per se, it's documenting the consolidation).

---

#### 4. `use-hivemind-detox-refactor` — **2 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 79 | `no reference to: use-hivemind-detox-refactor (the router that triggers this skill)` |
| 2 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `use-hivemind-detox-refactor, hivemind-codemap, hivemind-system-debug, spec-distillation` |

**File type:** Both in `_artifacts/` (audit/change logs). **Zero in SKILL.md or reference docs.**

---

#### 5. `spec-distillation` — **2 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-delegation/_artifacts/02-audit-2026-03-22.md` | 79 | `spec-distillation (planning mode often follows distillation)` |
| 2 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `spec-distillation, context-intelligence-entry, and git-continuity-memory` |

**File type:** Both in `_artifacts/`. **Zero in SKILL.md or reference docs.**

---

#### 6. `context-rot-recovery` — **6 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 39 | `name: context-rot-recovery` |
| 2 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 121 | `Enables: delegation-scope, workflow-hierarchy, context-rot-recovery` |
| 3 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 194 | `` `context-rot-recovery` | Rot > 9 | Emergency protocols `` |
| 4 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 200 | `context-rot-recovery | Extends | No overlap` |
| 5 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 227 | `context-rot-recovery | - | ✓ | - | ✓ | ✓ | ✓` |
| 6 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 18 | `context-rot-recovery | context-intelligence | Extends` |

**File type:** All in `use-hivemind-skill-authoring/references/*.md`. **Zero in SKILL.md bodies.**

---

#### 7. `workflow-hierarchy` — **8 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-skill-authoring/references/01-skill-anatomy.md` | 44 | `Enables: delegation-scope, workflow-hierarchy` |
| 2 | `use-hivemind-skill-authoring/references/02-frontmatter-standard.md` | 121 | `Enables: delegation-scope, workflow-hierarchy, context-rot-recovery` |
| 3 | `use-hivemind-skill-authoring/references/03-three-patterns.md` | 117 | `` `workflow-hierarchy` | Workflows | Plan → Implement → Verify `` |
| 4 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 195 | `vs workflow-hierarchy` (table header) |
| 5 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 199 | `workflow-hierarchy | Border | No overlap | -` |
| 6 | `use-hivemind-skill-authoring/references/05-skill-quality-matrix.md` | 226 | `workflow-hierarchy | ✓ | ✓ | - | - | - | ✓` |
| 7 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 16 | `context-intelligence | workflow-hierarchy | Border` |
| 8 | `use-hivemind-skill-authoring/references/08-conflict-detection.md` | 17 | `delegation-scope | workflow-hierarchy | No overlap` |

**File type:** All in `use-hivemind-skill-authoring/references/*.md`. **Zero in SKILL.md bodies.**

---

#### 8. `git-continuity-memory` — **1 hit**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `use-hivemind-delegation/_artifacts/03-change-summary-2026-03-22.md` | 62 | `git-continuity-memory` (in list of sibling skill references) |

**File type:** 1 artifact changelog. **Zero in SKILL.md or reference docs.**

---

#### 9. `hivemind-ownership` — **1 hit**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `hivemind-atomic-commit/references/surface-ownership.md` | 56 | `Override ownership via .hivemind-ownership.json:` |

**File type:** 1 reference doc. **NOT a stale skill name** — this references a runtime config file (`.hivemind-ownership.json`), not a skill.

---

#### 10. `hivemind-secret-allow` — **3 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `hivemind-atomic-commit/scripts/hm-git-gate.sh` | 60 | `local af="${PROJECT_ROOT}/.hivemind-secret-allow"` |
| 2 | `hivemind-atomic-commit/scripts/hm-git-gate.sh` | 63 | `allowed by .hivemind-secret-allow` |
| 3 | `hivemind-atomic-commit/references/git-gate.md` | 54 | `Override: .hivemind-secret-allow file lists regex patterns` |

**File type:** 1 shell script, 1 reference doc. **NOT a stale skill name** — references a runtime config file, not a skill.

---

#### 11. `hivemind-classify` — **2 hits**

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `hivemind-atomic-commit/references/activity-classifier.md` | 71 | `via a .hivemind-classify.json file in the project root` |
| 2 | `hivemind-atomic-commit/scripts/hm-activity-classify.sh` | 23 | `OVERRIDES_FILE="${OVERRIDES_FILE:-${PROJECT_ROOT}/.hivemind-classify.json}"` |

**File type:** 1 reference doc, 1 shell script. **NOT a stale skill name** — references a runtime config file, not a skill.

---

### Terminology Inconsistency Counts

| # | Pattern | Total | SKILL.md | Reference | Test | Other | Verdict |
|---|---------|-------|----------|-----------|------|-------|---------|
| 12 | `handoff packet` | **3** | 2 | 1 | 0 | 0 | Used in `use-hivemind-delegation/SKILL.md:3`, `use-hivemind/SKILL.md:178`, `use-hivemind/references/orchestrator-mandate.md:256` |
| 13 | `dispatch packet` | **0** | 0 | 0 | 0 | 0 | Not found — no inconsistency |
| 14 | `child agent` | **3** | 2 | 1 | 0 | 0 | Used in `use-hivemind-context/SKILL.md:185,232` and `context-distrust-protocol.md:54`. Terminology should be "subagent" |
| 15 | `delegated agent` | **2** | 0 | 0 | 1 | 1 | Both are genuine "an agent delegated a task" usage — `hiveminder-operation-guidelines.md:153`, `use-hivemind-delegation/tests/failure-recovery.md:5`. **Not a terminology inconsistency.** |
| 16 | `depth partner` | **0** | 0 | 0 | 0 | 0 | Not found |
| 17 | `depth companion` | **0** | 0 | 0 | 0 | 0 | Not found |
| 18 | `depth specialist` | **2** | 2 | 0 | 0 | 0 | Both in `use-hivemind-skill-authoring/SKILL.md:131,178` — used as a role description, not as a skill name |
| 19 | `hiveminder` (SKILL.md only) | **6** | 6 | 0 | 0 | 0 | All in `use-hivemind/SKILL.md` at lines 3, 13, 17, 21, 221, 323 — used as the standalone role name for the orchestrator agent |
| 20 | `verification-before-completion` | **7** | 5 | 0 | 0 | 2 | References to the file path `references/verification-before-completion.md` in 5 SKILL.md tables, plus `depth-skills.json:139` and in the actual reference file name itself |

---

### Summary Totals

| Pattern | Count | Status |
|---------|-------|--------|
| 1. `context-intelligence` | **29** | 🔴 **STALE** — No skill directory by this name exists. Should be `use-hivemind-context`. 27 in `skill-authoring/references/`, 2 in delegation `_artifacts/`. |
| 2. `context-intelligence-entry` | **3** | 🔴 **STALE** — Was consolidated into `use-hivemind-context`. 1 SKILL.md migration note, 2 artifacts. |
| 3. `context-entry-verify` | **1** | 🟡 **MIGRATION NOTE** — Only in SKILL.md documenting what was consolidated. Not a stale usage. |
| 4. `use-hivemind-detox-refactor` | **2** | 🔴 **STALE** — Only in audit artifacts. No skill directory by this name exists. |
| 5. `spec-distillation` | **2** | 🔴 **STALE** — Only in audit artifacts. No skill directory by this name exists. |
| 6. `context-rot-recovery` | **6** | 🔴 **STALE** — No skill directory by this name exists. All in `skill-authoring/references/`. |
| 7. `workflow-hierarchy` | **8** | 🔴 **STALE** — No skill directory by this name exists. All in `skill-authoring/references/`. |
| 8. `git-continuity-memory` | **1** | 🔴 **STALE** — Only in artifact changelog. Actual skill is `use-hivemind-git-memory`. |
| 9. `hivemind-ownership` | **1** | 🟢 **NOT STALE** — References runtime config file `.hivemind-ownership.json`, not a skill name. |
| 10. `hivemind-secret-allow` | **3** | 🟢 **NOT STALE** — References runtime config file `.hivemind-secret-allow`, not a skill name. |
| 11. `hivemind-classify` | **2** | 🟢 **NOT STALE** — References runtime config file `.hivemind-classify.json`, not a skill name. |

### Contamination Hotspot

**The primary contamination zone is `use-hivemind-skill-authoring/references/`** — all 6 reference files (`01-skill-anatomy.md`, `02-frontmatter-standard.md`, `03-three-patterns.md`, `05-skill-quality-matrix.md`, `07-iterative-refinement.md`, `08-conflict-detection.md`) reference multiple skill names that no longer exist as directories:

- `context-intelligence` (27 hits) — should be `use-hivemind-context`
- `context-rot-recovery` (6 hits) — no equivalent directory
- `workflow-hierarchy` (8 hits) — no equivalent directory
- `delegation-scope` (implied, appears in matrices)
- `context-intelligence-entry` (implied through examples)

These reference docs use the old naming taxonomy throughout their examples, tables, and integration guides.

### Secondary Contamination

**`use-hivemind-delegation/_artifacts/`** contains audit/change-summary documents that reference `use-hivemind-detox-refactor`, `spec-distillation`, `context-intelligence-entry`, and `git-continuity-memory` — all stale skill names.

### Terminology Gaps

- **`child agent` (3 occurrences)** — inconsistency with the canonical term `subagent` used everywhere else
- **`depth specialist` (2 occurrences)** — used as a role descriptor in skill-authoring SKILL.md; not a stale reference but a terminology variant
- **`handoff packet` (3 occurrences)** — consistent usage, no competing `dispatch packet` term found