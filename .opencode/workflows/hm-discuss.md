---
description: "Discussion workflow: prior context load → gray area detection → interactive discussion → CONTEXT.md generation."
---

# hm-discuss

## Goal
Clarify ambiguities, locked decisions, and scope boundaries for the target phase.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Discussion | hm-intent-loop | Guides interactive Q&A, parses decisions, writes context |

## Execution Phases
1. **Load Context**: Scout codebase, read `PROJECT.md`, `ROADMAP.md`, `STATE.md`, and any prior phase `CONTEXT.md` files.
2. **Scout Codebase**: Identify existing structures or libraries matching the phase domain to reuse.
3. **Gray Area Detection**: Locate unresolved design points or technical ambiguities.
4. **Interactive Discussion**: Prompt the user to resolve each gray area through targeted multiple-choice or short-answer questions.
5. **Context Generation**: Output decisions to `.planning/phases/{{phase_id}}/{{padded_phase}}-CONTEXT.md` using the `hm-context` template.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Multi-choice list of design directions |
| `human-action` | Pauses for user to provide custom spec files or docs |

## Output Contract
- `{{padded_phase}}-CONTEXT.md` file in the phase directory
