---
name: command-dev
description: This skill should be used when the user asks to "create a command", "add a command", "write a custom command", "update a command", "set up a command with arguments", "create a command with bash injection", "configure command agent", mentions $ARGUMENTS, !bash, @file, agent:, subtask: in command context, or needs guidance on OpenCode command structure and non-interactive shell safety.
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
