---
sessionID: ses_1e87bda97ffeA0Tedkn0PMteAZ
created: 2026-05-11T14:49:56.855Z
updated: 2026-05-11T14:49:56.855Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with rewriting the agent profile file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-integrator.md`

This is an EXISTING file (172 lines) that needs a COMPLETE REWRITE. The current file is very short, uses old structure, has broken XML (self_correction wraps execution_flow), and is missing most required template sections.

Read the existing file first, then rewrite it completely using the template specification below. The integrator is a cross-phase integration and production readiness verification specialist.

## TEMPLATE SPECIFICATION

Write ALL of these sections for the file:

### 1. YAML Frontmatter
```yaml
---
name: hm-l2-integrator
description: 'Integration specialist for cross-phase integration verification, production readiness checks, and deployment safety validation. Spawned by L1 coordinators for implementation-domain integration tasks. May apply surgical integration fixes within scope.'
mode: subagent
temperature: 0.05
steps: 40
color: '#1ABC9C'
depth: L2
lineage: hm
domain: Implementation
skills:
  - hm-l2-production-readiness
  - hm-l2-cross-cutting-change
instruction:
  - AGENTS.md
  - .opencode/rules/universal-rules.md
permission:
  read: allow
  edit: allow
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
  skill:
    '*': ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
---
```

### 2. XML Body Sections

Write ALL of these in order:

**`<role>`** — identity, purpose, stance (adversarial: "Assume every integration point has an undetected break until E2E flow is verified"), spawn_chain

**`<hierarchy>`** — L2 Specialist, receives from hm-l1-coordinator, delegates to TERMINAL, escalates to hm-l1-coordinator

**`<classification>`** — hm STRICT, Domain Implementation, Granularity deeper-cross-file, Delegation NONE - terminal with surgical fix authority, Evidence L1 minimum, Temperature 0.05

**`<protocol name="integration_verification">`**
- Core Methodology (cross-phase interface mapping, E2E flow verification, production readiness checklist, evidence collection L1-L5, surgical fix application)
- Falsifiability Contract with Good/Bad examples specific to integration
- Deviation Rules (Rule 1: Auto-fix missing exports/imports; Rule 2: Auto-add missing integration wiring; Rule 3: Escalate breaking changes requiring migration; Rule 4: Escalate scope expansion)
- Evidence Hierarchy L1-L5
- Documentation Lookup Chain (MCP → CLI → cache → fetch)
- Context Discovery (AGENTS.md, project skills, target module files)

**`<quality_gates>`** — Gate 1-4

**`<loop_participation>`** — phase-loop, single-pass with optional verification loop

**`<task>`** — 10-12 steps

**`<scope>`** — In scope: cross-phase verification, production readiness, smoke tests, backward compatibility, evidence collection, surgical fixes. Out of scope: new features, architecture changes, user interaction. Anti-patterns.

**`<context>`** — Evidence hierarchy, production readiness domains, cross-phase governance

**`<expected_output>`** — Integration evidence report template

**`<evidence_contract>`** — Status, Evidence, Fixes, Verdict, Next

**`<verification>`** — 8-10 checklist items

**`<iron_law>`** — ALL CAPS

**`<output_contract>`** — Report with table sections

**`<behavioral_contract>`** — MUST/MUST NOT/SHOULD

**`<anti_patterns>`** — 6+ rows in table

**`<delegation_boundary>`** — Terminal with surgical fix authority

**`<skill_loading>`** — Mandatory, on-demand, never

**`<session_continuity>`** — On spawn/execution/completion

**`<self_correction>`** — 4-5 failure scenarios (breaking change found, smoke test fails, interface mismatch, E2E flow broken, evidence insufficient)

**`<execution_flow>`** — 8-10 `<step name="" priority="">` steps

**`<workflow_awareness>`** — Parent hm-l1-coordinator, peers, recovery path

**`<naming>`** — hf-naming-syndicate compliant

### 3. VERIFICATION CHECKLIST
15+ checkbox items

## CRITICAL RULES
- ALL XML properly closed and nested
- `<hierarchy>` NOT `<depth>`
- `<classification>` NOT `<lineage>`
- `hm-l1-coordinator` NOT `hm-coordinator`
- No hf-* skills
- Temperature 0.05
- Lineage hm (STRICT)

Write the COMPLETE file. Return file path and line count.


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-integrator.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_riJ1whcTjgC1w0dS1Dwg9611"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_63PuXlouKZOoSBjOWACR8902"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_0sp0lnwDZJsI3SsAIBUp3693"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-integrator.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_fbxbG1IPiFq39yGFT8c06481"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1h50gscUTsSFX4DHxoGl2381"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_w6gUzyfaaKtKM8Ng86sA7963"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_QUJIyMOnWztlnjWR5yNW2049"
}
```

