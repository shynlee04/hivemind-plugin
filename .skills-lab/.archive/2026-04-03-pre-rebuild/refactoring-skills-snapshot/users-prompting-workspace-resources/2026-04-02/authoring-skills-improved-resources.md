# TAB 1 Skill-authoring

- strict phases and granular steps → only one pass the next can be proceed

# TAB 2 skill-specs

> **Documentation Index**
> 
> 
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.
> 

# Specification

> The complete format specification for Agent Skills.
> 

## Directory structure

A skill is a directory containing, at minimum, a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

## `SKILL.md` format

The `SKILL.md` file must contain YAML frontmatter followed by Markdown content.

### Frontmatter

| Field | Required | Constraints |
| --- | --- | --- |
| `name` | Yes | Max 64 characters. Lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen. |
| `description` | Yes | Max 1024 characters. Non-empty. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to a bundled license file. |
| `compatibility` | No | Max 500 characters. Indicates environment requirements (intended product, system packages, network access, etc.). |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools the skill may use. (Experimental) |

<Card>
**Minimal example:**

```markdown
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

**Example with optional fields:**

```markdown
---
name: pdf-processing
description: Extract PDF text, fill forms, merge files. Use when handling PDFs.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

</Card>

### `name` field

The required `name` field:

- Must be 1-64 characters
- May only contain unicode lowercase alphanumeric characters (`a-z`) and hyphens ()
- Must not start or end with a hyphen ()
- Must not contain consecutive hyphens (`-`)
- Must match the parent directory name

<Card>
**Valid examples:**

```yaml
name: pdf-processing
```

```yaml
name: data-analysis
```

```yaml
name: code-review
```

**Invalid examples:**

```yaml
name: PDF-Processing  # uppercase not allowed
```

```yaml
name: -pdf  # cannot start with hyphen
```

```yaml
name: pdf--processing  # consecutive hyphens not allowed
```

</Card>

### `description` field

The required `description` field:

- Must be 1-1024 characters
- Should describe both what the skill does and when to use it
- Should include specific keywords that help agents identify relevant tasks

<Card>
**Good example:**

```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor example:**

```yaml
description: Helps with PDFs.
```

</Card>

### `license` field

The optional `license` field:

- Specifies the license applied to the skill
- We recommend keeping it short (either the name of a license or the name of a bundled license file)

<Card>
**Example:**

```yaml
license: Proprietary. LICENSE.txt has complete terms
```

</Card>

### `compatibility` field

The optional `compatibility` field:

- Must be 1-500 characters if provided
- Should only be included if your skill has specific environment requirements
- Can indicate intended product, required system packages, network access needs, etc.

<Card>
**Examples:**

```yaml
compatibility: Designed for Claude Code (or similar products)
```

```yaml
compatibility: Requires git, docker, jq, and access to the internet
```

```yaml
compatibility: Requires Python 3.14+ and uv
```

</Card>

<Note>
Most skills do not need the `compatibility` field.
</Note>

### `metadata` field

The optional `metadata` field:

- A map from string keys to string values
- Clients can use this to store additional properties not defined by the Agent Skills spec
- We recommend making your key names reasonably unique to avoid accidental conflicts

<Card>
**Example:**

```yaml
metadata:
  author: example-org
  version: "1.0"
```

</Card>

### `allowed-tools` field

The optional `allowed-tools` field:

- A space-delimited list of tools that are pre-approved to run
- Experimental. Support for this field may vary between agent implementations

<Card>
**Example:**

```yaml
allowed-tools: Bash(git:*) Bash(jq:*) Read
```

</Card>

### Body content

The Markdown body after the frontmatter contains the skill instructions. There are no format restrictions. Write whatever helps agents perform the task effectively.

Recommended sections:

- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases

Note that the agent will load this entire file once it's decided to activate a skill. Consider splitting longer `SKILL.md` content into referenced files.

## Optional directories

### `scripts/`

Contains executable code that agents can run. Scripts should:

- Be self-contained or clearly document dependencies
- Include helpful error messages
- Handle edge cases gracefully

Supported languages depend on the agent implementation. Common options include Python, Bash, and JavaScript.

### `references/`

Contains additional documentation that agents can read when needed:

- `REFERENCE.md` - Detailed technical reference
- `FORMS.md` - Form templates or structured data formats
- Domain-specific files (`finance.md`, `legal.md`, etc.)

Keep individual [reference files](https://www.notion.so/SKILLS-Authoring-Meta-Builder-332926f31a4d802cb897f188eca034f6?pvs=21) focused. Agents load these on demand, so smaller files mean less use of context.

### `assets/`

Contains static resources:

- Templates (document templates, configuration templates)
- Images (diagrams, examples)
- Data files (lookup tables, schemas)

## Progressive disclosure

Skills should be structured for efficient use of context:

1. **Metadata** (\~100 tokens): The `name` and `description` fields are loaded at startup for all skills
2. **Instructions** (\< 5000 tokens recommended): The full `SKILL.md` body is loaded when the skill is activated
3. **Resources** (as needed): Files (e.g. those in `scripts/`, `references/`, or `assets/`) are loaded only when required

Keep your main `SKILL.md` under 500 lines. Move detailed reference material to separate files.

## File references

When referencing other files in your skill, use relative paths from the skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the extraction script:
scripts/extract.py
```

Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains.

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate your skills:

```bash
skills-ref validate ./my-skill
```

This checks that your `SKILL.md` frontmatter is valid and follows all naming conventions.

