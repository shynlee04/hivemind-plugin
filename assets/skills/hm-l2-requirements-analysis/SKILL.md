---
name: hm-l2-requirements-analysis
description: >
  Formal requirements diagnosis methodology for detecting gaps, contradictions, missing constraints, and unvalidated assumptions in existing requirements. Use when the user asks to "diagnose requirements", "analyze requirements gaps", "find missing constraints", "validate requirements", "check for contradictions in my spec", "discover real needs", "requirements gap analysis", "surface stakeholder needs", "EARS requirements", "constraint discovery", "are my requirements complete", or "validate my requirements document". NOT for initial brainstorming (use hm-brainstorm) or writing specifications from scratch (use hm-spec-driven-authoring). Routes completed gap reports to hm-spec-driven-authoring for spec-locking.
metadata:
  consumed-by:
    - "hm-l2-analyst"
    - "hm-l2-router"
  lineage-scope: "hm-*"
  access: "STRICT"
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Requirements Analysis

## Overview

Systematically diagnose existing requirements — not write them, not brainstorm them, not implement them. This skill owns gap detection, contradiction surfacing, constraint discovery, and assumption validation. It produces a structured gap report that feeds into spec-locking (`hm-spec-driven-authoring`).

**This skill answers four questions about every requirement:**
1. Is it **wrong** (contradicts another requirement or known constraint)?
2. Is it **missing** (absent scope, edge case, or constraint)?
3. Is it **vague** (unbounded terms, no measurable threshold)?
4. Is it **unvalidated** (stated as fact but actually an assumption)?

## Third-Party Source References

This skill synthesizes patterns from three inspected third-party skills:

| Source | Adopt/Adapt Decision | Local Transformation |
|---|---|---|
| `skillmd.ai/requirements-clarity` | Adopt the gap-analysis dimensions (Functional Scope, User Interaction, Technical Constraints, Business Value) and the 100-point clarity scoring rubric; adapt away from the YAGNI/KISS single-question framing. | Use Gap Type matrix with 4 diagnostic lenses. |
| `agent-skills.md/prompt-optimizer` | Adopt EARS syntax transformation rules and compound-requirement decomposition; adapt away from the prompt-optimization framing. | Use EARS as diagnostic tool — translate vague requirements INTO EARS to expose what's missing. |
| `forztf/open-skilled-sdd@openspec-proposal-creation` | Adopt the EARS SHALL/SHOULD/MAY hierarchy and scenario-format (Given/When/Then) validation; adapt away from proposal-creation workflow. | Use SHALL/SHOULD/MAY classification to detect underspecification. |

## Boundary Rules

| Nearby Workflow | Boundary |
|---|---|
| `hm-brainstorm` | Produces requirements briefs from ideation. This skill diagnoses gaps in those briefs after they exist. |
| `hm-spec-driven-authoring` | Consumes gap reports as input for spec-locking. This skill produces the gap report and hands off. |
| `hm-cross-cutting-change` | Receives constraint discovery findings when cross-cutting impacts are detected. |
| `hm-gate-orchestrator` | May route to this skill when gate validation reveals requirement insufficiency. Routes this skill's gap reports through the quality gate triad (lifecycle → spec → evidence). |
| Exploratory coding | Not enough source truth. Return blocked — "Cannot diagnose requirements without a requirements artifact to analyze." |

## Entry Gate

Proceed only when at least one of these exists:
- A PRD, spec, user story set, acceptance criteria document, or requirements brief
- An explicit user request to diagnose existing requirements
- A gate failure report from `hm-spec-driven-authoring` indicating requirement gaps

**Block if:** The user asks to "generate requirements from scratch" (route to `hm-brainstorm`) or "write a spec" (route to `hm-spec-driven-authoring`).

