---
description: "Absorb dense context (links, text, files, stories, events, actors) into persistent session context through multi-wave swarm processing. Use when you have a packed prompt with URLs, file references, multi-layered narratives, or complex metadata that needs interpretation and persistent storage for ongoing planning."
agent: hf-l0-orchestrator
subtask: false
---

## Raw Input

"$ARGUMENTS"

## Current State

!`cat .hivemind/state/session-context-prompt.md 2>/dev/null | head -5 || echo "No existing session context"`
!`git log --oneline -3`
!`ls -la .hivemind/state/ 2>/dev/null || echo "No state directory"`

## Your Job

1. **Load skill `hf-context-absorb`** — it contains the full wave protocol, subagent dispatch templates, YAML merge rules, and validation gates.

2. **Execute the wave protocol defined in the skill** — Wave 0 through Wave 4 as specified. You are the orchestrator: delegate every wave to subagents via `task` tool. Do NOT process content yourself.

3. **The raw input to absorb is `$ARGUMENTS`** — pass it to the skill's Wave 0 delta computation, then through the full pipeline.

4. **Final target:** `.hivemind/state/session-context-prompt.md` — append-only, never overwrite.

## Anti-Patterns (DO NOT)

- Do NOT re-specify the wave protocol here — it lives in the skill
- Do NOT overwrite session-context-prompt.md — ALWAYS APPEND
- Do NOT skip loading the skill — it is the source of truth for the protocol
- Do NOT use interactive commands — no `vim`, `nano`, `less`, `git commit` without `-m`
