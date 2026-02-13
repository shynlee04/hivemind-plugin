---
description: "Scan the project codebase and build a HiveMind backbone. Run this on first use, when switching projects, or for 'brownfield' refactoring."
---

# HiveMind Project Scan

You are performing a HiveMind project reconnaissance scan. This is required before any implementation work.

## Step 1: Framework Detection
Check for the presence of framework artifacts:
- `.planning/` -> GSD Framework
- `.spec-kit/` -> Spec-Kit Framework
- `.bmad/` -> BMAD Framework

## Step 2: Project Structure
Use glob and read tools to understand the project:
- Read package.json (or pyproject.toml, go.mod, Cargo.toml) for project name, dependencies, scripts
- Glob for source directories: src/, lib/, app/, pages/, components/
- Check for configuration files: tsconfig.json, vite.config.*, next.config.*, webpack.config.*

## Step 3: Documentation Audit
- Read README.md if it exists
- Read AGENTS.md or CLAUDE.md if they exist
- Read CHANGELOG.md for recent changes

## Step 4: Context Isolation
Identify potential context pollution:
- Stale branches or duplicate project copies
- Conflicting framework artifacts (e.g., GSD AND Spec-Kit)
- Old or outdated documentation
- Unused configuration files

## Step 5: Backbone Summary
After scanning, call these HiveMind tools to persist your findings:
1. `declare_intent({ mode: "exploration", focus: "Project reconnaissance scan" })`
2. `save_anchor({ key: "project-stack", value: "<detected tech stack>" })`
3. `save_anchor({ key: "project-structure", value: "<brief architecture summary>" })`
4. `save_mem({ shelf: "project-intel", content: "<key findings from scan: framework, stack, issues>", tags: "scan,baseline" })`

## Step 6: Refactoring Recommendation (Brownfield)
If the user requested a refactor ("scan and refactor"), propose a plan:
- **Purify**: Delete stale artifacts and conflicting frameworks.
- **Validate**: Check that remaining documents align with code.
- **Map**: Generate a fresh codemap (files -> features).
- **Hierarchy**: Set up a new HiveMind hierarchy (`declare_intent` -> `map_context`) for the refactoring phase.
