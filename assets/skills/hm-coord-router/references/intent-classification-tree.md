# Intent Classification Tree

Walk this tree top-down. At each branch, check the user's prompt for the
matching trigger verb or pattern. The first match wins.

## Root: Is the prompt actionable or exploratory?

```
Actionable (verb present, deliverable clear)
  → continue ↓

Exploratory (no verb, vague, "what should I do?")
  → intent class (brainstorm) — load `hm-intent-brainstorm`
```

## Actionable: which verb class?

```
spec   — "spec", "specify", "lock", "define", "write requirements",
         "acceptance criteria", "EARS", "verification"
         → intent class: spec

test   — "test", "TDD", "red-green", "coverage", "vitest",
         "write a failing test", "assert"
         → intent class: test

debug  — "debug", "diagnose", "fix", "broken", "error",
         "doesn't work", "stack trace", "regression"
         → intent class: debug

refactor — "refactor", "clean up", "restructure", "rename",
           "extract", "inline", "deduplicate", "consolidate"
           → intent class: refactor

ship   — "ship", "deploy", "release", "production", "rollout",
         "publish", "tag", "changelog"
         → intent class: ship

research — "research", "investigate", "deep-dive", "compare",
           "what does X do", "how does Y work", "look into"
           → intent class: research

cross-cut — "across", "all modules", "everywhere", "global",
            "monorepo", "update everywhere", "consistent across"
            → intent class: cross-cut

product — "user value", "RICE", "product lens", "validate",
          "should we build this", "is this worth it", "user impact"
          → intent class: product

coord  — "multi-agent", "parallel", "wave", "delegate 3+",
         "coordinate 5 agents", "split across"
         → intent class: coord
```

## Ambiguity resolution

If the prompt contains 2+ verb classes:

1. **Pick the FIRST verb in the prompt** (priority order: debug > refactor >
   spec > test > ship > research > cross-cut > product > intent > coord)
2. **If 2+ classes are equally strong**, the prompt is multi-intent —
   split via `hm-coord-loop` instead of routing single-intent
3. **If no class matches**, escalate to user with the candidate classes you
   considered and the 1-sentence reasoning for each

## Examples

| Prompt | Class | Reasoning |
|---|---|---|
| "Lock the spec for the new auth flow" | spec | Verb: "Lock" + "spec" |
| "Why is the sidecar timing out?" | debug | Verb: "Why" implies diagnosis |
| "Refactor the session-tracker to use Maps" | refactor | Verb: "Refactor" |
| "Ship the v0.2 milestone" | ship | Verb: "Ship" |
| "Research how other harnesses handle routing" | research | Verb: "Research" |
| "Update the lint config across the monorepo" | cross-cut | "across" keyword |
| "Is the sync phase actually valuable?" | product | "valuable" + "is" implies RICE |
| "Help me think through what to ship next" | intent | "think through" + "what" |
| "Coordinate 5 subagents to audit the skills" | coord | "5 subagents" implies wave |
| "Write a failing test for the parser" | test | "failing test" |
| "Fix the bug AND write tests" | (multi-intent) | 2 verbs: "Fix" + "write" |
| "Do the thing" | (ambiguous) | No clear verb — escalate |
