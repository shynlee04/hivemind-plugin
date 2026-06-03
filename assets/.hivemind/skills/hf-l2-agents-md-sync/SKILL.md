---
name: hf-agents-md-sync
description: "Detects and fixes drift between AGENTS.md documentation and actual codebase state. Scans source files and .opencode/ directories, compares claims against reality, produces a structured drift report, then applies targeted edits. Triggers on: 'sync agents md', 'update AGENTS.md', 'fix agents md drift', 'AGENTS.md out of date', 'check agent instruction drift'. NOT for generic documentation writing or README refreshes."
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

## Overview

Detects and fixes drift between AGENTS.md documentation and actual codebase state. Use when documentation claims don't match reality, after refactoring sprints, or when syncing instructions across platforms. Produces a structured drift report with targeted edits to bring documentation back in line with code.

## The Iron Law

```
SCAN REPORTS FACTS. EDIT FIXES DRIFT. NEVER REGENERATES FROM SCRATCH.
```

This skill reads the codebase, compares claims to reality, and applies targeted edits. It never overwrites entire files, never generates new AGENTS.md files, and never adds sections that don't already exist.

# agents-md-sync

Detects and fixes AGENTS.md drift. Scan → Diff → Apply. Never regenerates from scratch.
## On Load

1. Verify both AGENTS.md targets exist:
   - `AGENTS.md` (project root)
   - `src/lib/AGENTS.md` (library internals)
2. If either is missing → report the missing file and stop. This skill syncs existing documentation — it does not create new AGENTS.md files. For creation, use the `create-agentsmd` skill instead.
3. Read both files into memory for diff comparison.

## Phase 1: Scan — Gather Ground Truth

Run these scans in sequence. The project is small enough that no parallelism is needed.

### Scan Targets

| Path | Extract | Command |
|------|---------|---------|
| `src/lib/*.ts` | Module names + approximate LOC | `Glob("src/lib/*.ts")` then `Bash("wc -l src/lib/*.ts")` |
| `src/tools/**/*.ts` | Tool file names | `Glob("src/tools/**/*.ts")` |
| `src/hooks/**/*.ts` | Hook file names | `Glob("src/hooks/**/*.ts")` |
| `src/shared/**/*.ts` | Shared utility names | `Glob("src/shared/**/*.ts")` |
| `src/schema-kernel/**/*.ts` | Schema file names | `Glob("src/schema-kernel/**/*.ts")` |
| `.opencode/agents/*.md` | Count + file names | `Glob(".opencode/agents/*.md")` |
| `.opencode/skills/*/SKILL.md` | Count + skill names | `Glob(".opencode/skills/*/SKILL.md")` |
| `.opencode/commands/*.md` | Count + command names | `Glob(".opencode/commands/*.md")` |
| `package.json` | Dependencies, scripts, engines | `Read("package.json")` |

### Extraction Rules

- **Module names**: filename without `.ts` extension (e.g., `concurrency.ts` → `concurrency`)
- **LOC**: `wc -l` per file, rounded to nearest 5 for estimates (e.g., 78 → ~80, 401 → ~400)
- **Counts**: exact integer from glob result array length
- **Names**: sorted alphabetically for stable comparison
- **Export functions**: `Grep("^export (function|async function|const)", path)` per module — only extract if AGENTS.md claims specific exports

## Phase 2: Diff — Compare Claims to Reality

Read each AGENTS.md file and compare every verifiable claim against the scanned ground truth.

### Root AGENTS.md Checks

| Category | What to Check | Typical Location |
|----------|--------------|-----------------|
| Project Structure tree | All directories and files listed match `Glob` reality | `## Project Structure` section |
| `src/lib/` module list | Every `.ts` file appears in tree, no phantom entries | Tree listing under `src/lib/` |
| `src/shared/` presence | Directory exists with correct files | Tree listing |
| `src/schema-kernel/` presence | Directory exists with correct files | Tree listing |
| `.opencode/` agent count | Claimed count matches `Glob` result count | `## OpenCode Integration` section |
| `.opencode/` skill count | Claimed count matches `Glob` result count | `## OpenCode Integration` section |
| `.opencode/` command count | Claimed count matches `Glob` result count | `## OpenCode Integration` section |
| `.opencode/` name lists | Listed names match actual files | `## OpenCode Integration` section |
| "Where to find things" | Every module/directory has a table entry | Table in that section |
| Dependency rules | Module list matches `src/lib/` contents | `### Dependency rules` |
| Runtime features | Feature list matches implemented features | Narrative section |
| Architecture LOC targets | Total LOC claims match current `wc -l` totals | `### Target architecture` |

### src/lib/AGENTS.md Checks

| Category | What to Check |
|----------|--------------|
| MODULE RESPONSIBILITIES table | Every `.ts` file has a row, LOC estimates are current, export lists match `Grep` results |
| DEPENDENCY GRAPH | Every dependency edge still exists, new modules appear |
| "Where to Look" table | Every module has an entry |
| CODE SMELLS | Listed issues still exist (e.g., LOC thresholds still exceeded) |

### Drift Report Format

After comparison, produce a drift report in this exact format before making any edits:

