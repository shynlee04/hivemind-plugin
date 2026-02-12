---
description: "Scan the project codebase and build a HiveMind backbone. Run this on first use or when switching projects."
---

# HiveMind Project Scan

You are performing a HiveMind project reconnaissance scan. This is required before any implementation work.

## Step 1: Project Structure
Use glob and read tools to understand the project:
- Read package.json (or pyproject.toml, go.mod, Cargo.toml) for project name, dependencies, scripts
- Glob for source directories: src/, lib/, app/, pages/, components/
- Check for configuration files: tsconfig.json, vite.config.*, next.config.*, webpack.config.*

## Step 2: Documentation Audit
- Read README.md if it exists
- Read AGENTS.md or CLAUDE.md if they exist
- Check for .planning/ directory (GSD framework)
- Check for .spec-kit/ directory (Spec-Kit framework)
- Read CHANGELOG.md for recent changes

## Step 3: Context Isolation
Identify potential context pollution:
- Stale branches or duplicate project copies
- Conflicting framework artifacts (.planning/ AND .spec-kit/)
- Old or outdated documentation
- Unused configuration files

## Step 4: Backbone Summary
After scanning, call these HiveMind tools:
1. `declare_intent({ mode: "exploration", focus: "Project reconnaissance scan" })`
2. `save_anchor({ key: "project-stack", value: "<detected tech stack>" })`
3. `save_anchor({ key: "project-structure", value: "<brief architecture summary>" })`
4. `save_mem({ shelf: "project-intel", content: "<key findings from scan>", tags: "scan,baseline" })`

## Step 5: Report
Summarize findings to the user:
- Project name and tech stack
- Key directories and their purposes
- Active framework (if any)
- Potential issues or stale artifacts
- Recommended next steps
