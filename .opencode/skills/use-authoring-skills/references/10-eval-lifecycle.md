# Eval-Driven Development for Skills

## Table of Contents

- [Purpose](#purpose)
- [Why Evals Matter](#why-evals-matter)
- [The Eval Lifecycle](#the-eval-lifecycle)
- [Writing Eval Prompts](#writing-eval-prompts)
- [Assertion Design](#assertion-design)
- [Running Evals](#running-evals)
- [Grading Methodology](#grading-methodology)
- [Benchmark Interpretation](#benchmark-interpretation)
- [Iteration Based on Results](#iteration-based-on-results)
- [The Full Loop](#the-full-loop)
- [References](#references)

---

## Purpose

Eval-driven development for agent skills — the TDD equivalent for skill authoring. Skills are instructions, not code, but they still need systematic testing. This file covers the complete lifecycle: writing evals, running them, grading outputs, and iterating until the skill performs reliably.

See [04-tdd-workflow.md](04-tdd-workflow.md) for the RED-GREEN-REFACTOR methodology and [11-description-optimization.md](11-description-optimization.md) for description-specific testing.

---

## Why Evals Matter

Skills are instructions that guide Agent behavior. Without evals, you are guessing whether the skill works. Evals provide:

1. **Evidence, not intuition** — Measurable proof that the skill improves outputs
2. **Baseline comparison** — Quantify the delta between with-skill and without-skill
3. **Regression detection** — Catch when changes break previously working behavior
4. **Systematic improvement** — Know exactly which dimension to fix and by how much
5. **Release confidence** — Ship skills that have been tested against real scenarios

**The core principle:** A skill without evals is an untested hypothesis. Do not ship it.

---

## The Eval Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  CREATE  │ →  │   RUN    │ →  │  GRADE   │ →  │ IMPROVE  │ →  │  REPEAT  │
│  Evals   │    │  Both    │    │ Outputs  │    │  Skill   │    │  Until   │
│  & Prompts│    │ Configs  │    │ & Score  │    │ Content  │    │  Satisfied│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

Each phase produces artifacts on disk. Nothing lives only in context.

---

## Writing Eval Prompts

### The Three Components

Every eval test case has three parts:

| Component | Purpose | Example |
|-----------|---------|---------|
| **Prompt** | Realistic user message | "I have a CSV in ~/data/sales.csv — find the top 3 products by revenue" |
| **Expected output** | Human-readable success description | "A ranked list of top 3 products with revenue figures" |
| **Input files** (optional) | Files the skill needs to work with | `evals/files/sales.csv` |

### Storing Evals

Store test cases in `evals/evals.json` inside the skill directory:

```json
{
  "skill_name": "use-authoring-skills",
  "evals": [
    {
      "id": 1,
      "prompt": "I need to create a new skill for PDF processing. Walk me through it.",
      "expected_output": "A complete skill directory with SKILL.md, proper frontmatter, and reference files following the Agent Skills specification.",
      "files": [],
      "assertions": []
    }
  ]
}
```

See `templates/evals.json` for the full template.

### Writing Good Prompts

| Principle | Good | Bad |
|-----------|------|-----|
| **Realistic** | "my boss wants a chart from this data file" | "analyze this CSV" |
| **Varied phrasing** | Mix casual and formal | All prompts use same structure |
| **Specific context** | File paths, column names, company names | Generic "process this data" |
| **Edge cases** | Malformed input, unusual requests | Only happy-path scenarios |
| **Multi-step** | "Create a skill, then audit it, then fix the issues" | Single-step only |

### Prompt Variety Axes

Vary prompts along these dimensions:

1. **Formality** — "hey can you clean up this csv" vs "Parse the CSV at data/input.csv, drop rows where column B is null"
2. **Explicitness** — Direct mention of the domain vs implicit need
3. **Detail level** — Terse vs context-heavy with backstory
4. **Complexity** — Single-step vs multi-step workflows
5. **Edge cases** — Malformed input, ambiguous requests, boundary conditions

Start with 2-3 test cases. Expand after seeing first-round results.

---

## Assertion Design

Assertions are verifiable statements about what the output should contain or achieve. Add them **after** seeing the first round of outputs — you often do not know what "good" looks like until the skill has run.

### Good Assertions

| Type | Example | Why It Works |
|------|---------|-------------|
| **File existence** | "SKILL.md exists in the output directory" | Programmatically verifiable |
| **Content presence** | "The output includes a bar chart image file" | Specific and observable |
| **Structural** | "The frontmatter contains both name and description fields" | Countable, checkable |
| **Behavioral** | "The report includes at least 3 recommendations" | Countable threshold |
| **Format** | "The output file is valid JSON" | Programmatically verifiable |

### Bad Assertions

| Type | Example | Why It Fails |
|------|---------|-------------|
| **Vague** | "The output is good" | Too vague to grade |
| **Brittle** | "Uses exactly the phrase 'Total Revenue: $X'" | Correct output with different wording fails |
| **Unverifiable** | "The code is well-structured" | Subjective, not checkable from output |
| **Implementation detail** | "Uses a for loop, not a while loop" | Tests how, not what |

### Adding Assertions to Evals

```json
{
  "id": 1,
  "prompt": "Create a skill for CSV analysis",
  "expected_output": "A skill directory with SKILL.md and reference files",
  "files": [],
  "assertions": [
    "SKILL.md exists with valid YAML frontmatter",
    "Frontmatter includes 'name' field in kebab-case",
    "Frontmatter includes 'description' field starting with 'Use when...'",
    "No 'compatibility' field in frontmatter",
    "No 'Claude' or 'CLAUDE.md' terminology in any file",
    "At least one reference file exists in references/ directory"
  ]
}
```

---

## Running Evals

### Workspace Structure

```
skill-name/
├── SKILL.md
├── references/
└── evals/
    └── evals.json

skill-name-workspace/
└── iteration-1/
    ├── eval-create-csv-skill/
    │   ├── with_skill/
    │   │   ├── outputs/       # Files produced by the run
    │   │   ├── timing.json    # Tokens and duration
    │   │   └── grading.json   # Assertion results
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    └── benchmark.json         # Aggregated statistics
```

### The Core Pattern

Run each test case **twice**:

1. **With skill** — Load the skill, run the prompt, capture output
2. **Without skill** (baseline) — Same prompt, no skill, capture output

This gives you a delta to measure the skill's actual impact.

### Running a Single Eval

```
Execute this task:
- Skill path: /path/to/skill-name
- Task: [test prompt from evals.json]
- Input files: [files from evals.json]
- Save outputs to: workspace/iteration-1/eval-[name]/with_skill/outputs/
```

For the baseline, use the same prompt but without the skill path.

### Capturing Timing Data

Record token count and duration for each run:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332
}
```

This lets you compare the cost (tokens, time) against the benefit (pass rate improvement).

### When Improving an Existing Skill

Use the previous version as baseline instead of "without skill":

```bash
# Snapshot before editing
cp -r /path/to/skill /workspace/skill-snapshot/

# Point baseline runs at the snapshot
# Save to old_skill/outputs/ instead of without_skill/outputs/
```

---

## Grading Methodology

### Grading Process

Evaluate each assertion against the actual outputs. Record **PASS** or **FAIL** with specific evidence.

```json
{
  "assertion_results": [
    {
      "text": "SKILL.md exists with valid YAML frontmatter",
      "passed": true,
      "evidence": "Found SKILL.md at outputs/skill-name/SKILL.md, starts with ---"
    },
    {
      "text": "Frontmatter includes 'name' field in kebab-case",
      "passed": false,
      "evidence": "name field found but contains 'CSV_Analyzer' — uppercase and underscore"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 1,
    "total": 2,
    "pass_rate": 0.5
  }
}
```

### Grading Principles

| Principle | Application |
|-----------|-------------|
| **Require concrete evidence** | Do not give the benefit of the doubt. A section titled "Summary" with one vague sentence is not a real summary. |
| **Review the assertions themselves** | Fix assertions that always pass (too easy) or always fail (too hard or checking wrong thing). |
| **Use scripts for mechanical checks** | Valid JSON, file existence, row counts — use code, not LLM judgment. |
| **Use LLM for qualitative checks** | Writing style, organization, completeness — LLM grading is appropriate here. |

### Blind Comparison

For comparing two skill versions, try blind comparison: present both outputs to an LLM judge without revealing which came from which version. The judge scores holistic qualities — organization, formatting, usability, polish — on its own rubric.

This complements assertion grading: two outputs might both pass all assertions but differ significantly in overall quality.

---

## Benchmark Interpretation

### Aggregating Results

After grading all runs, compute summary statistics:

```json
{
  "run_summary": {
    "with_skill": {
      "pass_rate": { "mean": 0.83, "stddev": 0.06 },
      "time_seconds": { "mean": 45.0, "stddev": 12.0 },
      "tokens": { "mean": 3800, "stddev": 400 }
    },
    "without_skill": {
      "pass_rate": { "mean": 0.33, "stddev": 0.10 },
      "time_seconds": { "mean": 32.0, "stddev": 8.0 },
      "tokens": { "mean": 2100, "stddev": 300 }
    },
    "delta": {
      "pass_rate": 0.50,
      "time_seconds": 13.0,
      "tokens": 1700
    }
  }
}
```

### Reading the Delta

| Delta | Interpretation |
|-------|---------------|
| **Pass rate +50%, time +13s** | Skill is worth it — big quality gain for modest cost |
| **Pass rate +2%, tokens +2x** | Skill is not worth it — marginal gain for high cost |
| **Pass rate same, time +20s** | Skill adds overhead without benefit — investigate why |
| **Pass rate -10%** | Skill is making things worse — something is wrong |

### Pattern Analysis

Aggregate statistics hide important patterns. After computing benchmarks:

1. **Remove assertions that always pass in both configurations** — These do not tell you anything useful. The model handles them fine without the skill.
2. **Investigate assertions that always fail in both configurations** — Either the assertion is broken, the test case is too hard, or the assertion checks for the wrong thing.
3. **Study assertions that pass with skill but fail without** — This is where the skill adds value. Understand *why* — which instructions made the difference?
4. **Tighten instructions when results are inconsistent** — High stddev means the skill's instructions are ambiguous. Add examples or more specific guidance.
5. **Check time and token outliers** — If one eval takes 3x longer, read its execution transcript to find the bottleneck.

---

## Iteration Based on Results

### Three Signal Sources

| Source | What It Reveals | How to Use |
|--------|----------------|------------|
| **Failed assertions** | Specific gaps — missing step, unclear instruction | Fix the specific gap |
| **Human feedback** | Broader quality issues — wrong approach, poor structure | Restructure the skill |
| **Execution transcripts** | Why things went wrong — ignored instructions, wasted steps | Clarify or remove ambiguous instructions |

### The Improvement Prompt

Give all three signals plus the current `SKILL.md` to an LLM and ask it to propose changes. Include these guidelines:

1. **Generalize from feedback** — The skill will be used across many prompts, not just test cases. Fix underlying issues, not narrow patches.
2. **Keep the skill lean** — Fewer, better instructions often outperform exhaustive rules. Remove unnecessary validation or intermediate outputs.
3. **Explain the why** — Reasoning-based instructions ("Do X because Y tends to cause Z") work better than rigid directives.
4. **Bundle repeated work** — If every test run independently wrote a similar helper script, bundle it into `scripts/`.

---

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
9. Stop when: pass rate >= target, feedback is empty, no meaningful improvement between iterations
```

### Iteration Directory Naming

```
workspace/
├── iteration-1/    # First full run
├── iteration-2/    # After first improvement
├── iteration-3/    # After second improvement
└── benchmark.json  # Latest aggregated results
```

### When to Stop

| Condition | Action |
|-----------|--------|
| Overall pass rate >= 0.8 | Ship it |
| No improvement after 3 iterations | Redesign the skill |
| Feedback is consistently empty | Ship it |
| Delta is negative (skill makes things worse) | Re-examine the skill's core approach |

---

## References

- [04-tdd-workflow.md](04-tdd-workflow.md) — RED-GREEN-REFACTOR methodology
- [05-skill-quality-matrix.md](05-skill-quality-matrix.md) — 5-dimension scoring rubric
- [07-iterative-refinement.md](07-iterative-refinement.md) — Iteration loop with worked examples
- [09-script-authoring.md](09-script-authoring.md) — Writing scripts for eval automation
- [11-description-optimization.md](11-description-optimization.md) — Description-specific testing
- `templates/evals.json` — Eval template schema
- `templates/grading-rubric.json` — Grading rubric template
- Agent Skills spec — https://agentskills.io/evaluating-skills
