---
name: opencode-config-workflow
description: "Framework-agnostic guided workflow for configuring OpenCode agents, commands, and skills programmatically. Turn-based: Discover → Investigate → Collect → Proposal → Validate → Compile → Test → Save. Supports individual and batch configuration with cross-primitive conflict detection. Coexists safely with GSD, BMAD, Speckit, and other frameworks. Triggers on: 'configure agent', 'configure command', 'configure skill', 'batch configure', 'agent setup', 'set up agent', 'configure OpenCode primitives', 'update agent', 'modify agent', 'change agent', 'batch update', 'reconfigure', 'gatekeeping setup' ."
metadata:
  layer: "2"
  role: "workflow-orchestration"
  pattern: "P1-procedural"
  depends_on_tools: ["configure-primitive", "validate-restart"]
  depends_on_libs: ["cross-primitive-validator", "config-compiler", "schema-kernel", "framework-detector", "runtime-validator"]
---

## Overview

This skill guides agents through an 8-turn configuration workflow for OpenCode primitives (agents, commands, skills). It does NOT create files directly — it orchestrates the process and delegates to tools.

Works safely alongside GSD (`.planning/`), BMAD (`bmad.yaml`), Speckit (`speckit.json`), and any other framework by detecting their boundaries and namespace-tagging generated configs.

## The Iron Law

```
NO DIRECT FILE CREATION — USE configure-primitive TOOL
```

## 8-Turn Workflow

### Turn 0: Discovery

- **Goal:** Understand what needs configuration and discover existing resources
- **Actions:**
  1. Parse user's request for:
     - Primitive type(s): agents, commands, skills, or all
     - Scope: project (`.opencode/`) or global (`~/.config/opencode/`)
     - Mode: create new vs. modify existing vs. batch update
     - Category filters: names, roles (e.g., "gatekeeping", "coordinator", "specialist"), or patterns
  2. Detect co-existing frameworks via `framework-detector` to avoid boundary conflicts:
     - GSD: `.planning/` directory detected → namespace-tag configs with `gsd-` prefix if needed
     - BMAD: `bmad.yaml` detected → respect `bmad/` boundary
     - Speckit: `speckit.json` detected → respect `speckit/` boundary
  3. If the user mentions a category/role (e.g., "gatekeeping agents", "all coordinators"):
     - Scan `.opencode/agents/` for agent `.md` files
     - Read frontmatter from each to find matching agents by description, mode, or role keywords
     - Present the discovered agents: "I found these gatekeeping agents: [list]. Are these the ones you want to configure?"
  4. If the user provides NO specific names or categories:
     - Ask: "Which specific agents, commands, or skills do you want to configure? I can also scan for agents matching a role like 'gatekeeping' or 'coordinator'."
  5. Determine mode:
     - `create` — brand new primitive
     - `modify` — update existing: read current frontmatter, present as starting point
     - `batch-modify` — update multiple existing: apply same changes to all matched
- **Output:** `{ primitives: [...], mode: "create"|"modify"|"batch-modify", scope: "project"|"global", frameworks: [...] }`
- **Checkpoint:** "I found these targets. Proceed with configuration?"

### Turn 1: Investigate

- **Goal:** Understand what the user wants to configure
- **Actions:**
  1. If Turn 0 discovered targets and determined mode: Start from Turn 0's output. Show the discovered targets. Do NOT re-ask "what primitive" or "new or modifying" — they're already known.
  2. If modifying or batch-modify: Read existing file(s), extract current frontmatter (decompile)
  3. If no Turn 0 was run (direct Turn 1 entry):
     - Ask: "What primitive are you configuring?" (agent/command/skill)
     - Ask: "Is this a new configuration or modifying an existing one?"
  4. Check for related primitives that might conflict
  5. Check framework boundaries — warn if proposed config would write into a framework-owned directory
- **Output:** `{ primitive: "agent"|"command"|"skill", mode: "create"|"modify"|"batch-modify", target?: string | string[] }`
- **Checkpoint:** Present findings, ask "Proceed to collection?"

