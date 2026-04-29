# Eval Lifecycle

## The Eval Lifecycle

```
CREATE → RUN → GRADE → IMPROVE → REPEAT
Evals    Both    Outputs  Skill    Until
& Prompts Configs & Score  Content Satisfied
```

Each phase produces artifacts on disk. Nothing lives only in context.

## Writing Eval Prompts

Every eval test case has three parts:

| Component | Purpose | Example |
|-----------|---------|---------|
| **Prompt** | Realistic user message | "I have a CSV — find the top 3 products by revenue" |
| **Expected output** | Human-readable success description | "A ranked list of top 3 products with revenue figures" |
| **Assertions** | Verifiable statements about output | "SKILL.md exists with valid YAML frontmatter" |

### Storing Evals

Store test cases in `evals/evals.json`:

```json
{
  "skill_name": "use-authoring-skills",
  "evals": [
    {
      "id": 1,
      "prompt": "I need to create a new skill for PDF processing.",
      "expected_output": "A complete skill directory with SKILL.md, proper frontmatter, and reference files.",
      "files": [],
      "assertions": [
        "SKILL.md exists with valid YAML frontmatter",
        "Frontmatter includes 'name' field in kebab-case",
        "Frontmatter includes 'description' field starting with 'Use when...'"
      ]
    }
  ]
}
```

### Writing Good Prompts

| Principle | Good | Bad |
|-----------|------|-----|
| **Realistic** | "my boss wants a chart from this data file" | "analyze this CSV" |
| **Varied phrasing** | Mix casual and formal | All prompts use same structure |
| **Edge cases** | Malformed input, unusual requests | Only happy-path scenarios |
| **Multi-step** | "Create a skill, then audit it" | Single-step only |

## Assertion Design

### Good Assertions

| Type | Example | Why It Works |
|------|---------|-------------|
| **File existence** | "SKILL.md exists in the output directory" | Programmatically verifiable |
| **Content presence** | "The output includes a bar chart image file" | Specific and observable |
| **Structural** | "The frontmatter contains both name and description" | Countable, checkable |
| **Format** | "The output file is valid JSON" | Programmatically verifiable |

### Bad Assertions

| Type | Example | Why It Fails |
|------|---------|-------------|
| **Vague** | "The output is good" | Too vague to grade |
| **Brittle** | "Uses exactly the phrase 'Total Revenue: $X'" | Correct output with different wording fails |
| **Unverifiable** | "The code is well-structured" | Subjective |

## Running Evals

### The Core Pattern

Run each test case **twice**:

1. **With skill** — Load the skill, run the prompt, capture output
2. **Without skill** (baseline) — Same prompt, no skill, capture output

This gives you a delta to measure the skill's actual impact.

### Capturing Timing Data

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332
}
```

## Grading Methodology

### Process

Evaluate each assertion against the actual outputs. Record **PASS** or **FAIL** with specific evidence.

```json
{
  "assertion_results": [
    {
      "text": "SKILL.md exists with valid YAML frontmatter",
      "passed": true,
      "evidence": "Found SKILL.md, starts with ---"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 0,
    "total": 1,
    "pass_rate": 1.0
  }
}
```

### Principles

| Principle | Application |
|-----------|-------------|
| **Require concrete evidence** | Do not give the benefit of the doubt |
| **Use scripts for mechanical checks** | Valid JSON, file existence — use code |
| **Use LLM for qualitative checks** | Writing style, organization — LLM grading is appropriate |

## The Full Loop

```
1. Create evals (2-3 test cases minimum)
2. Run with-skill and without-skill for each eval
3. Grade outputs against assertions
4. Aggregate benchmarks and analyze patterns
5. Review outputs with a human
6. Propose improvements based on signals
7. Apply changes to SKILL.md
8. Repeat from step 2 in new iteration directory
9. Stop when: pass rate >= target, feedback is empty, no meaningful improvement
```

### When to Stop

| Condition | Action |
|-----------|--------|
| Overall pass rate >= 0.8 | Ship it |
| No improvement after 3 iterations | Redesign the skill |
| Feedback is consistently empty | Ship it |
| Delta is negative (skill makes things worse) | Re-examine the skill's core approach |
