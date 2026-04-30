# Eval Framework

## Overview

This reference covers the eval structure used to test and validate skills. Every skill produced by the skill-synthesis pipeline must have evals. The eval framework is adapted from the agentskills.io specification (TAB 4) and the existing `use-authoring-skills/references/10-eval-lifecycle.md`.

## The Iron Law

```
NO SKILL WITHOUT EVALS
```

A scaffold without evals is incomplete. A skill without executed evals is untested.

## Eval Structure

Every eval test case has three components: prompt, expected output, and mechanically verifiable assertions. For the full eval structure, assertion design principles, and grading methodology, see `use-authoring-skills/references/10-eval-lifecycle.md`.

### Minimum Requirements

- At least 3 test cases per skill
- Each test case must have at least 3 assertions
- Assertions must be mechanically verifiable (no subjective claims)
- Prompts must vary in phrasing (casual, formal, edge case)

## evals.json Structure

```json
{
  "skill_name": "skill-synthesis",
  "version": "1.0.0",
  "evals": [
    {
      "id": 1,
      "name": "synthesize-from-github",
      "prompt": "Create a skill from the shynlee04/opencode repository that handles plugin architecture.",
      "expected_output": "A skill directory with SKILL.md containing plugin-specific frontmatter, reference files about plugin patterns, and passing evals.",
      "files": [],
      "assertions": [
        "SKILL.md exists with valid YAML frontmatter",
        "Frontmatter includes 'name' field in kebab-case",
        "Frontmatter includes 'description' field starting with 'Use when...'",
        "references/ directory exists with at least 3 numbered markdown files",
        "Each reference file is between 150-300 lines",
        "evals/evals.json exists with at least 3 test cases",
        "evals/trigger-queries.json exists with 20 queries"
      ]
    },
    {
      "id": 2,
      "name": "classify-existing-skill",
      "prompt": "Classify the use-authoring-skills skill by pattern type.",
      "expected_output": "A classification report identifying the skill as P2 Domain with routing, efficiency, and testing axes.",
      "files": [],
      "assertions": [
        "Classification output is valid JSON",
        "Pattern field is one of: P1, P2, P3",
        "Routing axis is populated",
        "Efficiency axis is populated",
        "Testing axis is populated"
      ]
    },
    {
      "id": 3,
      "name": "quality-score-skill",
      "prompt": "Score the quality of the deep-research skill.",
      "expected_output": "A quality report with 5-dimension weighted scores and a grade.",
      "files": [],
      "assertions": [
        "Quality report includes all 5 dimensions",
        "Each dimension has a score between 1-5",
        "Overall weighted score is calculated correctly",
        "Grade is one of: EXCELLENT, GOOD, ACCEPTABLE, NEEDS WORK"
      ]
    }
  ]
}
```

## trigger-queries.json Structure

```json
{
  "skill_name": "skill-synthesis",
  "queries": [
    { "id": 1, "text": "create a skill from github", "split": "train" },
    { "id": 2, "text": "synthesize skills from a repo", "split": "train" },
    { "id": 3, "text": "find skill patterns online", "split": "train" },
    { "id": 4, "text": "build a skill template library", "split": "train" },
    { "id": 5, "text": "classify this skill by type", "split": "train" },
    { "id": 6, "text": "generate evals for my skill", "split": "train" },
    { "id": 7, "text": "score this skill quality", "split": "train" },
    { "id": 8, "text": "I need to create skills from codebases", "split": "train" },
    { "id": 9, "text": "extract skill patterns from open source", "split": "train" },
    { "id": 10, "text": "build a skill scaffold with tests", "split": "train" },
    { "id": 11, "text": "how do I make a new agent skill", "split": "train" },
    { "id": 12, "text": "analyze skill architecture patterns", "split": "train" },
    { "id": 13, "text": "find skill patterns on github", "split": "val" },
    { "id": 14, "text": "test this skill with evals", "split": "val" },
    { "id": 15, "text": "grade my skill quality", "split": "val" },
    { "id": 16, "text": "create skills from remote repos", "split": "val" },
    { "id": 17, "text": "what pattern is this skill", "split": "val" },
    { "id": 18, "text": "generate a skill template", "split": "val" },
    { "id": 19, "text": "validate skill structure", "split": "val" },
    { "id": 20, "text": "check skill overlaps", "split": "val" }
  ],
  "split_ratio": "60/40",
  "train_count": 12,
  "val_count": 8
}
```

### Query Design Rules

- 20 queries total minimum
- 60/40 train/val split (12 train, 8 val)
- Queries must vary in phrasing: direct commands, questions, casual requests
- Include edge cases: malformed input, ambiguous requests, multi-intent queries
- No duplicate semantics — each query tests a different trigger path

## Assertion Verification Commands

Each assertion type maps to a bash verification command:

| Assertion Type | Verification Command |
|----------------|---------------------|
| File existence | `test -f "$dir/SKILL.md"` |
| Content presence | `grep -q "^description:.*Use when" "$dir/SKILL.md"` |
| Structural | `find "$dir/references" -name "[0-9]*.md" \| wc -l` |
| Format (JSON) | `jq empty "$dir/evals/evals.json"` |

Bad assertions to avoid: vague ("output is good"), brittle (exact phrase matching), unverifiable ("well-structured"), LLM-dependent ("semantically appropriate"). See `use-authoring-skills/references/10-eval-lifecycle.md` for full assertion design guidance.

## Grading

Each assertion is graded PASS/FAIL with concrete evidence. The grading methodology, principles, and iteration loop are documented in `use-authoring-skills/references/10-eval-lifecycle.md`. Key points:

- Require concrete evidence — no benefit of the doubt
- Use scripts for mechanical checks (valid JSON, file existence, line counts)
- Use LLM for qualitative checks only when necessary
- Record evidence for every PASS/FAIL

## Workspace Structure

Each iteration creates an isolated workspace:

```
workspace/
└── iteration-1/
    ├── eval-synthesize-from-github/
    │   ├── prompt.txt
    │   ├── expected.txt
    │   ├── actual/
    │   │   └── <generated skill files>
    │   └── results.json
    ├── eval-classify-existing-skill/
    │   ├── prompt.txt
    │   ├── expected.txt
    │   ├── actual/
    │   └── results.json
    └── summary.json
```

### summary.json

```json
{
  "iteration": 1,
  "skill_name": "skill-synthesis",
  "evals_run": 3,
  "total_assertions": 21,
  "passed": 18,
  "failed": 3,
  "pass_rate": 0.857,
  "time_seconds": 45.2,
  "tokens": 12500,
  "timestamp": "2026-04-05T10:30:00Z"
}
```

## Benchmark Aggregation

Across iterations, track:

| Metric | Purpose |
|--------|---------|
| `pass_rate` | Primary quality signal (target: >= 0.8) |
| `time_seconds` | Performance baseline |
| `tokens` | Cost estimation |
| `iteration` | Convergence tracking |
| `delta_pass_rate` | Improvement per iteration |

```json
{
  "benchmarks": [
    { "iteration": 1, "pass_rate": 0.571, "time_seconds": 42.1, "tokens": 11200 },
    { "iteration": 2, "pass_rate": 0.762, "time_seconds": 38.5, "tokens": 10800 },
    { "iteration": 3, "pass_rate": 0.905, "time_seconds": 35.2, "tokens": 9500 }
  ]
}
```