Built with [Mintlify](https://mintlify.com/).

# TAB 3 using scripts in skills

> **Documentation Index**
> 
> 
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.
> 

# Using scripts in skills

> How to run commands and bundle executable scripts in your skills.
> 

Skills can instruct agents to run shell commands and bundle reusable scripts in a `scripts/` directory. This guide covers one-off commands, self-contained scripts with their own dependencies, and how to design script interfaces for agentic use.

## One-off commands

When an existing package already does what you need, you can reference it directly in your `SKILL.md` instructions without a `scripts/` directory. Many ecosystems provide tools that auto-resolve dependencies at runtime.

<Tabs sync={false}>
<Tab title="uvx">
[uvx](https://docs.astral.sh/uv/guides/tools/) runs Python packages in isolated environments with aggressive caching. It ships with [uv](https://docs.astral.sh/uv/).

```
```bash  theme={null}
uvx ruff@0.8.0 check .
uvx black@24.10.0 .
```

* Not bundled with Python — requires a separate install.
* Fast. Caches aggressively so repeat runs are near-instant.
```

</Tab>

<Tab title="pipx">
[pipx](https://pipx.pypa.io/) runs Python packages in isolated environments. Available via OS package managers (`apt install pipx`, `brew install pipx`).

```
```bash  theme={null}
pipx run 'black==24.10.0' .
pipx run 'ruff==0.8.0' check .
```

* Not bundled with Python — requires a separate install.
* A mature alternative to `uvx`. While `uvx` has become the standard recommendation, `pipx` remains a reliable option with broader OS package manager availability.
```

</Tab>

<Tab title="npx">
[npx](https://docs.npmjs.com/cli/commands/npx) runs npm packages, downloading them on demand. It ships with npm (which ships with Node.js).

```
```bash  theme={null}
npx eslint@9 --fix .
npx create-vite@6 my-app
```

* Bundled with Node.js — no extra install needed.
* Downloads the package, runs it, and caches it for future use.
* Pin versions with `npx package@version` for reproducibility.
```

</Tab>

<Tab title="bunx">
[bunx](https://bun.sh/docs/cli/bunx) is Bun's equivalent of `npx`. It ships with [Bun](https://bun.sh/).

```
```bash  theme={null}
bunx eslint@9 --fix .
bunx create-vite@6 my-app
```

* Drop-in replacement for `npx` in Bun-based environments.
* Only appropriate when the user's environment has Bun rather than Node.js.
```

</Tab>

<Tab title="deno run">
[deno run](https://docs.deno.com/runtime/reference/cli/run/) runs scripts directly from URLs or specifiers. It ships with [Deno](https://deno.com/).

```
```bash  theme={null}
deno run npm:create-vite@6 my-app
deno run --allow-read npm:eslint@9 -- --fix .
```

* Permission flags (`--allow-read`, etc.) are required for filesystem/network access.
* Use `--` to separate Deno flags from the tool's own flags.
```

</Tab>

<Tab title="go run">
[go run](https://pkg.go.dev/cmd/go#hdr-Compile_and_run_Go_program) compiles and runs Go packages directly. It is built into the `go` command.

```
```bash  theme={null}
go run golang.org/x/tools/cmd/goimports@v0.28.0 .
go run github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.0 run
```

* Built into Go — no extra tooling needed.
* Pin versions or use `@latest` to make the command explicit.
```

</Tab>
</Tabs>

**Tips for one-off commands in skills:**

- **Pin versions** (e.g., `npx eslint@9.0.0`) so the command behaves the same over time.
- **State prerequisites** in your `SKILL.md` (e.g., "Requires Node.js 18+") rather than assuming the agent's environment has them. For runtime-level requirements, use the [`compatibility` frontmatter field](https://www.notion.so/specification#compatibility-field).
- **Move complex commands into scripts.** A one-off command works well when you're invoking a tool with a few flags. When a command grows complex enough that it's hard to get right on the first try, a tested script in `scripts/` is more reliable.

## Referencing scripts from `SKILL.md`

Use **relative paths from the skill directory root** to reference bundled files. The agent resolves these paths automatically — no absolute paths needed.

List available scripts in your `SKILL.md` so the agent knows they exist:

```markdown
## Available scripts

- **`scripts/validate.sh`** — Validates configuration files
- **`scripts/process.py`** — Processes input data
```

Then instruct the agent to run them:

```markdown
## Workflow

1. Run the validation script:
   ```bash
   bash scripts/validate.sh "$INPUT_FILE"
   ```

2. Process the results:
   ```bash
   python3 scripts/process.py --input results.json
   ```
```

<Note>
The same relative-path convention works in support files like `references/*.md` — script execution paths (in code blocks) are relative to the **skill directory root**, because the agent runs commands from there.
</Note>

## Self-contained scripts

When you need reusable logic, bundle a script in `scripts/` that declares its own dependencies inline. The agent can run the script with a single command — no separate manifest file or install step required.

Several languages support inline dependency declarations:

<Tabs sync={false}>
<Tab title="Python">
[PEP 723](https://peps.python.org/pep-0723/) defines a standard format for inline script metadata. Declare dependencies in a TOML block inside `# ///` markers:

```
```python scripts/extract.py theme={null}
# /// script
# dependencies = [
#   "beautifulsoup4",
# ]
# ///

from bs4 import BeautifulSoup

html = '<html><body><h1>Welcome</h1><p class="info">This is a test.</p></body></html>'
print(BeautifulSoup(html, "html.parser").select_one("p.info").get_text())
```

Run with [uv](<https://docs.astral.sh/uv/>) (recommended):

```bash  theme={null}
uv run scripts/extract.py
```

`uv run` creates an isolated environment, installs the declared dependencies, and runs the script. [pipx](<https://pipx.pypa.io/>) (`pipx run scripts/extract.py`) also supports PEP 723.

* Pin versions with [PEP 508](<https://peps.python.org/pep-0508/>) specifiers: `"beautifulsoup4>=4.12,<5"`.
* Use `requires-python` to constrain the Python version.
* Use `uv lock --script` to create a lockfile for full reproducibility.
```

</Tab>

<Tab title="Deno">
Deno's `npm:` and `jsr:` import specifiers make every script self-contained by default:

```
```typescript scripts/extract.ts theme={null}
#!/usr/bin/env -S deno run

import * as cheerio from "npm:cheerio@1.0.0";

const html = `<html><body><h1>Welcome</h1><p class="info">This is a test.</p></body></html>`;
const $ = cheerio.load(html);
console.log($("p.info").text());
```

```bash  theme={null}
deno run scripts/extract.ts
```

* Use `npm:` for npm packages, `jsr:` for Deno-native packages.
* Version specifiers follow semver: `@1.0.0` (exact), `@^1.0.0` (compatible).
* Dependencies are cached globally. Use `--reload` to force re-fetch.
* Packages with native addons (node-gyp) may not work — packages that ship pre-built binaries work best.
```

</Tab>

<Tab title="Bun">
Bun auto-installs missing packages at runtime when no `node_modules` directory is found. Pin versions directly in the import path:

```
```typescript scripts/extract.ts theme={null}
#!/usr/bin/env bun

import * as cheerio from "cheerio@1.0.0";

const html = `<html><body><h1>Welcome</h1><p class="info">This is a test.</p></body></html>`;
const $ = cheerio.load(html);
console.log($("p.info").text());
```

```bash  theme={null}
bun run scripts/extract.ts
```

* No `package.json` or `node_modules` needed. TypeScript works natively.
* Packages are cached globally. First run downloads; subsequent runs are near-instant.
* If a `node_modules` directory exists anywhere up the directory tree, auto-install is disabled and Bun falls back to standard Node.js resolution.
```

</Tab>

<Tab title="Ruby">
Bundler ships with Ruby since 2.6. Use `bundler/inline` to declare gems directly in the script:

```
```ruby scripts/extract.rb theme={null}
require 'bundler/inline'

gemfile do
  source '<https://rubygems.org>'
  gem 'nokogiri'
end

html = '<html><body><h1>Welcome</h1><p class="info">This is a test.</p></body></html>'
doc = Nokogiri::HTML(html)
puts doc.at_css('p.info').text
```

```bash  theme={null}
ruby scripts/extract.rb
```

* Pin versions explicitly (`gem 'nokogiri', '~> 1.16'`) — there is no lockfile.
* An existing `Gemfile` or `BUNDLE_GEMFILE` env var in the working directory can interfere.
```

</Tab>
</Tabs>

## Designing scripts for agentic use

When an agent runs your script, it reads stdout and stderr to decide what to do next. A few design choices make scripts dramatically easier for agents to use.

### Avoid interactive prompts

This is a hard requirement of the agent execution environment. Agents operate in non-interactive shells — they cannot respond to TTY prompts, password dialogs, or confirmation menus. A script that blocks on interactive input will hang indefinitely.

Accept all input via command-line flags, environment variables, or stdin:

```
# Bad: hangs waiting for input
$ python scripts/deploy.py
Target environment: _

# Good: clear error with guidance
$ python scripts/deploy.py
Error: --env is required. Options: development, staging, production.
Usage: python scripts/deploy.py --env staging --tag v1.2.3
```

### Document usage with `-help`

- `-help` output is the primary way an agent learns your script's interface. Include a brief description, available flags, and usage examples:

```
Usage: scripts/process.py [OPTIONS] INPUT_FILE

Process input data and produce a summary report.

Options:
  --format FORMAT    Output format: json, csv, table (default: json)
  --output FILE      Write output to FILE instead of stdout
  --verbose          Print progress to stderr

Examples:
  scripts/process.py data.csv
  scripts/process.py --format csv --output report.csv data.csv
```

Keep it concise — the output enters the agent's context window alongside everything else it's working with.

### Write helpful error messages

When an agent gets an error, the message directly shapes its next attempt. An opaque "Error: invalid input" wastes a turn. Instead, say what went wrong, what was expected, and what to try:

```
Error: --format must be one of: json, csv, table.
       Received: "xml"
```

### Use structured output

Prefer structured formats — JSON, CSV, TSV — over free-form text. Structured formats can be consumed by both the agent and standard tools (`jq`, `cut`, `awk`), making your script composable in pipelines.

```
# Whitespace-aligned — hard to parse programmatically
NAME          STATUS    CREATED
my-service    running   2025-01-15

# Delimited — unambiguous field boundaries
{"name": "my-service", "status": "running", "created": "2025-01-15"}
```

**Separate data from diagnostics:** send structured data to stdout and progress messages, warnings, and other diagnostics to stderr. This lets the agent capture clean, parseable output while still having access to diagnostic information when needed.

### Further considerations

- **Idempotency.** Agents may retry commands. "Create if not exists" is safer than "create and fail on duplicate."
- **Input constraints.** Reject ambiguous input with a clear error rather than guessing. Use enums and closed sets where possible.
- **Dry-run support.** For destructive or stateful operations, a `-dry-run` flag lets the agent preview what will happen.
- **Meaningful exit codes.** Use distinct exit codes for different failure types (not found, invalid arguments, auth failure) and document them in your `-help` output so the agent knows what each code means.
- **Safe defaults.** Consider whether destructive operations should require explicit confirmation flags (`-confirm`, `-force`) or other safeguards appropriate to the risk level.
- **Predictable output size.** Many agent harnesses automatically truncate tool output beyond a threshold (e.g., 10-30K characters), potentially losing critical information. If your script might produce large output, default to a summary or a reasonable limit, and support flags like `-offset` so the agent can request more information when needed. Alternatively, if output is large and not amenable to pagination, require agents to pass an `-output` flag that specifies either an output file or  to explicitly opt in to stdout.

Built with [Mintlify](https://mintlify.com/).

# TAB 4 Evaluating skills

> **Documentation Index**
> 
> 
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.
> 

# Evaluating skill output quality

> How to test whether your skill produces good outputs using eval-driven iteration.
> 

You wrote a skill, tried it on a prompt, and it seemed to work. But does it work reliably — across varied prompts, in edge cases, better than no skill at all? Running structured evaluations (evals) answers these questions and gives you a feedback loop for improving the skill systematically.

## Designing test cases

A test case has three parts:

- **Prompt**: a realistic user message — the kind of thing someone would actually type.
- **Expected output**: a human-readable description of what success looks like.
- **Input files** (optional): files the skill needs to work with.

Store test cases in `evals/evals.json` inside your skill directory:

```json
{
  "skill_name": "csv-analyzer",
  "evals": [
    {
      "id": 1,
      "prompt": "I have a CSV of monthly sales data in data/sales_2025.csv. Can you find the top 3 months by revenue and make a bar chart?",
      "expected_output": "A bar chart image showing the top 3 months by revenue, with labeled axes and values.",
      "files": ["evals/files/sales_2025.csv"]
    },
    {
      "id": 2,
      "prompt": "there's a csv in my downloads called customers.csv, some rows have missing emails — can you clean it up and tell me how many were missing?",
      "expected_output": "A cleaned CSV with missing emails handled, plus a count of how many were missing.",
      "files": ["evals/files/customers.csv"]
    }
  ]
}
```

**Tips for writing good test prompts:**

- **Start with 2-3 test cases.** Don't over-invest before you've seen your first round of results. You can expand the set later.
- **Vary the prompts.** Use different phrasings, levels of detail, and formality. Some prompts should be casual ("hey can you clean up this csv"), others precise ("Parse the CSV at data/input.csv, drop rows where column B is null, and write the result to data/output.csv").
- **Cover edge cases.** Include at least one prompt that tests a boundary condition — a malformed input, an unusual request, or a case where the skill's instructions might be ambiguous.
- **Use realistic context.** Real users mention file paths, column names, and personal context. Prompts like "process this data" are too vague to test anything useful.

Don't worry about defining specific pass/fail checks yet — just the prompts and expected outputs. You'll add detailed checks (called assertions) after you see what the first run produces.

## Running evals

The core pattern is to run each test case twice: once **with the skill** and once **without it** (or with a previous version). This gives you a baseline to compare against.

### Workspace structure

Organize eval results in a workspace directory alongside your skill directory. Each pass through the full eval loop gets its own `iteration-N/` directory. Within that, each test case gets an eval directory with `with_skill/` and `without_skill/` subdirectories:

```
csv-analyzer/
├── SKILL.md
└── evals/
    └── evals.json
csv-analyzer-workspace/
└── iteration-1/
    ├── eval-top-months-chart/
    │   ├── with_skill/
    │   │   ├── outputs/       # Files produced by the run
    │   │   ├── timing.json    # Tokens and duration
    │   │   └── grading.json   # Assertion results
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    ├── eval-clean-missing-emails/
    │   ├── with_skill/
    │   │   ├── outputs/
    │   │   ├── timing.json
    │   │   └── grading.json
    │   └── without_skill/
    │       ├── outputs/
    │       ├── timing.json
    │       └── grading.json
    └── benchmark.json         # Aggregated statistics
```

The main file you author by hand is `evals/evals.json`. The other JSON files (`grading.json`, `timing.json`, `benchmark.json`) are produced during the eval process — by the agent, by scripts, or by you.

### Spawning runs

Each eval run should start with a clean context — no leftover state from previous runs or from the skill development process. This ensures the agent follows only what the `SKILL.md` tells it. In environments that support subagents (Claude Code, for example), this isolation comes naturally: each child task starts fresh. Without subagents, use a separate session for each run.

For each run, provide:

- The skill path (or no skill for the baseline)
- The test prompt
- Any input files
- The output directory

Here's an example of the instructions you'd give the agent for a single with-skill run:

```
Execute this task:
- Skill path: /path/to/csv-analyzer
- Task: I have a CSV of monthly sales data in data/sales_2025.csv.
  Can you find the top 3 months by revenue and make a bar chart?
- Input files: evals/files/sales_2025.csv
- Save outputs to: csv-analyzer-workspace/iteration-1/eval-top-months-chart/with_skill/outputs/
```

For the baseline, use the same prompt but without the skill path, saving to `without_skill/outputs/`.

When improving an existing skill, use the previous version as your baseline. Snapshot it before editing (`cp -r <skill-path> <workspace>/skill-snapshot/`), point the baseline run at the snapshot, and save to `old_skill/outputs/` instead of `without_skill/`.

### Capturing timing data

Timing data lets you compare how much time and tokens the skill costs relative to the baseline — a skill that dramatically improves output quality but triples token usage is a different trade-off than one that's both better and cheaper. When each run completes, record the token count and duration:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332
}
```

<Tip>
In Claude Code, when a subagent task finishes, the [task completion notification](https://platform.claude.com/docs/en/agent-sdk/typescript#sdk-task-notification-message) includes `total_tokens` and `duration_ms`. Save these values immediately — they aren't persisted anywhere else.
</Tip>

## Writing assertions

Assertions are verifiable statements about what the output should contain or achieve. Add them after you see your first round of outputs — you often don't know what "good" looks like until the skill has run.

Good assertions:

- `"The output file is valid JSON"` — programmatically verifiable.
- `"The bar chart has labeled axes"` — specific and observable.
- `"The report includes at least 3 recommendations"` — countable.

Weak assertions:

- `"The output is good"` — too vague to grade.
- `"The output uses exactly the phrase 'Total Revenue: $X'"` — too brittle; correct output with different wording would fail.

Not everything needs an assertion. Some qualities — writing style, visual design, whether the output "feels right" — are hard to decompose into pass/fail checks. These are better caught during [human review](https://www.notion.so/SKILLS-Authoring-Meta-Builder-332926f31a4d802cb897f188eca034f6?pvs=21). Reserve assertions for things that can be checked objectively.

Add assertions to each test case in `evals/evals.json`:

```json
{
  "skill_name": "csv-analyzer",
  "evals": [
    {
      "id": 1,
      "prompt": "I have a CSV of monthly sales data in data/sales_2025.csv. Can you find the top 3 months by revenue and make a bar chart?",
      "expected_output": "A bar chart image showing the top 3 months by revenue, with labeled axes and values.",
      "files": ["evals/files/sales_2025.csv"],
      "assertions": [
        "The output includes a bar chart image file",
        "The chart shows exactly 3 months",
        "Both axes are labeled",
        "The chart title or caption mentions revenue"
      ]
    }
  ]
}
```

## Grading outputs

Grading means evaluating each assertion against the actual outputs and recording **PASS** or **FAIL** with specific evidence. The evidence should quote or reference the output, not just state an opinion.

The simplest approach is to give the outputs and assertions to an LLM and ask it to evaluate each one. For assertions that can be checked by code (valid JSON, correct row count, file exists with expected dimensions), use a verification script — scripts are more reliable than LLM judgment for mechanical checks and reusable across iterations.

```json
{
  "assertion_results": [
    {
      "text": "The output includes a bar chart image file",
      "passed": true,
      "evidence": "Found chart.png (45KB) in outputs directory"
    },
    {
      "text": "The chart shows exactly 3 months",
      "passed": true,
      "evidence": "Chart displays bars for March, July, and November"
    },
    {
      "text": "Both axes are labeled",
      "passed": false,
      "evidence": "Y-axis is labeled 'Revenue ($)' but X-axis has no label"
    },
    {
      "text": "The chart title or caption mentions revenue",
      "passed": true,
      "evidence": "Chart title reads 'Top 3 Months by Revenue'"
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 1,
    "total": 4,
    "pass_rate": 0.75
  }
}
```

### Grading principles

- **Require concrete evidence for a PASS.** Don't give the benefit of the doubt. If an assertion says "includes a summary" and the output has a section titled "Summary" with one vague sentence, that's a FAIL — the label is there but the substance isn't.
- **Review the assertions themselves, not just the results.** While grading, notice when assertions are too easy (always pass regardless of skill quality), too hard (always fail even when the output is good), or unverifiable (can't be checked from the output alone). Fix these for the next iteration.

<Tip>
For comparing two skill versions, try **blind comparison**: present both outputs to an LLM judge without revealing which came from which version. The judge scores holistic qualities — organization, formatting, usability, polish — on its own rubric, free from bias about which version "should" be better. This complements assertion grading: two outputs might both pass all assertions but differ significantly in overall quality.
</Tip>

## Aggregating results

Once every run in the iteration is graded, compute summary statistics per configuration and save them to `benchmark.json` alongside the eval directories (e.g., `csv-analyzer-workspace/iteration-1/benchmark.json`):

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

The `delta` tells you what the skill costs (more time, more tokens) and what it buys (higher pass rate). A skill that adds 13 seconds but improves pass rate by 50 percentage points is probably worth it. A skill that doubles token usage for a 2-point improvement might not be.

<Note>
Standard deviation (`stddev`) is only meaningful with multiple runs per eval. In early iterations with just 2-3 test cases and single runs, focus on the raw pass counts and the delta — the statistical measures become useful as you expand the test set and run each eval multiple times.
</Note>

## Analyzing patterns

Aggregate statistics can hide important patterns. After computing the benchmarks:

- **Remove or replace assertions that always pass in both configurations.** These don't tell you anything useful — the model handles them fine without the skill. They inflate the with-skill pass rate without reflecting actual skill value.
- **Investigate assertions that always fail in both configurations.** Either the assertion is broken (asking for something the model can't do), the test case is too hard, or the assertion is checking for the wrong thing. Fix these before the next iteration.
- **Study assertions that pass with the skill but fail without.** This is where the skill is clearly adding value. Understand *why* — which instructions or scripts made the difference?
- **Tighten instructions when results are inconsistent across runs.** If the same eval passes sometimes and fails others (reflected as high `stddev` in the benchmark), the eval may be flaky (sensitive to model randomness), or the skill's instructions may be ambiguous enough that the model interprets them differently each time. Add examples or more specific guidance to reduce ambiguity.
- **Check time and token outliers.** If one eval takes 3x longer than the others, read its execution transcript (the full log of what the model did during the run) to find the bottleneck.

## Reviewing results with a human

Assertion grading and pattern analysis catch a lot, but they only check what you thought to write assertions for. A human reviewer brings a fresh perspective — catching issues you didn't anticipate, noticing when the output is technically correct but misses the point, or spotting problems that are hard to express as pass/fail checks. For each test case, review the actual outputs alongside the grades.

Record specific feedback for each test case and save it in the workspace (e.g., as a `feedback.json` alongside the eval directories):

```json
{
  "eval-top-months-chart": "The chart is missing axis labels and the months are in alphabetical order instead of chronological.",
  "eval-clean-missing-emails": ""
}
```

"The chart is missing axis labels" is actionable; "looks bad" is not. Empty feedback means the output looked fine — that test case passed your review. During the [iteration step](https://www.notion.so/SKILLS-Authoring-Meta-Builder-332926f31a4d802cb897f188eca034f6?pvs=21), focus your improvements on the test cases where you had specific complaints.

## Iterating on the skill

After grading and reviewing, you have three sources of signal:

- **Failed assertions** point to specific gaps — a missing step, an unclear instruction, or a case the skill doesn't handle.
- **Human feedback** points to broader quality issues — the approach was wrong, the output was poorly structured, or the skill produced a technically correct but unhelpful result.
- **Execution transcripts** reveal *why* things went wrong. If the agent ignored an instruction, the instruction may be ambiguous. If the agent spent time on unproductive steps, those instructions may need to be simplified or removed.

The most effective way to turn these signals into skill improvements is to give all three — along with the current `SKILL.md` — to an LLM and ask it to propose changes. The LLM can synthesize patterns across failed assertions, reviewer complaints, and transcript behavior that would be tedious to connect manually. When prompting the LLM, include these guidelines:

- **Generalize from feedback.** The skill will be used across many different prompts, not just the test cases. Fixes should address underlying issues broadly rather than adding narrow patches for specific examples.
- **Keep the skill lean.** Fewer, better instructions often outperform exhaustive rules. If transcripts show wasted work (unnecessary validation, unneeded intermediate outputs), remove those instructions. If pass rates plateau despite adding more rules, the skill may be over-constrained — try removing instructions and see if results hold or improve.
- **Explain the why.** Reasoning-based instructions ("Do X because Y tends to cause Z") work better than rigid directives ("ALWAYS do X, NEVER do Y"). Models follow instructions more reliably when they understand the purpose.
- **Bundle repeated work.** If every test run independently wrote a similar helper script (a chart builder, a data parser), that's a signal to bundle the script into the skill's `scripts/` directory. See [Using scripts](https://www.notion.so/skill-creation/using-scripts) for how to do this.

### The loop

1. Give the eval signals and current `SKILL.md` to an LLM and ask it to propose improvements.
2. Review and apply the changes.
3. Rerun all test cases in a new `iteration-<N+1>/` directory.
4. Grade and aggregate the new results.
5. Review with a human. Repeat.

Stop when you're satisfied with the results, feedback is consistently empty, or you're no longer seeing meaningful improvement between iterations.

<Tip>
The [`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator) Skill automates much of this workflow — running evals, grading assertions, aggregating benchmarks, and presenting results for human review.
</Tip>

Built with [Mintlify](https://mintlify.com/).

# TAB 5 Optimizing description

> **Documentation Index**
> 
> 
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.
> 

# Optimizing skill descriptions

> How to improve your skill's description so it triggers reliably on relevant prompts.
> 

A skill only helps if it gets activated. The `description` field in your `SKILL.md` frontmatter is the primary mechanism agents use to decide whether to load a skill for a given task. An under-specified description means the skill won't trigger when it should; an over-broad description means it triggers when it shouldn't.

This guide covers how to systematically test and improve your skill's description for triggering accuracy.

## How skill triggering works

Agents use [progressive disclosure](https://www.notion.so/what-are-skills#how-skills-work) to manage context. At startup, they load only the `name` and `description` of each available skill — just enough to decide when a skill might be relevant. When a user's task matches a description, the agent reads the full `SKILL.md` into context and follows its instructions.

This means the description carries the entire burden of triggering. If the description doesn't convey when the skill is useful, the agent won't know to reach for it.

One important nuance: agents typically only consult skills for tasks that require knowledge or capabilities beyond what they can handle alone. A simple, one-step request like "read this PDF" may not trigger a PDF skill even if the description matches perfectly, because the agent can handle it with basic tools. Tasks that involve specialized knowledge — an unfamiliar API, a domain-specific workflow, or an uncommon format — are where a well-written description can make the difference.

## Writing effective descriptions

Before testing, it helps to know what a good description looks like. A few principles:

- **Use imperative phrasing.** Frame the description as an instruction to the agent: "Use this skill when..." rather than "This skill does..." The agent is deciding whether to act, so tell it when to act.
- **Focus on user intent, not implementation.** Describe what the user is trying to achieve, not the skill's internal mechanics. The agent matches against what the user asked for.
- **Err on the side of being pushy.** Explicitly list contexts where the skill applies, including cases where the user doesn't name the domain directly: "even if they don't explicitly mention 'CSV' or 'analysis.'"
- **Keep it concise.** A few sentences to a short paragraph is usually right — long enough to cover the skill's scope, short enough that it doesn't bloat the agent's context across many skills. The [specification](https://www.notion.so/specification#description-field) enforces a hard limit of 1024 characters.

## Designing trigger eval queries

To test triggering, you need a set of eval queries — realistic user prompts labeled with whether they should or shouldn't trigger your skill.

```json
[
  { "query": "I've got a spreadsheet in ~/data/q4_results.xlsx with revenue in col C and expenses in col D — can you add a profit margin column and highlight anything under 10%?", "should_trigger": true },
  { "query": "whats the quickest way to convert this json file to yaml", "should_trigger": false }
]
```

Aim for about 20 queries: 8-10 that should trigger and 8-10 that shouldn't.

### Should-trigger queries

These test whether the description captures the skill's scope. Vary them along several axes:

- **Phrasing**: some formal, some casual, some with typos or abbreviations.
- **Explicitness**: some name the skill's domain directly ("analyze this CSV"), others describe the need without naming it ("my boss wants a chart from this data file").
- **Detail**: mix terse prompts with context-heavy ones — a short "analyze my sales CSV and make a chart" alongside a longer message with file paths, column names, and backstory.
- **Complexity**: vary the number of steps and decision points. Include single-step tasks alongside multi-step workflows to test whether the agent can discern the skill is relevant when the task it addresses is buried in a larger chain.

The most useful should-trigger queries are ones where the skill would help but the connection isn't obvious from the query alone. These are the cases where description wording makes the difference — if the query already asks for exactly what the skill does, any reasonable description would trigger.

### Should-not-trigger queries

The most valuable negative test cases are **near-misses** — queries that share keywords or concepts with your skill but actually need something different. These test whether the description is precise, not just broad.

For a CSV analysis skill, weak negative examples would be:

- `"Write a fibonacci function"` — obviously irrelevant, tests nothing.
- `"What's the weather today?"` — no keyword overlap, too easy.

Strong negative examples:

- `"I need to update the formulas in my Excel budget spreadsheet"` — shares "spreadsheet" and "data" concepts, but needs Excel editing, not CSV analysis.
- `"can you write a python script that reads a csv and uploads each row to our postgres database"` — involves CSV, but the task is database ETL, not analysis.

### Tips for realism

Real user prompts contain context that generic test queries lack. Include:

- File paths (`~/Downloads/report_final_v2.xlsx`)
- Personal context (`"my manager asked me to..."`)
- Specific details (column names, company names, data values)
- Casual language, abbreviations, and occasional typos

## Testing whether a description triggers

The basic approach: run each query through your agent with the skill installed and observe whether the agent invokes it. Make sure the skill is registered and discoverable by your agent — how this works varies by client (e.g., a skills directory, a configuration file, or a CLI flag).

Most agent clients provide some form of observability — execution logs, tool call histories, or verbose output — that lets you see which skills were consulted during a run. Check your client's documentation for details. The skill triggered if the agent loaded your skill's `SKILL.md`; it didn't trigger if the agent proceeded without consulting it.

A query "passes" if:

- `should_trigger` is `true` and the skill was invoked, or
- `should_trigger` is `false` and the skill was not invoked.

### Running multiple times

Model behavior is nondeterministic — the same query might trigger the skill on one run but not the next. Run each query multiple times (3 is a reasonable starting point) and compute a **trigger rate**: the fraction of runs where the skill was invoked.

A should-trigger query passes if its trigger rate is above a threshold (0.5 is a reasonable default). A should-not-trigger query passes if its trigger rate is below that threshold.

With 20 queries at 3 runs each, that's 60 invocations. You'll want to script this. Here's the general structure — replace the `claude` invocation and detection logic in `check_triggered` with whatever your agent client provides:

```bash
#!/bin/bash
QUERIES_FILE="${1:?Usage: $0 <queries.json>}"
SKILL_NAME="my-skill"
RUNS=3

# This example uses Claude Code's JSON output to check for Skill tool calls.
# Replace this function with detection logic for your agent client.
# Should return 0 (success) if the skill was invoked, 1 otherwise.
check_triggered() {
  local query="$1"
  claude -p "$query" --output-format json 2>/dev/null \\
    | jq -e --arg skill "$SKILL_NAME" \\
      'any(.messages[].content[]; .type == "tool_use" and .name == "Skill" and .input.skill == $skill)' \\
      > /dev/null 2>&1
}

count=$(jq length "$QUERIES_FILE")
for i in $(seq 0 $((count - 1))); do
  query=$(jq -r ".[$i].query" "$QUERIES_FILE")
  should_trigger=$(jq -r ".[$i].should_trigger" "$QUERIES_FILE")
  triggers=0

  for run in $(seq 1 $RUNS); do
    check_triggered "$query" && triggers=$((triggers + 1))
  done

  jq -n \\
    --arg query "$query" \\
    --argjson should_trigger "$should_trigger" \\
    --argjson triggers "$triggers" \\
    --argjson runs "$RUNS" \\
    '{query: $query, should_trigger: $should_trigger, triggers: $triggers, runs: $runs, trigger_rate: ($triggers / $runs)}'
done | jq -s '.'
```

<Tip>
If your agent client supports it, you can stop a run early once the outcome is clear — the agent either consulted the skill or started working without it. This can significantly reduce the time and cost of running the full eval set.
</Tip>

## Avoiding overfitting with train/validation splits

If you optimize the description against all your queries, you risk overfitting — crafting a description that works for these specific phrasings but fails on new ones.

The solution is to split your query set:

- **Train set (\~60%)**: the queries you use to identify failures and guide improvements.
- **Validation set (\~40%)**: queries you set aside and only use to check whether improvements generalize.

Make sure both sets contain a proportional mix of should-trigger and should-not-trigger queries — don't accidentally put all the positives in one set. Shuffle randomly and keep the split fixed across iterations so you're comparing apples to apples.

If you're using a script like the one [above](https://www.notion.so/SKILLS-Authoring-Meta-Builder-332926f31a4d802cb897f188eca034f6?pvs=21), you can split your queries into two files — `train_queries.json` and `validation_queries.json` — and run the script against each one separately.

## The optimization loop

1. **Evaluate** the current description on both *train and validation sets*. The train results guide your changes; the validation results tell you whether those changes are generalizing.
2. **Identify failures** in the *train set*: which should-trigger queries didn't trigger? Which should-not-trigger queries did?
    - Only use train set failures to guide your changes — whether you're revising the description yourself or prompting an LLM, keep validation set results out of the process.
3. **Revise the description.** Focus on generalizing:
    - If should-trigger queries are failing, the description may be too narrow. Broaden the scope or add context about when the skill is useful.
    - If should-not-trigger queries are false-triggering, the description may be too broad. Add specificity about what the skill does *not* do, or clarify the boundary between this skill and adjacent capabilities.
    - Avoid adding specific keywords from failed queries — that's overfitting. Instead, find the general category or concept those queries represent and address that.
    - If you're stuck after several iterations, try a structurally different approach to the description rather than incremental tweaks. A different framing or sentence structure may break through where refinement can't.
    - Check that the description stays under the 1024-character limit — descriptions tend to grow during optimization.
4. **Repeat** steps 1-3 until all *train set* queries pass or you stop seeing meaningful improvement.
5. **Select the best iteration** by its validation pass rate — the fraction of queries in the *validation set* that passed. Note that the best description may not be the last one you produced; an earlier iteration might have a higher validation pass rate than later ones that overfit to the train set.

Five iterations is usually enough. If performance isn't improving, the issue may be with the queries (too easy, too hard, or poorly labeled) rather than the description.

<Tip>
The [`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator) Skill automates this loop end-to-end: it splits the eval set, evaluates trigger rates in parallel, proposes description improvements using Claude, and generates a live HTML report you can watch as it runs.
</Tip>

## Applying the result

Once you've selected the best description:

1. Update the `description` field in your `SKILL.md` frontmatter.
2. Verify the description is under the [1024-character limit](https://www.notion.so/specification#description-field).
3. Verify the description triggers as expected. Try a few prompts manually as a quick sanity check. For a more rigorous test, write 5-10 fresh queries (a mix of should-trigger and should-not-trigger) and run them through the eval script — since these queries were never part of the optimization process, they give you an honest check on whether the description generalizes.

Before and after:

```yaml
# Before
description: Process CSV files.

# After
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

The improved description is more specific about what the skill does (summary stats, derived columns, charts, cleaning) and broader about when it applies (CSV, TSV, Excel; even without explicit keywords).

## Next steps

Once your skill triggers reliably, you'll want to evaluate whether it produces good outputs. See [Evaluating skill output quality](https://www.notion.so/skill-creation/evaluating-skills) for how to set up test cases, grade results, and iterate.

# TAB 6 Adding Skill Support To Your Agent

> ## Documentation Index
> Fetch the complete documentation index at: https://agentskills.io/llms.txt
> Use this file to discover all available pages before exploring further.

# How to add skills support to your agent

> A guide for adding Agent Skills support to an AI agent or development tool.

This guide walks through how to add Agent Skills support to an AI agent or development tool. It covers the full lifecycle: discovering skills, telling the model about them, loading their content into context, and keeping that content effective over time.

The core integration is the same regardless of your agent's architecture. The implementation details vary based on two factors:

* **Where do skills live?** A locally-running agent can scan the user's filesystem for skill directories. A cloud-hosted or sandboxed agent will need an alternative discovery mechanism — an API, a remote registry, or bundled assets.
* **How does the model access skill content?** If the model has file-reading capabilities, it can read `SKILL.md` files directly. Otherwise, you'll provide a dedicated tool or inject skill content into the prompt programmatically.

The guide notes where these differences matter. You don't need to support every scenario — follow the path that fits your agent.

**Prerequisites**: Familiarity with the [Agent Skills specification](/specification), which defines the `SKILL.md` file format, frontmatter fields, and directory conventions.

## The core principle: progressive disclosure

Every skills-compatible agent follows the same three-tier loading strategy:

| Tier            | What's loaded               | When                                 | Token cost                  |
| --------------- | --------------------------- | ------------------------------------ | --------------------------- |
| 1. Catalog      | Name + description          | Session start                        | \~50-100 tokens per skill   |
| 2. Instructions | Full `SKILL.md` body        | When the skill is activated          | \<5000 tokens (recommended) |
| 3. Resources    | Scripts, references, assets | When the instructions reference them | Varies                      |

The model sees the catalog from the start, so it knows what skills are available. When it decides a skill is relevant, it loads the full instructions. If those instructions reference supporting files, the model loads them individually as needed.

This keeps the base context small while giving the model access to specialized knowledge on demand. An agent with 20 installed skills doesn't pay the token cost of 20 full instruction sets upfront — only the ones actually used in a given conversation.

## Step 1: Discover skills

At session startup, find all available skills and load their metadata.

### Where to scan

Which directories you scan depends on your agent's environment. Most locally-running agents scan at least two scopes:

* **Project-level** (relative to the working directory): Skills specific to a project or repository.
* **User-level** (relative to the home directory): Skills available across all projects for a given user.

Other scopes are possible too — for example, organization-wide skills deployed by an admin, or skills bundled with the agent itself. The right set of scopes depends on your agent's deployment model.

Within each scope, consider scanning both a **client-specific directory** and the **`.agents/skills/` convention**:

| Scope   | Path                               | Purpose                       |
| ------- | ---------------------------------- | ----------------------------- |
| Project | `<project>/.<your-client>/skills/` | Your client's native location |
| Project | `<project>/.agents/skills/`        | Cross-client interoperability |
| User    | `~/.<your-client>/skills/`         | Your client's native location |
| User    | `~/.agents/skills/`                | Cross-client interoperability |

The `.agents/skills/` paths have emerged as a widely-adopted convention for cross-client skill sharing. While the Agent Skills specification does not mandate where skill directories live (it only defines what goes inside them), scanning `.agents/skills/` means skills installed by other compliant clients are automatically visible to yours, and vice versa.

<Note>
  Some implementations also scan `.claude/skills/` (both project-level and user-level) for pragmatic compatibility, since many existing skills are installed there. Other additional locations include ancestor directories up to the git root (useful for monorepos), [XDG](https://specifications.freedesktop.org/basedir-spec/latest/) config directories, and user-configured paths.
</Note>

### What to scan for

Within each skills directory, look for **subdirectories containing a file named exactly `SKILL.md`**:

```
~/.agents/skills/
├── pdf-processing/
│   ├── SKILL.md          ← discovered
│   └── scripts/
│       └── extract.py
├── data-analysis/
│   └── SKILL.md          ← discovered
└── README.md             ← ignored (not a skill directory)
```

Practical scanning rules:

* Skip directories that won't contain skills, such as `.git/` and `node_modules/`
* Optionally respect `.gitignore` to avoid scanning build artifacts
* Set reasonable bounds (e.g., max depth of 4-6 levels, max 2000 directories) to prevent runaway scanning in large directory trees

### Handling name collisions

When two skills share the same `name`, apply a deterministic precedence rule.

The universal convention across existing implementations: **project-level skills override user-level skills.**

Within the same scope (e.g., two skills named `code-review` found under both `<project>/.agents/skills/` and `<project>/.<your-client>/skills/`), either first-found or last-found is acceptable — pick one and be consistent. Log a warning when a collision occurs so the user knows a skill was shadowed.

### Trust considerations

Project-level skills come from the repository being worked on, which may be untrusted (e.g., a freshly cloned open-source project). Consider gating project-level skill loading on a trust check — only load them if the user has marked the project folder as trusted. This prevents untrusted repositories from silently injecting instructions into the agent's context.

### Cloud-hosted and sandboxed agents

If your agent runs in a container or on a remote server, it won't have access to the user's local filesystem. Discovery needs to work differently depending on the skill scope:

* **Project-level skills** are often the easiest case. If the agent operates on a cloned repository (even inside a sandbox), project-level skills travel with the code and can be scanned from the repo's directory tree.
* **User-level and organization-level skills** don't exist in the sandbox. You'll need to provision them from an external source — for example, cloning a configuration repository, accepting skill URLs or packages through your agent's settings, or letting users upload skill directories through a web UI.
* **Built-in skills** can be packaged as static assets within the agent's deployment artifact, making them available in every session without external fetching.

Once skills are available to the agent, the rest of the lifecycle — parsing, disclosure, activation — works the same.

## Step 2: Parse `SKILL.md` files

For each discovered `SKILL.md`, extract the metadata and body content.

### Frontmatter extraction

A `SKILL.md` file has two parts: YAML frontmatter between `---` delimiters, and a markdown body after the closing delimiter. To parse:

1. Find the opening `---` at the start of the file and the closing `---` after it.
2. Parse the YAML block between them. Extract `name` and `description` (required), plus any optional fields.
3. Everything after the closing `---`, trimmed, is the skill's body content.

See the [specification](/specification) for the full set of frontmatter fields and their constraints.

### Handling malformed YAML

Skill files authored for other clients may contain technically invalid YAML that their parsers happen to accept. The most common issue is unquoted values containing colons:

```yaml  theme={null}
# Technically invalid YAML — the colon breaks parsing
description: Use this skill when: the user asks about PDFs
```

Consider a fallback that wraps such values in quotes or converts them to YAML block scalars before retrying. This improves cross-client compatibility at minimal cost.

### Lenient validation

Warn on issues but still load the skill when possible:

* Name doesn't match the parent directory name → warn, load anyway
* Name exceeds 64 characters → warn, load anyway
* Description is missing or empty → skip the skill (a description is essential for disclosure), log the error
* YAML is completely unparseable → skip the skill, log the error

Record diagnostics so they can be surfaced to the user (in a debug command, log file, or UI), but don't block skill loading on cosmetic issues.

<Note>
  The [specification](/specification) defines strict constraints on the `name` field (matching the parent directory, character set, max length). The lenient approach above deliberately relaxes these to improve compatibility with skills authored for other clients.
</Note>

### What to store

At minimum, each skill record needs three fields:

| Field         | Description                          |
| ------------- | ------------------------------------ |
| `name`        | From frontmatter                     |
| `description` | From frontmatter                     |
| `location`    | Absolute path to the `SKILL.md` file |

Store these in an in-memory map keyed by `name` for fast lookup during activation.

You can also store the **body** (the markdown content after the frontmatter) at discovery time, or read it from `location` at activation time. Storing it makes activation faster; reading it at activation time uses less memory in aggregate and picks up changes to skill files between activations.

The skill's **base directory** (the parent directory of `location`) is needed later to resolve relative paths and enumerate bundled resources — derive it from `location` when needed.

## Step 3: Disclose available skills to the model

Tell the model what skills exist without loading their full content. This is [tier 1 of progressive disclosure](#the-core-principle-progressive-disclosure).

### Building the skill catalog

For each discovered skill, include `name`, `description`, and optionally `location` (the path to the `SKILL.md` file) in whatever structured format suits your stack — XML, JSON, or a bulleted list all work:

```xml  theme={null}
<available_skills>
  <skill>
    <name>pdf-processing</name>
    <description>Extract PDF text, fill forms, merge files. Use when handling PDFs.</description>
    <location>/home/user/.agents/skills/pdf-processing/SKILL.md</location>
  </skill>
  <skill>
    <name>data-analysis</name>
    <description>Analyze datasets, generate charts, and create summary reports.</description>
    <location>/home/user/project/.agents/skills/data-analysis/SKILL.md</location>
  </skill>
</available_skills>
```

The `location` field serves two purposes: it enables file-read activation (see [Step 4](#step-4-activate-skills)), and it gives the model a base path for resolving relative references in the skill body (like `scripts/evaluate.py`). If your dedicated activation tool provides the skill directory path in its result (see [Structured wrapping](#structured-wrapping) in Step 4), you can omit `location` from the catalog. Otherwise, include it.

Each skill adds roughly 50-100 tokens to the catalog. Even with dozens of skills installed, the catalog remains compact.

### Where to place the catalog

Two approaches are common:

**System prompt section**: Add the catalog as a labeled section in the system prompt, preceded by brief instructions on how to use skills. This is the simplest approach and works with any model that has access to a file-reading tool.

**Tool description**: Embed the catalog in the description of a dedicated skill-activation tool (see [Step 4](#step-4-activate-skills)). This keeps the system prompt clean and naturally couples discovery with activation.

Both work. System prompt placement is simpler and more broadly compatible; tool description embedding is cleaner when you have a dedicated activation tool.

### Behavioral instructions

Include a short instruction block alongside the catalog telling the model how and when to use skills. The wording depends on which activation mechanism you support (see [Step 4](#step-4-activate-skills)):

**If the model activates skills by reading files:**

```
The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, use your file-read tool to load
the SKILL.md at the listed location before proceeding.
When a skill references relative paths, resolve them against the skill's
directory (the parent of SKILL.md) and use absolute paths in tool calls.
```

**If the model activates skills via a dedicated tool:**

```
The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, call the activate_skill tool
with the skill's name to load its full instructions.
```

Keep these instructions concise. The goal is to tell the model that skills exist and how to load them — the skill content itself provides the detailed instructions once loaded.

### Filtering

Some skills should be excluded from the catalog. Common reasons:

* The user has disabled the skill in settings
* A permission system denies access to the skill
* The skill has opted out of model-driven activation (e.g., via a `disable-model-invocation` flag)

**Hide filtered skills entirely** from the catalog rather than listing them and blocking at activation time. This prevents the model from wasting turns attempting to load skills it can't use.

### When no skills are available

If no skills are discovered, omit the catalog and behavioral instructions entirely. Don't show an empty `<available_skills/>` block or register a skill tool with no valid options — this would confuse the model.

## Step 4: Activate skills

When the model or user selects a skill, deliver the full instructions into the conversation context. This is [tier 2 of progressive disclosure](#the-core-principle-progressive-disclosure).

### Model-driven activation

Most implementations rely on the model's own judgment as the activation mechanism, rather than implementing harness-side trigger matching or keyword detection. The model reads the catalog (from [Step 3](#step-3-disclose-available-skills-to-the-model)), decides a skill is relevant to the current task, and loads it.

Two implementation patterns:

**File-read activation**: The model calls its standard file-read tool with the `SKILL.md` path from the catalog. No special infrastructure needed — the agent's existing file-reading capability is sufficient. The model receives the file content as a tool result. This is the simplest approach when the model has file access.

**Dedicated tool activation**: Register a tool (e.g., `activate_skill`) that takes a skill name and returns the content. This is required when the model can't read files directly, and optional (but useful) even when it can. Advantages over raw file reads:

* Control what content is returned — e.g., strip YAML frontmatter or preserve it (see [What the model receives](#what-the-model-receives) below)
* Wrap content in structured tags for identification during context management
* List bundled resources (e.g., `references/*`) alongside the instructions
* Enforce permissions or prompt for user consent
* Track activation for analytics

<Tip>
  If you use a dedicated activation tool, constrain the `name` parameter to the set of valid skill names (e.g., as an enum in the tool schema). This prevents the model from hallucinating nonexistent skill names. If no skills are available, don't register the tool at all.
</Tip>

### User-explicit activation

Users should also be able to activate skills directly, without waiting for the model to decide. The most common pattern is a **slash command or mention syntax** (`/skill-name` or `$skill-name`) that the harness intercepts. The specific syntax is up to you — the key idea is that the harness handles the lookup and injection, so the model receives skill content without needing to take an activation action itself.

An autocomplete widget (listing available skills as the user types) can also make this discoverable.

### What the model receives

When a skill is activated, the model receives the skill's instructions. Two options for what exactly that content looks like:

**Full file**: The model sees the entire `SKILL.md` including YAML frontmatter. This is the natural outcome with file-read activation, where the model reads the raw file. It's also a valid choice for dedicated tools. The frontmatter may contain fields useful at activation time — for example, [`compatibility`](/specification#compatibility-field) notes environment requirements that could inform how the model executes the skill's instructions.

**Body only (frontmatter stripped)**: The harness parses and removes the YAML frontmatter, returning only the markdown instructions. Among existing implementations with dedicated activation tools, most take this approach — stripping the frontmatter after extracting `name` and `description` during discovery.

Both approaches work in practice.

### Structured wrapping

If you use a dedicated activation tool, consider wrapping skill content in identifying tags. For example:

```xml  theme={null}
<skill_content name="pdf-processing">
# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

[rest of SKILL.md body]

Skill directory: /home/user/.agents/skills/pdf-processing
Relative paths in this skill are relative to the skill directory.

<skill_resources>
  <file>scripts/extract.py</file>
  <file>scripts/merge.py</file>
  <file>references/pdf-spec-summary.md</file>
</skill_resources>
</skill_content>
```

This has practical benefits:

* The model can clearly distinguish skill instructions from other conversation content
* The harness can identify skill content during context compaction ([Step 5](#step-5-manage-skill-context-over-time))
* Bundled resources are surfaced to the model without being eagerly loaded

### Listing bundled resources

When a dedicated activation tool returns skill content, it can also enumerate supporting files (scripts, references, assets) in the skill directory — but it should **not eagerly read them**. The model loads specific files on demand using its file-read tools when the skill's instructions reference them.

For large skill directories, consider capping the listing and noting that it may be incomplete.

### Permission allowlisting

If your agent has a permission system that gates file access, **allowlist skill directories** so the model can read bundled resources without triggering user confirmation prompts. Without this, every reference to a bundled script or reference file results in a permission dialog, breaking the flow for skills that include resources beyond the `SKILL.md` itself.

## Step 5: Manage skill context over time

Once skill instructions are in the conversation context, keep them effective for the duration of the session.

### Protect skill content from context compaction

If your agent truncates or summarizes older messages when the context window fills up, **exempt skill content from pruning**. Skill instructions are durable behavioral guidance — losing them mid-conversation silently degrades the agent's performance without any visible error. The model continues operating but without the specialized instructions the skill provided.

Common approaches:

* Flag skill tool outputs as protected so the pruning algorithm skips them
* Use the [structured tags](#structured-wrapping) from Step 4 to identify skill content and preserve it during compaction

### Deduplicate activations

Consider tracking which skills have been activated in the current session. If the model (or user) attempts to load a skill that's already in context, you can skip the re-injection to avoid the same instructions appearing multiple times in the conversation.

### Subagent delegation (optional)

This is an advanced pattern only supported by some clients. Instead of injecting skill instructions into the main conversation, the skill is run in a **separate subagent session**. The subagent receives the skill instructions, performs the task, and returns a summary of its work to the main conversation.

This pattern is useful when a skill's workflow is complex enough to benefit from a dedicated, focused session.


Built with [Mintlify](https://mintlify.com).