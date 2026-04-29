---
name: hm-l2-spec-driven-authoring
description: >
  Use when turning a PRD, specification, contract, or acceptance brief into falsifiable requirements, acceptance criteria, verification methods, or implementation-compliance checks. Trigger for spec-locking and requirement extraction. NOT for exploratory coding, generic planning, manual-only QA, or RED/GREEN/REFACTOR execution after requirements are already locked.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.2.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Spec-Driven Authoring

## Overview

Turn written intent into a falsifiable implementation contract. This skill owns spec intake, ambiguity rejection, requirement extraction, acceptance-test derivation, and handoff evidence. It does **not** execute TDD cycles; once requirements and acceptance tests are locked, hand off to `hm-test-driven-execution`.

This package synthesizes three inspected third-party patterns:

| Source pattern | Adopt / adapt decision | Local transformation |
|---|---|---|
| `addyosmani/agent-skills@spec-driven-development` | Adopt the spec-first gate sequence and assumption-surfacing discipline; adapt away from implementation ownership. | Use Source Audit → Ambiguity Gate → Requirement Table → Acceptance Matrix → Handoff Packet. |
| `proffesor-for-testing/agentic-qe@qe-requirements-validation` | Adopt SMART validation, traceability matrix, and BDD coverage framing; adapt away from AQE-specific runtime calls. | Use portable requirement-to-test matrices with project-local commands only. |
| `kw12121212/auto-spec-driven@spec-driven-sync-specs` | Adapt drift/mapping metadata; defer `.spec-driven/` layout assumptions. | Preserve optional implementation/test mapping metadata without requiring any planning framework. |

## Entry Gate

Proceed only when at least one source artifact exists: PRD, SPEC, ADR, user story, API contract, acceptance brief, regulatory requirement, or explicit user request to create falsifiable requirements.

Before authoring:

1. Identify the source artifact and intended reader.
2. Run `prompt-skim` when available to detect length, URLs, missing files, and candidate scope.
3. Run `prompt-analyze` when available to detect contradiction, vagueness, missing actors, missing success criteria, and hidden scope.
4. If either tool is unavailable, perform the same checks manually and state that the tool was unavailable.
5. Block exploratory implementation requests that do not contain a stable requirement source.

## Boundary Rules

| Nearby workflow | Boundary |
|---|---|
| `hm-test-driven-execution` | Consumes locked requirements and executes RED/GREEN/REFACTOR. This skill derives the requirements and expected tests only. |
| `hm-planning-persistence` | Persists multi-session plan/progress state in `.hivemind/state/planning/<session-id>/`. This skill may produce requirements tables for that state but does not own task scheduling. |
| Generic planning | Plans may sequence work. This skill locks what must be true and how to verify it. |
| Exploratory coding/prototyping | Not enough source truth. Return blocked or ask for a spec before deriving REQ-* items. |

## Spec-Lock Workflow

Use this default sequence. Do not skip gates because the source is short.

```text
Source Audit → Ambiguity Gate → Requirement Table → Acceptance Test Matrix → Handoff Packet
```

### 1. Source Audit

Create an audit note with:

- Source path or pasted source title.
- Date/time of review.
- Stakeholders or actors named by the source.
- Explicit MUST/SHOULD/MAY statements.
- Implicit requirements inferred from security, data integrity, accessibility, or operational correctness.
- Out-of-scope statements.

Record provenance in the format from `templates/requirement-traceability-matrix.md`. Every later REQ row must point back to a source quote, source section, or blocked missing source.

### 2. Ambiguity Gate

Reject or clarify any candidate requirement containing unbounded terms such as “fast”, “good”, “simple”, “secure”, “robust”, “intuitive”, “soon”, or “scalable” unless the source gives measurable thresholds.

If ambiguity remains after one rewrite attempt, return a blocked handoff instead of inventing precision.

Use SMART screening from the requirements-validation source pattern:

| Check | Pass condition | Block condition |
|---|---|---|
| Specific | Actor, action, object, and context are named. | Actor or object is implied but not stated. |
| Measurable | Observable output, state, event, metric, or error exists. | Outcome is subjective or unverifiable. |
| Achievable | Project constraints do not contradict it. | Source requires unsupported platform/tooling without adapter. |
| Relevant | It maps to the requested product/workflow goal. | It is implementation detail with no user/system outcome. |
| Testable | At least one verification method exists. | No automated, inspection, or manual verification can prove it. |

### 3. Requirement Extraction

For every requirement, write:

```markdown
### REQ-<domain>-<nn>: <short name>
**Source:** <quote or source section>
**Condition:** <exactly one falsifiable statement>
**Acceptance Criteria:**
- Given <state>, when <action>, then <observable result>.
**Verification Method:** <test, inspection, command, manual validation, or blocked reason>
**Integration Notes:** <agents/commands/tools/hooks/runtime-state implications>
**Status:** draft | locked | blocked
```

### 4. Acceptance-Test Derivation

For each locked requirement, derive:

- Positive case: expected success path.
- Negative case: validation, authorization, error, or invalid-input path when applicable.
- Boundary case: empty, minimum, maximum, missing dependency, timeout, or platform edge.
- Integration case: cross-component behavior when more than one runtime surface is involved.

Write the matrix before handoff:

```markdown
| REQ ID | Source quote/path | Positive | Negative | Boundary | Integration | Verification command/method | Coverage state |
|---|---|---|---|---|---|---|
```

`Coverage state` is `mapped`, `gap`, `blocked`, or `not-applicable`. A `gap` is acceptable only when it is visible in the handoff packet.

### 5. Handoff

When requirements are locked, provide a handoff packet for `hm-test-driven-execution`:

```yaml
requirements:
  - id: REQ-...
    condition: ...
    acceptance_tests: [...]
red_phase_expectation: tests fail before implementation
verification_commands: [...]
blocked_items: [...]
traceability_matrix: path-or-inline-table
source_synthesis: references/source-synthesis.md decisions applied
```

If the next workflow is not HiveMind, replace skill names with plain role names: "requirements author", "test-first implementer", and "reviewer". Never require GSD, BMAD, OMO, Spec-kit, `.planning/`, or this repository path.

## Drift and Mapping Discipline

When asked to verify an existing implementation against a spec:

1. Inspect observable behavior, existing tests, and public interfaces before changing requirement text.
2. Classify each finding as `implemented`, `missing`, `drifted`, `orphan-test`, `ambiguous-source`, or `blocked-tooling`.
3. Preserve optional mapping metadata where the project has it; otherwise write a portable local mapping table.
4. Ask for confirmation before rewriting source requirements when implementation and source disagree without priority rules.

## 6-NON Defence Table

| Mode | Defence |
|---|---|
| NON-1 audit | Cite source section, path, or quote for every REQ-* item. |
| NON-2 context | State stacks-with and clashes-with relationships for `hm-test-driven-execution`, `hm-planning-persistence`, generic planning, and exploratory coding. |
| NON-3 cycles | Entry gate → ambiguity gate → extraction → acceptance derivation → blocked/locked handoff. Loop back only on specific ambiguity. |
| NON-4 hierarchy | Front-facing agents gather source intent; this skill authors contracts; TDD execution belongs to a separate skill. |
| NON-5 ecosystem eval | Eval bundle includes positive, negative, boundary, and `stacked_scenario` coverage with sibling skills. |
| NON-6 pattern | P2 domain-execution pattern: body carries the core workflow; references deepen mapping and test patterns only. |

## Integration Wiring

