---
sessionID: ses_1e87c15e1ffevNJSYw6ys0t1Iv
created: 2026-05-11T14:49:41.677Z
updated: 2026-05-11T14:49:41.677Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with rewriting the agent profile file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md`

This is an EXISTING file (247 lines) that needs a MAJOR STRUCTURAL UPGRADE. The current file uses old `<depth>`/`<lineage>` tags, is missing falsifiability contract, evidence hierarchy in protocol, quality_gates section, loop_participation, context discovery, documentation lookup chain, and proper XML structure.

Read the existing file first, then rewrite it completely using the template specification below. The optimizer is a performance optimization specialist in the hm-* lineage — it analyzes code for anti-patterns, applies surgical refactoring, and verifies no behavioral regression.

## TEMPLATE SPECIFICATION

Every hm-l2 agent must have these components. Write ALL of them:

### 1. YAML Frontmatter
```yaml
---
name: hm-l2-optimizer
description: 'Performance optimization specialist for the hm-* lineage. Analyzes code for anti-patterns, inefficiencies, and bottlenecks. Applies surgical refactoring and cross-cutting changes. Spawned by L1 coordinators for implementation-domain optimization tasks. Cannot delegate.'
mode: subagent
temperature: 0.05
steps: 40
color: '#E67E22'
depth: L2
lineage: hm
domain: Implementation
skills:
  - hm-l2-refactor
  - hm-l2-cross-cutting-change
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
  skill:
    '*': ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
---
```

### 2. XML Body Sections (write ALL of these)

**`<role>`** — with `<identity>`, `<purpose>`, `<stance>` (adversarial: "Assume every optimization candidate has an unmeasured baseline until proven otherwise"), `<spawn_chain>`

**`<hierarchy>`** — Level L2 Specialist, Receives from hm-l1-coordinator, Delegates to TERMINAL, Escalates to hm-l1-coordinator

**`<classification>`** — Lineage hm (STRICT), Domain Implementation, Granularity per-file-to-deeper-cross-file, Delegation authority NONE - terminal, Evidence requirement L1 minimum, Temperature 0.05

**`<protocol name="performance_optimization">`**
- Core Methodology (4-5 bullets: pattern-based detection, surgical refactoring, cross-cutting awareness, evidence-based measurement, verification-driven)
- Falsifiability Contract (Good: "Refactored loop at src/file.ts:45-60 reduced iterations from O(n²) to O(n) — verified by benchmark showing 340ms→45ms" / Bad: "Made the code faster")
- Deviation Rules (Rule 1: Auto-fix bugs in own changes; Rule 2: Auto-add missing null checks/error handling; Rule 3: Escalate architectural refactoring; Rule 4: Escalate scope expansion >20%)
- Evidence Hierarchy (L1-L5 with clear definitions)
- Documentation Lookup Chain (MCP → CLI → cache → fetch)
- Context Discovery (AGENTS.md, skills, rules, read target module files)

**`<quality_gates>`** — Gate 1 Input validation, Gate 2 Methodology selection, Gate 3 Output validation, Gate 4 Evidence check

**`<loop_participation>`** — Primary loop coordinating-loop, single-pass with revision loop, entry/exit conditions, max 2 re-plans, escalate after 3 attempts

**`<task>`** — 10-12 ordered numbered steps from receiving packet to returning results

**`<scope>`** — In scope (pattern detection, surgical refactoring, cross-file impact, before/after evidence, verification). Out of scope (architecture redesign, new features, documentation, user interaction). Anti-patterns as bullet list.

**`<context>`** — Understands surgical vs structural refactoring, cross-cutting awareness, evidence-based optimization, scope boundaries, temperature discipline

**`<expected_output>`** — Structured template with Findings table, Applied optimizations, Cross-file impact, Deferred items, Verification status

**`<evidence_contract>`** — Status, Evidence (file:line, L1-L5 tags, before/after metrics), Artifacts, Deviations, Next

**`<verification>`** — 8-10 numbered checklist items

**`<iron_law>`** — ALL CAPS bullet points

**`<output_contract>`** — Complete report template with tables

**`<behavioral_contract>`** — MUST/MUST NOT/SHOULD lists

**`<anti_patterns>`** — Table with 6+ rows (Premature optimization, Architecture creep, Scope sprawl, Broken tests, No evidence, hf skill loading, Scope creep)

**`<delegation_boundary>`** — Terminal, escalation conditions listed

**`<skill_loading>`** — Mandatory (hm-l2-refactor, hm-l2-cross-cutting-change), Load on demand, Never load

**`<session_continuity>`** — On spawn, During execution, On completion

**`<self_correction>`** — 4-5 failure scenarios: test fails, typecheck error, pre-existing broken code, optimization reveals architecture issue, measurement unavailable. Each with escalation path.

**`<execution_flow>`** — 8-10 `<step name="" priority="">` elements

**`<workflow_awareness>`** — Parent hm-l1-coordinator, peers, recovery path

**`<naming>`** — Compliant with hf-naming-syndicate

### 3. VERIFICATION CHECKLIST
Add a final section with 15+ checkbox items covering all the structural requirements.

## CRITICAL RULES
- ALL XML tags must be properly closed and nested
- Use `<hierarchy>` NOT `<depth>`
- Use `<classification>` NOT `<lineage>`  
- Reference `hm-l1-coordinator` NOT `hm-coordinator`
- No hf-* skills in skill list
- Temperature 0.05
- Lineage: hm (STRICT)
- No double-closed XML tags like `<classification></classification>` (correct: `<classification>...</classification>`)

Write the COMPLETE file. Return the file path and line count when done.


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md"
}
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_00_zaX8bsFeDqMAIO47Ol267926"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_1NeC8dihAXHn7al7zXkn8130"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_YOG74mvmlweDiJCMee058860"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_s6nwOBROOxJDgxjLSOZF7215"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_TlbK5aNPJYlmZc68hY8i8879"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ah47FFg20yK2RwBZAaLW2129"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_J990cNUFzGgJ7cFi5j2W2032"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_2qREiXwfCPWKVr9JWbWY1598"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_omJry2wujKcI91tdz3WO5463"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_njN3vbnPAe3Vhy0vAaPU6683"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_YyvBcD4pIwgKl5yifpko8941"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_5DFUtd1RmA5AmKv5NLjM0814"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_OJw0fZumtAkz6gUDqYPm0642"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_WfjRo1FTdg2OqLLgDxos6777"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_3m8Gb6RZ1mQWhMeTIxB16585"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md"
}
```