Before diagnosing:
1. Identify the source requirements artifact (file path, pasted document, or brief text).
2. Run `prompt-skim` if available to count requirements, detect URLs, and measure artifact size.
3. Run `prompt-analyze` if available to detect contradiction, vagueness, and missing scope signals.
4. If tools are unavailable, perform the same checks manually and note their unavailability.
5. Classify the artifact's maturity: **Incomplete** (fewer than 5 requirements or no acceptance criteria), **Draft** (5-20 requirements, partial criteria), or **Formal** (20+ requirements with structured criteria).

## The Four Diagnostic Lenses

Apply all four lenses to every requirement. Do not stop at one finding — a single requirement can be simultaneously vague AND missing its constraint chain.

### Lens 1: Gap Detection — "What's Missing?"

Four gap types to systematically identify:

| Gap Type | Detection Signal | Example |
|---|---|---|
| **Missing Scope** | Feature described but key actor, input, output, or boundary absent | "Users can export data" — what formats? from which screen? with what filters? |
| **Hidden Constraints** | Requirement assumes technical, business, or regulatory context not stated | "The system shall send notifications" — via email? push? SMS? with what latency? what retry policy? |
| **Contradictory Requirements** | Two requirements describe mutually exclusive states or behaviors | "REQ-1: Delete is permanent" + "REQ-2: Users can undo delete" — contradictory unless undo window is specified |
| **Unvalidated Assumptions** | Requirement uses undisputed language ("always", "never", "obviously") without evidence | "The database will obviously handle 10M rows" — no load profile, no index plan, no benchmark |

**Procedure:** For each requirement, create a gap entry in the diagnostic table (see template at `references/gap-detection-patterns.md`). Tag each gap with one of the four types.

For detailed detection heuristics and diagnostic templates, load `references/gap-detection-patterns.md`.

### Lens 2: EARS Precision Check — "Can This Be Made Falsifiable?"

Translate every requirement into EARS (Easy Approach to Requirements Syntax). If translation fails, the requirement is underspecified.

| EARS Pattern | Template | Use When |
|---|---|---|
| **Ubiquitous** | `The <system> SHALL <response>` | Always-true requirements without triggers |
| **Event-driven** | `WHEN <trigger>, the <system> SHALL <response>` | User actions, external events |
| **State-driven** | `WHILE <state>, the <system> SHALL <response>` | Ongoing conditions, modes |
| **Unwanted Behavior** | `IF <condition>, THEN the <system> SHALL <response>` | Error handling, edge cases, limits |
| **Optional Feature** | `WHERE <feature enabled>, the <system> SHALL <response>` | Toggle-able capabilities |
| **Complex** | `WHILE <state>, WHEN <trigger>, the <system> SHALL <response>` | Multipart conditions |

**Procedure:**
1. Take a vague requirement (e.g., "The system should be fast").
2. Attempt EARS translation: `WHEN user submits a search, the system SHALL return results` — what's missing? The "fast" threshold! You just detected a gap.
3. Record: **"Fast" is unbounded — need <N>ms at <P>th percentile for <operation>.**

For complete EARS syntax rules, keyword tables, and anti-patterns, load `references/ears-syntax-guide.md`.

### Lens 3: Constraint Discovery — "What Forces Shape This Requirement?"

Every requirement exists within constraints. Undiscovered constraints = implementation risk.

**Constraint dimensions to probe:**
- **Technical:** Platform, language, dependency, API surface, database, cache, queue
- **Operational:** Deployment model, observability, logging, monitoring, SLO/SLA
- **Security:** Auth model, data classification, encryption at rest/transit, audit trail
- **Regulatory:** GDPR, HIPAA, SOC2, PCI, data residency, retention policy
- **Performance:** Latency, throughput, concurrency, resource limits, cold start
- **Capacity:** Users, data volume, growth rate, peak load, quotas
- **Team:** Available skills, timeline, on-call rotation, bus factor
- **Cost:** Budget constraints, cloud provider lock-in, license implications

**Procedure:** For each requirement domain, ask: "What constraint would make this impossible to implement as stated?" Record missing constraints in the gap report.

### Lens 4: Needs vs. Wants — "What Does the Stakeholder Actually Need?"

Distinguish between stated asks and real needs. Use the Five Whys method:

