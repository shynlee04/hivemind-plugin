# Parsing Rules Reference

Detailed grammar specification, edge cases, and examples for `$ARGUMENT` propositional command parsing.

## Grammar Specification

```
input         → verb? arguments*
verb          → "/" word | word
arguments     → named_arg | flag_arg | positional
named_arg     → word "=" value
flag_arg      → "--" word value?
positional    → word
value         → quoted_string | word
quoted_string → '"' inner '"'
inner         → any characters except unescaped '"'
word          → sequence of non-whitespace characters
```

**Splitting rule:** Always split on the first occurrence of the delimiter (`=` or `:`). Everything after the first delimiter becomes the value, including additional delimiters.

## Edge Cases

| Case | Input | Behavior |
|------|-------|----------|
| Empty input | `""` or whitespace | Return empty result: `{ verb: null, flags: {}, positional: [] }` |
| Verb only | `/deploy` | `{ verb: "deploy", flags: {}, positional: [] }` |
| Malformed key=value | `=value` | Treat as positional — key is empty |
| Malformed key=value | `key=` | Value is empty string: `{ key: "" }` |
| Nested quotes | `"value with \"inner\" quotes"` | Strip outer quotes only; inner quotes preserved |
| Unmatched quote | `"unclosed value` | Treat everything after `"` as the value |
| Double equals | `key==value` | Split on first `=`: key is `key`, value is `=value` |
| Double colon | `entity::action` | Split on first `:`: entity is `entity`, action is `:action` |
| Flag at end | `--verbose` (last token) | Boolean flag set to true |
| Flag with no value | `--name --other` | `name` is boolean-true; `--other` parsed normally |
| Mixed delimiters | `key=value:extra` | Named arg: key=`key`, value=`value:extra` (only first `=` splits) |

## Examples Table

| Input | Verb | Flags | Positional |
|-------|------|-------|------------|
| `/start-work mode=refactor` | `start-work` | `{ mode: "refactor" }` | `[]` |
| `deploy --verbose --target api` | `deploy` | `{ verbose: true, target: "api" }` | `[]` |
| `audit scope=skills type="agent-authorization"` | `audit` | `{ scope: "skills", type: "agent-authorization" }` | `[]` |
| `skill=session-context-manager` | null | `{ skill: "session-context-manager" }` | `[]` |
| `/hf-audit --dry-run --scope skills` | `hf-audit` | `{ dry-run: true, scope: "skills" }` | `[]` |
| `commit:push merge:request` | null | `{ commit: "push", merge: "request" }` | `[]` |
| `deploy production --force` | `deploy` | `{ force: true }` | `["production"]` |
| `--name "Test Suite" --verbose` | null | `{ name: "Test Suite", verbose: true }` | `[]` |
| `""` | null | `{}` | `[]` |
| `key= --flag` | null | `{ key: "", flag: true }` | `[]` |

## Reconstruction Rules

When rebuilding a shell command from parsed components:

1. Start with the verb (prepend `/` if it was a slash command).
2. Append named arguments as `key=value`. Quote values containing spaces.
3. Append flag arguments as `--flag value` or `--flag` for booleans.
4. Append positional arguments at the end, in original order.
5. Add non-interactive flags (`-y`, `--yes`, `--no-pager`) for tools that prompt.

## Validation Checklist

After parsing, verify:

- [ ] Verb is non-empty if the input contained a leading word.
- [ ] Every `--flag` is either boolean-true or has a non-flag value.
- [ ] No token is consumed twice.
- [ ] Quoted strings have matching delimiters (or are handled as unmatched).
- [ ] Propositional expressions split on the first delimiter only.
