<purpose>
One-page newcomer-oriented tour of Hivemind. Output ONLY the `<reference>` content below. No additions.
</purpose>

<reference>
# Hivemind — Get Shit Done

Plan-driven development for solo agentic work with Claude Code. Hivemind turns a vague idea into a hierarchical plan, then executes it phase by phase with state tracking and atomic commits.

## Start here (3 commands)

```text
/hm-new-project        # Greenfield: questioning → research → requirements → roadmap
/hm-plan-phase 1       # Create a detailed plan for phase 1
/hm-execute-phase 1    # Execute all plans in the phase
```

Existing codebase? Run `/hm-map-codebase` first to ground Hivemind in your code.

## Common commands

| Command | Purpose |
|---|---|
| `/hm-progress` | Where am I, what's next — also routes freeform intent with `--do "..."` |
| `/hm-quick` | Small ad-hoc task with Hivemind guarantees (planning dir + atomic commit) |
| `/hm-fast "<task>"` | Trivial inline change — no subagents, ≤3 file edits |
| `/hm-discuss-phase <N>` | Capture vision and decisions before planning |
| `/hm-debug "<symptom>"` | Persistent debug session, survives `/clear` |
| `/hm-capture` | Save an idea, todo, note, seed, or backlog item |
| `/hm-verify-work <N>` | Conversational UAT for a completed phase |
| `/hm-ship <N>` | Open a PR from a completed phase |
| `/hm-help --full` | Complete reference (every command, every flag) |

## Want more?

```text
/hm-help --brief         # 10-line refresher of top commands
/hm-help --full          # complete reference
/hm-help <topic>         # one section only — see topics below
/hm-help --brief <topic> # compact scoped lookup — signature + one-line summary
```

Topics: `workflow` · `planning` · `execute` · `quick` · `debug` · `capture` · `ship` · `config` · `milestones` · `spike` · `sketch` · `review` · `audit` · `progress`

## Update Hivemind

```bash
npx @opengsd/hivemind-redux@latest
```
</reference>
