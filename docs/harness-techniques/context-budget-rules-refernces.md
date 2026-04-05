# Universal Anti-Patterns

Rules that apply to ALL workflows and agents. Individual workflows may have additional specific anti-patterns.

---

## Context Budget Rules

1. **Never** inline large files into subagent prompts -- tell agents to read files from disk instead. Agents have their own context windows.
2. **Delegation tasks of: search and inspection,  investigation, research tasks depth scales with context window** (all activities that require agents and/or subagent “consume” content as context-- check with this in mind for any that contribute toward to the defining-total-worflow  knowing that at most LLM models are capped at 200000 other edges cut off to around 180000 at best → do the calculation so that number of files to read, results that return which need what kinds of consumption etc to factor these
    1. If these needed: balancing the “quick” and “scout” skimming or sequential them (grep, quick search regex, keywords, meta TOC, in-line offset-reading, glob, list )+  read only frontmatter, status fields, or summaries. 
    2. At situations when able to launch more condense full text agents are allowed for synthesis or when the model >= 500000 - 1M model: full body reads permitted when content is needed for inline decisions. See https://github.com/gsd-build/get-shit-done/blob/main/get-shit-done/references/context-budget.md[`references/context-budget.md`](https://github.com/gsd-build/get-shit-done/blob/main/get-shit-done/references/context-budget.md) for the complete table.
3. **Delegate** heavy work to subagents -- the orchestrator routes, it does not build, analyze, research, investigate, or verify.
4. **Proactive pause warning**: If you have already consumed significant context (large file reads, multiple subagent results), warn the user: "Context budget is getting heavy. Consider checkpointing progress." → at 70% context, auto run CLI command of context compact and ask user to copy the last output message to resume in a new conversation

## File Reading Rules

1. **Never** read full [PLAN.md](http://plan.md/) files from other phases -- only current phase plans.
2. **Do not** re-read full file contents when frontmatter is sufficient -- frontmatter contains status, key_files, commits, and provides fields. Exception: at >= 500000, re-reading full body is acceptable when semantic content is needed.

## Subagent Rules

1. **NEVER** use non-GSD agent types (`general-purpose`, `Explore`, `Plan`, `Bash`, `feature-dev`, etc.) -- ALWAYS use `subagent_type: "gsd-{agent}"` (e.g., `gsd-phase-researcher`, `gsd-executor`, `gsd-planner`). GSD agents have project-aware prompts, audit logging, and workflow context. Generic agents bypass all of this.
2. **Do not** re-litigate decisions that are already locked in [CONTEXT.md](http://context.md/) (or [PROJECT.md](http://project.md/) ## Context section) -- respect locked decisions unconditionally.