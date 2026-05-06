# Research: agents-md-sync Skill Design

**Researched:** 2026-04-21
**Domain:** Skill design, AGENTS.md drift detection, automated documentation sync
**Confidence:** HIGH (format analysis verified against 3 live skills, OMO template fetched, previous drift analysis reused)

## Summary

This research produces a concrete design for an `agents-md-sync` skill that detects and fixes AGENTS.md drift in this project. The skill format follows the conventions established by the 22 existing skills in `.opencode/skills/`. The drift-detection logic adapts patterns from OMO's `deep-init` command, simplified for our project's scale (4,581 LOC, 2 AGENTS.md locations).

The previous research (260421-u9n) identified 25 specific drift items across root and `src/lib/` AGENTS.md files, and recommended "Option A: Dedicated Skill" over command or manual approaches. This research builds on that recommendation with an implementation-ready skill design.

**Primary recommendation:** Create `.opencode/skills/agents-md-sync/SKILL.md` — a single-file skill (no references/ subdirectory needed given the skill's narrow scope) that scans specific paths, compares claims to reality, produces a structured drift report, then applies targeted edits using the Edit tool.

---

## Task 1: Skill Format Conventions (from 3 Existing Skills)

### YAML Frontmatter Fields

All three analyzed skills share a common frontmatter structure:

| Field | Required | Values Seen | Notes |
|-------|----------|-------------|-------|
| `name` | YES | kebab-case, matches directory name | `meta-builder`, `agent-authorization`, `harness-audit` |
| `description` | YES | Long string with trigger phrases in quotes | Follows pattern: `"This skill should be used when the user asks to [trigger1], [trigger2], ..."` or `"Routes requests about X ... Triggers on: 'verb X', 'verb Y'."` |
| `version` | Optional | `"1.0.0"`, `"3.0.0"`, `"4.0.0"` | Present in 2/3 skills |
| `metadata.layer` | Common | `"0"`, `"1"`, `"domain-execution"` | Router/orchestration layer |
| `metadata.role` | Common | `"router"`, `"auditor"`, `"domain-execution"` | Functional role |
| `metadata.pattern` | Common | `"Navigation"`, `"P2"`, `"P3"` | Pattern classification |
| `metadata.lineage` | Rare | `"hivefiver"` | Only meta-builder |
| `metadata.hierarchy` | Rare | `"coordinator"` | Only meta-builder |
| `allowed-tools` | Common | List of tool names | `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task` |

### Section Structure (Observed Pattern)

```
# {skill-name}

## Overview / First Action
## The Iron Law (optional — behavioral constraint)
## On Load (bootstrap actions)
## Execution Flow / Workflow
## [Domain-specific sections]
## Anti-Patterns
## Validation Gate / Validation (optional)
```

### Trigger Description Pattern

Two patterns observed:

1. **Verb-trigger style** (agent-authorization, harness-audit):
   ```
   "This skill should be used when the user asks to 'trigger1', 'trigger2', 'trigger3'."
   ```

2. **Capability+trigger style** (meta-builder):
   ```
   "Routes requests about X. ... Triggers on: 'create X', 'audit X'."
   ```

### Typical Length

| Skill | Lines | Role |
|-------|-------|------|
| `meta-builder` | 403 | Router — complex routing tables, references |
| `agent-authorization` | 237 | Domain — gate definitions, specialist profiles |
| `harness-audit` | 158 | Auditor — dispatch protocol, severity levels |

For `agents-md-sync`: expect ~120-180 lines (single responsibility: scan, diff, apply).

### Subdirectory Conventions

| Subdirectory | Purpose | When Present |
|-------------|---------|-------------|
| `references/` | Supporting docs loaded on demand | Complex skills with depth material |
| `assets/` | Templates, profiles, frontmatter skeletons | Skills that create other meta-concepts |
| `scripts/` | Bash validation/compilation scripts | Skills with automated checks |
| `workflows/` | Step-by-step procedural flows | Skills with multi-step processes |

For `agents-md-sync`: **No subdirectories needed.** The skill has a single scan→diff→apply flow with no depth material to reference. Keeping it as a single SKILL.md follows the pattern of simpler skills like `agent-authorization` (which has `references/gates.md` only because it defines complex gate structures).

### `<files_to_read>` Directive

Two of three skills use `<files_to_read>` blocks immediately after frontmatter:

```yaml
<files_to_read>
.opencode/skills/harness-audit/references/pointers.md
.opencode/skills/harness-audit/scripts/compile-bundle.sh
</files_to_read>
```

This is an OpenCode directive that pre-loads files when the skill is activated. For `agents-md-sync`, the AGENTS.md files being synced should NOT be pre-loaded (they're dynamic targets), so we skip this directive.

---

## Task 2: OMO deep-init Pattern Analysis

**Source:** [VERIFIED: raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/src/features/builtin-commands/templates/init-deep.ts]

### Key Patterns to Adapt

| OMO Pattern | Our Adaptation | Rationale |
|-------------|----------------|-----------|
| **Scoring matrix** (8 factors, weighted) | Simplified: 3-factor check (file exists, content matches, counts correct) | We have 2 fixed AGENTS.md locations, not dynamic discovery |
| **Edit vs Write rule** | Same rule — always Edit existing AGENTS.md | Both files exist already |
| **Quality gates** (50-150 root, 30-80 subdirs) | Keep current sizes, just fix content | Our root is ~200 lines (already above OMO's cap) |
| **Telegraphic style mandate** | Already our convention | No change needed |
| **Phase workflow** (discovery→score→generate→review) | 3-phase: scan→diff→apply | Simplified for 2-file scope |
| **Score threshold** (>15 gets AGENTS.md) | Not applicable | Fixed locations, no scoring needed |
| **Dynamic agent spawning** | Not applicable | Single-agent scan, no parallelism needed |
| **LSP codemap** | Not applicable | Project too small |

### What We DON'T Adapt

- **Concurrent explore agents**: Overkill for 2 AGENTS.md files
- **`--create-new` mode**: We want targeted updates only
- **Deep directory scoring**: We have fixed locations
- **Agent count scaling**: N/A for our scope

### Critical Design Decision from OMO

> "If AGENTS.md already exists at the target path → use Edit tool. If it does NOT exist → use Write tool."

This is the key edit-vs-write rule. For our project, both AGENTS.md files exist, so we always use Edit.

---

## Task 3: Previous Research Context

**Source:** `.planning/quick/260421-u9n-RESEARCH.md` [VERIFIED: read from disk]

### Key Findings from Previous Research

1. **25 specific drift items** identified across both AGENTS.md files (17 root, 8 src/lib/)
2. **Option A: Dedicated Skill** recommended over command or manual approach
3. **Scan targets documented**: `src/lib/*.ts`, `src/tools/*`, `src/hooks/*`, `src/shared/*`, `src/schema-kernel/*`, `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`
4. **Existing related skills**: `create-agentsmd` (HIGH relevance), `agent-md-refactor` (HIGH relevance), `gsd-docs-update` (MEDIUM)
5. **OMO scoring**: Directories scoring >15 get AGENTS.md — not applicable to us (fixed locations)

### Assumptions Carried Forward

| # | Assumption | Risk |
|---|-----------|------|
| A1 | 57 agent files are intentional (not accidental) | If cleanup needed, count changes |
| A2 | `delegation-persistence.ts` exports are stable | If API changes, exports list needs update |
| A3 | No other AGENTS.md files exist elsewhere | If there are more, they need scanning |

---

## Task 4: Concrete Skill Design

### SKILL.md Frontmatter

```yaml
---
name: agents-md-sync
description: "Detects and fixes drift between AGENTS.md documentation and actual codebase state. Scans source files and .opencode/ directories, compares claims against reality, produces a structured drift report, then applies targeted edits. Triggers on: 'sync agents md', 'update agents md', 'fix agents md drift', 'check documentation drift', 'agents md out of date', 'sync documentation'."
version: "1.0.0"
metadata:
  layer: "domain-execution"
  role: "sync"
  pattern: "scan-diff-apply"
allowed-tools:
  - Read
  - Edit
  - Bash
  - Glob
  - Grep
---
```

### Trigger Description Design

The description uses verb-trigger style matching the project convention:

- **Primary triggers:** `'sync agents md'`, `'update agents md'`, `'fix agents md drift'`
- **Secondary triggers:** `'check documentation drift'`, `'agents md out of date'`, `'sync documentation'`
- **Scope limiter:** Explicitly mentions AGENTS.md (not general documentation)

### Scan Logic

The skill scans specific paths in a defined order:

```bash
# Phase 1: SCAN — gather ground truth

# Source code modules
src/lib/*.ts          # Module list, exports, approximate LOC
src/tools/**/*.ts     # Tool files
src/hooks/**/*.ts     # Hook files
src/shared/**/*.ts    # Shared utilities
src/schema-kernel/**/*.ts  # Zod schemas

# OpenCode meta-concepts
.opencode/agents/*.md    # Agent count + names
.opencode/skills/*/SKILL.md  # Skill count + names
.opencode/commands/*.md  # Command count + names

# Package metadata
package.json           # Dependencies, scripts, version constraints
tsconfig.json          # Compiler options
```

**Extraction rules:**

| Path | Extract | How |
|------|---------|-----|
| `src/lib/*.ts` | Module names, approximate LOC, export functions | `glob` + `wc -l` + `grep "^export"` |
| `src/tools/**/*.ts` | Tool file names | `glob` |
| `.opencode/agents/` | Count of `.md` files, list of names | `glob` + count |
| `.opencode/skills/` | Count of `SKILL.md` files, list of skill names | `glob` + count |
| `.opencode/commands/` | Count of `.md` files, list of names | `glob` + count |
| `package.json` | Dependencies, engines, scripts | `Read` (small file) |

### Diff Logic

Compare extracted ground truth against AGENTS.md claims:

```
For each AGENTS.md file:
  1. Read the file
  2. Extract verifiable claims:
     - Module lists in project structure trees
     - LOC estimates for specific modules
     - Counts of agents/skills/commands
     - Names of agents/skills/commands
     - "Where to find things" table entries
     - Dependency rules lists
  3. For each claim:
     - If claim matches reality → SKIP (no edit)
     - If claim mismatches reality → ADD to drift report with:
       - Section name
       - Line range (approximate)
       - Claimed value
       - Actual value
       - Specific edit needed
  4. For missing claims (reality exists but AGENTS.md doesn't mention):
     - ADD to drift report as "MISSING" with:
       - What's missing
       - Where it should be added (section + after-which-line)
       - Content to add
```

**Quality gate:** The drift report must have specific line ranges and exact replacement text before any edits are applied. No fuzzy edits.

### Apply Logic

```
For each item in drift report:
  1. Locate the exact text in AGENTS.md using the section name and claimed value
  2. Use Edit tool with:
     - oldString = the exact text that's wrong
     - newString = the correct text
  3. Verify the edit applied cleanly (Edit tool returns success/failure)
  4. If edit fails (text not found):
     - Log the failure
     - Skip to next item
     - Include in final report as "MANUAL FIX NEEDED"
```

**Never use Write tool** — both AGENTS.md files exist and contain content that should be preserved. Always Edit.

### Quality Gates (Simplified from OMO)

| Gate | Rule | Enforcement |
|------|------|-------------|
| **Edit-only** | Never overwrite entire AGENTS.md | Use Edit tool, never Write |
| **Specific lines** | Every edit must target a specific section | oldString must be exact match |
| **No generation** | Don't generate new sections, only fix existing | Only edit what's already there |
| **Verify after apply** | Re-read edited section to confirm | Read after Edit, check content |
| **Drift report first** | Always produce report before any edits | Two-pass: report → apply |

### Skill Body Sections

```
# agents-md-sync

## Overview
## The Iron Law
## On Load
## Phase 1: Scan
## Phase 2: Diff
## Phase 3: Apply
## Scan Targets (table)
## Drift Report Format
## Quality Gates
## Anti-Patterns
```

### Estimated Size

~150 lines — within the observed range for domain-execution skills.

---

## Complete Skill Design (Draft)

```yaml
---
name: agents-md-sync
description: "Detects and fixes drift between AGENTS.md documentation and actual codebase state. Scans source files and .opencode/ directories, compares claims against reality, produces a structured drift report, then applies targeted edits. Triggers on: 'sync agents md', 'update agents md', 'fix agents md drift', 'check documentation drift', 'agents md out of date', 'sync documentation'."
version: "1.0.0"
metadata:
  layer: "domain-execution"
  role: "sync"
  pattern: "scan-diff-apply"
allowed-tools:
  - Read
  - Edit
  - Bash
  - Glob
  - Grep
---

# agents-md-sync

Detects and fixes AGENTS.md drift. Scan → Diff → Apply. Never regenerates.

## The Iron Law

```
SCAN REPORTS FACTS. EDIT FIXES DRIFT. NEVER REGENERATES FROM SCRATCH.
```

## On Load

1. Verify both AGENTS.md targets exist:
   - `AGENTS.md` (root)
   - `src/lib/AGENTS.md`
2. If either missing → report and stop (this skill syncs, it doesn't create)

## Phase 1: Scan — Gather Ground Truth

Run these scans in sequence (our project is small, no parallelism needed):

### Scan Targets

| Path | Extract | Command |
|------|---------|---------|
| `src/lib/*.ts` | Module names, LOC | `glob("src/lib/*.ts")` then `wc -l` per file |
| `src/tools/**/*.ts` | Tool file names | `glob("src/tools/**/*.ts")` |
| `src/hooks/**/*.ts` | Hook file names | `glob("src/hooks/**/*.ts")` |
| `src/shared/**/*.ts` | Shared utility names | `glob("src/shared/**/*.ts")` |
| `src/schema-kernel/**/*.ts` | Schema file names | `glob("src/schema-kernel/**/*.ts")` |
| `.opencode/agents/*.md` | Count + names | `glob(".opencode/agents/*.md")` |
| `.opencode/skills/*/SKILL.md` | Count + names | `glob(".opencode/skills/*/SKILL.md")` |
| `.opencode/commands/*.md` | Count + names | `glob(".opencode/commands/*.md")` |
| `package.json` | deps, scripts | `Read("package.json")` |

### Extraction Rules

- **Module names**: filename without extension (e.g., `concurrency.ts` → `concurrency`)
- **LOC**: `wc -l` rounded to nearest 5 (e.g., 78 → ~80)
- **Counts**: exact count from glob results
- **Export functions**: `grep "^export function\|^export async function\|^export const"` per module

## Phase 2: Diff — Compare Claims to Reality

### For Root AGENTS.md

Read the file and check these claim categories:

| Category | What to Check | Typical Location |
|----------|--------------|-----------------|
| Project Structure tree | All directories listed match reality | `## Project Structure` section |
| Module count | Number of modules in `src/lib/` matches tree | Tree listing |
| `.opencode/` counts | Agent/skill/command counts match actual | `## OpenCode Integration` section |
| `.opencode/` names | Listed names match actual files | `## OpenCode Integration` section |
| "Where to find things" | All modules have entries | Table in that section |
| Dependency rules | Module list matches `src/lib/` contents | `### Dependency rules` |
| Runtime features | Feature list matches implemented features | `### Runtime features` |
| Target architecture | LOC targets are current | `### Target architecture` |

### For src/lib/AGENTS.md

| Category | What to Check |
|----------|--------------|
| MODULE RESPONSIBILITIES | All .ts files listed, LOC estimates correct |
| DEPENDENCY GRAPH | All dependency edges correct |
| "Where to Look" table | All modules have entries |
| CODE SMELLS | Issues still exist (e.g., LOC thresholds) |

### Drift Report Format

```
## AGENTS.md Drift Report — {date}

### Root AGENTS.md
| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | ... | ... | ... | ... |

### src/lib/AGENTS.md
| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | ... | ... | ... | ... |

### Summary
- Total drift items: {N}
- Auto-fixable: {N}
- Manual fixes needed: {N}
```

## Phase 3: Apply — Edit AGENTS.md Files

For each auto-fixable drift item:

1. Locate exact text using `Grep` for the claimed value
2. `Edit(oldString=<exact-wrong-text>, newString=<correct-text>)`
3. Verify edit succeeded
4. Log result

**Rules:**
- Always use Edit tool, never Write
- Never add new sections — only fix existing content
- If exact text not found → skip and flag as manual

## Quality Gates

| Gate | Rule |
|------|------|
| Edit-only | Never use Write tool on existing files |
| Exact match | oldString must be verbatim from the file |
| No new sections | Only fix existing content, don't add new sections |
| Verify after edit | Re-read the edited section to confirm |
| Report before apply | Always show drift report to user before applying |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Regenerator** | Using Write on existing AGENTS.md | STOP. Use Edit only. |
| **The Hallucinator** | Adding content not verified by scan | STOP. Only edit what scan confirms. |
| **The Skipper** | Applying edits without showing drift report | STOP. Show report first. |
| **The Creator** | Generating new AGENTS.md for directories that don't have one | STOP. This skill syncs, not creates. Use `create-agentsmd` instead. |
| **The Over-Scoper** | Scanning node_modules, dist, .git | STOP. Only scan listed targets. |
```

---

## Implementation Notes

### File Location

```
.opencode/skills/agents-md-sync/
└── SKILL.md    # Single file, no subdirectories needed
```

### Integration Points

| Integration | How |
|------------|-----|
| **Manual trigger** | User says "sync agents md" or "check documentation drift" |
| **Post-phase trigger** | Agent loads this skill after major code changes |
| **gsd-docs-update** | Could compose this skill as a sub-step |
| **agent-md-refactor** | Load AFTER sync to validate structure quality |

### Related Skills (Load Order)

If used as part of a stack:
1. `agents-md-sync` (this skill) — fix drift
2. `agent-md-refactor` — validate progressive disclosure
3. Never stack more than 2 skills for this task

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Both AGENTS.md files exist and are Edit-able | Phase 3 | If either is deleted, skill stops |
| A2 | No other AGENTS.md files in the project | Scan Targets | If more exist, they're not synced |
| A3 | Edit tool can match multi-line oldString | Quality Gates | If Edit fails on complex blocks, manual fix needed |
| A4 | Agent/skill/command counts in .opencode/ are accurate indicators | Diff Logic | If files are symlinks or broken, count may be wrong |

All format convention claims were verified against 3 live skill files.

---

## Sources

### Primary (HIGH confidence)
- `.opencode/skills/meta-builder/SKILL.md` — format analysis (403 lines, router pattern) [VERIFIED: read from disk]
- `.opencode/skills/agent-authorization/SKILL.md` — format analysis (237 lines, domain pattern) [VERIFIED: read from disk]
- `.opencode/skills/harness-audit/SKILL.md` — format analysis (158 lines, audit pattern) [VERIFIED: read from disk]
- OMO deep-init template — scoring/diff patterns [VERIFIED: fetched from GitHub raw]

### Secondary (MEDIUM confidence)
- `.planning/quick/260421-u9n-RESEARCH.md` — previous drift analysis with 25 specific items [VERIFIED: read from disk]

## Metadata

**Confidence breakdown:**
- Skill format conventions: HIGH — verified against 3 live skills
- OMO pattern adaptation: HIGH — fetched and analyzed source template
- Drift detection design: HIGH — builds on verified 25-item drift analysis
- Apply logic: MEDIUM — depends on Edit tool reliability for complex multi-line matches

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable — skill format conventions rarely change)
