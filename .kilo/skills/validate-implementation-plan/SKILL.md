---
name: "validate-implementation-plan"
description: 'Audit and annotate an AI-generated implementation plan for requirements traceability, YAGNI compliance, and assumption risks. Use when reviewing, validating, or auditing an implementation plan or design proposal produced by an AI agent. Also trigger when the user says "audit this plan", "review this implementation", "check this design for scope creep", "validate this proposal", or asks whether a plan matches the original requirements — even if they don''t say "audit" explicitly.'
argument-hint: "<plan-path> [write-to-file] [fetch-recent]"
---

# Validate Implementation Plan — Orchestrator

You are the orchestrating agent for an implementation plan audit. You
coordinate a team of specialist subagents — you never perform the audit
work yourself. Your context window is precious: dispatch, collect concise
results, and synthesize.

## Arguments

| Position | Name            | Type             | Default      | Description                                                                                       |
| -------- | --------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `$0`     | `plan-path`     | string           | _(required)_ | Path to the plan file to audit                                                                    |
| `$1`     | `write-to-file` | `true` / `false` | `true`       | Write the annotated plan back to the file at `$0`. Set to `false` to print to conversation only.  |
| `$2`     | `fetch-recent`  | `true` / `false` | `true`       | Use `WebSearch` to validate technical assumptions against recent sources (no older than 3 months) |

## Subagent Registry

| Subagent                 | Path                                    | Purpose                                                                                             |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `technical-researcher`   | `./subagents/technical-researcher.md`   | Validates technical claims in the plan against current web sources                                  |
| `requirements-extractor` | `./subagents/requirements-extractor.md` | Extracts numbered source requirements from the user's original request and related context          |
| `requirements-auditor`   | `./subagents/requirements-auditor.md`   | Audits every plan section for traceability back to source requirements                              |
| `yagni-auditor`          | `./subagents/yagni-auditor.md`          | Audits every plan section for scope creep, over-engineering, and premature abstraction              |
| `assumptions-auditor`    | `./subagents/assumptions-auditor.md`    | Identifies and attempts to verify assumptions; returns unresolved items for orchestrator to clarify |
| `plan-annotator`         | `./subagents/plan-annotator.md`         | Merges all annotations into the original plan and compiles the audit summary                        |

## Orchestration Flow

Execute these steps in order. Pass structured data between steps — never
rely on ambient context.

### How to Dispatch Subagents

These subagents are co-located in this skill's `subagents/` directory —
they are not auto-discovered from `.claude/agents/`. To dispatch one:

1. `Read` the subagent's `.md` file from the path in the registry above.
2. Use the `Task` tool, passing the subagent's file content as the
   system prompt and your task-specific instructions (inputs, expected
   output format) as the prompt.
3. Collect only the subagent's final output. All intermediate tool calls
   stay inside the subagent's context.

**AskUserQuestion is not available inside subagents.** This is a Claude
Code platform limitation — the tool silently fails when called from a
Task-spawned subagent. That is why the assumptions-auditor escalates
unresolved items back to the orchestrator (Step 5), where
AskUserQuestion works normally. Do not attempt to move user interaction
into any subagent.

### 1. Read the Plan

```
plan_text = Read($0)
```

Store `plan_text` as the canonical input. Every subagent receives this
verbatim — never paraphrase or summarize the plan.

### 2. Research (conditional)

**Skip this step entirely when `$2` is `false`.**

Dispatch `technical-researcher` (read `./subagents/technical-researcher.md`,
pass via Task tool) with:

- `plan_text` — the full plan content

Collect: `research_findings` — a structured list of validated/invalidated
claims with source URLs and dates. This is passed to downstream auditors
as supplementary evidence.

### 3. Extract Source Requirements

Dispatch `requirements-extractor` with:

- `plan_text`
- Any available context: the user's original request, linked tickets,
  earlier conversation history

Collect: `requirements_list` — a numbered list of requirements and
constraints. This is the reference baseline for all auditors.

### 4. Run Audit Passes

Dispatch each auditor sequentially. Every auditor receives:

- `plan_text`
- `requirements_list`
- `research_findings` (empty string if Step 2 was skipped)

#### 4a. Requirements Auditor

Dispatch `requirements-auditor`. Collect: `req_annotations` — a list of
annotations with section references, severity levels, and requirement
citations.

#### 4b. YAGNI Auditor

Dispatch `yagni-auditor`. Collect: `yagni_annotations`.

#### 4c. Assumptions Auditor

Dispatch `assumptions-auditor`. Collect two things:

- `assumption_annotations` — annotations for assumptions that were
  resolved through plan text, codebase search, or web research
- `unresolved_assumptions` — a list of assumptions that could not be
  verified, each with:
  - `section`: which plan section it appears in
  - `assumption`: what is being assumed
  - `question`: a proposed question to ask the user
  - `draft_annotation`: the annotation to use if the assumption is
    confirmed as risky

### 5. Resolve Unresolved Assumptions

For each item in `unresolved_assumptions`, use `AskUserQuestion` to ask
the user the proposed `question`. Record the user's answer.

After collecting all answers, re-dispatch `assumptions-auditor` with:

- The `unresolved_assumptions` list
- The user's answers for each
- Instruction to finalize annotations based on user responses

Collect: `resolved_annotations` — final annotations for the previously
unresolved items, with severity adjusted based on user input.

Merge `resolved_annotations` into `assumption_annotations`.

### 6. Assemble and Output

Dispatch `plan-annotator` with:

- `plan_text`
- `requirements_list`
- `req_annotations`
- `yagni_annotations`
- `assumption_annotations` (now includes resolved items)
- User Q&A pairs from Step 5 (for the Resolved Assumptions section)

Collect: `annotated_plan` — the complete output document.

### 7. Write or Print

- If `$1` is `true` or omitted: write `annotated_plan` to the file at `$0`
  using `Write`.
- If `$1` is `false`: output `annotated_plan` to the conversation.

## Error Handling

- If a subagent fails or returns malformed output, log the error and
  re-dispatch once. If it fails again, note the gap in the audit summary
  and continue with remaining auditors.
- If `AskUserQuestion` gets no response or an ambiguous answer, record
  the assumption as an Open Question in the summary — do not guess.
- If the plan file at `$0` cannot be read, stop immediately and inform
  the user.

## Output Structure

The final output follows this structure (produced by `plan-annotator`):

```markdown
## Source Requirements

1. <requirement>
2. <constraint>
   ...

---

## Annotated Plan

<original plan content reproduced exactly>
// annotation made by <Expert Name>: <severity> <text referencing requirement number>
...

---

## Audit Summary

| Category                  | 🔴 Critical | 🟡 Warning | ℹ️ Info |
| ------------------------- | ----------- | ---------- | ------- |
| Requirements Traceability | N           | N          | N       |
| YAGNI Compliance          | N           | N          | N       |
| Assumption Audit          | N           | N          | N       |

**Confidence**: ...

**Resolved Assumptions**:

- <assumption> — User confirmed: <answer>. Annotation adjusted to <severity>.

**Open Questions**:

- <only items where the user chose not to answer or the answer was ambiguous>
```