```markdown
## AGENTS.md Drift Report — {YYYY-MM-DD}

### Root AGENTS.md
| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | [section name] | [claimed value] | [actual value] | [specific edit description] |

### src/lib/AGENTS.md
| # | Section | Claimed | Actual | Fix |
|---|---------|---------|--------|-----|
| 1 | [section name] | [claimed value] | [actual value] | [specific edit description] |

### Summary
- Total drift items: {N}
- Auto-fixable: {N}
- Manual fixes needed: {N}
```

**Quality gate:** The drift report must contain specific claimed and actual values with the exact edit description before any edits are applied. No fuzzy edits.

## Phase 3: Apply — Edit AGENTS.md Files

For each auto-fixable drift item in the report:

1. **Locate exact text** — Use `Grep` to find the exact claimed value in the target AGENTS.md file. Note the surrounding context to ensure uniqueness.
2. **Edit** — Use `Edit(oldString=<exact-wrong-text>, newString=<correct-text>)`. The `oldString` must be a verbatim copy from the file — character-for-character match.
3. **Verify** — After each edit, `Read` the edited section to confirm the change applied correctly.
4. **Log** — Record the result (success or failure) for the summary.

### Apply Rules

- **Always use Edit tool** — never Write on existing files. Both AGENTS.md files already exist and must be preserved.
- **Never add new sections** — only fix content in existing sections. If a section is missing entirely, flag it as a manual fix.
- **Skip and flag** — if the exact text is not found (perhaps already fixed, or the structure changed), log it as "MANUAL FIX NEEDED" and proceed to the next item.
- **One edit at a time** — each drift item gets its own Edit call. Never batch multiple changes into one edit.

## Quality Gates

| Gate | Rule | Enforcement |
|------|------|-------------|
| **Edit-only** | Never use Write tool on existing AGENTS.md files | Use Edit tool exclusively |
| **Exact match** | `oldString` must be verbatim from the file | Grep first, copy exact text |
| **No new sections** | Only fix existing content, don't create new sections | Skip missing sections, flag as manual |
| **Verify after edit** | Re-read the edited section to confirm change applied | Read immediately after Edit |
| **Report before apply** | Always show drift report to user before any edits | Two-pass: Phase 2 report → Phase 3 apply |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Regenerator** | Using Write tool on existing AGENTS.md files | STOP. Use Edit tool only. Write destroys context. |
| **The Hallucinator** | Adding content not verified by filesystem scan | STOP. Only edit what the scan confirms is wrong. |
| **The Skipper** | Applying edits without producing a drift report first | STOP. Always run Phase 2 before Phase 3. |
| **The Creator** | Generating new AGENTS.md files for directories that don't have one | STOP. This skill syncs existing files. Use `create-agentsmd` skill instead. |
| **The Over-Scoper** | Scanning `node_modules/`, `dist/`, `.git/`, or other non-source directories | STOP. Only scan the paths listed in Phase 1 Scan Targets table. |

## Self-Correction

### When the Task Keeps Failing
[Detection] Drift report shows same items across 3+ sync attempts. Edit fails because `oldString` not found despite appearing in the drift report. Phase 2 Diff over-corrects (reports drift that doesn't exist because file was already fixed).
[Recovery] STOP making edits. Re-run Phase 1 Scan to get fresh ground truth. Rebuild the drift report from current state (not cached results). If an edit's `oldString` is not found, the text may have already changed — skip that item and move to the next. If the same drift items persist, the scan extraction rules may be incorrectly matching — verify the extraction GLobs and Grep patterns.

### When Unsure About the Next Step
[Detection] AGENTS.md structure has changed significantly since last scan. Claimed values in AGENTS.md are in a different section than expected. Unclear whether a discrepancy is drift or intentional divergence.
[Recovery] Read the relevant AGENTS.md section in full to understand the current structure. If the section was renamed or reorganized: update the "Typical Location" column in the scan table before proceeding. For intentional divergences: flag them as "MANUAL FIX NEEDED — possible intentional divergence" in the drift report rather than auto-fixing.

### When the User Contradicts Skill Guidance
[Detection] User says "just regenerate the whole file" or "use Write instead of Edit" or "add a new section for the new modules." User wants to violate the "NEVER REGENERATES FROM SCRATCH" iron law.
[Recovery] Acknowledge: "This skill's iron law is SCAN REPORTS FACTS. EDIT FIXES DRIFT. NEVER REGENERATES FROM SCRATCH. Regenerating destroys hand-written context, cross-references, and narrative sections." If the user insists, warn that regeneration will lose narrative content. Proceed only with explicit confirmation, and note in the drift report that regeneration was user-authorized.

### When an Edge Case Is Encountered
[Detection] AGENTS.md references files that don't exist (phantom entries) but also has file entries not in the scan targets table. Multiple AGENTS.md files exist at different paths. File was renamed but AGENTS.md still uses old name.
[Recovery] For phantom entries: flag for removal in the drift report with the note "file does not exist." For new files not in scan targets: add them to the scan targets list dynamically and re-scan. For renames: report both the old claimed name and the new actual name with a "rename" fix type. For multiple AGENTS.md files: process them one at a time, starting with the root AGENTS.md.
