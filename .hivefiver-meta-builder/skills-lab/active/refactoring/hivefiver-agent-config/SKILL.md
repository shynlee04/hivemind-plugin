---
name: hivefiver-agent-config
description: "Guided workflow for configuring OpenCode agents, commands, and skills programmatically. Turn-based: Investigate → Collect → Proposal → Validate → Compile → Test → Save. Supports individual and batch configuration with cross-primitive conflict detection. Triggers on: 'configure agent', 'configure command', 'configure skill', 'batch configure', 'agent setup', 'set up agent', 'configure OpenCode primitives'."
metadata:
  layer: "2"
  role: "workflow-orchestration"
  pattern: "P1-procedural"
  depends_on_tools: ["configure-primitive"]
  depends_on_libs: ["cross-primitive-validator", "config-compiler", "schema-kernel"]
---

## Overview

This skill guides agents through a 7-turn configuration workflow for OpenCode primitives (agents, commands, skills). It does NOT create files directly — it orchestrates the process and delegates to tools.

## The Iron Law

```
NO DIRECT FILE CREATION — USE configure-primitive TOOL
```

## 7-Turn Workflow

### Turn 1: Investigate

- **Goal:** Understand what the user wants to configure
- **Actions:**
  1. Ask: "What primitive are you configuring?" (agent/command/skill)
  2. Ask: "Is this a new configuration or modifying an existing one?"
  3. If modifying: Read existing file, extract current frontmatter
  4. Check for related primitives that might conflict
- **Output:** `{ primitive: "agent"|"command"|"skill", mode: "create"|"modify", target?: string }`
- **Checkpoint:** Present findings, ask "Proceed to collection?"

### Turn 2: Collect

- **Goal:** Gather all required frontmatter fields
- **Actions:**
  1. List required fields for the primitive type (from schema-kernel schemas)
  2. For agents: description (required), mode, model, temperature, color, steps, permission, etc.
  3. For commands: description (required), agent, model, subtask, body template
  4. For skills: name (required), description (required), license, compatibility, metadata
  5. Ask user for each field or accept bulk JSON/YAML input
- **Output:** Complete frontmatter object + body content
- **Checkpoint:** Show collected fields, ask "Proceed to proposal?"

### Turn 3: Proposal

- **Goal:** Present a complete spec for user approval
- **Actions:**
  1. Assemble final frontmatter + body into spec object
  2. Run dry-run compilation: `configure-primitive(primitive, spec, dryRun: true)`
  3. Show the would-be .md content
  4. Show the would-be file path
- **Output:** Full spec + preview of compiled .md
- **Checkpoint:** "Review the above configuration. Approve, modify, or cancel?"

### Turn 4: Validate

- **Goal:** Cross-primitive conflict detection
- **Actions:**
  1. Build PrimitiveMap from BOTH existing locations:
     - Project scope: scan `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/`, `.opencode/tools/`, `.opencode/plugins/`
     - Global scope: scan `~/.config/opencode/` (or `process.env.OPENCODE_CONFIG_DIR`) with same subdirectory structure
     - Project primitives take precedence over global primitives (same name in both → project wins)
  2. Add the proposed new primitive to the appropriate map
  3. Call `validateCrossPrimitive(primitives)` — reference the lib function
  4. If errors (BLOCK severity): report and return to Turn 2 for fixes
  5. If warnings (WARN severity): present to user for accept/override decision
  6. If info: note and proceed
- **Output:** Validation report (pass/fail + any warnings accepted)
- **Checkpoint:** If BLOCK → "Fix these issues first." If WARN → "Accept warnings?"

### Turn 5: Compile

- **Goal:** Compile the validated spec to .md format
- **Actions:**
  1. Call `configure-primitive(primitive, spec, dryRun: false, validate: true)`
  2. This writes the .md file to the correct location
  3. Verify the file was written (read it back)
- **Output:** Written file path + confirmation
- **Checkpoint:** "File written to {path}. Proceed to testing?"

### Turn 6: Test

- **Goal:** Verify the compiled configuration is valid
- **Actions:**
  1. Read the written .md file
  2. Run decompile on it — verify frontmatter parses correctly
  3. Check that file path is discoverable by OpenCode (correct directory structure)
  4. Run typecheck if the primitive is a tool AND a `tsconfig.json` exists in the target directory: `npx tsc --noEmit`
     - Only run TypeScript typecheck when `tsconfig.json` is present; skip for non-TypeScript projects
  5. Note: `.opencode/rules/` is NOT auto-discovered by OpenCode — rules must be explicitly wired via `instructions` in `opencode.json` or agent frontmatter
- **Output:** Test results (pass/fail)
- **Checkpoint:** "Tests passed. Save and finalize?"

### Turn 7: Save

- **Goal:** Finalize and report
- **Actions:**
  1. Commit the new/modified file to git with descriptive message
  2. Report summary: what was configured, where, and how to verify
- **Output:** Git commit hash + summary

## Batch Mode

When user provides multiple specs at once (JSON array or YAML manifest):
1. Process each spec through Turns 1-4 individually
2. Compile ALL in a single atomic batch in Turn 5
3. If any spec fails validation, roll back ALL (don't write partial batches)
4. Test all in Turn 6, commit all in Turn 7

## Resume Protocol

If the workflow is interrupted:
1. The skill tracks current turn in conversation context
2. On resume, identify last completed turn from conversation
3. Re-read any written files to verify state
4. Resume from the next turn

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| Writing files directly without configure-primitive tool | Did you use Write/Edit instead of configure-primitive? | STOP. Use the tool. |
| Skipping validation | Did you skip Turn 4? | Always validate before compile. |
| Accepting BLOCK errors | Did you proceed despite validation BLOCK? | BLOCK means stop. Fix first. |
| Creating from scratch without investigating existing | Did you skip Turn 1? | Always investigate first. |
