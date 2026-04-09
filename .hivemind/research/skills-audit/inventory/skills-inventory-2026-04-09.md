# Skills Inventory — 2026-04-09

## Scope
All 20 project-owned SKILL.md files across `.claude/skills/`, `.agents/skills/`

## Location Map

| # | Skill Name | Location | Lines | Verdict |
|---|-----------|----------|-------|---------|
| 1 | meta-builder | `.claude/skills/` | 403 | NEEDS_REFACTOR |
| 2 | use-authoring-skills | `.claude/skills/` | 255 | NEEDS_REFACTOR |
| 3 | agents-and-subagents-dev | `.claude/skills/` | 177 | NEEDS_REFACTOR |
| 4 | command-dev | `.claude/skills/` | 80 | PASS |
| 5 | custom-tools-dev | `.claude/skills/` | 86 | PASS |
| 6 | coordinating-loop | `.claude/skills/` | 370 | NEEDS_REFACTOR |
| 7 | phase-loop | `.claude/skills/` | 117 | NEEDS_REFACTOR |
| 8 | planning-with-files | `.claude/skills/` | 276 | PASS |
| 9 | session-context-manager | `.claude/skills/` | 155 | FAIL |
| 10 | user-intent-interactive-loop | `.claude/skills/` | 389 | PASS |
| 11 | opencode-platform-reference | `.claude/skills/` | 62 | PASS |
| 12 | opencode-non-interactive-shell | `.claude/skills/` | 237 | PASS |
| 13 | oh-my-openagent-reference | `.claude/skills/` | 55 | NEEDS_REFACTOR |
| 14 | harness-audit | `.claude/skills/` | 152 | NEEDS_REFACTOR |
| 15 | harness-delegation-inspection | `.claude/skills/` | 194 | NEEDS_REFACTOR |
| 16 | agent-authorization | `.claude/skills/` | 233 | NEEDS_REFACTOR |
| 17 | command-parser | `.claude/skills/` | 79 | PASS |
| 18 | hm-deep-research | `.claude/skills/` | 234 | PASS |
| 19 | skill-synthesis | `.claude/skills/` | 174 | NEEDS_REFACTOR |
| 20 | eval-harness | `.agents/skills/` | 270 | NEEDS_REFACTOR |

## Verdict Distribution

| Verdict | Count | % |
|---------|-------|---|
| PASS | 8 | 40% |
| NEEDS_REFACTOR | 11 | 55% |
| FAIL | 1 | 5% |

## Architecture Classification

### By Lineage
| Lineage | Skills |
|---------|--------|
| Meta-builder module | meta-builder, use-authoring-skills, agents-and-subagents-dev, command-dev, custom-tools-dev, skill-synthesis, agent-authorization |
| Project-specific | coordinating-loop, phase-loop, planning-with-files, session-context-manager, user-intent-interactive-loop, opencode-platform-reference, opencode-non-interactive-shell, oh-my-openagent-reference, harness-audit, harness-delegation-inspection, command-parser, hm-deep-research, eval-harness |

### By Hierarchy
| Hierarchy | Skills |
|-----------|--------|
| Coordinator/Orchestrator | meta-builder, coordinating-loop, user-intent-interactive-loop, harness-audit, hm-deep-research, agent-authorization, planning-with-files |
| Sub-session | use-authoring-skills, agents-and-subagents-dev, command-dev, custom-tools-dev, phase-loop, session-context-manager, opencode-platform-reference, opencode-non-interactive-shell, oh-my-openagent-reference, harness-delegation-inspection, command-parser, skill-synthesis, eval-harness |

### By Task Group
| Group | Skills |
|-------|--------|
| Group 1 (How-to-Process) | meta-builder, coordinating-loop, phase-loop, planning-with-files, session-context-manager, user-intent-interactive-loop, harness-audit, agent-authorization, hm-deep-research |
| Group 2 (How-to-Implement) | use-authoring-skills, agents-and-subagents-dev, command-dev, custom-tools-dev, opencode-platform-reference, opencode-non-interactive-shell, oh-my-openagent-reference, harness-delegation-inspection, command-parser, skill-synthesis, eval-harness |

## Per-Skill Verdict Summary

### PASS Skills (8)

| Skill | Why PASS | Confidence |
|-------|----------|-----------|
| command-dev | Lean (80 lines), excellent Iron Law, good progressive disclosure | 8/10 |
| custom-tools-dev | Lean (86 lines), clear lifecycle, good references | 7/10 |
| planning-with-files | Strongest body in batch, excellent tiered response, complete schemas | 8/10 |
| user-intent-interactive-loop | Comprehensive gates, question matrix, good cross-refs | 7/10 |
| opencode-platform-reference | Good reference table, key patterns section | 8/10 |
| opencode-non-interactive-shell | Best-in-class, practical BAD/GOOD examples, self-contained | 9/10 |
| command-parser | Clean, focused, immediately usable | 8/10 |
| hm-deep-research | Exemplar skill — stage gates, tool matrix, anti-patterns | 9/10 |

### FAIL Skills (1)

| Skill | Why FAIL | Confidence |
|-------|----------|-----------|
| session-context-manager | Circular description, functional overlap with planning-with-files, no clear boundary | 8/10 |

### NEEDS_REFACTOR Skills (11)

| Skill | Primary Issue | Confidence |
|-------|--------------|-----------|
| meta-builder | 403 lines, trigger collision with children, Hivefiver-coupled | 7/10 |
| use-authoring-skills | Self-contradiction: demands trigger phrases but description has none | 8/10 |
| agents-and-subagents-dev | 68-word description, formulaic opening, overlap with agent-authorization | 8/10 |
| coordinating-loop | Duplicate in .opencode/, script-heavy without fallback, "ralph-loop" undefined | 7/10 |
| phase-loop | Too thin (117 lines), HiveMind agent names, no worked example | 6/10 |
| oh-my-openagent-reference | Navigation index only — no domain synthesis, internal vocabulary | 7/10 |
| harness-audit | Name uses internal vocab, description has internal triggers | 7/10 |
| harness-delegation-inspection | Identity crisis: covers delegation+inspection+GSD+MCP+ecosystem | 6/10 |
| agent-authorization | Name misleading, Hivefiver-specific profiles, internal vocabulary | 7/10 |
| skill-synthesis | Trigger phrases too narrow, external dependency without fallback | 7/10 |
| eval-harness | Name collision, phantom CLI commands, missing trigger phrases, wrong directory | 6/10 |