**Procedure:**
1. Take the stated requirement: "We need a dashboard with 15 widgets."
2. Ask Why: "What decision does each widget inform?"
3. Ask Why: "What happens if that decision is delayed 1 hour? 1 day?"
4. Ask Why: "What's the cost of a wrong decision without this data?"
5. Ask Why: "Could a notification replace a widget for this use case?"
6. Classify: **Need** (missing it causes measurable harm) vs. **Want** (nice to have, no harm from absence).

For the full classification framework, the Five Whys method, and real-needs surfacing patterns, load `references/needs-vs-wants.md`.

## Main Workflow: Requirements Diagnosis

Follow this sequence. Complete the diagnostic table BEFORE writing the gap report.

```
Source Intake → Diagnostic Table → Gap Report → Handoff to hm-spec-driven-authoring
```

### Step 1: Source Intake

- [ ] Collect all requirements artifacts (files, pasted text, briefs).
- [ ] Run `prompt-skim` and `prompt-analyze` if available.
- [ ] Classify artifact maturity: Incomplete / Draft / Formal.
- [ ] Extract all individual requirement statements (numbered or bulleted).
- [ ] Record source provenance for each requirement.

### Step 2: Build Diagnostic Table

Create a table with these columns for each requirement:

| Column | Content |
|---|---|
| **Req ID** | Original identifier or generated `REQ-001`, `REQ-002`, ... |
| **Original Text** | Verbatim requirement text |
| **Gap Type** | Missing Scope / Hidden Constraints / Contradictory / Unvalidated Assumption / None |
| **EARS Translation** | Best-effort EARS form; `FAILED` if untranslatable |
| **Missing Constraints** | Any undiscovered constraint dimensions |
| **Need/Want** | Classification with brief justification |
| **Severity** | BLOCKER (cannot implement) / HIGH (likely rework) / MEDIUM (clarification needed) / LOW (cosmetic) |
| **Remediation** | Concrete action: "Add latency SLO", "Resolve conflict between REQ-3 and REQ-7", "Validate assumption with load test" |

### Step 3: Generate Gap Report

Produce a structured findings document with these sections:

```markdown
# Requirements Gap Analysis Report
## Artifact Analyzed
- Source: [file path or description]
- Maturity: Incomplete / Draft / Formal
- Requirements Count: N
- Date: YYYY-MM-DD

## Executive Summary
[1-2 paragraph summary of overall health]

## Severity Summary
| Severity | Count | % |
|---|---|---|
| BLOCKER | X | X% |
| HIGH | X | X% |
| MEDIUM | X | X% |
| LOW | X | X% |

## Findings By Gap Type
### Missing Scope (N findings)
### Hidden Constraints (N findings)
### Contradictory Requirements (N findings)
### Unvalidated Assumptions (N findings)

## Diagnostic Table
[Full table from Step 2]

## Needs vs. Wants Assessment
[Classification results with Five Whys trace]

## Remediation Plan
[Prioritized action items, each linked to a gap finding]

## Handoff Readiness
- [ ] All BLOCKER findings have concrete remediation
- [ ] Contradictions resolved or flagged for stakeholder decision
- [ ] Constraint gaps documented with acceptance criteria
- [ ] Needs/wants classified with business justification
```

### Step 4: Handoff

- If no BLOCKER findings: Hand off to `hm-spec-driven-authoring` for spec-locking.
- If BLOCKER findings exist: Present gap report to user with explicit questions for each blocker. Do not hand off until blockers are resolved or accepted as known risks.
- If artifact was Incomplete: Recommend routing to `hm-brainstorm` for requirement expansion before spec-locking.

## Gate System

| Gate | When | Criteria | Exit |
|---|---|---|---|
| **G1: Source** | Before any diagnosis | At least one requirements artifact exists | Block if none found |
| **G2: Diagnostic Table** | After lens application | Every requirement has gap type, EARS attempt, severity | Fix missing rows |
| **G3: Gap Report** | Before handoff | Report has all 7 required sections | Fix missing sections |
| **G4: Remediation** | Before handoff | Every BLOCKER has concrete remediation or accepted risk | Block if unaddressed |
| **G5: Needs Check** | Before classification | Every requirement classified as Need or Want with why-trace | Fix unclassified |

