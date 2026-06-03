---
name: hf-command-dev
description: >
  This skill should be used when the user asks to "create a command", "add a command", "write a custom command", "update a command", "set up a command with arguments", "create a command with bash injection", "configure command agent", mentions $ARGUMENTS, !bash, @file, agent:, subtask: in command context, or needs guidance on OpenCode command structure and non-interactive shell safety.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# command-dev

Create and update OpenCode commands with non-interactive shell safety. Commands are human entry points — they select the right agent, load skills, inject bash state, and the agent+skills handle the rest.

## The Iron Law

```
EVERY COMMAND THAT RUNS SHELL OPERATIONS MUST SURVIVE CI=true
```

OpenCode runs agents in a headless non-interactive shell. No TTY. No prompts. `git commit` without `-m` hangs forever. `npm install` without `--yes` hangs forever. Every command must work with `CI=true` set.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use git commit and the agent will fill in the message" | Hangs. No TTY for interactive commit. | Always use `-m "message"`. |
| "The agent can handle the npm prompt" | Hangs. No stdin for interactive prompts. | Always use `--yes` or `npm_config_yes=true`. |
| "vim is fine for quick edits" | Hangs. No TTY for editors. | Use Write/Edit tools, never vim/nano/less. |
| "The command will work in the TUI" | Commands run in headless shell, not TUI. | Test mentally: would this hang without a terminal? |

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`non-interactive-shell.md`](references/non-interactive-shell.md) for the full list of banned commands, environment variables, and non-interactive flags.
2. **MANDATORY - READ ENTIRE FILE**: Read [`command-anatomy.md`](references/command-anatomy.md) for command structure, $ARGUMENTS, !bash, @file, agent:, subtask: patterns.
3. **Do NOT load** other skills unless the command specifically needs them (e.g., skill-authoring if the command creates skills).

## Command Anatomy

Every command MUST have:
- YAML frontmatter with `description` (specific, with trigger scenarios) and `agent` fields
- `subtask: true` if it should spawn a subagent, `false` if it runs in main session
- `!bash` blocks for state injection (git status, git log, ls planning files)
- `$ARGUMENTS` if the command takes user input
- Skill loading section (which skills to load and why)
- Anti-patterns section (what NOT to do)

For the full command template and worked example, load `references/command-anatomy.md`.

## Non-Interactive Shell Mandates

**Banned commands (will hang indefinitely):**
- Editors: `vim`, `vi`, `nano`, `emacs`
- Pagers: `less`, `more`, `man`
- Interactive git: `git add -p`, `git rebase -i`, `git commit` (without -m)
- REPLs: `python`, `node` (without -c or script file)

**Always use:**
- `git commit -m "message"` (never interactive commit)
- `npm install --yes` (never interactive install)
- `rm -f` (never interactive rm)
- `git log --no-pager` or `git log -n 10` (never pager)

For the complete list, load `references/non-interactive-shell.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Interactive Assumption** — using commands that need TTY | Command has vim, less, git commit without -m | Use non-interactive flags always |
| **The Vague Description** — "helps with X" | Description doesn't have trigger phrases | Include specific phrases users would say |
| **The Missing Skill Load** — command doesn't specify skills | No "Load skills" section | Always specify which skills to load |
| **The Self-Executor** — command does everything itself | No delegation to subagents | Commands select agents. Agents delegate. |

## Self-Correction

### When the Task Keeps Failing
[Detection] Command hangs in CI=true despite applying non-interactive flags. Same shell operation fails across 3 command revisions. Command references trigger agents that don't exist in the project.
[Recovery] STOP the command execution and verify: (1) Check all shell commands against the banned command list (vim, less, git add -p, etc.), (2) Verify all commands have non-interactive equivalents (-m for git, --yes for npm, -f for rm), (3) Check that referenced agents exist in `.opencode/agents/`. If a command still hangs, it may need a timeout wrapper or a fallback path.

### When Unsure About the Next Step
[Detection] Unclear whether the command should use `subtask: true` or `subtask: false`. Not sure which agent to assign for a hybrid command (mixes research + execution). Command needs skill loading but the skill list is ambiguous.
[Recovery] For subtask decisions: use `subtask: true` for discrete tasks with clear completion (research, code generation, audits). Use `subtask: false` for interactive workflows (orchestration, debugging, planning). For agent assignment: check the agent descriptions in `.opencode/agents/` — match by capability. If no single agent fits, use the orchestrator as a router agent. For skills: load 2-4 relevant skills covering the command's domain.

### When the User Contradicts Skill Guidance
[Detection] User says "vim is fine, I use it all the time in my terminal" (violating non-interactive shell mandate). User says "git commit without -m works for me" (forgetting CI=true environment). User says "just make the command do everything, don't delegate."
[Recovery] Explain the CI=true constraint: "Commands in OpenCode run in a headless non-interactive shell. No TTY. No prompts. git commit without -m hangs forever. The agent cannot respond to prompts." If the user insists on a banned command, suggest wrapping it: `echo "message" | git commit -F -` or similar workaround. If no safe equivalent exists, flag it as "cannot be made non-interactive" and suggest an alternative approach.

### When an Edge Case Is Encountered
[Detection] Command needs to run on both macOS and Linux but uses platform-specific tools. Command file path references differ between development and deployment. Agent selection depends on runtime conditions not known at command definition time. $ARGUMENTS contains shell metacharacters.
[Recovery] For cross-platform: use POSIX-compatible commands within !bash blocks. Avoid GNU-specific flags (--long-options) when BSD equivalents differ — use the portable form. For variable paths: use environment variables or project-root-relative paths instead of hardcoded absolute paths. For conditional agent selection: use a router agent that inspects context and dispatches to the right specialist. For metacharacters in $ARGUMENTS: always quote variable references and sanitize input before use in shell commands.
