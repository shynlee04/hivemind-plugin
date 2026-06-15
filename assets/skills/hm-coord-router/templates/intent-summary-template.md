# Intent Summary Template

Pre-dispatch summary the orchestrator writes before invoking
`delegate-task`. Helps the user review the intent classification and
catch mis-routes before work begins.

```markdown
# Intent Summary

**User prompt:** "<verbatim prompt>"

**Classified intent:** `<one of 10>` (verb: <trigger word>)

**Selected command:** `<command-name>`

**Selected agent:** `<agent-name>`

**Why this route (1-2 sentences):**
- <reason 1>
- <reason 2>

**Risks / open questions:**
- <risk 1>
- <risk 2>

**Alternative routes considered (and why rejected):**
- `<class>` → rejected because <reason>

**Expected timeline:** <rough estimate>
```

## When to use

- High-stakes dispatches (production changes, irreversible side effects)
- Ambiguous prompts (multi-intent or unclear verb)
- After pattern failures (route didn't work last time)

## When to skip

- Simple, low-stakes dispatches (single-file edit, single test)
- Clear, single-verb prompts ("write a failing test for X")
- Re-dispatches of an already-reviewed packet
