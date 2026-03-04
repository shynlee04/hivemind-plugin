Overview
Automated structural integrity scanner for the entire Agent Studio framework. Catches issues that silently break agent workflows: wrong require() paths that crash at runtime, phantom skills referenced in agent frontmatter that don't exist on disk, stale agent registry counts, archived references still active in production code, UTF-16 encoding that breaks parsers, and bloated agent configs.

Core principle: Framework structural issues are pre-production bugs. A phantom skill reference means an agent will fail silently. A broken require() means a hook crashes at the wrong moment. The scanner enforces zero-tolerance for these.

When to Invoke
Skill({ skill: 'ecosystem-integrity-scanner' });
Invoke proactively after:

Bulk framework changes (batch skill/agent/hook creation or archiving)
Refactoring module paths or directory structure
Running a major audit or cleanup pass
Suspecting phantom references or broken require() chains
Before finalizing any CI sanity gate
Mandatory Skills
Invoke before starting this skill:

Skill	Purpose	When
task-management-protocol	Track scan progress	Always
ripgrep	Fast targeted code search	When investigating
code-semantic-search	Concept discovery	When pattern hunting
token-saver-context-compression	Compress large audit results	When output is large
verification-before-completion	Gate completion on zero errors	Before marking done
memory-search	Check prior audit patterns	At start
Iron Laws
Always run from project root. validate-ecosystem-integrity.cjs resolves all paths relative to process.cwd(). Running from a subdirectory corrupts all path resolution. Never invoke from a non-root directory.

Never ignore PHANTOM_REQUIRE errors. A [PHANTOM_REQUIRE] error means a hook or script will throw MODULE_NOT_FOUND at runtime. These always represent real breakage — no false positives once the scanner is properly calibrated.

Never mark scan complete while errors > 0. Warnings are advisory; errors are blocking. Report path and severity but do not call the pipeline done until errors reach zero or are explicitly accepted as known exceptions with owner annotation.

Always route HIGH errors to specialist agents. Phantom skills → qa agent. Broken require() → developer agent. Archive refs in production → developer. Never attempt to remediate complex structural failures inline without delegation.

Always save the audit report before completing. Write the categorized findings to .claude/context/reports/qa/ecosystem-integrity-report-{ISO-date}.md before calling TaskUpdate(completed). Evidence must persist across context resets.

Anti-Patterns
Anti-Pattern	Risk	Correct Approach
Treating [STALE_CATALOG] as informational noise	Registry drifts from reality; agents get wrong counts	Always update agent-registry.json when agent files change
Skipping scan after bulk framework batch ops	Batch ops most commonly create phantom refs	Run scan as the FINAL step of every batch operation
Manually patching require() paths without re-scanning	One fix may mask three new breaks	Always re-run full scan after patching paths
Running scanner against _archive/ subtrees	Archive content has intentionally broken refs; false positives	Scanner skip rules handle this; trust the skip list
Adding to DYNAMIC_SCRIPT_GENERATORS without review	Accidentally suppressing real phantom detections	Only add files that provably generate child scripts
Step 1: Run the Integrity Audit Engine
node scripts/validation/validate-ecosystem-integrity.cjs
The script performs six targeted checks:

[PHANTOM_REQUIRE] — Broken require() / import paths that resolve to non-existent files (after trying .js, .cjs, .mjs, .json extensions).
[PHANTOM_SKILL] — Skills listed in agent frontmatter skills: arrays that have no corresponding .claude/skills/{name}/ directory.
[EMPTY_DIR] — Empty directories in .claude/tools/ or .claude/skills/ that indicate abandoned scaffolding creating registry footprinting issues.
[ENCODING] — Files with UTF-16 BOM (0xFEFF/0xFFFE) that break JSON/MD parsers silently.
[ARCHIVED_REF] — Production .claude/ code that still references _archive/ or .claude/archive/ paths — active code pointing at dead modules.
[STALE_CATALOG] — agent-registry.json entry count differs from actual agent .md file count on disk (drift between manifest and reality).
Step 2: Categorize and Report
Parse outputs into a structured report at .claude/context/reports/qa/ecosystem-integrity-report-{ISO-date}.md:

# Ecosystem Integrity Report

<!-- Agent: qa | Task: #{id} | Session: {date} -->

**Date:** YYYY-MM-DD
**Overall Status:** PASS / FAIL
**Errors:** N | **Warnings:** N

## HIGH — Runtime Blocking (must fix before deployment)

- `[PHANTOM_REQUIRE]` — Module resolution failures that crash hooks/scripts
- `[PHANTOM_SKILL]` — Missing skills that break agent workflows silently

## MEDIUM — Structural Integrity (fix in current sprint)

- `[ARCHIVED_REF]` — Active code pointing at archived/dead modules
- `[STALE_CATALOG]` — Registry count mismatch with actual agent files

## LOW — Housekeeping (fix in next maintenance window)

- `[EMPTY_DIR]` — Ghost directories creating registry noise
- `[ENCODING]` — UTF-16 files that may break parsers
Step 3: Trigger Remediations
Delegate fixes to the correct specialist:

Error Type	Spawn Agent	Task Description
[PHANTOM_REQUIRE]	developer	Fix broken require() path in {file}
[PHANTOM_SKILL]	qa	Remove or create missing skill {name}
[ARCHIVED_REF]	developer	Replace archive reference in {file}
[STALE_CATALOG]	developer	Regenerate agent-registry.json
[EMPTY_DIR]	developer	Remove empty directory {path}
[ENCODING]	developer	Re-encode {file} as UTF-8
After fixes, re-run the scanner and verify errors reach zero before completion.

Memory Protocol (MANDATORY)
Before starting:

cat .claude/context/memory/learnings.md
cat .claude/context/memory/issues.md
Review prior audit patterns and known suppressed false positives.

After completing:

Audit pattern → .claude/context/memory/learnings.md
New false-positive suppression rule → .claude/context/memory/decisions.md
Unresolved error requiring owner → .claude/context/memory/issues.md
Assume interruption: If the audit report isn't saved to disk, it didn't happen.