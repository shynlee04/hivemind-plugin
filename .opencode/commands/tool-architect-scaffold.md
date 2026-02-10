---
description: Scaffold an isolated plugin/tool development environment. Creates directory structure, starter files, package.json, and prd.json for iterative building.
argument-hint: <type> <name> where type is plugin|tool|cli|tool-set
---

Load the `opencode-tool-architect` skill for templates, then proceed.

## Input

$ARGUMENTS

## Process

### Step 1: Parse Arguments

Extract:
- `type`: one of `plugin`, `tool`, `cli`, `tool-set`
- `name`: project name (kebab-case)

If arguments are missing or ambiguous, ask:
1. What type? (plugin, custom tool, CLI script, tool set)
2. What name? (kebab-case identifier)
3. Brief description of what it does

### Step 2: Create Directory Structure

Based on type, create the appropriate structure:

#### Plugin
```
.opencode/plugins/<name>.ts       # Plugin entry point from template
.opencode/package.json            # Create or update with deps
tasks/<name>.prd.json             # From governance-plugin.prd.json template
```

#### Custom Tool
```
.opencode/tools/<name>.ts         # Tool entry point from template
tasks/<name>.prd.json             # From custom-tool-set.prd.json template
```

#### CLI Script
```
bin/<name>.js                     # Shebang script from template
tasks/<name>.prd.json             # From cli-scanner.prd.json template
```

#### Tool Set
```
.opencode/tools/<name>-<tool1>.ts # Multiple tool files
.opencode/tools/<name>-<tool2>.ts
.opencode/package.json            # Create or update
tasks/<name>.prd.json             # From custom-tool-set.prd.json template
```

### Step 3: Customize Templates

Replace template placeholders with actual values:
- `[name]` -> user's chosen name
- `[description]` -> user's description
- Update prd.json with project-specific stories

### Step 4: Verify Setup

1. All files created successfully
2. TypeScript files pass `tsc --noEmit` (or at least have no syntax errors)
3. CLI scripts are executable
4. prd.json is valid JSON

### Step 5: Report

Show user:
- Files created (with paths)
- Next step: `/tool-architect-loop tasks/<name>.prd.json` to start building
- Or: edit the prd.json to customize stories before starting

### Step 6: Make Files Executable (CLI only)

```bash
chmod +x bin/<name>.js
```
