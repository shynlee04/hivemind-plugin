---
name: hf-command-parser
description: >
  This skill should be used only when parsing $ARGUMENT propositional commands from OpenCode command strings. Handles named arguments, flag extraction, multi-word quoted values, and propositional expressions (entity=value, entity:action). Triggers: "parse $ARGUMENT", "parse OpenCode command arguments", "command parsing framework", "propositional command syntax", "extract flags from command". NOT for general natural-language parsing or shell execution.
metadata:
  layer: "3"
  role: "domain-execution"
  pattern: P2
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## Overview

Parses `$ARGUMENT` propositional command strings from OpenCode into structured key-value maps. Use when handling named arguments, extracting flags, parsing multi-word quoted values, or resolving propositional expressions. Produces mentally-parsed command maps without code execution.

# Command Parser

Parses `$ARGUMENT` strings passed to OpenCode commands into structured key-value maps. The LLM performs parsing mentally — no code execution required.

<files_to_read>
- references/parsing-rules.md — detailed grammar, edge cases, and examples table
</files_to_read>

## Parsing Patterns

### Named arguments (key=value)

Tokens matching `key=value` become entries in a flags map. The key is everything before the first `=`. The value is everything after it.

**Example:** `mode=refactor target=auth` → `{ mode: "refactor", target: "auth" }`

### Quoted multi-word values

When a value contains spaces, it may be wrapped in double quotes. The quotes are part of the token — strip them to get the actual value.

**Example:** `message="fix auth bug"` → `{ message: "fix auth bug" }`

### Flag-style arguments (--flag value)

Tokens starting with `--` are flag names. The next token (if it does not also start with `--`) is the flag's value. If the next token starts with `--` or does not exist, the flag is boolean-true.

**Example:** `--verbose --name "Test Suite"` → `{ verbose: true, name: "Test Suite" }`

### Propositional expressions

Two forms exist:

- **Entity-value:** `entity=value` — splits on the first `=` only. Produces `{ entity, value }`.
- **Entity-action:** `entity:action` — splits on the first `:` only. Produces `{ entity, action }`.

**Example:** `skill=session-context-manager` → `{ entity: "skill", value: "session-context-manager" }`

### Positional arguments

Bare words not matching any pattern above are positional, collected in order.
Example: `deploy production --force` → `{verb: "deploy", positional: ["production"], flags: {force: true}}`.

## Parsing Procedure

1. **Identify the verb** — first token (strip leading `/`).
2. **Classify remaining tokens** — `key=value`, `--flag`, quoted string, or positional.
3. **Build the flags map** — merge all named arguments.
4. **Collect positionals** — unconsumed tokens in order.
5. **Expand propositions** — record entity and value/action for `key=value` or `key:action` tokens.

## Common Errors

| Error | Detection | Handling |
|-------|-----------|----------|
| Empty input | Blank or whitespace-only | Return `{ verb: null, flags: {}, positional: [] }` |
| Missing flag value | `--flag` followed by `--flag` | Treat first as boolean-true |
| Unmatched quote | Opening `"` with no closing `"` | Rest of input becomes the value |
| Double delimiter | `key==value` or `key::action` | Split on first delimiter only |
| Orphan positional | Bare word between `--flag` tokens | Classify as positional |

## Worked Example: Complex Command String

**Input:** `/plan skill=create-auth-skill scope="oauth2 + openid" --priority high --dry-run`

```
Step 1: Identify verb → "plan"
Step 2: Classify tokens:
  "skill=create-auth-skill"  → key=value  → { skill: "create-auth-skill" }
  'scope="oauth2 + openid"'  → quoted kv   → { scope: "oauth2 + openid" }
  "--priority high"           → --flag val  → { priority: "high" }
  "--dry-run"                 → --flag bool → { dryRun: true }
Step 3: Build flags map → { skill, scope, priority, dryRun }
Step 4: No positionals → []
Step 5: Expand propositions → { entity: "skill", value: "create-auth-skill" }
```

