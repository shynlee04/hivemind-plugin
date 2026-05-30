---
name: hm-l3-opencode-non-interactive-shell
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

## Overview

Shell command safety guide for headless agent execution environments. Use when writing shell commands for CI/CD pipelines, automated scripts, or any context without a TTY. Provides banned command lists, non-interactive flag patterns, and environment variable conventions for safe unattended execution.

## The Iron Law

```
NEVER run a command that waits for user input. The shell has no TTY. Interactive = hang.
```

## Core Mandates

1. **Assume `CI=true`**: Act as if running in a headless CI/CD pipeline.
2. **No Editors/Pagers**: `vim`, `nano`, `less`, `more`, `man` are BANNED.
3. **Force & Yes with care**: Supply `--yes`, `--non-interactive`, or equivalent flags for safe installers/tooling; do not use force flags for destructive operations unless the user explicitly authorized that exact operation.
4. **Use OpenCode Tools**: Prefer `Read`/`Write`/`Edit` tools over shell manipulation (`sed`, `echo`, `cat`).
5. **No Interactive Modes**: Never use `-i` or `-p` flags that require user input.
6. **Danger tier before execution**: Classify commands as ALLOW, WARN, or BLOCK before running. Adapted from Nanostack guard tiers, but this skill reports safety facts and leaves final judgment to the controlling agent/user.

## Danger Tier Matrix

| Tier | Examples | Action |
|------|----------|--------|
| ALLOW | `npm test -- --runInBand`, `npx --yes <tool> --help`, `git --no-pager log -n 5` | Run with timeout/non-interactive flags when relevant |
| WARN | package installs, long-running servers, Docker pulls, network fetches | Add timeout/background strategy and explain side effects |
| BLOCK | `git clean`, `git reset --hard`, force push, recursive deletion, production database commands, unreviewed remote-code execution | Do not run unless explicit user instruction overrides and project rules allow it |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/command-tables.md` | Need specific command syntax (package managers, git, docker, system) |
| `references/env-variables.md` | Need environment variable configurations |
| `references/cognitive-patterns.md` | Need cognitive optimization patterns (BAD vs GOOD framing) |
| `references/prompt-handling.md` | Need workaround patterns for stubborn prompts |
| `references/source-evidence.md` | RICH source replacement and bundled-resource scorecard |

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
| **The Unsafe Force** | Adds `--force` to destructive commands to avoid prompts | Stop; force is not a substitute for authorization |

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| `garagon/nanostack` guard | ADAPT | ALLOW/WARN/BLOCK danger tiers are adapted as a reasoning aid, not copied as blocking governance scripts. |
| Hermes OpenCode search evidence | REPLACED | Raw Hermes OpenCode skill source was not inspectable in this workspace, so it is not cited as reviewed evidence. Replacement evidence is official OpenCode command/platform docs plus local repomix OpenCode source pack; see `references/source-evidence.md`. |
| OpenCode official docs | ADAPT | Commands may inject shell output; command authors must keep injected commands non-interactive and bounded. |

## Independence Notes

This skill applies to arbitrary shell-capable OpenCode projects. It must not assume GNU-only flags on macOS/BSD; prefer portable flags or document platform-specific alternatives. Do not assume HiveMind state paths.

## Self-Correction

### When the Task Keeps Failing

[Detection] If shell commands keep hanging or timing out, check whether any command in the chain has an interactive prompt — package managers, installers, and some tools default to interactive mode without explicit non-interactive flags. Verify that commands using pipes or redirections are not accidentally waiting for input from the wrong source. If timeout is the issue, increase the timeout or split long-running operations into smaller steps with progress tracking.

[Recovery] Add `--yes`, `--non-interactive`, `--no-pager`, or equivalent flags. Wrap suspect commands with `timeout 30`. If a command truly requires interaction, report it as BLOCKED and suggest an alternative approach.

### When Unsure About the Next Step

[Detection] If you cannot determine a command's danger tier, default to WARN — assume potential side effects and add timeout/background strategy. If you cannot find a non-interactive flag for a specific tool, check `references/command-tables.md` for known patterns, then search the tool's documentation for CI/headless flags. If no non-interactive option exists, classify as BLOCKED.

[Recovery] Consult `references/command-tables.md` first. If the tool is not documented, search the tool's `--help` output for non-interactive or CI flags.

### When the User Contradicts Skill Guidance

[Detection] If the user explicitly requests a BLOCK-tier command (e.g., git clean, force push), warn them about the specific risk but proceed if they confirm — the danger tier matrix reports safety facts, it does not block authorized operations. If the user wants to run a command without non-interactive flags, warn about potential hangs and suggest adding flags, but honor the user's choice if they insist. Document the override and risk in any session log.

[Recovery] Document BLOCK-tier overrides with timestamp, exact command, and user confirmation. Never silently run BLOCK-tier commands — always require explicit user authorization.

### When an Edge Case Is Encountered

[Detection] If a command works locally but fails in CI (different OS, shell, or environment), check for platform-specific flags — macOS uses BSD variants of some commands where GNU flags differ. If environment variables are needed but their values are unknown, do not guess; report the missing variable and its purpose. If a command produces output that needs parsing but the output format is unpredictable, avoid fragile parsing and use structured alternatives (JSON output flags, dedicated query tools).

[Recovery] For platform differences, consult `references/command-tables.md` for portable alternatives. For missing env vars, report the variable name and what it controls. For fragile parsing, switch to structured output formats.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `command-dev` | command-dev = how to write OpenCode slash commands. This skill = shell safety for any command execution. |
| `opencode-platform-reference` | platform-reference = what platform features exist. This skill = how to safely execute shell commands. |
