---
name: opencode-non-interactive-shell
description: This skill should be used when the user asks to "write shell commands", "run non-interactive shell", "CI=true safety", "banned shell commands", "shell environment variables", "headless agent execution", "shell command safety", "avoid interactive prompts", or "non-interactive flags".
metadata:
  layer: "3"
  role: "reference"
  pattern: P3
  version: "2.0.0"
allowed-tools:
  - Read
  - Bash
---

# Shell Non-Interactive Strategy

## The Iron Law

```
NEVER run a command that waits for user input. The shell has no TTY. Interactive = hang.
```

## Core Mandates

1. **Assume `CI=true`**: Act as if running in a headless CI/CD pipeline.
2. **No Editors/Pagers**: `vim`, `nano`, `less`, `more`, `man` are BANNED.
3. **Force & Yes**: Always preemptively supply "yes" or "force" flags.
4. **Use OpenCode Tools**: Prefer `Read`/`Write`/`Edit` tools over shell manipulation (`sed`, `echo`, `cat`).
5. **No Interactive Modes**: Never use `-i` or `-p` flags that require user input.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/command-tables.md` | Need specific command syntax (package managers, git, docker, system) |
| `references/env-variables.md` | Need environment variable configurations |
| `references/cognitive-patterns.md` | Need cognitive optimization patterns (BAD vs GOOD framing) |
| `references/prompt-handling.md` | Need workaround patterns for stubborn prompts |

## Cognitive & Behavioral Standards

**Context:** OpenCode's shell environment is strictly **non-interactive**. It lacks a TTY/PTY, meaning any command that waits for user input, confirmation, or launches a UI (editor/pager) will hang indefinitely.

**Key Behaviors:**
1. **Process Continuity**: Never stop after a tool output to "wait for instructions" unless the task is complete. Drive the workflow.
2. **Explicit Action Framing**: Follow "GOOD" (positive) instructions, ignore "BAD" (negative) assumptions. See `references/cognitive-patterns.md`.
3. **Environment Rigor**: Assume a headless CI environment where any prompt = failure.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Prompter** | Runs commands without non-interactive flags | Always add `-y`, `--yes`, `--non-interactive`, or pipe `yes \|` |
| **The Editor** | Uses `vim`, `nano`, `less`, `man` | Use OpenCode `Read`/`Write`/`Edit` tools instead |
| **The REPL** | Runs `python`, `node` without `-c` or script | Use `python -c "code"` or `python script.py` |
| **The Git Pager** | Runs `git log` without `--no-pager` | Always add `--no-pager` or `-n <count>` |
| **The Silent Hang** | No timeout on potentially interactive commands | Wrap with `timeout 30 ...` as last resort |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `command-dev` | command-dev = how to write OpenCode slash commands. This skill = shell safety for any command execution. |
| `opencode-platform-reference` | platform-reference = what platform features exist. This skill = how to safely execute shell commands. |
