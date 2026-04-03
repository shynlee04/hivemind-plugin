# Cross-Platform Hooks — Deployment Guide

## Overview

This skill ships actual hook config files in the `hooks/` directory. They are deployable JSON configs, not documentation examples.

## Shipped Hook Files

| File | Purpose | Platform |
|------|---------|----------|
| `hooks/pre-tool-use.json` | Injects plan state before Write/Edit | OpenCode |
| `hooks/post-tool-use.json` | Reminds to update progress after writes | OpenCode |
| `hooks/stop.json` | Runs check-complete.sh on session stop | OpenCode |

## OpenCode Hook Deployment

OpenCode hooks are configured through the plugin system, not standalone JSON files. The shipped JSON files describe the hook behavior. To deploy:

### Option 1: Plugin-Based Hooks (Recommended)

Create `.opencode/plugins/planning-hooks.js`:

```javascript
export const PlanningHooks = async ({ project, $, directory }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "write" || input.tool === "edit") {
        const planFile = `${directory}/task_plan.md`;
        try {
          const plan = await $`head -30 ${planFile}`.text();
          if (plan) {
            output.context = `[planning-with-files] Current plan:\n${plan}\n`;
          }
        } catch {
          // No plan file — skip injection
        }
      }
    },
    "tool.execute.after": async (input, output) => {
      if (input.tool === "write" || input.tool === "edit") {
        output.context = "[planning-with-files] Remember to update progress.md and task_plan.md if phase status changed.";
      }
    },
    "session.idle": async () => {
      await $`bash ${directory}/.opencode/skills/planning-with-files/scripts/check-complete.sh`.text();
    },
  };
};
```

### Option 2: Manual Hook Scripts

For platforms that support shell-based hooks (Claude Code, Cursor, Gemini CLI), use the scripts in `scripts/` directly:

| Platform | Hook Location | Script to Use |
|----------|--------------|---------------|
| Claude Code | `.cursor/hooks/pre-tool-use.sh` | Custom script reading task_plan.md |
| Claude Code | `.cursor/hooks/stop.sh` | `scripts/check-complete.sh` |
| Gemini CLI | `.gemini/hooks/before-tool.sh` | Custom script reading task_plan.md |
| Gemini CLI | `.gemini/hooks/session-end.sh` | `scripts/check-complete.sh` |
| Cursor | `.cursor/hooks/pre-tool-use.sh` | Custom script reading task_plan.md |
| Cursor | `.cursor/hooks/stop.sh` | `scripts/check-complete.sh` |

## Hook Behavior Specifications

### Pre-Tool-Use Hook

**Trigger:** Before Write or Edit tool execution

**Behavior:**
1. Check if `task_plan.md` exists in project root
2. If yes, read first 30 lines
3. Inject into context with `[planning-with-files]` prefix
4. If no, do nothing (no plan active)

**Purpose:** Ensure the Agent sees the current goal before modifying any files.

### Post-Tool-Use Hook

**Trigger:** After Write or Edit tool execution

**Behavior:**
1. Output reminder message
2. Message includes: "Remember to update progress.md and task_plan.md if phase status changed"

**Purpose:** Prevent the Agent from forgetting to update planning files after making changes.

### Stop Hook

**Trigger:** When session ends (idle, user exits, or `/clear`)

**Behavior:**
1. Run `scripts/check-complete.sh`
2. Output status to console
3. If incomplete, remind Agent to update `progress.md`

**Purpose:** Catch incomplete work at session boundaries.

## Platform-Specific Notes

### OpenCode

- Uses plugin system for hooks
- Plugin file: `.opencode/plugins/planning-hooks.js`
- Events: `tool.execute.before`, `tool.execute.after`, `session.idle`

### Claude Code

- Uses `.cursor/hooks/` directory
- Hook files are executable shell scripts
- Available hooks: `pre-tool-use.sh`, `post-tool-use.sh`, `stop.sh`

### Gemini CLI

- Uses `.gemini/hooks/` directory
- Hook files are executable shell scripts
- Available hooks: `before-tool.sh`, `after-tool.sh`, `session-end.sh`, `session-start.sh`

### Cursor

- Uses `.cursor/hooks/` directory (same as Claude Code)
- Hook files are executable shell scripts
- Note: Claude Code and Cursor share the same hook path — do not install both simultaneously

### Codex

- No native hook system
- Rely on script-based enforcement
- Run `scripts/check-complete.sh` manually at session end

## Hook Testing

To verify hooks are working:

1. Create a `task_plan.md` with a test goal
2. Trigger a Write operation
3. Check that the plan content appears in context before the write
4. After the write, check for the progress reminder
5. End the session and verify `check-complete.sh` output
