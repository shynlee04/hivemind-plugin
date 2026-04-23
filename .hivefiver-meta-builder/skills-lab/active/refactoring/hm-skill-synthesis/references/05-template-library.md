# Template Library

## Overview

This reference covers how to extract reusable templates from ingested skill repositories. Templates are one-time extractions — they are not maintained as living documents. They serve as starting scaffolds that get adapted to each new domain.

## How to Extract Templates

Templates come from the classification phase. After ingesting and classifying a corpus of skills:

1. **Identify the top 3 examples** in each category (P1 router, P2 domain, P3 expertise)
2. **Extract common structural patterns:**
   - Frontmatter shape (which fields, in what order)
   - Reference file topics (what gets split out vs kept inline)
   - Script types (validation, grading, cleanup)
   - Eval structure (how many test cases, assertion patterns)
3. **Normalize into templates** — remove domain-specific content, keep structure

```bash
# Extract template from a classified skill
extract_template() {
  local skill_dir="$1"
  local template_dir="$2"

  mkdir -p "$template_dir"

  # Copy SKILL.md structure (strip body content, keep frontmatter + section headers)
  awk '/^---/{n++; next} n==2{print; next} /^## /{print; next}' \
    "$skill_dir/SKILL.md" > "$template_dir/SKILL.md"

  # Copy evals structure
  if [ -d "$skill_dir/evals" ]; then
    cp -r "$skill_dir/evals" "$template_dir/"
  fi

  # Copy scripts structure
  if [ -d "$skill_dir/scripts" ]; then
    cp -r "$skill_dir/scripts" "$template_dir/"
  fi
}
```

## Minimal SKILL.md Template

```markdown
---
name: <kebab-case-name>
description: >
  Use when <specific condition 1>, <specific condition 2>,
  or <specific condition 3>. Use when the user asks to
  "<trigger phrase 1>", "<trigger phrase 2>", or
  "<trigger phrase 3>".
metadata:
  layer: "<layer-number>"
  role: "<role-name>"
  pattern: <P1|P2|P3>
allowed-tools: <space-separated tool list>
---

# <skill-name>

## The Iron Law

```
<CORE PRINCIPLE — one line, uppercase>
```

## On Load

1. **First action** — what to do immediately when skill activates
2. **Check for planning files** — if task_plan.md exists, read Goal field

## Pipeline Overview

```
PHASE1 → PHASE2 → PHASE3 → PHASE4
```

### Phase 1: <NAME>

**Input:** <what goes in>
**Tools:** <which tools>
**Output:** <what comes out>

## Decision Tree — Pick Your Path

```
User says...                                    → Load
─────────────────────────────────────────────────────────────────────
"<trigger phrase 1>" / "<trigger phrase 2>"     → references/01-<topic>.md
"<trigger phrase 3>" / "<trigger phrase 4>"     → references/02-<topic>.md
```

**Rule:** Load only ONE reference file. Do not load all references.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-<topic>.md` | <when to load> |
| `references/02-<topic>.md` | <when to load> |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **<Name>** — <description> | <how to detect> | <how to fix> |

## Error Handling

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| <error> | <how to detect> | <how to recover> |
```

## Minimal evals.json Template

```json
{
  "skill_name": "<skill-name>",
  "version": "1.0.0",
  "evals": [
    {
      "id": 1,
      "name": "<eval-name>",
      "prompt": "<realistic user message>",
      "expected_output": "<human-readable success description>",
      "files": [],
      "assertions": [
        "<mechanically verifiable statement 1>",
        "<mechanically verifiable statement 2>",
        "<mechanically verifiable statement 3>"
      ]
    }
  ]
}
```

## Minimal trigger-queries.json Template

```json
{
  "skill_name": "<skill-name>",
  "queries": [
    { "id": 1, "text": "<trigger phrase>", "split": "train" },
    { "id": 2, "text": "<trigger phrase>", "split": "train" },
    { "id": 3, "text": "<trigger phrase>", "split": "train" },
    { "id": 4, "text": "<trigger phrase>", "split": "train" },
    { "id": 5, "text": "<trigger phrase>", "split": "train" },
    { "id": 6, "text": "<trigger phrase>", "split": "train" },
    { "id": 7, "text": "<trigger phrase>", "split": "train" },
    { "id": 8, "text": "<trigger phrase>", "split": "train" },
    { "id": 9, "text": "<trigger phrase>", "split": "train" },
    { "id": 10, "text": "<trigger phrase>", "split": "train" },
    { "id": 11, "text": "<trigger phrase>", "split": "train" },
    { "id": 12, "text": "<trigger phrase>", "split": "train" },
    { "id": 13, "text": "<trigger phrase>", "split": "val" },
    { "id": 14, "text": "<trigger phrase>", "split": "val" },
    { "id": 15, "text": "<trigger phrase>", "split": "val" },
    { "id": 16, "text": "<trigger phrase>", "split": "val" },
    { "id": 17, "text": "<trigger phrase>", "split": "val" },
    { "id": 18, "text": "<trigger phrase>", "split": "val" },
    { "id": 19, "text": "<trigger phrase>", "split": "val" },
    { "id": 20, "text": "<trigger phrase>", "split": "val" }
  ],
  "split_ratio": "60/40",
  "train_count": 12,
  "val_count": 8
}
```

## How to Adapt Templates to New Domains

1. **Replace all `<placeholder>` tokens** with domain-specific content
2. **Rewrite the description** — start with "Use when..." and list 3+ specific trigger conditions
3. **Adapt the decision tree** — map user intents to reference files for the target domain
4. **Create reference files** — one per distinct topic, 150-300 lines each
5. **Write evals** — at least 3 test cases with mechanically verifiable assertions
6. **Write trigger queries** — 20 queries with 60/40 train/val split
7. **Run validation gates** — validate-skill.sh, run-trigger-evals.sh, grade-outputs.sh

### Domain Adaptation Checklist

- [ ] Frontmatter `name` matches directory name (kebab-case)
- [ ] Description starts with "Use when..."
- [ ] `metadata.pattern` matches actual structure (P1/P2/P3)
- [ ] `allowed-tools` lists only tools the skill actually uses
- [ ] Decision tree covers all reference files
- [ ] Reference files are numbered sequentially
- [ ] Each reference file is 150-300 lines
- [ ] evals.json has at least 3 test cases
- [ ] trigger-queries.json has 20 queries with 60/40 split
- [ ] Anti-patterns section lists domain-specific failure modes
- [ ] Error handling table covers expected failure modes