| Surface | Contract |
|---|---|
| Agents | Agents using this skill must state whether they are authoring requirements, verifying code against requirements, or deriving tests. Subagents receive source paths, output format, and blocked-state rules. |
| Commands | Commands must parse `$ARGUMENTS` into source artifact, output target, audience, and requested action. Quote paths and avoid interactive shell prompts. |
| Tools | Prefer `prompt-skim` for input shape and `prompt-analyze` for ambiguity. Use `session-patch` only for bounded artifact updates. Do not use unavailable tools as a reason to skip manual checks. |
| Plugin hooks | Hooks may suggest the skill or record source metadata. Hooks must report facts and must not silently rewrite requirements. |
| Runtime state | Persist requirement IDs, source artifact, verification commands, ambiguity blockers, and handoff status in the project’s available planning/progress mechanism. In Hivemind harness sessions, continuity/lifecycle records may store these facts; in arbitrary projects, use a local requirements table. |

## Bundled Resource Map

| Resource | Purpose |
|---|---|
| `references/source-synthesis.md` | Provenance, adopt/adapt/reject decisions, and portability constraints from inspected third-party sources. |
| `references/spec-to-req-mapping.md` | One-condition REQ extraction and SMART quality gates. |
| `references/acceptance-test-patterns.md` | BDD-style positive/negative/boundary/integration acceptance cases. |
| `templates/requirement-traceability-matrix.md` | Copyable portable evidence table for arbitrary projects. |
| `workflows/spec-lock-workflow.md` | End-to-end gate sequence with stop states. |
| `scripts/validate-rich-package.sh` | Static package validator for required source-backed resources. |

## Cross-Platform Adapters

| Environment | Adapter |
|---|---|
| OpenCode-native | Load through skill discovery; map unavailable Claude-style tools to available OpenCode tools; record tool absence explicitly. |
| Hivemind harness | Preserve delegation boundaries, continuity evidence, and runtime guardrails; do not ask front-facing agents to implement the requirements they author. |
| Arbitrary user project | Do not assume `.planning/`, GSD, Node, or this repository paths. Write portable requirement tables and verification methods matching the project’s language/framework. |

## Exit Criteria

The skill completes when every source requirement is one of:

- `locked` with one falsifiable condition, acceptance criteria, verification method, and integration note.
- `blocked` with the exact ambiguity, missing source, or impossible verification method.

Do not claim completion if any requirement remains vague, multi-condition, untestable, or unsupported by source evidence.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| The Vague Spec | “fast”, “robust”, “user-friendly”, or “secure” without threshold | Ask for metric or rewrite with measurable proxy. |
| The Multi-Req Row | One REQ contains “and” with separate behaviors | Split into separate REQ IDs. |
| The Test-Execution Grab | Starts writing implementation or running GREEN work | Stop and hand off to `hm-test-driven-execution`. |
| The File-Existence Claim | Says requirement quality is proved because files exist | Cite source, command, eval, or reviewer evidence. |
| The Local-Path Trap | Shipped guidance requires this repository’s absolute path | Replace with portable project-relative instructions. |

## Self-Correction

### When the source stays vague

Make one rewrite attempt using measurable proxies. If the source still lacks actors, thresholds, expected outputs, or verification method, return blocked with the missing fields.

### When requirements conflict

List both source statements, explain the conflict, and stop. Do not choose silently unless the user has provided priority rules.

### When acceptance tests cannot be derived

Mark the requirement `blocked`, name the missing observable behavior, and provide the smallest clarifying question.

### When handoff fails

Return a packet containing completed REQ IDs, blocked REQ IDs, verification methods, source paths, and the exact next skill or human decision needed.

## Reference Map

| File | When to Read |
|---|---|
| `references/spec-to-req-mapping.md` | When decomposing source language into one-condition REQ-* items. |
| `references/acceptance-test-patterns.md` | When deriving positive, negative, boundary, and integration acceptance tests. |
| `references/source-synthesis.md` | When auditing provenance, RICH compliance, or third-party pattern choices. |
| `templates/requirement-traceability-matrix.md` | When producing portable handoff evidence. |
| `workflows/spec-lock-workflow.md` | When executing the full Source Audit → Handoff sequence. |