### Turn 2: Collect

- **Goal:** Gather all required frontmatter fields
- **Actions:**
  1. List required fields for the primitive type (from schema-kernel schemas)
  2. For agents: description (required), mode, model, temperature, color, steps, permission, etc.
  3. For commands: description (required), agent, model, subtask, body template
  4. For skills: name (required), description (required), license, compatibility, metadata
  5. Ask user for each field or accept bulk JSON/YAML input
  6. Apply namespace prefix if framework detection indicated potential collisions
- **Output:** Complete frontmatter object + body content
- **Checkpoint:** Show collected fields, ask "Proceed to proposal?"

### Turn 3: Proposal

- **Goal:** Present a complete spec for user approval
- **Actions:**
  1. Assemble final frontmatter + body into spec object
  2. Run dry-run compilation: `configure-primitive(primitive, spec, dryRun: true)`
  3. Show the would-be .md content
  4. Show the would-be file path
  5. Highlight any framework boundary implications
- **Output:** Full spec + preview of compiled .md
- **Checkpoint:** "Review the above configuration. Approve, modify, or cancel?"

### Turn 4: Validate

- **Goal:** Cross-primitive conflict detection + framework boundary check
- **Actions:**
  1. Build PrimitiveMap from BOTH existing locations:
     - Project scope: scan `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/`, `.opencode/tools/`, `.opencode/plugins/`
     - Global scope: scan `~/.config/opencode/` (or `process.env.OPENCODE_CONFIG_DIR`) with same subdirectory structure
     - Project primitives take precedence over global primitives (same name in both → project wins)
  2. Detect co-existing frameworks and their boundaries
  3. Add the proposed new primitive to the appropriate map
  4. Call `validateCrossPrimitive(primitives)` — reference the lib function
  5. Call `validateRuntime(primitives)` to check for circular dependencies, loading order, and pipeline misalignment
  6. If errors (BLOCK severity): report and return to Turn 2 for fixes
  7. If warnings (WARN severity): present to user for accept/override decision
  8. If info: note and proceed
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

## Batch Modification Mode

When Turn 0 discovers multiple existing primitives and mode is "batch-modify":
1. Read each existing agent's current frontmatter (decompile)
2. Present all current configs side-by-side as a table
3. Ask: "What fields do you want to change across ALL of these agents?"
4. Apply the same changes to all targets:
   - If changing model: update `model` field on all matched agents
   - If changing temperature: update `temperature` on all matched agents
   - If changing permissions: update `permission` on all matched agents
   - If changing instructions: update body content on all matched agents
5. Run dry-run for all targets in batch
6. Compile ALL in atomic batch (all-or-nothing)
7. If any fails validation, roll back ALL

### Turn 6: Test

- **Goal:** Verify the compiled configuration is valid and restart-safe
- **Actions:**
  1. Read the written .md file
  2. Run decompile on it — verify frontmatter parses correctly
  3. Check that file path is discoverable by OpenCode (correct directory structure)
  4. Run `validate-restart` tool to simulate OpenCode discovery and catch runtime issues
  5. Run typecheck if the primitive is a tool AND a `tsconfig.json` exists in the target directory: `npx tsc --noEmit`
     - Only run TypeScript typecheck when `tsconfig.json` is present; skip for non-TypeScript projects
  6. Note: `.opencode/rules/` is NOT auto-discovered by OpenCode — rules must be explicitly wired via `instructions` in `opencode.json` or agent frontmatter
- **Output:** Test results (pass/fail)
- **Checkpoint:** "Tests passed. Save and finalize?"

### Turn 7: Save

- **Goal:** Finalize and report
- **Actions:**
  1. Commit the new/modified file to git with descriptive message
  2. Report summary: what was configured, where, and how to verify
  3. Mention any detected frameworks and namespace prefixes applied
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
| Ignoring framework boundaries | Did you write into `.planning/` or `bmad/` without checking? | Use framework-detector first. |
