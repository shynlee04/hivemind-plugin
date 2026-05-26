---
name: "skill-name"
description: >
  Create, edit, and optimize agent skills. Use when users want to "create a skill",
  "add a skill", "build a skill from a repo", "find skill patterns", "classify skills",
  "generate evals for skills", "synthesize a skill", "extract patterns", "score skill quality",
  or "build eval frameworks".
metadata:
  version: "1.0.0"
  author: ""
  created: "YYYY-MM-DD"
  license: "MIT"
---

# Skill Name

## Iron Law

This skill MUST NOT be used for:
- Creating agents (use agents-and-subagents-dev)
- Creating commands (use command-dev)
- Creating custom tools (use custom-tools-dev)
- Auditing or improving existing skills (use use-authoring-skills)
- General debugging or coding tasks

## On Load

1. Read the user's request and classify intent against trigger phrases in description.
2. If no match, decline and suggest the correct skill.
3. If match, proceed to the appropriate pipeline.

## Pipeline

```
User request
  │
  ├─ "create skill from repo/codebase" ──► INGEST
  │   1. Clone or fetch the source repo
  │   2. Extract SKILL.md files and reference patterns
  │   3. Classify patterns (decision-tree, pipeline, reference, eval)
  │   4. Synthesize new skill from extracted patterns
  │
  ├─ "find/classify/extract patterns" ──► CLASSIFY
  │   1. Scan target repos or local skills
  │   2. Categorize by pattern type
  │   3. Report findings with examples
  │
  ├─ "generate/build evals" ──► EVAL
  │   1. Identify skill under test
  │   2. Generate test cases (positive + negative)
  │   3. Write trigger-queries.json
  │   4. Validate JSON structure
  │
  └─ No match ──► DECLINE
      1. Explain why this skill does not apply
      2. Suggest the correct skill
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| Writing skills without trigger phrases | Skill never activates | Always include concrete trigger phrases in description |
| Hardcoded paths in skills | Breaks across machines | Use relative paths or environment variables |
| Skills that do everything | Too broad, poor precision | One skill, one responsibility |
| No evals for a skill | Cannot verify correctness | Always include evals/ and trigger-queries.json |
| Copying skills verbatim | Misses context adaptation | Extract patterns, not text |

## Reference Map

| Resource | Purpose | Location |
|---|---|---|
| SKILL.md spec | Official skill format | `.opencode/skills/*/SKILL.md` |
| agents-and-subagents-dev | Agent creation | `.opencode/skills/agents-and-subagents-dev/` |
| command-dev | Command creation | `.opencode/skills/command-dev/` |
| custom-tools-dev | Tool creation | `.opencode/skills/custom-tools-dev/` |
| use-authoring-skills | Skill auditing | `.opencode/skills/use-authoring-skills/` |
| evals/evals.json | Self-test cases | `./evals/evals.json` |
| evals/trigger-queries.json | Trigger validation | `./evals/trigger-queries.json` |
| templates/skill-scaffold.md | New skill template | `./templates/skill-scaffold.md` |
| templates/eval-scaffold.json | New eval template | `./templates/eval-scaffold.json` |
