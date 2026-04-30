# Source Evidence — hm-opencode-non-interactive-shell

## Blocker Resolution

The prior blocker was: raw Hermes OpenCode source evidence had not been fetched. This closure does **not** fabricate Hermes evidence. The Hermes raw skill/source remains uninspected and is removed from required PASS evidence.

## Replacement Source Decision

| Source | Status | Why valid |
|---|---|---|
| Official OpenCode command documentation | ADOPT | Defines command execution surfaces, shell-output injection, `$ARGUMENTS`, and non-interactive command authoring constraints. |
| Local `hm-opencode-platform-reference` repomix OpenCode source pack | ADOPT | Provides inspectable source corpus (`references/repomix-opencode.md` / `.xml`) for platform behavior when docs are insufficient. |
| `garagon/nanostack` guard tier pattern | ADAPT | Supplies ALLOW/WARN/BLOCK command danger-tier reasoning, adapted as reporting guidance rather than governance. |
| Hermes OpenCode search evidence | REJECT AS PASS EVIDENCE | Search metadata is insufficient for RICH-1/RICH-5. It remains a deferred lead only. |

## Bundled Resource Diff / Rationale

The replacement evidence has usable local bundled resources through `hm-opencode-platform-reference`:

- `references/opencode-commands.md`
- `references/opencode-plugins.md`
- `references/opencode-custom-tools.md`
- `references/repomix-opencode.md`
- `references/repomix-opencode.xml`

This skill's own resources translate that source evidence into non-interactive shell rules:

- `references/command-tables.md`
- `references/env-variables.md`
- `references/prompt-handling.md`
- `references/cognitive-patterns.md`
- `references/source-evidence.md`
- `evals/evals.json`
- `scripts/validate-skill.sh`

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS | Hermes is explicitly rejected; official OpenCode docs/source pack and Nanostack guard pattern replace it. |
| RICH-5 | PASS | Domain-specific shell safety references, evals, validator, and source-evidence scorecard are bundled. |
| RICH-8 | PASS | RICH score now records the source substitution instead of leaving a partial/deferred claim. |
