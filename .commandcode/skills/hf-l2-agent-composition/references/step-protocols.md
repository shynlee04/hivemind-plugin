# Step Protocols

Steps are the atomic unit of GSD agent execution. Every agent's `<execution_flow>` is a sequence of named steps. This document covers naming conventions, I/O contracts, sequencing patterns, and stuck detection.

## Step Naming Conventions

All 24 agents follow the same naming vocabulary. If your step name doesn't match one of these patterns, rename it.

| Prefix | Purpose | Input | Output |
|--------|---------|-------|--------|
| `load_*` | Context gathering | File paths, blocks | Extracted data in memory |
| `analyze_*` | Pattern recognition | Extracted data | Classifications, gaps |
| `generate_*` | Creation | Classifications | New files, tests, content |
| `run_*` | Execution | Generated artifacts | Pass/fail results |
| `verify_*` | Validation | Results + criteria | Status (PASS/FAIL) |
| `report` | Output formatting | All above | Structured return |

### Step Name Catalog (from 24 agents)

| Step Name | Agent | Purpose |
|-----------|-------|---------|
| `load_context` | nyquist, security, codebase-mapper | Load all files from `<files_to_read>` |
| `load_project_state` | executor | Load execution context via gsd-tools CLI |
| `load_plan` | executor | Read and parse PLAN.md |
| `record_start_time` | executor | Timestamp the execution |
| `determine_execution_pattern` | executor | Detect autonomous/checkpoint/continuation |
| `execute_tasks` | executor | Run each task with deviation rules |
| `analyze_gaps` | nyquist | Classify each gap by test type |
| `generate_tests` | nyquist | Write test files per gap |
| `run_and_verify` | nyquist | Execute tests, enter debug loop if failing |
| `debug_loop` | nyquist | Max 3 iterations on failing tests |
| `report` | nyquist | Return GAPS FILLED / PARTIAL / ESCALATE |
| `analyze_threats` | security | Classify threats by disposition |
| `verify_and_write` | security | Verify mitigations, write SECURITY.md |

## Step I/O Contracts

Every step has an implicit contract:

**Input sources (in priority order):**
1. `<files_to_read>` block in the spawn prompt
2. `<gaps>`, `<threat_model>`, `<doc_assignment>` XML blocks in prompt
3. Files created by previous steps in the same execution flow
4. Project files discovered via `<project_context>` chain

**Output destinations:**
1. Files written to disk (tests, docs, reports)
2. Structured return format (see [structured-returns.md](structured-returns.md))
3. In-memory data passed to next step

**Failure handling:**
- If input missing → report NEEDS_CONTEXT or BLOCKED
- If output can't be produced → ESCALATE with reason
- Never silently fail — always report status

## Common Step Sequences

### Research Agent Sequence
```
load_context → analyze → generate → report
```
Example: gsd-phase-researcher, gsd-advisor-researcher

### Execution Agent Sequence
```
load_context → load_plan → determine_pattern → execute_tasks → report
```
Example: gsd-executor

### Verification Agent Sequence
```
load_context → analyze → generate → run_and_verify → debug_loop → report
```
Example: gsd-nyquist-auditor

### Audit Agent Sequence
```
load_context → analyze → verify_and_write → report
```
Example: gsd-security-auditor

### Planning Agent Sequence
```
load_context → discovery → decompose → verify → report
```
Example: gsd-planner

## Priority Attributes

### `priority="first"`

Marks the step that MUST run before anything else. Typically `load_context`.

```xml
<step name="load_context" priority="first">
Read ALL files from `<files_to_read>`. Extract:
...
</step>
```

**Rule:** Only one `priority="first"` step per execution flow. If multiple steps need to run early, combine them or use ordering without the attribute.

### `priority="last"`

Marks the final step. Typically `report`.

```xml
<step name="report" priority="last">
Return structured result to orchestrator.
</step>
```

## The Analysis Paralysis Guard

From gsd-executor, this pattern prevents agents from reading forever without acting:

```xml
<analysis_paralysis_guard>
**During task execution, if you make 5+ consecutive Read/Grep/Glob calls
without any Edit/Write/Bash action:**

STOP. State in one sentence why you haven't written anything yet. Then either:
1. Write code (you have enough context), or
2. Report "blocked" with the specific missing information.

Do NOT continue reading. Analysis without action is a stuck signal.
</analysis_paralysis_guard>
```

**Composition rule:** Include this in any agent that reads implementation files. Without it, agents can loop indefinitely on "gathering context."

## Step Body Format

Step bodies follow this structure:

1. **Action statement** — what this step does (1 sentence)
2. **CLI commands** (if applicable) — bash blocks with error handling
3. **Extraction rules** — what to pull from the loaded context
4. **Decision points** — if/then logic for branching
5. **Output statement** — what this step produces

### Example (from gsd-nyquist-auditor)

```xml
<step name="analyze_gaps">
For each gap in `<gaps>`:

1. Read related implementation files
2. Identify observable behavior the requirement demands
3. Classify test type:

| Behavior | Test Type |
|----------|-----------|
| Pure function I/O | Unit |
| API endpoint | Integration |
| CLI command | Smoke |
| DB/fileship operation | Integration |

4. Map to test file path per project conventions

Action by gap type:
- `no_test_file` → Create test file
- `test_fails` → Diagnose and fix the test (not impl)
- `no_automated_command` → Determine command, update map
</step>
```

**Why this works:** Clear input (gaps), clear process (classify), clear output (test type + file path), clear action rules by gap type.

## Debug Loop Protocol

From gsd-nyquist-auditor — the standard pattern for agents that may need to retry:

```xml
<step name="debug_loop">
Max 3 iterations per failing test.

| Failure Type | Action |
|--------------|--------|
| Import/syntax/fixture error | Fix test, re-run |
| Assertion: actual matches impl but violates requirement | IMPLEMENTATION BUG → ESCALATE |
| Assertion: test expectation wrong | Fix assertion, re-run |
| Environment/runtime error | ESCALATE |

Track: { gap_id, iteration, error_type, action, result }

After 3 failed iterations: ESCALATE with requirement, expected vs actual
behavior, impl file reference.
</step>
```

**Composition rules:**
- Always cap iterations (default: 3)
- Classify failure types before acting
- ESCALATE on implementation bugs — never fix them
- Track all attempts for the report step

## Continuation Handling

From gsd-executor — the pattern for agents that may be resumed:

```xml
<continuation_handling>
If spawned as continuation agent (`<completed_tasks>` in prompt):

1. Verify previous commits exist: `git log --oneline -5`
2. DO NOT redo completed tasks
3. Start from resume point in prompt
4. Handle based on checkpoint type
5. If another checkpoint hit → return with ALL completed tasks
</continuation_handling>
```

**When to include:** Any agent that supports checkpoint/resume cycles. Not needed for fire-and-forget agents (doc writer, codebase mapper).
