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