## Quick Reference

| Situation | Action |
|---|---|
| Requirements brief from `hm-brainstorm` | Apply all four lenses, produce gap report |
| Gate failure from `hm-spec-driven-authoring` | Focus on the rejected requirements only |
| "Check if my spec is complete" | Run all four lenses, emphasize missing scope |
| "Two requirements contradict each other" | Apply Lens 1 Contradictory type with conflict resolution template |
| "I'm not sure what stakeholders actually need" | Apply Lens 4 Five Whys on top 5 requirements |
| "Are there hidden constraints I'm missing?" | Apply Lens 3 across all 8 constraint dimensions |
| "Validate my requirements" | Run full diagnostic table, output gap report |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| **Diagnosing without source** — analyzing requirements that don't exist | No file, no pasted text, no brief | Block and route to `hm-brainstorm` |
| **Writing requirements instead of diagnosing** — generating new requirements during analysis | New REQ-* items appear in output | These belong in `hm-spec-driven-authoring`. Restrict output to gap findings. |
| **Accepting "fast" or "secure" without thresholds** — passing vague terms through | Unbounded adjectives in diagnostic table | Flag as BLOCKER gap — missing measurable threshold |
| **Skipping EARS translation** — analyzing without precision check | EARS column empty for requirements | Every requirement needs at least one EARS translation attempt |
| **Treating all gaps equally** — no severity classification | All findings marked "high" or no severity | Use BLOCKER/HIGH/MEDIUM/LOW rubric |
| **Handing off with unresolved blockers** — passing gap report to spec-locking before resolution | BLOCKER findings with empty remediation | Block G4 gate — return to user with explicit questions |
| **Mistaking syntax for semantics** — marking EARS-clean requirements as gap-free | Requirement uses EARS keywords but still vague | Validate EARS completeness: does it specify trigger, system, action, and measurable outcome? |

## Self-Correction

### When the diagnostic table is empty or sparse
**Detection:** Fewer than 50% of requirements have gap findings, or severity column is all "LOW" or empty.
**Recovery:** Re-apply each lens to the first 3 requirements. If they truly have no gaps, state: "These requirements appear well-specified because [specific reason]." If gaps exist, fill them. A truly gap-free requirement is rare — most have at least hidden constraints.

### When EARS translation fails for many requirements
**Detection:** More than 30% of requirements have "FAILED" in the EARS Translation column.
**Recovery:** The source artifact may be too vague for diagnosis. Route to `hm-brainstorm` for requirement expansion with a note: "This artifact needs more specificity before gap analysis can be effective. Key missing elements: [list]."

### When treating gap-free syntax as gap-free semantics
**Detection:** A requirement uses EARS keywords ("WHEN", "SHALL") but is still vague — e.g., "WHEN user submits form, the system SHALL process it quickly."
**Recovery:** The requirement has EARS form but not EARS substance. Mark as BLOCKER gap: "Missing measurable threshold for 'quickly'. Need: system SHALL process form submission within <N>ms at <P>th percentile."

### When handing off with unresolved BLOCKERs
**Detection:** Gap report has BLOCKER findings with empty remediation column or generic notes like "needs clarification."
**Recovery:** Block G4 gate. Return to user with explicit questions for each blocker: "To resolve BLOCKER-003 (missing latency SLO), I need to know: what is the maximum acceptable response time for [operation]? Current requirement says 'fast' which is not measurable."

## Files

| Resource | Purpose |
|---|---|
| `references/ears-syntax-guide.md` | Complete EARS syntax with templates, keyword table, and anti-patterns |
| `references/gap-detection-patterns.md` | Four gap types with detection heuristics, diagnostic templates, and examples |
| `references/needs-vs-wants.md` | Five Whys method, need vs. want classification, real-needs surfacing patterns |