**Result:**
```json
{
  "verb": "plan",
  "flags": {
    "skill": "create-auth-skill",
    "scope": "oauth2 + openid",
    "priority": "high",
    "dryRun": true
  },
  "positional": [],
  "proposition": { "entity": "skill", "value": "create-auth-skill" }
}
```

## Non-Interactive Shell Compliance

When reconstructing commands from parsed arguments: always add `-y`/`--yes`/`--no-pager` for interactive tools; never produce vim, nano, less, man, `git add -p`, or `git rebase -i`; quote values containing spaces.

## Self-Correction

### When the Task Keeps Failing
[Detection] The same command string produces inconsistent parse results across 3+ attempts. A specific token pattern (e.g., nested quotes, escaped characters) consistently fails to parse. Verb identification returns null when a verb clearly exists.
[Recovery] STOP parsing and re-examine the raw command string. Check for edge cases: double `=` in key-value (`key==value` → split on first `=` only), unmatched quotes (rest of input becomes the value), leading/trailing whitespace. If the command syntax is genuinely ambiguous, flag it for human review rather than guessing. Document the ambiguous token and all possible interpretations.

### When Unsure About the Next Step
[Detection] Token classification is ambiguous (is `--verbose` a flag or a positional value called `--verbose`?). A flag token is followed by what looks like another flag but could be a value. Propositional expression could be either entity=value or entity:action.
[Recovery] Apply the parsing precedence rules in order: (1) Named arguments (`key=value`), (2) Flag-style (`--flag value`), (3) Propositional (`entity=value` or `entity:action`), (4) Positional (everything else). If a token could match multiple patterns, the first matching pattern wins. Document the precedence decision in the parse trace.

### When the User Contradicts Skill Guidance
[Detection] User provides a command string that doesn't follow propositional syntax but insists it should parse. User wants to add a new parsing pattern not covered by the five defined patterns. User says the parser should handle natural language, not just structured commands.
[Recovery] Acknowledge: "This parser handles propositional command syntax only — key=value, --flag, entity:action, and quoted values. Natural language parsing is explicitly excluded." If the user needs a new pattern, evaluate whether it fits the propositional model. If not, route to a natural-language parser or a more general skill. Do not extend the parser beyond its defined grammar without updating `references/parsing-rules.md`.

### When an Edge Case Is Encountered
[Detection] Command string contains shell operators (`|`, `&&`, `;`, `>`). Token has special characters in value position. Empty string after `=` in key=value. Large values with special Unicode characters. Flag name contains hyphens beyond the leading `--`.
[Recovery] For shell operators: do NOT expand or execute them — treat them as literal characters in the value or flag as appropriate. For empty values (`key=`): set value to empty string `""`. For special characters: pass through literally in the value, quoting in output. For multi-hyphen flags (`--flag-name`): treat the entire `--flag-name` as the flag key. Always prefer literal preservation over interpretation — the parser should not modify input.

## Hivemind Tooling Alignment

This skill teaches the loading agent how to use Hivemind's custom toolings. The agent that loads this skill should declare the following tools in its frontmatter:

```yaml
tools:
  - configure-primitive,delegate-task,hivemind-doc
```

### Migration from GSD

If the loading agent has legacy `gsd-*` SDK references, replace with Hivemind equivalents:

| GSD tool | Hivemind equivalent |
|---|---|
| `gsd-tools` CLI | `configure-primitive` + `delegate-task` |
| `gsd-state` JSON manipulation | `hivemind-doc` (read/chunk/search) |
| `gsd-context-monitor` | `hivemind-trajectory` (record events) |
| `gsd-prompt-guard` | `prompt-analyze` (or manual review) |

### Cross-References

This skill aligns with the new tech-agnostic primitive ecosystem:
- Routing: `hm-coord-router` (intent classification + agent pairing)
- Coordination: `hm-coord-loop` (multi-agent dispatch)
- Specialist example: `hm-test-driven`, `hm-debug-systematic`, `hm-arch-refactor`
- Governance: `hivemind-power-on` (load first)
- Quality gates: `hm-gate-triad` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed for end-to-end workflows.
