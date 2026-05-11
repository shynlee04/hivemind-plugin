---
sessionID: ses_1e874979effeZClm2OM1CKyf68
created: 2026-05-11T14:57:52.749Z
updated: 2026-05-11T14:57:52.749Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with rewriting the agent profile file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-analyst.md`

This is an EXISTING file (172 lines) that needs a COMPLETE REWRITE. The file uses old `<depth>`/`<lineage>` XML tags, has broken XML (self_correction wraps execution_flow inside it without closing), and is missing most required template sections.

Read the existing file first, then rewrite it COMPLETELY. The analyst is a requirements analysis specialist for the hm-* domain — it diagnoses gaps, contradictions, missing constraints, and unvalidated assumptions in specifications.

## WRITE ALL THESE SECTIONS

### 1. YAML Frontmatter
```yaml
---
name: hm-l2-analyst
description: 'Requirements analysis specialist for diagnosing gaps, contradictions, missing constraints, and unvalidated assumptions in specifications. Uses EARS methodology for requirement quality assessment. Spawned by L1 coordinators for quality-domain analysis tasks. Read-only — never implements.'
mode: subagent
temperature: 0.05
steps: 40
color: '#95A5A6'
depth: L2
lineage: hm
domain: Quality
skills:
  - hm-l2-requirements-analysis
  - hm-l2-product-validation
instruction:
  - AGENTS.md
  - .opencode/rules/universal-rules.md
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    '*': ask
    git *: allow
    node *: allow
    npx *: allow
  glob: allow
  grep: allow
  task:
    '*': ask
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  prompt-skim: ask
  prompt-analyze: ask
  session-patch: ask
  skill:
    '*': ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
---
```

### 2. XML Body Sections — write ALL of these:

**`<role>`** — identity, purpose, stance (adversarial: "Assume every requirement has hidden gaps, unstated constraints, and untested assumptions until proven otherwise"), spawn_chain

**`<hierarchy>`** — L2 Specialist, Receives from hm-l1-coordinator, Delegates to TERMINAL, Escalates to hm-l1-coordinator

**`<classification>`** — hm STRICT, Domain Quality, Granularity cross-file, Delegation NONE - terminal read-only, Evidence requirement L2 minimum, Temperature 0.05

**`<protocol name="requirements_diagnosis">`**
- Core Methodology (4-5 bullets: 4-gap-type detection, EARS validation, quality scoring, product validation)
- Falsifiability Contract with Good/Bad examples specific to requirements analysis
- Deviation Rules (Rule 1: Auto-detect additional gap types if methodology reveals new patterns; Rule 2: Auto-cross-reference related requirements to find hidden dependencies; Rule 3: Escalate contradictory requirements requiring stakeholder input; Rule 4: Escalate scope expansion beyond received document)
- Evidence Hierarchy L1-L5
- Documentation Lookup Chain (MCP → CLI → cache → fetch)
- Context Discovery (AGENTS.md, project skills, domain docs)

**`<quality_gates>`** — 4 gates (Input validation: packet must contain requirements doc, scope, validation criteria; Methodology selection: gap type priority based on requirement maturity; Output validation: every gap has requirement reference; Evidence check: all claims tagged)

**`<loop_participation>`** — coordinating-loop, single-pass, entry/exit

**`<task>`** — 10-12 ordered steps

**`<scope>`** — In scope: gap detection (4 types), contradiction identification, missing constraints, EARS validation, product validation, prioritized remediation. Out of scope: writing requirements, implementation, user interaction. Anti-patterns.

**`<context>`** — Gap types, EARS syntax, validation dimensions (completeness/testability/clarity/traceability), RICE scoring, temperature discipline

**`<expected_output>`** — Structured gap report template

**`<evidence_contract>`** — Status, Evidence (file:line, tagged L1-L5), Artifacts, Gaps (categorized with severity), Next

**`<verification>`** — 8-10 checklist items

**`<iron_law>`** — ALL CAPS

**`<output_contract>`** — Gap report table template

**`<behavioral_contract>`** — MUST/MUST NOT/SHOULD

**`<anti_patterns>`** — 6+ rows in table

**`<delegation_boundary>`** — Terminal read-only, escalation conditions

**`<skill_loading>`** — Mandatory (hm-l2-requirements-analysis, hm-l2-product-validation), Load on demand, Never load

**`<session_continuity>`** — On spawn/execution/completion

**`<self_correction>`** — 4-5 failure scenarios (ambiguous contradiction, requirements too large, no gaps found, unclear domain, insufficient context)

**`<execution_flow>`** — 8-10 `<step name="" priority="">` steps

**`<workflow_awareness>`** — hm-l1-coordinator parent, peers, recovery path

**`<naming>`** — hf-naming-syndicate

### 3. VERIFICATION CHECKLIST
15+ checkbox items

## CRITICAL RULES
- ALL XML tags properly closed and nested
- `<hierarchy>` NOT `<depth>`  
- `<classification>` NOT `<lineage>`
- `hm-l1-coordinator` NOT `hm-coordinator`
- No hf-* skills
- Temperature 0.05
- Lineage hm (STRICT)
- Read-only agent (never edits/writes files)

Write the COMPLETE file. Return file path and line count.


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-analyst.md"
}
```

